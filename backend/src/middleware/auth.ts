import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';

export interface AuthRequest extends Request<Record<string, string>> {
  user?: { id: string; peran: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; peran: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};

export const requireRole =
  (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.peran)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    next();
  };
