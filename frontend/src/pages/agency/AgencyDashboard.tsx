import DashboardFrame from '@/components/DashboardFrame';
import AgencyAssignmentsPage from '@/pages/agency/AgencyAssignmentsPage';

export default function AgencyDashboard() {
  return <DashboardFrame><AgencyAssignmentsPage embedded /></DashboardFrame>;
}
