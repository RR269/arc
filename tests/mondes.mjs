// Tests de l'écran d'un monde (passe de design du 7 octobre : même contenu, charte appliquée).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/mondes.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Pour chacun des cinq mondes, sur iPhone (390 × 844) et sur Mac (1440 × 900) :
// textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, contraste ≥ 4,5 : 1 mesuré dans l'image sur toute la hauteur de
// l'écran, aucun débordement, aucune erreur ; l'en-tête porte l'horizon du monde, sans mode de fusion.

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

// Dans la page : ce que la charte mesure sur l'écran du monde ouvert
const releve = () => {
  const root = document.getElementById('S2'), vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
  // Zone touchée : le rectangle de l'élément, agrandi par son ::before s'il sert de zone de toucher (inset négatif)
  const zone = e => { const r = e.getBoundingClientRect(), b = getComputedStyle(e, '::before'); let dx = 0, dy = 0;
    if (b.content !== 'none' && b.position === 'absolute') { dx = Math.max(0, -parseFloat(b.left) || 0) + Math.max(0, -parseFloat(b.right) || 0); dy = Math.max(0, -parseFloat(b.top) || 0) + Math.max(0, -parseFloat(b.bottom) || 0); }
    return { w: r.width + dx, h: r.height + dy }; };
  const nom = e => (e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]);
  const cibles = [...root.querySelectorAll('button, a[href], input, textarea, select, [data-aller], [data-open-focus], .wtask-cb, .wtool-card, .wtool-add')].filter(vis)
    .map(e => ({ ...zone(e), n: nom(e) })).filter(c => c.h < 43.5 || c.w < 43.5).map(c => `${c.n} ${Math.round(c.w)}×${Math.round(c.h)}`);
  const petits = [], tailles = new Set(); const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const s = parseFloat(getComputedStyle(e).fontSize); if (s === 0) continue; tailles.add(s); if (s < 12) petits.push(`${nom(e)} ${s}px`); }
  const champs = [...root.querySelectorAll('input, textarea, select')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(nom);
  const picto = [...root.querySelectorAll('.wtop, .w-hero, #cp-welcome')].filter(vis).flatMap(z => { const o = []; const t = document.createTreeWalker(z, NodeFilter.SHOW_TEXT);
    for (let nd; (nd = t.nextNode());) { const e = nd.parentElement; if (!vis(e) || parseFloat(getComputedStyle(e).fontSize) === 0) continue; const m = nd.nodeValue.match(/\p{Extended_Pictographic}/gu); if (m) o.push(...m.filter(c => !'↗↕★✕'.includes(c))); } return o; });
  const fusion = []; for (const e of root.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') fusion.push(nom(e)); }
  const hz = getComputedStyle(root.querySelector('.x-horizon'), '::before');
  const police = e => { const x = root.querySelector(e); return x ? getComputedStyle(x).fontFamily.split(',')[0].trim() : ''; };
  // L'écriture de l'accueil : ni chasse fixe ni petites capitales, titres de section à 17 px, un seul repère de progression
  const mono = [], capit = []; const tw2 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw2.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e); if (parseFloat(cs.fontSize) === 0) continue; if (/mono/i.test(cs.fontFamily)) mono.push(nom(e)); if (cs.textTransform === 'uppercase') capit.push(nom(e)); }
  const desc = root.querySelector('.w-hero-desc');
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], champs, fusion, horizon: /radial-gradient/.test(hz.maskImage || hz.webkitMaskImage || '') && /gradient/.test(hz.backgroundImage), mono: [...new Set(mono)], capit: [...new Set(capit)], systeme: [police('.w-hero-desc'), police('.wsec-lbl'), police('.wtask-txt'), police('.wm-l'), police('.w-back')], titre: police('.w-hero-name'), section: getComputedStyle(root.querySelector('.wsec-lbl')).fontSize,
           reperes: [...root.querySelectorAll('.w-pct-b, .wband-ring-pct')].filter(vis).length, pct: root.querySelector('.wband-ring-pct').textContent, descVue: desc.offsetParent !== null, suite: !root.querySelector('.w-hero-more').hidden, aDesc: !!desc.textContent.trim(),
           picto: picto.concat([...root.querySelectorAll('.wtask-row button, .wblk-arr, .w-focus-open')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) > 0 && /[★✕↕→↗]/.test(e.textContent)).map(e => e.textContent.trim())), poignee: [...root.querySelectorAll('.drag-handle')].filter(vis).length, fait: root.querySelector('.wband-ring-lbl').textContent,
           large: document.documentElement.scrollWidth <= innerWidth && document.getElementById('wmain').scrollWidth <= document.getElementById('wmain').clientWidth + 1,
           nom: document.getElementById('wband-name').textContent, ouvert: !root.classList.contains('off') };
};

for (const vp of ECRANS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.tel, hasTouch: vp.tel, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => document.fonts.ready);
  const defauts = [], contrastes = []; let pire = { ratio: Infinity }, n = 0, noms = [];
  for (let w = 0; w < 5; w++) {
    await page.evaluate(i => enterWorld(i), w); await page.waitForTimeout(700);
    // une tâche de plus, une entrée de journal et un outil : les états remplis se mesurent aussi
    await page.evaluate(() => { const g = document.querySelector('#S2 [data-action="toggle-done-grp"]'); if (g) g.click(); });
    const r = await page.evaluate(releve); noms.push(r.nom);
    if (!r.ouvert) defauts.push(`monde ${w} : ne s'ouvre pas`);
    if (r.cibles.length) defauts.push(`${r.nom} cibles < 44 px : ${r.cibles.slice(0, 5).join(', ')}`);
    if (r.petits.length) defauts.push(`${r.nom} textes < 12 px : ${r.petits.slice(0, 5).join(', ')}`);
    if (r.champs.length) defauts.push(`${r.nom} champs < 16 px : ${r.champs.join(', ')}`);
    if (r.picto.length) defauts.push(`${r.nom} emoji : ${r.picto.join('')}`);
    if (r.fusion.length) defauts.push(`${r.nom} mode de fusion : ${r.fusion.join(', ')}`);
    if (!r.horizon || r.fait !== 'fait') defauts.push(`${r.nom} : horizon ${r.horizon}, libellé « ${r.fait} »`);
    if (!r.large) defauts.push(`${r.nom} : débordement horizontal`);
    if (r.mono.length || r.capit.length) defauts.push(`${r.nom} : chasse fixe ${r.mono.slice(0, 4).join(', ') || 'aucune'}, capitales ${r.capit.slice(0, 4).join(', ') || 'aucune'}`);
    if (r.systeme.some(f => !/apple-system|BlinkMacSystemFont/i.test(f)) || !/apple-system|BlinkMacSystemFont/i.test(r.titre) || r.section !== '17px') defauts.push(`${r.nom} : écriture ${r.systeme.join(' / ')}, titre ${r.titre}, section ${r.section}`);
    if (r.reperes !== 1 || !/^\d+[\u00A0\u202F]%$/.test(r.pct)) defauts.push(`${r.nom} : ${r.reperes} repères de progression, « ${r.pct} »`);
    if (r.descVue || r.suite !== r.aDesc || r.poignee) defauts.push(`${r.nom} : description visible ${r.descVue}, « Lire la description » ${r.suite} (description ${r.aDesc}), poignée ${r.poignee}`);
    // contraste : la barre du haut, puis tout ce qui défile, écran par écran ; sur Mac, le panneau Claude aussi
    const zones = [{ racine: '#S2 .wtop' }]; if (!vp.tel) zones.push({ racine: '#wcp' });
    for (const z of zones) { const m = await mesurer(page, z); n += m.n; contrastes.push(...m.sous.map(x => ({ ...x, t: r.nom + ' › ' + x.t }))); if (m.pire.ratio < pire.ratio) pire = { ...m.pire, t: r.nom + ' › ' + m.pire.t }; }
    const sc = await page.evaluate(() => { const m = document.getElementById('wmain'); return { h: m.scrollHeight, c: m.clientHeight }; });
    for (let y = 0; y < sc.h; y += Math.round(sc.c * 0.7)) {
      await page.evaluate(v => document.getElementById('wmain').scrollTo(0, v), y); await page.waitForTimeout(90);
      const m = await mesurer(page, { racine: '#wmain', cadre: '#wmain', hors: ['#depot-bar', '.depot-pill', '.depot-note'] });
      n += m.n; contrastes.push(...m.sous.map(x => ({ ...x, t: r.nom + ' › ' + x.t }))); if (m.pire.ratio < pire.ratio) pire = { ...m.pire, t: r.nom + ' › ' + m.pire.t };
    }
    await page.evaluate(() => goHome()); await page.waitForTimeout(150);
    // on y revient : la page s'affiche par le haut (elle avait défilé jusqu'en bas pour la mesure)
    if (w === 0) { await page.evaluate(() => enterWorld(0)); await page.waitForTimeout(200); const haut = await page.evaluate(() => document.getElementById('wmain').scrollTop); if (haut !== 0) defauts.push(`ARYAN : au retour, la page est à ${haut} px du haut`); await page.evaluate(() => goHome()); await page.waitForTimeout(150); }
  }
  if (contrastes.length) { const g = {}; for (const m of contrastes) { const e = g[m.n + ' « ' + m.t + ' »'] ||= { min: 9, nb: 0 }; e.nb++; e.min = Math.min(e.min, m.ratio); } detail[vp.n] = Object.entries(g).map(([k, e]) => `${e.min.toFixed(2)}  ${k}  (${e.nb})`); }
  ok(noms.length === 5 && !defauts.length, `${vp.n} : les cinq mondes respectent la charte (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion, horizon ; écriture de l'accueil : police du système, ni chasse fixe ni capitales, sections à 17 px, un seul repère de progression, description repliée dans « Le projet » au plus)`, defauts.slice(0, 4).join(' ; ') || noms.join(', '));
  ok(n > 300 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout, dans les cinq mondes`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

// Les compteurs mènent à leur section (les tiroirs qui recopiaient la page sont retirés, le 8 octobre)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => enterWorld(0)); await page.waitForTimeout(400);
  const vus = {};
  for (const [quoi, sel] of [['taches', '#wsec-taches'], ['bloquants', '#wsec-bloquants'], ['journal', '#wsec-journal'], ['faites', '#done-grp']]) {
    await page.evaluate(() => { document.getElementById('wmain').scrollTop = 0; });
    await page.tap(`[data-aller="${quoi}"]`); await page.waitForTimeout(250);
    vus[quoi] = await page.evaluate(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(), m = document.getElementById('wmain').getBoundingClientRect(); return { visible: e.offsetParent !== null, haut: Math.round(r.top - m.top), place: Math.round(m.height * 0.6) }; }, sel);
  }
  await page.focus('[data-aller="journal"]'); await page.evaluate(() => { document.getElementById('wmain').scrollTop = 0; });
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  const clavier = await page.evaluate(() => Math.round(document.getElementById('wsec-journal').getBoundingClientRect().top - document.getElementById('wmain').getBoundingClientRect().top));
  const reste = await page.evaluate(() => ({ tiroir: !!document.getElementById('tdrawer'), contexte: !!document.getElementById('btn-ctx'), fleches: document.querySelectorAll('#S2 .wblk-arr').length, mission: getComputedStyle(document.querySelector('#S2 .wmission'), '::after').content }));
  // la section arrive en haut de l'écran, ou, tout en bas de la page, au moins dans les 60 % du haut
  const ok4 = Object.values(vus).every(v => v.visible && v.haut > -5 && v.haut < v.place) && Math.abs(clavier - vus.journal.haut) <= 2;   // arrondi d’un pixel près, au clavier comme au doigt
  ok(ok4 && !reste.tiroir && !reste.contexte && !reste.fleches && reste.mission === 'none' && !errors.length,
     'iPhone : chaque compteur mène à sa section (Accomplies déplie les tâches faites), au doigt comme au clavier ; plus de tiroir qui recopiait la page, ni de flèche sur la mission et les bloquants',
     JSON.stringify({ ...vus, clavier, ...reste }));
  await ctx.close();
}


// Le monde vivant et la liste unique (13 octobre, Rayan : « un nouveau monde s'ouvre en mode science-fiction
// productive » ; la carte vivante en premier écran ; « une seule liste, repliée » ; la description longue sort de l'écran)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.evaluate(() => {
    const mk = (body, status, jours) => { const id = depotUUID(); _depot.thoughts[id] = { id, body, source: 'text', device: 'iphone', created_at: new Date(Date.now() - jours * 864e5).toISOString(), status: 'pending' }; depotSave();
      rangeAdd(id, { status, space: 'aryan', step: body, moment: { type: 'none' }, extras: [] }, 'ai', 'm'); return id; };
    window._pA = mk('Relancer la boulangère pour le pilote', 'filed', 2); mk('Appeler le livreur', 'done', 5);
    S.journal[0] = [{ ts: Date.now() - 864e5, t: 'Rendez-vous avec la boulangère.' }]; rlPoser('projet', 0, 4, 'oui', ['Supabase']); saveS();
    if (typeof matinClose === 'function') matinClose(); enterWorld(0);
  });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const w = monde(0), fait = S.tasks[0] || {}, toutes = w.tasks_done.concat(w.tasks_todo);
    const parType = {}; _wc.items.forEach(it => { parType[it.type] = (parType[it.type] || 0) + 1; });
    const cv = document.getElementById('wcarte-cv').getBoundingClientRect(), fiche = document.getElementById('wcarte-fiche');
    return { parType, attendu: { afaire: toutes.filter(t => !fait[t.id]).length, tache: toutes.filter(t => fait[t.id]).length, pensee: 1, 'pensee-faite': 1, journal: 1 },
      dessines: _wc.pos.length, n: _wc.items.length, liens: _wc.liens.map(l => l.w.name), raf: !!_wc.raf, cvBas: Math.round(cv.bottom), ficheBas: Math.round(fiche.getBoundingClientRect().bottom),
      legende: fiche.innerText.replace(/\n/g, ' · '), vieux: ['wsec-prio', 'wsec-na', 'w-focus-banner'].filter(id => document.getElementById(id)),
      desc: document.getElementById('wband-desc').offsetParent !== null, plusDesc: document.getElementById('wband-more').textContent,
      next: document.querySelector('#wnext .wnext-t').textContent, detail: !!document.querySelector('#wnext .wnext-d'), reste: document.getElementById('wtask-reste').hidden,
      plus: document.getElementById('wtask-plus').textContent, prochaine: (_wc.items.find(it => it.next) || {}).id };
  });
  const typesOk = Object.entries(r.attendu).every(([k, v]) => (r.parType[k] || 0) === v) && r.n === r.dessines;
  ok(typesOk && r.liens.join() === 'ATLAS' && !r.raf && r.cvBas < 844 && r.ficheBas < 844 && /À faire/.test(r.legende) && /Journal/.test(r.legende) && /Projet lié/.test(r.legende),
     'Le monde vivant : un point par chose réelle (tâches à faire et faites, pensées à faire et faites, journal), le projet relié au bord, la carte et sa légende dans le premier écran ; image fixe sous mouvement réduit', JSON.stringify(r));
  ok(!r.vieux.length && !r.desc && r.plusDesc === 'Lire la description' && /^Essai « Ma boutique »/.test(r.next) && r.detail && r.prochaine === 'a30' && r.reste && r.plus === '10 autres tâches · 21 faites',
     'Une seule liste : la prochaine tâche en tête (celle de l\'action prioritaire, avec son détail), le reste replié ; plus d\'« Action prioritaire » ni de « Prochaines actions » ; la description repliée', JSON.stringify(r));
  // Toucher un point : la fiche dit ce qu'il est, « Ouvrir » l'ouvre là où il vit
  const pt = await page.evaluate(() => { const c = _wc.cv.getBoundingClientRect(), o = _wc.pos.find(x => x.it.next), p = _wc.pos.find(x => x.it.type === 'pensee'), l = _wc.coins[0].c;
    return { next: [c.left + o.x, c.top + o.y], pensee: [c.left + p.x, c.top + p.y], lien: [c.left + l.x, c.top + l.y], coeur: [c.left + _wc.geo.cx, c.top + _wc.geo.cy] }; });
  const fiche = () => page.evaluate(() => document.getElementById('wcarte-fiche').innerText.replace(/\n/g, ' · '));
  await page.touchscreen.tap(...pt.next); await page.waitForTimeout(150); const f1 = await fiche();
  await page.tap('#wcarte-fiche .wcf-ouvrir'); await page.waitForTimeout(300);
  const ck = await page.evaluate(() => document.getElementById('cockpit').classList.contains('open') && /Ma boutique/.test(document.getElementById('cockpit').textContent));
  await page.evaluate(() => closeCockpit()); await page.waitForTimeout(300);
  await page.touchscreen.tap(...pt.pensee); await page.waitForTimeout(150); const f2 = await fiche();
  await page.touchscreen.tap(...pt.coeur); await page.waitForTimeout(150); const f3 = await fiche();
  await page.touchscreen.tap(...pt.lien); await page.waitForTimeout(150); const f4 = await fiche();
  await page.tap('#wcarte-fiche .wcf-ouvrir'); await page.waitForTimeout(400);
  const atlas = await page.evaluate(() => CUR.wid === 4 && !document.getElementById('S2').classList.contains('off') && _wc.liens.map(l => l.w.name).join() === 'ARYAN');
  const cibles = await page.evaluate(() => [...document.querySelectorAll('#wcarte-fiche button, #wnext button, #wtask-plus')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(b => b.height < 44 || b.width < 44).length);
  ok(/^Prochaine tâche · Essai « Ma boutique »/.test(f1) && /Ouvrir$/.test(f1) && ck && /^Pensée à faire · déposée il y a 2\s?j · Relancer la boulangère/.test(f2) && /^Projet( · .*)? · ARYAN · Voir sur la carte$/.test(f3)
     && /^Projet lié( · .*)? · ATLAS · en commun : Supabase · Ouvrir ATLAS$/.test(f4) && atlas && !cibles,
     'Toucher : la prochaine tâche (« Ouvrir » ouvre son cockpit), une pensée, la sphère (« Voir sur la carte »), le projet relié (« Ouvrir ATLAS » ouvre ATLAS, relié à ARYAN) ; cibles ≥ 44 px', JSON.stringify({ f1, ck, f2, f3, f4, atlas, cibles }));
  // « C'est fait » sur la prochaine ; le reste se déplie ; un projet neuf n'est qu'une sphère
  await page.evaluate(() => enterWorld(0)); await page.waitForTimeout(300);
  await page.tap('#wnext .wnext-fait'); await page.waitForTimeout(250);
  const apres = await page.evaluate(() => ({ fait: !!S.tasks[0].a30, next: document.querySelector('#wnext .wnext-t').textContent, pointFait: _wc.items.find(it => it.id === 'a30').type }));
  await page.tap('#wtask-plus'); await page.waitForTimeout(150);
  const deplie = await page.evaluate(() => ({ vu: !document.getElementById('wtask-reste').hidden, lignes: document.querySelectorAll('#tasks-container > .wtask-list .wtask-row').length, exp: document.getElementById('wtask-plus').getAttribute('aria-expanded') }));
  const neuf = await page.evaluate(() => { const id = Date.now(); S.mondes[String(id)] = { id, name: 'Jardin partagé', key: 'jardinpartage', color: '#30D158', mission: 'Ouvrir un jardin.', desc: '', etapes: [], from: null }; normalizeS(); saveS(); enterWorld(id);
    return { n: _wc.items.length, h: Math.round(document.getElementById('wcarte-cv').getBoundingClientRect().height), fiche: document.getElementById('wcarte-fiche').innerText, next: document.getElementById('wnext').hidden, plus: document.getElementById('wtask-plus').textContent, suite: document.getElementById('wband-more').hidden }; });
  ok(apres.fait && apres.pointFait === 'tache' && /^Rapporter le groupe grisé/.test(apres.next) && deplie.vu && deplie.exp === 'true' && deplie.lignes === 9
     && neuf.n === 0 && neuf.h < 300 && /^Rien encore autour de ce projet/.test(neuf.fiche) && neuf.next && neuf.plus === 'Ajouter une tâche' && neuf.suite,
     '« C\'est fait » coche la prochaine (son point passe au fait) et la suivante monte ; le reste se déplie ; un projet neuf : aucun point, « Rien encore », « Ajouter une tâche », pas de description', JSON.stringify({ apres, deplie, neuf }));
  ok(!errors.length, 'Le monde vivant : aucune erreur de console', errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
