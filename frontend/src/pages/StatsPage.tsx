import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import apiClient from '@/lib/api';
import { StatsOverview, TrendRow, RegionStat, CategoryStat, KATEGORI_LABEL } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileText, CheckCircle2, Timer, Clock, Lightbulb, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

const CATEGORY_COLORS = ['#dc2626', '#d97706', '#4d7c0f', '#0ea5e9', '#65a30d', '#64748b'];

export default function StatsPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery<StatsOverview>({
    queryKey: ['stats-overview-full'],
    queryFn: async () => (await apiClient.get('/stats/overview')).data,
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery<TrendRow[]>({
    queryKey: ['stats-trend'],
    queryFn: async () => (await apiClient.get('/stats/trend')).data,
  });

  const { data: regions = [], isLoading: regionsLoading } = useQuery<RegionStat[]>({
    queryKey: ['stats-regions'],
    queryFn: async () => (await apiClient.get('/stats/regions')).data,
  });

  const { data: categoryData, isLoading: catLoading } = useQuery<CategoryStat>({
    queryKey: ['stats-category'],
    queryFn: async () => (await apiClient.get('/stats/category')).data,
  });

  const isEmpty = !overviewLoading && (overview?.totalLaporan ?? 0) === 0;

  // Agregasi tren per bulan untuk grafik bertumpuk sederhana
  const trendMap = new Map<string, Record<string, number | string>>();
  for (const row of trend) {
    const key = row.periode;
    if (!trendMap.has(key)) {
      // format "YYYY-MM" → label bulan-tahun Indonesia (mis. "Okt 2026")
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      trendMap.set(key, { periode: label });
    }
    const entry = trendMap.get(key)!;
    entry[row.kategori] = (entry[row.kategori] as number) || 0;
    entry[row.kategori] = (entry[row.kategori] as number) + Number(row.jumlah);
  }
  const trendChartData = Array.from(trendMap.values());

  const regionsWithData = regions.filter((r) => Number(r.total) > 0);
  const fastestRegion = [...regionsWithData]
    .filter((r) => r.rataRataHari !== null)
    .sort((a, b) => Number(a.rataRataHari) - Number(b.rataRataHari))[0];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <Reveal>
          <div className="mb-10">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-civix-orange">Data-driven insight</p>
            <h1 className="text-3xl font-extrabold text-civix-navy sm:text-4xl">Statistik Penanganan Laporan</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Ringkasan kinerja penanganan laporan warga di DKI Jakarta, dihitung langsung dari data CIVIX.
            </p>
          </div>
        </Reveal>

        {isEmpty && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Belum ada data laporan</p>
              <p>Statistik akan terisi otomatis setelah ada laporan yang masuk. Nilai nol ditampilkan agar tetap jelas.</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <Reveal delay="delay-1">
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Laporan', value: overview?.totalLaporan ?? 0, suffix: '', icon: FileText, color: 'text-civix-navy bg-slate-100' },
            { label: 'Persentase Selesai', value: overview?.persentaseSelesai ?? 0, suffix: '%', icon: CheckCircle2, color: 'text-lime-700 bg-lime-100' },
            { label: 'Rata-rata Penyelesaian', value: overview?.rataRataHariSelesai ?? '—', suffix: overview?.rataRataHariSelesai != null ? ' hari' : '', icon: Timer, color: 'text-cyan-700 bg-cyan-100' },
            { label: 'Laporan Menunggu', value: overview?.menunggu ?? 0, suffix: '', icon: Clock, color: 'text-amber-700 bg-amber-100' },
          ].map((card, i) => (
            <div key={i} className="card p-5">
              <div className={`mb-4 inline-flex rounded-lg p-2.5 ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div className="text-2xl font-extrabold text-civix-navy">
                {overviewLoading ? '—' : card.value}{card.suffix}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">{card.label}</div>
            </div>
          ))}
          </div>
        </Reveal>

        <Reveal delay="delay-1">
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Trend chart */}
          <div className="card min-w-0 p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-civix-navy flex items-center gap-2"><TrendingUp size={18} /> Tren Laporan per Bulan</h2>
                <p className="mt-1 text-xs text-slate-500">6 bulan terakhir, dipisah per kategori</p>
              </div>
            </div>
            {trendLoading ? (
              <div className="skeleton h-72" />
            ) : trendChartData.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-sm text-slate-500">
                <TrendingUp size={28} className="mb-2 text-slate-300" />
                Belum ada tren laporan.
              </div>
            ) : (
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendChartData}
                    layout="horizontal"
                    margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                    barCategoryGap="24%"
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis type="category" dataKey="periode" tick={{ fontSize: 11 }} />
                    <YAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {Object.entries(KATEGORI_LABEL).map(([key, label], i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={label}
                        fill={CATEGORY_COLORS[i]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category pie */}
          <div className="card min-w-0 p-6">
            <h2 className="font-bold text-civix-navy">Sebaran Kategori</h2>
            <p className="mt-1 text-xs text-slate-500">Laporan aktif (tanpa ditolak/duplikat)</p>
            {catLoading ? (
              <div className="skeleton mt-4 h-56" />
            ) : !categoryData?.rows.length ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500">Belum ada data.</div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData.rows} dataKey="jumlah" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {categoryData.rows.map((_, index) => (
                          <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {categoryData.rows.slice(0, 4).map((row, i) => (
                    <div key={row.kategori} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        {row.label}
                      </span>
                      <span className="font-semibold text-slate-700">{row.jumlah}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        </Reveal>

        {/* Insight */}
        <Reveal delay="delay-2">
          <div className="mb-8 rounded-2xl border border-civix-border bg-civix-soft/80 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-civix-mint p-2.5 text-civix-primary ring-1 ring-civix-border">
              <Lightbulb size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-civix-forest">Insight Otomatis</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {catLoading ? 'Menganalisis data...' : categoryData?.insight}
              </p>
              {fastestRegion && (
                <p className="mt-1.5 text-sm text-slate-700">
                  Wilayah tercepat menyelesaikan laporan: <strong className="text-civix-forest">{fastestRegion.wilayah}</strong> dengan rata-rata{' '}
                  <strong className="text-civix-forest">{fastestRegion.rataRataHari} hari</strong>.
                </p>
              )}
            </div>
          </div>
          </div>
        </Reveal>

        {/* Region comparison */}
        <Reveal delay="delay-2">
          <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <h2 className="font-bold text-civix-navy flex items-center gap-2"><Trophy size={18} /> Perbandingan Wilayah</h2>
            <p className="mt-1 text-xs text-slate-500">Diurutkan berdasarkan jumlah laporan</p>
          </div>
          {regionsLoading ? (
            <div className="skeleton h-64 m-6" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3 font-semibold">Wilayah</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Selesai</th>
                    <th className="px-4 py-3 text-right font-semibold">Belum Tertangani</th>
                    <th className="px-6 py-3 text-right font-semibold">Rata-rata (hari)</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region.regionId} className="border-b border-slate-50 last:border-none">
                      <td className="px-6 py-3 font-medium text-slate-800">{region.wilayah}</td>
                      <td className="px-4 py-3 text-right">{Number(region.total)}</td>
                      <td className="px-4 py-3 text-right text-lime-700">{Number(region.selesai)}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{Number(region.belumTertangani)}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{region.rataRataHari ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </Reveal>
      </div>

      <Footer />
    </div>
  );
}
