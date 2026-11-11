import { useState } from 'react';
import { BookOpen, MapPin, ShieldCheck, ListChecks, X, Construction, CloudRain, Trash2, Lightbulb, Building2, ClipboardList, Info } from 'lucide-react';
import AdminModal from '@/components/AdminModal';
import { KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import './citizen-information.css';

const categories = [
  { key: 'jalan_rusak', icon: Construction, color: '#A76555', text: 'Laporkan jalan berlubang, retak, atau permukaan jalan yang membahayakan pengguna.' },
  { key: 'drainase', icon: CloudRain, color: '#527A9D', text: 'Laporkan saluran air tersumbat, genangan air, atau banjir yang mengganggu aktivitas masyarakat.' },
  { key: 'sampah', icon: Trash2, color: '#367B73', text: 'Laporkan penumpukan sampah, pembuangan sampah sembarangan, atau keterlambatan pengangkutan sampah.' },
  { key: 'penerangan', icon: Lightbulb, color: '#987429', text: 'Laporkan lampu penerangan jalan yang mati, rusak, atau tidak berfungsi dengan baik.' },
  { key: 'fasilitas_umum', icon: Building2, color: '#008358', text: 'Laporkan kerusakan fasilitas umum seperti halte, trotoar, atau sarana publik lain yang membutuhkan perbaikan.' },
  { key: 'lainnya', icon: ClipboardList, color: '#687789', text: 'Gunakan kategori ini untuk masalah yang belum tercakup dalam kategori lainnya. Jelaskan kondisi secara detail pada deskripsi.' },
] as const;

const sectionTitles = [
  ['Jelaskan masalah utama', 'Lengkapi lokasi dan foto', 'Pantau laporan Anda'],
  [],
  ['Laporan diterima dan diverifikasi', 'Penanganan hingga selesai', 'Penolakan dan laporan duplikat'],
  ['Pilihan laporan anonim', 'Lindungi informasi pribadi'],
  ['Tandai titik kejadian', 'Pastikan lokasi berada di DKI Jakarta'],
];

const guideTips = [
  'Gunakan judul yang spesifik dan foto yang jelas. Periksa kembali informasi sebelum mengirim laporan.',
  'Pilih satu kategori yang paling menggambarkan masalah utama. Sertakan lokasi dan foto pendukung agar laporan lebih mudah dipahami.',
  'Buka detail laporan pada Riwayat Laporan untuk melihat catatan serta bukti penanganan terbaru.',
  'Periksa foto sebelum diunggah. Hindari menampilkan nomor identitas, nomor telepon, atau data pribadi orang lain.',
  'Lokasi perangkat hanya membantu menemukan area awal. Sesuaikan kembali pin dengan titik kejadian yang sebenarnya.',
];
const guides = [
  { title: 'Cara membuat laporan yang jelas', kind: 'Panduan', icon: BookOpen, summary: 'Lengkapi informasi, lokasi, dan foto agar laporan mudah diverifikasi.', paragraphs: ['Pilih kategori yang paling sesuai. Gunakan judul singkat dan jelaskan kondisi masalah, lokasi spesifik, serta dampaknya bagi warga.', 'Pilih wilayah administrasi dan tandai titik kejadian di peta. Unggah satu hingga tiga foto asli yang memperlihatkan masalah. Periksa kembali sebelum mengirim.', 'Simpan kode tiket dan pantau perubahan status melalui Riwayat Laporan.'] },
  { title: 'Kenali kategori laporan', kind: 'Kategori', icon: ListChecks, summary: 'Temukan kategori yang sesuai dengan masalah di sekitar Anda.', paragraphs: [Object.values(KATEGORI_LABEL).join(', ') + '.', 'Pilih kategori sesuai masalah utama. Jika tidak ada kategori yang tepat, pilih Lainnya dan jelaskan detail pada deskripsi.'] },
  { title: 'Memahami status penanganan', kind: 'Panduan', icon: ListChecks, summary: 'Ikuti perjalanan laporan dari diterima hingga selesai ditangani.', paragraphs: ['Laporan masuk dengan status ' + STATUS_LABEL.diterima + ', lalu diperiksa oleh admin. Laporan yang telah diverifikasi dapat ditugaskan ke instansi terkait.', 'Instansi memperbarui status penanganan dan menambahkan catatan. Laporan selesai dilengkapi foto bukti perbaikan dan rincian biaya penanganan yang dapat dilihat pada detail laporan.', 'Laporan dapat ditolak atau ditandai duplikat dengan catatan. Periksa riwayat status untuk melihat alasan dan perkembangan yang sebenarnya.'] },
  { title: 'Memahami biaya penanganan', kind: 'Panduan', icon: Info, summary: 'Lihat sumber pendanaan dan penggunaan biaya pada laporan yang selesai.', paragraphs: ['Buka detail laporan selesai untuk melihat nominal biaya, sumber pendanaan, rincian penggunaan, serta instansi pencatat. Nilai Rp0 berarti penanganan tidak memerlukan biaya tambahan; laporan tanpa rincian biaya ditampilkan terpisah.', 'Statistik publik merangkum biaya berdasarkan tanggal penyelesaian, wilayah, dan instansi. Total biaya tercatat berasal dari laporan, bukan keseluruhan anggaran tahunan instansi.', 'Jika instansi mengoreksi biaya, nilai terdahulu dan alasan koreksi tetap dapat dilihat pada riwayat pencatatan biaya.'] },
  { title: 'Privasi dan laporan anonim', kind: 'Panduan', icon: ShieldCheck, summary: 'Pahami cara identitas Anda ditampilkan pada laporan publik.', paragraphs: ['Aktifkan Kirim sebagai anonim sebelum mengirim laporan jika Anda ingin menyembunyikan identitas di detail laporan publik. Admin tetap dapat melihat pelapor untuk keperluan verifikasi.', 'Nomor telepon dan alamat pada profil Warga tidak ditampilkan pada laporan publik. Hindari menuliskan data pribadi pada judul, deskripsi, komentar, dan foto.'] },
  { title: 'Menentukan lokasi kejadian', kind: 'Panduan', icon: MapPin, summary: 'Gunakan titik peta dan alamat yang tepat agar lokasi mudah ditemukan.', paragraphs: ['Pilih wilayah administrasi sesuai lokasi masalah, lalu klik peta untuk menetapkan koordinat. Pencarian alamat dan lokasi perangkat dapat membantu menemukan area awal.', 'CIVIX menerima laporan dalam wilayah DKI Jakarta. Pastikan titik berada di lokasi kejadian dan tulis nama jalan atau penanda yang jelas.'] },
];
export default function CitizenInformationPage() {
  const [tab, setTab] = useState('Semua');
  const [selected, setSelected] = useState<typeof guides[number] | null>(null);
  const guideIndex = selected ? guides.indexOf(selected) : -1;

  return (
    <>
      <header className="admin-page-header">
        <div><h1>Informasi</h1><p>Panduan menggunakan CIVIX dan membuat laporan yang mudah ditindaklanjuti.</p></div>
      </header>
      <div className="warga-information-tabs">
        {['Semua', 'Panduan', 'Kategori'].map(item => (
          <button key={item} className="btn-outline" aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      <div className="warga-guides">
        {guides.filter(item => tab === 'Semua' || item.kind === tab).map(item => (
          <article className="admin-panel warga-guide" key={item.title}>
            <item.icon size={27} />
            <small>{item.kind} CIVIX</small>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <button onClick={() => setSelected(item)} aria-label={`Baca selengkapnya: ${item.title}`}>Baca selengkapnya →</button>
          </article>
        ))}
      </div>
      {selected && (
        <AdminModal title={selected.title} onClose={() => setSelected(null)} className="warga-reading-modal">
          <article className="warga-reading">
            <header className="warga-reading-header">
              <div>
                <span className="warga-reading-label">{selected.kind} CIVIX</span>
                <h2>{selected.title}</h2>
                <p>{selected.summary}</p>
              </div>
              <button className="warga-reading-close" onClick={() => setSelected(null)} aria-label="Tutup panduan" autoFocus><X size={22} /></button>
            </header>
            <div className="warga-reading-body">
              {selected.kind === 'Kategori' ? (
                <ul className="warga-category-guide">
                  {categories.map(category => (
                    <li key={category.key}>
                      <category.icon size={23} style={{ color: category.color }} aria-hidden="true" />
                      <div><h3>{KATEGORI_LABEL[category.key]}</h3><p>{category.text}</p></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className="warga-reading-sections">
                  {selected.paragraphs.map((paragraph, index) => (
                    <li key={paragraph}>
                      <span className="warga-reading-number" aria-hidden="true">{index + 1}</span>
                      <div><h3>{sectionTitles[guideIndex][index]}</h3><p>{paragraph}</p></div>
                    </li>
                  ))}
                </ol>
              )}
              <aside className="warga-reading-tip">
                <Info size={19} aria-hidden="true" />
                <div><h3>Tips pelaporan</h3><p>{guideTips[guideIndex]}</p></div>
              </aside>
            </div>
          </article>
        </AdminModal>
      )}
    </>
  );
}