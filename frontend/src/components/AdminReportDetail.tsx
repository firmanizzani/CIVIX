import { ReactNode } from 'react';
import AgencyTaskDetail from '@/pages/agency/AgencyTaskDetail';
import { Report } from '@/types';

export default function AdminReportDetail({ report, onBack, actions, backLabel = 'Semua Laporan' }: { report: Report; onBack: () => void; actions: ReactNode; backLabel?: string }) {
  return <AgencyTaskDetail key={report.id} report={report} onBack={onBack} actions={actions} admin backLabel={backLabel} />;
}
