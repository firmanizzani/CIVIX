import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { MapPoint, STATUS_LABEL, KATEGORI_LABEL, STATUS_MAP_COLOR, KategoriLaporan, StatusLaporan } from '@/types';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Layers, Info } from 'lucide-react';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];

const getColor = (status: StatusLaporan) => {
  switch (STATUS_MAP_COLOR[status]) {
    case 'merah':
      return '#dc2626';
    case 'oranye':
      return '#d97706';
    case 'kuning':
      return '#facc15';
    case 'hijau':
      return '#65a30d';
    default:
      return '#64748b';
  }
};

export default function MapPage() {
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: points = [], isLoading } = useQuery<MapPoint[]>({
    queryKey: ['map-points-full'],
    queryFn: async () => (await apiClient.get('/reports/map')).data,
  });

  const filteredPoints = points.filter((p) => {
    if (selectedKategori && p.kategori !== selectedKategori) return false;
    if (selectedStatus === 'diproses' && !['ditugaskan', 'dikerjakan'].includes(p.status)) return false;
    if (selectedStatus && selectedStatus !== 'diproses' && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <div className="relative flex flex-1 flex-col">
        {/* Floating Filter Controls */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur border border-slate-200 animate-in-up">
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="input text-xs py-1.5 min-w-[140px]"
          >
            <option value="">Semua Kategori</option>
            {Object.entries(KATEGORI_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input text-xs py-1.5 min-w-[140px]"
          >
            <option value="">Semua Status</option>
            <option value="diterima">Menunggu Verifikasi</option>
            <option value="diverifikasi">Terverifikasi</option>
            <option value="diproses">Sedang Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 right-4 z-[1000] rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur border border-slate-200 max-w-xs animate-in-up-delay-1">
          <div className="mb-2 text-xs font-bold text-civix-navy flex items-center gap-1.5">
            <Layers size={14} /> Legenda Status Laporan
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="status-dot status-red" />
              <span>Merah: Baru dilaporkan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot status-orange" />
              <span>Oranye: Terverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot status-amber" />
              <span>Kuning: Sedang Diproses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot status-green" />
              <span>Hijau: Selesai (tampil 7 hari)</span>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
            Titik hijau otomatis hilang setelah 7 hari untuk menjaga keterbacaan peta.
          </p>
        </div>

        {/* The Map */}
        <div className="h-[calc(100vh-64px)] w-full">
          <MapContainer center={DKI_CENTER} zoom={12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            {filteredPoints.map((point) => {
              const isRed = point.status === 'diterima';
              const coords: [number, number] = [Number(point.latitude), Number(point.longitude)];
              return (
                <React.Fragment key={point.id}>
                  {/* Glowing pulsing halo effect for red urgent markers */}
                  {isRed && (
                    <CircleMarker
                      center={coords}
                      radius={18}
                      interactive={false}
                      pathOptions={{
                        color: '#ef4444',
                        weight: 1.5,
                        fillColor: '#dc2626',
                        fillOpacity: 0.25,
                        className: 'marker-pulse-halo',
                      }}
                    />
                  )}
                  <CircleMarker
                    center={coords}
                    radius={isRed ? 10 : 8}
                    pathOptions={{
                      color: 'white',
                      weight: 2,
                      fillColor: getColor(point.status),
                      fillOpacity: 0.95,
                      className: isRed ? 'marker-pulse-red' : '',
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <span className="mono text-[10px] text-slate-400">{point.kodeTiket}</span>
                        <h3 className="font-bold text-sm text-civix-forest mt-0.5">{point.judul}</h3>
                        {point.namaJalan && (
                          <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                            <span className="font-semibold text-civix-forest">Lokasi:</span> {point.namaJalan}
                          </p>
                        )}
                        <p className="text-xs text-civix-primary mt-1 font-medium">{KATEGORI_LABEL[point.kategori]}</p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{STATUS_LABEL[point.status]}</p>
                        <Link
                          to={`/reports/${point.id}`}
                          className="mt-3 block rounded-lg bg-lime-600 px-3 py-1.5 text-center text-xs font-semibold !text-white shadow-sm transition hover:bg-lime-700"
                        >
                          Buka Laporan
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
