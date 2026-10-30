import { Link } from 'react-router-dom';
import CivixLogo from '@/components/CivixLogo';
import { Instagram, Leaf, Mail, MapPin } from 'lucide-react';
import './Footer.css';

// Presentation handles for the competition prototype.
const socialLinks = [
  { name: 'Instagram', handle: '@civix', url: 'https://www.instagram.com/civix/', icon: Instagram },
  { name: 'X', handle: '@civix', url: 'https://x.com/civix', icon: XIcon },
];

function XIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.5L5.5 22H2.3l8.3-9.5L2.8 2h6.4l4.5 6.9L18.9 2Zm-1.1 18h1.7L8.2 3.9H6.4L17.8 20Z" /></svg>;
}

export default function Footer({ compact = true }: { compact?: boolean }) {
  if (compact) return (
    <footer className="civix-footer">
      <div className="container-civix civix-footer-grid">
        <div className="civix-footer-brand"><Link to="/" aria-label="CIVIX Beranda"><CivixLogo size="md" /></Link><p>Platform pelaporan publik untuk Jakarta yang lebih transparan, responsif, dan partisipatif.</p><span><MapPin size={14} aria-hidden="true" />Untuk warga DKI Jakarta</span></div>
        <nav aria-label="Navigasi footer"><h2>Navigasi</h2><Link to="/">Beranda</Link><Link to="/map">Peta Laporan</Link><Link to="/reports">Laporan Publik</Link><Link to="/stats">Statistik</Link></nav>
        <nav aria-label="Informasi footer"><h2>Informasi</h2><a href="/#cara-kerja">Cara Kerja</a><Link to="/citizen/create-report">Buat Laporan</Link><Link to="/citizen/reports">Riwayat Laporan</Link></nav>
        <section className="civix-footer-contact" aria-label="Kontak CIVIX"><h2>Terhubung dengan CIVIX</h2><p>Bantuan dan masukan untuk platform CIVIX.</p><a className="civix-footer-email" href="mailto:civix@email.com"><Mail size={17} aria-hidden="true" /><span>civix@email.com</span></a><div className="civix-footer-socials" aria-label="Media sosial CIVIX">{socialLinks.map(({ name, handle, url, icon: Icon }) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name + ' ' + handle + ' (tab baru)'} title={name + ' ' + handle}><Icon size={17} /><span>{handle}</span></a>)}</div></section>
      </div>
      <div className="container-civix"><div className="civix-footer-bottom"><p>© {new Date().getFullYear()} CIVIX. Semua hak dilindungi.</p><p><Leaf size={15} aria-hidden="true" />Bersama warga untuk Jakarta yang lebih baik.</p></div></div>
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
