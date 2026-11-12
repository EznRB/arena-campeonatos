import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHandler } from '../server/arena-handler.ts';
import { productionDependencies } from '../server/neon.ts';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
      try { body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}); }
      catch {
        // Vercel's lazy body parser can reject malformed JSON before our handler.
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'JSON inválido.' }));
        return;
      }
    }
    const request = new Request(`https://${req.headers.host || 'arena.invalid'}${req.url}`, { method: req.method, headers, ...(body === undefined ? {} : { body }) });
    const response = await createHandler(productionDependencies(), { origin: process.env.ARENA_ORIGIN!, production: process.env.VERCEL_ENV === 'production' })(request);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.statusCode = response.status;
    res.end(await response.text());
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'O serviço online está temporariamente indisponível.' }));
  }
}
