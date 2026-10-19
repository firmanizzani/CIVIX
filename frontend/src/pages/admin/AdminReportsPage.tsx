import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate } from '@/lib/utils';
import { Search, CheckCircle2, XCircle, Copy, Send, AlertCircle } from 'lucide-react';

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return (await apiClient.get(`/admin/reports${params}`)).data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: string; data?: any }) =>
      (await apiClient.post(`/admin/reports/${id}/${action}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setActionError('');
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Aksi gagal'),
  });

  const handleAction = (report: Report, action: string) => {
    if (action === 'reject') {
      const alasan = window.prompt('Masukkan alasan penolakan:');
      if (!alasan) return;
      actionMutation.mutate({ id: report.id, action, data: { alasan } });
    } else if (action === 'duplicate') {
      if (!window.confirm('Tandai laporan ini sebagai duplikat?')) return;
      actionMutation.mutate({ id: report.id, action });
    } else if (action === 'assign') {
      const instansiNama = window.prompt('Nama instansi penerima:');
      if (!instansiNama) return;
      actionMutation.mutate({ id: report.id, action, data: { instansiNama } });
    } else {
      actionMutation.mutate({ id: report.id, action });
    }
  };

  const filteredReports = reports.filter((r) =>
    r.judul.toLowerCase().includes(search.toLowerCase()) ||
    r.kodeTiket.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-civix-navy">Kelola Laporan</h1>
            <p className="mt-1 text-slate-600">Verifikasi, tolak, tandai duplikat, atau tugaskan laporan.</p>
          </div>
          <Link to="/admin" className="btn-outline">Kembali ke dashboard</Link>
        </div>

        {actionError && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={16} /> {actionError}
          </div>
        )}

        <div className="card mb-6 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode tiket atau judul..." className="input pl-10" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}
              className="input w-auto min-w-[190px]"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-6"><div className="skeleton h-16" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Tidak ada laporan pada filter ini.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <div key={report.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  {report.photos?.[0] && <img src={report.photos[0].url} alt="" className="h-20 w-full rounded-lg object-cover lg:w-28" />}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="mono font-bold text-slate-500">{report.kodeTiket}</span>
                      <span className="text-civix-blue">{KATEGORI_LABEL[report.kategori]}</span>
                      <span className="text-slate-400">{formatDate(report.dibuatPada)}</span>
                    </div>
                    <Link to={`/reports/${report.id}`} className="font-bold text-civix-navy hover:text-civix-blue">{report.judul}</Link>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{report.deskripsi}</p>
                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{STATUS_LABEL[report.status]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.status === 'diterima' && (
                      <>
                        <button onClick={() => handleAction(report, 'verify')} disabled={actionMutation.isPending} className="btn bg-green-600 text-white hover:bg-green-700 text-xs"><CheckCircle2 size={14} /> Verifikasi</button>
                        <button onClick={() => handleAction(report, 'reject')} disabled={actionMutation.isPending} className="btn bg-red-600 text-white hover:bg-red-700 text-xs"><XCircle size={14} /> Tolak</button>
                        <button onClick={() => handleAction(report, 'duplicate')} disabled={actionMutation.isPending} className="btn-outline text-xs"><Copy size={14} /> Duplikat</button>
                      </>
                    )}
                    {report.status === 'diverifikasi' && (
                      <button onClick={() => handleAction(report, 'assign')} disabled={actionMutation.isPending} className="btn-primary text-xs"><Send size={14} /> Tugaskan</button>
                    )}
                    <Link to={`/reports/${report.id}`} className="btn-ghost text-xs">Detail</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
