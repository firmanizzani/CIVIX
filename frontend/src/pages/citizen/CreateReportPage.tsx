import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { KATEGORI_LABEL } from '@/types';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Upload,
  X,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Crosshair,
} from 'lucide-react';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type GeocodingResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const DKI_VIEWBOX = '106.68,-5.2,106.98,-6.38';

function MapController({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 0.7 });
  }, [map, position]);

  return null;
}

function LocationPicker({
  position,
  onSelect,
}: {
  position: [number, number] | null;
  onSelect: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [namaJalan, setNamaJalan] = useState('');
  const [kategori, setKategori] = useState('');
  const [anonim, setAnonim] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=id`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Gagal reverse geocode');
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || addr.suburb || '';
      const area = addr.suburb || addr.village || addr.city_district || addr.city || '';
      const fullLabel = [road, area].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
      if (fullLabel) {
        setNamaJalan(fullLabel);
      }
    } catch {
      // Fallback jika API Nominatim gagal/rate-limited: jangan crash
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const handleMapClick = useCallback((pos: [number, number]) => {
    setPosition(pos);
    fetchAddressFromCoords(pos[0], pos[1]);
  }, [fetchAddressFromCoords]);

  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = (searchQuery || namaJalan).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const queryWithContext = q.toLowerCase().includes('jakarta') ? q : `${q}, Jakarta`;
      const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(queryWithContext)}&format=json&limit=5&viewbox=${DKI_VIEWBOX}&bounded=1&addressdetails=1&accept-language=id`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Gagal mencari alamat');
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length > 0) {
        const top = data[0];
        const newPos: [number, number] = [parseFloat(top.lat), parseFloat(top.lon)];
        setPosition(newPos);
        setNamaJalan(q);
      }
    } catch {
      // Biarkan user tetap bisa input manual jika rate limited
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    const simplified = result.display_name.split(',').slice(0, 3).join(', ');
    setNamaJalan(simplified);
    setSearchResults([]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        fetchAddressFromCoords(coords[0], coords[1]);
      },
      () => {
        alert('Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi aktif.');
      },
      { timeout: 8000 }
    );
  };

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => (await apiClient.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
    onSuccess: (data) => {
      navigate(`/reports/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal mengirim laporan');
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      alert('Maksimal 3 foto');
      return;
    }
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File ${f.name} terlalu besar. Maksimal 5MB per foto.`);
        return;
      }
    }
    setPhotos((prev) => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!namaJalan.trim()) {
      setError('Masukkan nama jalan atau alamat lokasi');
      return;
    }

    if (!position) {
      setError('Pilih lokasi kejadian di peta');
      return;
    }

    if (photos.length === 0) {
      setError('Unggah minimal 1 foto bukti');
      return;
    }

    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('deskripsi', deskripsi);
    formData.append('namaJalan', namaJalan.trim());
    formData.append('kategori', kategori);
    formData.append('latitude', position[0].toString());
    formData.append('longitude', position[1].toString());
    formData.append('anonim', anonim.toString());
    formData.append('regionId', '1'); // Demo: default region
    for (const photo of photos) {
      formData.append('photos', photo);
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-civix-navy">Buat Laporan Baru</h1>
            <p className="mt-2 text-slate-600">
              Laporkan masalah infrastruktur atau lingkungan di wilayah DKI Jakarta. Laporan akan diverifikasi oleh admin sebelum ditindaklanjuti.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="card p-6 space-y-5">
              <div>
                <label className="label">Judul Laporan *</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Jalan berlubang di Jl. Sudirman"
                  className="input"
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label className="label">Kategori Masalah *</label>
                <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="input" required>
                  <option value="">Pilih kategori</option>
                  {Object.entries(KATEGORI_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Deskripsi Lengkap *</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan kondisi masalah secara detail..."
                  className="input min-h-[120px]"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Jelaskan kondisi, lokasi spesifik, dan dampak yang dirasakan.</p>
              </div>

              <div>
                <label className="label">Foto Bukti * (1-3 foto, max 5MB per foto)</label>
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                  
                  {photos.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {photos.map((file, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-lg border border-slate-200">
                          <img src={URL.createObjectURL(file)} alt={`Preview ${i + 1}`} className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-sm font-medium text-slate-600 transition hover:border-civix-blue hover:bg-blue-50 hover:text-civix-blue"
                    >
                      <Upload size={18} />
                      Pilih Foto ({photos.length}/3)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <label className="label flex items-center gap-2">
                <MapPin size={16} /> Lokasi Kejadian *
              </label>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">
                Ketik nama jalan untuk mencari lokasi, gunakan lokasi perangkat, atau klik peta. Nama alamat akan terisi otomatis saat memilih titik peta.
              </p>

              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={namaJalan}
                    onChange={(e) => {
                      setNamaJalan(e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAddress();
                      }
                    }}
                    placeholder="Cari jalan atau alamat, contoh: Jl. MH Thamrin"
                    className="input"
                    maxLength={200}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchAddress()}
                    disabled={isSearching || !namaJalan.trim()}
                    className="btn-primary shrink-0"
                  >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    <span className="hidden sm:inline">Cari</span>
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-[1100] mt-2 w-full overflow-hidden rounded-lg border border-civix-border bg-white shadow-xl">
                    <p className="border-b border-civix-border px-3 py-2 text-xs font-semibold text-civix-muted">Pilih lokasi hasil pencarian</p>
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="flex w-full items-start gap-2 border-b border-civix-border px-3 py-3 text-left text-sm text-civix-text transition last:border-0 hover:bg-civix-soft"
                      >
                        <MapPin size={15} className="mt-0.5 shrink-0 text-civix-primary" />
                        <span>{result.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={handleUseCurrentLocation} className="btn-outline text-xs">
                  <Crosshair size={15} /> Gunakan lokasi saya
                </button>
                {isReverseGeocoding && (
                  <span className="flex items-center gap-1.5 text-xs text-civix-muted">
                    <Loader2 size={14} className="animate-spin" /> Mencari nama jalan...
                  </span>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border-2 border-civix-border">
                <div className="h-[400px]">
                  <MapContainer center={DKI_CENTER} zoom={12} className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                    <MapController position={position} />
                    <LocationPicker position={position} onSelect={handleMapClick} />
                  </MapContainer>
                </div>
              </div>
              {position && (
                <div className="mt-3 rounded-lg bg-civix-soft p-3 text-xs">
                  <p className="font-semibold text-civix-forest">Lokasi dipilih:</p>
                  <p className="mt-1 text-civix-text">{namaJalan || 'Nama jalan sedang dicari...'}</p>
                  <p className="mono mt-1 text-civix-muted">
                    Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div className="card p-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={anonim} onChange={(e) => setAnonim(e.target.checked)} className="mt-1" />
                <div className="text-sm">
                  <span className="font-semibold text-slate-800">Kirim sebagai anonim</span>
                  <p className="text-xs text-slate-500">
                    Identitas Anda tidak akan ditampilkan secara publik. Admin tetap dapat melihat informasi pelapor untuk keperluan verifikasi.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/citizen')} className="btn-outline flex-1">
                Batal
              </button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Kirim Laporan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
