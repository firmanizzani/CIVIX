import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Files, Building2, Users, Settings, ChevronDown, LogOut, ExternalLink, Menu, X } from 'lucide-react';
import CivixLogo from '@/components/CivixLogo';
import { useAuthStore } from '@/stores/authStore';
import '@/pages/admin/admin.css';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/verification', label: 'Verifikasi Laporan', icon: ClipboardCheck },
  { to: '/admin/reports', label: 'Semua Laporan', icon: Files },
  { to: '/admin/agencies', label: 'Manajemen Instansi', icon: Building2 },
  { to: '/admin/people', label: 'Manajemen Pengguna', icon: Users },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profile = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileOpen(false); setProfileOpen(false); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!profile.current?.contains(event.target as Node)) setProfileOpen(false); };
    window.addEventListener('keydown', dismiss); window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', dismiss); window.removeEventListener('pointerdown', outside); };
  }, []);
  const initials = (user?.nama || 'Admin').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return <div className="admin-shell">
    <div className="admin-mobile-bar"><Link to="/admin"><CivixLogo size="sm" /></Link><button ref={toggle} type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Tutup navigasi admin' : 'Buka navigasi admin'} aria-expanded={mobileOpen} aria-controls="admin-sidebar">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
    {mobileOpen && <button className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi admin" />}
    <aside id="admin-sidebar" className="admin-sidebar" data-open={mobileOpen}>
      <Link to="/admin" className="admin-brand" aria-label="CIVIX Dashboard Admin"><CivixLogo /></Link>
      <nav aria-label="Navigasi admin">{links.map(({ to, label, icon: Icon }) => <NavLink end={to === '/admin'} key={to} to={to}><Icon size={17} strokeWidth={1.7} /><span>{label}</span></NavLink>)}</nav>
      <div className="admin-profile" ref={profile}>
        {profileOpen && <div className="admin-profile-menu" id="admin-profile-menu"><p>{user?.email}</p><Link to="/admin/settings"><Settings size={15} /> Pengaturan</Link><Link to="/"><ExternalLink size={15} /> Buka situs publik</Link><button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }}><LogOut size={15} /> Keluar</button></div>}
        <button className="admin-profile-button" type="button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-controls="admin-profile-menu"><span className="admin-avatar">{initials}</span><span><strong>{user?.nama || 'Admin'}</strong><small>Administrator</small></span><ChevronDown size={15} /></button>
      </div>
    </aside>
    <main className="admin-content"><Outlet /></main>
  </div>;
}
