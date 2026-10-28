import { ReactNode } from 'react';
import { MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-page">
    <Navbar />
    <main className="container-civix auth-shell">
      <aside className="auth-story">
        <div className="auth-story-copy"><span className="brand-label"><MapPin size={14} /> Untuk warga Jakarta</span><h2>Kota yang lebih baik,<br />dimulai dari Anda.</h2><p>Sampaikan masalah di sekitar Anda dan ikuti setiap langkah penanganannya bersama CIVIX.</p><Link to="/map">Lihat kondisi di sekitar Anda <ArrowUpRight size={17} /></Link></div>
        <div className="auth-story-image" aria-hidden="true" />
        <div className="auth-story-note"><ShieldCheck size={22} /><span><strong>Proses terbuka. Progres terlihat.</strong><small>Dari laporan diterima hingga selesai ditangani.</small></span></div>
      </aside>
      <div className="auth-form-area">{children}</div>
    </main>
    <Footer />
  </div>;
}
