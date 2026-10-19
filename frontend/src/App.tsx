import { Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PublicReportsPage from '@/pages/PublicReportsPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import MapPage from '@/pages/MapPage';
import TrackPage from '@/pages/TrackPage';
import StatsPage from '@/pages/StatsPage';
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CreateReportPage from '@/pages/citizen/CreateReportPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AgencyDashboard from '@/pages/agency/AgencyDashboard';
import AgencyAssignmentsPage from '@/pages/agency/AgencyAssignmentsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reports" element={<PublicReportsPage />} />
      <Route path="/reports/:id" element={<ReportDetailPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/track" element={<TrackPage />} />
      <Route path="/stats" element={<StatsPage />} />

      <Route element={<ProtectedRoute allowedRoles={['warga']} />}>
        <Route path="/citizen" element={<CitizenDashboard />} />
        <Route path="/citizen/create-report" element={<CreateReportPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['instansi', 'admin']} />}>
        <Route path="/agency" element={<AgencyDashboard />} />
        <Route path="/agency/assignments" element={<AgencyAssignmentsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
