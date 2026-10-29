import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatusLaporan } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string, includeSeconds = false): string {
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' as const } : {}),
  });
}

export function getStatusBadgeClasses(status: StatusLaporan): string {
  switch (status) {
    case 'diterima':
      return 'status-badge whitespace-nowrap shrink-0 bg-red-100 text-red-800 border border-red-200';
    case 'diverifikasi':
      return 'status-badge whitespace-nowrap shrink-0 bg-orange-100 text-orange-800 border border-orange-200';
    case 'ditugaskan':
      return 'status-badge whitespace-nowrap shrink-0 bg-amber-100 text-amber-800 border border-amber-200';
    case 'dikerjakan':
      return 'status-badge whitespace-nowrap shrink-0 bg-amber-100 text-amber-800 border border-amber-200';
    case 'selesai':
      return 'status-badge whitespace-nowrap shrink-0 bg-lime-100 text-lime-800 border border-lime-200';
    case 'ditolak':
      return 'status-badge whitespace-nowrap shrink-0 bg-rose-100 text-rose-800 border border-rose-200';
    case 'duplikat':
      return 'status-badge whitespace-nowrap shrink-0 bg-purple-100 text-purple-800 border border-purple-200';
    default:
      return 'status-badge whitespace-nowrap shrink-0 bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export function getStatusColor(status: StatusLaporan): string {
  return { diterima: '#dc2626', diverifikasi: '#d97706', ditugaskan: '#facc15', dikerjakan: '#facc15', selesai: '#008358', ditolak: '#be123c', duplikat: '#7e22ce' }[status];
}
