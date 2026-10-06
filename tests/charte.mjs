// Contrôles automatiques de la charte (docs/CHARTE-DESIGN.md) sur les écrans qui l'appliquent.
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/charte.mjs
// Écrans contrôlés : ceux listés dans ECRANS. On y ajoute un écran quand il passe à la charte.

import fs from 'node:fs';
import { chromium, ROOT, startServer, fakeSupabase, openPage, deposit, idOf } from './outils.mjs';

const ECRANS = [['#S1', 'accueil', null], ['#depot-screen', 'Déposé', () => depotOpen()], ['#matin-screen', 'point du matin', () => matinShow(true)], ['#depot-bar', 'barre de dépôt', null]];
const { server, url } = await startServer(); const browser = await chromium.launch();
const results = []; const ok = (c, n, d = '') => results.push({ ok: !!c, name: n, detail: d });
const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
// rgb(…) en 0–255 ; color(srgb …) (résultat d'un color-mix) en 0–1
const parse = c => { const n = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number); return /^color\(srgb/.test(c) ? n.slice(0, 3).map(v => v * 255) : n.slice(0, 3); };

/* 1. Le fichier : aucune valeur de couleur recopiée dans les règles de l'accueil (hors socle), aucun emoji dans son balisage */
{
  const html = fs.readFileSync(`${ROOT}/index.html`, 'utf8');
  const home = html.slice(html.indexOf('<div class="scr" id="S1">'), html.indexOf('<!-- S2 WORLD -->'));
  const emoji = (home.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  ok(emoji === 0, 'Accueil : aucun emoji dans le balisage', `${emoji} trouvé(s)`);
  const css = html.slice(html.indexOf('/* ═══ ACCUEIL selon la charte ═══ */'), html.indexOf('</style>'));
  const hexes = (css.match(/#[0-9A-Fa-f]{6}\b/g) || []).filter(h => !/^#(FFFFFF|000000)$/i.test(h));
  ok(hexes.length <= 3, 'Styles de l\'accueil : couleurs par variables, pas recopiées', `${hexes.length} valeur(s) en dur : ${[...new Set(hexes)].join(' ')}`);
  ok(!/!important/.test(css), 'Styles de l\'accueil : aucun !important');
}

/* 2. À l'écran, iPhone 375/390/393/430 et Mac : contrastes, cibles, tailles, champs, débordement, emoji, police */
for (const vp of [{ n: 'iPhone 375', width: 375, height: 812 }, { n: 'iPhone 390', width: 390, height: 844 }, { n: 'iPhone 430', width: 430, height: 932 }, { n: 'Mac 1440', width: 1440, height: 900 }]) {
  const fk = fakeSupabase(); fk.proxy = async () => ({ status: 200, json: { filing: { space: 'atlas', confidence: 'sure', step: 'Appeler le fournisseur Atlas', moment: { type: 'none' }, extras: [] }, model: 'x' } });
  const { ctx, page, errors } = await openPage(browser, url, { fk, viewport: { width: vp.width, height: vp.height } });
  await deposit(page, 'appeler le fournisseur atlas'); const id = await idOf(page, 'appeler le fournisseur atlas'); await page.waitForFunction(i => !!rangeIndex().ai[i], id);
  for (const [sel, name, go] of ECRANS) {
    await page.evaluate(() => { try { matinClose(); } catch (e) {} try { depotBack(); } catch (e) {} goHome(); });
    if (go) await page.evaluate(go); await page.waitForTimeout(350);
    const r = await page.evaluate(sel => {
      const root = document.querySelector(sel);
      const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
      const all = [...root.querySelectorAll('*')].filter(vis);
      const bgOf = el => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; el = el.parentElement; } return 'rgb(255,255,255)'; };
      const texts = all.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => ({ t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), fs: parseFloat(getComputedStyle(e).fontSize), color: getComputedStyle(e).color, bg: bgOf(e), fam: getComputedStyle(e).fontFamily }));
      const small = all.filter(e => e.matches('button,a,[role=button],input,textarea,select')).map(e => ({ t: (e.textContent || e.getAttribute('aria-label') || e.id || '').trim().replace(/\s+/g, ' ').slice(0, 26), h: Math.round(e.getBoundingClientRect().height) })).filter(x => x.h < 44);
      const inputs = [...root.querySelectorAll('input,textarea')].filter(vis).map(e => ({ id: e.id || e.placeholder, fs: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.fs < 16);
      const emoji = all.filter(e => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test([...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''))).length;
      const sizes = [...new Set(texts.map(x => x.fs))];
      const foreign = texts.filter(x => !/apple-system|system-ui|BlinkMacSystemFont/.test(x.fam)).length;
      return { texts, small, inputs, emoji, sizes, foreign, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    }, sel);
    const low = r.texts.map(x => { const c = parse(x.color), b = parse(x.bg); const L1 = lum(...c), L2 = lum(...b); const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); return { ...x, cr: +cr.toFixed(1) }; }).filter(x => x.cr < (x.fs >= 24 ? 3 : 4.5));
    const tag = `${vp.n} · ${name}`;
    ok(low.length === 0, `${tag} : contraste ≥ 4,5 (3 pour les grands textes)`, low.slice(0, 4).map(x => `« ${x.t} » ${x.fs}px ${x.cr}:1`).join(' ; '));
    ok(r.small.length === 0, `${tag} : cibles ≥ 44 px`, r.small.slice(0, 4).map(x => `« ${x.t} » ${x.h}px`).join(' ; '));
    ok(r.texts.every(x => x.fs >= 12), `${tag} : texte ≥ 12 px`, r.texts.filter(x => x.fs < 12).slice(0, 3).map(x => `« ${x.t} » ${x.fs}px`).join(' ; '));
    ok(r.inputs.length === 0, `${tag} : champs ≥ 16 px`, r.inputs.map(x => `${x.id} ${x.fs}px`).join(' ; '));
    ok(r.emoji === 0, `${tag} : aucun emoji`, `${r.emoji}`);
    ok(r.sizes.length <= 6, `${tag} : six tailles de texte au plus`, r.sizes.sort((a, b) => a - b).join(', '));
    ok(r.foreign === 0, `${tag} : police système`, `${r.foreign} texte(s) dans une autre police`);
    ok(!r.overflow, `${tag} : aucun débordement horizontal`);
  }
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}
await browser.close(); server.close();
for (const r of results) if (!r.ok) console.log(`ÉCHEC ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
