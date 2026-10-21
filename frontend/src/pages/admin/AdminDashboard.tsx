import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AdminDashboard as AdminDashboardType } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { UserRoundCog, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<AdminDashboardType>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await apiClient.get('/admin/dashboard')).data,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-civix-navy p-3 text-white">
              <UserRoundCog size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-civix-navy">Dashboard Admin</h1>
              <p className="text-slate-600">Selamat datang, {user?.nama}</p>
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Laporan', value: stats?.total ?? 0, icon: FileText, color: 'text-civix-navy bg-slate-100' },
            { label: 'Menunggu Verifikasi', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-700 bg-amber-100' },
            { label: 'Terverifikasi', value: stats?.verified ?? 0, icon: CheckCircle2, color: 'text-cyan-700 bg-cyan-100' },
            { label: 'Sedang Dikerjakan', value: stats?.inProgress ?? 0, icon: AlertCircle, color: 'text-orange-700 bg-orange-100' },
            { label: 'Selesai', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-extrabold text-civix-navy">{isLoading ? '—' : stat.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <AdminReportsPage embedded />
      </div>

      <Footer />
    </div>
  );
}
