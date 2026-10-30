import { Link } from 'react-router-dom';
import { ArrowRight, FileText, MapPin } from 'lucide-react';
import type { Report } from '@/types';
import { KATEGORI_LABEL, STATUS_LABEL } from '@/types';
import QueryError from './QueryError';
import ReportMetadata from './ReportMetadata';
import { reportCover } from './ReportWorkspaceUI';
import { getStatusBadgeClasses } from '@/lib/utils';
import './RecentReports.css';

interface Props {
  reports: Report[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRetry: () => unknown;
}

export default function RecentReports({ reports, loading, error, refreshing, onRetry }: Props) {
  return <section className="landing-recent" aria-labelledby="recent-reports-title">
    <div className="container-civix"><div className="landing-recent-panel">
      <header className="landing-recent-header">
        <div><span className="landing-kicker">Laporan terbaru</span><h2 id="recent-reports-title">Laporan terkini dari warga Jakarta.</h2><p>Lihat laporan terbaru dan pantau perkembangan penanganannya.</p></div>
        <Link className="btn-primary landing-recent-all" to="/reports">Lihat Semua Laporan<ArrowRight size={15} /></Link>
      </header>
      {loading ? <div className="landing-recent-loading" role="status" aria-label="Memuat laporan terbaru">{[0, 1, 2, 3].map(index => <div key={index} className="landing-recent-placeholder"><div /><span /><span /><span /></div>)}</div>
        : error ? <QueryError subject="Laporan terbaru" retry={onRetry} pending={refreshing} />
          : !reports.length ? <div className="landing-recent-empty"><FileText size={28} aria-hidden="true" /><h3>Belum ada laporan publik</h3><p>Laporan terbaru dari warga akan tampil di sini.</p><Link to="/citizen/create-report" className="btn-outline">Buat Laporan</Link></div>
            : <ul className="landing-recent-grid" aria-label="Laporan terbaru dari warga">{reports.map(report => <li key={report.id}><Link className="landing-recent-card" to={'/reports/' + report.id}>
              {reportCover(report) ? <img className="landing-recent-photo" src={reportCover(report)} alt="" loading="lazy" /> : <div className="landing-recent-photo landing-recent-no-photo"><MapPin size={28} aria-hidden="true" /><span>Foto belum tersedia</span></div>}
              <div className="landing-recent-card-body"><span className="landing-recent-category">{KATEGORI_LABEL[report.kategori]}</span><h3>{report.judul}</h3><ReportMetadata report={report} /><div className="landing-recent-status"><span className={`rounded-full px-2.5 py-1 font-semibold ${getStatusBadgeClasses(report.status)}`}>{STATUS_LABEL[report.status]}</span></div></div>
            </Link></li>)}</ul>}
    </div></div>
  </section>;
}
