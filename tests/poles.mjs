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
const POLES = [{ cle: 'sante', nom: 'Santé', id: 'S3', main: '#pmain-sante', hero: '.sm-hero' }, { cle: 'juridique', nom: 'Juridique', id: 'S4', main: '#pmain-jur', hero: '.jur-hero' }];
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
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], champs, picto, fusion, barre, horizon: (h => /radial-gradient/.test(h.maskImage || h.webkitMaskImage || '') && /gradient/.test(h.backgroundImage))(getComputedStyle(root.querySelector('.x-horizon'), '::before')), ecriture: (() => { const mono = new Set(), capit = new Set(); const tw3 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); for (let nd; (nd = tw3.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e); if (parseFloat(cs.fontSize) === 0) continue; if (/mono/i.test(cs.fontFamily)) mono.add(nom(e)); if (cs.textTransform === 'uppercase') capit.add(nom(e)); } const f = e => { const x = root.querySelector(e); return x ? getComputedStyle(x).fontFamily.split(',')[0].trim() : '-apple-system'; }; return { mono: [...mono], capit: [...capit], systeme: [f('.psec-lbl'), f('.p-back'), f('.wnotes-ta, .hab-inp')], section: getComputedStyle(root.querySelector('.psec-lbl')).fontSize }; })(),
           large: document.documentElement.scrollWidth <= innerWidth && m.scrollWidth <= m.clientWidth + 1, ouvert: !root.classList.contains('off') };
};

// Remplir le pôle comme Rayan le ferait : les états remplis se mesurent aussi
const remplir = async (page, cle) => {
  if (cle === 'sante') {
    // Santé, la mémoire (11 octobre) : un rendez-vous ajouté par la feuille, un document, une note au journal
    await page.click('#srdv-ajout'); await page.waitForTimeout(250);
    await page.selectOption('#sm-spe', 'dentiste'); await page.fill('#sm-qui', 'Dr Martin');
    await page.fill('#sm-date', new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10)); await page.fill('#sm-heure', '09:30');
    await page.click('#sm-ok'); await page.waitForTimeout(250);
    await page.click('#sdoc-ajout'); await page.waitForTimeout(250);
    await page.fill('#sm-doc-titre', 'Ordonnance lunettes'); await page.selectOption('#sm-doc-spe', 'ophtalmo'); await page.selectOption('#sm-doc-ou', 'mes');
    await page.click('#sm-ok'); await page.waitForTimeout(250);
    await page.fill('#sante-jou-inp', 'Bilan sanguin fait, résultats attendus lundi.'); await page.click('#sante-jou-btn');
    return await page.evaluate(() => document.querySelectorAll('#srdv-list .wpen-row').length === 1 && document.querySelectorAll('#sdoc-list .wpen-row').length === 1 && document.querySelectorAll('#sante-jou-list .wjou-entry').length === 1);
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
      { const e = r.ecriture; if (e.mono.length || e.capit.length || e.section !== '17px' || e.systeme.some(f => !/apple-system|BlinkMacSystemFont/i.test(f))) defauts.push(`${ou} : écriture (chasse fixe ${e.mono.slice(0, 4).join(', ') || 'aucune'} ; capitales ${e.capit.slice(0, 4).join(', ') || 'aucune'} ; sections ${e.section} ; ${e.systeme.join(' / ')})`); }
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
  ok(!defauts.length, `${vp.n} : Santé et Juridique respectent la charte, vides et remplis (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion, horizon ; écriture de l'accueil : police du système, ni chasse fixe ni capitales, sections à 17 px)`, defauts.slice(0, 4).join(' ; '));
  ok(n > 150 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout, dans les deux pôles`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  ok(reste, `${vp.n} : Santé, un rendez-vous et un document s'ajoutent par la feuille, une note au journal ; Juridique, la section reste ouverte quand on y ajoute un élément ou qu'on le marque fait`);
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

/* Santé, la mémoire (11 octobre, docs/ETUDE-POLES.md étape 1) : la feuille refuse sans spécialité ni date et le dit ;
   le rendez-vous s'affiche, avec « 1 à venir », la spécialité allumée, la ligne du haut et l'accueil (Ma vie) ; modifié,
   il propose « Ce qui en est sorti » ; supprimé en deux gestes ; passé, il va sous « Passés » ; l'ancien suivi n'est
   plus à l'écran et ses données restent ; plus aucun bouton de conseil. */
{
  const ctx = await contexte({ width: 390, height: 844, tel: true });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => { S.poles.sante.push({ date: new Date().toISOString(), sommeil: 7, energie: 6, sport: 0, mental: 7 }); saveS(); if (typeof matinClose === 'function') matinClose(); enterPole('sante'); });
  await page.waitForTimeout(500);
  const avant = await page.evaluate(() => ({ suivi: document.getElementById('sante-suivi').offsetParent === null, conseils: document.querySelectorAll('#S3 .cp-sug').length, vide: !document.getElementById('srdv-vide').hidden, blanc: getComputedStyle(document.getElementById('srdv-ajout')).backgroundColor }));
  await page.click('#srdv-ajout'); await page.waitForTimeout(200);
  await page.click('#sm-ok'); await page.waitForTimeout(100);
  const e1 = await page.evaluate(() => document.getElementById('sm-err').textContent);
  await page.selectOption('#sm-spe', 'kine'); await page.click('#sm-ok'); await page.waitForTimeout(100);
  const e2 = await page.evaluate(() => [document.getElementById('sm-err').textContent, document.getElementById('sante-modal').classList.contains('open')]);
  const j = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  await page.fill('#sm-date', j(3)); await page.fill('#sm-heure', '18:00'); await page.fill('#sm-lieu', 'Cabinet du centre');
  await page.click('#sm-ok'); await page.waitForTimeout(250);
  const apres = await page.evaluate(() => ({ lignes: [...document.querySelectorAll('#srdv-list .wpen-row')].map(e => e.textContent), n: document.getElementById('srdv-n').textContent,
    chip: [...document.querySelectorAll('#sspe-list .sm-chip.on')].map(e => e.textContent), sous: document.getElementById('sm-sous').textContent, ferme: !document.getElementById('sante-modal').classList.contains('open') }));
  await page.evaluate(() => goHome()); await page.waitForTimeout(250);
  const vie = await page.evaluate(() => (document.querySelector('#S1 .vie[data-pole="sante"] .vie-s') || {}).textContent || '');
  await page.evaluate(() => enterPole('sante')); await page.waitForTimeout(300);
  await page.click('#srdv-list .wpen-row'); await page.waitForTimeout(200);
  const edit = await page.evaluate(() => ({ sortie: !document.getElementById('sm-sortie-champ').hidden, suppr: !document.getElementById('sm-suppr').hidden, date: document.getElementById('sm-date').value }));
  await page.fill('#sm-sortie', 'Exercices à faire chaque soir.'); await page.fill('#sm-date', j(-2)); await page.click('#sm-ok'); await page.waitForTimeout(250);
  const passe = await page.evaluate(() => ({ avenir: document.querySelectorAll('#srdv-list .wpen-row').length, vide: !document.getElementById('srdv-vide').hidden, passes: document.getElementById('srdv-passes-n').textContent }));
  await page.click('#srdv-passes-tog'); await page.waitForTimeout(150);
  const pl = await page.evaluate(() => [...document.querySelectorAll('#srdv-passes-list .wpen-row')].map(e => e.textContent).join());
  await page.click('#srdv-passes-list .wpen-row'); await page.waitForTimeout(200);
  await page.click('#sm-suppr'); await page.waitForTimeout(100);
  const unGeste = await page.evaluate(() => Object.keys(S.sante.rdv).length);
  await page.click('#sm-suppr'); await page.waitForTimeout(250);
  const fin = await page.evaluate(() => ({ rdv: Object.keys(S.sante.rdv).length, garde: S.poles.sante.length, sauve: !!(JSON.parse(localStorage.getItem('arc_v2')).sante) }));
  const vraies = errors.filter(e => !/status of 500/.test(e));
  ok(avant.suivi && avant.conseils === 0 && avant.vide && avant.blanc === 'rgb(245, 245, 247)' && /spécialité/.test(e1) && /date/.test(e2[0]) && e2[1]
     && apres.lignes.length === 1 && /Kiné/.test(apres.lignes[0]) && /Cabinet du centre/.test(apres.lignes[0]) && /18 h 00/.test(apres.lignes[0]) && apres.n === '1 à venir' && apres.chip.join() === 'Kiné' && /^Prochain rendez-vous : Kiné, /.test(apres.sous) && apres.ferme
     && /^Kiné · /.test(vie) && edit.sortie && edit.suppr && edit.date === j(3) && passe.avenir === 0 && passe.vide && passe.passes === '1' && /Exercices à faire chaque soir/.test(pl)
     && unGeste === 1 && fin.rdv === 0 && fin.garde === 1 && fin.sauve && !vraies.length,
     'Santé, la mémoire : la feuille dit ce qui manque (spécialité, date) ; le rendez-vous s\'affiche avec son heure, « 1 à venir », sa spécialité allumée, la ligne du haut et l\'accueil ; modifié, « Ce qui en est sorti » ; passé, il va sous « Passés » ; supprimé en deux gestes ; l\'ancien suivi n\'est plus à l\'écran, ses données restent ; plus aucun bouton de conseil',
     JSON.stringify({ avant, e1, e2, apres, vie, edit, passe, pl, unGeste, fin, erreurs: vraies }));
  await ctx.close();
}

/* Le corps (12 octobre, docs/ETUDE-POLES.md étape 2) : éteint sans fait ; une zone allumée par spécialité qui a un
   rendez-vous ou un document (imagerie, laboratoire… n'ont pas de zone) ; Face et Dos ; étiquettes sans chevauchement,
   hors de la bascule, cibles ≥ 44 px, contraste ; toucher une étiquette ouvre le bon rendez-vous ; 360 à 430 px. */
for (const [W, H] of [[390, 844], [360, 740], [430, 932]]) {
  const ctx = await contexte({ width: W, height: H, tel: true });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); enterPole('sante'); }); await page.waitForTimeout(400);
  const lire = () => page.evaluate(() => {
    const P = document.getElementById('sc-corps'), et = [...P.querySelectorAll('.sc-e')], b = P.querySelector('.sc-bascule').getBoundingClientRect(), pr = P.getBoundingClientRect();
    const rs = et.map(e => e.getBoundingClientRect()), croise = [];
    for (let i = 0; i < rs.length; i++) { for (let j = i + 1; j < rs.length; j++) { const a = rs[i], c = rs[j]; if (a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) croise.push(i + '×' + j); } const a = rs[i]; if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) croise.push(i + '×bascule'); if (a.top < pr.top || a.bottom > pr.bottom || a.left < pr.left || a.right > pr.right) croise.push(i + '×bord'); }
    return { pts: P.querySelectorAll('.sc-pt').length, zones: et.map(e => e.dataset.zone).sort().join(), textes: et.map(e => e.textContent), coupes: et.filter(e => [...e.children].some(c => c.scrollWidth > c.clientWidth + 1)).map(e => e.textContent), h: rs.map(r => Math.round(r.height)), croise, vide: !document.getElementById('sc-vide').hidden, dos: !!P.querySelector('[data-vue="dos"] .sc-n') };
  });
  const vide = await lire();
  await page.evaluate(() => {
    const j = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    S.sante.rdv = { a: { id: 'a', spe: 'dentiste', date: j(33), heure: '14:00' }, b: { id: 'b', spe: 'kine', date: j(-5) }, c: { id: 'c', spe: 'cardio', date: j(-120) }, e: { id: 'e', spe: 'laboratoire', date: j(-2) } };
    S.sante.docs = { d: { id: 'd', titre: 'Ordonnance', spe: 'ophtalmo', date: j(-200), ou: 'mes' }, f: { id: 'f', titre: 'Bilan', spe: 'generaliste', date: j(-40), ou: 'papier' } };
    saveS(); renderSanteMemoire();
  });
  await page.waitForTimeout(700);
  const face = await lire();
  const m = await mesurer(page, { racine: '#sc-corps', cadre: '#sc-corps' });
  await page.click('#sc-corps [data-vue="dos"]'); await page.waitForTimeout(400);
  const dos = await lire();
  await page.click('#sc-corps [data-vue="face"]'); await page.waitForTimeout(300);
  await page.click('#sc-corps .sc-e[data-zone="dentiste"]'); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => ({ open: document.getElementById('sante-modal').classList.contains('open'), id: _sm && _sm.id, mode: _sm && _sm.mode }));
  ok(vide.pts === 0 && vide.vide && face.pts === 4 && face.zones === 'cardio,dentiste,generaliste,ophtalmo' && !face.vide && face.dos && dos.zones === 'kine' && dos.pts === 1
     && !face.croise.length && !dos.croise.length && !face.coupes.length && face.h.every(h => h >= 44) && m.pire.ratio >= 4.5 && ouvert.open && ouvert.id === 'a' && ouvert.mode === 'rdv' && !errors.length,
    `Santé, le corps (${W} px) : éteint sans fait ; quatre zones allumées de face (le laboratoire n'a pas de zone), le kiné de dos et signalé sur « Dos » ; étiquettes entières, sans chevauchement ni sur la bascule, cibles ≥ 44 px, contraste ≥ 4,5 : 1 ; toucher « Dentiste » ouvre son rendez-vous`,
    JSON.stringify({ vide, face, dos, contraste: m.pire.ratio, ouvert, errors }));
  await ctx.close();
}

/* La ligne du temps (12 octobre, docs/ETUDE-POLES.md étape 3) : un point par fait daté ; glisser le curseur montre le
   corps à cette date (seuls les faits d'avant s'allument) ; il s'aimante sur un fait ; une date après le rendez-vous
   à venir l'allume ; « Revenir à aujourd'hui » ; cibles, contraste, lecteur d'écran ; 360 et 390 px. */
for (const [W, H] of [[390, 844], [360, 740]]) {
  const ctx = await contexte({ width: W, height: H, tel: true });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); enterPole('sante'); }); await page.waitForTimeout(400);
  const sansFait = await page.evaluate(() => document.getElementById('sc-temps').hidden);
  await page.evaluate(() => {
    const j = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    S.sante.rdv = { a: { id: 'a', spe: 'dentiste', date: j(33), heure: '14:00' }, b: { id: 'b', spe: 'kine', date: j(-5) }, c: { id: 'c', spe: 'cardio', date: j(-120) }, e: { id: 'e', spe: 'laboratoire', date: j(-2) } };
    S.sante.docs = { d: { id: 'd', titre: 'Ordonnance', spe: 'ophtalmo', date: j(-200), ou: 'mes' }, f: { id: 'f', titre: 'Bilan', spe: 'generaliste', date: j(-40), ou: 'papier' }, g: { id: 'g', titre: 'Sans date', spe: 'dermato', ou: 'mes' } };
    saveS(); renderSanteMemoire();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('sc-temps').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  const lire = () => page.evaluate(() => {
    const rg = document.getElementById('sc-t-range'), pts = [...document.querySelectorAll('#sc-t-pts i')];
    return { visible: !document.getElementById('sc-temps').hidden, date: document.getElementById('sc-t-date').textContent, auj: !document.getElementById('sc-t-auj').hidden,
      aria: rg.getAttribute('aria-valuetext'), pts: pts.length, off: pts.filter(i => i.classList.contains('off')).length, avenir: pts.filter(i => i.classList.contains('av')).length,
      zones: [...document.querySelectorAll('#sc-etiqs .sc-e')].map(e => e.dataset.zone).sort().join(), dent: (document.querySelector('#sc-etiqs .sc-e[data-zone="dentiste"]') || {}).textContent || '',
      dos: !!document.querySelector('#sc-corps [data-vue="dos"] .sc-n'), h: Math.round(rg.getBoundingClientRect().height), hAuj: Math.round(document.getElementById('sc-t-auj').getBoundingClientRect().height),
      deb: document.getElementById('sc-t-debut').textContent, fin: document.getElementById('sc-t-fin').textContent };
  });
  const auj = await lire();
  // Un vrai toucher sur la piste, 130 jours avant aujourd'hui
  const x = await page.evaluate(() => { const rg = document.getElementById('sc-t-range'), r = rg.getBoundingClientRect(), B = rg._B; return { x: r.left + 11 + (r.width - 22) * (B.auj - 130) / B.n, y: r.top + r.height / 2 }; });
  await page.mouse.click(x.x, x.y); await page.waitForTimeout(400);
  const passe = await lire();
  const m = await mesurer(page, { racine: '#sc-temps', cadre: '#sc-corps' });
  // Près d'un fait, le curseur s'y pose (cardio, 120 jours avant)
  const glisse = v => page.evaluate(v => { const rg = document.getElementById('sc-t-range'); rg.value = rg._B.auj + v; rg.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await glisse(-118); await page.waitForTimeout(200);
  const aimant = await page.evaluate(() => ({ date: document.getElementById('sc-t-date').textContent, zones: [...document.querySelectorAll('#sc-etiqs .sc-e')].map(e => e.dataset.zone).sort().join(), attendu: 'Le ' + new Date(Date.now() - 120 * 864e5).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }));
  await glisse(45); await page.waitForTimeout(200);
  const futur = await lire();
  await page.click('#sc-t-auj'); await page.waitForTimeout(300);
  const retour = await lire();
  ok(sansFait && auj.visible && auj.date === 'Aujourd’hui' && !auj.auj && auj.pts === 6 && auj.avenir === 1 && auj.off === 0 && auj.zones === 'cardio,dentiste,dermato,generaliste,ophtalmo' && auj.dos && auj.h >= 44 && /^Aujourd’hui/.test(auj.aria) && auj.deb && auj.fin
     && /^Le /.test(passe.date) && passe.auj && passe.hAuj >= 44 && passe.zones === 'ophtalmo' && !passe.dos && passe.off === 5 && passe.aria === passe.date.slice(3) && m.pire.ratio >= 4.5
     && aimant.date === aimant.attendu && aimant.zones === 'cardio,ophtalmo'
     && /dentiste/.test(futur.zones) && /^DentisteRDV /.test(futur.dent) && futur.dos && !/dermato/.test(futur.zones)
     && retour.date === 'Aujourd’hui' && !retour.auj && retour.zones === auj.zones && !errors.length,
    `Santé, la ligne du temps (${W} px) : cachée sans fait ; un point par fait daté, le rendez-vous à venir en anneau ; un toucher 130 jours avant montre le corps à cette date (seul l'ophtalmo, « Le … », « Revenir à aujourd'hui ») ; le curseur se pose sur un fait proche ; après le rendez-vous à venir, le dentiste s'allume ; retour à aujourd'hui ; cibles ≥ 44 px, contraste ≥ 4,5 : 1, date lue par le lecteur d'écran`,
    JSON.stringify({ sansFait, auj, passe, contraste: m.pire, aimant, futur, retour, errors }));
  await ctx.close();
}

/* Juridique, l'orbite (12 octobre, docs/ETUDE-POLES.md) : au centre aujourd'hui, anneaux 7 / 30 / 90 jours ; un point par
   échéance vraie (datée, pas faite, à 90 jours ou moins), plus proche du centre quand elle approche ; passée, elle touche
   le centre (« À replacer », sans rouge) ; la liste par date ; toucher un point le signale, le toucher encore ouvre
   l'élément ; « Ajouter une échéance » ; plus de bouton « Aides » ni de Valence ; 360 et 390 px. */
for (const [W, H] of [[390, 844], [360, 740]]) {
  const ctx = await contexte({ width: W, height: H, tel: true });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); enterPole('juridique'); }); await page.waitForTimeout(500);
  const vide = await page.evaluate(() => ({ vide: !document.getElementById('jo-vide').hidden, pts: document.querySelectorAll('#jo-pts .jo-p').length, liste: document.getElementById('jo-liste').hidden, blanc: getComputedStyle(document.getElementById('jo-ajout')).backgroundColor }));
  await page.evaluate(() => {
    const j = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    S.poles.juridique = {
      statut: [{ t: 'Immatriculer ATLAS', status: 'todo', deadline: j(12) }, { t: 'Déclaration URSSAF', status: 'todo', deadline: j(3) }],
      contrats: [{ t: 'Relire les CGV', status: 'progress', deadline: j(45) }, { t: 'Signer le bail', status: 'done', deadline: j(-3) }],
      aides: [{ t: 'Dossier ACRE', status: 'todo', deadline: j(-2) }, { t: 'Demande CAPE', status: 'todo', deadline: j(120) }],
      demarches: [{ t: 'Appeler le comptable', status: 'todo', deadline: j(0) }, { t: 'Assurance pro', status: 'todo', deadline: j(70) }, { t: 'Sans date', status: 'todo' }]
    };
    saveS(); enterPole('juridique');
  });
  await page.waitForTimeout(1200);
  const plein = await page.evaluate(() => {
    const svg = document.getElementById('jo-svg'), sr = svg.getBoundingClientRect(), cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
    const pts = [...document.querySelectorAll('#jo-pts .jo-p')], dist = {};
    pts.forEach(p => { const r = p.querySelector('i').getBoundingClientRect(); dist[p.getAttribute('aria-label').split(',')[0]] = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); });
    const mots = [...svg.querySelectorAll('rect'), ...document.querySelectorAll('.jo-coins span')].map(e => e.getBoundingClientRect());
    const surMot = pts.filter(p => { const a = p.querySelector('i').getBoundingClientRect(); return mots.some(m => a.left < m.right && a.right > m.left && a.top < m.bottom && a.bottom > m.top); }).map(p => p.getAttribute('aria-label'));
    const hero = document.getElementById('jur-stats-row').textContent, s4 = document.getElementById('S4');
    const rouges = [...s4.querySelectorAll('.jur-stat-badge,.jur-count-badge,.jur-item-dl')].filter(e => /255, 55, 95|255, 143, 163|255, 45, 85/.test(getComputedStyle(e).color)).length;
    return { pts: pts.length, h: pts.map(p => Math.round(p.getBoundingClientRect().height)), passe: pts.filter(p => p.classList.contains('passe')).map(p => p.getAttribute('aria-label').split(',')[0]),
      dist, surMot, lignes: [...document.querySelectorAll('#jo-liste .wpen-row')].map(r => r.querySelector('.wpen-t').textContent + ' · ' + r.querySelector('.sm-quand b').textContent),
      n: document.getElementById('jo-n').textContent, vide: !document.getElementById('jo-vide').hidden, hero, rouges,
      aides: [...s4.querySelectorAll('.p-act')].map(b => b.textContent.trim()), valence: /Valence/.test(s4.innerHTML), chrono: !!document.getElementById('jur-timeline') };
  });
  await page.evaluate(() => document.getElementById('jo').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
  const m = await mesurer(page, { racine: '#jo', cadre: '#jo' });
  const imm = await page.$('#jo-pts .jo-p[aria-label^="Immatriculer"]');
  await imm.click(); await page.waitForTimeout(300);
  const choisi = await page.evaluate(() => ({ pt: document.querySelector('#jo-pts .jo-p.sel').getAttribute('aria-label'), row: (document.querySelector('#jo-liste .wpen-row.sel .wpen-t') || {}).textContent, ouvert: document.getElementById('jur-body-statut').classList.contains('open') }));
  await imm.click(); await page.waitForTimeout(500);
  const ouvre = await page.evaluate(() => ({ ouvert: document.getElementById('jur-body-statut').classList.contains('open'), flash: document.getElementById('jit-statut-0').classList.contains('flash') }));
  await page.evaluate(() => document.getElementById('jo-ajout').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  await page.click('#jo-ajout'); await page.waitForTimeout(500);
  const ajout = await page.evaluate(() => ({ form: document.getElementById('jur-form-demarches').style.display, focus: document.activeElement && document.activeElement.id }));
  const d = plein.dist;
  ok(vide.vide && vide.pts === 0 && vide.liste && vide.blanc === 'rgb(245, 245, 247)'
     && plein.pts === 6 && plein.h.every(h => h >= 44) && plein.passe.join() === 'Dossier ACRE' && !plein.surMot.length
     && d['Dossier ACRE'] < d['Appeler le comptable'] && d['Appeler le comptable'] < d['Déclaration URSSAF'] && d['Déclaration URSSAF'] < d['Immatriculer ATLAS'] && d['Immatriculer ATLAS'] < d['Relire les CGV'] && d['Relire les CGV'] < d['Assurance pro']
     && plein.lignes.length === 7 && plein.lignes[0] === 'Dossier ACRE · À replacer' && plein.lignes[1] === 'Appeler le comptable · Aujourd’hui' && plein.lignes[6] === 'Demande CAPE · Dans 120 j' && !plein.lignes.some(l => /bail|Sans date/.test(l))
     && plein.n === '6 à venir · 1 à replacer' && !plein.vide && /2 cette semaine/.test(plein.hero) && /1 à replacer/.test(plein.hero) && plein.rouges === 0
     && plein.aides.join() === 'Export' && !plein.valence && !plein.chrono && m.pire.ratio >= 4.5
     && choisi.pt.startsWith('Immatriculer') && choisi.row === 'Immatriculer ATLAS' && !choisi.ouvert && ouvre.ouvert && ouvre.flash
     && ajout.form === 'block' && ajout.focus === 'jur-inp-demarches' && !errors.length,
    `Juridique, l'orbite (${W} px) : vide, l'orbite seule et « Ajouter une échéance » en blanc ; un point par échéance datée, pas faite, à 90 jours ou moins, plus près du centre quand elle approche, la passée en anneau contre le centre ; aucun point sur un mot ; la liste par date (« À replacer », « Aujourd'hui », au-delà de 90 jours), sans les faites ni les non datées ; en-tête sans rouge ; plus de bouton « Aides » ni de Valence ; toucher un point le signale dans la liste, le toucher encore ouvre l'élément ; « Ajouter une échéance » ouvre les démarches ; cibles ≥ 44 px, contraste ≥ 4,5 : 1`,
    JSON.stringify({ vide, plein, contraste: m.pire, choisi, ouvre, ajout, errors }));
  await ctx.close();
}

/* ARC propose (12 octobre, docs/ETUDE-POLES.md § 7) : une pensée rangée en Santé ou en Juridique avec un moment daté devient
   une proposition ; rien n'est créé sans un geste ; « Ajouter » remplit la feuille du rendez-vous (spécialité reconnue)
   ou ajoute l'échéance ; « Pas maintenant » n'est jamais reproposé, même après rechargement ; une pensée sans moment ou
   au moment passé n'est pas proposée. Le Point du jour cite le rendez-vous et l'échéance du jour. */
{
  const ctx = await contexte({ width: 390, height: 844, tel: true });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.waitForTimeout(500);
  const T = ['Dentiste jeudi à 14 h pour la couronne', 'URSSAF : déclarer avant vendredi', 'Kiné sans date', 'Ophtalmo hier 9 h', 'Relancer le greffe lundi'];
  for (const t of T) { await deposit(page, t); await page.waitForTimeout(200); }
  await page.evaluate(T => {
    const id = t => Object.values(_depot.thoughts).find(x => x.body === t).id;
    const at = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return { type: 'datetime', at: rangeIsoLocal(d) }; };
    rangeAdd(id(T[0]), { space: 'sante', status: 'filed', step: 'Aller chez le dentiste', moment: at(3, 14) }, 'ai');
    rangeAdd(id(T[1]), { space: 'juridique', status: 'filed', step: 'Déclarer à l’URSSAF', moment: at(4, 18) }, 'ai');
    rangeAdd(id(T[2]), { space: 'sante', status: 'filed', step: 'Prendre rendez-vous chez le kiné' }, 'ai');
    rangeAdd(id(T[3]), { space: 'sante', status: 'filed', step: 'Ophtalmo', moment: at(-1, 9) }, 'ai');
    rangeAdd(id(T[4]), { space: 'juridique', status: 'filed', step: 'Relancer le greffe', moment: at(5, 10) }, 'ai');
    if (typeof matinClose === 'function') matinClose();
    enterPole('sante');
  }, T);
  await page.waitForTimeout(600);
  const sante = await page.evaluate(() => [...document.querySelectorAll('#sprop .wlien-prop')].map(c => c.textContent));
  await page.evaluate(() => document.getElementById('sprop').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  const m = await mesurer(page, { racine: '#sprop', cadre: '#sprop' });
  const hBtn = await page.evaluate(() => [...document.querySelectorAll('#sprop button')].map(b => Math.round(b.getBoundingClientRect().height)));
  const avant = await page.evaluate(() => Object.keys(S.sante.rdv).length);
  await page.click('#sprop .prop-oui'); await page.waitForTimeout(300);
  const feuille = await page.evaluate(() => ({ open: document.getElementById('sante-modal').classList.contains('open'), spe: document.getElementById('sm-spe').value, date: document.getElementById('sm-date').value, heure: document.getElementById('sm-heure').value, rdv: Object.keys(S.sante.rdv).length }));
  await page.click('#sm-ok'); await page.waitForTimeout(300);
  const apres = await page.evaluate(() => { const r = Object.values(S.sante.rdv)[0]; return { n: Object.keys(S.sante.rdv).length, from: !!(r && r.from), props: document.querySelectorAll('#sprop .wlien-prop').length, cache: document.getElementById('sprop').hidden }; });
  await page.evaluate(() => enterPole('juridique')); await page.waitForTimeout(600);
  const jur = await page.evaluate(() => [...document.querySelectorAll('#jprop .wlien-prop')].map(c => c.textContent));
  await page.evaluate(() => [...document.querySelectorAll('#jprop .wlien-prop')].find(c => /greffe/.test(c.textContent)).querySelector('.prop-non').click()); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('#jprop .prop-oui').click()); await page.waitForTimeout(400);
  const jApres = await page.evaluate(() => ({ props: document.querySelectorAll('#jprop .wlien-prop').length, dem: S.poles.juridique.demarches.map(x => x.t + '|' + !!x.from + '|' + !!x.deadline), pts: document.querySelectorAll('#jo-pts .jo-p').length }));
  await page.reload(); await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); enterPole('juridique'); }); await page.waitForTimeout(600);
  const recharge = await page.evaluate(() => document.querySelectorAll('#jprop .wlien-prop').length);
  // Le Point du jour : un rendez-vous et une échéance aujourd'hui
  await page.evaluate(() => {
    const d = new Date(), p = n => (n < 10 ? '0' : '') + n, j = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    S.sante.rdv.z = { id: 'z', spe: 'kine', date: j, heure: '23:58', qui: 'Mme Leroy' };
    S.poles.juridique.statut = [{ t: 'Envoyer le Kbis', status: 'todo', deadline: j }];
    saveS(); goHome(); matinShow('ask');
  });
  await page.waitForTimeout(600);
  const matin = await page.evaluate(() => ({ lignes: [...document.querySelectorAll('#matin-body .matin-row')].map(r => r.getAttribute('data-kind') + ':' + r.querySelector('.matin-step').textContent), sec: (document.querySelector('#matin-body .matin-sec-t') || {}).textContent }));
  await page.evaluate(() => [...document.querySelectorAll('#matin-body .matin-row[data-kind="ech"] button')].find(b => /fait/.test(b.textContent)).click()); await page.waitForTimeout(300);
  const fait = await page.evaluate(() => ({ st: S.poles.juridique.statut[0].status, lignes: document.querySelectorAll('#matin-body .matin-row[data-kind="ech"]').length }));
  const vraies = errors.filter(e => !/status of 500/.test(e));
  ok(sante.length === 1 && /ARC propose un rendez-vous : Dentiste/.test(sante[0]) && /couronne/.test(sante[0]) && m.pire.ratio >= 4.5 && hBtn.every(h => h >= 44)
     && avant === 0 && feuille.open && feuille.spe === 'dentiste' && feuille.heure === '14:00' && feuille.date && feuille.rdv === 0
     && apres.n === 1 && apres.from && apres.props === 0 && apres.cache
     && jur.length === 2 && jur.every(x => /ARC propose une échéance/.test(x)) && jApres.props === 0 && jApres.dem.length === 1 && /URSSAF\|true\|true/.test(jApres.dem[0]) && jApres.pts === 1 && recharge === 0
     && /^Aujourd['’]hui$/.test(matin.sec) && matin.lignes.some(l => /^rdv:Kiné · Mme Leroy/.test(l)) && matin.lignes.some(l => /^ech:Envoyer le Kbis/.test(l))
     && fait.st === 'done' && fait.lignes === 0 && !vraies.length,
    'ARC propose : une pensée rangée en Santé avec un moment daté propose un rendez-vous (Dentiste reconnu), rien n\'est créé avant « Enregistrer » ; la feuille est remplie (spécialité, date, heure) ; ajoutée, la proposition disparaît ; en Juridique, « Ajouter » met l\'échéance sur l\'orbite, « Pas maintenant » tient après rechargement ; sans moment ou au moment passé : rien ; le Point du jour cite le rendez-vous et l\'échéance du jour, « C\'est fait » l\'y retire ; contraste, cibles',
    JSON.stringify({ sante, contraste: m.pire, hBtn, avant, feuille, apres, jur, jApres, recharge, matin, fait, erreurs: vraies }));
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
