import { and, asc, count, desc, eq, ilike, inArray, or, SQL, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { kategoriLaporanEnum, reportPhotos, reports, reportStatusLogs, statusLaporanEnum } from '../../db/schema.js';

const activeStatuses = ['diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan'] as const;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const querySchema = z.object({
  status: z.enum([...statusLaporanEnum.enumValues, 'aktif', 'proses', 'ditolak_duplikat']).optional(),
  kategori: z.enum(kategoriLaporanEnum.enumValues).optional(),
  search: z.string().trim().max(150).optional(),
  regionId: z.string().max(40).optional(),
  agencyId: z.string().max(40).optional(),
  dateFrom: day.optional(),
  dateTo: day.optional(),
  sort: z.enum(['oldest', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// All totals and rows use the same authorization scope and database snapshot.
export async function getReportWorkspace(input: unknown, scope?: SQL, allowedStatuses?: (typeof reports.$inferSelect.status)[]) {
  const query = querySchema.parse(input);
  const authorized = and(scope, allowedStatuses ? inArray(reports.status, allowedStatuses) : undefined);
  const status = query.status === 'aktif' ? inArray(reports.status, [...activeStatuses])
    : query.status === 'proses' ? inArray(reports.status, ['ditugaskan', 'dikerjakan'])
    : query.status === 'ditolak_duplikat' ? inArray(reports.status, ['ditolak', 'duplikat'])
    : query.status ? eq(reports.status, query.status) : undefined;
  const where = and(authorized, status,
    query.regionId ? eq(reports.regionId, query.regionId) : undefined,
    query.agencyId ? eq(reports.assignedAgencyId, query.agencyId) : undefined,
    query.dateFrom ? gte(reports.dibuatPada, new Date(`${query.dateFrom}T00:00:00+07:00`)) : undefined,
    query.dateTo ? lte(reports.dibuatPada, new Date(`${query.dateTo}T23:59:59.999+07:00`)) : undefined,
    query.kategori ? eq(reports.kategori, query.kategori) : undefined,
    query.search ? or(ilike(reports.judul, `%${query.search}%`), ilike(reports.kodeTiket, `%${query.search}%`), ilike(reports.namaJalan, `%${query.search}%`)) : undefined);
  return db.transaction(async (tx) => {
    const grouped = await tx.select({ status: reports.status, value: count() }).from(reports).where(authorized).groupBy(reports.status);
    const counts = Object.fromEntries(statusLaporanEnum.enumValues.map((status) => [status, 0]));
    for (const row of grouped) counts[row.status] = Number(row.value);
    const [totalRow] = await tx.select({ value: count() }).from(reports).where(where);
    const total = Number(totalRow.value);
    const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.limit)));
    const items = await tx.query.reports.findMany({
      where, limit: query.limit, offset: (page - 1) * query.limit,
      orderBy: [query.sort === 'oldest' ? asc(reports.dibuatPada) : desc(reports.dibuatPada), asc(reports.id)],
      with: {
        photos: { where: eq(reportPhotos.jenis, 'awal'), limit: 1, orderBy: [asc(reportPhotos.dibuatPada)] },
        region: true, assignedAgency: true,
        statusLogs: { orderBy: [desc(reportStatusLogs.waktu), desc(reportStatusLogs.id)], limit: 1 },
      },
    });
    return { items, total, page, pageSize: query.limit, counts,
      totalAll: Object.values(counts).reduce((sum, value) => sum + Number(value), 0) };
  }, { isolationLevel: 'repeatable read', readOnly: true });
}
