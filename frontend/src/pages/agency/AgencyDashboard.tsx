import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ClipboardList, HardHat, CheckCircle2, Files } from 'lucide-react';
import QueryError from '@/components/QueryError';
import { StatusBadge, reportCover, WorkspaceRefresh } from '@/components/ReportWorkspaceUI';
import { KATEGORI_LABEL, STATUS_LABEL, Report, StatusLaporan, Region } from '@/types';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { useAgencyOverview, jakartaDay, periodRows } from './agencyData';
import './agency.css';

export function AgencySummary({ rows, loading, days }: { rows: Report[]; loading: boolean; days: number }) {
  const from = new Date(`${jakartaDay(new Date())}T12:00:00+07:00`); from.setUTCDate(from.getUTCDate() - days + 1);
  const period = days ? `&dateFrom=${jakartaDay(from)}&dateTo=${jakartaDay(new Date())}` : '';
  const metrics = [
    { label: 'Belum Ditangani', value: rows.filter(r => r.status === 'ditugaskan').length, icon: ClipboardList, status: 'ditugaskan', tone: 'red' },
    { label: 'Sedang Dikerjakan', value: rows.filter(r => r.status === 'dikerjakan').length, icon: HardHat, status: 'dikerjakan', tone: 'amber' },
    { label: 'Selesai', value: rows.filter(r => r.status === 'selesai').length, icon: CheckCircle2, status: 'selesai', tone: 'green' },
    { label: 'Total Laporan', value: rows.length, icon: Files, status: '', tone: 'neutral' },
  ];
  return <div className="agency-summary">{metrics.map(({ label, value, icon: Icon, status, tone }) => <Link key={label} data-tone={tone} className="admin-panel" to={`/agency/reports?status=${status}${period}`}><Icon size={21} /><div><span>{label}</span><strong>{loading ? '—' : value}</strong><small>Lihat laporan <ArrowUpRight size={11} /></small></div></Link>)}</div>;
}

export function AgencyTable({ rows, offset = 0 }: { rows: Report[]; offset?: number }) {
  return <div className="admin-table-scroll"><table className="agency-report-table"><thead><tr><th>#</th><th>Foto</th><th>Judul Laporan</th><th>Lokasi</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={row.id}><td>{offset + i + 1}</td><td>{reportCover(row) ? <img src={reportCover(row)} className="admin-table-photo" alt="" /> : <span className="agency-no-thumb">—</span>}</td><td className="admin-title-cell"><Link to={`/agency/assignments?laporan=${encodeURIComponent(row.id)}`}>{row.judul}</Link><small>{row.kodeTiket}</small></td><td>{row.namaJalan || 'Alamat belum dicantumkan'}<small>{row.region?.nama || '—'}</small></td><td>{formatDateTime(row.dibuatPada)}</td><td><StatusBadge status={row.status} /></td><td><Link className="admin-text-button" to={`/agency/assignments?laporan=${encodeURIComponent(row.id)}`} aria-label={`Detail ${row.kodeTiket}`}>Detail →</Link></td></tr>) : <tr><td colSpan={7} className="admin-loading">Tidak ada laporan pada filter ini.</td></tr>}</tbody></table></div>;
}

export function AgencyCharts({ rows, days, statistics = false, wilayah = [] }: { rows: Report[]; days: number; statistics?: boolean; wilayah?: Region[] }) {
  const [regionMetric, setRegionMetric] = useState('total');
  const today = new Date(`${jakartaDay(new Date())}T12:00:00+07:00`);
  const oldest = Math.min(today.getTime(), ...rows.map(row => new Date(`${jakartaDay(row.dibuatPada)}T12:00:00+07:00`).getTime()));
  const plotDays = days || Math.max(1, Math.round((today.getTime() - oldest) / 86400000) + 1);
  const buckets = Array.from({ length: plotDays }, (_, i) => {
    const date = new Date(today); date.setUTCDate(date.getUTCDate() - plotDays + 1 + i);
    const key = jakartaDay(date);
    const items = rows.filter(row => jakartaDay(row.dibuatPada) === key);
    return { day: key, masuk: items.length, selesai: items.filter(row => row.status === 'selesai').length };
  });
  const groups = new Map<string, { id: string; name: string; value: number }>();
  wilayah.forEach(region => groups.set(region.id, { id: region.id, name: region.nama, value: 0 }));
  rows.filter(row => regionMetric === 'total' || row.status === 'selesai').forEach(row => {
    const key = row.region?.id || 'unknown';
    const group = groups.get(key) || { id: key, name: row.region?.nama || 'Tanpa wilayah', value: 0 }; group.value++; groups.set(key, group);
  });
  const regions = [...groups.values()].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...regions.map(r => r.value));
  const from = new Date(today); from.setUTCDate(from.getUTCDate() - days + 1);
  const period = days ? `&dateFrom=${jakartaDay(from)}&dateTo=${jakartaDay(today)}` : '';
  const category = Object.entries(KATEGORI_LABEL).map(([key, name]) => ({ name, value: rows.filter(row => row.kategori === key).length })).filter(row => row.value);
  const status = Object.entries(STATUS_LABEL).map(([key, name]) => ({ name, value: rows.filter(row => row.status === key).length, color: getStatusColor(key as StatusLaporan) })).filter(row => row.value);
  const palette = ['#008358', '#59ad88', '#8bc9aa', '#b3dccc', '#d5eae1', '#6e8e7b'];
  const ring = (title: string, data: { name: string; value: number; color?: string }[]) => <section className="admin-panel admin-chart"><header><h2>{title}</h2></header>{data.length ? <div className="agency-ring"><div><ResponsiveContainer width="100%" height={160}><PieChart><Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={70} paddingAngle={2}>{data.map((d, i) => <Cell key={d.name} fill={d.color || palette[i % palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><strong>{rows.length}<small>Total laporan</small></strong></div><ul>{data.map((d, i) => <li key={d.name}><i style={{ background: d.color || palette[i % palette.length] }} /><span>{d.name}</span><b>{d.value}</b></li>)}</ul></div> : <p className="admin-loading">Belum ada laporan pada periode ini.</p>}</section>;
  return <div className="agency-charts">
    <section className="admin-panel admin-chart"><header><h2>Tren Laporan</h2><span>{plotDays} hari terakhir</span></header><div className="admin-chart-canvas"><ResponsiveContainer width="100%" height="100%"><LineChart data={buckets} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf2ef" /><XAxis dataKey="day" minTickGap={35} tickFormatter={date => new Date(date + 'T12:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={date => new Date(String(date) + 'T12:00:00Z').toLocaleDateString('id-ID')} /><Line isAnimationActive={false} type="linear" dataKey="masuk" name="Laporan masuk" stroke="#df9c1a" strokeWidth={2} dot={false} /><Line isAnimationActive={false} type="linear" dataKey="selesai" name="Masuk, kini selesai" stroke="#008358" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div><p className="agency-chart-legend"><span><i style={{ background: '#df9c1a' }} />Laporan masuk</span><span><i style={{ background: '#008358' }} />Masuk, kini selesai</span></p></section>
    {statistics && ring('Laporan per Kategori', category)}
    <section className="admin-panel admin-chart"><header><h2>Laporan per Wilayah</h2><select className="input" aria-label="Metrik wilayah instansi" value={regionMetric} onChange={event => setRegionMetric(event.target.value)}><option value="total">Jumlah laporan</option><option value="selesai">Laporan selesai</option></select></header><div className="admin-region-bars">{regions.length ? regions.map(row => <Link key={row.id} to={`/agency/reports?regionId=${row.id === 'unknown' ? '' : encodeURIComponent(row.id)}${regionMetric === 'selesai' ? '&status=selesai' : ''}${period}`}><span>{row.name}</span><div><i style={{ width: `${row.value / max * 100}%` }} /></div><strong>{row.value}</strong></Link>) : <p className="admin-loading">Belum ada data wilayah pada periode ini.</p>}</div></section>
    {statistics && ring('Status Penanganan', status)}
  </div>;
}

export default function AgencyDashboard({ statistics = false }: { statistics?: boolean }) {
  const query = useAgencyOverview();
  const [days, setDays] = useState(30);
  const rows = periodRows(query.data?.items || [], days);
  return <><header className="admin-page-header"><div><h1>{statistics ? 'Statistik' : 'Dashboard'}</h1><p>{statistics ? 'Analisis laporan yang ditugaskan ke instansi Anda.' : 'Ringkasan laporan dan tugas penanganan instansi Anda.'}</p></div><div className="admin-header-actions"><select aria-label="Periode laporan instansi" className="input" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option><option value={0}>Semua waktu</option></select><WorkspaceRefresh refreshing={query.isFetching} onClick={() => query.refetch()} /></div></header>
    {query.isError ? <QueryError subject="Ringkasan instansi" retry={query.refetch} /> : <><AgencySummary rows={rows} loading={query.isLoading} days={days} />{query.isLoading ? <p className="admin-loading">Memuat laporan instansi…</p> : <><AgencyCharts rows={rows} days={days} statistics={statistics} wilayah={query.data?.regions} />{!statistics && <section className="admin-panel agency-recent"><header><h2>Laporan Terbaru</h2><Link to="/agency/reports">Lihat semua →</Link></header><AgencyTable rows={rows.slice(0, 5)} /></section>}</>}</>}
  </>;
}
