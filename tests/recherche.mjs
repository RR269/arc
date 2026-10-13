// Tests de la recherche (8 octobre : elle n'avait jamais marché, la page appelait une fonction jamais écrite).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/recherche.mjs
// Supabase est remplacé par un faux serveur : aucune requête ne part vers le vrai projet.
//
// Et « Demande à ARC » : une question reçoit une réponse tirée d'ARC, avec ses sources (faux proxy).
// Ce qui est cherché : pensées (sauf annulées), tâches (titre ou notes), projets, journal des projets, Juridique ; sans
// accents ni casse, tous les mots ; chaque ligne ouvre la chose là où elle vit ; Entrée et les flèches au clavier ;
// texte posé sans innerHTML. Et la charte : cibles ≥ 44 px, textes ≥ 12 px, champ ≥ 16 px, contraste ≥ 4,5 : 1.

import { chromium, startServer, fakeSupabase, openPage, sessionScript, deposit } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const contexte = async vp => {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.tel, hasTouch: vp.tel, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  // les pensées déposées sont rangées par le proxy : un faux rangement, une note sans étape dans ARYAN
  const fk = fakeSupabase(); fk.proxy = async () => ({ status: 200, json: { filing: { space: 'aryan', confidence: 'sure', step: '', moment: { type: 'none' }, extras: [] }, model: 'test' } });
  return openPage(browser, url, { ctx, fk });
};
// Ce que Rayan aurait laissé dans ARC : une pensée, une note de tâche, une entrée de journal, une démarche, une tâche à lui
const remplir = async page => {
  await deposit(page, 'Appeler la boulangère de Bourg-lès-Valence pour le pilote'); await page.waitForTimeout(300);
  await deposit(page, 'Note <img src=x onerror="window.__xss=1"> pour voir'); await page.waitForTimeout(300);
  await page.evaluate(() => {
    const tid = WORLDS[4].tasks_todo[0].id;
    S.taskNotes[4] = S.taskNotes[4] || {}; S.taskNotes[4][tid] = 'Le greffe demande un justificatif de domicile récent.';
    S.journal[0].push({ ts: Date.now(), t: 'Décision prise : les boutiques avant les livreurs.' });
    S.poles.juridique = S.poles.juridique || {}; S.poles.juridique.demarches = [{ t: 'Dossier ACRE à déposer à l’URSSAF', ts: Date.now() }];
    S.custom[1] = S.custom[1] || []; S.custom[1].push({ id: 'c_test', t: 'Comparer trois fournisseurs de boîtes' });
    saveS();
  });
};
const chercher = async (page, q) => { await page.evaluate(() => { if (!document.getElementById('search-modal').classList.contains('open')) openSearch(); }); await page.fill('#search-inp', q); await page.waitForTimeout(150);
  // la recherche s'ouvre en 220 ms avec un léger zoom (searchIn, scale .96) : mesurée avant la fin, une cible de 44 px en
  // faisait 42 (échec intermittent prouvé le 10 octobre) ; on attend que son animation soit finie
  await page.evaluate(() => Promise.all(document.getElementById('search-modal').getAnimations().map(a => a.finished))); };
const vus = page => page.evaluate(() => {
  const g = {}; let cur = null;
  for (const e of document.getElementById('search-results').children) {
    if (e.classList.contains('sr-group-lbl')) { cur = e.textContent; g[cur] = []; }
    else if (e.classList.contains('sr-item')) g[cur].push({ t: e.querySelector('.sr-text').textContent, meta: (e.querySelector('.sr-meta') || {}).textContent || '', marks: [...e.querySelectorAll('mark')].map(m => m.textContent) });
  }
  return { g, vide: (document.querySelector('#search-results .sr-empty') || {}).textContent || '' };
});

// ── Fonctions, sur iPhone ──
{
  const { page, errors } = await contexte({ width: 390, height: 844, tel: true });
  await remplir(page);
  await page.tap('#btn-search'); await page.waitForTimeout(200);
  const accueil = await page.evaluate(() => ({ ouvert: document.getElementById('search-modal').classList.contains('open'), focus: document.activeElement.id, texte: document.getElementById('search-results').textContent }));
  await page.keyboard.type('boutique'); await page.waitForTimeout(200);
  const a = await vus(page);
  ok(accueil.ouvert && accueil.focus === 'search-inp' && /pensées/.test(accueil.texte) && a.g['Tâches'] && a.g['Tâches'].length >= 2 && a.g['Projets'] && a.g['Journal'] && a.g['Tâches'].every(x => x.marks.some(m => /boutique/i.test(m))) && !errors.length,
     'Recherche : elle s\'ouvre sur le champ, dit ce qu\'elle cherche, et « boutique » trouve des tâches, un projet et une entrée de journal, mots surlignés, sans aucune erreur (avant : une exception à chaque lettre)',
     JSON.stringify({ groupes: Object.fromEntries(Object.entries(a.g).map(([k, v]) => [k, v.length])), erreurs: errors.length }));

  await chercher(page, 'decision livreurs'); const b = await vus(page);
  await chercher(page, 'BOULANGERE valence'); const c = await vus(page);
  await chercher(page, 'justificatif'); const d = await vus(page);
  await chercher(page, 'acre urssaf'); const e = await vus(page);
  await chercher(page, 'zzz introuvable'); const f = await vus(page);
  ok(b.g['Journal'] && b.g['Journal'][0].t.startsWith('Décision') && c.g['Pensées'] && /Bourg-lès-Valence/.test(c.g['Pensées'][0].t) && /À ranger|Sans espace|ATLAS|ARYAN/.test(c.g['Pensées'][0].meta)
     && d.g['Tâches'] && /Dans tes notes/.test(d.g['Tâches'][0].meta) && /ATLAS/.test(d.g['Tâches'][0].meta) && e.g['Juridique'] && /Démarches en cours/.test(e.g['Juridique'][0].meta) && f.vide === 'Rien pour « zzz introuvable ».',
     'Sans accents ni casse, tous les mots : le journal (« decision » trouve « Décision »), les pensées, les notes du cockpit, Juridique ; rien trouvé : « Rien pour « … ». »',
     JSON.stringify({ journal: b.g['Journal']?.[0]?.t, pensee: c.g['Pensées']?.[0]?.meta, note: d.g['Tâches']?.[0]?.meta, jur: e.g['Juridique']?.[0]?.meta, vide: f.vide }));

  await chercher(page, 'onerror'); const x = await vus(page);
  const xss = await page.evaluate(() => ({ img: !!document.querySelector('#search-results img'), drapeau: !!window.__xss }));
  ok(x.g['Pensées'] && /<img/.test(x.g['Pensées'][0].t) && !xss.img && !xss.drapeau, 'Une pensée qui contient du code s\'affiche en texte : aucune balise n\'est créée', JSON.stringify(xss));

  // Chaque ligne ouvre la chose là où elle vit
  await chercher(page, 'boulangere'); await page.tap('#search-results .sr-item');
  await page.waitForTimeout(300);
  const o1 = await page.evaluate(() => { const d = document.getElementById('depot-screen'), id = Object.values(_depot.thoughts).find(t => /boulangère/.test(t.body)).id, el = document.querySelector(`#depot-list [data-id="${id}"]`), r = el && el.getBoundingClientRect();
    return { depot: d.classList.contains('open'), fermee: !document.getElementById('search-modal').classList.contains('open'), visible: !!r && r.top >= 0 && r.bottom <= innerHeight }; });
  await page.evaluate(() => depotClose()); await page.waitForTimeout(200);
  await chercher(page, 'justificatif'); await page.tap('#search-results .sr-item'); await page.waitForTimeout(300);
  const o2 = await page.evaluate(() => ({ cockpit: document.getElementById('cockpit').classList.contains('open'), tache: cockpitState.tid === WORLDS[4].tasks_todo[0].id, notes: document.getElementById('cockpit-textarea').value }));
  await page.evaluate(() => closeCockpit()); await page.waitForTimeout(150);
  await chercher(page, 'decision prise'); await page.tap('#search-results .sr-item'); await page.waitForTimeout(400);
  const o3 = await page.evaluate(() => { const r = document.getElementById('wsec-memoire').getBoundingClientRect(); return { monde: !document.getElementById('S2').classList.contains('off') && CUR.wid === 0, journal: r.top < innerHeight && r.bottom > 0 }; });
  await page.evaluate(() => goHome()); await page.waitForTimeout(150);
  await chercher(page, 'urssaf'); await page.tap('#search-results .sr-item'); await page.waitForTimeout(400);
  const o4 = await page.evaluate(() => ({ jur: !document.getElementById('S4').classList.contains('off'), champ: document.getElementById('jur-search-inp').value }));
  ok(o1.depot && o1.fermee && o1.visible && o2.cockpit && o2.tache && /greffe/.test(o2.notes) && o3.monde && o3.journal && o4.jur && o4.champ === 'urssaf',
     'Chaque ligne ouvre la chose là où elle vit : la pensée dans « Déposé », la tâche dans son cockpit (avec ses notes), l\'entrée au journal du projet, la démarche dans Juridique (la recherche y est reprise)',
     JSON.stringify({ o1, o2: { ...o2, notes: o2.notes.slice(0, 20) }, o3, o4 }));
  ok(!errors.length, 'iPhone : aucune erreur de console', errors.join(' | '));
  await page.context().close();
}

// ── Clavier, sur Mac : flèches et Entrée ; Échap ferme ──
{
  const { page, errors } = await contexte({ width: 1440, height: 900, tel: false });
  await remplir(page);
  await page.keyboard.press('Meta+k'); await page.waitForTimeout(150);
  if (!(await page.evaluate(() => document.getElementById('search-modal').classList.contains('open')))) await page.keyboard.press('Control+k');
  await page.keyboard.type('boutique'); await page.waitForTimeout(150);
  const choix = await page.evaluate(() => [...document.querySelectorAll('#search-results .sr-item')].map(e => e.classList.contains('on')));
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  const second = await page.evaluate(() => { const l = [...document.querySelectorAll('#search-results .sr-item')]; return { i: l.findIndex(e => e.classList.contains('on')), t: l[1].querySelector('.sr-text').textContent }; });
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const ouvert = await page.evaluate(() => ({ cockpit: document.getElementById('cockpit').classList.contains('open'), titre: document.getElementById('cockpit-task-name').textContent, fermee: !document.getElementById('search-modal').classList.contains('open') }));
  await page.evaluate(() => closeCockpit());
  await page.evaluate(() => openSearch()); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const echap = await page.evaluate(() => !document.getElementById('search-modal').classList.contains('open'));
  const pied = await page.evaluate(() => getComputedStyle(document.getElementById('search-footer')).display);
  ok(choix[0] === true && second.i === 1 && ouvert.cockpit && ouvert.titre === second.t && ouvert.fermee && echap && pied !== 'none' && !errors.length,
     'Mac : ⌘K ouvre, la première ligne est choisie, les flèches changent de ligne, Entrée ouvre la ligne choisie, Échap ferme ; le pied rappelle les touches',
     JSON.stringify({ premier: choix[0], second, ouvert, echap, pied }));
  await page.context().close();
}

// ── La charte, sur iPhone et sur Mac, la recherche remplie ──
for (const vp of [{ n: 'iPhone 390 × 844', width: 390, height: 844, tel: true }, { n: 'Mac 1440 × 900', width: 1440, height: 900, tel: false }]) {
  const { page, errors } = await contexte(vp);
  await remplir(page); await page.evaluate(() => document.fonts.ready);
  await chercher(page, 'boutique');
  const r = await page.evaluate(() => {
    const root = document.getElementById('search-modal'), vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
    const nom = e => (e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]);
    const cibles = [...root.querySelectorAll('button, input')].filter(vis).filter(e => { const b = e.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5; }).map(e => `${nom(e)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`);
    const petits = [], mono = [], picto = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e); if (parseFloat(cs.fontSize) < 12) petits.push(nom(e)); if (/mono/i.test(cs.fontFamily) || cs.textTransform === 'uppercase') mono.push(nom(e)); if (/\p{Extended_Pictographic}/u.test(nd.nodeValue)) picto.push(nd.nodeValue.trim()); }
    const champ = parseFloat(getComputedStyle(document.getElementById('search-inp')).fontSize);
    const b = document.getElementById('search-box').getBoundingClientRect();
    return { cibles, petits, mono, picto, champ, dedans: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight, police: getComputedStyle(root.querySelector('.sr-text')).fontFamily.split(',')[0] };
  });
  const m = await mesurer(page, { racine: '#search-box' });
  ok(!r.cibles.length && !r.petits.length && !r.mono.length && !r.picto.length && r.champ >= 16 && r.dedans && /apple-system|BlinkMacSystemFont/.test(r.police) && !m.sous.length && m.n > 10 && !errors.length,
     `${vp.n} : la recherche respecte la charte (cibles ≥ 44 px, textes ≥ 12 px, champ ≥ 16 px, police du système, ni emoji ni capitales, dans l'écran, contraste ≥ 4,5 : 1)`,
     `${m.n} morceaux mesurés, le plus faible : ${fmt(m.pire.ratio)} sur « ${m.pire.t} »${r.cibles.length ? ' ; cibles : ' + r.cibles.join(', ') : ''}${r.petits.length ? ' ; petits : ' + r.petits.join(', ') : ''}${m.sous.length ? ' ; sous le seuil : ' + m.sous.map(x => x.t).join(', ') : ''} ; ${JSON.stringify({ mono: r.mono, picto: r.picto, champ: r.champ, dedans: r.dedans, police: r.police, erreurs: errors.length })}`);
  await page.context().close();
}

// ── Santé dans la recherche, et Juridique filtré qui marque le bon élément (12 octobre) ──
{
  const { page, errors } = await contexte({ width: 390, height: 844, tel: true });
  await page.evaluate(() => {
    if (typeof matinClose === 'function') matinClose();
    const d = new Date(); d.setDate(d.getDate() + 3); const p = n => (n < 10 ? '0' : '') + n, j = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    S.sante.rdv = { a: { id: 'a', spe: 'dentiste', date: j, heure: '14:00', qui: 'Dr Martin', questions: 'Combien coûte la couronne ?' } };
    S.sante.docs = { d: { id: 'd', titre: 'Ordonnance lunettes', spe: 'ophtalmo', date: '2026-03-20', ou: 'papier' } };
    S.poles.juridique = { demarches: [{ t: 'Appeler la banque', status: 'todo' }, { t: 'Déclaration URSSAF', status: 'todo', deadline: j }] };
    saveS();
  });
  await chercher(page, 'dentiste'); const a = await vus(page);
  await chercher(page, 'couronne'); const b = await vus(page);
  await chercher(page, 'ordonnance'); const c = await vus(page);
  await chercher(page, 'urssaf'); const e = await vus(page);
  await chercher(page, 'couronne'); await page.tap('#search-results .sr-item'); await page.waitForTimeout(400);
  const o = await page.evaluate(() => ({ sante: !document.getElementById('S3').classList.contains('off'), feuille: document.getElementById('sante-modal').classList.contains('open'), id: _sm && _sm.id }));
  await page.evaluate(() => { santeFermer(); enterPole('juridique'); searchJur('urssaf'); }); await page.waitForTimeout(300);
  await page.click('#jur-body-demarches [data-action="jur-item-done"]'); await page.waitForTimeout(200);
  const jur = await page.evaluate(() => S.poles.juridique.demarches.map(x => x.status));
  ok(a.g['Santé'] && /^Dentiste · Dr Martin$/.test(a.g['Santé'][0].t) && /Rendez-vous · .* · à venir/.test(a.g['Santé'][0].meta)
     && b.g['Santé'] && /couronne/.test(b.g['Santé'][0].t) && /Rendez-vous Dentiste/.test(b.g['Santé'][0].meta)
     && c.g['Santé'] && /Ordonnance lunettes/.test(c.g['Santé'][0].t) && /Document · Ophtalmo/.test(c.g['Santé'][0].meta)
     && e.g['Juridique'] && /Dans 3 j/.test(e.g['Juridique'][0].meta) && o.sante && o.feuille && o.id === 'a' && jur.join() === 'todo,done' && !errors.length,
    'Santé dans la recherche : un rendez-vous par sa spécialité ou ses notes, un document par son nom, ouverts dans leur feuille ; une démarche datée dit quand ; dans Juridique filtré, « Fait » marque le bon élément (avant : celui du même rang dans la liste complète)',
    JSON.stringify({ a: a.g['Santé'], b: b.g['Santé'], c: c.g['Santé'], e: e.g['Juridique'], o, jur, errors }));
  await page.context().close();
}

// ── Demande à ARC (13 octobre, accord de Rayan « oui, avec Santé ») : une question reçoit une réponse tirée d'ARC ──
// Seuls les extraits utiles partent (jamais tout ARC ; une donnée de santé seulement si elle répond) ; la réponse cite
// ses sources, qui s'ouvrent là où elles vivent ; une ligne vraie dit ce qui est parti ; rien trouvé : rien ne part.
{
  const { page, fk, errors } = await contexte({ width: 390, height: 844, tel: true });
  const chats = [];
  let reponse = { status: 200, json: { content: [{ type: 'text', text: '{"reponse": "Tu as vu le dentiste le 22 septembre, avec le Dr Martin.", "sources": [1]}' }] } };
  fk.proxy = async body => {
    if (body.task === 'file') return { status: 200, json: { filing: { space: 'atlas', confidence: 'sure', step: 'Envoyer le Kbis au greffe', moment: { type: 'none' }, extras: [] }, model: 'test' } };
    chats.push(body); return typeof reponse === 'function' ? reponse(body) : reponse;
  };
  await deposit(page, 'Envoyer le Kbis au greffe pour ATLAS'); await page.waitForTimeout(800);
  await page.evaluate(() => {
    if (typeof matinClose === 'function') matinClose();
    const d = new Date(); d.setDate(d.getDate() - 20); const p = n => (n < 10 ? '0' : '') + n, j = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    S.sante.rdv = { a: { id: 'a', spe: 'dentiste', date: j, heure: '10:00', qui: 'Dr Martin', sortie: 'Revenir en novembre' } };
    S.sante.docs = { d: { id: 'd', titre: 'Ordonnance lunettes', spe: 'ophtalmo', date: '2026-03-20', ou: 'papier' } };
    S.journal[4] = (S.journal[4] || []).concat([{ ts: Date.now() - 864e5, t: 'Le greffe attend le Kbis signé.' }]);
    saveS();
  });
  // 1. Une question sur la santé : la touche « Demander à ARC », rien ne part avant le geste ; Entrée la pose
  await chercher(page, 'Quand ai-je vu le dentiste ?');
  const avant = await page.evaluate(() => ({ touche: !!document.getElementById('sr-ask'), texte: (document.getElementById('sr-ask') || {}).textContent || '' }));
  const n0 = chats.length;
  await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  const r1 = await page.evaluate(() => ({ rep: (document.querySelector('#sr-ans .sr-ans-txt') || {}).textContent, src: [...document.querySelectorAll('#sr-ans .sr-src')].map(b => b.textContent), parti: (document.querySelector('#sr-ans .sr-ans-parti') || {}).textContent }));
  const c1 = chats[0] || { messages: [{ content: '' }], system: '' }, contenu1 = c1.messages[0].content;
  await page.evaluate(() => document.getElementById('sr-ans').scrollIntoView({ block: 'center' })); await page.waitForTimeout(150);
  const m = await mesurer(page, { racine: '#sr-ans', cadre: '#sr-ans' });
  const h = await page.evaluate(() => [...document.querySelectorAll('#sr-ans button')].map(b => Math.round(b.getBoundingClientRect().height)));
  await page.tap('#sr-ans .sr-src'); await page.waitForTimeout(400);
  const ouvre = await page.evaluate(() => ({ feuille: document.getElementById('sante-modal').classList.contains('open'), id: _sm && _sm.id, fermee: !document.getElementById('search-modal').classList.contains('open') }));
  await page.evaluate(() => { santeFermer(); goHome(); });
  // 2. Une question sur un projet : aucune donnée de santé ne part
  reponse = { status: 200, json: { content: [{ type: 'text', text: '```json\n{"reponse": "Envoyer le Kbis au greffe.", "sources": [1, 2, 99]}\n```' }] } };
  await chercher(page, 'Je devais faire quoi pour ATLAS ?'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  const c2 = chats[1] || { messages: [{ content: '' }] }, contenu2 = c2.messages[0].content;
  const r2 = await page.evaluate(() => ({ rep: (document.querySelector('#sr-ans .sr-ans-txt') || {}).textContent, n: document.querySelectorAll('#sr-ans .sr-src').length, parti: (document.querySelector('#sr-ans .sr-ans-parti') || {}).textContent }));
  // 3. Rien dans ARC : ARC le dit, rien ne part
  await chercher(page, 'xylophone turquoise ?'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const r3 = await page.evaluate(() => ({ rep: (document.querySelector('#sr-ans .sr-ans-txt') || {}).textContent, parti: (document.querySelector('#sr-ans .sr-ans-parti') || {}).textContent }));
  const n3 = chats.length;
  // 4. Panne : la raison en mots, « Demander à nouveau » ; une réponse avec du code reste du texte
  reponse = { status: 500, json: { error: { message: 'panne' } } };
  await chercher(page, 'greffe ?'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  const r4 = await page.evaluate(() => ({ rep: (document.querySelector('#sr-ans .sr-ans-txt') || {}).textContent, re: !!document.querySelector('#sr-ans .sr-ask-re') }));
  reponse = { status: 200, json: { content: [{ type: 'text', text: '{"reponse": "<img src=x onerror=\\"window.__x2=1\\"> Le greffe attend le Kbis.", "sources": [1]}' }] } };
  await page.tap('#sr-ans .sr-ask-re'); await page.waitForTimeout(600);
  const r5 = await page.evaluate(() => ({ rep: (document.querySelector('#sr-ans .sr-ans-txt') || {}).textContent, img: !!document.querySelector('#sr-ans img'), x: !!window.__x2 }));
  // 5. Taper autre chose efface la réponse et rend la touche
  await chercher(page, 'greffe Kbis');
  const r6 = await page.evaluate(() => ({ ans: !!document.getElementById('sr-ans'), touche: !!document.getElementById('sr-ask'), items: document.querySelectorAll('#search-results .sr-item').length }));
  const vraies = errors.filter(e => !/status of 500/.test(e));
  ok(avant.touche && /Demander à ARC/.test(avant.texte) && /dentiste/.test(avant.texte) && n0 === 0
     && /^Tu as vu le dentiste le 22 septembre/.test(r1.rep) && r1.src.length === 1 && /Dentiste · Dr Martin/.test(r1.src[0]) && /^Parti à Claude : 1 rendez-vous\.$/.test(r1.parti)
     && /UNIQUEMENT avec les extraits/.test(c1.system) && /\[1\] Rendez-vous santé · Dentiste/.test(contenu1) && /Revenir en novembre/.test(contenu1) && !/Ordonnance|Kbis|ATLAS/.test(contenu1) && !c1.task
     && m.pire.ratio >= 4.5 && h.every(x => x >= 44) && ouvre.feuille && ouvre.id === 'a' && ouvre.fermee
     && /Kbis/.test(contenu2) && !/Rendez-vous santé|Document santé|Dentiste|Ordonnance/.test(contenu2) && (contenu2.match(/^\[\d+\]/gm) || []).length <= 20
     && r2.rep === 'Envoyer le Kbis au greffe.' && r2.n === 2 && /pensée/.test(r2.parti) && !/rendez-vous|santé/.test(r2.parti)
     && r3.rep === 'Je ne trouve rien dans ARC sur ça.' && /Rien n’est parti à Claude/.test(r3.parti) && n3 === 2
     && /ARC n’a pas pu répondre : le service de Claude est en panne/.test(r4.rep) && r4.re
     && /<img/.test(r5.rep) && !r5.img && !r5.x && !r6.ans && r6.touche && r6.items >= 1 && !vraies.length,
    'Demande à ARC : rien ne part avant le geste ; une question sur le dentiste n\'envoie que le rendez-vous (ni la pensée ATLAS ni l\'ordonnance), la réponse cite sa source, qui ouvre la feuille ; « Parti à Claude : 1 rendez-vous » ; une question sur ATLAS n\'envoie aucune donnée de santé, sources hors liste écartées ; rien trouvé : ARC le dit et rien ne part ; panne dite en mots, « Demander à nouveau » ; du code reste du texte ; taper autre chose rend la touche ; contraste, cibles',
    JSON.stringify({ avant, n0, r1, contenu1, contraste: m.pire, h, ouvre, contenu2: contenu2.slice(0, 600), r2, r3, n3, r4, r5, r6, erreurs: vraies }));
  await page.context().close();
}

await browser.close(); server.close();
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
