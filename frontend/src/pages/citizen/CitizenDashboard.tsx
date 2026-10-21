import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, Loader2, UserRound } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuthStore();

  const { data: myReports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['my-reports'],
    queryFn: async () => (await apiClient.get('/reports/me/reports')).data,
    enabled: !!user,
  });

  const total = myReports.length;
  const pending = myReports.filter((r) => ['diterima', 'diverifikasi'].includes(r.status)).length;
  const inProgress = myReports.filter((r) => ['ditugaskan', 'dikerjakan'].includes(r.status)).length;
  const completed = myReports.filter((r) => r.status === 'selesai').length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-civix-navy p-3 text-white">
              <UserRound size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-civix-navy">Dashboard Warga</h1>
              <p className="mt-1 text-slate-600">Selamat datang, {user?.nama}</p>
            </div>
          </div>
          <Link to="/citizen/create-report" className="btn-primary">
            <PlusCircle size={18} /> Buat Laporan Baru
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Laporan', value: total, icon: FileText, color: 'text-civix-navy bg-slate-100' },
            { label: 'Menunggu Verifikasi', value: pending, icon: Clock, color: 'text-amber-700 bg-amber-100' },
            { label: 'Sedang Dikerjakan', value: inProgress, icon: AlertCircle, color: 'text-orange-700 bg-orange-100' },
            { label: 'Selesai', value: completed, icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-extrabold text-civix-navy">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Reports List */}
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-civix-navy">Laporan Saya</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <FileText className="mx-auto mb-3 text-slate-300" size={32} />
              <p className="font-semibold text-slate-700">Belum ada laporan</p>
              <p className="mt-1 text-sm text-slate-500">Mulai laporkan masalah infrastruktur di sekitarmu</p>
              <Link to="/citizen/create-report" className="btn-primary mt-4">
                Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((report) => (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-civix-blue hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="mono text-xs font-bold text-slate-500">{report.kodeTiket}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-civix-blue">{KATEGORI_LABEL[report.kategori]}</span>
                    </div>
                    <h3 className="font-bold text-civix-navy">{report.judul}</h3>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(report.dibuatPada)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClasses(report.status)}`}>
                    {STATUS_LABEL[report.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
