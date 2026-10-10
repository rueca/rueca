/* Trompo wire kit — "the harness, drawn", v2.
   Rules distilled from are.na + Cosmos (brand/BRAND.md, "Wire aesthetic v2"):
   1  One ink. Hierarchy by line weight only: hair (structure), thin (objects), mid (emphasis).
   2  Pink is the red pen: annotation only (dimensions, callouts, revision marks), never content.
   3  Real drafting conventions: extension lines, 45° ticks, values centred in a gap in the line.
   4  Every sheet is a document: border, sheet number, title block.
   5  Image = box with both diagonals. Text = bars on a baseline grid; the last line runs short.
   6  Everything snaps to the grid; labels are one size of Geist Mono, sentence case.
   All functions return SVG strings in px units. */

export const WIRE = {
  light: { paper: '#F6F1EA', ink: '#1C1A19', pen: '#D1006F', grain: 0.05 },
  dark:  { paper: '#1C1A19', ink: '#F6F1EA', pen: '#FF3EA5', grain: 0.04 },
}
const W = { hair: 0.75, thin: 1, mid: 1.6 }
const MONO = "'Geist Mono', ui-monospace, monospace"
const a = (o) => `stroke-opacity="${o}"`

export function wireKit(theme = 'light', { label = 9.5 } = {}) {
  const t = WIRE[theme]
  const text = (x, y, s, { anchor = 'start', color = t.ink, op = 0.62, size = label, weight = 400 } = {}) =>
    `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" font-weight="${weight}" fill="${color}" fill-opacity="${op}" text-anchor="${anchor}">${s}</text>`
  const line = (x1, y1, x2, y2, w = W.hair, op = 0.5, color = t.ink, extra = '') =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${a(op)} ${extra}/>`
  const rect = (x, y, w, h, sw = W.thin, op = 0.75, r = 0, fill = 'none', extra = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${t.ink}" stroke-width="${sw}" ${a(op)} ${extra}/>`

  const k = {
    t, text, line, rect,
    paper(w, h, id = 'wp') {
      return `<defs><filter id="${id}" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix values="0 0 0 0 ${theme === 'dark' ? 1 : 0}  0 0 0 0 ${theme === 'dark' ? 1 : 0}  0 0 0 0 ${theme === 'dark' ? 1 : 0}  0 0 0 ${t.grain} 0"/></filter></defs>` +
        `<rect width="${w}" height="${h}" fill="${t.paper}"/><rect width="${w}" height="${h}" filter="url(#${id})"/>`
    },
    /** dashed column guides */
    columns(x, y, w, h, n = 12, gutter = 24) {
      const cw = (w - gutter * (n - 1)) / n
      let s = ''
      for (let i = 0; i < n; i++) { const cx = x + i * (cw + gutter); s += `<rect x="${cx}" y="${y}" width="${cw}" height="${h}" fill="${t.ink}" fill-opacity=".018"/>` }
      return s
    },
    /** sheet border + title block (bottom right) */
    sheet(w, h, { m = 18, project = 'trompo', title = 'landing', sheetNo = '01', of = '04', scale = '1 : 1', date = '2026-10-10', drawn = 'rc' } = {}) {
      const cells = [['project', project], ['drawing', title], ['sheet', `${sheetNo} / ${of}`], ['scale', scale], ['date', date], ['drawn', drawn]]
      const cw = 92, ch = 26, tbW = cw * 3, tbH = ch * 2, x0 = w - m - tbW, y0 = h - m - tbH
      let tb = `<rect x="${x0}" y="${y0}" width="${tbW}" height="${tbH}" fill="${t.paper}"/>` + rect(x0, y0, tbW, tbH, W.thin, 0.7)
      cells.forEach(([k2, v], i) => {
        const cx = x0 + (i % 3) * cw, cy = y0 + Math.floor(i / 3) * ch
        if (i % 3) tb += line(cx, y0, cx, y0 + tbH, W.hair, 0.5)
        tb += text(cx + 7, cy + 10, k2, { size: 7, op: 0.42 }) + text(cx + 7, cy + 21, v, { size: 9, op: 0.85 })
      })
      tb += line(x0, y0 + ch, x0 + tbW, y0 + ch, W.hair, 0.5)
      // registration crosses at the corners, ruler ticks along the top and left
      let ticks = ''
      for (let x = m; x <= w - m; x += 10) ticks += line(x, m, x, m + ((x - m) % 100 === 0 ? 7 : (x - m) % 50 === 0 ? 5 : 3), W.hair, 0.35)
      for (let y = m; y <= h - m; y += 10) ticks += line(m, y, m + ((y - m) % 100 === 0 ? 7 : (y - m) % 50 === 0 ? 5 : 3), y, W.hair, 0.35)
      const cross = (cx, cy) => line(cx - 6, cy, cx + 6, cy, W.hair, 0.6) + line(cx, cy - 6, cx, cy + 6, W.hair, 0.6) + `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${t.ink}" stroke-width="${W.hair}" ${a(0.6)}/>`
      return rect(m, m, w - 2 * m, h - 2 * m, W.thin, 0.55) + ticks + cross(m / 2, m / 2) + cross(w - m / 2, m / 2) + cross(m / 2, h - m / 2) + tb
    },
    /** image placeholder: box with both diagonals and a centred label */
    image(x, y, w, h, lbl = 'image', r = 0) {
      const id = 'ic' + Math.round(x * 7 + y * 13 + w)
      return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>` +
        rect(x, y, w, h, W.thin, 0.7, r) +
        `<g clip-path="url(#${id})">${line(x, y, x + w, y + h, W.hair, 0.32)}${line(x + w, y, x, y + h, W.hair, 0.32)}</g>` +
        `<rect x="${x + w / 2 - lbl.length * 3.1 - 7}" y="${y + h / 2 - 9}" width="${lbl.length * 6.2 + 14}" height="18" fill="${t.paper}"/>` +
        text(x + w / 2, y + h / 2 + 3.4, lbl, { anchor: 'middle', op: 0.6 })
    },
    /** text as bars on a baseline grid; size = the type size the bars stand for */
    lines(x, y, w, n, size = 16, { weight = 'body', last = 0.58 } = {}) {
      const head = weight === 'head', lh = head ? size * 0.95 : size * 1.5, bh = head ? size * 0.72 : size * 0.38, rr = head ? Math.min(6, bh * 0.08) : bh / 2
      let s = ''
      for (let i = 0; i < n; i++) {
        const lw = i === n - 1 && n > 1 ? w * last : w * (head ? 1 : i % 3 === 1 ? 0.94 : 1)
        s += `<rect x="${x}" y="${y + i * lh + (lh - bh) / 2}" width="${lw}" height="${bh}" rx="${rr}" fill="${t.ink}" fill-opacity="${head ? 0.86 : 0.16}"/>`
      }
      return s
    },
    button(x, y, w, h, lbl, { primary = false } = {}) {
      return (primary ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.ink}"/>` : rect(x, y, w, h, W.thin, 0.75, h / 2)) +
        text(x + w / 2, y + h / 2 + 3.4, lbl, { anchor: 'middle', color: primary ? t.paper : t.ink, op: primary ? 1 : 0.75 })
    },
    /** drafting dimension: extension lines, 45° ticks, value in a gap. side: offset direction (px) */
    dim(x1, y1, x2, y2, value, offset = 14) {
      const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1)
      const P = t.pen
      let s = ''
      if (horiz) {
        const yy = y1 + offset
        s += line(x1, y1 + Math.sign(offset) * 2, x1, yy + Math.sign(offset) * 4, W.hair, 0.8, P) + line(x2, y2 + Math.sign(offset) * 2, x2, yy + Math.sign(offset) * 4, W.hair, 0.8, P)
        const mid = (x1 + x2) / 2, gap = value.length * 3.2 + 6
        s += line(x1, yy, mid - gap, yy, W.thin, 0.9, P) + line(mid + gap, yy, x2, yy, W.thin, 0.9, P)
        s += line(x1 - 3, yy + 3, x1 + 3, yy - 3, W.mid, 1, P) + line(x2 - 3, yy + 3, x2 + 3, yy - 3, W.mid, 1, P)
        s += text(mid, yy + 3.4, value, { anchor: 'middle', color: P, op: 1 })
      } else {
        const xx = x1 + offset
        s += line(x1 + Math.sign(offset) * 2, y1, xx + Math.sign(offset) * 4, y1, W.hair, 0.8, P) + line(x2 + Math.sign(offset) * 2, y2, xx + Math.sign(offset) * 4, y2, W.hair, 0.8, P)
        const mid = (y1 + y2) / 2, gap = value.length * 3.2 + 6
        s += line(xx, y1, xx, mid - gap, W.thin, 0.9, P) + line(xx, mid + gap, xx, y2, W.thin, 0.9, P)
        s += line(xx - 3, y1 + 3, xx + 3, y1 - 3, W.mid, 1, P) + line(xx - 3, y2 + 3, xx + 3, y2 - 3, W.mid, 1, P)
        s += `<g transform="translate(${xx + 3.4} ${mid}) rotate(-90)">${text(0, 0, value, { anchor: 'middle', color: P, op: 1 })}</g>`
      }
      return s
    },
    /** numbered red-pen callout: a dot on the target, a leader, a circled number and a note */
    callout(n, tx, ty, lx, ly, note) {
      const P = t.pen, right = lx >= tx
      return `<circle cx="${tx}" cy="${ty}" r="2.4" fill="${P}"/>` + line(tx, ty, lx, ly, W.thin, 0.9, P) +
        `<circle cx="${lx}" cy="${ly}" r="8.5" fill="${t.paper}" stroke="${P}" stroke-width="${W.thin}"/>` +
        text(lx, ly + 3.3, String(n), { anchor: 'middle', color: P, op: 1, size: 9, weight: 600 }) +
        text(lx + (right ? 14 : -14), ly + 3.3, note, { anchor: right ? 'start' : 'end', color: P, op: 1 })
    },
  }
  return k
}

/** A landing page drawn with the kit — the reference sheet for the wire aesthetic. */
export function landingSheet(theme = 'light', { w = 1200, h = 760 } = {}) {
  const k = wireKit(theme), t = k.t
  const m = 18, X = 78, Y = 70, CW = w - 2 * X, gut = 20
  const col = (CW - gut * 11) / 12, span = (n) => col * n + gut * (n - 1), at = (i) => X + i * (col + gut)
  let s = k.paper(w, h, 'wp' + theme) + k.columns(X, Y - 18, CW, h - Y - 92, 12, gut) + k.sheet(w, h, { title: 'landing · hero', sheetNo: '01' })
  // nav
  s += `<g transform="translate(${X} ${Y - 6}) scale(.62)"><path d="M14.4 2.5h3.2v6h-3.2z M5.5 12.5 C5.5 9 10 7.5 16 7.5 C22 7.5 26.5 9 26.5 12.5 C26.5 17.5 20 23.5 16 29.5 C12 23.5 5.5 17.5 5.5 12.5 Z" fill="${t.ink}"/><path d="M5.7 11.2 H26.3 C26.5 12 26.5 13 26.3 14 H5.7 C5.5 13 5.5 12 5.7 11.2 Z" fill="${t.pen}"/></g>`
  s += `<text x="${X + 26}" y="${Y + 9}" font-family="Gabarito, sans-serif" font-weight="800" font-size="17" letter-spacing="-.6" fill="${t.ink}">trompo</text>`
  { let nx = X + CW; ['github', 'kit', 'shells', 'how it works'].forEach((n) => { s += k.text(nx, Y + 7, n, { op: 0.55, anchor: 'end' }); nx -= n.length * 5.9 + 26 }) }
  s += k.line(X, Y + 26, X + CW, Y + 26, 0.75, 0.25)
  // hero: stacked headline as heavy bars, lede, actions — left 7 columns
  const hy = Y + 78
  s += k.lines(at(0), hy, span(5), 2, 74, { weight: 'head', last: 0.74 })
  s += k.lines(at(0), hy + 176, span(5), 3, 15, { last: 0.6 })
  s += k.button(at(0), hy + 264, 108, 36, 'install', { primary: true }) + k.button(at(0) + 120, hy + 264, 132, 36, 'browse shells')
  // the product preview — right 6 columns, an image slot
  const ix = at(7), iw = span(5), ih = 300
  s += k.image(ix, hy, iw, ih, 'live shell · 4:3', 10)
  // cards row
  const cy = hy + 372
  for (let i = 0; i < 3; i++) { const cx = at(i * 4); s += k.rect(cx, cy, span(4), 64, 1, 0.55, 8) + k.lines(cx + 16, cy + 14, span(4) * 0.5, 1, 13, { weight: 'head' }) + k.lines(cx + 16, cy + 34, span(4) - 32, 1, 11) }
  // red pen
  s += k.dim(at(0), hy - 6, at(0) + span(5), hy - 6, `${Math.round(span(5))}`, -16)
  s += k.dim(ix + iw + 6, hy, ix + iw + 6, hy + ih, `${ih}`, 18)
  s += k.callout(1, at(0) + span(5), hy + 26, at(0) + span(5) + 30, hy + 26, 'gabarito 900 · 156px')
  s += k.callout(2, at(0) + 54, hy + 300, at(0) + 54, hy + 330, 'one primary action')
  s += k.callout(3, ix, hy + 230, ix - 30, hy + 230, 'shell runs live here')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${s}</svg>`
}

/** The mark as a technical drawing — the top on a 32-unit grid, dimensioned. */
export function markSheet(theme = 'light', { w = 760, h = 760 } = {}) {
  const k = wireKit(theme), t = k.t
  const S = 15, ox = (w - 32 * S) / 2 - 40, oy = 80
  let s = k.paper(w, h, 'mp' + theme) + k.sheet(w, h, { title: 'mark · 32u grid', sheetNo: '02', scale: '15 : 1' })
  for (let i = 0; i <= 32; i++) {
    const op = i % 8 === 0 ? 0.28 : 0.1
    s += k.line(ox + i * S, oy, ox + i * S, oy + 32 * S, 0.75, op) + k.line(ox, oy + i * S, ox + 32 * S, oy + i * S, 0.75, op)
  }
  const BODY = 'M5.5 12.5 C5.5 9 10 7.5 16 7.5 C22 7.5 26.5 9 26.5 12.5 C26.5 17.5 20 23.5 16 29.5 C12 23.5 5.5 17.5 5.5 12.5 Z'
  s += `<defs><clipPath id="mb${theme}"><path d="${BODY}"/></clipPath></defs>`
  s += `<g transform="translate(${ox} ${oy}) scale(${S})">` +
    `<path d="M5.7 11.2 H26.3 C26.5 12 26.5 13 26.3 14 H5.7 C5.5 13 5.5 12 5.7 11.2 Z" fill="${t.pen}" fill-opacity=".9" clip-path="url(#mb${theme})"/>` +
    `<g fill="none" stroke="${t.ink}" stroke-width="${1.6 / S}"><path d="M14.4 7.62 V2.5 H17.6 V7.62"/><path d="${BODY}"/></g></g>`
  const X = (u) => ox + u * S, Y = (u) => oy + u * S
  s += k.line(X(16), Y(2.5) - 8, X(16), Y(29.5) + 10, 0.75, 0.6, t.ink, 'stroke-dasharray="10 3 2 3"') // centreline
  s += k.dim(X(14.4), Y(2.5), X(17.6), Y(2.5), '3.2', -20)
  s += k.dim(X(5.5), Y(29.5), X(26.5), Y(29.5), '21u', 54)
  s += k.dim(X(26.5), Y(2.5), X(26.5), Y(29.5), '27u', 44)
  s += k.callout(1, X(24), Y(12.6), X(30.5), Y(8), 'band · rosa mexicano')
  s += k.callout(2, X(16), Y(29.5), X(20.5), Y(31.4), 'la punta')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${s}</svg>`
}
