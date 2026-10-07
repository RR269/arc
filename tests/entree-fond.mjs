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

import zlib from 'node:zlib';
import { chromium, startServer, SB } from './outils.mjs';

const SEUIL = 4.5;
const SIX = { vert: '#4FB82A', jaune: '#F2B108', orange: '#E97D00', rouge: '#DA0D23', violet: '#8B2694', cyan: '#008FC8' };
const ARC = ['rgb(255, 149, 0)', 'rgb(255, 45, 85)', 'rgb(175, 82, 222)'];   // dégradé du titre de l'accueil
const TAILLES = [[375, 812], [390, 844], [393, 852], [430, 932], [600, 960], [768, 1024], [844, 390], [900, 700], [1024, 768], [1280, 800], [1440, 900], [1920, 1200]];

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = [];
const ok = (cond, name, detail = '') => results.push({ ok: !!cond, name, detail });

/* ── Lecture d'un PNG (8 bits, RVB ou RVBA, non entrelacé) sans dépendance ── */
function png(buf) {
  let p = 8, w = 0, h = 0, type = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('PNG non géré'); }
    if (t === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 0; if (!bpp) throw new Error('PNG non géré : type ' + type);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0, b = y ? px[dst + x - stride] : 0, c = (x >= bpp && y) ? px[dst + x - stride - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      px[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
const LIN = Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
// Luminance la plus claire et la plus sombre d'un rectangle (pixels de l'image)
function range(img, x0, y0, x1, y1) {
  let max = 0, min = 1;
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(img.w, Math.ceil(x1)); y1 = Math.min(img.h, Math.ceil(y1));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * img.bpp, L = 0.2126 * LIN[img.px[i]] + 0.7152 * LIN[img.px[i + 1]] + 0.0722 * LIN[img.px[i + 2]];
    if (L > max) max = L; if (L < min) min = L;
  }
  return { max, min, vide: x1 <= x0 || y1 <= y0 };
}

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

// Les morceaux de texte visibles de l'écran d'entrée, en pixels CSS de la fenêtre
const morceaux = () => {
  const scr = document.getElementById('auth-screen'), out = [], W = innerWidth, H = innerHeight;
  const nom = el => { const c = el.closest('[class]'); return c ? '.' + String(c.className).split(' ')[0] : el.tagName.toLowerCase(); };
  const lum = c => { const m = c.match(/[\d.]+/g).map(Number); if (m.length > 3 && m[3] < 1) return null; const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const add = (r, n, t, L) => {
    if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return;
    const k = Math.max(1, Math.ceil(r.width / 32)), w = r.width / k;
    for (let i = 0; i < k; i++) out.push({ x0: r.left + i * w, x1: r.left + (i + 1) * w, y0: r.top, y1: r.bottom, n, t, L });
  };
  const tw = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
  for (let node; (node = tw.nextNode());) {
    const el = node.parentElement; if (!node.nodeValue.trim() || !el || el.closest('[aria-hidden="true"]')) continue;
    if (el.offsetParent === null || el.closest(':disabled')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const cs = getComputedStyle(el), fill = cs.webkitTextFillColor || cs.color;
    const L = /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '') ? null : lum(fill);
    for (const r of range.getClientRects()) add(r, nom(el), node.nodeValue.trim().slice(0, 28), L);
  }
  for (const inp of scr.querySelectorAll('input')) {
    if (inp.offsetParent === null) continue;
    const b = inp.getBoundingClientRect(), cs = getComputedStyle(inp);
    add(new DOMRect(b.left + parseFloat(cs.paddingLeft), b.top + 10, b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), b.height - 20), 'champ', inp.value || inp.placeholder, lum(inp.value ? cs.color : getComputedStyle(inp, '::placeholder').color));
  }
  return out;
};
const MASQUE_TEXTE = '#auth-screen,#auth-screen *{color:transparent!important;-webkit-text-fill-color:transparent!important;caret-color:transparent!important;text-shadow:none!important}' +
  '#auth-screen ::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}.auth-h1-gradient{background:none!important}';
const MASQUE_FOND = '.auth-glow{display:none!important}';

// Mesure l'écran tel qu'il est défilé : renvoie le pire contraste et la liste des morceaux sous le seuil
async function mesure(page, dsf = 2) {
  const list = await page.evaluate(morceaux);
  const a = await page.addStyleTag({ content: MASQUE_TEXTE }); const fond = png(await page.screenshot());
  await a.evaluate(n => n.remove());
  const c = await page.addStyleTag({ content: MASQUE_FOND }); const texte = png(await page.screenshot());
  await c.evaluate(n => n.remove());
  let pire = { ratio: Infinity }, n = 0; const sous = [];
  for (const m of list) {
    const T = range(texte, m.x0 * dsf, m.y0 * dsf, m.x1 * dsf, m.y1 * dsf); if (T.vide) continue;
    if ((T.max + 0.05) / (T.min + 0.05) < 1.6) continue;                    // aucun trait de lettre dans ce morceau
    const F = range(fond, m.x0 * dsf, m.y0 * dsf, m.x1 * dsf, m.y1 * dsf);
    const ratio = ((m.L == null ? T.max : m.L) + 0.05) / (F.max + 0.05); n++;
    const item = { ratio, n: m.n, t: m.t, x: Math.round(m.x0), y: Math.round(m.y0) };
    if (ratio < pire.ratio) pire = item;
    if (ratio < SEUIL) sous.push(item);
  }
  return { pire, sous, n };
}
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
  const vu = {}; let colores = 0, pixels = 0;
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
      if (Math.max(r, g, b) > 150) for (const k in SIX) if (!vu[k] && proche(r, g, b, k)) vu[k] = true;
    }
  }
  await st.evaluate(n => n.remove());
  const part = Math.round(100 * colores / pixels);
  ok(Object.keys(SIX).every(k => vu[k]), 'Chaque couleur se voit à l\'écran, à pleine force, sur le bord d\'un monde', Object.keys(SIX).filter(k => vu[k]).join(', '));
  ok(part >= 30, 'Le fond n\'est plus un noir vide : au moins 30 % de l\'écran porte de la couleur', `${part} % des pixels`);
  const geste = await page.evaluate(() => {
    const s = document.getElementById('auth-screen'), b = document.getElementById('auth-go').getBoundingClientRect();
    s.scrollTo(0, 0); const dessus = document.elementFromPoint(innerWidth - 20, 20);
    return { fond: !!dessus && (dessus === s || !!dessus.closest('.auth-box') || getComputedStyle(dessus).pointerEvents !== 'none'), bouton: b.height, hauteur: s.scrollHeight,
             contenu: Math.round(document.querySelector('.auth-box').getBoundingClientRect().height) + 48 };
  });
  ok(geste.fond && geste.bouton >= 44 && Math.abs(geste.hauteur - geste.contenu) <= 2, 'Le fond ne prend aucun toucher et n\'allonge pas le défilement', `défilement ${geste.hauteur} px, contenu ${geste.contenu} px`);
  await ctx.close();
}

await browser.close(); server.close();
if (process.env.DETAIL) for (const [k, v] of Object.entries(detail)) console.log(k + '\n  ' + v.join('\n  '));
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'ÉCHEC'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
const good = results.filter(r => r.ok).length;
console.log(`\n${good} / ${results.length} réussis`);
process.exit(good === results.length ? 0 : 1);
