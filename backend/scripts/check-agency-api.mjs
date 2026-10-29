// Read-only checks plus validation failures and an unchanged profile save.
// Existing reports, accounts, credentials and assignment history are not changed.
import assert from 'node:assert/strict';
const base = process.env.CIVIX_TEST_API || 'http://127.0.0.1:3000/api/v1';
const email = process.env.CIVIX_TEST_EMAIL;
const password = process.env.CIVIX_TEST_PASSWORD;
assert.ok(email && password, 'Set CIVIX_TEST_EMAIL and CIVIX_TEST_PASSWORD for an existing agency test account.');
const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
assert.equal(login.status, 200);
const { token, user } = await login.json();
assert.equal(user.peran, 'instansi');
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  return { status: response.status, data: await response.json() };
};
const get = async path => { const r = await request(path); assert.equal(r.status, 200, path); return r.data; };
const workspace = params => get(`/agency/assignments?view=workspace&${new URLSearchParams(params)}`);
const overview = await get('/agency/overview');
assert.ok(overview.items.every(row => row.assignedAgencyId === user.agencyId));
const all = await workspace({ limit: '50' });
assert.equal(all.totalAll, overview.items.length);
assert.equal(Object.values(all.counts).reduce((sum, n) => sum + n, 0), all.totalAll);
for (const [status, count] of Object.entries(all.counts)) {
  const rows = await workspace({ status });
  assert.equal(rows.total, count);
  assert.ok(rows.items.every(row => row.status === status && row.assignedAgencyId === user.agencyId));
}
const active = await workspace({ status: 'aktif' });
assert.equal(active.total, all.counts.diterima + all.counts.diverifikasi + all.counts.ditugaskan + all.counts.dikerjakan);
const sample = all.items[0];
if (sample) {
  for (const filters of [{ kategori: sample.kategori }, { regionId: sample.regionId }, { search: sample.kodeTiket }]) {
    if (Object.values(filters).some(value => !value)) continue;
    const rows = await workspace(filters);
    assert.ok(rows.items.every(row => row.assignedAgencyId === user.agencyId));
    assert.ok(rows.items.some(row => row.id === sample.id));
  }
  const detail = await get(`/agency/assignments/${sample.id}`);
  assert.equal(detail.status, sample.status);
  const publicReport = await get(`/reports/${sample.id}`);
  assert.equal(publicReport.status, detail.status);
  assert.equal((await request(`/agency/assignments/${sample.id}/reject`, { method: 'POST', body: JSON.stringify({ alasan: '' }) })).status, 400);
  assert.equal((await request(`/agency/assignments/${sample.id}/progress`, { method: 'POST', body: JSON.stringify({ status: 'selesai' }) })).status, 400);
}
const page = await workspace({ limit: '1', page: '999' });
assert.equal(page.page, Math.max(1, page.total));
assert.equal((await request('/agency/assignments?view=workspace&dateFrom=2026-02-30')).status, 400);
const profile = await get('/agency/profile');
assert.equal(profile.id, user.agencyId);
assert.ok(profile.users.some(row => row.id === user.id));
assert.ok(profile.users.every(row => !('passwordHash' in row)));
assert.equal((await request('/agency/profile', { method: 'PATCH', body: JSON.stringify({ nama: '', deskripsi: '' }) })).status, 400);
assert.equal((await request('/agency/profile', { method: 'PATCH', body: JSON.stringify({ nama: profile.nama, deskripsi: profile.deskripsi || '', id: 'other-agency' }) })).status, 400);
const saved = await request('/agency/profile', { method: 'PATCH', body: JSON.stringify({ nama: profile.nama, deskripsi: profile.deskripsi || '' }) });
assert.equal(saved.status, 200);
assert.equal(saved.data.nama, profile.nama);
assert.equal((await request('/agency/members', { method: 'POST', body: JSON.stringify({ nama: 'x', email: 'invalid', password: '' }) })).status, 400);
assert.equal((await request('/admin/users')).status, 403);
assert.equal((await fetch(`${base}/agency/overview`)).status, 401);
// A second existing unit confirms isolation on both reads and writes.
if (process.env.CIVIX_OTHER_EMAIL) {
  const otherLogin = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.CIVIX_OTHER_EMAIL, password: process.env.CIVIX_OTHER_PASSWORD || password }) });
  assert.equal(otherLogin.status, 200);
  const other = await otherLogin.json();
  const otherRows = await (await fetch(`${base}/agency/overview`, { headers: { Authorization: `Bearer ${other.token}` } })).json();
  assert.ok(otherRows.items.every(row => row.assignedAgencyId === other.user.agencyId));
  assert.ok(otherRows.items.every(row => !overview.items.some(own => own.id === row.id)));
  if (otherRows.items[0]) {
    const id = otherRows.items[0].id;
    assert.equal((await request(`/agency/assignments/${id}`)).status, 404);
    assert.equal((await request(`/agency/assignments/${id}/progress`, { method: 'POST', body: JSON.stringify({ status: 'dikerjakan' }) })).status, 403);
    assert.equal((await request(`/agency/assignments/${id}/reject`, { method: 'POST', body: JSON.stringify({ alasan: 'scope validation' }) })).status, 403);
  }
}
console.log('Agency API checks passed: scope isolation, counts, filters, pagination, detail/public synchronization, profile save, validation and authorization.');
