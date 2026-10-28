import dotenv from 'dotenv';
import postgres from 'postgres';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: resolve(root, 'backend/.env') });
const apply = process.argv.includes('--apply');
const backupIndex = process.argv.indexOf('--backup-dir');
if (apply && backupIndex < 0) throw new Error('--backup-dir is required when applying the repair.');
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  await sql.begin(async (tx) => {
    if (apply) await tx`lock table report_status_logs in share row exclusive mode`;
    const history = await tx`select id, report_id, diubah_oleh, status, catatan, waktu::text as waktu from report_status_logs order by id`;
    // Explicit, one-time repair for the pre-2026-10-28 seed that synthesized
    // events over real histories. Never run this heuristic for future events.
    const legacyArtifacts = process.argv.includes('--remove-legacy-seed-artifacts') ? await tx`
      with seed_events as (
        select l.*, case l.status
          when 'diterima' then date_trunc('milliseconds', r.dibuat_pada)
          when 'diverifikasi' then date_trunc('milliseconds', r.dibuat_pada) + interval '2 hours'
          when 'ditugaskan' then date_trunc('milliseconds', r.dibuat_pada) + interval '4 hours'
          when 'dikerjakan' then date_trunc('milliseconds', r.dibuat_pada) + interval '1 day'
          when 'selesai' then date_trunc('milliseconds', r.selesai_pada) end as generated_at
        from report_status_logs l join reports r on r.id = l.report_id
        where (l.status = 'diterima' and l.catatan = 'Laporan berhasil dibuat dan masuk antrean verifikasi')
          or (l.status = 'diverifikasi' and l.catatan = 'Laporan telah diverifikasi oleh administrator')
          or (l.status = 'ditugaskan' and l.catatan = 'Ditugaskan ke instansi terkait')
          or (l.status = 'dikerjakan' and l.catatan = 'Pekerjaan dimulai oleh instansi')
          or (l.status = 'selesai' and l.catatan = 'Pekerjaan selesai, bukti perbaikan telah diunggah')
      ) select s.id from seed_events s
      where s.waktu = s.generated_at and s.waktu < '2026-10-28T00:00:00Z'
        and exists (select 1 from report_status_logs actual where actual.report_id = s.report_id
          and actual.status = s.status and actual.waktu <> s.generated_at
          and (s.status <> 'diterima' or actual.catatan = s.catatan))` : [];
    const placeholderNotes = history.filter((row) => row.catatan === 'Data dummy September 2026 untuk demonstrasi statistik.').length;
    const duplicates = await tx`
      select l.id, l.report_id, l.diubah_oleh, l.status, l.catatan, l.waktu::text as waktu
      from report_status_logs l
      where l.id in (
        select id from (
          select id, row_number() over (
            partition by report_id, status, waktu, diubah_oleh, catatan order by id
          ) as position from report_status_logs
        ) ranked where position > 1
      ) order by l.id`;
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', exactDuplicateRows: duplicates.length, placeholderNotes, legacySeedArtifacts: legacyArtifacts.length }));
    if (!apply) return;
    const folder = resolve(process.argv[backupIndex + 1]);
    await mkdir(folder, { recursive: true });
    const backup = resolve(folder, `status-history-before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await writeFile(backup, JSON.stringify(history, null, 2), { flag: 'wx' });
    console.log(`Backup saved: ${backup}`);
    if (legacyArtifacts.length) await tx`delete from report_status_logs where id in ${tx(legacyArtifacts.map((row) => row.id))}`;
    const migration = await readFile(resolve(root, 'backend/drizzle/0005_prevent_duplicate_status_events.sql'), 'utf8');
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) await tx.unsafe(statement);
    }
    const [remaining] = await tx`
      select count(*)::int as groups from (
        select 1 from report_status_logs group by report_id, status, waktu, diubah_oleh, catatan having count(*) > 1
      ) duplicates`;
    if (remaining.groups !== 0) throw new Error('Duplicate verification failed.');
    console.log(JSON.stringify({ removed: duplicates.length, archivedLegacyArtifacts: legacyArtifacts.length, clearedPlaceholderNotes: placeholderNotes, remainingDuplicateGroups: remaining.groups, uniqueEventIndexInstalled: true }));
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await sql.end({ timeout: 5 }); }
