-- Skema database: Platform Pelaporan Infrastruktur & Lingkungan
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipe enum
CREATE TYPE peran_user AS ENUM ('warga', 'admin', 'instansi');

CREATE TYPE kategori_laporan AS ENUM (
  'jalan_rusak', 'drainase', 'sampah', 'penerangan', 'fasilitas_umum', 'lainnya'
);

CREATE TYPE status_laporan AS ENUM (
  'diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan', 'selesai', 'ditolak', 'duplikat'
);

CREATE TYPE jenis_foto AS ENUM ('awal', 'bukti_perbaikan');

-- Pengguna
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  peran         peran_user NOT NULL DEFAULT 'warga',
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wilayah DKI Jakarta (kota administrasi dan kecamatan, untuk agregasi statistik)
CREATE TABLE regions (
  id    SERIAL PRIMARY KEY,
  nama  VARCHAR(100) NOT NULL,
  tipe  VARCHAR(30) NOT NULL DEFAULT 'kecamatan'
);

-- Laporan (hanya lokasi di dalam DKI Jakarta; koordinat divalidasi di server terhadap batas wilayah)
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_tiket   VARCHAR(20) NOT NULL UNIQUE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  region_id    INT REFERENCES regions(id) ON DELETE SET NULL,
  judul        VARCHAR(150) NOT NULL,
  deskripsi    TEXT NOT NULL,
  kategori     kategori_laporan NOT NULL,
  latitude     NUMERIC(9,6) NOT NULL,
  longitude    NUMERIC(9,6) NOT NULL,
  status       status_laporan NOT NULL DEFAULT 'diterima',
  anonim       BOOLEAN NOT NULL DEFAULT FALSE,
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT now(),
  selesai_pada TIMESTAMPTZ
);

-- Foto laporan (foto awal dan bukti perbaikan)
CREATE TABLE report_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  jenis       jenis_foto NOT NULL DEFAULT 'awal',
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Riwayat status (sumber data timeline publik)
CREATE TABLE report_status_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  diubah_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  status      status_laporan NOT NULL,
  catatan     TEXT,
  waktu       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Komentar
CREATE TABLE comments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  isi       TEXT NOT NULL,
  waktu     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dukungan warga (satu user hanya satu upvote per laporan)
CREATE TABLE upvotes (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waktu     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

-- Indeks untuk query yang sering dipakai
CREATE INDEX idx_reports_status      ON reports(status);
CREATE INDEX idx_reports_kategori    ON reports(kategori);
CREATE INDEX idx_reports_region      ON reports(region_id);
CREATE INDEX idx_reports_dibuat      ON reports(dibuat_pada);
CREATE INDEX idx_reports_koordinat   ON reports(latitude, longitude);
CREATE INDEX idx_status_logs_report  ON report_status_logs(report_id, waktu);
CREATE INDEX idx_comments_report     ON comments(report_id);

-- View statistik per wilayah (untuk dashboard)
CREATE VIEW v_statistik_wilayah AS
SELECT
  rg.id AS region_id,
  rg.nama AS wilayah,
  COUNT(r.id) AS total_laporan,
  COUNT(*) FILTER (WHERE r.status = 'selesai') AS selesai,
  COUNT(*) FILTER (WHERE r.status NOT IN ('selesai', 'ditolak', 'duplikat')) AS belum_tertangani,
  ROUND(AVG(EXTRACT(EPOCH FROM (r.selesai_pada - r.dibuat_pada)) / 86400)
        FILTER (WHERE r.status = 'selesai'), 1) AS rata_rata_hari_selesai
FROM regions rg
LEFT JOIN reports r ON r.region_id = rg.id
GROUP BY rg.id, rg.nama;
