import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, LoaderCircle, ReceiptText } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { CostOverviewData } from '@/types';
import { costDate, formatRupiah } from '@/lib/costs';
import QueryError from './QueryError';
import './report-costs.css';

type CostRole = 'public' | 'admin' | 'agency' | 'citizen';

function costOverviewQuery(role: CostRole, userId: string | undefined, params: {
  days: number; regionId: string; agencyId: string; page: number; limit: number;
}) {
  return {
    queryKey: ['report-costs', role, role === 'public' ? null : userId, params.days, params.regionId, params.agencyId, params.page, params.limit],
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CostOverviewData> => (
      await apiClient.get(`/${role === 'public' ? 'stats' : role}/costs`, {
        signal,
        params: { ...params, regionId: params.regionId || undefined, agencyId: params.agencyId || undefined },
      })
    ).data,
    staleTime: 15000,
  };
}

export default function CostOverview({ role = 'public', compact = false, landing = false, days }: {
  role?: CostRole; compact?: boolean; landing?: boolean; days?: number;
}) {
  const { hash, state, key: navigationKey } = useLocation();
  const openFromCostLink = !landing && hash === '#biaya' && state?.openCostDetails === true;
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [period, setPeriod] = useState(0);
  const [regionId, setRegion] = useState('');
  const [agencyId, setAgency] = useState('');
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(openFromCostLink);
  useEffect(() => {
    setDetailsOpen(openFromCostLink);
  }, [navigationKey, openFromCostLink]);
  const collapsible = (role === 'agency' || role === 'public' || role === 'admin') && !compact;
  const showDetails = !collapsible || detailsOpen;
  const effectiveDays = days ?? period;
  const pageSize = compact || landing ? 3 : 8;
  const query = useQuery<CostOverviewData>({
    ...costOverviewQuery(role, user?.id, { days: effectiveDays, regionId, agencyId, page, limit: pageSize }),
    enabled: role === 'public' || !!user, staleTime: 15000, placeholderData: keepPreviousData, refetchInterval: role === 'public' ? false : 30000,
  });
  const data = query.data;
  const currentPage = query.isPlaceholderData ? page : data?.page ?? page;
  const loadingChange = query.isFetching && (query.isPlaceholderData || !data);
  useEffect(() => {
    if (landing || compact || !showDetails || query.isPlaceholderData || !data || data.page * data.pageSize >= data.total) return;
    void queryClient.prefetchQuery(costOverviewQuery(role, user?.id, {
      days: effectiveDays, regionId, agencyId, page: data.page + 1, limit: pageSize,
    }));
  }, [queryClient, role, user?.id, effectiveDays, regionId, agencyId, pageSize, data, showDetails, landing, compact, query.isPlaceholderData]);
  useEffect(() => {
    if (hash !== '#biaya' || landing) return;
    const frame = requestAnimationFrame(() => document.getElementById('biaya')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [hash, landing, query.isLoading]);

  const link = (id: string) => role === 'public' ? `/reports/${id}#biaya-penanganan`
    : role === 'citizen' ? `/citizen/reports/${id}#biaya-penanganan` : `/${role}/${role === 'agency' ? 'assignments' : 'reports'}?laporan=${id}`;
  if (landing) return <section className="cost-landing" aria-label="Transparansi biaya penanganan">
    <div><span className="cost-eyebrow"><ReceiptText size={17} />Transparansi penanganan</span><h2>Hasil terlihat, biaya terbuka.</h2><p>Pantau penggunaan biaya pada laporan yang telah diselesaikan instansi.</p><Link to="/stats#biaya" state={{ openCostDetails: true }} className="workspace-text-link">Jelajahi rincian biaya <ArrowUpRight size={16} /></Link></div>
    <div className="cost-landing-total"><small>Total biaya tercatat</small><strong>{data ? formatRupiah(data.totalAmount) : '—'}</strong><p>{data ? `${data.recorded} dari ${data.completed} laporan selesai memiliki rincian biaya.` : 'Mengambil ringkasan biaya…'}</p>{query.isError && <QueryError subject="Ringkasan biaya" retry={query.refetch} />}</div>
  </section>;
  return <section id="biaya" className="cost-overview" aria-labelledby={`cost-heading-${role}`} aria-busy={query.isFetching}>
    <header className="cost-overview-heading"><div><span className="cost-eyebrow"><ReceiptText size={17} />Transparansi biaya</span><h2 id={`cost-heading-${role}`}>Realisasi Biaya Penanganan</h2><p>{role === 'citizen' ? 'Biaya penanganan untuk laporan Anda yang telah selesai.' : role === 'agency' ? 'Penggunaan biaya pada laporan yang diselesaikan instansi Anda.' : 'Penggunaan biaya yang dicatat instansi pada laporan selesai.'} Periode mengikuti tanggal penyelesaian.</p></div>{compact && <Link to={role === 'citizen' ? '/citizen/reports?status=selesai' : `/${role}/stats#biaya`} state={role === 'citizen' ? undefined : { openCostDetails: true }} className="workspace-text-link">Lihat rincian <ArrowUpRight size={16} /></Link>}{collapsible && <button
      type="button"
      className="btn-outline cost-details-toggle"
      aria-expanded={detailsOpen}
      aria-controls={`cost-filters-${role} cost-details-${role}`}
      onClick={() => setDetailsOpen(open => !open)}
    >{detailsOpen ? 'Sembunyikan detail' : 'Tampilkan detail'}<ChevronDown size={15} aria-hidden="true" /></button>}</header>
    {!compact && <div id={`cost-filters-${role}`} className="collapse-shell" data-open={showDetails} aria-hidden={!showDetails}><div className="collapse-content"><div className="cost-filters">
      {days === undefined && <label>Periode penyelesaian<select className="input" value={period} onChange={event => { setPeriod(Number(event.target.value)); setPage(1); }}><option value={0}>Semua waktu</option><option value={7}>7 hari terakhir</option><option value={30}>30 hari terakhir</option><option value={90}>90 hari terakhir</option></select></label>}
      <label>Wilayah<select className="input" value={regionId} onChange={event => { setRegion(event.target.value); setPage(1); }}><option value="">Semua wilayah</option>{data?.regions.map(region => <option key={region.id} value={region.id}>{region.nama}</option>)}</select></label>
      {role !== 'agency' && <label>Instansi<select className="input" value={agencyId} onChange={event => { setAgency(event.target.value); setPage(1); }}><option value="">Semua instansi</option>{data?.agencies.map(agency => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select></label>}
    </div></div></div>}
    {query.isError ? <QueryError subject="Realisasi biaya" retry={query.refetch} /> : <>
      <div className="cost-metrics"><div><small>Total biaya tercatat</small><strong>{data ? formatRupiah(data.totalAmount) : '—'}</strong></div><div><small>Laporan dengan rincian biaya</small><strong>{data?.recorded ?? '—'}<span> / {data?.completed ?? '—'} selesai</span></strong></div><div><small>Belum ada rincian biaya</small><strong>{data?.missing ?? '—'}<span> laporan</span></strong></div></div>
      {collapsible && !detailsOpen && regionId && <p className="cost-hint">Wilayah {data?.regions.find(region => region.id === regionId)?.nama || 'terpilih'}</p>}
      <div id={`cost-details-${role}`} className="collapse-shell" data-open={showDetails} aria-hidden={!showDetails}><div className="collapse-content">
      {!compact && <div className="cost-loading-status" role="status" aria-live="polite">
        {loadingChange && <><LoaderCircle size={14} className="animate-spin" aria-hidden="true" />Memperbarui rincian biaya…</>}
      </div>}
      <p className="cost-hint">Total dari rincian biaya laporan, bukan keseluruhan anggaran instansi. Nilai Rp0 berarti penanganan tanpa biaya tambahan.</p>
      {!!data?.rows.length && <div className="cost-report-list" data-pending={loadingChange}>{data.rows.map(row => <Link key={row.id} to={link(row.id)}><div><small>{row.kodeTiket} · {row.region?.nama || 'Jakarta'}</small><h3>{row.judul}</h3><p>{row.cost.agency?.nama}<span> · {row.selesaiPada ? `Selesai ${costDate(row.selesaiPada)} WIB` : 'Tanggal selesai belum tersedia'}</span></p></div><strong>{formatRupiah(row.cost.amount)}<ArrowUpRight size={16} /></strong></Link>)}</div>}
      {!compact && data && !data.rows.length && <div className="cost-empty"><ReceiptText size={25} /><h3>Belum ada biaya tercatat</h3><p>{data.missing ? `${data.missing} laporan selesai belum memiliki rincian biaya.` : 'Belum ada laporan selesai pada filter ini.'}</p></div>}
      {!compact && role !== 'agency' && !!data?.byAgency.length && <details className="cost-agency-summary"><summary>Ringkasan per instansi</summary><div>{data.byAgency.map(agency => <button type="button" key={agency.id} onClick={() => { setAgency(agency.id); setPage(1); }}><span>{agency.name}<small>{agency.reports} laporan</small></span><strong>{formatRupiah(agency.amount)}</strong></button>)}</div></details>}
      {!compact && data && data.total > data.pageSize && <nav className="cost-pagination" aria-label="Halaman rincian biaya"><button type="button" className="btn-outline" disabled={query.isPlaceholderData || currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span aria-live="polite">{currentPage} / {Math.ceil(data.total / data.pageSize)}</span><button type="button" className="btn-outline" disabled={query.isPlaceholderData || currentPage * data.pageSize >= data.total} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></nav>}
      </div></div>
    </>}
  </section>;
}
