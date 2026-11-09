import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { latLng } from 'leaflet';
import { CheckCircle2, Crosshair, Loader2, Search, Upload, X } from 'lucide-react';
import apiClient from '@/lib/api';
import { getActionError, invalidateReportQueries } from '@/hooks/useReportWorkspace';
import { KATEGORI_LABEL, NearbyReport, Region } from '@/types';
import 'leaflet/dist/leaflet.css';
type Position = [number, number];
type AddressResult = { lat: string; lon: string };
type DraftPhoto = { file: File; point?: Position | null };
type LocationCheck = {
  regionNames: string[];
  nearby: NearbyReport[];
  nearbyRadiusMeters: number;
  photoMatchRadiusMeters: number;
};

const regionQuery = {
  queryKey: ['public-regions'],
  queryFn: async (): Promise<Region[]> => (await apiClient.get('/reports/regions')).data,
};

async function readPhotoPoint(file: File): Promise<Position | null> {
  try {
    const { default: ExifReader } = await import('exifreader');
    const { gps } = ExifReader.load(await file.arrayBuffer(), { expanded: true });
    const latitude = gps?.Latitude;
    const longitude = gps?.Longitude;
    return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
      typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
      ? [latitude, longitude] : null;
  } catch {
    return null;
  }
}

function checkLocation(point: Position, signal: AbortSignal, kategori?: string): Promise<LocationCheck> {
  return apiClient.get('/reports/location-check', {
    signal, timeout: 8000, params: { latitude: point[0], longitude: point[1], kategori },
  }).then(response => response.data);
}

function MapPicker({ position, select }: { position: Position | null; select: (position: Position) => void }) {
  const map = useMapEvents({ click: event => select([event.latlng.lat, event.latlng.lng]) });
  useEffect(() => { if (position) map.setView(position, Math.max(14, map.getZoom())); }, [map, position]);
  return position ? <CircleMarker center={position} radius={10} pathOptions={{ color: 'white', fillColor: '#009766', fillOpacity: 1, weight: 3 }} /> : null;
}
function ResizeMap() { const map = useMap(); useEffect(() => { const observer = new ResizeObserver(() => map.invalidateSize({ pan: false })); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map]); return null; }
function PhotoPreviews({ files, remove }: { files: File[]; remove?: (index: number) => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => { const next = files.map(file => URL.createObjectURL(file)); setUrls(next); return () => next.forEach(url => URL.revokeObjectURL(url)); }, [files]);
  return <div className="warga-photo-grid">{urls.map((url, index) => <div key={url}><img src={url} alt={'Foto bukti ' + (index + 1)} />{remove && <button type="button" onClick={() => remove(index)} aria-label={'Hapus foto ' + (index + 1)}><X size={15} /></button>}</div>)}</div>;
}
export default function CreateReportPage() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [params] = useSearchParams();
  const initialCategory = params.get('kategori') || '';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ kategori: initialCategory in KATEGORI_LABEL ? initialCategory : '', judul: '', deskripsi: '', namaJalan: '', regionId: '', anonim: false });
  const [position, setPosition] = useState<Position | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [error, setError] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const searchSequence = useRef(0);
  const regions = useQuery(regionQuery);
  const location = useQuery({
    queryKey: ['report-location-check', position],
    enabled: step >= 1 && position !== null,
    queryFn: ({ signal }) => checkLocation(position!, signal),
    staleTime: Infinity,
    retry: false,
  });
  const nearby = useQuery({
    queryKey: ['report-nearby', position, form.kategori],
    enabled: step === 3 && position !== null && !!location.data?.regionNames.length && !!form.kategori,
    queryFn: ({ signal }) => checkLocation(position!, signal, form.kategori),
    retry: false,
  });
  const regionNames = location.data?.regionNames;
  const outsideJakarta = regionNames?.length === 0;
  const regionOptions = regionNames?.length
    ? regions.data?.filter(region => regionNames.includes(region.nama))
    : regions.data;
  const readingPhotos = photos.some(photo => photo.point === undefined);

  useEffect(() => {
    if (!regionNames?.length || !regions.data) return;
    const matches = regions.data.filter(region => regionNames.includes(region.nama));
    setForm(previous => {
      if (matches.some(region => region.id === previous.regionId)) return previous;
      const regionId = matches.length === 1 ? matches[0].id : '';
      return previous.regionId === regionId ? previous : { ...previous, regionId };
    });
  }, [regionNames, regions.data]);

  const patch = (changes: Partial<typeof form>) => setForm(previous => ({ ...previous, ...changes }));
  const create = useMutation({ mutationFn: async (data: FormData) => (await apiClient.post('/reports', data, { headers: { 'Content-Type': undefined } })).data, onSuccess: async data => { await invalidateReportQueries(cache); navigate('/citizen/reports/' + data.id); }, onError: err => setError(getActionError(err)) });
  const validate = (index: number) => {
    if (index === 0 && (!form.kategori || form.judul.trim().length < 3 || form.deskripsi.trim().length < 10)) return 'Pilih kategori, isi judul minimal 3 karakter, dan deskripsi minimal 10 karakter.';
    if (index === 1 && outsideJakarta) return 'Titik berada di luar DKI Jakarta. Pilih titik kejadian di dalam wilayah Jakarta.';
    if (index === 1 && (!form.regionId || !form.namaJalan.trim() || !position)) return 'Pilih wilayah, isi alamat, dan tandai titik kejadian di peta.';
    if (index === 2 && !photos.length) return 'Unggah minimal satu foto bukti.';
    return '';
  };
  const next = () => { const message = validate(step); setError(message); if (!message) setStep(step + 1); };
  const cancelSearch = () => {
    searchSequence.current++;
    setSearching(false);
    setLocating(false);
    setLocationMessage('');
  };
  const setLocation = (point: Position, accuracyMeters: number | null = null) => {
    setPosition(point);
    setAccuracy(accuracyMeters);
  };
  const search = async () => {
    const address = form.namaJalan.trim();
    if (!address || searching || locating) return;
    const sequence = ++searchSequence.current;
    setSearching(true); setLocationMessage('');
    try {
      const query = new URLSearchParams({
        format: 'jsonv2', limit: '1', bounded: '1', countrycodes: 'id',
        viewbox: '106.37,-5.17,106.99,-6.39', 'accept-language': 'id', q: `${address}, Jakarta`,
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
        headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error();
      const [result]: AddressResult[] = await response.json();
      if (sequence !== searchSequence.current) return;
      if (!result) return setLocationMessage('Alamat belum ditemukan. Pilih titik secara langsung di peta.');
      const point: Position = [Number(result.lat), Number(result.lon)];
      if (!point.every(Number.isFinite)) throw new Error();

      setLocation(point);
      setLocationMessage('Alamat ditemukan. Periksa titik kejadian di peta.');
    } catch {
      if (sequence === searchSequence.current) setLocationMessage('Pencarian alamat belum tersedia. Pilih titik secara langsung di peta.');
    } finally {
      if (sequence === searchSequence.current) setSearching(false);
    }
  };
  const selectMapPoint = (point: Position) => {
    cancelSearch();
    setLocation(point);
  };
  const locate = () => {
    if (!navigator.geolocation) return setLocationMessage('Lokasi perangkat tidak didukung. Pilih titik di peta.');
    cancelSearch();
    const sequence = searchSequence.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(location => {
      if (sequence !== searchSequence.current) return;
      setLocation([location.coords.latitude, location.coords.longitude], location.coords.accuracy);
      setLocationMessage('Lokasi perangkat ditemukan. Sesuaikan pin jika lokasi kejadian berbeda.');
      setLocating(false);
    }, () => {
      if (sequence !== searchSequence.current) return;
      setLocationMessage('Lokasi perangkat tidak dapat diakses. Anda tetap dapat memilih titik di peta.');
      setLocating(false);
    }, { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 });
  };
  const choosePhotos = (files: FileList | null) => {
    const selected = Array.from(files || []).filter(file => !photos.some(({ file: existing }) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified));
    if (photos.length + selected.length > 3) return setError('Maksimal tiga foto bukti.');
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024)) return setError('Gunakan JPG, PNG, WebP, atau GIF dengan ukuran maksimal 5 MB per foto.');
    setPhotos(previous => [...previous, ...selected.map(file => ({ file }))]);
    setError('');
    for (const file of selected) {
      void readPhotoPoint(file).then(point =>
        setPhotos(previous => previous.map(photo => photo.file === file ? { file, point } : photo)));
    }
  };
  const usePhotoLocation = (point: Position) => {
    cancelSearch();
    setLocation(point);
    setLocationMessage('Pin dipindahkan ke lokasi foto. Periksa alamat dan wilayah sebelum melanjutkan.');
    setStep(1);
    setError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === 1 && (searching || locating || location.isLoading)) return;
    if (step === 2 && readingPhotos) return;
    if (step === 3 && nearby.isLoading) return;
    if (step < 3) return next();
    for (let index = 0; index < 3; index++) { const message = validate(index); if (message) { setError(message); setStep(index); return; } }
    if (create.isPending || !position) return;
    const data = new FormData();
    for (const [key, value] of Object.entries(form)) data.append(key, String(value).trim());
    data.append('latitude', String(position[0]));
    data.append('longitude', String(position[1]));
    photos.forEach(({ file }) => data.append('photos', file));
    setError(''); create.mutate(data);
  };
  return <><header className="admin-page-header"><div><h1>Buat Laporan</h1><p>Isi detail permasalahan yang Anda temukan di Jakarta.</p></div></header><div className="warga-create-grid"><form noValidate className="admin-panel warga-wizard" onSubmit={submit}><nav className="warga-stepper" aria-label="Tahapan membuat laporan">{['Informasi', 'Lokasi', 'Foto', 'Tinjau'].map((label, index) => <button type="button" key={label} aria-current={index === step ? 'step' : undefined} disabled={index > step || create.isPending} onClick={() => { setStep(index); setError(''); }}><span>{index + 1}</span>{label}</button>)}</nav>{error && <p className="warga-form-error" role="alert">{error}</p>}<fieldset disabled={create.isPending}>
    {step === 0 && <><h2>Informasi Laporan</h2><label htmlFor="report-category">Kategori laporan</label><select id="report-category" className="input" value={form.kategori} onChange={event => patch({ kategori: event.target.value })}><option value="">Pilih kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><label htmlFor="report-title">Judul laporan</label><input id="report-title" className="input" maxLength={150} value={form.judul} placeholder="Contoh: Jalan berlubang di depan sekolah" onChange={event => patch({ judul: event.target.value })} /><label htmlFor="report-description">Deskripsi laporan</label><textarea id="report-description" className="input" rows={5} maxLength={5000} value={form.deskripsi} placeholder="Jelaskan kondisi, lokasi spesifik, dan dampak masalah…" onChange={event => patch({ deskripsi: event.target.value })} /><small className="warga-counter">{form.deskripsi.length}/5.000</small></>}
    {step === 1 && <>
      <h2>Lokasi Kejadian</h2>
      <label htmlFor="report-region">Wilayah administrasi</label>
      <select id="report-region" className="input" value={form.regionId} disabled={searching || location.isLoading} onChange={event => patch({ regionId: event.target.value })}>
        <option value="">{regions.isLoading || location.isLoading ? 'Memuat wilayah…' : 'Pilih wilayah'}</option>
        {regionOptions?.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}
      </select>
      {regions.isError && <button className="workspace-text-link" type="button" onClick={() => regions.refetch()}>Gagal memuat wilayah. Coba lagi</button>}
      <label htmlFor="report-address">Nama jalan atau alamat</label>
      <div className="warga-location-search">
        <input id="report-address" className="input" maxLength={200} value={form.namaJalan} placeholder="Contoh: Jl. MH Thamrin"
          onChange={event => { cancelSearch(); patch({ namaJalan: event.target.value }); }}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} />
        <button type="button" className="btn-outline" disabled={searching || locating || !form.namaJalan.trim()} onClick={search}>
          {searching ? <Loader2 className="animate-spin" size={15} /> : <Search size={15} />}Cari
        </button>
      </div>
      <p className="warga-location-help">Klik peta untuk menandai titik kejadian di wilayah DKI Jakarta.</p>
      <button type="button" className="btn-outline" disabled={locating} onClick={locate}><Crosshair size={15} />{locating ? 'Mencari lokasi…' : 'Gunakan lokasi saya'}</button>
      {locationMessage && <p role="status" className="warga-location-help">{locationMessage}</p>}
      <div className="warga-location-map">
        <MapContainer center={position || [-6.2088, 106.8456]} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          <ResizeMap />
          {position && accuracy !== null && <Circle center={position} radius={accuracy} pathOptions={{ interactive: false, color: '#009766', fillOpacity: 0.12, weight: 1 }} />}
          <MapPicker position={position} select={selectMapPoint} />
        </MapContainer>
      </div>
      <p className="warga-location-help">{position ? `Titik dipilih: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : 'Belum ada titik dipilih.'}
        {accuracy !== null && <> · Perkiraan akurasi perangkat ±{Math.ceil(accuracy)} m</>}
      </p>
      {location.isLoading && <p className="warga-location-help" role="status">Memeriksa batas wilayah…</p>}
      {outsideJakarta && <p className="warga-form-error" role="status">Titik berada di luar DKI Jakarta. Geser pin ke lokasi kejadian yang sesuai.</p>}
      {!!regionNames?.length && <p className="warga-location-help" role="status">Wilayah titik di peta: {regionNames.join(' atau ')}.</p>}
      {location.isError && <p className="warga-location-help" role="status">Wilayah belum bisa diperiksa. Pilih wilayah secara manual atau <button className="workspace-text-link" type="button" onClick={() => location.refetch()}>coba lagi</button>.</p>}
    </>}
    {step === 2 && <>
      <h2>Foto Bukti</h2>
      <p className="warga-location-help">Unggah satu hingga tiga foto kejadian. JPG, PNG, WebP, GIF · maksimal 5 MB per foto.</p>
      <input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Foto bukti laporan"
        onChange={event => { choosePhotos(event.target.files); event.target.value = ''; }} />
      <PhotoPreviews files={photos.map(photo => photo.file)} remove={index => setPhotos(previous => previous.filter((_, i) => i !== index))} />
      {photos.length < 3 && <button className="warga-upload" type="button" onClick={() => input.current?.click()}><Upload size={20} />Pilih Foto ({photos.length}/3)</button>}
      {!!photos.length && <ul className="warga-photo-checks" aria-live="polite">
        {photos.map(({ file, point }, index) => {
          const distance = point && position ? latLng(position).distanceTo(latLng(point)) : null;
          const matches = distance !== null && distance <= (location.data?.photoMatchRadiusMeters ?? 100);
          return <li key={`${file.name}-${index}`}>
            <span><strong>Foto {index + 1}</strong>{' · '}
              {point === undefined ? 'Memeriksa lokasi foto…' : distance === null ? 'Lokasi foto tidak tersedia'
                : matches ? `Lokasi foto sesuai (${Math.round(distance)} m dari pin)`
                : `Lokasi foto berbeda (${Math.round(distance)} m dari pin)`}
            </span>
            {point && distance !== null && !matches && <button type="button" className="workspace-text-link" onClick={() => usePhotoLocation(point)}>Gunakan lokasi foto</button>}
          </li>;
        })}
      </ul>}
      {photos.some(photo => photo.point === null) && <p className="warga-location-help">Foto tanpa GPS tetap bisa dikirim. Pastikan pin menunjuk lokasi kejadian.</p>}
    </>}
    {step === 3 && <>
      <h2>Tinjau Laporan</h2>
      <dl className="warga-review">
        <div><dt>Kategori</dt><dd>{KATEGORI_LABEL[form.kategori as keyof typeof KATEGORI_LABEL]}</dd></div>
        <div><dt>Judul</dt><dd>{form.judul}</dd></div>
        <div><dt>Deskripsi</dt><dd>{form.deskripsi}</dd></div>
        <div><dt>Lokasi</dt><dd>{form.namaJalan}<br />{regions.data?.find(region => region.id === form.regionId)?.nama}<br />{position?.map(number => number.toFixed(6)).join(', ')}</dd></div>
      </dl>
      <PhotoPreviews files={photos.map(photo => photo.file)} />
      {nearby.isLoading && <p className="warga-location-help" role="status">Memeriksa laporan di sekitar titik…</p>}
      {(location.isError || nearby.isError) && <p className="warga-location-help" role="status">Laporan serupa belum bisa ditampilkan. <button className="workspace-text-link" type="button" onClick={() => location.isError ? location.refetch() : nearby.refetch()}>Coba lagi</button>.</p>}
      {!!nearby.data?.nearby.length && <section className="warga-nearby" aria-labelledby="nearby-report-heading">
        <h3 id="nearby-report-heading">Laporan serupa di sekitar</h3>
        <p>Ada laporan aktif dengan kategori yang sama dalam radius {nearby.data.nearbyRadiusMeters} m. Anda tetap bisa mengirim jika kejadiannya berbeda.</p>
        <ul>{nearby.data.nearby.map(report => <li key={report.id}>
          <Link className="workspace-text-link" to={'/reports/' + encodeURIComponent(report.id)} target="_blank" rel="noopener noreferrer">{report.judul}</Link>
          <span>{report.distanceMeters} m{report.namaJalan && ` · ${report.namaJalan}`}</span>
        </li>)}</ul>
      </section>}
      <label className="warga-anon"><input type="checkbox" checked={form.anonim} onChange={event => patch({ anonim: event.target.checked })} /><span>Kirim sebagai anonim<small>Identitas Anda disembunyikan pada detail publik. Admin tetap dapat melihat pelapor untuk verifikasi.</small></span></label>
    </>}
    </fieldset><div className="warga-wizard-actions"><button type="button" className="btn-outline" disabled={create.isPending} onClick={() => navigate('/citizen')}>Batal</button>{step > 0 && <button type="button" className="btn-outline" disabled={create.isPending} onClick={() => { setStep(step - 1); setError(''); }}>Kembali</button>}<button className="btn-primary" type="submit" disabled={create.isPending || (step === 1 && (searching || locating || location.isLoading)) || (step === 2 && readingPhotos) || (step === 3 && nearby.isLoading)}>{create.isPending ? 'Mengirim…' : step === 3 ? 'Kirim Laporan' : 'Lanjutkan'}</button></div></form><aside className="admin-panel warga-tips"><h2>Tips Membuat Laporan</h2><ul>{['Pilih kategori yang sesuai', 'Berikan judul yang jelas', 'Jelaskan detail lokasi dan kondisi', 'Unggah foto yang relevan', 'Pastikan titik lokasi sesuai peta'].map(tip => <li key={tip}><CheckCircle2 size={15} />{tip}</li>)}</ul></aside></div></>;
}
