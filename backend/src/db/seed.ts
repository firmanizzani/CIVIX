import { db } from './index.js';
import { users, regions, reports, reportPhotos, reportStatusLogs, agencies, reportAssignments } from './schema.js';
import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Mulai seeding database...');

  try {
    // 1. Regions DKI Jakarta
    const regionsData = [
      { nama: 'Jakarta Pusat', tipe: 'kota_administrasi' },
      { nama: 'Jakarta Utara', tipe: 'kota_administrasi' },
      { nama: 'Jakarta Barat', tipe: 'kota_administrasi' },
      { nama: 'Jakarta Selatan', tipe: 'kota_administrasi' },
      { nama: 'Jakarta Timur', tipe: 'kota_administrasi' },
      { nama: 'Kepulauan Seribu', tipe: 'kabupaten_administrasi' },
    ];

    console.log('   → Membuat regions...');
    await db.insert(regions).values(regionsData).onConflictDoNothing();
    const allRegions = await db.query.regions.findMany();
    console.log(`   ✓ ${allRegions.length} regions`);

    // 2. Agensi dan akun demo
    const agencyCatalog = [
      { nama: 'Dinas Bina Marga Provinsi DKI Jakarta', deskripsi: 'Penanganan jalan dan infrastruktur jalan.' },
      { nama: 'Dinas Sumber Daya Air Provinsi DKI Jakarta', deskripsi: 'Penanganan drainase dan masalah sumber daya air.' },
      { nama: 'Dinas Lingkungan Hidup Provinsi DKI Jakarta', deskripsi: 'Penanganan sampah dan kebersihan lingkungan.' },
      { nama: 'Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta', deskripsi: 'Penanganan lampu dan penerangan jalan umum.' },
    ];
    for (const agency of agencyCatalog) {
      const existingAgency = await db.query.agencies.findFirst({ where: eq(agencies.nama, agency.nama) });
      if (!existingAgency) await db.insert(agencies).values(agency);
    }
    const allAgencies = await db.query.agencies.findMany();
    const agencyByName = (name: string) => allAgencies.find((agency) => agency.nama === name)!;

    const passwordHash = await bcrypt.hash('demo1234', 12);
    const usersData = [
      { nama: 'Warga Demo', email: 'warga@demo.com', passwordHash, peran: 'warga' as const, agencyId: undefined },
      { nama: 'Admin CIVIX', email: 'admin@demo.com', passwordHash, peran: 'admin' as const, agencyId: undefined },
      { nama: 'Dinas Bina Marga Provinsi DKI Jakarta', email: 'instansi@demo.com', passwordHash, peran: 'instansi' as const, agencyId: agencyByName('Dinas Bina Marga Provinsi DKI Jakarta').id },
      { nama: 'Dinas Sumber Daya Air Provinsi DKI Jakarta', email: 'air@demo.com', passwordHash, peran: 'instansi' as const, agencyId: agencyByName('Dinas Sumber Daya Air Provinsi DKI Jakarta').id },
      { nama: 'Dinas Lingkungan Hidup Provinsi DKI Jakarta', email: 'lingkungan@demo.com', passwordHash, peran: 'instansi' as const, agencyId: agencyByName('Dinas Lingkungan Hidup Provinsi DKI Jakarta').id },
      { nama: 'Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta', email: 'penerangan@demo.com', passwordHash, peran: 'instansi' as const, agencyId: agencyByName('Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta').id },
    ];

    console.log('   → Membuat users...');
    await db.insert(users).values(usersData).onConflictDoNothing();
    const allUsers = await db.query.users.findMany();
    const wargaUser = allUsers.find((u) => u.peran === 'warga');
    const adminUser = allUsers.find((u) => u.peran === 'admin');
    console.log(`   ✓ ${allUsers.length} users`);

    if (!wargaUser || !adminUser) {
      throw new Error('User demo tidak ditemukan');
    }

    // Pastikan akun instansi yang sudah ada tetap terhubung ke agensi
    for (const data of usersData) {
      if (data.peran === 'instansi' && data.agencyId) {
        await db.update(users).set({ agencyId: data.agencyId }).where(eq(users.email, data.email));
      }
    }

    // 3. Demo Reports
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const reportsData = [
      {
        kodeTiket: 'LPR-2026-00001',
        userId: wargaUser.id,
        regionId: allRegions[0].id,
        judul: 'Jalan berlubang di Jl. Sudirman',
        deskripsi: 'Terdapat lubang besar di jalur kiri Jl. Sudirman arah Senayan yang membahayakan pengendara motor.',
        namaJalan: 'Jl. Jenderal Sudirman No. 45, Senayan',
        kategori: 'jalan_rusak' as const,
        latitude: '-6.2088',
        longitude: '106.8228',
        status: 'selesai' as const,
        anonim: false,
        dibuatPada: sevenDaysAgo,
        selesaiPada: threeDaysAgo,
      },
      {
        kodeTiket: 'LPR-2026-00002',
        userId: wargaUser.id,
        regionId: allRegions[3].id,
        judul: 'Drainase tersumbat di Kebayoran Baru',
        deskripsi: 'Saluran air mampet menyebabkan genangan saat hujan.',
        namaJalan: 'Jl. Wolter Monginsidi, Kebayoran Baru',
        kategori: 'drainase' as const,
        latitude: '-6.2425',
        longitude: '106.7988',
        status: 'dikerjakan' as const,
        anonim: false,
        dibuatPada: threeDaysAgo,
        selesaiPada: null,
      },
      {
        kodeTiket: 'LPR-2026-00003',
        userId: wargaUser.id,
        regionId: allRegions[1].id,
        judul: 'Lampu jalan mati di Jl. Pangeran Jayakarta',
        deskripsi: 'Lampu jalan mati sejak seminggu lalu, area gelap dan rawan.',
        namaJalan: 'Jl. Pangeran Jayakarta RT 02/05',
        kategori: 'penerangan' as const,
        latitude: '-6.1428',
        longitude: '106.8370',
        status: 'ditugaskan' as const,
        anonim: false,
        dibuatPada: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        selesaiPada: null,
      },
      {
        kodeTiket: 'LPR-2026-00004',
        userId: wargaUser.id,
        regionId: allRegions[4].id,
        judul: 'Sampah menumpuk di trotoar Cawang',
        deskripsi: 'Tumpukan sampah tidak diangkut selama beberapa hari.',
        namaJalan: 'Jl. MT Haryono, Dekat Halte Cawang',
        kategori: 'sampah' as const,
        latitude: '-6.2424',
        longitude: '106.8662',
        status: 'diverifikasi' as const,
        anonim: true,
        dibuatPada: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        selesaiPada: null,
      },
      {
        kodeTiket: 'LPR-2026-00005',
        userId: wargaUser.id,
        regionId: allRegions[2].id,
        judul: 'Halte rusak di Jl. Daan Mogot',
        deskripsi: 'Atap halte bocor dan bangku rusak.',
        namaJalan: 'Jl. Daan Mogot KM 12',
        kategori: 'fasilitas_umum' as const,
        latitude: '-6.1689',
        longitude: '106.7537',
        status: 'diterima' as const,
        anonim: false,
        dibuatPada: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        selesaiPada: null,
      },
    ];

    console.log('   → Membuat reports...');
    await db.insert(reports).values(reportsData).onConflictDoNothing();
    const allReports = await db.query.reports.findMany();
    console.log(`   ✓ ${allReports.length} reports`);

    const agencyForCategory: Record<string, string> = {
      jalan_rusak: agencyByName('Dinas Bina Marga Provinsi DKI Jakarta').id,
      drainase: agencyByName('Dinas Sumber Daya Air Provinsi DKI Jakarta').id,
      sampah: agencyByName('Dinas Lingkungan Hidup Provinsi DKI Jakarta').id,
      penerangan: agencyByName('Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta').id,
      fasilitas_umum: agencyByName('Dinas Bina Marga Provinsi DKI Jakarta').id,
      lainnya: agencyByName('Dinas Bina Marga Provinsi DKI Jakarta').id,
    };
    for (const report of allReports) {
      const agencyId = agencyForCategory[report.kategori];
      const requiresAssignment = ['ditugaskan', 'dikerjakan', 'selesai'].includes(report.status);
      await db.update(reports).set({ assignedAgencyId: requiresAssignment ? agencyId : null }).where(eq(reports.id, report.id));
      if (requiresAssignment) {
        const existingAssignment = await db.query.reportAssignments.findFirst({
          where: and(eq(reportAssignments.reportId, report.id), eq(reportAssignments.agencyId, agencyId)),
        });
        if (!existingAssignment) {
          await db.insert(reportAssignments).values({
            reportId: report.id,
            agencyId,
            assignedBy: adminUser.id,
            catatan: 'Penugasan data demonstrasi berdasarkan kategori laporan',
          });
        }
      }
    }

    // 4. Status Logs
    console.log('   → Membuat status logs...');
    for (const report of allReports) {
      const logs: Array<{
        reportId: string;
        diubahOleh?: string;
        status: 'diterima' | 'diverifikasi' | 'ditugaskan' | 'dikerjakan' | 'selesai' | 'ditolak' | 'duplikat';
        catatan?: string;
        waktu?: Date;
      }> = [
        {
          reportId: report.id,
          diubahOleh: wargaUser.id,
          status: 'diterima',
          catatan: 'Laporan berhasil dibuat dan masuk antrean verifikasi',
          waktu: report.dibuatPada,
        },
      ];

      if (report.status !== 'diterima') {
        logs.push({
          reportId: report.id,
          diubahOleh: adminUser.id,
          status: 'diverifikasi',
          catatan: 'Laporan telah diverifikasi oleh administrator',
          waktu: new Date(report.dibuatPada.getTime() + 2 * 60 * 60 * 1000),
        });
      }

      if (['ditugaskan', 'dikerjakan', 'selesai'].includes(report.status)) {
        logs.push({
          reportId: report.id,
          diubahOleh: adminUser.id,
          status: 'ditugaskan',
          catatan: 'Ditugaskan ke instansi terkait',
          waktu: new Date(report.dibuatPada.getTime() + 4 * 60 * 60 * 1000),
        });
      }

      if (['dikerjakan', 'selesai'].includes(report.status)) {
        logs.push({
          reportId: report.id,
          diubahOleh: allUsers.find((u) => u.peran === 'instansi')?.id || adminUser.id,
          status: 'dikerjakan',
          catatan: 'Pekerjaan dimulai oleh instansi',
          waktu: new Date(report.dibuatPada.getTime() + 1 * 24 * 60 * 60 * 1000),
        });
      }

      if (report.status === 'selesai' && report.selesaiPada) {
        logs.push({
          reportId: report.id,
          diubahOleh: allUsers.find((u) => u.peran === 'instansi')?.id || adminUser.id,
          status: 'selesai',
          catatan: 'Pekerjaan selesai, bukti perbaikan telah diunggah',
          waktu: report.selesaiPada,
        });
      }

      await db.insert(reportStatusLogs).values(logs).onConflictDoNothing();
    }

    console.log('   ✓ Status logs created');
    console.log('\n✅ Seeding selesai!');
    console.log('\n📌 Akun Demo:');
    console.log('   Warga     : warga@demo.com / demo1234');
    console.log('   Admin     : admin@demo.com / demo1234');
    console.log('   Dinas Bina Marga Provinsi DKI Jakarta: instansi@demo.com / demo1234');
    console.log('   Dinas Sumber Daya Air Provinsi DKI Jakarta: air@demo.com / demo1234');
    console.log('   Dinas Lingkungan Hidup Provinsi DKI Jakarta: lingkungan@demo.com / demo1234');
    console.log('   Unit Pelaksana Teknis Penerangan Jalan Umum Provinsi DKI Jakarta: penerangan@demo.com / demo1234\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding gagal:', err);
    process.exit(1);
  }
}

seed();
