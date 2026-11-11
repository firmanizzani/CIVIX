import AdminModal from '@/components/AdminModal';
import EditReportCost from '@/components/EditReportCost';
import { CostFields } from '@/components/ReportCost';
import { emptyCostFields, validCostFields, formatRupiah, fundingLabel } from '@/lib/costs';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Search, Upload, X } from 'lucide-react';
import AgencyTaskDetail from './AgencyTaskDetail';
import PhotoPreview from '@/components/PhotoPreview';
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
  const [cost, setCost] = useState(emptyCostFields);
  const [confirming, setConfirming] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
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
    mutationFn: async (action: 'progress' | 'complete' | 'reject') => {
      if (action === 'progress') {
        return (await apiClient.post('/agency/assignments/' + selectedId + '/progress', {
          status: 'dikerjakan', catatan: note.trim(),
        })).data;
      }
      if (action === 'complete') {
        const form = new FormData();
        form.append('catatan', note);
        Object.entries(cost).forEach(([key, value]) => form.append(key, value));
        files.forEach((file) => form.append('bukti', file));
        return (await apiClient.post('/agency/assignments/' + selectedId + '/complete', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
      }
      if (action === 'reject') return (await apiClient.post('/agency/assignments/' + selectedId + '/reject', { alasan: note })).data;
    },
    onSuccess: async (result) => {
      setSuccess(result.message || 'Perubahan berhasil disimpan.');
      setCompletionOpen(false); setConfirming(false); setCost(emptyCostFields());
      setNote(''); setFiles([]); setFileError(''); setRejecting(false);
      if (inputRef.current) inputRef.current.value = '';
      await w.refreshReports();
    },
    onError: async () => { await w.refreshReports(); },
  });
  useEffect(() => { setCompletionOpen(false); setCost(emptyCostFields()); setConfirming(false); setNote(''); setFiles([]); setFileError(''); setSuccess(''); setRejecting(false); mutation.reset(); }, [selectedId]);
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
          {report.status === 'ditugaskan' && !rejecting && <form className="workspace-task-form" onSubmit={(event) => { event.preventDefault(); if (note.trim()) mutation.mutate('progress'); }}>
            <label className="label" htmlFor="agency-field-check">Hasil Pengecekan Lapangan</label>
            <textarea id="agency-field-check" className="input" rows={3} required maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Lubang terkonfirmasi di lokasi. Perbaikan dijadwalkan besok." disabled={mutation.isPending} />
            <p className="workspace-muted">Catatan ini akan tampil di riwayat laporan.</p>
            <button type="submit" className="btn-primary w-full" disabled={mutation.isPending || !note.trim()}><ClipboardCheck size={16} />{mutation.isPending ? 'Menyimpan…' : 'Mulai Penanganan'}</button>
          </form>}
          {report.status === 'dikerjakan' && !rejecting ? <div className="agency-completion-invitation">
            <p>Perbaikan sudah selesai? Lengkapi catatan, foto bukti, dan biaya penanganan sebelum dipublikasikan.</p>
            <button type="button" className="btn-primary w-full" disabled={mutation.isPending} onClick={() => { setConfirming(false); setCompletionOpen(true); mutation.reset(); }}><CheckCircle2 size={17} />Selesaikan Laporan</button>
            {(note.trim() || files.length || cost.amount) && <small>Isian penyelesaian Anda masih tersimpan di halaman ini.</small>}
          </div> : report.status === 'selesai' ? <section className="workspace-completion"><h3>Bukti Penyelesaian</h3>{proofs.length ? <div className="workspace-proof-grid">{proofs.map((photo) => <PhotoPreview key={photo.id} src={photo.url} alt="Foto bukti penyelesaian laporan" />)}</div> : <p className="workspace-muted">Belum ada foto bukti penyelesaian yang tersimpan.</p>}</section> : null}

    {['ditugaskan', 'dikerjakan'].includes(report.status) && (rejecting ? <form className="workspace-task-form" onSubmit={event => { event.preventDefault(); mutation.mutate('reject'); }}><label className="label" htmlFor="agency-reject-reason">Alasan penolakan</label><textarea id="agency-reject-reason" required maxLength={2000} className="input" rows={3} value={note} disabled={mutation.isPending} onChange={event => setNote(event.target.value)} /><p className="workspace-muted">Alasan akan terlihat pada riwayat laporan.</p><div className="agency-action-pair"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => { setRejecting(false); setNote(''); }}>Batal</button><button className="admin-button-danger" disabled={mutation.isPending || !note.trim()}>Tolak Laporan</button></div></form> : <button className="admin-button-danger agency-reject" disabled={mutation.isPending} onClick={() => { setRejecting(true); setNote(''); mutation.reset(); }}>Tolak Laporan</button>)}
    {!['ditugaskan', 'dikerjakan', 'selesai'].includes(report.status) && <p className="workspace-muted">Laporan ini tidak memiliki tindakan penanganan aktif.</p>}
  </>;
  const closeCompletion = () => { if (!mutation.isPending) { setCompletionOpen(false); setConfirming(false); } };
  const completionReady = files.length > 0 && validCostFields(cost) && note.trim().length >= 5;
  if (selectedId) return detail.isLoading ? <p className="admin-loading">Memuat detail tugas…</p>
    : detail.isError ? <><button className="admin-back" onClick={back}>← Kembali ke daftar</button><QueryError subject="Detail tugas" retry={detail.refetch} /></>
    : report && <>
      <AgencyTaskDetail key={report.id} report={report} onBack={back} actions={actions} costAction={<EditReportCost report={report} />} />
      {completionOpen && <AdminModal title={confirming ? 'Tinjau penyelesaian laporan' : 'Selesaikan laporan'} pending={mutation.isPending} onClose={closeCompletion} className="agency-completion-dialog">
        <form className="agency-completion-form" onSubmit={event => {
          event.preventDefault();
          if (mutation.isPending || !completionReady || report.status !== 'dikerjakan') return;
          if (confirming) mutation.mutate('complete');
          else setConfirming(true);
        }}>
          <header className="agency-completion-header">
            <div>
              <h2>{confirming ? 'Tinjau Penyelesaian' : 'Selesaikan Laporan'}</h2>
              <p><span>{report.kodeTiket}</span> · {report.judul}</p>
            </div>
            <button type="button" className="agency-completion-close" aria-label="Tutup form penyelesaian" disabled={mutation.isPending} onClick={closeCompletion}><X size={21} /></button>
          </header>
          <div className="agency-completion-scroll">
            {confirming ? <div className="agency-completion-review">
              <dl className="cost-review"><div><dt>Biaya penanganan</dt><dd className="cost-review-amount">{formatRupiah(cost.amount)}</dd></div>
                <div><dt>Sumber pendanaan</dt><dd>{fundingLabel(cost.fundingSource as 'apbd' | 'other', cost.fundingNote)}</dd></div>
                <div><dt>Rincian penggunaan biaya</dt><dd>{cost.breakdown}</dd></div>
                <div><dt>Catatan penyelesaian</dt><dd>{note}</dd></div>
              </dl>
              <h3>Foto bukti penyelesaian ({files.length})</h3>
              <div className="agency-completion-review-photos">{files.map((file, index) => <img key={file.name + file.lastModified} src={previews[index]} alt={'Bukti penyelesaian ' + (index + 1)} />)}</div>
            </div> : <div className="agency-completion-fields">
              <section className="agency-completion-evidence" aria-label="Hasil penanganan">
                <h3>Hasil Penanganan</h3>
                <label className="label" htmlFor="agency-progress-note">Catatan penyelesaian</label>
                <textarea id="agency-progress-note" className="input" rows={4} required minLength={5} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder="Jelaskan pekerjaan perbaikan yang telah diselesaikan di lokasi…" disabled={mutation.isPending} />
                <p className="cost-hint">Jelaskan hasil pekerjaan dan kondisi lokasi setelah ditangani.</p>
                <div className="workspace-upload-section">
                  <label className="label" htmlFor="agency-proof-files">Foto bukti penyelesaian</label>
                  <input id="agency-proof-files" ref={inputRef} type="file" multiple accept={imageTypes.join(',')} className="sr-only" disabled={mutation.isPending || files.length >= 3} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
                  <div className="workspace-proof-grid">{files.map((file, index) => <div className="workspace-proof" key={file.name + file.lastModified}>
                    <img src={previews[index]} alt={'Bukti penyelesaian ' + (index + 1)} />
                    <button type="button" aria-label={'Hapus foto ' + file.name} disabled={mutation.isPending} onClick={() => setFiles(previous => previous.filter((_, item) => item !== index))}><X size={14} /></button>
                  </div>)}
                    {files.length < 3 && <button type="button" className="workspace-upload-button" disabled={mutation.isPending} onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}><Upload size={21} /><span>{files.length ? 'Tambah Foto' : 'Pilih Foto Bukti'}</span></button>}
                  </div>
                  <p className="cost-hint">Minimal 1 foto, maksimal 3. JPG, PNG, WebP, atau GIF hingga 5 MB per foto.</p>
                  {fileError && <p className="workspace-error" role="alert">{fileError}</p>}
                </div>
              </section>
              <CostFields value={cost} onChange={setCost} disabled={mutation.isPending} />
            </div>}
            {report.status !== 'dikerjakan' && <p className="workspace-error" role="alert">Status laporan telah berubah. Tutup form dan periksa detail terbaru sebelum melanjutkan.</p>}
          </div>
          <footer className="agency-completion-footer">
            <p className={mutation.isError ? 'workspace-error' : undefined} role={mutation.isError ? 'alert' : undefined}>{mutation.isError ? getActionError(mutation.error) : confirming ? 'Catatan, foto bukti, dan rincian biaya akan dipublikasikan bersama.' : 'Lengkapi semua isian dan lampirkan foto bukti untuk meninjau penyelesaian.'}</p>
            <div><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => confirming ? setConfirming(false) : closeCompletion()}>{confirming ? 'Kembali ke Form' : 'Tutup Form'}</button>
              <button type="submit" className="btn-primary" disabled={mutation.isPending || !completionReady || report.status !== 'dikerjakan'}><CheckCircle2 size={17} />{mutation.isPending ? 'Menyimpan…' : confirming ? 'Selesaikan & Publikasikan' : 'Tinjau Penyelesaian'}</button></div>
          </footer>
        </form>
      </AdminModal>}
    </>;
  return <>
    <header className="admin-page-header"><div><h1>{all ? 'Semua Laporan' : 'Tugas Penanganan'}</h1><p>{all ? 'Kelola seluruh laporan yang ditugaskan ke instansi Anda.' : 'Kelola tugas penanganan yang menjadi tanggung jawab instansi Anda.'}</p></div><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></header>
    {!all && <FilterTabs value={w.status} onChange={status => w.update({ status })} tabs={[{ value: 'aktif', label: 'Aktif', count: active }, { value: 'ditugaskan', label: 'Menunggu Ditangani', count: counts?.ditugaskan || 0 }, { value: 'dikerjakan', label: 'Dikerjakan', count: counts?.dikerjakan || 0 }, { value: 'selesai', label: 'Selesai', count: counts?.selesai || 0 }, { value: 'ditolak', label: 'Ditolak', count: counts?.ditolak || 0 }]} />}
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
