import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, HardHat, CheckCircle2, ClipboardList, FileText, Play, Search, Upload, X } from 'lucide-react';
import DashboardFrame from '@/components/DashboardFrame';
import QueryError from '@/components/QueryError';
import { DashboardStats, DetailBack, DetailPreview, FilterTabs, StatusBadge, WorkspacePagination, WorkspaceRefresh, lastUpdate, relativeTime, reportCover } from '@/components/ReportWorkspaceUI';
import { getActionError, useDesktop, useReportWorkspace } from '@/hooks/useReportWorkspace';
import apiClient from '@/lib/api';
import { Report } from '@/types';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function AgencyAssignmentsPage({ embedded = false }: { embedded?: boolean }) {
  const w = useReportWorkspace('agency');
  const desktop = useDesktop();
  const listScroll = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedId = w.params.get('laporan') || (desktop ? w.data?.items[0]?.id : null);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');
  const [success, setSuccess] = useState('');
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
    mutationFn: async (action: 'progress' | 'complete') => {
      if (action === 'complete') {
        const form = new FormData();
        form.append('catatan', note);
        files.forEach((file) => form.append('bukti', file));
        return (await apiClient.post('/agency/assignments/' + selectedId + '/complete', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
      }
      return (await apiClient.post('/agency/assignments/' + selectedId + '/progress', { status: 'dikerjakan', catatan: note })).data;
    },
    onSuccess: async (result) => {
      setSuccess(result.message || 'Perubahan berhasil disimpan.');
      setNote(''); setFiles([]); setFileError('');
      if (inputRef.current) inputRef.current.value = '';
      await w.refreshReports();
    },
    onError: async () => { await w.refreshReports(); },
  });
  useEffect(() => { setNote(''); setFiles([]); setFileError(''); setSuccess(''); mutation.reset(); }, [selectedId]);
  const addFiles = (incoming: File[]) => {
    if (mutation.isPending) return;
    setFileError('');
    const unique = incoming.filter((file) => !files.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified));
    if (files.length + unique.length > 3) { setFileError('Maksimal 3 foto bukti. Hapus salah satu foto untuk menggantinya.'); return; }
    if (unique.some((file) => !imageTypes.includes(file.type))) { setFileError('Gunakan foto JPG, PNG, WebP, atau GIF.'); return; }
    if (unique.some((file) => file.size > 5 * 1024 * 1024)) { setFileError('Ukuran setiap foto maksimal 5 MB.'); return; }
    setFiles((previous) => [...previous, ...unique]);
  };
  const choose = (report: Report) => {
    if (mutation.isPending) return;
    listScroll.current = window.scrollY;
    w.update({ laporan: report.id }, false);
    if (!desktop) window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const back = () => {
    w.update({ laporan: null }, false);
    requestAnimationFrame(() => window.scrollTo({ top: listScroll.current, behavior: 'instant' }));
  };
  const counts = w.data?.counts;
  const active = (counts?.ditugaskan || 0) + (counts?.dikerjakan || 0);
  const report = detail.data;
  const proofs = report?.photos?.filter((photo) => photo.jenis === 'bukti_perbaikan') || [];
  const body = <div>
    <header className="dashboard-heading"><div><h1><Building2 size={25} aria-hidden="true" />Dashboard Instansi</h1><p>{w.user?.agencyNama || 'Kelola tugas penanganan instansi Anda.'}</p></div><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></header>
    <DashboardStats loading={!w.data} items={[
      { label: 'Belum Ditangani', icon: ClipboardList, tone: 'red', value: counts?.ditugaskan || 0, onClick: () => w.update({ status: 'ditugaskan' }) },
      { label: 'Sedang Dikerjakan', icon: HardHat, tone: 'amber', value: counts?.dikerjakan || 0, onClick: () => w.update({ status: 'dikerjakan' }) },
      { label: 'Selesai', icon: CheckCircle2, tone: 'green', value: counts?.selesai || 0, onClick: () => w.update({ status: 'selesai' }) },
    ]} />
    <div className="workspace-grid" data-detail={!!w.params.get('laporan')}>
      <section className="workspace-panel workspace-list" aria-label="Daftar tugas instansi">
        <div className="workspace-panel-heading"><h2>Tugas Penanganan</h2><span className="workspace-muted">{active} tugas aktif</span></div>
        <FilterTabs value={w.status} onChange={(status) => w.update({ status })} tabs={[
          { value: 'aktif', label: 'Aktif', count: active },
          { value: 'ditugaskan', label: 'Belum Ditangani', count: counts?.ditugaskan || 0 },
          { value: 'dikerjakan', label: 'Dikerjakan', count: counts?.dikerjakan || 0 },
          { value: 'selesai', label: 'Selesai', count: counts?.selesai || 0 },
        ]} />
        <div className="workspace-filters workspace-filters-compact">
          <div className="workspace-search"><Search size={16} aria-hidden="true" /><input className="input" aria-label="Cari tugas" maxLength={150} placeholder="Cari tiket, judul, atau lokasi" value={w.search} onChange={(event) => w.update({ q: event.target.value || null })} /></div>
          <select className="input" aria-label="Urutan tugas" value={w.sort} onChange={(event) => w.update({ sort: event.target.value })}><option value="oldest">Terlama dahulu</option><option value="newest">Terbaru dahulu</option></select>
        </div>
        {w.isLoading ? <div className="workspace-loading" role="status">Memuat tugas penanganan…</div> : w.isError ? <div className="p-5"><QueryError subject="Daftar tugas" retry={w.refetch} pending={w.isFetching} /></div> : !w.data?.items.length ? <div className="workspace-empty"><ClipboardList size={28} /><h3>Tidak ada tugas pada filter ini</h3><p>Pilih status lain atau ubah pencarian untuk melihat tugas Anda.</p><button className="btn-outline" onClick={() => w.update({ status: 'aktif', q: null })}>Lihat tugas aktif</button></div> :
          <div className="workspace-rows">{w.data.items.map((task) => <button type="button" key={task.id} className="workspace-report-row" aria-pressed={selectedId === task.id} onClick={() => choose(task)}>
            {reportCover(task) ? <img src={reportCover(task)} alt="" /> : <div className="workspace-thumb-placeholder"><FileText size={22} /></div>}
            <div className="workspace-row-content"><p className="workspace-ticket">{task.kodeTiket}</p><h3>{task.judul}</h3><p>{task.namaJalan || task.region?.nama || 'Alamat belum tersedia'}</p><span className="workspace-row-age">Diperbarui {relativeTime(lastUpdate(task))}</span></div>
            <StatusBadge status={task.status} />
          </button>)}</div>}
        <WorkspacePagination data={w.data} onPage={(page) => w.update({ page: String(page), laporan: null }, false)} />
      </section>
      <aside className="workspace-panel workspace-detail" aria-label="Detail tugas dan penanganan">
        <DetailBack onClick={back} />
        {!selectedId ? <div className="workspace-empty"><ClipboardList size={28} /><h2>Detail Tugas</h2><p>Pilih tugas untuk melihat lokasi, riwayat, dan tindakan penanganan.</p></div> : detail.isLoading ? <div className="workspace-loading" role="status">Memuat detail tugas…</div> : detail.isError ? <QueryError subject="Detail tugas" retry={detail.refetch} pending={detail.isFetching} /> : report && <>
          <DetailPreview report={report} />
          {success && <p className="workspace-success" role="status"><CheckCircle2 size={16} />{success}</p>}
          {mutation.isError && <p className="workspace-error" role="alert">{getActionError(mutation.error)}</p>}
          {report.status !== 'selesai' ? <form className="workspace-task-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate('progress'); }}>
            <label className="label" htmlFor="agency-progress-note">Catatan Penanganan {report.status === 'ditugaskan' && '(opsional)'}</label>
            <textarea id="agency-progress-note" className="input" rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tulis perkembangan atau hasil penanganan di lokasi…" disabled={mutation.isPending} />
            {report.status === 'ditugaskan' ? <button className="btn-primary mt-3 w-full" disabled={mutation.isPending}><Play size={16} />{mutation.isPending ? 'Menyimpan…' : 'Mulai Pengerjaan'}</button> : <>
              <button className="btn-outline mt-3 w-full" disabled={mutation.isPending || !note.trim()}>{mutation.isPending ? 'Menyimpan…' : 'Simpan Catatan Progres'}</button>
              <div className="workspace-upload-section">
                <label className="label" htmlFor="agency-proof-files">Foto Bukti Penyelesaian</label>
                <input id="agency-proof-files" ref={inputRef} type="file" multiple accept={imageTypes.join(',')} className="sr-only" disabled={mutation.isPending || files.length >= 3} onChange={(event) => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
                <div className="workspace-proof-grid">{files.map((file, index) => <div className="workspace-proof" key={file.name + file.lastModified}><img src={previews[index]} alt={'Bukti penyelesaian ' + (index + 1)} /><button type="button" aria-label={'Hapus foto ' + file.name} disabled={mutation.isPending} onClick={() => setFiles((previous) => previous.filter((_, item) => item !== index))}><X size={14} /></button></div>)}
                  {files.length < 3 && <button type="button" className="workspace-upload-button" disabled={mutation.isPending} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}><Upload size={20} /><span>Tambah Foto</span></button>}
                </div>
                <p className="workspace-muted">Minimal 1 foto, maksimal 3. JPG, PNG, WebP, atau GIF hingga 5 MB per foto.</p>
                {fileError && <p className="workspace-error" role="alert">{fileError}</p>}
                <button type="button" className="btn-primary mt-4 w-full" disabled={mutation.isPending || !files.length} onClick={() => mutation.mutate('complete')}><CheckCircle2 size={16} />{mutation.isPending ? 'Menyimpan…' : 'Tandai Selesai'}</button>
              </div>
            </>}
          </form> : <section className="workspace-completion"><h3>Bukti Penyelesaian</h3>{proofs.length ? <div className="workspace-proof-grid">{proofs.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Foto bukti penyelesaian laporan" /></a>)}</div> : <p className="workspace-muted">Belum ada foto bukti penyelesaian yang tersimpan.</p>}</section>}
          <Link className="workspace-text-link" to={'/reports/' + report.id}>Lihat laporan lengkap <ArrowRight size={14} /></Link>
        </>}
      </aside>
    </div>
  </div>;
  return embedded ? body : <DashboardFrame>{body}</DashboardFrame>;
}
