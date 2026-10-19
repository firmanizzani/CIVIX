import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { reports, reportStatusLogs } from '../../db/schema.js';
import { eq, desc, count } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

// GET /admin/dashboard - Ringkasan admin
router.get('/dashboard', async (_req, res: Response) => {
  try {
    const totalReports = await db.select({ count: count() }).from(reports);
    const pendingReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'diterima'));
    const verifiedReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'diverifikasi'));
    const inProgressReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'dikerjakan'));
    const completedReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'selesai'));

    res.json({
      total: totalReports[0]?.count || 0,
      pending: pendingReports[0]?.count || 0,
      verified: verifiedReports[0]?.count || 0,
      inProgress: inProgressReports[0]?.count || 0,
      completed: completedReports[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat statistik admin' });
  }
});

// GET /admin/reports - Semua laporan untuk admin
router.get('/reports', async (req, res: Response) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition = undefined;
    if (status) {
      whereCondition = eq(reports.status, status as any);
    }

    const allReports = await db.query.reports.findMany({
      where: whereCondition,
      limit: Number(limit),
      offset,
      orderBy: [desc(reports.dibuatPada)],
      with: {
        photos: true,
        region: true,
        user: { columns: { nama: true, email: true } },
      },
    });

    res.json(allReports);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar laporan admin' });
  }
});

// POST /admin/reports/:id/verify - Verifikasi laporan
router.post('/reports/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { catatan } = req.body;
    await db.update(reports).set({ status: 'diverifikasi' }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: 'diverifikasi',
      catatan: catatan || 'Laporan telah diverifikasi oleh administrator',
    });

    res.json({ success: true, message: 'Laporan diverifikasi' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memverifikasi laporan' });
  }
});

// POST /admin/reports/:id/reject - Tolak laporan
router.post('/reports/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { alasan } = req.body;
    if (!alasan) return res.status(400).json({ error: 'Alasan penolakan wajib diisi' });

    await db.update(reports).set({ status: 'ditolak' }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: 'ditolak',
      catatan: alasan,
    });

    res.json({ success: true, message: 'Laporan ditolak' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menolak laporan' });
  }
});

// POST /admin/reports/:id/duplicate - Tandai duplikat
router.post('/reports/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const { targetTicket } = req.body;
    const catatan = targetTicket ? `Duplikat dari tiket ${targetTicket}` : 'Laporan terindikasi duplikat';

    await db.update(reports).set({ status: 'duplikat' }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: 'duplikat',
      catatan,
    });

    res.json({ success: true, message: 'Laporan ditandai duplikat' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menandai duplikat' });
  }
});

// POST /admin/reports/:id/assign - Tugaskan ke instansi
router.post('/reports/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { instansiNama, catatan } = req.body;
    await db.update(reports).set({ status: 'ditugaskan' }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: 'ditugaskan',
      catatan: catatan || `Ditugaskan ke instansi: ${instansiNama || 'Dinas Terkait'}`,
    });

    res.json({ success: true, message: 'Laporan berhasil ditugaskan' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menugaskan laporan' });
  }
});

export default router;
