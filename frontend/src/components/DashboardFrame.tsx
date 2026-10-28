import { ReactNode, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function DashboardFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  const role = pathname.startsWith('/admin') ? 'Admin' : pathname.startsWith('/agency') ? 'Instansi' : 'Warga';
  return <div className="dashboard-root"><Navbar /><main className="container-civix dashboard-main"><div className="workspace-context"><span className="brand-label">Ruang {role}</span><Link to="/map"><MapPin size={14} /> Peta Jakarta</Link></div>{children}</main></div>;
}
