// Run against an existing development API; only invalid requests and an
// idempotent settings save are sent. No reports, accounts, or passwords change.
import assert from 'node:assert/strict';

const base = process.env.CIVIX_TEST_API || 'http://127.0.0.1:3000/api/v1';
const email = process.env.CIVIX_TEST_EMAIL;
const password = process.env.CIVIX_TEST_PASSWORD;
assert.ok(email && password, 'Set CIVIX_TEST_EMAIL and CIVIX_TEST_PASSWORD for an existing admin test account.');
const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
assert.equal(login.status, 200, 'Admin test account must sign in');
const { token } = await login.json();
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  return { status: response.status, data: await response.json() };
};
const get = async path => { const result = await request(path); assert.equal(result.status, 200, path); return result.data; };
const workspace = query => get(`/admin/reports?view=workspace&${new URLSearchParams(query)}`);
const first = await workspace({ limit: '2' });
assert.equal(first.totalAll, Object.values(first.counts).reduce((sum, value) => sum + value, 0), 'Status counts reconcile with total');
assert.ok(first.items.length <= 2, 'Server-side page size is applied');
for (const [status, count] of Object.entries(first.counts)) {
  const result = await workspace({ status, limit: '50' });
  assert.equal(result.total, count, `Count for ${status}`);
  assert.ok(result.items.every(row => row.status === status), `Rows for ${status}`);
}
const sample = first.items[0];
if (sample) {
  const byCategory = await workspace({ kategori: sample.kategori });
  assert.ok(byCategory.items.every(row => row.kategori === sample.kategori));
  if (sample.regionId) {
    const byRegion = await workspace({ regionId: sample.regionId });
    assert.ok(byRegion.items.every(row => row.regionId === sample.regionId));
  }
  if (sample.assignedAgency?.id) {
    const byAgency = await workspace({ agencyId: sample.assignedAgency.id });
    assert.ok(byAgency.items.every(row => row.assignedAgency?.id === sample.assignedAgency.id));
  }
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(sample.dibuatPada));
  const byDay = await workspace({ dateFrom: day, dateTo: day });
  assert.ok(byDay.items.length > 0, 'Date filter includes the selected Jakarta calendar day');
  assert.ok(byDay.items.every(row => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(row.dibuatPada)) === day));
  const detail = await get(`/admin/reports/${sample.id}`);
  assert.equal(detail.id, sample.id);
  assert.ok(Array.isArray(detail.statusLogs));
}
const last = await workspace({ page: '99999', limit: '2' });
assert.equal(last.page, Math.max(1, Math.ceil(last.total / 2)), 'Out-of-range page is clamped');
const invalidDate = await request('/admin/reports?view=workspace&dateFrom=2026-02-31');
assert.equal(invalidDate.status, 400, 'Invalid calendar date is rejected');
const users = await get('/admin/users');
assert.ok(users.every(user => !('passwordHash' in user) && !('password' in user)), 'No credential fields in user management');
await get('/admin/regions');
const agencies = await get('/admin/agencies');
assert.ok(agencies.every(agency => Number.isInteger(agency.jumlahLaporan)), 'Agency report totals are computed');
const map = await get('/admin/map');
assert.equal(map.length, first.totalAll, 'Admin map includes every report status');
const overview = await get('/admin/overview');
assert.equal(overview.items.length, first.totalAll, 'Operational dashboard includes all reports, not a single agency');
assert.ok(overview.items.every(row => Array.isArray(row.photos)), 'Dashboard/map thumbnails come from real report photos');
assert.deepEqual(overview.items.map(row => row.id).sort(), map.map(row => row.id).sort(), 'Dashboard, statistics and map use the same report scope');
assert.ok(overview.regions.length > 0);
const closed = await workspace({ status: 'ditolak_duplikat', limit: '50' });
assert.equal(closed.total, first.counts.ditolak + first.counts.duplikat, 'Combined rejected/duplicate card matches the report list');
assert.ok(closed.items.every(row => ['ditolak', 'duplikat'].includes(row.status)));
const regionCounts = await get('/stats/regions');
assert.equal(regionCounts.reduce((sum, region) => sum + Number(region.total), 0), map.filter(report => report.regionId).length, 'Empty regions do not create phantom reports');
const original = await get('/admin/settings');
for (const completedMapDays of [0, 91, 1.5]) {
  assert.equal((await request('/admin/settings', { method: 'PATCH', body: JSON.stringify({ completedMapDays }) })).status, 400);
}
const saved = await request('/admin/settings', { method: 'PATCH', body: JSON.stringify(original) });
assert.equal(saved.status, 200, 'Existing settings can be saved');
assert.deepEqual(await get('/admin/settings'), original, 'Settings persist without changing the chosen duration');
const publicSettings = await fetch(`${base}/reports/map-settings`);
assert.deepEqual(await publicSettings.json(), original, 'Public map uses the saved admin setting');
const anonymous = await fetch(`${base}/admin/users`);
assert.equal(anonymous.status, 401, 'Admin data requires authentication');
console.log('Admin API checks passed: counts, filters, dates, paging, detail, users, agencies, map, settings, authentication.');
