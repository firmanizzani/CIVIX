import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
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
}

export default function LandingMap({ points, loading, error, retry, fetching }: Props) {
  return (
    <div className="landing-map" data-ui>
      <MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={false} dragging={false} zoomControl={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        {points.slice(0, 30).filter(point => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))).map(point => (
          <CircleMarker key={point.id} center={[Number(point.latitude), Number(point.longitude)]} radius={8} pathOptions={{ color: 'white', weight: 3, fillColor: getStatusColor(point.status), fillOpacity: 1 }}>
            <Popup><strong>{point.judul}</strong><p>{KATEGORI_LABEL[point.kategori]} · {STATUS_LABEL[point.status]}</p><Link to={`/reports/${point.id}`}>Lihat detail laporan →</Link></Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {loading && <div className="landing-map-notice" role="status"><Loader2 size={16} className="animate-spin" /> Memuat laporan…</div>}
      {error && <div className="landing-map-notice" role="status">Data laporan belum tersedia. <button type="button" onClick={retry} disabled={fetching}>{fetching ? 'Memuat…' : 'Coba lagi'}</button></div>}
      {!loading && !error && !points.length && <div className="landing-map-notice"><MapPin size={16} /> Laporan terverifikasi akan tampil di sini.</div>}
    </div>
  );
}
