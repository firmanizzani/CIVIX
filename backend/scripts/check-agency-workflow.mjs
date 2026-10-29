// Integration check using uniquely named, temporary QA reports and one QA account.
// Existing reports/accounts are never edited; generated rows/files are cleaned up.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const base = process.env.CIVIX_TEST_API || 'http://127.0.0.1:3000/api/v1';
assert.ok(process.env.CIVIX_TEST_EMAIL && process.env.CIVIX_TEST_PASSWORD && process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const storage = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'civix-reports';
const ids = [];
let memberId;
const memberEmail = `civix-qa-${randomUUID()}@example.invalid`;
const auth = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.CIVIX_TEST_EMAIL, password: process.env.CIVIX_TEST_PASSWORD }) });
assert.equal(auth.status, 200);
const { token, user } = await auth.json();
assert.equal(user.peran, 'instansi');
assert.ok(user.agencyId);
const request = async (path, method = 'GET', body) => {
  const multipart = body instanceof FormData;
  const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(!multipart ? { 'Content-Type': 'application/json' } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  return { status: response.status, data: await response.json() };
};
const makeReport = async status => {
  const id = `qa_${randomUUID()}`;
  const ticket = `QA-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  await sql`INSERT INTO reports (id, kode_tiket, assigned_agency_id, judul, deskripsi, kategori, latitude, longitude, status)
    VALUES (${id}, ${ticket}, ${user.agencyId}, 'CIVIX temporary workflow check', 'Temporary automated QA fixture; removed after verification.', 'jalan_rusak', -6.2088, 106.8456, ${status})`;
  ids.push(id); return id;
};
try {
  // Completion accepts both assigned and in-progress work, with exactly one submit.
  for (const status of ['ditugaskan', 'dikerjakan']) {
    const id = await makeReport(status);
    const missing = await request(`/agency/assignments/${id}/complete`, 'POST', new FormData());
    assert.equal(missing.status, 400, 'Photo evidence is required');
    assert.equal((await request(`/agency/assignments/${id}`)).data.status, status, 'Invalid submit leaves status unchanged');
    const form = new FormData();
    form.append('catatan', 'QA completion note submitted together with photo evidence.');
    form.append('bukti', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTfoAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'qa-proof.png');
    const done = await request(`/agency/assignments/${id}/complete`, 'POST', form);
    assert.equal(done.status, 200, JSON.stringify(done.data));
    const detail = (await request(`/agency/assignments/${id}`)).data;
    assert.equal(detail.status, 'selesai');
    assert.ok(detail.selesaiPada);
    assert.equal(detail.photos.filter(photo => photo.jenis === 'bukti_perbaikan').length, 1);
    assert.ok(detail.statusLogs.some(log => log.status === 'selesai' && log.catatan.includes('QA completion note')));
    const published = (await request(`/reports/${id}`)).data;
    assert.equal(published.status, 'selesai');
    assert.ok(published.photos.some(photo => photo.jenis === 'bukti_perbaikan'));
    const retry = await request(`/agency/assignments/${id}/complete`, 'POST', form);
    assert.equal(retry.status, 200);
    assert.equal(retry.data.changed, false, 'Duplicate submits do not add photos/history');
    assert.equal((await request(`/agency/assignments/${id}`)).data.photos.length, 1);
  }
  const rejectedId = await makeReport('ditugaskan');
  const rejected = await request(`/agency/assignments/${rejectedId}/reject`, 'POST', { alasan: 'QA temporary rejection reason' });
  assert.equal(rejected.status, 200);
  assert.equal((await request(`/reports/${rejectedId}`)).data.status, 'ditolak');
  const rejectedList = await request('/agency/assignments?view=workspace&status=ditolak&search=CIVIX%20temporary');
  assert.ok(rejectedList.data.items.some(row => row.id === rejectedId));
  const forbiddenProfile = await request('/agency/profile', 'PATCH', { nama: 'QA', deskripsi: '', id: 'another-unit' });
  assert.equal(forbiddenProfile.status, 400);
  const member = await request('/agency/members', 'POST', { nama: 'CIVIX Temporary QA Petugas', email: memberEmail, password: randomUUID() });
  assert.equal(member.status, 201, JSON.stringify(member.data));
  memberId = member.data.id;
  assert.equal(member.data.peran, 'instansi');
  assert.ok((await request('/agency/profile')).data.users.some(row => row.id === memberId));
  console.log('Agency workflow passed: assigned/in-progress → completed, notes + photo evidence, duplicate-submit safety, public synchronization, rejection history and scoped member creation.');
} finally {
  if (ids.length) {
    const photos = await sql`SELECT url FROM report_photos WHERE report_id IN ${sql(ids)}`;
    if (storage) {
      const prefix = `/storage/v1/object/public/${bucket}/`;
      const paths = photos.map(photo => { try { const path = new URL(photo.url).pathname; return path.includes(prefix) ? decodeURIComponent(path.slice(path.indexOf(prefix) + prefix.length)) : null; } catch { return null; } }).filter(Boolean);
      if (paths.length) { const removed = await storage.storage.from(bucket).remove(paths); assert.ifError(removed.error); }
    }
    await sql`DELETE FROM reports WHERE id IN ${sql(ids)} AND judul = 'CIVIX temporary workflow check'`;
  }
  if (memberId) await sql`DELETE FROM users WHERE id = ${memberId} AND email = ${memberEmail}`;
  await sql.end();
  console.log('Temporary QA reports, evidence files and account cleaned up.');
}
