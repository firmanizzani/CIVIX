import { getReportWorkspace } from '../reports/workspace.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transitionReport, ReportTransitionError } from '../reports/status.js';
import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportStatusLogs, agencies, users, regions } from '../../db/schema.js';
import bcrypt from 'bcrypt';
import { asc, eq, desc, count, inArray, and, sql } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import { buildReportPhotoPath, uploadImageToStorage } from '../uploads/service.js';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new ReportTransitionError(400, 'Gunakan foto JPG, PNG, WebP, atau GIF.'));
  },
});

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['instansi', 'admin']));



const getAgencyScope = async (req: AuthRequest, res: Response): Promise<{ agencyId: string } | null> => {
  if (req.user!.peran === 'admin') return { agencyId: '' };
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.user!.id),
    columns: { agencyId: true },
  });
  const agencyId = user?.agencyId;
  if (!agencyId) {
    res.status(403).json({ error: 'Akun instansi belum terhubung dengan unit instansi manapun' });
    return null;
  }
  return { agencyId };
};

const scopeCondition = (agencyId: string) =>
  agencyId ? eq(reports.assignedAgencyId, agencyId) : sql`TRUE`;

const assertOwnsReport = async (reportId: string, agencyId: string): Promise<boolean> => {
  if (!agencyId) return true;
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });
  return !!report && report.assignedAgencyId === agencyId;
};

// Every screen uses this same assignment scope, including completed/rejected work.
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    const items = await db.query.reports.findMany({
      where: scopeCondition(scope.agencyId), orderBy: [desc(reports.dibuatPada)],
      with: { region: true, photos: { where: eq(reportPhotos.jenis, 'awal'), limit: 1, orderBy: [asc(reportPhotos.dibuatPada)] } },
    });
    const wilayah = await db.select().from(regions).orderBy(asc(regions.nama));
    res.json({ items, regions: wilayah });
  } catch { res.status(500).json({ error: 'Gagal memuat ringkasan instansi' }); }
});

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    if (!scope.agencyId) return res.status(400).json({ error: 'Masuk dengan akun instansi untuk membuka profil unit.' });
    const agency = await db.query.agencies.findFirst({ where: eq(agencies.id, scope.agencyId),
      with: { users: { columns: { id: true, nama: true, email: true, peran: true, dibuatPada: true }, orderBy: [asc(users.nama)] } } });
    if (!agency) return res.status(404).json({ error: 'Instansi tidak ditemukan' });
    res.json(agency);
  } catch { res.status(500).json({ error: 'Gagal memuat profil instansi' }); }
});

router.patch('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    if (!scope.agencyId) return res.status(400).json({ error: 'Masuk dengan akun instansi untuk mengubah profil unit.' });
    const body = z.object({ nama: z.string().trim().min(2).max(150), deskripsi: z.string().trim().max(2000) }).strict().parse(req.body);
    const [agency] = await db.update(agencies).set(body).where(eq(agencies.id, scope.agencyId)).returning();
    res.json(agency);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Nama wajib 2–150 karakter dan deskripsi maksimal 2.000 karakter.' });
    res.status(500).json({ error: 'Profil instansi belum berhasil disimpan' });
  }
});

router.post('/members', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    if (!scope.agencyId) return res.status(400).json({ error: 'Masuk dengan akun instansi untuk menambah petugas.' });
    const body = z.object({ nama: z.string().trim().min(3).max(100), email: z.string().trim().email().max(150), password: z.string().min(8).max(128) }).strict().parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [member] = await db.insert(users).values({ nama: body.nama, email: body.email, passwordHash, peran: 'instansi', agencyId: scope.agencyId })
      .onConflictDoNothing({ target: users.email }).returning({ id: users.id, nama: users.nama, email: users.email, peran: users.peran, dibuatPada: users.dibuatPada });
    if (!member) return res.status(409).json({ error: 'Email sudah terdaftar' });
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Periksa nama, alamat email, dan kata sandi minimal 8 karakter.' });
    res.status(500).json({ error: 'Petugas belum berhasil ditambahkan' });
  }
});

// GET /agency/dashboard - Ringkasan instansi
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    const cond = scopeCondition(scope.agencyId);

    const ditugaskan = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'ditugaskan'), cond));
    const dikerjakan = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'dikerjakan'), cond));
    const selesai = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'selesai'), cond));

    const recent = await db.query.reports.findMany({
      where: and(inArray(reports.status, ['ditugaskan', 'dikerjakan', 'selesai']), cond),
      limit: 20,
      orderBy: [desc(reports.dibuatPada)],
      with: { photos: { limit: 1, orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] }, region: true, assignedAgency: true },
    });

    let agency: { nama: string } | null = null;
    if (scope.agencyId) {
      agency = await db.query.agencies.findFirst({ where: eq(agencies.id, scope.agencyId) });
    }

    res.json({
      ditugaskan: ditugaskan[0]?.count || 0,
      dikerjakan: dikerjakan[0]?.count || 0,
      selesai: selesai[0]?.count || 0,
      recent,
      agency: agency ? { nama: agency.nama } : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat dashboard instansi' });
  }
});

// GET /agency/assignments - Daftar tugas instansi
router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    if (req.query.view === 'workspace') return res.json(await getReportWorkspace(req.query, scopeCondition(scope.agencyId)));
    const { status, limit = 30, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions = [inArray(reports.status, ['ditugaskan', 'dikerjakan', 'selesai']), scopeCondition(scope.agencyId)];
    if (status) conditions.push(eq(reports.status, status as any));

    const tasks = await db.query.reports.findMany({
      where: and(...conditions),
      limit: Number(limit),
      offset,
      orderBy: [desc(reports.dibuatPada)],
      with: { photos: { limit: 1, orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] }, region: true, assignedAgency: true, statusLogs: { orderBy: [desc(reportStatusLogs.waktu)], limit: 3 } },
    });

    res.json(tasks);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Filter tugas tidak valid' });
    res.status(500).json({ error: 'Gagal memuat daftar tugas' });
  }
});

// GET /agency/assignments/:id - Detail tugas
router.get('/assignments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;

    const task = await db.query.reports.findFirst({
      where: and(eq(reports.id, req.params.id), scopeCondition(scope.agencyId)),
      with: {
        photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] },
        region: true,
        assignedAgency: true,
        statusLogs: { orderBy: [desc(reportStatusLogs.waktu)] },
        user: { columns: { nama: true } },
      },
    });

    if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat detail tugas' });
  }
});

const sendTransitionError = (res: Response, error: unknown) => {
  if (error instanceof ReportTransitionError) return res.status(error.statusCode).json({ error: error.message });
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0]?.message || 'Data tidak valid' });
  return res.status(500).json({ error: 'Gagal memperbarui tugas. Silakan coba lagi.' });
};

router.post('/assignments/:id/progress', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    const { catatan } = z.object({ status: z.literal('dikerjakan', { errorMap: () => ({ message: 'Untuk menyelesaikan laporan, unggah foto bukti melalui tindakan penyelesaian.' }) }), catatan: z.string().trim().max(2000).optional() }).parse(req.body);
    const result = await transitionReport({
      reportId: req.params.id, actorId: req.user!.id, status: 'dikerjakan', allowedFrom: ['ditugaskan', 'dikerjakan'],
      requiredAgencyId: scope.agencyId, allowNoteUpdate: true, note: catatan || 'Pekerjaan mulai dikerjakan',
    });
    res.json({ success: true, changed: result.changed, message: 'Progres berhasil diperbarui' });
  } catch (error) { sendTransitionError(res, error); }
});

router.post('/assignments/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    const { alasan } = z.object({ alasan: z.string().trim().min(1, 'Alasan penolakan wajib diisi').max(2000) }).strict().parse(req.body);
    const result = await transitionReport({ reportId: req.params.id, actorId: req.user!.id,
      status: 'ditolak', allowedFrom: ['ditugaskan', 'dikerjakan'], requiredAgencyId: scope.agencyId,
      note: `Ditolak oleh instansi: ${alasan}` });
    res.json({ success: true, changed: result.changed, message: 'Laporan ditolak dan alasan tercatat di riwayat.' });
  } catch (error) { sendTransitionError(res, error); }
});

router.post('/assignments/:id/complete', upload.array('bukti', 3), async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getAgencyScope(req, res);
    if (!scope) return;
    const { catatan } = z.object({ catatan: z.string().trim().max(2000).optional() }).parse(req.body || {});
    const files = (req.files || []) as Express.Multer.File[];
    const result = await transitionReport({
      reportId: req.params.id, actorId: req.user!.id, status: 'selesai', allowedFrom: ['ditugaskan', 'dikerjakan'],
      requiredAgencyId: scope.agencyId, completedAt: new Date(),
      note: catatan || 'Pekerjaan selesai, bukti perbaikan telah diunggah',
      beforeChange: async (tx, report) => {
        if (!files.length) throw new ReportTransitionError(400, 'Foto bukti perbaikan wajib diunggah minimal 1');
        for (const [index, file] of files.entries()) {
          const storagePath = buildReportPhotoPath(report.kodeTiket, 'bukti', index + 1, file.mimetype).replace(/(\.[^.]+)$/, `-${randomUUID()}$1`);
          const url = await uploadImageToStorage(file.buffer, storagePath, file.mimetype);
          await tx.insert(reportPhotos).values({ reportId: report.id, url, jenis: 'bukti_perbaikan' });
        }
      },
    });
    res.json({ success: true, changed: result.changed, message: 'Laporan selesai' });
  } catch (error) { sendTransitionError(res, error); }
});

export default router;
