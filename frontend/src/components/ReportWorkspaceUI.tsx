import { ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, HardHat, MapPin, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Report, ReportWorkspace, STATUS_LABEL, StatusLaporan, KATEGORI_LABEL } from '@/types';
import { getStatusBadgeClasses } from '@/lib/utils';

export const reportCover = (report: Report) => report.photos?.find((photo) => photo.jenis === 'awal')?.url || report.photos?.[0]?.url;
export const lastUpdate = (report: Report) => report.statusLogs?.[0]?.waktu || report.dibuatPada;
export function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 1 ? 'Baru saja' : minutes < 60 ? `${minutes} menit lalu` : minutes < 1440 ? `${Math.floor(minutes / 60)} jam lalu` : `${Math.floor(minutes / 1440)} hari lalu`;
}
export function StatusBadge({ status }: { status: StatusLaporan }) {
  const Icon = { diterima: Clock, diverifikasi: ShieldCheck, ditugaskan: Send, dikerjakan: HardHat, selesai: CheckCircle2, ditolak: XCircle, duplikat: Copy }[status];
  return <span className={`workspace-badge ${getStatusBadgeClasses(status)}`}><Icon size={12} aria-hidden="true" />{STATUS_LABEL[status]}</span>;
}
export function DashboardStats({ items, loading }: { items: { label: string; value: number; icon?: LucideIcon; tone?: 'neutral' | 'amber' | 'blue' | 'green' | 'red'; onClick?: () => void }[]; loading?: boolean }) {
  return <div className="dashboard-stats" data-count={items.length}>{items.map((item) => {
    const content = <>{item.icon && <span className="dashboard-stat-icon" data-tone={item.tone || 'neutral'}><item.icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>}<span className="dashboard-stat-copy"><span className="dashboard-stat-label">{item.label}</span><strong className="dashboard-stat-value">{loading ? '—' : item.value.toLocaleString('id-ID')}</strong></span></>;
    return item.onClick ? <button type="button" key={item.label} onClick={item.onClick}>{content}</button> : <div key={item.label}>{content}</div>;
  })}</div>;
}
export function FilterTabs({ tabs, value, onChange }: { tabs: { value: string; label: string; count: number }[]; value: string; onChange: (value: string) => void }) {
  return <div className="workspace-tabs" role="group" aria-label="Filter status laporan">{tabs.map((tab) => <button key={tab.value} type="button" aria-pressed={value === tab.value} onClick={() => onChange(tab.value)}>{tab.label}<span>{tab.count}</span></button>)}</div>;
}
export function WorkspacePagination({ data, onPage }: { data?: ReportWorkspace; onPage: (page: number) => void }) {
  if (!data) return null;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return <div className="workspace-pagination"><p>{data.total ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)}` : '0'} dari {data.total} laporan</p>{pages > 1 && <div><button type="button" disabled={data.page <= 1} aria-label="Halaman sebelumnya" onClick={() => onPage(data.page - 1)}><ChevronLeft size={16} /></button><span>{data.page} / {pages}</span><button type="button" disabled={data.page >= pages} aria-label="Halaman berikutnya" onClick={() => onPage(data.page + 1)}><ChevronRight size={16} /></button></div>}</div>;
}
const steps: { status: StatusLaporan; label: string }[] = [
  { status: 'diterima', label: 'Diterima' }, { status: 'diverifikasi', label: 'Diverifikasi' },
  { status: 'ditugaskan', label: 'Ditugaskan' }, { status: 'dikerjakan', label: 'Dikerjakan' }, { status: 'selesai', label: 'Selesai' },
];
export function ReportProgress({ status }: { status: StatusLaporan }) {
  const current = steps.findIndex((step) => step.status === status);
  if (current < 0) return <p className="workspace-muted">Lihat alasan {status === 'ditolak' ? 'penolakan' : 'penandaan duplikat'} pada detail laporan.</p>;
  return <ol className="report-progress" aria-label="Progres penanganan laporan">{steps.map((step, index) => <li key={step.status} data-complete={index < current} aria-current={index === current ? 'step' : undefined}><span>{index < current ? <Check size={12} aria-hidden="true" /> : index + 1}</span><small>{step.label}</small></li>)}</ol>;
}
export function DetailPreview({ report }: { report: Report }) {
  const cover = reportCover(report);
  return <><div className="workspace-detail-title"><div><p className="workspace-ticket">{report.kodeTiket}</p><h2>{report.judul}</h2></div><StatusBadge status={report.status} /></div>
    {cover ? <img className="workspace-cover" src={cover} alt={report.judul} /> : <div className="workspace-cover workspace-no-photo"><MapPin size={28} /><span>Belum ada foto laporan</span></div>}
    <p className="workspace-location"><MapPin size={16} aria-hidden="true" />{report.namaJalan || report.region?.nama || 'Alamat belum dicantumkan'}</p>
    <p className="workspace-category">{KATEGORI_LABEL[report.kategori]}</p><p className="workspace-description">{report.deskripsi}</p>
    {report.assignedAgency && <p className="workspace-muted">Ditangani oleh <strong>{report.assignedAgency.nama}</strong></p>}
  </>;
}
export function WorkspaceRefresh({ refreshing, onClick }: { refreshing: boolean; onClick: () => void }) {
  return <button className="workspace-refresh" type="button" onClick={onClick} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />{refreshing ? 'Memperbarui…' : 'Perbarui'}</button>;
}
export function DetailBack({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="workspace-back"><ArrowLeft size={16} /> Kembali ke daftar</button>;
}
