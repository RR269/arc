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
  // Chaque point autour d'un espace est une chose réelle : pensées rangées, tâches faites, entrées de journal
  const reel = () => page.evaluate(() => {
    const sc = _pl.band.sc, ecarts = [];
    sc.esp.forEach(e => { const w = monde(e.id), fait = S.tasks[w.id] || {};
      const taches = (w.tasks_done || []).concat(w.tasks_todo || [], S.custom[w.id] || []).filter(t => fait[t.id]).length;
      const attendu = penseesDe(espaceCle(w)).length + taches + (S.journal[w.id] || []).filter(j => j && (j.t || j.txt)).length;
      if (e.items.length !== attendu) ecarts.push(e.n + ' ' + e.items.length + '≠' + attendu); });
    return { ecarts, poles: sc.poles.map(e => e.n).join(), surPlanete: sc.tous.filter(e => e.pole).length, zone: sc.poles.every(e => e.u > .7) && sc.esp.every(e => e.u < .72), pts: sc.esp.some(e => e.pts) };
  });
  let r = await reel();
  ok(!r.ecarts.length && r.surPlanete === 2 && r.zone && !r.pts, 'Planète : autour de chaque projet, un point par chose réelle (aucun point de décor) ; Santé et Juridique sur la planète, dans leur zone « Ma vie »', JSON.stringify(r));
  for (const t of ['Appeler le comptable pour la TVA', 'Demander au comptable le régime de TVA', 'Écrire le module 4', 'Une idée en vrac']) { await deposit(page, t); await page.waitForTimeout(500); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { rlPoser('projet', 4, 1, 'oui', ['FBA']); const ts = Object.values(_depot.thoughts); rlPoser('pensee', ts.find(x => /Appeler/.test(x.body)).id, ts.find(x => /Demander/.test(x.body)).id, 'oui', ['comptable']); S.journal[4].push({ ts: Date.now(), t: 'Module 3 relu' }); saveS(true); goHome(); renderHome(); });
  await page.waitForTimeout(300);
  r = await reel();
  let sc = await page.evaluate(() => { const sc = _pl.band.sc, at = sc.esp.find(e => e.k === 'atlas'); return { atlasPens: at.lum.length, atlasJour: at.items.filter(i => i.type === 'journal').length, jur: sc.poles.find(e => e.id === 'juridique').lum.length, ponts: sc.ponts.map(p => p.a.n + '-' + p.b.n).join(), syn: sc.synapses.length, orb: sc.orbite.length, aRanger: rangeToSortCount(), fbaDerriere: sc.esp.find(e => e.n === 'FBA').v < at.v, fusion: getComputedStyle(document.getElementById('h-planete')).mixBlendMode }; });
  ok(!r.ecarts.length && sc.atlasPens === 1 && sc.atlasJour >= 1 && sc.jur === 2 && /ATLAS/.test(sc.ponts) && /FBA/.test(sc.ponts) && sc.syn === 1 && sc.orb === sc.aRanger && sc.orb === 1 && sc.fbaDerriere && sc.fusion === 'normal',
    'Planète : la pensée et l\'entrée de journal s\'ajoutent autour d\'ATLAS, les pensées juridiques dans Ma vie, le pont, le fil, l\'orbite = pensées à ranger, l\'endormi derrière', JSON.stringify({ ...sc, ecarts: r.ecarts }));
  const raf = await page.evaluate(() => _pl.raf);
  ok(!raf, 'Mouvement réduit : la planète est une image fixe', String(raf));
  // La carte : ouverte depuis la bande ; plus de touches + et − ; on la parcourt
  const coin = await page.evaluate(() => { const r = document.getElementById('h-orbite').getBoundingClientRect(); return { x: r.left + 12, y: r.bottom - 12 }; });
  await page.mouse.click(coin.x, coin.y); await page.waitForTimeout(300);
  let c = await page.evaluate(() => ({ ouvert: carteOuverte(), boutons: document.querySelectorAll('#carte-plus, #carte-moins, #carte-centre, .carte-zoom').length, faits: document.getElementById('carte-faits').textContent, s: _pl.carte.s }));
  ok(c.ouvert && c.boutons === 0 && /1 pensée en orbite, à ranger/.test(c.faits) && /FBA dort, lié à ATLAS/.test(c.faits), 'Carte : ouverte depuis la bande, sans touches + ni −, une ligne de faits vrais', JSON.stringify(c));
  // Glisser : la carte bouge (et un glissé n'ouvre rien)
  const v0 = await page.evaluate(() => ({ tx: _pl.carte.tx, ty: _pl.carte.ty }));
  await page.mouse.move(200, 500); await page.mouse.down(); await page.mouse.move(150, 430, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(100);
  const v1 = await page.evaluate(() => ({ tx: _pl.carte.tx, ty: _pl.carte.ty, fiche: !document.getElementById('carte-fiche').hidden }));
  // Pincer (pavé du Mac) : rapproche puis éloigne, dans les bornes
  await page.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById('carte-cv').dispatchEvent(new WheelEvent('wheel', { deltaY: -40, ctrlKey: true, clientX: 195, clientY: 500, bubbles: true, cancelable: true })); });
  const sGrand = await page.evaluate(() => _pl.carte.s);
  await page.evaluate(() => { for (let i = 0; i < 60; i++) document.getElementById('carte-cv').dispatchEvent(new WheelEvent('wheel', { deltaY: 40, ctrlKey: true, clientX: 195, clientY: 500, bubbles: true, cancelable: true })); });
  const sPetit = await page.evaluate(() => [_pl.carte.s, _pl.carte.sMin, _pl.carte.sMax]);
  ok((v1.tx !== v0.tx || v1.ty !== v0.ty) && !v1.fiche && sGrand > c.s * 2 && Math.abs(sPetit[0] - sPetit[1]) < 1e-6, 'Carte : glisser la déplace sans rien ouvrir ; pincer rapproche et éloigne, jusqu\'aux bornes', JSON.stringify({ v0, v1, s0: c.s, sGrand, sPetit }));
  await page.keyboard.press('0'); await page.waitForTimeout(100);
  // Toucher un point : la fiche dit ce qu'il représente
  const fiche = async (trouver) => { const p = await page.evaluate(trouver); await page.mouse.click(p.x, p.y); await page.waitForTimeout(150); return page.evaluate(() => ({ vis: !document.getElementById('carte-fiche').hidden, k: document.getElementById('cf-k').textContent, t: document.getElementById('cf-t').textContent, b: [...document.querySelectorAll('#cf-acts button')].map(x => x.textContent), h: [...document.querySelectorAll('#cf-acts button')].map(x => Math.round(x.getBoundingClientRect().height)) })); };
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.k === 'atlas'); V.s = V.sMax * .5; V.tx = innerWidth / 2 - e.cap[0] * V.s; V.ty = innerHeight * .45 - e.cap[1] * V.s; carteBorner(V); carteRedessin(); });
  let f = await fiche(() => { const V = _pl.carte, it = V.sc.esp.find(x => x.k === 'atlas').items.find(i => i.type === 'journal'); return { x: it.s[0] * V.s + V.tx, y: it.s[1] * V.s + V.ty }; });
  ok(f.vis && /^Journal · ATLAS/.test(f.k) && f.t === 'Module 3 relu' && f.b.includes('Ouvrir ATLAS') && f.h.every(h => h >= 44), 'Carte : toucher un point ouvre sa fiche (« Journal · ATLAS », ses mots, « Ouvrir ATLAS »)', JSON.stringify(f));
  const m = await mesurer(page, { racine: '#carte-fiche', cadre: '#carte-fiche' });
  ok(m.n > 2 && m.pire.ratio >= 4.5, 'Carte : contraste de la fiche ≥ 4,5 : 1', fmt(m.pire.ratio) + ' sur ' + m.n);
  // Un endormi se travaille : sa fiche propose « Réveiller »
  await page.keyboard.press('0'); await page.waitForTimeout(100);
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.n === 'FBA'); V.s = V.sMax * .4; V.tx = innerWidth / 2 - e.cap[0] * V.s; V.ty = innerHeight * .45 - e.cap[1] * V.s; carteBorner(V); carteRedessin(); });
  f = await fiche(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.n === 'FBA'); return { x: e.cap[0] * V.s + V.tx, y: e.cap[1] * V.s + V.ty }; });
  const okFba = f.vis && f.k === 'Projet endormi' && f.t === 'FBA' && f.b.join() === 'Réveiller,Ouvrir FBA';
  await page.click('#cf-acts button:first-child'); await page.waitForTimeout(200);
  const reveil = await page.evaluate(() => ({ dort: mondeDort(1), k: document.getElementById('cf-k').textContent }));
  ok(okFba && !reveil.dort && reveil.k === 'Projet', 'Carte : la fiche d\'un endormi propose « Réveiller », et le réveil se fait sur place', JSON.stringify({ f, reveil }));
  await page.evaluate(() => mondeSommeil(1, true));
  // Ouvrir un espace depuis sa fiche ; Échap ferme la fiche, puis la carte
  await page.keyboard.press('Escape'); const sansFiche = await page.evaluate(() => document.getElementById('carte-fiche').hidden && carteOuverte());
  await page.keyboard.press('Escape'); const fermee = await page.evaluate(() => !carteOuverte());
  await page.evaluate(() => carteOuvrir()); await page.waitForTimeout(150);
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.k === 'atlas'); carteFiche(e); });
  await page.click('#cf-acts .cf-b1'); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && CUR.wid === 4 && !carteOuverte());
  ok(sansFiche && fermee && ouvert, 'Carte : Échap ferme la fiche puis la carte ; « Ouvrir ATLAS » ouvre ATLAS', JSON.stringify({ sansFiche, fermee, ouvert }));
  ok(!errors.length, 'Aucune erreur de console (planète et carte)', errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'OK   ' : 'ÉCHEC') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')); }
console.log('\n' + (results.length - fails) + ' / ' + results.length + ' contrôles passent');
process.exit(fails ? 1 : 0);
