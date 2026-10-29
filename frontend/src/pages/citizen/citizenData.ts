import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export interface CitizenProfile { id: string; nama: string; email: string; peran: string; telepon: string; alamat: string; avatarUrl: string | null; notifyReportUpdates: boolean }
export function useCitizenProfile(enabled = true) {
  const user = useAuthStore(state => state.user);
  return useQuery<CitizenProfile>({ queryKey: ['citizen-profile', user?.id], queryFn: async () => (await apiClient.get('/citizen/profile')).data, enabled: enabled && user?.peran === 'warga', refetchInterval: 30000 });
}
