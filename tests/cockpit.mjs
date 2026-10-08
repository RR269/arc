// Tests du cockpit d'une tâche (8 octobre : l'écriture de l'accueil, un cockpit = une tâche de haut en bas).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/cockpit.mjs
// Supabase et le proxy Claude sont remplacés par de faux serveurs : aucune requête ne part vers le vrai projet.
//
// Sur iPhone (390 × 844) et sur Mac (1440 × 900), cockpit rempli (réponse de Claude, note, journal) : textes ≥ 12 px,
// champs ≥ 16 px, cibles ≥ 44 px, contraste ≥ 4,5 : 1 mesuré dans l'image, ni emoji ni mode de fusion, police du
// système, une seule touche blanche, le nom de la tâche en entier, rien hors de l'écran.
// Puis les fonctions : la réponse de Claude se voit sur iPhone et s'ajoute aux notes ; une erreur se voit et rend la
// question ; les notes s'enregistrent ; le journal s'ajoute par Entrée ; « C'est fait » marque la tâche et met le
// projet à jour ; Échap ferme ; le minuteur parle français ; une autre tâche repart d'une liste vide ; 360 à 430 px.

import { chromium, startServer, fakeSupabase, openPage, sessionScript } from './outils.mjs';
import { mesurer } from './mesure.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const REPONSE = 'Voici le parcours :\n\n1. Ouvrir « Ma boutique ».\n2. Choisir **Boulangerie**.\n3. Vérifier que le bouton reste grisé.';
const contexte = async (vp, fk) => {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.tel, hasTouch: vp.tel, serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.addInitScript(sessionScript());
  return openPage(browser, url, { ctx, fk });
};
const reponses = () => { const calls = []; const f = async body => { calls.push(body); return f.next ? f.next(body) : { status: 200, json: { content: [{ type: 'text', text: REPONSE }] } }; }; f.calls = calls; return f; };
const ouvrir = (page, wid = 0, i = 0) => page.evaluate(([w, i]) => { enterWorld(w); openCockpit(w, WORLDS[w].tasks_todo[i].id); }, [wid, i]).then(() => page.waitForTimeout(400));

// Dans la page : ce que la charte mesure sur le cockpit ouvert
const releve = () => {
  const root = document.getElementById('cockpit'), vis = e => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
  const nom = e => (e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]);
  const zone = e => { const r = e.getBoundingClientRect(), b = getComputedStyle(e, '::before'); let dx = 0, dy = 0;
    if (b.content !== 'none' && b.position === 'absolute') { dx = Math.max(0, -parseFloat(b.left) || 0) * 2; dy = Math.max(0, -parseFloat(b.top) || 0) * 2; }
    return { w: r.width + dx, h: r.height + dy }; };
  const cibles = [...root.querySelectorAll('button, a[href], input, textarea, select')].filter(vis).map(e => ({ ...zone(e), n: nom(e) })).filter(c => c.h < 43.5 || c.w < 43.5).map(c => `${c.n} ${Math.round(c.w)}×${Math.round(c.h)}`);
  const petits = [], picto = [], mono = [], capit = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || !vis(e)) continue; const cs = getComputedStyle(e), s = parseFloat(cs.fontSize); if (s === 0) continue;
    if (s < 12) petits.push(`${nom(e)} ${s}px`); if (/mono/i.test(cs.fontFamily) && !e.closest('code,pre')) mono.push(nom(e)); if (cs.textTransform === 'uppercase') capit.push(nom(e));
    const m = nd.nodeValue.match(/[\p{Extended_Pictographic}✓✕↺⬆✦]/gu); if (m) picto.push(...m); }
  const champs = [...root.querySelectorAll('input, textarea')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(nom);
  const fusion = []; for (const e of root.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') fusion.push(nom(e)); }
  const blancs = [...root.querySelectorAll('button')].filter(vis).filter(b => /255, 255, 255|#fff/i.test(getComputedStyle(b).backgroundImage)).map(nom);
  const hors = [...root.querySelectorAll('*')].filter(vis).filter(e => !e.closest('.x-horizon') && !e.classList.contains('x-horizon')).filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).map(nom);
  const titre = document.getElementById('cockpit-task-name'), tcs = getComputedStyle(titre);
  const police = s => getComputedStyle(root.querySelector(s)).fontFamily.split(',')[0].trim();
  return { cibles: [...new Set(cibles)], petits: [...new Set(petits)], champs, picto, fusion, mono: [...new Set(mono)], capit: [...new Set(capit)], blancs, hors: [...new Set(hors)].slice(0, 5),
           titreEntier: titre.scrollWidth <= titre.clientWidth + 1 && tcs.textOverflow !== 'ellipsis' && tcs.whiteSpace !== 'nowrap',
           systeme: ['#cockpit-task-name', '.ck-h2', '#cockpit-textarea', '#ccb-inp', '.ck-msg', '#cockpit-back'].map(police),
           horizon: /radial-gradient/.test((s => s.maskImage || s.webkitMaskImage || '')(getComputedStyle(root.querySelector('.x-horizon'), '::before'))) };
};

for (const vp of [{ n: 'iPhone 390 × 844', width: 390, height: 844, tel: true }, { n: 'Mac 1440 × 900', width: 1440, height: 900, tel: false }]) {
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await contexte(vp, fk);
  await page.evaluate(() => document.fonts.ready);
  await ouvrir(page);
  // Rempli : une réponse de Claude, une note, une entrée de journal
  await page.click('#ccb-send'); await page.waitForSelector('#cockpit .ck-ans');
  await page.fill('#cockpit-textarea', 'Essai fait sur le Mac : Boulangerie apparaît, Enregistrer reste grisé.');
  await page.fill('#cockpit-jou-inp', 'Essai Ma boutique lancé'); await page.press('#cockpit-jou-inp', 'Enter');
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); document.getElementById('cockpit-body').scrollTop = 0; }); await page.waitForTimeout(1800);
  const r = await page.evaluate(releve), d = [];
  if (r.cibles.length) d.push('cibles < 44 px : ' + r.cibles.join(', '));
  if (r.petits.length) d.push('textes < 12 px : ' + r.petits.join(', '));
  if (r.champs.length) d.push('champs < 16 px : ' + r.champs.join(', '));
  if (r.picto.length) d.push('emoji ou signes : ' + r.picto.join(''));
  if (r.fusion.length) d.push('mode de fusion : ' + r.fusion.join(', '));
  if (r.mono.length || r.capit.length) d.push(`chasse fixe ${r.mono.join(', ') || 'aucune'} ; capitales ${r.capit.join(', ') || 'aucune'}`);
  if (r.blancs.length !== 1 || r.blancs[0] !== '#cockpit-done-btn') d.push('touches blanches : ' + (r.blancs.join(', ') || 'aucune'));
  if (r.hors.length) d.push('hors de l\'écran : ' + r.hors.join(', '));
  if (!r.titreEntier) d.push('le nom de la tâche est coupé');
  if (r.systeme.some(f => !/apple-system|BlinkMacSystemFont/i.test(f))) d.push('écriture : ' + r.systeme.join(' / '));
  if (!r.horizon) d.push('pas d\'horizon');
  ok(!d.length, `${vp.n} : le cockpit rempli respecte la charte (textes ≥ 12 px, champs ≥ 16 px, cibles ≥ 44 px, ni emoji ni fusion ni chasse fixe, police du système, une seule touche blanche « C'est fait », nom de la tâche en entier, horizon du projet)`, d.join(' ; '));

  // Contraste, sur toute la hauteur
  let pire = { ratio: Infinity }, n = 0; const sous = [];
  const note = m => { n += m.n; sous.push(...m.sous); if (m.pire.ratio < pire.ratio) pire = m.pire; };
  note(await mesurer(page, { racine: '#cockpit-top' }));
  const zones = vp.tel ? ['#cockpit-body'] : ['#cockpit-left', '#cockpit-right'];
  for (const z of zones) {
    const sc = await page.evaluate(s => { const m = document.querySelector(s); return { h: m.scrollHeight, c: m.clientHeight }; }, z);
    for (let y = 0; y < sc.h; y += Math.round(sc.c * 0.7)) {
      await page.evaluate(([s, v]) => { document.querySelector(s).scrollTop = v; }, [z, y]); await page.waitForTimeout(90);
      note(await mesurer(page, { racine: z, cadre: z }));
    }
    await page.evaluate(s => { document.querySelector(s).scrollTop = 0; }, z);
  }
  ok(n > 40 && !sous.length, `${vp.n} : contraste ≥ 4,5 : 1 partout dans le cockpit`, `${n} morceaux mesurés, le plus faible : ${fmt(pire.ratio)} sur « ${pire.t} » (${pire.n})${sous.length ? ` ; ${sous.length} sous le seuil, dont « ${sous[0].t} » à ${fmt(sous[0].ratio)}` : ''}`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await page.context().close();
}

// ── Les fonctions, sur iPhone ──
{
  const vp = { width: 390, height: 844, tel: true };
  const fk = fakeSupabase(); fk.proxy = reponses();
  const { page, errors } = await contexte(vp, fk);
  await ouvrir(page);
  const prepare = await page.evaluate(() => ({ champ: document.getElementById('ccb-inp').value, badge: !document.getElementById('ccb-prompt-badge').hidden, tache: WORLDS[0].tasks_todo[0] }));

  // Claude : la réponse se voit, juste sous la question ; le prompt porte le projet et sa mission
  await page.tap('#ccb-send'); await page.waitForSelector('#cockpit .ck-ans');
  const vu = await page.evaluate(() => { const a = document.querySelector('#cockpit .ck-ans'); a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + 20); return { dedans: !!(e && a.contains(e)), texte: a.textContent }; });
  const envoye = fk.proxy.calls[0] ? fk.proxy.calls[0].messages[0].content : '';
  ok(prepare.badge && prepare.champ === prepare.tache.prompt && vu.dedans && /Boulangerie/.test(vu.texte) && /Projet : ARYAN/.test(envoye) && /Mission du projet : Amener ARYAN/.test(envoye) && envoye.includes(prepare.tache.t) && !/Demande : $/.test(envoye),
     'Claude : la question préparée est posée dans le champ, l\'envoi part avec le projet, sa mission et la tâche, et la réponse se voit dans le cockpit sur iPhone (elle partait dans un panneau caché)',
     `question préparée ${prepare.badge} ; réponse visible ${vu.dedans} ; envoyé : ${envoye.slice(0, 80).replace(/\n/g, ' / ')}…`);

  // « Ajouter à mes notes »
  await page.tap('#cockpit .ck-inject-btn-el'); await page.waitForTimeout(200);
  const ajout = await page.evaluate(() => ({ notes: document.getElementById('cockpit-textarea').value, garde: (S.taskNotes[0] || {})[cockpitState.tid] || '', bouton: document.querySelector('#cockpit .ck-inject-btn-el').textContent, enregistre: document.getElementById('cockpit-saved-badge').classList.contains('on') }));
  ok(/Boulangerie/.test(ajout.notes) && ajout.garde === ajout.notes && ajout.bouton === 'Ajouté à tes notes' && ajout.enregistre,
     '« Ajouter à mes notes » : la réponse rejoint les notes de la tâche, elles sont enregistrées, et le bouton le confirme', `bouton « ${ajout.bouton} », enregistré ${ajout.enregistre}`);

  // Erreur : elle se voit dans le cockpit et la question revient dans le champ
  fk.proxy.next = () => ({ status: 500, json: { error: { message: 'panne simulée' } } });
  await page.fill('#ccb-inp', 'Et si ça ne marche pas ?'); await page.tap('#ccb-send'); await page.waitForSelector('#cockpit .ck-err');
  const err = await page.evaluate(() => ({ msg: document.querySelector('#cockpit .ck-err').textContent, champ: document.getElementById('ccb-inp').value }));
  fk.proxy.next = null;
  ok(/n’a pas répondu/.test(err.msg) && /500/.test(err.msg) && err.champ === 'Et si ça ne marche pas ?', 'Claude en panne : le message se voit dans le cockpit, et la question est remise dans le champ', err.msg.slice(0, 90));

  // Mes notes : enregistrées seules ; « Enregistré » ne s'affiche qu'une fois que c'est vrai
  await page.fill('#cockpit-textarea', 'Première note'); const avant = await page.evaluate(() => document.getElementById('cockpit-saved-badge').classList.contains('on'));
  await page.waitForTimeout(1800);
  const notes = await page.evaluate(() => ({ on: document.getElementById('cockpit-saved-badge').classList.contains('on'), garde: S.taskNotes[0][cockpitState.tid], local: JSON.parse(localStorage.getItem('arc_v2')).taskNotes[0][cockpitState.tid], mots: document.getElementById('cockpit-word-count').textContent }));
  ok(!avant && notes.on && notes.garde === 'Première note' && notes.local === 'Première note' && notes.mots === '2 mots', 'Mes notes : enregistrées sur l\'appareil 1,5 s après la frappe, « Enregistré » seulement ensuite, nombre de mots juste', JSON.stringify({ avant, ...notes }));

  // Journal du projet : Entrée ajoute
  const n0 = await page.evaluate(() => S.journal[0].length);
  await page.fill('#cockpit-jou-inp', 'Rendez-vous boulangerie fixé'); await page.press('#cockpit-jou-inp', 'Enter'); await page.waitForTimeout(150);
  const jou = await page.evaluate(() => ({ n: S.journal[0].length, haut: document.querySelector('#cockpit-jou-rows .ck-jou-row').textContent, champ: document.getElementById('cockpit-jou-inp').value }));
  ok(jou.n === n0 + 1 && /Rendez-vous boulangerie fixé/.test(jou.haut) && jou.champ === '', 'Journal du projet : Entrée ajoute l\'entrée, en tête de liste', JSON.stringify(jou));

  // Minuteur : en français, le temps restant sur le bouton
  await page.tap('#cockpit-pomo-btn'); await page.waitForTimeout(150);
  const m0 = await page.evaluate(() => ({ ouvert: document.getElementById('pomo-widget').classList.contains('open'), aria: document.getElementById('cockpit-pomo-btn').getAttribute('aria-expanded'), boutons: [...document.querySelectorAll('.pomo-btn')].map(b => b.textContent), session: document.getElementById('pomo-sessions').textContent }));
  await page.tap('#pomo-start'); await page.waitForTimeout(1300);
  const m1 = await page.evaluate(() => ({ lbl: document.getElementById('cockpit-pomo-lbl').textContent, start: document.getElementById('pomo-start').textContent }));
  await page.tap('#pomo-start'); await page.waitForTimeout(100);
  const m2 = await page.evaluate(() => ({ lbl: document.getElementById('cockpit-pomo-lbl').textContent, start: document.getElementById('pomo-start').textContent }));
  await page.tap('[data-action="pomo-reset"]'); await page.tap('#cockpit-pomo-btn'); await page.waitForTimeout(100);
  const m3 = await page.evaluate(() => ({ ferme: !document.getElementById('pomo-widget').classList.contains('open'), lbl: document.getElementById('cockpit-pomo-lbl').textContent, start: document.getElementById('pomo-start').textContent }));
  ok(m0.ouvert && m0.aria === 'true' && m0.boutons.join('|') === 'Démarrer|Remettre à zéro' && m0.session === 'Session 1 sur 4' && /^2[45]:\d\d$/.test(m1.lbl) && m1.start === 'Pause' && m2.lbl === 'Minuteur' && m2.start === 'Reprendre' && m3.ferme && m3.start === 'Démarrer',
     'Minuteur : en français, le temps restant s\'affiche sur son bouton pendant qu\'il tourne', JSON.stringify({ m0, m1, m2, m3 }));

  // « C'est fait » : la tâche est faite, le cockpit se ferme, le projet est à jour ; rouvrir la tâche le dit
  const avantFait = await page.evaluate(() => ({ fait: document.getElementById('m-done').textContent, tid: cockpitState.tid }));
  await page.tap('#cockpit-done-btn'); await page.waitForTimeout(300);
  const fait = await page.evaluate(t => ({ ferme: !document.getElementById('cockpit').classList.contains('open'), coche: !!S.tasks[0][t], compteur: document.getElementById('m-done').textContent }), avantFait.tid);
  await page.evaluate(t => openCockpit(0, t), avantFait.tid); await page.waitForTimeout(200);
  const rouvert = await page.evaluate(() => ({ bouton: document.getElementById('cockpit-done-btn').textContent, etat: document.getElementById('cockpit-etat').textContent, blanc: /255, 255, 255/.test(getComputedStyle(document.getElementById('cockpit-done-btn')).backgroundImage) }));
  ok(fait.ferme && fait.coche && Number(fait.compteur) === Number(avantFait.fait) + 1 && rouvert.bouton === 'Rouvrir la tâche' && rouvert.etat === 'Tâche faite' && !rouvert.blanc,
     '« C\'est fait » : la tâche est cochée, le cockpit se ferme, le compteur du projet suit ; rouverte, elle dit « Tâche faite » et propose « Rouvrir la tâche » (sans touche blanche)', JSON.stringify({ ...fait, avant: avantFait.fait, ...rouvert }));

  // Une autre tâche : la liste des réponses de Claude repart vide ; le retour ramène au projet
  await page.evaluate(() => openCockpit(0, WORLDS[0].tasks_todo[1].id)); await page.waitForTimeout(200);
  const autre = await page.evaluate(() => ({ reponses: document.querySelectorAll('#cockpit .ck-ans, #cockpit .ck-err').length, cache: document.getElementById('cockpit-claude-msgs').hidden, retour: document.getElementById('cockpit-back-lbl').textContent }));
  await page.tap('#cockpit-back'); await page.waitForTimeout(200);
  const retour = await page.evaluate(() => ({ ferme: !document.getElementById('cockpit').classList.contains('open'), monde: !document.getElementById('S2').classList.contains('off') }));
  ok(autre.reponses === 0 && autre.cache && autre.retour === 'ARYAN' && retour.ferme && retour.monde, 'Une autre tâche repart sans les réponses de la précédente ; « ‹ ARYAN » ramène au projet', JSON.stringify({ ...autre, ...retour }));
  // la seule erreur attendue : le 500 de la panne simulée, que le navigateur note lui-même
  const autres = errors.filter(e => !/status of 500/.test(e));
  ok(autres.length === 0 && errors.length === 1, 'Fonctions sur iPhone : aucune erreur de console (hors le 500 de la panne simulée)', errors.join(' | '));
  await page.context().close();
}

// ── Mac : Échap ferme le cockpit (il ne le fermait pas : le code regardait style.display, jamais posé) ──
{
  const { page, errors } = await contexte({ width: 1440, height: 900, tel: false }, fakeSupabase());
  await ouvrir(page); await page.press('#cockpit-textarea', 'Escape'); await page.waitForTimeout(150);
  const ferme = await page.evaluate(() => !document.getElementById('cockpit').classList.contains('open'));
  ok(ferme && !errors.length, 'Mac : Échap ferme le cockpit', `fermé ${ferme}`);
  await page.context().close();
}

// ── Largeurs de téléphone : rien ne sort, la barre du haut tient, le nom de la tâche se lit en entier ──
{
  const def = [];
  for (const w of [360, 375, 393, 430]) {
    const { page } = await contexte({ width: w, height: 800, tel: true }, fakeSupabase());
    for (const [wid, i] of [[0, 0], [4, 0], [1, 2]]) {
      await ouvrir(page, wid, i);
      const r = await page.evaluate(() => { const body = document.getElementById('cockpit-body'), t = document.getElementById('cockpit-task-name');
        const barre = [...document.querySelectorAll('#cockpit-top button')].filter(b => b.offsetParent !== null).every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 44; });
        return { large: body.scrollWidth <= body.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth, barre, titre: t.scrollWidth <= t.clientWidth + 1, nom: WORLDS[cockpitState.wid].name }; });
      if (!r.large || !r.barre || !r.titre) def.push(`${w} px, ${r.nom} : ${JSON.stringify(r)}`);
      await page.evaluate(() => closeCockpit());
    }
    await page.context().close();
  }
  ok(!def.length, 'Téléphones de 360 à 430 px (ARYAN, ATLAS, FBA) : aucun débordement, la barre du haut tient, le nom de la tâche se lit en entier', def.join(' ; '));
}

await browser.close(); server.close();
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
