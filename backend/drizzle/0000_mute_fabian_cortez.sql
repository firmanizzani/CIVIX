CREATE TYPE "public"."jenis_foto" AS ENUM('awal', 'bukti_perbaikan');--> statement-breakpoint
CREATE TYPE "public"."kategori_laporan" AS ENUM('jalan_rusak', 'drainase', 'sampah', 'penerangan', 'fasilitas_umum', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."peran_user" AS ENUM('warga', 'admin', 'instansi');--> statement-breakpoint
CREATE TYPE "public"."status_laporan" AS ENUM('diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan', 'selesai', 'ditolak', 'duplikat');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"isi" text NOT NULL,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"tipe" varchar(30) DEFAULT 'kecamatan' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"url" text NOT NULL,
	"jenis" "jenis_foto" DEFAULT 'awal' NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_status_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"diubah_oleh" uuid,
	"status" "status_laporan" NOT NULL,
	"catatan" text,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode_tiket" varchar(20) NOT NULL,
	"user_id" uuid,
	"region_id" integer,
	"judul" varchar(150) NOT NULL,
	"deskripsi" text NOT NULL,
	"kategori" "kategori_laporan" NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"status" "status_laporan" DEFAULT 'diterima' NOT NULL,
	"anonim" boolean DEFAULT false NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"selesai_pada" timestamp with time zone,
	CONSTRAINT "reports_kode_tiket_unique" UNIQUE("kode_tiket")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "upvotes" (
	"report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upvotes_report_id_user_id_pk" PRIMARY KEY("report_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" text NOT NULL,
	"peran" "peran_user" DEFAULT 'warga' NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_status_logs" ADD CONSTRAINT "report_status_logs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_status_logs" ADD CONSTRAINT "report_status_logs_diubah_oleh_users_id_fk" FOREIGN KEY ("diubah_oleh") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_report" ON "comments" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_status_logs_report" ON "report_status_logs" USING btree ("report_id","waktu");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_kategori" ON "reports" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_region" ON "reports" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_dibuat" ON "reports" USING btree ("dibuat_pada");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_koordinat" ON "reports" USING btree ("latitude","longitude");