import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Loader2, Eye, EyeOff, User, Mail, Lock, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    try {
      await register(nama, email, password);
      navigate('/citizen');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    }
  };

  const isPasswordLengthOk = password.length >= 8;
  const isMatchOk = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Utama */}
          <div className="rounded-2xl border border-civix-border bg-white p-6 shadow-xl shadow-civix-forest/5 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-civix-soft text-civix-primary ring-8 ring-civix-mint/30">
                <UserPlus size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-civix-forest">Daftar Akun CIVIX</h1>
              <p className="mt-1 text-sm text-civix-muted">Mulai laporkan & kawal perbaikan fasilitas publik</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="label">Nama Lengkap</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civix-muted" />
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Budi Santoso"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

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
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-civix-muted">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isPasswordLengthOk ? 'bg-civix-primary' : 'bg-slate-300'}`} />
                  <span>Minimal 8 karakter</span>
                </div>
              </div>

              <div>
                <label className="label">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-civix-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                    required
                  />
                  {isMatchOk && (
                    <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-civix-primary" />
                  )}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 text-sm font-semibold">
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    Buat Akun Sekarang <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-civix-border/70 pt-5 text-center text-xs">
              <span className="text-civix-muted">Sudah punya akun? </span>
              <Link to="/login" className="font-semibold text-civix-primary transition hover:underline">
                Masuk di sini
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
