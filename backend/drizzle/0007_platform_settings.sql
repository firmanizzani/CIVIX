CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" varchar(20) PRIMARY KEY NOT NULL,
  "completed_map_days" integer DEFAULT 7 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "completed_map_days_range" CHECK ("completed_map_days" BETWEEN 1 AND 90)
);
--> statement-breakpoint
INSERT INTO "platform_settings" ("id", "completed_map_days") VALUES ('global', 7) ON CONFLICT ("id") DO NOTHING;
