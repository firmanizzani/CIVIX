# CIVIX — Platform Pelaporan Infrastruktur dan Lingkungan DKI Jakarta

## 1. Deskripsi Project

**CIVIX** (Civic Infrastructure Verification & Integrated Execution) adalah aplikasi web untuk melaporkan masalah infrastruktur dan lingkungan di DKI Jakarta, mulai dari jalan rusak hingga sampah dan penerangan jalan. Warga dapat memantau perkembangan laporan, admin memverifikasi dan menugaskan laporan, sedangkan instansi menangani serta mengunggah bukti penyelesaian.

Project ini dikembangkan untuk **Web In Action 2026 — Multimedia In Action 2026**, dengan subtema utama **Civic Reporting & Accountability**.

## 2. Identitas Tim

**Nama tim: SWE Ball Knowledge**

| Nama | Peran |
| --- | --- |
| Ibnu Ahmad Fauzan | Ketua tim |
| Muhammad Firman Izzani | Anggota |

## 3. Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Navigasi dan pengelolaan data | React Router, TanStack Query, Zustand, Axios |
| Form dan validasi | React Hook Form, Zod |
| Peta | Leaflet, React Leaflet |
| Grafik | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Autentikasi | JWT, bcrypt |
| Unggah dan penyimpanan foto | Multer, Supabase Storage |

## 4. Cara Menjalankan Project

### Prasyarat

- Node.js 22 atau 24 beserta npm.
- Git.
- Database PostgreSQL lokal atau melalui Supabase.
- Koneksi internet untuk memuat tile peta dan layanan eksternal.

### Clone repository

```bash
git clone https://github.com/firmanizzani/CIVIX.git
cd CIVIX
```

### Instal dependensi

Jalankan dari folder utama project:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Konfigurasi lingkungan

Salin file `backend/.env.example` menjadi `backend/.env`, kemudian sesuaikan nilainya. Jalankan perintah PowerShell berikut dari folder utama project:

```powershell
Copy-Item backend/.env.example backend/.env
```

Isi `backend/.env` dengan konfigurasi milik lingkungan pengembangan Anda:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/civix
AUTH_SECRET=ganti-dengan-string-acak-minimal-32-karakter
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=civix-reports
```

- `DATABASE_URL`: koneksi ke database PostgreSQL yang sudah dibuat. Untuk Supabase, gunakan connection string dari project Anda.
- `AUTH_SECRET`: gunakan nilai acak untuk penandatanganan token.
- Untuk penyimpanan foto melalui Supabase, isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, lalu buat bucket `civix-reports` yang mengizinkan pembacaan gambar melalui URL publik. Service role key hanya digunakan di backend.
- Untuk mencoba secara lokal tanpa Supabase Storage, biarkan kedua variabel Supabase tersebut kosong. Layanan unggahan akan memakai fallback data URI.
- Jangan unggah file `.env` atau kredensial pribadi ke repository.

Salin `frontend/.env.example` menjadi `frontend/.env`:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Nilai bawaan frontend:

```env
VITE_API_BASE_URL=/api/v1
```

### Siapkan database dan data demo

Jalankan migrasi yang sudah tersedia dari folder utama, termasuk setelah memperbarui project. Migrasi terbaru menambah tabel privat untuk hasil pengecekan foto dan laporan serupa yang dibaca admin.

```bash
npm --prefix backend run db:migrate
```

Batas lokasi CIVIX memakai enam poligon kota/kabupaten DKI Jakarta dari [OCHA ROAP / HDX](https://data.humdata.org/dataset/cod-ab-idn) melalui [geoBoundaries gbHumanitarian](https://www.geoboundaries.org/api.html), ADM2 tahun 2019, dengan lisensi [CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/). CIVIX mengambil fitur Jakarta dari dataset dan membulatkan koordinat ke tujuh desimal.

Untuk database pengembangan baru, tambahkan data wilayah, instansi, akun, dan laporan demo:

```bash
npm --prefix backend run db:seed
```

Akun berikut tersedia setelah seeding pada database baru. Kata sandi akun yang sudah ada tidak otomatis diganti oleh proses seed.

| Peran | Email | Kata sandi demo |
| --- | --- | --- |
| Warga | warga1@demo.com | demo1234 |
| Admin | admin@demo.com | demo1234 |
| Instansi Bina Marga | instansi@demo.com | demo1234 |

Akun ini hanya untuk demonstrasi pada lingkungan pengembangan.

### Jalankan aplikasi

Dari folder utama:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

Perintah tersebut menjalankan frontend dan backend bersamaan. Pastikan port 5173 serta 3000 tersedia agar alamat dan konfigurasi asal frontend sesuai.

## 5. Deploy ke Vercel

Gunakan satu repository GitHub dengan dua project Vercel: Root Directory `backend` untuk API Express dan `frontend` untuk website Vite. Konfigurasi deploy tersedia di masing-masing folder. Database dan foto tetap menggunakan Supabase yang sama.

Pada project backend, isi `NODE_ENV=production`, `DATABASE_URL`, `AUTH_SECRET`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SUPABASE_STORAGE_BUCKET` melalui Environment Variables Vercel. Gunakan koneksi Supabase dengan SSL. Untuk stack Postgres.js CIVIX, Session pooler dapat digunakan untuk menghindari keterbatasan query pipelining pada shared transaction pooler. Gunakan project Supabase yang sudah ada agar data tetap tersedia; tidak perlu seed ulang.

Pada project frontend, isi `VITE_API_BASE_URL=https://ALAMAT-BACKEND/api/v1` dengan tipe **Config**. Setelah URL frontend diketahui, sesuaikan `FRONTEND_URL` backend dengan origin frontend tersebut. Redeploy project terkait setelah mengubah variabel. Secret database dan service-role key hanya diisi di backend. `.gitignore` di root berlaku untuk kedua folder.

Uji `/health` dan `/api/v1/reports` pada backend, lalu periksa login, foto, dan sinkronisasi laporan melalui frontend. Vercel membatasi total request body unggahan menjadi 4,5 MB, sedangkan batas lokal CIVIX lebih besar. Untuk mempertahankan batas unggahan lokal penuh, alur foto perlu diubah menjadi upload langsung ke Storage menggunakan signed upload URL atau backend ditempatkan pada hosting dengan batas request lebih besar.

## 6. Progress Saat Ini

**Status per 1 November 2026:** seluruh halaman utama publik, warga, admin, dan instansi telah tersedia. Alur inti telah diimplementasikan dengan API dan database; pengujian serta penyempurnaan pengalaman penggunaan masih berlangsung.

| Bagian | Progress implementasi |
| --- | --- |
| Halaman publik | Landing page, daftar dan detail laporan, peta laporan, serta statistik. |
| Autentikasi | Pendaftaran warga, login, dan pembatasan akses sesuai peran. |
| Ruang Warga | Dashboard, formulir laporan empat tahap, riwayat dan detail laporan sendiri, peta, informasi, serta pengaturan profil dan foto akun. |
| Ruang Admin | Dashboard, antrean verifikasi, seluruh laporan, penugasan instansi, peta, statistik terpisah, pengelolaan instansi dan pengguna, serta pengaturan platform. |
| Ruang Instansi | Dashboard, daftar tugas dan laporan unit, detail tugas, penyelesaian dengan foto bukti, penolakan dengan alasan, peta, statistik, serta pengaturan unit. Setiap instansi memiliki satu akun yang dikelola admin. |
| Pelaporan dan pemantauan | Tiket laporan, foto awal, lokasi, riwayat status, catatan penanganan, dan bukti perbaikan. |
| Peta status | Penanda diterima berwarna merah, diverifikasi oranye, dalam penanganan kuning, dan selesai hijau. Masa tampil laporan selesai mengikuti pengaturan admin, dengan nilai awal tujuh hari. |
| Partisipasi publik | Dukungan dan komentar melalui detail laporan publik setelah login. |
| Data dan statistik | Ringkasan penanganan, tren bulanan, distribusi kategori, perbandingan wilayah, dan insight berbasis data laporan. |

Alur demonstrasi utama: warga membuat laporan, admin memverifikasi dan menugaskan instansi, instansi menyelesaikan dengan foto bukti, lalu warga memantau perubahan melalui detail laporan.

Beberapa kemampuan belum lengkap: halaman Lupa Kata Sandi belum terhubung ke pengiriman email dan pengujian seluruh skenario penggunaan masih berlangsung.
