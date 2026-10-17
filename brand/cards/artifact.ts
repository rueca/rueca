/* Cards: Rueca's share images, made by a Rueca tool (brand/RUECA.md → "the brand ships its own tools"; research/28).
   One drawing, laid out for each format from its own width and height:
     · Headline: the lockup, the site's line in Goudy, the site's pen on it (a Malva loop round one word, an Achiote
       line under another), and the dyes in reading order along the foot. This replaces public/og-v1.jpg.
     · Release: a numbered Lámina per version, its spinning word, the engraving of that word, a note in the hand.
     · Dye: one colour from the nomenclature (brand/specimen), a card to post or print.
   Pure functions of (values, t); the studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock } from '@kit'
import { cubicBezier } from '@kit/core/ease'
import hostUrl from '../fonts/host-grotesk/HostGrotesk[wght].ttf?url'
import goudyUrl from '@/landing/fonts/sorts-mill-goudy-regular.woff2?url'
import goudyItalicUrl from '@/landing/fonts/sorts-mill-goudy-italic.woff2?url'
import handUrl from '@fontsource/la-belle-aurore/files/la-belle-aurore-latin-400-normal.woff2?url'
import { LOCKUP } from '../bento/lockups'
import { ENTRIES, onColour } from '../specimen/entries'
import malacateUrl from './engravings/malacate.webp?url'

const FONT = { sans: '"Cards Host", sans-serif', serif: '"Cards Goudy", serif', hand: '"Cards Hand", cursive' }
const INK = '#171615', TEXT = '#F7F5F4'

// ── Grounds: the fields Mora allows (brand/RUECA.md → Colour, rule 2), with the ink and pens that go on each ──
type Ground = { field: string; ink: string; muted: string; loop: string; line: string; dyes: string[] }
const DAY_DYES = ['#DCDAD9', '#FFD000', '#F6571C', '#84C900', '#171615', '#6E1A3E', '#EFA6FF', '#5070F0']
const NIGHT_DYES = ['#363534', '#FFD84D', '#FF6A2C', '#9BD83A', '#F7F5F4', '#D23A84', '#F2B3FF', '#7088FF']
const GROUNDS: Record<string, Ground> = {
  lana: { field: '#FDFBFA', ink: INK, muted: '#6B6866', loop: '#C46FDB', line: '#F6571C', dyes: DAY_DYES },
  platino: { field: '#DCDAD9', ink: INK, muted: '#4A4847', loop: '#9640B0', line: '#CD4000', dyes: DAY_DYES },
  nogal: { field: '#181716', ink: TEXT, muted: '#A8A4A1', loop: '#F2B3FF', line: '#FF6A2C', dyes: NIGHT_DYES },
  mora: { field: '#6E1A3E', ink: TEXT, muted: '#E888B4', loop: '#F2B3FF', line: '#FF6A2C', dyes: NIGHT_DYES },
  achiote: { field: '#F6571C', ink: INK, muted: '#5A1E06', loop: INK, line: TEXT, dyes: DAY_DYES },
}

// ── Formats ────────────────────────────────────────────────────────────────────
export const FORMATS: Record<string, { w: number; h: number; label: string }> = {
  og: { w: 1200, h: 630, label: 'Link preview' },
  square: { w: 1080, h: 1080, label: 'Square' },
  portrait: { w: 1080, h: 1350, label: '4:5' },
  story: { w: 1080, h: 1920, label: 'Story' },
  banner: { w: 1500, h: 500, label: 'Header' },
}

export const schema = defineSchema({
  card: folder('Card', {
    template: p.select('headline', [{ value: 'headline', label: 'Headline' }, { value: 'release', label: 'Release' }, { value: 'dye', label: 'Dye' }], { display: 'segmented', label: 'Card', hint: 'Headline: the site’s line, the share image. Release: a numbered Lámina for a version. Dye: one colour from the nomenclature.' }),
    format: p.select('og', Object.entries(FORMATS).map(([value, f]) => ({ value, label: f.label })), { label: 'Format', hint: 'Link preview 1200 × 630 (Open Graph, X, LinkedIn), square, 4:5, story 9:16, or a profile header 3:1.' }),
    ground: p.select('lana', [{ value: 'lana', label: 'Lana' }, { value: 'platino', label: 'Platino' }, { value: 'nogal', label: 'Nogal' }, { value: 'mora', label: 'Mora' }, { value: 'achiote', label: 'Achiote' }], { label: 'Ground', hint: 'The fields Mora allows. Brights stay blocks and pens, never fields.', when: (v) => v.template !== 'dye' }),
  }),
  headline: folder('Headline', {
    line: p.text('Spin your prototype into a tool.', { label: 'Line', hint: 'Set in Goudy, as large as the card allows, on up to three lines.' }),
    loopWord: p.text('prototype', { label: 'Loop round', hint: 'The word the pen loops round, in Malva. Empty: no loop.' }),
    lineWord: p.text('tool', { label: 'Line under', hint: 'The word the pen underlines, in Achiote. Empty: no line.' }),
    strip: p.boolean(true, { label: 'Dye strip', hint: 'The dyes in reading order along the foot, as in the bento’s swatches.' }),
  }, { when: (v) => v.template === 'headline' }),
  release: folder('Release', {
    version: p.text('0.2', { label: 'Version' }),
    word: p.text('Malacate', { label: 'Word', hint: 'The version’s spinning word (proposed: 0.1 Huso, 0.2 Malacate, 0.3 Rueca).' }),
    gloss: p.text('the spindle whorl', { label: 'Meaning' }),
    note: p.text('comments, the agent’s spark, history', { label: 'In the hand', hint: 'What came with it, written in the margin.' }),
    date: p.text('October 2026', { label: 'Date' }),
  }, { when: (v) => v.template === 'release' }),
  dye: folder('Dye', {
    entry: p.select('Achiote', ENTRIES.map((e) => ({ value: e.name, label: e.name })), { label: 'Colour' }),
  }, { when: (v) => v.template === 'dye' }),
  foot: folder('Foot', {
    left: p.text('rueca.dev', { label: 'Left' }),
    right: p.text('Open source', { label: 'Right' }),
    animate: p.boolean(false, { label: 'Draw the pen', hint: 'The pen draws its marks on over the first second and a half; off, they’re there from the start. Video export records it.' }),
  }, { collapsed: true }),
})

export const params = createParams(schema, { id: 'rueca-cards', version: 1, presets: [
  { name: 'Share image', values: { template: 'headline', format: 'og', ground: 'lana' } },
  { name: 'Share image, night', values: { template: 'headline', format: 'og', ground: 'nogal' } },
  { name: 'Lámina 0.2', values: { template: 'release', format: 'portrait', ground: 'lana' } },
  { name: 'Dye, square', values: { template: 'dye', format: 'square' } },
] })
export type V = ReturnType<typeof params.values>
export const sizeOf = (v: V) => FORMATS[v.format] ?? FORMATS.og

export const totalMs = () => 2400
export const clock = createClock({ duration: totalMs(), loop: false })

// ── Assets ─────────────────────────────────────────────────────────────────────
type Art = { ink: ImageBitmap; light: OffscreenCanvas; w: number; h: number }
let arts: Map<string, Art> | null = null
let word: Path2D | null = null
async function font(family: string, url: string, weight = '400', style = 'normal') {
  const f = new FontFace(family, `url(${url})`, { weight, style }); await f.load(); document.fonts.add(f)
}
async function art(url: string): Promise<Art> {
  const img = await createImageBitmap(await (await fetch(url)).blob()) // sturdier than <img>.decode(), which can stall offscreen
  const light = new OffscreenCanvas(img.width, img.height), g = light.getContext('2d')!
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = TEXT; g.fillRect(0, 0, light.width, light.height)
  return { ink: img, light, w: img.width, h: img.height }
}
export async function loadAssets() {
  await Promise.all([
    font('Cards Host', hostUrl, '300 800'), font('Cards Goudy', goudyUrl), font('Cards Goudy', goudyItalicUrl, '400', 'italic'), font('Cards Hand', handUrl),
  ])
  const urls = [...new Set([malacateUrl, ...ENTRIES.flatMap((e) => e.art)])]
  const list = await Promise.all(urls.map(art))
  arts = new Map(urls.map((u, i) => [u, list[i]]))
  word = new Path2D(LOCKUP.word)
}

// ── Draw ───────────────────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D
type Box = { x: number; y: number; w: number; h: number }
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export function draw(ctx: Ctx, v: V, t: number, w: number, h: number) {
  const g = GROUNDS[v.template === 'dye' ? 'lana' : v.ground] ?? GROUNDS.lana
  ctx.fillStyle = g.field; ctx.fillRect(0, 0, w, h)
  if (!arts) return
  const pen = v.animate ? t : Infinity
  if (v.template === 'release') drawRelease(ctx, v, g, w, h, pen)
  else if (v.template === 'dye') drawDye(ctx, v, w, h, pen)
  else drawHeadline(ctx, v, g, w, h, pen)
}

const S = (w: number, h: number) => Math.min(w, h) // the card's short side: every measure follows it
const caps = (ctx: Ctx, text: string, x: number, y: number, size: number, colour: string, align: CanvasTextAlign = 'left') => {
  ctx.font = `600 ${size}px ${FONT.sans}`; ctx.fillStyle = colour; ctx.textAlign = align
  ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = `${size * 0.08}px`
  ctx.fillText(text.toUpperCase(), x, y)
  ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px'; ctx.textAlign = 'left'
}

// The mark: Pulido geometry (brand/logo/pulido.json), as in brand/bento/artifact.ts
const MARK_W = 309.1, LOCK_H = 217.2
const MARK = [
  'M139.4 108.6A61.1 61.1 0 1 0 261.6 108.6A61.1 61.1 0 1 0 139.4 108.6Z',
  'M47.5 140.7A29 29 0 1 0 105.5 140.7A29 29 0 1 0 47.5 140.7Z',
  'M200.5 217.2L76.5 217.2A76.5 76.5 0 0 1 39.38 73.81L147.8 13.64A108.6 108.6 0 1 1 200.5 217.2ZM200.5 192.2L76.5 192.2A51.5 51.5 0 0 1 51.51 95.67L159.94 35.5A83.6 83.6 0 1 1 200.5 192.2Z',
].map((d) => new Path2D(d))
/** the lockup, `hgt` tall, its top-left at (x, y); `markOnly` drops the word */
function lockup(ctx: Ctx, x: number, y: number, hgt: number, ink: string, markOnly = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(hgt / LOCK_H, hgt / LOCK_H); ctx.fillStyle = ink
  for (const m of MARK) ctx.fill(m, 'evenodd')
  if (!markOnly) ctx.fill(word!)
  ctx.restore()
}
export const lockupWidth = (hgt: number) => (LOCKUP.w / LOCK_H) * hgt
void MARK_W

/** the largest Goudy size at which `text` wraps into at most `maxLines` lines inside maxW × maxH */
function fit(ctx: Ctx, text: string, maxW: number, maxH: number, maxLines: number, lead = 1.02, maxSize = Infinity) {
  const words = text.split(/\s+/).filter(Boolean)
  for (let size = Math.floor(Math.min(maxH, maxSize)); size > 8; size -= 1) {
    ctx.font = `400 ${size}px ${FONT.serif}`
    const lines: string[] = []
    let ok = true
    for (const wd of words) {
      const last = lines[lines.length - 1]
      if (last && ctx.measureText(`${last} ${wd}`).width <= maxW) lines[lines.length - 1] = `${last} ${wd}`
      else { if (ctx.measureText(wd).width > maxW) { ok = false; break } lines.push(wd) }
    }
    if (ok && lines.length <= maxLines && lines.length * size * lead <= maxH) return { size, lines: balance(ctx, words, lines.length, maxW), lead: size * lead }
  }
  return { size: 8, lines: [text], lead: 8 * lead }
}

/** the same words on the same number of lines, as even as they go: the narrowest measure that still takes `n` lines */
function balance(ctx: Ctx, words: string[], n: number, maxW: number) {
  const wrap = (W: number) => {
    const out: string[] = []
    for (const wd of words) { const l = out[out.length - 1]; if (l && ctx.measureText(`${l} ${wd}`).width <= W) out[out.length - 1] = `${l} ${wd}`; else out.push(wd) }
    return out
  }
  let best = wrap(maxW)
  for (let W = maxW; W > maxW * 0.4; W -= maxW * 0.01) { const l = wrap(W); if (l.length > n) break; best = l }
  return best
}

// ── The site's pen (src/landing/HeroArrow.tsx, as in the bento's poster) ─────────
const ease = cubicBezier([0.65, 0, 0.35, 1])
function stroke(ctx: Ctx, pts: [number, number][], k: number, colour: string) {
  if (k <= 0) return
  const len = pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0)
  ctx.strokeStyle = colour; ctx.setLineDash([len * k, len + 1])
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke()
  ctx.setLineDash([])
}
/** a loose loop a little more than one turn round the box (the hero's superellipse) */
function loopRound(b: Box, pad: number): [number, number][] {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2 + pad * 1.2, ry = b.h / 2 + pad, n = 2.5
  const sp = (q: number) => Math.sign(q) * Math.abs(q) ** (2 / n), tilt = -0.04, cos = Math.cos(tilt), sin = Math.sin(tilt)
  return Array.from({ length: 97 }, (_, i) => {
    const a = -2.3 + ((Math.PI * 2 + 0.55) * i) / 96, grow = i / 96
    const px = rx * (1 + 0.04 * grow) * sp(Math.cos(a)), py = ry * (1 + 0.1 * grow + 0.02 * Math.sin(3 * a)) * sp(Math.sin(a))
    return [cx + px * cos - py * sin, cy + px * sin + py * cos]
  })
}
function underline(x0: number, x1: number, y: number, s: number): [number, number][] {
  return Array.from({ length: 33 }, (_, i): [number, number] => { const u = i / 32; return [x0 + (x1 - x0) * u, y + 0.9 * s * Math.sin(u * Math.PI * 1.6) - 2.2 * s * u ** 3] })
}

// ── Headline ───────────────────────────────────────────────────────────────────
function drawHeadline(ctx: Ctx, v: V, g: Ground, w: number, h: number, t: number) {
  const s = S(w, h), wide = w / h > 1.6, m = s * (wide ? 0.11 : 0.085)
  const lockH = s * (wide ? 0.07 : 0.06)
  lockup(ctx, m, m, lockH, g.ink)
  const stripH = v.strip ? s * 0.024 : 0
  const footY = h - m * 0.75 - stripH
  caps(ctx, v.left, m, footY, s * 0.026, g.muted)
  caps(ctx, v.right, w - m, footY, s * 0.026, g.muted, 'right')
  if (v.strip) {
    const cw = w / g.dyes.length
    g.dyes.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * cw, h - stripH, cw + 0.5, stripH) })
  }
  // the line: as big as fits between the lockup and the foot, three lines at most (two on a header)
  const top = m + lockH + m * 0.6, bottom = footY - s * 0.08
  const box = { x: m, y: top, w: w - m * 2, h: bottom - top }
  const f = fit(ctx, v.line, box.w * (wide ? 0.8 : 1), box.h, v.format === 'banner' ? 2 : 3, 1.02, s * (wide ? 0.17 : 0.16))
  const block = f.lines.length * f.lead
  const y0 = box.y + (box.h - block) / 2 + f.size * 0.8 // the first baseline, the block centred in its space
  ctx.font = `400 ${f.size}px ${FONT.serif}`; ctx.fillStyle = g.ink
  f.lines.forEach((l, i) => ctx.fillText(l, box.x - f.size * 0.04, y0 + i * f.lead))
  // the pen on it
  const find = (wd: string) => {
    if (!wd.trim()) return null
    for (let i = 0; i < f.lines.length; i++) {
      const at = f.lines[i].indexOf(wd)
      if (at < 0) continue
      const x = box.x - f.size * 0.04 + ctx.measureText(f.lines[i].slice(0, at)).width, mm = ctx.measureText(wd)
      return { x, w: mm.width, base: y0 + i * f.lead, asc: mm.actualBoundingBoxAscent, desc: mm.actualBoundingBoxDescent }
    }
    return null
  }
  const k = f.size / 116 // the site's hero line is 116px
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, 2.5 * k * 1.15)
  const lp = find(v.loopWord)
  if (lp) stroke(ctx, loopRound({ x: lp.x, y: lp.base - lp.asc, w: lp.w, h: lp.asc + lp.desc }, 12 * k), ease(clamp01((t - 300) / 750)), g.loop)
  const ul = find(v.lineWord)
  if (ul) stroke(ctx, underline(ul.x - 2 * k, ul.x + ul.w + 3 * k, ul.base + Math.max(ul.desc, f.size * 0.08) + 5 * k, k * 2), ease(clamp01((t - 1150) / 600)), g.line)
  ctx.restore()
}

// ── Release: a Lámina per version ──────────────────────────────────────────────
function plateFrame(ctx: Ctx, b: Box, ink: string, s: number) {
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.0016); ctx.strokeRect(b.x, b.y, b.w, b.h)
  const gap = s * 0.007; ctx.lineWidth = Math.max(0.6, s * 0.0008)
  ctx.strokeRect(b.x + gap, b.y + gap, b.w - gap * 2, b.h - gap * 2)
}
function drawArt(ctx: Ctx, url: string, b: Box, light: boolean, align: 'center' | 'bottom' = 'center') {
  const a = arts!.get(url); if (!a) return
  const sc = Math.min(b.w / a.w, b.h / a.h), dw = a.w * sc, dh = a.h * sc
  ctx.drawImage(light ? a.light : a.ink, b.x + (b.w - dw) / 2, align === 'bottom' ? b.y + b.h - dh : b.y + (b.h - dh) / 2, dw, dh)
}
function drawRelease(ctx: Ctx, v: V, g: Ground, w: number, h: number, t: number) {
  const s = S(w, h), m = s * 0.06, wide = w / h > 1.4, light = g.ink === TEXT
  const frame = { x: m, y: m, w: w - m * 2, h: h - m * 2 }
  plateFrame(ctx, frame, g.ink, s)
  const pad = s * 0.05, inner = { x: frame.x + pad, y: frame.y + pad, w: frame.w - pad * 2, h: frame.h - pad * 2 }
  const cap = s * 0.02
  caps(ctx, 'Rueca', inner.x, inner.y + cap, cap, g.ink)
  caps(ctx, `Lámina ${v.version}`, inner.x + inner.w, inner.y + cap, cap, g.ink, 'right')
  caps(ctx, v.date, inner.x, inner.y + inner.h, cap, g.muted)
  caps(ctx, v.left, inner.x + inner.w, inner.y + inner.h, cap, g.muted, 'right')
  // the engraving and the word: side by side when wide, stacked when tall
  const body = { x: inner.x, y: inner.y + cap * 2.6, w: inner.w, h: inner.h - cap * 5.2 }
  const artBox = wide ? { ...body, w: body.w * 0.46 } : { ...body, h: body.h * 0.6 }
  const textBox = wide ? { x: body.x + body.w * 0.52, y: body.y, w: body.w * 0.48, h: body.h } : { x: body.x, y: body.y + body.h * 0.62, w: body.w, h: body.h * 0.38 }
  drawArt(ctx, malacateUrl, artBox, light)
  const title = fit(ctx, v.word, textBox.w, textBox.h * 0.42, 1)
  const ty = wide ? textBox.y + textBox.h * 0.42 : textBox.y + title.size * 0.85
  ctx.font = `400 ${title.size}px ${FONT.serif}`; ctx.fillStyle = g.ink; ctx.textAlign = wide ? 'left' : 'center'
  const tx = wide ? textBox.x : textBox.x + textBox.w / 2
  ctx.fillText(v.word, tx, ty)
  const gl = title.size * 0.3
  ctx.font = `italic 400 ${gl}px ${FONT.serif}`; ctx.fillStyle = g.muted
  ctx.fillText(`${v.gloss} · version ${v.version}`, tx, ty + gl * 1.7)
  // what came with it, in the hand: written on when the pen draws
  ctx.font = `${gl * 1.05}px ${FONT.hand}`
  const hs = gl * 1.05 * Math.min(1, textBox.w / ctx.measureText(v.note).width)
  ctx.font = `${hs}px ${FONT.hand}`; ctx.fillStyle = g.line
  const nw = ctx.measureText(v.note).width, nx = wide ? tx : tx - nw / 2
  ctx.textAlign = 'left'
  const k = Number.isFinite(t) ? ease(clamp01((t - 500) / 1200)) : 1
  ctx.save(); ctx.beginPath(); ctx.rect(nx - hs, ty + gl * 2.4, (nw + hs * 2) * k, hs * 2.4); ctx.clip()
  ctx.fillText(v.note, nx, ty + gl * 2 + hs * 1.6); ctx.restore()
}

// ── Dye: one colour from the nomenclature ──────────────────────────────────────
function drawDye(ctx: Ctx, v: V, w: number, h: number, t: number) {
  const e = ENTRIES.find((x) => x.name === v.entry) ?? ENTRIES[0]
  const s = S(w, h), wide = w / h > 1.2, on = onColour(e.hex)
  const block = wide ? { x: 0, y: 0, w: w * 0.42, h } : { x: 0, y: 0, w, h: h * (w / h > 0.9 ? 0.46 : 0.52) }
  ctx.fillStyle = e.hex; ctx.fillRect(block.x, block.y, block.w, block.h)
  if (e.hex === '#FDFBFA') { ctx.strokeStyle = '#DCDAD9'; ctx.lineWidth = 1.5; ctx.beginPath(); if (wide) { ctx.moveTo(block.w, 0); ctx.lineTo(block.w, h) } else { ctx.moveTo(0, block.h); ctx.lineTo(w, block.h) } ctx.stroke() }
  const m = s * 0.065, cap = s * 0.02
  caps(ctx, `No. ${ENTRIES.indexOf(e) + 1}`, block.x + m, block.y + m + cap * 0.4, cap, on)
  caps(ctx, e.hex, block.x + block.w - m, block.y + m + cap * 0.4, cap, on, 'right')
  const artBox = { x: block.x + m, y: block.y + m * 1.9, w: block.w - m * 2, h: block.h - m * 2.6 }
  const n = e.art.length, gap = n > 1 ? artBox.w * 0.06 : 0, cw = n ? (artBox.w - gap * (n - 1)) / n : 0
  e.art.forEach((u, i) => drawArt(ctx, u, { x: artBox.x + i * (cw + gap), y: artBox.y, w: cw, h: artBox.h }, on !== INK, 'bottom'))
  // the words
  const tb = wide ? { x: block.w + m, y: m, w: w - block.w - m * 2, h: h - m * 2 } : { x: m, y: block.h + m * 0.8, w: w - m * 2, h: h - block.h - m * 1.6 }
  const name = s * (wide ? 0.16 : 0.1), body = s * (wide ? 0.036 : 0.03)
  let y = tb.y + name * 0.85
  ctx.font = `400 ${name}px ${FONT.serif}`; ctx.fillStyle = INK; ctx.fillText(e.name, tb.x - name * 0.03, y)
  y += name * 0.48
  ctx.font = `italic 400 ${name * 0.34}px ${FONT.serif}`; ctx.fillText(e.latin || e.part, tb.x, y)
  y += name * 0.36
  caps(ctx, e.english, tb.x, y, cap, '#6B6866')
  y += name * 0.5
  ctx.font = `400 ${body}px ${FONT.sans}`; ctx.fillStyle = INK
  const words = e.note.split(' '), lines: string[] = []
  for (const wd of words) { const l = lines[lines.length - 1]; if (l && ctx.measureText(`${l} ${wd}`).width <= tb.w) lines[lines.length - 1] = `${l} ${wd}`; else lines.push(wd) }
  lines.forEach((l, i) => ctx.fillText(l, tb.x, y + i * body * 1.4))
  y += (lines.length - 1) * body * 1.4 + body * 2.6
  const hs = body * 1.7
  ctx.font = `${hs}px ${FONT.hand}`; ctx.fillStyle = '#F6571C'
  const k = Number.isFinite(t) ? ease(clamp01((t - 400) / 1100)) : 1
  ctx.save(); ctx.beginPath(); ctx.rect(tb.x - hs, y - hs * 1.4, (ctx.measureText(e.job).width + hs * 2) * k, hs * 2.4); ctx.clip()
  ctx.fillText(e.job, tb.x, y); ctx.restore()
  // the foot
  const fy = tb.y + tb.h
  lockup(ctx, tb.x, fy - s * 0.035, s * 0.035, INK, true)
  caps(ctx, v.left, tb.x + tb.w, fy - cap * 0.2, cap, '#6B6866', 'right')
}
