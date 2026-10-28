import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />;
  if (!allowedRoles.includes(user.peran)) return <Navigate to="/" replace />;

  return <Outlet />;
}
