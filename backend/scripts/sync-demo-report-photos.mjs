import dotenv from 'dotenv';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: resolve(projectRoot, 'backend/.env') });

// Explicitly scoped to the 13 reports reviewed for this mockup refresh.
const targets = [
  ['report_007', 'aa', 'pothole-neighborhood'],
  ['report_006', 'Jalan retak', 'cracked-road'],
  ['report_005', 'Halte rusak di Jl. Daan Mogot', 'bus-stop'],
  ['report_004', 'Sampah menumpuk di trotoar Cawang', 'garbage'],
  ['report_003', 'Lampu jalan mati di Jl. Pangeran Jayakarta', 'streetlight'],
  ['report_002', 'Drainase tersumbat di Kebayoran Baru', 'blocked-drain'],
  ['report_001', 'Jalan berlubang di Jl. Sudirman', 'pothole'],
  ['report_019', 'Trotoar retak di sekitar Monas', 'cracked-sidewalk'],
  ['report_018', 'Halte bus rusak di Jl. Gatot Subroto', 'bus-stop-gatot'],
  ['report_017', 'Lampu jalan mati di kawasan Senen', 'streetlight-senen'],
  ['report_013', 'Sampah menumpuk di trotoar Kemang', 'garbage-kemang'],
  ['report_012', 'Saluran drainase tersumbat di Cikini', 'drain-cikini'],
  ['report_011', 'Jalan berlubang di Jl. Kramat Raya', 'pothole-kramat'],
].map(([id, title, asset]) => ({ id, title, asset }));
if (new Set(targets.map((target) => target.asset)).size !== targets.length) {
  throw new Error('Each report must have its own distinct demo image.');
}

const digest = (value) => createHash('sha256').update(value).digest('hex');
const apply = process.argv.includes('--apply');
const backupIndex = process.argv.indexOf('--backup-dir');
const backupDir = backupIndex >= 0 ? resolve(process.argv[backupIndex + 1]) : null;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (apply && !backupDir) throw new Error('An explicit --backup-dir is required with --apply.');
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 15 });

try {
  const ids = targets.map((target) => target.id);
  const reports = await sql`select id, kode_tiket, judul from reports where id in ${sql(ids)}`;
  const photos = await sql`select id, report_id, url, jenis, dibuat_pada from report_photos where report_id in ${sql(ids)} order by id`;
  for (const target of targets) {
    if (reports.find((report) => report.id === target.id)?.judul !== target.title) {
      throw new Error(`Report missing or title changed: ${target.id}. Review the mapping before proceeding.`);
    }
  }
  const initialPhotos = photos.filter((photo) => photo.jenis === 'awal');
  const proofFingerprint = (rows) => rows.filter((photo) => photo.jenis === 'bukti_perbaikan')
    .map((photo) => ({ id: photo.id, sha256: digest(photo.url) })).sort((a, b) => a.id.localeCompare(b.id));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', reports: targets.length,
    existingInitialPhotos: initialPhotos.length,
    missingInitialPhotos: targets.filter((target) => !initialPhotos.some((photo) => photo.report_id === target.id)).length,
    assets: new Set(targets.map((target) => target.asset)).size,
    completionPhotosPreserved: proofFingerprint(photos).length }, null, 2));
  if (apply) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase Storage credentials are required.');
    const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'civix-reports';
    const { data: bucketData, error: bucketError } = await storage.storage.getBucket(bucket);
    if (bucketError) throw new Error(bucketError.message);
    if (!bucketData.public) throw new Error('The report-photo bucket must already be public.');

    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = resolve(backupDir, `demo-report-photos-before-${stamp}.json`);
    await writeFile(backupPath, JSON.stringify({ reports, initialPhotos, completionPhotoFingerprints: proofFingerprint(photos) }, null, 2), { flag: 'wx' });
    console.log(`Original photo links backed up to ${backupPath}`);

    const uploaded = new Map();
    const imageHashes = new Set();
    for (const asset of new Set(targets.map((target) => target.asset))) {
      const buffer = await readFile(resolve(projectRoot, `frontend/src/assets/report-demo-photos/${asset}.webp`));
      if (buffer.subarray(0, 4).toString() !== 'RIFF' || buffer.subarray(8, 12).toString() !== 'WEBP') throw new Error(`Invalid WebP: ${asset}`);
      if (buffer.length > (bucketData.file_size_limit || 5000000)) throw new Error(`Asset exceeds bucket size limit: ${asset}`);
      const hash = digest(buffer);
      if (imageHashes.has(hash)) throw new Error(`Duplicate image content detected: ${asset}`);
      imageHashes.add(hash);
      const objectPath = `reports/demo-assets/2026-10-28/${asset}-${hash.slice(0, 12)}.webp`;
      const { error } = await storage.storage.from(bucket).upload(objectPath, buffer, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (error && error.statusCode !== '409' && error.statusCode !== 409 && error.message !== 'The resource already exists') throw new Error(`${asset}: ${error.message}`);
      const { data } = storage.storage.from(bucket).getPublicUrl(objectPath);
      const response = await fetch(data.publicUrl, { signal: AbortSignal.timeout(20000) });
      if (!response.ok || digest(Buffer.from(await response.arrayBuffer())) !== hash) throw new Error(`Public photo verification failed: ${asset}`);
      uploaded.set(asset, data.publicUrl);
      console.log(`Uploaded and verified ${asset}: ${buffer.length} bytes`);
    }
    if (new Set(uploaded.values()).size !== targets.length) throw new Error('Duplicate report images detected.');

    await sql.begin(async (tx) => {
      for (const target of targets) {
        const [current] = await tx`select judul from reports where id = ${target.id} for update`;
        if (current?.judul !== target.title) throw new Error(`Report changed during upload: ${target.id}`);
        const before = initialPhotos.filter((photo) => photo.report_id === target.id).map(({ id, url }) => ({ id, url }));
        const currentPhotos = await tx`select id, url from report_photos where report_id = ${target.id} and jenis = 'awal' order by id for update`;
        if (JSON.stringify(currentPhotos) !== JSON.stringify(before)) throw new Error(`Photos changed during upload: ${target.id}`);
        const url = uploaded.get(target.asset);
        if (currentPhotos.length) {
          await tx`update report_photos set url = ${url} where report_id = ${target.id} and jenis = 'awal'`;
        } else {
          await tx`insert into report_photos (report_id, url, jenis) values (${target.id}, ${url}, 'awal')`;
        }
      }
      const after = await tx`select id, report_id, url, jenis from report_photos where report_id in ${sql(ids)} order by id`;
      if (JSON.stringify(proofFingerprint(after)) !== JSON.stringify(proofFingerprint(photos))) throw new Error('Completion-photo verification failed.');
      if (targets.some((target) => !after.some((photo) => photo.report_id === target.id && photo.jenis === 'awal' && photo.url === uploaded.get(target.asset)))) throw new Error('Report-photo verification failed.');
    });
    const manifest = targets.map((target) => ({ ...target, url: uploaded.get(target.asset), source: 'AI-generated mockup asset' }));
    await writeFile(resolve(backupDir, `demo-report-photos-after-${stamp}.json`), JSON.stringify(manifest, null, 2), { flag: 'wx' });
    console.log('Successfully refreshed initial photos for all 13 reports. Completion photos were preserved.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
