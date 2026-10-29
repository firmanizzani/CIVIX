import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, CheckCircle2, XCircle, Copy, HardHat, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import LandingMap from '@/components/LandingMap';
import QueryError from '@/components/QueryError';
import { WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import apiClient from '@/lib/api';
import { ReportWorkspace, MapPoint, TrendRow, RegionStat, STATUS_LABEL, StatusLaporan } from '@/types';
import { getStatusColor } from '@/lib/utils';

export default function AdminDashboard() {
  const [mapStatus, setMapStatus] = useState('');
  const [months, setMonths] = useState(6);
  const [regionSort, setRegionSort] = useState('total');
  const totals = useQuery<ReportWorkspace>({ queryKey: ['admin-overview'], queryFn: async () => (await apiClient.get('/admin/reports', { params: { view: 'workspace', limit: 1 } })).data, refetchInterval: 30000 });
  const map = useQuery<MapPoint[]>({ queryKey: ['admin-map'], queryFn: async () => (await apiClient.get('/admin/map')).data, refetchInterval: 30000 });
  const trend = useQuery<TrendRow[]>({ queryKey: ['stats-trend'], queryFn: async () => (await apiClient.get('/stats/trend')).data });
  const regions = useQuery<RegionStat[]>({ queryKey: ['stats-regions'], queryFn: async () => (await apiClient.get('/stats/regions')).data });
  const counts = totals.data?.counts;
  const cards = [
    { label: 'Menunggu Verifikasi', value: counts?.diterima, icon: Clock, tone: 'amber', href: '/admin/verification' },
    { label: 'Dalam Penanganan', value: counts ? counts.ditugaskan + counts.dikerjakan : undefined, icon: HardHat, tone: 'blue', href: '/admin/reports?status=proses' },
    { label: 'Selesai', value: counts?.selesai, icon: CheckCircle2, tone: 'green', href: '/admin/reports?status=selesai' },
    { label: 'Ditolak', value: counts?.ditolak, icon: XCircle, tone: 'red', href: '/admin/reports?status=ditolak' },
    { label: 'Duplikat', value: counts?.duplikat, icon: Copy, tone: 'neutral', href: '/admin/reports?status=duplikat' },
    { label: 'Terverifikasi', value: counts?.diverifikasi, icon: FileText, tone: 'green', href: '/admin/reports?status=diverifikasi' },
  ];
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value) - 1;
  const trendData = Array.from({ length: months }, (_, i) => {
    const date = new Date(Date.UTC(year, month - months + 1 + i, 1));
    const key = date.toISOString().slice(0, 7);
    return { month: date.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }), jumlah: (trend.data || []).filter(row => row.periode === key).reduce((sum, row) => sum + Number(row.jumlah), 0) };
  });
  const regionRows = [...(regions.data || [])].sort((a, b) => Number(regionSort === 'selesai' ? b.selesai : b.total) - Number(regionSort === 'selesai' ? a.selesai : a.total));
  const regionMax = Math.max(1, ...regionRows.map(row => Number(regionSort === 'selesai' ? row.selesai : row.total)));
  const refresh = () => { void totals.refetch(); void map.refetch(); void trend.refetch(); void regions.refetch(); };
  return <>
    <header className="admin-page-header"><div><h1>Dashboard</h1><p>Ringkasan aktivitas dan kondisi laporan di Jakarta secara real-time.</p></div><WorkspaceRefresh refreshing={totals.isFetching || map.isFetching} onClick={refresh} /></header>
    {totals.isError && <QueryError subject="Ringkasan admin" retry={totals.refetch} pending={totals.isFetching} />}
    <div className="admin-overview-top">
      <section className="admin-panel admin-overview-map" aria-label="Peta laporan admin">
        <LandingMap interactive pointLimit={Infinity} reportLink={id => `/admin/reports?laporan=${encodeURIComponent(id)}`} points={(map.data || []).filter(point => !mapStatus || point.status === mapStatus)} loading={map.isLoading} error={map.isError} retry={map.refetch} fetching={map.isFetching} />
        <select aria-label="Status laporan di peta admin" className="input admin-map-select" value={mapStatus} onChange={event => setMapStatus(event.target.value)}><option value="">Semua status laporan</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <div className="admin-map-legend">{(['diterima', 'dikerjakan', 'selesai', 'ditolak', 'duplikat'] as StatusLaporan[]).map(status => <span key={status}><i style={{ background: getStatusColor(status) }} />{STATUS_LABEL[status]}</span>)}</div>
      </section>
      <section className="admin-overview-summary" aria-label="Ringkasan status laporan">
        <Link to="/admin/reports" className="admin-total"><div><span>Total Laporan</span><strong>{totals.data ? totals.data.totalAll.toLocaleString('id-ID') : '—'}</strong><small>Seluruh laporan di CIVIX</small></div><span className="admin-total-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span></Link>
        <div className="admin-status-grid">{cards.map(({ label, value, icon: Icon, tone, href }) => <Link to={href} key={label} data-tone={tone}><span><Icon size={15} />{label}</span><strong>{value === undefined ? '—' : value.toLocaleString('id-ID')}</strong><small>Lihat laporan <ArrowUpRight size={12} /></small></Link>)}</div>
      </section>
    </div>
    <div className="admin-chart-grid">
      <section className="admin-panel admin-chart"><header><h2>Tren Laporan</h2><select className="input" aria-label="Periode tren laporan" value={months} onChange={event => setMonths(Number(event.target.value))}><option value={6}>6 bulan terakhir</option><option value={3}>3 bulan terakhir</option></select></header>
        {trend.isError ? <QueryError subject="Tren laporan" retry={trend.refetch} /> : trend.isLoading ? <div className="admin-loading">Memuat tren laporan…</div> : <><div className="admin-chart-canvas"><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf2ef" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#77857d' }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#77857d' }} /><Tooltip cursor={{ fill: '#f0f8f4' }} /><Bar dataKey="jumlah" name="Laporan masuk" fill="#24a575" radius={[3, 3, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div><p className="admin-chart-caption"><i />Jumlah laporan masuk per bulan</p></>}
      </section>
      <section className="admin-panel admin-chart"><header><h2>Laporan per Wilayah</h2><select className="input" aria-label="Metrik laporan wilayah" value={regionSort} onChange={event => setRegionSort(event.target.value)}><option value="total">Jumlah laporan</option><option value="selesai">Laporan selesai</option></select></header>
        {regions.isError ? <QueryError subject="Laporan per wilayah" retry={regions.refetch} /> : regions.isLoading ? <div className="admin-loading">Memuat wilayah…</div> : !regionRows.length ? <div className="admin-loading">Belum ada data wilayah.</div> : <div className="admin-region-bars">{regionRows.map(row => { const value = Number(regionSort === 'selesai' ? row.selesai : row.total); return <Link key={row.regionId} to={`/admin/reports?regionId=${encodeURIComponent(row.regionId)}${regionSort === 'selesai' ? '&status=selesai' : ''}`}><span>{row.wilayah}</span><div><i style={{ width: `${value / regionMax * 100}%` }} /></div><strong>{value}</strong></Link>; })}</div>}
      </section>
    </div>
  </>;
}
