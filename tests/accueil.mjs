// Tests de l'accueil (#S1), le premier écran après la connexion (8 octobre : identité de l'écran d'entrée, charte
// appliquée, l'accueil ramené à UN but, la prochaine étape ; projets endormis repliés ; « Ma vie » à part ; cases à
// leur juste taille ; nombre d'espaces compté ; ville et pays par la position de l'appareil, si la personne le veut).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/accueil.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Sur iPhone (390 × 844) et sur Mac (1440 × 900), accueil vide puis rempli (trois pensées déposées et rangées par
// un faux proxy) : textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, aucun emoji, aucun mode de fusion, aucun
// débordement, contraste ≥ 4,5 : 1 mesuré dans l'image sur toute la hauteur ; police du système pour le texte ;
// l'horizon d'ARC sous le titre ; la barre du haut tient sur un téléphone de 360 px, même avec un état long.
// L'ordre de l'accueil (prochaine étape, Déposé et point du jour, Projets, Ma vie), ce qui en est sorti, la
// prochaine étape et sa touche dans le premier écran de l'iPhone, « C'est fait », « Ensuite » qui ouvre « Déposé »,
// endormir et réveiller un projet (gardé dans S.sleep, relu au lancement suivant).
// La ville : la position vient d'un faux appareil et son nom d'un faux service (aucune requête ne part vers le vrai).

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
  const cibles = [...root.querySelectorAll('button, a[href], input, textarea, select, label, [data-action], [role=button], #sync-pill')].filter(vis)
    .map(e => ({ r: e.getBoundingClientRect(), n: nom(e) })).filter(c => c.r.height < 43.5 || c.r.width < 43.5).map(c => `${c.n} ${Math.round(c.r.width)}×${Math.round(c.r.height)}`);
  const petits = [], emoji = [], polices = new Set(); const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e), s = parseFloat(cs.fontSize); if (s === 0) continue;
    if (s < 12) petits.push(`${nom(e)} ${s}px`); const m = nd.nodeValue.match(/\p{Extended_Pictographic}/gu); if (m) emoji.push(nom(e) + ' ' + m.join('')); polices.add(cs.fontFamily.split(',')[0].trim().replace(/"/g, '')); }
  const champs = [...root.querySelectorAll('input:not([type=file]), textarea, select')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(nom);
  const fusion = []; for (const e of root.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') fusion.push(nom(e)); }
  const hors = [...root.querySelectorAll('.hn *, .h-hero > *, .h-section, .h-entries, .next-wrap, .next-item, .h-dort-row')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).filter(e => !e.classList.contains('h-horizon')).map(nom);
  const hz = getComputedStyle(root.querySelector('.h-horizon'), '::before'), texte = e => getComputedStyle(root.querySelector(e)).fontFamily.split(',')[0].trim();
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i);
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], emoji, champs, fusion, hors: [...new Set(hors)], ids, polices: [...polices],
           large: document.documentElement.scrollWidth <= innerWidth && root.scrollWidth <= root.clientWidth + 1,
           horizon: /radial-gradient/.test(hz.maskImage || hz.webkitMaskImage || '') && /gradient/.test(hz.backgroundImage), systeme: [texte('#h-date'), texte('.depot-entry-t'), texte('.pj-f'), texte('.pj-n'), texte('.h-section-lbl'), texte('.vie-n')], titre: texte('.h-h1'),
           mondes: root.querySelectorAll('.pj').length, dort: root.querySelectorAll('.h-dort-row').length, poles: root.querySelectorAll('.vie').length, etapes: root.querySelectorAll('#next-list .next-item').length,
           date: (root.textContent.match(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d{1,2} /gi) || []).length };
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
    d(r.mondes !== 2 || r.dort !== 3 || r.poles !== 2, `${r.mondes} projets en cours, ${r.dort} endormis, ${r.poles} pôles`);
    d(r.date !== 1, `la date est écrite ${r.date} fois`);
    d(etat === 'rempli' && r.etapes < 2, `${r.etapes} prochaine(s) étape(s) affichée(s)`);
    const c = await contraste(page, etat); n += c.n; contrastes.push(...c.sous); if (c.pire.ratio < pire.ratio) pire = c.pire;
  }
  // le menu ouvert : chaque ligne se touche
  // attendre la fin de l'ouverture du menu (180 ms) : mesuré pendant le fondu, son texte est à demi transparent
  await page.click('#btn-menu'); await page.evaluate(() => Promise.all(document.getElementById('h-menu-dd').getAnimations().map(a => a.finished))); await page.waitForTimeout(200);
  const menu = await page.evaluate(() => [...document.querySelectorAll('#h-menu-dd .h-menu-item')].filter(e => e.offsetParent !== null).map(e => Math.round(e.getBoundingClientRect().height)));
  const cm = await mesurer(page, { racine: '#h-menu-dd', ...MASQUE }); n += cm.n; contrastes.push(...cm.sous.map(x => ({ ...x, t: 'menu › ' + x.t }))); if (cm.pire.ratio < pire.ratio) pire = { ...cm.pire, t: 'menu › ' + cm.pire.t };
  if (menu.some(h => h < 44) || menu.length < 4) defauts.push(`menu : lignes de ${menu.join(', ')} px`);
  await page.click('#btn-menu');
  if (contrastes.length) { const g = {}; for (const m of contrastes) { const e = g[m.n + ' « ' + m.t + ' »'] ||= { min: 9, nb: 0 }; e.nb++; e.min = Math.min(e.min, m.ratio); } detail[vp.n] = Object.entries(g).map(([k, e]) => `${e.min.toFixed(2)}  ${k}  (${e.nb})`); }
  ok(!defauts.length, `${vp.n} : l'accueil respecte la charte, vide et rempli (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion ni débordement, police du système, horizon d'ARC, date écrite une fois)`,
     defauts.slice(0, 4).join(' ; ') || `polices : ${dernier.polices.join(', ')} ; ${dernier.etapes} étapes, ${dernier.mondes} projets en cours, ${dernier.dort} endormis, ${dernier.poles} pôles`);
  ok(n > 300 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout sur l'accueil, vide et rempli, menu compris`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  // les cinq mondes et les deux pôles s'ouvrent depuis l'accueil, et on en revient
  const ouverts = [];
  for (let w = 0; w < 5; w++) { await page.evaluate(i => document.querySelector(`#S1 :is(.pj, .h-dort-row)[data-wid="${i}"]`).click(), w); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && document.getElementById('S1').classList.contains('off'))); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  for (const p of ['sante', 'juridique']) { await page.evaluate(i => document.querySelector(`#S1 .vie[data-pole="${i}"]`).click(), p); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(i => !document.getElementById(i === 'sante' ? 'S3' : 'S4').classList.contains('off'), p)); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  ok(ouverts.length === 7 && ouverts.every(Boolean) && errors.length === 0, `${vp.n} : les cinq mondes (en cours ou endormis) et les deux pôles s'ouvrent depuis l'accueil, aucune erreur de console`, ouverts.map(o => o ? 'oui' : 'NON').join(' ') + (errors.length ? ' ; ' + errors.slice(0, 2).join(' | ') : ''));
  await ctx.close();
}

/* L'accueil a UN but : la prochaine étape. L'ordre, ce qui en est sorti, les gestes */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await openPage(browser, url, { ctx, fk });
  await page.waitForTimeout(500);
  const plan = () => page.evaluate(() => { const root = document.getElementById('S1'), y = s => { const e = root.querySelector(s); return e && e.offsetParent !== null ? Math.round(e.getBoundingClientRect().top) : null; };
    const txt = root.querySelector('.hw').innerText, bar = document.getElementById('depot-bar').getBoundingClientRect().top, go = root.querySelector('.is-now .rg-btn.main');
    return { ordre: [y('.h-h1'), y('.h-horizon'), y('#next-steps'), y('.h-entries'), y('#hgrid'), y('#h-dort'), y('#poles-grid')],
             sortis: ['.h-stats', '.h-prog', '#h-critical-badge', '#quick-add-bar', '.intel-card', '.pc-monde', '.pole-card', '.pole-dot', '.h-context-badge', '.h-sub', '.h-pied', '.h-logo-sub'].filter(s => root.querySelector(s)),
             mots: ['Résous', 'CRITIQUE', 'URGENCE', 'manquant', 'Veille', 'bien-être', 'bloquant', 'Valence', 'VALENCE', 'RAYAN', 'ARC v2'].filter(m => (txt + ' ' + root.querySelector('.hn').innerText).includes(m)),
             haut: (() => { const c = [root, root.querySelector('.hw')].find(e => e.scrollHeight > e.clientHeight + 4) || root; return c.scrollHeight; })(), titreH: Math.round(root.querySelector('.h-h1').getBoundingClientRect().height), entrees: [...root.querySelectorAll('.h-entries .depot-entry')].map(e => Math.round(e.getBoundingClientRect().top)), vie: [...root.querySelectorAll('.vie')].map(e => Math.round(e.getBoundingClientRect().top)), mono: [...root.querySelectorAll('.hw > :not(.hn) *')].filter(e => e.offsetParent !== null && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()) && /Mono/.test(getComputedStyle(e).fontFamily)).map(e => e.className).slice(0, 3),
             titre: document.getElementById('h-espaces').textContent, sous: document.getElementById('h-projets-sub').textContent,
             lbl: [...root.querySelectorAll('.next-lbl')].map(e => e.textContent), vide: !document.getElementById('next-empty').hidden,
             now: root.querySelector('.is-now .next-step')?.textContent || null, touche: go ? { bas: Math.round(go.getBoundingClientRect().bottom), barre: Math.round(bar), blanc: getComputedStyle(go).color } : null,
             principaux: root.querySelectorAll('.rg-btn.main').length, lignes: [...root.querySelectorAll('.next-row .next-step')].map(e => e.textContent) }; });
  const vide = await plan();
  const croissant = a => a.every((v, i) => v !== null && (i === 0 || v > a[i - 1]));
  ok(croissant(vide.ordre) && !vide.sortis.length && !vide.mots.length && vide.titre === 'Sept espaces.' && vide.sous === '2 en cours · 3 endormis' && vide.vide && !vide.now,
     'Accueil : dans l\'ordre, titre, horizon, prochaine étape, Déposé et point du jour, Projets, Endormis, Ma vie ; compteurs, progression globale, ajout rapide, veille, descriptions, « Valence » en dur et mots pressants n\'y sont plus',
     `positions ${vide.ordre.join(', ')} ; « ${vide.titre} » ; « ${vide.sous} »${vide.sortis.length ? ' ; restent ' + vide.sortis.join(', ') : ''}${vide.mots.length ? ' ; mots ' + vide.mots.join(', ') : ''}`);

  for (const t of ['Appeler la comptable pour la TVA', 'Relire les CGV d\'Atlas', 'idée de nom pour la boutique']) { await deposit(page, t); await page.waitForTimeout(250); }
  await page.waitForFunction(() => document.querySelectorAll('#next-list .next-item').length >= 2 && !document.getElementById('next-torange').hidden, null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(300);
  const plein = await plan();
  ok(plein.now === 'Appeler la comptable pour la TVA' && plein.lbl.join('|') === 'Prochaine étape|Ensuite' && plein.principaux === 1 && plein.touche && plein.touche.bas < plein.touche.barre && plein.touche.blanc === 'rgb(11, 11, 15)' && plein.lignes.length === 1 && !plein.vide,
     'Accueil : la prochaine étape est une carte avec la seule touche principale de l\'écran, « C\'est fait », visible dans le premier écran de l\'iPhone ; la suite est sous « Ensuite »',
     `« ${plein.now} » ; libellés ${plein.lbl.join(', ')} ; ${plein.principaux} touche principale, bas à ${plein.touche?.bas} px (barre de dépôt à ${plein.touche?.barre} px) ; ensuite : ${plein.lignes.join(' / ')}`);

  // À leur juste taille : le titre sur une ligne, Déposé et Point du jour côte à côte, Santé et Juridique côte à côte,
  // aucune petite capitale à chasse fixe, et tout l'accueil rempli en moins de deux écrans d'iPhone
  ok(plein.titreH <= 40 && plein.entrees.length === 2 && plein.entrees[0] === plein.entrees[1] && plein.vie.length === 2 && plein.vie[0] === plein.vie[1] && !plein.mono.length && plein.haut <= 1300 && vide.haut <= 1000,
     'Accueil épuré : titre sur une ligne, Déposé et Point du jour côte à côte, Santé et Juridique côte à côte, écriture du système sans chasse fixe, moins de deux écrans d\'iPhone',
     `titre ${plein.titreH} px de haut ; tuiles à ${plein.entrees.join(' et ')} px, Ma vie à ${plein.vie.join(' et ')} px ; hauteur de l'accueil : ${vide.haut} px vide, ${plein.haut} px rempli${plein.mono.length ? ' ; chasse fixe : ' + plein.mono.join(', ') : ''}`);

  // « Ensuite » : toute la ligne ouvre la pensée dans « Déposé » ; « C'est fait » fait monter la suivante
  const tid = await page.evaluate(() => document.querySelector('#S1 .next-row').getAttribute('data-id'));
  await page.click('#S1 .next-row'); await page.waitForTimeout(300);
  const dep = await page.evaluate(i => ({ ouvert: document.getElementById('depot-screen').classList.contains('open'), la: !!document.querySelector(`#depot-list [data-id="${i}"]`) }), tid);
  await page.evaluate(() => depotClose()); await page.waitForTimeout(200);
  await page.click('#S1 .is-now .rg-btn.main'); await page.waitForTimeout(300);
  const apres = await plan();
  ok(dep.ouvert && dep.la && apres.now === 'Relire les conditions générales de vente d\'Atlas' && apres.lbl.join('|') === 'Prochaine étape' && apres.lignes.length === 0,
     'Accueil : une ligne « Ensuite » ouvre sa pensée dans « Déposé » ; « C\'est fait » retire l\'étape et la suivante devient la prochaine',
     `Déposé ouvert ${dep.ouvert}, pensée présente ${dep.la} ; après « C'est fait » : « ${apres.now} », libellés ${apres.lbl.join(', ')}`);

  // Endormir, réveiller : depuis l'accueil et depuis le monde ; gardé dans S.sleep, relu au lancement suivant
  const etat = () => page.evaluate(() => ({ cours: [...document.querySelectorAll('#S1 .pj')].map(e => +e.dataset.wid), plie: document.getElementById('h-dort-list').hidden, noms: document.getElementById('h-dort-n').textContent, dort: [...document.querySelectorAll('#S1 .h-dort-row')].map(e => +e.dataset.wid),
    garde: (JSON.parse(localStorage.getItem('arc_v2') || '{}').sleep) || {}, v: S._worldsV, sous: document.getElementById('h-projets-sub').textContent, chez: !document.getElementById('S1').classList.contains('off') }));
  const e0 = await etat();
  await page.click('#h-dort-tog'); await page.waitForTimeout(150);
  const deplie = await page.evaluate(() => ({ etat: document.getElementById('h-dort-tog').getAttribute('aria-expanded'), vus: [...document.querySelectorAll('#S1 .h-dort-row')].filter(e => e.offsetParent !== null).length }));
  await page.click('#S1 .h-dort-btn[data-wid="1"]'); await page.waitForTimeout(250);
  const e1 = await etat();
  await page.evaluate(() => document.querySelector('#S1 .pj[data-wid="0"]').click()); await page.waitForTimeout(650);
  const dans = await page.evaluate(() => ({ t: document.getElementById('w-sommeil-btn').textContent, h: Math.round(document.getElementById('w-sommeil-btn').getBoundingClientRect().height) }));
  await page.evaluate(() => document.getElementById('w-sommeil-btn').click()); await page.waitForTimeout(200);
  const dans2 = await page.evaluate(() => document.getElementById('w-sommeil-btn').textContent);
  await page.evaluate(() => goHome()); await page.waitForTimeout(450);
  const e2 = await etat();
  await page.reload(); await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  const e3 = await etat();
  ok(e0.cours.join() === '0,4' && e0.dort.join() === '1,2,3' && e0.v === 3 && e0.plie && e0.noms === 'FBA, KITCHEN, TELENEUF' && deplie.etat === 'true' && deplie.vus === 3 && e3.plie && e1.chez && e1.cours.join() === '0,1,4' && e1.dort.join() === '2,3' && e1.garde[1] === false && e1.sous === '3 en cours · 2 endormis'
     && dans.t === 'Endormir ce projet' && dans.h >= 44 && dans2 === 'Réveiller ce projet' && e2.cours.join() === '1,4' && e2.dort.join() === '0,2,3' && e2.garde[0] === true
     && e3.cours.join() === '1,4' && e3.dort.join() === '0,2,3' && errors.length === 0,
     'Projets endormis : FBA, KITCHEN et TELENEUF le sont au départ, repliés en une ligne ; dépliés, « Réveiller » depuis l\'accueil sans quitter l\'accueil, « Endormir ce projet » depuis le monde ; le choix est gardé et relu au lancement suivant',
     `départ ${e0.cours.join()} | ${e0.dort.join()} ; après « Réveiller » FBA ${e1.cours.join()} | ${e1.dort.join()} (« ${e1.sous} ») ; ARYAN endormi ${e2.cours.join()} | ${e2.dort.join()} ; après rechargement ${e3.cours.join()} | ${e3.dort.join()}${errors.length ? ' ; ' + errors.slice(0, 2).join(' | ') : ''}`);
  await ctx.close();
}

/* Le titre compte les espaces de la personne */
{
  const { ctx, page } = await openPage(browser, url, { fk: fakeSupabase() });
  const lire = () => page.evaluate(() => { renderHome(); return document.getElementById('h-espaces').textContent; });
  const vus = [await lire()];
  vus.push(await page.evaluate(() => { const w = WORLDS.pop(); renderHome(); const t = document.getElementById('h-espaces').textContent; WORLDS.push(w); return t; }));
  vus.push(await page.evaluate(() => { const w = WORLDS.splice(1, 4), p = POLES.pop(); renderHome(); const t = document.getElementById('h-espaces').textContent; WORLDS.push(...w); POLES.push(p); return t; }));
  vus.push(await page.evaluate(() => { const w = WORLDS.splice(0, 5), p = POLES.pop(); renderHome(); const t = document.getElementById('h-espaces').textContent; WORLDS.push(...w); POLES.push(p); return t; }));
  vus.push(await lire());
  ok(vus.join(' | ') === 'Sept espaces. | Six espaces. | Deux espaces. | Un espace. | Sept espaces.', 'Le titre compte les espaces : un de moins, il le dit ; un seul, il s\'accorde', vus.join(' | '));
  await ctx.close();
}

/* La ville et le pays : par la position de l'appareil, seulement si la personne l'a choisi et que le navigateur l'autorise */
{
  const CORS = { 'access-control-allow-origin': '*' };
  const monter = async (opts) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce', ...opts });
    await ctx.addInitScript(sessionScript());
    const appels = [];
    await ctx.route('https://api.bigdatacloud.net/**', r => { appels.push(r.request().url());
      const u = new URL(r.request().url()), la = +u.searchParams.get('latitude');
      return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(la > 45 ? { city: 'Londres', locality: 'Westminster', countryName: "Royaume-Uni de Grande-Bretagne et d'Irlande du Nord (le)", countryCode: 'GB' } : { city: 'Valence', locality: 'Valence', countryName: 'France', countryCode: 'FR' }) }); });
    const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
    await page.waitForTimeout(400);
    return { ctx, page, errors, appels };
  };
  const vu = page => page.evaluate(() => { const l = document.getElementById('h-lieu'); return { txt: l.hidden ? '' : l.textContent, ligne: document.getElementById('h-quand').innerText.replace(/\s+/g, ' ').trim(), menu: document.getElementById('btn-lieu-lbl').textContent,
    garde: JSON.parse(localStorage.getItem('arc_lieu_v1') || 'null'), dansS: /Valence|Londres|"lat"/.test(localStorage.getItem('arc_v2') || ''), large: document.documentElement.scrollWidth <= innerWidth }; });
  const choisir = async page => { await page.click('#btn-menu'); await page.waitForTimeout(120); const h = await page.evaluate(() => Math.round(document.getElementById('btn-lieu').getBoundingClientRect().height)); await page.click('#btn-lieu'); await page.waitForTimeout(700); return h; };

  // 1. Autorisée : rien tant que l'option n'est pas choisie ; ensuite la ville et le pays, gardés sur l'appareil seulement
  const a = await monter({ geolocation: { latitude: 44.93345, longitude: 4.89236 }, permissions: ['geolocation'] });
  const a0 = await vu(a.page), avant = a.appels.length;
  const hMenu = await choisir(a.page);
  await a.page.evaluate(() => saveS());
  const a1 = await vu(a.page), u1 = a.appels[0] ? new URL(a.appels[0]).searchParams : new URLSearchParams();
  await a.page.reload(); await a.page.waitForTimeout(900); await a.page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  const a2 = await vu(a.page), apresRechargement = a.appels.length;
  // l'appareil a bougé de plusieurs centaines de kilomètres : la ville suit, le pays s'écrit simplement
  await a.ctx.setGeolocation({ latitude: 51.5072, longitude: -0.1276 });
  await a.page.evaluate(() => lieuCheck(true)); await a.page.waitForTimeout(700);
  const a3 = await vu(a.page);
  // l'autorisation est retirée : plus rien, et la ville gardée est oubliée
  await a.ctx.clearPermissions();
  await a.page.reload(); await a.page.waitForTimeout(1100); await a.page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  const a4 = await vu(a.page);
  // l'option coupée : plus rien, rien de gardé
  // L'autorisation rendue, la page encore ouverte le voit et redemande la ville (voulu) : on laisse cette demande
  // finir avant de recharger, sinon le rechargement la coupe (ERR_ABORTED), une fois sur trois (prouvé le 8 octobre)
  await a.ctx.grantPermissions(['geolocation']); await a.page.waitForTimeout(600);
  await a.page.reload(); await a.page.waitForTimeout(1100); await a.page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  const a5 = await vu(a.page);
  await choisir(a.page);
  const a6 = await vu(a.page);
  ok(a0.txt === '' && avant === 0 && a0.menu === 'Afficher ma ville' && hMenu >= 44
     && a1.txt === 'Valence, France' && /^\S+ \d{1,2} \S+ Valence, France$/.test(a1.ligne) && a1.menu === 'Ne plus afficher ma ville' && a1.garde.on === true && a1.garde.city === 'Valence' && !a1.dansS && a1.large
     && u1.get('latitude') === '44.933' && u1.get('longitude') === '4.892' && u1.get('localityLanguage') === 'fr'
     && a2.txt === 'Valence, France' && apresRechargement === 1
     && a3.txt === 'Londres, Royaume-Uni'
     && a4.txt === '' && !a4.garde.city && a4.garde.on === true
     && a5.txt === 'Londres, Royaume-Uni'
     && a6.txt === '' && a6.garde.on === false && !a6.garde.city && a6.menu === 'Afficher ma ville' && a.errors.length === 0,
     'Ma ville : rien tant que l\'option n\'est pas choisie ; ensuite « ville, pays » d\'après la position (arrondie, envoyée une seule fois tant qu\'on ne bouge pas), gardée sur l\'appareil et jamais dans l\'état synchronisé ; elle suit l\'appareil ; autorisation retirée ou option coupée : plus rien',
     `sans option « ${a0.txt} » (${avant} appel) ; choisie « ${a1.ligne} », position envoyée ${u1.get('latitude')}, ${u1.get('longitude')} ; rechargée « ${a2.txt} » (${apresRechargement} appel en tout) ; déplacée « ${a3.txt} » ; autorisation retirée « ${a4.txt} » ; rendue « ${a5.txt} » ; option coupée « ${a6.txt} »${a.errors.length ? ' ; ' + a.errors.slice(0, 2).join(' | ') : ''}`);
  await a.ctx.close();

  // 2. Refusée par le navigateur : rien ne s'affiche, l'option revient à « Afficher ma ville », aucun appel au service
  const b = await monter({});
  await choisir(b.page); await b.page.waitForTimeout(400);
  const b1 = await vu(b.page), dit = await b.page.evaluate(() => document.getElementById('toast-el').textContent);
  ok(b1.txt === '' && b1.menu === 'Afficher ma ville' && b1.garde && b1.garde.on === false && b.appels.length === 0 && /refusée/.test(dit) && b.errors.length === 0,
     'Ma ville, position refusée par le navigateur : rien ne s\'affiche, ARC le dit, et aucune position ne part', `« ${b1.txt} », menu « ${b1.menu} », ${b.appels.length} appel, message « ${dit} »`);
  await b.ctx.close();

  // 3. Option choisie mais personne n'est connecté (écran d'entrée) : ARC ne demande pas la position
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'fr-FR', reducedMotion: 'reduce', geolocation: { latitude: 44.93345, longitude: 4.89236 }, permissions: ['geolocation'] });
  await c.addInitScript(() => { localStorage.setItem('arc_lieu_v1', JSON.stringify({ on: true })); window.__geo = 0; const g = navigator.geolocation, f = g.getCurrentPosition.bind(g); g.getCurrentPosition = (...x) => { window.__geo++; return f(...x); }; });
  const appelsC = []; await c.route('https://api.bigdatacloud.net/**', r => { appelsC.push(1); return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"city":"Valence","countryCode":"FR"}' }); });
  const pc = await openPage(browser, url, { ctx: c, fk: fakeSupabase() });
  await pc.page.waitForTimeout(900);
  const c1 = await pc.page.evaluate(() => ({ entree: document.getElementById('auth-screen').classList.contains('active'), geo: window.__geo, lieu: document.getElementById('h-lieu').hidden }));
  ok(c1.entree && c1.geo === 0 && c1.lieu && appelsC.length === 0, 'Ma ville, sans session : sur l\'écran d\'entrée, ARC ne demande pas la position', `écran d'entrée ${c1.entree}, ${c1.geo} demande de position, ${appelsC.length} appel au service`);
  await c.close();
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
      const r = await page.evaluate(l => { setSyncUI('busy', l); const nav = document.querySelector('#S1 .hn'), els = [...nav.querySelectorAll('.h-logo-mark, .h-logo-name, #sync-pill, #btn-search, #btn-menu')].map(e => e.getBoundingClientRect());
        return { droite: Math.max(...els.map(x => x.right)), gauche: Math.min(...els.map(x => x.left)), haut: Math.min(...els.slice(2).map(x => x.height)), large: Math.min(...els.slice(2).map(x => x.width)),
                 chevauche: els.some((a, i) => els.some((b, j) => j > i && a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom && a.bottom > b.top && !(i === 0 && j === 1))) }; }, lbl);
      if (r.droite > w + 0.5 || r.gauche < 0 || r.haut < 43.5 || r.large < 43.5 || r.chevauche) vus.push(`${w} px « ${lbl} » : droite ${Math.round(r.droite)}, cible ${Math.round(r.large)}×${Math.round(r.haut)}${r.chevauche ? ', chevauchement' : ''}`);
    }
    await ctx.close();
  }
  {
    const { page } = await openPage(browser, url, { fk: fakeSupabase() });
    const wr = await page.evaluate(() => ({ bouton: !!document.getElementById('btn-warroom'), ecran: !!document.getElementById('war-room'), fonction: typeof window.openWarRoom, mot: /War Room/i.test(document.body.innerText), bienvenue: !!document.getElementById('onboarding') }));
    vus.push(...(wr.bouton || wr.ecran || wr.fonction !== 'undefined' || wr.mot || wr.bienvenue ? ['War Room ou écran de bienvenue encore présents : ' + JSON.stringify(wr)] : []));
    await page.context().close();
  }
  ok(!vus.length, 'Barre du haut : aucun bouton ne sort de l\'écran ni ne se chevauche, de 360 à 430 px, quel que soit l\'état de synchronisation ; la War Room n\'existe plus (ni bouton, ni écran, ni mot), ni l\'écran de bienvenue jamais affiché', vus.slice(0, 4).join(' ; ') || '4 largeurs × 5 états');
}

/* Le moment de la journée : un mot et un pictogramme, jamais d'emoji */
{
  const { ctx, page } = await openPage(browser, url, { fk: fakeSupabase(), clock: '2026-10-08T03:00:00+02:00' });
  const lire = () => page.evaluate(() => { renderHome(); const b = document.getElementById('h-quand'), i = b.querySelector('.h-quand-ico'), m = getComputedStyle(i); return b.getAttribute('data-slot') + ':' + document.getElementById('h-date').textContent + ':' + (/url\(/.test(m.maskImage || m.webkitMaskImage || '') && i.getBoundingClientRect().width >= 14 ? 'picto' : 'rien'); });
  const vus = [await lire()];
  // l'heure est posée, pas avancée : avancer l'horloge de plusieurs heures d'un coup échouait parfois sous charge
  for (const h of ['09', '16', '23']) { await page.clock.setFixedTime(new Date(`2026-10-08T${h}:00:00+02:00`)); vus.push(await lire()); }
  ok(vus.join(' | ') === 'nuit:Jeudi 8 octobre:picto | matin:Jeudi 8 octobre:picto | aprem:Jeudi 8 octobre:picto | soir:Jeudi 8 octobre:picto', 'Au-dessus du titre : le moment de la journée (un pictogramme au trait, quatre moments) et la date, écrite une fois', vus.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
