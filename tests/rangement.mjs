// Tests du rangement par l'IA (chantier 3), avec un faux Supabase et un faux proxy.
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/rangement.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium, ROOT, startServer, fakeSupabase, openPage, deposit, idOf, UID } from './outils.mjs';

const { server, url: URL0 } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });
const open = opts => openPage(browser, URL0, opts);

const tomorrow9 = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); };
const filingReply = (filing, extra = {}) => async () => ({ status: 200, json: { filing, model: 'claude-haiku-4-5-20251001' }, ...extra });
const ATLAS = { space: 'atlas', confidence: 'sure', step: 'Vérifier où en est l\'immatriculation',
                moment: { type: 'datetime', at: tomorrow9() }, extras: ['Relire les pages légales'] };
const item = (page, id) => page.locator(`#depot-list [data-id="${id}"]`).first();
const btn = (page, id, text) => item(page, id).locator('button', { hasText: text }).first();
const latestOf = (page, id) => page.evaluate(i => { const f = rangeIndex().latest[i]; return f ? { space: f.space, step: f.step, status: f.status, moment: f.moment, origin: f.origin } : null; }, id);
const waitFiled = (page, id) => page.waitForFunction(i => !!rangeIndex().ai[i], id, { timeout: 8000 });

/* 1. Le dépôt reste instantané même si le proxy met 5 secondes, ou échoue */
{
  const fk = fakeSupabase();
  fk.proxy = filingReply(ATLAS, { delay: 5000 });
  const { ctx, page } = await open({ fk, clock: true });
  await page.click('#depot-open');
  const measure = text => page.evaluate(t => new Promise(res => {
    const ta = document.getElementById('depot-ta'); ta.value = t; ta.dispatchEvent(new Event('input'));
    const t0 = performance.now(); document.getElementById('depot-send').click();
    (function chk() { const e = [...document.querySelectorAll('#depot-list .depot-body')].find(x => x.textContent === t);
      if (e && e.offsetParent) res(performance.now() - t0); else requestAnimationFrame(chk); })();
  }), text);
  const ms1 = await measure('Pensée pendant un proxy lent');
  await page.waitForTimeout(600);
  const busy = await page.locator('#depot-list .rg-wait.busy', { hasText: 'ARC range…' }).count();
  fk.proxy = async () => ({ status: 500, json: { error: { message: 'panne simulée' } } });
  const ms2 = await measure('Pensée pendant une panne du proxy');
  const idFail = await idOf(page, 'Pensée pendant une panne du proxy');
  await page.waitForFunction(i => !!_rangeFailed[i], idFail, { timeout: 15000 });
  const failTxt = await item(page, idFail).locator('.rg-wait').textContent();
  // Réseau revenu, une minute plus tard (pas deux essais dans la même minute) : nouvel essai, réussi cette fois
  fk.proxy = filingReply(ATLAS);
  await page.clock.fastForward('01:05');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFiled(page, idFail).catch(() => {});
  const retried = await page.evaluate(i => !!rangeIndex().ai[i], idFail);
  ok(ms1 < 100 && ms2 < 100 && busy >= 1 && failTxt === 'À ranger plus tard' && retried,
     'Dépôt instantané avec un proxy lent (5 s) ou en panne ; nouvel essai réussi ensuite',
     `${ms1.toFixed(1)} ms et ${ms2.toFixed(1)} ms ; « ARC range… » vu : ${busy >= 1} ; échec : « ${failTxt} » ; rangée au nouvel essai : ${retried}`);
  await ctx.close();
}

/* 2. Un rangement reçu s'affiche (espace, étape, moment, gardé pour après) ; demandé une seule fois */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  const T = 'Recaler Atlas : immatriculation demain 9 h, relire les pages légales';
  await deposit(page, T);
  const id = await idOf(page, T);
  await waitFiled(page, id);
  const note = await page.textContent('#depot-note');
  await page.click('#depot-open');
  const it = item(page, id);
  const r = { pill: await it.locator('.rg-pill').first().textContent(), step: await it.locator('.rg-step').textContent(),
              moment: await it.locator('.rg-moment').textContent(), extras: await it.locator('.rg-extras li').allTextContents() };
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1200);
  const calls = fk.log.proxyCalls.filter(b => b.task === 'file' && b.thought.id === id).length;
  const sentBody = fk.log.proxyCalls.find(b => b.task === 'file');
  const spacesOk = sentBody && sentBody.spaces.length === 7 && sentBody.spaces.map(s => s.key).join(',') === 'aryan,fba,kitchen,teleneuf,atlas,sante,juridique'
    && sentBody.spaces.filter(s => /^Endormi/.test(s.note)).map(s => s.key).join(',') === 'fba,kitchen,teleneuf' && sentBody.spaces.every(s => s.note.length <= 200);
  ok(r.pill === 'ATLAS' && r.step === ATLAS.step && /^Demain · 09:00$/.test(r.moment) && r.extras[0] === 'Relire les pages légales'
     && /Rangé dans ATLAS/.test(note) && calls === 1 && spacesOk && [...fk.db.filings.values()].filter(f => f.origin === 'ai').length === 1,
     'Un rangement reçu s\'affiche avec espace, étape, moment ; demandé une seule fois',
     `pastille ${r.pill}, moment « ${r.moment} », message « ${note.trim()} », appels au proxy : ${calls}, espaces envoyés conformes : ${spacesOk}`);
  await ctx.close();
}

/* 3. « ARC hésite » propose les espaces ; un geste range */
{
  const fk = fakeSupabase();
  fk.proxy = filingReply({ space: 'inconnu', confidence: 'unsure', step: 'Noter l\'idée de partenariat', moment: { type: 'none' }, extras: [] });
  const { ctx, page } = await open({ fk });
  const T = 'Idée de partenariat avec la boulangerie';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  await page.click('#depot-open');
  const hes = await item(page, id).locator('.rg-hesite').count();
  const chips = await item(page, id).locator('.rg-chip').count();
  await item(page, id).locator('.rg-chip', { hasText: 'ARYAN' }).click();
  const l = await latestOf(page, id);
  ok(hes === 1 && chips === 7 && l.space === 'aryan' && l.status === 'filed' && l.origin === 'user',
     '« ARC hésite » propose les sept espaces ; un geste range', `espaces proposés : ${chips}, après le geste : ${l.space} / ${l.status}`);
  await ctx.close();
}

/* 4. Chaque correction crée une nouvelle ligne ; la plus récente s'affiche après rechargement */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  const T = 'Pensée à corriger';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  await page.click('#depot-open');
  await btn(page, id, 'Changer d\'espace').click();
  await item(page, id).locator('.rg-chip', { hasText: 'KITCHEN' }).click();
  await btn(page, id, 'Modifier l\'étape').click();
  await item(page, id).locator('.rg-input').fill('Appeler le fournisseur de barquettes');
  await btn(page, id, 'Enregistrer').click();
  await btn(page, id, 'Changer le moment').click();
  await btn(page, id, 'Une situation…').click();
  await item(page, id).locator('.rg-input').fill('en ouvrant le Mac');
  await btn(page, id, 'Valider').click();
  await page.waitForTimeout(800);
  const rows = [...fk.db.filings.values()].filter(f => f.thought_id === id);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1200);
  await page.click('#depot-open');
  const shown = { pill: await item(page, id).locator('.rg-pill').first().textContent(), step: await item(page, id).locator('.rg-step').textContent(),
                  moment: await item(page, id).locator('.rg-moment').textContent() };
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('arc_filings_v1')).stats);
  ok(rows.length === 4 && rows.filter(r => r.origin === 'user').length === 3 && shown.pill === 'KITCHEN'
     && shown.step === 'Appeler le fournisseur de barquettes' && shown.moment === 'en ouvrant le Mac' && stats.proposed === 1 && stats.corrected === 1,
     'Chaque correction est une nouvelle ligne ; la plus récente s\'affiche après rechargement',
     `lignes en base : ${rows.length} (dont ${rows.filter(r => r.origin === 'user').length} de Rayan) ; affiché : ${shown.pill}, « ${shown.step} », « ${shown.moment} » ; mesures : ${stats.proposed} proposé, ${stats.corrected} corrigé`);
  await ctx.close();
}

/* 5. Annuler le dépôt, puis rétablir */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  const T = 'Pensée annulée puis rétablie';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  await page.click('#depot-open');
  await btn(page, id, 'Annuler le dépôt').click();
  const inCancelled = await page.locator('.depot-cancelled [data-id="' + id + '"]').count();
  const inMain = await page.locator('#depot-list > [data-id="' + id + '"]').count();
  await page.locator('.depot-cancelled summary').click();
  await page.locator('.depot-cancelled [data-id="' + id + '"] button', { hasText: 'Rétablir' }).click();
  await page.waitForTimeout(500);
  const back = await page.locator('#depot-list > [data-id="' + id + '"]').count();
  const statuses = [...fk.db.filings.values()].filter(f => f.thought_id === id).sort((a, b) => a.created_at < b.created_at ? -1 : 1).map(f => f.status);
  const stillThere = fk.db.thoughts.has(id);
  ok(inCancelled === 1 && inMain === 0 && back === 1 && statuses.join(',') === 'filed,cancelled,filed' && stillThere,
     'Annuler puis rétablir : rien n\'est effacé', `états successifs : ${statuses.join(' → ')}`);
  await ctx.close();
}

/* 6. « C'est fait » (depuis « Déposé » : l'accueil n'a plus de liste d'étapes depuis le 10 octobre) retire l'étape du
      point du jour et se lit sur l'accueil */
{
  const fk = fakeSupabase(); fk.proxy = filingReply({ ...ATLAS, moment: { type: 'none' } });   // sans moment : dans le point du jour dès aujourd'hui
  const { ctx, page } = await open({ fk });
  const T = 'Pensée faite depuis Déposé';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  const dansMatin = () => page.evaluate(i => { matinShow('manual'); const n = document.querySelectorAll(`#matin-body .matin-row[data-id="${i}"]`).length; matinClose(); return n; }, id);
  const before = await dansMatin();
  await page.click('#depot-open'); await btn(page, id, 'C\'est fait').click(); await page.click('#depot-back');
  const after = await dansMatin();
  const home = await page.evaluate(() => ({ agenda: !!document.querySelector('#S1 #next-list, #S1 .next-item'), faits: document.getElementById('h-faits').textContent, n: document.getElementById('depot-n').textContent }));
  ok(before === 1 && after === 0 && !home.agenda && /1 étape faite aujourd/.test(home.faits) && home.n === '1' && (await latestOf(page, id)).status === 'done',
     '« C\'est fait » depuis « Déposé » retire l\'étape du point du jour ; l\'accueil le compte dans ses faits du jour, sans liste d\'étapes',
     `point du jour avant : ${before}, après : ${after} ; accueil : « ${home.faits} », ${home.n} pensée`);
  await ctx.close();
}

/* 7. Un rangement fait sur un appareil apparaît sur l'autre */
{
  const fk = fakeSupabase();
  const tid = '0b6f2c1e-9a1d-4c55-8f6e-3d2a1b0c9e87';
  fk.db.thoughts.set(tid, { id: tid, body: 'Déposée sur l\'iPhone', source: 'text', device: 'iphone', created_at: '2026-10-05T07:12:00.000Z', received_at: '2026-10-05T07:12:01.000Z', user_id: UID });
  fk.db.filings.set('f1', { id: 'f1', thought_id: tid, origin: 'ai', status: 'filed', space: 'aryan', step: 'Écrire aux deux boutiques pilotes', moment: { type: 'none' }, extras: [], model: 'm', created_at: '2026-10-05T07:12:05.000Z' });
  fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  await page.waitForTimeout(800);
  const home = await page.evaluate(i => { matinShow('manual'); const e = document.querySelector(`#matin-body .matin-row[data-id="${i}"] .matin-step`); matinClose(); return e ? e.textContent : null; }, tid);
  await page.click('#depot-open');
  const pill = await item(page, tid).locator('.rg-pill').first().textContent();
  const asked = fk.log.proxyCalls.filter(b => b.task === 'file' && b.thought.id === tid).length;
  ok(home === 'Écrire aux deux boutiques pilotes' && pill === 'ARYAN' && asked === 0,
     'Un rangement fait sur un appareil apparaît sur l\'autre', `point du jour : « ${home} », espace : ${pill}, redemandé au proxy : ${asked}`);
  await ctx.close();
}

/* 8. Deux onglets : un rangement de A apparaît dans B sans rechargement ; une correction faite dans A hors ligne
      n'est pas effacée par un enregistrement de B */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page: B } = await open({ fk });
  await B.click('#depot-open');
  const A = (await openPage(browser, URL0, { fk, ctx })).page;
  const T = 'Rangée dans A, vue dans B';
  await deposit(A, T); const id = await idOf(A, T); await waitFiled(A, id);
  await B.waitForTimeout(500);
  const seenInB = await item(B, id).locator('.rg-step').textContent().catch(() => null);
  // A hors ligne corrige, puis se ferme ; B enregistre ensuite une autre correction
  fk.mode = 'down';
  await A.evaluate(i => rangeAdd(i, { step: 'Correction faite dans A hors ligne' }, 'user'), id);
  const rowA = await A.evaluate(i => rangeIndex().latest[i].id, id);
  await A.close();
  await B.evaluate(() => { const t = depotList()[0]; rangeAdd(t.id, { status: 'done' }, 'user'); });
  const kept = await B.evaluate(r => !!JSON.parse(localStorage.getItem('arc_filings_v1')).filings[r], rowA);
  ok(seenInB === ATLAS.step && kept, 'Deux onglets : rangement visible dans B sans rechargement, correction de A gardée',
     `vu dans B : ${seenInB !== null}, correction de A gardée : ${kept}`);
  await ctx.close();
}

/* 9. Un texte d'IA contenant du HTML s'affiche comme du texte */
{
  const fk = fakeSupabase();
  fk.proxy = filingReply({ space: 'atlas', confidence: 'sure', step: '<img src=x onerror=alert(1)>', moment: { type: 'situation', text: '<b>gras</b>' }, extras: ['<script>alert(2)</script>'] });
  const { ctx, page } = await open({ fk });
  let dialog = false; page.on('dialog', d => { dialog = true; d.dismiss(); });
  await deposit(page, 'Pensée piégée'); const id = await idOf(page, 'Pensée piégée'); await waitFiled(page, id);
  await page.click('#depot-open'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => { matinShow('manual'); const r = { tags: document.querySelectorAll('#depot-list img, #depot-list b, #depot-list script, #matin-body img, #matin-body b, #h-echo img, #h-echo b').length,
    step: document.querySelector('#depot-list .rg-step').textContent, home: document.querySelector('#matin-body .matin-step').textContent }; matinClose(); return r; });
  ok(r.tags === 0 && r.step === '<img src=x onerror=alert(1)>' && r.home === r.step && !dialog,
     'Un texte d\'IA contenant du HTML s\'affiche comme du texte', `balises créées : ${r.tags}, alerte : ${dialog}`);
  await ctx.close();
}

/* 10. Les consignes Santé et Juridique ne contiennent plus « conseiller » */
{
  const fk = fakeSupabase();
  fk.proxy = async () => ({ status: 200, json: { content: [{ type: 'text', text: 'D\'accord.' }] } });
  const { ctx, page } = await open({ fk });
  await page.evaluate(() => enterPole('sante')); await page.waitForTimeout(200);
  await page.evaluate(() => santeCpSend('J\'ai mal au dos depuis trois jours, c\'est grave ?'));
  await page.evaluate(() => goHome()); await page.evaluate(() => enterPole('juridique')); await page.waitForTimeout(200);
  await page.evaluate(() => jurCpSend('Ai-je droit au chômage dans mon cas ?'));
  await page.waitForTimeout(800);
  const chats = fk.log.proxyCalls.filter(b => !b.task);
  const sys = chats.map(b => b.system || '');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ok(sys.length === 2 && sys.every(x => !/conseiller/i.test(x)) && /medecin/.test(sys[0]) && /avocat/.test(sys[1]) && /diagnostic/.test(sys[0]) && !/conseiller/i.test(html),
     'Consignes Santé et Juridique : plus de « conseiller », renvoi vers un médecin ou un avocat',
     `consignes envoyées : ${sys.length}, « conseiller » dans la page : ${/conseiller/i.test(html)}`);
  await ctx.close();
}

/* 11. iPhone et Mac : le poste de l'accueil lisible, aucune erreur, cinq mondes et deux pôles */
for (const vp of [{ n: 'iPhone 390×844', width: 390, height: 844 }, { n: 'Mac 1440×900', width: 1440, height: 900 }]) {
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page, errors } = await open({ fk, viewport: { width: vp.width, height: vp.height } });
  await deposit(page, 'Pensée pour l\'accueil'); const id = await idOf(page, 'Pensée pour l\'accueil'); await waitFiled(page, id);
  const home = await page.evaluate(() => {
    const box = document.getElementById('h-poste'); const r = box.getBoundingClientRect();
    const texts = [...box.querySelectorAll('*')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const minFont = Math.min(...texts.map(e => parseFloat(getComputedStyle(e).fontSize)));
    const minBtn = Math.min(...[...box.querySelectorAll('button')].filter(b => b.offsetParent).map(b => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width)));
    const mondes = document.getElementById('hgrid').getBoundingClientRect().top;
    return { shown: r.height > 0 && r.width > 0 && r.right <= innerWidth + 1, minFont, minBtn, above: r.bottom <= mondes };
  });
  ok(home.shown && home.minFont >= 12 && home.minBtn >= 44 && home.above, `${vp.n} : le poste visible, au-dessus des mondes, texte ≥ 12 px, cibles ≥ 44 px`,
     `police min ${home.minFont} px, cible min ${Math.round(home.minBtn)} px`);
  await page.click('#depot-open');
  const listMinBtn = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#depot-list button')].map(b => b.getBoundingClientRect().height)));
  await page.click('#depot-back');
  const worlds = await page.evaluate(() => { const r = []; for (let i = 0; i < 5; i++) { enterWorld(i); r.push(!document.getElementById('S2').classList.contains('off')); goHome(); } return r.every(Boolean); });
  const poles = await page.evaluate(() => ['sante', 'juridique'].every(p => { enterPole(p); const on = [...document.querySelectorAll('#S3,#S4')].some(s => !s.classList.contains('off')); goHome(); return on; }));
  ok(worlds && poles && listMinBtn >= 44, `${vp.n} : cinq mondes et deux pôles ouverts, boutons de la liste ≥ 44 px`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

const fail502 = async () => ({ status: 502, json: { error: { message: 'Rangement invalide : date du moment invalide', source: 'arc-proxy' } } });
const callsFor = (fk, id) => fk.log.proxyCalls.filter(b => b.task === 'file' && b.thought.id === id).length;
const kick = page => page.evaluate(() => { window.dispatchEvent(new Event('online')); return rangeRun(); });

/* 13. Essais bornés : 502 à chaque fois → 3 essais au plus, espacés d'une minute, gardés sur l'appareil ;
       ensuite « À ranger à la main » avec les espaces et « Réessayer » */
{
  const fk = fakeSupabase(); fk.proxy = fail502;
  const { ctx, page } = await open({ fk, clock: true });
  const T = 'Pensée que le proxy refuse toujours';
  await deposit(page, T); const id = await idOf(page, T);
  await page.waitForTimeout(1200);
  const c1 = callsFor(fk, id);
  for (let i = 0; i < 4; i++) { await kick(page); await page.waitForTimeout(150); }
  const sameMinute = callsFor(fk, id);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1200);
  const afterReload = callsFor(fk, id);
  const counts = [];
  for (let i = 0; i < 4; i++) { await page.clock.fastForward('01:05'); await kick(page); await page.waitForTimeout(400); counts.push(callsFor(fk, id)); }
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1200); await kick(page); await page.waitForTimeout(300);
  const finalCalls = callsFor(fk, id);
  await page.click('#depot-open');
  const label = await item(page, id).locator('.rg-wait').textContent().catch(() => null);
  const chips = await item(page, id).locator('.rg-chip').count();
  await btn(page, id, 'Réessayer').click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500);
  const afterRetry = callsFor(fk, id);
  ok(c1 === 1 && sameMinute === 1 && afterReload === 1 && finalCalls === 3 && label === 'À ranger à la main' && chips === 7 && afterRetry === 4,
     'Essais bornés : 3 au plus, espacés, gardés après rechargement ; « À ranger à la main » puis « Réessayer »',
     `appels : ${c1} puis ${sameMinute} (même minute), ${afterReload} (rechargé), ${counts.join(' → ')} (une minute de plus à chaque fois), final ${finalCalls} ; « ${label} », ${chips} espaces ; après « Réessayer » : ${afterRetry}`);
  await ctx.close();
}

/* 14. Un 401 ou une coupure réseau ne comptent pas comme essais ; un 400 arrête tout de suite */
{
  const fk = fakeSupabase();
  fk.proxy = async () => ({ status: 401, json: { error: { message: 'Session invalide ou expirée', source: 'arc-proxy' } } });
  const { ctx, page } = await open({ fk, clock: true });
  const T = 'Pensée pendant une session expirée';
  await deposit(page, T); const id = await idOf(page, T); await page.waitForTimeout(800);
  for (let i = 0; i < 4; i++) { await kick(page); await page.waitForTimeout(200); }
  const n401 = callsFor(fk, id);
  fk.proxy = async () => ({ abort: true });
  for (let i = 0; i < 4; i++) { await kick(page); await page.waitForTimeout(200); }
  const nNet = callsFor(fk, id) - n401;
  fk.proxy = filingReply(ATLAS);
  await kick(page); await waitFiled(page, id).catch(() => {});
  const filed = await page.evaluate(i => !!rangeIndex().ai[i], id);
  // 400 : la demande ne passera jamais, arrêt immédiat
  fk.proxy = async () => ({ status: 400, json: { error: { message: 'Pensée trop longue', source: 'arc-proxy' } } });
  const T2 = 'Pensée refusée en 400';
  await deposit(page, T2); const id2 = await idOf(page, T2); await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { await page.clock.fastForward('01:05'); await kick(page); await page.waitForTimeout(200); }
  const n400 = callsFor(fk, id2);
  await page.click('#depot-open');
  const label = await item(page, id2).locator('.rg-wait').textContent().catch(() => null);
  ok(n401 >= 4 && nNet >= 4 && filed && n400 === 1 && label === 'À ranger à la main',
     '401 et coupure réseau ne comptent pas ; un 400 arrête tout de suite',
     `essais en 401 : ${n401}, en coupure : ${nNet}, rangée ensuite : ${filed} ; appels en 400 : ${n400}, « ${label} »`);
  await ctx.close();
}

/* 15. Rangements : une ligne refusée ne bloque pas le lot ; refusée = marquée, plus renvoyée, gardée ;
       une panne passagère se réessaie */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  await deposit(page, 'Première pensée'); await deposit(page, 'Seconde pensée');
  const a = await idOf(page, 'Première pensée'), b = await idOf(page, 'Seconde pensée');
  await waitFiled(page, a); await waitFiled(page, b); await page.waitForTimeout(500);
  fk.transient.thought_filings = 1;   // la première tentative tombe sur un 503
  const ids = await page.evaluate(([a, b]) => {
    const ghost = depotUUID();   // pensée absente du serveur
    const mk = (tid, st) => { const r = { id: depotUUID(), thought_id: tid, origin: 'user', status: st, space: 'aryan', step: 'x', moment: { type: 'none' }, extras: [], model: null, created_at: new Date(Date.now() + 1000).toISOString(), sync: 'pending' }; _range.filings[r.id] = r; return r.id; };
    const x = mk(ghost, 'done'), y = mk(a, 'done'), z = mk(b, 'done'); rangeSave(); return { x, y, z };
  }, [a, b]);
  await page.evaluate(() => rangeRun());
  const afterTransient = { y: fk.db.filings.has(ids.y), x: await page.evaluate(i => _range.filings[i].sync, ids.x) };
  await kick(page); await page.waitForTimeout(800);
  const st = await page.evaluate(i => JSON.parse(localStorage.getItem('arc_filings_v1')).filings[i], ids.x);
  const postsX = fk.log.posts.filter(p => p.ids.includes(ids.x)).length;
  await kick(page); await page.waitForTimeout(500);
  const postsXlater = fk.log.posts.filter(p => p.ids.includes(ids.x)).length;
  ok(!afterTransient.y && afterTransient.x === 'pending' && fk.db.filings.has(ids.y) && fk.db.filings.has(ids.z) && st && st.sync === 'rejected' && postsXlater === postsX,
     'Rangements : une ligne refusée ne bloque pas les autres ; marquée, plus renvoyée ; 503 réessayé',
     `après le 503 : rien de refusé (${afterTransient.x}) ; ensuite : bonnes lignes reçues ${fk.db.filings.has(ids.y) && fk.db.filings.has(ids.z)}, ligne refusée « ${st && st.sync} », renvois après refus : ${postsXlater - postsX}`);
  await ctx.close();
}

/* 16. Pensées et événements : une ligne refusée ne bloque pas le lot ; la pensée refusée reste sur l'appareil, lisible */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  fk.reject.thoughts = r => r.body.includes('REFUSÉE') ? { status: 400, code: '23514' } : null;
  fk.reject.arc_events = r => r.kind === 'autre' ? { status: 400, code: '23514' } : null;
  const { ctx, page } = await open({ fk });
  fk.mode = 'down';
  await deposit(page, 'Bonne pensée 1'); await deposit(page, 'Pensée REFUSÉE par une contrainte'); await deposit(page, 'Bonne pensée 2');
  const evBad = await page.evaluate(() => { const id = depotUUID(); _depot.events[id] = { id, kind: 'autre', at: new Date().toISOString() }; depotSave(); return id; });
  const bad = await idOf(page, 'Pensée REFUSÉE par une contrainte');
  fk.mode = 'up';
  await page.evaluate(() => depotFlush()); await page.waitForTimeout(800);
  const goods = ['Bonne pensée 1', 'Bonne pensée 2'].every(t => [...fk.db.thoughts.values()].some(r => r.body === t));
  const deposits = [...fk.db.events.values()].filter(e => e.kind === 'deposit').length;
  const local = await page.evaluate(([i, e]) => { const d = JSON.parse(localStorage.getItem('arc_thoughts_v1')); return { t: d.thoughts[i], e: d.events[e] }; }, [bad, evBad]);
  const postsBad = fk.log.posts.filter(p => p.ids.includes(bad)).length;
  await page.evaluate(() => depotFlush()); await page.waitForTimeout(500);
  const postsBadLater = fk.log.posts.filter(p => p.ids.includes(bad)).length;
  await page.click('#depot-open');
  const shown = await page.evaluate(i => { const it = document.querySelector('#depot-list [data-id="' + i + '"]'); return it ? it.querySelector('.depot-state').textContent + ' | ' + it.querySelector('.depot-body').textContent : null; }, bad);
  ok(goods && deposits === 3 && local.t && local.t.status === 'rejected' && local.e && local.e.rejected === true && postsBadLater === postsBad && /Refusée/.test(shown || '') && /REFUSÉE/.test(shown || ''),
     'Pensées et événements : une ligne refusée ne bloque pas le lot ; la pensée refusée reste lisible et n\'est plus renvoyée',
     `bonnes pensées reçues : ${goods}, dépôts reçus : ${deposits}, pensée refusée : « ${local.t && local.t.status} », événement refusé : ${local.e && local.e.rejected}, renvois : ${postsBadLater - postsBad}, affiché : « ${shown} »`);
  await ctx.close();
}

/* 17. Une correction faite sur une pensée « en attente » n'est envoyée qu'après la pensée elle-même */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  fk.mode = 'down';
  const T = 'Pensée annulée avant d\'être envoyée';
  await deposit(page, T); const id = await idOf(page, T); await page.waitForTimeout(300);
  await page.click('#depot-open');
  await btn(page, id, 'Annuler le dépôt').click(); await page.waitForTimeout(300);
  const postedWhileDown = fk.log.posts.filter(p => p.table === 'thought_filings' && p.thoughtIds.includes(id)).length;
  fk.mode = 'up';
  await page.evaluate(() => depotFlush()); await page.waitForTimeout(1000);
  const iT = fk.log.posts.findIndex(p => p.table === 'thoughts' && p.ids.includes(id));
  const iF = fk.log.posts.findIndex(p => p.table === 'thought_filings' && p.thoughtIds.includes(id));
  const row = [...fk.db.filings.values()].find(f => f.thought_id === id);
  const askedAI = callsFor(fk, id);
  ok(postedWhileDown === 0 && iT !== -1 && iF > iT && row && row.status === 'cancelled' && askedAI === 0,
     'Une correction sur une pensée en attente part après la pensée',
     `ordre : pensée n° ${iT}, correction n° ${iF} ; ligne reçue : ${row && row.status} ; rangement demandé à l'IA pour une pensée annulée : ${askedAI}`);
  await ctx.close();
}

/* 18. Rangée sans étape : une note dans son espace, avec « Ajouter une étape » ; rien dans le point du jour */
{
  const fk = fakeSupabase();
  fk.proxy = filingReply({ space: 'aryan', confidence: 'sure', step: '', moment: { type: 'none' }, extras: [] });
  const { ctx, page } = await open({ fk });
  await deposit(page, 'dg'); const id = await idOf(page, 'dg'); await waitFiled(page, id);
  const inNext = await page.evaluate(i => { matinShow('manual'); const n = document.querySelectorAll(`#matin-body .matin-row[data-id="${i}"]`).length; matinClose(); return n; }, id);
  await page.click('#depot-open');
  const box = await item(page, id).locator('.rg-box').textContent();
  const add = await btn(page, id, 'Ajouter une étape').count();
  const pill = await item(page, id).locator('.rg-pill').first().textContent().catch(() => null);
  ok(inNext === 0 && /Note/.test(box) && add === 1 && pill === 'ARYAN' && !/Pas encore d'étape|À ranger/.test(box),
     'Rangée sans étape : une note dans son espace, « Ajouter une étape », absente du point du jour',
     `dans le point du jour : ${inNext}, espace : ${pill}, bloc : « ${box.replace(/\s+/g, ' ').slice(0, 80)} »`);
  await ctx.close();
}

/* 19. Le point du jour : seulement des actions réelles ; sur l'accueil, une ligne « N pensées à ranger » ouvre « Déposé » */
{
  const fk = fakeSupabase();
  let k = 0;
  const answers = [{ ...ATLAS, moment: { type: 'none' } }, { space: 'inconnu', confidence: 'unsure', step: 'Noter l\'idée', moment: { type: 'none' }, extras: [] },
                   { space: 'aryan', confidence: 'unsure', step: 'Voir avec la boulangerie', moment: { type: 'none' }, extras: [] }];
  fk.proxy = async () => ({ status: 200, json: { filing: answers[k++], model: 'm' } });
  const { ctx, page } = await open({ fk });
  for (const T of ['Action claire', 'Idée floue', 'Hésitation']) { await deposit(page, T); await waitFiled(page, await idOf(page, T)); }
  const steps = await page.evaluate(() => { matinShow('manual'); const t = [...document.querySelectorAll('#matin-body .matin-step')].map(e => e.textContent); matinClose(); return t; });
  const line = await page.textContent('#h-ranger').catch(() => null);
  const visible = await page.isVisible('#h-ranger');
  await page.click('#h-ranger', { timeout: 3000 }).catch(() => {});
  const opened = await page.evaluate(() => document.getElementById('depot-screen').classList.contains('open'));
  ok(steps.length === 1 && steps[0] === ATLAS.step && visible && /^2 pensées à ranger$/.test((line || '').trim()) && opened,
     'Point du jour : actions réelles seulement ; accueil : une ligne « N pensées à ranger » qui ouvre « Déposé »',
     `étapes : ${steps.join(' | ')} ; ligne : « ${line && line.trim()} » ; ouvre « Déposé » : ${opened}`);
  await ctx.close();
}

/* 20. Origine visible : « ARC propose » tant que la ligne la plus récente vient de l'IA, « Rangé » dès que Rayan a
       modifié quelque chose — dans « Déposé » et le point du matin (l'accueil n'a plus de liste d'étapes) */
{
  const fk = fakeSupabase(); fk.proxy = filingReply({ ...ATLAS, moment: { type: 'none' } });
  const { ctx, page } = await open({ fk });
  const T = 'Vérifier l\'immatriculation';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  const labels = () => page.evaluate(i => {
    const lbl = sel => { const e = document.querySelector(sel); return e ? e.textContent : null; };
    if (typeof matinShow === 'function') matinShow('manual');
    const r = { depose: lbl(`#depot-list [data-id="${i}"] .rg-box .rg-lbl`), matin: lbl(`#matin-body .matin-row[data-id="${i}"] .rg-lbl`) };
    if (typeof matinClose === 'function') matinClose();
    return r;
  }, id);
  await page.click('#depot-open'); await page.click('#depot-back');
  const before = await labels();
  // Rayan fixe le moment (bouton « Ce soir ») : ce n'est plus une proposition d'ARC
  await page.evaluate(i => rangeAdd(i, { moment: rangeTonight() }, 'user'), id);
  const after = await labels();
  const ok1 = Object.values(before).every(v => v === 'ARC propose');
  const ok2 = Object.values(after).every(v => v === 'Rangé');
  ok(ok1 && ok2, 'Origine visible : « ARC propose » pour l\'IA, « Rangé » dès que Rayan modifie (Déposé, point du matin)',
     `avant : ${JSON.stringify(before)} ; après : ${JSON.stringify(after)}`);
  await ctx.close();
}

/* 12. Balisage */
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const o = (html.match(/<div/g) || []).length, c = (html.match(/<\/div>/g) || []).length;
  ok(o === c, '<div égale </div>', `${o} / ${c}`);
}

await browser.close();
server.close();
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed} / ${results.length} réussis`);
process.exit(failed ? 1 : 0);
