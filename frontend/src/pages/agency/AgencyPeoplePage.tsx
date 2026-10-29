import { useState, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import QueryError from '@/components/QueryError';
import AdminModal from '@/components/AdminModal';
import apiClient from '@/lib/api';
import { getActionError } from '@/hooks/useReportWorkspace';
import { useAuthStore } from '@/stores/authStore';
import { useAgencyProfile } from './agencyData';

export default function AgencyPeoplePage() {
  const query = useAgencyProfile();
  const cache = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const mutation = useMutation({ mutationFn: async (body: { nama: string; email: string; password: string }) => (await apiClient.post('/agency/members', body)).data,
    onSuccess: async () => { setOpen(false); setSuccess('Akun petugas berhasil dibuat untuk instansi Anda.'); await Promise.all([cache.invalidateQueries({ queryKey: ['agency-profile'] }), cache.invalidateQueries({ queryKey: ['admin-users'] }), cache.invalidateQueries({ queryKey: ['admin-agencies'] })]); } });
  const rows = (query.data?.users || []).filter(row => `${row.nama} ${row.email}`.toLowerCase().includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pages);
  const create = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); mutation.mutate({ nama: String(form.get('nama')), email: String(form.get('email')), password: String(form.get('password')) }); };
  return <><header className="admin-page-header"><div><h1>Manajemen Pengguna</h1><p>Petugas yang dapat mengakses laporan instansi Anda.</p></div><button className="btn-primary" onClick={() => { mutation.reset(); setOpen(true); }}><Plus size={15} />Tambah Pengguna</button></header>{success && <p className="workspace-success" role="status">{success}</p>}<div className="admin-people-filters"><div className="workspace-search"><Search size={16} /><input aria-label="Cari petugas instansi" className="input" placeholder="Cari nama atau email petugas…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div><span>{rows.length} petugas</span></div>
    {query.isError ? <QueryError subject="Petugas instansi" retry={query.refetch} /> : <section className="admin-panel"><div className="admin-table-scroll"><table className="agency-people-table"><thead><tr><th>#</th><th>Nama</th><th>Email</th><th>Peran</th><th>Terdaftar</th></tr></thead><tbody>{query.isLoading ? <tr><td colSpan={5} className="admin-loading">Memuat petugas…</td></tr> : rows.length ? rows.slice((current - 1) * 10, current * 10).map((row, i) => <tr key={row.id}><td>{(current - 1) * 10 + i + 1}</td><td className="admin-title-cell">{row.nama}{row.id === user?.id && <small>Akun Anda</small>}</td><td>{row.email}</td><td><span className="admin-role-badge" data-role="instansi">Petugas</span></td><td>{new Date(row.dibuatPada).toLocaleDateString('id-ID')}</td></tr>) : <tr><td colSpan={5} className="admin-loading">Tidak ada petugas yang sesuai pencarian.</td></tr>}</tbody></table></div><div className="workspace-pagination"><p>{rows.length} petugas</p><div><button aria-label="Halaman sebelumnya" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={15} /></button><span>{current} / {pages}</span><button aria-label="Halaman berikutnya" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={15} /></button></div></div></section>}
    {open && <AdminModal title="Tambah petugas instansi" pending={mutation.isPending} onClose={() => setOpen(false)}><form className="card p-6 space-y-4" onSubmit={create}><h2 className="text-xl font-bold">Tambah petugas instansi</h2><p className="text-sm text-slate-600">Akun baru mendapat akses penanganan laporan {query.data?.nama || 'instansi Anda'}.</p>{mutation.isError && <p className="workspace-error" role="alert">{getActionError(mutation.error)}</p>}<label className="block text-sm">Nama petugas<input className="input mt-1" name="nama" required minLength={3} maxLength={100} disabled={mutation.isPending} /></label><label className="block text-sm">Email<input className="input mt-1" name="email" type="email" required maxLength={150} disabled={mutation.isPending} /></label><label className="block text-sm">Kata sandi awal<input className="input mt-1" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" disabled={mutation.isPending} /><small>Minimal 8 karakter. Tidak dapat dilihat setelah disimpan.</small></label><div className="flex justify-end gap-2"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>Batal</button><button className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Menyimpan…' : 'Tambah Pengguna'}</button></div></form></AdminModal>}
  </>;
}
