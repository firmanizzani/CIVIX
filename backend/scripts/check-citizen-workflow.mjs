// Development-only integration test. Existing accounts/reports are never changed.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
const base = process.env.CIVIX_TEST_API || 'http://127.0.0.1:3000/api/v1';
assert.ok(process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const storage = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'civix-reports';
const accounts = [], uploads = [];
let token;
async function request(path, method = 'GET', body, auth = token) {
  const multipart = body instanceof FormData;
  const response = await fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(!multipart ? { 'Content-Type': 'application/json' } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  return { status: response.status, data: await response.json() };
}
async function register() {
  const email = `civix-citizen-qa-${randomUUID()}@example.invalid`;
  const result = await request('/auth/register', 'POST', { nama: 'CIVIX Temporary Citizen QA', email, password: randomUUID() }, null);
  assert.equal(result.status, 201, JSON.stringify(result.data)); accounts.push({ id: result.data.user.id, email }); return result.data;
}
const image = () => new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTfoAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' });
function reportForm(regionId) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ judul: 'CIVIX temporary citizen workflow check', deskripsi: 'Temporary QA evidence removed after the test.', namaJalan: 'Jl. Medan Merdeka, Jakarta Pusat', kategori: 'jalan_rusak', latitude: '-6.2088', longitude: '106.8456', regionId, anonim: 'true' })) data.append(key, value);
  data.append('photos', image(), 'qa-citizen.png'); return data;
}
try {
  assert.equal((await request('/citizen/profile', 'GET', undefined, null)).status, 401);
  const account = await register(); token = account.token;
  const regions = await request('/reports/regions'); assert.equal(regions.status, 200); assert.ok(regions.data.length);
  let profile = await request('/citizen/profile'); assert.equal(profile.status, 200); assert.equal(profile.data.telepon, ''); assert.equal(profile.data.notifyReportUpdates, true); assert.equal(profile.data.passwordHash, undefined);
  assert.equal((await request('/citizen/profile', 'PATCH', { nama: 'Unauthorized reassignment', telepon: '', alamat: '', userId: 'another-user' })).status, 400);
  assert.equal((await request('/citizen/profile', 'PATCH', { nama: 'QA Updated Citizen', telepon: '+62 812-0000-0000', alamat: 'QA fixture address' })).status, 200);
  profile = await request('/citizen/profile'); assert.equal(profile.data.nama, 'QA Updated Citizen'); assert.equal(profile.data.alamat, 'QA fixture address'); assert.equal((await request('/auth/me')).data.nama, 'QA Updated Citizen');
  assert.equal((await request('/citizen/preferences', 'PATCH', { notifyReportUpdates: false })).status, 200); assert.equal((await request('/citizen/profile')).data.notifyReportUpdates, false);
  const badAvatar = new FormData(); badAvatar.append('avatar', new Blob(['text'], { type: 'text/plain' }), 'qa.txt'); assert.equal((await request('/citizen/avatar', 'POST', badAvatar)).status, 400);
  const avatar = new FormData(); avatar.append('avatar', image(), 'qa-avatar.png'); const uploaded = await request('/citizen/avatar', 'POST', avatar); assert.equal(uploaded.status, 200, JSON.stringify(uploaded.data)); uploads.push(uploaded.data.avatarUrl); assert.equal((await request('/citizen/profile')).data.avatarUrl, uploaded.data.avatarUrl);
  assert.equal((await request('/reports', 'POST', reportForm('invalid-region'))).status, 400);
  const created = await request('/reports', 'POST', reportForm(regions.data[0].id)); assert.equal(created.status, 201, JSON.stringify(created.data)); const id = created.data.id;
  const detail = await request('/citizen/reports/' + id); assert.equal(detail.status, 200); assert.equal(detail.data.photos.length, 1); assert.equal(detail.data.statusLogs.length, 1); assert.equal(detail.data.regionId, regions.data[0].id);
  assert.equal((await request('/reports/' + id)).data.userId, null, 'Anonymous detail hides reporter');
  for (const status of ['diverifikasi', 'ditugaskan', 'dikerjakan', 'selesai', 'ditolak', 'duplikat']) {
    const fixtureId = `qa_${randomUUID().replaceAll('-', '').slice(0, 30)}`;
    await sql`INSERT INTO reports (id, kode_tiket, user_id, region_id, judul, deskripsi, kategori, latitude, longitude, status, selesai_pada) VALUES (${fixtureId}, ${'QA-' + randomUUID().slice(0, 16)}, ${account.user.id}, ${regions.data[0].id}, 'CIVIX temporary citizen fixture', 'Temporary fixture', 'jalan_rusak', -6.2088, 106.8456, ${status}, ${status === 'selesai' ? new Date('2020-01-01').toISOString() : null})`;
  }
  const all = await request('/reports/me/reports?view=workspace&limit=3'); assert.equal(all.data.totalAll, 7); assert.equal(all.data.total, 7); assert.equal(Object.values(all.data.counts).reduce((sum, value) => sum + value, 0), 7); assert.equal(all.data.items.length, 3);
  for (const [status, count] of [['aktif', 4], ['selesai', 1], ['ditolak_duplikat', 2]]) assert.equal((await request('/reports/me/reports?view=workspace&status=' + status)).data.total, count);
  assert.equal((await request('/reports/me/reports?view=workspace&limit=3&page=3')).data.items.length, 1);
  assert.equal((await request('/reports/me/reports?view=workspace&kategori=sampah')).data.total, 0);
  assert.equal((await request('/reports/me/reports?view=workspace&search=' + encodeURIComponent(created.data.kodeTiket))).data.total, 1);
  const ownMap = await request('/citizen/map'); assert.equal(ownMap.status, 200); assert.equal(ownMap.data.filter(row => row.owned).length, 7); assert.ok(ownMap.data.every(row => row.userId === undefined));
  const publicMap = await request('/reports/map'); const ownedIds = ownMap.data.filter(row => row.owned).map(row => row.id); assert.equal(publicMap.data.filter(row => ownedIds.includes(row.id)).length, 4, 'Public map excludes closed and expired completed reports');
  const other = await register(); assert.equal((await request('/citizen/reports/' + id, 'GET', undefined, other.token)).status, 404); assert.equal((await request('/reports/me/reports?view=workspace', 'GET', undefined, other.token)).data.totalAll, 0);
  assert.ok((await request('/citizen/updates')).data.some(row => row.id === id));
  if (process.env.CIVIX_TEST_ADMIN_EMAIL && process.env.CIVIX_TEST_ADMIN_PASSWORD) {
    const login = await request('/auth/login', 'POST', { email: process.env.CIVIX_TEST_ADMIN_EMAIL, password: process.env.CIVIX_TEST_ADMIN_PASSWORD }, null); assert.equal(login.status, 200); const admin = login.data.token;
    assert.equal((await request('/citizen/profile', 'GET', undefined, admin)).status, 403);
    assert.equal((await request('/admin/reports/' + id, 'GET', undefined, admin)).data.user.id, account.user.id);
    assert.equal((await request('/admin/reports/' + id + '/verify', 'POST', { catatan: 'QA verified by administrator' }, admin)).status, 200);
    const after = await request('/citizen/reports/' + id); assert.equal(after.data.status, 'diverifikasi'); assert.ok(after.data.statusLogs.some(log => log.catatan === 'QA verified by administrator'));
    assert.equal((await request('/reports/' + id)).data.status, 'diverifikasi'); assert.equal((await request('/citizen/updates')).data.find(row => row.id === id).status, 'diverifikasi');
  }
  console.log('Citizen integration passed: creation + evidence, profile/avatar/preferences persistence, counts/filters/pagination, private scope, public map retention, anonymous detail, admin status synchronization.');
} finally {
  if (accounts.length) {
    const ids = accounts.map(account => account.id);
    const photos = await sql`SELECT p.url FROM report_photos p JOIN reports r ON r.id = p.report_id WHERE r.user_id IN ${sql(ids)}`; uploads.push(...photos.map(photo => photo.url));
    const avatars = await sql`SELECT avatar_url FROM citizen_profiles WHERE user_id IN ${sql(ids)}`; uploads.push(...avatars.map(row => row.avatar_url));
    if (storage) {
      const prefix = `/storage/v1/object/public/${bucket}/`;
      const paths = [...new Set(uploads.filter(Boolean).map(url => { try { const path = new URL(url).pathname; return path.includes(prefix) ? decodeURIComponent(path.slice(path.indexOf(prefix) + prefix.length)) : null; } catch { return null; } }).filter(Boolean))];
      if (paths.length) { const removed = await storage.storage.from(bucket).remove(paths); assert.ifError(removed.error); }
    }
    await sql`DELETE FROM reports WHERE user_id IN ${sql(ids)}`;
    for (const account of accounts) await sql`DELETE FROM users WHERE id = ${account.id} AND email = ${account.email}`;
  }
  await sql.end(); console.log('Temporary citizen QA accounts, reports, profiles and uploaded files cleaned up.');
}
