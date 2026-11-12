import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/arena.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';

test('Vercel body-parser rejection returns 400 without disclosing parser details', async () => {
  const request = {
    method: 'POST',
    url: '/api/arena?action=backup',
    headers: { host: 'arena.example', 'content-type': 'application/json' },
    get body(): never { throw new SyntaxError('private parser implementation detail'); },
  } as unknown as IncomingMessage & { body?: unknown };
  let output = '';
  const headers = new Map<string, unknown>();
  const response = {
    statusCode: 200,
    setHeader: (name: string, value: unknown) => headers.set(name, value),
    end: (body: string) => { output = body; },
  };
  await handler(request, response as unknown as ServerResponse);
  assert.equal(response.statusCode, 400);
  assert.equal(headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(JSON.parse(output), { error: 'JSON inválido.' });
  assert.doesNotMatch(output, /private/);
});
