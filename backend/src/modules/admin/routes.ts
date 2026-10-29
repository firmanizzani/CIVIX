import { getReportWorkspace } from '../reports/workspace.js';
import { transitionReport, ReportTransitionError } from '../reports/status.js';
import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportStatusLogs, agencies, reportAssignments, users, regions, platformSettings } from '../../db/schema.js';
import { eq, desc, count, asc, ilike, or, and, ne } from 'drizzle-orm';
import { readPlatformSettings } from './settings.js';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['admin']));

router.get('/settings', async (_req, res: Response) => {
  try { res.json(await readPlatformSettings()); }
  catch { res.status(500).json({ error: 'Gagal memuat pengaturan platform' }); }
});
router.patch('/settings', async (req, res: Response) => {
  try {
    const settings = z.object({ completedMapDays: z.number().int().min(1).max(90) }).strict().parse(req.body);
    await db.insert(platformSettings).values({ id: 'global', ...settings }).onConflictDoUpdate({ target: platformSettings.id, set: { ...settings, updatedAt: new Date() } });
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Durasi harus berupa bilangan bulat antara 1 dan 90 hari.' });
    res.status(500).json({ error: 'Pengaturan belum berhasil disimpan' });
  }
});
router.get('/regions', async (_req, res: Response) => {
  try { res.json(await db.select().from(regions).orderBy(asc(regions.nama))); }
  catch { res.status(500).json({ error: 'Gagal memuat wilayah' }); }
});
router.get('/map', async (_req, res: Response) => {
  try { res.json(await db.query.reports.findMany({ columns: { id: true, kodeTiket: true, judul: true, namaJalan: true, regionId: true, kategori: true, status: true, latitude: true, longitude: true, dibuatPada: true } })); }
  catch { res.status(500).json({ error: 'Gagal memuat peta admin' }); }
});
router.get('/overview', async (_req, res: Response) => {
  try {
    const items = await db.query.reports.findMany({ orderBy: [desc(reports.dibuatPada)],
      with: { region: true, assignedAgency: { columns: { id: true, nama: true } }, photos: { where: eq(reportPhotos.jenis, 'awal'), limit: 1, orderBy: [asc(reportPhotos.dibuatPada)] } } });
    const wilayah = await db.select().from(regions).orderBy(asc(regions.nama));
    res.json({ items, regions: wilayah });
  } catch { res.status(500).json({ error: 'Gagal memuat ringkasan operasional admin' }); }
});
router.get('/users', async (_req, res: Response) => {
  try {
    res.json(await db.query.users.findMany({ columns: { id: true, nama: true, email: true, peran: true, dibuatPada: true }, with: { agency: { columns: { id: true, nama: true } } }, orderBy: [asc(users.nama)] }));
  } catch { res.status(500).json({ error: 'Gagal memuat pengguna' }); }
});

// GET /admin/dashboard - Ringkasan admin
router.get('/dashboard', async (_req, res: Response) => {
  try {
    const totalReports = await db.select({ count: count() }).from(reports);
    const pendingReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'diterima'));
    const verifiedReports = await db.select({ count: count() }).from(reports).where(eq(reports.status, 'diverifikasi'));
    const inProgressReports = await db.select({ count: count() }).from(reports).where(or(eq(reports.status, 'ditugaskan'), eq(reports.status, 'dikerjakan')));
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
    if (req.query.view === 'workspace') return res.json(await getReportWorkspace(req.query));
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
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true,
        user: { columns: { nama: true, email: true } },
      },
    });

    res.json(allReports);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Filter laporan tidak valid' });
    res.status(500).json({ error: 'Gagal memuat daftar laporan admin' });
  }
});

router.get('/reports/:id', async (req, res: Response) => {
  try {
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, req.params.id),
      with: { photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true, assignedAgency: true,
        statusLogs: { orderBy: [desc(reportStatusLogs.waktu), desc(reportStatusLogs.id)] }, user: { columns: { id: true, nama: true, email: true } } },
    });
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json(report);
  } catch { res.status(500).json({ error: 'Gagal memuat detail laporan' }); }
});

const sendTransitionError = (res: Response, error: unknown) => {
  if (error instanceof ReportTransitionError) return res.status(error.statusCode).json({ error: error.message });
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0]?.message || 'Data tidak valid' });
  return res.status(500).json({ error: 'Gagal memperbarui laporan' });
};
const NoteSchema = z.object({ catatan: z.string().trim().max(2000).optional() });

router.post('/reports/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { catatan } = NoteSchema.parse(req.body || {});
    const result = await transitionReport({ reportId: req.params.id, actorId: req.user!.id,
      status: 'diverifikasi', allowedFrom: ['diterima'], note: catatan || 'Laporan telah diverifikasi oleh administrator' });
    res.json({ success: true, changed: result.changed, message: 'Laporan diverifikasi' });
  } catch (error) { sendTransitionError(res, error); }
});

router.post('/reports/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { alasan } = z.object({ alasan: z.string().trim().min(1, 'Alasan penolakan wajib diisi').max(2000) }).parse(req.body);
    const result = await transitionReport({ reportId: req.params.id, actorId: req.user!.id,
      status: 'ditolak', allowedFrom: ['diterima'], note: alasan });
    res.json({ success: true, changed: result.changed, message: 'Laporan ditolak' });
  } catch (error) { sendTransitionError(res, error); }
});

router.post('/reports/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const { targetTicket } = z.object({ targetTicket: z.string().trim().max(20).optional() }).parse(req.body || {});
    const result = await transitionReport({ reportId: req.params.id, actorId: req.user!.id,
      status: 'duplikat', allowedFrom: ['diterima', 'diverifikasi'],
      note: targetTicket ? `Duplikat dari tiket ${targetTicket}` : 'Laporan terindikasi duplikat' });
    res.json({ success: true, changed: result.changed, message: 'Laporan ditandai duplikat' });
  } catch (error) { sendTransitionError(res, error); }
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
      .where(and(eq(users.id, req.params.id), ne(users.peran, 'admin'))).returning({ id: users.id, peran: users.peran });
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
    const totals = await db.select({ agencyId: reports.assignedAgencyId, total: count() }).from(reports).groupBy(reports.assignedAgencyId);
    res.json(list.map((agency: { id: string }) => ({ ...agency, jumlahLaporan: Number(totals.find((item: { agencyId: string | null }) => item.agencyId === agency.id)?.total || 0) })));
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar instansi' });
  }
});

router.post('/reports/:id/restore', async (req: AuthRequest, res: Response) => {
  try {
    const result = await transitionReport({ reportId: req.params.id, actorId: req.user!.id,
      status: 'diterima', allowedFrom: ['duplikat', 'diverifikasi'], agencyId: null, completedAt: null,
      note: 'Laporan dipulihkan oleh admin dan dikembalikan ke antrean verifikasi' });
    res.json({ success: true, changed: result.changed, message: 'Laporan dipulihkan ke antrean verifikasi' });
  } catch (error) { sendTransitionError(res, error); }
});

router.post('/reports/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, catatan } = z.object({ agencyId: z.string().min(1, 'Pilih instansi penerima tugas'), catatan: z.string().trim().max(2000).optional() }).parse(req.body);
    const agency = await db.query.agencies.findFirst({ where: eq(agencies.id, agencyId) });
    if (!agency) return res.status(404).json({ error: 'Instansi tidak ditemukan' });
    const result = await transitionReport({
      reportId: req.params.id, actorId: req.user!.id, status: 'ditugaskan', allowedFrom: ['diverifikasi'],
      agencyId, note: `Ditugaskan ke ${agency.nama}${catatan ? ': ' + catatan : ''}`,
      beforeChange: async (tx, report) => {
        await tx.insert(reportAssignments).values({ reportId: report.id, agencyId, assignedBy: req.user!.id, catatan: catatan || null });
      },
    });
    res.json({ success: true, changed: result.changed, agency: { id: agency.id, nama: agency.nama }, message: `Laporan ditugaskan ke ${agency.nama}` });
  } catch (error) { sendTransitionError(res, error); }
});

export default router;
