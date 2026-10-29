import { Fragment, FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, KeyRound, Plus, Search } from 'lucide-react';
import QueryError from '@/components/QueryError';
import AdminModal from '@/components/AdminModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api';
import { AdminAgency, AdminUser } from '@/types';

export default function AdminPeoplePage({ agenciesOnly = false }: { agenciesOnly?: boolean }) {
  const section = agenciesOnly ? 'instansi' : 'warga';
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [expandedAgency, setExpandedAgency] = useState('');
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

  const userQuery = useQuery<AdminUser[]>({ queryKey: ['admin-users'], queryFn: async () => (await apiClient.get('/admin/users')).data, enabled: !agenciesOnly });
  const agencyQuery = useQuery<AdminAgency[]>({ queryKey: ['admin-agencies'], queryFn: async () => (await apiClient.get('/admin/agencies')).data });
  const residents = userQuery.data || [];
  const agencies = agencyQuery.data || [];
  useEffect(() => { setSearch(''); setPage(1); setError(''); setExpandedAgency(''); setAgencyForm(false); setAccountAgency(''); setPasswordAccount(null); }, [agenciesOnly]);
  useEffect(() => setPage(1), [search, role]);
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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

  const filteredResidents = residents.filter(person => (!role || person.peran === role) && `${person.nama} ${person.email} ${person.agency?.nama || ''}`.toLowerCase().includes(search.toLowerCase()));
  const filteredAgencies = agencies.filter(agency => `${agency.nama} ${agency.deskripsi || ''}`.toLowerCase().includes(search.toLowerCase()));
  const rows = agenciesOnly ? filteredAgencies : filteredResidents;
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  const roleLabel = { warga: 'Warga', instansi: 'Instansi', admin: 'Administrator' };
  return <>
    <header className="admin-page-header"><div><h1>{agenciesOnly ? 'Manajemen Instansi' : 'Manajemen Pengguna'}</h1><p>{agenciesOnly ? 'Kelola instansi yang menangani laporan di Jakarta.' : 'Kelola pengguna sistem berdasarkan peran.'}</p></div>{agenciesOnly && <div className="admin-header-actions"><button onClick={() => setAgencyForm(true)} className="btn-outline"><Plus size={15} />Tambah instansi</button><button className="btn-primary" disabled={!agencies.length} onClick={() => { setError(''); setAccountAgency(agencies[0]?.id || ''); }}><Plus size={15} />Tambah akun petugas</button></div>}</header>
    {error && <p role="alert" className="workspace-error"><AlertCircle size={16} />{error}</p>}
    <div className="admin-people-filters"><div className="workspace-search"><Search size={16} /><input aria-label={agenciesOnly ? 'Cari instansi' : 'Cari pengguna'} className="input" placeholder={agenciesOnly ? 'Cari nama instansi…' : 'Cari nama, email, atau instansi…'} value={search} onChange={event => setSearch(event.target.value)} /></div>{!agenciesOnly && <select aria-label="Filter peran pengguna" className="input" value={role} onChange={event => setRole(event.target.value)}><option value="">Semua peran</option><option value="warga">Warga</option><option value="instansi">Instansi</option><option value="admin">Administrator</option></select>}<span>{rows.length} {agenciesOnly ? 'instansi' : 'pengguna'}</span></div>
    {(agenciesOnly ? agencyQuery.isError : userQuery.isError) ? <QueryError subject={agenciesOnly ? 'Instansi' : 'Pengguna'} retry={agenciesOnly ? agencyQuery.refetch : userQuery.refetch} /> : <section className="admin-panel">
      <div className="admin-table-scroll"><table className="admin-people-table" data-kind={agenciesOnly ? "agencies" : "users"}><thead><tr><th>#</th><th>{agenciesOnly ? 'Nama Instansi' : 'Nama'}</th><th>{agenciesOnly ? 'Deskripsi' : 'Email'}</th><th>{agenciesOnly ? 'Jumlah Laporan' : 'Peran'}</th><th>{agenciesOnly ? 'Kontak' : 'Instansi'}</th><th>{agenciesOnly ? 'Akun Petugas' : 'Terdaftar'}</th><th>Aksi</th></tr></thead><tbody>
      {(agenciesOnly ? agencyQuery.isLoading : userQuery.isLoading) ? <tr><td colSpan={7} className="admin-loading">Memuat data…</td></tr> : !rows.length ? <tr><td colSpan={7} className="admin-loading">Tidak ada {agenciesOnly ? 'instansi' : 'pengguna'} yang sesuai pencarian.</td></tr> : agenciesOnly ? filteredAgencies.slice((currentPage - 1) * 10, currentPage * 10).map((agency, index) => <Fragment key={agency.id}><tr><td>{(currentPage - 1) * 10 + index + 1}</td><td className="admin-title-cell">{agency.nama}</td><td>{agency.deskripsi || '—'}</td><td className="admin-number-cell"><a href={`/admin/reports?agencyId=${encodeURIComponent(agency.id)}`}>{agency.jumlahLaporan ?? '—'}</a></td><td>{agency.users?.[0]?.email || '—'}</td><td>{agency.users?.length || 0} akun</td><td><button className="admin-text-button" aria-expanded={expandedAgency === agency.id} onClick={() => setExpandedAgency(expandedAgency === agency.id ? '' : agency.id)}>Kelola akun</button></td></tr>{expandedAgency === agency.id && <tr><td colSpan={7}><div className="admin-agency-accounts"><header><h2>Akun petugas · {agency.nama}</h2><button className="btn-outline" onClick={() => setAccountAgency(agency.id)}><Plus size={14} />Tambah akun</button></header>{agency.users?.length ? agency.users.map(account => <div key={account.id}><span><strong>{account.nama}</strong><small>{account.email}</small></span><button className="admin-text-button" onClick={() => { setError(''); setPasswordAccount({ id: account.id, nama: account.nama }); }}><KeyRound size={14} />Ubah password</button></div>) : <p>Belum ada akun petugas. Tambahkan akun untuk instansi ini.</p>}</div></td></tr>}</Fragment>) : filteredResidents.slice((currentPage - 1) * 10, currentPage * 10).map((person, index) => <tr key={person.id}><td>{(currentPage - 1) * 10 + index + 1}</td><td className="admin-title-cell">{person.nama}</td><td>{person.email}</td><td><span className="admin-role-badge" data-role={person.peran}>{roleLabel[person.peran]}</span></td><td>{person.agency?.nama || '—'}</td><td>{new Date(person.dibuatPada).toLocaleDateString('id-ID')}</td><td>{person.peran !== 'admin' ? <button className="admin-text-button" onClick={() => { setError(''); setPasswordAccount({ id: person.id, nama: person.nama }); }}><KeyRound size={14} />Ubah password</button> : <span className="admin-table-muted">Administrator</span>}</td></tr>)}
      </tbody></table></div>
      <div className="workspace-pagination"><p>Menampilkan {rows.length ? (currentPage - 1) * 10 + 1 : 0}–{Math.min(currentPage * 10, rows.length)} dari {rows.length} {agenciesOnly ? 'instansi' : 'pengguna'}</p><div><button type="button" aria-label="Halaman sebelumnya" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={15} /></button><span>{currentPage} / {pages}</span><button type="button" aria-label="Halaman berikutnya" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={15} /></button></div></div>
    </section>}
        {agencyForm && <AdminModal title="Buat instansi" pending={mutation.isPending} onClose={() => setAgencyForm(false)}><form onSubmit={handleCreateAgency} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Buat instansi</h2>{error && <p role="alert" className="workspace-error">{error}</p>}<label className="block text-sm font-medium">Nama instansi<input name="nama" required maxLength={150} className="input mt-1" /></label><label className="block text-sm font-medium">Deskripsi<textarea name="deskripsi" className="input mt-1" rows={3} /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAgencyForm(false)} className="btn-outline">Batal</button><button disabled={mutation.isPending} className="btn-primary">Simpan</button></div></form></AdminModal>}

        {section === 'instansi' && accountAgency !== '' && <AdminModal title="Buat akun instansi" pending={mutation.isPending} onClose={() => setAccountAgency('')}><form onSubmit={handleCreateAccount} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Buat akun instansi</h2>{error && <p role="alert" className="workspace-error">{error}</p>}<label className="block text-sm font-medium">Instansi<select value={accountAgency} onChange={(event) => setAccountAgency(event.target.value)} className="input mt-1">{agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.nama}</option>)}</select></label><label className="block text-sm font-medium">Nama petugas<input name="nama" required minLength={3} className="input mt-1" /></label><label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label><label className="block text-sm font-medium">Password awal<input name="password" type="password" minLength={8} required className="input mt-1" /><span className="mt-1 block text-xs text-slate-500">Minimal 8 karakter. Password tidak dapat dilihat setelah dibuat.</span></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAccountAgency('')} className="btn-outline">Batal</button><button disabled={mutation.isPending || !accountAgency} className="btn-primary">Buat akun</button></div></form></AdminModal>}

        {passwordAccount && <AdminModal title="Ubah password" pending={passwordMutation.isPending} onClose={() => setPasswordAccount(null)}><form onSubmit={handleChangePassword} className="card w-full max-w-md space-y-4 p-6"><h2 className="text-xl font-bold text-civix-navy">Ubah password</h2>{error && <p role="alert" className="workspace-error">{error}</p>}<p className="text-sm text-slate-600">Password akun {passwordAccount.nama} akan diganti. Password lama tidak dapat dilihat.</p><label className="block text-sm font-medium">Password baru<input name="password" type="password" minLength={8} required className="input mt-1" autoComplete="new-password" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setPasswordAccount(null)} className="btn-outline">Batal</button><button disabled={passwordMutation.isPending} className="btn-primary">Simpan password</button></div></form></AdminModal>}
  </>;
}
