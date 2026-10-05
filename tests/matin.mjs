// Tests du point du matin (chantier 4), horloge contrôlée, fuseau Europe/Paris, sans session (tout est local).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/matin.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium, ROOT, startServer, openPage } from './outils.mjs';

const { server, url: URL0 } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });

// Mardi 6 octobre 2026, 7 h 30 à Paris
const DAY = '2026-10-06', T0 = `${DAY}T07:30:00+02:00`;
const open = (opts = {}) => openPage(browser, URL0, { session: false, clock: T0, keepMatin: true, ...opts });
const isOpen = page => page.evaluate(() => document.getElementById('matin-screen').classList.contains('open'));
const reload = async page => {
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
  if (await page.isVisible('#auth-screen')) await page.click('#auth-skip');
};
// Pensées et rangements locaux : { body, step, space, moment, status, created }
const seed = (page, items) => page.evaluate(items => {
  const ids = {};
  items.forEach((it, i) => {
    const id = depotUUID();
    _depot.thoughts[id] = { id, body: it.body, source: 'text', device: 'mac', created_at: it.created || new Date(Date.UTC(2026, 9, 1, 8, i)).toISOString(), status: 'pending' };
    depotSave();
    if (it.step !== undefined || it.status) rangeAdd(id, { status: it.status || 'filed', space: it.space || 'atlas', step: it.step || null, moment: it.moment || { type: 'none' }, extras: [] }, 'ai', 'm');
    ids[it.body] = id;
  });
  return ids;
}, items);
const latest = (page, id) => page.evaluate(i => { const f = rangeIndex().latest[i]; return { origin: f.origin, status: f.status, moment: f.moment }; }, id);
const localTime = iso => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* 1. Rien avant l'heure ; affiché une fois à la première ouverture après l'heure ; pas à la seconde ; rouvert à la demande */
let ids;
{
  const { ctx, page, errors } = await open();
  const before = await isOpen(page);
  ids = await seed(page, [
    { body: 'Appeler la comptable', step: 'Appeler la comptable pour la TVA', space: 'aryan', moment: { type: 'datetime', at: `${DAY}T14:00:00+02:00` } },
    { body: 'Envoyer la maquette', step: 'Envoyer la maquette à Karim', space: 'atlas', moment: { type: 'datetime', at: '2026-10-04T10:00:00+02:00' } },
    { body: 'Relire les CGV', step: 'Relire les CGV d\'Atlas', space: 'atlas' },
    { body: 'Sauvegarder', step: 'Lancer la sauvegarde du disque', space: 'aryan', moment: { type: 'situation', text: 'en ouvrant le Mac' } },
    { body: 'Plus tard dans la semaine', step: 'Préparer le pilote', space: 'aryan', moment: { type: 'datetime', at: '2026-10-08T10:00:00+02:00' } },
    { body: 'Idée floue', step: 'Noter l\'idée', space: 'inconnu', status: 'unsure' },
    { body: 'Pas encore rangée' },
  ]);
  await reload(page);
  const stillBefore = await isOpen(page);
  await page.clock.fastForward(35 * 60e3);   // 8 h 05
  await reload(page);
  const after = await isOpen(page);
  const view = await page.evaluate(() => {
    const t = s => [...document.querySelectorAll('#matin-body [data-sec="' + s + '"] .matin-step')].map(e => e.textContent);
    return { date: document.getElementById('matin-date').textContent, today: t('today'), replace: t('replace'), nomoment: t('nomoment'),
             todayWhen: [...document.querySelectorAll('#matin-body [data-sec="today"] .matin-when')].map(e => e.textContent),
             sit: [...document.querySelectorAll('#matin-body .matin-sit')].map(e => e.textContent),
             torange: (document.querySelector('#matin-body [data-sec="torange"] .matin-sec-s') || {}).textContent,
             all: document.getElementById('matin-view').textContent };
  });
  await page.click('#matin-close');
  await reload(page);
  const second = await isOpen(page);
  await page.click('#matin-open');
  const reopened = await isOpen(page);
  const day = await page.evaluate(d => JSON.parse(localStorage.getItem('arc_matin_v1')).days[d], DAY);
  ok(!before && !stillBefore, 'Rien avant l\'heure', `7 h 30 : ${before}, après rechargement : ${stillBefore}`);
  ok(after && !second && reopened, 'Affiché une fois à la première ouverture après l\'heure, pas à la seconde ; rouvert à la demande',
     `1re ouverture : ${after}, 2e : ${second}, depuis l'accueil : ${reopened}`);
  ok(view.today.join('|') === 'Appeler la comptable pour la TVA' && view.todayWhen[0] === '14:00',
     'Étape d\'aujourd\'hui, avec son heure', `« ${view.today.join(' | ')} » à ${view.todayWhen.join(', ')}`);
  ok(view.replace.join('|') === 'Envoyer la maquette à Karim' && /À replacer/.test(view.all) && !/retard/i.test(view.all),
     'Étape passée présentée « à replacer », sans le mot retard', `« ${view.replace.join(' | ')} »`);
  ok(view.nomoment.includes('Relire les CGV d\'Atlas') && view.nomoment.includes('Lancer la sauvegarde du disque') && view.sit.includes('Quand : en ouvrant le Mac')
     && !view.today.includes('Préparer le pilote') && !view.replace.includes('Préparer le pilote') && !view.nomoment.includes('Préparer le pilote'),
     'Sans moment et situation (ni due ni en retard) ; un moment des jours suivants n\'y est pas', `sans moment : ${view.nomoment.join(' | ')}`);
  ok(/2 pensées attendent un choix/.test(view.torange || ''), '« À ranger » compte les pensées qui attendent un choix', `« ${view.torange} »`);
  ok(/^Mardi 6 octobre$/.test(view.date) && !/\d+ jours?|série|bravo|félicit/i.test(view.all), 'Date, sans compteur de jours ni félicitation', `« ${view.date} »`);
  ok(day && day.shownAt && day.auto === true && day.opens === 2, 'Mesure sur l\'appareil : point vu, automatiquement, ouvert deux fois', JSON.stringify(day));

  /* 2. Actions : « Demain » et « Plus tard » créent la bonne ligne */
  const row = (kind, text) => page.locator(`#matin-body .matin-row[data-kind="${kind}"]`, { hasText: text }).first();
  await row('replace', 'Envoyer la maquette').locator('button', { hasText: 'Demain' }).click();
  const a = await latest(page, ids['Envoyer la maquette']);
  await row('today', 'Appeler la comptable').locator('button', { hasText: 'Demain' }).click();
  const b = await latest(page, ids['Appeler la comptable']);
  await page.evaluate(() => { _matinAll = true; matinRender(); });
  await row('nomoment', 'Relire les CGV').locator('button', { hasText: 'C\'est fait' }).click();
  const c = await latest(page, ids['Relire les CGV']);
  // « Plus tard » : sur l'étape replacée demain (qui n'est plus dans le point), on teste sur une nouvelle étape du jour
  const id2 = (await seed(page, [{ body: 'Rappel 18 h', step: 'Rappeler Samir', space: 'kitchen', moment: { type: 'datetime', at: `${DAY}T18:00:00+02:00` } }]))['Rappel 18 h'];
  await page.evaluate(() => matinRender());
  await row('today', 'Rappeler Samir').locator('button', { hasText: 'Plus tard' }).click();
  const d = await latest(page, id2);
  ok(a.origin === 'user' && /^mer\. 7,? 09:00$/.test(localTime(a.moment.at)), '« Demain » sur une étape passée : demain 9 h, nouvelle ligne de Rayan', `${a.origin}, ${localTime(a.moment.at)}`);
  ok(b.origin === 'user' && /^mer\. 7,? 14:00$/.test(localTime(b.moment.at)), '« Demain » sur une étape à venir aujourd\'hui : demain même heure', localTime(b.moment.at));
  ok(d.origin === 'user' && d.moment.type === 'none' && c.status === 'done', '« Plus tard » retire le moment ; « C\'est fait » depuis le point', `${d.moment.type}, ${c.status}`);

  /* 3. Le dépôt reste possible pendant l'affichage */
  await page.fill('#depot-ta', 'Déposée pendant le point du matin');
  await page.click('#depot-send', { timeout: 3000 });
  const deposited = await page.evaluate(() => Object.values(_depot.thoughts).some(t => t.body === 'Déposée pendant le point du matin'));
  ok(deposited && await isOpen(page), 'Le dépôt reste possible pendant l\'affichage du point', `déposée : ${deposited}`);

  /* 4. Le lendemain, il revient */
  await page.click('#matin-close');
  await page.clock.fastForward(24 * 3600e3);
  await reload(page);
  ok(await isOpen(page), 'Le lendemain après l\'heure, le point revient');
  ok(errors.length === 0, 'Aucune erreur de console pendant ces essais', errors.join(' | '));
  await ctx.close();
}

/* 5. État vide ; sept lignes au plus, le reste derrière « Voir tout » */
{
  const { ctx, page } = await open({ clock: `${DAY}T08:10:00+02:00` });
  const empty = await page.evaluate(() => (document.querySelector('#matin-body .matin-empty') || {}).textContent);
  await page.click('#matin-close');
  await seed(page, Array.from({ length: 10 }, (_, i) => ({ body: 'Étape ' + i, step: 'Faire la chose ' + i, space: 'aryan', moment: { type: 'datetime', at: `${DAY}T${String(10 + i).padStart(2, '0')}:00:00+02:00` } })));
  await page.click('#matin-open');
  const shown = await page.locator('#matin-body .matin-row').count();
  await page.locator('#matin-body button', { hasText: 'Voir tout' }).click();
  const all = await page.locator('#matin-body .matin-row').count();
  ok(empty === 'Rien n\'attend aujourd\'hui. Dépose ce qui te vient.', 'État vide soigné', `« ${empty} »`);
  ok(shown === 7 && all === 10, 'Sept lignes au plus, le reste derrière « Voir tout »', `${shown} puis ${all}`);
  await ctx.close();
}

/* 6. Heure modifiée ; désactivé */
{
  const { ctx, page } = await open();
  const setHour = async (h, enabled = true) => {
    await page.click('#btn-menu'); await page.click('#btn-matin');
    await page.fill('#matin-hour', h);
    if ((await page.isChecked('#matin-enabled')) !== enabled) await page.click('#matin-enabled');
    await page.locator('#matin-settings button[type=submit]').click();
  };
  await setHour('09:00');
  await page.clock.fastForward(60 * 60e3);   // 8 h 30
  await reload(page);
  const at830 = await isOpen(page);
  await page.clock.fastForward(35 * 60e3);   // 9 h 05
  await reload(page);
  const at905 = await isOpen(page);
  await page.click('#matin-close');
  const label = await page.textContent('#btn-matin-lbl');
  await setHour('09:00', false);
  await page.clock.fastForward(24 * 3600e3);
  await reload(page);
  const disabledNextDay = await isOpen(page);
  const entry = await page.textContent('#matin-entry-n');
  ok(!at830 && at905 && label === 'Point du matin · 09 h 00', 'Heure modifiée à 9 h : rien à 8 h 30, affiché à 9 h 05', `8 h 30 : ${at830}, 9 h 05 : ${at905}, menu : « ${label} »`);
  ok(!disabledNextDay && entry === 'Désactivé', 'Désactivé : plus d\'affichage, l\'accueil le dit', `affiché : ${disabledNextDay}, accueil : « ${entry} »`);
  await ctx.close();
}

/* 7. iPhone et Mac : lisible, zones de 44 px, zone sûre ; aucune erreur ; cinq mondes et deux pôles */
for (const vp of [{ n: 'iPhone 390×844', width: 390, height: 844 }, { n: 'Mac 1440×900', width: 1440, height: 900 }]) {
  const { ctx, page, errors } = await open({ viewport: { width: vp.width, height: vp.height }, clock: `${DAY}T08:10:00+02:00` });
  await page.click('#matin-close');
  await seed(page, [
    { body: 'a', step: 'Appeler la comptable pour la TVA', space: 'aryan', moment: { type: 'datetime', at: `${DAY}T14:00:00+02:00` } },
    { body: 'b', step: 'Envoyer la maquette', space: 'atlas', moment: { type: 'datetime', at: '2026-10-04T10:00:00+02:00' } },
    { body: 'c', step: 'Relire les CGV', space: 'atlas' }, { body: 'd' } ]);
  await page.click('#matin-open');
  const m = await page.evaluate(() => {
    const sc = document.getElementById('matin-screen');
    const texts = [...sc.querySelectorAll('*')].filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const btns = [...sc.querySelectorAll('button')].filter(b => b.offsetParent);
    const go = document.getElementById('matin-close'); go.scrollIntoView({ block: 'end' });
    const goR = go.getBoundingClientRect(), bar = document.querySelector('.depot-pill').getBoundingClientRect();
    return { minFont: Math.min(...texts.map(e => parseFloat(getComputedStyle(e).fontSize))),
             minBtn: Math.min(...btns.map(b => b.getBoundingClientRect().height)),
             goVisible: goR.bottom <= bar.top + 1 && goR.top >= 0, cardFits: sc.querySelector('.matin-card').getBoundingClientRect().right <= innerWidth };
  });
  ok(m.minFont >= 13 && m.minBtn >= 44 && m.goVisible && m.cardFits, `${vp.n} : texte ≥ 13 px, zones ≥ 44 px, « C'est parti » au-dessus de la barre`,
     `police min ${m.minFont} px, zone min ${Math.round(m.minBtn)} px, bouton visible : ${m.goVisible}`);
  await page.click('#matin-close');
  const worlds = await page.evaluate(() => { const r = []; for (let i = 0; i < 5; i++) { enterWorld(i); r.push(!document.getElementById('S2').classList.contains('off')); goHome(); } return r.every(Boolean); });
  const poles = await page.evaluate(() => ['sante', 'juridique'].every(p => { enterPole(p); const on = [...document.querySelectorAll('#S3,#S4')].some(s => !s.classList.contains('off')); goHome(); return on; }));
  ok(worlds && poles, `${vp.n} : cinq mondes et deux pôles ouverts`);
  ok(errors.length === 0, `${vp.n} : aucune erreur de console`, errors.join(' | '));
  await ctx.close();
}

/* 8. Balisage */
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
