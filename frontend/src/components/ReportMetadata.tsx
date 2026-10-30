import { CalendarDays, MapPin } from 'lucide-react';
import type { Report } from '@/types';

const reportDate = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
});

export default function ReportMetadata({ report }: { report: Pick<Report, 'region' | 'dibuatPada'> }) {
  return <div className="landing-report-meta">
    <p><MapPin size={13} aria-hidden="true" /><span>{report.region?.nama || 'DKI Jakarta'}</span></p>
    <time dateTime={report.dibuatPada} title="Tanggal laporan (WIB)"><CalendarDays size={13} aria-hidden="true" /><span>{reportDate.format(new Date(report.dibuatPada))}</span></time>
  </div>;
}
