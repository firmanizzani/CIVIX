import { useEffect, useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { ReportWorkspace } from '@/types';

const desktopQuery = '(min-width: 1024px)';
const subscribeDesktop = (notify: () => void) => {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
export const useDesktop = () => useSyncExternalStore(subscribeDesktop,
  () => window.matchMedia(desktopQuery).matches, () => false);

export function useReportWorkspace(role: 'admin' | 'agency' | 'citizen', defaultStatus?: string) {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const rawSearch = params.get('q') || '';
  const [search, setSearch] = useState(rawSearch);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(rawSearch), 250);
    return () => window.clearTimeout(timer);
  }, [rawSearch]);
  const status = params.get('status') ?? defaultStatus ?? (role === 'admin' ? 'diterima' : role === 'agency' ? 'aktif' : '');
  const kategori = params.get('kategori') || '';
  const sort = params.get('sort') || (role === 'citizen' ? 'newest' : 'oldest');
  const page = Number(params.get('page') || 1);
  const regionId = params.get('regionId') || '';
  const agencyId = params.get('agencyId') || '';
  const dateFrom = params.get('dateFrom') || '';
  const dateTo = params.get('dateTo') || '';
  const path = role === 'admin' ? '/admin/reports' : role === 'agency' ? '/agency/assignments' : '/reports/me/reports';
  const query = useQuery<ReportWorkspace>({
    queryKey: ['workspace', role, user?.id, status, kategori, sort, search, page, regionId, agencyId, dateFrom, dateTo],
    queryFn: async () => (await apiClient.get(path, { params: {
      view: 'workspace', status: status || undefined, kategori: kategori || undefined,
      sort, search: search || undefined, page, limit: role === 'citizen' ? 8 : 10,
      regionId: regionId || undefined, agencyId: agencyId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
    } })).data,
    enabled: !!user, staleTime: 10000, refetchInterval: 30000, refetchOnWindowFocus: true,
  });
  const update = (changes: Record<string, string | null>, resetPage = true) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      if (resetPage) { next.delete('page'); next.delete('laporan'); }
      return next;
    }, { replace: true });
  };
  const refreshReports = () => queryClient.invalidateQueries({ predicate: (cached) => [
    'workspace', 'workspace-detail', 'admin-dashboard', 'agency-dashboard', 'admin-reports',
    'agency-assignments', 'my-reports', 'report-detail', 'recent-reports', 'public-reports',
    'stats-overview', 'stats-overview-full', 'stats-trend', 'stats-regions', 'stats-category',
    'map-points-full', 'map-points-preview', 'admin-map', 'admin-overview', 'admin-agencies', 'agency-overview', 'admin-operational-overview', 'admin-pending-notifications',
  ].includes(String(cached.queryKey[0])) });
  return { ...query, params, update, status, kategori, sort, search: rawSearch, refreshReports, user };
}

export function getActionError(error: unknown) {
  if (isAxiosError(error) && typeof error.response?.data?.error === 'string') return error.response.data.error;
  return 'Perubahan belum berhasil disimpan. Silakan coba lagi.';
}
