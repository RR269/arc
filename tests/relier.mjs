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
    return { ecarts, poles: sc.poles.map(e => e.n).join(), surPlanete: sc.tous.filter(e => e.pole).length, zone: (() => { const vie = sc.sections.find(x => x.cle === 'vie'), sa = sc.poles.find(e => e.id === 'sante'), ju = sc.poles.find(e => e.id === 'juridique'); return !!vie && sc.poles.every(e => e.cap[0] > vie.x0) && sc.esp.every(e => e.cap[0] < vie.x0) && sa.cap[1] < ju.cap[1]; })(), pts: sc.esp.some(e => e.pts) };
  });
  let r = await reel();
  ok(!r.ecarts.length && r.surPlanete === 2 && r.zone && !r.pts, 'Planète : autour de chaque projet, un point par chose réelle (aucun point de décor) ; Santé et Juridique sur la planète, dans leur colonne « Ma vie » sur le bord droit, hors du champ des projets, Santé au-dessus de Juridique', JSON.stringify(r));
  for (const t of ['Appeler le comptable pour la TVA', 'Demander au comptable le régime de TVA', 'Écrire le module 4', 'Une idée en vrac']) { await deposit(page, t); await page.waitForTimeout(500); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => { rlPoser('projet', 4, 1, 'oui', ['FBA']); const ts = Object.values(_depot.thoughts); rlPoser('pensee', ts.find(x => /Appeler/.test(x.body)).id, ts.find(x => /Demander/.test(x.body)).id, 'oui', ['comptable']); S.journal[4].push({ ts: Date.now(), t: 'Module 3 relu' }); saveS(true); goHome(); renderHome(); });
  await page.waitForTimeout(300);
  r = await reel();
  let sc = await page.evaluate(() => { const sc = _pl.band.sc, at = sc.esp.find(e => e.k === 'atlas'); return { atlasPens: at.lum.length, atlasJour: at.items.filter(i => i.type === 'journal').length, jur: sc.poles.find(e => e.id === 'juridique').lum.length, ponts: sc.ponts.map(p => p.a.n + '-' + p.b.n).join(), syn: sc.synapses.length, orb: sc.orbite.length, aRanger: rangeToSortCount(), fbaDerriere: sc.esp.find(e => e.n === 'FBA').cap[1] < at.cap[1], fusion: getComputedStyle(document.getElementById('h-planete')).mixBlendMode }; });
  ok(!r.ecarts.length && sc.atlasPens === 1 && sc.atlasJour >= 1 && sc.jur === 2 && /ATLAS/.test(sc.ponts) && /FBA/.test(sc.ponts) && sc.syn === 1 && sc.orb === sc.aRanger && sc.orb === 1 && sc.fbaDerriere && sc.fusion === 'normal',
    'Planète : la pensée et l\'entrée de journal s\'ajoutent autour d\'ATLAS, les pensées juridiques dans Ma vie, le pont, le fil, l\'orbite = pensées à ranger, l\'endormi derrière', JSON.stringify({ ...sc, ecarts: r.ecarts }));
  const raf = await page.evaluate(() => _pl.raf);
  ok(!raf, 'Mouvement réduit : la planète est une image fixe', String(raf));
  // La carte : ouverte depuis la bande ; plus de touches + et − ; on la parcourt
  const coin = await page.evaluate(() => { const r = document.getElementById('h-orbite').getBoundingClientRect(); return { x: r.left + 12, y: r.bottom - 12 }; });
  await page.mouse.click(coin.x, coin.y); await page.waitForTimeout(300);
  let c = await page.evaluate(() => ({ ouvert: carteOuverte(), boutons: document.querySelectorAll('#carte-plus, #carte-moins, #carte-centre, .carte-zoom').length, faits: document.getElementById('carte-ranger').hidden ? '' : document.getElementById('carte-ranger').textContent, titre: document.querySelector('#carte .carte-t').textContent, s: _pl.carte.s }));
  const ordre = await page.evaluate(() => {
    const V = _pl.carte, sc = V.sc, et = V.etiquettes || [], croise = [];
    for (let i = 0; i < et.length; i++) for (let j = i + 1; j < et.length; j++) { const a = et[i], b = et[j]; if (a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]) croise.push(i + '×' + j); }
    const y = f => sc.tous.filter(f).map(e => e.cap[1]);
    const bande = _pl.band.etiquettes || [], croiseB = [];
    for (let i = 0; i < bande.length; i++) for (let j = i + 1; j < bande.length; j++) { const a = bande[i], b = bande[j]; if (a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]) croiseB.push(i + '×' + j); }
    return { noms: et.length, croise, croiseB, rangs: sc.sections.map(s => s.titre).join(','), dortHaut: Math.max(...y(e => e.dort)) < Math.min(...y(e => !e.dort && !e.pole)), vieBas: (() => { const vie = sc.sections.find(x => x.cle === 'vie'), sa = sc.poles.find(e => e.id === 'sante'), ju = sc.poles.find(e => e.id === 'juridique'); return !!vie && sc.poles.every(e => e.cap[0] > vie.x0) && sc.esp.every(e => e.cap[0] + e.cellW / 2 <= vie.x0 + 1) && sa.cap[1] < ju.cap[1]; })(), legende: !!document.getElementById('carte-legende') && getComputedStyle(document.getElementById('carte-legende')).display !== 'none' };
  });
  ok(ordre.noms >= 6 && !ordre.croise.length && !ordre.croiseB.length && ordre.rangs === 'Endormis,En cours,Ma vie' && ordre.dortHaut && ordre.vieBas && ordre.legende,
    'Carte réglée : Endormis et En cours dans le champ, Ma vie en colonne à droite (Santé puis Juridique), aucun nom sur un autre (carte et accueil), une légende des points', JSON.stringify(ordre));
  ok(c.ouvert && c.boutons === 0 && c.titre === 'Carte' && c.faits === '1 pensée à ranger', 'Carte : ouverte depuis la bande, sans touches + ni −, un en-tête d\'une ligne et une seule action vraie (« 1 pensée à ranger »)', JSON.stringify(c));
  // Carte nette : rien ne passe sur un mot, rien sous l'en-tête, trois signes, aucune phrase dessinée
  const nette = await page.evaluate(() => {
    const V = _pl.carte, cv = V.cv, g = cv.getContext('2d'), d = V.dpr;
    V.sansTexte = true; plDessiner(V, performance.now());
    let surMot = 0;
    (V.etiquettes || []).forEach(r => { const im = g.getImageData(Math.max(0, Math.floor(r[0] * d)), Math.max(0, Math.floor(r[1] * d)), Math.max(1, Math.floor(r[2] * d)), Math.max(1, Math.floor(r[3] * d))).data; for (let i = 0; i < im.length; i += 4) surMot = Math.max(surMot, Math.max(im[i], im[i + 1], im[i + 2]) * im[i + 3] / 255); });
    const hautIm = g.getImageData(0, 0, cv.width, Math.max(1, Math.floor((V.haut - 1) * d))).data; let sousTete = 0; for (let i = 3; i < hautIm.length; i += 4) sousTete = Math.max(sousTete, hautIm[i]);
    V.sansTexte = false; plDessiner(V, performance.now());
    const at = V.sc.esp.find(x => x.k === 'atlas'), px = it => { const q = [it.s[0] * V.s + V.tx, it.s[1] * V.s + V.ty], m = g.getImageData(Math.round(q[0] * d), Math.round(q[1] * d), 1, 1).data; return m[0] + m[1] + m[2]; };
    const af = at.items.find(i => plAFaire(i)), fa = at.items.find(i => i.type === 'tache');
    // De près : le canevas n'écrit aucun mot de pensée
    const ecrits = [], f0 = g.fillText; g.fillText = function(t) { ecrits.push(String(t)); return f0.apply(this, arguments); };
    const garde = { s: V.s, tx: V.tx, ty: V.ty }; V.s = V.sMax * .6; V.tx = innerWidth / 2 - at.cap[0] * V.s; V.ty = innerHeight * .45 - at.cap[1] * V.s; plDessiner(V, performance.now());
    g.fillText = f0; Object.assign(V, garde); plDessiner(V, performance.now());
    const corps = Object.values(_depot.thoughts).map(t => t.body.slice(0, 12));
    return { surMot: Math.round(surMot), sousTete, eclatAFaire: px(af), eclatFait: px(fa), phrases: ecrits.filter(t => corps.some(b => t.includes(b.slice(0, 8)))), legende: [...document.querySelectorAll('#carte-legende span')].map(x => x.textContent).join(), endormi: ecrits.filter(t => t === 'Endormi').length };
  });
  ok(nette.surMot < 48 && nette.sousTete === 0 && nette.eclatAFaire > nette.eclatFait * 2 && !nette.phrases.length && nette.legende === 'À faire,Fait,À ranger' && !nette.endormi,
    'Carte nette : aucun trait ni point sur un mot, rien sous l\'en-tête, « à faire » brille plus que « fait », aucune phrase sur le canevas, plus de « Endormi », légende de trois signes', JSON.stringify(nette));
  // Glisser : la carte bouge (et un glissé n'ouvre rien)
  const v0 = await page.evaluate(() => ({ tx: _pl.carte.tx, ty: _pl.carte.ty }));
  await page.mouse.move(200, 500); await page.mouse.down(); await page.mouse.move(150, 430, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(100);
  const v1 = await page.evaluate(() => ({ tx: _pl.carte.tx, ty: _pl.carte.ty, fiche: !document.getElementById('carte-panneau').hidden }));
  // Pincer (pavé du Mac) : rapproche puis éloigne, dans les bornes
  await page.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById('carte-cv').dispatchEvent(new WheelEvent('wheel', { deltaY: -40, ctrlKey: true, clientX: 195, clientY: 500, bubbles: true, cancelable: true })); });
  const sGrand = await page.evaluate(() => _pl.carte.s);
  await page.evaluate(() => { for (let i = 0; i < 60; i++) document.getElementById('carte-cv').dispatchEvent(new WheelEvent('wheel', { deltaY: 40, ctrlKey: true, clientX: 195, clientY: 500, bubbles: true, cancelable: true })); });
  const sPetit = await page.evaluate(() => [_pl.carte.s, _pl.carte.sMin, _pl.carte.sMax]);
  ok((v1.tx !== v0.tx || v1.ty !== v0.ty) && !v1.fiche && sGrand > c.s * 2 && Math.abs(sPetit[0] - sPetit[1]) < 1e-6, 'Carte : glisser la déplace sans rien ouvrir ; pincer rapproche et éloigne, jusqu\'aux bornes', JSON.stringify({ v0, v1, s0: c.s, sGrand, sPetit }));
  await page.keyboard.press('0'); await page.waitForTimeout(100);
  // Toucher un point : la fiche dit ce qu'il représente
  const fiche = async (trouver) => { const p = await page.evaluate(trouver); await page.mouse.click(p.x, p.y); await page.waitForTimeout(150); return page.evaluate(() => {
    const P = document.getElementById('carte-panneau'), V = _pl.carte, e = V.panneau && V.panneau.items ? V.panneau : null, top = P.getBoundingClientRect().top;
    const blanc = [...P.querySelectorAll('button')].filter(x => { const c = getComputedStyle(x).backgroundColor.match(/\d+/g).map(Number); return c[0] > 230 && c[1] > 230 && c[2] > 230 && (c[3] === undefined || c.length < 4); }).map(x => x.textContent);
    return { vis: !P.hidden, k: document.getElementById('pn-k').textContent, t: document.getElementById('pn-t').textContent, b: [...document.querySelectorAll('#pn-acts button')].map(x => x.textContent), h: [...P.querySelectorAll('.pn-b, .pn-l:not([hidden]), .pn-x, button.pn-gt')].filter(x => x.offsetParent).map(x => Math.round(x.getBoundingClientRect().height)),
      choisie: (P.querySelector('.pn-l.choisie .pn-lm') || {}).textContent || '', lignes: P.querySelectorAll('.pn-l').length, items: e ? e.items.length : -1, blanc,
      dessus: e ? (e.cap[1] * V.s + V.ty) + (e.rmax || 0) * V.s <= top : true };
  }); };
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.k === 'atlas'); V.s = V.sMax * .5; V.tx = innerWidth / 2 - e.cap[0] * V.s; V.ty = innerHeight * .45 - e.cap[1] * V.s; carteBorner(V); carteRedessin(); });
  let f = await fiche(() => { const V = _pl.carte, it = V.sc.esp.find(x => x.k === 'atlas').items.find(i => i.type === 'journal'); return { x: it.s[0] * V.s + V.tx, y: it.s[1] * V.s + V.ty }; });
  ok(f.vis && f.k === 'Projet' && f.t === 'ATLAS' && f.choisie === 'Module 3 relu' && f.b.includes('Ouvrir ATLAS') && f.blanc.join() === 'Ouvrir ATLAS' && f.lignes === f.items && f.dessus && f.h.every(h => h >= 44),
    'Carte, panneau : toucher un point ouvre le panneau de son espace sur sa ligne (« Module 3 relu ») ; une ligne par chose réelle ; l\'espace reste au-dessus du panneau ; une seule touche blanche ; cibles ≥ 44 px', JSON.stringify(f));
  const m = await mesurer(page, { racine: '#carte-panneau', cadre: '#carte-panneau' });
  ok(m.n > 4 && m.pire.ratio >= 4.5, 'Carte : contraste du panneau ≥ 4,5 : 1', fmt(m.pire.ratio) + ' sur ' + m.n);
  // Toucher une ligne de pensée l'ouvre dans « Déposé »
  const ligne = await page.evaluate(() => { const l = [...document.querySelectorAll('#carte-panneau .pn-l')].find(x => /Écrire le module 4/.test(x.textContent)); l.click(); return { carte: carteOuverte(), depose: document.getElementById('depot-screen').classList.contains('open') || document.getElementById('depot-screen').getAttribute('aria-hidden') === 'false' }; });
  await page.evaluate(() => { if (typeof depotClose === 'function') depotClose(); carteOuvrir(); });
  await page.waitForTimeout(150);
  ok(!ligne.carte && ligne.depose, 'Carte, panneau : toucher une pensée l\'ouvre dans « Déposé »', JSON.stringify(ligne));
  // Un endormi se travaille : sa fiche propose « Réveiller »
  await page.keyboard.press('0'); await page.waitForTimeout(100);
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.n === 'FBA'); V.s = V.sMax * .4; V.tx = innerWidth / 2 - e.cap[0] * V.s; V.ty = innerHeight * .45 - e.cap[1] * V.s; carteBorner(V); carteRedessin(); });
  f = await fiche(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.n === 'FBA'); return { x: e.cap[0] * V.s + V.tx, y: e.cap[1] * V.s + V.ty }; });
  const okFba = f.vis && f.k === 'Projet endormi' && f.t === 'FBA' && f.b.join() === 'Réveiller,Ouvrir FBA' && f.blanc.join() === 'Réveiller';
  await page.click('#pn-acts button:first-child'); await page.waitForTimeout(200);
  const reveil = await page.evaluate(() => ({ dort: mondeDort(1), k: document.getElementById('pn-k').textContent }));
  ok(okFba && !reveil.dort && reveil.k === 'Projet', 'Carte, panneau : un endormi propose « Réveiller » (la touche blanche), et le réveil se fait sur place', JSON.stringify({ f, reveil }));
  await page.evaluate(() => mondeSommeil(1, true));
  // Ouvrir un espace depuis sa fiche ; Échap ferme la fiche, puis la carte
  await page.keyboard.press('Escape'); const sansFiche = await page.evaluate(() => document.getElementById('carte-panneau').hidden && carteOuverte());
  await page.keyboard.press('Escape'); const fermee = await page.evaluate(() => !carteOuverte());
  await page.evaluate(() => carteOuvrir()); await page.waitForTimeout(150);
  await page.evaluate(() => { const V = _pl.carte, e = V.sc.esp.find(x => x.k === 'atlas'); carteFiche(e); });
  await page.click('#pn-acts .pn-b1'); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && CUR.wid === 4 && !carteOuverte());
  ok(sansFiche && fermee && ouvert, 'Carte : Échap ferme le panneau puis la carte ; « Ouvrir ATLAS » ouvre ATLAS', JSON.stringify({ sansFiche, fermee, ouvert }));
  // La carte dans chaque monde : depuis ATLAS, la carte s'ouvre centrée sur lui, panneau ouvert
  await page.click('#w-carte'); await page.waitForTimeout(300);
  const sur = await page.evaluate(() => { const V = _pl.carte, P = document.getElementById('carte-panneau'), e = V.panneau; return { ouverte: carteOuverte(), t: document.getElementById('pn-t').textContent, vis: !P.hidden, dessus: e && (e.cap[1] * V.s + V.ty) + (e.rmax || 0) * V.s <= P.getBoundingClientRect().top, h: Math.round(document.getElementById('w-carte').getBoundingClientRect().height) }; });
  ok(sur.ouverte && sur.vis && sur.t === 'ATLAS' && sur.dessus, 'La carte dans chaque monde : « Voir sur la carte » ouvre la carte sur ATLAS, son panneau ouvert, ATLAS au-dessus du panneau', JSON.stringify(sur));
  await page.evaluate(() => carteFermer());
  ok(!errors.length, 'Aucune erreur de console (planète et carte)', errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log((r.ok ? 'OK   ' : 'ÉCHEC') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')); }
console.log('\n' + (results.length - fails) + ' / ' + results.length + ' contrôles passent');
process.exit(fails ? 1 : 0);
