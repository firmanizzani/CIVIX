-- Legacy sequence IDs can collide with explicitly seeded IDs and truncate above 999.
-- Preserve existing history; use collision-resistant IDs for every future writer.
ALTER TABLE "report_status_logs" ALTER COLUMN "id" SET DEFAULT 'rlog_' || replace(gen_random_uuid()::text, '-', '');
