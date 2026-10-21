import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AgencyDashboard as AgencyDashboardType, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Building2, ClipboardList, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AgencyDashboard() {
  const { data, isLoading } = useQuery<AgencyDashboardType>({
    queryKey: ['agency-dashboard'],
    queryFn: async () => (await apiClient.get('/agency/dashboard')).data,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="container-civix flex-1 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-civix-navy p-3 text-white"><Building2 size={24} /></div>
            <div>
              <h1 className="text-3xl font-extrabold text-civix-navy">Dashboard Instansi</h1>
              <p className="mt-1 text-slate-600">{data?.agency?.nama || 'Kelola tugas penanganan laporan CIVIX.'}</p>
            </div>
          </div>
          <Link to="/agency/assignments" className="btn-primary">Lihat Semua Tugas <ArrowRight size={16} /></Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Menunggu Ditangani', value: data?.ditugaskan ?? 0, icon: ClipboardList, color: 'text-amber-700 bg-amber-100' },
            { label: 'Sedang Dikerjakan', value: data?.dikerjakan ?? 0, icon: AlertCircle, color: 'text-orange-700 bg-orange-100' },
            { label: 'Selesai', value: data?.selesai ?? 0, icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}><stat.icon size={20} /></div>
              <div className="text-2xl font-extrabold text-civix-navy">{isLoading ? '—' : stat.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-civix-navy">Tugas Terbaru</h2>
            <Link to="/agency/assignments" className="text-sm font-semibold text-civix-blue hover:underline">Lihat semua</Link>
          </div>
          {!data?.recent.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">Belum ada tugas aktif.</div>
          ) : (
            <div className="space-y-3">
              {data.recent.map((task) => (
                <Link key={task.id} to="/agency/assignments" className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-civix-blue">
                  <div>
                    <span className="mono text-xs text-slate-400">{task.kodeTiket}</span>
                    <h3 className="font-bold text-civix-navy">{task.judul}</h3>
                    <p className="mt-1 text-xs text-slate-500">{KATEGORI_LABEL[task.kategori]} · {formatDate(task.dibuatPada)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClasses(task.status)}`}>{STATUS_LABEL[task.status]}</span>
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
