import { and, eq } from 'drizzle-orm';
import { db } from './index.js';
import { reportPhotos, reports, reportStatusLogs, users } from './schema.js';
import { buildReportPhotoPath, uploadImageToStorage } from '../modules/uploads/service.js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '../config/index.js';

const septemberReports = [
  {
    kodeTiket: 'LPR-2026-SEP-001',
    judul: 'Jalan berlubang di Jl. Kramat Raya',
    deskripsi: 'Lubang cukup dalam terlihat di lajur kiri dan membahayakan pengendara sepeda motor.',
    namaJalan: 'Jl. Kramat Raya, Jakarta Pusat',
    kategori: 'jalan_rusak' as const,
    latitude: '-6.184242',
    longitude: '106.842145',
    status: 'selesai' as const,
    region: 'Jakarta Pusat',
    dibuatPada: new Date('2026-09-03T02:30:00.000Z'),
    selesaiPada: new Date('2026-09-08T08:00:00.000Z'),
    photoUrl: 'https://live.staticflickr.com/7395/12683223904_687fcc4783_b.jpg',
  },
  {
    kodeTiket: 'LPR-2026-SEP-002',
    judul: 'Saluran drainase tersumbat di Cikini',
    deskripsi: 'Saluran air tertutup sampah sehingga air meluap ke badan jalan saat hujan.',
    namaJalan: 'Jl. Cikini Raya, Jakarta Pusat',
    kategori: 'drainase' as const,
    latitude: '-6.190991',
    longitude: '106.839620',
    status: 'selesai' as const,
    region: 'Jakarta Pusat',
    dibuatPada: new Date('2026-09-07T03:15:00.000Z'),
    selesaiPada: new Date('2026-09-12T09:00:00.000Z'),
    photoUrl: 'https://live.staticflickr.com/2141/1806439935_1c91b14218_b.jpg',
  },
  {
    kodeTiket: 'LPR-2026-SEP-003',
    judul: 'Sampah menumpuk di trotoar Kemang',
    deskripsi: 'Tumpukan kantong sampah menghalangi jalur pejalan kaki dan belum diangkut.',
    namaJalan: 'Jl. Kemang Raya, Jakarta Selatan',
    kategori: 'sampah' as const,
    latitude: '-6.261776',
    longitude: '106.813517',
    status: 'selesai' as const,
    region: 'Jakarta Selatan',
    dibuatPada: new Date('2026-09-11T04:45:00.000Z'),
    selesaiPada: new Date('2026-09-14T07:00:00.000Z'),
    photoUrl: 'https://live.staticflickr.com/4409/35972464294_07f76f7e8d_b.jpg',
  },
  {
    kodeTiket: 'LPR-2026-SEP-004',
    judul: 'Lampu jalan mati di kawasan Senen',
    deskripsi: 'Dua titik lampu jalan tidak menyala pada malam hari sehingga area menjadi gelap.',
    namaJalan: 'Jl. Kramat Bunder, Jakarta Pusat',
    kategori: 'penerangan' as const,
    latitude: '-6.176902',
    longitude: '106.841868',
    status: 'selesai' as const,
    region: 'Jakarta Pusat',
    dibuatPada: new Date('2026-09-15T11:10:00.000Z'),
    selesaiPada: new Date('2026-09-18T12:00:00.000Z'),
    photoUrl: 'https://live.staticflickr.com/137/323514828_686e51e6da_b.jpg',
  },
  {
    kodeTiket: 'LPR-2026-SEP-005',
    judul: 'Halte bus rusak di Jl. Gatot Subroto',
    deskripsi: 'Atap halte bocor dan salah satu bangku penumpang sudah rusak.',
    namaJalan: 'Jl. Gatot Subroto, Jakarta Selatan',
    kategori: 'fasilitas_umum' as const,
    latitude: '-6.229862',
    longitude: '106.813095',
    status: 'selesai' as const,
    region: 'Jakarta Selatan',
    dibuatPada: new Date('2026-09-20T05:20:00.000Z'),
    selesaiPada: new Date('2026-09-25T10:00:00.000Z'),
    photoUrl: 'https://live.staticflickr.com/2748/4247948122_390d55e390_b.jpg',
  },
  {
    kodeTiket: 'LPR-2026-SEP-006',
    judul: 'Trotoar retak di sekitar Monas',
    deskripsi: 'Permukaan trotoar retak dan tidak rata sehingga berisiko bagi pejalan kaki.',
    namaJalan: 'Jl. Medan Merdeka Barat, Jakarta Pusat',
    kategori: 'jalan_rusak' as const,
    latitude: '-6.175392',
    longitude: '106.827153',
    status: 'selesai' as const,
    region: 'Jakarta Pusat',
    dibuatPada: new Date('2026-09-26T01:40:00.000Z'),
    selesaiPada: new Date('2026-09-30T09:30:00.000Z'),
    photoUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80',
  },
];

async function downloadPhoto(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal mengunduh foto: ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function seedSeptemberReports() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk seed foto.');
  }

  const warga = await db.query.users.findFirst({ where: eq(users.email, 'warga@demo.com') });
  if (!warga) throw new Error('Akun warga demo tidak ditemukan. Jalankan npm run db:seed terlebih dahulu.');

  const allRegions = await db.query.regions.findMany();
  const regionByName = new Map(allRegions.map((region) => [region.nama, region.id]));

  for (const item of septemberReports) {
    const regionId = regionByName.get(item.region);
    if (!regionId) throw new Error(`Wilayah tidak ditemukan: ${item.region}`);

    const reportData = { ...item };
    delete reportData.photoUrl;
    delete reportData.region;

    await db.insert(reports).values({
      ...reportData,
      userId: warga.id,
      regionId,
      anonim: false,
    }).onConflictDoNothing();

    await db.update(reports).set({
      status: item.status,
      kategori: item.kategori,
      selesaiPada: item.selesaiPada,
    }).where(eq(reports.kodeTiket, item.kodeTiket));

    const report = await db.query.reports.findFirst({ where: eq(reports.kodeTiket, item.kodeTiket) });
    if (!report) throw new Error(`Laporan tidak ditemukan setelah insert: ${item.kodeTiket}`);

    const photo = await db.query.reportPhotos.findFirst({
      where: and(eq(reportPhotos.reportId, report.id), eq(reportPhotos.jenis, 'awal')),
    });

    const cleanStoragePath = buildReportPhotoPath(item.kodeTiket, 'awal', 1, 'image/jpeg');
    const image = await downloadPhoto(item.photoUrl);
    const storedUrl = await uploadImageToStorage(image, cleanStoragePath, 'image/jpeg', true);

    if (!photo) {
      await db.insert(reportPhotos).values({ reportId: report.id, url: storedUrl, jenis: 'awal', dibuatPada: item.dibuatPada });
    } else {
      await db.update(reportPhotos).set({ url: storedUrl }).where(eq(reportPhotos.id, photo.id));
    }

    const log = await db.query.reportStatusLogs.findFirst({
      where: and(eq(reportStatusLogs.reportId, report.id), eq(reportStatusLogs.status, item.status)),
    });
    if (!log) {
      await db.insert(reportStatusLogs).values({
        reportId: report.id,
        diubahOleh: warga.id,
        status: item.status,
        catatan: 'Data dummy September 2026 untuk demonstrasi statistik.',
        waktu: item.selesaiPada ?? item.dibuatPada,
      });
    }
  }

  console.log(`Berhasil menyinkronkan ${septemberReports.length} laporan dummy September 2026 beserta foto.`);
  process.exit(0);
}

seedSeptemberReports().catch((error) => {
  console.error(error);
  process.exit(1);
});
