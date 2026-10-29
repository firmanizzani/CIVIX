import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Report, KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import { StatusBadge } from '@/components/ReportWorkspaceUI';
import { formatDateTime, getStatusColor } from '@/lib/utils';

export default function AgencyTaskDetail({ report, onBack, actions }: { report: Report; onBack: () => void; actions: ReactNode }) {
  const [photo, setPhoto] = useState(0);
  const photos = report.photos || [];
  return <><button className="admin-back" onClick={onBack}><ArrowLeft size={15} />Tugas Penanganan <span>›</span> Detail Laporan</button>
    <header className="admin-detail-header"><div><div><h1>{report.kodeTiket}</h1><StatusBadge status={report.status} /></div><p>Dibuat pada {formatDateTime(report.dibuatPada)} WIB</p></div></header>
    <div className="agency-task-grid"><article className="agency-task-main">
      {photos.length ? <><img className="agency-task-photo" src={(photos[photo] || photos[0]).url} alt={`Foto laporan ${report.judul}`} /><div className="admin-photo-thumbs">{photos.map((item, i) => <button key={item.id} aria-label={`Lihat foto ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}><img src={item.url} alt="" />{item.jenis === 'bukti_perbaikan' && <span>Bukti selesai</span>}</button>)}</div></> : <div className="admin-no-photo agency-task-photo"><MapPin size={32} /><p>Belum ada foto laporan</p></div>}
      <h2>{report.judul}</h2><p className="agency-description">{report.deskripsi}</p><dl><div><dt>Kategori</dt><dd>{KATEGORI_LABEL[report.kategori]}</dd></div><div><dt>Lokasi</dt><dd>{report.namaJalan || 'Alamat belum tersedia'}<small>{report.region?.nama}</small></dd></div><div><dt>Instansi</dt><dd>{report.assignedAgency?.nama || '—'}</dd></div><div><dt>Koordinat</dt><dd>{report.latitude}, {report.longitude}</dd></div></dl><Link className="workspace-text-link" to={`/reports/${report.id}`}>Lihat laporan di halaman publik →</Link>
    </article><aside className="agency-task-side"><section className="admin-panel agency-timeline"><h2>Status Penanganan</h2><ol>{[...(report.statusLogs || [])].reverse().map(log => <li key={log.id}><i style={{ background: getStatusColor(log.status) }} /><div><strong>{STATUS_LABEL[log.status]}</strong><small>{formatDateTime(log.waktu)} WIB</small><p>{log.catatan || 'Status laporan diperbarui'}</p></div></li>)}{!report.statusLogs?.length && <li>Belum ada riwayat penanganan.</li>}</ol></section><section className="admin-panel agency-task-actions"><h2>Tindakan</h2>{actions}</section></aside></div>
  </>;
}
