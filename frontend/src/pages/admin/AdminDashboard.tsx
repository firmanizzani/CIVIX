import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AdminDashboard as AdminDashboardType } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { Shield, FileText, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

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
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-civix-navy">Dashboard Admin</h1>
              <p className="text-slate-600">Selamat datang, {user?.nama}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Laporan', value: stats?.total ?? 0, icon: FileText, color: 'text-civix-navy bg-slate-100' },
            { label: 'Menunggu Verifikasi', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-700 bg-amber-100', link: '/admin/reports?status=diterima' },
            { label: 'Terverifikasi', value: stats?.verified ?? 0, icon: CheckCircle2, color: 'text-blue-700 bg-blue-100' },
            { label: 'Sedang Dikerjakan', value: stats?.inProgress ?? 0, icon: AlertCircle, color: 'text-orange-700 bg-orange-100' },
            { label: 'Selesai', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
          ].map((stat, i) => {
            const Content = (
              <div className="card p-5">
                <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className="text-2xl font-extrabold text-civix-navy">{isLoading ? '—' : stat.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
              </div>
            );
            return stat.link ? (
              <Link key={i} to={stat.link} className="transition hover:-translate-y-0.5">
                {Content}
              </Link>
            ) : (
              <div key={i}>{Content}</div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Link to="/admin/reports?status=diterima" className="card group p-6 transition hover:border-civix-blue hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-civix-navy">Antrean Verifikasi</h2>
              <Clock className="text-amber-600" size={22} />
            </div>
            <p className="text-sm text-slate-600">Terdapat {stats?.pending ?? 0} laporan baru yang menunggu untuk diverifikasi.</p>
            <div className="mt-4 text-sm font-semibold text-civix-blue group-hover:underline">
              Lihat & Verifikasi →
            </div>
          </Link>

          <Link to="/admin/reports" className="card group p-6 transition hover:border-civix-blue hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-civix-navy">Kelola Semua Laporan</h2>
              <FileText className="text-civix-blue" size={22} />
            </div>
            <p className="text-sm text-slate-600">Filter, cari, dan kelola seluruh laporan dari warga.</p>
            <div className="mt-4 text-sm font-semibold text-civix-blue group-hover:underline">
              Buka Dashboard Laporan →
            </div>
          </Link>

          <Link to="/stats" className="card group p-6 transition hover:border-civix-blue hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-civix-navy">Statistik & Insight</h2>
              <TrendingUp className="text-green-600" size={22} />
            </div>
            <p className="text-sm text-slate-600">Lihat tren, sebaran kategori, perbandingan wilayah, dan insight otomatis.</p>
            <div className="mt-4 text-sm font-semibold text-civix-blue group-hover:underline">
              Lihat Statistik →
            </div>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
