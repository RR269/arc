// Tests de « Relier » (11 octobre) : les liens d'ARC sont réels, proposés avec leur raison, confirmés par Rayan.
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/relier.mjs
// Supabase et le proxy sont remplacés par de faux serveurs : aucune requête ne part vers le vrai projet.
//
// Ce qui est vérifié : ATLAS propose FBA avec les mots en commun ; « Relier » et « Pas lié » ; le lien tient au
// rechargement et se voit des deux côtés ; un projet endormi dit qu'un projet lié avance (monde et accueil) ; une
// pensée nouvelle ramène l'ancienne qui parle de la même chose (au dépôt et dans « Déposé ») ; une pensée sans rapport
// ne ramène rien ; deux appareils qui relient chacun de leur côté gardent les deux liens ; la charte (cibles,
// contraste, écriture).

import { chromium, startServer, fakeSupabase, openPage, sessionScript, deposit } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';

const rangeInconnu = async body => body.task === 'file'
  ? { status: 200, json: { filing: { space: 'inconnu', confidence: 'unsure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } }
  : { status: 200, json: { content: [{ type: 'text', text: 'ok' }] } };
async function appareil(fk, vp = { width: 390, height: 844, tel: true }) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: !!vp.tel, hasTouch: !!vp.tel,
    serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  return openPage(browser, url, { ctx, fk });
}
const ouvrir = async (page, wid) => { await page.evaluate(w => { showScreen && enterWorld(w); }, wid); await page.waitForTimeout(300); };
const liens = page => page.evaluate(() => ({
  visible: !document.getElementById('wsec-liens').hidden,
  props: [...document.querySelectorAll('#wlien-list .wlien-prop')].map(c => c.textContent),
  oui: [...document.querySelectorAll('#wlien-list .wlien-row')].map(r => r.textContent),
  dort: document.getElementById('wlien-dort').hidden ? '' : document.getElementById('wlien-dort').textContent }));

// ── 1. Projets liés : ATLAS ↔ FBA ──
{
  const fk = fakeSupabase(); fk.proxy = rangeInconnu;
  const { page, errors, ctx } = await appareil(fk);
  await ouvrir(page, 4);
  let l = await liens(page);
  const prop = l.props.find(t => /FBA/.test(t)) || '';
  ok(l.visible && /ARC voit un lien avec FBA/.test(prop) && /En commun : .*FBA/.test(prop),
    'ATLAS propose FBA, avec les mots en commun', prop);
  ok(!l.props.some(t => /TELENEUF/.test(t)), 'Pas de lien inventé (ATLAS ↔ TELENEUF)', l.props.join(' | '));
  // Cibles des deux touches
  const cibles = await page.evaluate(() => [...document.querySelectorAll('#wlien-list button')].map(b => Math.round(b.getBoundingClientRect().height)));
  ok(cibles.length && cibles.every(h => h >= 44), 'Touches de 44 px au moins', cibles.join(', '));
  // Charte : écriture et contraste de la section
  const ecr = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#wsec-liens .wsec-lbl')); return c.fontSize + ' ' + c.fontWeight; });
  ok(/^17px (600|590)/.test(ecr), 'Titre de section à 17 px demi-gras', ecr);
  await page.evaluate(() => document.getElementById('wsec-liens').scrollIntoView({ block: 'center' })); await page.waitForTimeout(150);
  const m = await mesurer(page, { racine: '#wsec-liens', cadre: '#wsec-liens' });
  ok(m.n > 3 && m.pire.ratio >= 4.5, 'Contraste de « Projets liés » ≥ 4,5 : 1', fmt(m.pire.ratio) + ' sur ' + m.n + (m.sous.length ? ' · ' + JSON.stringify(m.sous.slice(0, 2)) : ''));

  // Relier
  await page.locator('#wlien-list .wlien-prop', { hasText: 'FBA' }).getByRole('button', { name: 'Relier' }).click();
  await page.waitForTimeout(200);
  l = await liens(page);
  const stocke = await page.evaluate(() => S.liens.p_1_4);
  ok(stocke && stocke.etat === 'oui' && stocke.mots.length && l.oui.some(t => /FBA/.test(t) && /Endormi/.test(t)) && !l.props.some(t => /FBA/.test(t)),
    '« Relier » : FBA devient un projet lié, endormi, avec sa raison', JSON.stringify(stocke) + ' | ' + l.oui.join(' | '));

  // « Pas lié » sur une autre proposition éventuelle : jamais reproposée
  const autre = await page.evaluate(() => { const c = document.querySelector('#wlien-list .wlien-prop'); return c ? c.getAttribute('data-prop') : null; });
  if (autre !== null) {
    await page.locator('#wlien-list .wlien-prop').first().getByRole('button', { name: 'Pas lié' }).click();
    await page.waitForTimeout(150);
    const encore = await page.evaluate(a => !!document.querySelector('#wlien-list [data-prop="' + a + '"]'), autre);
    ok(!encore, '« Pas lié » : la proposition disparaît et ne revient pas', autre);
  } else ok(true, '« Pas lié » : aucune autre proposition à refuser', '');

  // ATLAS a bougé aujourd'hui → FBA, endormi, le dit ; l'accueil aussi
  await page.evaluate(() => { S.journal[4] = (S.journal[4] || []).concat([{ ts: Date.now(), txt: 'Essai' }]); saveS(true); });
  await page.reload(); await page.waitForTimeout(900); await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  await ouvrir(page, 1);
  l = await liens(page);
  ok(l.oui.some(t => /ATLAS/.test(t)) && /Ce projet dort\. ATLAS, lié, avance ?: actif aujourd/.test(l.dort.replace(/’/g, "'")),
    'Rechargé, FBA montre ATLAS et dit qu\'il avance', l.dort + ' | ' + l.oui.join(' | '));
  await page.evaluate(() => { goHome(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { const t = document.getElementById('h-dort-tog'); if (t && t.getAttribute('aria-expanded') !== 'true') t.click(); }); await page.waitForTimeout(200);
  const accueil = await page.evaluate(() => [...document.querySelectorAll('#h-dort-list .h-dort-row')].map(r => r.textContent));
  ok(accueil.some(t => /FBA/.test(t) && /Lié à ATLAS/.test(t)), 'Accueil, Endormis : « FBA · Lié à ATLAS »', accueil.join(' | '));
  ok(!errors.length, 'Aucune erreur de console (projets)', errors.join(' | '));
  await ctx.close();
}

// ── 2. La mémoire qui revient ──
{
  const fk = fakeSupabase(); fk.proxy = rangeInconnu;
  const { page, errors, ctx } = await appareil(fk);
  const A = 'Appeler le comptable pour la TVA d’ATLAS', B = 'Demander au comptable quel régime de TVA choisir', C = 'Acheter du pain';
  await deposit(page, A); await page.waitForTimeout(400);
  await deposit(page, C); await page.waitForTimeout(400);
  await deposit(page, B); await page.waitForTimeout(150);
  const note = await page.evaluate(() => document.getElementById('depot-note').textContent);
  ok(/ça rejoint une pensée déposée/.test(note), 'Au dépôt : « ça rejoint une pensée déposée… »', note);
  await page.evaluate(() => depotOpen()); await page.waitForTimeout(250);
  const vue = await page.evaluate(([a, b, c]) => {
    const item = t => [...document.querySelectorAll('#depot-list .depot-item')].find(i => i.querySelector('.depot-body').textContent === t);
    const txt = (t, s) => { const i = item(t); const e = i && i.querySelector(s); return e ? e.textContent : ''; };
    return { b: txt(b, '.rl-prop'), a: txt(a, '.rl'), c: txt(c, '.rl') };
  }, [A, B, C]);
  ok(/Ça rejoint une pensée déposée/.test(vue.b) && vue.b.includes('Appeler le comptable') && /En commun : .*comptable/i.test(vue.b) && /TVA/.test(vue.b),
    'Dans « Déposé », la nouvelle pensée ramène l\'ancienne, avec les mots en commun', vue.b);
  ok(!vue.a && !vue.c, 'L\'ancienne ne propose rien ; « Acheter du pain » ne ramène rien', JSON.stringify(vue));
  const btn = await page.evaluate(() => [...document.querySelectorAll('#depot-list .rl button')].map(b => Math.round(b.getBoundingClientRect().height)));
  ok(btn.every(h => h >= 44), 'Touches de la mémoire de 44 px au moins', btn.join(', '));
  const m = await mesurer(page, { racine: '#depot-list .rl-prop', cadre: '#depot-list .rl-prop' });
  ok(m.n > 2 && m.pire.ratio >= 4.5, 'Contraste de la mémoire ≥ 4,5 : 1', fmt(m.pire.ratio) + ' sur ' + m.n);
  await page.locator('#depot-list .rl-prop').getByRole('button', { name: 'Relier' }).click(); await page.waitForTimeout(200);
  const apres = await page.evaluate(([a, b]) => {
    const item = t => [...document.querySelectorAll('#depot-list .depot-item')].find(i => i.querySelector('.depot-body').textContent === t);
    return { a: (item(a).querySelector('.rl-lie') || {}).textContent || '', b: (item(b).querySelector('.rl-lie') || {}).textContent || '', prop: !!document.querySelector('#depot-list .rl-prop'),
      n: Object.values(S.liens).filter(l => l.type === 'pensee' && l.etat === 'oui').length };
  }, [A, B]);
  ok(apres.n === 1 && /Reliée à.*Demander au comptable/.test(apres.a) && /Reliée à.*Appeler le comptable/.test(apres.b) && !apres.prop,
    '« Relier » : les deux pensées se montrent l\'une l\'autre', JSON.stringify(apres));
  ok(!errors.length, 'Aucune erreur de console (pensées)', errors.join(' | '));
  await ctx.close();
}

// ── 3. Deux appareils relient chacun de leur côté : la synchronisation garde les deux ──
{
  const fk = fakeSupabase(); fk.proxy = rangeInconnu;
  const { page, ctx } = await appareil(fk);
  const r = await page.evaluate(() => {
    const base = JSON.parse(JSON.stringify(S)); base.liens = {};
    const l = JSON.parse(JSON.stringify(base)), d = JSON.parse(JSON.stringify(base));
    l.liens = { p_1_4: { id: 'p_1_4', type: 'projet', a: '1', b: '4', etat: 'oui', mots: ['FBA'], at: 'x' } }; l._lastAction = 2;
    d.liens = { p_0_2: { id: 'p_0_2', type: 'projet', a: '0', b: '2', etat: 'non', mots: [], at: 'y' } }; d._lastAction = 3;
    return Object.keys(syncFusionner(base, l, d, []).liens).sort().join(',');
  });
  ok(r === 'p_0_2,p_1_4', 'Synchronisation : les liens des deux appareils sont gardés', r);
  await ctx.close();
}

// ── 4. La planète de l'accueil ne dessine que ce qui existe ──
{
  const fk = fakeSupabase();
  fk.proxy = async body => body.task === 'file'
    ? { status: 200, json: { filing: /comptable/i.test(body.thought.body) ? { space: 'juridique', confidence: 'sure', step: 'Appeler', moment: { type: 'none' }, extras: [] } : /module/i.test(body.thought.body) ? { space: 'atlas', confidence: 'sure', step: 'Écrire', moment: { type: 'none' }, extras: [] } : { space: 'inconnu', confidence: 'unsure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } }
    : { status: 200, json: { content: [{ type: 'text', text: 'ok' }] } };
  const { page, errors, ctx } = await appareil(fk);
  let sc = await page.evaluate(() => ({ lum: _pl.scene.esp.reduce((n, e) => n + e.lum.length, 0), ponts: _pl.scene.ponts.length, syn: _pl.scene.synapses.length, orb: _pl.scene.orbite.length, esp: _pl.scene.esp.length, attendu: WORLDS.length + POLES.length }));
  ok(sc.lum === 0 && sc.ponts === 0 && sc.syn === 0 && sc.orb === 0 && sc.esp === sc.attendu, 'Planète, compte neuf : une région par espace, aucune lumière ni aucun fil', JSON.stringify(sc));
  for (const t of ['Appeler le comptable pour la TVA', 'Demander au comptable le régime de TVA', 'Écrire le module 4', 'Une idée en vrac']) { await deposit(page, t); await page.waitForTimeout(500); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { rlPoser('projet', 4, 1, 'oui', ['FBA']); const ts = Object.values(_depot.thoughts); rlPoser('pensee', ts.find(x => /Appeler/.test(x.body)).id, ts.find(x => /Demander/.test(x.body)).id, 'oui', ['comptable']); goHome(); renderHome(); });
  await page.waitForTimeout(300);
  sc = await page.evaluate(() => ({ jur: _pl.scene.esp.find(e => e.k === 'juridique').lum.length, atlas: _pl.scene.esp.find(e => e.k === 'atlas').lum.length,
    lum: _pl.scene.esp.reduce((n, e) => n + e.lum.length, 0), ponts: _pl.scene.ponts.map(p => p.a.n + '-' + p.b.n).join(), syn: _pl.scene.synapses.length, orb: _pl.scene.orbite.length, aRanger: rangeToSortCount(),
    fba: _pl.scene.esp.find(e => e.n === 'FBA').dort, fusion: getComputedStyle(document.getElementById('h-planete')).mixBlendMode, vu: _pl.vu }));
  ok(sc.jur === 2 && sc.atlas === 1 && sc.lum === 3 && /ATLAS/.test(sc.ponts) && /FBA/.test(sc.ponts) && sc.syn === 1 && sc.orb === sc.aRanger && sc.orb === 1 && sc.fba && sc.fusion === 'normal' && sc.vu,
    'Planète : une lumière par pensée rangée, un pont par projets reliés, un fil par pensées reliées, l\'orbite = pensées à ranger', JSON.stringify(sc));
  // Mouvement réduit : une image, pas d'animation qui tourne
  const raf = await page.evaluate(() => _pl.raf);
  ok(!raf, 'Mouvement réduit : la planète est une image fixe', String(raf));
  // Toucher la région d'ATLAS ouvre ATLAS
  const pt = await page.evaluate(() => { const e = _pl.scene.esp.find(x => x.k === 'atlas'), r = document.getElementById('h-planete').getBoundingClientRect(); return { x: r.left + e.cap[0], y: r.top + e.cap[1] }; });
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && CUR.wid === 4);
  ok(ouvert, 'Toucher la région d\'ATLAS ouvre ATLAS', JSON.stringify(pt));
  ok(!errors.length, 'Aucune erreur de console (planète)', errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'OK   ' : 'ÉCHEC') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')); }
console.log('\n' + (results.length - fails) + ' / ' + results.length + ' contrôles passent');
process.exit(fails ? 1 : 0);
