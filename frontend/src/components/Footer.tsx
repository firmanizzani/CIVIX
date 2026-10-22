import { Link } from 'react-router-dom';
import CivixLogo from '@/components/CivixLogo';

export default function Footer() {
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
                <Link to="/track" className="transition-colors hover:text-civix-primary">
                  Lacak Tiket
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-civix-forest">Fitur</h4>
            <ul className="space-y-2.5 text-sm text-civix-muted">
              <li>
                <Link to="/citizen/create-report" className="transition-colors hover:text-civix-primary">
                  Buat Laporan
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
            <h4 className="mb-4 text-sm font-bold text-civix-forest">Informasi</h4>
            <p className="text-sm leading-relaxed text-civix-muted">
              CIVIX adalah platform demonstrasi untuk Lomba Web In Action 2026. Data yang ditampilkan merupakan data
              demo untuk keperluan presentasi.
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
