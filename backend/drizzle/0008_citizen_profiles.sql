CREATE TABLE IF NOT EXISTS "citizen_profiles" (
  "user_id" varchar(40) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "telepon" varchar(30) DEFAULT '' NOT NULL,
  "alamat" text DEFAULT '' NOT NULL,
  "avatar_url" text,
  "notify_report_updates" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
