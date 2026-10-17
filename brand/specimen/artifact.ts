/* The dye specimen: Rueca's colours as a nomenclature, after Werner (1821). Every colour has its source engraved
   (Midjourney with the RUECA.md §6 recipe, inked to Nogal by brand/tools/ink.py), its Spanish name, the Latin of
   what dyes it, one checked fact, and its job in Rueca written in the margin by the hand.

   Two formats, one drawing:
     · Tile: a bento tile (285 × 297, the bento's units) that turns to the next colour on every beat. The new colour
       comes up from the bottom over the last (the bento's swatches), the words follow, then the pen writes its job.
     · Plate: the whole table on one sheet, Werner's columns.
   Pure functions of (values, t); the studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock } from '@kit'
import { cubicBezier } from '@kit/core/ease'
import { strokesOf, timeline } from '@/landing/handwrite'
import hostUrl from '../fonts/host-grotesk/HostGrotesk[wght].ttf?url'
import goudyUrl from '@/landing/fonts/sorts-mill-goudy-regular.woff2?url'
import goudyItalicUrl from '@/landing/fonts/sorts-mill-goudy-italic.woff2?url'
import handUrl from '@fontsource/la-belle-aurore/files/la-belle-aurore-latin-400-normal.woff2?url'
import { ENTRIES, onColour, type Entry } from './entries'

const SHEET = '#FDFBFA', INK = '#171615', TEXT = '#F7F5F4', HAIRLINE = '#DCDAD9', MUTED = '#6B6866'
const FONT = { sans: '"Specimen Host", sans-serif', serif: '"Specimen Goudy", serif', hand: '"Specimen Hand", cursive' }

// ── Schema ─────────────────────────────────────────────────────────────────────
const sec = (v: number) => `${(v / 1000).toFixed(2)}s`
const TILE_SIZE = { w: 1140, h: 1188 }, PLATE_SIZE = { w: 1080, h: 1440 }

export const schema = defineSchema({
  specimen: folder('Specimen', {
    format: p.select('tile', [{ value: 'tile', label: 'Tile' }, { value: 'plate', label: 'Plate' }], { display: 'segmented', label: 'Format', hint: 'Tile: one colour at a time, a bento tile. Plate: the whole nomenclature on one sheet.' }),
    pen: p.color('#F6571C', { label: 'Pen', hint: 'The hand’s colour. Achiote, like the bento’s notes.' }),
  }),
  tile: folder('Tile', {
    beat: p.number(2400, { min: 1200, max: 6000, step: 100, fmt: sec, label: 'Beat', hint: 'How long each colour stays. The loop is one beat per colour, so it closes on the first.' }),
    change: p.number(720, { min: 100, max: 2000, step: 10, fmt: sec, label: 'Change', hint: 'How long the next colour takes to come up over the last.' }),
    changeEase: p.curve([0.32, 0.72, 0, 1], { label: 'Ease', hint: 'Flat colour wipes in (brand/RUECA.md §7).' }),
    wordsAfter: p.number(120, { min: 0, max: 800, step: 10, unit: 'ms', label: 'Words after', hint: 'How far behind the colour the name and source follow.' }),
    penAfter: p.number(80, { min: 0, max: 1500, step: 10, unit: 'ms', label: 'Pen after', hint: 'The pause between the words landing and the pen starting on the job.' }),
  }, { when: (v) => v.format === 'tile' }),
  plate: folder('Plate', {
    write: p.boolean(false, { label: 'Write the jobs', hint: 'The pen writes each colour’s job down the margin, one a beat. Off: all written.' }),
  }, { when: (v) => v.format === 'plate' }),
  output: folder('Output', {
    size: p.size(TILE_SIZE, { hint: 'Artboard and export size. The layout fits inside it on Lana.', presets: [{ label: 'Tile ×4', ...TILE_SIZE }, { label: 'Plate', ...PLATE_SIZE }, { label: '1080²', w: 1080, h: 1080 }] }),
  }, { collapsed: true }),
})

export const params = createParams(schema, { id: 'rueca-specimen', version: 1, presets: [
  { name: 'Tile', values: { format: 'tile', size: TILE_SIZE } },
  { name: 'Plate', values: { format: 'plate', size: PLATE_SIZE } },
  { name: 'Plate, written', values: { format: 'plate', size: PLATE_SIZE, write: true } },
] })
export type V = ReturnType<typeof params.values>

export const totalMs = (v: V) => v.beat * ENTRIES.length
export const clock = createClock({ duration: totalMs(params.values() as V), loop: true })
params.subscribe((st) => clock.setState({ duration: totalMs(st.values as V) }))

/** the timeline: a key for each colour as it comes in, and the pen's job after it, from the numbers the drawing uses */
export function beats(v: V) {
  return ENTRIES.map((e, i) => {
    const t0 = i * v.beat, pen = t0 + penStart(v)
    return { name: e.name, hex: e.hex, at: t0, pen: { start: pen } }
  })
}
const penStart = (v: V) => v.wordsAfter + v.change + v.penAfter

// ── Assets: fonts, the engravings (Nogal, and Lana for dark swatches), the pen's strokes ──
type Pen = { strokes: { pts: [number, number][]; len: number; at: number; dur: number }[]; total: number; width: number; x: number; baseline: number; text: string; size: number; w: number }
type Art = { ink: CanvasImageSource; light: CanvasImageSource; w: number; h: number }
type Assets = { art: Map<string, Art>; tile: Pen[][]; plate: Pen[][] }
export let assets: Assets | null = null

async function font(family: string, url: string, weight = '400', style = 'normal') {
  const f = new FontFace(family, `url(${url})`, { weight, style })
  await f.load()
  document.fonts.add(f)
}
async function art(url: string): Promise<Art> {
  const img = await createImageBitmap(await (await fetch(url)).blob()) // sturdier than <img>.decode(), which can stall offscreen
  const light = new OffscreenCanvas(img.width, img.height), g = light.getContext('2d')!
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = TEXT; g.fillRect(0, 0, light.width, light.height)
  return { ink: img, light, w: img.width, h: img.height }
}
async function pen(text: string, size: number): Promise<Pen> {
  const s = await strokesOf(text, FONT.hand, size)
  const { strokes, total } = timeline(s, { most: 0.9 })
  const g = document.createElement('canvas').getContext('2d')!
  g.font = `${size}px ${FONT.hand}`
  return {
    strokes: strokes.map((k) => ({ pts: k.d.slice(1).split('L').map((q) => q.split(' ').map(Number) as [number, number]), len: k.len, at: k.at, dur: k.dur })),
    total, width: s.thickness * 1.7 + 1.4, x: s.x, baseline: s.baseline, text, size, w: g.measureText(text).width,
  }
}
/** the job on one line if it fits `maxW` at `size`, else two lines as even as the words allow */
function lines(text: string, size: number, maxW: number) {
  const g = document.createElement('canvas').getContext('2d')!
  g.font = `${size}px ${FONT.hand}`
  if (g.measureText(text).width <= maxW) return [text]
  const words = text.split(' ')
  let best: string[] = [text], worst = Infinity
  for (let i = 1; i < words.length; i++) {
    const two = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    const w = Math.max(...two.map((l) => g.measureText(l).width))
    if (w < worst) { worst = w; best = two }
  }
  return best
}
export async function loadAssets() {
  await Promise.all([
    font('Specimen Host', hostUrl, '300 800'),
    font('Specimen Goudy', goudyUrl),
    font('Specimen Goudy', goudyItalicUrl, '400', 'italic'),
    font('Specimen Hand', handUrl),
  ])
  const urls = [...new Set(ENTRIES.flatMap((e) => e.art))]
  const arts = await Promise.all(urls.map(art))
  const [tile, plate] = await Promise.all([
    Promise.all(ENTRIES.map((e) => Promise.all(lines(e.job, TILE_HAND, TILE_COL - 8).map((l) => pen(l, TILE_HAND))))),
    Promise.all(ENTRIES.map((e) => Promise.all([pen(e.job, PLATE_HAND)]))),
  ])
  assets = { art: new Map(urls.map((u, i) => [u, arts[i]])), tile, plate }
  return assets
}

// ── Draw ───────────────────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D
type Box = { x: number; y: number; w: number; h: number }
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export function draw(ctx: Ctx, v: V, t: number, w: number, h: number) {
  ctx.fillStyle = SHEET
  ctx.fillRect(0, 0, w, h)
  if (!assets) return
  const U = v.format === 'plate' ? { w: PW, h: PH } : { w: TW, h: TH }
  const k = Math.min(w / U.w, h / U.h)
  ctx.save()
  ctx.translate((w - U.w * k) / 2, (h - U.h * k) / 2)
  ctx.scale(k, k)
  if (v.format === 'plate') drawPlate(ctx, v, t)
  else drawTile(ctx, v, t)
  ctx.restore()
}

/** an engraving (or two, side by side) fitted into `b`, sitting on its bottom edge; `light` re-inks it for a dark ground */
function drawArt(ctx: Ctx, e: Entry, b: Box, light = false) {
  const n = e.art.length
  if (!n) return
  const gap = n > 1 ? b.w * 0.04 : 0, cw = (b.w - gap * (n - 1)) / n
  e.art.forEach((url, i) => {
    const a = assets!.art.get(url)!
    const s = Math.min(cw / a.w, b.h / a.h), dw = a.w * s, dh = a.h * s
    ctx.drawImage(light ? a.light : a.ink, b.x + i * (cw + gap) + (cw - dw) / 2, b.y + b.h - dh, dw, dh)
  })
}

const setFont = (ctx: Ctx, f: string) => { ctx.font = f }
const caps = (ctx: Ctx, text: string, x: number, y: number, size: number, colour: string, align: CanvasTextAlign = 'left') => {
  setFont(ctx, `600 ${size}px ${FONT.sans}`); ctx.fillStyle = colour; ctx.textAlign = align
  ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = `${size * 0.08}px`
  ctx.fillText(text.toUpperCase(), x, y)
  ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px'
  ctx.textAlign = 'left'
}

// ── The tile (the bento's units: 285 × 297) ─────────────────────────────────────
const TW = 285, TH = 297
const BLOCK: Box = { x: 0, y: 0, w: TW, h: 150 }
const ART: Box = { x: 136, y: 34, w: 134, h: 250 }
const TILE_COL = 124, TILE_HAND = 16, PAD = 16
const TEXT_BOX: Box = { x: 0, y: BLOCK.h, w: ART.x - 2, h: TH - BLOCK.h }

function drawTile(ctx: Ctx, v: V, t: number) {
  const n = ENTRIES.length
  const i = Math.floor(t / v.beat) % n, local = t - Math.floor(t / v.beat) * v.beat
  const cur = ENTRIES[i], prev = ENTRIES[(i - 1 + n) % n]
  const ease = cubicBezier(v.changeEase)
  const wipe = ease(clamp01(local / v.change)), words = ease(clamp01((local - v.wordsAfter) / v.change))

  // the colour and its engraving come up from the bottom over the last: one line sweeps the tile
  const line = TH * (1 - wipe)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, TW, line); ctx.clip(); scene(ctx, prev, (i - 1 + n) % n); ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.rect(0, line, TW, TH - line); ctx.clip(); scene(ctx, cur, i); ctx.restore()

  // the words slide up through their column, the old ones out the top, the pen's last job with them
  ctx.save(); ctx.beginPath(); ctx.rect(TEXT_BOX.x, TEXT_BOX.y, TEXT_BOX.w, TEXT_BOX.h); ctx.clip()
  const shift = TEXT_BOX.h * words
  if (words < 1) words1(ctx, v, prev, (i - 1 + n) % n, -shift, Infinity)
  words1(ctx, v, cur, i, TEXT_BOX.h - shift, (local - penStart(v)) / 1000)
  ctx.restore()
}

/** the colour block and the engraving: the part of the drawing over a dark block is re-inked in Lana */
function scene(ctx: Ctx, e: Entry, i: number) {
  ctx.fillStyle = SHEET; ctx.fillRect(0, 0, TW, TH)
  ctx.fillStyle = e.hex; ctx.fillRect(BLOCK.x, BLOCK.y, BLOCK.w, BLOCK.h)
  if (e.hex === SHEET) { ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, BLOCK.h - 0.5); ctx.lineTo(TW, BLOCK.h - 0.5); ctx.stroke() }
  const on = onColour(e.hex)
  caps(ctx, `No. ${i + 1}`, PAD, 24, 8.5, on)
  caps(ctx, e.hex, TW - PAD, 24, 8.5, on, 'right')
  if (on === INK) { drawArt(ctx, e, ART); return }
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, TW, BLOCK.h); ctx.clip(); drawArt(ctx, e, ART, true); ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.rect(0, BLOCK.h, TW, TH - BLOCK.h); ctx.clip(); drawArt(ctx, e, ART); ctx.restore()
}

/** name, source and the job in the hand, `dy` below their resting place; `el` seconds into the pen (Infinity: written) */
function words1(ctx: Ctx, v: V, e: Entry, i: number, dy: number, el: number) {
  const y = BLOCK.h + dy
  setFont(ctx, `400 30px ${FONT.serif}`); ctx.fillStyle = INK
  ctx.fillText(e.name, PAD, y + 44)
  // the Latin shrinks to its column rather than run into the engraving
  const latin = e.latin || e.part
  setFont(ctx, `italic 400 13px ${FONT.serif}`)
  const size = Math.min(13, 13 * (TEXT_BOX.w - PAD - 16) / ctx.measureText(latin).width)
  setFont(ctx, `italic 400 ${size}px ${FONT.serif}`); ctx.fillStyle = INK
  ctx.fillText(latin, PAD, y + 63)
  caps(ctx, e.english, PAD, y + 80, 7.5, MUTED)
  const ls = assets!.tile[i]
  // a long job writes faster, so the pen always lifts before the next colour comes up
  const total = ls.reduce((a, l) => a + l.total, 0), room = (v.beat - penStart(v) - 300) / 1000
  if (el < Infinity && total > room) el *= total / Math.max(0.2, room)
  let start = 0
  ls.forEach((l, j) => {
    if (el > start) penText(ctx, l, el - start, PAD, y + 112 + j * (TILE_HAND * 1.05), v.pen)
    start += l.total
  })
}

// ── The plate (Werner's table, 1080 × 1440) ─────────────────────────────────────
const PW = 1080, PH = 1440, M = 72
const COLS = { no: M, swatch: 112, name: 236, source: 420, note: 620, art: 884 }
const HEAD_Y = 262, ROW_H = (PH - M - HEAD_Y) / ENTRIES.length, PLATE_HAND = 19

function drawPlate(ctx: Ctx, v: V, t: number) {
  caps(ctx, 'Rueca', M, 96, 11, INK)
  caps(ctx, 'After Werner, 1821', PW - M, 96, 11, MUTED, 'right')
  setFont(ctx, `400 56px ${FONT.serif}`); ctx.fillStyle = INK
  ctx.fillText('Nomenclature of Colours', M - 2, 172)
  setFont(ctx, `italic 400 21px ${FONT.serif}`); ctx.fillStyle = MUTED
  ctx.fillText('The Mora palette, with the plant, fruit or fleece behind each name.', M, 206)
  const heads: [string, number][] = [['No.', COLS.no], ['Colour', COLS.swatch], ['Name', COLS.name], ['Source', COLS.source], ['Note & job', COLS.note], ['Engraved', COLS.art]]
  for (const [label, x] of heads) caps(ctx, label, x, HEAD_Y - 14, 9.5, MUTED)
  rule(ctx, HEAD_Y, INK)

  const writing = v.write ? Math.floor(t / v.beat) % ENTRIES.length : -1
  ENTRIES.forEach((e, r) => {
    const top = HEAD_Y + r * ROW_H
    setFont(ctx, `400 13px ${FONT.sans}`); ctx.fillStyle = MUTED
    ctx.fillText(String(r + 1), COLS.no, top + 40)
    ctx.fillStyle = e.hex; ctx.fillRect(COLS.swatch, top + 18, 100, 72)
    if (e.hex === SHEET) { ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 1; ctx.strokeRect(COLS.swatch + 0.5, top + 18.5, 99, 71) }
    caps(ctx, e.hex, COLS.swatch, top + 106, 9, MUTED)
    setFont(ctx, `400 32px ${FONT.serif}`); ctx.fillStyle = INK
    ctx.fillText(e.name, COLS.name, top + 50)
    setFont(ctx, `400 13px ${FONT.sans}`); ctx.fillStyle = MUTED
    ctx.fillText(e.english, COLS.name, top + 72)
    setFont(ctx, `italic 400 19px ${FONT.serif}`); ctx.fillStyle = INK
    ctx.fillText(e.latin || '—', COLS.source, top + 46)
    setFont(ctx, `400 13px ${FONT.sans}`); ctx.fillStyle = MUTED
    wrap(ctx, e.part, COLS.source, top + 68, COLS.note - COLS.source - 24, 17)
    setFont(ctx, `400 13.5px ${FONT.sans}`); ctx.fillStyle = INK
    const n = wrap(ctx, e.note, COLS.note, top + 40, COLS.art - COLS.note - 30, 18)
    const job = assets!.plate[r][0]
    const el = writing < 0 || r < writing ? Infinity : r === writing ? (t - writing * v.beat - 200) / 1000 : -1
    if (el > 0) penText(ctx, job, el, COLS.note, top + 40 + n * 18 + 16, v.pen)
    drawArt(ctx, e, { x: COLS.art, y: top + 10, w: PW - M - COLS.art, h: ROW_H - 20 })
    rule(ctx, top + ROW_H, HAIRLINE)
  })
}
const rule = (ctx: Ctx, y: number, c: string) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M, y + 0.5); ctx.lineTo(PW - M, y + 0.5); ctx.stroke() }
/** set `text` in lines no wider than `maxW`; returns how many lines it took */
function wrap(ctx: Ctx, text: string, x: number, y: number, maxW: number, lh: number) {
  const out: string[] = []
  for (const word of text.split(' ')) {
    const last = out[out.length - 1]
    if (last && ctx.measureText(`${last} ${word}`).width <= maxW) out[out.length - 1] = `${last} ${word}`
    else out.push(word)
  }
  out.forEach((l, i) => ctx.fillText(l, x, y + i * lh))
  return out.length
}

// ── The pen (brand/bento/artifact.ts): its strokes, drawn as far as `el` seconds, mask the real text ──
let scratch: OffscreenCanvas | null = null
function penText(ctx: Ctx, line: Pen, el: number, x: number, baseline: number, colour: string) {
  if (el >= line.total + 0.05) {
    setFont(ctx, `${line.size}px ${FONT.hand}`); ctx.fillStyle = colour; ctx.fillText(line.text, x, baseline)
    return
  }
  ctx.save()
  const m = ctx.getTransform()
  const k = Math.hypot(m.a, m.b)
  const pad = line.size * 0.4, W = Math.ceil((line.w + pad * 2) * k), H = Math.ceil(line.size * 2 * k)
  const oy = line.size * 1.2
  scratch ??= new OffscreenCanvas(W, H)
  if (scratch.width !== W || scratch.height !== H) { scratch.width = W; scratch.height = H }
  const g = scratch.getContext('2d')!
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H)
  g.setTransform(k, 0, 0, k, 0, 0)
  g.translate(pad - line.x, oy - line.baseline)
  g.lineCap = g.lineJoin = 'round'; g.lineWidth = line.width; g.strokeStyle = '#000'
  for (const s of line.strokes) {
    const f = clamp01((el - s.at) / Math.max(1e-3, s.dur))
    if (f <= 0) continue
    g.setLineDash([f * (s.len + 1), s.len + 2])
    g.beginPath(); s.pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke()
  }
  g.setLineDash([])
  g.setTransform(k, 0, 0, k, 0, 0)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = colour; g.font = `${line.size}px ${FONT.hand}`
  g.fillText(line.text, pad, oy)
  g.globalCompositeOperation = 'source-over'
  ctx.setTransform(1, 0, 0, 1, m.e + (x - pad) * k, m.f + (baseline - oy) * k)
  ctx.drawImage(scratch, 0, 0)
  ctx.restore()
}
