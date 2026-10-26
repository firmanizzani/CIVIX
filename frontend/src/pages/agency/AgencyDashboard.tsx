import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AgencyDashboard as AgencyDashboardType, Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Building2, ClipboardList, AlertCircle, CheckCircle2, ArrowRight, Image as ImageIcon } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'ditugaskan', label: 'Menunggu Ditangani' },
  { key: 'dikerjakan', label: 'Sedang Dikerjakan' },
  { key: 'selesai', label: 'Selesai' },
] as const;

export default function AgencyDashboard() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data, isLoading } = useQuery<AgencyDashboardType>({
    queryKey: ['agency-dashboard'],
    queryFn: async () => (await apiClient.get('/agency/dashboard')).data,
  });

  const filteredRecent: Report[] =
    activeTab === 'all'
      ? data?.recent ?? []
      : (data?.recent ?? []).filter((t) => t.status === activeTab);

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
          <Link to="/agency/assignments" className="btn-primary text-sm">Lihat Semua Tugas <ArrowRight size={14} /></Link>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          {[
            { label: 'Menunggu Ditangani', value: data?.ditugaskan ?? 0, icon: ClipboardList, color: 'text-amber-700 bg-amber-100' },
            { label: 'Sedang Dikerjakan', value: data?.dikerjakan ?? 0, icon: AlertCircle, color: 'text-orange-700 bg-orange-100' },
            { label: 'Selesai', value: data?.selesai ?? 0, icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
          ].map((stat) => (
            <div key={stat.label} className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className={`flex rounded-xl p-3 ${stat.color}`}><stat.icon size={28} /></div>
              <div className="text-3xl font-extrabold text-civix-navy">{isLoading ? '—' : stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tugas Terbaru */}
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Header + tabs */}
          <div className="border-b border-slate-100 px-6 pt-5 pb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Tugas Terbaru</h2>
              <Link to="/agency/assignments" className="text-sm font-semibold text-civix-primary hover:underline">Lihat semua</Link>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-civix-primary bg-civix-soft text-civix-forest'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3 p-6">
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
            </div>
          ) : filteredRecent.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">Tidak ada tugas pada kategori ini.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecent.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/60 lg:flex-row lg:items-center">
                  {task.photos?.[0] ? (
                    <img src={task.photos[0].url} alt="" className="h-16 w-full rounded-lg object-cover lg:w-24 shrink-0" />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-300 lg:w-24 shrink-0">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="mono font-bold text-slate-400">{task.kodeTiket}</span>
                      <span className="text-civix-primary font-medium">{KATEGORI_LABEL[task.kategori]}</span>
                      <span className="text-slate-400">{formatDate(task.dibuatPada)}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{task.judul}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{task.deskripsi}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(task.status)}`}>
                      {STATUS_LABEL[task.status]}
                    </span>
                    <Link to="/agency/assignments" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-civix-primary hover:text-civix-primary">Tangani</Link>
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
