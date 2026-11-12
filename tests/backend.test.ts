import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, validToken } from '../server/arena-handler.ts';
import type { Dependencies } from '../server/arena-handler.ts';

const origin = 'https://arena.example';
function fixture() {
  const rows = new Map<string, any>();
  const seen: string[] = [];
  const revoked = new Set<string>();
  const deps: Dependencies = {
    async auth(path, method, token, body: any) {
      seen.push(path);
      if (path === '/get-session') return { status: 200, data: revoked.has(token!) ? null : token === 'signed-a' ? { user: { id: 'a', email: 'a@example.com' } } : token === 'signed-b' ? { user: { id: 'b', email: 'b@example.com' } } : null };
      if (path === '/sign-out') { revoked.add(token!); return { status: 200, data: { success: true } }; }
      if (body.password === 'wrong') return { status: 401, data: { error: 'secret upstream details' } };
      return { status: 200, data: { user: { id: 'a', email: body.email }, token: 'raw-upstream-token' }, token: 'signed-a' };
    },
    async read(owner) { return rows.get(owner) || null; },
    async write(owner, payload) { const date = '2026-11-12T00:00:00.000Z'; rows.set(owner, { payload, schema_version: 1, updated_at: date }); return date; },
  };
  const handler = createHandler(deps, { origin, production: true });
  const request = (action: string, token?: string, body?: any, extra: Record<string, string> = {}) => handler(new Request(`${origin}/api/arena?action=${action}`, { method: body === undefined ? 'GET' : 'POST', headers: { origin, ...(token ? { cookie: `arena_session=${token}` } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  return { rows, seen, request, handler };
}
test('browser authentication only exposes sanitized user and keeps signed session in HttpOnly cookie', async () => {
  const f = fixture();
  const response = await f.request('signin', undefined, { email: 'a@example.com', password: 'password' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: { id: 'a', email: 'a@example.com' } });
  assert.match(response.headers.get('set-cookie')!, /arena_session=signed-a;.*HttpOnly; Secure; SameSite=Lax/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('native authentication returns signed cookie value, and uses bearer token for sessions', async () => {
  const f = fixture();
  const response = await f.request('signin', undefined, { email: 'a@example.com', password: 'password' }, { 'x-arena-client': 'native' });
  assert.equal((await response.json()).token, 'signed-a');
  assert.equal(response.headers.get('set-cookie'), null);
  const session = await f.request('session', undefined, undefined, { 'x-arena-client': 'native', authorization: 'Bearer signed-a' });
  assert.equal((await session.json()).user.id, 'a');
});
test('owner scope comes only from upstream session and protects separate accounts', async () => {
  const f = fixture();
  assert.equal((await f.request('backup', undefined, { payload: [] })).status, 401);
  assert.equal((await f.request('backup', 'signed-a', { payload: [], user_id: 'b' })).status, 200);
  assert.equal(f.rows.has('a'), true);
  assert.equal(f.rows.has('b'), false);
  assert.equal((await (await f.request('backup', 'signed-b')).json()).backup, null);
  assert.deepEqual((await (await f.request('backup', 'signed-a')).json()).backup.payload, []);
  assert.equal((await f.request('backup', 'expired', { payload: [] })).status, 401);
});
test('cross-origin cookie mutations rejected, invalid payload never overwrites', async () => {
  const f = fixture();
  assert.equal((await f.request('backup', 'signed-a', { payload: [] }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.request('backup', 'signed-a', { payload: [{}] })).status, 400);
  assert.equal(f.rows.size, 0);
  assert.equal((await f.request('unknown')).status, 404);
  assert.equal((await f.request('session', undefined, {})).status, 405);
  assert.equal(validToken('a;evil=x'), false);
  assert.equal(validToken('a\nb'), false);
  assert.equal(validToken('x'.repeat(8193)), false);
});
test('stale account shown in another tab cannot read or replace current account backup', async () => {
  const f = fixture();
  const existing = { payload: [], schema_version: 1, updated_at: '2026-11-12T00:00:00.000Z' };
  f.rows.set('b', existing);
  const read = await f.request('backup', 'signed-b', undefined, { 'x-arena-user': 'a' });
  assert.equal(read.status, 409);
  assert.match((await read.json()).error, /Sua conta mudou em outra aba/);
  const write = await f.request('backup', 'signed-b', { payload: [] }, { 'x-arena-user': 'a' });
  assert.equal(write.status, 409);
  assert.equal(f.rows.get('b'), existing);
  assert.equal(f.rows.has('a'), false);
  assert.equal((await f.request('backup', 'signed-b', undefined, { 'x-arena-user': 'b' })).status, 200);
});
test('signout revokes upstream and clears browser cookie; service errors do not leak internals', async () => {
  const f = fixture();
  const response = await f.request('signout', 'signed-a', {});
  assert.equal(response.status, 200);
  assert.ok(f.seen.includes('/sign-out'));
  assert.match(response.headers.get('set-cookie')!, /Max-Age=0/);
  assert.equal((await (await f.request('session', 'signed-a')).json()).user, null);
  const expired = await f.request('signout', 'expired', {});
  assert.equal(expired.status, 200);
  assert.match(expired.headers.get('set-cookie')!, /Max-Age=0/);
  const handler = createHandler({ auth: async () => { throw Error('postgres://secret'); }, read: async () => null, write: async () => '' }, { origin, production: true });
  const error = await handler(new Request(origin + '/api/arena?action=session', { headers: { cookie: 'arena_session=signed-a' } }));
  assert.equal(error.status, 502);
  assert.doesNotMatch(await error.text(), /secret/);
});
test('wrong passwords and malformed requests reject safely', async () => {
  const f = fixture();
  const wrong = await f.request('signin', undefined, { email: 'a@example.com', password: 'wrong' });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.headers.get('set-cookie'), null);
  assert.doesNotMatch(await wrong.text(), /upstream/);
  const malformed = await f.handler(new Request(origin + '/api/arena?action=backup', { method: 'POST', headers: { origin }, body: '{broken' }));
  assert.equal(malformed.status, 400);
  const invalid = await f.request('session', undefined, undefined, { cookie: 'arena_session=a b' });
  assert.equal(invalid.status, 401);
  const method = await f.handler(new Request(origin + '/api/arena?action=backup', { method: 'DELETE' }));
  assert.equal(method.status, 405);
});
test('rotated signed sessions propagate to native JSON and only cookies on web', async () => {
  const f = fixture();
  const deps: Dependencies = {
    auth: async () => ({ status: 200, data: { user: { id: 'a', email: 'a@example.com' } }, token: 'rotated-signed' }),
    read: async () => null,
    write: async () => '2026-11-12T00:00:00.000Z',
  };
  const handler = createHandler(deps, { origin, production: true });
  for (const action of ['session', 'backup']) {
    const native = await handler(new Request(origin + '/api/arena?action=' + action, { headers: { 'x-arena-client': 'native', authorization: 'Bearer signed-a' } }));
    assert.equal((await native.json()).token, 'rotated-signed');
    assert.equal(native.headers.get('set-cookie'), null);
    const web = await handler(new Request(origin + '/api/arena?action=' + action, { headers: { cookie: 'arena_session=signed-a' } }));
    assert.equal((await web.json()).token, undefined);
    assert.match(web.headers.get('set-cookie')!, /arena_session=rotated-signed/);
  }
  const nativeWrite = await handler(new Request(origin + '/api/arena?action=backup', { method: 'POST', headers: { 'x-arena-client': 'native', authorization: 'Bearer signed-a' }, body: JSON.stringify({ payload: [] }) }));
  assert.equal((await nativeWrite.json()).token, 'rotated-signed');
  assert.equal(f.rows.size, 0);
});
