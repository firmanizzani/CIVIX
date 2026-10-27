# CIVIX — Platform Laporan Infrastruktur DKI Jakarta

**CIVIX** (Civic Infrastructure Verification & Integrated Execution) adalah platform civic technology untuk pelaporan, pemantauan, verifikasi, dan tindak lanjut permasalahan infrastruktur serta lingkungan di DKI Jakarta.

Platform ini memungkinkan warga melaporkan masalah infrastruktur, admin memverifikasi laporan, instansi menangani laporan yang ditugaskan, dan masyarakat memantau progres penanganan secara transparan.

---

## Fitur Utama

### Warga
- Membuat laporan permasalahan (foto, lokasi, kategori)
- Melacak status laporan dengan kode tiket unik
- Melihat peta laporan publik dengan status berwarna (merah/kuning/hijau)
- Memberikan dukungan (upvote) dan komentar pada laporan
- Dashboard pribadi untuk melihat semua laporan yang dikirim

### Admin
- Verifikasi laporan baru dari warga
- Menolak atau menandai laporan duplikat
- Menugaskan laporan terverifikasi ke instansi terkait
- Melihat statistik dan dashboard administrasi

### Instansi
- Menerima laporan yang ditugaskan
- Memperbarui progres penanganan dengan catatan
- Mengunggah foto bukti penyelesaian
- Dashboard tugas instansi

### Fitur Publik
- Peta interaktif DKI Jakarta dengan penanda laporan (titik hijau hilang 7 hari setelah selesai sesuai PRD)
- Daftar laporan publik (filter kategori, status, wilayah)
- Detail laporan dengan timeline status transparan
- Statistik penanganan: tren, sebaran kategori, insight otomatis
- Pelacakan laporan dengan kode tiket tanpa login

---

## Teknologi

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** untuk styling
- **shadcn/ui** komponen dasar
- **React Router** navigasi
- **TanStack Query** server state
- **Zustand** client state
- **React Hook Form** + **Zod** validasi
- **Leaflet** + **React Leaflet** peta interaktif
- **Recharts** visualisasi statistik

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Drizzle ORM** akses database
- **PostgreSQL** database (Supabase)
- **JWT** autentikasi
- **Multer** upload foto
- **Supabase Storage** penyimpanan foto
- **Zod** validasi request

### Database
- **PostgreSQL** (via Supabase)
- Migrasi dengan **Drizzle Kit**
- Seeding data demo

---

## Struktur Project

```
civix/
├── backend/                # Backend Express + TypeScript
│   ├── src/
│   │   ├── config/         # Konfigurasi (JWT, Supabase)
│   │   ├── db/             # Schema Drizzle + migrasi
│   │   ├── middleware/     # Auth, role guard
│   │   ├── modules/        # Modul API (auth/reports/admin/agency/stats/uploads)
│   │   ├── utils/          # Helper (ticket, geo validation)
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Server entry
│   ├── drizzle/            # Migrasi database
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/               # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Komponen UI (Navbar, Footer, ProtectedRoute)
│   │   ├── pages/          # Halaman (Landing, Auth, Dashboard, Map, dll)
│   │   ├── lib/            # Utils, API client
│   │   ├── stores/         # Zustand (authStore)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── App.tsx         # Routing
│   │   └── main.tsx        # Entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── docs/                   # Dokumentasi tambahan (opsional)
├── schema.sql              # Referensi SQL original
├── PRD_CIVIX.md            # Product Requirements Document
├── .gitignore
├── package.json            # Root workspace
└── README.md               # File ini
```

---

## Instalasi & Menjalankan Project

### Prasyarat
- **Node.js** 18+ dan **npm**
- **PostgreSQL** lokal atau akun **Supabase**
- **Git**

### 1. Clone Repository

```bash
git clone <repository-url>
cd civix
```

### 2. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Setup Database (Supabase)

1. Buat project baru di [Supabase](https://supabase.com)
2. Salin **Database URL** dari Settings → Database → Connection String (URI mode)
3. Buat bucket storage bernama `civix-reports` di Supabase Storage (Public atau dengan policy yang sesuai)

### 4. Konfigurasi Environment Variables

#### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
AUTH_SECRET=ganti-dengan-string-acak-minimal-32-karakter
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_STORAGE_BUCKET=civix-reports
```

**Catatan:**
- `AUTH_SECRET`: Generate string acak 32+ karakter untuk JWT signing
- `DATABASE_URL`: Salin dari Supabase Connection String
- `SUPABASE_SERVICE_ROLE_KEY`: Salin dari Supabase Settings → API → service_role key (JANGAN commit ke Git!)

#### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=/api/v1
```

Saat development, Vite akan proxy `/api` ke `http://localhost:3000` (sudah dikonfigurasi di `vite.config.ts`).

### 5. Migrasi Database

```bash
cd backend
npm run db:generate   # Generate migrasi dari schema
npm run db:migrate    # Jalankan migrasi ke database
```

### 6. (Opsional) Seed Data Demo

```bash
cd backend
npm run db:seed
```

Seed akan membuat:
- Beberapa region DKI Jakarta
- User demo (warga, admin, instansi)
- Laporan demo dengan berbagai status
- Timeline status

### 7. Jalankan Development Server

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend berjalan di `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend berjalan di `http://localhost:5173`

**Atau jalankan keduanya sekaligus dari root:**
```bash
npm run dev
```

---

## Akun Demo (Setelah Seeding)

| Role | Unit / Instansi | Email | Password |
|------|---------------|-------|----------|
| Warga | Warga Demo 1 | warga1@demo.com | demo1234 |
| Warga | Warga Demo 2 | warga2@demo.com | demo1234 |
| Admin | Admin CIVIX | admin@demo.com | demo1234 |
| Instansi | Dinas Bina Marga Provinsi DKI Jakarta | instansi@demo.com | demo1234 |
| Instansi | Dinas Sumber Daya Air Provinsi DKI Jakarta | air@demo.com | demo1234 |
| Instansi | Dinas Lingkungan Hidup Provinsi DKI Jakarta | lingkungan@demo.com | demo1234 |
| Instansi | Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta | penerangan@demo.com | demo1234 |

---

## Build untuk Production

### Frontend
```bash
cd frontend
npm run build
```
Output: `frontend/dist/`

### Backend
```bash
cd backend
npm run build
```
Output: `backend/dist/`

---

## Deployment

### Frontend → Vercel

1. Push project ke GitHub
2. Import project di Vercel
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Tambahkan environment variables:
   - `VITE_API_BASE_URL=https://your-backend.railway.app/api/v1`

### Backend → Railway / Render

#### Railway:
1. Create new project → Deploy from GitHub
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm start`
5. Tambahkan semua environment variables dari `backend/.env.example`

#### Render:
1. New Web Service → Connect Repository
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Tambahkan environment variables di dashboard

### Database → Supabase
Database sudah hosted di Supabase. Pastikan connection string production benar.

---

## API Endpoints (Ringkasan)

### Public
- `GET /api/v1/reports` - Daftar laporan publik
- `GET /api/v1/reports/map` - Data peta (titik hijau 7 hari)
- `GET /api/v1/reports/track/:kodeTiket` - Lacak tiket
- `GET /api/v1/reports/:id` - Detail laporan
- `GET /api/v1/stats/overview` - Statistik ringkasan
- `GET /api/v1/stats/trend` - Tren mingguan
- `GET /api/v1/stats/regions` - Perbandingan wilayah
- `GET /api/v1/stats/category` - Sebaran kategori + insight

### Auth
- `POST /api/v1/auth/register` - Daftar (warga)
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - User info

### Warga (Protected)
- `GET /api/v1/me/reports` - Laporan milik user
- `POST /api/v1/reports` - Buat laporan (multipart: foto, data)
- `POST /api/v1/reports/:id/upvote` - Toggle upvote
- `POST /api/v1/reports/:id/comments` - Tambah komentar

### Admin (Protected)
- `GET /api/v1/admin/dashboard` - Statistik admin
- `GET /api/v1/admin/reports` - Semua laporan
- `POST /api/v1/admin/reports/:id/verify` - Verifikasi
- `POST /api/v1/admin/reports/:id/reject` - Tolak (wajib alasan)
- `POST /api/v1/admin/reports/:id/duplicate` - Tandai duplikat
- `POST /api/v1/admin/reports/:id/assign` - Tugaskan ke instansi

### Instansi (Protected)
- `GET /api/v1/agency/dashboard` - Dashboard instansi
- `GET /api/v1/agency/assignments` - Daftar tugas
- `GET /api/v1/agency/assignments/:id` - Detail tugas
- `POST /api/v1/agency/assignments/:id/progress` - Update progres
- `POST /api/v1/agency/assignments/:id/complete` - Selesaikan (wajib foto bukti)

Dokumentasi API lengkap: Lihat kode di `backend/src/modules/*/routes.ts`

---

## Fitur Sesuai PRD

✅ **F1**: Warga buat laporan dengan foto dan lokasi  
✅ **F2**: Kode tiket unik otomatis (`LPR-YYYY-XXXXX`)  
✅ **F3**: Admin verifikasi/tolak/duplikat  
✅ **F4**: Timeline status publik  
✅ **F5**: Pelacakan lewat kode tiket  
✅ **F6**: Peta interaktif dengan filter  
✅ **F7**: Instansi upload bukti perbaikan  
✅ **F8**: Upvote dan komentar  
✅ **F9**: Dashboard statistik + insight otomatis  
✅ **F12**: Titik peta merah/kuning/hijau; hijau hilang 7 hari setelah selesai  
✅ **F13**: Validasi wilayah DKI Jakarta di backend + frontend  

---

## Catatan Penting

### 1. Database Credentials
- Jangan commit `.env` ke Git
- Gunakan `.env.example` untuk template
- `DATABASE_URL` harus PostgreSQL connection string valid

### 2. Migrasi Tertunda
Jika migrasi belum dijalankan karena kredensial DB lokal:
1. Siapkan `DATABASE_URL` yang benar di `backend/.env`
2. Jalankan `npm run db:migrate` dari folder backend
3. (Opsional) Jalankan `npm run db:seed` untuk data demo

### 3. Upload Foto
- Tanpa Supabase Storage: foto dikembalikan sebagai data URI (fallback)
- Dengan Supabase Storage: foto disimpan di bucket `civix-reports`
- Maksimal 3 foto per laporan, 5MB per foto

### 4. Validasi DKI Jakarta
Backend menolak laporan di luar batas DKI Jakarta:
- Lat: -6.38 s.d -5.2 (termasuk Kepulauan Seribu)
- Lng: 106.68 s.d 106.98

### 5. Peta Status (PRD 5.4)
- **Merah**: `diterima`, `diverifikasi` (baru dilaporkan)
- **Kuning**: `ditugaskan`, `dikerjakan` (sedang diproses)
- **Hijau**: `selesai` (hanya tampil 7 hari dari `selesai_pada`, lalu otomatis hilang dari peta tetapi tetap di database)
- **Tidak tampil**: `ditolak`, `duplikat`

---

## Troubleshooting

### Backend tidak start
- Cek `DATABASE_URL` di `backend/.env`
- Pastikan PostgreSQL berjalan atau Supabase project aktif
- Jalankan migrasi: `cd backend && npm run db:migrate`

### Frontend blank / CORS error
- Pastikan backend berjalan di `http://localhost:3000`
- Cek `FRONTEND_URL` di `backend/.env`
- Cek proxy di `frontend/vite.config.ts`

### Upload foto gagal
- Cek `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- Pastikan bucket `civix-reports` ada dan policy-nya benar
- Fallback: foto akan dikembalikan sebagai data URI (base64)

### Peta tidak muncul
- Cek console browser untuk error Leaflet
- Pastikan endpoint `/api/v1/reports/map` return data valid
- Koordinat harus number, bukan string (backend sudah handle)

---

## Kontribusi & Pengembangan

- Baca PRD: `PRD_CIVIX.md`
- Ikuti struktur folder yang ada
- TypeScript strict mode di frontend, non-strict di backend (Drizzle ORM typing issue)
- Frontend typecheck pass 100%, backend build berjalan runtime
- Gunakan shadcn/ui untuk komponen baru
- Commit message jelas dan deskriptif

---

## Lisensi

Project ini dibuat untuk **Lomba Web In Action 2026 (Multimedia In Action)** dengan tema **Civic Technology**.

---

## Kontak & Support

Untuk pertanyaan terkait project, hubungi tim pengembang atau buka issue di repository.

**CIVIX** — Laporan Warga, Aksi Nyata untuk Kota.
