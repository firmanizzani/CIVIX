import { getReportWorkspace } from './workspace.js';
import { Router, Response } from 'express';
import { readPlatformSettings } from '../admin/settings.js';
import { z } from 'zod';
import multer from 'multer';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportEvidenceChecks, reportStatusLogs, comments, upvotes, users, regions } from '../../db/schema.js';
import { asc, eq, desc, and, sql, notInArray, gte, lte, ilike } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import { reportStatusHistory } from './status.js';
import { reportCostSummary, reportCostDetail } from './costs.js';
import generateTicket from '../../utils/ticket.js';
import { jakartaRegionsAt } from '../../utils/geo.js';
import { buildReportPhotoPath, removeReportPhotosFromStorage, uploadImageToStorage } from '../uploads/service.js';
import { coordinatesSchema, findNearbyReports, NEARBY_RADIUS_METERS, PHOTO_MATCH_RADIUS_METERS, prepareReportPhoto, reportCategory } from './evidence.js';

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
        cost: reportCostSummary,
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
    const search = z.string().trim().max(150, 'Pencarian judul maksimal 150 karakter.').parse(req.query.search ?? '');
    const { kategori, status, regionId, periode, startDate, endDate, sort, view, limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: any[] = [notInArray(reports.status, ['ditolak', 'duplikat'])];
    if (search) conditions.push(ilike(reports.judul, `%${search.replace(/[\\%_]/g, '\\$&')}%`));

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

    const listQuery = {
      where: and(...conditions),
      limit: Number(limit),
      offset,
      orderBy: sort === 'oldest' ? [asc(reports.dibuatPada), asc(reports.id)] : [desc(reports.dibuatPada), asc(reports.id)],
    };
    const photoOrder = [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)];

    if (view === 'cards') {
      const cards = await db.query.reports.findMany({
        ...listQuery,
        columns: { id: true, judul: true, kategori: true, kodeTiket: true, namaJalan: true, dibuatPada: true, status: true },
        with: { cost: reportCostSummary, photos: { columns: { url: true }, orderBy: photoOrder, limit: 1 } },
      });
      return res.json(cards);
    }

    const result = await db.query.reports.findMany({
      ...listQuery,
      with: {
        photos: { orderBy: photoOrder },
        region: true,
        upvotes: true,
        cost: reportCostSummary,
        comments: { with: { user: { columns: { nama: true } } } },
      },
    });

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0]?.message || 'Pencarian judul tidak valid.' });
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
        cost: reportCostSummary,
        photos: { limit: 1, orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true,
      },
    });

    res.json(activeReports);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data peta' });
  }
});

const locationCheckSchema = coordinatesSchema.extend({ kategori: reportCategory.optional() });

router.get('/location-check', authMiddleware, requireRole(['warga']), async (req, res: Response) => {
  const parsed = locationCheckSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Koordinat atau kategori laporan tidak valid' });

  try {
    const { latitude, longitude, kategori } = parsed.data;
    const regionNames = jakartaRegionsAt(latitude, longitude);
    const nearby = kategori && regionNames.length ? await findNearbyReports(latitude, longitude, kategori) : [];
    res.json({ regionNames, nearby, nearbyRadiusMeters: NEARBY_RADIUS_METERS, photoMatchRadiusMeters: PHOTO_MATCH_RADIUS_METERS });
  } catch {
    res.status(500).json({ error: 'Gagal memeriksa lokasi laporan' });
  }
});

// POST /reports - Buat laporan (Warga)
router.post('/', authMiddleware, requireRole(['warga']), upload.array('photos', 3), async (req: AuthRequest, res: Response) => {
  const uploadedPaths: string[] = [];
  let commitStarted = false;
  try {
    const { judul, deskripsi, namaJalan, kategori, anonim, regionId } = req.body;
    const parsedLocation = coordinatesSchema.safeParse(req.body);

    if (![judul, deskripsi, namaJalan].every(value => typeof value === 'string' && value.trim()) || !kategori || !parsedLocation.success) {
      return res.status(400).json({ error: 'Judul, deskripsi, nama jalan, kategori, dan lokasi wajib diisi dengan benar' });
    }
    const { latitude: lat, longitude: lng } = parsedLocation.data;

    if (namaJalan.trim().length > 200) {
      return res.status(400).json({ error: 'Nama jalan maksimal 200 karakter' });
    }
    if (!reportCategory.safeParse(kategori).success || judul.trim().length > 150 || deskripsi.trim().length > 5000) {
      return res.status(400).json({ error: 'Kategori tidak valid, judul maksimal 150 karakter, dan deskripsi maksimal 5.000 karakter.' });
    }
    const regionNames = jakartaRegionsAt(lat, lng);
    if (!regionNames.length) {
      return res.status(400).json({
        error: 'Lokasi di luar batas DKI Jakarta. CIVIX hanya menerima laporan dalam wilayah DKI Jakarta.',
      });
    }
    if (regionId) {
      const region = await db.query.regions.findFirst({ where: eq(regions.id, String(regionId)) });
      if (!region) return res.status(400).json({ error: 'Wilayah laporan tidak ditemukan' });
      if (!regionNames.includes(region.nama)) {
        return res.status(400).json({ error: `Titik laporan berada di ${regionNames.join(' atau ')}. Sesuaikan wilayah administrasi atau titik di peta.` });
      }
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Minimal sertakan 1 foto bukti' });
    }

    const preparedPhotos: Awaited<ReturnType<typeof prepareReportPhoto>>[] = [];
    for (const [index, file] of files.entries()) {
      try {
        preparedPhotos.push(await prepareReportPhoto(file, lat, lng));
      } catch {
        return res.status(400).json({ error: `Foto ${index + 1} tidak dapat diproses. Pilih foto lain atau gunakan ukuran gambar yang lebih kecil.` });
      }
    }
    const nearby = await findNearbyReports(lat, lng, kategori);
    const kodeTiket = generateTicket();

    // Commit the report, evidence and first status together.
    const newReport = await db.transaction(async tx => {
      const [created] = await tx.insert(reports).values({
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
      }).returning();

      const photoChecks: typeof reportEvidenceChecks.$inferInsert.photos = [];
      for (const [index, file] of preparedPhotos.entries()) {
        const storagePath = buildReportPhotoPath(kodeTiket, 'awal', index + 1, file.mimetype);
        const url = await uploadImageToStorage(file.buffer, storagePath, file.mimetype);
        uploadedPaths.push(storagePath);
        const [photo] = await tx.insert(reportPhotos).values({
          reportId: created.id, url, jenis: 'awal',
        }).returning({ id: reportPhotos.id });
        photoChecks.push({ photoId: photo.id, ...file.check });
      }
      await tx.insert(reportEvidenceChecks).values({ reportId: created.id, photos: photoChecks, nearby });

      await tx.insert(reportStatusLogs).values({
        reportId: created.id,
        diubahOleh: req.user!.id,
        status: 'diterima',
        catatan: 'Laporan berhasil dibuat dan masuk antrean verifikasi',
      });
      commitStarted = true;
      return created;
    });

    res.status(201).json(newReport);
  } catch (err) {
    if (!commitStarted) {
      await removeReportPhotosFromStorage(uploadedPaths).catch(() => console.error('Gagal membersihkan unggahan laporan'));
    }
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat laporan' });
  }
});

// GET /reports/:id - Detail publik
router.get('/:id', async (req, res: Response) => {
  try {
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, req.params.id),
      with: {
        user: { columns: { nama: true } },
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        statusLogs: reportStatusHistory,
        cost: reportCostDetail,
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

    res.json(report.anonim ? { ...report, userId: null, user: null } : report);
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
