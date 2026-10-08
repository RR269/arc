// Tests de l'accueil (#S1), le premier écran après la connexion (passe « intérieur » du 8 octobre : même contenu,
// identité de l'écran d'entrée, charte appliquée).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/accueil.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Sur iPhone (390 × 844) et sur Mac (1440 × 900), accueil vide puis rempli (trois pensées déposées et rangées par
// un faux proxy) : textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, aucun emoji, aucun mode de fusion, aucun
// débordement, contraste ≥ 4,5 : 1 mesuré dans l'image sur toute la hauteur ; police du système pour le texte ;
// l'horizon d'ARC sous le titre ; la barre du haut tient sur un téléphone de 360 px, même avec un état long.

import { chromium, startServer, fakeSupabase, openPage, sessionScript, deposit } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const dit = m => `${fmt(m.ratio)} sur « ${m.t} » (${m.n}, x ${m.x}, y ${m.y})`;
const detail = {};
const ECRANS = [{ n: 'iPhone 390 × 844', width: 390, height: 844, tel: true }, { n: 'Mac 1440 × 900', width: 1440, height: 900, tel: false }];
const MASQUE = { masqueFond: '#S1::before,#S1 .h-horizon::before{display:none!important}', masqueEnPlus: '#S1 .h-h1-gradient{background:none!important}' };

// Le faux proxy range les trois pensées : une étape aujourd'hui, une étape sans moment, une hésitation
const reponses = () => { const d = new Date(); d.setHours(23, 30, 0, 0); let i = 0; const R = [
  { space: 'aryan', confidence: 'sure', step: 'Appeler la comptable pour la TVA', moment: { type: 'datetime', at: d.toISOString() }, extras: [] },
  { space: 'atlas', confidence: 'sure', step: 'Relire les conditions générales de vente d\'Atlas', moment: { type: 'none' }, extras: [] },
  { space: 'inconnu', confidence: 'unsure', step: 'Trouver un nom pour la boutique', moment: { type: 'none' }, extras: [] }];
  return async () => ({ status: 200, json: { filing: R[Math.min(i++, R.length - 1)], model: 'claude-sonnet-5-5' } }); };

// Dans la page : ce que la charte mesure sur l'accueil
const releve = () => {
  const root = document.getElementById('S1'), vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
  const nom = e => (e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]);
  const cibles = [...root.querySelectorAll('button, a[href], input, textarea, select, label, [data-action], #sync-pill, .intel-open')].filter(vis)
    .map(e => ({ r: e.getBoundingClientRect(), n: nom(e) })).filter(c => c.r.height < 43.5 || c.r.width < 43.5).map(c => `${c.n} ${Math.round(c.r.width)}×${Math.round(c.r.height)}`);
  const petits = [], emoji = [], polices = new Set(); const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e), s = parseFloat(cs.fontSize); if (s === 0) continue;
    if (s < 12) petits.push(`${nom(e)} ${s}px`); const m = nd.nodeValue.match(/\p{Extended_Pictographic}/gu); if (m) emoji.push(nom(e) + ' ' + m.join('')); polices.add(cs.fontFamily.split(',')[0].trim().replace(/"/g, '')); }
  const champs = [...root.querySelectorAll('input:not([type=file]), textarea, select')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(nom);
  const fusion = []; for (const e of root.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') fusion.push(nom(e)); }
  const hors = [...root.querySelectorAll('.hn *, .h-hero > *, .h-section, .next-wrap, #quick-add-bar, .intel-card')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).filter(e => !e.classList.contains('h-horizon')).map(nom);
  const hz = getComputedStyle(root.querySelector('.h-horizon'), '::before'), texte = e => getComputedStyle(root.querySelector(e)).fontFamily.split(',')[0].trim();
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i);
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], emoji, champs, fusion, hors: [...new Set(hors)], ids, polices: [...polices],
           large: document.documentElement.scrollWidth <= innerWidth && root.scrollWidth <= root.clientWidth + 1,
           horizon: /radial-gradient/.test(hz.maskImage || hz.webkitMaskImage || '') && /gradient/.test(hz.backgroundImage), systeme: [texte('.h-sub'), texte('.depot-entry-t'), texte('.pc-monde-desc')], titre: texte('.h-h1'),
           mondes: root.querySelectorAll('.pc-monde').length, poles: root.querySelectorAll('.pole-card').length, etapes: root.querySelectorAll('#next-list .next-item').length,
           date: (root.textContent.match(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d{1,2} /g) || []).length };
};
const contraste = async (page, nom) => {
  const sous = []; let pire = { ratio: Infinity }, n = 0;
  const garde = m => { n += m.n; sous.push(...m.sous.map(x => ({ ...x, t: nom + ' › ' + x.t }))); if (m.pire.ratio < pire.ratio) pire = { ...m.pire, t: nom + ' › ' + m.pire.t }; };
  // ce qui défile n'est pas le même bloc sur téléphone (.hw) et sur Mac (#S1)
  const sc = await page.evaluate(() => { const c = [...document.querySelectorAll('#S1, #S1 .hw')].find(e => e.scrollHeight > e.clientHeight + 4) || document.getElementById('S1');
    document.querySelectorAll('[data-defile]').forEach(e => e.removeAttribute('data-defile')); c.setAttribute('data-defile', '1'); c.scrollTo(0, 0); return { h: c.scrollHeight, c: c.clientHeight }; });
  await page.waitForTimeout(120);
  garde(await mesurer(page, { racine: '#S1 .hn', ...MASQUE }));
  for (let y = 0; y < sc.h; y += Math.round(sc.c * 0.6)) {
    await page.evaluate(v => document.querySelector('[data-defile]').scrollTo(0, v), y); await page.waitForTimeout(120);
    garde(await mesurer(page, { racine: '#S1', hors: ['#S1 .hn', '#depot-bar', '.depot-pill', '.depot-note'], ...MASQUE }));
  }
  await page.evaluate(() => document.querySelector('[data-defile]').scrollTo(0, 0));
  return { sous, pire, n };
};

for (const vp of ECRANS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.tel, hasTouch: vp.tel, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await openPage(browser, url, { ctx, fk });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  const defauts = [], contrastes = []; let pire = { ratio: Infinity }, n = 0, dernier = null;
  for (const etat of ['vide', 'rempli']) {
    if (etat === 'rempli') {
      for (const t of ['Appeler la comptable pour la TVA', 'Relire les CGV d\'Atlas', 'idée de nom pour la boutique']) { await deposit(page, t); await page.waitForTimeout(250); }
      await page.waitForFunction(() => document.querySelectorAll('#next-list .next-item').length >= 2 && !document.getElementById('next-torange').hidden, null, { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(300);
    }
    const r = await page.evaluate(releve); dernier = r;
    const d = (cond, txt) => { if (cond) defauts.push(`${etat} : ${txt}`); };
    d(r.cibles.length, `cibles < 44 px : ${r.cibles.slice(0, 5).join(', ')}`);
    d(r.petits.length, `textes < 12 px : ${r.petits.slice(0, 5).join(', ')}`);
    d(r.champs.length, `champs < 16 px : ${r.champs.join(', ')}`);
    d(r.emoji.length, `emoji : ${r.emoji.slice(0, 5).join(', ')}`);
    d(r.fusion.length, `mode de fusion : ${r.fusion.join(', ')}`);
    d(!r.large || r.hors.length, `débordement horizontal : ${r.hors.join(', ')}`);
    d(r.ids.length, `identifiants en double : ${r.ids.join(', ')}`);
    d(!r.horizon, 'l\'horizon d\'ARC manque sous le titre');
    d(r.systeme.some(f => f !== '-apple-system') || !/Jakarta/.test(r.titre), `écriture : texte ${r.systeme.join(' / ')}, titre ${r.titre}`);
    d(r.mondes !== 5 || r.poles !== 2, `${r.mondes} mondes, ${r.poles} pôles`);
    d(r.date !== 1, `la date est écrite ${r.date} fois`);
    d(etat === 'rempli' && r.etapes < 2, `${r.etapes} prochaine(s) étape(s) affichée(s)`);
    const c = await contraste(page, etat); n += c.n; contrastes.push(...c.sous); if (c.pire.ratio < pire.ratio) pire = c.pire;
  }
  // le menu ouvert : chaque ligne se touche
  await page.click('#btn-menu'); await page.waitForTimeout(200);
  const menu = await page.evaluate(() => [...document.querySelectorAll('#h-menu-dd .h-menu-item')].filter(e => e.offsetParent !== null).map(e => Math.round(e.getBoundingClientRect().height)));
  const cm = await mesurer(page, { racine: '#h-menu-dd', ...MASQUE }); n += cm.n; contrastes.push(...cm.sous.map(x => ({ ...x, t: 'menu › ' + x.t }))); if (cm.pire.ratio < pire.ratio) pire = { ...cm.pire, t: 'menu › ' + cm.pire.t };
  if (menu.some(h => h < 44) || menu.length < 4) defauts.push(`menu : lignes de ${menu.join(', ')} px`);
  await page.click('#btn-menu');
  if (contrastes.length) { const g = {}; for (const m of contrastes) { const e = g[m.n + ' « ' + m.t + ' »'] ||= { min: 9, nb: 0 }; e.nb++; e.min = Math.min(e.min, m.ratio); } detail[vp.n] = Object.entries(g).map(([k, e]) => `${e.min.toFixed(2)}  ${k}  (${e.nb})`); }
  ok(!defauts.length, `${vp.n} : l'accueil respecte la charte, vide et rempli (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion ni débordement, police du système, horizon d'ARC, date écrite une fois)`,
     defauts.slice(0, 4).join(' ; ') || `polices : ${dernier.polices.join(', ')} ; ${dernier.etapes} étapes, ${dernier.mondes} mondes, ${dernier.poles} pôles`);
  ok(n > 300 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout sur l'accueil, vide et rempli, menu compris`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  // les cinq mondes et les deux pôles s'ouvrent depuis l'accueil, et on en revient
  const ouverts = [];
  for (let w = 0; w < 5; w++) { await page.evaluate(i => document.querySelector(`#S1 .pc-monde[data-wid="${i}"]`).click(), w); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && document.getElementById('S1').classList.contains('off'))); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  for (const p of ['sante', 'juridique']) { await page.evaluate(i => document.querySelector(`#S1 .pole-card[data-pole="${i}"]`).click(), p); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(i => !document.getElementById(i === 'sante' ? 'S3' : 'S4').classList.contains('off'), p)); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  ok(ouverts.length === 7 && ouverts.every(Boolean) && errors.length === 0, `${vp.n} : les cinq mondes et les deux pôles s'ouvrent depuis l'accueil, aucune erreur de console`, ouverts.map(o => o ? 'oui' : 'NON').join(' ') + (errors.length ? ' ; ' + errors.slice(0, 2).join(' | ') : ''));
  await ctx.close();
}

/* La barre du haut tient sur tous les téléphones, même quand l'état de synchronisation est long */
{
  const vus = [];
  for (const w of [360, 375, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
    await ctx.addInitScript(sessionScript());
    const { page } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
    await page.waitForTimeout(400);
    for (const lbl of ['ARC', '✓ Sync', 'Reconnexion…', 'Non connecté', 'À confirmer']) {
      const r = await page.evaluate(l => { setSyncUI('busy', l); const nav = document.querySelector('#S1 .hn'), els = [...nav.querySelectorAll('.h-logo-mark, .h-logo-name, #sync-pill, #btn-search, #btn-warroom, #btn-menu')].map(e => e.getBoundingClientRect());
        return { droite: Math.max(...els.map(x => x.right)), gauche: Math.min(...els.map(x => x.left)), haut: Math.min(...els.slice(2).map(x => x.height)), large: Math.min(...els.slice(2).map(x => x.width)), lignes: Math.round(document.getElementById('btn-warroom').getBoundingClientRect().height),
                 chevauche: els.some((a, i) => els.some((b, j) => j > i && a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom && a.bottom > b.top && !(i === 0 && j === 1))) }; }, lbl);
      if (r.droite > w + 0.5 || r.gauche < 0 || r.haut < 43.5 || r.large < 43.5 || r.chevauche) vus.push(`${w} px « ${lbl} » : droite ${Math.round(r.droite)}, cible ${Math.round(r.large)}×${Math.round(r.haut)}${r.chevauche ? ', chevauchement' : ''}`);
    }
    await ctx.close();
  }
  ok(!vus.length, 'Barre du haut : aucun bouton ne sort de l\'écran ni ne se chevauche, de 360 à 430 px, quel que soit l\'état de synchronisation', vus.slice(0, 4).join(' ; ') || '4 largeurs × 5 états');
}

/* Le moment de la journée : un mot et un pictogramme, jamais d'emoji */
{
  const { ctx, page } = await openPage(browser, url, { fk: fakeSupabase(), clock: '2026-10-08T03:00:00+02:00' });
  const lire = () => page.evaluate(() => { renderHome(); const b = document.getElementById('h-context-badge'), i = b.querySelector('.h-context-ico'), m = getComputedStyle(i); return b.getAttribute('data-slot') + ':' + document.getElementById('h-context-txt').textContent + ':' + (/url\(/.test(m.maskImage || m.webkitMaskImage || '') ? 'picto' : 'rien'); });
  const vus = [await lire()];
  for (const h of [6, 7, 7]) { await page.clock.fastForward(h * 3600e3); vus.push(await lire()); }
  ok(vus.join(' | ') === 'nuit:Nuit:picto | matin:Matin:picto | aprem:Après-midi:picto | soir:Soirée:picto', 'Le moment de la journée : Nuit, Matin, Après-midi, Soirée, avec un pictogramme au trait', vus.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
