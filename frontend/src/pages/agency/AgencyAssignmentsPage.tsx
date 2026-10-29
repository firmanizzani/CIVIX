import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Search, Upload, X } from 'lucide-react';
import AgencyTaskDetail from './AgencyTaskDetail';
import { AgencyTable } from './AgencyDashboard';
import { useAgencyOverview } from './agencyData';
import QueryError from '@/components/QueryError';
import { FilterTabs, WorkspacePagination, WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { getActionError, useReportWorkspace } from '@/hooks/useReportWorkspace';
import apiClient from '@/lib/api';
import { Report, KATEGORI_LABEL, STATUS_LABEL } from '@/types';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function AgencyAssignmentsPage({ all = false }: { all?: boolean }) {
  const w = useReportWorkspace('agency', all ? '' : 'aktif');
  const overview = useAgencyOverview();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedId = w.params.get('laporan');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejecting, setRejecting] = useState(false);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  const detail = useQuery<Report>({
    queryKey: ['workspace-detail', 'agency', w.user?.id, selectedId],
    queryFn: async () => (await apiClient.get('/agency/assignments/' + selectedId)).data,
    enabled: !!selectedId, staleTime: 10000, refetchInterval: 30000,
  });
  const mutation = useMutation({
    mutationFn: async (action: 'complete' | 'reject') => {
      if (action === 'complete') {
        const form = new FormData();
        form.append('catatan', note);
        files.forEach((file) => form.append('bukti', file));
        return (await apiClient.post('/agency/assignments/' + selectedId + '/complete', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
      }
      if (action === 'reject') return (await apiClient.post('/agency/assignments/' + selectedId + '/reject', { alasan: note })).data;
    },
    onSuccess: async (result) => {
      setSuccess(result.message || 'Perubahan berhasil disimpan.');
      setNote(''); setFiles([]); setFileError(''); setRejecting(false);
      if (inputRef.current) inputRef.current.value = '';
      await w.refreshReports();
    },
    onError: async () => { await w.refreshReports(); },
  });
  useEffect(() => { setNote(''); setFiles([]); setFileError(''); setSuccess(''); setRejecting(false); mutation.reset(); }, [selectedId]);
  const addFiles = (incoming: File[]) => {
    if (mutation.isPending) return;
    setFileError('');
    const unique = incoming.filter((file) => !files.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified));
    if (files.length + unique.length > 3) { setFileError('Maksimal 3 foto bukti. Hapus salah satu foto untuk menggantinya.'); return; }
    if (unique.some((file) => !imageTypes.includes(file.type))) { setFileError('Gunakan foto JPG, PNG, WebP, atau GIF.'); return; }
    if (unique.some((file) => file.size > 5 * 1024 * 1024)) { setFileError('Ukuran setiap foto maksimal 5 MB.'); return; }
    setFiles((previous) => [...previous, ...unique]);
  };
  const back = () => { if (!mutation.isPending) w.update({ laporan: null }, false); };
  const counts = w.data?.counts;
  const active = (counts?.ditugaskan || 0) + (counts?.dikerjakan || 0);
  const report = detail.data;
  const proofs = report?.photos?.filter((photo) => photo.jenis === 'bukti_perbaikan') || [];
  const actions = report && <>
          {success && <p className="workspace-success" role="status"><CheckCircle2 size={16} />{success}</p>}
          {mutation.isError && <p className="workspace-error" role="alert">{getActionError(mutation.error)}</p>}
          {['ditugaskan', 'dikerjakan'].includes(report.status) && !rejecting ? <form className="workspace-task-form" onSubmit={(event) => { event.preventDefault(); if (files.length) mutation.mutate('complete'); }}>
            <label className="label" htmlFor="agency-progress-note">Catatan Penanganan (opsional)</label>
            <textarea id="agency-progress-note" className="input" rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tulis perkembangan atau hasil penanganan di lokasi…" disabled={mutation.isPending} />
              <div className="workspace-upload-section">
                <label className="label" htmlFor="agency-proof-files">Foto Bukti Penyelesaian</label>
                <input id="agency-proof-files" ref={inputRef} type="file" multiple accept={imageTypes.join(',')} className="sr-only" disabled={mutation.isPending || files.length >= 3} onChange={(event) => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
                <div className="workspace-proof-grid">{files.map((file, index) => <div className="workspace-proof" key={file.name + file.lastModified}><img src={previews[index]} alt={'Bukti penyelesaian ' + (index + 1)} /><button type="button" aria-label={'Hapus foto ' + file.name} disabled={mutation.isPending} onClick={() => setFiles((previous) => previous.filter((_, item) => item !== index))}><X size={14} /></button></div>)}
                  {files.length < 3 && <button type="button" className="workspace-upload-button" disabled={mutation.isPending} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}><Upload size={20} /><span>Tambah Foto</span></button>}
                </div>
                <p className="workspace-muted">Minimal 1 foto, maksimal 3. JPG, PNG, WebP, atau GIF hingga 5 MB per foto.</p>
                {fileError && <p className="workspace-error" role="alert">{fileError}</p>}
                <button type="submit" className="btn-primary mt-4 w-full" disabled={mutation.isPending || !files.length}><CheckCircle2 size={16} />{mutation.isPending ? 'Menyimpan…' : 'Tandai Selesai'}</button>
              </div>
          </form> : report.status === 'selesai' ? <section className="workspace-completion"><h3>Bukti Penyelesaian</h3>{proofs.length ? <div className="workspace-proof-grid">{proofs.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Foto bukti penyelesaian laporan" /></a>)}</div> : <p className="workspace-muted">Belum ada foto bukti penyelesaian yang tersimpan.</p>}</section> : null}

    {['ditugaskan', 'dikerjakan'].includes(report.status) && (rejecting ? <form className="workspace-task-form" onSubmit={event => { event.preventDefault(); mutation.mutate('reject'); }}><label className="label" htmlFor="agency-reject-reason">Alasan penolakan</label><textarea id="agency-reject-reason" required maxLength={2000} className="input" rows={3} value={note} disabled={mutation.isPending} onChange={event => setNote(event.target.value)} /><p className="workspace-muted">Alasan akan terlihat pada riwayat laporan.</p><div className="agency-action-pair"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => { setRejecting(false); setNote(''); }}>Batal</button><button className="admin-button-danger" disabled={mutation.isPending || !note.trim()}>Tolak Laporan</button></div></form> : <button className="admin-button-danger agency-reject" disabled={mutation.isPending} onClick={() => { setRejecting(true); setNote(''); mutation.reset(); }}>Tolak Laporan</button>)}
    {!['ditugaskan', 'dikerjakan', 'selesai'].includes(report.status) && <p className="workspace-muted">Laporan ini tidak memiliki tindakan penanganan aktif.</p>}
  </>;
  if (selectedId) return detail.isLoading ? <p className="admin-loading">Memuat detail tugas…</p> : detail.isError ? <><button className="admin-back" onClick={back}>← Kembali ke daftar</button><QueryError subject="Detail tugas" retry={detail.refetch} /></> : report && <AgencyTaskDetail key={report.id} report={report} onBack={back} actions={actions} />;
  return <>
    <header className="admin-page-header"><div><h1>{all ? 'Semua Laporan' : 'Tugas Penanganan'}</h1><p>{all ? 'Kelola seluruh laporan yang ditugaskan ke instansi Anda.' : 'Kelola tugas penanganan yang menjadi tanggung jawab instansi Anda.'}</p></div><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></header>
    {!all && <FilterTabs value={w.status} onChange={status => w.update({ status })} tabs={[{ value: 'aktif', label: 'Aktif', count: active }, { value: 'ditugaskan', label: 'Belum Ditangani', count: counts?.ditugaskan || 0 }, { value: 'dikerjakan', label: 'Dikerjakan', count: counts?.dikerjakan || 0 }, { value: 'selesai', label: 'Selesai', count: counts?.selesai || 0 }, { value: 'ditolak', label: 'Ditolak', count: counts?.ditolak || 0 }]} />}
    <div className="admin-report-filters agency-list-filters">
      <div className="workspace-search"><Search size={16} /><input className="input" aria-label="Cari tugas instansi" placeholder="Cari judul, lokasi, atau kode laporan…" maxLength={150} value={w.search} onChange={event => w.update({ q: event.target.value || null })} /></div>
      <select className="input" aria-label="Kategori laporan instansi" value={w.kategori} onChange={event => w.update({ kategori: event.target.value || null })}><option value="">Semua kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="input" aria-label="Wilayah laporan instansi" value={w.params.get('regionId') || ''} onChange={event => w.update({ regionId: event.target.value || null })}><option value="">Semua wilayah</option>{overview.data?.regions.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}</select>
      {all && <select className="input" aria-label="Status laporan instansi" value={w.status} onChange={event => w.update({ status: event.target.value })}><option value="">Semua status</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}
      <select className="input" aria-label="Urutan tugas instansi" value={w.sort} onChange={event => w.update({ sort: event.target.value })}><option value="oldest">Terlama</option><option value="newest">Terbaru</option></select>
      <details className="admin-date-filter"><summary>Tanggal</summary><div><label>Dari tanggal<input className="input" type="date" value={w.params.get('dateFrom') || ''} max={w.params.get('dateTo') || undefined} onChange={event => w.update({ dateFrom: event.target.value || null })} /></label><label>Sampai tanggal<input className="input" type="date" value={w.params.get('dateTo') || ''} min={w.params.get('dateFrom') || undefined} onChange={event => w.update({ dateTo: event.target.value || null })} /></label></div></details>
      <button className="admin-text-button" onClick={() => w.update({ q: null, kategori: null, regionId: null, dateFrom: null, dateTo: null, status: all ? '' : 'aktif', sort: null })}>Reset</button>
    </div>
    <section className="admin-panel">{w.isError ? <QueryError subject="Laporan instansi" retry={w.refetch} /> : w.isLoading ? <p className="admin-loading">Memuat laporan…</p> : <AgencyTable rows={w.data?.items || []} offset={((w.data?.page || 1) - 1) * (w.data?.pageSize || 10)} />}<WorkspacePagination data={w.data} onPage={page => w.update({ page: String(page) }, false)} /></section>
  </>;
}
