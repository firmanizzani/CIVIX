import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Activity,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Building2,
  FileText,
  Leaf,
  Droplets,
  Lightbulb,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '@/stores/authStore';
import QueryError from '@/components/QueryError';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import AnimatedCounter from '@/components/AnimatedCounter';
import apiClient from '@/lib/api';
import { MapPoint, StatsOverview, STATUS_LABEL, KATEGORI_LABEL, Report } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';

const DKI_CENTER: [number, number] = [-6.2088, 106.8456];

function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: stats, isLoading: statsLoading } = useQuery<StatsOverview>({
    queryKey: ['stats-overview'],
    queryFn: async () => (await apiClient.get('/stats/overview')).data,
  });

  const { data: mapPoints = [], isLoading: mapLoading, isError: mapError, refetch: retryMap, isFetching: mapFetching } = useQuery<MapPoint[]>({
    queryKey: ['map-points-preview'],
    queryFn: async () => (await apiClient.get('/reports/map')).data,
  });

  const { data: recentReports = [], isLoading: reportsLoading, isError: reportsError, refetch: retryReports, isFetching: reportsFetching } = useQuery<Report[]>({
    queryKey: ['recent-reports'],
    queryFn: async () => (await apiClient.get('/reports?limit=3')).data,
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero Section — Premium Green Forest */}
        <section className="gradient-forest relative flex overflow-hidden text-white" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="gradient-radial-glow absolute inset-0"></div>
          <div className="container-civix relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-0">
            <div className="animate-in-up">
              <div className="eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-civix-mint/30 bg-white/10 px-3 py-1.5 text-civix-mint backdrop-blur-sm">
                <Leaf size={14} strokeWidth={2.5} />
                Platform Pelaporan Publik
              </div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Masalah di sekitar,
                <br />
                <span className="text-lime-300">perubahan</span> yang bisa dipantau.
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
              {!user && <p className="mt-3 text-sm text-civix-mint">Masuk diperlukan untuk mengirim laporan. Anda akan kembali ke formulir setelah masuk.</p>}
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

                <div className="relative h-[260px] sm:h-[300px] lg:h-[330px] xl:h-[350px]">
                  {mapLoading ? (
                    <div className="flex h-full items-center justify-center bg-civix-soft">
                      <Loader2 className="animate-spin text-civix-primary" size={28} />
                    </div>
                  ) : mapError ? (
                    <div className="flex h-full items-center justify-center p-4"><QueryError subject="Peta laporan" retry={retryMap} pending={mapFetching} /></div>
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
                        const isRed = point.status === 'diterima';
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
                                    className="mt-2 inline-block !text-xs font-semibold !text-civix-primary hover:underline"
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
                  <div hidden={mapError || mapLoading} className="absolute bottom-3 left-3 right-3 z-10 rounded-lg border border-civix-border bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-civix-text">
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-red" /> Menunggu Verifikasi
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-orange" /> Terverifikasi
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-amber" /> Dalam Proses
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="status-dot status-green" /> Selesai
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-4 border-t border-civix-border bg-civix-soft" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <Reveal>
          <section className="border-y border-slate-200 bg-slate-50 py-10">
          <div className="container-civix">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Ringkasan Aktivitas</span>
              <Link to="/stats" className="inline-flex items-center gap-1.5 rounded-full border border-lime-300 bg-white px-3 py-1.5 text-xs font-semibold text-civix-forest transition-colors hover:bg-lime-50">
                Lihat statistik lengkap <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Laporan', value: stats?.totalLaporan, icon: FileText, iconColor: 'text-slate-800', iconBg: 'bg-slate-100', valueColor: 'text-slate-900', border: 'border-slate-200' },
                { label: 'Menunggu', value: stats?.menunggu, icon: Clock, iconColor: 'text-amber-700', iconBg: 'bg-amber-100', valueColor: 'text-amber-700', border: 'border-amber-200' },
                { label: 'Dalam Proses', value: stats?.dalamProses, icon: Activity, iconColor: 'text-sky-700', iconBg: 'bg-sky-100', valueColor: 'text-sky-800', border: 'border-sky-200' },
                { label: 'Selesai', value: stats?.selesai, icon: CheckCircle2, iconColor: 'text-emerald-700', iconBg: 'bg-emerald-100', valueColor: 'text-emerald-800', border: 'border-emerald-200' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm ${item.border}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                    <item.icon size={21} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className={`text-2xl font-extrabold ${item.valueColor}`}>
                      {statsLoading ? '—' : <AnimatedCounter value={item.value ?? 0} />}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-600">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </Reveal>

        {/* Cara Kerja — Clean Timeline */}
        <Reveal delay="default">
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
                  className="group relative rounded-xl border border-lime-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-lime-500 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="mono text-sm font-extrabold text-lime-700">{step.n}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-600 to-lime-400 text-white shadow-sm transition-transform group-hover:scale-110">
                      <step.icon size={20} />
                    </div>
                  </div>
                  <h3 className="mb-2 text-base font-bold text-civix-forest">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-civix-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        </Reveal>

        {/* Kategori Laporan */}
        <Reveal delay="default">
        <section className="border-b border-civix-border bg-white py-16 lg:py-20">
          <div className="container-civix">
            <div className="mb-12 text-center">
              <p className="eyebrow mb-3">Apa yang Bisa Anda Laporkan?</p>
              <h2 className="section-title">Masalah kecil, dampak besar.</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-civix-muted">
                Laporkan kondisi fasilitas dan lingkungan di sekitar Anda agar dapat ditindaklanjuti instansi terkait.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MapPin,
                  title: 'Jalan & Trotoar',
                  desc: 'Jalan rusak, berlubang, trotoar pecah atau tidak rata.',
                  kategori: 'jalan_rusak',
                  color: 'text-red-600',
                  bgColor: 'bg-red-50',
                  hoverBorder: 'hover:border-red-500',
                },
                {
                  icon: Leaf,
                  title: 'Sampah & Kebersihan',
                  desc: 'Tumpukan sampah, tempat sampah penuh, area kotor.',
                  kategori: 'sampah',
                  color: 'text-lime-600',
                  bgColor: 'bg-lime-50',
                  hoverBorder: 'hover:border-lime-500',
                },
                {
                  icon: Lightbulb,
                  title: 'Lampu Jalan',
                  desc: 'Lampu mati, redup, atau rusak di area publik.',
                  kategori: 'penerangan',
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-50',
                  hoverBorder: 'hover:border-amber-500',
                },
                {
                  icon: Droplets,
                  title: 'Drainase & Banjir',
                  desc: 'Saluran tersumbat, genangan air, risiko banjir.',
                  kategori: 'drainase',
                  color: 'text-cyan-600',
                  bgColor: 'bg-cyan-50',
                  hoverBorder: 'hover:border-cyan-500',
                },
                {
                  icon: Building2,
                  title: 'Fasilitas Umum',
                  desc: 'Taman, halte, jembatan penyeberangan yang rusak.',
                  kategori: 'fasilitas_umum',
                  color: 'text-lime-700',
                  bgColor: 'bg-lime-50',
                  hoverBorder: 'hover:border-lime-600',
                },
                {
                  icon: FileText,
                  title: 'Lainnya',
                  desc: 'Masalah infrastruktur atau lingkungan lainnya.',
                  kategori: 'lainnya',
                  color: 'text-slate-600',
                  bgColor: 'bg-slate-50',
                  hoverBorder: 'hover:border-slate-500',
                },
              ].map((item) => (
                <Link
                  key={item.kategori}
                  to={`/citizen/create-report?kategori=${item.kategori}`}
                  className={`group flex flex-col gap-4 rounded-xl border-2 border-civix-border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${item.hoverBorder}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor} ${item.color} transition-transform group-hover:scale-110`}>
                    <item.icon size={24} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-civix-forest">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-civix-muted">{item.desc}</p>
                  </div>
                  <div className={`mt-auto flex items-center gap-1.5 text-sm font-semibold ${item.color} opacity-0 transition-opacity group-hover:opacity-100`}>
                    Laporkan sekarang <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/citizen/create-report" className="btn-accent">
                Buat laporan sekarang <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        </Reveal>

        {/* Recent Reports */}
        <Reveal delay="delay-1">
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
            ) : reportsError ? (
              <QueryError subject="Laporan terbaru" retry={retryReports} pending={reportsFetching} />
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
                            className="status-dot" style={{ backgroundColor: getStatusColor(report.status) }}
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
        </Reveal>

        {/* FAQ Section */}
        <Reveal delay="default">
        <section className="border-b border-civix-border bg-white py-16 lg:py-20">
          <div className="container-civix">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="eyebrow mb-3 inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-50 px-3 py-1 text-civix-forest">
                <HelpCircle size={14} />
                Pertanyaan Umum
              </div>
              <h2 className="section-title">Hal yang sering ditanyakan</h2>
              <p className="mt-3 text-sm leading-relaxed text-civix-muted sm:text-base">
                Informasi seputar cara kerja CIVIX, keamanan data pelapor, dan tindak lanjut laporan Anda.
              </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-3">
              {[
                {
                  question: 'Bagaimana cara membuat laporan di CIVIX?',
                  answer:
                    'Masuk atau daftar sebagai warga, klik tombol "Buat Laporan", tentukan titik lokasi masalah pada peta atau isi alamat, unggah foto bukti, tulis deskripsi kejadian, lalu kirim laporan.',
                },
                {
                  question: 'Apakah saya bisa melapor secara anonim?',
                  answer:
                    'Bisa. Saat mengisi formulir laporan, aktifkan opsi "Kirim sebagai anonim". Identitas nama Anda tidak akan ditampilkan kepada publik pada daftar laporan umum maupun peta.',
                },
                {
                  question: 'Berapa lama laporan saya akan diproses?',
                  answer:
                    'Setiap laporan masuk akan diverifikasi admin terlebih dahulu maksimal 1x24 jam kerja. Setelah status terverifikasi, laporan ditugaskan langsung ke instansi terkait untuk dijadwalkan dan ditindaklanjuti di lapangan.',
                },
                {
                  question: 'Bagaimana cara memantau progres laporan yang sudah dikirim?',
                  answer:
                    'Masuk ke akun Anda dan buka Dashboard Warga. Pada bagian "Laporan Saya", Anda bisa melihat seluruh riwayat tiket yang Anda buat lengkap dengan status penanganannya dari diterima hingga selesai.',
                },
                {
                  question: 'Kategori apa saja yang dapat dilaporkan?',
                  answer:
                    'Anda dapat melaporkan jalan & trotoar rusak, tumpukan sampah, saluran air/drainase tersumbat, penerangan jalan mati, serta fasilitas umum yang membutuhkan perbaikan di wilayah DKI Jakarta.',
                },
                {
                  question: 'Apakah ada biaya untuk menggunakan layanan CIVIX?',
                  answer:
                    'CIVIX dapat digunakan 100% gratis oleh seluruh masyarakat tanpa pungutan biaya apa pun.',
                },
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-lime-200 bg-white transition hover:border-lime-300 shadow-sm"
                  >
                    <button
                      type="button"
                      id={`faq-question-${index}`} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span className="text-base font-bold text-civix-forest sm:text-lg">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-civix-primary transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {(
                      <div hidden={!isOpen} id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} className="border-t border-lime-100 bg-lime-50/50 px-5 py-4 text-sm leading-relaxed text-slate-700 sm:px-6">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </Reveal>

        {/* Final CTA — Gradient Forest */}
        <Reveal delay="default">
        <section className="gradient-cta py-16 lg:py-20">
          <div className="container-civix">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Mulai dari satu laporan. Bantu wujudkan perubahan.
                </h2>
                <p className="mt-3 leading-relaxed text-lime-100/90">
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
                  Jelajahi Peta
                </Link>
              </div>
            </div>
          </div>
        </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
