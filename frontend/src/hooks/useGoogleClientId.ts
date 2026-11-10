import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export function useGoogleClientId() {
  return useQuery({
    queryKey: ['google-sign-in-config'],
    queryFn: async () => (await apiClient.get<{ clientId: string | null }>('/auth/google/config', { timeout: 8000 })).data.clientId,
    staleTime: Infinity,
    retry: false,
  }).data;
}
