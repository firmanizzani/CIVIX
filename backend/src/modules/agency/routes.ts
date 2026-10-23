import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../../db/index.js';
import { reports, reportPhotos, reportStatusLogs, agencies } from '../../db/schema.js';
import { eq, desc, count, inArray, and, sql } from 'drizzle-orm';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import { buildReportPhotoPath, uploadImageToStorage } from '../uploads/service.js';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya gambar yang diperbolehkan'));
  },
});

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['instansi', 'admin']));

const ALLOWED_PROGRESS: string[] = ['dikerjakan', 'selesai'];

const getAgencyScope = (req: AuthRequest, res: Response): { agencyId: string } | null => {
  if (req.user!.peran === 'admin') return { agencyId: '' };
  const agencyId = req.user!.agencyId;
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

// GET /agency/dashboard - Ringkasan instansi
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const scope = getAgencyScope(req, res);
    if (!scope) return;
    const cond = scopeCondition(scope.agencyId);

    const ditugaskan = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'ditugaskan'), cond));
    const dikerjakan = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'dikerjakan'), cond));
    const selesai = await db.select({ count: count() }).from(reports).where(and(eq(reports.status, 'selesai'), cond));

    const recent = await db.query.reports.findMany({
      where: and(inArray(reports.status, ['ditugaskan', 'dikerjakan']), cond),
      limit: 10,
      orderBy: [desc(reports.dibuatPada)],
      with: { photos: { limit: 1 }, region: true, assignedAgency: true },
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
    const scope = getAgencyScope(req, res);
    if (!scope) return;
    const { status, limit = 30, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions = [inArray(reports.status, ['ditugaskan', 'dikerjakan', 'selesai']), scopeCondition(scope.agencyId)];
    if (status) conditions.push(eq(reports.status, status as any));

    const tasks = await db.query.reports.findMany({
      where: and(...conditions),
      limit: Number(limit),
      offset,
      orderBy: [desc(reports.dibuatPada)],
      with: { photos: { limit: 1 }, region: true, assignedAgency: true, statusLogs: { orderBy: [desc(reportStatusLogs.waktu)], limit: 3 } },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar tugas' });
  }
});

// GET /agency/assignments/:id - Detail tugas
router.get('/assignments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const scope = getAgencyScope(req, res);
    if (!scope) return;

    const task = await db.query.reports.findFirst({
      where: and(eq(reports.id, req.params.id), scopeCondition(scope.agencyId)),
      with: {
        photos: true,
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

// POST /agency/assignments/:id/progress - Update progres (mulai atau dalam pengerjaan)
router.post('/assignments/:id/progress', async (req: AuthRequest, res: Response) => {
  try {
    const scope = getAgencyScope(req, res);
    if (!scope) return;
    if (!(await assertOwnsReport(req.params.id, scope.agencyId))) {
      return res.status(403).json({ error: 'Tugas ini tidak ditugaskan ke instansi Anda' });
    }

    const { status, catatan } = req.body;
    if (!ALLOWED_PROGRESS.includes(status)) {
      return res.status(400).json({ error: `Status harus salah satu dari: ${ALLOWED_PROGRESS.join(', ')}` });
    }

    const report = await db.query.reports.findFirst({ where: eq(reports.id, req.params.id) });
    if (!report) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    if (!['ditugaskan', 'dikerjakan'].includes(report.status)) {
      return res.status(400).json({ error: `Tugas dengan status ${report.status} tidak dapat diperbarui progres` });
    }

    await db.update(reports).set({ status: status as any }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: status as any,
      catatan: catatan || (status === 'dikerjakan' ? 'Pekerjaan mulai dikerjakan' : 'Progres diperbarui'),
    });

    res.json({ success: true, message: 'Progres berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui progres' });
  }
});

// POST /agency/assignments/:id/complete - Selesaikan laporan + wajib foto bukti
router.post('/assignments/:id/complete', upload.array('bukti', 3), async (req: AuthRequest, res: Response) => {
  try {
    const scope = getAgencyScope(req, res);
    if (!scope) return;
    if (!(await assertOwnsReport(req.params.id, scope.agencyId))) {
      return res.status(403).json({ error: 'Tugas ini tidak ditugaskan ke instansi Anda' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Foto bukti perbaikan wajib diunggah minimal 1' });
    }

    const report = await db.query.reports.findFirst({ where: eq(reports.id, req.params.id) });
    if (!report) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    if (report.status !== 'dikerjakan') {
      return res.status(400).json({ error: 'Tugas harus berstatus "dikerjakan" terlebih dahulu' });
    }

    for (const [index, file] of files.entries()) {
      const storagePath = buildReportPhotoPath(report.kodeTiket, 'bukti', index + 1, file.mimetype);
      const url = await uploadImageToStorage(file.buffer, storagePath, file.mimetype);
      await db.insert(reportPhotos).values({ reportId: req.params.id, url, jenis: 'bukti_perbaikan' });
    }

    const selesaiPada = new Date();
    await db.update(reports).set({ status: 'selesai', selesaiPada }).where(eq(reports.id, req.params.id));

    await db.insert(reportStatusLogs).values({
      reportId: req.params.id,
      diubahOleh: req.user!.id,
      status: 'selesai',
      catatan: req.body.catatan || 'Pekerjaan selesai, bukti perbaikan telah diunggah',
    });

    res.json({ success: true, message: 'Laporan selesai' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyelesaikan laporan' });
  }
});

export default router;
