import { prepareCloudPayload, MAX_CLOUD_PAYLOAD_BYTES } from '../src/cloud-payload.ts';

type User = { id: string; email: string };
type Backup = { payload: unknown; schema_version: number; updated_at: string };
type Config = { origin: string; production: boolean };
export type Dependencies = {
  auth: (path: string, method: string, token?: string, body?: unknown) => Promise<{ status: number; data: any; token?: string }>;
  read: (owner: string) => Promise<Backup | null>;
  write: (owner: string, payload: unknown) => Promise<string>;
};
const cookieName = 'arena_session';
export function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 8192 && !/[\s;,\x00-\x1f\x7f]/.test(value);
}
function userFrom(data: any): User | null {
  const user = data?.user;
  return user && typeof user.id === 'string' && typeof user.email === 'string' ? { id: user.id, email: user.email } : null;
}
export function createHandler(deps: Dependencies, config: Config) {
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin', 'Content-Type': 'application/json' });
    const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
    const setCookie = (token: string, clear = false) => headers.set('Set-Cookie', `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${clear ? 0 : 604800}`);
    try {
      const action = new URL(request.url).searchParams.get('action');
      const allowed: Record<string, string[]> = { session: ['GET'], backup: ['GET', 'POST'], signup: ['POST'], signin: ['POST'], signout: ['POST'] };
      if (!action || !allowed[action]) return reply(404, { error: 'Operação inexistente.' });
      if (!allowed[action].includes(request.method)) { headers.set('Allow', allowed[action].join(', ')); return reply(405, { error: 'Método inválido.' }); }
      const native = request.headers.get('x-arena-client') === 'native';
      const origin = request.headers.get('origin');
      const local = !config.production && origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      // Native applications have no browser Origin. A forged native header still cannot
      // trigger browser cookie mutations cross-origin: no CORS preflight is granted.
      if (request.method === 'POST' && !(origin === config.origin || local || (native && !origin))) return reply(403, { error: 'Origem não permitida.' });
      let token: string | undefined;
      if (native) {
        const bearer = request.headers.get('authorization');
        if (bearer?.startsWith('Bearer ')) token = bearer.slice(7);
      } else token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      if (token && !validToken(token)) return reply(401, { error: 'Sessão inválida.' });
      let body: any;
      if (request.method === 'POST') {
        const length = Number(request.headers.get('content-length') || 0);
        if (length > MAX_CLOUD_PAYLOAD_BYTES + 16384) return reply(413, { error: 'Conteúdo muito grande.' });
        const text = await request.text();
        if (new TextEncoder().encode(text).length > MAX_CLOUD_PAYLOAD_BYTES + 16384) return reply(413, { error: 'Conteúdo muito grande.' });
        try { body = text ? JSON.parse(text) : {}; } catch { return reply(400, { error: 'JSON inválido.' }); }
      }
      if (action === 'signup' || action === 'signin') {
        const email = typeof body?.email === 'string' ? body.email.trim() : '';
        const password = body?.password;
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length > 128 || password.length < (action === 'signup' ? 8 : 1)) return reply(400, { error: 'Informe email e senha válidos (cadastro: mínimo de 8 caracteres).' });
        const result = await deps.auth(action === 'signup' ? '/sign-up/email' : '/sign-in/email', 'POST', undefined, { email, password, ...(action === 'signup' ? { name: email.split('@')[0] } : {}), callbackURL: config.origin + '/cloud' });
        const user = userFrom(result.data);
        if (result.status >= 400 || !user || !validToken(result.token)) return reply(result.status === 429 ? 429 : 400, { error: action === 'signup' ? 'Não foi possível criar a conta. Verifique os dados ou tente entrar.' : 'Email ou senha inválidos.' });
        if (!native) setCookie(result.token);
        return reply(200, { user, ...(native ? { token: result.token } : {}) });
      }
      const session = token ? await deps.auth('/get-session', 'GET', token) : null;
      const user = session && session.status < 400 ? userFrom(session.data) : null;
      if (session?.token && validToken(session.token) && !native) setCookie(session.token);
      const rotated = native && session?.token && validToken(session.token) ? { token: session.token } : {};
      if (action === 'session') return reply(200, { user, ...rotated });
      if (action === 'signout' && !user) {
        if (!native) setCookie('', true);
        return reply(200, { ok: true });
      }
      if (!user) return reply(401, { error: 'Entre na sua conta para continuar.' });
      if (action === 'signout') {
        const result = await deps.auth('/sign-out', 'POST', session?.token && validToken(session.token) ? session.token : token, {});
        if (result.status >= 400) return reply(502, { error: 'Não foi possível encerrar a sessão. Tente novamente.' });
        if (!native) setCookie('', true);
        return reply(200, { ok: true });
      }
      if (request.method === 'GET') return reply(200, { backup: await deps.read(user.id), ...rotated });
      let payload;
      try { payload = prepareCloudPayload(body?.payload); } catch (error) { return reply(400, { error: error instanceof Error ? error.message : 'Backup inválido.' }); }
      return reply(200, { updatedAt: await deps.write(user.id, payload), count: payload.length, ...rotated });
    } catch { return reply(502, { error: 'O serviço online está indisponível. Seus dados locais continuam salvos.' }); }
  };
}
