import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import QueryError from '@/components/QueryError';
import Navbar from '@/components/Navbar';
import PageHeading from '@/components/PageHeading';
import { ArrowRight, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import apiClient from '@/lib/api';
import { publicReportDetailQuery } from '@/lib/reportQueries';
import { PublicReportCard, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';

export default function PublicReportsPage() {
  const [kategori, setKategori] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [periode, setPeriode] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openingId, setOpeningId] = useState<string>();
  const [failedId, setFailedId] = useState<string>();
  const opening = useRef<{ id: string }>();
  const prefetchTimer = useRef<number>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const effectivePeriod = periode === 'custom' && !startDate && !endDate ? '' : periode;
  const activeFilters = [kategori, status, effectivePeriod].filter(Boolean).length;

  useEffect(() => () => {
    window.clearTimeout(prefetchTimer.current);
    opening.current = undefined;
  }, []);

  function prefetchReport(id: string) {
    void queryClient.prefetchQuery(publicReportDetailQuery(id));
  }

  async function openReport(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    window.clearTimeout(prefetchTimer.current);
    if (opening.current?.id === id) return;

    const request = { id };
    opening.current = request;
    setOpeningId(id);
    setFailedId(undefined);
    try {
      await queryClient.fetchQuery(publicReportDetailQuery(id));
      if (opening.current === request) navigate(`/reports/${id}`);
    } catch {
      if (opening.current === request) setFailedId(id);
    } finally {
      if (opening.current === request) {
        opening.current = undefined;
        setOpeningId(undefined);
      }
    }
  }

  const { data: reports = [], isLoading, isError, refetch, isFetching } = useQuery<PublicReportCard[]>({
    queryKey: ['public-reports', kategori, status, effectivePeriod, startDate, endDate, page],
    retry: (failureCount, error) => failureCount < 1 && !(isAxiosError(error) && error.code === 'ECONNABORTED'),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ view: 'cards' });
      if (kategori) params.append('kategori', kategori);
      if (status) params.append('status', status);
      if (effectivePeriod) params.append('periode', effectivePeriod);
      if (effectivePeriod === 'custom' && startDate) params.append('startDate', startDate);
      if (effectivePeriod === 'custom' && endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', '12');
      return (await apiClient.get<PublicReportCard[]>('/reports', { params, signal, timeout: 12000 })).data;
    },
  });

  return (
    <div className="app-page reports-page flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <Reveal>
          <PageHeading label="Laporan warga" title="Lihat laporan, pantau perubahan." description="Laporan yang telah terverifikasi di wilayah DKI Jakarta. Temukan kondisi di sekitar Anda dan ikuti perkembangannya." action={<Link to="/citizen/create-report" className="btn-primary">Buat Laporan <ArrowRight size={16} /></Link>} />
        </Reveal>

        {/* Filter Bar */}
        <Reveal delay="delay-1">
          <div className="card mb-6 px-4 md:mb-8 md:py-4">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="report-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex min-h-12 w-full items-center gap-2 text-left text-sm font-semibold text-civix-navy md:hidden"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filter laporan
              {activeFilters > 0 && <span className="rounded-full bg-civix-soft px-2 py-1 text-xs">{activeFilters} aktif</span>}
              <ChevronDown size={16} aria-hidden="true" className={`ml-auto ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
            <div id="report-filters" className={`${filtersOpen ? 'grid border-t border-civix-border py-4' : 'hidden'} gap-4 md:grid md:grid-cols-3 md:border-0 md:py-0`}>
              <div className="min-w-0">
                <label htmlFor="public-category" className="label">Kategori</label>
                <select id="public-category" value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1); }} className="input min-h-11">
                  <option value="">Semua Kategori</option>
                  {Object.entries(KATEGORI_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="public-status" className="label">Status</label>
                <select id="public-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input min-h-11">
                  <option value="">Semua Status</option>
                  <option value="diterima">Menunggu Verifikasi</option>
                  <option value="diverifikasi">Terverifikasi</option>
                  <option value="ditugaskan">{STATUS_LABEL.ditugaskan}</option>
                  <option value="dikerjakan">Sedang Dikerjakan</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="public-period" className="label flex items-center gap-1.5"><Clock size={14} /> Waktu</label>
                <select id="public-period" value={periode} onChange={(e) => { setPeriode(e.target.value); setPage(1); }} className="input min-h-11">
                  <option value="">Semua Waktu</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="month">Bulan Ini</option>
                  <option value="custom">Rentang Tanggal Khusus</option>
                </select>
              </div>

              {periode === 'custom' && (
                <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
                  <div className="min-w-0">
                    <label className="label" htmlFor="start-date">Tanggal Awal</label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="input min-h-11 min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="label" htmlFor="end-date">Tanggal Akhir</label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="input min-h-11 min-w-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Report List */}
        <Reveal delay="delay-2">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-64" />
              ))}
            </div>
          ) : isError ? (
            <QueryError subject="Daftar laporan" retry={refetch} pending={isFetching} />
          ) : reports.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertTriangle className="mx-auto mb-3 text-slate-400" size={36} />
              <p className="text-lg font-bold text-slate-800">Tidak ada laporan ditemukan</p>
              <p className="mt-1 text-sm text-slate-500">Coba ubah filter kategori, status, atau waktu.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  data-reveal-item
                  to={`/reports/${report.id}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') {
                      window.clearTimeout(prefetchTimer.current);
                      prefetchTimer.current = window.setTimeout(() => prefetchReport(report.id), 150);
                    }
                  }}
                  onPointerLeave={() => window.clearTimeout(prefetchTimer.current)}
                  onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) prefetchReport(report.id); }}
                  onClick={(event) => { void openReport(event, report.id); }}
                  aria-busy={openingId === report.id}
                  className="group card overflow-hidden transition motion-card hover:shadow-lg aria-busy:cursor-progress"
                >
                  {report.photos?.[0] ? (
                    <img src={report.photos[0].url} alt={report.judul} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                      Tidak ada foto
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold text-civix-blue">{KATEGORI_LABEL[report.kategori]}</span>
                      <span className="mono text-xs text-slate-500">{report.kodeTiket}</span>
                    </div>
                    <h3 className="line-clamp-2 break-words font-bold text-civix-navy group-hover:text-civix-orange">{report.judul}</h3>
                    {report.namaJalan && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-civix-primary" />
                        <span className="line-clamp-1">{report.namaJalan}</span>
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>{formatDate(report.dibuatPada)}</span>
                      <span className={`rounded-full px-2.5 py-1 font-semibold ${getStatusBadgeClasses(report.status)}`}>{STATUS_LABEL[report.status]}</span>
                    </div>
                    {failedId === report.id && <p role="alert" className="mt-3 text-sm text-red-700">Detail belum bisa dibuka. Klik lagi untuk mencoba.</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <Footer />
    </div>
  );
}
