import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHandler } from '../server/arena-handler.ts';
import { productionDependencies } from '../server/neon.ts';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    const request = new Request(`https://${req.headers.host || 'arena.invalid'}${req.url}`, { method: req.method, headers, ...(!['GET', 'HEAD'].includes(req.method || 'GET') ? { body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}) } : {}) });
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
