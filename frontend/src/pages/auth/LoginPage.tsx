import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, X, FlaskConical } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
                <div className="mt-1.5 text-right">
                  <Link to="/forgot-password" className="text-xs font-medium text-civix-muted transition hover:text-civix-primary hover:underline">
                    Lupa kata sandi?
                  </Link>
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

          {/* Quick Demo Accounts Trigger */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-civix-border bg-white/80 px-4 py-2.5 text-sm font-semibold text-civix-forest shadow-sm backdrop-blur-sm transition hover:border-civix-mint hover:bg-civix-soft"
            >
              <FlaskConical size={15} className="text-civix-primary" />
              Lihat Akun Demo
            </button>
          </div>
        </div>
      </div>

      {showDemo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-civix-forest/50 p-4 backdrop-blur-sm"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-civix-border bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-civix-forest">
                <FlaskConical size={18} className="text-civix-primary" />
                Akun Demo
              </h3>
              <button
                type="button"
                onClick={() => setShowDemo(false)}
                className="rounded-lg p-1.5 text-civix-muted transition hover:bg-civix-soft hover:text-civix-forest"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-civix-muted">
              Sandi semua akun: <span className="font-semibold text-civix-forest">demo1234</span>
            </p>
            <div className="space-y-2">
              {[
                { label: 'Warga 1', email: 'warga1@demo.com' },
                { label: 'Warga 2', email: 'warga2@demo.com' },
                { label: 'Admin', email: 'admin@demo.com' },
                { label: 'Dinas Bina Marga DKI', email: 'instansi@demo.com' },
                { label: 'Dinas Sumber Daya Air DKI', email: 'air@demo.com' },
                { label: 'Dinas Lingkungan Hidup DKI', email: 'lingkungan@demo.com' },
                { label: 'UPT Penerangan Jalan Umum DKI', email: 'penerangan@demo.com' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('demo1234');
                    setShowDemo(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-civix-border bg-civix-neutral px-4 py-3 text-left transition hover:border-civix-mint hover:bg-civix-soft"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-civix-forest">{acc.label}</span>
                    <span className="block truncate text-xs text-civix-muted">{acc.email}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-civix-primary">Gunakan →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
