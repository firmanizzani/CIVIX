import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/routes.js';
import reportRoutes from './modules/reports/routes.js';
import adminRoutes from './modules/admin/routes.js';
import agencyRoutes from './modules/agency/routes.js';
import statsRoutes from './modules/stats/routes.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') ?? 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'civix-api' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/agency', agencyRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message });
});

export default app;
