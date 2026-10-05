// Tests du dépôt de pensées (chantier 2).
//
// Playwright sert d'outil de développement seulement : il n'est ni chargé par la page ni ajouté au dépôt.
// Lancement, depuis la racine du dépôt :
//   npm i --prefix /tmp/arc-outils playwright@1 && npx --prefix /tmp/arc-outils playwright install chromium
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/depot.mjs
//
// Le test sert lui-même les fichiers du dépôt (petit serveur local) et remplace Supabase par un faux serveur
// en mémoire, en interceptant les requêtes : aucune requête ne part vers le vrai Supabase.
// Les bibliothèques (supabase-js, marked, DOMPurify, polices) restent chargées depuis leurs serveurs habituels.

import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SB = 'https://zcelpyexerxlhwtfpcbf.supabase.co';
const UID = '8f14e45f-ceea-467a-9575-2b1e0f2a9c3d';

/* ── Serveur local des fichiers du dépôt ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/index.html`;

/* ── Faux Supabase ── */
function fakeSupabase() {
  const db = { thoughts: new Map(), events: new Map() };
  const log = { all: [], thoughtPosts: [], eventPosts: [] };
  const fk = { mode: 'up', loseNext: 0, db, log };
  fk.handler = async route => {
    const req = route.request();
    const url = new URL(req.url());
    log.all.push(`${req.method()} ${url.pathname}`);
    if (fk.mode === 'down') return route.abort('internetdisconnected');
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/rest/v1/thoughts' && req.method() === 'POST') {
      const rows = JSON.parse(req.postData() || '[]');
      log.thoughtPosts.push({ ids: rows.map(r => r.id), prefer: req.headers()['prefer'] || '', onConflict: url.searchParams.get('on_conflict') });
      for (const r of rows) if (!db.thoughts.has(r.id)) db.thoughts.set(r.id, { ...r, user_id: UID, received_at: new Date().toISOString() });
      if (fk.loseNext > 0) { fk.loseNext--; return json(500, { message: 'réponse perdue (simulée)' }); }
      return route.fulfill({ status: 201, body: '' });
    }
    if (url.pathname === '/rest/v1/thoughts' && req.method() === 'GET') {
      const rows = [...db.thoughts.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 200);
      return json(200, rows);
    }
    if (url.pathname === '/rest/v1/arc_events' && req.method() === 'POST') {
      const rows = JSON.parse(req.postData() || '[]');
      log.eventPosts.push(rows.map(r => r.kind));
      for (const r of rows) if (!db.events.has(r.id)) db.events.set(r.id, r);
      return route.fulfill({ status: 201, body: '' });
    }
    if (url.pathname === '/rest/v1/arc_data' && req.method() === 'GET') {
      // Ligne existante et ancienne : l'appareil relié ne la remplace pas et n'envoie rien
      const row = { state: { _lastAction: 0 }, updated_at: '2026-01-01T00:00:00Z' };
      return json(200, /vnd\.pgrst\.object/.test(req.headers()['accept'] || '') ? row : [row]);
    }
    return json(200, {});
  };
  return fk;
}

// Session Supabase déposée dans le navigateur avant le chargement : supabase-js la reprend sans appel réseau
function sessionScript(uid) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, role: 'authenticated', exp, aud: 'authenticated' })}.signature-de-test`;
  const sess = { access_token: jwt, refresh_token: 'refresh-de-test', token_type: 'bearer', expires_in: 3600, expires_at: exp,
                 user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'rayan@test.fr' } };
  return `try{ if(!sessionStorage.getItem('__seeded')){ sessionStorage.setItem('__seeded','1');
    localStorage.setItem('sb-zcelpyexerxlhwtfpcbf-auth-token', ${JSON.stringify(JSON.stringify(sess))});
    localStorage.setItem('arc_linked_uid', '${uid}'); } }catch(e){}`;
}

const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });

async function open({ session = true, viewport = { width: 1440, height: 900 }, fk = fakeSupabase() } = {}) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
  const sbHits = [];
  await ctx.route(u => u.href.startsWith(SB), r => { sbHits.push(r.request().url()); return fk.handler(r); });
  if (session) await ctx.addInitScript(sessionScript(UID));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('exception : ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console : ' + m.text()); });
  page.on('requestfailed', r => { if (!r.url().startsWith(SB)) errors.push('réseau : ' + r.failure().errorText + ' ' + r.url().slice(0, 80)); });
  await page.goto(URL0, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  if (!session && await page.isVisible('#auth-screen')) await page.click('#auth-skip');
  return { ctx, page, fk, sbHits, errors };
}
const deposit = async (page, text) => { await page.fill('#depot-ta', text); await page.click('#depot-send'); };
const idOf = (page, text) => page.evaluate(t => (Object.values(_depot.thoughts).find(x => x.body === t) || {}).id, text);
const stateOf = (page, text) => page.evaluate(t => {
  const el = [...document.querySelectorAll('#depot-list .depot-item')].find(i => i.querySelector('.depot-body').textContent === t);
  return el ? el.querySelector('.depot-state').textContent : null; }, text);

/* 1. Un dépôt s'affiche en moins de 100 ms */
{
  const { ctx, page, fk } = await open();
  await page.click('#depot-open');
  const ms = await page.evaluate(() => new Promise(res => {
    const ta = document.getElementById('depot-ta'); ta.value = 'Rappeler le comptable pour la TVA'; ta.dispatchEvent(new Event('input'));
    const t0 = performance.now(); document.getElementById('depot-send').click();
    (function chk() {
      const el = [...document.querySelectorAll('#depot-list .depot-body')].find(e => e.textContent === 'Rappeler le comptable pour la TVA');
      if (el && el.offsetParent) res(performance.now() - t0); else requestAnimationFrame(chk);
    })();
  }));
  ok(ms < 100, 'Un dépôt s\'affiche en moins de 100 ms', `${ms.toFixed(1)} ms`);
  await page.waitForTimeout(500);
  const kinds = fk.log.eventPosts.flat();
  ok(kinds.includes('open') && kinds.includes('deposit'), 'Mesures : événements « open » et « deposit » envoyés', kinds.join(', '));
  ok(await stateOf(page, 'Rappeler le comptable pour la TVA') === 'Envoyée', 'Pensée marquée « Envoyée » après confirmation');
  await ctx.close();
}

/* 2. Déposé hors ligne, rechargé, puis réseau revenu : envoyé une seule fois */
{
  const fk = fakeSupabase();
  const { ctx, page } = await open({ fk });
  fk.mode = 'down';
  const T = 'Pensée déposée hors ligne';
  await deposit(page, T); await page.waitForTimeout(400);
  const id = await idOf(page, T);
  const before = fk.db.thoughts.size;
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
  const keptAfterReload = await page.evaluate(i => !!_depot.thoughts[i] && _depot.thoughts[i].status === 'pending', id);
  fk.mode = 'up';
  await ctx.setOffline(true); await ctx.setOffline(false); // déclenche l'événement « online »
  await page.waitForTimeout(800);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
  const posts = fk.log.thoughtPosts.filter(p => p.ids.includes(id)).length;
  ok(before === 0 && keptAfterReload && fk.db.thoughts.has(id) && posts === 1,
     'Hors ligne, rechargé, réseau revenu : envoyée une seule fois',
     `gardée après rechargement : ${keptAfterReload}, envois reçus par le serveur : ${posts}, lignes : ${fk.db.thoughts.size}`);
  await ctx.close();
}

/* 3. Deux envois de la même pensée : aucun doublon */
{
  const fk = fakeSupabase();
  fk.loseNext = 1; // le serveur enregistre la première fois, mais sa réponse se perd
  const { ctx, page } = await open({ fk });
  const T = 'Pensée envoyée deux fois';
  await deposit(page, T); await page.waitForTimeout(500);
  const id = await idOf(page, T);
  const pendingAfterLoss = await page.evaluate(i => _depot.thoughts[i].status, id);
  await page.evaluate(() => Promise.all([depotFlush(), depotFlush(), new Promise(r => setTimeout(r, 50)).then(depotFlush)]));
  await page.waitForTimeout(500);
  const posts = fk.log.thoughtPosts.filter(p => p.ids.includes(id));
  const rows = [...fk.db.thoughts.values()].filter(r => r.id === id).length;
  const headersOk = posts.every(p => /resolution=ignore-duplicates/.test(p.prefer) && p.onConflict === 'id');
  ok(pendingAfterLoss === 'pending' && posts.length >= 2 && rows === 1 && headersOk && await stateOf(page, T) === 'Envoyée',
     'Deux envois de la même pensée : aucun doublon',
     `envois : ${posts.length}, lignes en base : ${rows}, doublons ignorés sur id : ${headersOk}`);
  await ctx.close();
}

/* 4. Une pensée venue du serveur (déposée sur l'iPhone) apparaît dans la liste */
{
  const fk = fakeSupabase();
  const T = 'Déposée sur l\'iPhone, à retrouver sur le Mac';
  fk.db.thoughts.set('0b6f2c1e-9a1d-4c55-8f6e-3d2a1b0c9e87', { id: '0b6f2c1e-9a1d-4c55-8f6e-3d2a1b0c9e87', body: T, source: 'text', device: 'iphone',
    created_at: '2026-10-05T07:12:00.000Z', received_at: '2026-10-05T07:12:01.000Z', user_id: UID });
  const { ctx, page } = await open({ fk });
  await page.click('#depot-open');
  ok(await stateOf(page, T) === 'Envoyée', 'Une pensée venue du serveur apparaît dans la liste');
  await ctx.close();
}

/* 5. Sans session : aucune requête vers Supabase, pensée gardée */
{
  const { ctx, page, sbHits } = await open({ session: false });
  const T = 'Pensée sans connexion';
  await deposit(page, T); await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(700);
  if (await page.isVisible('#auth-screen')) await page.click('#auth-skip');
  await page.click('#depot-open');
  const st = await stateOf(page, T);
  ok(sbHits.length === 0 && st === 'Sur cet appareil seulement', 'Sans session : aucune requête vers Supabase, pensée gardée',
     `requêtes : ${sbHits.length}, état : ${st}`);
  await ctx.close();
}

/* 6. Un texte HTML s'affiche comme du texte */
{
  const { ctx, page } = await open();
  let dialog = false; page.on('dialog', d => { dialog = true; d.dismiss(); });
  const T = '<img src=x onerror=alert(1)>';
  await deposit(page, T); await page.click('#depot-open'); await page.waitForTimeout(300);
  const r = await page.evaluate(t => ({
    imgs: document.querySelectorAll('#depot-list img').length,
    shown: [...document.querySelectorAll('#depot-list .depot-body')].some(e => e.textContent === t) }), T);
  ok(r.imgs === 0 && r.shown && !dialog, 'Un texte <img src=x onerror=alert(1)> s\'affiche comme du texte', `img : ${r.imgs}, alerte : ${dialog}`);
  await ctx.close();
}

/* 7. Mac et iPhone : barre visible, rien de masqué, aucune erreur, cinq mondes et deux pôles */
for (const vp of [{ n: 'iPhone 390×844', width: 390, height: 844 }, { n: 'Mac 1440×900', width: 1440, height: 900 }]) {
  const { ctx, page, errors } = await open({ viewport: { width: vp.width, height: vp.height } });
  const barOk = () => page.evaluate(() => {
    const p = document.querySelector('.depot-pill').getBoundingClientRect();
    const ta = document.getElementById('depot-ta');
    const panel = [...document.querySelectorAll('.scr:not(.off) .wcp, .scr:not(.off) .pcp')].find(x => x.offsetWidth > 0);
    const clearOfPanel = !panel || p.right <= panel.getBoundingClientRect().left + 1;
    const scroller = document.querySelector('.scr:not(.off) .wmain, .scr:not(.off) .pmain, .scr:not(.off) .hw');
    const pad = scroller ? parseFloat(getComputedStyle(scroller).paddingBottom) : 0;
    return { visible: p.height > 0 && p.top >= 0 && p.bottom <= innerHeight, font: parseFloat(getComputedStyle(ta).fontSize),
             h: p.height, minTarget: Math.min(ta.getBoundingClientRect().height, document.getElementById('depot-send').getBoundingClientRect().height),
             clearOfPanel, padOk: pad >= p.height };
  });
  const checks = [];
  checks.push(['accueil', await barOk()]);
  for (let i = 0; i < 5; i++) { await page.evaluate(i => enterWorld(i), i); await page.waitForTimeout(150); checks.push(['monde ' + i, await barOk()]); await page.evaluate(() => goHome()); }
  for (const p of ['sante', 'juridique']) { await page.evaluate(p => enterPole(p), p); await page.waitForTimeout(150); checks.push(['pôle ' + p, await barOk()]); await page.evaluate(() => goHome()); }
  const bad = checks.filter(([, c]) => !(c.visible && c.font >= 16 && c.minTarget >= 44 && c.clearOfPanel && c.padOk));
  ok(bad.length === 0, `${vp.n} : barre visible partout, 16 px, cibles de 44 px, rien de masqué`,
     bad.length ? 'en défaut : ' + bad.map(([n, c]) => n + ' ' + JSON.stringify(c)).join(' ; ') : `${checks.length} écrans`);
  const worldsOpen = await page.evaluate(() => { const r = []; for (let i = 0; i < 5; i++) { enterWorld(i); r.push(!document.getElementById('S2').classList.contains('off')); goHome(); } return r.every(Boolean); });
  const polesOpen = await page.evaluate(() => ['sante', 'juridique'].every(p => { enterPole(p); const on = [...document.querySelectorAll('#S3,#S4')].some(s => !s.classList.contains('off')); goHome(); return on; }));
  ok(worldsOpen && polesOpen, `${vp.n} : les cinq mondes et les deux pôles s'ouvrent`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

/* 8. Balisage */
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const o = (html.match(/<div/g) || []).length, c = (html.match(/<\/div>/g) || []).length;
  ok(o === c, '<div égale </div>', `${o} / ${c}`);
}

await browser.close();
server.close();
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed} / ${results.length} réussis`);
process.exit(failed ? 1 : 0);
