import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { reports, reportStatusLogs } from '../../db/schema.js';
import { costInput, saveReportCost } from './costs.js';
import type { z } from 'zod';

type Status = typeof reports.$inferSelect.status;

export const reportStatusHistory = {
  columns: { diubahOleh: false },
  orderBy: [desc(reportStatusLogs.waktu), desc(reportStatusLogs.id)],
  with: {
    user: {
      columns: { peran: true },
      with: { agency: { columns: { nama: true } } },
    },
  },
} as const;

export class ReportTransitionError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

interface Transition {
  reportId: string;
  actorId: string;
  status: Status;
  allowedFrom: Status[];
  note: string;
  agencyId?: string | null;
  requiredAgencyId?: string;
  allowNoteUpdate?: boolean;
  completedAt?: Date | null;
  cost?: z.output<typeof costInput>;
  beforeChange?: (tx: any, report: typeof reports.$inferSelect) => Promise<void>;
}

// A per-report row lock serializes retries and concurrent status changes.
// Report state, assignment/evidence, and history always commit together.
export async function transitionReport(options: Transition) {
  return db.transaction(async (tx) => {
    const [report] = await tx.select().from(reports).where(eq(reports.id, options.reportId)).for('update');
    if (!report) throw new ReportTransitionError(404, 'Laporan tidak ditemukan');
    if (options.requiredAgencyId && report.assignedAgencyId !== options.requiredAgencyId) {
      throw new ReportTransitionError(403, 'Tugas ini tidak ditugaskan ke instansi Anda');
    }
    const sameStatus = report.status === options.status;
    const sameAgency = options.agencyId === undefined || report.assignedAgencyId === options.agencyId;
    if (sameStatus && sameAgency) {
      if (!options.allowNoteUpdate || !options.note.trim()) return { changed: false, report };
      const latest = await tx.query.reportStatusLogs.findFirst({
        where: eq(reportStatusLogs.reportId, report.id),
        orderBy: [desc(reportStatusLogs.waktu), desc(reportStatusLogs.id)],
      });
      if (latest?.status === options.status && latest.diubahOleh === options.actorId && latest.catatan === options.note) {
        return { changed: false, report };
      }
    }
    if (!options.allowedFrom.includes(report.status)) {
      throw new ReportTransitionError(409, 'Status laporan telah berubah. Muat ulang laporan sebelum melanjutkan.');
    }
    await options.beforeChange?.(tx, report);
    if (options.cost) {
      if (!report.assignedAgencyId || options.status !== 'selesai') throw new ReportTransitionError(409, 'Biaya memerlukan tugas penyelesaian instansi.');
      await saveReportCost(tx, options.cost, report.id, report.assignedAgencyId, options.actorId, 'Dicatat saat penyelesaian laporan.');
    }
    const patch: Record<string, unknown> = { status: options.status };
    if (options.agencyId !== undefined) patch.assignedAgencyId = options.agencyId;
    if (options.completedAt !== undefined) patch.selesaiPada = options.completedAt;
    const [updated] = await tx.update(reports).set(patch).where(eq(reports.id, report.id)).returning();
    await tx.insert(reportStatusLogs).values({
      reportId: report.id, diubahOleh: options.actorId,
      status: options.status, catatan: options.note,
    });
    return { changed: true, report: updated };
  });
}
