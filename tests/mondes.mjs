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
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], champs, fusion, horizon: /radial-gradient/.test(hz.maskImage || hz.webkitMaskImage || '') && /gradient/.test(hz.backgroundImage), mono: [...new Set(mono)], capit: [...new Set(capit)], systeme: [police('.w-hero-desc'), police('.wsec-lbl'), police('.wtask-txt'), police('.wat-inp'), police('.w-back')], titre: police('.w-hero-name'), section: getComputedStyle(root.querySelector('.wsec-lbl')).fontSize,
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
    const zones = [{ racine: '#S2 .wtop' }];
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

// Le bas d'un monde (13 octobre, Rayan : « construire avec Claude », le contenu d'avril « on le révise ensemble ») :
// Avec ARC (rien ne part sans le geste, la ligne vraie, les propositions n'entrent qu'avec « Ajouter », panne), la revue
// d'avril (un geste par élément, « Revenir », retirées hors du pourcentage, « Remettre »), la Mémoire (pensées et journal
// sur un seul fil, suppression en deux gestes, notes repliées), « Ce qui bloque » (Résolu, Remettre) ; plus de compteurs
// ni de panneau Claude à droite.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const fk = fakeSupabase(), appels = [];
  let panne = false;
  fk.proxy = async body => { if (body.task === 'file') return { status: 500, json: {} }; appels.push(body);
    if (panne) return { status: 503, json: {} };
    return { status: 200, json: { content: [{ type: 'text', text: '```json\n' + JSON.stringify({ reponse: 'Fais l’essai « Ma boutique » d’abord.', propositions: [{ type: 'tâche', texte: 'Filmer l’essai sur iPhone' }, { type: 'journal', texte: 'Décision : essai avant Q1-Q4' }, { type: 'bloquant', texte: 'Pas de boulangerie partante' }, { type: 'autre', texte: 'ignoré' }] }) + '\n```' }] } }; };
  const { page, errors } = await openPage(browser, url, { ctx, fk });
  await page.evaluate(() => {
    const id = depotUUID(); _depot.thoughts[id] = { id, body: 'Relancer la boulangère', source: 'text', device: 'iphone', created_at: new Date(Date.now() - 2 * 864e5).toISOString(), status: 'pending' }; depotSave();
    rangeAdd(id, { status: 'filed', space: 'aryan', step: 'Relancer la boulangère', moment: { type: 'none' }, extras: [] }, 'ai', 'm');
    S.journal[0] = [{ ts: Date.now() - 864e5, t: 'Boulangère partante.' }]; S.notes[0] = 'Penser au pilote.'; saveS();
    if (typeof matinClose === 'function') matinClose(); enterWorld(0);
  });
  await page.waitForTimeout(400);
  const avant = await page.evaluate(() => ({ appels: 0, ligne: document.getElementById('wat-ligne').textContent, sugs: [...document.querySelectorAll('.wat-sug')].map(b => b.textContent),
    compteurs: !!document.getElementById('wmetrics'), wcp: getComputedStyle(document.getElementById('wcp')).display, ordre: [...document.querySelectorAll('#wmain > .wsec')].filter(e => !e.hidden).map(e => e.id) }));
  avant.appels = appels.length;
  await page.tap('.wat-sug'); await page.waitForTimeout(500);
  const r1 = await page.evaluate(() => ({ moi: document.querySelector('.wat-moi').textContent, arc: document.querySelector('.wat-arc .wat-t').textContent,
    props: [...document.querySelectorAll('.wat-prop')].map(p => p.querySelector('.wat-prop-t').textContent), parti: document.querySelector('.wat-parti').textContent }));
  const sys = appels[0] ? appels[0].system : '', msgs = appels[0] ? appels[0].messages : [];
  const contexte = /Mission : Amener ARYAN/.test(sys) && /Relancer la boulangère/.test(sys) && /Boulangère partante/.test(sys) && /Penser au pilote/.test(sys) && /Quatre courses payées/.test(sys) && msgs.length === 1 && msgs[0].role === 'user';
  const avantAjout = await page.evaluate(() => ({ c: (S.custom[0] || []).length, j: S.journal[0].length, b: (S.blkCustom[0] || []).length }));
  for (const i of [0, 1, 2]) { await page.locator('.wat-prop .wat-ajout').nth(i).tap(); await page.waitForTimeout(150); }
  const apresAjout = await page.evaluate(() => ({ c: (S.custom[0] || []).map(t => t.t), j: S.journal[0].map(x => x.t), b: S.blkCustom[0], boutons: [...document.querySelectorAll('.wat-ajout')].map(b => b.textContent + (b.disabled ? '·off' : '')) }));
  // une deuxième demande : l'échange précédent part avec elle, en alternance
  await page.fill('#wat-inp', 'Et ensuite ?'); await page.tap('#wat-envoi'); await page.waitForTimeout(500);
  const m2 = appels[1] ? appels[1].messages.map(m => m.role).join(',') : '';
  panne = true; await page.fill('#wat-inp', 'Une troisième ?'); await page.tap('#wat-envoi'); await page.waitForTimeout(500);
  const err = await page.evaluate(() => ({ t: [...document.querySelectorAll('.wat-arc.err .wat-t')].map(e => e.textContent).join(), re: !!document.querySelector('.wat-arc.err .wat-re'), avant: document.getElementById('wat-avant').textContent }));
  panne = false; await page.tap('.wat-arc.err .wat-re'); await page.waitForTimeout(500);
  const repris = await page.evaluate(() => ({ err: document.querySelectorAll('.wat-arc.err').length, n: watFil(0).length }));
  ok(avant.appels === 0 && /^Partira à Claude avec ta demande : la mission, \d+ tâches, 3 bloquants, 1 pensée, 1 entrée du journal et tes notes\.$/.test(avant.ligne) && avant.sugs.length === 3
     && !avant.compteurs && avant.wcp === 'none' && avant.ordre.slice(0, 3).join() === 'wsec-arc,wsec-taches,wsec-memoire' && avant.ordre.includes('wsec-projet')
     && r1.moi === 'Quelle est la prochaine étape ?' && /essai « Ma boutique »/.test(r1.arc) && r1.props.length === 3 && /^Parti à Claude : la mission/.test(r1.parti) && contexte
     && avantAjout.c === 0 && apresAjout.c.includes('Filmer l’essai sur iPhone') && apresAjout.j.includes('Décision : essai avant Q1-Q4') && apresAjout.b.includes('Pas de boulangerie partante') && apresAjout.boutons.every(b => b === 'Ajouté·off')
     && m2 === 'user,assistant,user' && /ARC n’a pas pu répondre/.test(err.t) && err.re && repris.err === 0 && repris.n === 6,
     'Avec ARC : rien ne part avant le geste, la ligne dit ce qui partira ; la suggestion part avec le contexte du projet ; trois propositions, chacune n\'entre qu\'avec « Ajouter » ; la conversation suit ; panne dite et « Réessayer » ; plus de compteurs ni de panneau de droite',
     JSON.stringify({ avant, r1, contexte, avantAjout, apresAjout, m2, err, repris }));
  // La revue d'avril
  const rv0 = await page.evaluate(() => ({ vu: !document.getElementById('wrevue').hidden, t: document.getElementById('wrevue').textContent, pct: document.getElementById('ring-pct').textContent }));
  await page.tap('#wrevue-go'); await page.waitForTimeout(250);
  const rvPos = await page.evaluate(() => [document.getElementById('rv-pos').textContent, document.getElementById('rv-k').textContent, document.getElementById('rv-t').textContent, [...document.querySelectorAll('.rv-b')].map(b => b.textContent + (b.classList.contains('blanc') ? '·blanc' : '')).join('/')]);
  await page.locator('.rv-b', { hasText: 'Toujours à faire' }).tap(); await page.waitForTimeout(120);
  await page.locator('.rv-b', { hasText: 'Déjà faite' }).tap(); await page.waitForTimeout(120);
  await page.locator('.rv-b', { hasText: 'Plus d’actualité' }).tap(); await page.waitForTimeout(120);
  await page.tap('#rv-retour'); await page.waitForTimeout(120);
  await page.locator('.rv-b', { hasText: 'Plus d’actualité' }).tap(); await page.waitForTimeout(120);
  const rv1 = await page.evaluate(() => ({ revue: S.revue[0], fait: !!S.tasks[0].a31, aujourdhui: !!(S.taskDone && S.taskDone[0] && S.taskDone[0].a31), pos: document.getElementById('rv-pos').textContent }));
  await page.tap('#rv-fermer'); await page.waitForTimeout(250);
  const rv2 = await page.evaluate(() => ({ pct: document.getElementById('ring-pct').textContent, carte: _wc.items.some(it => it.id === 'a32'), liste: [...document.querySelectorAll('#wnext .wnext-t, #tasks-container .wtask-row .wtask-txt')].some(e => /^Répondre à Q1-Q4/.test(e.textContent)),
    retiree: [...document.querySelectorAll('.wretiree-t')].map(e => e.textContent).join(), t: document.getElementById('wrevue').textContent }));
  await page.tap('#wtask-plus'); await page.waitForTimeout(150);
  await page.tap('.wretiree .wblk-res'); await page.waitForTimeout(200);
  const rv3 = await page.evaluate(() => ({ revue: S.revue[0]['t:a32'] || null, retirees: document.querySelectorAll('.wretiree').length }));
  ok(rv0.vu && /14 éléments écrits en avril/.test(rv0.t) && rvPos[0] === '1 sur 14' && rvPos[1] === 'Tâche écrite en avril' && /^Essai « Ma boutique »/.test(rvPos[2]) && rvPos[3] === 'Toujours à faire·blanc/Déjà faite/Plus d’actualité'
     && rv1.revue['t:a30'].v === 'garde' && rv1.revue['t:a31'].v === 'fait' && rv1.revue['t:a32'].v === 'retire' && rv1.fait && !rv1.aujourdhui && rv1.pos === '4 sur 14'
     && rv2.pct !== rv0.pct && !rv2.carte && !rv2.liste && /^Répondre à Q1-Q4/.test(rv2.retiree) && /11 à revoir/.test(rv2.t) && !rv3.revue && rv3.retirees === 0,
     'Revue d\'avril : un élément à la fois, une touche blanche ; « Déjà faite » coche sans compter « aujourd\'hui » ; « Revenir » défait ; une tâche retirée quitte la liste, la carte et le pourcentage ; « Remettre » la rend',
     JSON.stringify({ rv0, rvPos, rv1, rv2, rv3 }));
  // La Mémoire, les notes, ce qui bloque
  const mem = await page.evaluate(() => ({ lignes: [...document.querySelectorAll('#jou-list .wpen-row')].map(e => (e.classList.contains('wmem-jou') ? 'J ' : 'P ') + e.querySelector('.wpen-t').textContent), n: document.getElementById('wmem-n').textContent,
    notes: document.getElementById('wnotes-box').hidden, notesLbl: document.getElementById('wnotes-tog').textContent }));
  await page.locator('.wmem-jou', { hasText: 'Boulangère partante.' }).locator('.wmem-del').tap(); await page.waitForTimeout(120);
  const arme = await page.evaluate(() => ({ n: S.journal[0].length, t: document.querySelector('.wmem-del.arme') ? document.querySelector('.wmem-del.arme').textContent : '' }));
  await page.locator('.wmem-del.arme').tap(); await page.waitForTimeout(150);
  const suppr = await page.evaluate(() => S.journal[0].map(j => j.t));
  await page.tap('#wnotes-tog'); await page.waitForTimeout(120);
  const notesOuv = await page.evaluate(() => ({ vu: !document.getElementById('wnotes-box').hidden, v: document.getElementById('notes-ta').value }));
  await page.locator('.wblk', { hasText: 'Deux anomalies Stripe' }).locator('.wblk-res').tap(); await page.waitForTimeout(150);
  const blk = await page.evaluate(() => ({ actifs: [...document.querySelectorAll('.wblk:not(.resolu) .wblk-text')].map(e => e.textContent), tog: (document.querySelector('.wblk-tog') || {}).textContent, n: document.getElementById('wblk-n').textContent }));
  await page.tap('.wblk-tog'); await page.waitForTimeout(120); await page.locator('.wblk.resolu .wblk-res').tap(); await page.waitForTimeout(150);
  const blk2 = await page.evaluate(() => document.querySelectorAll('.wblk:not(.resolu)').length);
  const cibles = await page.evaluate(() => [...document.querySelectorAll('#wsec-arc button, #wsec-taches button, #wsec-memoire button, #wsec-projet button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(b => b.height < 43.5 || b.width < 43.5).length);
  ok(mem.lignes.slice(0, 2).join(' | ') === 'J Décision : essai avant Q1-Q4 | J Boulangère partante.' && mem.lignes.includes('P Relancer la boulangère') && mem.n === '1 pensée à faire' && mem.notes && /Notes libres · 3 mots/.test(mem.notesLbl)
     && arme.n === 2 && arme.t === 'Supprimer' && suppr.join() === 'Décision : essai avant Q1-Q4' && notesOuv.vu && notesOuv.v === 'Penser au pilote.'
     && blk.actifs.length === 3 && !blk.actifs.some(t => /anomalies Stripe/.test(t)) && blk.tog === '1 résolu' && blk.n === '3' && blk2 === 4 && !cibles,
     'Mémoire : pensées et journal sur un seul fil, du plus récent au plus ancien ; supprimer une entrée demande un second geste ; notes libres repliées ; « Ce qui bloque » : Résolu puis Remettre ; cibles ≥ 44 px',
     JSON.stringify({ mem, arme, suppr, notesOuv, blk, blk2, cibles }));
  // Contraste du bas, mesuré dans l'image
  let pireBas = { ratio: Infinity }, sous = [];
  for (const sel of ['#wsec-arc', '#wsec-taches', '#wsec-memoire', '#wsec-projet']) {
    await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start' }), sel); await page.waitForTimeout(150);
    const m = await mesurer(page, { racine: sel, cadre: '#wmain', hors: ['#depot-bar', '.depot-pill', '.depot-note'] });
    sous.push(...m.sous); if (m.pire.ratio < pireBas.ratio) pireBas = m.pire;
  }
  await page.tap('#wrevue-go'); await page.waitForTimeout(250);
  const mr = await mesurer(page, { racine: '#rv-box' }); sous.push(...mr.sous); if (mr.pire.ratio < pireBas.ratio) pireBas = mr.pire;
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const ferme = await page.evaluate(() => !document.getElementById('revue-modal').classList.contains('open'));
  ok(!sous.length && ferme, 'Le bas d\'un monde et la revue : contraste ≥ 4,5 : 1 ; Échap ferme la revue', `le plus faible : ${dit(pireBas)}${sous.length ? ' ; ' + sous.slice(0, 3).map(dit).join(' ; ') : ''}`);
  ok(!errors.filter(e => !/status of 50[03]/.test(e)).length, 'Le bas d\'un monde : aucune erreur de console', errors.join(' | '));
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
