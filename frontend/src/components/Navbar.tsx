import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X, Leaf } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lime-600 via-lime-500 to-lime-400 shadow-sm ring-1 ring-lime-700/20">
              <Leaf size={18} className="text-white drop-shadow-sm" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline">CIVIX</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-civix-muted transition-colors hover:bg-civix-soft hover:text-civix-deep"
              >
                {link.label}
              </Link>
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-civix-muted hover:bg-civix-soft hover:text-civix-deep"
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
        )}
      </div>
    </nav>
  );
}
