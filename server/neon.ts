import { neon } from '@neondatabase/serverless';
import type { Dependencies } from './arena-handler.ts';

export function productionDependencies(): Dependencies {
  const connection = process.env.DATABASE_URL;
  const authURL = process.env.NEON_AUTH_BASE_URL;
  const origin = process.env.ARENA_ORIGIN;
  if (!connection || !authURL || !origin) throw new Error('Missing server configuration');
  const sql = neon(connection);
  return {
    async auth(path, method, token, body) {
      const headers: Record<string, string> = { Origin: origin, 'Content-Type': 'application/json' };
      if (token) headers.Cookie = `__Secure-neon-auth.session_token=${token}`;
      const response = await fetch(authURL.replace(/\/$/, '') + path, { method, headers, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(15000) });
      const cookies = response.headers.getSetCookie();
      const signed = cookies.map(cookie => /^__Secure-neon-auth\.session_token=([^;]*)/.exec(cookie)?.[1]).find(Boolean);
      const data = await response.json().catch(() => null);
      return { status: response.status, data, token: signed };
    },
    async read(owner) {
      const rows = await sql`SELECT payload, schema_version, updated_at FROM public.arena_backups WHERE user_id = ${owner}`;
      return rows[0] ? { payload: rows[0].payload, schema_version: rows[0].schema_version, updated_at: new Date(rows[0].updated_at).toISOString() } : null;
    },
    async write(owner, payload) {
      const rows = await sql`INSERT INTO public.arena_backups (user_id, payload, schema_version) VALUES (${owner}, ${JSON.stringify(payload)}::jsonb, 1) ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, schema_version = 1, updated_at = now() RETURNING updated_at`;
      return new Date(rows[0].updated_at).toISOString();
    },
  };
}
