import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { JWT_SECRET, JWT_EXPIRY } from '../../config/index.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';

const router = Router();

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
    const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await db
      .insert(users)
      .values({ nama: body.nama, email: body.email, passwordHash, peran: 'warga' })
      .returning({ id: users.id, email: users.email, peran: users.peran });

    const token = jwt.sign({ id: user[0].id, peran: user[0].peran }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({ token, user: user[0] });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Gagal membuat akun' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    const token = jwt.sign({ id: user.id, peran: user.peran }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token, user: { id: user.id, nama: user.nama, email: user.email, peran: user.peran } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Login gagal' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ id: user.id, nama: user.nama, email: user.email, peran: user.peran });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

export default router;
