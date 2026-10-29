import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api';
import { ReportWorkspace } from '@/types';

export default function AdminTopbar() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const query = useQuery<ReportWorkspace>({ queryKey: ['admin-pending-notifications', user?.id], queryFn: async () => (await apiClient.get('/admin/reports', { params: { view: 'workspace', status: 'diterima', sort: 'newest', limit: 5 } })).data, refetchInterval: 30000 });
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, []);
  const initials = (user?.nama || 'Admin').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className="admin-utility-bar"><div className="admin-notifications" ref={box}><button type="button" aria-label="Laporan menunggu verifikasi" aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={18} />{!!query.data?.total && <i />}</button>{open && <section className="admin-notification-menu" aria-label="Daftar laporan menunggu verifikasi"><header><strong>Laporan masuk</strong><span>{query.data?.total ?? '—'} menunggu verifikasi</span></header>{query.isError ? <button onClick={() => query.refetch()}>Gagal memuat. Coba lagi</button> : query.isLoading ? <p>Memuat laporan…</p> : !query.data?.items.length ? <p>Tidak ada laporan yang menunggu verifikasi.</p> : query.data.items.map(row => <Link key={row.id} to={`/admin/verification?laporan=${encodeURIComponent(row.id)}`}><strong>{row.judul}</strong><small>{row.kodeTiket}</small></Link>)}<Link className="admin-notification-all" to="/admin/verification">Buka antrean verifikasi →</Link></section>}</div><Link className="admin-account-link" to="/admin/settings"><span>{initials}</span><strong>{user?.nama || 'Admin'}</strong><ChevronDown size={13} /></Link></div>;
}
