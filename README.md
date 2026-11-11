# CIVIX — Platform Pelaporan Infrastruktur dan Lingkungan DKI Jakarta

**CIVIX** (Civic Infrastructure Verification & Integrated Execution) adalah aplikasi web untuk melaporkan masalah infrastruktur dan lingkungan di DKI Jakarta, mulai dari jalan rusak hingga sampah dan penerangan jalan. Warga dapat memantau perkembangan laporan, admin memverifikasi dan menugaskan laporan, sedangkan instansi menangani serta mengunggah bukti penyelesaian.

Proyek ini dikembangkan oleh tim **SWE Ball Knowledge** untuk cabang lomba **Web In Action (WIA)** dalam **Multimedia In Action (MIA) 2026**, dengan fokus **Civic Reporting & Accountability**: pelaporan warga dan keterlacakan tindak lanjut penanganan.

## Identitas Tim

**Nama tim: SWE Ball Knowledge**

| Nama | Peran |
| --- | --- |
| Ibnu Ahmad Fauzan | Ketua tim |
| Muhammad Firman Izzani | Anggota |

## Coba CIVIX

[Buka demo CIVIX di Vercel](https://civix-report.vercel.app/)

1. Buka [Peta Laporan](https://civix-report.vercel.app/map) dan pilih satu titik. Jika titik masih dikelompokkan, perbesar peta terlebih dahulu.
2. Buka detail laporan untuk melihat lokasi, foto awal, dan riwayat status. Jika tersedia, lihat juga foto bukti penyelesaian dan rincian biaya penanganan.
3. Buka [Daftar Laporan](https://civix-report.vercel.app/reports) untuk mencoba filter kategori, status, dan waktu.

Alur publik ini bisa dicoba tanpa login. Untuk mencoba alur warga, admin, dan instansi, ikuti [panduan instalasi lokal](#cara-menjalankan-secara-lokal) dan gunakan akun demo dari proses seed.

## Fitur Utama

### Halaman publik

- Beranda dengan pengantar CIVIX, ringkasan aktivitas, informasi biaya penanganan, peta, cara kerja, kategori, laporan terbaru, dan FAQ.
- Daftar laporan dengan pencarian serta filter kategori, status, dan waktu.
- Detail laporan berisi tiket, deskripsi, lokasi, foto, riwayat status, bukti hasil, dan informasi biaya jika tersedia.
- Peta interaktif dengan pengelompokan titik laporan dan penanda status.
- Statistik penanganan, tren bulanan, distribusi kategori, perbandingan wilayah, dan ringkasan biaya.
- Dukungan dan komentar pada detail laporan publik setelah login.

### Warga

- Pendaftaran, login dengan email dan kata sandi, serta login Google jika dikonfigurasi.
- Dashboard untuk melihat ringkasan dan laporan pribadi terbaru.
- Formulir pelaporan empat tahap: **Informasi → Lokasi → Foto → Tinjau**.
- Enam kategori laporan: jalan rusak, drainase, sampah, penerangan, fasilitas umum, dan lainnya.
- Penentuan lokasi melalui peta, pencarian alamat, atau lokasi perangkat, dengan validasi batas wilayah DKI Jakarta.
- Unggahan 1–3 foto, petunjuk lokasi foto jika metadata tersedia, serta kandidat laporan serupa sebelum pengiriman.
- Opsi anonim, riwayat laporan, pemantauan status, peta, informasi penggunaan, dan pengaturan profil.

### Admin

- Dashboard, antrean verifikasi, seluruh laporan, peta, dan halaman statistik.
- Pemeriksaan informasi, foto, lokasi, dan kandidat laporan serupa.
- Verifikasi, penolakan dengan alasan, penandaan duplikat, dan penugasan laporan terverifikasi kepada instansi.
- Pengelolaan instansi dan pengguna, serta pengaturan masa tampil laporan selesai pada peta publik.
- Pemantauan progres, bukti penyelesaian, dan informasi biaya penanganan.

### Instansi

- Dashboard, tugas penanganan, seluruh laporan unit, peta, statistik, dan pengaturan.
- Pencatatan pemeriksaan lapangan dan pembaruan progres penanganan.
- Penyelesaian laporan dengan catatan hasil, foto bukti, dan rincian biaya.
- Penolakan tugas dengan alasan serta koreksi biaya yang tercatat dalam riwayat revisi.
- Satu akun untuk setiap instansi, dikelola oleh admin.

## Alur Pelaporan

**Warga mengirim laporan → Admin memeriksa dan memverifikasi → Admin menugaskan instansi → Instansi menangani → Instansi melengkapi bukti dan biaya → Laporan selesai.**

Status utama laporan adalah **Diterima → Diverifikasi → Ditugaskan → Dikerjakan → Selesai**. Laporan juga dapat berstatus **Ditolak** atau **Duplikat** berdasarkan hasil pemeriksaan. Warga dapat memantau perkembangan melalui detail dan riwayat laporan.

Pada peta publik, penanda laporan diterima berwarna merah, diverifikasi oranye, ditugaskan atau dikerjakan kuning, dan selesai hijau. Laporan ditolak serta duplikat tidak ditampilkan pada daftar dan peta publik. Masa tampil laporan selesai pada peta mengikuti pengaturan admin, dengan nilai awal tujuh hari.

## Transparansi Biaya Penanganan

Saat menyelesaikan laporan, instansi mengisi catatan, mengunggah 1–3 foto bukti, dan mencatat biaya, sumber pendanaan, serta rincian penggunaannya. Biaya Rp0 berarti tidak ada biaya tambahan. Instansi dapat melengkapi laporan lama atau mengoreksi biaya dengan alasan yang tercatat dalam riwayat publik.

Rincian biaya terhubung ke detail laporan. Ringkasannya tersedia pada Beranda, Statistik Publik, Statistik Admin, dan Statistik Instansi sesuai lingkup akses. Ringkasan biaya dihitung berdasarkan tanggal penyelesaian dengan filter periode, wilayah, dan instansi sesuai halaman. Laporan selesai yang belum diisi biayanya tetap dibedakan dari laporan dengan biaya Rp0. Informasi ini merupakan pencatatan biaya penanganan oleh instansi, bukan hasil audit atau keseluruhan anggaran tahunan instansi.

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Navigasi dan pengelolaan data | React Router, TanStack Query, Zustand, Axios |
| Form dan validasi | React Hook Form, Zod |
| Peta | Leaflet, React Leaflet, Supercluster |
| Grafik | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Autentikasi | JWT, bcrypt, Google Identity Services |
| Unggah dan penyimpanan foto | Multer, Supabase Storage |
| Pemeriksaan dan pemrosesan foto | ExifReader, Sharp |

## Struktur Proyek

```text
CIVIX/
├── frontend/          # Antarmuka React, halaman publik, dan ruang kerja pengguna
├── backend/           # API Express, autentikasi, migrasi, dan data demo
├── package.json       # Perintah untuk menjalankan kedua aplikasi
└── README.md          # Pengenalan dan panduan menjalankan proyek
```

## Cara Menjalankan Secara Lokal

### Prasyarat

- Node.js 22 atau 24 beserta npm.
- Git.
- Database PostgreSQL lokal atau melalui Supabase. Siapkan database pengembangan kosong untuk mencoba migrasi dan data demo. Jika memakai PostgreSQL lokal, buat database `civix` terlebih dahulu.
- Koneksi internet untuk memuat tile peta dan layanan eksternal.

### Clone repository

```bash
git clone https://github.com/firmanizzani/CIVIX.git
cd CIVIX
```

### Instal dependensi

Jalankan dari folder utama proyek:

```bash
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

### Konfigurasi lingkungan

Salin kedua file `.env.example` dari folder utama proyek.

**Windows (PowerShell)**

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**macOS/Linux**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Isi `backend/.env` dengan konfigurasi milik lingkungan pengembangan Anda:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/civix
AUTH_SECRET=ganti-dengan-string-acak-minimal-32-karakter
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=civix-reports
```

- `DATABASE_URL`: koneksi ke database PostgreSQL yang sudah dibuat. Untuk Supabase, gunakan connection string dari project Anda.
- `AUTH_SECRET`: gunakan nilai acak untuk penandatanganan token.
- `GOOGLE_CLIENT_ID`: opsional untuk login Google bagi warga. Petunjuk konfigurasinya tersedia pada bagian deploy di bawah.
- Untuk penyimpanan foto melalui Supabase, isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, lalu buat bucket `civix-reports` yang mengizinkan pembacaan gambar melalui URL publik. Service role key hanya digunakan di backend.
- Untuk mencoba secara lokal tanpa Supabase Storage, biarkan kedua variabel Supabase tersebut kosong. Layanan unggahan akan memakai fallback data URI.
- Jangan unggah file `.env` atau kredensial pribadi ke repository.

Pertahankan nilai bawaan di `frontend/.env` agar frontend menggunakan proxy lokal Vite:

```env
VITE_API_BASE_URL=/api/v1
```

### Siapkan database dan data demo

Jalankan migrasi dari folder utama untuk menyiapkan skema database. Ulangi langkah ini setelah menarik perubahan yang menambah migrasi.

```bash
npm --prefix backend run db:migrate
```

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

- Buka [frontend CIVIX](http://localhost:5173).
- Buka [cek backend `/health`](http://localhost:3000/health). Respons `{"status":"ok","service":"civix-api"}` menunjukkan server API sudah berjalan.
- Buka [API daftar laporan](http://localhost:3000/api/v1/reports) untuk memastikan API bisa membaca data dari database. Setelah seed, daftar ini seharusnya berisi laporan demo.

Perintah tersebut menjalankan frontend dan backend bersamaan. Pastikan port 5173 serta 3000 tersedia agar alamat dan konfigurasi asal frontend sesuai.

## Deploy ke Vercel

Gunakan satu repository GitHub dengan dua project Vercel: Root Directory `backend` untuk API Express dan `frontend` untuk website Vite. Konfigurasi deploy tersedia di masing-masing folder. Database dan foto tetap menggunakan Supabase yang sama.

Pada project backend, isi `NODE_ENV=production`, `DATABASE_URL`, `AUTH_SECRET`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SUPABASE_STORAGE_BUCKET` melalui Environment Variables Vercel. Gunakan koneksi Supabase dengan SSL. Untuk stack Postgres.js CIVIX, Session pooler dapat digunakan untuk menghindari keterbatasan query pipelining pada shared transaction pooler. Gunakan project Supabase yang sudah ada agar data tetap tersedia; tidak perlu seed ulang.

Pada project frontend, isi `VITE_API_BASE_URL=https://ALAMAT-BACKEND/api/v1` melalui Environment Variables. Setelah URL frontend diketahui, sesuaikan `FRONTEND_URL` backend dengan origin frontend tersebut. Redeploy project terkait setelah mengubah variabel. Secret database dan service-role key hanya diisi di backend. `.gitignore` di root berlaku untuk kedua folder.

Untuk mengaktifkan **Masuk dengan Google** bagi Warga, buat OAuth Client ID bertipe **Web application** di Google Auth Platform. Tambahkan origin frontend yang dipakai (misalnya `http://localhost:5173` dan domain CIVIX) ke **Authorized JavaScript origins**, lalu isi Client ID di `GOOGLE_CLIENT_ID` pada backend. Alur popup menerima token melalui callback JavaScript. Jalankan migrasi database sebelum mengaktifkan fitur. Warga yang sudah punya akun bisa menautkan Google dari **Pengaturan**, dengan kata sandi CIVIX dan email yang sama. [Panduan setup Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

Uji `/health` dan `/api/v1/reports` pada backend, lalu periksa login, foto, dan sinkronisasi laporan melalui frontend. Vercel membatasi total request body unggahan menjadi 4,5 MB, sedangkan batas lokal CIVIX lebih besar. Untuk mempertahankan batas unggahan lokal penuh, alur foto perlu diubah menjadi upload langsung ke Storage menggunakan signed upload URL atau backend ditempatkan pada hosting dengan batas request lebih besar.

## Catatan Penggunaan

- Cakupan pelaporan dibatasi pada wilayah DKI Jakarta. Data dan akun hasil seed disediakan untuk demonstrasi alur aplikasi.
- Petunjuk kesesuaian lokasi foto dan kandidat laporan serupa membantu pemeriksaan; keputusan verifikasi tetap dilakukan oleh admin. Foto tanpa metadata lokasi tetap dapat dikirim.
- Peta dasar, pencarian alamat, penyimpanan foto, dan login Google bergantung pada layanan serta konfigurasi terkait.

## Sumber Data Wilayah

Batas lokasi CIVIX memakai enam poligon kota/kabupaten DKI Jakarta dari [OCHA ROAP / HDX](https://data.humdata.org/dataset/cod-ab-idn) melalui [geoBoundaries gbHumanitarian](https://www.geoboundaries.org/api.html), ADM2 tahun 2019, dengan lisensi [CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/). CIVIX mengambil fitur Jakarta dari dataset dan membulatkan koordinat ke tujuh desimal.
