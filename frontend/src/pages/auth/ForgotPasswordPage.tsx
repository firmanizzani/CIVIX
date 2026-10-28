import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout>
        <div className="w-full max-w-md">
          <div className="auth-card">
            {!submitted ? (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-civix-soft text-civix-primary ring-8 ring-civix-mint/30">
                    <KeyRound size={26} />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-civix-forest">Lupa Kata Sandi</h1>
                  <p className="mt-1 text-sm text-civix-muted">
                    Masukkan email akunmu, kami kirim instruksi reset kata sandi.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <button type="submit" className="btn-primary w-full py-2.5 text-sm font-semibold">
                    Kirim Instruksi Reset
                  </button>
                </form>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-civix-soft ring-8 ring-civix-mint/30">
                  <CheckCircle2 size={30} className="text-civix-primary" />
                </div>
                <h2 className="text-xl font-bold text-civix-forest">Cek Email Kamu</h2>
                <p className="mt-2 text-sm text-civix-muted">
                  Instruksi reset kata sandi telah dikirim ke{' '}
                  <span className="font-semibold text-civix-forest">{email}</span>.
                </p>
                <p className="mt-1 text-xs text-civix-muted">Cek folder spam jika tidak muncul.</p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  className="mt-5 text-xs font-medium text-civix-muted transition hover:text-civix-primary hover:underline"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-civix-border/70 pt-5 text-center text-xs">
              <Link to={`/login${redirectQuery}`} className="inline-flex items-center gap-1.5 font-semibold text-civix-primary transition hover:underline">
                <ArrowLeft size={13} /> Kembali ke halaman masuk
              </Link>
            </div>
          </div>
        </div>
    </AuthLayout>
  );
}
