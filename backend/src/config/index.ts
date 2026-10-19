export const JWT_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
export const JWT_EXPIRY = '7d';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'civix-reports';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
