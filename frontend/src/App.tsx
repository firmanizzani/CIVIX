import { Routes, Route } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
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
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
      <Route path="/reports" element={<PageTransition><PublicReportsPage /></PageTransition>} />
      <Route path="/reports/:id" element={<PageTransition><ReportDetailPage /></PageTransition>} />
      <Route path="/map" element={<PageTransition><MapPage /></PageTransition>} />
      <Route path="/track" element={<PageTransition><TrackPage /></PageTransition>} />
      <Route path="/stats" element={<PageTransition><StatsPage /></PageTransition>} />

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
