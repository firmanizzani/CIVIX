import { and, asc, count, desc, eq, gte, isNotNull, SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { agencies, regions, reportCosts, reportCostRevisions, reports } from '../../db/schema.js';
import { ReportTransitionError } from './status.js';

export const costInput = z.object({
  amount: z.string().trim().regex(/^\d{1,15}$/, 'Isi biaya dengan angka rupiah utuh, maksimal 15 digit.')
    .transform(value => BigInt(value).toString()),
  fundingSource: z.enum(['apbd', 'other'], { errorMap: () => ({ message: 'Pilih sumber pendanaan.' }) }),
  fundingNote: z.string().trim().max(200, 'Keterangan sumber maksimal 200 karakter.').optional(),
  breakdown: z.string().trim().min(5, 'Jelaskan rincian penggunaan biaya, minimal 5 karakter.').max(2000),
}).superRefine((value, context) => {
  if (value.fundingSource === 'other' && !value.fundingNote) {
    context.addIssue({ code: 'custom', path: ['fundingNote'], message: 'Sebutkan sumber pendanaan lainnya.' });
  }
}).transform(value => ({ ...value, fundingNote: value.fundingSource === 'other' ? value.fundingNote! : null }));

export const reportCostSummary = {
  columns: { recordedBy: false, amount: false },
  extras: { amount: sql<string>`${reportCosts.amount}::text`.as('amount') },
  with: { agency: { columns: { id: true, nama: true } } },
} as const;

export const reportCostDetail = {
  ...reportCostSummary,
  with: {
    ...reportCostSummary.with,
    revisions: {
      columns: { recordedBy: false, amount: false },
      extras: { amount: sql<string>`${reportCostRevisions.amount}::text`.as('amount') },
      orderBy: [desc(reportCostRevisions.recordedAt), desc(reportCostRevisions.id)],
    },
  },
} as const;

// The caller holds the report lock, keeping completion and corrections serialized.
export async function saveReportCost(tx: any, input: z.output<typeof costInput>, reportId: string,
  agencyId: string, actorId: string, reason: string) {
  const [previous] = await tx.select().from(reportCosts).where(eq(reportCosts.reportId, reportId));
  if (previous && previous.amount === input.amount && previous.fundingSource === input.fundingSource &&
    previous.fundingNote === input.fundingNote && previous.breakdown === input.breakdown &&
    previous.agencyId === agencyId) return false;

  const updatedAt = new Date();
  const values = { ...input, agencyId, recordedBy: actorId, updatedAt };
  await tx.insert(reportCosts).values({ reportId, ...values })
    .onConflictDoUpdate({ target: reportCosts.reportId, set: values });
  await tx.insert(reportCostRevisions).values({
    reportId, ...input, reason, recordedBy: actorId, recordedAt: updatedAt,
  });
  return true;
}

export async function correctReportCost(reportId: string, agencyId: string, actorId: string, body: unknown) {
  const { reason, ...fields } = z.object({
    reason: z.string().trim().min(5, 'Isi alasan pencatatan atau koreksi, minimal 5 karakter.').max(1000),
    amount: z.unknown(), fundingSource: z.unknown(), fundingNote: z.unknown().optional(), breakdown: z.unknown(),
  }).strict().parse(body);
  const input = costInput.parse(fields);
  return db.transaction(async tx => {
    const [report] = await tx.select().from(reports).where(eq(reports.id, reportId)).for('update');
    if (!report) throw new ReportTransitionError(404, 'Laporan tidak ditemukan.');
    if (report.assignedAgencyId !== agencyId) throw new ReportTransitionError(403, 'Laporan ini bukan tugas instansi Anda.');
    if (report.status !== 'selesai') throw new ReportTransitionError(409, 'Biaya hanya dapat diperbarui pada laporan yang selesai.');
    return { changed: await saveReportCost(tx, input, reportId, agencyId, actorId, reason) };
  });
}

const costFilters = z.object({
  days: z.coerce.number().int().min(0).max(365).default(0),
  regionId: z.string().max(40).optional(),
  agencyId: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export async function getCostOverview(input: unknown, scope?: SQL) {
  const filters = costFilters.parse(input);
  const where = and(eq(reports.status, 'selesai'), scope,
    filters.regionId ? eq(reports.regionId, filters.regionId) : undefined,
    filters.agencyId ? eq(reports.assignedAgencyId, filters.agencyId) : undefined,
    filters.days ? gte(reports.selesaiPada,
      sql`((now() AT TIME ZONE 'Asia/Jakarta')::date - (${filters.days} - 1) * interval '1 day') AT TIME ZONE 'Asia/Jakarta'`) : undefined);

  return db.transaction(async tx => {
    const [summary] = await tx.select({
      completed: count(reports.id),
      recorded: count(reportCosts.reportId),
      totalAmount: sql<string>`coalesce(sum(${reportCosts.amount}), 0)::text`,
    }).from(reports).leftJoin(reportCosts, eq(reportCosts.reportId, reports.id)).where(where);
    const recorded = Number(summary.recorded);
    const page = Math.min(filters.page, Math.max(1, Math.ceil(recorded / filters.limit)));
    const rows = await tx.query.reports.findMany({
      where: and(where, isNotNull(sql`(select report_id from report_costs where report_id = ${reports.id})`)),
      columns: { id: true, kodeTiket: true, judul: true, selesaiPada: true },
      with: { cost: reportCostSummary, region: true },
      orderBy: [desc(reports.selesaiPada), asc(reports.id)],
      limit: filters.limit, offset: (page - 1) * filters.limit,
    });
    const byAgency = await tx.select({
      id: agencies.id, name: agencies.nama, reports: count(reportCosts.reportId),
      amount: sql<string>`coalesce(sum(${reportCosts.amount}), 0)::text`,
    }).from(reports).innerJoin(reportCosts, eq(reportCosts.reportId, reports.id))
      .innerJoin(agencies, eq(agencies.id, reportCosts.agencyId)).where(where)
      .groupBy(agencies.id, agencies.nama).orderBy(desc(sql`sum(${reportCosts.amount})`), asc(agencies.nama));
    return {
      totalAmount: summary.totalAmount, completed: Number(summary.completed), recorded,
      missing: Number(summary.completed) - recorded,
      rows, byAgency, page, pageSize: filters.limit, total: recorded,
      regions: await tx.select().from(regions).orderBy(asc(regions.nama)),
      agencies: await tx.select({ id: agencies.id, nama: agencies.nama }).from(agencies).orderBy(asc(agencies.nama)),
    };
  }, { isolationLevel: 'repeatable read', readOnly: true });
}
