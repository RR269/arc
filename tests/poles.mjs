// Tests des deux pôles, Santé et Juridique (passe de design du 7 octobre : même contenu, charte appliquée).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/poles.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Pour chaque pôle, vide puis rempli, sur iPhone (390 × 844) et sur Mac (1440 × 900) :
// textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, contraste ≥ 4,5 : 1 mesuré dans l'image sur toute la hauteur de
// l'écran, ni emoji ni mode de fusion, aucun débordement, aucune erreur ; l'en-tête porte l'horizon du pôle.
// Sur un petit téléphone (360 px), aucun bouton de la barre du haut ne sort de l'écran.
// Santé : un objectif se coche (la case existait dans le code mais n'avait aucun dessin). Juridique : une section
// reste ouverte quand on y ajoute un élément.

import { chromium, startServer, fakeSupabase, openPage, sessionScript } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const dit = m => `${fmt(m.ratio)} sur « ${m.t} » (${m.n}, x ${m.x}, y ${m.y})`;
const detail = {};
const ECRANS = [{ n: 'iPhone 390 × 844', width: 390, height: 844, tel: true }, { n: 'Mac 1440 × 900', width: 1440, height: 900, tel: false }];
const POLES = [{ cle: 'sante', nom: 'Santé', id: 'S3', main: '#pmain-sante', hero: '.sante-hero' }, { cle: 'juridique', nom: 'Juridique', id: 'S4', main: '#pmain-jur', hero: '.jur-hero' }];
const contexte = async vp => { const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.tel, hasTouch: vp.tel, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' }); await ctx.addInitScript(sessionScript()); return ctx; };

// Dans la page : ce que la charte mesure sur le pôle ouvert
const releve = ({ id, main, hero }) => {
  const root = document.getElementById(id), vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
  // Zone touchée : le rectangle de l'élément, agrandi par son ::before s'il sert de zone de toucher (inset négatif)
  const zone = e => { const r = e.getBoundingClientRect(), b = getComputedStyle(e, '::before'); let dx = 0, dy = 0;
    if (b.content !== 'none' && b.position === 'absolute') { dx = Math.max(0, -parseFloat(b.left) || 0) + Math.max(0, -parseFloat(b.right) || 0); dy = Math.max(0, -parseFloat(b.top) || 0) + Math.max(0, -parseFloat(b.bottom) || 0); }
    return { w: r.width + dx, h: r.height + dy }; };
  const nom = e => (e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]);
  const cibles = [...root.querySelectorAll('button, a[href], input, textarea, select, [onclick], .hab-card, .obj-check, .jur-sec-head, .wtool-card, .wtool-add')].filter(vis)
    .map(e => ({ ...zone(e), n: nom(e) })).filter(c => c.h < 43.5 || c.w < 43.5).map(c => `${c.n} ${Math.round(c.w)}×${Math.round(c.h)}`);
  const petits = [], picto = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const s = parseFloat(getComputedStyle(e).fontSize); if (s === 0) continue;
    if (s < 12) petits.push(`${nom(e)} ${s}px`);
    const m = nd.nodeValue.match(/\p{Extended_Pictographic}/gu); if (m && !e.closest('.wtool-card')) picto.push(...m); }
  const champs = [...root.querySelectorAll('input, textarea, select')].filter(vis).filter(e => e.type !== 'range' && parseFloat(getComputedStyle(e).fontSize) < 16).map(nom);
  const fusion = []; for (const e of root.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') fusion.push(nom(e)); }
  const m = root.querySelector(main), barre = [...root.querySelectorAll('.ptop button')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], champs, picto, fusion, barre, horizon: /radial-gradient/.test(getComputedStyle(root.querySelector(hero)).backgroundImage),
           large: document.documentElement.scrollWidth <= innerWidth && m.scrollWidth <= m.clientWidth + 1, ouvert: !root.classList.contains('off') };
};

// Remplir le pôle comme Rayan le ferait : les états remplis se mesurent aussi
const remplir = async (page, cle) => {
  if (cle === 'sante') {
    await page.click('#checkin-save-btn');
    await page.fill('#obj-inp', 'Marcher 30 minutes par jour'); await page.click('#obj-add-btn');
    await page.fill('#obj-inp', 'Prendre rendez-vous chez le dentiste'); await page.click('#obj-add-btn');
    await page.click('#S3 .obj-check'); await page.click('#S3 .hab-card');
    await page.fill('#sante-jou-inp', 'Bilan sanguin fait, résultats attendus lundi.'); await page.click('#sante-jou-btn');
    return await page.evaluate(() => document.querySelectorAll('#S3 .obj-item').length === 2 && document.querySelectorAll('#S3 .obj-item.done').length === 1 && document.querySelectorAll('#S3 .hab-card.done').length === 1 && document.querySelectorAll('#sante-jou-list .wjou-entry').length === 1);
  }
  await page.click('#S4 .jur-sec-head[data-sec="statut"]');
  await page.click('#S4 [data-action="jur-open-form"][data-sec="statut"]');
  await page.fill('#jur-inp-statut', 'Déposer le dossier au guichet unique'); await page.selectOption('#jur-sel-prio-statut', 'haute');
  await page.fill('#jur-dl-statut', new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10));
  await page.click('#S4 [data-action="jur-add-item"][data-sec="statut"]'); await page.waitForTimeout(150);
  const reste = await page.evaluate(() => document.getElementById('jur-body-statut').classList.contains('open') && document.querySelectorAll('#jur-body-statut .jur-item').length === 1);
  await page.click('#S4 [data-action="jur-open-form"][data-sec="statut"]');
  await page.fill('#jur-inp-statut', 'Relire les statuts'); await page.fill('#jur-dl-statut', new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10));
  await page.click('#S4 [data-action="jur-add-item"][data-sec="statut"]'); await page.waitForTimeout(150);
  await page.click('#S4 [data-action="jur-open-form"][data-sec="statut"]');
  await page.fill('#jur-inp-statut', 'Assurance responsabilité civile'); await page.selectOption('#jur-sel-prio-statut', 'basse');
  await page.click('#S4 [data-action="jur-add-item"][data-sec="statut"]'); await page.waitForTimeout(150);
  await page.click('#S4 [data-action="jur-item-done"][data-idx="2"]'); await page.waitForTimeout(150);
  await page.click('#S4 [data-action="jur-open-form"][data-sec="statut"]');
  return reste && await page.evaluate(() => document.getElementById('jur-body-statut').classList.contains('open'));
};

for (const vp of ECRANS) {
  const ctx = await contexte(vp);
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => document.fonts.ready);
  const defauts = [], contrastes = []; let pire = { ratio: Infinity }, n = 0, reste = true;
  for (const p of POLES) {
    await page.evaluate(c => enterPole(c), p.cle); await page.waitForTimeout(700);
    for (const etat of ['vide', 'rempli']) {
      if (etat === 'rempli') { reste = (await remplir(page, p.cle)) && reste; await page.mouse.move(2, 2); await page.waitForTimeout(3000); await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); }
      const r = await page.evaluate(releve, p), ou = `${p.nom} ${etat}`;
      if (!r.ouvert) defauts.push(`${ou} : ne s'ouvre pas`);
      if (r.cibles.length) defauts.push(`${ou} cibles < 44 px : ${r.cibles.slice(0, 5).join(', ')}`);
      if (r.petits.length) defauts.push(`${ou} textes < 12 px : ${r.petits.slice(0, 5).join(', ')}`);
      if (r.champs.length) defauts.push(`${ou} champs < 16 px : ${r.champs.join(', ')}`);
      if (r.picto.length) defauts.push(`${ou} emoji : ${r.picto.join('')}`);
      if (r.fusion.length) defauts.push(`${ou} mode de fusion : ${r.fusion.join(', ')}`);
      if (!r.horizon) defauts.push(`${ou} : pas d'horizon dans l'en-tête`);
      if (!r.large || !r.barre) defauts.push(`${ou} : débordement (page ${r.large}, barre ${r.barre})`);
      // contraste : la barre du haut, puis tout ce qui défile, écran par écran ; sur Mac, le panneau Claude aussi
      const zones = [{ racine: `#${p.id} .ptop` }]; if (!vp.tel) zones.push({ racine: `#${p.id} .pcp` });
      const note = m => { n += m.n; contrastes.push(...m.sous.map(x => ({ ...x, t: ou + ' › ' + x.t }))); if (m.pire.ratio < pire.ratio) pire = { ...m.pire, t: ou + ' › ' + m.pire.t }; };
      for (const z of zones) note(await mesurer(page, z));
      const sc = await page.evaluate(s => { const m = document.querySelector(s); return { h: m.scrollHeight, c: m.clientHeight }; }, p.main);
      for (let y = 0; y < sc.h; y += Math.round(sc.c * 0.7)) {
        await page.evaluate(([s, v]) => document.querySelector(s).scrollTo(0, v), [p.main, y]); await page.waitForTimeout(90);
        note(await mesurer(page, { racine: p.main, cadre: p.main, hors: ['#depot-bar', '.depot-pill', '.depot-note'] }));
      }
      await page.evaluate(s => document.querySelector(s).scrollTo(0, 0), p.main);
    }
    await page.evaluate(() => goHome()); await page.waitForTimeout(150);
  }
  if (contrastes.length) { const g = {}; for (const m of contrastes) { const e = g[m.n + ' « ' + m.t + ' »'] ||= { min: 9, nb: 0 }; e.nb++; e.min = Math.min(e.min, m.ratio); } detail[vp.n] = Object.entries(g).map(([k, e]) => `${e.min.toFixed(2)}  ${k}  (${e.nb})`); }
  ok(!defauts.length, `${vp.n} : Santé et Juridique respectent la charte, vides et remplis (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion, horizon)`, defauts.slice(0, 4).join(' ; '));
  ok(n > 150 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout, dans les deux pôles`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  ok(reste, `${vp.n} : Santé, un objectif se coche, une habitude aussi, une note s'ajoute ; Juridique, la section reste ouverte quand on y ajoute un élément ou qu'on le marque fait`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

// Petit téléphone : la barre du haut tient dans l'écran
{
  const ctx = await contexte({ width: 360, height: 740, tel: true });
  const { page } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  const hors = [];
  for (const p of POLES) {
    await page.evaluate(c => enterPole(c), p.cle); await page.waitForTimeout(400);
    hors.push(...await page.evaluate(id => [...document.querySelectorAll(`#${id} .ptop button`)].filter(b => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(b => b.textContent.trim()), p.id));
    await page.evaluate(() => goHome());
  }
  ok(!hors.length, 'Téléphone de 360 px : aucun bouton de la barre du haut ne sort de l\'écran', hors.join(', '));
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
