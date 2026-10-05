// Outils communs aux tests de page : serveur local des fichiers du dépôt, faux Supabase (tables thoughts,
// arc_events, thought_filings, arc_data) et faux proxy Claude, par interception des requêtes.
// Playwright sert d'outil de développement seulement (voir l'en-tête de tests/depot.mjs pour l'installer).

import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SB = 'https://zcelpyexerxlhwtfpcbf.supabase.co';
export const UID = '8f14e45f-ceea-467a-9575-2b1e0f2a9c3d';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
export async function startServer() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(ROOT, p === '/' ? 'index.html' : p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, url: `http://127.0.0.1:${server.address().port}/index.html` };
}

// Faux Supabase en mémoire. fk.proxy(body) décide de la réponse du proxy : { status, json, delay }.
export function fakeSupabase() {
  const db = { thoughts: new Map(), events: new Map(), filings: new Map() };
  const log = { proxyCalls: [], filingPosts: [], posts: [] };
  // reject[table](ligne) → { status, code } pour refuser une ligne ; transient[table] = nombre de 503 à renvoyer
  const fk = { mode: 'up', db, log, proxy: null, reject: {}, transient: {} };
  const table = { thoughts: db.thoughts, arc_events: db.events, thought_filings: db.filings };
  fk.handler = async route => {
    const req = route.request();
    const url = new URL(req.url());
    if (fk.mode === 'down') return route.abort('internetdisconnected');
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/functions/v1/ARC-CLAUDE-PROXY') {
      const body = JSON.parse(req.postData() || '{}');
      log.proxyCalls.push(body);
      const r = fk.proxy ? await fk.proxy(body) : { status: 500, json: { error: { message: 'pas de faux proxy' } } };
      if (r.abort) return route.abort('internetdisconnected');   // réseau coupé vers le proxy
      if (r.delay) await new Promise(res => setTimeout(res, r.delay));
      try { return await json(r.status || 200, r.json); } catch { return; } // page fermée pendant l'attente
    }
    const name = url.pathname.replace('/rest/v1/', '');
    if (table[name] && req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '[]');
      const rows = Array.isArray(body) ? body : [body];
      log.posts.push({ table: name, ids: rows.map(r => r.id), thoughtIds: rows.map(r => r.thought_id) });
      if (name === 'thought_filings') log.filingPosts.push(rows);
      // Panne passagère simulée (5xx) : rien n'est écrit
      if (fk.transient[name] > 0) { fk.transient[name]--; return json(503, { message: 'service indisponible (simulé)' }); }
      // Comme Postgres : une seule ligne refusée fait échouer toute la requête, rien n'est écrit
      for (const r of rows) {
        if (name === 'thought_filings' && !db.thoughts.has(r.thought_id))
          return json(409, { code: '23503', message: 'insert or update on table "thought_filings" violates foreign key constraint' });
        const why = fk.reject[name] && fk.reject[name](r);
        if (why) return json(why.status, { code: why.code, message: 'ligne refusée (simulé)' });
      }
      for (const r of rows) if (!table[name].has(r.id)) table[name].set(r.id, { ...r, user_id: UID, received_at: new Date().toISOString() });
      return route.fulfill({ status: 201, body: '' });
    }
    if (table[name] && req.method() === 'GET') {
      const key = name === 'arc_events' ? 'at' : 'created_at';
      return json(200, [...table[name].values()].sort((a, b) => (a[key] < b[key] ? 1 : -1)).slice(0, Number(url.searchParams.get('limit')) || 1000));
    }
    if (name === 'arc_data' && req.method() === 'GET') {
      const row = { state: { _lastAction: 0 }, updated_at: '2026-01-01T00:00:00Z' };
      return json(200, /vnd\.pgrst\.object/.test(req.headers()['accept'] || '') ? row : [row]);
    }
    return json(200, {});
  };
  return fk;
}

// Session Supabase déposée avant le chargement : supabase-js la reprend sans appel réseau
export function sessionScript(uid = UID) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, role: 'authenticated', exp, aud: 'authenticated' })}.signature-de-test`;
  const sess = { access_token: jwt, refresh_token: 'refresh-de-test', token_type: 'bearer', expires_in: 3600, expires_at: exp,
                 user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'rayan@test.fr' } };
  return `try{ if(!localStorage.getItem('sb-zcelpyexerxlhwtfpcbf-auth-token')){
    localStorage.setItem('sb-zcelpyexerxlhwtfpcbf-auth-token', ${JSON.stringify(JSON.stringify(sess))});
    localStorage.setItem('arc_linked_uid', '${uid}'); } }catch(e){}`;
}

// Ouvre ARC dans un nouveau contexte (ou un nouvel onglet d'un contexte existant)
// clock : horloge de Playwright installée avant le chargement (true, ou une date de départ) ;
// page.clock.fastForward pour avancer le temps. Fuseau : Europe/Paris, comme les appareils de Rayan.
// keepMatin : laisser le point du matin ouvert (tests du point) ; sinon, il est fermé s'il s'est affiché
export async function openPage(browser, url, { session = true, viewport = { width: 1440, height: 900 }, fk = fakeSupabase(), ctx = null, clock = false, keepMatin = false } = {}) {
  const own = !ctx;
  if (own) {
    ctx = await browser.newContext({ viewport, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR' });
    if (session) await ctx.addInitScript(sessionScript());
  }
  const page = await ctx.newPage();
  if (clock) await page.clock.install(clock === true ? undefined : { time: new Date(clock) });
  const sbHits = [];
  await page.route(u => u.href.startsWith(SB), r => { sbHits.push(r.request().url()); return fk.handler(r); });
  const errors = [];
  page.on('pageerror', e => errors.push('exception : ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console : ' + m.text()); });
  page.on('requestfailed', r => { if (!r.url().startsWith(SB)) errors.push('réseau : ' + r.failure().errorText + ' ' + r.url().slice(0, 80)); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  if (!session && await page.isVisible('#auth-screen')) await page.click('#auth-skip');
  // Après 8 h, le point du matin s'affiche à l'ouverture : les tests qui ne portent pas sur lui le ferment
  if (!keepMatin) await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  return { ctx, page, fk, sbHits, errors };
}

export const deposit = async (page, text) => { await page.fill('#depot-ta', text); await page.click('#depot-send'); };
export const idOf = (page, text) => page.evaluate(t => (Object.values(_depot.thoughts).find(x => x.body === t) || {}).id, text);
