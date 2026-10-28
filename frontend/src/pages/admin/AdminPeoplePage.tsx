import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Building2, KeyRound, Plus, Search, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageHeading from '@/components/PageHeading';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { AdminAgency, AdminDashboard, AdminResident } from '@/types';

export default function AdminPeoplePage() {
  const [section, setSection] = useState<'warga' | 'instansi'>('warga');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [agencyForm, setAgencyForm] = useState(false);
  const [accountAgency, setAccountAgency] = useState('');
  const [passwordAccount, setPasswordAccount] = useState<{ id: string; nama: string } | null>(null);
  const queryClient = useQueryClient();

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err) && typeof err.response?.data?.error === 'string') {
      return err.response.data.error;
    }
    return fallback;
  };

  const { data: residents = [], isLoading: residentsLoading } = useQuery<AdminResident[]>({
    queryKey: ['admin-residents', search],
    queryFn: async () => (await apiClient.get('/admin/residents', { params: { search } })).data,
    enabled: section === 'warga',
  });
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery<AdminAgency[]>({
    queryKey: ['admin-agencies'],
    queryFn: async () => (await apiClient.get('/admin/agencies')).data,
  });
  const { data: stats } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await apiClient.get('/admin/dashboard')).data,
  });
  const mutation = useMutation({
    mutationFn: async ({ url, data }: { url: string; data: Record<string, string> }) =>
      (await apiClient.post(url, data)).data,
    onSuccess: () => {
      setError('');
      setAgencyForm(false);
      setAccountAgency('');
      setPasswordAccount(null);
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Permintaan gagal')),
  });
  const passwordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      (await apiClient.patch(`/admin/accounts/${id}/password`, { password })).data,
    onSuccess: () => {
      setError('');
      setPasswordAccount(null);
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Gagal mengubah password')),
  });

  const handleCreateAgency = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({ url: '/admin/agencies', data: { nama: String(data.get('nama')), deskripsi: String(data.get('deskripsi') || '') } });
  };
  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({ url: `/admin/agencies/${accountAgency}/accounts`, data: { nama: String(data.get('nama')), email: String(data.get('email')), password: String(data.get('password')) } });
  };
  const handleChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    passwordMutation.mutate({ id: passwordAccount!.id, password: String(data.get('password')) });
  };

  const filteredResidents = residents.filter((resident) => `${resident.nama} ${resident.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="app-page people-page flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />
      <main className="container-civix flex-1 py-10">
        <PageHeading label="Ruang admin" title="Kelola Warga & Instansi" description="Kelola data warga dan akun instansi yang menindaklanjuti laporan di Jakarta. Password tidak pernah ditampilkan." />
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button onClick={() => { setSection('warga'); setError(''); }} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${section === 'warga' ? 'border-civix-navy text-civix-navy' : 'border-transparent text-slate-500'}`}><Users size={17} /> Warga</button>
          <button onClick={() => { setSection('instansi'); setError(''); }} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${section === 'instansi' ? 'border-civix-navy text-civix-navy' : 'border-transparent text-slate-500'}`}><Building2 size={17} /> Instansi & Akun</button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <div className="mb-2 inline-flex rounded-lg bg-sky-100 p-2 text-sky-700"><Users size={18} /></div>
            <div className="text-2xl font-extrabold text-civix-navy">{stats?.totalWarga ?? 0}</div>
            <div className="text-xs font-medium text-slate-500">Total Warga</div>
          </div>
          <div className="card p-4">
            <div className="mb-2 inline-flex rounded-lg bg-civix-mint p-2 text-civix-primary"><Building2 size={18} /></div>
            <div className="text-2xl font-extrabold text-civix-navy">{stats?.totalInstansi ?? 0}</div>
            <div className="text-xs font-medium text-slate-500">Total Instansi</div>
          </div>
        </div>

        {error && <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={17} />{error}</div>}

        {section === 'warga' ? <>
          <div className="card mb-5 p-4"><div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" placeholder="Cari nama atau email warga" /></div></div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Nama</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Terdaftar</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{residentsLoading ? <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">Memuat data warga...</td></tr> : filteredResidents.map((resident) => <tr key={resident.id}><td className="px-5 py-4 font-semibold text-slate-800">{resident.nama}</td><td className="px-5 py-4 text-slate-600">{resident.email}</td><td className="px-5 py-4 text-slate-600">{new Date(resident.dibuatPada).toLocaleDateString('id-ID')}</td></tr>)}{!residentsLoading && filteredResidents.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">Warga tidak ditemukan.</td></tr>}</tbody>
            </table></div>
          </div>
        </> : <>
          <div className="mb-6 rounded-xl border border-lime-300 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Daftar instansi</h2>
                <p className="mt-1 text-sm text-slate-600">{agencies.length} instansi terdaftar</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setAgencyForm(true)} className="inline-flex items-center gap-2 rounded-lg border border-lime-300 bg-white px-4 py-2.5 text-sm font-semibold text-civix-forest hover:bg-lime-100"><Plus size={17} /> Buat instansi</button>
                <button onClick={() => { setError(''); setAccountAgency(agencies[0]?.id || ''); }} disabled={agencies.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-civix-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-civix-deep disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> Tambah akun petugas</button>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {agenciesLoading && <div className="rounded-xl border border-lime-200 bg-white p-8 text-center text-slate-600">Memuat instansi...</div>}
            {!agenciesLoading && agencies.length === 0 && <div className="rounded-xl border border-dashed border-lime-300 bg-white p-10 text-center"><Building2 className="mx-auto mb-3 text-civix-primary" size={30} /><p className="font-semibold text-slate-800">Belum ada instansi</p><p className="mt-1 text-sm text-slate-600">Pilih “Buat instansi” untuk memulai.</p></div>}
            {agencies.map((agency) => <section className="overflow-hidden rounded-xl border border-lime-200 bg-white shadow-sm" key={agency.id}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-lime-300 bg-lime-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2.5 text-civix-forest shadow-sm"><Building2 size={20} /></div>
                  <div><h3 className="text-lg font-bold text-civix-forest">{agency.nama}</h3><p className="mt-1 text-sm text-slate-700">{agency.deskripsi || 'Deskripsi belum ditambahkan'}</p></div>
                </div>
                <span className="rounded-md border border-lime-300 bg-white px-3 py-1.5 text-sm font-semibold text-civix-forest">{agency.users?.length || 0} akun</span>
              </div>
              <div className="bg-white px-6 py-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-civix-primary">Akun petugas</h4>
                {agency.users?.length ? <div className="divide-y divide-lime-100 rounded-lg border border-lime-200">
                  {agency.users.map((account) => <div key={account.id} className="flex flex-wrap items-center justify-between gap-4 bg-white px-4 py-4"><div><p className="font-semibold text-slate-900">{account.nama}</p><p className="mt-1 text-sm text-slate-600">{account.email}</p></div><button onClick={() => { setError(''); setPasswordAccount({ id: account.id, nama: account.nama }); }} className="inline-flex items-center gap-2 rounded-lg border border-lime-300 bg-lime-50 px-3 py-2 text-sm font-semibold text-civix-forest hover:bg-lime-100"><KeyRound size={15} /> Ubah password</button></div>)}
                </div> : <div className="rounded-lg border border-dashed border-lime-300 bg-lime-50/60 px-4 py-5 text-sm text-slate-600">Belum ada akun petugas untuk instansi ini.</div>}
              </div>
            </section>)}
          </div>
        </>}

        {agencyForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={handleCreateAgency} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Buat instansi</h2><label className="block text-sm font-medium">Nama instansi<input name="nama" required maxLength={150} className="input mt-1" /></label><label className="block text-sm font-medium">Deskripsi<textarea name="deskripsi" className="input mt-1" rows={3} /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAgencyForm(false)} className="btn-outline">Batal</button><button disabled={mutation.isPending} className="btn-primary">Simpan</button></div></form></div>}

        {section === 'instansi' && accountAgency !== '' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={handleCreateAccount} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Buat akun instansi</h2><label className="block text-sm font-medium">Instansi<select value={accountAgency} onChange={(event) => setAccountAgency(event.target.value)} className="input mt-1">{agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select></label><label className="block text-sm font-medium">Nama petugas<input name="nama" required minLength={3} className="input mt-1" /></label><label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label><label className="block text-sm font-medium">Password awal<input name="password" type="password" minLength={8} required className="input mt-1" /><span className="mt-1 block text-xs text-slate-500">Minimal 8 karakter. Password tidak dapat dilihat setelah dibuat.</span></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAccountAgency('')} className="btn-outline">Batal</button><button disabled={mutation.isPending || !accountAgency} className="btn-primary">Buat akun</button></div></form></div>}

        {passwordAccount && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={handleChangePassword} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Ubah password</h2><p className="text-sm text-slate-600">Password akun {passwordAccount.nama} akan diganti. Password lama tidak dapat dilihat.</p><label className="block text-sm font-medium">Password baru<input name="password" type="password" minLength={8} required className="input mt-1" autoComplete="new-password" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setPasswordAccount(null)} className="btn-outline">Batal</button><button disabled={passwordMutation.isPending} className="btn-primary">Simpan password</button></div></form></div>}
      </main>
      <Footer />
    </div>
  );
}
