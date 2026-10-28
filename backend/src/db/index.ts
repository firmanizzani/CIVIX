import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL tidak ditemukan');
}

const client = postgres(process.env.DATABASE_URL, { max: 10, prepare: false });
export const db: any = drizzle(client, { schema });
