import type { CSSProperties } from 'react';
import type { KategoriLaporan } from '@/types';

// Shared category hues for public statistics and report badges.
export const CATEGORY_COLORS: Record<KategoriLaporan, string> = {
  jalan_rusak: '#C87968',
  drainase: '#648FB5',
  sampah: '#4D9990',
  penerangan: '#C9A252',
  fasilitas_umum: '#008358',
  lainnya: '#8B97A5',
};

const CATEGORY_TEXT: Record<KategoriLaporan, string> = {
  jalan_rusak: '#97503F',
  drainase: '#42698B',
  sampah: '#2B726A',
  penerangan: '#86641E',
  fasilitas_umum: '#006B48',
  lainnya: '#586675',
};

export const CATEGORY_BADGE_STYLES = Object.fromEntries(
  Object.entries(CATEGORY_COLORS).map(([key, color]) => [key, {
    backgroundColor: `${color}18`,
    color: CATEGORY_TEXT[key as KategoriLaporan],
  }]),
) as Record<KategoriLaporan, CSSProperties>;
