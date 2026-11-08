import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import PageHeading from '@/components/PageHeading';
import PublicReportMarkers from '@/components/PublicReportMarkers';
import apiClient from '@/lib/api';
import { KATEGORI_LABEL, type MapPoint } from '@/types';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import './public-map.css';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];
const MAX_ZOOM = 19;

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    });
    observer.observe(map.getContainer());
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [map]);
  return null;
}

export default function MapPage() {
  const { data: mapSettings } = useQuery<{ completedMapDays: number }>({ queryKey: ['map-settings'], queryFn: async () => (await apiClient.get('/reports/map-settings')).data });
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const workspace = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    const onFullscreen = () => setExpanded(document.fullscreenElement === workspace.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setExpanded(false);
    };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', escape); };
  }, [expanded]);
  const toggleExpanded = async () => {
    if (expanded) {
      if (document.fullscreenElement === workspace.current) await document.exitFullscreen();
      else setExpanded(false);
      return;
    }
    try {
      if (workspace.current?.requestFullscreen) await workspace.current.requestFullscreen();
      else setExpanded(true);
    } catch { setExpanded(true); }
  };

  const { data: points, isError, refetch } = useQuery<MapPoint[]>({
    queryKey: ['map-points-full'],
    queryFn: async () => (await apiClient.get('/reports/map')).data,
  });

  const filteredPoints = useMemo(() => (points ?? []).filter((p) => {
    if (selectedKategori && p.kategori !== selectedKategori) return false;
    if (selectedStatus === 'diproses' && !['ditugaskan', 'dikerjakan'].includes(p.status)) return false;
    if (selectedStatus && selectedStatus !== 'diproses' && p.status !== selectedStatus) return false;
    return true;
  }), [points, selectedKategori, selectedStatus]);

  return (
    <div className="app-page map-page flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />
<div className="container-civix"><PageHeading label="Peta laporan" title="Jakarta, dalam satu peta." description="Jelajahi titik laporan warga dan pantau status penanganannya." /></div>

      <section ref={workspace} className="map-workspace public-map-workspace" data-expanded={expanded} aria-label="Peta laporan Jakarta">
        <div className="public-map-toolbar">
          <label>Kategori
            <select aria-label="Kategori laporan di peta" value={selectedKategori} onChange={e => setSelectedKategori(e.target.value)} className="input">
              <option value="">Semua Kategori</option>
              {Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label>Status
            <select aria-label="Status laporan di peta" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="input">
              <option value="">Semua Status</option>
              <option value="diterima">Menunggu Verifikasi</option>
              <option value="diverifikasi">Terverifikasi</option>
              <option value="diproses">Sedang Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </label>
          <div className="public-map-tools">
            <button type="button" className="btn-outline public-map-fullscreen" title={expanded ? 'Keluar dari layar penuh' : 'Layar penuh'} onClick={toggleExpanded} aria-label={expanded ? 'Keluar dari layar penuh' : 'Buka peta layar penuh'}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          </div>
        </div>
        {isError && <div className="public-map-notice" role="alert">Data laporan gagal dimuat. <button type="button" onClick={() => refetch()}>Coba lagi</button></div>}
        <div className="public-map-stage">
          <aside id="public-map-legend" className="public-map-legend" aria-label="Legenda status laporan">
            <header><strong>Status laporan</strong></header>
            <ul>
              <li><span className="status-dot status-red" />Menunggu Verifikasi</li>
              <li><span className="status-dot status-orange" />Terverifikasi</li>
              <li><span className="status-dot status-amber" />Sedang Diproses</li>
              <li><span className="status-dot status-green" />Selesai {mapSettings ? `(tampil ${mapSettings.completedMapDays} hari)` : ''}</li>
            </ul>
            <p>Titik selesai ditampilkan {mapSettings ? `selama ${mapSettings.completedMapDays} hari` : 'sesuai pengaturan platform'}.</p>
          </aside>
        {/* The Map */}

          <MapContainer center={DKI_CENTER} zoom={12} maxZoom={MAX_ZOOM} zoomControl={false} className="h-full w-full">
            <ResizeMap />
            <ZoomControl position="bottomleft" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={MAX_ZOOM}
            />
            <PublicReportMarkers points={filteredPoints} />
          </MapContainer>
        </div>
      </section>
    </div>
  );
}
