import { getReportWorkspace } from './workspace.js';
import { Router, Response } from 'express';
import { readPlatformSettings } from '../admin/settings.js';
import { z } from 'zod';
import multer from 'multer';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportStatusLogs, comments, upvotes, users, regions } from '../../db/schema.js';
import { asc, eq, desc, and, sql, notInArray, gte, lte } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import generateTicket from '../../utils/ticket.js';
import { isWithinDKIJakarta } from '../../utils/geo.js';
import { buildReportPhotoPath, uploadImageToStorage } from '../uploads/service.js';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Gunakan foto JPG, PNG, WebP, atau GIF.'), { statusCode: 400 }));
    }
  },
});

const router = Router();

router.get('/regions', async (_req, res: Response) => {
  try { res.json(await db.select().from(regions).orderBy(asc(regions.nama))); }
  catch { res.status(500).json({ error: 'Gagal memuat wilayah Jakarta' }); }
});

// GET /me/reports - Laporan milik user yang login (warga)
router.get('/me/reports', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.query.view === 'workspace') return res.json(await getReportWorkspace(req.query, eq(reports.userId, req.user!.id)));
    const userReports = await db.query.reports.findMany({
      where: eq(reports.userId, req.user!.id),
      orderBy: [desc(reports.dibuatPada)],
      limit: 100,
      with: {
        photos: {
          orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)],
          columns: { id: true, url: true, jenis: true },
        },
        region: true,
      },
    });

    res.json(userReports);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Filter laporan tidak valid' });
    res.status(500).json({ error: 'Gagal mengambil laporan warga' });
  }
});

// GET /reports - Public feed (only non-rejected & non-duplicate)
router.get('/', async (req, res: Response) => {
  try {
    const { kategori, status, regionId, periode, startDate, endDate, limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: any[] = [notInArray(reports.status, ['ditolak', 'duplikat'])];

    if (kategori) conditions.push(eq(reports.kategori, kategori as any));
    if (status) conditions.push(eq(reports.status, status as any));
    if (regionId) conditions.push(eq(reports.regionId, String(regionId)));

    if (periode === '7d') {
      conditions.push(gte(reports.dibuatPada, sql`NOW() - INTERVAL '7 days'`));
    } else if (periode === '30d') {
      conditions.push(gte(reports.dibuatPada, sql`NOW() - INTERVAL '30 days'`));
    } else if (periode === 'month') {
      conditions.push(gte(reports.dibuatPada, sql`date_trunc('month', NOW())`));
    } else if (periode === 'custom') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const isStartValid = typeof startDate === 'string' && dateRegex.test(startDate);
      const isEndValid = typeof endDate === 'string' && dateRegex.test(endDate);

      if (!isStartValid && !isEndValid) {
        return res.status(400).json({ error: 'Tanggal awal atau tanggal akhir tidak valid' });
      }

      if (isStartValid && isEndValid && startDate > endDate) {
        return res.status(400).json({ error: 'Tanggal awal tidak boleh melebihi tanggal akhir' });
      }

      if (isStartValid) {
        conditions.push(gte(reports.dibuatPada, sql`${startDate}::date`));
      }

      if (isEndValid) {
        conditions.push(lte(reports.dibuatPada, sql`(${endDate}::date + INTERVAL '1 day') - INTERVAL '1 second'`));
      }
    }

    const result = await db.query.reports.findMany({
      where: and(...conditions),
      limit: Number(limit),
      offset,
      orderBy: [desc(reports.dibuatPada)],
      with: {
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true,
        upvotes: true,
        comments: { with: { user: { columns: { nama: true } } } },
      },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat laporan' });
  }
});

router.get('/map-settings', async (_req, res: Response) => {
  try { res.json(await readPlatformSettings()); }
  catch { res.status(500).json({ error: 'Gagal memuat pengaturan peta' }); }
});

// Completed reports remain visible for the duration saved by an administrator.
router.get('/map', async (_req, res: Response) => {
  try {
    const { completedMapDays } = await readPlatformSettings();
    const activeReports = await db.query.reports.findMany({
      where: and(
        notInArray(reports.status, ['ditolak', 'duplikat']),
        sql`(${reports.status} != 'selesai' OR (${reports.status} = 'selesai' AND ${reports.selesaiPada} >= NOW() - (${completedMapDays} * INTERVAL '1 day')))`
      ),
      columns: {
        id: true,
        kodeTiket: true,
        judul: true,
        namaJalan: true,
        regionId: true,
        kategori: true,
        status: true,
        latitude: true,
        longitude: true,
        dibuatPada: true,
      },
      with: {
        photos: { limit: 1, orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true,
      },
    });

    res.json(activeReports);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data peta' });
  }
});

// GET /reports/track/:kodeTiket - Tracking publik
router.get('/track/:kodeTiket', async (req, res: Response) => {
  try {
    const report = await db.query.reports.findFirst({
      where: eq(reports.kodeTiket, req.params.kodeTiket),
      with: {
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        statusLogs: {
          orderBy: [desc(reportStatusLogs.waktu)],
          with: { user: { columns: { nama: true, peran: true } } },
        },
        region: true,
      },
    });

    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Gagal melacak laporan' });
  }
});

// POST /reports - Buat laporan (Warga)
router.post('/', authMiddleware, upload.array('photos', 3), async (req: AuthRequest, res: Response) => {
  try {
    const { judul, deskripsi, namaJalan, kategori, latitude, longitude, anonim, regionId } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!judul?.trim() || !deskripsi?.trim() || !namaJalan?.trim() || !kategori || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Judul, deskripsi, nama jalan, kategori, dan lokasi wajib diisi dengan benar' });
    }

    if (namaJalan.trim().length > 200) {
      return res.status(400).json({ error: 'Nama jalan maksimal 200 karakter' });
    }
    if (!z.enum(['jalan_rusak', 'drainase', 'sampah', 'penerangan', 'fasilitas_umum', 'lainnya']).safeParse(kategori).success || judul.trim().length > 150 || deskripsi.trim().length > 5000) {
      return res.status(400).json({ error: 'Kategori tidak valid, judul maksimal 150 karakter, dan deskripsi maksimal 5.000 karakter.' });
    }
    if (regionId && !await db.query.regions.findFirst({ where: eq(regions.id, String(regionId)) })) return res.status(400).json({ error: 'Wilayah laporan tidak ditemukan' });

    if (!isWithinDKIJakarta(lat, lng)) {
      return res.status(400).json({
        error: 'Lokasi di luar batas DKI Jakarta. CIVIX hanya menerima laporan dalam wilayah DKI Jakarta.',
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Minimal sertakan 1 foto bukti' });
    }

    const kodeTiket = generateTicket();

    // Commit the report, evidence and first status together.
    const newReport = await db.transaction(async tx => {
    const [created] = await tx
      .insert(reports)
      .values({
        kodeTiket,
        userId: req.user!.id,
        regionId: regionId ? String(regionId) : null,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        namaJalan: namaJalan.trim(),
        kategori,
        latitude: lat.toString(),
        longitude: lng.toString(),
        anonim: anonim === 'true' || anonim === true,
        status: 'diterima',
      })
      .returning();

    // Upload & Save Photos
    for (const [index, file] of files.entries()) {
      const storagePath = buildReportPhotoPath(kodeTiket, 'awal', index + 1, file.mimetype);
      const url = await uploadImageToStorage(file.buffer, storagePath, file.mimetype);
      await tx.insert(reportPhotos).values({
        reportId: created.id,
        url,
        jenis: 'awal',
      });
    }

    // Status Log awal
    await tx.insert(reportStatusLogs).values({
      reportId: created.id,
      diubahOleh: req.user!.id,
      status: 'diterima',
      catatan: 'Laporan berhasil dibuat dan masuk antrean verifikasi',
    });
    return created;
    });

    res.status(201).json(newReport);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Gagal membuat laporan' });
  }
});

// GET /reports/:id - Detail publik
router.get('/:id', async (req, res: Response) => {
  try {
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, req.params.id),
      with: {
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        statusLogs: { orderBy: [desc(reportStatusLogs.waktu)] },
        region: true,
        assignedAgency: { columns: { id: true, nama: true } },
        upvotes: true,
        comments: {
          orderBy: [desc(comments.waktu)],
          with: { user: { columns: { nama: true } } },
        },
      },
    });

    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    // Sembunyikan user pelapor jika anonim
    if (report.anonim) {
      (report as any).userId = null;
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail' });
  }
});

// POST /reports/:id/upvote - Upvote laporan
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await db.query.upvotes.findFirst({
      where: and(eq(upvotes.reportId, req.params.id), eq(upvotes.userId, req.user!.id)),
    });

    if (existing) {
      await db.delete(upvotes).where(and(eq(upvotes.reportId, req.params.id), eq(upvotes.userId, req.user!.id)));
      return res.json({ upvoted: false });
    }

    await db.insert(upvotes).values({ reportId: req.params.id, userId: req.user!.id });
    res.json({ upvoted: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memberikan dukungan' });
  }
});

// POST /reports/:id/comments - Berikan komentar
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { isi } = req.body;
    if (!isi || isi.trim().length === 0) return res.status(400).json({ error: 'Komentar tidak boleh kosong' });

    const [comment] = await db
      .insert(comments)
      .values({ reportId: req.params.id, userId: req.user!.id, isi })
      .returning();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah komentar' });
  }
});

export default router;
