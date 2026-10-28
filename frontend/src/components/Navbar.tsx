import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X } from 'lucide-react';
import AnimatedCollapse from '@/components/AnimatedCollapse';
import CivixLogo from '@/components/CivixLogo';
import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!mobileOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [mobileOpen]);
  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/map', label: 'Peta' },
    { to: '/reports', label: 'Laporan' },
    { to: '/stats', label: 'Statistik' },
  ];

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.peran === 'warga') return { to: '/citizen', label: 'Dashboard' };
    if (user.peran === 'admin') return { to: '/admin', label: 'Admin' };
    if (user.peran === 'instansi') return { to: '/agency', label: 'Instansi' };
  };

  const dashLink = getDashboardLink();

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-50 border-b border-civix-border bg-white/95 backdrop-blur-sm">
      <div className="container-civix">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl text-civix-forest transition-colors hover:text-civix-primary">
            <CivixLogo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                end={link.to === "/"}
                key={link.to}
                to={link.to}
                className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-civix-soft hover:text-civix-deep ${isActive ? "bg-civix-soft text-civix-deep font-bold underline underline-offset-4" : "text-civix-muted"}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {dashLink && (
                  <Link to={dashLink.to} className="btn-ghost text-xs">
                    {dashLink.label}
                  </Link>
                )}
                <button onClick={logout} className="btn-outline text-xs">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-xs">
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary text-xs">
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-civix-muted hover:bg-civix-soft hover:text-civix-deep md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            ref={menuButton} type="button" aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            <span className="menu-toggle-icon" data-open={mobileOpen} aria-hidden="true"><Menu size={20} className="menu-icon-bars" /><X size={20} className="menu-icon-close" /></span>
          </button>
        </div>

        {(
          <div className="md:hidden">
          <AnimatedCollapse open={mobileOpen} id="mobile-navigation">
          <div className="border-t border-civix-border py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  end={link.to === "/"}
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-civix-soft hover:text-civix-deep ${isActive ? "bg-civix-soft text-civix-deep font-bold underline underline-offset-4" : "text-civix-muted"}`}
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-civix-border"></div>
              {user ? (
                <>
                  {dashLink && (
                    <Link
                      to={dashLink.to}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-civix-deep hover:bg-civix-soft"
                    >
                      {dashLink.label}
                    </Link>
                  )}
                  <button onClick={logout} className="btn-outline w-full text-sm">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-ghost w-full text-sm">
                    Masuk
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-sm">
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
          </AnimatedCollapse>
          </div>
        )}
      </div>
    </nav>
  );
}
