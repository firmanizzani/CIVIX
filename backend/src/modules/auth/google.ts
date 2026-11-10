import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { FRONTEND_URL, GOOGLE_CLIENT_ID } from '../../config/index.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { authMiddleware, requireRole, type AuthRequest } from '../../middleware/auth.js';
import { createSession } from './session.js';

const router = Router();
const google = new OAuth2Client();
const allowedOrigins = FRONTEND_URL.split(',').map(origin => origin.trim());
const credentialSchema = z.object({ credential: z.string().min(1).max(8192) });
const linkSchema = credentialSchema.extend({ password: z.string().min(1) });

const requireGoogleRequest: RequestHandler = (req, res, next) => {
  if (!GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Masuk dengan Google belum tersedia.' });
  // The browser callback sends JSON. Reject cross-site form posts and untrusted origins.
  if (!req.is('application/json') || !allowedOrigins.includes(req.get('Origin') ?? '')) {
    return res.status(403).json({ error: 'Asal permintaan Google tidak diizinkan.' });
  }
  next();
};

async function readGoogleAccount(credential: string) {
  try {
    const ticket = await google.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const account = ticket.getPayload();
    if (!account?.sub || account.sub.length > 255 || account.email_verified !== true) return null;
    const email = z.string().email().max(150).safeParse(account.email?.trim().toLowerCase());
    return email.success ? { subject: account.sub, email: email.data, name: account.name?.trim(), domain: account.hd } : null;
  } catch {
    return null;
  }
}

router.get('/config', (_req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

router.post('/', requireGoogleRequest, async (req, res) => {
  const input = credentialSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Token Google tidak valid.' });
  const account = await readGoogleAccount(input.data.credential);
  if (!account) return res.status(401).json({ error: 'Identitas Google tidak bisa diverifikasi. Coba masuk lagi.' });

  try {
    const linked = await db.query.users.findFirst({ where: eq(users.googleSubject, account.subject) });
    if (linked) {
      if (linked.peran !== 'warga') return res.status(403).json({ error: 'Masuk dengan Google khusus akun Warga.' });
      return res.json(createSession(linked));
    }

    const existing = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${account.email}` });
    if (existing) {
      if (existing.peran !== 'warga') return res.status(403).json({ error: 'Masuk dengan Google khusus akun Warga.' });
      if (existing.googleSubject === account.subject) return res.json(createSession(existing));
      return res.status(409).json({ error: 'Email ini sudah terdaftar. Masuk dengan kata sandi, lalu tautkan Google di Pengaturan.' });
    }
    if (!account.email.endsWith('@gmail.com') && !account.domain) {
      return res.status(400).json({ error: 'Untuk mendaftar lewat Google, gunakan Gmail atau Google Workspace.' });
    }

    const nama = account.name && account.name.length >= 3 ? account.name.slice(0, 100) : 'Warga CIVIX';
    const [created] = await db.insert(users).values({
      nama, email: account.email, googleSubject: account.subject, peran: 'warga',
    }).onConflictDoNothing().returning({
      id: users.id, nama: users.nama, email: users.email, peran: users.peran,
    });
    if (created) return res.status(201).json(createSession(created));

    // A second login can race the first sign-up for the same Google account.
    const concurrent = await db.query.users.findFirst({
      where: and(eq(users.googleSubject, account.subject), eq(users.peran, 'warga')),
    });
    if (concurrent) return res.json(createSession(concurrent));
    return res.status(409).json({ error: 'Email ini sudah terdaftar. Masuk dengan kata sandi, lalu tautkan Google di Pengaturan.' });
  } catch (error) {
    const failure = error as { code?: string; cause?: { code?: string } };
    console.error('[auth/google] Login failed', {
      code: failure.cause?.code ?? failure.code ?? 'UNKNOWN',
    });
    res.status(500).json({ error: 'Gagal masuk dengan Google. Coba lagi.' });
  }
});

router.get('/link', authMiddleware, requireRole(['warga']), async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, req.user!.id), eq(users.peran, 'warga')),
      columns: { googleSubject: true },
    });
    if (!user) return res.status(404).json({ error: 'Akun Warga tidak ditemukan.' });
    res.json({ linked: !!user.googleSubject });
  } catch {
    res.status(500).json({ error: 'Status akun Google gagal dimuat.' });
  }
});

router.post('/link', authMiddleware, requireRole(['warga']), requireGoogleRequest, async (req: AuthRequest, res) => {
  const input = linkSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Masukkan kata sandi CIVIX dan pilih akun Google Anda.' });

  try {
    const user = await db.query.users.findFirst({ where: and(eq(users.id, req.user!.id), eq(users.peran, 'warga')) });
    if (!user?.passwordHash || !await bcrypt.compare(input.data.password, user.passwordHash)) {
      return res.status(400).json({ error: 'Kata sandi CIVIX salah.' });
    }
    const account = await readGoogleAccount(input.data.credential);
    if (!account) return res.status(400).json({ error: 'Identitas Google tidak bisa diverifikasi. Coba lagi.' });
    if (user.email.trim().toLowerCase() !== account.email) {
      return res.status(400).json({ error: 'Pilih akun Google dengan email yang sama dengan akun CIVIX.' });
    }

    const [updated] = await db.update(users).set({ googleSubject: account.subject }).where(and(
      eq(users.id, user.id),
      eq(users.peran, 'warga'),
      eq(users.email, user.email),
      eq(users.passwordHash, user.passwordHash),
      or(isNull(users.googleSubject), eq(users.googleSubject, account.subject)),
    )).returning({ id: users.id });
    if (!updated) return res.status(409).json({ error: 'Penautan tidak bisa dilanjutkan. Muat ulang Pengaturan.' });
    res.json({ linked: true });
  } catch (error) {
    const pgError = error as { code?: string; cause?: { code?: string } };
    if (pgError.code === '23505' || pgError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Akun Google ini sudah tertaut.' });
    }
    res.status(500).json({ error: 'Gagal menautkan akun Google. Coba lagi.' });
  }
});

export default router;
