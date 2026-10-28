import type { Peran } from '@/types';

// Accept only same-origin application paths that the signed-in role can visit.
export function getLoginDestination(redirect: string | null, role: Peran): string {
  const fallback = role === 'admin' ? '/admin' : role === 'instansi' ? '/agency' : '/citizen';
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//') || /[\\\s]/.test(redirect)) return fallback;
  const path = redirect.split(/[?#]/)[0];
  if (/^\/(login|register|forgot-password)(\/|$)/.test(path)) return fallback;
  if (/^\/citizen(\/|$)/.test(path) && role !== 'warga') return fallback;
  if (/^\/admin(\/|$)/.test(path) && role !== 'admin') return fallback;
  if (/^\/agency(\/|$)/.test(path) && role === 'warga') return fallback;
  return redirect;
}
