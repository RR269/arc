// Service worker : une nouvelle version d'ARC se voit dès la réouverture (12 octobre).
// GitHub Pages sert la page avec « Cache-Control: max-age=600 ». Avant, le service worker (réseau d'abord) passait par
// le cache HTTP du navigateur : rouvrir ARC dans les 10 minutes montrait l'ancienne page sans même la demander.
// Ce test sert la page comme GitHub Pages, l'ouvre, la quitte et la rouvre deux fois, et compte les demandes reçues.
// Pas d'interception de requêtes (Playwright couperait alors le cache HTTP et le test ne prouverait rien).
// Lancement depuis la racine du dépôt : node tests/sw.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from './outils.mjs';
const DIR = path.resolve('.');
const results = []; const ok = (c, name, detail) => results.push({ ok: !!c, name, detail });
const vus = [];
const srv = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
  const p = path.join(DIR, f); if (!p.startsWith(DIR) || !fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  if (/index\.html$/.test(f)) vus.push(q.headers['cache-control'] || '-');
  const type = p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : p.endsWith('.json') ? 'application/json' : 'application/octet-stream';
  r.writeHead(200, { 'content-type': type, 'cache-control': 'max-age=600' });
  r.end(fs.readFileSync(p));
}).listen(0);
const port = srv.address().port, url = `http://localhost:${port}/`;
const b = await chromium.launch(), ctx = await b.newContext(), page = await ctx.newPage();
await page.goto(url); await page.waitForTimeout(1200);
const actif = await page.evaluate(async () => { if (!navigator.serviceWorker) return false; await navigator.serviceWorker.ready; return true; });
await page.waitForTimeout(400);
const avant = vus.length;
for (let i = 0; i < 2; i++) { await page.goto('about:blank'); await page.goto(url); await page.waitForTimeout(700); }
const controle = await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller));
ok(actif && controle, 'Le service worker est installé et tient la page', JSON.stringify({ actif, controle }));
ok(vus.length - avant === 2, 'Rouvrir ARC deux fois (page servie avec max-age=600) : la page est redemandée au serveur les deux fois',
  (vus.length - avant) + ' demande(s) ; en-têtes reçus : ' + vus.join(' | '));
const cache = await page.evaluate(async () => (await caches.keys()).join());
ok(/arc-v7/.test(cache) && !/arc-v6/.test(cache), 'Le cache hors ligne est « arc-v7 », l\'ancien est retiré', cache);
await b.close(); srv.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'OK   ' : 'ÉCHEC') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')); }
console.log('\n' + (results.length - fails) + ' / ' + results.length + ' réussis');
process.exit(fails ? 1 : 0);
