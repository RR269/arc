// Tests de l'accueil (#S1), le premier écran après la connexion (8 octobre : identité de l'écran d'entrée, charte
// appliquée ; 10 octobre : plus d'agenda, le poste (Déposé, Point du jour, dernière pensée, à ranger) porté par
// l'horizon ; projets endormis repliés ; « Ma vie » à part ; cases à leur juste taille ; nombre d'espaces compté ;
// ville et pays par la position de l'appareil, si la personne le veut).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/accueil.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Sur iPhone (390 × 844) et sur Mac (1440 × 900), accueil vide puis rempli (trois pensées déposées et rangées par
// un faux proxy) : textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, aucun emoji, aucun mode de fusion, aucun
// débordement, contraste ≥ 4,5 : 1 mesuré dans l'image sur toute la hauteur ; police du système pour le texte ;
// l'horizon d'ARC sous le titre ; la barre du haut tient sur un téléphone de 360 px, même avec un état long.
// L'ordre de l'accueil (le poste, Projets, Ma vie), ce qui en est sorti (dont toute liste d'étapes : « c'est pas un
// agenda »), les chiffres vrais du poste, l'écho de la dernière pensée et « N pensées à ranger » qui ouvrent « Déposé »,
// « C'est fait » compté depuis « Déposé », endormir et réveiller un projet (gardé dans S.sleep, relu au lancement suivant).
// La ville : la position vient d'un faux appareil et son nom d'un faux service (aucune requête ne part vers le vrai).

import { chromium, startServer, fakeSupabase, openPage, sessionScript, deposit } from './outils.mjs';
import { mesurer, png } from './mesure.mjs';

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
  const hors = [...root.querySelectorAll('.hn *, .h-hero > *, .h-section, .h-poste, .h-cl, .h-ranger, .h-dort-row')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).filter(e => !e.classList.contains('h-horizon')).map(nom);
  const hz = getComputedStyle(root.querySelector('.h-horizon'), '::before'), texte = e => getComputedStyle(root.querySelector(e)).fontFamily.split(',')[0].trim();
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i);
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], emoji, champs, fusion, hors: [...new Set(hors)], ids, polices: [...polices],
           large: document.documentElement.scrollWidth <= innerWidth && root.scrollWidth <= root.clientWidth + 1,
           horizon: /radial-gradient/.test(hz.maskImage || hz.webkitMaskImage || '') && /gradient/.test(hz.backgroundImage), systeme: [texte('#h-date'), texte('.h-cl-l'), texte('.pj-pct'), texte('.pj-n'), texte('.h-section-lbl'), texte('.h-cl-t')], titre: texte('.h-h1'),
           mondes: root.querySelectorAll('.pj').length, dort: root.querySelectorAll('.h-dort-row').length, poles: root.querySelectorAll('.vie').length, agenda: !!root.querySelector('#next-list, #next-steps, .next-item, .next-lbl') || /Prochaine étape|Ensuite/.test(root.querySelector('.hw').innerText), poste: root.querySelectorAll('#h-poste .h-cl').length === 3 && !!root.querySelector('#h-ask'),
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
      await page.waitForFunction(() => document.getElementById('depot-n').textContent === '3' && !document.getElementById('h-ranger').hidden, null, { timeout: 8000 }).catch(() => {});
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
    d(r.systeme.some(f => f !== '-apple-system') || !/apple-system/.test(r.titre), `écriture : texte ${r.systeme.join(' / ')}, titre ${r.titre}`);
    d(r.mondes !== 2 || r.dort !== 3 || r.poles !== 0, `${r.mondes} projets en cours, ${r.dort} endormis, ${r.poles} tuiles Ma vie (Santé et Juridique sont sur la planète depuis le 13 octobre)`);
    d(r.date !== 1, `la date est écrite ${r.date} fois`);
    d(r.agenda || !r.poste, r.agenda ? 'une liste d\'étapes est revenue sur l\'accueil' : 'le poste manque');
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
     defauts.slice(0, 4).join(' ; ') || `polices : ${dernier.polices.join(', ')} ; ${dernier.mondes} projets en cours, ${dernier.dort} endormis, ${dernier.poles} pôles`);
  // (13 octobre : l'accueil allégé, sans Ma vie ni dernière pensée, a moins de textes ; le garde-fou passe de 250 à 200)
  ok(n > 200 && !contrastes.length, `${vp.n} : contraste ≥ 4,5 : 1 partout sur l'accueil, vide et rempli, menu compris`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${contrastes.length ? ` ; ${contrastes.length} sous le seuil, dont ${contrastes.slice(0, 3).map(dit).join(' ; ')}` : ''}`);
  // Le sol et le ciel (10 octobre) : le ciel prend la couleur de l'espace où la dernière pensée a été rangée (un fait :
  // ici ATLAS, la troisième pensée restant en hésitation), le sol passe sous le poste ; le noir reste noir (pas de voile).
  const sc = await page.evaluate(() => {
    const s1 = document.getElementById('S1'), now = s1.querySelector('#h-poste');
    const ciel = s1.style.getPropertyValue('--ciel').trim(), solY = parseFloat(s1.style.getPropertyValue('--sol-y'));
    const hwTop = s1.querySelector('.hw').getBoundingClientRect().top;
    const attendu = rangeSpaceInfo('atlas').color;
    const bas = now ? now.getBoundingClientRect().bottom - hwTop : null;
    const sol = s1.querySelector('.h-sol'), cl = s1.querySelector('.h-ciel');
    return { ciel, attendu, solY, bas, couches: !!(sol && cl), grain: /svg/.test(getComputedStyle(cl, '::after').backgroundImage), sousContenu: parseInt(getComputedStyle(sol).zIndex) < 0 && parseInt(getComputedStyle(cl).zIndex) < 0 };
  });
  const noir = await page.evaluate(() => { const b = document.body.getBoundingClientRect(); return { w: Math.round(b.width), h: innerHeight }; });
  const shot = png(await page.screenshot());
  let noirs = 0, total = 0; for (let y = 0; y < shot.h; y += 3) for (let x = 0; x < shot.w; x += 3) { const i = (y * shot.w + x) * shot.bpp; total++; if (shot.px[i] <= 2 && shot.px[i + 1] <= 2 && shot.px[i + 2] <= 2) noirs++; }
  const partNoir = Math.round(100 * noirs / total);
  ok(sc.couches && sc.sousContenu && sc.grain && sc.ciel.toLowerCase() === (sc.attendu || '').toLowerCase() && Math.abs(sc.solY - (sc.bas - 40)) <= 2 && partNoir >= 8,
     `${vp.n} : le sol et le ciel : couches sous le contenu, grain, ciel à la couleur de l'espace de la dernière pensée rangée, sol sous le poste, au moins 8 % de noir franc`,
     JSON.stringify({ ciel: sc.ciel, attendu: sc.attendu, solY: sc.solY, bas: sc.bas, partNoir }));
  // Signaux vrais (10 octobre) : chaque chiffre vient de l'état, zéro = absent ; l'activité d'un projet ne vient que
  // d'un vrai geste (S.taskDone), jamais de la date posée par défaut au chargement (S.taskDates).
  const sv = await page.evaluate(() => {
    const faits = document.getElementById('h-faits');
    const lignes = [...document.querySelectorAll('#S1 .pj')].map(e => ({ n: e.querySelector('.pj-n').textContent, act: (e.querySelector('.pj-act') || {}).textContent || '', calme: e.classList.contains('calme') }));
    const defaut = Object.values(S.taskDates).some(w => Object.keys(w).length) && !Object.values(S.taskDone || {}).some(w => Object.keys(w).length);
    return { faits: faits.hidden ? null : faits.textContent, lignes, defaut, sync: document.getElementById('sync-lbl').textContent };
  });
  // trois pensées déposées à l'instant, rangées dans ARYAN et ATLAS (et une hésitation) : voilà les seuls faits
  // (13 octobre : « N pensées déposées » est retiré du haut, il contredisait « Déposé » ; sans étape faite, rien n'est écrit)
  const faitsOk = sv.faits === null;
  const actOk = sv.lignes.every(l => (l.n === 'ARYAN' || l.n === 'ATLAS') ? /aujourd/.test(l.act) : l.act === '');
  ok(faitsOk && actOk && sv.defaut && !/Sync|ARC/.test(sv.sync),
     `${vp.n} : signaux vrais : les faits du jour disent ce qui s'est passé (absents sinon), un projet ne montre une activité qu'après un vrai geste (les dates par défaut ne comptent pas), la synchronisation est un mot`,
     JSON.stringify(sv));
  {
    // « C'est fait » depuis « Déposé » (l'accueil n'a plus d'étapes) : un vrai geste, compté dans les faits du jour, et la
    // comète part une fois sur l'accueil, quand « Déposé » se referme
    await page.evaluate(() => { depotOpen(); const b = [...document.querySelectorAll('#depot-list [data-id]')].filter(e => e.textContent.includes('Appeler la comptable')).flatMap(e => [...e.querySelectorAll('button')]).find(x => x.textContent === "C'est fait"); if (b) b.click(); depotClose(); });
    await page.waitForTimeout(200);
    const ap = await page.evaluate(() => ({ faits: document.getElementById('h-faits').textContent, comete: document.querySelector('#S1 .h-comete').classList.contains('va-comete'), reduit: matchMedia('(prefers-reduced-motion: reduce)').matches, fait: Object.values(S.taskDone || {}).some(w => Object.keys(w).length) }));
    await page.waitForTimeout(1400);
    const fin = await page.evaluate(() => document.querySelector('#S1 .h-comete').classList.contains('va-comete'));
    ok(/étape faite aujourd/.test(ap.faits) && (ap.reduit ? !ap.comete : ap.comete) && !fin,
       `${vp.n} : « C'est fait » dans « Déposé » compte dans les faits du jour de l'accueil ; la comète part une fois (jamais quand l'appareil demande moins de mouvement) puis s'éteint`, JSON.stringify({ ap, fin }));
  }
  // les cinq mondes et les deux pôles s'ouvrent depuis l'accueil, et on en revient
  const ouverts = [];
  for (let w = 0; w < 5; w++) { await page.evaluate(i => document.querySelector(`#S1 :is(.pj, .h-dort-row)[data-wid="${i}"]`).click(), w); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(() => !document.getElementById('S2').classList.contains('off') && document.getElementById('S1').classList.contains('off'))); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  // Santé et Juridique vivent sur la planète (13 octobre) : on les ouvre comme la planète le fait
  for (const p of ['sante', 'juridique']) { await page.evaluate(i => plOuvrirEspace({ id: i, pole: true }), p); await page.waitForTimeout(650);
    ouverts.push(await page.evaluate(i => !document.getElementById(i === 'sante' ? 'S3' : 'S4').classList.contains('off'), p)); await page.evaluate(() => goHome()); await page.waitForTimeout(450); }
  ok(ouverts.length === 7 && ouverts.every(Boolean) && errors.length === 0, `${vp.n} : les cinq mondes (en cours ou endormis) et les deux pôles s'ouvrent depuis l'accueil, aucune erreur de console`, ouverts.map(o => o ? 'oui' : 'NON').join(' ') + (errors.length ? ' ; ' + errors.slice(0, 2).join(' | ') : ''));
  await ctx.close();
}

/* L'accueil n'est pas un agenda (Rayan, 10 octobre) : le poste, l'ordre, ce qui en est sorti, les gestes */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await openPage(browser, url, { ctx, fk });
  await page.waitForTimeout(500);
  const plan = () => page.evaluate(() => { const root = document.getElementById('S1'), y = s => { const e = root.querySelector(s); return e && e.offsetParent !== null ? Math.round(e.getBoundingClientRect().top) : null; };
    const txt = root.querySelector('.hw').innerText, t = id => document.getElementById(id), poste = t('h-poste');
    return { ordre: [y('.h-h1'), y('.h-horizon'), y('#h-poste'), y('#hgrid'), y('#h-dort')], vieBloc: !!root.querySelector('#poles-grid, .vie'),
             lignes: [...root.querySelectorAll('#h-poste > button')].filter(e => !e.hidden).map(e => e.id),
             sortis: ['.h-stats', '.h-prog', '#h-critical-badge', '#quick-add-bar', '.intel-card', '.pc-monde', '.pole-card', '.pole-dot', '.h-context-badge', '.h-sub', '.h-pied', '.h-logo-sub'].filter(s => root.querySelector(s)),
             mots: ['Résous', 'CRITIQUE', 'URGENCE', 'manquant', 'Veille', 'bien-être', 'bloquant', 'Valence', 'VALENCE', 'RAYAN', 'ARC v2'].filter(m => (txt + ' ' + root.querySelector('.hn').innerText).includes(m)),
             haut: (() => { const c = [root, root.querySelector('.hw')].find(e => e.scrollHeight > e.clientHeight + 4) || root; return c.scrollHeight; })(), titreH: Math.round(root.querySelector('.h-h1').getBoundingClientRect().height), hauts: [...root.querySelectorAll('#h-poste > button')].filter(e => !e.hidden).map(e => Math.round(e.getBoundingClientRect().height)), mono: [...root.querySelectorAll('.hw > :not(.hn) *')].filter(e => e.offsetParent !== null && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()) && /Mono/.test(getComputedStyle(e).fontFamily)).map(e => e.className).slice(0, 3),
             titre: document.getElementById('h-espaces').textContent, sous: document.getElementById('h-projets-sub').textContent,
             agenda: !!root.querySelector('#next-list, #next-steps, .next-item, .next-lbl'), motsAgenda: ['Prochaine étape', 'Ensuite', 'Rien en cours'].filter(m => txt.includes(m)),
             principaux: root.querySelectorAll('.rg-btn.main').length, posteBas: Math.round(poste.getBoundingClientRect().bottom), barre: Math.round(t('depot-bar').getBoundingClientRect().top),
             n: t('depot-n').textContent, mot: t('depot-count').textContent, pj: t('matin-entry-v').textContent, pjMot: t('matin-entry-n').textContent,
             echo: !!t('h-echo'), ranger: t('h-ranger').hidden ? null : t('h-ranger-t').textContent, ask: t('h-ask') ? t('h-ask').textContent : null }; });
  const vide = await plan();
  const croissant = a => a.every((v, i) => v !== null && (i === 0 || v > a[i - 1]));
  ok(croissant(vide.ordre) && !vide.sortis.length && !vide.mots.length && vide.titre === 'Sept espaces.' && vide.sous === '2 en cours · 3 endormis' && !vide.agenda && !vide.motsAgenda.length
     && vide.n === '0' && vide.mot === 'pensée' && !vide.echo && !vide.vieBloc && !vide.ranger && vide.principaux === 0 && vide.pjMot === 'Rien de prévu' && vide.lignes.join() === 'matin-open,depot-open,h-ask',
     'Accueil : dans l\'ordre, titre, horizon, la console, Projets, Endormis ; plus de bloc Ma vie ni de dernière pensée (13 octobre) ; aucune liste d\'étapes (ni « Prochaine étape », ni « Ensuite ») ; vide, la console dit « Aujourd\'hui · Rien de prévu », « Déposé · 0 pensée », « Demande à ARC », sans « à ranger » ; compteurs, progression globale, ajout rapide, veille, descriptions, « Valence » en dur et mots pressants n\'y sont plus',
     `positions ${vide.ordre.join(', ')} ; « ${vide.titre} » ; « ${vide.sous} » ; poste ${vide.n} « ${vide.mot} », point du jour « ${vide.pj} » « ${vide.pjMot} »${vide.sortis.length ? ' ; restent ' + vide.sortis.join(', ') : ''}${vide.mots.length ? ' ; mots ' + vide.mots.join(', ') : ''}${vide.motsAgenda.length ? ' ; agenda : ' + vide.motsAgenda.join(', ') : ''}`);

  for (const t of ['Appeler la comptable pour la TVA', 'Relire les CGV d\'Atlas', 'idée de nom pour la boutique']) { await deposit(page, t); await page.waitForTimeout(250); }
  await page.waitForFunction(() => document.getElementById('depot-n').textContent === '3' && !document.getElementById('h-ranger').hidden, null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(300);
  const plein = await plan();
  // Le poste : des chiffres vrais en grand (3 pensées ; une hésitation = 1 à ranger), l'écho de la dernière pensée avec ses
  // mots et depuis quand ; tout le poste dans le premier écran de l'iPhone ; aucune liste d'étapes, aucune touche blanche
  // (la seule est « Déposer », dans la barre)
  ok(plein.n === '3' && plein.mot === 'pensées' && plein.lignes.join() === 'matin-open,h-ranger,depot-open,h-ask' && /Demande à ARC/.test(plein.ask || '')
     && plein.ranger === '1 pensée à ranger' && !plein.agenda && !plein.motsAgenda.length && plein.principaux === 0 && plein.posteBas < plein.barre,
     'Accueil, la console : « Aujourd\'hui », « 1 pensée à ranger », « Déposé · 3 pensées », « Demande à ARC », dans cet ordre et en chiffres vrais, toute dans le premier écran de l\'iPhone ; aucune liste d\'étapes ni touche blanche sur l\'accueil',
     `lignes ${plein.lignes.join(', ')} ; Déposé ${plein.n} « ${plein.mot} » ; « ${plein.ranger} » ; bas de la console ${plein.posteBas} px (barre à ${plein.barre} px) ; ${plein.principaux} touche blanche${plein.motsAgenda.length ? ' ; agenda : ' + plein.motsAgenda.join(', ') : ''}`);

  // À leur juste taille : le titre sur une ligne, Déposé et Point du jour côte à côte dans le poste, Santé et Juridique
  // côte à côte, aucune petite capitale à chasse fixe, et tout l'accueil rempli en moins de deux écrans d'iPhone
  ok(plein.titreH <= 40 && plein.hauts.length === 4 && plein.hauts.every(h => h >= 44 && h <= 64) && !plein.mono.length && plein.haut <= 1300 && vide.haut <= 1000,
     'Accueil épuré : titre sur une ligne, une console de lignes (44 à 64 px chacune, pas de briques), écriture du système sans chasse fixe, moins de deux écrans d\'iPhone',
     `titre ${plein.titreH} px de haut ; lignes de la console ${plein.hauts.join(', ')} px ; hauteur de l'accueil : ${vide.haut} px vide, ${plein.haut} px rempli${plein.mono.length ? ' ; chasse fixe : ' + plein.mono.join(', ') : ''}`);

  // L'écho ouvre « Déposé » sur la dernière pensée ; « N pensées à ranger » ouvre « Déposé » ; « C'est fait » dans « Déposé »
  // se lit sur l'accueil (faits du jour), et le poste ne change pas de chiffre (une pensée faite reste déposée)
  // « Demande à ARC » ouvre la recherche, prête pour une question ; « Déposé » ouvre la liste
  await page.click('#h-ask'); await page.waitForTimeout(300);
  const ask = await page.evaluate(() => ({ ouvert: document.getElementById('search-modal').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
  await page.evaluate(() => closeSearch()); await page.waitForTimeout(150);
  await page.click('#depot-open'); await page.waitForTimeout(300);
  const dep = await page.evaluate(() => { const l = document.getElementById('depot-list'), it = [...l.querySelectorAll('[data-id]')].find(e => e.textContent.includes('idée de nom pour la boutique'));
    return { ouvert: document.getElementById('depot-screen').classList.contains('open'), la: !!it, visible: true }; });
  await page.evaluate(() => depotClose()); await page.waitForTimeout(200);
  await page.click('#h-ranger'); await page.waitForTimeout(300);
  const dep2 = await page.evaluate(() => document.getElementById('depot-screen').classList.contains('open'));
  await page.evaluate(() => { const b = [...document.querySelectorAll('#depot-list [data-id]')].filter(e => e.textContent.includes('Appeler la comptable')).flatMap(e => [...e.querySelectorAll('button')]).find(x => x.textContent === "C'est fait"); if (b) b.click(); depotClose(); }); await page.waitForTimeout(300);
  const apres = await plan(), faits = await page.evaluate(() => document.getElementById('h-faits').textContent);
  ok(ask.ouvert && ask.focus === 'search-inp' && dep.ouvert && dep.la && dep2 && /1 étape faite aujourd/.test(faits) && apres.n === '3' && apres.ranger === '1 pensée à ranger' && !apres.agenda,
     'Accueil : « Demande à ARC » ouvre la recherche sur son champ ; « Déposé » et « N pensées à ranger » ouvrent « Déposé » ; « C\'est fait » dans « Déposé » compte dans les faits du jour, la console garde ses chiffres',
     `Demande à ARC ${JSON.stringify(ask)} ; Déposé ouvert ${dep.ouvert}, pensée présente ${dep.la} ; à ranger ouvre ${dep2} ; faits « ${faits} » ; Déposé ${apres.n}, « ${apres.ranger} »`);

  // Annuler un dépôt : la pensée n'est plus comptée nulle part, ni dans « Déposé » ni dans « N pensées déposées »
  // (avant le 10 octobre, la ligne du haut la comptait encore : deux chiffres d'un même écran ne suivaient pas la même règle)
  await page.click('#depot-open'); await page.waitForTimeout(300);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#depot-list [data-id]')].filter(e => e.textContent.includes('Relire les CGV')).flatMap(e => [...e.querySelectorAll('button')]).find(x => x.textContent === 'Annuler le dépôt'); if (b) b.click(); depotClose(); }); await page.waitForTimeout(300);
  const annule = await plan(), faits2 = await page.evaluate(() => document.getElementById('h-faits').textContent);
  ok(annule.n === '2' && !/pensées? déposées?/.test(faits2) && !errors.length,
     'Accueil : une pensée dont le dépôt est annulé quitte « Déposé » ; le haut ne compte plus les pensées déposées (il contredisait « Déposé »)', `Déposé ${annule.n} ; haut « ${faits2} »`);

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
  ok(e0.cours.slice().sort((a, b) => a - b).join() === '0,4' && e0.dort.join() === '1,2,3' && e0.v === 3 && e0.plie && e0.noms === 'FBA, KITCHEN, TELENEUF' && deplie.etat === 'true' && deplie.vus === 3 && e3.plie && e1.chez && e1.cours.slice().sort((a, b) => a - b).join() === '0,1,4' && e1.dort.join() === '2,3' && e1.garde[1] === false && e1.sous === '3 en cours · 2 endormis'
     && dans.t === 'Endormir ce projet' && dans.h >= 44 && dans2 === 'Réveiller ce projet' && e2.cours.slice().sort((a, b) => a - b).join() === '1,4' && e2.dort.join() === '0,2,3' && e2.garde[0] === true
     && e3.cours.slice().sort((a, b) => a - b).join() === '1,4' && e3.dort.join() === '0,2,3' && errors.length === 0,
     'Projets endormis : FBA, KITCHEN et TELENEUF le sont au départ, repliés en une ligne ; dépliés, « Réveiller » depuis l\'accueil sans quitter l\'accueil, « Endormir ce projet » depuis le monde ; le choix est gardé et relu au lancement suivant',
     `départ ${e0.cours.slice().sort((a, b) => a - b).join()} | ${e0.dort.join()} ; après « Réveiller » FBA ${e1.cours.slice().sort((a, b) => a - b).join()} | ${e1.dort.join()} (« ${e1.sous} ») ; ARYAN endormi ${e2.cours.slice().sort((a, b) => a - b).join()} | ${e2.dort.join()} ; après rechargement ${e3.cours.slice().sort((a, b) => a - b).join()} | ${e3.dort.join()}${errors.length ? ' ; ' + errors.slice(0, 2).join(' | ') : ''}`);
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

/* L'horizon répond, avec le mouvement permis : la comète file une fois sur « C'est fait », l'étincelle monte au
   dépôt, rien ne tourne en boucle, et chaque réponse s'éteint seule. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'no-preference' });
  await ctx.addInitScript(sessionScript());
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await openPage(browser, url, { ctx, fk });
  const lu = () => page.evaluate(() => ({ et: document.querySelector('#S1 .h-etincelle').classList.contains('va-etincelle'), co: document.querySelector('#S1 .h-comete').classList.contains('va-comete'),
    anims: document.getAnimations().map(a => a.animationName || '').filter(n => /hComete|hEtincelle|hEclair/.test(n)) }));
  const repos = await lu();
  await deposit(page, 'Appeler la comptable pour la TVA');
  await page.waitForTimeout(80); const t1 = await lu();
  await page.waitForTimeout(3200); const t2 = await lu();
  // « C'est fait » dans « Déposé » : la comète attend que « Déposé » se referme, puis file une fois
  await page.evaluate(() => { depotClose(); goHome(); renderHome(); });
  await page.waitForFunction(() => document.getElementById('depot-n').textContent === '1', null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => { depotOpen(); const b = [...document.querySelectorAll('#depot-list [data-id]')].filter(e => e.textContent.includes('Appeler la comptable')).flatMap(e => [...e.querySelectorAll('button')]).find(x => x.textContent === "C'est fait"); if (b) b.click(); });
  await page.waitForTimeout(150); const t2b = await lu();
  await page.evaluate(() => depotClose());
  await page.waitForTimeout(250); const t3 = await lu();
  await page.waitForTimeout(1700); const t4 = await lu();
  ok(!repos.anims.length && t1.et && t1.anims.includes('hEtincelle') && !t2.et && !t2.anims.length && !t2b.co && t3.co && t3.anims.includes('hComete') && !t4.co && !t4.anims.length && !errors.length,
     'L\'horizon répond : rien au repos ; l\'étincelle monte au dépôt puis s\'éteint ; la comète file sur « C\'est fait » quand « Déposé » se referme (pas avant), puis s\'éteint ; aucune boucle',
     JSON.stringify({ repos, t1, t2, t2b, t3, t4, erreurs: errors }));
  await ctx.close();
}

/* Projets, seconde partie de l'accueil (10 octobre) : pas d'agenda non plus. Une ligne par projet dit son état vrai
   (« Actif aujourd'hui », « Actif il y a 3 j », « Calme depuis 10 j ») et où il en est, jamais une tâche ; ceux qui bougent
   devant, du plus récent au plus ancien, les calmes derrière ; un seul panneau, les endormis dedans, en bas. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const now = Date.now(), J = 86400000;
    S.journal[4] = [{ ts: now - 60e3, txt: 'a' }];            // ATLAS : il y a une minute (une heure échouait entre minuit et 1 h)
    S.journal[0] = [{ ts: now - 10 * J, txt: 'b' }];          // ARYAN : dix jours sans mouvement
    S.journal[1] = [{ ts: now - 3 * J - 3600e3, txt: 'c' }];  // FBA, réveillé : il y a trois jours
    S.sleep[1] = false; saveS(); renderHome();
    const lignes = [...document.querySelectorAll('#S1 .pj')].map(e => ({ wid: +e.dataset.wid, etat: (e.querySelector('.pj-f') || {}).textContent || '', calme: e.classList.contains('calme'), txt: e.textContent }));
    const taches = WORLDS.flatMap(w => w.tasks_todo.concat(w.tasks_done).map(t => t.t)).filter(t => t.length > 6);
    const pjs = document.querySelector('#S1 .h-pjs');
    return { lignes, tache: lignes.filter(l => taches.some(t => l.txt.includes(t))).map(l => l.wid),
             panneau: !!pjs && pjs.contains(document.getElementById('hgrid')) && pjs.contains(document.getElementById('h-dort')),
             haut: Math.round(pjs.getBoundingClientRect().height), vie: document.querySelectorAll('#S1 .vie').length };
  });
  const ordre = r.lignes.map(l => l.wid).join(), etats = r.lignes.map(l => l.etat);
  ok(ordre === '4,1,0' && etats[0] === 'Actif aujourd’hui' && etats[1] === 'Actif il y a 3 j' && etats[2] === 'Calme depuis 10 j' && r.lignes[2].calme && !r.lignes[0].calme
     && !r.tache.length && r.panneau && r.vie === 0 && !errors.length,
     'Accueil, Projets : un seul panneau ; chaque ligne dit l\'état vrai du projet (actif, depuis quand, ou calme) et jamais une tâche ; ceux qui bougent devant, les calmes derrière',
     `ordre ${ordre} ; états ${etats.join(' | ')} ; tâches affichées ${r.tache.join(',') || 'aucune'} ; panneau ${r.panneau} (${r.haut} px) ; tuiles Ma vie ${r.vie}`);
  await ctx.close();
}

/* Les pensées d'un projet (10 octobre) : une pensée rangée dans ARYAN se retrouve dans ARYAN, et nulle part ailleurs ;
   à faire d'abord, faites ensuite ; annulée ou rangée ailleurs : absente ; toucher la ligne ouvre « Déposé » sur elle ;
   un projet sans pensée n'a pas la section. Contraste mesuré dans l'image, cibles ≥ 44 px. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase() });
  await page.waitForTimeout(500);
  const T = ['Appeler le fournisseur des sacs', 'Refaire la page produit', 'Vérifier le paiement test', 'Idée annulée', 'Relire les statuts', 'Relancer la banque'];
  for (const t of T) { await deposit(page, t); await page.waitForTimeout(200); }
  await page.evaluate(T => {
    const id = t => Object.values(_depot.thoughts).find(x => x.body === t).id;
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
    rangeAdd(id(T[0]), { space: 'aryan', status: 'filed', step: T[0], moment: { type: 'datetime', at: d.toISOString() } }, 'user');
    rangeAdd(id(T[1]), { space: 'aryan', status: 'filed', step: T[1] }, 'user');
    rangeAdd(id(T[2]), { space: 'aryan', status: 'done', step: T[2] }, 'user');
    rangeAdd(id(T[3]), { space: 'aryan', status: 'cancelled' }, 'user');
    rangeAdd(id(T[4]), { space: 'atlas', status: 'filed', step: T[4] }, 'user');
    rangeAdd(id(T[5]), { space: 'juridique', status: 'filed', step: T[5] }, 'user');
    if (typeof matinClose === 'function') matinClose();
    document.activeElement && document.activeElement.blur(); enterWorld(0);
  }, T);
  await page.waitForTimeout(500);
  // Depuis le 13 octobre, les pensées d'un projet vivent dans sa Mémoire, avec le journal, du plus récent au plus ancien
  const lire = () => page.evaluate(() => { const s = document.getElementById('wsec-memoire');
    return { vu: !s.hidden && s.offsetParent !== null, n: document.getElementById('wmem-n').textContent,
             lignes: [...document.querySelectorAll('#jou-list .wpen-row:not(.wmem-jou)')].map(e => ({ t: e.querySelector('.wpen-t').textContent, m: e.querySelector('.wpen-m').textContent, fait: e.classList.contains('fait'), h: Math.round(e.getBoundingClientRect().height) })) }; });
  const a = await lire();
  await page.evaluate(() => document.getElementById('wsec-memoire').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  const m = await mesurer(page, { racine: '#wsec-memoire' });
  await page.evaluate(() => document.querySelectorAll('#jou-list .wpen-row:not(.wmem-jou)')[0].click()); await page.waitForTimeout(400);
  const ouvert = await page.evaluate(() => { const it = document.querySelector('#depot-list [data-id="' + document.querySelectorAll('#jou-list .wpen-row:not(.wmem-jou)')[0].dataset.tid + '"]'); const r = it && it.getBoundingClientRect();
    return document.getElementById('depot-screen').classList.contains('open') && !!r && r.top >= 0 && r.bottom <= innerHeight; });
  await page.evaluate(() => { depotClose(); enterWorld(1); }); await page.waitForTimeout(300);
  const fba = await lire();
  await page.evaluate(() => enterWorld(4)); await page.waitForTimeout(300);
  const atlas = await lire();
  await page.evaluate(() => enterPole('juridique')); await page.waitForTimeout(300);
  const jur = await page.evaluate(() => { const sec = document.getElementById('jsec-pensees');
    return { vu: !sec.hidden && sec.offsetParent !== null, n: document.getElementById('jpen-n').textContent, lignes: [...document.querySelectorAll('#jpen-list .wpen-t')].map(e => e.textContent) }; });
  await page.evaluate(() => document.getElementById('jsec-pensees').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  const mj = await mesurer(page, { racine: '#jsec-pensees' });
  await page.evaluate(() => enterPole('sante')); await page.waitForTimeout(300);
  // Santé a la section depuis le 11 octobre (étape 1 de l'étude) : aucune pensée n'y est rangée ici, elle reste cachée
  const sante = await page.evaluate(() => { const e = document.getElementById('ssec-pensees'); return !!e && !e.hidden; });
  const t = a.lignes.map(l => l.t).join(' | ');
  // sans faux proxy, le faux Supabase répond 500 au rangement (tests/outils.mjs, « pas de faux proxy ») : rangé ici à la main
  const vraies = errors.filter(e => !/status of 500/.test(e));
  ok(a.vu && a.n === '2 pensées à faire' && t === 'Vérifier le paiement test | Refaire la page produit | Appeler le fournisseur des sacs'
     && /^Pensée · Demain · 09:00 · déposée/.test(a.lignes[2].m) && a.lignes[0].fait && /^Pensée · faite · déposée/.test(a.lignes[0].m) && a.lignes.every(l => l.h >= 44)
     && ouvert && !fba.lignes.length && atlas.vu && atlas.lignes.length === 1 && atlas.lignes[0].t === 'Relire les statuts' && jur.vu && jur.n === '1 à faire' && jur.lignes.join() === 'Relancer la banque' && !mj.sous.length && !sante && !m.sous.length && m.n >= 6 && !vraies.length,
     'Projet et Juridique : leurs pensées rangées s\'y retrouvent (dans la Mémoire du projet, de la plus récente à la plus ancienne, moment et date), ni annulées ni rangées ailleurs ; la ligne ouvre « Déposé » sur elle ; sans pensée, pas de section (Santé comprise) ; contraste ≥ 4,5 : 1',
     `ARYAN « ${a.n} » : ${t} ; métas ${a.lignes.map(l => l.m).join(' | ')} ; ouvre Déposé ${ouvert} ; FBA ${fba.lignes.length} pensée(s) ; ATLAS ${atlas.lignes.map(l => l.t).join(', ')} ; Juridique « ${jur.n} » ${jur.lignes.join(', ')}, le plus faible ${mj.pire ? fmt(mj.pire.ratio) : '?'} ; Santé ${sante ? 'section visible sans pensée' : 'section cachée (aucune pensée)'} ; ${m.n} morceaux, le plus faible ${m.pire ? fmt(m.pire.ratio) : '?'}${vraies.length ? ' ; ' + vraies.join(' | ') : ''}`);
  await ctx.close();
}

/* L'écriture d'Apple partout (12 octobre, Rayan : « tu te dois d'utiliser la calligraphie Apple sur tout ARC ») : sur
   l'écran d'entrée, l'accueil, Déposé, le Point du jour, un projet, Santé, Juridique, la recherche et la carte, chaque
   texte visible commence par -apple-system ; seul le logo ARC garde son dessin ; aucune police chargée hors du logo. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  const { page, errors } = await openPage(browser, url, { ctx, fk: fakeSupabase(), session: false });
  const lire = (ou) => page.evaluate(ou => {
    const hors = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let nd; (nd = tw.nextNode());) {
      const e = nd.parentElement; if (!nd.nodeValue.trim() || !e || e.closest('code,pre,.h-logo-name,.auth-brand-name,script,style')) continue;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === 'hidden' || parseFloat(cs.fontSize) === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      if (e.closest('[hidden],.off')) continue;
      const f = cs.fontFamily.split(',')[0].trim().replace(/["']/g, '');
      if (f !== '-apple-system') hors.push(ou + ' : ' + (e.id || e.className || e.tagName) + ' « ' + nd.nodeValue.trim().slice(0, 20) + ' » ' + f);
    }
    return hors;
  }, ou);
  const hors = [];
  hors.push(...await lire('entrée'));
  await ctx.addInitScript(sessionScript()); await page.reload(); await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  hors.push(...await lire('accueil'));
  await page.evaluate(() => depotOpen()); await page.waitForTimeout(300); hors.push(...await lire('Déposé')); await page.evaluate(() => depotClose());
  await page.evaluate(() => matinShow('ask')); await page.waitForTimeout(300); hors.push(...await lire('Point du jour')); await page.evaluate(() => matinClose());
  await page.evaluate(() => enterWorld(0)); await page.waitForTimeout(300); hors.push(...await lire('ARYAN'));
  await page.evaluate(() => enterPole('sante')); await page.waitForTimeout(300); hors.push(...await lire('Santé'));
  await page.evaluate(() => enterPole('juridique')); await page.waitForTimeout(300); hors.push(...await lire('Juridique'));
  await page.evaluate(() => { goHome(); openSearch(); }); await page.waitForTimeout(300); hors.push(...await lire('recherche'));
  await page.evaluate(() => { closeSearch(); carteOuvrir(); }); await page.waitForTimeout(400); hors.push(...await lire('carte'));
  const polices = await page.evaluate(() => [...document.querySelectorAll('link[href*="fonts.googleapis"]')].map(l => l.href).join(' '));
  const canevas = await page.evaluate(() => getComputedStyle(document.body).fontFamily.split(',')[0]);
  const vraies = errors.filter(e => !/status of 500/.test(e));
  ok(!hors.length && !/Jakarta|JetBrains|Azeret/.test(polices) && /apple-system/.test(canevas) && !vraies.length,
     'L\'écriture d\'Apple partout : entrée, accueil, Déposé, Point du jour, projet, Santé, Juridique, recherche, carte ; seul le logo garde son dessin ; plus aucune autre police chargée',
     hors.slice(0, 8).join(' | ') + (hors.length > 8 ? ` (+${hors.length - 8})` : '') + ` ; polices : ${polices} ; corps : ${canevas}${vraies.length ? ' ; ' + vraies.join(' | ') : ''}`);
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.sort().join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
