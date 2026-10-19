import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL, KategoriLaporan, StatusLaporan } from '@/types';
import { formatDate } from '@/lib/utils';
import { Search, Filter, AlertTriangle, ArrowRight } from 'lucide-react';

export default function PublicReportsPage() {
  const [kategori, setKategori] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['public-reports', kategori, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (kategori) params.append('kategori', kategori);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', '12');
      return (await apiClient.get(`/reports?${params.toString()}`)).data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-civix-navy">Daftar Laporan Publik</h1>
          <p className="mt-2 text-slate-600">Laporan yang telah terverifikasi di wilayah DKI Jakarta</p>
        </div>

        {/* Filter Bar */}
        <div className="card mb-8 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Kategori</label>
              <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1); }} className="input">
                <option value="">Semua Kategori</option>
                {Object.entries(KATEGORI_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="label">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input">
                <option value="">Semua Status</option>
                <option value="diterima">Menunggu Verifikasi</option>
                <option value="diverifikasi">Terverifikasi</option>
                <option value="ditugaskan">Ditugaskan</option>
                <option value="dikerjakan">Sedang Dikerjakan</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report List */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-64" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center">
            <AlertTriangle className="mx-auto mb-3 text-slate-400" size={36} />
            <p className="text-lg font-bold text-slate-800">Tidak ada laporan ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
              >
                {report.photos?.[0] ? (
                  <img src={report.photos[0].url} alt={report.judul} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                    Tidak ada foto
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-civix-blue">{KATEGORI_LABEL[report.kategori]}</span>
                    <span className="mono text-xs text-slate-500">{report.kodeTiket}</span>
                  </div>
                  <h3 className="line-clamp-2 font-bold text-civix-navy group-hover:text-civix-orange">{report.judul}</h3>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>{formatDate(report.dibuatPada)}</span>
                    <span className="font-semibold">{STATUS_LABEL[report.status]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
