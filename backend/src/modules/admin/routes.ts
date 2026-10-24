import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { reports, reportStatusLogs, agencies, reportAssignments, users } from '../../db/schema.js';
import { eq, desc, count, asc, ilike, or } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

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

    const totalWarga = await db.select({ count: count() }).from(users).where(eq(users.peran, 'warga'));
    const totalInstansi = await db.select({ count: count() }).from(agencies);
    const totalAkunInstansi = await db.select({ count: count() }).from(users).where(eq(users.peran, 'instansi'));

    res.json({
      total: totalReports[0]?.count || 0,
      pending: pendingReports[0]?.count || 0,
      verified: verifiedReports[0]?.count || 0,
      inProgress: inProgressReports[0]?.count || 0,
      completed: completedReports[0]?.count || 0,
      totalWarga: totalWarga[0]?.count || 0,
      totalInstansi: totalInstansi[0]?.count || 0,
      totalAkunInstansi: totalAkunInstansi[0]?.count || 0,
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

const AgencySchema = z.object({ nama: z.string().trim().min(2).max(150), deskripsi: z.string().trim().max(2000).optional().nullable() });
const AccountSchema = z.object({ nama: z.string().trim().min(3).max(100), email: z.string().trim().email().max(150), password: z.string().min(8).max(128) });
const PasswordSchema = z.object({ password: z.string().min(8).max(128) });

router.get('/residents', async (req, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where = search ? or(ilike(users.nama, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined;
    const residents = await db.query.users.findMany({
      where: where ? (row, { and }) => and(eq(users.peran, 'warga'), where) : eq(users.peran, 'warga'),
      columns: { id: true, nama: true, email: true, dibuatPada: true },
      orderBy: [desc(users.dibuatPada)],
      limit: 250,
    });
    res.json(residents);
  } catch {
    res.status(500).json({ error: 'Gagal memuat daftar warga' });
  }
});

router.post('/agencies', async (req, res: Response) => {
  try {
    const body = AgencySchema.parse(req.body);
    const [agency] = await db.insert(agencies).values({ nama: body.nama, deskripsi: body.deskripsi || null }).returning();
    res.status(201).json(agency);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Gagal membuat instansi' });
  }
});

router.post('/agencies/:id/accounts', async (req, res: Response) => {
  try {
    const body = AccountSchema.parse(req.body);
    const agency = await db.query.agencies.findFirst({ where: eq(agencies.id, req.params.id) });
    if (!agency) return res.status(404).json({ error: 'Instansi tidak ditemukan' });
    const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [account] = await db.insert(users).values({ nama: body.nama, email: body.email, passwordHash, peran: 'instansi', agencyId: agency.id })
      .returning({ id: users.id, nama: users.nama, email: users.email, agencyId: users.agencyId });
    res.status(201).json(account);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Gagal membuat akun instansi' });
  }
});

router.patch('/accounts/:id/password', async (req, res: Response) => {
  try {
    const { password } = PasswordSchema.parse(req.body);
    const [account] = await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12) })
      .where(eq(users.id, req.params.id)).returning({ id: users.id, peran: users.peran });
    if (!account || account.peran === 'admin') return res.status(404).json({ error: 'Akun tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
});

// GET /admin/agencies - Daftar instansi untuk dropdown penugasan
router.get('/agencies', async (_req, res: Response) => {
  try {
    const list = await db.query.agencies.findMany({
      orderBy: [asc(agencies.nama)],
      with: { users: { columns: { id: true, nama: true, email: true, dibuatPada: true } } },
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar instansi' });
  }
});

// POST /admin/reports/:id/restore - Pulihkan laporan ke antrean verifikasi
router.post('/reports/:id/restore', async (req: AuthRequest, res: Response) => {
  try {
    const report = await db.query.reports.findFirst({ where: eq(reports.id, req.params.id) });
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    if (!['duplikat', 'diverifikasi'].includes(report.status)) {
      return res.status(400).json({ error: 'Hanya laporan duplikat atau terverifikasi yang dapat dikembalikan ke antrean verifikasi' });
    }

    await db.update(reports).set({ status: 'diterima', assignedAgencyId: null }).where(eq(reports.id, report.id));
    await db.insert(reportStatusLogs).values({
      reportId: report.id,
      diubahOleh: req.user!.id,
      status: 'diterima',
      catatan: 'Laporan dipulihkan oleh admin dan dikembalikan ke antrean verifikasi',
    });

    res.json({ success: true, message: 'Laporan dipulihkan ke antrean verifikasi' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memulihkan laporan' });
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
