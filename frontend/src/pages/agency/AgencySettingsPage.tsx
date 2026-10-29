import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import QueryError from '@/components/QueryError';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api';
import { getActionError } from '@/hooks/useReportWorkspace';
import { AgencyProfile, useAgencyProfile } from './agencyData';

function ProfileForm({ profile }: { profile: AgencyProfile }) {
  const [nama, setNama] = useState(profile.nama);
  const [deskripsi, setDeskripsi] = useState(profile.deskripsi || '');
  const [saved, setSaved] = useState(false);
  const cache = useQueryClient();
  const fetchUser = useAuthStore(state => state.fetchUser);
  const mutation = useMutation({ mutationFn: async () => (await apiClient.patch('/agency/profile', { nama, deskripsi })).data,
    onSuccess: async () => { setSaved(true); await Promise.all([cache.invalidateQueries({ queryKey: ['agency-profile'] }), cache.invalidateQueries({ queryKey: ['admin-agencies'] }), cache.invalidateQueries({ queryKey: ['workspace'] }), cache.invalidateQueries({ queryKey: ['report-detail'] }), fetchUser()]); } });
  return <form className="agency-profile-form" onSubmit={(event: FormEvent) => { event.preventDefault(); mutation.mutate(); }}><h2>Informasi Instansi</h2><label htmlFor="agency-name">Nama instansi</label><input id="agency-name" className="input" required minLength={2} maxLength={150} disabled={mutation.isPending} value={nama} onChange={event => { setNama(event.target.value); setSaved(false); }} /><label htmlFor="agency-description">Deskripsi tugas</label><textarea id="agency-description" className="input" maxLength={2000} rows={5} disabled={mutation.isPending} value={deskripsi} onChange={event => { setDeskripsi(event.target.value); setSaved(false); }} /><p>Profil ini digunakan pada penugasan dan informasi penanganan laporan CIVIX.</p>{mutation.isError && <p role="alert" className="workspace-error">{getActionError(mutation.error)}</p>}{saved && <p role="status" className="workspace-success">Profil instansi tersimpan dan sudah disinkronkan.</p>}<div className="admin-settings-save"><button className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}</button></div></form>;
}

export default function AgencySettingsPage() {
  const query = useAgencyProfile();
  const user = useAuthStore(state => state.user);
  const [tab, setTab] = useState('profile');
  return <><header className="admin-page-header"><div><h1>Pengaturan</h1><p>Kelola informasi instansi dan akun yang sedang digunakan.</p></div></header><div className="agency-settings-grid"><nav aria-label="Bagian pengaturan instansi"><button aria-pressed={tab === 'profile'} onClick={() => setTab('profile')}>Profil Instansi</button><button aria-pressed={tab === 'account'} onClick={() => setTab('account')}>Akun Saya</button></nav><section className="admin-panel">{tab === 'account' ? <div className="admin-account-info"><h2>Informasi Akun</h2><dl><div><dt>Nama</dt><dd>{user?.nama}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Peran</dt><dd>Petugas instansi</dd></div><div><dt>Instansi</dt><dd>{query.data?.nama || user?.agencyNama || '—'}</dd></div></dl><p className="agency-settings-help">Perubahan kredensial akun ditangani administrator CIVIX.</p></div> : query.isError ? <QueryError subject="Profil instansi" retry={query.refetch} /> : query.isLoading ? <p className="admin-loading">Memuat profil…</p> : query.data && <ProfileForm key={query.data.id} profile={query.data} />}</section></div></>;
}
