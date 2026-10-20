import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate } from '@/lib/utils';
import { Search, CheckCircle2, XCircle, Copy, Send, AlertCircle } from 'lucide-react';

export default function AdminReportsPage({ embedded = false }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [assignmentReportId, setAssignmentReportId] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return (await apiClient.get(`/admin/reports${params}`)).data;
    },
  });

  const { data: agencies = [] } = useQuery<{ id: string; nama: string; deskripsi: string | null }[]>({
    queryKey: ['admin-agencies'],
    queryFn: async () => (await apiClient.get('/admin/agencies')).data,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: string; data?: any }) =>
      (await apiClient.post(`/admin/reports/${id}/${action}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agency-dashboard'] });
      setActionError('');
      setAssignmentReportId(null);
      setAssignmentNote('');
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
      setAssignmentReportId(report.id);
      setSelectedAgencyId(agencies[0]?.id || '');
    } else {
      actionMutation.mutate({ id: report.id, action });
    }
  };

  const handleConfirmAssign = () => {
    if (!assignmentReportId || !selectedAgencyId) return;
    actionMutation.mutate({
      id: assignmentReportId,
      action: 'assign',
      data: { agencyId: selectedAgencyId, catatan: assignmentNote || undefined },
    });
  };

  const filteredReports = reports.filter((r) =>
    r.judul.toLowerCase().includes(search.toLowerCase()) ||
    r.kodeTiket.toLowerCase().includes(search.toLowerCase())
  );

  const reportManagement = (
    <>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-civix-navy">Kelola Laporan</h2>
            <p className="mt-1 text-slate-600">Verifikasi, tolak, tandai duplikat, atau tugaskan laporan.</p>
          </div>
          {!embedded && <Link to="/admin" className="btn-outline">Kembali ke dashboard</Link>}
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
                     {report.status === 'duplikat' && (
                       <button
                         onClick={() => {
                           if (window.confirm('Pulihkan laporan ini ke antrean verifikasi?')) handleAction(report, 'restore');
                         }}
                         disabled={actionMutation.isPending}
                         className="btn-primary text-xs"
                       >
                         <CheckCircle2 size={14} /> Pulihkan untuk Verifikasi
                       </button>
                     )}
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

      {assignmentReportId && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-civix-border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-civix-forest">Tugaskan Laporan ke Instansi</h2>
            <p className="mt-1 text-xs leading-relaxed text-civix-muted">
              Pilih unit instansi yang akan menangani laporan. Tugas hanya akan terlihat oleh akun instansi terkait.
            </p>
            <label className="label mt-4">Instansi Penerima *</label>
            <select
              value={selectedAgencyId}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
              className="input"
              disabled={agencies.length === 0}
            >
              {agencies.length === 0 && <option>Memuat instansi...</option>}
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.nama}
                </option>
              ))}
            </select>
            <label className="label mt-3">Catatan Penugasan (opsional)</label>
            <textarea
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              placeholder="Contoh: Prioritasi lokasi ramai lalu lintas"
              className="input min-h-[70px]"
            />
            <div className="mt-5 flex gap-3">
              <button onClick={() => setAssignmentReportId(null)} className="btn-outline flex-1">
                Batal
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedAgencyId || actionMutation.isPending}
                className="btn-primary flex-1"
              >
                {actionMutation.isPending ? 'Memproses...' : 'Tugaskan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return reportManagement;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="container-civix flex-1 py-12">
        {reportManagement}
      </div>
      <Footer />
    </div>
  );
}
