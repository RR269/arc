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
  const { ctx, page } = await open({ fk });
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
  // Réseau revenu : nouvel essai, réussi cette fois
  fk.proxy = filingReply(ATLAS);
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

/* 6. « C'est fait » retire l'étape de l'accueil */
{
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page } = await open({ fk });
  const T = 'Pensée faite depuis l\'accueil';
  await deposit(page, T); const id = await idOf(page, T); await waitFiled(page, id);
  const before = await page.locator(`#next-list [data-id="${id}"]`).count();
  await page.locator(`#next-list [data-id="${id}"] button`, { hasText: 'C\'est fait' }).click();
  const after = await page.locator(`#next-list [data-id="${id}"]`).count();
  const empty = await page.isVisible('#next-empty');
  ok(before === 1 && after === 0 && empty && (await latestOf(page, id)).status === 'done',
     '« C\'est fait » retire l\'étape de l\'accueil', `avant : ${before}, après : ${after}, état vide affiché : ${empty}`);
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
  const home = await page.locator(`#next-list [data-id="${tid}"] .next-step`).textContent().catch(() => null);
  await page.click('#depot-open');
  const pill = await item(page, tid).locator('.rg-pill').first().textContent();
  const asked = fk.log.proxyCalls.filter(b => b.task === 'file' && b.thought.id === tid).length;
  ok(home === 'Écrire aux deux boutiques pilotes' && pill === 'ARYAN' && asked === 0,
     'Un rangement fait sur un appareil apparaît sur l\'autre', `accueil : « ${home} », espace : ${pill}, redemandé au proxy : ${asked}`);
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
  const r = await page.evaluate(() => ({ tags: document.querySelectorAll('#depot-list img, #depot-list b, #depot-list script, #next-list img, #next-list b').length,
    step: document.querySelector('#depot-list .rg-step').textContent, home: document.querySelector('#next-list .next-step').textContent }));
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

/* 11. iPhone et Mac : bloc « Prochaines étapes » lisible, aucune erreur, cinq mondes et deux pôles */
for (const vp of [{ n: 'iPhone 390×844', width: 390, height: 844 }, { n: 'Mac 1440×900', width: 1440, height: 900 }]) {
  const fk = fakeSupabase(); fk.proxy = filingReply(ATLAS);
  const { ctx, page, errors } = await open({ fk, viewport: { width: vp.width, height: vp.height } });
  await deposit(page, 'Pensée pour l\'accueil'); const id = await idOf(page, 'Pensée pour l\'accueil'); await waitFiled(page, id);
  const home = await page.evaluate(() => {
    const box = document.getElementById('next-steps'); const r = box.getBoundingClientRect();
    const texts = [...box.querySelectorAll('*')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const minFont = Math.min(...texts.map(e => parseFloat(getComputedStyle(e).fontSize)));
    const minBtn = Math.min(...[...box.querySelectorAll('button')].map(b => Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width)));
    const mondes = document.getElementById('hgrid').getBoundingClientRect().top;
    return { shown: r.height > 0 && r.width > 0 && r.right <= innerWidth + 1, minFont, minBtn, above: r.bottom <= mondes };
  });
  ok(home.shown && home.minFont >= 12 && home.minBtn >= 44 && home.above, `${vp.n} : « Prochaines étapes » visible, au-dessus des mondes, texte ≥ 12 px, cibles ≥ 44 px`,
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
