import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.peran;
      navigate(role === 'admin' ? '/admin' : role === 'instansi' ? '/agency' : '/citizen');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan cek kembali email dan password.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Utama */}
          <div className="rounded-2xl border border-civix-border bg-white p-6 shadow-xl shadow-civix-forest/5 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-civix-soft text-civix-primary ring-8 ring-civix-mint/30">
                <ShieldCheck size={26} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-civix-forest">Masuk ke CIVIX</h1>
              <p className="mt-1 text-sm text-civix-muted">Lapor & pantau masalah infrastruktur di Jakarta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label">Alamat Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civix-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Kata Sandi</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civix-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-civix-muted transition hover:text-civix-forest"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 text-sm font-semibold">
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    Masuk Sekarang <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-civix-border/70 pt-5 text-center text-xs">
              <span className="text-civix-muted">Belum punya akun? </span>
              <Link to="/register" className="font-semibold text-civix-primary transition hover:underline">
                Daftar akun warga
              </Link>
            </div>
          </div>

          {/* Quick Demo Accounts Card */}
          <div className="mt-5 rounded-2xl border border-civix-border bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-civix-muted">Akun demo cepat</p>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('warga@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span>
                  <span className="font-semibold text-civix-forest">Warga</span>
                  <span className="ml-2 text-civix-muted">warga@demo.com</span>
                </span>
                <span className="text-xs font-medium text-civix-primary">Isi</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span>
                  <span className="font-semibold text-civix-forest">Admin</span>
                  <span className="ml-2 text-civix-muted">admin@demo.com</span>
                </span>
                <span className="text-xs font-medium text-civix-primary">Isi</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('instansi@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span className="truncate">
                  <span className="block truncate font-semibold text-civix-forest">Dinas Bina Marga DKI</span>
                  <span className="text-civix-muted">instansi@demo.com</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-civix-primary">Isi</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('air@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span className="truncate">
                  <span className="block truncate font-semibold text-civix-forest">Dinas Sumber Daya Air DKI</span>
                  <span className="text-civix-muted">air@demo.com</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-civix-primary">Isi</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('lingkungan@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span className="truncate">
                  <span className="block truncate font-semibold text-civix-forest">Dinas Lingkungan Hidup DKI</span>
                  <span className="text-civix-muted">lingkungan@demo.com</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-civix-primary">Isi</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('penerangan@demo.com'); setPassword('demo1234'); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-civix-neutral px-3 py-2 text-left transition hover:border-civix-mint hover:bg-civix-soft"
              >
                <span className="truncate">
                  <span className="block truncate font-semibold text-civix-forest">UPT Penerangan Jalan Umum DKI</span>
                  <span className="text-civix-muted">penerangan@demo.com</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-civix-primary">Isi</span>
              </button>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-civix-muted">
              Sandi demo: <span className="font-semibold text-civix-forest">demo1234</span>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
