# PRD – CIVIX (Civic Infrastructure Verification & Integrated Execution)

Lomba Web In Action (Multimedia In Action 2026) · Subtema utama: Civic Reporting & Accountability · Pendukung: Public Service Tracking, Data-Driven Decision Support

*Catatan: Isu "infrastruktur lingkungan" diinterpretasikan sebagai infrastruktur umum dan lingkungan sekitar (jalan rusak, drainase tersumbat, sampah menumpuk, lampu jalan mati, fasilitas umum rusak).*

## 1. Ringkasan

CIVIX adalah platform web tempat warga melaporkan kerusakan infrastruktur dan masalah lingkungan di sekitarnya, memantau progres penanganannya secara transparan, dan melihat statistik yang mudah dipahami tentang kinerja penanganan di tiap wilayah. Admin atau instansi memverifikasi, menindaklanjuti, dan memperbarui status laporan.

**Alur inti:** Warga lapor → Admin verifikasi → Instansi tindak lanjut → Status terpantau publik → Data diolah jadi statistik.

## 2. Latar Belakang dan Masalah

- Warga kesulitan melapor dan tidak tahu laporannya diproses atau tidak.
- Laporan tersebar di banyak kanal dan sering terduplikasi.
- Instansi sulit menentukan prioritas karena tidak ada ringkasan data yang jelas.
- Pengawasan publik lemah karena progres penanganan tidak terbuka.

## 3. Tujuan dan Metrik Keberhasilan

| Tujuan | Indikator |
| --- | --- |
| Mempermudah pelaporan | Laporan dapat dikirim kurang dari 2 menit |
| Transparansi progres | Setiap laporan punya kode tiket dan timeline publik |
| Keputusan berbasis data | Dashboard menampilkan tren, sebaran, dan kinerja wilayah |
| Partisipasi warga | Fitur dukungan (upvote) dan komentar pada laporan |

Untuk lomba, keberhasilan diukur dari alur demo yang lengkap dan mulus (lapor → verifikasi → selesai → statistik), tampilan yang rapi di desktop dan mobile, serta data demo yang realistis.

## 4. Pengguna

| Peran | Kebutuhan utama |
| --- | --- |
| Warga | Melapor cepat, memantau status, melihat laporan sekitar |
| Admin&#32; | Memeriksa laporan, menolak atau menandai duplikat, mengubah status |
| Instansi | Menerima laporan terverifikasi, memperbarui progres dan bukti perbaikan |
| Publik (tanpa login) | Melihat peta, status, dan statistik |

## 5. Ruang Lingkup Fitur

### 5.1 Inti: Civic Reporting & Accountability (Prioritas P0)

- **Form laporan:** judul, kategori, deskripsi, foto (1–3), lokasi (pin di peta atau deteksi lokasi), opsi anonim.
- **Kategori:** jalan rusak, drainase/banjir, sampah, penerangan jalan, fasilitas umum, lainnya.
- **Verifikasi admin:** terima, tolak (dengan alasan), atau tandai duplikat.
- **Tindak lanjut:** penugasan ke instansi, catatan penanganan, foto bukti perbaikan.
- **Pengawasan publik:** upvote "saya juga mengalami", komentar, dan peta laporan terbuka.
- **Deteksi duplikat sederhana:** peringatan jika ada laporan sekategori dalam radius dekat.

**Cakupan wilayah: DKI Jakarta**

- CIVIX hanya menerima laporan yang lokasinya berada di wilayah DKI Jakarta (5 kota administrasi dan Kabupaten Administrasi Kepulauan Seribu).
- Validasi dua lapis: peta dibatasi ke area DKI Jakarta, dan server memeriksa koordinat terhadap batas wilayah sebelum laporan disimpan.
- Laporan dari luar DKI Jakarta ditolak otomatis dengan pesan yang jelas dan tidak masuk antrean verifikasi.
- Statistik dikelompokkan per kota administrasi dan kecamatan di DKI Jakarta.

### 5.2 Pendukung: Public Service Tracking (Prioritas P0, ringan)

- Kode tiket unik per laporan (contoh: LPR-2026-00123).
- Halaman **Lacak Laporan**: masukkan kode tiket untuk melihat status.
- **Timeline status:** Diterima → Diverifikasi → Ditugaskan → Dalam Pengerjaan → Selesai (atau Ditolak).
- Estimasi atau target waktu penanganan per kategori.
- Pembaruan status tampil otomatis (polling atau WebSocket).

### 5.3 Pendukung: Data-Driven Decision Support (Prioritas P1)

Dashboard publik yang bahasanya sederhana, dengan kartu ringkasan, grafik, dan satu kalimat insight di tiap grafik.

- **Kartu ringkasan:** total laporan, persentase selesai, rata-rata waktu penyelesaian, laporan menunggu.
- **Tren** laporan per minggu/bulan, dipisah per kategori.
- **Heatmap** sebaran laporan per wilayah.
- **Perbandingan wilayah:** peringkat berdasarkan kecepatan penyelesaian dan jumlah laporan belum tertangani.
- **Insight otomatis** berupa kalimat, misalnya "Drainase di Wilayah X menyumbang 40% laporan bulan ini".
- **Rekomendasi prioritas:** daftar wilayah atau kategori yang paling mendesak.

### 5.4 Peta Status Laporan (Fitur Unggulan)

Setiap laporan tampil di peta sebagai titik bulat berwarna sesuai status penanganannya, sehingga kondisi wilayah terbaca sekilas.

| Warna | Status | Aturan tampil |
| --- | --- | --- |
| Merah | Baru dilaporkan (Diterima, Diverifikasi) | Tampil sampai laporan mulai ditangani |
| Kuning | Sedang diproses (Ditugaskan, Dikerjakan) | Tampil selama pengerjaan |
| Hijau | Selesai | Tampil 7 hari sejak laporan selesai, lalu hilang dari peta |

- Warna titik berubah otomatis saat admin atau instansi memperbarui status.
- Laporan yang sudah hilang dari peta tetap bisa dibuka lewat kode tiket dan tetap dihitung di statistik.
- Klik titik menampilkan ringkasan laporan (judul, kategori, status, foto) dan tautan ke halaman detail.
- Filter peta: kategori, status, dan wilayah; titik yang berdekatan digabung (clustering).
- Laporan berstatus Ditolak atau Duplikat tidak ditampilkan di peta publik.
- Semua titik berbentuk lingkaran bulat polos tanpa ikon; hanya warnanya yang membedakan status. Untuk pengguna buta warna, status tetap terbaca lewat legenda peta dan label status saat titik diklik.
- Batas 7 hari disimpan sebagai pengaturan, jadi mudah diubah.

### 5.5 Di Luar Lingkup (Non-Goals)

- Integrasi dengan sistem pemerintah yang sesungguhnya.
- Aplikasi mobile native (cukup web responsif).
- Verifikasi identitas warga (KTP/NIK).
- Moderasi konten berbasis AI.

## 6. Alur Pengguna Utama

1. **Melapor:** Warga buka beranda → klik Buat Laporan → isi form, foto, dan lokasi → kirim → menerima kode tiket.
2. **Verifikasi:** Admin melihat antrean → memeriksa foto dan lokasi → menerima, menolak, atau menandai duplikat.
3. **Penanganan:** Admin menugaskan ke instansi → instansi memperbarui status dan mengunggah foto hasil.
4. **Memantau:** Warga memasukkan kode tiket atau membuka laporannya → melihat timeline dan catatan.
5. **Melihat dampak:** Siapa pun membuka dashboard → membaca statistik dan insight.

## 7. Sitemap dan User Journey

&#91;embedded content: sitemap CIVIX · 3 jalur akses, 18 halaman\]

Halaman admin dan instansi hanya terbuka setelah login; halaman warga dan publik bisa dilihat tanpa akun, kecuali Buat Laporan dan Laporan Saya yang membutuhkan login warga.

| Peran | Kebutuhan utama | Halaman yang diakses | Contoh fitur |
| --- | --- | --- | --- |
| Warga | Melapor masalah, memantau progres, melihat kondisi wilayah | Beranda, Peta Laporan, Buat Laporan, Lacak Laporan, Laporan Saya, Statistik | Form laporan dengan foto dan lokasi, kode tiket, timeline status, upvote, komentar |
| Admin | Memverifikasi dan mengelola laporan | Login, Dashboard Admin, Antrean Verifikasi, Kelola Laporan, Penugasan | Terima, tolak, atau tandai duplikat; penugasan; ubah status |
| Instansi | Menangani laporan dan membuktikan hasil perbaikan | Login, Daftar Tugas, Update Progres | Update status, catatan penanganan, unggah foto bukti perbaikan |
| Publik (tanpa login) | Melihat kondisi wilayah dan mengawasi penanganan | Beranda, Peta Laporan, Detail Laporan, Statistik, Tentang CIVIX | Titik peta berwarna, timeline publik, dashboard statistik |

## 8. Kebutuhan Fungsional Ringkas

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F1 | Warga dapat membuat laporan dengan foto dan lokasi | P0 |
| F2 | Sistem membuat kode tiket unik otomatis | P0 |
| F3 | Admin dapat memverifikasi, menolak, atau menandai duplikat | P0 |
| F4 | Status laporan tercatat sebagai riwayat (timeline) | P0 |
| F5 | Publik dapat melacak laporan lewat kode tiket | P0 |
| F6 | Peta menampilkan titik berwarna per status dengan filter kategori, status, dan wilayah | P0 |
| F7 | Instansi dapat mengunggah bukti perbaikan | P1 |
| F8 | Upvote dan komentar pada laporan | P1 |
| F9 | Dashboard statistik dan insight otomatis | P1 |
| F10 | Pembaruan status tampil tanpa reload | P2 |
| F11 | Deteksi laporan duplikat berbasis jarak | P2 |
| F12 | Titik peta berubah warna sesuai status (merah, kuning, hijau); titik hijau hilang 7 hari setelah laporan selesai | P0 |
| F13 | Laporan hanya diterima jika lokasinya di dalam wilayah DKI Jakarta; lokasi di luar wilayah ditolak otomatis | P0 |

## 9. Kebutuhan Non-Fungsional

- **Responsif** untuk mobile dan desktop.
- **Performa:** halaman utama termuat cepat, foto dikompres sebelum diunggah.
- **Keamanan dasar:** autentikasi dan otorisasi berbasis peran, validasi input, batas ukuran dan tipe file.
- **Privasi:** opsi laporan anonim, kontak pelapor tidak tampil publik.
- **Aksesibilitas:** kontras warna memadai, label form jelas, bahasa sederhana.

## 10. Model Data (Garis Besar)

- **users:** id, nama, email, peran (warga/admin/instansi)
- **reports:** id, kode\_tiket, user\_id, judul, deskripsi, kategori, latitude, longitude, region\_id, status, anonim, dibuat\_pada, selesai\_pada (dasar penghitungan 7 hari titik hijau)
- **report\_photos:** id, report\_id, url, jenis (awal/bukti\_perbaikan)
- **report\_status\_logs:** id, report\_id, status, catatan, diubah\_oleh, waktu
- **comments:** id, report\_id, user\_id, isi, waktu
- **upvotes:** report\_id, user\_id
- **regions:** id, nama, tipe (kota administrasi atau kecamatan di DKI Jakarta, untuk agregasi statistik)

## 11. Usulan Teknologi

Usulan awal yang bisa disesuaikan dengan stack yang kamu kuasai:

- **Frontend:** React (Vite) + Tailwind CSS, Leaflet untuk peta, Recharts untuk grafik.
- **Backend:** Node.js + Express, autentikasi JWT.
- **Database:** PostgreSQL (Supabase), akses lewat ORM.
- **Penyimpanan foto:** layanan penyimpanan gratis (Melalui Vercel/Supabase).
- **Deploy:** Vercel dan Supabase

**Kebiasaan coding wajib:**

- Struktur folder dipisah per fungsi dengan penamaan konsisten (frontend: pages, components, services, hooks, utils; backend: routes, controllers, models, middlewares).
- Clean code: nama variabel dan fungsi jelas, fungsi pendek, satu fungsi untuk satu tugas.

## 12. Rencana Pengerjaan

| Tahap | Isi |
| --- | --- |
| 1. Fondasi | Desain UI, setup proyek, autentikasi, skema database |
| 2. Inti no.3 | Form laporan, peta, daftar dan detail laporan, antrean verifikasi admin |
| 3. Tracking no.2 | Kode tiket, timeline status, halaman Lacak Laporan, panel instansi |
| 4. Statistik no.4 | Data dummy realistis, dashboard, insight otomatis |
| 5. Polishing | Fitur live, upvote/komentar, responsif, uji alur demo |
| 6. Finalisasi | Deploy, dokumentasi, video/slide demo |

Selesaikan tahap 2 dan 3 sampai matang sebelum mengerjakan dashboard, supaya alur inti selalu bisa didemokan.

## 13. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Cakupan terlalu besar | Kunci P0 dulu, P2 hanya jika waktu cukup |
| Dashboard kosong saat demo | Siapkan seed data realistis (100+ laporan) |
| Laporan palsu atau spam | Verifikasi admin, batasi frekuensi laporan |
| Subtema di aturan hanya boleh satu | Konfirmasi ke panitia; jika perlu, no.2 dan no.4 diposisikan sebagai fitur dalam no.3 |
| Peta lambat dengan banyak titik | Clustering marker dan paginasi |
| Laporan dari luar DKI Jakarta | Batasi peta ke DKI Jakarta dan validasi koordinat di server; tolak otomatis dengan pesan jelas |

## 14. Poin Pembeda untuk Juri

- Alur akuntabilitas lengkap dengan bukti sebelum dan sesudah perbaikan.
- Timeline publik yang transparan untuk setiap laporan.
- Insight statistik berupa kalimat yang langsung dimengerti, bukan hanya grafik.
- Deteksi duplikat dan dukungan warga untuk menentukan prioritas.

* Peta status berwarna (merah, kuning, hijau) yang membuat kondisi penanganan terbaca sekilas.

## 15. Kriteria Penilaian (Babak Penyisihan)

Bobot penilaian menentukan prioritas pengerjaan: fungsionalitas (25%) harus matang lebih dulu, lalu orisinalitas, desain, dan konten.

| Kriteria | Bobot | Cara CIVIX memenuhinya |
| --- | --- | --- |
| Orisinalitas Ide & Konsep | 20% | Peta status berwarna dengan titik hijau yang hilang setelah 7 hari, deteksi laporan duplikat, timeline publik, dan statistik dari laporan sendiri, fokus pada DKI Jakarta |
| Fungsionalitas Website | 25% | Alur lapor, verifikasi, tindak lanjut, dan statistik berjalan tanpa error; navigasi mudah; responsif di beberapa perangkat; validasi wilayah DKI Jakarta |
| Desain & Estetika | 20% | Layout rapi, palet warna konsisten (merah, kuning, hijau khusus untuk status), tipografi harmonis, peta dan dashboard menarik |
| Konten & Informasi | 20% | Informasi laporan jelas dan akurat, insight statistik berupa kalimat sederhana, data demo realistis, teks rapi |
| Kesesuaian Tema & Subtema | 15% | Subtema utama Civic Reporting & Accountability, didukung Public Service Tracking dan Data-Driven Decision Support, dengan nilai edukasi dan teknologi lewat transparansi penanganan |
| **Total** | **100%** |  |
