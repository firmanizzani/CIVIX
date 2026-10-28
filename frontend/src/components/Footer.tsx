import { Link } from 'react-router-dom';
import CivixLogo from '@/components/CivixLogo';
import { Leaf, Mail } from 'lucide-react';

export default function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) return (
    <footer className="landing-footer">
      <div className="container-civix landing-footer-grid">
        <div className="landing-footer-brand"><Link to="/" aria-label="CIVIX Beranda"><CivixLogo size="sm" /></Link><p>Platform pelaporan publik untuk Jakarta yang lebih transparan, responsif, dan partisipatif.</p></div>
        <div><h2>Navigasi</h2><Link to="/">Beranda</Link><Link to="/map">Peta Laporan</Link><Link to="/reports">Laporan Publik</Link><Link to="/stats">Statistik</Link></div>
        <div><h2>Informasi</h2><a href="#cara-kerja">Cara Kerja</a><Link to="/citizen/create-report">Buat Laporan</Link><a href="mailto:civix@email.com">Hubungi Kami</a></div>
        <a className="landing-footer-contact" href="mailto:civix@email.com" aria-label="Email CIVIX"><Mail size={21} /></a>
      </div>
      <div className="container-civix landing-footer-bottom"><p>© {new Date().getFullYear()} CIVIX. Semua hak dilindungi.</p><p><Leaf size={14} /> Bersama warga untuk Jakarta yang lebih baik.</p></div>
    </footer>
  );
  return (
    <footer className="border-t border-civix-border bg-civix-neutral py-16">
      <div className="container-civix">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 text-lg text-civix-forest">
              <CivixLogo size="sm" />
            </div>
            <p className="text-sm leading-relaxed text-civix-muted">
              Platform pelaporan infrastruktur dan lingkungan DKI Jakarta. Laporkan, pantau progres, dan lihat
              penanganan secara transparan.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-civix-forest">Navigasi</h4>
            <ul className="space-y-2.5 text-sm text-civix-muted">
              <li>
                <Link to="/" className="transition-colors hover:text-civix-primary">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/map" className="transition-colors hover:text-civix-primary">
                  Peta Laporan
                </Link>
              </li>
              <li>
                <Link to="/reports" className="transition-colors hover:text-civix-primary">
                  Daftar Laporan
                </Link>
              </li>
              <li>
                <Link to="/stats" className="transition-colors hover:text-civix-primary">
                  Statistik
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-civix-forest">Layanan Warga</h4>
            <ul className="space-y-2.5 text-sm text-civix-muted">
              <li>
                <Link to="/citizen/create-report" className="transition-colors hover:text-civix-primary">
                  Buat Laporan
                </Link>
              </li>
              <li>
                <Link to="/citizen" className="transition-colors hover:text-civix-primary">
                  Dashboard Warga
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-civix-forest">Kontak</h4>
            <a
              href="mailto:civix@email.com"
              className="mb-2.5 inline-block text-sm font-semibold text-civix-primary transition-colors hover:underline"
            >
              civix@email.com
            </a>
            <p className="text-sm leading-relaxed text-civix-muted">
              Hubungi kami untuk bantuan dan masukan terkait CIVIX.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-civix-border pt-8 text-center text-sm text-civix-muted">
          © {new Date().getFullYear()} CIVIX. Platform Civic Technology untuk DKI Jakarta.
        </div>
      </div>
    </footer>
  );
}
