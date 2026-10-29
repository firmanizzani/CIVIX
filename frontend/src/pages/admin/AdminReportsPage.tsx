import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, Search, Clock, CheckCircle2, XCircle, Copy, Send, FileText, MoreHorizontal, CalendarDays, HardHat } from 'lucide-react';
import AdminReportDetail from '@/components/AdminReportDetail';
import ReportCompletionForm from '@/components/ReportCompletionForm';
import QueryError from '@/components/QueryError';
import { StatusBadge, WorkspacePagination, WorkspaceRefresh, reportCover } from '@/components/ReportWorkspaceUI';
import { getActionError, useReportWorkspace } from '@/hooks/useReportWorkspace';
import apiClient from '@/lib/api';
import { Report, AdminAgency, Region, KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminReportsPage({ verification = false }: { verification?: boolean }) {
  const w = useReportWorkspace('admin', verification ? 'diterima' : '');
  const selectedId = w.params.get('laporan');
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
    mutationFn: async ({ action, body, reportId }: { action: string; body?: Record<string, string>; reportId?: string }) =>
      (await apiClient.post(action === 'reject-task' ? '/agency/assignments/' + (reportId || selectedId) + '/reject' : '/admin/reports/' + (reportId || selectedId) + '/' + action, body || {})).data,
    onSuccess: async (result) => {
      setSuccess(result.message || 'Perubahan berhasil disimpan.');
      setAction(null); setNote(''); setTargetTicket('');
      w.update({ laporan: null, tindakan: null }, false);
      await w.refreshReports();
    },
    onError: async () => { await w.refreshReports(); },
  });
  useEffect(() => { const requested = w.params.get('tindakan'); setAction(requested === 'reject' || requested === 'duplicate' ? requested : null); setNote(''); setTargetTicket(''); mutation.reset(); }, [selectedId]);
  const counts = w.data?.counts;
  const selected = detail.data;
  const choose = (report: Report, next?: 'reject' | 'duplicate') => {
    if (mutation.isPending) return;
    w.update({ laporan: report.id, tindakan: next || null }, false);
    setSuccess(''); window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const back = () => w.update({ laporan: null, tindakan: null }, false);
  const regions = useQuery<Region[]>({ queryKey: ['admin-regions'], queryFn: async () => (await apiClient.get('/admin/regions')).data });
  const openAction = (next: 'reject' | 'duplicate' | 'assign') => {
    setAction(next); setNote(''); setTargetTicket(''); mutation.reset();
    if (next === 'assign' && selected) {
      const keyword = selected.kategori === 'drainase' ? 'sumber daya air' : selected.kategori === 'sampah' ? 'lingkungan hidup' : selected.kategori === 'penerangan' ? 'penerangan' : 'bina marga';
      setAgencyId(agencies.data?.find((agency) => agency.nama.toLowerCase().includes(keyword))?.id || '');
    }
  };
  const actions = selected && <>
    {mutation.isError && <p role="alert" className="workspace-error">{getActionError(mutation.error)}</p>}
          <div className="workspace-actions">
            {selected.status === 'diterima' && <><button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'verify' })}><CheckCircle2 size={16} />{mutation.isPending ? 'Menyimpan…' : 'Verifikasi Laporan'}</button><div className="workspace-action-pair"><button className="btn-outline" disabled={mutation.isPending} onClick={() => openAction('reject')}><XCircle size={15} />Tolak</button><button className="btn-outline" disabled={mutation.isPending} onClick={() => openAction('duplicate')}><Copy size={15} />Tandai Duplikat</button></div></>}
            {selected.status === 'diverifikasi' && <button className="btn-primary" disabled={mutation.isPending} onClick={() => openAction('assign')}><Send size={16} />Tugaskan ke Instansi</button>}
            {(selected.status === 'duplikat' || selected.status === 'diverifikasi') && !action && <button className="workspace-text-link" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'restore' })}>Kembalikan ke antrean verifikasi</button>}
          </div>
          {['ditugaskan', 'dikerjakan'].includes(selected.status) && !action && <><ReportCompletionForm key={selected.id} reportId={selected.id} onSaved={w.refreshReports} /><button className="admin-button-danger agency-reject" disabled={mutation.isPending} onClick={() => openAction('reject')}>Tolak Laporan</button></>}
          {selected.status === 'selesai' && <p className="workspace-muted">Penanganan sudah selesai. Foto bukti tersedia pada galeri laporan.</p>}
          {selected.status === 'ditolak' && <p className="workspace-muted">Laporan ditolak. Alasan penolakan tercatat dalam riwayat penanganan.</p>}
          {action && <form className="workspace-action-form" onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ action: action === 'reject' && selected.status !== 'diterima' ? 'reject-task' : action, body: action === 'assign' ? { agencyId, catatan: note } : action === 'reject' ? { alasan: note } : targetTicket ? { targetTicket } : {} });
          }}>
            <h3>{action === 'assign' ? 'Tugaskan ke instansi' : action === 'reject' ? 'Alasan penolakan' : 'Tandai sebagai duplikat'}</h3>
            {action === 'assign' && <><label className="label" htmlFor="assign-agency">Instansi penerima</label><select id="assign-agency" className="input" required value={agencyId} onChange={(event) => setAgencyId(event.target.value)}><option value="">Pilih instansi</option>{agencies.data?.map((agency) => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select>{agencies.isError && <p role="alert" className="workspace-error">Daftar instansi gagal dimuat. <button type="button" onClick={() => agencies.refetch()}>Coba lagi</button></p>}</>}
            {action === 'duplicate' ? <><p>Pastikan laporan membahas kejadian yang sama dengan laporan lain.</p><label className="label" htmlFor="duplicate-ticket">Kode tiket rujukan (opsional)</label><input id="duplicate-ticket" className="input" maxLength={20} value={targetTicket} onChange={(event) => setTargetTicket(event.target.value.toUpperCase())} placeholder="LPR-2026-00001" /></> : <><label className="label" htmlFor="admin-note">{action === 'reject' ? 'Jelaskan alasan penolakan' : 'Catatan penugasan (opsional)'}</label><textarea id="admin-note" className="input" maxLength={2000} required={action === 'reject'} value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></>}
            <div className="workspace-action-pair"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => setAction(null)}>Batal</button><button className="btn-primary" disabled={mutation.isPending || (action === 'assign' && !agencyId)}>{mutation.isPending ? 'Menyimpan…' : action === 'assign' ? 'Kirim Penugasan' : action === 'reject' ? 'Tolak Laporan' : 'Konfirmasi Duplikat'}</button></div>
          </form>}
  </>;
  const tabs = [
    { value: '', label: 'Semua', count: w.data?.totalAll, icon: FileText, tone: 'green' },
    { value: 'diterima', label: 'Menunggu', count: counts?.diterima, icon: Clock, tone: 'amber' },
    { value: 'diverifikasi', label: 'Terverifikasi', count: counts?.diverifikasi, icon: CheckCircle2, tone: 'green' },
    { value: 'proses', label: 'Diproses', count: counts ? counts.ditugaskan + counts.dikerjakan : undefined, icon: HardHat, tone: 'blue' },
    { value: 'ditolak', label: 'Ditolak', count: counts?.ditolak, icon: XCircle, tone: 'red' },
    { value: 'duplikat', label: 'Duplikat', count: counts?.duplikat, icon: Copy, tone: 'neutral' },
  ];
  if (selectedId) return <>
    {success && <p role="status" className="workspace-success">{success}</p>}
    {detail.isLoading ? <div className="admin-loading">Memuat detail laporan…</div> : detail.isError ? <><button className="admin-back" onClick={back}>← Kembali ke daftar</button><QueryError subject="Detail laporan" retry={detail.refetch} pending={detail.isFetching} /></> : selected && <AdminReportDetail report={selected} onBack={back} actions={actions} backLabel={verification ? "Verifikasi Laporan" : "Semua Laporan"} />}
  </>;
  return <>
    <header className="admin-page-header"><div><h1>{verification ? 'Antrean Verifikasi' : 'Semua Laporan'}</h1><p>{verification ? 'Tinjau laporan masuk, verifikasi, tolak, atau tandai duplikat sesuai ketentuan.' : 'Kelola seluruh laporan yang masuk ke sistem.'}</p></div><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></header>
    {success && <p role="status" className="workspace-success"><CheckCircle2 size={16} />{success}</p>}
    {mutation.isError && <p role="alert" className="workspace-error">{getActionError(mutation.error)}</p>}
    {verification && <div className="admin-queue-tabs">{tabs.map(({ value, label, count, icon: Icon, tone }) => <button type="button" key={label} data-tone={tone} aria-pressed={w.status === value} onClick={() => w.update({ status: value })}><Icon size={19} /><span>{label}<strong>{count === undefined ? '—' : count.toLocaleString('id-ID')}</strong></span></button>)}</div>}
    <div className="admin-report-filters">
      <div className="workspace-search"><Search size={15} /><input aria-label="Cari laporan admin" className="input" placeholder="Cari tiket, judul, atau lokasi…" value={w.search} maxLength={150} onChange={event => w.update({ q: event.target.value || null })} /></div>
      <select className="input" aria-label="Kategori laporan" value={w.kategori} onChange={event => w.update({ kategori: event.target.value || null })}><option value="">Kategori</option>{Object.entries(KATEGORI_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="input" aria-label="Wilayah laporan" value={w.params.get('regionId') || ''} onChange={event => w.update({ regionId: event.target.value || null })}><option value="">Wilayah</option>{regions.data?.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}</select>
      <select className="input" aria-label="Status laporan" value={w.status} onChange={event => w.update({ status: event.target.value })}><option value="">Semua status</option><option value="proses">Dalam penanganan</option><option value="ditolak_duplikat">Ditolak / Duplikat</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="input" aria-label="Instansi laporan" value={w.params.get('agencyId') || ''} onChange={event => w.update({ agencyId: event.target.value || null })}><option value="">Instansi</option>{agencies.data?.map(agency => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select>
      <details className="admin-date-filter"><summary><CalendarDays size={14} />{w.params.get('dateFrom') || w.params.get('dateTo') ? 'Tanggal dipilih' : 'Tanggal'}</summary><div><label>Dari<input type="date" className="input" value={w.params.get('dateFrom') || ''} max={w.params.get('dateTo') || undefined} onChange={event => w.update({ dateFrom: event.target.value || null })} /></label><label>Sampai<input type="date" className="input" value={w.params.get('dateTo') || ''} min={w.params.get('dateFrom') || undefined} onChange={event => w.update({ dateTo: event.target.value || null })} /></label></div></details>
      <select className="input" aria-label="Urutan laporan" value={w.sort} onChange={event => w.update({ sort: event.target.value })}><option value="oldest">Terlama</option><option value="newest">Terbaru</option></select>
      {(w.kategori || w.search || w.params.get('regionId') || w.params.get('agencyId') || w.params.get('dateFrom') || w.params.get('dateTo')) && <button className="admin-text-button" onClick={() => w.update({ kategori: null, q: null, regionId: null, agencyId: null, dateFrom: null, dateTo: null })}>Reset filter</button>}
    </div>
    {(agencies.isError || regions.isError) && <p className="workspace-error">Sebagian filter gagal dimuat. <button onClick={() => { void agencies.refetch(); void regions.refetch(); }}>Coba lagi</button></p>}
    <section className="admin-panel admin-report-table">
      {w.isError ? <div className="p-5"><QueryError subject="Laporan admin" retry={w.refetch} pending={w.isFetching} /></div> : <div className="admin-table-scroll"><table className={verification ? "admin-verification-table" : "admin-all-reports-table"}><thead><tr><th>#</th><th>Foto</th><th>Judul Laporan</th><th>Kategori</th><th>Lokasi</th>{!verification && <th>Status</th>}<th>Tanggal</th><th>Aksi</th></tr></thead><tbody>
        {w.isLoading ? <tr><td colSpan={verification ? 7 : 8} className="admin-loading">Memuat laporan…</td></tr> : !w.data?.items.length ? <tr><td colSpan={verification ? 7 : 8}><div className="workspace-empty"><FileText size={28} /><h2>Tidak ada laporan pada filter ini</h2><p>Ubah kategori, status, atau kata pencarian untuk melihat laporan lainnya.</p><button className="btn-outline" onClick={() => w.update({ status: '', kategori: null, q: null, regionId: null, agencyId: null, dateFrom: null, dateTo: null })}>Lihat semua laporan</button></div></td></tr> : w.data.items.map(report => <tr key={report.id}>
          <td className="admin-ticket-cell">{report.kodeTiket}</td><td>{reportCover(report) ? <img className="admin-table-photo" src={reportCover(report)} alt="" /> : <span className="admin-table-photo admin-no-photo"><FileText size={18} /></span>}</td>
          <td className="admin-title-cell"><button onClick={() => choose(report)}>{report.judul}</button>{verification && report.status !== 'diterima' && <StatusBadge status={report.status} />}</td><td><span className="admin-category" data-category={report.kategori}>{KATEGORI_LABEL[report.kategori]}</span></td><td className="admin-location-cell">{report.namaJalan || report.region?.nama || 'Alamat belum tersedia'}{report.region && <small>{report.region.nama}</small>}</td>{!verification && <td><StatusBadge status={report.status} /></td>}<td className="admin-date-cell">{formatDateTime(report.dibuatPada)}</td>
          <td><div className="admin-row-actions">{verification && report.status === 'diterima' ? <><button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: 'verify', reportId: report.id })}>Verifikasi</button><button className="admin-button-danger" disabled={mutation.isPending} onClick={() => choose(report, 'reject')}>Tolak</button></> : <button className="admin-text-button" onClick={() => choose(report)}>Detail <ArrowRight size={12} /></button>}
          <details className="admin-row-menu"><summary aria-label={`Aksi laporan ${report.kodeTiket}`}><MoreHorizontal size={18} /></summary><div><button onClick={() => choose(report)}>Lihat detail</button>{['diterima', 'diverifikasi'].includes(report.status) && <button onClick={() => choose(report, 'duplicate')}>Tandai duplikat</button>}{report.status === 'diterima' && <button onClick={() => choose(report, 'reject')}>Tolak laporan</button>}</div></details></div></td>
        </tr>)}
      </tbody></table></div>}
      <WorkspacePagination data={w.data} onPage={page => w.update({ page: String(page) }, false)} />
    </section>
  </>;
}
