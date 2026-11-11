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

const guides = [
  {
    title: 'Cara membuat laporan yang jelas', kind: 'Panduan', icon: BookOpen,
    summary: 'Lengkapi informasi, lokasi, dan foto agar laporan mudah diverifikasi.',
    sections: [
      { title: 'Jelaskan masalah utama', text: 'Pilih kategori yang paling sesuai. Gunakan judul singkat dan jelaskan kondisi masalah, lokasi spesifik, serta dampaknya bagi warga.' },
      { title: 'Lengkapi lokasi dan foto', text: 'Pilih wilayah administrasi dan tandai titik kejadian di peta. Unggah satu hingga tiga foto asli yang memperlihatkan masalah. Periksa kembali sebelum mengirim.' },
      { title: 'Pantau laporan Anda', text: 'Simpan kode tiket dan pantau perubahan status melalui Riwayat Laporan.' },
    ],
    tip: 'Gunakan judul yang spesifik dan foto yang jelas. Periksa kembali informasi sebelum mengirim laporan.',
  },
  {
    title: 'Kenali kategori laporan', kind: 'Kategori', icon: ListChecks,
    summary: 'Temukan kategori yang sesuai dengan masalah di sekitar Anda.',
    sections: [],
    tip: 'Pilih satu kategori yang paling menggambarkan masalah utama. Sertakan lokasi dan foto pendukung agar laporan lebih mudah dipahami.',
  },
  {
    title: 'Memahami status penanganan', kind: 'Panduan', icon: ListChecks,
    summary: 'Ikuti perjalanan laporan dari diterima hingga selesai ditangani.',
    sections: [
      { title: 'Laporan diterima dan diverifikasi', text: 'Laporan masuk dengan status ' + STATUS_LABEL.diterima + ', lalu diperiksa oleh admin. Laporan yang telah diverifikasi dapat ditugaskan ke instansi terkait.' },
      { title: 'Penanganan hingga selesai', text: 'Instansi memperbarui status penanganan dan menambahkan catatan. Laporan selesai dilengkapi foto bukti perbaikan dan rincian biaya penanganan yang dapat dilihat pada detail laporan.' },
      { title: 'Penolakan dan laporan duplikat', text: 'Laporan dapat ditolak atau ditandai duplikat dengan catatan. Periksa riwayat status untuk melihat alasan dan perkembangan yang sebenarnya.' },
    ],
    tip: 'Buka detail laporan pada Riwayat Laporan untuk melihat catatan serta bukti penanganan terbaru.',
  },
  {
    title: 'Memahami biaya penanganan', kind: 'Panduan', icon: Info,
    summary: 'Lihat sumber pendanaan dan penggunaan biaya pada laporan yang selesai.',
    sections: [
      { title: 'Lihat rincian biaya', text: 'Buka detail laporan selesai untuk melihat nominal biaya, sumber pendanaan, rincian penggunaan, serta instansi pencatat. Nilai Rp0 berarti penanganan tidak memerlukan biaya tambahan; laporan tanpa rincian biaya ditampilkan terpisah.' },
      { title: 'Pahami ringkasan statistik', text: 'Statistik publik merangkum biaya berdasarkan tanggal penyelesaian, wilayah, dan instansi. Total biaya tercatat berasal dari laporan, bukan keseluruhan anggaran tahunan instansi.' },
      { title: 'Periksa riwayat koreksi', text: 'Jika instansi mengoreksi biaya, nilai terdahulu dan alasan koreksi tetap dapat dilihat pada riwayat pencatatan biaya.' },
    ],
    tip: 'Periksa rincian penggunaan dan riwayat koreksi biaya pada detail laporan yang telah selesai.',
  },
  {
    title: 'Privasi dan laporan anonim', kind: 'Panduan', icon: ShieldCheck,
    summary: 'Pahami cara identitas Anda ditampilkan pada laporan publik.',
    sections: [
      { title: 'Pilihan laporan anonim', text: 'Aktifkan Kirim sebagai anonim sebelum mengirim laporan jika Anda ingin menyembunyikan identitas di detail laporan publik. Admin tetap dapat melihat pelapor untuk keperluan verifikasi.' },
      { title: 'Lindungi informasi pribadi', text: 'Nomor telepon dan alamat pada profil Warga tidak ditampilkan pada laporan publik. Hindari menuliskan data pribadi pada judul, deskripsi, komentar, dan foto.' },
    ],
    tip: 'Periksa foto sebelum diunggah. Hindari menampilkan nomor identitas, nomor telepon, atau data pribadi orang lain.',
  },
  {
    title: 'Menentukan lokasi kejadian', kind: 'Panduan', icon: MapPin,
    summary: 'Gunakan titik peta dan alamat yang tepat agar lokasi mudah ditemukan.',
    sections: [
      { title: 'Tandai titik kejadian', text: 'Pilih wilayah administrasi sesuai lokasi masalah, lalu klik peta untuk menetapkan koordinat. Pencarian alamat dan lokasi perangkat dapat membantu menemukan area awal.' },
      { title: 'Pastikan lokasi berada di DKI Jakarta', text: 'CIVIX menerima laporan dalam wilayah DKI Jakarta. Pastikan titik berada di lokasi kejadian dan tulis nama jalan atau penanda yang jelas.' },
    ],
    tip: 'Lokasi perangkat hanya membantu menemukan area awal. Sesuaikan kembali pin dengan titik kejadian yang sebenarnya.',
  },
];
export default function CitizenInformationPage() {
  const [tab, setTab] = useState('Semua');
  const [selected, setSelected] = useState<typeof guides[number] | null>(null);

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
                  {selected.sections.map((section, index) => (
                    <li key={section.title}>
                      <span className="warga-reading-number" aria-hidden="true">{index + 1}</span>
                      <div><h3>{section.title}</h3><p>{section.text}</p></div>
                    </li>
                  ))}
                </ol>
              )}
              <aside className="warga-reading-tip">
                <Info size={19} aria-hidden="true" />
                <div><h3>Tips pelaporan</h3><p>{selected.tip}</p></div>
              </aside>
            </div>
          </article>
        </AdminModal>
      )}
    </>
  );
}
