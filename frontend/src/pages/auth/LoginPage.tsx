import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

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
      setError('');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-civix-navy">Masuk ke CIVIX</h1>
            <p className="mt-2 text-slate-600">Lapor masalah infrastruktur di Jakarta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm">
            <span className="text-slate-600">Belum punya akun? </span>
            <Link to="/register" className="font-semibold text-civix-blue hover:underline">
              Daftar di sini
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-civix-border bg-civix-soft p-4 text-sm text-civix-text">
            <p className="mb-3 font-bold text-civix-forest">Akun demo untuk mencoba</p>
            <div className="space-y-2 text-xs">
              <button type="button" onClick={() => { setEmail('warga@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="font-semibold text-civix-forest">Warga</span><span className="ml-2 text-civix-muted">warga@demo.com</span></span>
                <span className="text-civix-primary">Isi</span>
              </button>
              <button type="button" onClick={() => { setEmail('admin@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="font-semibold text-civix-forest">Admin</span><span className="ml-2 text-civix-muted">admin@demo.com</span></span>
                <span className="text-civix-primary">Isi</span>
              </button>
              <button type="button" onClick={() => { setEmail('instansi@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="block font-semibold text-civix-forest">Dinas Bina Marga Provinsi DKI Jakarta</span><span className="text-civix-muted">instansi@demo.com</span></span>
                <span className="shrink-0 text-civix-primary">Isi</span>
              </button>
              <button type="button" onClick={() => { setEmail('air@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="block font-semibold text-civix-forest">Dinas Sumber Daya Air Provinsi DKI Jakarta</span><span className="text-civix-muted">air@demo.com</span></span>
                <span className="shrink-0 text-civix-primary">Isi</span>
              </button>
              <button type="button" onClick={() => { setEmail('lingkungan@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="block font-semibold text-civix-forest">Dinas Lingkungan Hidup Provinsi DKI Jakarta</span><span className="text-civix-muted">lingkungan@demo.com</span></span>
                <span className="shrink-0 text-civix-primary">Isi</span>
              </button>
              <button type="button" onClick={() => { setEmail('penerangan@demo.com'); setPassword('demo1234'); }} className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left transition hover:bg-civix-mint">
                <span><span className="block font-semibold text-civix-forest">Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta</span><span className="text-civix-muted">penerangan@demo.com</span></span>
                <span className="shrink-0 text-civix-primary">Isi</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-civix-muted">Kata sandi semua akun: <span className="font-semibold">demo1234</span></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
