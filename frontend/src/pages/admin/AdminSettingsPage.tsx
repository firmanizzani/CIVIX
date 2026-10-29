import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Info, Save } from 'lucide-react';
import apiClient from '@/lib/api';
import QueryError from '@/components/QueryError';
import { getActionError } from '@/hooks/useReportWorkspace';
import { useAuthStore } from '@/stores/authStore';

export default function AdminSettingsPage() {
  const client = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [tab, setTab] = useState<'general' | 'account'>('general');
  const [days, setDays] = useState<number | null>(null);
  const settings = useQuery<{ completedMapDays: number }>({ queryKey: ['admin-settings'], queryFn: async () => (await apiClient.get('/admin/settings')).data });
  const save = useMutation({ mutationFn: async () => (await apiClient.patch('/admin/settings', { completedMapDays: days ?? settings.data?.completedMapDays })).data,
    onSuccess: async data => { client.setQueryData(['admin-settings'], data); setDays(null); await client.invalidateQueries({ predicate: query => ['map-settings', 'map-points-full', 'map-points-preview', 'admin-map'].includes(String(query.queryKey[0])) }); } });
  const value = days ?? settings.data?.completedMapDays ?? 7;
  const disabled = !settings.data || save.isPending || days === null || !Number.isInteger(value) || value < 1 || value > 90;
  return <>
    <header className="admin-page-header"><div><h1>Pengaturan</h1><p>Kelola konfigurasi platform dan informasi akun administrator.</p></div>{tab === 'general' && <button className="btn-primary" type="submit" form="admin-platform-settings" disabled={disabled}><Save size={16} />{save.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}</button>}</header>
    <div className="agency-settings-grid admin-platform-settings"><nav aria-label="Bagian pengaturan admin"><button aria-pressed={tab === 'general'} onClick={() => setTab('general')}>Visibilitas Laporan</button><button aria-pressed={tab === 'account'} onClick={() => setTab('account')}>Akun Administrator</button></nav><section className="admin-panel">
      {tab === 'general' ? settings.isError ? <QueryError subject="Pengaturan platform" retry={settings.refetch} pending={settings.isFetching} /> : <form id="admin-platform-settings" onSubmit={event => { event.preventDefault(); if (!disabled) save.mutate(); }}>
        <h2>Durasi Tampilan Laporan Selesai</h2><p className="admin-settings-description">Atur berapa lama laporan yang telah selesai ditampilkan di peta publik.</p>
        <label className="label mt-6" htmlFor="completed-map-days">Durasi setelah laporan selesai</label><div className="admin-setting-input"><input id="completed-map-days" className="input" type="number" min={1} max={90} step={1} required disabled={settings.isLoading || save.isPending} value={Number.isNaN(value) ? '' : value} onChange={event => { setDays(event.target.valueAsNumber); save.reset(); }} /><span>hari</span></div>
        <div className="admin-setting-note"><Info size={17} /><p>Laporan selesai disembunyikan dari peta publik setelah durasi ini. Riwayat dan detail laporan tetap tersedia. Durasi yang diperbolehkan: 1–90 hari.</p></div>
        {save.isError && <p role="alert" className="workspace-error">{getActionError(save.error)}</p>}{save.isSuccess && <p role="status" className="workspace-success"><CheckCircle2 size={16} />Pengaturan tersimpan dan diterapkan ke peta publik.</p>}
      </form> : <div className="admin-account-info"><h2>Akun Administrator</h2><dl><div><dt>Nama</dt><dd>{user?.nama}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Peran</dt><dd>Administrator</dd></div></dl></div>}
    </section></div>
  </>;
}
