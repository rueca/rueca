/* Trompo's blank placeholder card — the empty slot, drawn as a sheet of paper.
   After Cargo's Blank placeholders (one hairline diagonal, binder punch holes, a tiny
   caption that names its own format), redrawn in Trompo's tokens:
   - the holes are real cut-outs, so whatever is behind the card shows through
   - holes and caption sit on the LONG edge, as on real punched paper:
     left for portrait and square, top for landscape
   - the caption is Geist Mono and states kind, ratio and orientation
   Used by brand/index.html (the board) and brand/tools/blank-card.mjs (files). */

export const BLANK_THEMES = {
  light: { card: '#E8E1D6', line: 'rgba(28,26,25,.13)', text: 'rgba(28,26,25,.48)' },
  dark:  { card: '#2A2724', line: 'rgba(246,241,234,.10)', text: 'rgba(246,241,234,.42)' },
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a)
export const ratioLabel = (w, h) => { const g = gcd(Math.round(w), Math.round(h)); return `${Math.round(w) / g}:${Math.round(h) / g}` }

/**
 * @param {object} o
 * @param {number} o.w            width in px (the SVG's own units)
 * @param {number} o.h            height in px
 * @param {'light'|'dark'} [o.theme]
 * @param {string} [o.kind]       what the slot will hold: image, video, avatar…
 * @param {string} [o.ratio]      override the computed ratio label (e.g. '16:9' for 1280×720)
 * @param {string} [o.brand]      no ® until the mark is actually registered (using ® unregistered is prohibited in the US)
 * @param {string} [o.font]       caption font stack
 * @returns {string} an <svg> string
 */
export function blankCard({ w, h, theme = 'light', kind = 'image', ratio, brand = 'Trompo', font = "'Geist Mono', ui-monospace, monospace" }) {
  const t = BLANK_THEMES[theme]
  const s = Math.min(w, h)
  const portrait = h >= w // holes on the long edge: left when portrait/square, top when landscape
  const orient = w === h ? 'square' : portrait ? 'vertical' : 'horizontal'
  const r = Math.max(3, s * 0.0185)   // hole radius   (Cargo: 8px on a 432px card)
  const inset = s * 0.083              // hole centre from the edge (Cargo: 36px)
  const len = portrait ? h : w
  const holes = [len * 0.25, len * 0.75].map((p) => (portrait ? [inset, p] : [p, inset]))
  // card with the holes cut out (even-odd: each circle punches through the rectangle)
  const circle = ([cx, cy]) => `M${(cx - r).toFixed(2)} ${cy.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`
  const body = `M0 0H${w}V${h}H0Z ${holes.map(circle).join(' ')}`
  const sw = Math.max(1, s * 0.0023)
  const fs = Math.max(7, s * 0.016)
  const lines = [`${brand} placeholder`, `${kind} — ${ratio ?? ratioLabel(w, h)} · ${orient}`]
  // caption: centred on the punched edge, between the holes; vertical (bottom-to-top) on the left edge
  const cap = lines.map((l, i) => `<tspan x="0" dy="${i === 0 ? 0 : fs * 1.35}">${l}</tspan>`).join('')
  const capBlockH = fs * 1.35
  const text = portrait
    ? `<text transform="translate(${(inset - capBlockH / 2 + fs * 0.35).toFixed(2)} ${(h / 2).toFixed(2)}) rotate(-90)" text-anchor="middle" font-family="${font}" font-size="${fs.toFixed(2)}" fill="${t.text}">${cap.replaceAll('x="0"', 'x="0"')}</text>`
    : `<text transform="translate(${(w / 2).toFixed(2)} ${(inset - capBlockH / 2 + fs * 0.35).toFixed(2)})" text-anchor="middle" font-family="${font}" font-size="${fs.toFixed(2)}" fill="${t.text}">${cap}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${lines.join(', ')}">` +
    `<path d="${body}" fill="${t.card}" fill-rule="evenodd"/>` +
    `<line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${t.line}" stroke-width="${sw.toFixed(2)}"/>` +
    text + `</svg>`
}
