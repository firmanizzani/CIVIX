import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { JWT_SECRET, JWT_EXPIRY } from '../../config/index.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import googleRoutes from './google.js';
import { createSession } from './session.js';

const router = Router();
router.use('/google', googleRoutes);

const RegisterSchema = z.object({
  nama: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${email}` });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await db
      .insert(users)
      .values({ nama: body.nama, email, passwordHash, peran: 'warga' })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email, peran: users.peran });
    if (!user.length) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const token = jwt.sign(
      { id: user[0].id, peran: user[0].peran, agencyId: null },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    res.status(201).json({ token, user: user[0] });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Gagal membuat akun' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);
    const exact = await db.query.users.findFirst({
      where: eq(users.email, body.email),
      with: { agency: true },
    });
    const email = body.email.toLowerCase();
    const user = exact ?? (email !== body.email ? await db.query.users.findFirst({
      where: eq(users.email, email),
      with: { agency: true },
    }) : undefined);
    if (!user?.passwordHash) return res.status(401).json({ error: 'Email atau password salah' });

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    res.json(createSession(user));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Login gagal' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
      with: { agency: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      peran: user.peran,
      agencyId: user.agencyId ?? null,
      agencyNama: user.agency?.nama ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

export default router;
