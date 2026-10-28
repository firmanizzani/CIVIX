import { Link } from 'react-router-dom';
import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import { KATEGORI_LABEL, STATUS_LABEL, MapPoint } from '@/types';
import { getStatusColor } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface Props {
  points: MapPoint[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  fetching: boolean;
  interactive?: boolean;
}

function MapResizeSync() {
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

export default function LandingMap({ points, loading, error, retry, fetching, interactive = false }: Props) {
  return (
    <div className="landing-map" data-ui>
      <MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={false} dragging={interactive} zoomControl={interactive} touchZoom={interactive} doubleClickZoom={interactive} boxZoom={interactive} keyboard={interactive} className="h-full w-full">
        <MapResizeSync />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        {points.slice(0, 30).filter(point => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))).map(point => {
          const popup = <Popup><strong>{point.judul}</strong><p>{KATEGORI_LABEL[point.kategori]} · {STATUS_LABEL[point.status]}</p><Link to={`/reports/${point.id}`}>Lihat detail laporan →</Link></Popup>;
          const center: [number, number] = [Number(point.latitude), Number(point.longitude)];
          const isRed = point.status === 'diterima';
          return <Fragment key={point.id}>
            {isRed && <CircleMarker center={center} radius={16} interactive={false} pathOptions={{ color: '#ef4444', weight: 1.5, fillColor: '#dc2626', fillOpacity: .2, className: 'marker-pulse-halo' }} />}
            <CircleMarker center={center} radius={8} pathOptions={{ color: 'white', weight: 3, fillColor: getStatusColor(point.status), fillOpacity: 1, className: isRed ? 'marker-pulse-red' : '' }}>{popup}</CircleMarker>
          </Fragment>;
        })}
      </MapContainer>
      {loading && <div className="landing-map-notice" role="status"><Loader2 size={16} className="animate-spin" /> Memuat laporan…</div>}
      {error && <div className="landing-map-notice" role="status">Data laporan belum tersedia. <button type="button" onClick={retry} disabled={fetching}>{fetching ? 'Memuat…' : 'Coba lagi'}</button></div>}
      {!loading && !error && !points.length && <div className="landing-map-notice"><MapPin size={16} /> Laporan terverifikasi akan tampil di sini.</div>}
    </div>
  );
}
