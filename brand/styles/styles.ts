/* Twelve one-tone styles (research/31-one-tone-styles/history.md, ranked shortlist). Each draws into a box with ONE
   ink on the paper it's given: no greys, no blur, no gradient. Tone comes in through `t(x, y)` (0 paper, 1 ink),
   sampled from a tone map placed on the page; the geometric styles take the logo's own parts instead.
   Five code paths: ribbons of variable width (engraving, wood engraving, line screen), dots (stipple, riso, dither,
   ASCII), pure geometry (guilloché, moiré, plotter), contours, and a photogram (cyanotype). */
import { type Tone, MARK, bandLine } from './tone'

export type Box = { x: number; y: number; w: number; h: number }
export type Ctx = CanvasRenderingContext2D
/** where a tone map sits on the page (it may be bigger than the box: the box crops it) */
export type Placed = { tone: Tone; x: number; y: number; w: number; h: number }
/** where the mark sits on the page, for the geometric styles: its origin and scale (mark units to px) */
export type MarkAt = { x: number; y: number; k: number }
export type Opts = { ink: string; paper: string; scale: number; seed: number; angle: number }

export const toneAt = (p: Placed) => (x: number, y: number) => {
  const u = (x - p.x) / p.w, v = (y - p.y) / p.h
  return u < 0 || u > 1 || v < 0 || v > 1 ? 0 : p.tone.at(u, v)
}
export function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const clip = (ctx: Ctx, b: Box) => { ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip() }

// ── Ribbons: a line whose width follows the tone ────────────────────────────────
/** parallel lines at `angle` across the box, each a ribbon `width(t)` wide, optionally bent by `bend(x, y)` along its normal */
export function ribbons(ctx: Ctx, b: Box, t: (x: number, y: number) => number, o: { gap: number; angle: number; width: (t: number) => number; bend?: (x: number, y: number) => number; step?: number }) {
  const ca = Math.cos(o.angle), sa = Math.sin(o.angle), cx = b.x + b.w / 2, cy = b.y + b.h / 2
  const R = Math.hypot(b.w, b.h) / 2 + o.gap * 2, step = o.step ?? 2
  ctx.beginPath()
  for (let k = -R; k <= R; k += o.gap) {
    const top: [number, number][] = [], bot: [number, number][] = []
    const flush = () => {
      if (top.length > 1) { ctx.moveTo(top[0][0], top[0][1]); for (const q of top) ctx.lineTo(q[0], q[1]); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath() }
      top.length = 0; bot.length = 0
    }
    for (let s = -R; s <= R; s += step) {
      let x = cx + ca * s - sa * k, y = cy + sa * s + ca * k
      if (o.bend) { const d = o.bend(x, y); x -= sa * d; y += ca * d }
      if (x < b.x - 4 || x > b.x + b.w + 4 || y < b.y - 4 || y > b.y + b.h + 4) { flush(); continue }
      const w = o.width(t(x, y)) / 2
      if (w < 0.12) { flush(); continue }
      top.push([x - sa * w, y + ca * w]); bot.push([x + sa * w, y - ca * w])
    }
    flush()
  }
  ctx.fill()
}

/** 1 · Copperplate line engraving: lines that swell with the tone and bend round the form, a cross-hatch in the darks */
export function engraving(ctx: Ctx, b: Box, p: Placed, soft: Placed, o: Opts) {
  const t = toneAt(p), s = toneAt(soft), g = o.scale
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink
  const bend = (x: number, y: number) => s(x, y) * g * 1.5 // the swell of the form lifts the lines, as on a banknote portrait
  ribbons(ctx, b, t, { gap: g, angle: o.angle, width: (v) => (v < 0.06 ? 0 : g * 0.86 * v ** 0.85), bend })
  ribbons(ctx, b, (x, y) => Math.max(0, t(x, y) - 0.5) / 0.5, { gap: g, angle: o.angle + Math.PI / 3, width: (v) => g * 0.62 * v, bend })
  ribbons(ctx, b, (x, y) => Math.max(0, t(x, y) - 0.82) / 0.18, { gap: g * 0.5, angle: o.angle - Math.PI / 3, width: (v) => g * 0.34 * v })
  ctx.restore()
}

/** 2 · Wood engraving, white line: the form cut into a black block; where it's lit, the cuts widen to paper */
export function woodEngraving(ctx: Ctx, b: Box, p: Placed, soft: Placed, o: Opts) {
  const t = toneAt(p), s = toneAt(soft), g = o.scale
  ctx.save(); clip(ctx, b)
  // the block: everywhere the soft tone says there's an object
  const W = Math.ceil(b.w / 2), H = Math.ceil(b.h / 2), img = new ImageData(W, H), ink = hex(o.ink)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (s(b.x + x * 2, b.y + y * 2) > 0.08 && t(b.x + x * 2, b.y + y * 2) > 0.1) { const i = (y * W + x) * 4; img.data[i] = ink[0]; img.data[i + 1] = ink[1]; img.data[i + 2] = ink[2]; img.data[i + 3] = 255 }
  const c = new OffscreenCanvas(W, H); c.getContext('2d')!.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true; ctx.drawImage(c, b.x, b.y, W * 2, H * 2)
  // white cuts, following the form, widest where the tone is lightest
  ctx.fillStyle = o.paper
  ribbons(ctx, b, (x, y) => (t(x, y) > 0.1 ? 1 - t(x, y) : 0), { gap: g, angle: o.angle, width: (v) => (v < 0.08 ? 0 : g * 0.62 * v ** 1.5), bend: (x, y) => s(x, y) * g * 2 })
  ctx.restore()
}

/** 4 · Line screen: straight parallel lines of varying width, nothing else */
export function lineScreen(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), g = o.scale
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink
  ribbons(ctx, b, t, { gap: g, angle: o.angle, width: (v) => g * 0.92 * v, step: 1.5 })
  ctx.restore()
}

// ── Dots ─────────────────────────────────────────────────────────────────────────
/** 3 · Stipple: one dot size, density following the tone, on a jittered grid so it never clumps */
export function stipple(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), r = o.scale / 2, gap = r * 1.75, rand = rng(o.seed)
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink; ctx.beginPath()
  for (let y = b.y; y < b.y + b.h; y += gap) for (let x = b.x; x < b.x + b.w; x += gap) {
    const px = x + (rand() - 0.5) * gap * 0.9, py = y + (rand() - 0.5) * gap * 0.9
    if (rand() < t(px, py) ** 1.25) { const rr = r * (0.85 + rand() * 0.3); ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, Math.PI * 2) }
  }
  ctx.fill(); ctx.restore()
}

/** 5 · Riso, one drum: an AM halftone at the riso's screen angle, with dot gain, dropouts and a few stray specks */
export function riso(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), c = o.scale, rand = rng(o.seed), a = o.angle, ca = Math.cos(a), sa = Math.sin(a)
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.hypot(b.w, b.h) / 2 + c
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink; ctx.beginPath()
  for (let j = -R; j <= R; j += c) for (let i = -R; i <= R; i += c) {
    const x = cx + ca * i - sa * j + (rand() - 0.5) * c * 0.08, y = cy + sa * i + ca * j + (rand() - 0.5) * c * 0.08
    if (x < b.x - c || x > b.x + b.w + c || y < b.y - c || y > b.y + b.h + c) continue
    const v = t(x, y)
    if (v < 0.03) continue
    const r = c * 0.62 * Math.sqrt(v) * (1.06 + (rand() - 0.5) * 0.12) // a little gain, a little wobble
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2)
  }
  ctx.fill()
  // the drum's grain: paper showing through the ink, and the odd speck of ink on the paper
  ctx.fillStyle = o.paper
  for (let n = 0; n < (b.w * b.h) / 260; n++) { const x = b.x + rand() * b.w, y = b.y + rand() * b.h; if (t(x, y) > 0.2) ctx.fillRect(x, y, 0.9 + rand(), 0.9 + rand()) }
  ctx.fillStyle = o.ink
  for (let n = 0; n < (b.w * b.h) / 9000; n++) ctx.fillRect(b.x + rand() * b.w, b.y + rand() * b.h, 0.8 + rand() * 0.8, 0.8 + rand() * 0.8)
  ctx.restore()
}

/** 6 · 1-bit dither (Atkinson, as on the first Mac): square pixels of ink or none */
export function dither(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), s = o.scale, W = Math.ceil(b.w / s), H = Math.ceil(b.h / s)
  const e = new Float32Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) e[y * W + x] = t(b.x + (x + 0.5) * s, b.y + (y + 0.5) * s)
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink; ctx.beginPath()
  const add = (x: number, y: number, v: number) => { if (x >= 0 && x < W && y < H) e[y * W + x] += v }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = e[y * W + x], on = v > 0.5, err = (v - (on ? 1 : 0)) / 8
    if (on) ctx.rect(b.x + x * s, b.y + y * s, s, s)
    add(x + 1, y, err); add(x + 2, y, err); add(x - 1, y + 1, err); add(x, y + 1, err); add(x + 1, y + 1, err); add(x, y + 2, err)
  }
  ctx.fill(); ctx.restore()
}

/** 7 · ASCII: characters picked by how much ink they carry, on a mono grid */
let ramp: string[] | null = null
/** the glyphs sorted by how much ink they carry, `n` steps from blank to full (measured from the font) */
export function glyphRamp(font: string, n: number) {
  const set = ' .`:-,;_~"^=+<>!*/?|ilrc1vxtJLYzunoeaskqpdbhwmZ0OQ8XB%#&@$WM'.split('')
  const g = new OffscreenCanvas(40, 60).getContext('2d', { willReadFrequently: true })!
  const cov = set.map((ch) => { g.clearRect(0, 0, 40, 60); g.font = `48px ${font}`; g.fillStyle = '#000'; g.fillText(ch, 4, 46); const d = g.getImageData(0, 0, 40, 60).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return { ch, s } })
  cov.sort((a, c) => a.s - c.s); const max = cov[cov.length - 1].s
  return Array.from({ length: n }, (_, i) => cov.reduce((best, c) => (Math.abs(c.s / max - i / (n - 1)) < Math.abs(best.s / max - i / (n - 1)) ? c : best)).ch)
}
export function ascii(ctx: Ctx, b: Box, p: Placed, o: Opts, font: string) {
  const t = toneAt(p), h = o.scale, w = h * 0.6
  if (!ramp) {
    // measure each glyph's coverage once and sort: the ramp is set by the font, not guessed
    const set = ' .`:-,;_~"^=+<>!*/?|ilrc1vxtJLYzunoeaskqpdbhwmZ0OQ8XB%#&@$WM'.split('')
    const g = new OffscreenCanvas(40, 60).getContext('2d', { willReadFrequently: true })!
    const cov = set.map((ch) => { g.clearRect(0, 0, 40, 60); g.font = `48px ${font}`; g.fillStyle = '#000'; g.fillText(ch, 4, 46); const d = g.getImageData(0, 0, 40, 60).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return { ch, s } })
    cov.sort((a, c) => a.s - c.s); const max = cov[cov.length - 1].s
    ramp = Array.from({ length: 24 }, (_, i) => cov.reduce((best, c) => (Math.abs(c.s / max - i / 23) < Math.abs(best.s / max - i / 23) ? c : best)).ch)
  }
  ctx.save(); clip(ctx, b); ctx.fillStyle = o.ink; ctx.font = `${h * 0.98}px ${font}`; ctx.textBaseline = 'middle'
  for (let y = b.y + h / 2; y < b.y + b.h; y += h) for (let x = b.x; x < b.x + b.w; x += w) {
    const v = t(x + w / 2, y)
    if (v < 0.04) continue
    ctx.fillText(ramp[Math.min(23, Math.round(v ** 0.9 * 23))], x, y)
  }
  ctx.restore()
}

// ── Geometry: the logo's own parts ───────────────────────────────────────────────
const at = (m: MarkAt, x: number, y: number): [number, number] => [m.x + x * m.k, m.y + y * m.k]

/** 8 · Guilloché: rose engine rings round the wheel and the whorl, and a wave chain along the band */
export function guilloche(ctx: Ctx, b: Box, m: MarkAt, o: Opts) {
  ctx.save(); clip(ctx, b); ctx.strokeStyle = o.ink; ctx.lineWidth = Math.max(0.6, o.scale * 0.13); ctx.lineJoin = 'round'
  const ring = (c: { cx: number; cy: number }, R0: number, R1: number, n: number, waves: number, phases: number) => {
    for (let k = 0; k < phases; k++) {
      ctx.beginPath()
      for (let i = 0; i <= 1440; i++) {
        const a = (i / 1440) * Math.PI * 2
        const r = (R0 + R1) / 2 + ((R1 - R0) / 2) * Math.sin(waves * a + (k / phases) * Math.PI * 2) * Math.cos(n * a * 0.5) ** 2
        const [x, y] = at(m, c.cx + r * Math.cos(a), c.cy + r * Math.sin(a)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
  }
  ring(MARK.wheel, MARK.wheel.r * 0.3, MARK.wheel.r - 1, 0, 16, 12)
  ring(MARK.wheel, MARK.wheel.r * 0.06, MARK.wheel.r * 0.34, 0, 8, 6)
  ring(MARK.wheel, MARK.wheel.r + 1.5, MARK.big.r - MARK.bandW - 2, 0, 40, 5)
  ring(MARK.whorl, MARK.whorl.r * 0.25, MARK.whorl.r - 0.5, 0, 9, 8)
  // the band: offset sine chains along its centre line
  const pts = bandLine(900), half = MARK.bandW / 2 - 1.5
  for (let k = 0; k < 5; k++) {
    ctx.beginPath()
    pts.forEach((q, i) => {
      const j = Math.min(pts.length - 1, i + 1), jj = Math.max(0, i - 1), tx = pts[j][0] - pts[jj][0], ty = pts[j][1] - pts[jj][1], l = Math.hypot(tx, ty) || 1
      const off = half * Math.sin((i / pts.length) * Math.PI * 2 * 44 + (k / 5) * Math.PI * 2)
      const [x, y] = at(m, q[0] - (ty / l) * off, q[1] + (tx / l) * off); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    })
    ctx.stroke()
  }
  ctx.restore()
}

/** 9 · Moiré: the two wheels as two sets of rings; where they cross, the interference draws the band */
export function moire(ctx: Ctx, b: Box, m: MarkAt, o: Opts) {
  ctx.save(); clip(ctx, b); ctx.strokeStyle = o.ink
  const g = o.scale, R = Math.hypot(b.w, b.h)
  // the interference fills the logo's own shapes: the band, the drive wheel, the whorl
  const shape = new Path2D(); for (const d of Object.values(MARK.paths)) shape.addPath(new Path2D(d))
  const T = ctx.getTransform(); ctx.translate(m.x, m.y); ctx.scale(m.k, m.k); ctx.clip(shape, 'evenodd'); ctx.setTransform(T)
  ctx.lineWidth = g * 0.42
  for (const c of [MARK.wheel, MARK.whorl]) {
    const [x, y] = at(m, c.cx, c.cy)
    ctx.beginPath()
    for (let r = g; r < R; r += g) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2) }
    ctx.stroke()
  }
  ctx.restore()
}

/** 10 · Plotter (after Nees, "Schotter"): a grid of squares that falls into disorder where the tone is dark */
export function plotter(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), q = o.scale, rand = rng(o.seed)
  ctx.save(); clip(ctx, b); ctx.strokeStyle = o.ink; ctx.lineWidth = Math.max(0.7, q * 0.06); ctx.beginPath()
  for (let y = b.y + q * 0.6; y < b.y + b.h; y += q) for (let x = b.x + q * 0.6; x < b.x + b.w; x += q) {
    const v = t(x, y), d = Math.min(1, v * 1.4) ** 1.2
    const a = (rand() - 0.5) * d * Math.PI, ox = (rand() - 0.5) * d * q * 1.4, oy = (rand() - 0.5) * d * q * 1.4
    const s = q * 0.38, c = Math.cos(a), sn = Math.sin(a)
    const pts = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([u, w]) => [x + ox + u * c - w * sn, y + oy + u * sn + w * c])
    ctx.moveTo(pts[0][0], pts[0][1]); for (const pt of pts.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.closePath()
  }
  ctx.stroke(); ctx.restore()
}

/** 11 · Contour lines: the tone read as a landscape and surveyed, an index line every fifth level */
export function contours(ctx: Ctx, b: Box, p: Placed, o: Opts, levels = 22) {
  const T = p.tone, sx = p.w / (T.w - 1), sy = p.h / (T.h - 1)
  ctx.save(); clip(ctx, b); ctx.strokeStyle = o.ink; ctx.lineCap = 'round'
  for (let l = 1; l < levels; l++) {
    const iso = l / levels
    ctx.lineWidth = l % 5 === 0 ? o.scale * 0.22 : o.scale * 0.1
    ctx.beginPath()
    for (let y = 0; y < T.h - 1; y++) for (let x = 0; x < T.w - 1; x++) {
      const i = y * T.w + x, a = T.d[i], c = T.d[i + 1], d = T.d[i + T.w + 1], e = T.d[i + T.w]
      const idx = (a > iso ? 8 : 0) | (c > iso ? 4 : 0) | (d > iso ? 2 : 0) | (e > iso ? 1 : 0)
      if (idx === 0 || idx === 15) continue
      const lerp = (v0: number, v1: number) => (iso - v0) / (v1 - v0 || 1e-6)
      const top: [number, number] = [x + lerp(a, c), y], right: [number, number] = [x + 1, y + lerp(c, d)]
      const bottom: [number, number] = [x + lerp(e, d), y + 1], left: [number, number] = [x, y + lerp(a, e)]
      const seg = (s0: [number, number], s1: [number, number]) => { ctx.moveTo(p.x + s0[0] * sx, p.y + s0[1] * sy); ctx.lineTo(p.x + s1[0] * sx, p.y + s1[1] * sy) }
      switch (idx) {
        case 1: case 14: seg(left, bottom); break
        case 2: case 13: seg(bottom, right); break
        case 3: case 12: seg(left, right); break
        case 4: case 11: seg(top, right); break
        case 5: seg(left, top); seg(bottom, right); break
        case 6: case 9: seg(top, bottom); break
        case 7: case 8: seg(left, top); break
        case 10: seg(top, right); seg(left, bottom); break
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** 12 · Cyanotype: a photogram. The coated sheet is the ink; where the object sat, the light never reached, so it stays paper. */
export function cyanotype(ctx: Ctx, b: Box, p: Placed, o: Opts) {
  const t = toneAt(p), rand = rng(o.seed), s = 1.5, W = Math.ceil(b.w / s), H = Math.ceil(b.h / s)
  const img = new ImageData(W, H), ink = hex(o.ink)
  // the coating: brushed on by hand, so its edge is ragged and a few strokes run past it
  const vn = (u: number, k: number) => { const i = Math.floor(u), f = u - i, h = (n: number) => { const r = rng(n * 977 + k * 131 + o.seed); r(); return r() }; return h(i) + (h(i + 1) - h(i)) * f * f * (3 - 2 * f) }
  const edge = (u: number, k: number) => 8 + 22 * vn(u / 90, k) + 9 * vn(u / 17, k + 9) + 4 * vn(u / 4, k + 19)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = x * s, Y = y * s
    if (X < edge(Y, 1) || X > b.w - edge(Y, 2) || Y < edge(X, 3) || Y > b.h - edge(X, 4)) continue
    const exposure = 1 - t(b.x + X, b.y + Y) // shadow of the object = no exposure = paper
    if (rand() < exposure ** 1.6 * 1.04) { const i = (y * W + x) * 4; img.data[i] = ink[0]; img.data[i + 1] = ink[1]; img.data[i + 2] = ink[2]; img.data[i + 3] = 255 }
  }
  const c = new OffscreenCanvas(W, H); c.getContext('2d')!.putImageData(img, 0, 0)
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, b.x, b.y, W * s, H * s); ctx.restore()
}

export function hex(h: string): [number, number, number] { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

export const STYLES = [
  { id: 'engraving', name: 'Talla dulce', english: 'Copperplate engraving', era: 'c. 1430–1900' },
  { id: 'wood', name: 'Grabado a la testa', english: 'Wood engraving, white line', era: 'Bewick, c. 1790' },
  { id: 'stipple', name: 'Punteado', english: 'Stipple engraving', era: 'Bartolozzi, c. 1770' },
  { id: 'lines', name: 'Trama de líneas', english: 'Line screen', era: 'c. 1880s' },
  { id: 'riso', name: 'Risografía', english: 'Riso, one drum', era: 'Riso Kagaku, 1986' },
  { id: 'dither', name: 'Tramado de 1 bit', english: '1-bit dither, Atkinson', era: 'Apple, 1984' },
  { id: 'ascii', name: 'Arte ASCII', english: 'ASCII', era: 'Teletype, 1960s' },
  { id: 'guilloche', name: 'Guilloché', english: 'Rose engine', era: 'c. 1620 to banknotes' },
  { id: 'moire', name: 'Muaré', english: 'Op-art moiré', era: 'Riley, Vasarely, 1960s' },
  { id: 'plotter', name: 'Trazador', english: 'Plotter, after Nees', era: 'Nees, "Schotter", 1968' },
  { id: 'contour', name: 'Curvas de nivel', english: 'Contour survey', era: 'Ordnance Survey, 1840s' },
  { id: 'cyanotype', name: 'Cianotipia', english: 'Cyanotype photogram', era: 'Herschel, Atkins, 1842' },
] as const
export type StyleId = (typeof STYLES)[number]['id']
