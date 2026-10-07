// Tests du fond de l'écran d'entrée (correction de Rayan du 7 octobre : les six couleurs dans le fond, pas dans les lettres).
// Lancement depuis la racine du dépôt (voir tests/depot.mjs pour installer Playwright) :
//   NODE_PATH=/tmp/arc-outils/node_modules node tests/entree-fond.mjs
// Supabase est remplacé par de fausses réponses : aucune requête ne part vers le vrai projet.
//
// Le fond est MESURÉ DANS L'IMAGE : pour chaque morceau de ligne de texte (32 px de large au plus), on compare la
// couleur du texte au pixel le plus clair du fond réellement affiché sous ce morceau (texte masqué ; arcs, lueurs,
// verre de la carte et grain compris). C'est le cas le plus défavorable : un seul pixel d'arc sous une lettre fait
// échouer le test. La couleur du texte est celle que le navigateur applique ; pour le titre en dégradé, c'est le
// pixel le plus clair du morceau, lu dans l'image (fond masqué).
// Seuil : 4,5 : 1 pour tout texte, grand ou petit (règle de la charte de Rayan). Les boutons désactivés sont exclus.

import { chromium, startServer, SB } from './outils.mjs';
import { png, mesurer } from './mesure.mjs';

const SEUIL = 4.5;
const SIX = { vert: '#4FB82A', jaune: '#F2B108', orange: '#E97D00', rouge: '#DA0D23', violet: '#8B2694', cyan: '#008FC8' };
const ARC = ['rgb(255, 149, 0)', 'rgb(255, 45, 85)', 'rgb(175, 82, 222)'];   // dégradé du titre de l'accueil
const TAILLES = [[375, 812], [390, 844], [393, 852], [430, 932], [600, 960], [768, 1024], [844, 390], [900, 700], [1024, 768], [1280, 800], [1440, 900], [1920, 1200]];

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });

async function open(viewport, dsf = 2) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'reduce' });
  await ctx.route(SB + '/**', route => route.fulfill({ status: route.request().method() === 'GET' ? 200 : 201, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' }));
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForSelector('#auth-screen.active');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}

// Mesure du contraste dans l'image : outils communs (tests/mesure.mjs)
const MASQUE_TEXTE_EN_PLUS = '.auth-h1-gradient{background:none!important}';
const mesure = (page, dsf = 2) => mesurer(page, { racine: '#auth-screen', masqueFond: '.auth-glow{display:none!important}', masqueEnPlus: MASQUE_TEXTE_EN_PLUS, dsf, seuil: SEUIL });
const detail = {};
const note = (k, sous) => { if (!sous.length) return; const g = {}; for (const m of sous) { const e = g[m.n + ' « ' + m.t + ' »'] ||= { min: 9, nb: 0, pos: '' }; e.nb++; if (m.ratio < e.min) { e.min = m.ratio; e.pos = `x ${m.x}, y ${m.y}`; } } detail[k] = Object.entries(g).map(([n, e]) => `${e.min.toFixed(2)}  ${n}  (${e.nb} morceaux, pire en ${e.pos})`); };
const fmt = r => r.toFixed(2).replace('.', ',') + ' : 1';
const dit = m => `${fmt(m.ratio)} sur « ${m.t} » (${m.n}, x ${m.x}, y ${m.y})`;

/* 1. Le titre garde l'écriture d'ARC ; les six couleurs sont dans le fond, pas dans les lettres */
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  const s = await page.evaluate(() => {
    const g = getComputedStyle(document.querySelector('.auth-h1-gradient')), l = getComputedStyle(document.querySelector('.auth-h1-light'));
    const mondes = [...document.querySelectorAll('#auth-screen .auth-world')].filter(e => getComputedStyle(e).display !== 'none');
    const hex = e => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(e).getPropertyValue('--c').trim(); return c.fillStyle.toUpperCase(); };
    const textes = [...document.querySelectorAll('#auth-screen *')].filter(e => e.offsetParent !== null && !e.closest('[aria-hidden="true"]') && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()));
    return { grad: g.backgroundImage, light: l.color, couleurs: [...new Set(mondes.map(hex))], nb: mondes.length,
             styles: textes.map(e => { const c = getComputedStyle(e), clip = /text/.test(c.webkitBackgroundClip || c.backgroundClip || ''); return (c.color + ' ' + c.webkitTextFillColor + ' ' + (clip ? c.backgroundImage : '')).toLowerCase(); }).join(' | '),
             large: document.documentElement.scrollWidth <= innerWidth && document.getElementById('auth-screen').scrollWidth <= innerWidth,
             emoji: /\p{Extended_Pictographic}/u.test(document.getElementById('auth-screen').textContent) };
  });
  const rgb = h => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  ok(ARC.every(c => s.grad.includes(c)) && (s.grad.match(/rgb/g) || []).length === 3 && s.light === 'rgb(245, 245, 247)',
     'Titre : blanc, puis le dégradé d\'ARC orange → rose → violet, rien d\'autre', s.grad.slice(0, 90));
  ok(Object.values(SIX).every(h => !s.styles.includes(rgb(h))), 'Aucune des six couleurs dans la couleur d\'un texte');
  ok(Object.values(SIX).every(h => s.couleurs.includes(h)) && s.couleurs.length === 6, 'Les six couleurs de Rayan sont toutes dans le fond', `${s.nb} mondes affichés : ${s.couleurs.join(' ')}`);
  ok(s.large && !s.emoji && !errors.length, 'Aucun débordement horizontal, aucun emoji, aucune erreur de console', `erreurs ${errors.length}`);
  await ctx.close();
}

/* 1 bis. Pas de pavé (charte, règle 5) : sur téléphone, aucun texte de l'écran d'entrée ne dépasse 4 lignes, dans
       aucun état de la carte ; ce qu'ARC fait est une frise de trois étapes, pas un paragraphe */
{
  let pire = { n: 0, t: '' }, etapes = 0;
  for (const w of [375, 390]) {
    const { ctx, page } = await open({ width: w, height: 844 }, 1);
    for (const etat of ['auth-email', 'auth-code', 'auth-pass', 'auth-ref']) {
      await page.evaluate(e => { showAuthScreen(e); const r = document.getElementById('auth-ref-sum'); if (r) r.textContent = '5 mondes, 12 pensées.'; }, etat);
      await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const blocs = [...document.querySelectorAll('#auth-screen p, #auth-screen .auth-text, #auth-screen .auth-note, #auth-screen .auth-proof span, #auth-screen .auth-err')].filter(e => e.offsetParent !== null && e.textContent.trim());
        // un paragraphe s'arrête au premier retour à la ligne forcé : la ligne de chiffres qui le suit est une donnée, pas de la prose
        const lignes = e => { const g = document.createRange(), br = e.querySelector('br'); g.selectNodeContents(e); if (br) g.setEndBefore(br); return new Set([...g.getClientRects()].map(x => Math.round(x.top / 4))).size; };
        const l = blocs.map(e => ({ n: lignes(e), t: e.textContent.trim().slice(0, 36) })).sort((a, b) => b.n - a.n)[0] || { n: 0, t: '' };
        return { l, etapes: document.querySelectorAll('#auth-screen .auth-proof li').length };
      });
      if (r.l.n > pire.n) pire = r.l; etapes = r.etapes;
    }
    await ctx.close();
  }
  ok(pire.n > 0 && pire.n <= 4 && etapes === 3, 'Pas de pavé : aucun texte de plus de 4 lignes sur téléphone, trois étapes en frise', `le plus long : ${pire.n} lignes (« ${pire.t}… »)`);
}

/* 2. Contraste mesuré dans l'image, à chaque taille d'écran, en haut, au milieu et en bas du défilement */
for (const [w, h] of TAILLES) {
  const { ctx, page } = await open({ width: w, height: h });
  let pire = { ratio: Infinity }, sous = [], n = 0;
  const max = await page.evaluate(() => { const s = document.getElementById('auth-screen'); return s.scrollHeight - s.clientHeight; });
  for (const y of [...new Set([0, Math.round(max / 2), max])]) {
    await page.evaluate(v => document.getElementById('auth-screen').scrollTo(0, v), y); await page.waitForTimeout(120);
    const m = await mesure(page); n += m.n; sous.push(...m.sous); if (m.pire.ratio < pire.ratio) pire = m.pire;
  }
  note(`${w} × ${h}`, sous);
  ok(n > 40 && !sous.length, `Contraste ≥ 4,5 : 1 partout — ${w} × ${h}`, `${n} morceaux de texte mesurés, le plus faible : ${dit(pire)}${sous.length ? ' ; sous le seuil : ' + sous.slice(0, 4).map(dit).join(' ; ') : ''}`);
  await ctx.close();
}

/* 3. Les autres états de la carte gardent le même contraste (création de compte, code, mot de passe, premier appareil) */
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const { ctx, page } = await open({ width: w, height: h });
  let pire = { ratio: Infinity }, sous = [], n = 0;
  for (const etat of ['up', 'auth-code', 'auth-pass', 'auth-ref']) {
    await page.evaluate(e => {
      if (e === 'up') { showAuthScreen('auth-email'); authSetMode('up'); authErr('auth-email-err', 'Adresse ou mot de passe incorrect.'); }
      else { showAuthScreen(e); const t = document.getElementById('auth-code-to'); if (t) t.textContent = 'rayan@test.fr'; const r = document.getElementById('auth-ref-sum'); if (r) r.textContent = '5 mondes, 12 pensées.'; }
    }, etat);
    await page.waitForTimeout(450);
    const max = await page.evaluate(() => { const s = document.getElementById('auth-screen'); return s.scrollHeight - s.clientHeight; });
    for (const y of [...new Set([0, max])]) {
      await page.evaluate(v => document.getElementById('auth-screen').scrollTo(0, v), y); await page.waitForTimeout(120);
      const m = await mesure(page); n += m.n; sous.push(...m.sous.map(x => ({ ...x, t: etat + ' › ' + x.t }))); if (m.pire.ratio < pire.ratio) pire = { ...m.pire, t: etat + ' › ' + m.pire.t };
    }
  }
  note(`autres états ${w} × ${h}`, sous);
  ok(n > 60 && !sous.length, `Contraste ≥ 4,5 : 1 dans les autres états de la carte — ${w} × ${h}`, `${n} morceaux, le plus faible : ${dit(pire)}${sous.length ? ' ; sous le seuil : ' + sous.slice(0, 4).map(dit).join(' ; ') : ''}`);
  await ctx.close();
}

/* 4. Les horizons suivent la carte : à chaque largeur de téléphone et à chaque état, le premier arc passe juste
      au-dessus de la carte, sous la dernière ligne de texte ; le défilement s'arrête au contenu */
{
  const vus = []; let juste = true;
  for (const [w, h] of [[375, 667], [390, 844], [430, 932], [768, 1024]]) {
    const { ctx, page } = await open({ width: w, height: h }, 1);
    for (const etat of ['auth-email', 'auth-ref', 'auth-code']) {
      await page.evaluate(e => showAuthScreen(e), etat); await page.waitForTimeout(250);
      const g = await page.evaluate(() => {
        const s = document.getElementById('auth-screen'), fond = s.querySelector('.auth-glow').getBoundingClientRect(), c = s.querySelector('.auth-card').getBoundingClientRect();
        const liste = s.querySelector('.auth-proof').getBoundingClientRect(), cs = getComputedStyle(s);
        return { y: parseFloat(cs.getPropertyValue('--card-y')), h: parseFloat(cs.getPropertyValue('--card-h')), top: c.top - fond.top, haut: c.height, marge: c.top - liste.bottom,
                 fin: s.scrollHeight - Math.max(s.clientHeight, Math.round(s.querySelector('.auth-box').getBoundingClientRect().height) + 48) };
      });
      // l'arc violet culmine 22 px au-dessus de la carte : il lui faut plus de 22 px entre la liste et la carte
      const bon = Math.abs(g.y - g.top) <= 1 && Math.abs(g.h - g.haut) <= 1 && g.marge >= 30 && Math.abs(g.fin) <= 2;
      if (!bon) { juste = false; vus.push(`${w} px ${etat} : --card-y ${g.y} / carte ${Math.round(g.top)}, marge ${Math.round(g.marge)}, défilement en trop ${g.fin}`); }
    }
    await ctx.close();
  }
  ok(juste, 'Les horizons suivent la carte à chaque largeur et à chaque état, sans allonger le défilement', vus.join(' ; ') || '4 largeurs × 3 états');
}

/* 5. Le fond vit vraiment : chaque couleur éclaire l'écran, et le fond ne gêne ni le défilement ni le toucher */
{
  const { ctx, page } = await open({ width: 390, height: 844 }, 1);
  const st = await page.addStyleTag({ content: '.auth-box{visibility:hidden!important}' });
  const total = await page.evaluate(() => document.getElementById('auth-screen').scrollHeight);
  const vu = {}; let colores = 0, pixels = 0, noirs = 0;
  // Même teinte (à 14° près), vive et lumineuse : le bord d'un monde, pas une lueur éteinte
  const teinte = (r, g, b) => { const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (!d) return null; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (h * 60 + 360) % 360, s: d / M, v: M / 255 }; };
  const cible = Object.fromEntries(Object.entries(SIX).map(([k, hex]) => [k, teinte(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)).h]));
  const proche = (r, g, b, k) => { const t = teinte(r, g, b); if (!t || t.s < 0.5 || t.v < 0.6) return false; const e = Math.abs(t.h - cible[k]); return Math.min(e, 360 - e) <= 14; };
  for (let y = 0; y < total; y += 844) {
    await page.evaluate(v => document.getElementById('auth-screen').scrollTo(0, v), y); await page.waitForTimeout(80);
    const img = png(await page.screenshot());
    for (let i = 0; i < img.w * img.h; i++) {
      const r = img.px[i * img.bpp], g = img.px[i * img.bpp + 1], b = img.px[i * img.bpp + 2]; pixels++;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 14) colores++;
      if (Math.max(r, g, b) <= 6) noirs++;
      if (Math.max(r, g, b) > 150) for (const k in SIX) if (!vu[k] && proche(r, g, b, k)) vu[k] = true;
    }
  }
  await st.evaluate(n => n.remove());
  const part = Math.round(100 * colores / pixels);
  ok(Object.keys(SIX).every(k => vu[k]), 'Chaque couleur se voit à l\'écran, à pleine force, sur le bord d\'un monde', Object.keys(SIX).filter(k => vu[k]).join(', '));
  ok(part >= 30, 'Le fond n\'est plus un noir vide : au moins 30 % de l\'écran porte de la couleur', `${part} % des pixels`);
  // Le 7 octobre, sur l'iPhone de Rayan (Safari), un grain blanc posé en mix-blend-mode « overlay » n'était pas fusionné :
  // tout le noir devenait gris. Deux gardes : aucun mode de fusion sur cet écran, et le noir reste noir.
  const fusion = await page.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('#auth-screen, #auth-screen *')) for (const ps of [null, '::before', '::after']) {
      const m = getComputedStyle(e, ps).mixBlendMode; if (m && m !== 'normal') out.push((e.className || e.tagName) + (ps || '') + ' : ' + m);
    }
    return out;
  });
  const partNoir = Math.round(100 * noirs / pixels);
  ok(!fusion.length, 'Aucun mode de fusion sur l\'écran d\'entrée (Safari sur iPhone ne les applique pas ici)', fusion.join(' ; ') || 'aucun');
  ok(partNoir >= 8, 'Le noir reste noir : aucun voile sur le fond', `${partNoir} % de l'écran est noir franc`);
  const geste = await page.evaluate(() => {
    const s = document.getElementById('auth-screen'), b = document.getElementById('auth-go').getBoundingClientRect();
    s.scrollTo(0, 0); const dessus = document.elementFromPoint(innerWidth - 20, 20);
    return { fond: !!dessus && (dessus === s || !!dessus.closest('.auth-box') || getComputedStyle(dessus).pointerEvents !== 'none'), bouton: b.height, hauteur: s.scrollHeight,
             contenu: Math.round(document.querySelector('.auth-box').getBoundingClientRect().height) + 48 };
  });
  ok(geste.fond && geste.bouton >= 44 && Math.abs(geste.hauteur - geste.contenu) <= 2, 'Le fond ne prend aucun toucher et n\'allonge pas le défilement', `défilement ${geste.hauteur} px, contenu ${geste.contenu} px`);
  await ctx.close();
}

/* 6. Le cadran et le mouvement (demande de Rayan, 7 octobre 22 h 42) : l'horizon qui porte la carte est vert, le violet
      ferme le bas ; frise jaune poussin, orange, rouge ; carte sans capitales ni chasse fixe, champs à 17 px, curseur
      du sélecteur qui suit l'onglet, libellés flottants ; un mouvement qui s'arrête si l'appareil le demande. */
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 }, 1);
  const hue = (r, g, b) => { const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (!d) return -1; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const hueHex = hex => hue(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
  const ecart = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  const plusVif = (img, x, y0, y1) => { let best = [0, 0, 0]; for (let y = Math.max(0, y0); y < Math.min(img.h, y1); y++) { const i = (y * img.w + x) * img.bpp, c = [img.px[i], img.px[i + 1], img.px[i + 2]]; if (Math.max(...c) > Math.max(...best)) best = c; } return best; };
  const st = await page.addStyleTag({ content: '.auth-box{visibility:hidden!important}' });
  const carteY = await page.evaluate(() => Math.round(document.querySelector('.auth-card').getBoundingClientRect().top));
  const haut = plusVif(png(await page.screenshot()), 117, carteY - 40, carteY - 4);
  await page.evaluate(() => document.getElementById('auth-screen').scrollTo(0, 99999)); await page.waitForTimeout(120);
  const bas = plusVif(png(await page.screenshot()), 133, 844 - 150, 844 - 90);
  await st.evaluate(n => n.remove()); await page.evaluate(() => document.getElementById('auth-screen').scrollTo(0, 0));
  ok(ecart(hue(...haut), hueHex(SIX.vert)) <= 14 && Math.max(...haut) > 120 && ecart(hue(...bas), hueHex(SIX.violet)) <= 14 && Math.max(...bas) > 120,
     'L\'horizon qui porte la carte est vert, le violet ferme le bas', `au-dessus de la carte rgb(${haut}), en bas rgb(${bas})`);
  const cadran = await page.evaluate(() => {
    const cs = (e, ps) => getComputedStyle(e, ps), carte = document.querySelector('.auth-card');
    const points = [...document.querySelectorAll('.auth-proof li')].map(li => cs(li).getPropertyValue('--c').trim());
    const res = v => { const d = document.createElement('i'); d.style.color = v; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const textes = []; const tw = document.createTreeWalker(carte, NodeFilter.SHOW_TEXT);
    for (let nd; (nd = tw.nextNode());) { const e = nd.parentElement; if (!nd.nodeValue.trim() || e.offsetParent === null) continue; const c = cs(e); if (parseFloat(c.fontSize) === 0) continue; textes.push({ t: nd.nodeValue.trim().slice(0, 20), maj: c.textTransform, fixe: /mono/i.test(c.fontFamily), px: parseFloat(c.fontSize) }); }
    const champs = [...carte.querySelectorAll('.auth-field .auth-input')].filter(e => e.offsetParent !== null).map(e => parseFloat(cs(e).fontSize));
    const curseur = () => Math.round(new DOMMatrixReadOnly(cs(document.querySelector('.auth-tabs'), '::before').transform).m41);
    const avant = curseur(); authSetMode('up'); const apres = curseur(); authSetMode('in');
    const inp = document.getElementById('auth-email-inp'), lbl = inp.nextElementSibling; inp.blur();
    const repos = lbl.getBoundingClientRect().top; inp.value = 'a@b.fr'; const flotte = lbl.getBoundingClientRect().top; inp.value = '';
    return { points: points.map(res), attendu: ['#FFE066', '#E97D00', '#DA0D23'].map(res), maj: textes.filter(t => t.maj !== 'none').map(t => t.t), fixe: textes.filter(t => t.fixe).map(t => t.t),
             petits: textes.filter(t => t.px < 13).map(t => t.t), champs, avant, apres, largeur: Math.round(document.querySelector('.auth-tabs').getBoundingClientRect().width / 2), monte: Math.round(repos - flotte),
             police: cs(carte).fontFamily.split(',')[0].trim(), rayon: parseFloat(cs(carte).borderTopLeftRadius) };
  });
  ok(cadran.points.join() === cadran.attendu.join(), 'Frise : Penser en jaune poussin, Développer en orange, Entreprendre en rouge', cadran.points.join(' · '));
  ok(!cadran.maj.length && !cadran.fixe.length && !cadran.petits.length && cadran.champs.every(v => v >= 17) && /apple-system/.test(cadran.police),
     'Carte : police du système (San Francisco sur iPhone et Mac), ni capitales ni chasse fixe, aucun texte sous 13 px, champs à 17 px', `police ${cadran.police}, champs ${cadran.champs.join(' / ')} px${cadran.maj.length ? ', capitales : ' + cadran.maj.join(', ') : ''}${cadran.fixe.length ? ', chasse fixe : ' + cadran.fixe.join(', ') : ''}`);
  ok(cadran.avant === 0 && Math.abs(cadran.apres - cadran.largeur) <= 4 && cadran.monte >= 8, 'Sélecteur : le curseur suit l\'onglet ; champ rempli : le libellé monte au-dessus de la valeur', `curseur ${cadran.avant} → ${cadran.apres} px, libellé monté de ${cadran.monte} px`);
  const calme = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#auth-screen')).length);
  await ctx.close();
  // Avec le mouvement : il tourne, n'utilise que transform, opacity et la position d'un fond, et laisse l'écran dans son état final
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: 'Europe/Paris', locale: 'fr-FR', reducedMotion: 'no-preference' });
  await ctx2.route(SB + '/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' }));
  const p2 = await ctx2.newPage(); const err2 = []; p2.on('pageerror', e => err2.push(String(e.message)));
  await p2.goto(url); await p2.waitForSelector('#auth-screen.active'); await p2.waitForTimeout(3300);
  const vie = await p2.evaluate(() => {
    const scr = document.getElementById('auth-screen'), carte = scr.querySelector('.auth-card'), fond = scr.querySelector('.auth-glow');
    const anims = document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#auth-screen'));
    const props = new Set(); for (const sh of document.styleSheets) { let rules = []; try { rules = [...sh.cssRules]; } catch (e) {} for (const r of rules) if (r.type === CSSRule.KEYFRAMES_RULE && /^auth[A-Z]/.test(r.name)) for (const k of r.cssRules) for (const pr of k.style) props.add(pr); }
    return { enCours: anims.filter(a => a.playState === 'running').length, props: [...props].sort(),
             carte: getComputedStyle(carte).transform, opaque: getComputedStyle(carte).opacity === '1' && [...scr.querySelectorAll('.auth-world')].every(w => getComputedStyle(w).opacity === '1'),
             y: parseFloat(scr.style.getPropertyValue('--card-y')), vrai: Math.round(carte.getBoundingClientRect().top - fond.getBoundingClientRect().top) };
  });
  const permis = vie.props.every(pr => /^(opacity|transform|background-position(-x|-y)?)$/.test(pr));
  ok(calme === 0 && vie.enCours > 0 && permis && (vie.carte === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(vie.carte)) && vie.opaque && Math.abs(vie.y - vie.vrai) <= 1 && !errors.length && !err2.length,
     'Mouvement : il tourne, seulement en transform et opacity, laisse la carte et l\'horizon à leur place, et s\'arrête si l\'appareil demande moins d\'animations',
     `en cours ${vie.enCours} (0 en mode calme : ${calme}), propriétés animées : ${vie.props.join(', ')}, horizon ${vie.y} px pour une carte à ${vie.vrai} px`);
  await ctx2.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
