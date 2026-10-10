// Tests de « En faire un projet » (10 octobre) : « Développer · Fais-en un projet, étape par étape. »
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/projet.mjs
// Supabase et le proxy sont remplacés par de faux serveurs : aucune requête ne part vers le vrai projet.
//
// Ce qui est vérifié : la touche sous une pensée ; la proposition de Claude dans les champs (ce qu'on lui envoie, ce
// qu'on refuse de lui prendre) ; la création (le projet dans Projets, ses étapes, la pensée rangée dedans, il s'ouvre) ;
// le rechargement ; une erreur ou une réponse illisible de Claude ; un nom déjà pris ; un autre appareil ; le rangement
// connaît le nouvel espace ; et la charte sur la feuille (cibles, tailles, contraste, une seule touche blanche).

import { chromium, startServer, fakeSupabase, openPage, sessionScript, deposit, idOf } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const wait = ms => new Promise(r => setTimeout(r, ms));

const PENSEE = 'Lancer une chaîne YouTube de recettes halal faciles';
const PROPOSITION = { nom: 'Recettes YouTube', mission: 'Publier des recettes halal faciles sur une chaîne YouTube, et la mettre en état d’accueillir ses premiers abonnés fidèles.',
  etapes: ['Noter cinq idées de recettes', 'Filmer une recette test au téléphone', 'Créer la chaîne YouTube'] };

// Faux proxy : rangement (task file) → une note dans ARYAN ; discussion avec la consigne « projet » → la proposition
function proxy(mode = 'ok') {
  const appels = [];
  const f = async body => {
    if (body.task === 'file') return { status: 200, json: { filing: { space: 'inconnu', confidence: 'unsure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } };
    appels.push(body);
    if (mode === 'erreur') return { status: 500, json: { error: { message: 'panne simulée' } } };
    const text = mode === 'illisible' ? 'Voici une idée de projet sans JSON.' : 'Voici :\n' + JSON.stringify(PROPOSITION);
    return { status: 200, json: { content: [{ type: 'text', text }] } };
  };
  f.appels = appels;
  return f;
}
async function appareil(vp, fk) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: !!vp.tel, hasTouch: !!vp.tel,
    serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  return openPage(browser, url, { ctx, fk });
}
const IPHONE = { width: 390, height: 844, tel: true }, MAC = { width: 1440, height: 900 };
// Dépose la pensée, ouvre « Déposé », touche « En faire un projet »
async function ouvrirFeuille(page) {
  await deposit(page, PENSEE); await page.waitForTimeout(900);
  await page.evaluate(() => depotOpen()); await page.waitForTimeout(200);
  const b = page.locator('#depot-list .depot-item').first().getByRole('button', { name: 'En faire un projet' });
  const vu = await b.count();
  if (vu) await b.click();
  await page.waitForTimeout(500);
  return vu;
}
const champs = page => page.evaluate(() => ({ nom: pjv('pj-nom'), mission: pjv('pj-mission'), e: [pjv('pj-e1'), pjv('pj-e2'), pjv('pj-e3')],
  etat: document.getElementById('pj-etat-t').textContent, ouvert: document.getElementById('projet-modal').classList.contains('open') }));
const outil = () => { window.pjv = id => document.getElementById(id).value; };

// ── 1. Proposition, création, rechargement (iPhone) ──
{
  const fk = fakeSupabase(); const px = proxy(); fk.proxy = px;
  const { page, errors, ctx } = await appareil(IPHONE, fk);
  await page.evaluate(outil);
  const avant = await page.evaluate(() => ({ n: WORLDS.length, titre: document.getElementById('h-espaces').textContent }));
  const vu = await ouvrirFeuille(page);
  const c = await champs(page);
  const coupe = await page.evaluate(() => ['pj-mission', 'pj-e1', 'pj-e2', 'pj-e3'].filter(id => { const e = document.getElementById(id); return e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2; }));
  ok(!coupe.length, 'La mission et les étapes s\'affichent en entier : le champ grandit avec le texte au lieu de le couper', coupe.join(', '));
  const envoi = px.appels[0] || {};
  const msg = JSON.stringify(envoi.messages || []);
  ok(vu && c.ouvert && c.nom === PROPOSITION.nom && c.mission === PROPOSITION.mission && c.e.join('|') === PROPOSITION.etapes.join('|') && /ARC propose/.test(c.etat),
     'Sous une pensée, « En faire un projet » ouvre la feuille ; la proposition de Claude remplit le nom, la mission et les trois étapes', JSON.stringify(c));
  ok(!envoi.task && /transformer une pensée en projet/.test(envoi.system || '') && msg.includes(PENSEE) && /ARYAN/.test(msg) && /Juridique/.test(msg) && envoi.max_tokens <= 800,
     'Claude reçoit la pensée et les noms déjà pris, par le chemin de la discussion (rien d\'enregistré côté serveur, aucun redéploiement)', JSON.stringify({ task: envoi.task, max: envoi.max_tokens }));

  await page.fill('#pj-e3', 'Créer la chaîne et publier la première vidéo');
  await page.click('#pj-creer'); await page.waitForTimeout(600);
  const r = await page.evaluate(([pensee]) => {
    const w = WORLDS[WORLDS.length - 1];
    const tid = Object.values(_depot.thoughts).find(x => x.body === pensee).id;
    const f = rangeIndex().latest[tid];
    return { n: WORLDS.length, nom: w.name, id: w.id, cle: w.key, taches: w.tasks_todo.map(t => t.t), mission: w.mission, desc: w.desc,
      ecran: document.getElementById('S2').classList.contains('off') ? 'non' : 'S2', titreMonde: document.getElementById('wband-name').textContent,
      missionVue: document.getElementById('miss-txt').textContent, tachesVues: [...document.querySelectorAll('#tasks-container .wtask-txt')].map(e => e.textContent),
      prio: document.getElementById('wsec-prio').hidden, anneau: document.getElementById('ring-pct').textContent,
      rangee: f && f.space, origine: f && f.origin, titre: document.getElementById('h-espaces').textContent,
      feuille: document.getElementById('projet-modal').classList.contains('open'), depot: document.getElementById('depot-screen').classList.contains('open') };
  }, [PENSEE]);
  ok(r.n === avant.n + 1 && r.nom === 'Recettes YouTube' && r.cle === 'recettesyoutube' && r.taches.length === 3 && r.taches[2] === 'Créer la chaîne et publier la première vidéo' && r.desc.includes(PENSEE),
     '« Créer le projet » : le projet existe avec son nom, sa mission, ses trois étapes (corrigées par Rayan) et la pensée d\'origine', JSON.stringify(r));
  ok(!r.feuille && !r.depot && r.titreMonde === 'Recettes YouTube' && r.missionVue === PROPOSITION.mission && r.tachesVues.length === 3 && r.prio === true && /^0/.test(r.anneau),
     'Il s\'ouvre aussitôt : nom, mission, trois tâches, anneau à 0 %, pas d\'« Action prioritaire » vide', JSON.stringify(r));
  ok(r.rangee === 'recettesyoutube' && r.origine === 'user' && r.titre !== avant.titre && /Huit espaces/.test(r.titre),
     'La pensée est rangée dans son projet, et le titre de l\'accueil compte un espace de plus', `${avant.titre} → ${r.titre}, rangée « ${r.rangee} »`);

  // L'accueil : la première étape du nouveau projet devient « Prochaine étape » ; « C'est fait » coche la tâche du projet
  await page.evaluate(() => goHome()); await page.waitForTimeout(300);
  const h1 = await page.evaluate(() => { const c = document.querySelector('#next-list .next-item.is-now'); return { txt: c ? c.textContent : '', vide: !document.getElementById('next-empty').hidden }; });
  await page.locator('#next-list .next-item.is-now').getByRole('button', { name: 'C\'est fait' }).click(); await page.waitForTimeout(300);
  const h2 = await page.evaluate(id => ({ txt: (document.querySelector('#next-list .next-item.is-now') || {}).textContent || '', coche: Object.values(S.tasks[id] || {}).filter(Boolean).length }), r.id);
  ok(!h1.vide && /Projet/.test(h1.txt) && /Recettes YouTube/.test(h1.txt) && /Noter cinq idées/.test(h1.txt) && h2.coche === 1 && /Filmer une recette test/.test(h2.txt),
     'Accueil : la première étape du projet devient « Prochaine étape » (plus de « Rien en cours ») ; « C\'est fait » la coche dans le projet et passe à la suivante', JSON.stringify({ h1, h2 }));
  await page.evaluate(id => { S.tasks[id] = {}; saveS(); enterWorld(id); }, r.id); await page.waitForTimeout(200);
  // Cocher une étape dans le projet fait avancer l'anneau ; l'accueil montre le projet
  await page.locator('#tasks-container .wtask-cb').first().click(); await page.waitForTimeout(200);
  const an = await page.evaluate(() => document.getElementById('ring-pct').textContent);
  await page.evaluate(() => goHome()); await page.waitForTimeout(300);
  const acc = await page.evaluate(id => { const e = document.querySelector(`#S1 .pj[data-wid="${id}"]`); return e ? e.textContent : ''; }, r.id);
  ok(/^33/.test(an) && /Recettes YouTube/.test(acc) && /Filmer une recette test/.test(acc), 'Une étape cochée : l\'anneau passe à 33 % ; l\'accueil montre le projet et sa prochaine étape', `anneau ${an} ; accueil « ${acc} »`);

  // Rechargement : le projet est reconstruit depuis les données
  await page.reload(); await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof matinClose === 'function') matinClose(); });
  const re = await page.evaluate(id => { const w = monde(id); return w ? { nom: w.name, n: w.tasks_todo.length, fait: !!(S.tasks[id] && Object.values(S.tasks[id]).some(Boolean)) } : null; }, r.id);
  await page.evaluate(() => depotOpen()); await page.waitForTimeout(200);
  const lien = await page.locator('#depot-list .depot-item').first().getByRole('button', { name: /Ouvrir le projet Recettes YouTube/ }).count();
  const plus = await page.locator('#depot-list .depot-item').first().getByRole('button', { name: 'En faire un projet' }).count();
  ok(re && re.nom === 'Recettes YouTube' && re.n === 3 && re.fait && lien === 1 && plus === 0,
     'Après rechargement, le projet et l\'étape cochée sont là ; sous la pensée, « Ouvrir le projet Recettes YouTube » remplace « En faire un projet »', JSON.stringify({ re, lien, plus }));
  const sp = await page.evaluate(() => rangeSpaces().map(s => s.key));
  ok(sp.includes('recettesyoutube') && sp.includes('sante') && sp.includes('juridique') && sp.length <= 12, 'Le rangement connaît le nouvel espace (Santé et Juridique toujours là, 12 espaces au plus)', sp.join(','));
  ok(!errors.filter(e => !/500|panne/.test(e)).length, 'Aucune erreur de console', errors.join(' | '));
  await ctx.close();
}

// ── 2. Claude en panne, puis réponse illisible : on écrit soi-même ; nom déjà pris refusé ──
for (const mode of ['erreur', 'illisible']) {
  const fk = fakeSupabase(); fk.proxy = proxy(mode);
  const { page, ctx } = await appareil(IPHONE, fk);
  await page.evaluate(outil);
  await ouvrirFeuille(page);
  const c = await champs(page);
  ok(c.ouvert && c.nom === '' && c.e[0] === PENSEE && /n’a pas pu préparer/.test(c.etat),
     `Claude ${mode === 'erreur' ? 'en panne' : 'illisible'} : la feuille le dit, la pensée est en première étape, rien n\'est bloqué`, JSON.stringify(c));
  if (mode === 'erreur') {
    const n0 = await page.evaluate(() => WORLDS.length);
    await page.fill('#pj-nom', 'aryan'); await page.click('#pj-creer'); await page.waitForTimeout(200);
    const e1 = await page.evaluate(() => [document.getElementById('pj-err').textContent, WORLDS.length, document.getElementById('projet-modal').classList.contains('open'), pjv('pj-nom')]);
    await page.fill('#pj-nom', ''); await page.click('#pj-creer'); await page.waitForTimeout(150);
    const e2 = await page.evaluate(() => document.getElementById('pj-err').textContent);
    ok(/déjà pris/.test(e1[0]) && e1[1] === n0 && e1[2] && e1[3] === 'aryan' && /Donne un nom/.test(e2),
       'Nom déjà pris (« aryan ») ou vide : message sous les champs, rien n\'est créé, la saisie reste', JSON.stringify({ e1, e2 }));
    await page.fill('#pj-nom', 'Chaîne'); await page.click('#pj-creer'); await page.waitForTimeout(400);
    const k = await page.evaluate(() => WORLDS[WORLDS.length - 1].key);
    ok(k === 'chaine', 'Un nom accentué donne une clé de rangement sans accent (« Chaîne » → « chaine »)', k);
  }
  await ctx.close();
}

// ── 2 bis. Réponses réelles possibles : bloc ```json et clés accentuées, réponse coupée, refus du service ; « Demander à nouveau »
{
  const rep = [
    { status: 200, json: { content: [{ type: 'text', text: '```json\n{"Nom": "Nettoyage Ext", "Mission": "Ouvrir une société de nettoyage d’extérieur.", "Étapes": [{"texte": "Choisir le statut"}, "2. Lister le matériel", "- Trouver un premier client"]}\n```' }] } },
    { status: 200, json: { content: [{ type: 'text', text: '{"nom": "Nettoy' }], stop_reason: 'max_tokens' } },
    { status: 403, json: { error: { message: 'compte refusé', source: 'arc-proxy' } } },
    { status: 200, json: { content: [{ type: 'text', text: JSON.stringify(PROPOSITION) }] } }
  ];
  let i = 0;
  const fk = fakeSupabase();
  fk.proxy = async body => body.task === 'file' ? { status: 200, json: { filing: { space: 'inconnu', confidence: 'unsure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } } : rep[Math.min(i++, rep.length - 1)];
  const { page, ctx } = await appareil(IPHONE, fk);
  await page.evaluate(outil);
  await ouvrirFeuille(page);
  const a1 = await champs(page);
  ok(a1.nom === 'Nettoyage Ext' && /nettoyage/.test(a1.mission) && a1.e.join('|') === 'Choisir le statut|Lister le matériel|Trouver un premier client',
     'Réponse de Claude en bloc ```json avec « Nom », « Étapes » accentués et étapes numérotées ou en objets : lue quand même, étapes nettoyées', JSON.stringify(a1));
  const raison = async () => { await page.evaluate(async () => { await projetProposer(); }); return page.evaluate(() => ({ etat: document.getElementById('pj-etat-t').textContent, btn: !document.getElementById('pj-reessayer').hidden })); };
  await page.fill('#pj-nom', ''); await page.evaluate(() => { _pj.touche = {}; ['pj-nom', 'pj-mission', 'pj-e1', 'pj-e2', 'pj-e3'].forEach(id => document.getElementById(id).value = ''); });
  const r2 = await raison();
  const r3 = await raison();
  ok(/coupée avant la fin/.test(r2.etat) && r2.btn && /n’a pas accès à Claude/.test(r3.etat) && !r3.btn && !/\b40[0-9]\b/.test(r3.etat),
     'Échec : la feuille dit ce qui s\'est passé, en mots (réponse coupée ; compte sans accès), sans code ; « Demander à nouveau à ARC » seulement quand réessayer peut servir', JSON.stringify({ r2, r3 }));
  const lignes = await page.evaluate(() => { const e = document.getElementById('pj-etat-t'); const r = document.createRange(); r.selectNodeContents(e); const rects = [...r.getClientRects()]; return e.textContent.includes('\u00A0:'); });
  ok(lignes, 'Typographie : le deux-points est collé à son mot par une espace insécable (jamais en début de ligne)');
  await page.evaluate(() => { document.getElementById('pj-reessayer').hidden = false; });
  await page.click('#pj-reessayer'); await page.waitForTimeout(400);
  const a4 = await champs(page);
  ok(a4.nom === PROPOSITION.nom && /ARC propose/.test(a4.etat), '« Demander à nouveau à ARC » relance Claude et remplit la feuille', JSON.stringify(a4));
  await ctx.close();
}

// ── 3. Hors connexion : pas d'appel à Claude, la feuille le dit ──
{
  const fk = fakeSupabase(); const px = proxy(); fk.proxy = px;
  const { page, ctx } = await appareil(IPHONE, fk);
  await page.evaluate(outil);
  await deposit(page, PENSEE); await page.waitForTimeout(900);
  await ctx.setOffline(true);
  await page.evaluate(async ([p]) => { await projetOuvrir(Object.values(_depot.thoughts).find(x => x.body === p).id); }, [PENSEE]);
  const c = await champs(page);
  ok(c.ouvert && /Hors connexion/.test(c.etat) && px.appels.length === 0, 'Hors réseau : la feuille s\'ouvre, dit qu\'il faut l\'écrire soi-même, et n\'appelle pas Claude', JSON.stringify({ etat: c.etat, appels: px.appels.length }));
  await ctx.setOffline(false); await ctx.close();
}

// ── 4. Un autre appareil reçoit le projet ──
{
  const fk = fakeSupabase(); fk.proxy = proxy();
  const mac = await appareil(MAC, fk);
  await mac.page.evaluate(outil);
  await ouvrirFeuille(mac.page);
  await mac.page.click('#pj-creer'); await mac.page.waitForTimeout(2600);
  const ip = await appareil(IPHONE, fk); await ip.page.waitForTimeout(1500);
  const vu = await ip.page.evaluate(() => { const w = WORLDS.find(x => x.name === 'Recettes YouTube'); return w ? { n: w.tasks_todo.length, accueil: !!document.querySelector(`#S1 .pj[data-wid="${w.id}"]`) } : null; });
  ok(vu && vu.n === 3 && vu.accueil, 'Créé sur le Mac, le projet arrive sur l\'iPhone avec ses étapes, et s\'affiche dans Projets', JSON.stringify(vu));
  await mac.ctx.close(); await ip.ctx.close();
}

// ── 5. La charte sur la feuille, iPhone et Mac ──
for (const vp of [IPHONE, MAC]) {
  const fk = fakeSupabase(); fk.proxy = proxy();
  const { page, errors, ctx } = await appareil(vp, fk);
  await ouvrirFeuille(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const m = await page.evaluate(() => {
    const box = document.getElementById('projet-modal'), out = { cibles: [], petits: [], champs: [], blancs: [], hors: [], emoji: [], fusion: [] };
    for (const e of box.querySelectorAll('*')) {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === 'hidden') continue;
      if (e.matches('button,input,textarea') && r.height < 44) out.cibles.push((e.id || e.textContent.trim()) + ' ' + Math.round(r.height));
      if (e.matches('input,textarea') && parseFloat(cs.fontSize) < 16) out.champs.push(e.id);
      if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs.fontSize) < 12) out.petits.push(e.textContent.trim().slice(0, 20));
      if (e.matches('button') && /rgb\(24[0-9], 24[0-9], 24[0-9]\)|rgb\(25[0-5], 25[0-5], 25[0-5]\)/.test(cs.backgroundColor)) out.blancs.push(e.id);
      if (r.right > innerWidth + 1 || r.left < -1) out.hors.push(e.id || e.className);
      if (cs.mixBlendMode !== 'normal') out.fusion.push(e.id);
    }
    out.emoji = (box.textContent.match(/\p{Extended_Pictographic}/gu) || []);
    out.debord = document.documentElement.scrollWidth > innerWidth;
    out.bouton = (() => { const r = document.getElementById('pj-creer').getBoundingClientRect(); return Math.round(r.bottom); })();
    return out;
  });
  const d = [];
  if (m.cibles.length) d.push('cibles < 44 px : ' + m.cibles.join(', '));
  if (m.champs.length) d.push('champs < 16 px : ' + m.champs.join(', '));
  if (m.petits.length) d.push('textes < 12 px : ' + m.petits.join(', '));
  if (m.blancs.join() !== 'pj-creer') d.push('touches blanches : ' + m.blancs.join(', '));
  if (m.hors.length || m.debord) d.push('hors de l\'écran : ' + m.hors.join(', '));
  if (m.emoji.length) d.push('emoji : ' + m.emoji.join(''));
  if (m.fusion.length) d.push('mode de fusion : ' + m.fusion.join(', '));
  ok(!d.length, `${vp.tel ? 'iPhone 390' : 'Mac 1440'} : la feuille respecte la charte (cibles ≥ 44 px, champs ≥ 16 px, textes ≥ 12 px, une seule touche blanche « Créer le projet », rien hors de l'écran, ni emoji ni fusion)`, d.join(' ; '));
  if (vp.tel) ok(m.bouton <= 844, 'iPhone : « Créer le projet » est dans le premier écran, sans défiler', `bas du bouton : ${m.bouton} px`);
  const c = await mesurer(page, { racine: '#projet-box', cadre: '#projet-box' });
  ok(c.n > 8 && !c.sous.length, `${vp.tel ? 'iPhone' : 'Mac'} : contraste ≥ 4,5 : 1 partout sur la feuille`, `${c.n} morceaux, le plus faible : ${fmt(c.pire.ratio)} sur « ${c.pire.t} »${c.sous.length ? ` ; sous le seuil : « ${c.sous[0].t} » à ${fmt(c.sous[0].ratio)}` : ''}`);
  // Échap ferme
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok(!(await page.evaluate(() => document.getElementById('projet-modal').classList.contains('open'))), `${vp.tel ? 'iPhone' : 'Mac'} : Échap ferme la feuille sans rien créer`);
  ok(!errors.length, `${vp.tel ? 'iPhone' : 'Mac'} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (r.ok) console.log('OK   ' + r.name); else { fails++; console.log('ÉCHEC ' + r.name + (r.detail ? '\n     ' + r.detail : '')); } }
console.log(`\n${results.length - fails} / ${results.length} réussis`);
process.exit(fails ? 1 : 0);
