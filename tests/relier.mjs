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

// ── 4. La planète de l'accueil et la carte ne dessinent que ce qui existe ──
{
  const fk = fakeSupabase();
  fk.proxy = async body => body.task === 'file'
    ? { status: 200, json: { filing: /comptable/i.test(body.thought.body) ? { space: 'juridique', confidence: 'sure', step: 'Appeler', moment: { type: 'none' }, extras: [] } : /module/i.test(body.thought.body) ? { space: 'atlas', confidence: 'sure', step: 'Écrire', moment: { type: 'none' }, extras: [] } : { space: 'inconnu', confidence: 'unsure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } }
    : { status: 200, json: { content: [{ type: 'text', text: 'ok' }] } };
  const { page, errors, ctx } = await appareil(fk);
  const bande = () => page.evaluate(() => { const sc = _pl.band.sc; return { lum: sc.esp.reduce((n, e) => n + e.lum.length, 0), ponts: sc.ponts.map(p => p.a.n + '-' + p.b.n).join(), syn: sc.synapses.length, orb: sc.orbite.length, esp: sc.esp.length, poles: sc.esp.filter(e => e.pole).length, attendu: WORLDS.length }; });
  let sc = await bande();
  ok(sc.lum === 0 && !sc.ponts && sc.syn === 0 && sc.orb === 0 && sc.esp === sc.attendu && sc.poles === 0, 'Planète, compte neuf : une région par projet (ni Santé ni Juridique), aucune lumière ni aucun fil', JSON.stringify(sc));
  for (const t of ['Appeler le comptable pour la TVA', 'Demander au comptable le régime de TVA', 'Écrire le module 4', 'Une idée en vrac']) { await deposit(page, t); await page.waitForTimeout(500); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { rlPoser('projet', 4, 1, 'oui', ['FBA']); const ts = Object.values(_depot.thoughts); rlPoser('pensee', ts.find(x => /Appeler/.test(x.body)).id, ts.find(x => /Demander/.test(x.body)).id, 'oui', ['comptable']); goHome(); renderHome(); });
  await page.waitForTimeout(300);
  sc = await page.evaluate(() => { const sc = _pl.band.sc; return { atlas: sc.esp.find(e => e.k === 'atlas').lum.length, lum: sc.esp.reduce((n, e) => n + e.lum.length, 0), ponts: sc.ponts.map(p => p.a.n + '-' + p.b.n).join(), orb: sc.orbite.length, aRanger: rangeToSortCount(), fba: sc.esp.find(e => e.n === 'FBA').dort, fbaDevant: sc.esp.find(e => e.n === 'FBA').v > sc.esp.find(e => e.k === 'atlas').v, fusion: getComputedStyle(document.getElementById('h-planete')).mixBlendMode, vu: _pl.vu }; });
  ok(sc.atlas === 1 && sc.lum === 1 && /ATLAS/.test(sc.ponts) && /FBA/.test(sc.ponts) && sc.orb === sc.aRanger && sc.orb === 1 && sc.fba && !sc.fbaDevant && sc.fusion === 'normal' && sc.vu,
    'Planète : une lumière par pensée rangée dans un projet, un pont par projets reliés, l\'orbite = pensées à ranger, l\'endormi derrière', JSON.stringify(sc));
  const raf = await page.evaluate(() => _pl.raf);
  ok(!raf, 'Mouvement réduit : la planète est une image fixe', String(raf));
  // Toucher la bande hors d'une région ouvre la carte ; Santé et Juridique y sont sur leur lune
  const coin = await page.evaluate(() => { const r = document.getElementById('h-orbite').getBoundingClientRect(); return { x: r.left + 20, y: r.top + 20 }; });
  await page.mouse.click(coin.x, coin.y); await page.waitForTimeout(300);
  let c = await page.evaluate(() => { const V = _pl.carte, sc = V && V.sc; return { ouvert: carteOuverte(), poles: sc && sc.poles.map(e => e.n + ':' + e.lum.length).join(), surPlanete: sc && sc.esp.some(e => e.pole), syn: sc && sc.synapses.length, faits: document.getElementById('carte-faits').textContent }; });
  ok(c.ouvert && c.poles === 'Santé:0,Juridique:2' && !c.surPlanete && c.syn === 1 && /1 pensée à ranger/.test(c.faits) && /FBA dort, lié à ATLAS/.test(c.faits),
    'Carte : ouverte depuis la bande ; Santé et Juridique sur la lune « Ma vie » ; le fil entre pensées reliées ; une ligne de faits vrais', JSON.stringify(c));
  // Charte de la carte : touches de 44 px, contraste de la barre du haut
  const cib = await page.evaluate(() => [...document.querySelectorAll('#carte button')].map(b => Math.round(Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))));
  const m = await mesurer(page, { racine: '#carte .carte-haut', cadre: '#carte .carte-haut' });
  ok(cib.every(h => h >= 44) && m.n > 2 && m.pire.ratio >= 4.5, 'Carte : touches de 44 px au moins, contraste de la barre ≥ 4,5 : 1', cib.join(', ') + ' · ' + fmt(m.pire.ratio));
  // Toucher ATLAS de loin : la carte se rapproche ; de près : ATLAS s'ouvre
  const cap = () => page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.k === 'atlas'); return { x: e.cap[0] * V.s + V.tx, y: e.cap[1] * V.s + V.ty, s: V.s }; });
  let p = await cap(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(200);
  const s1 = (await cap()).s;
  ok(s1 > 2 && await page.evaluate(() => carteOuverte()), 'Carte : toucher une région de loin la rapproche', 'échelle ' + s1.toFixed(2));
  // De près, la pensée se lit (dessinée sur le canevas : on vérifie qu'elle est à l'écran) puis ATLAS s'ouvre
  const lisible = await page.evaluate(() => { const V = _pl.carte, L = V.sc.esp.find(x => x.k === 'atlas').lum[0], q = [L.s[0] * V.s + V.tx, L.s[1] * V.s + V.ty]; return q[0] > 0 && q[0] < innerWidth && q[1] > 0 && q[1] < innerHeight; });
  p = await cap(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && CUR.wid === 4 && !carteOuverte());
  ok(lisible && ouvert, 'Carte : de près, la pensée est à l\'écran, et toucher ATLAS ouvre ATLAS', JSON.stringify({ lisible, ouvert }));
  // Rapprocher et éloigner : touches, molette du pavé (pincer), bornes 1 à 5, Échap ferme
  await page.evaluate(() => { goHome(); carteOuvrir(); }); await page.waitForTimeout(200);
  await page.click('#carte-plus'); const sp = await page.evaluate(() => _pl.carte.s);
  await page.mouse.move(195, 500); for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120).catch(() => {});
  await page.evaluate(() => { for (let i = 0; i < 20; i++) document.getElementById('carte-cv').dispatchEvent(new WheelEvent('wheel', { deltaY: -60, ctrlKey: true, clientX: 195, clientY: 500, bubbles: true, cancelable: true })); });
  const smax = await page.evaluate(() => _pl.carte.s);
  await page.click('#carte-centre'); await page.waitForTimeout(100);
  const s0 = await page.evaluate(() => _pl.carte.s);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const ferme = await page.evaluate(() => !carteOuverte());
  ok(sp > 1.5 && smax === 5 && s0 === 1 && ferme, 'Carte : « + », pincer au pavé jusqu\'à 5 fois, « vue d\'ensemble », Échap ferme', JSON.stringify({ sp, smax, s0, ferme }));
  ok(!errors.length, 'Aucune erreur de console (planète et carte)', errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'OK   ' : 'ÉCHEC') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')); }
console.log('\n' + (results.length - fails) + ' / ' + results.length + ' contrôles passent');
process.exit(fails ? 1 : 0);
