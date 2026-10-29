import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { KATEGORI_LABEL, STATUS_LABEL, Report } from '@/types';
import { StatusBadge, reportCover, WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import QueryError from '@/components/QueryError';
import { getStatusColor } from '@/lib/utils';
import { useAgencyOverview } from './agencyData';
import 'leaflet/dist/leaflet.css';

function MapViewport({ onBounds, focus }: { onBounds: (bounds: LatLngBounds) => void; focus?: Report }) {
  const map = useMapEvents({ moveend: () => onBounds(map.getBounds()), zoomend: () => onBounds(map.getBounds()) });
  useEffect(() => { if (focus) map.setView([Number(focus.latitude), Number(focus.longitude)], 15, { animate: false }); }, [map, focus?.id]);
  useEffect(() => {
    onBounds(map.getBounds());
    const observer = new ResizeObserver(() => { map.invalidateSize({ pan: false }); onBounds(map.getBounds()); });
    observer.observe(map.getContainer()); return () => observer.disconnect();
  }, [map, onBounds]);
  return null;
}

export default function AgencyMapPage({ admin = false }: { admin?: boolean }) {
  const query = useAgencyOverview(admin ? 'admin' : 'agency');
  const base = admin ? '/admin' : '/agency';
  const [params] = useSearchParams();
  const focus = query.data?.items.find(row => row.id === params.get('laporan'));
  const [draft, setDraft] = useState({ kategori: '', regionId: '', status: '' });
  const [filters, setFilters] = useState(draft);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const points = useMemo(() => (query.data?.items || []).filter(row => (!filters.kategori || row.kategori === filters.kategori) && (!filters.regionId || row.regionId === filters.regionId) && (!filters.status || row.status === filters.status) && Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude))), [query.data, filters]);
  const visible = points.filter(row => !bounds || bounds.contains([Number(row.latitude), Number(row.longitude)]));
  const reportLink = (row: Report) => `${base}/${admin ? 'reports' : 'assignments'}?laporan=${encodeURIComponent(row.id)}`;
  return <><header className="admin-page-header"><div><h1>Peta Laporan</h1><p>{admin ? 'Visualisasi seluruh laporan warga dan status penanganannya di Jakarta.' : 'Visualisasi lokasi laporan yang ditugaskan ke instansi Anda.'}</p></div><WorkspaceRefresh refreshing={query.isFetching} onClick={() => query.refetch()} /></header>
    {query.isError ? <QueryError subject={admin ? "Peta admin" : "Peta instansi"} retry={query.refetch} /> : <div className="agency-map-grid"><section className="admin-panel agency-map-canvas" aria-label={admin ? "Peta laporan admin" : "Peta tugas instansi"}><MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={false} className="h-full w-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' /><MapViewport onBounds={setBounds} focus={focus} />{points.map(row => <CircleMarker key={row.id} center={[Number(row.latitude), Number(row.longitude)]} radius={9} pathOptions={{ color: 'white', weight: 3, fillColor: getStatusColor(row.status), fillOpacity: 1, className: row.status === 'diterima' ? 'marker-pulse-red' : '' }}><Popup><strong>{row.judul}</strong><p>{STATUS_LABEL[row.status]}</p><Link to={reportLink(row)}>Lihat detail →</Link></Popup></CircleMarker>)}</MapContainer>{query.isLoading && <div className="landing-map-notice">Memuat laporan…</div>}<div className="agency-map-legend">{Object.entries(STATUS_LABEL).map(([status, label]) => <span key={status}><i style={{ background: getStatusColor(status as Report['status']) }} />{label}</span>)}</div></section>
    <aside><form className="admin-panel agency-map-filters" onSubmit={event => { event.preventDefault(); setFilters(draft); }}><h2>Filter Peta</h2><label>Kategori<select className="input" value={draft.kategori} onChange={event => setDraft({ ...draft, kategori: event.target.value })}><option value="">Semua kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Wilayah<select className="input" value={draft.regionId} onChange={event => setDraft({ ...draft, regionId: event.target.value })}><option value="">Semua wilayah</option>{query.data?.regions.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}</select></label><label>Status<select className="input" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="">Semua status</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="btn-primary">Terapkan Filter</button><button type="button" className="admin-text-button" onClick={() => { const reset = { kategori: '', regionId: '', status: '' }; setDraft(reset); setFilters(reset); }}>Reset filter</button></form>
    <section className="admin-panel agency-map-list"><header><h2>Laporan di Area Ini</h2><span>{visible.length} laporan</span></header>{visible.length ? visible.map(row => <Link key={row.id} to={reportLink(row)}>{reportCover(row) ? <img src={reportCover(row)} alt="" /> : <span className="agency-no-thumb">—</span>}<div><strong>{row.judul}</strong><small>{row.region?.nama || 'DKI Jakarta'}</small><StatusBadge status={row.status} /></div></Link>) : <p className="admin-loading">{query.isLoading ? 'Memuat laporan…' : 'Tidak ada laporan pada area dan filter ini. Geser peta atau ubah filter.'}</p>}</section></aside></div>}
  </>;
}
