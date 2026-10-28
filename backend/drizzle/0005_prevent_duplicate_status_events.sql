-- Remove placeholder captions without removing meaningful status history.
DELETE FROM "report_status_logs" AS placeholder
WHERE placeholder."catatan" = 'Data dummy September 2026 untuk demonstrasi statistik.'
AND EXISTS (
  SELECT 1 FROM "report_status_logs" AS existing
  WHERE existing."report_id" = placeholder."report_id"
    AND existing."status" = placeholder."status"
    AND existing."waktu" = placeholder."waktu"
    AND existing."diubah_oleh" IS NOT DISTINCT FROM placeholder."diubah_oleh"
    AND existing."catatan" IS NULL
);
--> statement-breakpoint
UPDATE "report_status_logs" SET "catatan" = NULL
WHERE "catatan" = 'Data dummy September 2026 untuk demonstrasi statistik.';
--> statement-breakpoint
-- Keep one copy of each exact event; retain different actors, notes and times.
DELETE FROM "report_status_logs"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "report_id", "status", "waktu", "diubah_oleh", "catatan"
      ORDER BY "id"
    ) AS duplicate_position
    FROM "report_status_logs"
  ) AS ranked
  WHERE duplicate_position > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_status_logs_unique_event"
ON "report_status_logs" USING btree (
  "report_id", "status", "waktu",
  coalesce("diubah_oleh", ''),
  coalesce(md5("catatan"), '')
);
