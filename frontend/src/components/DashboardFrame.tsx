import { ReactNode, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';

export default function DashboardFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return <div className="dashboard-root"><Navbar /><main className="container-civix dashboard-main">{children}</main></div>;
}
