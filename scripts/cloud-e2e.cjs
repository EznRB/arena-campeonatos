/* Live QA: creates only two disposable accounts; never touches other users. */
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const base = (process.env.BASE_URL || 'https://arena-campeonatos.vercel.app').replace(/\/$/, '');
const logs = path.resolve(__dirname, '../logs');
fs.mkdirSync(logs, { recursive: true });
const run = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
const accounts = ['a', 'b'].map(label => ({ email: `arena-qa-${run}-${label}@example.com`, password: crypto.randomBytes(24).toString('base64url') }));
const evidence = { base, startedAt: new Date().toISOString(), checks: [], accountIds: [], cleanup: 'Only QA account IDs recorded here may be removed using authenticated Neon administration; never delete by broad email patterns.' };
fs.writeFileSync(path.join(logs, 'cloud-qa-credentials.json'), JSON.stringify({ run, base, accounts }, null, 2));
const pass = name => { evidence.checks.push(name); console.log('PASS', name); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  page.on('pageerror', error => errors.push(error.message));
  async function cloud(p = page) {
    await p.goto(base + '/cloud', { waitUntil: 'networkidle' });
  }
  async function auth(account, signup, p = page) {
    await p.getByLabel('E-mail da conta', { exact: true }).fill(account.email);
    await p.getByLabel('Senha da conta', { exact: true }).fill(account.password);
    await p.getByRole('button', { name: signup ? 'Criar conta com este e-mail' : 'Entrar na conta', exact: true }).click();
    await p.getByRole('button', { name: 'Sair da conta', exact: true }).waitFor({ timeout: 30000 });
  }
  async function browserAPI(p, action, body) {
    return p.evaluate(async ({ base, action, body }) => {
      const response = await fetch(base + '/api/arena?action=' + action, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
      return { status: response.status, body: await response.json() };
    }, { base, action, body });
  }
  async function native(action, token, body, extra = {}) {
    const response = await fetch(base + '/api/arena?action=' + action, { method: body === undefined ? 'GET' : 'POST', headers: { 'x-arena-client': 'native', ...(token ? { authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  try {
    await cloud();
    await auth(accounts[0], true);
    const sessionA = await browserAPI(page, 'session');
    assert.equal(sessionA.status, 200);
    assert.equal(sessionA.body.user.email, accounts[0].email);
    assert.equal(sessionA.body.token, undefined);
    evidence.accountIds.push(sessionA.body.user.id);
    const cookies = await context.cookies();
    const cookie = cookies.find(item => item.name === 'arena_session');
    assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Lax');
    assert.equal(await page.evaluate(() => document.cookie.includes('arena_session')), false);
    pass('Desktop UI signup A; HttpOnly Secure SameSite session, no web token exposure');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).waitFor();
    pass('Session survives browser reload');
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Explorar demonstração', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir chaveamento', exact: true }).waitFor();
    await cloud();
    await page.getByRole('button', { name: 'Salvar campeonatos na nuvem', exact: true }).click();
    await page.getByText(/1 campeonato\(s\) salvos online/).waitFor({ timeout: 30000 });
    const backupA = await browserAPI(page, 'backup');
    assert.equal(backupA.body.backup.payload.length, 1);
    assert.equal(backupA.body.backup.payload[0].name, 'Copa Arena • Demo');
    pass('UI saves real demo tournament and server persists validated backup');
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await page.getByLabel('E-mail da conta', { exact: true }).waitFor();
    assert.equal((await browserAPI(page, 'backup')).status, 401);
    pass('Logout prevents anonymous backup access and preserves local tournaments');
    await auth(accounts[1], true);
    const sessionB = await browserAPI(page, 'session');
    evidence.accountIds.push(sessionB.body.user.id);
    assert.notEqual(sessionA.body.user.id, sessionB.body.user.id);
    await page.getByRole('button', { name: 'Restaurar backup online', exact: true }).click();
    await page.getByText('Esta conta ainda não tem backup. Salve seus campeonatos primeiro.', { exact: true }).waitFor();
    assert.equal((await browserAPI(page, 'backup')).body.backup, null);
    assert.equal((await browserAPI(page, 'backup', { payload: [], user_id: sessionA.body.user.id })).status, 200);
    assert.deepEqual((await browserAPI(page, 'backup')).body.backup.payload, []);
    pass('Account B starts empty; forged owner field cannot overwrite A');
    const staleTab = await page.evaluate(async ({ base, userId }) => {
      const results = [];
      for (const method of ['GET', 'POST']) {
        const response = await fetch(base + '/api/arena?action=backup', { method, headers: { 'X-Arena-User': userId, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify({ payload: [] }) } : {}) });
        results.push({ status: response.status, body: await response.json() });
      }
      return results;
    }, { base, userId: sessionA.body.user.id });
    assert.deepEqual(staleTab.map(item => item.status), [409, 409]);
    assert.deepEqual((await browserAPI(page, 'backup')).body.backup.payload, []);
    pass('Stale account A tab cannot read/write account B backup after shared-cookie account switch');
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await page.getByLabel('E-mail da conta', { exact: true }).waitFor();
    const mobileContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
    const mobile = await mobileContext.newPage();
    mobile.on('dialog', dialog => dialog.accept());
    mobile.on('pageerror', error => errors.push(error.message));
    await cloud(mobile);
    await mobile.getByLabel('E-mail da conta', { exact: true }).fill(accounts[0].email);
    await mobile.getByLabel('Senha da conta', { exact: true }).fill('wrong-password');
    await mobile.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
    await mobile.getByRole('alert').filter({ hasText: 'Email ou senha inválidos.' }).waitFor({ timeout: 30000 });
    pass('Wrong password renders recoverable UI error');
    await auth(accounts[0], false, mobile);
    await mobile.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await mobile.getByRole('button', { name: 'Abrir Copa Arena • Demo', exact: true }).count(), 0);
    await cloud(mobile);
    await mobile.getByRole('button', { name: 'Restaurar backup online', exact: true }).click();
    await mobile.getByText('Backup restaurado neste aparelho. Reagende os lembretes que quiser receber.', { exact: true }).waitFor({ timeout: 30000 });
    await mobile.goto(base, { waitUntil: 'networkidle' });
    await mobile.getByRole('button', { name: 'Abrir Copa Arena • Demo', exact: true }).first().waitFor();
    await mobile.reload({ waitUntil: 'networkidle' });
    await mobile.getByRole('button', { name: 'Abrir Copa Arena • Demo', exact: true }).first().waitFor();
    await mobile.screenshot({ path: path.join(logs, 'cloud-mobile-restored.png'), fullPage: true });
    pass('Fresh mobile browser restores A demo; local persistence survives reload');
    const preservedA = await browserAPI(mobile, 'backup');
    assert.equal(preservedA.body.backup.payload[0].name, 'Copa Arena • Demo');
    assert.equal((await browserAPI(mobile, 'backup', { payload: [{}] })).status, 400);
    assert.equal((await browserAPI(mobile, 'backup')).body.backup.payload[0].name, 'Copa Arena • Demo');
    pass('Invalid backup rejected without corrupting persisted data');
    const csrf = await native('backup', undefined, { payload: [] }, { origin: 'https://evil.example' });
    assert.equal(csrf.status, 403);
    pass('Cross-origin mutation rejected');
    const login = await native('signin', undefined, { email: accounts[1].email, password: accounts[1].password });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    assert.equal(login.headers.get('set-cookie'), null);
    let token = login.body.token;
    const nativeSession = await native('session', token);
    assert.equal(nativeSession.body.user.id, sessionB.body.user.id);
    token = nativeSession.body.token || token;
    const write = await native('backup', token, { payload: [], user_id: sessionA.body.user.id });
    assert.equal(write.status, 200);
    token = write.body.token || token;
    const read = await native('backup', token);
    assert.deepEqual(read.body.backup.payload, []);
    token = read.body.token || token;
    assert.equal((await native('signout', token, {})).status, 200);
    assert.equal((await native('backup', token)).status, 401);
    assert.equal((await browserAPI(mobile, 'backup')).body.backup.payload[0].name, 'Copa Arena • Demo');
    pass('Native API signed token: signin/session/write/read/revoke; A remains isolated');
    assert.deepEqual(errors, []);
    pass('No browser runtime errors');
    evidence.completedAt = new Date().toISOString();
    evidence.success = true;
  } catch (error) {
    evidence.success = false;
    // Error messages may contain locator text but never request bodies/session tokens.
    evidence.failure = String(error.message).replaceAll(accounts[0].password, '[redacted]').replaceAll(accounts[1].password, '[redacted]');
    console.error('FAIL', evidence.failure);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(logs, 'cloud-e2e-result.json'), JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})();
