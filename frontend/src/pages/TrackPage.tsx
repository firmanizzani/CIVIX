import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Search, Ticket, AlertCircle, Loader2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

const stepOrder = ['diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan', 'selesai'];

export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('kode') || '');

  const kode = searchParams.get('kode') || '';

  const { data: report, isLoading, isError, error } = useQuery<Report>({
    queryKey: ['track', kode],
    queryFn: async () => (await apiClient.get(`/reports/track/${encodeURIComponent(kode)}`)).data,
    enabled: !!kode,
    retry: false,
    placeholderData: keepPreviousData,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ kode: input.trim().toUpperCase() });
  };

  const stepIndex = report ? stepOrder.indexOf(report.status) : -1;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-2xl bg-civix-navy p-4 text-white">
              <Ticket size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-civix-navy">Lacak Laporan</h1>
            <p className="mt-2 text-slate-600">
              Masukkan kode tiket yang kamu terima saat mengirim laporan, misalnya{' '}
              <span className="mono font-semibold text-civix-blue">LPR-2026-00123</span>
            </p>
          </div>

          <form onSubmit={submit} className="mb-10 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="LPR-2026-XXXXX"
                className="input mono h-12 pl-11 text-base uppercase"
                aria-label="Kode tiket laporan"
              />
            </div>
            <button type="submit" disabled={isLoading || !input.trim()} className="btn-primary h-12 px-8">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Lacak
            </button>
          </form>

          {isError && kode && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Kode tiket tidak ditemukan</p>
                <p className="text-sm text-red-700">
                  Pastikan kode tiket sudah benar. Kode bersifat besar-kecil tidak sensitif pada halaman ini.
                </p>
              </div>
            </div>
          )}

          {report && (
            <div className="animate-in-up space-y-6">
              <div className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs text-slate-400">Kode Tiket</p>
                    <p className="mono text-lg font-bold text-civix-navy">{report.kodeTiket}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    {STATUS_LABEL[report.status]}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-civix-navy">{report.judul}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {KATEGORI_LABEL[report.kategori]} · Dilaporkan {formatDateTime(report.dibuatPada)}
                </p>
                <Link to={`/reports/${report.id}`} className="btn-outline mt-4">
                  Buka halaman detail lengkap <ArrowRight size={16} />
                </Link>
              </div>

              <div className="card p-6">
                <h3 className="mb-6 font-bold text-civix-navy">Status Progres</h3>

                {report.status === 'ditolak' || report.status === 'duplikat' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Laporan ini {report.status === 'ditolak' ? 'ditolak' : 'ditandai duplikat'} oleh administrator.
                    Detail alasan tersedia pada timeline laporan.
                  </div>
                ) : (
                  <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
                    {stepOrder.map((step, index) => {
                      const done = index <= stepIndex;
                      const current = index === stepIndex;
                      return (
                        <li key={step} className="relative">
                          <span
                            className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                              done ? 'bg-green-500' : 'bg-slate-300'
                            } ${current ? 'ring-4 ring-green-100' : ''}`}
                          >
                            {done && <CheckCircle2 size={12} className="text-white" />}
                          </span>
                          <p className={`text-sm font-bold ${done ? 'text-civix-navy' : 'text-slate-400'}`}>
                            {STATUS_LABEL[step as keyof typeof STATUS_LABEL]}
                          </p>
                          {!done && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock size={11} /> Menunggu
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <div className="card p-6">
                <h3 className="mb-4 font-bold text-civix-navy">Riwayat Terakhir</h3>
                <div className="space-y-4">
                  {report.statusLogs?.slice(0, 6).map((log) => (
                    <div key={log.id} className="border-b border-slate-100 pb-3 last:border-none">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{STATUS_LABEL[log.status]}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(log.waktu)}</span>
                      </div>
                      {log.catatan && <p className="mt-1 text-xs text-slate-600">{log.catatan}</p>}
                    </div>
                  ))}
                  {(!report.statusLogs || report.statusLogs.length === 0) && (
                    <p className="text-sm text-slate-500">Belum ada riwayat status.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!kode && !isLoading && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
              Masukkan kode tiket untuk memulai pelacakan.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
