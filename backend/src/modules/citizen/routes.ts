import { Router, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import multer from 'multer';
import { eq, desc, asc, and, or, notInArray, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, citizenProfiles, reports, reportPhotos, reportStatusLogs } from '../../db/schema.js';
import { authMiddleware, requireRole, AuthRequest } from '../../middleware/auth.js';
import { uploadImageToStorage } from '../uploads/service.js';
import { readPlatformSettings } from '../admin/settings.js';

const router = Router();
router.use(authMiddleware, requireRole(['warga']));
const avatarUpload = multer({ limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(Object.assign(new Error('Gunakan foto JPG, PNG, atau WebP.'), { statusCode: 400 }));
} });
const fail = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0]?.message || 'Data tidak valid' });
  return res.status(500).json({ error: 'Perubahan belum berhasil disimpan' });
};
router.get('/map', async (req: AuthRequest, res) => {
  try {
    const { completedMapDays } = await readPlatformSettings();
    const rows = await db.query.reports.findMany({ where: or(eq(reports.userId, req.user!.id), and(notInArray(reports.status, ['ditolak', 'duplikat']), sql`(${reports.status} != 'selesai' OR ${reports.selesaiPada} >= NOW() - (${completedMapDays} * INTERVAL '1 day'))`)), columns: { id: true, userId: true, judul: true, kodeTiket: true, status: true, kategori: true, namaJalan: true, regionId: true, latitude: true, longitude: true, dibuatPada: true }, with: { region: true, photos: { where: eq(reportPhotos.jenis, 'awal'), limit: 1, orderBy: [asc(reportPhotos.dibuatPada)] } } });
    res.json(rows.map(({ userId, ...row }) => ({ ...row, owned: userId === req.user!.id })));
  } catch { res.status(500).json({ error: 'Gagal memuat peta laporan warga' }); }
});
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id), columns: { id: true, nama: true, email: true, peran: true } });
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });
    const [profile] = await db.select().from(citizenProfiles).where(eq(citizenProfiles.userId, user.id));
    res.json({ ...user, telepon: profile?.telepon || '', alamat: profile?.alamat || '', avatarUrl: profile?.avatarUrl || null, notifyReportUpdates: profile?.notifyReportUpdates ?? true });
  } catch { res.status(500).json({ error: 'Gagal memuat profil warga' }); }
});
router.patch('/profile', async (req: AuthRequest, res) => {
  try {
    const body = z.object({ nama: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100), telepon: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, 'Nomor telepon tidak valid'), alamat: z.string().trim().max(1000) }).strict().parse(req.body);
    await db.transaction(async tx => {
      await tx.update(users).set({ nama: body.nama }).where(eq(users.id, req.user!.id));
      await tx.insert(citizenProfiles).values({ userId: req.user!.id, telepon: body.telepon, alamat: body.alamat }).onConflictDoUpdate({ target: citizenProfiles.userId, set: { telepon: body.telepon, alamat: body.alamat, updatedAt: new Date() } });
    });
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});
router.patch('/preferences', async (req: AuthRequest, res) => {
  try {
    const body = z.object({ notifyReportUpdates: z.boolean() }).strict().parse(req.body);
    await db.insert(citizenProfiles).values({ userId: req.user!.id, ...body }).onConflictDoUpdate({ target: citizenProfiles.userId, set: { ...body, updatedAt: new Date() } });
    res.json(body);
  } catch (error) { fail(res, error); }
});
router.post('/avatar', avatarUpload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Pilih foto profil terlebih dahulu' });
    const extension = req.file.mimetype === 'image/jpeg' ? 'jpg' : req.file.mimetype === 'image/webp' ? 'webp' : 'png';
    const avatarUrl = await uploadImageToStorage(req.file.buffer, `profiles/${req.user!.id}/${randomUUID()}.${extension}`, req.file.mimetype);
    await db.insert(citizenProfiles).values({ userId: req.user!.id, avatarUrl }).onConflictDoUpdate({ target: citizenProfiles.userId, set: { avatarUrl, updatedAt: new Date() } });
    res.json({ avatarUrl });
  } catch (error) { fail(res, error); }
});
router.get('/updates', async (req: AuthRequest, res) => {
  try {
    const rows = await db.query.reports.findMany({ where: eq(reports.userId, req.user!.id), columns: { id: true, judul: true, kodeTiket: true, status: true, dibuatPada: true }, with: { statusLogs: { limit: 1, orderBy: [desc(reportStatusLogs.waktu)] } } });
    res.json(rows.sort((a, b) => new Date(b.statusLogs[0]?.waktu || b.dibuatPada).getTime() - new Date(a.statusLogs[0]?.waktu || a.dibuatPada).getTime()).slice(0, 10));
  } catch { res.status(500).json({ error: 'Gagal memuat perkembangan laporan' }); }
});
router.get('/reports/:id', async (req: AuthRequest, res) => {
  try {
    const report = await db.query.reports.findFirst({ where: (row, { and }) => and(eq(row.id, req.params.id), eq(row.userId, req.user!.id)), with: { region: true, assignedAgency: true, photos: { orderBy: [asc(reportPhotos.jenis), asc(reportPhotos.dibuatPada)] }, statusLogs: { orderBy: [desc(reportStatusLogs.waktu)] } } });
    if (!report) return res.status(404).json({ error: 'Laporan Anda tidak ditemukan' });
    res.json(report);
  } catch { res.status(500).json({ error: 'Gagal memuat detail laporan' }); }
});
export default router;
