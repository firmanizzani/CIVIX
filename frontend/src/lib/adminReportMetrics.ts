import type { Report } from '@/types';

type MetricReport = Pick<Report, 'status' | 'dibuatPada'>;
export const adminMetricDefinitions = [
  { key: 'total', label: 'Total Laporan', status: '' },
  { key: 'pending', label: 'Menunggu Verifikasi', status: 'diterima' },
  { key: 'processing', label: 'Dalam Penanganan', status: 'proses' },
  { key: 'completed', label: 'Selesai', status: 'selesai' },
  { key: 'closed', label: 'Ditolak / Duplikat', status: 'ditolak_duplikat' },
] as const;

export function getAdminReportMetrics<T extends MetricReport>(reports: T[], days: number, now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const end = new Date(`${today}T00:00:00+07:00`); end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - days);
  const rows = days ? reports.filter(row => new Date(row.dibuatPada) >= start && new Date(row.dibuatPada) < end) : reports;
  const matches = (row: MetricReport, status: string) => !status || (status === 'proses' ? ['ditugaskan', 'dikerjakan'].includes(row.status) : status === 'ditolak_duplikat' ? ['ditolak', 'duplikat'].includes(row.status) : row.status === status);
  const values = adminMetricDefinitions.map(metric => {
    const value = rows.filter(row => matches(row, metric.status)).length;
    return { ...metric, value };
  });
  const dateFrom = days ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(start) : null;
  return { rows, values, dateFrom, dateTo: days ? today : null };
}
