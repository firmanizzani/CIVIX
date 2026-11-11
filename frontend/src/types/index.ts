export type Peran = 'warga' | 'admin' | 'instansi';

export type StatusLaporan =
  | 'diterima'
  | 'diverifikasi'
  | 'ditugaskan'
  | 'dikerjakan'
  | 'selesai'
  | 'ditolak'
  | 'duplikat';

export type KategoriLaporan =
  | 'jalan_rusak'
  | 'drainase'
  | 'sampah'
  | 'penerangan'
  | 'fasilitas_umum'
  | 'lainnya';

export interface User {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  agencyId?: string | null;
  agencyNama?: string | null;
}

export interface Region {
  id: string;
  nama: string;
  tipe: string;
}

export interface ReportPhoto {
  id: string;
  reportId: string;
  url: string;
  jenis: 'awal' | 'bukti_perbaikan';
  dibuatPada: string;
}

export interface NearbyReport {
  id: string;
  kodeTiket: string;
  judul: string;
  namaJalan: string | null;
  distanceMeters: number;
}

export interface ReportEvidenceCheck {
  photos: { photoId: string; status: 'match' | 'mismatch' | 'unavailable'; distanceMeters: number | null }[];
  nearby: NearbyReport[];
}

export interface StatusLog {
  id: string;
  reportId: string;
  status: StatusLaporan;
  catatan: string | null;
  waktu: string;
  user?: { peran: Peran; agency?: { nama: string } | null } | null;
}

export interface Comment {
  id: string;
  reportId: string;
  isi: string;
  waktu: string;
  user?: { nama: string };
}

export interface Upvote {
  reportId: string;
  userId: string;
  waktu: string;
}

export type FundingSource = 'apbd' | 'other';

export interface ReportCostRevision {
  id: string;
  amount: string;
  fundingSource: FundingSource;
  fundingNote: string | null;
  breakdown: string;
  reason: string;
  recordedAt: string;
}

export interface ReportCost {
  reportId: string;
  amount: string;
  fundingSource: FundingSource;
  fundingNote: string | null;
  breakdown: string;
  agencyId: string;
  updatedAt: string;
  agency?: { id: string; nama: string };
  revisions?: ReportCostRevision[];
}

export interface CostOverviewData {
  totalAmount: string;
  completed: number;
  recorded: number;
  missing: number;
  rows: { id: string; kodeTiket: string; judul: string; selesaiPada: string | null; cost: ReportCost; region: Region | null }[];
  byAgency: { id: string; name: string; reports: number; amount: string }[];
  regions: Region[];
  agencies: { id: string; nama: string }[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Report {
  id: string;
  kodeTiket: string;
  userId: string | null;
  regionId: string | null;
  judul: string;
  deskripsi: string;
  namaJalan: string | null;
  kategori: KategoriLaporan;
  latitude: string;
  longitude: string;
  status: StatusLaporan;
  anonim: boolean;
  dibuatPada: string;
  selesaiPada: string | null;
  photos?: ReportPhoto[];
  statusLogs?: StatusLog[];
  comments?: Comment[];
  upvotes?: Upvote[];
  region?: Region | null;
  assignedAgency?: { id: string; nama: string } | null;
  cost?: ReportCost | null;
  user?: { nama: string; email?: string } | null;
}

export interface MapPoint {
  id: string;
  kodeTiket: string;
  judul: string;
  namaJalan: string | null;
  kategori: KategoriLaporan;
  status: StatusLaporan;
  latitude: string;
  longitude: string;
  dibuatPada: string;
  photos?: { url: string }[];
  cost?: ReportCost | null;
}

export type PublicReportCard = Pick<Report, 'id' | 'judul' | 'kategori' | 'kodeTiket' | 'namaJalan' | 'dibuatPada' | 'status'> & {
  photos: Pick<ReportPhoto, 'url'>[];
  cost?: ReportCost | null;
};

export interface ReportWorkspace {
  items: Report[];
  total: number;
  totalAll: number;
  page: number;
  pageSize: number;
  counts: Record<StatusLaporan, number>;
}

export interface AdminDashboard {
  total: number;
  pending: number;
  verified: number;
  inProgress: number;
  completed: number;
  totalWarga?: number;
  totalInstansi?: number;
  totalAkunInstansi?: number;
}

export interface AdminResident {
  id: string;
  nama: string;
  email: string;
  dibuatPada: string;
}

export interface AgencyAccount {
  id: string;
  nama: string;
  email: string;
  dibuatPada: string;
}

export interface AdminAgency {
  id: string;
  nama: string;
  deskripsi: string | null;
  dibuatPada?: string;
  users?: AgencyAccount[];
  jumlahLaporan?: number;
}

export interface AdminUser {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  dibuatPada: string;
  agency?: { id: string; nama: string } | null;
}

export interface AgencyDashboard {
  ditugaskan: number;
  dikerjakan: number;
  selesai: number;
  recent: Report[];
  agency?: { nama: string } | null;
}

export interface StatsOverview {
  totalLaporan: number;
  persentaseSelesai: number;
  rataRataHariSelesai: number | null;
  menunggu: number;
  dalamProses: number;
  selesai: number;
}

export interface TrendRow {
  periode: string; // bulan dalam format 'YYYY-MM'
  kategori: KategoriLaporan;
  jumlah: number;
}

export interface RegionStat {
  regionId: string;
  wilayah: string;
  total: number;
  selesai: number;
  belumTertangani: number;
  rataRataHari: number | null;
}

export interface CategoryStat {
  rows: { kategori: KategoriLaporan; jumlah: number; label: string }[];
  insight: string;
}

export const STATUS_LABEL: Record<StatusLaporan, string> = {
  diterima: 'Menunggu Verifikasi',
  diverifikasi: 'Terverifikasi',
  ditugaskan: 'Menunggu Ditangani',
  dikerjakan: 'Sedang Dikerjakan',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  duplikat: 'Laporan Duplikat',
};

export const STATUS_MAP_COLOR: Record<StatusLaporan, 'merah' | 'oranye' | 'kuning' | 'hijau' | 'lain'> = {
  diterima: 'merah',
  diverifikasi: 'oranye',
  ditugaskan: 'kuning',
  dikerjakan: 'kuning',
  selesai: 'hijau',
  ditolak: 'lain',
  duplikat: 'lain',
};

export const KATEGORI_LABEL: Record<KategoriLaporan, string> = {
  jalan_rusak: 'Jalan Rusak',
  drainase: 'Drainase/Banjir',
  sampah: 'Sampah',
  penerangan: 'Penerangan Jalan',
  fasilitas_umum: 'Fasilitas Umum',
  lainnya: 'Lainnya',
};
