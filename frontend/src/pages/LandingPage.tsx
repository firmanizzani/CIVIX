import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileText,
  Leaf,
  Droplets,
  Lightbulb,
  ChevronDown,
  HelpCircle,
  Map as MapIcon,
  ChevronRight,
  PencilLine,
  Settings,
  Search,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import LandingMap from '@/components/LandingMap';
import CivixLogo from '@/components/CivixLogo';
import './LandingPage.css';
import 'leaflet/dist/leaflet.css';
import RecentReports from '@/components/RecentReports';
import ReportMetadata from '@/components/ReportMetadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import AnimatedCollapse from '@/components/AnimatedCollapse';
import AnimatedCounter from '@/components/AnimatedCounter';
import apiClient from '@/lib/api';
import { MapPoint, StatsOverview, STATUS_LABEL, KATEGORI_LABEL, Report } from '@/types';
import { getStatusColor } from '@/lib/utils';


function LandingPage() {
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
    queryKey: ['recent-reports', 4],
    queryFn: async () => (await apiClient.get('/reports?limit=4')).data,
  });

  const previewProgress = recentReports[0]
    ? ({ diterima: 0, diverifikasi: 1, ditugaskan: 2, dikerjakan: 2, selesai: 3, ditolak: -1, duplikat: -1 }[recentReports[0].status])
    : -1;

  return (
    <div className="landing-page min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="landing-hero">
          <div className="landing-city-art" aria-hidden="true" />
          <div className="container-civix landing-hero-grid">
            <div className="landing-hero-copy animate-in-up">
              <span className="landing-kicker">Platform pelaporan publik</span>
              <h1>Masalah di sekitar,<br />perubahan yang<br />bisa dipantau.</h1>
              <p>Laporkan masalah infrastruktur dan lingkungan di Jakarta, pantau proses penanganannya, dan lihat perkembangan laporan secara transparan dalam satu platform.</p>
              <div className="landing-actions"><Link to="/citizen/create-report" className="btn landing-button">Buat Laporan <ArrowRight size={17} /></Link><Link to="/map" className="btn landing-button-outline"><MapIcon size={18} /> Jelajahi Peta</Link></div>
            </div>
            <div className="landing-product animate-in-up-delay-1">
              <div className="landing-device">
                <div className="landing-browser" data-ui>
                  <aside className="landing-browser-sidebar"><CivixLogo size="sm" /><span><MapPin size={13} /> DKI Jakarta</span><div className="landing-device-trees" aria-hidden="true" /></aside>
                  <div className="landing-browser-main">
                    <div className="landing-browser-bar"><Link to="/map" className="landing-browser-active"><MapIcon size={13} /> Peta Laporan</Link><Link to="/reports">Laporan</Link><a href="#cara-kerja">Tentang</a><Link to="/map" className="landing-browser-search" aria-label="Cari lokasi atau laporan di peta"><Search size={12} /><span>Cari lokasi atau laporan…</span></Link></div>
                    <LandingMap points={mapPoints} loading={mapLoading} error={mapError} retry={retryMap} fetching={mapFetching} />
                  </div>
                </div>
              </div>
              <div className="landing-report-float" data-ui>
                {recentReports[0] ? <><Link to={`/reports/${recentReports[0].id}`} className="landing-float-report">
                    {recentReports[0].photos?.[0] && <img src={recentReports[0].photos[0].url} alt="" />}
                    <div><span>{KATEGORI_LABEL[recentReports[0].kategori]}</span><h2>{recentReports[0].judul}</h2><ReportMetadata report={recentReports[0]} /></div>
                  </Link><p className="landing-float-status"><span style={{ background: getStatusColor(recentReports[0].status) }} />{STATUS_LABEL[recentReports[0].status]}</p>
                </> : <><span className="landing-float-label"><ShieldCheck size={17} /> Proses yang transparan</span><h2>Setiap laporan,<br />bisa Anda pantau.</h2><p className="landing-float-description">Dari laporan diterima hingga penanganan selesai.</p></>}
                <div className="landing-mini-progress" aria-label="Tahapan penanganan laporan">{['Diterima', 'Verifikasi', 'Ditangani', 'Selesai'].map((label, index) => <span key={label} data-complete={previewProgress >= index}><i />{label}</span>)}</div>
              </div>
              <Link to="/stats" className="landing-count-float" data-ui><div><strong>{statsLoading || !stats ? '—' : stats.totalLaporan.toLocaleString('id-ID')}</strong><span>Laporan publik<br />di Jakarta</span></div><ChartNoAxesColumnIncreasing size={55} strokeWidth={2.5} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section className="container-civix landing-stats-wrap" aria-label="Ringkasan aktivitas"><div className="landing-stats">
            {[
              { label: 'Laporan Publik', value: stats?.totalLaporan, icon: MapPin },
              { label: 'Kategori Masalah', value: Object.keys(KATEGORI_LABEL).length, icon: FileText },
              { label: 'Dalam Proses', value: stats?.dalamProses, icon: Building2 },
              { label: 'Laporan Selesai', value: stats?.selesai, icon: ShieldCheck },
            ].map(item => <Link to="/stats" key={item.label}><span className="landing-stat-icon"><item.icon size={24} /></span><div><strong>{item.value === undefined ? '—' : <AnimatedCounter value={item.value} />}</strong><span>{item.label}</span></div></Link>)}
        </div></section>
        <Reveal><section className="landing-map-section"><div className="container-civix landing-map-grid">
              <div className="landing-map-frame"><LandingMap interactive points={mapPoints} loading={mapLoading} error={mapError} retry={retryMap} fetching={mapFetching} />
                <div className="landing-map-legend"><strong>Status laporan</strong>{(['diterima', 'diverifikasi', 'dikerjakan', 'selesai'] as const).map(status => <span key={status}><i style={{ background: getStatusColor(status) }} />{STATUS_LABEL[status]}</span>)}</div>
                <Link to="/map" className="landing-map-caption"><MapPin size={25} /><span><strong>Lihat laporan di sekitar Anda</strong><small>Temukan dan pantau laporan dari warga lain.</small></span><ArrowRight size={17} /></Link>
              </div>
              <div className="landing-map-copy"><span className="landing-kicker">Peta laporan</span><h2>Lihat kondisi Jakarta<br />secara nyata di peta.</h2><p>Jelajahi laporan dari seluruh wilayah Jakarta, filter berdasarkan kategori, dan temukan masalah di sekitar Anda dengan mudah.</p><Link to="/map" className="btn landing-button">Buka Peta Laporan <ArrowRight size={17} /></Link></div>
        </div></section></Reveal>

        <Reveal><section className="landing-how" id="cara-kerja"><div className="landing-how-city" aria-hidden="true" /><div className="container-civix">
              <div className="landing-how-heading"><span className="landing-kicker">Cara kerja CIVIX</span><h2>Dari laporan Anda<br />hingga perubahan nyata.</h2><p>Proses yang transparan dan dapat dipantau oleh semua warga.</p></div>
              <div className="landing-steps">{[
                  { title: 'Laporkan masalah', desc: 'Sampaikan masalah di sekitar Anda dengan foto dan lokasi yang jelas.', icon: PencilLine },
                  { title: 'Laporan diverifikasi', desc: 'Laporan akan diperiksa untuk memastikan keabsahan informasi.', icon: FileText },
                  { title: 'Instansi menangani', desc: 'Laporan diteruskan ke instansi terkait untuk ditindaklanjuti.', icon: Settings },
                  { title: 'Pantau hingga selesai', desc: 'Ikuti perkembangan laporan secara real-time dalam satu platform.', icon: CheckCircle2 },
                ].map((step, index) => <div key={step.title} data-reveal-item className="landing-step"><span className="landing-step-icon"><step.icon size={27} /></span><h3>{step.title}</h3><p>{step.desc}</p>{index < 3 && <ChevronRight className="landing-step-arrow" size={23} aria-hidden="true" />}</div>)}
              </div>
        </div></section></Reveal>

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
                  data-reveal-item
                  to={`/citizen/create-report?kategori=${item.kategori}`}
                  className={`group flex flex-col gap-4 rounded-xl border-2 border-civix-border bg-white p-6 transition-[transform,box-shadow,border-color,background-color] motion-card hover:shadow-lg ${item.hoverBorder}`}
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
          <RecentReports reports={recentReports} loading={reportsLoading} error={reportsError} refreshing={reportsFetching} onRetry={retryReports} />
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
                      <AnimatedCollapse open={isOpen} id={`faq-answer-${index}`} labelledBy={`faq-question-${index}`}>
                      <div className="border-t border-lime-100 bg-lime-50/50 px-5 py-4 text-sm leading-relaxed text-slate-700 sm:px-6">
                        {faq.answer}
                      </div>
                      </AnimatedCollapse>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </Reveal>

        <section className="landing-cta"><div className="container-civix landing-cta-grid">
            <div className="landing-cta-copy"><span className="landing-kicker">Jakarta lebih baik</span><h2>Mulai dari satu laporan.<br />Bantu wujudkan perubahan.</h2><p>Suara Anda penting. Laporkan masalah di sekitar Anda<br className="hidden sm:block" /> dan pantau proses penanganannya secara transparan.</p><div className="landing-actions"><Link to="/citizen/create-report" className="btn landing-button-white">Buat Laporan Sekarang <ArrowRight size={16} /></Link><Link to="/map" className="btn landing-button-outline">Jelajahi Peta</Link></div></div>
            <div className="landing-cta-note"><span><Leaf size={29} /></span><p>Jakarta yang lebih baik<br />dimulai dari<br /><strong>kepedulian kita.</strong></p></div>
        </div></section>
      </main>

      <Footer compact />
    </div>
  );
}

export default LandingPage;
