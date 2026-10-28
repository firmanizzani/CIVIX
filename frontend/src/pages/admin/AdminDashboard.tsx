import DashboardFrame from '@/components/DashboardFrame';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';

export default function AdminDashboard() {
  return <DashboardFrame><AdminReportsPage embedded /></DashboardFrame>;
}
