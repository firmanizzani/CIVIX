import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL tidak ditemukan');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('Menjalankan migrasi database...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrasi selesai');
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});
