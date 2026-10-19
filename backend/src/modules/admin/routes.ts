import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { reports, reportStatusLogs, agencies, reportAssignments } from '../../db/schema.js';
import { eq, desc, count, asc } from 'drizzle-orm';
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

// GET /admin/agencies - Daftar instansi untuk dropdown penugasan
router.get('/agencies', async (_req, res: Response) => {
  try {
    const list = await db.query.agencies.findMany({ orderBy: [asc(agencies.nama)] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar instansi' });
  }
});

// POST /admin/reports/:id/assign - Tugaskan ke instansi
router.post('/reports/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, catatan } = req.body;
    if (!agencyId) return res.status(400).json({ error: 'Pilih instansi penerima tugas' });

    const agency = await db.query.agencies.findFirst({ where: eq(agencies.id, agencyId) });
    if (!agency) return res.status(404).json({ error: 'Instansi tidak ditemukan' });

    const report = await db.query.reports.findFirst({ where: eq(reports.id, req.params.id) });
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    if (report.status !== 'diverifikasi') {
      return res.status(400).json({ error: `Hanya laporan berstatus terverifikasi yang dapat ditugaskan (status saat ini: ${report.status})` });
    }

    const assignment = await db
      .insert(reportAssignments)
      .values({
        reportId: report.id,
        agencyId: agency.id,
        assignedBy: req.user!.id,
        catatan: catatan || null,
      })
      .returning();

    await db
      .update(reports)
      .set({ status: 'ditugaskan', assignedAgencyId: agency.id })
      .where(eq(reports.id, report.id));

    await db.insert(reportStatusLogs).values({
      reportId: report.id,
      diubahOleh: req.user!.id,
      status: 'ditugaskan',
      catatan: `Ditugaskan ke ${agency.nama}`,
    });

    res.json({ success: true, assignment, agency: { id: agency.id, nama: agency.nama }, message: `Laporan ditugaskan ke ${agency.nama}` });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menugaskan laporan' });
  }
});

export default router;
