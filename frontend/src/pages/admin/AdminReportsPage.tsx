import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Users, ShieldCheck, Clock, CheckCircle2, XCircle, Copy, Send, FileText } from 'lucide-react';
import DashboardFrame from '@/components/DashboardFrame';
import QueryError from '@/components/QueryError';
import { DashboardStats, DetailBack, DetailPreview, FilterTabs, StatusBadge, WorkspacePagination, WorkspaceRefresh, reportCover } from '@/components/ReportWorkspaceUI';
import { getActionError, useDesktop, useReportWorkspace } from '@/hooks/useReportWorkspace';
import apiClient from '@/lib/api';
import { Report, AdminAgency, KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminReportsPage({ embedded = false }: { embedded?: boolean }) {
  const w = useReportWorkspace('admin');
  const desktop = useDesktop();
  const scrollPosition = useRef(0);
  const selectedId = w.params.get('laporan') || (desktop ? w.data?.items[0]?.id : null);
  const [action, setAction] = useState<'reject' | 'duplicate' | 'assign' | null>(null);
  const [note, setNote] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [targetTicket, setTargetTicket] = useState('');
  const [success, setSuccess] = useState('');
  const detail = useQuery<Report>({
    queryKey: ['workspace-detail', 'admin', w.user?.id, selectedId],
    queryFn: async () => (await apiClient.get('/admin/reports/' + selectedId)).data,
    enabled: !!selectedId, staleTime: 10000, refetchInterval: 30000,
  });
  const agencies = useQuery<AdminAgency[]>({
    queryKey: ['admin-agencies'], queryFn: async () => (await apiClient.get('/admin/agencies')).data,
  });
  const mutation = useMutation({
    mutationFn: async ({ action, body }: { action: string; body?: Record<string, string> }) =>
      (await apiClient.post('/admin/reports/' + selectedId + '/' + action, body || {})).data,
    onSuccess: async (result) => {
      setSuccess(result.message || 'Perubahan berhasil disimpan.');
      setAction(null); setNote(''); setTargetTicket('');
      w.update({ laporan: null }, false);
      await w.refreshReports();
    },
    onError: async () => { await w.refreshReports(); },
  });
  useEffect(() => { setAction(null); setNote(''); setTargetTicket(''); mutation.reset(); }, [selectedId]);
  const counts = w.data?.counts;
  const selected = detail.data;
  const choose = (report: Report) => {
    if (mutation.isPending) return;
    scrollPosition.current = window.scrollY;
    w.update({ laporan: report.id }, false);
    setSuccess('');
    if (!desktop) window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const back = () => {
    w.update({ laporan: null }, false);
    requestAnimationFrame(() => window.scrollTo({ top: scrollPosition.current, behavior: 'instant' }));
  };
  const openAction = (next: 'reject' | 'duplicate' | 'assign') => {
    setAction(next); setNote(''); setTargetTicket(''); mutation.reset();
    if (next === 'assign' && selected) {
      const keyword = selected.kategori === 'drainase' ? 'sumber daya air' : selected.kategori === 'sampah' ? 'lingkungan hidup' : selected.kategori === 'penerangan' ? 'penerangan' : 'bina marga';
      setAgencyId(agencies.data?.find((agency) => agency.nama.toLowerCase().includes(keyword))?.id || '');
    }
  };
  const body = <div>
    <header className="dashboard-heading">
      <div><h1><ShieldCheck size={25} aria-hidden="true" />{embedded ? 'Dashboard Admin' : 'Kelola Laporan'}</h1><p>Prioritaskan laporan yang perlu diverifikasi dan ditugaskan.</p></div>
      <Link to="/admin/people" className="btn-primary"><Users size={16} aria-hidden="true" /> Kelola Warga & Instansi</Link>
    </header>
    <DashboardStats loading={!w.data} items={[
      { label: 'Total Laporan', icon: FileText, value: w.data?.totalAll || 0, onClick: () => w.update({ status: '' }) },
      { label: 'Perlu Verifikasi', icon: Clock, tone: 'amber', value: counts?.diterima || 0, onClick: () => w.update({ status: 'diterima' }) },
      { label: 'Perlu Ditugaskan', icon: Send, tone: 'blue', value: counts?.diverifikasi || 0, onClick: () => w.update({ status: 'diverifikasi' }) },
      { label: 'Selesai', icon: CheckCircle2, tone: 'green', value: counts?.selesai || 0, onClick: () => w.update({ status: 'selesai' }) },
    ]} />
    {success && <p role="status" className="workspace-success"><CheckCircle2 size={16} />{success}</p>}
    <div className="workspace-grid" data-detail={!!w.params.get('laporan')}>
      <section className="workspace-panel workspace-list" aria-label="Antrean laporan">
        <div className="workspace-panel-heading"><h2>Antrean Laporan</h2><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></div>
        <FilterTabs value={w.status} onChange={(status) => w.update({ status })} tabs={[
          { value: 'diterima', label: 'Perlu Verifikasi', count: counts?.diterima || 0 },
          { value: 'diverifikasi', label: 'Perlu Ditugaskan', count: counts?.diverifikasi || 0 },
          { value: 'ditugaskan', label: 'Menunggu Ditangani', count: counts?.ditugaskan || 0 },
          { value: 'dikerjakan', label: 'Dikerjakan', count: counts?.dikerjakan || 0 },
          { value: 'selesai', label: 'Selesai', count: counts?.selesai || 0 },
          { value: 'ditolak', label: 'Ditolak', count: counts?.ditolak || 0 },
          { value: 'duplikat', label: 'Duplikat', count: counts?.duplikat || 0 },
          { value: '', label: 'Semua', count: w.data?.totalAll || 0 },
        ]} />
        <div className="workspace-filters">
          <div className="workspace-search"><Search size={16} aria-hidden="true" /><input className="input" aria-label="Cari laporan" placeholder="Cari tiket, judul, atau lokasi" maxLength={150} value={w.search} onChange={(event) => w.update({ q: event.target.value || null })} /></div>
          <select className="input" aria-label="Kategori laporan" value={w.kategori} onChange={(event) => w.update({ kategori: event.target.value || null })}><option value="">Semua kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select className="input" aria-label="Status laporan" value={w.status} onChange={(event) => w.update({ status: event.target.value })}><option value="">Semua status</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select className="input" aria-label="Urutan laporan" value={w.sort} onChange={(event) => w.update({ sort: event.target.value })}><option value="oldest">Terlama dahulu</option><option value="newest">Terbaru dahulu</option></select>
        </div>
        {w.isLoading ? <div className="workspace-loading" role="status">Memuat antrean laporan…</div> : w.isError ? <div className="p-5"><QueryError subject="Antrean laporan" retry={w.refetch} pending={w.isFetching} /></div> : !w.data?.items.length ? <div className="workspace-empty"><FileText size={28} /><h3>Tidak ada laporan pada filter ini</h3><p>Pilih status lain atau ubah pencarian.</p><button className="btn-outline" onClick={() => w.update({ status: '', q: null, kategori: null })}>Lihat semua laporan</button></div> :
          <div className="workspace-rows">{w.data.items.map((report) => <button key={report.id} type="button" className="workspace-report-row" aria-pressed={selectedId === report.id} onClick={() => choose(report)}>
            {reportCover(report) ? <img src={reportCover(report)} alt="" /> : <div className="workspace-thumb-placeholder"><FileText size={22} /></div>}
            <div className="workspace-row-content"><p className="workspace-ticket">{report.kodeTiket}</p><h3>{report.judul}</h3><p>{report.namaJalan || report.region?.nama || 'Alamat belum tersedia'}</p><time className="workspace-row-age" dateTime={report.dibuatPada}>{formatDateTime(report.dibuatPada)}</time></div>
            <StatusBadge status={report.status} />
          </button>)}</div>}
        <WorkspacePagination data={w.data} onPage={(page) => w.update({ page: String(page), laporan: null }, false)} />
      </section>
      <aside className="workspace-panel workspace-detail" aria-label="Detail laporan">
        <DetailBack onClick={back} />
        {!selectedId ? <div className="workspace-empty"><FileText size={28} /><h2>Detail Laporan</h2><p>Pilih laporan untuk memeriksa bukti dan menentukan tindak lanjut.</p></div> : detail.isLoading ? <div className="workspace-loading" role="status">Memuat detail laporan…</div> : detail.isError ? <QueryError subject="Detail laporan" retry={detail.refetch} pending={detail.isFetching} /> : selected && <>
          <DetailPreview report={selected} />
          {mutation.isError && <p role="alert" className="workspace-error">{getActionError(mutation.error)}</p>}
          <div className="workspace-actions">
            {selected.status === 'diterima' && <><button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'verify' })}><CheckCircle2 size={16} />{mutation.isPending ? 'Menyimpan…' : 'Verifikasi Laporan'}</button><div className="workspace-action-pair"><button className="btn-outline" disabled={mutation.isPending} onClick={() => openAction('reject')}><XCircle size={15} />Tolak</button><button className="btn-outline" disabled={mutation.isPending} onClick={() => openAction('duplicate')}><Copy size={15} />Tandai Duplikat</button></div></>}
            {selected.status === 'diverifikasi' && <button className="btn-primary" disabled={mutation.isPending} onClick={() => openAction('assign')}><Send size={16} />Tugaskan ke Instansi</button>}
            {(selected.status === 'duplikat' || selected.status === 'diverifikasi') && !action && <button className="workspace-text-link" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'restore' })}>Kembalikan ke antrean verifikasi</button>}
          </div>
          {action && <form className="workspace-action-form" onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ action, body: action === 'assign' ? { agencyId, catatan: note } : action === 'reject' ? { alasan: note } : targetTicket ? { targetTicket } : {} });
          }}>
            <h3>{action === 'assign' ? 'Tugaskan ke instansi' : action === 'reject' ? 'Alasan penolakan' : 'Tandai sebagai duplikat'}</h3>
            {action === 'assign' && <><label className="label" htmlFor="assign-agency">Instansi penerima</label><select id="assign-agency" className="input" required value={agencyId} onChange={(event) => setAgencyId(event.target.value)}><option value="">Pilih instansi</option>{agencies.data?.map((agency) => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select>{agencies.isError && <p role="alert" className="workspace-error">Daftar instansi gagal dimuat. <button type="button" onClick={() => agencies.refetch()}>Coba lagi</button></p>}</>}
            {action === 'duplicate' ? <><p>Pastikan laporan membahas kejadian yang sama dengan laporan lain.</p><label className="label" htmlFor="duplicate-ticket">Kode tiket rujukan (opsional)</label><input id="duplicate-ticket" className="input" maxLength={20} value={targetTicket} onChange={(event) => setTargetTicket(event.target.value.toUpperCase())} placeholder="LPR-2026-00001" /></> : <><label className="label" htmlFor="admin-note">{action === 'reject' ? 'Jelaskan alasan penolakan' : 'Catatan penugasan (opsional)'}</label><textarea id="admin-note" className="input" maxLength={2000} required={action === 'reject'} value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></>}
            <div className="workspace-action-pair"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => setAction(null)}>Batal</button><button className="btn-primary" disabled={mutation.isPending || (action === 'assign' && !agencyId)}>{mutation.isPending ? 'Menyimpan…' : action === 'assign' ? 'Kirim Penugasan' : action === 'reject' ? 'Tolak Laporan' : 'Konfirmasi Duplikat'}</button></div>
          </form>}
          <Link className="workspace-text-link" to={'/reports/' + selected.id}>Lihat laporan lengkap <ArrowRight size={14} /></Link>
        </>}
      </aside>
    </div>
  </div>;
  return embedded ? body : <DashboardFrame>{body}</DashboardFrame>;
}
