import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ReceiptText } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { CostOverviewData } from '@/types';
import { costDate, formatRupiah } from '@/lib/costs';
import QueryError from './QueryError';
import './report-costs.css';

export default function CostOverview({ role = 'public', compact = false, landing = false, days }: {
  role?: 'public' | 'admin' | 'agency' | 'citizen'; compact?: boolean; landing?: boolean; days?: number;
}) {
  const { hash } = useLocation();
  const user = useAuthStore(state => state.user);
  const [period, setPeriod] = useState(0);
  const [regionId, setRegion] = useState('');
  const [agencyId, setAgency] = useState('');
  const [page, setPage] = useState(1);
  const effectiveDays = days ?? period;
  const pageSize = compact || landing ? 3 : 8;
  const query = useQuery<CostOverviewData>({
    queryKey: ['report-costs', role, role === 'public' ? null : user?.id, effectiveDays, regionId, agencyId, page, pageSize],
    queryFn: async () => (await apiClient.get(`/${role === 'public' ? 'stats' : role}/costs`, {
      params: { days: effectiveDays, regionId: regionId || undefined, agencyId: agencyId || undefined, page, limit: pageSize },
    })).data,
    enabled: role === 'public' || !!user, staleTime: 15000, placeholderData: keepPreviousData, refetchInterval: role === 'public' ? false : 30000,
  });
  const data = query.data;
  useEffect(() => {
    if (hash !== '#biaya' || landing) return;
    const frame = requestAnimationFrame(() => document.getElementById('biaya')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [hash, landing, query.isLoading]);

  const link = (id: string) => role === 'public' ? `/reports/${id}#biaya-penanganan`
    : role === 'citizen' ? `/citizen/reports/${id}#biaya-penanganan` : `/${role}/${role === 'agency' ? 'assignments' : 'reports'}?laporan=${id}`;
  if (landing) return <section className="cost-landing" aria-label="Transparansi biaya penanganan">
    <div><span className="cost-eyebrow"><ReceiptText size={17} />Transparansi penanganan</span><h2>Hasil terlihat, biaya terbuka.</h2><p>Pantau penggunaan biaya pada laporan yang telah diselesaikan instansi.</p><Link to="/stats#biaya" className="workspace-text-link">Jelajahi rincian biaya <ArrowUpRight size={16} /></Link></div>
    <div className="cost-landing-total"><small>Total biaya tercatat</small><strong>{data ? formatRupiah(data.totalAmount) : '—'}</strong><p>{data ? `${data.recorded} dari ${data.completed} laporan selesai memiliki rincian biaya.` : 'Mengambil ringkasan biaya…'}</p>{query.isError && <QueryError subject="Ringkasan biaya" retry={query.refetch} />}</div>
  </section>;
  return <section id="biaya" className="cost-overview" aria-labelledby={`cost-heading-${role}`} aria-busy={query.isFetching}>
    <header className="cost-overview-heading"><div><span className="cost-eyebrow"><ReceiptText size={17} />Transparansi biaya</span><h2 id={`cost-heading-${role}`}>Realisasi Biaya Penanganan</h2><p>{role === 'citizen' ? 'Biaya penanganan untuk laporan Anda yang telah selesai.' : role === 'agency' ? 'Penggunaan biaya pada laporan yang diselesaikan instansi Anda.' : 'Penggunaan biaya yang dicatat instansi pada laporan selesai.'} Periode mengikuti tanggal penyelesaian.</p></div>{compact && <Link to={role === 'citizen' ? '/citizen/reports?status=selesai' : `/${role}/stats#biaya`} className="workspace-text-link">Lihat rincian <ArrowUpRight size={16} /></Link>}</header>
    {!compact && <div className="cost-filters">
      {days === undefined && <label>Periode penyelesaian<select className="input" value={period} onChange={event => { setPeriod(Number(event.target.value)); setPage(1); }}><option value={0}>Semua waktu</option><option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option></select></label>}
      <label>Wilayah<select className="input" value={regionId} onChange={event => { setRegion(event.target.value); setPage(1); }}><option value="">Semua wilayah</option>{data?.regions.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}</select></label>
      {role !== 'agency' && <label>Instansi<select className="input" value={agencyId} onChange={event => { setAgency(event.target.value); setPage(1); }}><option value="">Semua instansi</option>{data?.agencies.map(agency => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select></label>}
    </div>}
    {query.isError ? <QueryError subject="Realisasi biaya" retry={query.refetch} /> : <>
      <div className="cost-metrics"><div><small>Total biaya tercatat</small><strong>{data ? formatRupiah(data.totalAmount) : '—'}</strong></div><div><small>Laporan dengan rincian biaya</small><strong>{data?.recorded ?? '—'}<span> / {data?.completed ?? '—'} selesai</span></strong></div><div><small>Belum ada rincian biaya</small><strong>{data?.missing ?? '—'}<span> laporan</span></strong></div></div>
      <p className="cost-hint">Total dari rincian biaya laporan, bukan keseluruhan anggaran instansi. Nilai Rp0 berarti penanganan tanpa biaya tambahan.</p>
      {!!data?.rows.length && <div className="cost-report-list">{data.rows.map(row => <Link key={row.id} to={link(row.id)}><div><small>{row.kodeTiket} · {row.region?.nama || 'Jakarta'}</small><h3>{row.judul}</h3><p>{row.cost.agency?.nama}<span> · {row.selesaiPada ? `Selesai ${costDate(row.selesaiPada)} WIB` : 'Tanggal selesai belum tersedia'}</span></p></div><strong>{formatRupiah(row.cost.amount)}<ArrowUpRight size={16} /></strong></Link>)}</div>}
      {!compact && data && !data.rows.length && <div className="cost-empty"><ReceiptText size={25} /><h3>Belum ada biaya tercatat</h3><p>{data.missing ? `${data.missing} laporan selesai belum memiliki rincian biaya.` : 'Belum ada laporan selesai pada filter ini.'}</p></div>}
      {!compact && !!data?.byAgency.length && <details className="cost-agency-summary"><summary>Ringkasan per instansi</summary><div>{data.byAgency.map(agency => <button type="button" key={agency.id} onClick={() => { setAgency(agency.id); setPage(1); }}><span>{agency.name}<small>{agency.reports} laporan</small></span><strong>{formatRupiah(agency.amount)}</strong></button>)}</div></details>}
      {!compact && data && data.total > data.pageSize && <nav className="cost-pagination" aria-label="Halaman rincian biaya"><button className="btn-outline" disabled={query.isFetching || data.page <= 1} onClick={() => setPage(data.page - 1)}>Sebelumnya</button><span>{data.page} / {Math.ceil(data.total / data.pageSize)}</span><button className="btn-outline" disabled={query.isFetching || data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>Berikutnya</button></nav>}
    </>}
  </section>;
}
