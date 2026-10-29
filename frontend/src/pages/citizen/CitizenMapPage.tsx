import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import apiClient from '@/lib/api';
import { MapPoint, Region, KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge, WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { getStatusColor } from '@/lib/utils';
import QueryError from '@/components/QueryError';

type Point = MapPoint & { regionId: string | null; region?: Region | null; owned: boolean };
function Viewport({ focus, onBounds }: { focus?: Point; onBounds: (bounds: LatLngBounds) => void }) {
  const map = useMapEvents({ moveend: () => onBounds(map.getBounds()) });
  useEffect(() => { if (focus) map.setView([Number(focus.latitude), Number(focus.longitude)], 15, { animate: false }); }, [map, focus?.id, focus?.latitude, focus?.longitude]);
  useEffect(() => { onBounds(map.getBounds()); const observer = new ResizeObserver(() => { map.invalidateSize({ pan: false }); onBounds(map.getBounds()); }); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map, onBounds]);
  return null;
}
export default function CitizenMapPage() {
  const user = useAuthStore(state => state.user);
  const [params] = useSearchParams();
  const query = useQuery<Point[]>({ queryKey: ['citizen-map', user?.id], queryFn: async () => (await apiClient.get('/citizen/map')).data, refetchInterval: 30000 });
  const regions = useQuery<Region[]>({ queryKey: ['public-regions'], queryFn: async () => (await apiClient.get('/reports/regions')).data });
  const [filters, setFilters] = useState({ kategori: '', regionId: '', status: '' });
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const focus = query.data?.find(row => row.id === params.get('laporan'));
  const points = useMemo(() => (query.data || []).filter(row => (!filters.kategori || row.kategori === filters.kategori) && (!filters.regionId || row.regionId === filters.regionId) && (!filters.status || row.status === filters.status)), [query.data, filters]);
  const visible = points.filter(row => !bounds || bounds.contains([Number(row.latitude), Number(row.longitude)]));
  const link = (row: Point) => row.owned ? '/citizen/reports/' + row.id : '/citizen/map/' + row.id;
  return <><header className="admin-page-header"><div><h1>Peta Laporan</h1><p>Jelajahi laporan publik di Jakarta dan lokasi laporan Anda.</p></div><WorkspaceRefresh refreshing={query.isFetching} onClick={() => query.refetch()} /></header><div className="warga-map-filters admin-panel"><label>Kategori<select className="input" value={filters.kategori} onChange={event => setFilters({ ...filters, kategori: event.target.value })}><option value="">Semua kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Wilayah<select className="input" value={filters.regionId} onChange={event => setFilters({ ...filters, regionId: event.target.value })}><option value="">Semua wilayah</option>{regions.data?.map(row => <option key={row.id} value={row.id}>{row.nama}</option>)}</select></label><label>Status<select className="input" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">Semua status</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    {query.isError ? <QueryError subject="Peta laporan" retry={query.refetch} /> : <div className="warga-map-grid"><section className="admin-panel warga-map-canvas"><MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={false} className="h-full w-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' /><Viewport focus={focus} onBounds={setBounds} />{points.map(point => <CircleMarker key={point.id} center={[Number(point.latitude), Number(point.longitude)]} radius={9} pathOptions={{ color: 'white', weight: 3, fillColor: getStatusColor(point.status), fillOpacity: 1, className: point.status === 'diterima' ? 'marker-pulse-red' : '' }}><Popup><strong>{point.judul}</strong><p>{STATUS_LABEL[point.status]}</p><Link to={link(point)}>Lihat detail →</Link></Popup></CircleMarker>)}</MapContainer>{query.isLoading && <div className="landing-map-notice">Memuat laporan…</div>}</section><aside className="admin-panel warga-map-list"><h2>Daftar Laporan di Area Ini</h2><small>{visible.length} laporan</small>{visible.map(row => <Link to={link(row)} key={row.id}>{row.photos?.[0]?.url && <img src={row.photos[0].url} alt="" />}<div><strong>{row.judul}</strong><small>{row.namaJalan || row.region?.nama || 'DKI Jakarta'}</small><StatusBadge status={row.status} />{row.owned && <em>Laporan Anda</em>}</div></Link>)}{!query.isLoading && !visible.length && <p className="admin-loading">Tidak ada laporan pada area atau filter ini. Geser peta atau ubah filter.</p>}</aside></div>}<p className="warga-map-note">Laporan publik mengikuti durasi tampilan peta yang diatur admin. Laporan milik Anda tetap dapat dilihat.</p></>;
}
