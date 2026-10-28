import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const base = process.env.TEST_API_URL || 'http://localhost:3000/api/v1';
async function login(email) {
  const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'demo1234' }) });
  assert.equal(response.status, 200);
  return response.json();
}
async function get(path, token, expected = 200) {
  const response = await fetch(base + path, { headers: token ? { Authorization: 'Bearer ' + token } : {}, signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
try {
  const accounts = await Promise.all(['admin@demo.com', 'warga1@demo.com', 'warga2@demo.com', 'instansi@demo.com', 'air@demo.com'].map(login));
  for (const account of accounts) {
    const role = account.user.peran;
    const path = role === 'admin' ? '/admin/reports' : role === 'instansi' ? '/agency/assignments' : '/reports/me/reports';
    const full = await get(path + '?view=workspace&limit=50', account.token);
    assert(Array.isArray(full.items));
    assert.equal(Object.values(full.counts).reduce((sum, value) => sum + value, 0), full.totalAll);
    assert.equal(full.total, full.totalAll);
    assert.equal(full.items.length, Math.min(50, full.total));
    const expected = role === 'admin' ? await sql`select id,status from reports`
      : role === 'instansi' ? await sql`select id,status from reports where assigned_agency_id=${account.user.agencyId} and status in ('ditugaskan','dikerjakan','selesai')`
      : await sql`select id,status from reports where user_id=${account.user.id}`;
    assert.equal(full.totalAll, expected.length, 'Dashboard counts must match the authorized database scope.');
    assert(full.items.every((report) => expected.some((row) => row.id === report.id)));
    for (const [status, value] of Object.entries(full.counts)) assert.equal(value, expected.filter((report) => report.status === status).length);
    const filtered = await get(path + '?view=workspace&status=selesai&limit=50', account.token);
    assert(filtered.items.every((report) => report.status === 'selesai'));
    assert.equal(filtered.total, full.counts.selesai);
    const active = await get(path + '?view=workspace&status=aktif', account.token);
    assert(active.items.every((report) => ['diterima', 'diverifikasi', 'ditugaskan', 'dikerjakan'].includes(report.status)));
    const empty = await get(path + '?view=workspace&search=NONEXISTENT-REPORT-TEST', account.token);
    assert.equal(empty.total, 0);
    const paginated = await get(path + '?view=workspace&limit=2&page=2&sort=oldest', account.token);
    assert(paginated.items.length <= 2);
    assert.equal(paginated.total, full.total);
    await get(path + '?view=workspace&status=invalid', account.token, 400);
    console.log('PASS workspace:', role, account.user.id, 'reports:', full.totalAll);
  }
  const admin = accounts[0], citizen = accounts[1], agency = accounts[3], otherAgency = accounts[4];
  await get('/admin/reports?view=workspace', citizen.token, 403);
  await get('/agency/assignments?view=workspace', citizen.token, 403);
  await get('/reports/me/reports?view=workspace', null, 401);
  const tasks = await get('/agency/assignments?view=workspace', agency.token);
  if (tasks.items.length) await get('/agency/assignments/' + tasks.items[0].id, otherAgency.token, 404);
  const residents = await get('/admin/residents', admin.token);
  const agencies = await get('/admin/agencies', admin.token);
  assert(Array.isArray(residents) && Array.isArray(agencies));
  console.log('PASS: counts, database scope, filters, pagination, invalid input, role permissions, cross-agency protection, and people management.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await sql.end({ timeout: 5 }); }
