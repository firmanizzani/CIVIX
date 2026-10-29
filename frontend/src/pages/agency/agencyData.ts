import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Report, Region, AgencyAccount } from '@/types';

export interface AgencyOverview { items: Report[]; regions: Region[] }
export interface AgencyProfile { id: string; nama: string; deskripsi: string | null; users: AgencyAccount[] }
export function useAgencyOverview(role: 'agency' | 'admin' = 'agency') {
  const user = useAuthStore(state => state.user);
  return useQuery<AgencyOverview>({ queryKey: [role === 'admin' ? 'admin-operational-overview' : 'agency-overview', user?.id], queryFn: async () => (await apiClient.get(`/${role}/overview`)).data, staleTime: 10000, refetchInterval: 30000 });
}
export function useAgencyProfile() {
  const user = useAuthStore(state => state.user);
  return useQuery<AgencyProfile>({ queryKey: ['agency-profile', user?.id], queryFn: async () => (await apiClient.get('/agency/profile')).data, refetchInterval: 30000 });
}
export function jakartaDay(value: string | Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
export function periodRows(items: Report[], days: number) {
  if (!days) return items;
  const start = new Date(`${jakartaDay(new Date())}T00:00:00+07:00`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return items.filter(item => new Date(item.dibuatPada) >= start);
}
