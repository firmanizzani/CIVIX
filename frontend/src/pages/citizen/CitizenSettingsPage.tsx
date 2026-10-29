import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Save, UserRound } from 'lucide-react';
import apiClient from '@/lib/api';
import { getActionError } from '@/hooks/useReportWorkspace';
import { useAuthStore } from '@/stores/authStore';
import QueryError from '@/components/QueryError';
import { CitizenProfile, useCitizenProfile } from './citizenData';

function AccountSettings({ profile }: { profile: CitizenProfile }) {
  const [nama, setNama] = useState(profile.nama);
  const [telepon, setTelepon] = useState(profile.telepon);
  const [alamat, setAlamat] = useState(profile.alamat);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const cache = useQueryClient();
  const fetchUser = useAuthStore(state => state.fetchUser);
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['citizen-profile'] }), cache.invalidateQueries({ queryKey: ['admin-users'] }), cache.invalidateQueries({ queryKey: ['admin-residents'] }), fetchUser()]); };
  const save = useMutation({ mutationFn: async () => (await apiClient.patch('/citizen/profile', { nama, telepon, alamat })).data, onSuccess: refresh });
  const avatar = useMutation({ mutationFn: async (file: File) => { const data = new FormData(); data.append('avatar', file); return (await apiClient.post('/citizen/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data; }, onSuccess: refresh });
  const dirty = nama !== profile.nama || telepon !== profile.telepon || alamat !== profile.alamat;
  const photo = (file?: File) => {
    setError(''); if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Gunakan foto JPG, PNG, atau WebP.');
    if (file.size > 2 * 1024 * 1024) return setError('Foto akun maksimal 2 MB.');
    avatar.mutate(file);
  };
  return <><header className="admin-page-header"><div><h1>Pengaturan</h1><p>Kelola informasi akun Warga Anda.</p></div><button className="btn-primary" type="submit" form="citizen-account-settings" disabled={save.isPending || !dirty || nama.trim().length < 3}><Save size={16} />{save.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}</button></header>
    <div className="agency-settings-grid admin-platform-settings warga-account-settings"><nav aria-label="Bagian pengaturan warga"><button type="button" aria-current="page" aria-pressed="true"><UserRound size={16} />Akun Warga</button></nav><section className="admin-panel"><h2>Informasi Akun</h2><p className="admin-settings-description">Informasi ini digunakan untuk akun dan pelaporan Anda di CIVIX.</p><div className="warga-account-form-grid"><form id="citizen-account-settings" className="agency-profile-form" onSubmit={event => { event.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}><fieldset disabled={save.isPending}><label htmlFor="citizen-name">Nama lengkap</label><input id="citizen-name" className="input" required minLength={3} maxLength={100} value={nama} onChange={event => { setNama(event.target.value); save.reset(); }} /><label htmlFor="citizen-email">Email akun</label><input id="citizen-email" className="input" readOnly value={profile.email} /><label htmlFor="citizen-phone">Nomor telepon</label><input id="citizen-phone" className="input" type="tel" maxLength={30} value={telepon} onChange={event => { setTelepon(event.target.value); save.reset(); }} /><label htmlFor="citizen-address">Alamat</label><textarea id="citizen-address" className="input" rows={3} maxLength={1000} value={alamat} onChange={event => { setAlamat(event.target.value); save.reset(); }} /></fieldset><p className="warga-private-note">Nomor telepon dan alamat akun tidak ditampilkan pada laporan publik. Perubahan email dan kredensial ditangani administrator CIVIX.</p>{save.isError && <p role="alert" className="workspace-error">{getActionError(save.error)}</p>}{save.isSuccess && <p role="status" className="workspace-success">Informasi akun berhasil disimpan.</p>}</form>
      <aside className="warga-account-photo"><h3>Foto Akun</h3>{profile.avatarUrl ? <img src={profile.avatarUrl} alt={'Foto akun ' + profile.nama} /> : <span className="warga-avatar-placeholder"><UserRound size={32} /></span>}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Foto akun warga" disabled={avatar.isPending} onChange={event => { photo(event.target.files?.[0]); event.target.value = ''; }} /><button className="btn-outline" disabled={avatar.isPending} onClick={() => input.current?.click()}><Camera size={14} />{avatar.isPending ? 'Mengunggah…' : 'Ubah Foto'}</button><small>JPG, PNG, WebP · Maks. 2 MB</small>{(error || avatar.isError) && <p role="alert" className="workspace-error">{error || getActionError(avatar.error)}</p>}{avatar.isSuccess && <p className="workspace-success" role="status">Foto akun diperbarui.</p>}</aside></div></section></div></>;
}
export default function CitizenSettingsPage() {
  const profile = useCitizenProfile();
  return profile.isError ? <><header className="admin-page-header"><div><h1>Pengaturan</h1><p>Kelola informasi akun Warga Anda.</p></div></header><QueryError subject="Pengaturan akun warga" retry={profile.refetch} /></> : !profile.data ? <p className="admin-loading">Memuat pengaturan akun…</p> : <AccountSettings key={profile.data.id} profile={profile.data} />;
}
