import { useState } from 'react';
import { Link } from 'react-router-dom';
import QueryError from '@/components/QueryError';
import { WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { AgencySummary, AgencyTable, AgencyCharts } from '@/pages/agency/AgencyDashboard';
import { useAgencyOverview, periodRows } from '@/pages/agency/agencyData';
import './admin-workspace.css';

export default function AdminDashboard({ statistics = false }: { statistics?: boolean }) {
  const query = useAgencyOverview('admin');
  const [days, setDays] = useState(0);
  const rows = periodRows(query.data?.items || [], days);
  return <>
    <header className="admin-page-header"><div><h1>{statistics ? 'Statistik' : 'Dashboard'}</h1><p>{statistics ? 'Analisis laporan dan hasil penanganan di seluruh Jakarta.' : 'Ringkasan laporan dan aktivitas penanganan di seluruh Jakarta.'}</p></div><div className="admin-header-actions"><select aria-label="Periode laporan admin" className="input" value={days} onChange={event => setDays(Number(event.target.value))}><option value={0}>Semua waktu</option><option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option></select><WorkspaceRefresh refreshing={query.isFetching} onClick={() => query.refetch()} /></div></header>
    {query.isError ? <QueryError subject="Ringkasan admin" retry={query.refetch} /> : <>
      <AgencySummary rows={rows} loading={query.isLoading} days={days} base="/admin" />
      {query.isLoading ? <p className="admin-loading">Memuat laporan…</p> : statistics ? <AgencyCharts rows={rows} days={days} statistics wilayah={query.data?.regions} base="/admin" /> : <section className="admin-panel agency-recent admin-recent-tasks"><header><h2>Laporan Terbaru</h2><Link to="/admin/reports?sort=newest">Lihat semua →</Link></header><AgencyTable rows={rows.slice(0, 5)} base="/admin" /><footer><Link to="/admin/verification">Tinjau laporan yang menunggu verifikasi →</Link><Link to="/admin/tasks">Buka tugas penanganan →</Link></footer></section>}
    </>}
  </>;
}
