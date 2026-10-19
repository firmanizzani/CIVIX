import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.peran)) return <Navigate to="/" replace />;

  return <Outlet />;
}
