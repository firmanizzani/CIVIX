// Runs against the configured DB/storage using isolated temporary reports, removed in finally.
// Usage (from backend): node --import tsx scripts/test-report-costs.mjs
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
dotenv.config();
const { default: app } = await import('../src/app.ts');
const { removeReportPhotosFromStorage } = await import('../src/modules/uploads/service.ts');
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
const id = 'qa_cost_' + randomUUID().replaceAll('-', '').slice(0, 24);
const legacyId = id + '_old';
const ticket = 'QA-' + randomUUID().slice(0, 8);
const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#008358' } }).jpeg().toBuffer();
const valid = { amount: '1000000', fundingSource: 'apbd', fundingNote: '', breakdown: 'Material dan tenaga kerja untuk perbaikan.' };
const paths = [];
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
function token(user) { return jwt.sign({ id: user.id, peran: user.peran, agencyId: user.agency_id }, process.env.AUTH_SECRET || 'dev-secret-change-in-production', { expiresIn: '5m' }); }
async function request(path, user, method = 'GET', body) {
  const multipart = body instanceof FormData;
  const res = await fetch(base + path, { method, headers: { ...(user ? { Authorization: 'Bearer ' + token(user) } : {}), ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
}
function complete(fields = valid, proof = true) {
  const form = new FormData();
  form.set('catatan', 'Perbaikan telah selesai dan diperiksa.');
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  if (proof) form.set('bukti', new Blob([image], { type: 'image/jpeg' }), 'qa.jpg');
  return form;
}
try {
  const accounts = await sql`select id, peran, agency_id from users`;
  const agency = accounts.find(user => user.peran === 'instansi' && user.agency_id);
  const foreign = accounts.find(user => user.peran === 'instansi' && user.agency_id && user.agency_id !== agency.agency_id);
  const citizen = accounts.find(user => user.peran === 'warga');
  const otherCitizen = accounts.find(user => user.peran === 'warga' && user.id !== citizen.id);
  const admin = accounts.find(user => user.peran === 'admin');
  assert.ok(agency && foreign && citizen && admin, 'Requires existing role accounts');
  const [region] = await sql`select id from regions limit 1`;
  await sql`insert into reports (id,kode_tiket,user_id,region_id,assigned_agency_id,judul,deskripsi,kategori,latitude,longitude,status,dibuat_pada)
    values (${id},${ticket},${citizen.id},${region.id},${agency.agency_id},'QA biaya penanganan','Temporary integration check','jalan_rusak',-6.2,106.8,'dikerjakan',now()-interval '100 days')`;
  await sql`insert into reports (id,kode_tiket,user_id,region_id,assigned_agency_id,judul,deskripsi,kategori,latitude,longitude,status,selesai_pada)
    values (${legacyId},${ticket + '-old'},${citizen.id},${region.id},${agency.agency_id},'QA biaya lama','Temporary integration check','jalan_rusak',-6.2,106.8,'selesai',now()-interval '100 days')`;
  for (const fields of [{ ...valid, amount: '-1' }, { ...valid, amount: '1.5' }, { ...valid, amount: '' }, { ...valid, fundingSource: 'other' }, { ...valid, breakdown: '' }]) {
    check((await request(`/agency/assignments/${id}/complete`, agency, 'POST', complete(fields))).status === 400, 'Reject invalid cost');
  }
  check((await request(`/agency/assignments/${id}/complete`, agency, 'POST', complete(valid, false))).status === 400, 'Require proof');
  const [untouched] = await sql`select status from reports where id=${id}`;
  check(untouched.status === 'dikerjakan', 'Invalid completion leaves status unchanged');
  check((await request(`/agency/assignments/${id}/complete`, foreign, 'POST', complete())).status === 403, 'Foreign agency cannot complete');
  const results = await Promise.all([request(`/agency/assignments/${id}/complete`, agency, 'POST', complete()), request(`/agency/assignments/${id}/complete`, agency, 'POST', complete())]);
  check(results.every(result => result.status === 200), 'Concurrent completion requests succeed idempotently');
  check(results.filter(result => result.data.changed).length === 1, 'Only one completion commits');
  const photos = await sql`select url from report_photos where report_id=${id}`;
  for (const photo of photos) if (!photo.url.startsWith('data:')) paths.push(decodeURIComponent(photo.url.split('/object/public/')[1].split('/').slice(1).join('/')));
  check(photos.length === 1, 'Only one proof is stored');
  const publicDetail = await request(`/reports/${id}`);
  check(publicDetail.status === 200 && publicDetail.data.cost.amount === '1000000', 'Public detail includes exact amount: ' + JSON.stringify({status: publicDetail.status, error: publicDetail.data.error, cost: publicDetail.data.cost}));
  check(!('recordedBy' in publicDetail.data.cost) && !('recordedBy' in publicDetail.data.cost.revisions[0]), 'Actor IDs are private');
  for (const [path, user] of [[`/admin/reports/${id}`, admin], [`/citizen/reports/${id}`, citizen], [`/agency/assignments/${id}`, agency]]) {
    const detail = await request(path, user);
    check(detail.status === 200 && detail.data.cost.amount === '1000000', 'Role detail synchronized');
  }
  for (const [path, user, listKey] of [
    ['/reports?view=cards&limit=50', null, null],
    ['/reports/map', null, null],
    ['/admin/overview', admin, 'items'],
    ['/agency/overview', agency, 'items'],
    ['/reports/me/reports?view=workspace&limit=50', citizen, 'items'],
    ['/citizen/map', citizen, null],
  ]) {
    const result = await request(path, user);
    check(result.status === 200 && (listKey ? result.data[listKey] : result.data).some(row => row.id === id && row.cost?.amount === '1000000'), 'Cost badge data synchronized: ' + path);
  }
  check((await request(`/agency/assignments/${id}/cost`, foreign, 'PATCH', { ...valid, reason: 'Koreksi pengeluaran' })).status === 403, 'Foreign agency cannot correct');
  check((await request(`/agency/assignments/${id}/cost`, citizen, 'PATCH', { ...valid, reason: 'Koreksi pengeluaran' })).status === 403, 'Citizen cannot correct');
  check((await request(`/agency/assignments/${id}/cost`, agency, 'PATCH', { ...valid, reason: '' })).status === 400, 'Correction reason required');
  const correction = { ...valid, amount: '0', fundingSource: 'other', fundingNote: 'Dukungan sarana operasional', reason: 'Tidak ada biaya tambahan setelah diperiksa.' };
  check((await request(`/agency/assignments/${id}/cost`, agency, 'PATCH', correction)).status === 200, 'Zero cost and other source supported');
  check((await request(`/agency/assignments/${id}/cost`, agency, 'PATCH', correction)).data.changed === false, 'Correction retry creates no duplicate');
  const [counts] = await sql`select (select count(*) from report_cost_revisions where report_id=${id})::int as revisions,(select count(*) from report_status_logs where report_id=${id})::int as logs`;
  check(counts.revisions === 2 && counts.logs === 1, 'One status event and two distinct financial revisions');
  const overview = await request('/stats/costs?days=7&limit=50');
  check(overview.status === 200 && overview.data.rows.some(row => row.id === id && row.cost.amount === '0'), 'Stats use completion date, include Rp0');
  check(overview.data.rows.every(row => row.id !== legacyId), 'Old completion outside selected period');
  for (const [role, user] of [['agency', agency], ['citizen', citizen], ['admin', admin]]) {
    const result = await request(`/${role}/costs?days=7&limit=50`, user);
    check(result.status === 200 && result.data.rows.some(row => row.id === id), 'Dashboard cost scope connected');
  }
  if (otherCitizen) check(!(await request('/citizen/costs?limit=50', otherCitizen)).data.rows.some(row => row.id === id), 'Other citizen sees only own report totals');
  check((await request(`/agency/assignments/${legacyId}/cost`, agency, 'PATCH', { ...valid, reason: 'Melengkapi biaya laporan lama.' })).status === 200, 'Legacy completed reports can receive costs');
  const filtered = await request(`/stats/costs?agencyId=${agency.agency_id}&regionId=${region.id}&limit=1`);
  check(filtered.status === 200 && filtered.data.rows.length === 1 && filtered.data.pageSize === 1, 'Financial drilldown filters and pagination');
  check((await request('/stats/costs?days=-1')).status === 400, 'Reject invalid filter');
  console.log(`PASS: ${checks} cost workflow checks.`);
} finally {
  const photos = await sql`select url from report_photos where report_id in (${id},${legacyId})`;
  for (const photo of photos) if (!photo.url.startsWith('data:')) paths.push(decodeURIComponent(photo.url.split('/object/public/')[1].split('/').slice(1).join('/')));
  await removeReportPhotosFromStorage([...new Set(paths)]);
  await sql`delete from reports where id in (${id},${legacyId})`;
  await sql.end();
  server.close();
}
process.exit(0);
