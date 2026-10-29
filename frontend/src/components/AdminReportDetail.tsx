import { useEffect, useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CalendarDays, UserRound, Tag, LocateFixed, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { Report, KATEGORI_LABEL } from '@/types';
import { StatusBadge } from '@/components/ReportWorkspaceUI';
import { formatDateTime, getStatusColor } from '@/lib/utils';

export default function AdminReportDetail({ report, onBack, actions }: { report: Report; onBack: () => void; actions: ReactNode }) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [report.id]);
  const photos = report.photos || [];
  const coords: [number, number] = [Number(report.latitude), Number(report.longitude)];
  const validCoords = coords.every(Number.isFinite);
  return <section className="admin-report-detail">
    <button type="button" className="admin-back" onClick={onBack}><ArrowLeft size={15} /> Semua Laporan <span>›</span> Detail Laporan</button>
    <header className="admin-detail-header"><div><div><h1>{report.kodeTiket}</h1><StatusBadge status={report.status} /></div><p>Dibuat pada {formatDateTime(report.dibuatPada)} WIB</p></div></header>
    <div className="admin-detail-grid">
      <div className="admin-detail-photos">{photos.length ? <><img className="admin-detail-photo" src={photos[photo]?.url || photos[0].url} alt={`Foto ${report.judul}`} /><div className="admin-photo-thumbs">{photos.map((item, index) => <button key={item.id} type="button" aria-label={`Lihat foto ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}><img src={item.url} alt="" />{item.jenis === 'bukti_perbaikan' && <span>Bukti selesai</span>}</button>)}</div></> : <div className="admin-no-photo"><MapPin size={30} /><p>Tidak ada foto terlampir</p></div>}</div>
      <div className="admin-detail-info"><h2>{report.judul}</h2><p className="admin-detail-description">{report.deskripsi}</p><dl>
        <div><dt><Tag size={15} />Kategori</dt><dd><span className="admin-category" data-category={report.kategori}>{KATEGORI_LABEL[report.kategori]}</span></dd></div>
        <div><dt><MapPin size={15} />Lokasi</dt><dd>{report.namaJalan || report.region?.nama || 'Alamat belum dicantumkan'}{report.region && <small>{report.region.nama}</small>}</dd></div>
        <div><dt><UserRound size={15} />Pelapor</dt><dd>{report.user?.nama || 'Warga'}{report.anonim && <small>Identitas disembunyikan pada halaman publik</small>}</dd></div>
        <div><dt><CalendarDays size={15} />Waktu laporan</dt><dd>{formatDateTime(report.dibuatPada)} WIB</dd></div>
        <div><dt><LocateFixed size={15} />Koordinat</dt><dd>{report.latitude}, {report.longitude}</dd></div>
        {report.assignedAgency && <div><dt>Instansi</dt><dd>{report.assignedAgency.nama}</dd></div>}
      </dl></div>
      <aside className="admin-detail-location">{validCoords && <MapContainer key={report.id} center={coords} zoom={14} scrollWheelZoom={false} zoomControl={false} className="admin-detail-map"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' /><CircleMarker center={coords} radius={10} pathOptions={{ color: 'white', weight: 3, fillOpacity: 1, fillColor: getStatusColor(report.status) }} /></MapContainer>}<p><MapPin size={15} />{report.region?.nama || 'DKI Jakarta'}</p><Link to="/map">Buka peta publik</Link></aside>
    </div>
    <div className="admin-detail-actions admin-panel">{actions}</div>
    <section className="admin-panel admin-detail-history"><h2>Riwayat Penanganan</h2>{report.statusLogs?.length ? <ol>{report.statusLogs.map(log => <li key={log.id}><span style={{ background: getStatusColor(log.status) }} /><div><strong>{formatDateTime(log.waktu)}</strong><p>{log.catatan || 'Status laporan diperbarui'}</p><StatusBadge status={log.status} /></div></li>)}</ol> : <p>Belum ada perubahan status.</p>}</section>
  </section>;
}
