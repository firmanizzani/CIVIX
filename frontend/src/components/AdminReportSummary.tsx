import { Link } from 'react-router-dom';
import { FileText, Hourglass, Settings, Check, X } from 'lucide-react';
import { getAdminReportMetrics } from '@/lib/adminReportMetrics';
import { Report } from '@/types';

const icons = { total: FileText, pending: Hourglass, processing: Settings, completed: Check, closed: X };

export default function AdminReportSummary({ reports, days, loading }: { reports: Report[]; days: number; loading: boolean }) {
  const metrics = getAdminReportMetrics(reports, days);
  return <div className="admin-report-summary" aria-label="Ringkasan laporan admin">{metrics.values.map(metric => {
    const Icon = icons[metric.key];
    const params = new URLSearchParams(); if (metric.status) params.set('status', metric.status);
    if (metrics.dateFrom && metrics.dateTo) { params.set('dateFrom', metrics.dateFrom); params.set('dateTo', metrics.dateTo); }
    return <Link key={metric.key} to={'/admin/reports?' + params.toString()} className="admin-metric-card" data-icon={metric.key}><span className="admin-metric-icon"><Icon size={25} strokeWidth={2} /></span><div className="admin-metric-value"><span>{metric.label}</span><strong>{loading ? '—' : metric.value.toLocaleString('id-ID')}</strong></div></Link>;
  })}</div>;
}
