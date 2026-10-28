import { Link } from 'react-router-dom';
import { ArrowRight, UserRound, Clock, CheckCircle2, FileText, HelpCircle, MapPin, MessageSquare, PlusCircle, Search } from 'lucide-react';
import DashboardFrame from '@/components/DashboardFrame';
import QueryError from '@/components/QueryError';
import { DashboardStats, FilterTabs, ReportProgress, StatusBadge, WorkspacePagination, WorkspaceRefresh, lastUpdate, relativeTime, reportCover } from '@/components/ReportWorkspaceUI';
import { useReportWorkspace } from '@/hooks/useReportWorkspace';
import { formatDateTime } from '@/lib/utils';
import { STATUS_LABEL } from '@/types';

export default function CitizenDashboard() {
  const w = useReportWorkspace('citizen');
  const counts = w.data?.counts;
  const active = (counts?.diterima || 0) + (counts?.diverifikasi || 0) + (counts?.ditugaskan || 0) + (counts?.dikerjakan || 0);
  return <DashboardFrame>
    <header className="dashboard-heading">
      <div><h1><UserRound size={25} aria-hidden="true" />Halo, {w.user?.nama || 'Warga'}</h1><p>Pantau perkembangan laporan Anda dan tindak lanjutnya.</p></div>
      <Link to="/citizen/create-report" className="btn-primary"><PlusCircle size={17} aria-hidden="true" />Buat Laporan Baru</Link>
    </header>
    <DashboardStats loading={!w.data} items={[
      { label: 'Total Laporan', icon: FileText, value: w.data?.totalAll || 0, onClick: () => w.update({ status: '' }) },
      { label: 'Dalam Proses', icon: Clock, tone: 'amber', value: active, onClick: () => w.update({ status: 'aktif' }) },
      { label: 'Selesai', icon: CheckCircle2, tone: 'green', value: counts?.selesai || 0, onClick: () => w.update({ status: 'selesai' }) },
    ]} />
    <section className="citizen-workspace" aria-labelledby="my-reports-heading">
      <div className="workspace-panel-heading citizen-panel-heading"><h2 id="my-reports-heading">Laporan Saya</h2><div className="citizen-heading-tools"><div className="workspace-search"><Search size={16} aria-hidden="true" /><input className="input" aria-label="Cari laporan saya" placeholder="Cari laporan saya" maxLength={150} value={w.search} onChange={(event) => w.update({ q: event.target.value || null })} /></div><WorkspaceRefresh refreshing={w.isFetching} onClick={() => w.refetch()} /></div></div>
      <div className="citizen-list-controls">
        <FilterTabs value={w.status} onChange={(status) => w.update({ status })} tabs={[
          { value: '', label: 'Semua', count: w.data?.totalAll || 0 },
          { value: 'aktif', label: 'Dalam Proses', count: active },
          { value: 'selesai', label: 'Selesai', count: counts?.selesai || 0 },
        ]} />
        <select className="input" aria-label="Urutan laporan saya" value={w.sort} onChange={(event) => w.update({ sort: event.target.value })}><option value="newest">Terbaru dahulu</option><option value="oldest">Terlama dahulu</option></select>
      </div>
      {w.isLoading ? <div className="workspace-panel workspace-loading" role="status">Memuat laporan Anda…</div> : w.isError ? <QueryError subject="Laporan Anda" retry={w.refetch} pending={w.isFetching} /> : !w.data?.items.length ? <div className="workspace-panel workspace-empty"><FileText size={32} /><h3>{w.data?.totalAll ? 'Tidak ada laporan pada filter ini' : 'Belum ada laporan'}</h3><p>{w.data?.totalAll ? 'Coba ubah pencarian atau pilih status lain.' : 'Laporkan masalah infrastruktur atau lingkungan di sekitar Anda.'}</p>{w.data?.totalAll ? <button className="btn-outline" onClick={() => w.update({ status: '', q: null })}>Lihat semua laporan</button> : <Link className="btn-primary" to="/citizen/create-report">Buat Laporan Pertama</Link>}</div> :
        <div className="citizen-report-list">{w.data.items.map((report) => <article key={report.id} className="workspace-panel citizen-report">
          <Link className="citizen-report-photo" to={'/reports/' + report.id}>{reportCover(report) ? <img src={reportCover(report)} alt={report.judul} /> : <span><MapPin size={26} aria-hidden="true" />Belum ada foto</span>}</Link>
          <div className="citizen-report-content"><p className="workspace-ticket">{report.kodeTiket}</p><h3><Link to={'/reports/' + report.id}>{report.judul}</Link></h3><StatusBadge status={report.status} /><p className="workspace-location"><MapPin size={14} aria-hidden="true" />{report.namaJalan || report.region?.nama || 'Alamat belum dicantumkan'}</p><p className="workspace-muted">{report.assignedAgency?.nama || 'Menunggu penugasan ke instansi terkait'}</p><p className="citizen-latest-update"><MessageSquare size={14} aria-hidden="true" />{report.statusLogs?.[0]?.catatan || STATUS_LABEL[report.status]}</p><time className="workspace-row-age" dateTime={lastUpdate(report)} title={formatDateTime(lastUpdate(report))}>Diperbarui {relativeTime(lastUpdate(report))}</time></div>
          <div className="citizen-report-progress"><ReportProgress status={report.status} /><Link className="btn-outline" to={'/reports/' + report.id}>Lihat Detail <ArrowRight size={15} /></Link></div>
        </article>)}</div>}
      <WorkspacePagination data={w.data} onPage={(page) => w.update({ page: String(page) }, false)} />
    </section>
    <details className="citizen-help"><summary><HelpCircle size={18} aria-hidden="true" /><span>Memahami status laporan Anda</span></summary><div><p><strong>Menunggu verifikasi:</strong> admin sedang memeriksa kelengkapan laporan.</p><p><strong>Terverifikasi:</strong> laporan disetujui dan menunggu penugasan.</p><p><strong>Menunggu ditangani:</strong> instansi sudah menerima tugas.</p><p><strong>Sedang dikerjakan:</strong> instansi sedang menangani laporan.</p><p><CheckCircle2 size={14} aria-hidden="true" /><strong>Selesai:</strong> lihat riwayat dan bukti penyelesaian pada halaman detail.</p></div></details>
  </DashboardFrame>;
}
