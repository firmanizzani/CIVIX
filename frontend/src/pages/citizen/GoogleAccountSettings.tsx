import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useGoogleClientId } from '@/hooks/useGoogleClientId';
import { getActionError } from '@/hooks/useReportWorkspace';
import apiClient from '@/lib/api';

export default function GoogleAccountSettings({ userId }: { userId: string }) {
  const clientId = useGoogleClientId();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const queryKey = ['google-account-link', userId];
  const status = useQuery({
    queryKey,
    queryFn: async () => (await apiClient.get<{ linked: boolean }>('/auth/google/link', { timeout: 8000 })).data,
    enabled: !!clientId,
  });
  const link = useMutation({
    mutationFn: async (credential: string) =>
      (await apiClient.post<{ linked: boolean }>('/auth/google/link', { credential, password }, { timeout: 15000 })).data,
    onSuccess: async result => {
      setPassword('');
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, result);
    },
  });

  if (!clientId) return null;

  return <section className="mt-6 space-y-3 border-t border-civix-border pt-5">
    <h3 className="text-sm font-semibold text-civix-forest">Akun Google</h3>
    {status.isPending && <p role="status" className="text-sm text-civix-muted">Memeriksa akun Google…</p>}
    {status.isError && <p role="alert" className="text-sm text-civix-muted">
      Status akun gagal dimuat. <button type="button" className="font-semibold text-civix-primary" onClick={() => status.refetch()}>Coba lagi</button>
    </p>}
    {status.data?.linked && <p role="status" className="text-sm text-civix-muted">Akun Google tertaut. Anda bisa masuk ke CIVIX dengan Google.</p>}
    {status.data && !status.data.linked && <div className="max-w-sm space-y-3">
      <p className="text-sm text-civix-muted">Masukkan kata sandi CIVIX, lalu pilih akun Google dengan email yang sama.</p>
      <label className="label" htmlFor="citizen-google-password">Kata sandi CIVIX</label>
      <input id="citizen-google-password" className="input" type="password" autoComplete="current-password"
        value={password} disabled={link.isPending}
        onChange={event => { setPassword(event.target.value); link.reset(); }} />
      {password && <GoogleSignInButton clientId={clientId} linking onCredential={credential => {
        if (!link.isPending) link.mutate(credential);
      }} />}
      {link.isPending && <p role="status" className="text-sm text-civix-muted">Menautkan akun Google…</p>}
      {link.isError && <p role="alert" className="workspace-error">{getActionError(link.error)}</p>}
    </div>}
  </section>;
}
