// Mesure du contraste DANS L'IMAGE, commune aux tests d'écran (entree-fond.mjs, mondes.mjs). Sans dépendance.
//
// Pour chaque morceau de ligne de texte (32 px de large au plus), on compare la couleur du texte au pixel le plus
// clair du fond réellement affiché sous ce morceau (texte masqué ; dégradés, lueurs, verre et grain compris). C'est le
// cas le plus défavorable : un seul pixel clair sous une lettre fait échouer. La couleur du texte est celle que le
// navigateur applique ; pour un texte en dégradé ou dans un bloc à demi transparent, c'est le pixel le plus clair du
// morceau, lu dans l'image (fond décoratif masqué).

import zlib from 'node:zlib';

/* ── Lecture d'un PNG (8 bits, RVB ou RVBA, non entrelacé) ── */
export function png(buf) {
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
export function range(img, x0, y0, x1, y1) {
  let max = 0, min = 1;
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(img.w, Math.ceil(x1)); y1 = Math.min(img.h, Math.ceil(y1));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * img.bpp, L = 0.2126 * LIN[img.px[i]] + 0.7152 * LIN[img.px[i + 1]] + 0.0722 * LIN[img.px[i + 2]];
    if (L > max) max = L; if (L < min) min = L;
  }
  return { max, min, vide: x1 <= x0 || y1 <= y0 };
}

// Dans la page : les morceaux de texte visibles sous `racine`, en pixels CSS de la fenêtre.
// cadre : ne garder que ce qui est dans le rectangle de cet élément (zone qui défile) ; hors : écarter ce qui passe
// sous ces éléments (barres fixes posées par-dessus).
const morceaux = ({ racine, cadre, hors }) => {
  const scr = document.querySelector(racine), out = []; if (!scr) return out;
  const C = cadre ? document.querySelector(cadre).getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const box = { left: Math.max(0, C.left), top: Math.max(0, C.top), right: Math.min(innerWidth, C.right), bottom: Math.min(innerHeight, C.bottom) };
  const H = (hors || []).flatMap(s => [...document.querySelectorAll(s)]).filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
  const nom = el => { const c = el.closest('[class]'); return c ? '.' + String(c.className).split(' ')[0] : el.tagName.toLowerCase(); };
  // rgb(…) donne des valeurs de 0 à 255 ; color(srgb …), que le navigateur rend pour un color-mix(), de 0 à 1
  const lum = c => { const un = /^color\(/.test(c), m = c.replace(/^color\(srgb/, '').match(/[\d.]+/g).map(Number); if (m.length > 3 && m[3] < 1) return null; const f = v => { v = un ? v : v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const opacite = el => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const add = (r, n, t, L) => {
    if (r.width < 2 || r.height < 2 || r.bottom > box.bottom || r.top < box.top || r.right > box.right + 1 || r.left < box.left - 1) return;
    if (H.some(h => r.left < h.right && r.right > h.left && r.top < h.bottom && r.bottom > h.top)) return;
    const k = Math.max(1, Math.ceil(r.width / 32)), w = r.width / k;
    for (let i = 0; i < k; i++) out.push({ x0: r.left + i * w, x1: r.left + (i + 1) * w, y0: r.top, y1: r.bottom, n, t, L });
  };
  const tw = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
  for (let node; (node = tw.nextNode());) {
    const el = node.parentElement, txt = node.nodeValue.trim(); if (!txt || !el || el.closest('[aria-hidden="true"]')) continue;
    if (el.offsetParent === null || el.closest(':disabled')) continue;
    if (/^[\p{Extended_Pictographic}️\s]+$/u.test(txt)) continue;      // pictogramme seul : ce n'est pas du texte à lire
    const cs = getComputedStyle(el); if (parseFloat(cs.fontSize) === 0 || cs.visibility === 'hidden') continue;
    const op = opacite(el); if (op === 0) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const fill = cs.webkitTextFillColor || cs.color;
    const L = (op < 1 || /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '')) ? null : lum(fill);
    for (const r of range.getClientRects()) add(r, nom(el), txt.slice(0, 28), L);
  }
  for (const inp of scr.querySelectorAll('input, textarea')) {
    if (inp.offsetParent === null || inp.type === 'checkbox' || inp.type === 'range') continue;
    const b = inp.getBoundingClientRect(), cs = getComputedStyle(inp), pt = Math.min(10, parseFloat(cs.paddingTop) || 10);
    const hh = inp.tagName === 'TEXTAREA' ? Math.min(b.height - 2 * pt, parseFloat(cs.lineHeight) || 24) : b.height - 20;
    add(new DOMRect(b.left + parseFloat(cs.paddingLeft), b.top + (inp.tagName === 'TEXTAREA' ? parseFloat(cs.paddingTop) : 10), b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), hh), 'champ', inp.value || inp.placeholder, lum(inp.value ? cs.color : getComputedStyle(inp, '::placeholder').color));
  }
  return out;
};

// Mesure l'écran tel qu'il est défilé : renvoie le pire contraste, les morceaux sous le seuil et leur nombre.
// racine : sélecteur de l'écran ; masqueFond : CSS qui masque le décor (pour lire la couleur d'un texte en dégradé) ;
// masqueEnPlus : CSS ajouté au masque du texte ; cadre, hors : voir plus haut.
export async function mesurer(page, { racine, masqueFond = '', masqueEnPlus = '', cadre = null, hors = [], dsf = 2, seuil = 4.5 }) {
  const list = await page.evaluate(morceaux, { racine, cadre, hors });
  const masqueTexte = `${racine},${racine} *{color:transparent!important;-webkit-text-fill-color:transparent!important;caret-color:transparent!important;text-shadow:none!important}` +
    `${racine} ::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}` + masqueEnPlus;
  const a = await page.addStyleTag({ content: masqueTexte }); const fond = png(await page.screenshot());
  await a.evaluate(n => n.remove());
  const c = masqueFond ? await page.addStyleTag({ content: masqueFond }) : null; const texte = png(await page.screenshot());
  if (c) await c.evaluate(n => n.remove());
  let pire = { ratio: Infinity }, n = 0; const sous = [];
  for (const m of list) {
    const T = range(texte, m.x0 * dsf, m.y0 * dsf, m.x1 * dsf, m.y1 * dsf); if (T.vide) continue;
    if ((T.max + 0.05) / (T.min + 0.05) < 1.6) continue;                    // aucun trait de lettre dans ce morceau
    const F = range(fond, m.x0 * dsf, m.y0 * dsf, m.x1 * dsf, m.y1 * dsf);
    // texte clair sur fond sombre : le pire fond est son pixel le plus clair ; texte sombre sur fond clair : le plus sombre.
    // Sans couleur déclarée (dégradé, bloc à demi transparent), on lit le texte dans l'image : clair si le fond est sombre.
    const fg = m.L == null ? (F.max < 0.4 ? T.max : T.min) : m.L;
    const ratio = fg >= F.max ? (fg + 0.05) / (F.max + 0.05) : fg <= F.min ? (F.min + 0.05) / (fg + 0.05) : 1; n++;
    const item = { ratio, n: m.n, t: m.t, x: Math.round(m.x0), y: Math.round(m.y0) };
    if (ratio < pire.ratio) pire = item;
    if (ratio < seuil) sous.push(item);
  }
  return { pire, sous, n };
}
