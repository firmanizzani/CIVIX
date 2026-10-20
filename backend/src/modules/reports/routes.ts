import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportStatusLogs, comments, upvotes, users, regions } from '../../db/schema.js';
import { eq, desc, and, sql, notInArray } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import generateTicket from '../../utils/ticket.js';
import { isWithinDKIJakarta } from '../../utils/geo.js';
import { uploadImageToStorage } from '../uploads/service.js';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya gambar yang diperbolehkan'));
    }
  },
});

const router = Router();

// GET /me/reports - Laporan milik user yang login (warga)
router.get('/me/reports', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userReports = await db.query.reports.findMany({
      where: eq(reports.userId, req.user!.id),
      orderBy: [desc(reports.dibuatPada)],
      limit: 100,
      with: {
        photos: {
          columns: { id: true, url: true, jenis: true },
        },
        region: true,
      },
    });

    res.json(userReports);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan warga' });
  }
});

// GET /reports - Public feed (only non-rejected & non-duplicate)
router.get('/', async (req, res: Response) => {
  try {
    const { kategori, status, regionId, limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions: any[] = [notInArray(reports.status, ['ditolak', 'duplikat'])];

    if (kategori) conditions.push(eq(reports.kategori, kategori as any));
    if (status) conditions.push(eq(reports.status, status as any));
    if (regionId) conditions.push(eq(reports.regionId, String(regionId)));

    const result = await db.query.reports.findMany({
      where: and(...conditions),
      limit: Number(limit),
      offset,
      orderBy: [desc(reports.dibuatPada)],
      with: {
        photos: true,
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

// GET /reports/map - Titik peta (merah, kuning, hijau 7 hari)
router.get('/map', async (_req, res: Response) => {
  try {
    const activeReports = await db.query.reports.findMany({
      where: and(
        notInArray(reports.status, ['ditolak', 'duplikat']),
        sql`(${reports.status} != 'selesai' OR (${reports.status} = 'selesai' AND ${reports.selesaiPada} >= NOW() - INTERVAL '7 days'))`
      ),
      columns: {
        id: true,
        kodeTiket: true,
        judul: true,
        namaJalan: true,
        kategori: true,
        status: true,
        latitude: true,
        longitude: true,
        dibuatPada: true,
      },
      with: {
        photos: { limit: 1 },
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
        photos: true,
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

    // Insert Report
    const [newReport] = await db
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
    for (const file of files) {
      const url = await uploadImageToStorage(file.buffer, file.originalname, file.mimetype);
      await db.insert(reportPhotos).values({
        reportId: newReport.id,
        url,
        jenis: 'awal',
      });
    }

    // Status Log awal
    await db.insert(reportStatusLogs).values({
      reportId: newReport.id,
      diubahOleh: req.user!.id,
      status: 'diterima',
      catatan: 'Laporan berhasil dibuat dan masuk antrean verifikasi',
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
        photos: true,
        statusLogs: { orderBy: [desc(reportStatusLogs.waktu)] },
        region: true,
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
