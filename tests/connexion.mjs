// Tests de l'écran de connexion (identifiants : adresse + mot de passe, création de compte, mot de passe à choisir).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/connexion.mjs
// Supabase est remplacé par de fausses réponses : aucune requête ne part vers le vrai projet.

import { chromium, startServer, SB, UID, sessionScript } from './outils.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const session = () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: UID, role: 'authenticated', exp, aud: 'authenticated' })}.signature-de-test`;
  return { access_token: jwt, refresh_token: 'refresh-de-test', token_type: 'bearer', expires_in: 3600, expires_at: exp,
           user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'rayan@test.fr', identities: [{ id: '1' }] } };
};

// Ouvre ARC sans session ; auth(req, url) décide de la réponse des appels /auth/v1/…
async function open(auth, { withSession = false, viewport = { width: 390, height: 844 } } = {}) {
  const ctx = await browser.newContext({ viewport, timezoneId: 'Europe/Paris', locale: 'fr-FR' });
  const calls = [], errors = [];
  if (withSession) await ctx.addInitScript(sessionScript());
  await ctx.route(SB + '/**', async route => {
    const req = route.request(); const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (u.pathname.startsWith('/auth/v1/')) {
      let body = {}; try { body = JSON.parse(req.postData() || '{}'); } catch (e) {}
      calls.push({ method: req.method(), path: u.pathname + u.search, body });
      const r = auth ? await auth({ method: req.method(), path: u.pathname, search: u.search, body }) : null;
      return r ? json(r.status, r.json) : json(200, {});
    }
    if (u.pathname.endsWith('/arc_data') && req.method() === 'GET') {
      const row = { state: { _lastAction: 0 }, updated_at: '2026-01-01T00:00:00Z' };
      return json(200, /vnd\.pgrst\.object/.test(req.headers()['accept'] || '') ? row : [row]);
    }
    if (req.method() === 'GET') return json(200, []);
    return json(201, []);
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e.message)));
  await page.goto(url);
  return { ctx, page, calls, errors };
}

/* 1. Écran d'entrée : deux onglets, adresse, mot de passe, cibles de 44 px au moins */
{
  const { ctx, page, errors } = await open();
  await page.waitForSelector('#auth-screen.active');
  const s = await page.evaluate(() => {
    const vis = e => !!e && e.offsetParent !== null;
    const btns = [...document.querySelectorAll('#auth-email button')].filter(vis);
    return { tabs: vis(document.getElementById('auth-tab-in')) && vis(document.getElementById('auth-tab-up')),
             fields: vis(document.getElementById('auth-email-inp')) && document.getElementById('auth-pass-inp').type === 'password',
             go: document.getElementById('auth-go').textContent, minBtn: Math.min(...btns.map(b => b.getBoundingClientRect().height)),
             wide: document.documentElement.scrollWidth <= innerWidth };
  });
  ok(s.tabs && s.fields && s.go === 'Se connecter' && s.minBtn >= 44 && s.wide && !errors.length,
     'Entrée : onglets « Se connecter » et « Créer un compte », adresse, mot de passe, cibles ≥ 44 px', `bouton : ${s.go}, cible min ${Math.round(s.minBtn)} px, erreurs ${errors.length}`);
  await page.click('#auth-tab-up');
  const up = await page.evaluate(() => ({ go: document.getElementById('auth-go').textContent, ac: document.getElementById('auth-pass-inp').autocomplete,
    codeLinks: document.getElementById('auth-send').offsetParent !== null }));
  ok(up.go === 'Créer mon compte' && up.ac === 'new-password' && !up.codeLinks, 'Onglet « Créer un compte » : bouton et champ adaptés, liens de code masqués', JSON.stringify(up));
  await page.click('#auth-eye');
  ok(await page.evaluate(() => document.getElementById('auth-pass-inp').type === 'text' && document.getElementById('auth-eye').textContent === 'Cacher'), '« Voir » montre le mot de passe');
  await ctx.close();
}

/* 2. Se connecter : adresse + mot de passe, aucun e-mail demandé, l'écran se ferme */
{
  const { ctx, page, calls } = await open(async ({ path, search }) =>
    path === '/auth/v1/token' && search.includes('grant_type=password') ? { status: 200, json: session() } : null);
  await page.waitForSelector('#auth-screen.active');
  await page.fill('#auth-email-inp', 'Rayan@Test.fr'); await page.fill('#auth-pass-inp', 'motdepasse-solide');
  await page.click('#auth-go');
  await page.waitForFunction(() => !document.getElementById('auth-screen').classList.contains('active'), null, { timeout: 5000 }).catch(() => {});
  const closed = await page.evaluate(() => !document.getElementById('auth-screen').classList.contains('active'));
  const tok = calls.find(c => c.path.includes('grant_type=password'));
  const otp = calls.some(c => c.path.includes('/otp'));
  ok(closed && tok && tok.body.email === 'rayan@test.fr' && tok.body.password === 'motdepasse-solide' && !otp,
     'Connexion par mot de passe : session ouverte, écran fermé, aucun code demandé', `fermé : ${closed}, appel : ${tok ? tok.path : 'aucun'}, otp : ${otp}`);
  const stored = await page.evaluate(() => JSON.stringify(localStorage).includes('motdepasse-solide'));
  ok(!stored, 'Le mot de passe n\'est gardé nulle part sur l\'appareil');
  await ctx.close();
}

/* 3. Mauvais mot de passe, mot de passe trop court : message en français, rien n'est fermé */
{
  const { ctx, page, calls } = await open(async ({ path }) =>
    path === '/auth/v1/token' ? { status: 400, json: { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' } } : null);
  await page.waitForSelector('#auth-screen.active');
  await page.fill('#auth-email-inp', 'rayan@test.fr'); await page.fill('#auth-pass-inp', 'court');
  await page.click('#auth-go');
  const short = await page.textContent('#auth-email-err');
  ok(/au moins 8/.test(short) && calls.filter(c => c.path.includes('token')).length === 0, 'Mot de passe trop court : refusé sur place, aucun appel', short);
  await page.fill('#auth-pass-inp', 'mauvais-mot-de-passe'); await page.click('#auth-go');
  await page.waitForFunction(() => /incorrect/.test(document.getElementById('auth-email-err').textContent), null, { timeout: 5000 }).catch(() => {});
  const bad = await page.textContent('#auth-email-err');
  ok(/incorrect/.test(bad) && await page.isVisible('#auth-screen'), 'Mauvais identifiants : message clair, écran toujours là', bad);
  await ctx.close();
}

/* 4. Créer un compte : inscriptions fermées → message ; ouvertes avec confirmation → saisie du code ; adresse déjà prise */
{
  let mode = 'closed';
  const { ctx, page, calls } = await open(async ({ path }) => {
    if (path !== '/auth/v1/signup') return null;
    if (mode === 'closed') return { status: 422, json: { code: 422, error_code: 'signup_disabled', msg: 'Signups not allowed for this instance' } };
    if (mode === 'taken') return { status: 200, json: { id: 'x', email: 'rayan@test.fr', identities: [] } };
    return { status: 200, json: { id: 'y', email: 'nouveau@test.fr', identities: [{ id: '1' }] } };
  });
  await page.waitForSelector('#auth-screen.active');
  await page.click('#auth-tab-up');
  await page.fill('#auth-email-inp', 'nouveau@test.fr'); await page.fill('#auth-pass-inp', 'motdepasse-solide');
  await page.click('#auth-go');
  await page.waitForFunction(() => document.getElementById('auth-email-err').textContent.length > 0, null, { timeout: 5000 }).catch(() => {});
  const closedMsg = await page.textContent('#auth-email-err');
  ok(/pas encore ouverte/.test(closedMsg), 'Inscriptions fermées dans Supabase : « pas encore ouverte »', closedMsg);
  mode = 'taken'; await page.click('#auth-go');
  await page.waitForFunction(() => /déjà un compte/.test(document.getElementById('auth-email-err').textContent), null, { timeout: 5000 }).catch(() => {});
  const takenMsg = await page.textContent('#auth-email-err');
  ok(/déjà un compte/.test(takenMsg) && await page.textContent('#auth-go') === 'Se connecter', 'Adresse déjà inscrite : renvoi vers « Se connecter »', takenMsg);
  mode = 'open'; await page.click('#auth-tab-up'); await page.fill('#auth-pass-inp', 'motdepasse-solide'); await page.click('#auth-go');
  await page.waitForSelector('#auth-code.active', { timeout: 5000 }).catch(() => {});
  const sign = calls.filter(c => c.path.startsWith('/auth/v1/signup')).pop();
  ok(await page.isVisible('#auth-code-inp') && sign && sign.body.password === 'motdepasse-solide', 'Inscriptions ouvertes : compte demandé, puis saisie du code de confirmation', sign ? sign.path : 'aucun appel');
  await ctx.close();
}

/* 5. Connecté : « Mon mot de passe » dans le menu, enregistrement par le compte lui-même */
{
  const { ctx, page, calls, errors } = await open(async ({ method, path }) =>
    path === '/auth/v1/user' && method === 'PUT' ? { status: 200, json: session().user } : path === '/auth/v1/user' ? { status: 200, json: session().user } : null,
    { withSession: true, viewport: { width: 1440, height: 900 } });
  await page.waitForTimeout(600);
  if (await page.isVisible('#matin-screen.open')) await page.click('.matin-go');
  await page.click('#btn-menu');
  const shown = await page.isVisible('#btn-pass');
  await page.click('#btn-pass');
  await page.waitForSelector('#auth-pass.active');
  await page.fill('#auth-newpass-inp', 'nouveau-mot-de-passe'); await page.click('#auth-pass-save');
  await page.waitForFunction(() => !document.getElementById('auth-screen').classList.contains('active'), null, { timeout: 5000 }).catch(() => {});
  const put = calls.find(c => c.method === 'PUT' && c.path.startsWith('/auth/v1/user'));
  ok(shown && put && put.body.password === 'nouveau-mot-de-passe' && !(await page.isVisible('#auth-screen')) && !errors.length,
     'Connecté : « Mon mot de passe » enregistre le mot de passe et referme l\'écran', `menu : ${shown}, appel : ${put ? put.method + ' ' + put.path : 'aucun'}`);
  await ctx.close();
}

/* 6. Sans session : pas de « Mon mot de passe » dans le menu ; le code par e-mail reste disponible */
{
  const { ctx, page, calls } = await open(async ({ path }) => path === '/auth/v1/otp' ? { status: 200, json: {} } : null);
  await page.waitForSelector('#auth-screen.active');
  await page.fill('#auth-email-inp', 'rayan@test.fr'); await page.click('#auth-send');
  await page.waitForSelector('#auth-code.active', { timeout: 5000 }).catch(() => {});
  const otp = calls.find(c => c.path.startsWith('/auth/v1/otp'));
  ok(otp && otp.body.email === 'rayan@test.fr' && otp.body.create_user === false && await page.isVisible('#auth-code-inp'), 'Mot de passe oublié : le code par e-mail marche encore, sans créer de compte', otp ? JSON.stringify(otp.body).slice(0, 80) : 'aucun appel');
  await page.click('#auth-back'); await page.click('#auth-skip'); await page.waitForTimeout(400);
  if (await page.isVisible('#matin-screen.open')) await page.click('.matin-go'); // après 8 h, le point du matin s'ouvre
  await page.click('#btn-menu');
  ok(!(await page.isVisible('#btn-pass')), 'Sans session : « Mon mot de passe » absent du menu');
  await ctx.close();
}

await browser.close(); server.close();
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
