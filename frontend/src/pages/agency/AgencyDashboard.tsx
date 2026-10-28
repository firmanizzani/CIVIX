import { useQuery } from '@tanstack/react-query';
import AgencyAssignmentsPage from '@/pages/agency/AgencyAssignmentsPage';
import QueryError from '@/components/QueryError';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AgencyDashboard as AgencyDashboardType } from '@/types';
import { Building2, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AgencyDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AgencyDashboardType>({
    queryKey: ['agency-dashboard'],
    queryFn: async () => (await apiClient.get('/agency/dashboard')).data,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="container-civix flex-1 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-civix-forest p-3 text-white"><Building2 size={24} /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Instansi</h1>
              <p className="mt-0.5 text-sm text-slate-500">{data?.agency?.nama || 'Kelola tugas penanganan laporan.'}</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        {isError && <div className="mb-6"><QueryError subject="Ringkasan instansi" retry={refetch} pending={isFetching} /></div>}
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          {[
            { label: 'Menunggu Ditangani', value: data?.ditugaskan ?? 0, icon: ClipboardList, color: 'text-amber-700 bg-amber-100' },
            { label: 'Sedang Dikerjakan', value: data?.dikerjakan ?? 0, icon: AlertCircle, color: 'text-amber-800 bg-amber-100' },
            { label: 'Selesai', value: data?.selesai ?? 0, icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
          ].map((stat) => (
            <div key={stat.label} className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className={`flex rounded-xl p-3 ${stat.color}`}><stat.icon size={28} /></div>
              <div className="text-3xl font-extrabold text-civix-navy">{isLoading || isError ? '—' : stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <AgencyAssignmentsPage embedded />
      </div>
      <Footer />
    </div>
  );
}
