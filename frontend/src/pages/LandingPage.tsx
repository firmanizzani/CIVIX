import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Activity,
  BarChart3,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Building2,
  FileText,
  TrendingUp,
  Leaf,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { MapPoint, StatsOverview, STATUS_LABEL, KATEGORI_LABEL, Report } from '@/types';
import { formatDate } from '@/lib/utils';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'diterima':
    case 'diverifikasi':
      return '#dc2626';
    case 'ditugaskan':
    case 'dikerjakan':
      return '#d97706';
    case 'selesai':
      return '#16a34a';
    default:
      return '#64748b';
  }
};

function LandingPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<StatsOverview>({
    queryKey: ['stats-overview'],
    queryFn: async () => (await apiClient.get('/stats/overview')).data,
  });

  const { data: mapPoints = [], isLoading: mapLoading } = useQuery<MapPoint[]>({
    queryKey: ['map-points-preview'],
    queryFn: async () => (await apiClient.get('/reports/map')).data,
  });

  const { data: recentReports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['recent-reports'],
    queryFn: async () => (await apiClient.get('/reports?limit=3')).data,
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero Section — Premium Green Forest */}
        <section className="gradient-forest relative overflow-hidden text-white">
          <div className="gradient-radial-glow absolute inset-0"></div>
          <div className="container-civix relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div className="animate-in-up">
              <div className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-civix-mint/30 bg-white/10 px-3 py-1.5 text-civix-mint backdrop-blur-sm">
                <Leaf size={14} strokeWidth={2.5} />
                Platform Pelaporan Publik
              </div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Masalah di sekitar,
                <br />
                <span className="text-civix-emerald">perubahan</span> yang bisa dipantau.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-civix-mint/90 sm:text-lg">
                Laporkan masalah infrastruktur dan lingkungan di Jakarta, pantau proses penanganannya, dan lihat
                perkembangan laporan secara transparan dalam satu platform.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/citizen/create-report" className="btn-accent">
                  Buat Laporan <ArrowRight size={16} />
                </Link>
                <Link
                  to="/map"
                  className="btn border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <MapPin size={16} /> Jelajahi Peta
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-civix-mint/80">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} /> Pelacakan transparan
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity size={15} /> Status real-time
                </span>
              </div>
            </div>

            <div className="animate-in-up-delay-1 relative">
              <div className="absolute -inset-6 rounded-3xl bg-civix-emerald/30 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-civix-border bg-civix-soft px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-civix-forest">Peta Laporan Jakarta</div>
                    <div className="text-xs text-civix-muted">Data laporan publik real-time</div>
                  </div>
                  <Link
                    to="/map"
                    className="flex items-center gap-1 rounded-md bg-civix-primary px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-civix-emerald"
                  >
                    Lihat peta <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="relative h-[280px] sm:h-[320px]">
                  {mapLoading ? (
                    <div className="flex h-full items-center justify-center bg-civix-soft">
                      <Loader2 className="animate-spin text-civix-primary" size={28} />
                    </div>
                  ) : mapPoints.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center bg-civix-soft px-6 text-center">
                      <MapPin size={32} className="mb-2 text-civix-muted/60" />
                      <p className="text-sm font-semibold text-civix-text">Belum ada laporan di peta</p>
                      <p className="mt-1 text-xs text-civix-muted">
                        Laporan publik akan muncul setelah diverifikasi.
                      </p>
                    </div>
                  ) : (
                    <MapContainer center={DKI_CENTER} zoom={11} scrollWheelZoom={false} className="h-full w-full">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                      />
                      {mapPoints.slice(0, 15).map((point) => {
                        const isRed = point.status === 'diterima' || point.status === 'diverifikasi';
                        const coords: [number, number] = [Number(point.latitude), Number(point.longitude)];
                        return (
                          <React.Fragment key={point.id}>
                            {isRed && (
                              <CircleMarker
                                center={coords}
                                radius={15}
                                interactive={false}
                                pathOptions={{
                                  color: '#ef4444',
                                  weight: 1.5,
                                  fillColor: '#dc2626',
                                  fillOpacity: 0.25,
                                  className: 'marker-pulse-halo',
                                }}
                              />
                            )}
                            <CircleMarker
                              center={coords}
                              radius={isRed ? 9 : 7}
                              pathOptions={{
                                color: 'white',
                                weight: 2,
                                fillColor: getStatusColor(point.status),
                                fillOpacity: 0.95,
                                className: isRed ? 'marker-pulse-red' : '',
                              }}
                            >
                              <Popup>
                                <div className="min-w-[180px]">
                                  <p className="font-semibold text-civix-forest">{point.judul}</p>
                                  {point.namaJalan && <p className="mt-1 text-xs text-slate-600">{point.namaJalan}</p>}
                                  <p className="mt-1 text-xs text-civix-muted">{KATEGORI_LABEL[point.kategori]}</p>
                                  <p className="mt-1 text-xs font-medium text-civix-primary">{STATUS_LABEL[point.status]}</p>
                                  <Link
                                    to={`/reports/${point.id}`}
                                    className="mt-2 inline-block text-xs font-semibold text-civix-primary hover:underline"
                                  >
                                    Lihat detail
                                  </Link>
                                </div>
                              </Popup>
                            </CircleMarker>
                          </React.Fragment>
                        );
                      })}
                    </MapContainer>
                  )}
                  <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-civix-border bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                    <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-civix-text">
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-red" /> Baru
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-amber" /> Diproses
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-green" /> Selesai
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-civix-border border-t border-civix-border bg-white">
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-extrabold text-civix-forest">
                      {statsLoading ? '—' : stats?.totalLaporan ?? 0}
                    </div>
                    <div className="text-[10px] font-medium text-civix-muted">Total laporan</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-extrabold text-civix-warning">
                      {statsLoading ? '—' : stats?.menunggu ?? 0}
                    </div>
                    <div className="text-[10px] font-medium text-civix-muted">Menunggu</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-extrabold text-civix-success">
                      {statsLoading ? '—' : stats?.selesai ?? 0}
                    </div>
                    <div className="text-[10px] font-medium text-civix-muted">Selesai</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-b border-civix-border bg-civix-neutral py-10">
          <div className="container-civix">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { label: 'Total Laporan', value: stats?.totalLaporan, icon: FileText, color: 'text-civix-forest' },
                { label: 'Menunggu', value: stats?.menunggu, icon: Clock, color: 'text-civix-warning' },
                {
                  label: 'Dalam Proses',
                  value: stats?.dalamProses,
                  icon: Activity,
                  color: 'text-civix-primary',
                },
                { label: 'Selesai', value: stats?.selesai, icon: CheckCircle2, color: 'text-civix-success' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${item.color}`}
                  >
                    <item.icon size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-civix-forest">
                      {statsLoading ? '—' : item.value ?? 0}
                    </div>
                    <div className="text-xs font-medium text-civix-muted">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cara Kerja — Clean Timeline */}
        <section className="border-b border-civix-border bg-white py-16 lg:py-20">
          <div className="container-civix">
            <div className="mb-12 grid gap-5 md:grid-cols-2 md:items-end">
              <div>
                <p className="eyebrow mb-3">Cara Kerja</p>
                <h2 className="section-title">
                  Dari laporan warga
                  <br />
                  menjadi aksi nyata.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-civix-muted md:justify-self-end">
                Proses yang jelas dan terukur. Setiap laporan diverifikasi, ditangani oleh instansi terkait, lalu
                dipantau bersama.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                {
                  n: '01',
                  title: 'Laporkan',
                  desc: 'Ceritakan masalah, tambahkan foto dan titik lokasi di Jakarta.',
                  icon: FileText,
                },
                {
                  n: '02',
                  title: 'Verifikasi',
                  desc: 'Admin memeriksa laporan dan memastikan informasi valid.',
                  icon: ShieldCheck,
                },
                {
                  n: '03',
                  title: 'Tindak Lanjut',
                  desc: 'Laporan diteruskan ke instansi yang bertanggung jawab.',
                  icon: Building2,
                },
                {
                  n: '04',
                  title: 'Pantau Progres',
                  desc: 'Lihat perkembangan dan bukti penyelesaian secara transparan.',
                  icon: Activity,
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="group relative rounded-xl border border-civix-border bg-civix-neutral p-6 transition-all hover:-translate-y-1 hover:border-civix-primary hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="mono text-sm font-bold text-civix-primary">{step.n}</span>
                    <step.icon size={20} className="text-civix-deep transition-colors group-hover:text-civix-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-civix-forest">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-civix-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="border-b border-civix-border bg-civix-soft py-16 lg:py-20">
          <div className="container-civix">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-3">Pantau Sekitar</p>
                <h2 className="section-title">Laporan terbaru</h2>
              </div>
              <Link to="/reports" className="btn-outline">
                Lihat semua <ArrowRight size={16} />
              </Link>
            </div>
            {reportsLoading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-64" />
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-civix-border bg-white py-16 text-center">
                <AlertTriangle className="mx-auto mb-3 text-civix-muted/50" size={32} />
                <p className="font-semibold text-civix-text">Belum ada laporan publik</p>
                <p className="mt-1 text-sm text-civix-muted">Laporan yang terverifikasi akan tampil di sini.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="group overflow-hidden rounded-xl border border-civix-border bg-white transition-all hover:-translate-y-1 hover:border-civix-primary hover:shadow-lg"
                  >
                    {report.photos?.[0] ? (
                      <img src={report.photos[0].url} alt={report.judul} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-civix-soft text-civix-muted/50">
                        <MapPin size={36} />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-civix-primary">
                          {KATEGORI_LABEL[report.kategori]}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-civix-muted">
                          <span
                            className={`status-dot ${
                              report.status === 'selesai'
                                ? 'status-green'
                                : report.status === 'dikerjakan' || report.status === 'ditugaskan'
                                  ? 'status-amber'
                                  : 'status-red'
                            }`}
                          />
                          {STATUS_LABEL[report.status]}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-bold text-civix-forest transition-colors group-hover:text-civix-primary">
                        {report.judul}
                      </h3>
                      <p className="mt-2 text-xs text-civix-muted">{formatDate(report.dibuatPada)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Transparansi & Tracking Preview */}
        <section className="border-b border-civix-border bg-white py-16 lg:py-20">
          <div className="container-civix">
            <div className="grid overflow-hidden rounded-2xl border border-civix-border shadow-xl md:grid-cols-2" style={{background: 'linear-gradient(135deg, #0f4d2a 0%, #156637 50%, #16a34a 100%)'}}>
              <div className="p-8 text-white md:p-12">
                <p className="eyebrow mb-4 text-emerald-300">Transparansi Publik</p>
                <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                  Setiap laporan punya cerita.
                  <br />
                  Ikuti sampai tuntas.
                </h2>
                <p className="mt-4 leading-relaxed text-emerald-100/90">
                  Gunakan kode tiket untuk melihat timeline, catatan tindak lanjut, dan bukti penyelesaian laporan.
                </p>
                <Link to="/track" className="btn-accent mt-6">
                  Lacak laporan <ArrowRight size={16} />
                </Link>
              </div>
              <div className="flex items-center justify-center bg-civix-deep/50 p-8 md:p-12">
                <div className="w-full max-w-sm rounded-xl border border-civix-border bg-white p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-civix-muted">Lacak dengan kode tiket</p>
                      <p className="mono mt-1 text-lg font-bold text-civix-forest">LPR-2026-XXXXX</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-civix-soft text-civix-primary">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Laporan diterima', done: true },
                      { label: 'Diverifikasi admin', done: true },
                      { label: 'Ditugaskan ke instansi', done: true },
                      { label: 'Perbaikan berlangsung', done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            step.done ? 'bg-civix-mint text-civix-success' : 'bg-civix-soft text-civix-muted'
                          }`}
                        >
                          {step.done ? <CheckCircle2 size={13} strokeWidth={2.5} /> : <Clock size={13} />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${step.done ? 'text-civix-text' : 'text-civix-muted'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-civix-muted">
                            {step.done ? 'Status tercatat di timeline' : 'Menunggu pembaruan'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 border-t border-civix-border pt-4 text-xs text-civix-muted">
                    Pratinjau ilustrasi alur pelacakan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistik Insight CTA */}
        <section className="border-b border-civix-border bg-civix-neutral py-14">
          <div className="container-civix">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-civix-primary to-civix-emerald p-3 text-white shadow-sm">
                <BarChart3 size={24} strokeWidth={2.2} />
              </div>
              <h2 className="section-title">Data yang membuka wawasan.</h2>
              <p className="mt-4 leading-relaxed text-civix-muted">
                Lihat tren kategori, perbandingan wilayah, dan kinerja penanganan berbasis laporan yang tercatat di
                CIVIX.
              </p>
              <Link to="/stats" className="btn-primary mt-6">
                Jelajahi statistik <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA — Gradient Forest */}
        <section className="gradient-cta py-16 lg:py-20">
          <div className="container-civix">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Mulai dari satu laporan. Bantu wujudkan perubahan.
                </h2>
                <p className="mt-3 leading-relaxed text-emerald-100/90">
                  Laporkan masalah di sekitarmu dan pantau proses penanganannya bersama masyarakat Jakarta.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/citizen/create-report"
                  className="btn bg-white text-civix-forest shadow-md hover:bg-civix-mint"
                >
                  Buat laporan <ArrowRight size={16} />
                </Link>
                <Link
                  to="/map"
                  className="btn border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  Jelajahi peta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
