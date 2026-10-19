import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { KATEGORI_LABEL } from '@/types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, X, MapPin, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState('');
  const [anonim, setAnonim] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                <MapPin size={16} /> Lokasi Kejadian * (klik pada peta)
              </label>
              <p className="mb-3 text-xs text-slate-500">
                Klik pada peta untuk menandai lokasi permasalahan. Pastikan lokasi berada di dalam wilayah DKI Jakarta.
              </p>
              <div className="overflow-hidden rounded-lg border-2 border-slate-200">
                <div className="h-[400px]">
                  <MapContainer center={DKI_CENTER} zoom={12} className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
              </div>
              {position && (
                <div className="mt-2 rounded bg-slate-50 p-3 text-xs">
                  <p className="font-semibold text-slate-700">Koordinat dipilih:</p>
                  <p className="mono text-slate-600">
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
