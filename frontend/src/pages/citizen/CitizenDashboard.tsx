import { Link } from 'react-router-dom';
import { ClipboardList, HardHat, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ReportWorkspace } from '@/types';
import QueryError from '@/components/QueryError';
import { WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { CitizenReportRows } from './CitizenReportsPage';

export default function CitizenDashboard() {
  const user = useAuthStore(state => state.user);
  const query = useQuery<ReportWorkspace>({ queryKey: ['citizen-overview', user?.id], queryFn: async () => (await apiClient.get('/reports/me/reports', { params: { view: 'workspace', limit: 3, sort: 'newest' } })).data, refetchInterval: 30000 });
  const c = query.data?.counts;
  const metrics = [{ label: 'Total Laporan', value: query.data?.totalAll, status: '', icon: ClipboardList, tone: 'rose' }, { label: 'Sedang Diproses', value: c ? c.diterima + c.diverifikasi + c.ditugaskan + c.dikerjakan : undefined, status: 'aktif', icon: HardHat, tone: 'amber' }, { label: 'Selesai', value: c?.selesai, status: 'selesai', icon: CheckCircle2, tone: 'green' }, { label: 'Ditolak / Duplikat', value: c ? c.ditolak + c.duplikat : undefined, status: 'ditolak_duplikat', icon: XCircle, tone: 'rose' }];
  return <><header className="admin-page-header"><div><h1>Dashboard</h1><p>Pantau laporan Anda dan lihat perkembangan penanganannya.</p></div><WorkspaceRefresh refreshing={query.isFetching} onClick={() => query.refetch()} /></header>{query.isError ? <QueryError subject="Ringkasan laporan Anda" retry={query.refetch} /> : <><div className="warga-summary">{metrics.map(({ label, value, status, icon: Icon, tone }) => <Link key={label} to={'/citizen/reports?status=' + status} data-tone={tone} className="admin-panel"><span><Icon size={22} /></span><div><small>{label}</small><strong>{value === undefined ? '—' : value}</strong></div></Link>)}</div><div className="warga-overview-grid"><section className="admin-panel warga-recent"><header><h2>Laporan Terbaru</h2><Link to="/citizen/reports">Lihat semua →</Link></header>{query.isLoading ? <p className="admin-loading">Memuat laporan Anda…</p> : query.data?.items.length ? <CitizenReportRows reports={query.data.items} /> : <div className="workspace-empty"><ClipboardList size={30} /><h2>Belum ada laporan</h2><p>Masalah di sekitar Anda dapat menjadi awal perubahan.</p><Link to="/citizen/create-report" className="btn-outline">Buat Laporan Pertama</Link></div>}</section><aside className="admin-panel warga-invitation"><img src="/citizen-community.svg" alt="Ilustrasi warga bersama di ruang hijau kota" /><h2>Bersama wujudkan<br />Jakarta yang lebih baik</h2><p>Laporkan permasalahan di sekitar Anda dengan mudah dan jelas.</p><Link to="/citizen/create-report" className="btn-primary">Buat Laporan Sekarang</Link></aside></div></>}</>;
}
