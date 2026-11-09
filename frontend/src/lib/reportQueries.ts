import { queryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import apiClient from '@/lib/api';
import type { Report } from '@/types';

export function publicReportDetailQuery(id: string | undefined) {
  return queryOptions({
    queryKey: ['report-detail', id],
    queryFn: async ({ signal }) => (await apiClient.get<Report>(`/reports/${id}`, { signal, timeout: 12000 })).data,
    enabled: !!id,
    staleTime: 30000,
    retry: (failureCount, error) => failureCount < 1 && !(isAxiosError(error) && (error.code === 'ECONNABORTED' || error.response?.status === 404)),
  });
}
