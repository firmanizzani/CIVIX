import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import CostOverview from '@/components/CostOverview';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import QueryError from '@/components/QueryError';
import { WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { AgencyTable, AgencyCharts } from '@/pages/agency/AgencyDashboard';
import { useAgencyOverview } from '@/pages/agency/agencyData';
import AdminReportSummary from '@/components/AdminReportSummary';
import { getAdminReportMetrics } from '@/lib/adminReportMetrics';
import './admin-workspace.css';

export default function AdminDashboard({ statistics = false }: { statistics?: boolean }) {
  const query = useAgencyOverview('admin');
  const client = useQueryClient();
  const costRefreshing = useIsFetching({ queryKey: ['report-costs', 'admin'] }) > 0;
  const [days, setDays] = useState(30);
  const metrics = getAdminReportMetrics(query.data?.items || [], days);
  const rows = metrics.rows;
  const period = metrics.dateFrom && metrics.dateTo ? '&dateFrom=' + metrics.dateFrom + '&dateTo=' + metrics.dateTo : '';
  return <>
    <header className="admin-page-header"><div><h1>{statistics ? 'Statistik' : 'Dashboard'}</h1><p>{statistics ? 'Analisis laporan dan hasil penanganan di seluruh Jakarta.' : 'Ringkasan laporan yang masuk pada periode terpilih di Jakarta.'}</p></div><div className="admin-header-actions"><select aria-label="Periode laporan admin" className="input" value={days} onChange={event => setDays(Number(event.target.value))}><option value={0}>Semua waktu</option><option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option></select><WorkspaceRefresh refreshing={query.isFetching || costRefreshing} onClick={() => { void query.refetch(); void client.invalidateQueries({ queryKey: ['report-costs', 'admin'] }); }} /></div></header>
    {query.isError ? <QueryError subject="Ringkasan admin" retry={query.refetch} /> : <>
      <AdminReportSummary reports={query.data?.items || []} loading={query.isLoading} days={days} /><CostOverview role="admin" days={days} compact={!statistics} />
      {query.isLoading ? <p className="admin-loading">Memuat laporan…</p> : statistics ? <AgencyCharts rows={rows} days={days} statistics wilayah={query.data?.regions} base="/admin" /> : <section className="admin-panel agency-recent admin-recent-tasks"><header><h2>Laporan Terbaru</h2><Link to={'/admin/reports?sort=newest' + period}>Lihat semua →</Link></header><AgencyTable rows={rows.slice(0, 5)} base="/admin" /><footer><Link to={'/admin/verification' + (period ? '?' + period.slice(1) : '')}>Tinjau laporan yang menunggu verifikasi →</Link><Link to={'/admin/reports?status=proses' + period}>Lihat laporan dalam penanganan →</Link></footer></section>}
    </>}
  </>;
}
