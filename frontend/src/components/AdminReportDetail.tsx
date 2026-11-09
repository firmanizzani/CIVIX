import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AgencyTaskDetail from '@/pages/agency/AgencyTaskDetail';
import { Report, ReportEvidenceCheck } from '@/types';

export default function AdminReportDetail({ report, onBack, actions, backLabel = 'Semua Laporan' }: {
  report: Report & { evidenceCheck: ReportEvidenceCheck | null };
  onBack: () => void;
  actions: ReactNode;
  backLabel?: string;
}) {
  const check = report.evidenceCheck;
  const originalPhotos = report.photos?.filter(photo => photo.jenis === 'awal') ?? [];
  const evidence = <section className="admin-panel agency-task-actions">
    <h2>Pengecekan Lokasi dan Foto</h2>
    {check ? <>
      <p className="workspace-muted">Titik laporan berada di dalam batas DKI Jakarta.</p>
      <ul className="mt-3 space-y-2 text-sm">
        {check.photos.map(photo => {
          const number = originalPhotos.findIndex(original => original.id === photo.photoId) + 1;
          const label = photo.status === 'match' ? 'Lokasi foto sesuai'
            : photo.status === 'mismatch' ? 'Lokasi foto berbeda' : 'Lokasi foto tidak tersedia';
          return <li key={photo.photoId}>
            <strong>{number ? `Foto ${number}` : 'Foto bukti'}</strong> · {label}
            {photo.distanceMeters !== null && <> ({photo.distanceMeters} m dari pin)</>}
          </li>;
        })}
      </ul>
      <h3 className="mt-4 text-sm font-semibold">Laporan serupa saat dikirim</h3>
      {check.nearby.length ? <ul className="mt-2 space-y-2 text-sm">
        {check.nearby.map(candidate => <li key={candidate.id}>
          <Link className="workspace-text-link" to={'/admin/reports?laporan=' + encodeURIComponent(candidate.id)} target="_blank" rel="noopener noreferrer">{candidate.judul}</Link>
          <p className="workspace-muted">{candidate.kodeTiket} · {candidate.distanceMeters} m</p>
        </li>)}
      </ul> : <p className="workspace-muted">Tidak ditemukan laporan aktif dengan kategori sama di sekitar titik.</p>}
    </> : <p className="workspace-muted">Laporan ini dibuat sebelum pengecekan foto dan lokasi tersedia.</p>}
  </section>;

  return <AgencyTaskDetail key={report.id} report={report} onBack={onBack} actions={actions} evidence={evidence} admin backLabel={backLabel} />;
}
