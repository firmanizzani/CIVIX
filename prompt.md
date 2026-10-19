# MASTER PROMPT — CIVIX
## Platform Pelaporan Infrastruktur dan Lingkungan
### Civic Infrastructure Verification & Integrated Execution
### Web In Action 2026

## 1. GAMBARAN UMUM PROYEK

Bangun aplikasi web full-stack bernama **CIVIX (Civic Infrastructure Verification & Integrated Execution)** berdasarkan dokumen Product Requirements Document (PRD) berikut:

**PRD – Platform Pelaporan Infrastruktur & Lingkungan (Web In Action 2026).**

CIVIX merupakan platform pelaporan dan akuntabilitas publik yang memungkinkan warga melaporkan kerusakan infrastruktur dan masalah lingkungan, memantau proses penanganan laporan, serta melihat transparansi kinerja penanganan oleh instansi terkait.

Platform ini berfokus secara eksklusif pada wilayah **DKI Jakarta**, yang mencakup lima kota administrasi dan Kabupaten Administrasi Kepulauan Seribu.

Alur utama aplikasi harus berfungsi secara menyeluruh:

**Warga Membuat Laporan → Admin Memverifikasi → Admin Menugaskan Instansi → Instansi Memperbarui Progres → Instansi Mengunggah Bukti Perbaikan → Publik Melacak Laporan → Sistem Menampilkan Statistik.**

Jangan hanya membuat landing page statis atau kumpulan halaman dengan tampilan menarik tetapi tidak saling terhubung.

Bangun aplikasi yang memiliki frontend, backend, database, autentikasi, otorisasi, penyimpanan foto, peta interaktif, dashboard, dan alur bisnis yang benar-benar terintegrasi.

Aplikasi ini akan digunakan sebagai proyek kompetisi Web In Action 2026. Prioritaskan fungsionalitas, kualitas desain, transparansi, data demo yang realistis, keamanan dasar, dan kelancaran demonstrasi.

Jadikan PRD sebagai acuan utama. Jangan menambahkan fitur yang tidak relevan atau memperluas ruang lingkup secara berlebihan.

---

## 2. PRINSIP PENGEMBANGAN

Ikuti prinsip berikut selama proses pengembangan:

1. Periksa struktur proyek, kode yang sudah tersedia, dependensi, dan konfigurasi sebelum melakukan perubahan.
2. Jika proyek sudah memiliki kode, pertahankan fungsi dan struktur yang masih relevan. Jangan membangun ulang seluruh aplikasi tanpa alasan yang jelas.
3. Kerjakan proyek secara bertahap dan pastikan setiap tahap menghasilkan fungsi yang dapat digunakan.
4. Prioritaskan fitur P0 sebelum fitur P1 dan P2 sesuai PRD.
5. Gunakan database untuk menyimpan data aplikasi secara persisten, bukan array hardcoded sebagai sumber data utama.
6. Siapkan data demo yang realistis untuk kebutuhan demonstrasi lomba.
7. Implementasikan autentikasi dan otorisasi berbasis peran di sisi server.
8. Terapkan validasi input di frontend dan backend.
9. Gunakan kode yang modular, mudah dibaca, konsisten, dan mudah dipelihara.
10. Hindari abstraksi yang tidak diperlukan, dependensi berlebihan, dan arsitektur yang terlalu kompleks.
11. Jangan menggunakan Docker maupun Docker Compose.
12. Jangan mengintegrasikan sistem pemerintah yang sesungguhnya atau payment gateway.
13. Jangan mengklaim suatu fitur berhasil sebelum operasi terkait benar-benar berhasil.
14. Jangan menggunakan statistik palsu yang seolah-olah merupakan data resmi pemerintah.
15. Jangan membiarkan tombol, formulir, navigasi, filter, atau kontrol dashboard yang penting tidak berfungsi.
16. Jangan berhenti setelah membuat frontend. Lanjutkan hingga backend, database, dan alur utama terintegrasi.
17. Jika terdapat keterbatasan layanan eksternal, implementasikan bagian yang dapat dikerjakan dan dokumentasikan kebutuhan yang belum terpenuhi.

Sebelum menulis kode, periksa PRD dan repository, kemudian buat rencana implementasi singkat. Setelah itu, langsung mulai pengerjaan tanpa menunggu persetujuan untuk keputusan teknis yang wajar.

---

## 3. TEKNOLOGI YANG DIGUNAKAN

Gunakan stack berikut secara konsisten.

### Frontend

- React dengan Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui untuk komponen antarmuka.
- React Router untuk navigasi.
- TanStack Query untuk pengelolaan data dari server, caching, mutasi, dan pembaruan data.
- Zustand untuk state global di sisi klien yang memang diperlukan.
- React Hook Form untuk pengelolaan formulir.
- Zod untuk validasi data.
- Recharts untuk visualisasi statistik.
- Leaflet dan React Leaflet untuk peta interaktif.
- Lucide React untuk ikon.
- Library tanggal yang sesuai untuk pemformatan waktu.

### Backend

- Node.js.
- Express.js.
- TypeScript.
- REST API.
- Zod untuk validasi request.
- JWT untuk autentikasi.
- Argon2 atau bcrypt untuk hashing password.
- Middleware autentikasi dan otorisasi.
- Middleware penanganan error terpusat.
- Rate limiting untuk endpoint yang rentan disalahgunakan.

### Database dan ORM

- PostgreSQL melalui Supabase.
- Drizzle ORM untuk schema, query, relasi, dan migrasi database.
- Environment variables untuk kredensial.
- Database transaction untuk operasi yang membutuhkan konsistensi data.

### Penyimpanan Foto

- Supabase Storage untuk foto laporan awal dan bukti perbaikan.
- Gunakan pengaturan akses penyimpanan yang sesuai dengan kebutuhan privasi.
- Validasi tipe MIME, ekstensi, ukuran, dan izin unggah file.
- Kompres atau ubah ukuran gambar di sisi klien jika memungkinkan.
- Pastikan file sensitif tidak dapat diakses oleh pengguna yang tidak berwenang.

### Deployment

- Frontend di Vercel.
- Backend di platform yang mendukung Node.js, misalnya Railway, Render, atau layanan sejenis.
- PostgreSQL dan penyimpanan foto menggunakan Supabase.

Jangan menggunakan Docker.

Frontend dan backend harus memiliki konfigurasi URL yang sesuai dengan lingkungan deployment masing-masing. Gunakan environment variables untuk URL API dan konfigurasi CORS.

Jika repository yang sudah ada menggunakan stack lain yang masih kompatibel, periksa terlebih dahulu dan pertahankan arsitektur yang masuk akal. Jika memulai dari nol, gunakan stack yang telah ditentukan di atas.

---

## 4. STRUKTUR PROYEK

Pisahkan frontend dan backend agar pengembangan dan pemeliharaan lebih mudah.

Gunakan struktur yang direkomendasikan berikut:

```text
civix/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── reports/
│   │   │   ├── map/
│   │   │   ├── dashboard/
│   │   │   └── forms/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── citizen/
│   │   │   ├── admin/
│   │   │   └── agency/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── jobs/
│   │   └── app.ts
│   ├── drizzle/
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── database-erd.md
│   ├── api-documentation.md
│   └── demo-guide.md
├── .gitignore
├── .env.example
└── README.md
```

Struktur tersebut merupakan panduan, bukan kewajiban untuk membuat file yang tidak diperlukan.

Pisahkan pemanggilan API ke modul service frontend. Letakkan business logic pada service backend, bukan seluruhnya di dalam route handler.

---

## 5. DESAIN UI/UX DAN IDENTITAS VISUAL

Buat CIVIX sebagai platform civic technology yang modern, profesional, terpercaya, bersih, dan mudah digunakan.

### Arah desain

Desain harus mencerminkan:

- Kepercayaan publik.
- Transparansi.
- Akuntabilitas.
- Pemantauan infrastruktur perkotaan.
- Partisipasi masyarakat.
- Pengambilan keputusan berbasis data.

Gunakan layout editorial dashboard dengan hierarki informasi yang jelas, spacing yang konsisten, tipografi yang mudah dibaca, garis batas yang halus, dan bayangan yang tidak berlebihan.

Hindari desain dashboard generik hasil AI, gradien berlebihan, glassmorphism yang tidak diperlukan, dekorasi besar yang tidak mendukung fungsi, serta penggunaan kartu dengan sudut terlalu membulat secara berlebihan.

### Palet warna

Gunakan latar belakang netral dengan teks yang kontras dan warna utama seperti deep teal atau forest green.

Warna status harus konsisten:

- Merah: laporan baru diterima atau menunggu verifikasi.
- Kuning/amber: laporan telah ditugaskan atau sedang ditangani.
- Hijau: laporan selesai.
- Abu-abu: status ditolak, duplikat, atau status nonaktif yang sesuai.

Jangan menggunakan warna sebagai satu-satunya penanda status. Sertakan label teks dan legenda yang jelas.

### Tipografi

Gunakan font sans-serif yang bersih, misalnya Inter atau alternatif yang setara.

Atur hierarki yang konsisten untuk judul halaman, heading, isi teks, label formulir, metadata, status, tabel, dan angka statistik.

### Layout aplikasi

Buat layout terpisah untuk:

1. Halaman publik.
2. Halaman warga yang sudah login.
3. Dashboard admin.
4. Dashboard instansi.

Halaman publik menggunakan navbar dan footer yang konsisten.

Dashboard admin dan instansi menggunakan sidebar, top navigation, judul halaman, breadcrumb jika diperlukan, serta area konten utama.

Pada perangkat mobile, sidebar harus berubah menjadi navigasi mobile yang tetap mudah digunakan.

### Kualitas interaksi

Implementasikan:

- Loading state.
- Skeleton loader jika diperlukan.
- Empty state.
- Error message.
- Notifikasi sukses.
- Dialog konfirmasi untuk tindakan penting.
- Disabled state selama proses berlangsung.
- Pagination untuk daftar panjang.
- Label dan pesan validasi formulir.
- Navigasi keyboard dan focus state yang jelas.

**Seluruh teks yang ditampilkan kepada pengguna harus menggunakan Bahasa Indonesia.**

Nama library, variabel kode, identifier database, endpoint API, dan penamaan internal boleh tetap menggunakan Bahasa Inggris.

---

## 6. ROLE DAN HAK AKSES

Implementasikan tiga peran pengguna.

### A. Warga

Warga dapat:

- Mendaftar dan login.
- Membuat laporan kerusakan infrastruktur.
- Mengunggah foto laporan.
- Menentukan lokasi laporan.
- Memilih opsi laporan anonim.
- Melihat laporan miliknya sendiri.
- Melacak laporan menggunakan kode tiket.
- Memberikan komentar pada laporan publik.
- Memberikan upvote pada laporan.
- Melihat peta dan statistik publik.

Warga tidak boleh mengubah keputusan verifikasi admin atau progres instansi secara langsung.

### B. Admin

Admin dapat:

- Mengakses dashboard admin.
- Melihat antrean verifikasi.
- Memeriksa detail laporan, foto, dan lokasi.
- Menerima atau memverifikasi laporan.
- Menolak laporan dengan alasan wajib.
- Menandai laporan sebagai duplikat.
- Menghubungkan laporan duplikat dengan laporan asli jika tersedia.
- Menugaskan laporan kepada instansi.
- Memantau progres dan bukti perbaikan.
- Melihat statistik pengelolaan.
- Mengakses riwayat perubahan status.

### C. Instansi

Instansi dapat:

- Login ke dashboard instansi.
- Melihat laporan yang ditugaskan kepada instansinya.
- Membuka detail laporan.
- Memperbarui status penanganan sesuai alur yang diizinkan.
- Menambahkan catatan penanganan.
- Mengunggah bukti perbaikan.
- Menandai laporan selesai jika persyaratan penyelesaian terpenuhi.

Instansi tidak boleh memperbarui laporan yang ditugaskan kepada instansi lain, kecuali terdapat otorisasi khusus.

### Ketentuan otorisasi

Implementasikan route guard di frontend dan middleware otorisasi di backend.

Route guard frontend hanya membantu pengalaman pengguna dan bukan mekanisme keamanan utama.

Setiap endpoint terlindungi harus memeriksa identitas pengguna dan peran yang diperlukan.

Jangan mengizinkan eskalasi hak akses melalui request body atau perubahan role saat registrasi.

Endpoint publik hanya boleh mengembalikan data yang memang boleh dilihat publik.

Jangan pernah mengirim password hash, token, informasi kontak pribadi, atau data administratif internal melalui respons publik.

---

## 7. AUTENTIKASI

Buat halaman:

- Login.
- Registrasi warga.
- Akses ditolak.
- Halaman tidak ditemukan.

### Registrasi

Formulir berisi:

- Nama lengkap.
- Email.
- Password.
- Konfirmasi password.

Validasi format email dan persyaratan password.

Endpoint registrasi publik hanya boleh membuat akun dengan role warga. Akun admin dan instansi harus dibuat melalui proses seeding atau mekanisme administratif yang terlindungi.

### Login

Sediakan:

- Email.
- Password.
- Tombol untuk menampilkan atau menyembunyikan password.
- Loading state.
- Pesan error.
- Pengalihan ke halaman sesuai role.

### Keamanan sesi

Gunakan implementasi JWT yang memperhatikan keamanan.

Utamakan access token berumur pendek dan mekanisme refresh melalui cookie HttpOnly yang aman apabila sesuai dengan arsitektur aplikasi.

Terapkan pengaturan cookie, pembatasan CORS, perlindungan CSRF jika diperlukan, dan rotasi atau invalidasi token yang sesuai.

Jangan menyimpan password dalam bentuk teks biasa.

Jangan mengekspos JWT secret ke frontend.

Seluruh secret harus disimpan melalui environment variables.

---

## 8. HALAMAN PUBLIK

### 8.1 Beranda

Buat landing page yang menarik dan menjelaskan tujuan CIVIX.

Bagian yang harus tersedia:

1. Navbar.
2. Hero section dengan headline dan deskripsi yang jelas.
3. Tombol utama "Buat Laporan".
4. Tombol sekunder "Lacak Laporan".
5. Ringkasan statistik dari backend.
6. Daftar laporan terbaru.
7. Pratinjau peta laporan.
8. Bagian "Cara Kerja".
9. Bagian transparansi dan akuntabilitas.
10. Footer berisi informasi dan navigasi.

Gunakan headline:

"Laporkan Masalah di Sekitarmu. Pantau Perubahannya."

Deskripsi:

"CIVIX membantu warga Jakarta melaporkan masalah infrastruktur dan lingkungan, sekaligus memantau proses penanganannya secara transparan."

Statistik harus bersumber dari backend. Jika menggunakan data demo, berikan penanda bahwa data tersebut merupakan data demonstrasi, bukan statistik resmi pemerintah.

### 8.2 Peta Laporan

Buat halaman peta interaktif khusus.

Persyaratan:

- Menggunakan Leaflet dan OpenStreetMap.
- Memusatkan peta pada wilayah DKI Jakarta.
- Membatasi pemilihan lokasi laporan pada batas wilayah DKI Jakarta.
- Menampilkan laporan publik sebagai titik lingkaran.
- Menggabungkan marker yang berdekatan melalui clustering.
- Menyediakan filter kategori.
- Menyediakan filter status.
- Menyediakan filter wilayah administratif.
- Menampilkan legenda warna.
- Menampilkan popup ketika marker diklik.
- Menyediakan tautan ke detail laporan.

Isi popup:

- Judul laporan.
- Kategori.
- Status.
- Tanggal laporan.
- Thumbnail jika tersedia untuk publik.
- Tautan detail laporan.

Aturan warna marker:

- Merah untuk `DITERIMA` dan `DIVERIFIKASI`.
- Kuning untuk `DITUGASKAN` dan `DALAM_PENGERJAAN`.
- Hijau untuk `SELESAI` selama masih berada dalam periode tampilan tujuh hari.

Laporan ditolak dan duplikat tidak boleh ditampilkan di peta publik.

Laporan selesai harus menghilang dari hasil peta setelah tujuh hari, tetapi tetap dapat diakses melalui pelacakan tiket dan tetap dihitung dalam statistik historis.

Jadikan periode tujuh hari sebagai konfigurasi backend yang dapat diubah, bukan nilai yang disalin ke banyak komponen frontend.

Validasi wilayah harus menggunakan data batas administratif yang terverifikasi. Membatasi tampilan peta secara visual saja tidak cukup.

### 8.3 Daftar Laporan

Buat halaman daftar laporan yang dapat dicari dan difilter.

Fitur:

- Pencarian berdasarkan judul atau kode tiket sesuai hak akses.
- Filter kategori.
- Filter status.
- Filter wilayah.
- Pengurutan berdasarkan laporan terbaru dan jumlah dukungan.
- Pagination.

Setiap kartu laporan menampilkan:

- Judul.
- Kategori.
- Status.
- Wilayah.
- Tanggal laporan.
- Thumbnail.
- Jumlah upvote.
- Tautan detail.

Jangan menampilkan identitas pelapor anonim.

### 8.4 Detail Laporan

Tampilkan:

- Kode tiket.
- Judul.
- Kategori.
- Deskripsi.
- Foto awal.
- Lokasi dan wilayah administratif.
- Status saat ini.
- Tanggal laporan.
- Timeline penanganan.
- Catatan penanganan yang boleh dilihat publik.
- Informasi penugasan instansi jika layak dipublikasikan.
- Foto bukti perbaikan.
- Tombol upvote.
- Bagian komentar.

Timeline harus berasal dari data riwayat status yang tersimpan di database, bukan data statis.

Informasi pribadi pelapor tidak boleh ditampilkan.

Untuk laporan anonim, gunakan label seperti "Pelapor Anonim".

### 8.5 Lacak Laporan

Buat halaman pelacakan laporan yang terpisah.

Pengguna memasukkan kode tiket, misalnya:

`LPR-2026-00123`

Backend mengambil laporan dan informasi pelacakan yang boleh dilihat publik.

Tampilkan:

- Kode tiket.
- Judul laporan.
- Status saat ini.
- Tanggal pengiriman.
- Waktu pembaruan terakhir.
- Wilayah administratif.
- Timeline status.
- Catatan penanganan publik.
- Bukti perbaikan jika tersedia.

Jika kode tiket tidak ditemukan, tampilkan pesan yang jelas.

Jangan menampilkan kontak pribadi, catatan internal yang tidak boleh dipublikasikan, atau informasi sensitif lainnya.

### 8.6 Statistik

Buat dashboard statistik publik dengan:

Kartu ringkasan:

- Total laporan.
- Persentase penyelesaian.
- Rata-rata waktu penyelesaian.
- Jumlah laporan yang menunggu penanganan.

Grafik:

- Tren laporan mingguan atau bulanan.
- Jumlah laporan berdasarkan kategori.
- Jumlah laporan berdasarkan wilayah.
- Performa penyelesaian tiap wilayah.
- Jumlah laporan belum tertangani per wilayah.

Bagian tambahan:

- Insight otomatis.
- Kategori dengan laporan terbanyak.
- Wilayah dengan antrean laporan tertinggi.
- Peringkat kinerja wilayah.
- Rekomendasi prioritas penanganan.
- Filter rentang tanggal, kategori, dan wilayah jika memungkinkan.

Setiap grafik harus memiliki judul, label yang jelas, dan satu kalimat insight dalam Bahasa Indonesia.

Semua angka harus dihitung dari database. Jangan membuat angka acak di frontend.

Tetapkan definisi perhitungan secara konsisten. Misalnya, rata-rata waktu penyelesaian hanya menggunakan laporan selesai yang memiliki waktu pengiriman dan penyelesaian valid.

Jika data tidak cukup, tampilkan kondisi data belum tersedia daripada membuat insight palsu.

### 8.7 Tentang CIVIX

Jelaskan:

- Misi platform.
- Kategori laporan yang didukung.
- Alur pelaporan dan verifikasi.
- Arti warna status peta.
- Cakupan wilayah DKI Jakarta.
- Pentingnya transparansi dan akuntabilitas pelayanan publik.

Jelaskan bahwa CIVIX merupakan platform pelaporan dan pemantauan, bukan pengganti layanan darurat resmi.

---

## 9. HALAMAN WARGA

### 9.1 Buat Laporan

Buat formulir pelaporan yang responsif, mudah digunakan, dan dapat diselesaikan dengan cepat.

Kolom formulir:

- Judul laporan.
- Kategori.
- Deskripsi masalah.
- Satu hingga tiga foto.
- Lokasi laporan.
- Wilayah administratif.
- Pilihan laporan anonim.

Kategori laporan:

1. Jalan Rusak.
2. Drainase/Banjir.
3. Sampah.
4. Penerangan Jalan.
5. Fasilitas Umum.
6. Lainnya.

### Pemilihan lokasi

- Pengguna dapat memilih lokasi dengan mengeklik peta.
- Dukung browser geolocation jika izin diberikan.
- Sediakan pemilihan lokasi manual sebagai alternatif.
- Tampilkan koordinat dan wilayah yang dipilih.
- Izinkan pengguna mengoreksi posisi pin sebelum mengirim laporan.

### Validasi DKI Jakarta

Terapkan dua lapis validasi:

1. Validasi frontend untuk memberikan umpan balik cepat.
2. Validasi backend sebagai pemeriksaan final sebelum laporan disimpan.

Jangan hanya mengandalkan batas tampilan peta atau koordinat dari browser.

Gunakan dataset batas administratif DKI Jakarta yang terverifikasi atau metode validasi spasial yang sesuai.

Jika menggunakan PostGIS, siapkan ekstensi dan query spasial yang diperlukan. Jika menggunakan point-in-polygon, gunakan dataset batas wilayah yang terverifikasi di server.

Pastikan validasi mencakup Kepulauan Seribu.

Jika validasi wilayah gagal, jangan menerima laporan secara diam-diam. Kembalikan pesan error yang menjelaskan masalahnya.

Laporan di luar DKI Jakarta harus ditolak dan tidak boleh masuk ke antrean verifikasi admin.

### Pengelolaan foto

- Minimum satu foto.
- Maksimum tiga foto.
- Validasi format gambar.
- Batasi ukuran file.
- Kompres gambar jika memungkinkan.
- Tampilkan pratinjau foto.
- Sediakan fungsi menghapus atau mengganti foto.
- Lakukan unggahan melalui alur yang terotorisasi.
- Cegah manipulasi path file dan akses tanpa izin.

### Deteksi duplikat

Sebelum laporan dikirim, periksa kemungkinan laporan serupa berdasarkan:

- Kedekatan koordinat.
- Kategori yang sama.
- Status laporan yang masih relevan.

Tampilkan peringatan jika ditemukan laporan yang mungkin duplikat, beserta tautan ke laporan terkait.

Jangan langsung menolak laporan hanya karena terdapat laporan lain di lokasi berdekatan.

Biarkan warga memeriksa laporan yang sudah ada dan biarkan admin mengambil keputusan akhir.

### Hasil pengiriman

Setelah laporan berhasil dibuat:

- Backend menghasilkan kode tiket unik.
- Tampilkan halaman atau dialog keberhasilan.
- Tampilkan kode tiket secara menonjol.
- Sediakan tombol untuk menyalin kode tiket.
- Sediakan tautan menuju halaman pelacakan.
- Simpan laporan dan log status awal ke database.

Cegah pembuatan laporan ganda akibat klik berulang atau percobaan ulang request jika memungkinkan.

### 9.2 Laporan Saya

Buat halaman khusus untuk laporan milik warga yang sedang login.

Tampilkan:

- Judul laporan.
- Kode tiket.
- Kategori.
- Status.
- Tanggal pengiriman.
- Pembaruan terakhir.
- Tautan detail.

Warga tidak boleh membaca laporan pribadi milik warga lain melalui halaman ini maupun endpoint API.

Laporan anonim tetap harus dapat diakses oleh pemiliknya setelah login. Anonimitas hanya mengatur informasi yang terlihat publik, bukan menghapus hubungan kepemilikan internal.

### 9.3 Interaksi Warga

Implementasikan upvote dan komentar.

Upvote:

- Satu upvote per warga untuk setiap laporan.
- Warga dapat membatalkan upvote.
- Cegah voting ganda melalui constraint database.
- Perbarui jumlah upvote setelah mutasi berhasil.

Komentar:

- Pengguna harus login.
- Validasi isi dan panjang komentar.
- Hubungkan komentar dengan penulisnya.
- Tampilkan nama sesuai kebijakan privasi.
- Tampilkan waktu komentar.
- Terapkan rate limiting dasar.
- Batasi pengeditan dan penghapusan berdasarkan hak akses.

Jangan izinkan komentar pada laporan yang ditolak atau dibatasi sesuai aturan bisnis yang diterapkan.

---

## 10. DASHBOARD ADMIN

Buat dashboard admin dengan layout khusus yang hanya dapat diakses setelah login sebagai admin.

### 10.1 Ringkasan Dashboard

Tampilkan:

- Total laporan.
- Laporan menunggu verifikasi.
- Laporan dalam penanganan.
- Laporan selesai.
- Laporan ditolak atau duplikat.
- Aktivitas terbaru.
- Distribusi kategori.
- Antrean laporan per wilayah.
- Laporan yang memerlukan perhatian.

Semua statistik harus berasal dari backend.

### 10.2 Antrean Verifikasi

Buat halaman antrean laporan baru.

Sediakan:

- Pencarian.
- Filter kategori.
- Filter wilayah.
- Filter tanggal.
- Pengurutan.
- Pagination.

Setiap baris menampilkan:

- Kode tiket.
- Judul.
- Kategori.
- Wilayah.
- Waktu laporan.
- Pratinjau foto.
- Status.
- Tombol tindakan.

Admin dapat:

- Membuka detail.
- Memverifikasi laporan.
- Menolak dengan alasan wajib.
- Menandai sebagai duplikat.
- Menghubungkan dengan laporan asli jika tersedia.

Setiap keputusan harus disimpan, divalidasi, diotorisasi, dan dicatat dalam riwayat status atau audit log.

Gunakan dialog konfirmasi untuk tindakan penting.

### 10.3 Kelola Laporan

Buat tabel manajemen laporan dengan filter:

- Status.
- Kategori.
- Wilayah.
- Tanggal.
- Instansi yang ditugaskan.

Admin dapat memeriksa laporan, menugaskan instansi, membaca riwayat, dan memantau progres.

Cegah perubahan status yang tidak sesuai dengan alur bisnis.

### 10.4 Penugasan

Admin dapat menugaskan laporan yang telah diverifikasi kepada instansi yang tersedia.

Simpan:

- Laporan.
- Instansi.
- Admin yang melakukan penugasan.
- Waktu penugasan.
- Catatan penugasan yang boleh dipublikasikan jika diperlukan.

Penugasan harus memperbarui status sesuai aturan dan membuat log status.

Jika laporan dialihkan ke instansi lain, simpan riwayat penugasan sebelumnya.

### 10.5 Pengaturan Admin

Buat bagian pengaturan yang terlindungi untuk konfigurasi yang diperlukan, termasuk periode tampilan marker laporan selesai.

Nilai awal: tujuh hari.

Jangan membangun sistem pengaturan umum yang kompleks jika tidak diperlukan.

---

## 11. DASHBOARD INSTANSI

### 11.1 Daftar Tugas

Tampilkan hanya laporan yang ditugaskan kepada instansi pengguna.

Kolom:

- Kode tiket.
- Judul.
- Kategori.
- Lokasi.
- Tanggal penugasan.
- Status.
- Indikator prioritas jika didukung aturan yang jelas.

Sediakan pencarian, filter status, dan pagination.

### 11.2 Detail Tugas

Tampilkan informasi laporan, foto awal, lokasi, penugasan, riwayat status, dan catatan penanganan.

### 11.3 Pembaruan Progres

Instansi yang berwenang dapat:

- Memulai penanganan.
- Menambahkan catatan progres.
- Mengunggah bukti perbaikan.
- Menandai laporan selesai apabila persyaratan terpenuhi.

Setiap perubahan status harus mengikuti alur yang diizinkan.

Bukti perbaikan harus terhubung dengan laporan, memiliki jenis bukti yang jelas, dan mencatat waktu unggah.

Saat laporan diselesaikan:

- Wajibkan bukti perbaikan yang sesuai.
- Wajibkan catatan atau deskripsi penyelesaian.
- Simpan waktu penyelesaian.
- Buat log status akhir.
- Perbarui marker peta publik.
- Perbarui statistik terkait.
- Pertahankan seluruh riwayat.

Gunakan database transaction atau urutan operasi yang aman agar status, waktu penyelesaian, dan log tetap konsisten.

---

## 12. ALUR STATUS LAPORAN

Gunakan status berikut secara konsisten:

- `DITERIMA`
- `DIVERIFIKASI`
- `DITUGASKAN`
- `DALAM_PENGERJAAN`
- `SELESAI`
- `DITOLAK`
- `DUPLIKAT`

### Transisi status

```text
DITERIMA
  ├── DIVERIFIKASI
  ├── DITOLAK
  └── DUPLIKAT

DIVERIFIKASI
  └── DITUGASKAN

DITUGASKAN
  └── DALAM_PENGERJAAN

DALAM_PENGERJAAN
  └── SELESAI
```

Jika ada kebutuhan operasional untuk penugasan ulang, definisikan aturan secara eksplisit dan pertahankan riwayat sebelumnya.

Setiap perubahan status harus menghasilkan catatan berisi:

- ID laporan.
- Status sebelumnya jika tersedia.
- Status baru.
- Catatan atau alasan yang boleh dipublikasikan.
- Pengguna yang melakukan perubahan.
- Waktu perubahan.

Laporan berstatus ditolak dan duplikat tidak boleh muncul di peta publik.

Halaman pelacakan tetap dapat menampilkan status tersebut beserta penjelasan yang telah disaring untuk publik.

Status saat ini harus selalu konsisten dengan riwayat perubahan status.

---

## 13. DESAIN DATABASE

Gunakan PostgreSQL dan Drizzle ORM.

Buat schema, migration, relasi, index, constraint, dan seed script.

### Tabel users

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

### Tabel reports

- `id`
- `ticket_code`
- `user_id`
- `title`
- `description`
- `category`
- `latitude`
- `longitude`
- `region_id`
- `status`
- `is_anonymous`
- `created_at`
- `updated_at`
- `completed_at`

### Tabel report_photos

- `id`
- `report_id`
- `url` atau `storage_path`
- `type`: `INITIAL` atau `COMPLETION_EVIDENCE`
- `uploaded_by`
- `created_at`

### Tabel report_status_logs

- `id`
- `report_id`
- `previous_status`
- `status`
- `note`
- `changed_by`
- `created_at`

### Tabel comments

- `id`
- `report_id`
- `user_id`
- `content`
- `created_at`
- `updated_at`

### Tabel upvotes

- `report_id`
- `user_id`
- `created_at`

### Tabel regions

- `id`
- `name`
- `type`
- `parent_region_id` jika diperlukan.

### Tabel pendukung

Tambahkan tabel pendukung sesuai kebutuhan implementasi:

- `agencies` untuk informasi instansi.
- `agency_memberships` untuk menghubungkan pengguna dengan instansi yang berwenang.
- `report_assignments` untuk menyimpan riwayat penugasan.
- `app_settings` untuk pengaturan aplikasi.
- `audit_logs` untuk tindakan administratif penting jika diperlukan.

Tetapkan foreign key dan kebijakan penghapusan data secara jelas.

### Constraint dan index

Terapkan:

- Email unik.
- Kode tiket unik.
- Kombinasi `(report_id, user_id)` unik pada upvote.
- Validasi role dan status.
- Validasi kategori.
- Index pada status, kategori, wilayah, tanggal pembuatan, kode tiket, dan query penugasan.
- Foreign key untuk pengguna, laporan, wilayah, foto, dan instansi.

Gunakan mekanisme database yang aman untuk menghasilkan kode tiket unik, bukan penghitung yang hanya berada di frontend.

### Hierarki wilayah

Representasikan wilayah administratif DKI Jakarta agar statistik dapat dikelompokkan berdasarkan kota/kabupaten administrasi dan kecamatan.

Masukkan lima kota administrasi dan Kabupaten Administrasi Kepulauan Seribu.

Gunakan data referensi wilayah terverifikasi jika tersedia. Jangan membuat batas geografis resmi secara sembarangan.

Jika dataset kecamatan lengkap belum tersedia, buat model yang dapat diperluas dan dokumentasikan keterbatasan data demo tersebut.

### ERD

Buat diagram Entity Relationship Diagram menggunakan Mermaid di `docs/database-erd.md`.

Sertakan primary key, foreign key, dan relasi utama.

Pastikan diagram sesuai dengan schema Drizzle yang benar-benar digunakan.

---

## 14. GENERASI KODE TIKET

Kode tiket harus dibuat oleh backend.

Gunakan format yang mudah dibaca, misalnya:

`LPR-2026-00123`

Ketentuan:

- Unik.
- Mudah dibaca.
- Tersimpan permanen.
- Aman untuk pengiriman bersamaan.
- Tidak dibuat hanya dari penghitung frontend.
- Dilindungi unique constraint pada database.

Gunakan database sequence atau mekanisme lain yang aman terhadap konkurensi.

Contoh tahun dan nomor tidak boleh dianggap sebagai nilai yang selalu tetap.

---

## 15. ATURAN STATUS PETA PUBLIK

Implementasikan aturan berikut sebagai business logic yang eksplisit.

### Marker merah

Tampilkan laporan berstatus:

- `DITERIMA`
- `DIVERIFIKASI`

### Marker kuning

Tampilkan laporan berstatus:

- `DITUGASKAN`
- `DALAM_PENGERJAAN`

### Marker hijau

Tampilkan laporan berstatus:

- `SELESAI`

Marker hijau terlihat selama tujuh hari sejak laporan diselesaikan secara default.

Setelah periode berakhir:

- Hilangkan marker dari hasil peta publik.
- Pertahankan laporan dalam database.
- Pertahankan fungsi pelacakan tiket.
- Tetap hitung laporan dalam statistik historis.

### Status yang tidak ditampilkan

Jangan tampilkan laporan dengan status:

- `DITOLAK`
- `DUPLIKAT`

Lakukan penyaringan visibilitas di backend jika memungkinkan agar endpoint peta tidak mengembalikan data yang seharusnya dikecualikan.

Terapkan filter sebelum pagination dan clustering.

Jangan menghapus laporan yang sudah selesai hanya karena marker peta tidak lagi ditampilkan.

---

## 16. DESAIN REST API

Gunakan REST API dengan prefix:

`/api/v1`

Terapkan format respons JSON yang konsisten dan HTTP status code yang sesuai.

### Autentikasi

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
```

Implementasikan refresh jika didukung oleh rancangan sesi yang dipilih.

### Laporan publik

```text
GET    /api/v1/reports
GET    /api/v1/reports/:id
GET    /api/v1/reports/ticket/:ticketCode
GET    /api/v1/reports/map
GET    /api/v1/reports/nearby
POST   /api/v1/reports
GET    /api/v1/reports/:id/timeline
GET    /api/v1/reports/:id/comments
POST   /api/v1/reports/:id/comments
POST   /api/v1/reports/:id/upvote
DELETE /api/v1/reports/:id/upvote
```

Lindungi pembuatan laporan, komentar, dan upvote dengan autentikasi.

Terapkan privasi laporan anonim melalui serialisasi respons dan otorisasi, bukan sekadar menyembunyikan elemen di frontend.

### Endpoint warga

```text
GET    /api/v1/me/reports
GET    /api/v1/me/reports/:id
```

### Endpoint admin

```text
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/reports/queue
GET    /api/v1/admin/reports
POST   /api/v1/admin/reports/:id/verify
POST   /api/v1/admin/reports/:id/reject
POST   /api/v1/admin/reports/:id/duplicate
POST   /api/v1/admin/reports/:id/assign
GET    /api/v1/admin/assignments
GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings
```

### Endpoint instansi

```text
GET    /api/v1/agency/tasks
GET    /api/v1/agency/tasks/:id
POST   /api/v1/agency/tasks/:id/start
POST   /api/v1/agency/tasks/:id/notes
POST   /api/v1/agency/tasks/:id/evidence
POST   /api/v1/agency/tasks/:id/complete
```

### Endpoint statistik

```text
GET    /api/v1/statistics/overview
GET    /api/v1/statistics/trends
GET    /api/v1/statistics/categories
GET    /api/v1/statistics/regions
GET    /api/v1/statistics/performance
GET    /api/v1/statistics/insights
```

Daftar endpoint tersebut merupakan rancangan awal. Sesuaikan jika diperlukan, tetapi dokumentasikan seluruh endpoint yang benar-benar diimplementasikan di `docs/api-documentation.md`.

Validasi pagination, sorting, filter, request body, dan parameter URL.

Jangan mengekspos error database atau stack trace pada respons produksi.

---

## 17. STATISTIK DAN INSIGHT OTOMATIS

Implementasikan statistik menggunakan agregasi database.

### Perhitungan ringkasan

Definisikan:

- Total laporan: jumlah laporan dalam cakupan dan periode yang dipilih.
- Persentase penyelesaian: jumlah laporan selesai dibagi populasi laporan yang memenuhi kriteria perhitungan.
- Rata-rata waktu penyelesaian: rata-rata durasi dari pengiriman hingga penyelesaian untuk laporan selesai yang memiliki timestamp valid.
- Laporan menunggu penanganan: jumlah laporan dengan status yang telah ditentukan secara jelas.

Dokumentasikan rumus dan penyebut yang digunakan.

### Tren laporan

Kelompokkan laporan berdasarkan minggu atau bulan serta kategori.

Gunakan pembagian waktu yang konsisten dan penanganan zona waktu yang tepat.

### Performa wilayah

Hitung:

- Jumlah laporan.
- Jumlah laporan belum tertangani.
- Jumlah laporan selesai.
- Tingkat penyelesaian.
- Rata-rata waktu penyelesaian jika data mencukupi.

Jangan membandingkan performa wilayah hanya berdasarkan jumlah laporan mentah. Jelaskan metrik yang digunakan.

### Insight otomatis

Buat insight deterministik berdasarkan hasil query.

Contoh:

- "Kategori sampah memiliki jumlah laporan terbanyak pada periode ini."
- "Wilayah X memiliki jumlah laporan belum tertangani paling tinggi."
- "Jumlah laporan jalan rusak meningkat dibandingkan periode sebelumnya."

Insight harus dihasilkan dari data nyata yang tersedia.

Jangan membuat klaim perbandingan jika data pembanding tidak tersedia.

Jika data tidak mencukupi, tampilkan pesan netral.

### Rekomendasi prioritas

Susun daftar prioritas menggunakan faktor yang dapat dijelaskan, seperti:

- Jumlah laporan belum tertangani.
- Usia laporan.
- Kategori laporan.
- Dukungan warga melalui upvote.

Jangan menetapkan label bahaya atau urgensi hanya berdasarkan skor yang tidak memiliki dasar jelas.

Jika menggunakan formula penilaian, dokumentasikan faktor, bobot, dan cara perhitungannya.

---

## 18. DATA DEMO YANG REALISTIS

Buat seed script untuk mengisi database dengan data demonstrasi yang realistis.

Target minimal:

- 100 laporan.
- Warga dengan riwayat laporan berbeda.
- Akun admin.
- Akun instansi.
- Berbagai kategori laporan.
- Persebaran laporan pada wilayah administratif yang didukung.
- Tanggal laporan yang bervariasi.
- Berbagai status laporan yang valid.
- Riwayat perubahan status.
- Penugasan instansi.
- Komentar dan upvote.
- Foto awal dan bukti perbaikan jika tersedia.

Gunakan koordinat yang masuk akal dan benar-benar berada di DKI Jakarta.

Jangan membuat batas administratif atau memasukkan koordinat ke wilayah yang salah.

Pastikan data demo mencakup:

1. Laporan baru yang menunggu verifikasi.
2. Laporan terverifikasi yang belum ditugaskan.
3. Laporan yang sudah ditugaskan.
4. Laporan dalam pengerjaan.
5. Laporan selesai dengan bukti perbaikan.
6. Laporan ditolak dengan alasan.
7. Laporan duplikat yang terhubung dengan laporan asli.

Riwayat status harus konsisten dengan status terkini.

Gunakan foto placeholder yang sesuai atau aset demo dengan penanda yang jelas jika foto asli tidak tersedia. Jangan menyajikan placeholder sebagai bukti perbaikan pemerintah yang sesungguhnya.

Gunakan data yang deterministik jika memungkinkan agar demo tetap konsisten saat dijalankan ulang.

Sediakan prosedur reset dan pengisian ulang database untuk lingkungan pengembangan. Jangan mengekspos fungsi reset database yang destruktif pada aplikasi publik.

---

## 19. KEAMANAN DAN PRIVASI

Terapkan perlindungan dasar berikut:

- Password hashing.
- Middleware autentikasi.
- Otorisasi berbasis role.
- Validasi input.
- Pencegahan SQL injection melalui query ORM yang aman.
- Rate limiting untuk login, registrasi, laporan, komentar, dan unggahan.
- Konfigurasi CORS yang aman.
- Cookie aman jika digunakan.
- Respons error yang tidak membocorkan detail internal.
- Validasi tipe dan ukuran file.
- Perlindungan unggahan file.
- Pemeriksaan kepemilikan data warga.
- Pemeriksaan penugasan instansi.
- Pencegahan mass assignment.
- Pencegahan upvote ganda.
- Serialisasi respons publik yang aman.
- Audit log untuk tindakan administratif penting.
- Pengelolaan secret melalui environment variables.

Jangan pernah mengunggah kredensial asli atau file `.env` ke repository.

Buat `.env.example` yang hanya berisi placeholder.

Jangan mengekspos Supabase service-role key di frontend.

Jangan mengizinkan frontend melewati validasi lokasi DKI Jakarta di backend.

Identitas pelapor anonim harus disembunyikan dari publik tanpa menghapus hubungan kepemilikan internal.

Gunakan prinsip least privilege untuk akses database dan storage.

---

## 20. RESPONSIVITAS DAN AKSESIBILITAS

Pastikan aplikasi dapat digunakan pada:

- Desktop.
- Laptop.
- Tablet.
- Ponsel.

Persyaratan:

- Tidak ada horizontal overflow pada ukuran mobile standar.
- Kontrol peta tetap mudah digunakan.
- Filter dapat berubah menjadi drawer atau panel yang dapat dilipat di mobile.
- Navigasi keyboard tersedia.
- Focus state terlihat.
- Heading menggunakan struktur semantik.
- Seluruh input memiliki label.
- Indikator status dapat dibaca.
- Kontras teks memadai.
- Empty state dan error state jelas.

Jangan menyembunyikan tindakan utama seperti membuat laporan dan melacak tiket pada perangkat mobile.

---

## 21. TAHAPAN IMPLEMENTASI

Ikuti prioritas pengerjaan sesuai PRD.

### Tahap 1 — Fondasi

Implementasikan:

- Setup repository.
- Konfigurasi frontend dan backend.
- Koneksi PostgreSQL.
- Schema dan migrasi Drizzle.
- Autentikasi.
- Otorisasi berbasis role.
- Design system.
- Layout aplikasi.
- Konfigurasi environment.
- Infrastruktur seed data.

Target: aplikasi dapat dijalankan secara lokal dan pengguna dapat login dengan role yang sesuai.

### Tahap 2 — Pelaporan Inti (P0)

Implementasikan:

- Form pelaporan warga.
- Unggah foto.
- Pemilihan lokasi.
- Validasi batas DKI Jakarta.
- Kode tiket unik.
- Daftar laporan publik.
- Detail laporan.
- Antrean verifikasi admin.
- Alur menerima, menolak, dan menandai duplikat.
- Penugasan instansi.
- Timeline status.
- Pelacakan laporan publik.
- Peta status laporan.
- Visibilitas marker selesai selama tujuh hari.

Target: seluruh alur inti pelaporan dan pelacakan berfungsi.

### Tahap 3 — Penanganan Instansi (P0/P1)

Implementasikan:

- Daftar tugas instansi.
- Otorisasi berdasarkan instansi.
- Catatan progres.
- Pembaruan status.
- Bukti perbaikan.
- Penyelesaian laporan.
- Konsistensi riwayat status.

Target: alur dari verifikasi hingga penyelesaian berjalan menyeluruh.

### Tahap 4 — Partisipasi Publik (P1)

Implementasikan:

- Upvote.
- Komentar.
- Peringatan laporan serupa di sekitar lokasi.
- Filter laporan tambahan.
- Peningkatan pencarian laporan publik.

Target: warga dapat berpartisipasi dalam pemantauan dan penentuan prioritas.

### Tahap 5 — Statistik (P1)

Implementasikan:

- Kartu ringkasan.
- Grafik tren.
- Statistik kategori.
- Statistik wilayah.
- Peringkat kinerja.
- Insight otomatis.
- Rekomendasi prioritas.

Target: seluruh statistik berasal dari data database dan dapat dijelaskan saat demonstrasi.

### Tahap 6 — Pembaruan Real-Time (P2)

Implementasikan polling atau WebSocket setelah alur utama stabil.

Gunakan interval polling yang wajar dan hindari request yang tidak diperlukan.

Target: status laporan dan informasi dashboard diperbarui tanpa reload penuh.

### Tahap 7 — Finalisasi

Implementasikan:

- Penyempurnaan responsivitas.
- Pemeriksaan aksesibilitas.
- Penanganan error.
- Pengujian.
- Verifikasi data demo.
- Dokumentasi.
- Konfigurasi deployment.
- Panduan demonstrasi.

Jangan mengerjakan fitur P2 yang kompleks ketika alur P0 masih bermasalah.

---

## 22. PENGUJIAN

Buat pengujian untuk business logic dan izin akses yang penting.

### Pengujian autentikasi

- Registrasi warga.
- Login berhasil dan gagal.
- Token tidak valid.
- Pembatasan role.
- Registrasi publik tidak dapat membuat akun admin atau instansi.

### Pengujian pelaporan

- Pembuatan laporan valid.
- Field laporan tidak valid.
- Batas jumlah dan ukuran foto.
- Keunikan kode tiket.
- Penolakan koordinat di luar DKI Jakarta.
- Pemeriksaan kepemilikan laporan.
- Privasi laporan anonim.

### Pengujian alur status

- Verifikasi berhasil.
- Penolakan wajib disertai alasan.
- Penandaan duplikat.
- Penugasan ke instansi yang berwenang.
- Pencegahan transisi status ilegal.
- Pencegahan pembaruan oleh instansi yang tidak berwenang.
- Penyelesaian memerlukan bukti yang sesuai.
- Setiap transisi membuat log yang konsisten.

### Pengujian peta

- Pemetaan warna berdasarkan status.
- Laporan ditolak dan duplikat tidak ditampilkan.
- Marker selesai menghilang setelah tujuh hari.
- Tiket tetap dapat dilacak setelah marker menghilang.
- Filter kategori, status, dan wilayah berfungsi.

### Pengujian statistik

- Agregasi akurat.
- Persentase penyelesaian benar.
- Perhitungan waktu penyelesaian.
- Penanganan data kosong.
- Insight berdasarkan hasil query.

### Skenario penerimaan end-to-end

Pastikan skenario berikut berhasil:

1. Warga login.
2. Warga membuat laporan di dalam DKI Jakarta.
3. Sistem menghasilkan kode tiket unik.
4. Laporan masuk ke antrean verifikasi admin.
5. Admin memverifikasi laporan.
6. Admin menugaskan laporan ke instansi.
7. Instansi memulai penanganan.
8. Instansi menambahkan catatan progres.
9. Instansi mengunggah bukti perbaikan.
10. Instansi menandai laporan selesai.
11. Halaman pelacakan menampilkan timeline lengkap.
12. Marker peta berubah menjadi hijau.
13. Statistik memperhitungkan laporan yang selesai.
14. Setelah periode visibilitas berakhir, marker menghilang sementara tiket dan riwayat tetap tersedia.

Uji juga bahwa lokasi di luar DKI Jakarta ditolak dan tidak masuk antrean verifikasi.

Jangan menyatakan aplikasi selesai sebelum skenario utama berhasil atau sisa hambatan dijelaskan secara terbuka.

---

## 23. KONFIGURASI ENVIRONMENT VARIABLES

Buat `.env.example` untuk backend dan frontend sesuai kebutuhan implementasi.

Contoh konfigurasi backend:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=civix-reports
```

Contoh konfigurasi frontend:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Gunakan hanya variabel yang benar-benar diperlukan oleh arsitektur yang dipilih.

Jika frontend tidak membutuhkan akses langsung ke Supabase, jangan menambahkan konfigurasi publik yang tidak diperlukan.

Jangan memasukkan secret khusus server ke variabel frontend yang diekspos Vite.

Jangan mengarang kredensial atau menyatakan layanan eksternal telah terkonfigurasi jika kredensialnya belum tersedia.

---

## 24. DOKUMENTASI

Buat README lengkap yang menjelaskan:

- Gambaran proyek.
- Stack teknologi.
- Prasyarat.
- Instalasi.
- Konfigurasi environment.
- Setup database.
- Perintah migrasi Drizzle.
- Perintah seed.
- Perintah menjalankan aplikasi.
- Perintah build.
- Perintah pengujian.
- Panduan deployment.
- Informasi akun demo.
- Keterbatasan yang diketahui.

Buat dokumentasi tambahan:

- `docs/database-erd.md`
- `docs/api-documentation.md`
- `docs/architecture.md`
- `docs/demo-guide.md`

Panduan demo harus menjelaskan urutan demonstrasi lengkap, dari warga membuat laporan hingga laporan selesai dan statistik diperbarui.

Dokumentasikan fitur yang masih disimulasikan, belum selesai, atau membutuhkan kredensial layanan eksternal.

---

## 25. KRITERIA SELESAI

Proyek dianggap selesai apabila memenuhi kriteria berikut.

### Fungsionalitas

- Autentikasi berfungsi.
- Role dan izin diverifikasi di backend.
- Warga dapat membuat laporan yang valid.
- Laporan di luar DKI Jakarta ditolak.
- Kode tiket dibuat secara unik.
- Admin dapat memverifikasi laporan.
- Instansi dapat menerima penugasan.
- Instansi dapat memperbarui progres dan mengunggah bukti.
- Timeline tersimpan dan akurat.
- Pelacakan laporan berfungsi.
- Marker peta mengikuti status laporan.
- Marker selesai menghilang sesuai periode konfigurasi.
- Statistik berasal dari database.
- Upvote dan komentar berfungsi jika fitur P1 tersebut telah diimplementasikan.

### Integritas data

- Migrasi database berjalan.
- Seed data dapat dimuat.
- Relasi dan constraint berfungsi.
- Transisi status konsisten.
- Laporan historis tidak dihapus ketika marker kedaluwarsa.
- Identitas pelapor anonim tetap terlindungi.

### Pengalaman pengguna

- Antarmuka profesional dan rapi.
- Layout desktop dan mobile berfungsi.
- Validasi formulir jelas.
- Loading, error, dan empty state tersedia.
- Navigasi dan tombol memiliki fungsi nyata.
- Tidak ada halaman penting yang hanya berisi placeholder hardcoded.

### Kualitas engineering

- Frontend berhasil dibangun.
- Backend berhasil dibangun.
- Pengujian kritis berhasil.
- Environment variables terdokumentasi.
- Tidak ada secret yang di-commit.
- Panduan deployment sesuai implementasi.
- Dokumentasi API dan database sesuai kode aktual.

---

## 26. INSTRUKSI AKHIR UNTUK AI AGENT

Mulailah dengan memeriksa repository dan membaca PRD yang disediakan.

Kemudian lakukan langkah berikut:

1. Ringkas struktur proyek yang ada dan identifikasi batasan penting.
2. Buat checklist implementasi berdasarkan prioritas.
3. Bangun fondasi aplikasi dan selesaikan alur P0 terlebih dahulu.
4. Integrasikan frontend, backend, database, autentikasi, dan storage.
5. Jalankan migrasi dan seed data realistis jika kredensial database tersedia.
6. Jalankan pengujian dan build check.
7. Perbaiki masalah yang ditemukan, bukan sekadar melaporkannya.
8. Lanjutkan ke fitur P1 setelah P0 stabil.
9. Implementasikan P2 hanya setelah alur utama dapat diandalkan.
10. Perbarui README dan seluruh dokumentasi sesuai implementasi aktual.

**Kerjakan langsung pada file proyek. Jangan hanya memberikan penjelasan, mockup, saran arsitektur, atau potongan kode.**

Jangan mengganti fitur yang sudah berfungsi dengan implementasi placeholder.

Jika dependensi, kredensial, dataset batas wilayah terverifikasi, atau layanan eksternal belum tersedia, implementasikan bagian yang dapat dikerjakan, dokumentasikan hambatan secara spesifik, dan lanjutkan pekerjaan lain yang tidak bergantung pada hambatan tersebut.

Pada akhir pengerjaan, berikan laporan implementasi singkat yang mencakup:

- Fitur yang telah selesai.
- Fitur yang belum selesai.
- Status database dan migrasi.
- Pengujian dan build check yang benar-benar dijalankan beserta hasilnya.
- Environment variables dan setup eksternal yang diperlukan.
- Cara menjalankan aplikasi secara lokal.
- Cara mendemonstrasikan seluruh alur CIVIX.

**Tujuan utama: menghasilkan aplikasi web CIVIX yang fungsional, mudah dipelihara, siap didemonstrasikan untuk kompetisi, dan sesuai dengan PRD, mulai dari pelaporan warga hingga penyelesaian masalah yang transparan.**