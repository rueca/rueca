/* Styles: Rueca's generative art in twelve one-tone styles, and the poster series made from them
   (research/31-one-tone-styles). Pure functions of (values); the studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock } from '@kit'
import goudyUrl from '@/landing/fonts/sorts-mill-goudy-regular.woff2?url'
import goudyItalicUrl from '@/landing/fonts/sorts-mill-goudy-italic.woff2?url'
import plexUrl from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url' // Host Grotesk is for the logo only
import handUrl from '@fontsource/la-belle-aurore/files/la-belle-aurore-latin-400-normal.woff2?url'
import { LOCKUP } from '../bento/lockups'
import { STYLES, type StyleId } from './styles'
import { DEFAULTS, SOURCES, MONO, loadSources, renderStyle, sources, type SourceId } from './render'
import { markRelief, type Relief } from './tone'
import { HANDS } from './wheel12'
import { posterSpec, POSTER, INKS, SHEET, AT, PLATE, COATED, type El, type Font } from './posters'

export const FONT = { goudy: '"Styles Goudy", serif', plex: '"Styles Plex", sans-serif', hand: '"Styles Hand", cursive' }
const LANA = '#FDFBFA'

export const schema = defineSchema({
  view: folder('View', {
    view: p.select('poster', [{ value: 'poster', label: 'Poster' }, { value: 'board', label: 'Sketchbook' }], { display: 'segmented', label: 'Show', hint: 'Poster: one wheel, twelve hands, the series. Sketchbook: the twelve styles side by side, each on a source of your choosing (photos, the Saxony plate, the mark).' }),
    style: p.select('engraving', STYLES.map((s) => ({ value: s.id, label: `${s.name} · ${s.english}` })), { label: 'Style', when: (v) => v.view === 'poster' }),
  }),
  art: folder('Art', {
    // poster: ink and seed apply; the rest is for the sketchbook
    source: p.select('default', [{ value: 'default', label: 'The style’s own' }, ...SOURCES.map((s) => ({ value: s.id, label: s.label }))], { label: 'Source', hint: 'Sketchbook only: what each style draws from. The posters always draw the one wheel.', when: (v) => v.view === 'board' }),
    ink: p.select('default', [{ value: 'default', label: 'The style’s own' }, ...Object.entries(INKS).map(([k, i]) => ({ value: k, label: i.name }))], { label: 'Ink', hint: 'One ink per sheet: art, type and rules all print in it.' }),
    scale: p.number(1, { min: 0.4, max: 2.5, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Mark size', hint: 'The size of the style’s mark: line gap, dot, pixel, character, square.' , when: (v) => v.view === 'board' }),
    zoom: p.number(1, { min: 0.5, max: 3, step: 0.05, fmt: (v) => `${v.toFixed(2)}×`, label: 'Zoom', hint: 'How close the plate crops in on its subject.' , when: (v) => v.view === 'board' }),
    fx: p.number(0.5, { min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Focus across' , when: (v) => v.view === 'board' }),
    fy: p.number(0.5, { min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Focus down' , when: (v) => v.view === 'board' }),
    seed: p.number(7, { min: 1, max: 999, step: 1, label: 'Seed', hint: 'The random grain of stipple, riso, plotter and cyanotype.' }),
  }),
})
export const params = createParams(schema, { id: 'rueca-styles', version: 1 })
export type V = ReturnType<typeof params.values>
export const clock = createClock({ duration: 1000, loop: false })
export const sizeOf = (v: V) => (v.view === 'board' ? { w: 2000, h: 1875 } : { w: SHEET.w, h: SHEET.h })

let ready = false
let relief: Relief | null = null
export async function loadAssets() {
  const font = async (family: string, url: string, weight = '400', style = 'normal') => { const f = new FontFace(family, `url(${url})`, { weight, style }); await f.load(); document.fonts.add(f) }
  await Promise.all([font('Styles Goudy', goudyUrl), font('Styles Goudy', goudyItalicUrl, '400', 'italic'), font('Styles Plex', plexUrl, '100 700'), font('Styles Hand', handUrl), loadSources()])
  relief = markRelief(5, 6)
  ready = true
}

/** the board's crops, on top of each style's defaults (the exploratory view: each style on its own source) */
const BOARD: Partial<Record<StyleId, Partial<{ src: SourceId; zoom: number; fx: number; fy: number; scale: number }>>> = {
  wood: { src: 'wheelDark' }, lines: { src: 'mark' }, riso: { src: 'wheel' }, dither: { src: 'saxony' }, ascii: { src: 'wheelDark' },
}
export function styleSettings(id: StyleId, v: V) {
  const d = { ...DEFAULTS[id], ...(BOARD[id] ?? {}) }
  const ink = v.ink === 'default' ? INKS[POSTER[id].ink].hex : INKS[v.ink].hex
  return { src: (v.source === 'default' ? d.src : v.source) as SourceId, ink, scale: d.scale * v.scale, angle: d.angle, zoom: d.zoom * v.zoom, fx: v.fx === 0.5 ? d.fx : v.fx, fy: v.fy === 0.5 ? d.fy : v.fy, seed: v.seed }
}

export function draw(ctx: CanvasRenderingContext2D, v: V, w: number, h: number) {
  ctx.fillStyle = LANA; ctx.fillRect(0, 0, w, h)
  if (!ready || !sources) return
  if (v.view === 'board') return drawBoard(ctx, v, w, h)
  drawPoster(ctx, v.style as StyleId, v)
}

export const inkFor = (id: StyleId) => INKS[POSTER[id].ink].hex
const inkOf = (id: StyleId, v: V) => (v.ink === 'default' ? INKS[POSTER[id].ink].hex : INKS[v.ink].hex)
/** the plate, drawn by the style's hand at the series' one crop; returns the numbers it used */
function drawPlate(ctx: CanvasRenderingContext2D, id: StyleId, v: V) {
  const pl = id === 'cyanotype' ? COATED : PLATE
  return HANDS[id](ctx, pl, relief!, AT, { ink: inkOf(id, v), paper: LANA, seed: v.seed }, MONO)
}
const readouts = new Map<string, string>()
/** the sheet's elements; the settings line is the renderer's own report (drawn once off-screen if not cached) */
export function posterEls(id: StyleId, v: V) {
  const key = `${id}:${v.seed}`
  if (!readouts.has(key)) { const c = document.createElement('canvas'); c.width = 1200; c.height = 1600; readouts.set(key, drawPlate(c.getContext('2d')!, id, v)) }
  return posterSpec(id, readouts.get(key)!)
}

/** one poster at 1200 × 1600; `artOnly` leaves the type off (for Figma, where the type is live) */
export function drawPoster(ctx: CanvasRenderingContext2D, id: StyleId, v: V, artOnly = false) {
  const ink = inkOf(id, v)
  readouts.set(`${id}:${v.seed}`, drawPlate(ctx, id, v))
  if (artOnly) return
  for (const e of posterEls(id, v)) if (e.kind !== 'art') drawEl(ctx, e, ink)
}

export function drawEl(ctx: CanvasRenderingContext2D, e: El, ink: string) {
  ctx.save(); ctx.fillStyle = ctx.strokeStyle = ink
  if (e.kind === 'rule') { ctx.lineWidth = e.w; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke() }
  else if (e.kind === 'cross') { ctx.lineWidth = 0.75; ctx.beginPath(); ctx.moveTo(e.x - e.r, e.y); ctx.lineTo(e.x + e.r, e.y); ctx.moveTo(e.x, e.y - e.r); ctx.lineTo(e.x, e.y + e.r); ctx.stroke() }
  else if (e.kind === 'logo') {
    const k = e.h / LOCKUP.h
    ctx.translate(e.x, e.y); ctx.scale(k, k)
    for (const d of LOGO_PATHS) ctx.fill(d, 'evenodd')
  } else if (e.kind === 'text') {
    ctx.font = fontOf(e.font, e.size); ctx.textAlign = e.align ?? 'left'
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = e.font === 'plexCaps' ? `${e.size * 0.1}px` : e.font === 'goudy' ? `${-e.size * 0.015}px` : '0px'
    if (e.rotate) { ctx.translate(e.x, e.y); ctx.rotate(e.rotate); ctx.translate(-e.x, -e.y) }
    let size = e.size
    if (e.maxW && !e.lead) { const mw = ctx.measureText(e.text).width; if (mw > e.maxW) { size = (e.size * e.maxW) / mw; ctx.font = fontOf(e.font, size) } }
    const lines = e.lead ? wrap(ctx, e.text, e.maxW ?? 1e9) : [e.text]
    lines.forEach((l, i) => ctx.fillText(l, e.x, e.y + i * (e.lead ?? 0)))
  }
  ctx.restore()
}
export function fontOf(f: Font, size: number) {
  return f === 'goudy' ? `400 ${size}px ${FONT.goudy}` : f === 'goudyItalic' ? `italic 400 ${size}px ${FONT.goudy}` : f === 'hand' ? `400 ${size}px ${FONT.hand}` : f === 'plexCaps' ? `500 ${size}px ${FONT.plex}` : `400 ${size}px ${FONT.plex}`
}
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = []
  for (const wd of text.split(' ')) { const l = out[out.length - 1]; if (l && ctx.measureText(`${l} ${wd}`).width <= maxW) out[out.length - 1] = `${l} ${wd}`; else out.push(wd) }
  return out
}
const LOGO_PATHS = [
  'M139.4 108.6A61.1 61.1 0 1 0 261.6 108.6A61.1 61.1 0 1 0 139.4 108.6Z',
  'M47.5 140.7A29 29 0 1 0 105.5 140.7A29 29 0 1 0 47.5 140.7Z',
  'M200.5 217.2L76.5 217.2A76.5 76.5 0 0 1 39.38 73.81L147.8 13.64A108.6 108.6 0 1 1 200.5 217.2ZM200.5 192.2L76.5 192.2A51.5 51.5 0 0 1 51.51 95.67L159.94 35.5A83.6 83.6 0 1 1 200.5 192.2Z',
  LOCKUP.word,
].map((d) => new Path2D(d))

/** the twelve, side by side, on the chosen source (or each on its own) */
function drawBoard(ctx: CanvasRenderingContext2D, v: V, w: number, h: number) {
  const cols = 4, rows = 3, cw = w / cols, ch = h / rows
  STYLES.forEach((st, i) => {
    const s = styleSettings(st.id, v), box = { x: (i % cols) * cw + 12, y: Math.floor(i / cols) * ch + 12, w: cw - 24, h: ch - 64 }
    renderStyle(ctx, st.id, box, s.src, { frame: box, zoom: s.zoom * 0.85, fx: s.fx, fy: s.fy }, { ink: s.ink, paper: LANA, scale: s.scale * 0.8, seed: s.seed, angle: s.angle })
    ctx.fillStyle = s.ink; ctx.font = `400 22px ${FONT.goudy}`; ctx.fillText(st.name, box.x, box.y + box.h + 30)
    ctx.font = `400 13px ${FONT.plex}`; ctx.fillText(st.english, box.x, box.y + box.h + 48)
  })
}
