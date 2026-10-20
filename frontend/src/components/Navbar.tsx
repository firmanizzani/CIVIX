import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X, Leaf } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

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
    <nav className="sticky top-0 z-50 border-b border-civix-border bg-white/95 backdrop-blur-sm">
      <div className="container-civix">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold text-civix-forest transition-colors hover:text-civix-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-civix-deep to-civix-primary shadow-sm">
              <Leaf size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline">CIVIX</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive(link.to)
                    ? 'bg-civix-mint font-bold text-civix-forest shadow-inner ring-1 ring-civix-primary/30'
                    : 'text-civix-muted hover:bg-civix-soft hover:text-civix-deep active:scale-95 active:bg-civix-mint'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {dashLink && (
                  <Link
                    to={dashLink.to}
                    className={`btn-ghost text-xs ${
                      pathname.startsWith(dashLink.to)
                        ? 'bg-civix-mint font-bold text-civix-forest shadow-inner ring-1 ring-civix-primary/30'
                        : ''
                    }`}
                  >
                    {dashLink.label}
                  </Link>
                )}
                <button onClick={logout} className="btn-outline text-xs">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  aria-current={pathname === '/login' ? 'page' : undefined}
                  className={`btn-ghost text-xs ${
                    pathname === '/login'
                      ? 'bg-civix-soft font-bold text-civix-deep shadow-inner ring-2 ring-civix-primary/40'
                      : ''
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  aria-current={pathname === '/register' ? 'page' : undefined}
                  className={`btn-primary text-xs ${
                    pathname === '/register'
                      ? 'shadow-inner ring-2 ring-civix-emerald ring-offset-1 brightness-95'
                      : ''
                  }`}
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-civix-muted hover:bg-civix-soft hover:text-civix-deep md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-civix-border py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-civix-mint font-bold text-civix-forest shadow-inner ring-1 ring-civix-primary/30'
                      : 'text-civix-muted hover:bg-civix-soft hover:text-civix-deep'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-civix-border"></div>
              {user ? (
                <>
                  {dashLink && (
                    <Link
                      to={dashLink.to}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                        pathname.startsWith(dashLink.to)
                          ? 'bg-civix-mint text-civix-forest shadow-inner ring-1 ring-civix-primary/30'
                          : 'text-civix-deep hover:bg-civix-soft'
                      }`}
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
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`btn-ghost w-full text-sm ${
                      pathname === '/login'
                        ? 'bg-civix-soft font-bold text-civix-deep shadow-inner ring-2 ring-civix-primary/40'
                        : ''
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`btn-primary w-full text-sm ${
                      pathname === '/register'
                        ? 'shadow-inner ring-2 ring-civix-emerald ring-offset-1 brightness-95'
                        : ''
                    }`}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
