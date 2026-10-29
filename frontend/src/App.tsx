import { Routes, Route } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import PublicReportsPage from '@/pages/PublicReportsPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import MapPage from '@/pages/MapPage';
import StatsPage from '@/pages/StatsPage';
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CreateReportPage from '@/pages/citizen/CreateReportPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminPeoplePage from '@/pages/admin/AdminPeoplePage';
import AdminLayout from '@/components/AdminLayout';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AgencyDashboard from '@/pages/agency/AgencyDashboard';
import AgencyAssignmentsPage from '@/pages/agency/AgencyAssignmentsPage';
import AgencyMapPage from '@/pages/agency/AgencyMapPage';
import AgencyPeoplePage from '@/pages/agency/AgencyPeoplePage';
import AgencySettingsPage from '@/pages/agency/AgencySettingsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
      <Route path="/reports" element={<PageTransition><PublicReportsPage /></PageTransition>} />
      <Route path="/reports/:id" element={<PageTransition><ReportDetailPage /></PageTransition>} />
      <Route path="/map" element={<PageTransition><MapPage /></PageTransition>} />
      <Route path="/stats" element={<PageTransition><StatsPage /></PageTransition>} />

      <Route element={<ProtectedRoute allowedRoles={['warga']} />}>
        <Route path="/citizen" element={<CitizenDashboard />} />
        <Route path="/citizen/create-report" element={<CreateReportPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verification" element={<AdminReportsPage verification />} />
          <Route path="tasks" element={<AdminReportsPage tasks />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="map" element={<AgencyMapPage admin />} />
          <Route path="stats" element={<AdminDashboard statistics />} />
          <Route path="agencies" element={<AdminPeoplePage agenciesOnly />} />
          <Route path="people" element={<AdminPeoplePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['instansi', 'admin']} />}>
        <Route path="/agency" element={<AdminLayout agency />}>
          <Route index element={<AgencyDashboard />} />
          <Route path="assignments" element={<AgencyAssignmentsPage />} />
          <Route path="reports" element={<AgencyAssignmentsPage all />} />
          <Route path="map" element={<AgencyMapPage />} />
          <Route path="stats" element={<AgencyDashboard statistics />} />
          <Route path="people" element={<AgencyPeoplePage />} />
          <Route path="settings" element={<AgencySettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
