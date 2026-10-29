import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import apiClient from '@/lib/api';
import { Report, KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import { StatusBadge } from '@/components/ReportWorkspaceUI';
import QueryError from '@/components/QueryError';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export default function CitizenReportDetail({ publicMode = false }: { publicMode?: boolean }) {
  const { id } = useParams();
  const user = useAuthStore(state => state.user);
  const [photo, setPhoto] = useState(0);
  const query = useQuery<Report>({ queryKey: ['citizen-detail', user?.id, id, publicMode], queryFn: async () => (await apiClient.get((publicMode ? '/reports/' : '/citizen/reports/') + id)).data, refetchInterval: 30000 });
  const report = query.data;
  const back = publicMode ? '/citizen/map' : '/citizen/reports';
  const coords: [number, number] = [Number(report?.latitude), Number(report?.longitude)];
  return <><Link className="admin-back" to={back}><ArrowLeft size={15} />{publicMode ? 'Peta Laporan' : 'Riwayat Laporan'} <span>›</span> Detail Laporan</Link>{query.isError ? <QueryError subject="Detail laporan" retry={query.refetch} /> : !report ? <p className="admin-loading">Memuat detail laporan…</p> : <>
    <header className="warga-detail-title"><div><h1>{report.judul}</h1><StatusBadge status={report.status} /></div><p>{report.kodeTiket} · Dibuat pada {formatDateTime(report.dibuatPada)} WIB</p></header><div className="warga-detail-grid"><section>{report.photos?.length ? <><img className="warga-detail-photo" src={(report.photos[photo] || report.photos[0]).url} alt={report.judul} /><div className="admin-photo-thumbs">{report.photos.map((item, i) => <button key={item.id} aria-label={`Lihat foto ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}><img src={item.url} alt="" />{item.jenis === 'bukti_perbaikan' && <span>Bukti selesai</span>}</button>)}</div></> : <div className="warga-detail-photo warga-no-photo"><MapPin size={30} />Tidak ada foto terlampir</div>}</section><section className="warga-detail-info"><h2>Informasi Laporan</h2><dl><div><dt>Kategori</dt><dd>{KATEGORI_LABEL[report.kategori]}</dd></div><div><dt>Lokasi</dt><dd>{report.namaJalan || 'Alamat belum dicantumkan'}<small>{report.region?.nama}</small></dd></div><div><dt>Deskripsi</dt><dd className="warga-description">{report.deskripsi}</dd></div><div><dt>Instansi</dt><dd>{report.assignedAgency?.nama || 'Menunggu penugasan'}</dd></div>{!publicMode && <div><dt>Privasi</dt><dd>{report.anonim ? 'Identitas anonim di halaman publik' : 'Laporan dengan identitas akun Anda'}</dd></div>}</dl>{coords.every(Number.isFinite) && <MapContainer key={report.id} center={coords} zoom={14} zoomControl={false} dragging={false} scrollWheelZoom={false} className="warga-detail-map"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' /><CircleMarker center={coords} radius={10} pathOptions={{ color: 'white', weight: 3, fillColor: getStatusColor(report.status), fillOpacity: 1 }} /></MapContainer>}<Link className="workspace-text-link" to={'/citizen/map?laporan=' + report.id}><MapPin size={13} />Lihat di Peta</Link></section></div>
    <section className="warga-status-history"><h2>Status Penanganan</h2><ol>{[...(report.statusLogs || [])].reverse().map(log => <li key={log.id}><i style={{ background: getStatusColor(log.status) }} /><strong>{STATUS_LABEL[log.status]}</strong><time>{formatDateTime(log.waktu)}</time><p>{log.catatan || 'Status laporan diperbarui'}</p></li>)}</ol>{!report.statusLogs?.length && <p>Belum ada perubahan status.</p>}</section><Link className="workspace-text-link" to={'/reports/' + report.id}>Buka halaman publik dan diskusi laporan →</Link>
  </>}</>;
}
