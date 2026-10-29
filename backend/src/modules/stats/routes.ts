import { Router, Response } from 'express';
import { db } from '../../db/index.js';
import { reports, regions, comments, upvotes } from '../../db/schema.js';
import { eq, sql, desc, count, and, gte } from 'drizzle-orm';

const router = Router();

// GET /stats/overview - Kartu ringkasan publik
router.get('/overview', async (_req, res: Response) => {
  try {
    const total = await db.select({ value: count() }).from(reports);
    const selesai = await db.select({ value: count() }).from(reports).where(eq(reports.status, 'selesai'));
    const proses = await db
      .select({ value: count() })
      .from(reports)
      .where(sql`${reports.status} IN ('ditugaskan','dikerjakan')`);
    const menunggu = await db
      .select({ value: count() })
      .from(reports)
      .where(sql`${reports.status} IN ('diterima','diverifikasi')`);

    const avgRes = await db
      .select({ avg: sql<string>`AVG(EXTRACT(EPOCH FROM (${reports.selesaiPada} - ${reports.dibuatPada})) / 86400)` })
      .from(reports)
      .where(eq(reports.status, 'selesai'));

    const pct = total[0].value > 0 ? Math.round((selesai[0].value / total[0].value) * 100) : 0;

    res.json({
      totalLaporan: total[0].value,
      persentaseSelesai: pct,
      rataRataHariSelesai: avgRes[0]?.avg ? Math.round(Number(avgRes[0].avg) * 10) / 10 : null,
      menunggu: menunggu[0].value,
      dalamProses: proses[0].value,
      selesai: selesai[0].value,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat statistik' });
  }
});

// GET /stats/trend - Tren bulanan per kategori (6 bulan terakhir)
router.get('/trend', async (_req, res: Response) => {
  try {
    const rows = await db
      .select({
        periode: sql<string>`TO_CHAR(DATE_TRUNC('month', ${reports.dibuatPada} AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM')`,
        kategori: reports.kategori,
        jumlah: count(),
      })
      .from(reports)
      .where(gte(reports.dibuatPada, sql`DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Jakarta') - INTERVAL '5 months'`))
      .groupBy(sql`DATE_TRUNC('month', ${reports.dibuatPada} AT TIME ZONE 'Asia/Jakarta')`, reports.kategori)
      .orderBy(sql`DATE_TRUNC('month', ${reports.dibuatPada} AT TIME ZONE 'Asia/Jakarta')`);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat tren' });
  }
});

// GET /stats/regions - Perbandingan wilayah + insight
router.get('/regions', async (_req, res: Response) => {
  try {
    const rows = await db
      .select({
        regionId: regions.id,
        wilayah: regions.nama,
        total: count(reports.id),
        selesai: sql<number>`COUNT(*) FILTER (WHERE ${reports.status} = 'selesai')`,
        belumTertangani: sql<number>`COUNT(*) FILTER (WHERE ${reports.status} NOT IN ('selesai','ditolak','duplikat'))`,
        rataRataHari: sql<number | null>`ROUND(AVG(EXTRACT(EPOCH FROM (${reports.selesaiPada} - ${reports.dibuatPada})) / 86400) FILTER (WHERE ${reports.status} = 'selesai')::numeric, 1)`,
      })
      .from(regions)
      .leftJoin(reports, eq(reports.regionId, regions.id))
      .groupBy(regions.id, regions.nama)
      .orderBy(desc(count(reports.id)));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat statistik wilayah' });
  }
});

// GET /stats/category - Sebaran kategori + insight kalimat
router.get('/category', async (_req, res: Response) => {
  try {
    const rows = await db
      .select({ kategori: reports.kategori, jumlah: count() })
      .from(reports)
      .where(sql`${reports.status} NOT IN ('ditolak','duplikat')`)
      .groupBy(reports.kategori)
      .orderBy(desc(count()));

    const total = rows.reduce((acc, r) => acc + r.jumlah, 0);
    const top = rows[0];
    const labelMap: Record<string, string> = {
      jalan_rusak: 'Jalan Rusak',
      drainase: 'Drainase/Banjir',
      sampah: 'Sampah',
      penerangan: 'Penerangan Jalan',
      fasilitas_umum: 'Fasilitas Umum',
      lainnya: 'Lainnya',
    };

    const insight =
      top && total > 0
        ? `${labelMap[top.kategori] ?? top.kategori} menyumbang ${Math.round((top.jumlah / total) * 100)}% dari seluruh laporan aktif.`
        : 'Belum ada data laporan untuk menghasilkan insight.';

    res.json({ rows: rows.map((r) => ({ ...r, label: labelMap[r.kategori] ?? r.kategori })), insight });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat sebaran kategori' });
  }
});

export default router;
