import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ExternalLink, LogOut, Settings } from 'lucide-react';
import { useCitizenProfile } from '@/pages/citizen/citizenData';
import { useAuthStore } from '@/stores/authStore';

export default function CitizenSidebarAccount() {
  const profile = useCitizenProfile();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, []);
  const name = profile.data?.nama || user?.nama || 'Warga';
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <div className="admin-profile citizen-sidebar-account" ref={box}>
    {open && <div className="admin-profile-menu" id="citizen-account-menu"><p>{user?.email}</p>
      <Link to="/citizen/settings"><Settings size={15} />Pengaturan</Link><Link to="/"><ExternalLink size={15} />Buka situs publik</Link><button onClick={() => { logout(); navigate('/login', { replace: true }); }}><LogOut size={15} />Keluar</button>
    </div>}
    <button type="button" className="admin-profile-button" aria-label="Menu akun warga" aria-expanded={open} aria-controls="citizen-account-menu" onClick={() => setOpen(!open)}><span className="admin-avatar">{profile.data?.avatarUrl ? <img src={profile.data.avatarUrl} alt="" /> : initials}</span><span><strong title={name}>{name}</strong><small>Warga</small></span><ChevronDown size={15} /></button>
  </div>;
}
