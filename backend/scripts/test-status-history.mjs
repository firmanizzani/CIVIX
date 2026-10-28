import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const sql = postgres(process.env.DATABASE_URL, { max: 2, prepare: false });
const base = process.env.TEST_API_URL || 'http://localhost:3000/api/v1';
const stamp = Date.now();
const ids = [`report_status_test_${stamp}`, `report_race_test_${stamp}`];
const request = async (path, token, body) => {
  const response = await fetch(base + path, { method: 'POST', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return { status: response.status, body: await response.json() };
};
const login = async (email) => {
  const response = await request('/auth/login', null, { email, password: 'demo1234' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.token;
};
try {
  const [adminToken, agencyToken, otherAgencyToken] = await Promise.all([
    login('admin@demo.com'), login('instansi@demo.com'), login('air@demo.com'),
  ]);
  const [agencyUser] = await sql`select agency_id from users where email='instansi@demo.com'`;
  for (const [index, id] of ids.entries()) await sql`
    insert into reports (id,kode_tiket,judul,deskripsi,kategori,latitude,longitude,status)
    values (${id},${`TEST-${stamp}-${index}`},'Temporary concurrency test','Removed after verification','lainnya',-6.2,106.8,'diterima')`;
  const logs = async (id, status) => sql`select * from report_status_logs where report_id=${id} and status=${status}`;
  const post = (action, token, body = {}) => request(action, token, body);

  const verify = await Promise.all(Array.from({ length: 8 }, () => post(`/admin/reports/${ids[0]}/verify`, adminToken)));
  assert(verify.every((response) => response.status === 200), JSON.stringify(verify));
  assert.equal((await logs(ids[0], 'diverifikasi')).length, 1, 'Concurrent verification must create one event.');
  assert.equal((await post(`/admin/reports/${ids[0]}/reject`, adminToken, { alasan: 'Invalid stale action' })).status, 409);
  assert.equal((await post('/admin/reports/nonexistent-test/verify', adminToken)).status, 404);

  const assign = await Promise.all(Array.from({ length: 6 }, () => post(`/admin/reports/${ids[0]}/assign`, adminToken, { agencyId: agencyUser.agency_id })));
  assert(assign.every((response) => response.status === 200), JSON.stringify(assign));
  assert.equal((await logs(ids[0], 'ditugaskan')).length, 1);
  const assignments = await sql`select id from report_assignments where report_id=${ids[0]}`;
  assert.equal(assignments.length, 1, 'Repeated assignment must not duplicate assignments.');
  assert.equal((await post(`/agency/assignments/${ids[0]}/progress`, otherAgencyToken, { status: 'dikerjakan' })).status, 403);

  const progress = await Promise.all(Array.from({ length: 6 }, () => post(`/agency/assignments/${ids[0]}/progress`, agencyToken, { status: 'dikerjakan', catatan: 'Initial test progress' })));
  assert(progress.every((response) => response.status === 200), JSON.stringify(progress));
  assert.equal((await logs(ids[0], 'dikerjakan')).length, 1);
  assert.equal((await post(`/agency/assignments/${ids[0]}/progress`, agencyToken, { status: 'selesai' })).status, 400);
  assert.equal((await post(`/agency/assignments/${ids[0]}/complete`, agencyToken)).status, 400);
  const [stillWorking] = await sql`select status from reports where id=${ids[0]}`;
  assert.equal(stillWorking.status, 'dikerjakan', 'Completion without evidence must not change state.');

  const notes = await Promise.all(Array.from({ length: 6 }, () => post(`/agency/assignments/${ids[0]}/progress`, agencyToken, { status: 'dikerjakan', catatan: 'Distinct meaningful progress update' })));
  assert(notes.every((response) => response.status === 200));
  assert.equal((await logs(ids[0], 'dikerjakan')).length, 2, 'Keep distinct notes, deduplicate identical retries.');

  const race = await Promise.all([
    post(`/admin/reports/${ids[1]}/verify`, adminToken),
    post(`/admin/reports/${ids[1]}/reject`, adminToken, { alasan: 'Concurrent reject test' }),
  ]);
  assert.deepEqual(race.map((response) => response.status).sort(), [200, 409]);
  const raceEvents = await sql`select id from report_status_logs where report_id=${ids[1]}`;
  assert.equal(raceEvents.length, 1, 'Only one competing state transition may commit.');

  const rollbackProbe = new Error('Rollback database constraint probes');
  try {
    await sql.begin(async (tx) => {
      const duplicates = await tx`
        insert into report_status_logs (report_id,diubah_oleh,status,catatan,waktu)
        select report_id,diubah_oleh,status,catatan,waktu from report_status_logs where report_id=${ids[0]}
        on conflict do nothing returning id`;
      assert.equal(duplicates.length, 0, 'Database must reject exact event duplicates.');
      const longNote = 'x'.repeat(4000);
      const first = await tx`insert into report_status_logs (report_id,status,catatan,waktu) values (${ids[0]},'dikerjakan',${longNote},'2026-01-01T00:00:00Z') returning id`;
      assert.equal(first.length, 1, 'Long notes must fit the unique-event index.');
      const retry = await tx`insert into report_status_logs (report_id,status,catatan,waktu) values (${ids[0]},'dikerjakan',${longNote},'2026-01-01T00:00:00Z') on conflict do nothing returning id`;
      assert.equal(retry.length, 0, 'Nullable actor must not bypass the uniqueness guard.');
      const distinct = await tx`insert into report_status_logs (report_id,status,catatan,waktu) values (${ids[0]},'dikerjakan','A different note','2026-01-01T00:00:00Z') returning id`;
      assert.equal(distinct.length, 1);
      throw rollbackProbe;
    });
  } catch (error) { if (error !== rollbackProbe) throw error; }
  console.log('PASS: concurrent verify/assign/progress, stale actions, agency scope, completion evidence, distinct notes, and database uniqueness.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Only the two explicitly created test reports are removed; cascades remove their test history.
  await sql`delete from reports where id in ${sql(ids)}`;
  await sql.end({ timeout: 5 });
}
