// Tests de la synchronisation entre appareils (10 octobre) : fusion à trois, jamais d'écrasement.
// Deux « appareils » (Mac 1440 px, iPhone 390 px) sur le même compte, un faux Supabase avec une vraie ligne arc_data
// (tests/outils.mjs) : aucune requête ne part vers le vrai Supabase. Lancement : voir l'en-tête de tests/depot.mjs.
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/synchro.mjs

import { chromium, startServer, fakeSupabase, openPage } from './outils.mjs';

const { server, url } = await startServer();
const browser = await chromium.launch();
let fails = 0;
const ok = (c, msg, detail) => { if (c) console.log('OK   ' + msg); else { fails++; console.log('ÉCHEC ' + msg + (detail ? '\n     ' + detail : '')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Un appareil : sa page, et un interrupteur réseau qui ne coupe que lui
async function appareil(fk, iphone) {
  const dev = { down: false };
  const relais = { handler: route => (dev.down ? route.abort('internetdisconnected') : fk.handler(route)) };
  const o = await openPage(browser, url, { fk: relais, viewport: iphone ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  return Object.assign(dev, o);
}
// Attend la fin des échanges en cours (envoi différé de 1,5 s compris)
async function calme(...devs) {
  await wait(1900);
  for (const d of devs) for (let i = 0; i < 80 && await d.page.evaluate(() => _pushing); i++) await wait(50);
  await wait(150);
}
const ecrire = (d, fn, arg) => d.page.evaluate(([f, a]) => { (new Function('a', f))(a); saveS(); }, [fn, arg]);
const contient = (d, txt) => d.page.evaluate(t => JSON.stringify(S).includes(t), txt);
const enLigne = (fk, txt) => JSON.stringify(fk.arc && fk.arc.state).includes(txt);
const journal = "S.journal[0].push({ ts: Date.now(), t: a });";

async function deuxAppareils() {
  const fk = fakeSupabase();
  const mac = await appareil(fk, false); await calme(mac);
  const ip = await appareil(fk, true); await calme(ip);
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  return { fk, mac, ip };
}
const fermer = async (...devs) => { for (const d of devs) await d.ctx.close(); };
const erreurs = (...devs) => devs.flatMap(d => d.errors).filter(e => !/réseau|internetdisconnected|Failed to fetch/i.test(e));

/* 1. Le défaut prouvé le 10 octobre : l'iPhone écrit, puis le Mac (resté ouvert) écrit ; l'entrée de l'iPhone disparaissait */
{
  const { fk, mac, ip } = await deuxAppareils();
  await ecrire(ip, journal, 'ENTREE-IPHONE'); await calme(ip);
  await ecrire(mac, "var t = WORLDS[0].tasks_todo[0].id; S.taskNotes[0][t] = a;", 'NOTE-MAC'); await calme(mac);
  await ip.page.evaluate(() => pullFromCloud()); await calme(ip);
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  const r = [await contient(ip, 'ENTREE-IPHONE'), await contient(ip, 'NOTE-MAC'), await contient(mac, 'ENTREE-IPHONE'), await contient(mac, 'NOTE-MAC'),
             enLigne(fk, 'ENTREE-IPHONE'), enLigne(fk, 'NOTE-MAC')];
  ok(r.every(Boolean), 'Deux appareils écrivent l\'un après l\'autre : les deux écritures restent, sur les deux appareils et en ligne',
     `iPhone ${r[0]}/${r[1]}, Mac ${r[2]}/${r[3]}, en ligne ${r[4]}/${r[5]}`);
  ok(!erreurs(mac, ip).length, 'Aucune erreur de console pendant les échanges', erreurs(mac, ip).join(' | '));
  await fermer(mac, ip);
}

/* 2. iPhone hors réseau : il écrit ; le Mac écrit ; le réseau revient */
{
  const { fk, mac, ip } = await deuxAppareils();
  ip.down = true;
  await ecrire(ip, journal, 'ECRIT-HORS-LIGNE'); await calme(ip);
  // supabase-js réessaie une lecture plusieurs secondes avant d'abandonner (le navigateur ne se sait pas hors réseau ici)
  let lbl = '';
  for (let i = 0; i < 60 && !/Hors ligne/.test(lbl); i++) { await wait(250); lbl = await ip.page.evaluate(() => document.getElementById('sync-lbl').textContent); }
  await ecrire(mac, journal, 'ECRIT-SUR-LE-MAC'); await calme(mac);
  ip.down = false;
  await ip.page.evaluate(() => window.dispatchEvent(new Event('online'))); await calme(ip);
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  const r = [await contient(ip, 'ECRIT-HORS-LIGNE'), await contient(ip, 'ECRIT-SUR-LE-MAC'), await contient(mac, 'ECRIT-HORS-LIGNE'),
             enLigne(fk, 'ECRIT-HORS-LIGNE'), enLigne(fk, 'ECRIT-SUR-LE-MAC')];
  ok(r.every(Boolean) && /Hors ligne/.test(lbl), 'Écrit hors réseau sur l\'iPhone pendant que le Mac écrit : au retour du réseau, tout est gardé partout',
     `état hors réseau « ${lbl} », ${r.join(' ')}`);
  // Ordre du temps : l'entrée de l'iPhone (écrite d'abord) précède celle du Mac dans le journal
  const ordre = await mac.page.evaluate(() => S.journal[0].map(e => e.t).filter(t => /ECRIT-/.test(t)).join(','));
  ok(ordre === 'ECRIT-HORS-LIGNE,ECRIT-SUR-LE-MAC', 'Le journal fusionné reste dans l\'ordre où les entrées ont été écrites', ordre);
  await fermer(mac, ip);
}

/* 3. Une suppression d'un côté est appliquée, et ne revient pas */
{
  const { fk, mac, ip } = await deuxAppareils();
  await ecrire(mac, "S.custom[0].push({ id: 'cdel', t: a }); S.tasks[0].cdel = false;", 'TACHE-A-SUPPRIMER'); await calme(mac);
  await ip.page.evaluate(() => pullFromCloud()); await calme(ip);
  const avant = await contient(ip, 'TACHE-A-SUPPRIMER');
  await ecrire(mac, "S.custom[0] = S.custom[0].filter(function(x) { return x.id !== 'cdel'; }); delete S.tasks[0].cdel;", null); await calme(mac);
  await ecrire(ip, journal, 'AUTRE-CHOSE'); await calme(ip);
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  const r = [avant, !(await contient(ip, 'TACHE-A-SUPPRIMER')), !(await contient(mac, 'TACHE-A-SUPPRIMER')), !enLigne(fk, 'TACHE-A-SUPPRIMER'), enLigne(fk, 'AUTRE-CHOSE')];
  ok(r.every(Boolean), 'Une tâche supprimée sur le Mac disparaît aussi de l\'iPhone et ne revient pas quand l\'iPhone écrit autre chose', r.join(' '));
  await fermer(mac, ip);
}

/* 4. Le même texte changé sur les deux appareils : le plus récent l'emporte, l'autre est gardé sur l'appareil */
{
  const { fk, mac, ip } = await deuxAppareils();
  mac.down = true;
  await ecrire(mac, "S.notes[0] = a;", 'TEXTE-DU-MAC'); await calme(mac);
  await wait(1100);
  await ecrire(ip, "S.notes[0] = a;", 'TEXTE-DE-L-IPHONE'); await calme(ip);
  mac.down = false;
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  const garde = await mac.page.evaluate(() => S.notes[0]);
  const pertes = await mac.page.evaluate(() => localStorage.getItem('arc_sync_pertes_v1') || '');
  ok(garde === 'TEXTE-DE-L-IPHONE' && enLigne(fk, 'TEXTE-DE-L-IPHONE') && !enLigne(fk, 'TEXTE-DU-MAC') && pertes.includes('TEXTE-DU-MAC') && pertes.includes('notes.0'),
     'Même note changée des deux côtés : la plus récente est gardée partout, l\'autre reste sur l\'appareil (arc_sync_pertes_v1)', `gardé « ${garde} », pertes ${pertes.slice(0, 120)}`);
  await fermer(mac, ip);
}

/* 5. Deux écritures en même temps : l'écriture de l'iPhone arrive juste après celle du Mac */
{
  const { fk, mac, ip } = await deuxAppareils();
  let fait = false;
  fk.beforeArcWrite = async m => {
    if (fait || m !== 'PATCH') return; fait = true;
    // Le Mac écrit pendant que l'iPhone fusionne : la ligne en ligne change sous ses pieds
    const s = JSON.parse(JSON.stringify(fk.arc.state)); s.journal[0].push({ ts: Date.now(), t: 'ECRIT-ENTRE-DEUX' });
    fk.arc = { state: s, updated_at: new Date(Date.now() + 5).toISOString() };
  };
  await ecrire(ip, journal, 'ECRIT-PAR-L-IPHONE'); await calme(ip);
  fk.beforeArcWrite = null;
  ok(enLigne(fk, 'ECRIT-ENTRE-DEUX') && enLigne(fk, 'ECRIT-PAR-L-IPHONE') && await contient(ip, 'ECRIT-ENTRE-DEUX'),
     'Écriture conditionnelle : si la ligne change entre la lecture et l\'écriture, l\'iPhone relit et fusionne au lieu d\'écraser',
     `écritures : ${(fk.log.arcWrites || []).join(',')}`);
  await fermer(mac, ip);
}

/* 6. Ce qui est saisi pendant un échange n'est pas perdu */
{
  const { fk, mac, ip } = await deuxAppareils();
  let fait = false;
  fk.beforeArcWrite = async m => { if (fait) return; fait = true; await ip.page.evaluate(() => { S.journal[1].push({ ts: Date.now(), t: 'SAISI-PENDANT' }); saveS(); }); };
  await ecrire(ip, journal, 'AVANT-L-ECHANGE'); await calme(ip);
  fk.beforeArcWrite = null; await calme(ip);
  ok(await contient(ip, 'SAISI-PENDANT') && enLigne(fk, 'SAISI-PENDANT') && enLigne(fk, 'AVANT-L-ECHANGE'),
     'Une entrée écrite pendant un échange est gardée sur l\'appareil puis envoyée');
  await fermer(mac, ip);
}

/* 7. Rien à envoyer : aucune écriture ; un check-in fait le même jour sur les deux appareils ne compte qu'une fois */
{
  const { fk, mac, ip } = await deuxAppareils();
  const n0 = (fk.log.arcWrites || []).length;
  await mac.page.evaluate(() => pullFromCloud()); await ip.page.evaluate(() => pullFromCloud()); await calme(mac, ip);
  ok((fk.log.arcWrites || []).length === n0, 'Appareils déjà à jour : une lecture n\'écrit rien en ligne', `écritures avant ${n0}, après ${(fk.log.arcWrites || []).length}`);
  const ci = "S.poles.sante = S.poles.sante.filter(function(c) { return new Date(c.date).toDateString() !== new Date().toDateString(); }); S.poles.sante.push({ date: new Date().toISOString(), sommeil: a });";
  await ecrire(mac, ci, 6); await calme(mac);
  await wait(50);
  ip.down = true; await ecrire(ip, ci, 8); await calme(ip); ip.down = false;
  await ip.page.evaluate(() => pullFromCloud()); await calme(ip);
  await mac.page.evaluate(() => pullFromCloud()); await calme(mac);
  const s = await mac.page.evaluate(() => S.poles.sante.filter(c => new Date(c.date).toDateString() === new Date().toDateString()).map(c => c.sommeil));
  ok(s.length === 1 && s[0] === 8, 'Check-in du jour fait sur les deux appareils : un seul reste, le plus récent', JSON.stringify(s));
  await fermer(mac, ip);
}

/* 8. Premier appareil d'un compte sans ligne : il la crée, comme avant */
{
  const fk = fakeSupabase(); fk.arc = null;
  const mac = await appareil(fk, false);
  await mac.page.evaluate(async () => { if (document.getElementById('auth-screen').classList.contains('active')) await authMakeReference(); });
  await calme(mac);
  await ecrire(mac, journal, 'APRES-REFERENCE'); await calme(mac);
  ok(fk.arc && enLigne(fk, 'APRES-REFERENCE') && (fk.log.arcWrites || [])[0] === 'POST', 'Compte sans ligne : l\'appareil de référence la crée, puis ses écritures suivent',
     `écritures : ${(fk.log.arcWrites || []).join(',')}`);
  await fermer(mac);
}

await browser.close(); server.close();
console.log(fails ? `\n${fails} échec(s)` : '\nTout est vert.');
process.exit(fails ? 1 : 0);
