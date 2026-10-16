/* The Rueca bento: Rafael's grid (Downloads/rueca-bento.svg, 16 Oct), animated as a loop in its own right,
   with the current assets: the Host Grotesk lockup, the Mora palette, the landing's kit drawings. Pure
   functions of (values, t); the studio never reaches in here. Laid out in the bento's own units (937
   square) and scaled to the artboard.

   A relay, one tile at a time (the Trove and web references agree: the grid holds still, one thing moves),
   and every tile comes back to its resting state, so the loop has no seam:
     · the lockup plays the approved logo animation (E2, brand/logo/fan) at lockup size:
       the mark races its Mora folds, the word wipes in and pulls it over; it clears just before the loop restarts;
     · the close-up wheel races with it, then again on the kit's beat, a whole number of times a loop;
     · the fig tile counts the kit drawings: as each drawing lands, the pen deletes the last fig and writes the next
       (fig.1 … fig.6, then fig.1 again as the loop closes), in one colour;
     · faint rules run down the gutters with crosshairs where they cross, the landing's plate grid;
     · the swatches turn, one after another, to their text shades and back;
     · the kit drawings turn over, six to a loop; each one settles, then its parts lift apart and come back;
     · the poster stays still (Rafael's comments, 16 Oct). */
import { defineSchema, folder, p, createParams, createClock } from '@kit'
import { cubicBezier } from '@kit/core/ease'
import { assets, FONT, HAND_X, KIT, KP_STEPS, type Pen } from './assets'
import { LOCKUP } from './lockups'

// ── Mora (brand/RUECA.md → Colour) ────────────────────────────────────────────
type Dye = 'achiote' | 'cielo' | 'gualda' | 'malva' | 'hoja' | 'cochinilla'
const SHEET = '#FDFBFA', PLATINO = '#DCDAD9', INK = '#171615', NIGHT = '#181716', TEXT = '#F7F5F4'
const DYE: Record<Dye, string> = { achiote: '#F6571C', cielo: '#5070F0', gualda: '#FFD000', malva: '#EFA6FF', hoja: '#84C900', cochinilla: '#B0006A' }
const NIGHT_DYE: Record<Dye, string> = { achiote: '#FF6A2C', cielo: '#7088FF', gualda: '#FFD84D', malva: '#F2B3FF', hoja: '#9BD83A', cochinilla: '#D23A84' }
const MORA = '#6E1A3E'

/** the swatches, reading order: each colour and its text shade (RUECA.md). `fig` labels the fill (Rafael's
    checkerboard), `figText` the text shade: when the shades swipe in, the labels move to the other blocks. */
const SWATCHES: { name: string; fill: string; text: string; fig?: string; figText?: string }[] = [
  { name: 'Platino', fill: PLATINO, text: '#363534', fig: 'fig.4' },
  { name: 'Gualda', fill: DYE.gualda, text: '#B07000', figText: 'fig.5' },
  { name: 'Achiote', fill: DYE.achiote, text: '#CD4000', fig: 'fig.9' },
  { name: 'Hoja', fill: DYE.hoja, text: '#278800', figText: 'fig.11' },
  { name: 'Nogal', fill: INK, text: TEXT, figText: 'fig.7' },
  { name: 'Mora', fill: MORA, text: '#B0006A', fig: 'fig.8' },
  { name: 'Malva', fill: DYE.malva, text: '#9640B0', figText: 'fig.10' },
  { name: 'Cielo', fill: DYE.cielo, text: '#3D5BD6', fig: 'fig.12' },
]

// ── The bento's frame: Rafael's file, with the palette moved up a row and fig.1 and the kit down (his comment, 16 Oct) ──
const S = 937
// One space everywhere: the margin round the edge and every gutter are G (Rafael: "make sure all the spacing around
// the cards is even"). His file had 21 at the edge and 20 between; 20.5 keeps every tile its size: 4G + 3 × 285 = 937
// across, and 4G + 273 + 285 + 297 down.
const G = 20.5, COL = 285, ROW = [273, 285, 297]
const COL_X = [G, G * 2 + COL, G * 3 + COL * 2], ROW_Y = [G, G * 2 + ROW[0], G * 3 + ROW[0] + ROW[1]]
const TILE = {
  top: { x: COL_X[0], y: ROW_Y[0], w: COL * 3 + G * 2, h: ROW[0] },
  wheel: { x: COL_X[0], y: ROW_Y[1], w: COL, h: ROW[1] },
  swatch: { x: COL_X[1], y: ROW_Y[1], w: COL * 2 + G, h: ROW[1] },
  poster: { x: COL_X[0], y: ROW_Y[2], w: COL, h: ROW[2] },
  fig: { x: COL_X[1], y: ROW_Y[2], w: COL, h: ROW[2] },
  kit: { x: COL_X[2], y: ROW_Y[2], w: COL, h: ROW[2] },
}
// the swatches: Rafael's column widths (148, 147, 148, 147), two equal rows
const CELL_X = [0, 148, 295, 443, 590].map((x) => TILE.swatch.x + x), CELL_Y = [0, 0.5, 1].map((k) => TILE.swatch.y + TILE.swatch.h * k)
/** where Rafael's fig.1 tile was (the outlined "fig.1" is placed against it): the hand is set relative to this */
const FIG_FROM = { x: 326, y: 314, h: 285 }

// ── The mark: Pulido geometry (brand/logo/pulido.json), as in brand/logo/fan/artifact.ts ──
const MARK_W = 309.1, LOCK_H = 217.2, SPAN = LOCKUP.w - MARK_W
const WHEEL = { cx: 200.5, cy: 108.6, r: 61.1 }
const WHORL = { cx: 76.5, cy: 140.7, r: 29 }
const BIG = { cx: 200.5, cy: 108.6, r: 96.1 }, SMALL = { cx: 76.5, cy: 140.7, r: 64 }, BAND_W = 25
const MARK_PATHS = {
  wheel: 'M139.4 108.6A61.1 61.1 0 1 0 261.6 108.6A61.1 61.1 0 1 0 139.4 108.6Z',
  whorl: 'M47.5 140.7A29 29 0 1 0 105.5 140.7A29 29 0 1 0 47.5 140.7Z',
  band: 'M200.5 217.2L76.5 217.2A76.5 76.5 0 0 1 39.38 73.81L147.8 13.64A108.6 108.6 0 1 1 200.5 217.2ZM200.5 192.2L76.5 192.2A51.5 51.5 0 0 1 51.51 95.67L159.94 35.5A83.6 83.6 0 1 1 200.5 192.2Z',
}
const TAN = (() => { const dx = BIG.cx - SMALL.cx, dy = BIG.cy - SMALL.cy, L = Math.hypot(dx, dy); return Math.atan2(dy, dx) - Math.acos((SMALL.r - BIG.r) / L) })()
const tA = { x: SMALL.cx + SMALL.r * Math.cos(TAN), y: SMALL.cy + SMALL.r * Math.sin(TAN) }
const tB = { x: BIG.cx + BIG.r * Math.cos(TAN), y: BIG.cy + BIG.r * Math.sin(TAN) }
const BAND_LEN = Math.hypot(tB.x - tA.x, tB.y - tA.y) + BIG.r * (Math.PI / 2 - TAN) + (BIG.cx - SMALL.cx) + SMALL.r * (TAN + Math.PI * 1.5)
function bandPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); ctx.moveTo(tA.x, tA.y); ctx.lineTo(tB.x, tB.y)
  ctx.arc(BIG.cx, BIG.cy, BIG.r, TAN, Math.PI / 2); ctx.lineTo(SMALL.cx, SMALL.cy + SMALL.r)
  ctx.arc(SMALL.cx, SMALL.cy, SMALL.r, Math.PI / 2, TAN + Math.PI * 2)
}
type Shape = 'whorl' | 'wheel' | 'band'
const SHAPES: Shape[] = ['band', 'wheel', 'whorl']
/** Mora's "Stack" sequence, first fold to last, ink after (src/landing/LogoIntro.tsx) */
const FOLDS: Record<Shape, Dye[]> = {
  band: ['malva', 'cielo', 'achiote', 'cochinilla'],
  wheel: ['gualda', 'malva', 'achiote', 'cochinilla'],
  whorl: ['hoja', 'cielo', 'achiote', 'cochinilla'],
}
/** E2's race (brand/logo/fan/e2-approved.json) */
const RACE = { whorl: { delay: 0, dur: 500, start: 27 }, wheel: { delay: 120, dur: 600, start: 270 }, band: { delay: 240, dur: 700, start: 0 } }
const PATHS = { wheel: new Path2D(MARK_PATHS.wheel), whorl: new Path2D(MARK_PATHS.whorl), band: new Path2D(MARK_PATHS.band) }

// ── Schema ─────────────────────────────────────────────────────────────────────
const sec = (v: number) => `${(v / 1000).toFixed(2)}s`
const at = (v: number, hint: string, label = 'Starts at') => p.number(v, { min: 0, max: 20000, step: 50, fmt: sec, label, hint })

export const schema = defineSchema({
  loop: folder('Loop', {
    loopMs: p.number(14400, { min: 6000, max: 20000, step: 100, fmt: sec, label: 'Length', hint: 'One loop. Every tile is back at rest by the end, so it repeats without a seam.' }),
    wheelMode: p.select('spin', [{ value: 'spin', label: 'Spin' }, { value: 'race', label: 'Race' }], { display: 'segmented', label: 'Close-up', hint: 'Spin: colour fans keep setting off round the wheel, each at its own speed, so it never stops. Race: the logo’s race, a few times a loop, resting between.' }),
    fans: p.number(30, { min: 10, max: 60, step: 5, label: 'Fans a loop', hint: 'Spin: how many fans set off in one loop. A multiple of five keeps the colours repeating with the loop.', when: (v) => v.wheelMode === 'spin' }),
    fanSpread: p.number(1, { min: 0, max: 1.5, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Speed spread', hint: 'Spin: how much the fans’ speeds differ. 0 runs them all alike.', when: (v) => v.wheelMode === 'spin' }),
    wheelTurns: p.number(6, { min: 1, max: 12, step: 1, label: 'Wheel races', hint: 'How many times a loop the close-up wheel races: the first with the logo, the rest evenly after it, so it repeats exactly with the loop. Six keeps time with the kit drawings and the figs.' }),
  }),
  logo: folder('Logo', {
    logoAt: at(250, 'When the logo animation starts. The close-up wheel races with it.'),
    stagger: p.number(130, { min: 40, max: 300, step: 5, unit: 'ms', label: 'Fold stagger', hint: 'The gap between one colour fold setting off and the next.' }),
    raceEase: p.curve([0.33, 1, 0.68, 1], { label: 'Race ease', hint: 'How every fold moves (E2, approved).' }),
    typeAt: p.number(0.82, { min: 0.3, max: 1.3, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Word at', hint: 'How far through the mark’s race the word starts.' }),
    wordDur: p.number(800, { min: 200, max: 3000, step: 10, fmt: sec, label: 'Word wipe', hint: 'How long the word takes to wipe in, pulling the mark over.' }),
    wordEase: p.curve([0.45, 0, 0.2, 1], { label: 'Word ease', hint: 'One steady pull of thread (E2).' }),
    soloScale: p.number(1, { min: 1, max: 2.2, step: 0.05, fmt: (v) => `${v.toFixed(2)}×`, label: 'Mark alone at', hint: 'How much bigger the mark races while alone; it shrinks to lockup size as the word pulls it over. 1× races it in place, like the site’s header.' }),
    clearDur: p.number(520, { min: 0, max: 1500, step: 10, fmt: (v) => (v ? sec(v) : 'cut'), label: 'Clear', hint: 'At the end of the loop the lockup wipes away left to right, so the animation can start again from empty.' }),
  }),
  fig: folder('fig', {
    delStep: p.number(55, { min: 20, max: 300, step: 5, unit: 'ms', label: 'Delete', hint: 'The beat between one character going and the next, right to left.' }),
    rewrite: p.number(120, { min: 0, max: 1000, step: 10, unit: 'ms', label: 'Pause', hint: 'The pause between the last character going and the pen starting.' }),
  }, { collapsed: true }),
  swatches: folder('Swatches', {
    swatchGap: p.number(85, { min: 0, max: 400, step: 5, unit: 'ms', label: 'Stagger', hint: 'The gap between one swatch turning and the next, in reading order.' }),
    swatchDur: p.number(520, { min: 100, max: 1500, step: 10, fmt: sec, label: 'Wipe', hint: 'How long each swatch’s wipe takes.' }),
    swatchEase: p.curve([0.32, 0.72, 0, 1], { label: 'Ease', hint: 'Flat colour wipes in (brand/RUECA.md §7).' }),
    steps: p.number(1, { min: 0, max: 1.5, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Steps', hint: 'How irregular the splits are: each swatch keeps its own share of the last set, so the bands step up and down across the grid. 0 lines them all up.' }),
    sliver: p.number(0.2, { min: 0, max: 0.5, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Last set shows', hint: 'How much of the previous set stays at the bottom of each swatch: the new one slides down over it and pushes it along.' }),
    scramble: p.number(420, { min: 0, max: 1500, step: 10, fmt: (v) => (v ? sec(v) : 'off'), label: 'Hex runs for', hint: 'How long the hex code runs through characters before it lands.', when: (v) => v.labels !== 'none' }),
    labels: p.select('none', [{ value: 'none', label: 'None' }, { value: 'checker', label: 'Half' }, { value: 'all', label: 'All' }], { display: 'segmented', label: 'Labels', hint: 'None: just colour. Half: Rafael’s checkerboard of name, fig and hex, moving to the other half when the text shades come in. All: every swatch.' }),
  }, { collapsed: true }),
  poster: folder('Poster', {
    marksAt: at(900, 'When the pen circles "prototype" and underlines "tool".', 'Pen marks at'),
    marksOff: p.number(1100, { min: 300, max: 4000, step: 50, fmt: sec, label: 'Off before end', hint: 'How long before the loop ends the marks draw back off, so the loop starts clean.' }),
    pageDur: p.number(760, { min: 200, max: 2000, step: 10, fmt: sec, label: 'Swipe', hint: 'How long a page takes to slide in over the other.' }),
  }, { collapsed: true }),
  kit: folder('Kit drawings', {
    kitTurns: p.number(6, { min: 1, max: 12, step: 1, label: 'Per loop', hint: 'How many drawings turn over in one loop. Six shows each once and closes the loop on the first.' }),
    kitMove: p.select('sheet', [{ value: 'sheet', label: 'Sheet' }, { value: 'push', label: 'Push' }, { value: 'cut', label: 'Cut' }], { display: 'segmented', label: 'Change', hint: 'Sheet: the next drawing slides in on its coloured sheet, over the last one. Push: it slides the last one out. Cut: a hard change.' }),
    kitDur: p.number(720, { min: 100, max: 1500, step: 10, fmt: sec, label: 'Change time', hint: 'How long the drawing takes to slide in.' }),
    sheetDur: p.number(460, { min: 100, max: 1500, step: 10, fmt: sec, label: 'Sheet time', hint: 'How long its coloured sheet takes. Shorter than the drawing: the sheet lands first and the drawing follows onto it.' }),
    kitEase: p.curve([0.32, 0.72, 0, 1], { label: 'Ease', hint: 'The kit’s step curve (brand/RUECA.md §7).' }),
    partsAfter: p.number(250, { min: 0, max: 1500, step: 10, unit: 'ms', label: 'Parts after', hint: 'How long a drawing rests once it has landed before its parts lift apart.' }),
    partsOut: p.number(620, { min: 100, max: 2000, step: 10, fmt: sec, label: 'Apart', hint: 'How long the parts take to lift apart.' }),
    partsHold: p.number(300, { min: 0, max: 2000, step: 10, unit: 'ms', label: 'Held apart', hint: 'How long the parts stay apart.' }),
    partsBack: p.number(560, { min: 100, max: 2000, step: 10, fmt: sec, label: 'Together', hint: 'How long they take to come back together.' }),
    partsEase: p.curve([0.22, 1, 0.36, 1], { label: 'Parts ease', hint: 'The landing card’s own curve for its parts.' }),
    kitScale: p.number(0.97, { min: 0.6, max: 1.4, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Size', hint: 'The drawing’s size against the tile. The landing’s cards draw it at 90%; Rafael’s bento crops in closer.' }),
  }, { collapsed: true }),
  output: folder('Output', {
    size: p.size({ w: 1080, h: 1080 }, { hint: 'Artboard and export size.', presets: [{ label: '1080', w: 1080, h: 1080 }, { label: '1600', w: 1600, h: 1600 }, { label: '2160', w: 2160, h: 2160 }, { label: '4:5', w: 1080, h: 1350 }] }),
    grid: p.boolean(true, { label: 'Grid', hint: 'Faint rules down the gutters and round the edge, with crosshairs where gutters cross: the landing’s plate grid.' }),
    guides: p.boolean(false, { label: 'Show the mock', hint: 'Outlines of Rafael’s tiles, to check the layout against the file.' }),
  }, { collapsed: true }),
})

export const params = createParams(schema, { id: 'rueca-bento', version: 7, presets: [ // v7: a poster page per kit drawing; v6: fig counts the drawings, grid; v5: swatch sliver, sheet speed, poster pages; v4: palette up a row, no swatch text, smaller kit drawings, grey page; v3: Rafael's comments (dark logo tile, still poster, fig.1 → fig.2, parts); v2: its own loop, no v0.1 → v0.2
  { name: 'Mark grows (E2)', values: { soloScale: 1.4 } },
  { name: 'Slow', values: { loopMs: 19200, stagger: 150, wordDur: 1100, swatchGap: 120, swatchDur: 700, partsAfter: 400, partsOut: 850, partsHold: 450, partsBack: 750 } },
  { name: 'Hard cuts', values: { kitMove: 'cut', swatchDur: 100, scramble: 0, clearDur: 0 } },
] })
export type V = ReturnType<typeof params.values>

// ── Timing: one source for the drawing and the timeline (all ms) ─────────────
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const N = 4 // folds per shape
const foldAt = (v: V, s: Shape, j: number) => RACE[s].delay + j * v.stagger + (j === N ? 80 : 0)
const shapeEnd = (v: V, s: Shape) => foldAt(v, s, N) + RACE[s].dur
const raceSpan = (v: V) => Math.max(...SHAPES.map((s) => shapeEnd(v, s)))
export const wordStart = (v: V) => v.logoAt + v.typeAt * raceSpan(v)
export const logoEnd = (v: V) => Math.max(v.logoAt + raceSpan(v), wordStart(v) + v.wordDur)
const clearStart = (v: V) => v.loopMs - 200 - v.clearDur
/** fig: delete `from` character by character, pause, write `to`; returns when the pen starts and ends */
/** the longest the pen takes over a fig, measured (its strokes plus the moves between them), with a beat to spare */
const figPen = () => Math.max(...(assets?.fig.pens ?? []).map((p) => p.total)) * 1000 + 80
const figSwap = (v: V, t0: number, from: Pen) => { const pen = t0 + from.text.length * v.delStep + v.rewrite; return { pen, end: pen + figPen() } }
/** the fig changes once per kit drawing, timed so the new number is written as the drawing lands: change n (1 … kitTurns)
    starts this long before slot n begins. The last one turns fig.N back into fig.1 as the loop closes. */
const figLead = (v: V) => 6 * v.delStep + v.rewrite + figPen()
const figChange = (v: V, n: number) => n * kitSlot(v) - figLead(v)
/** the swatches turn over on the kit's beat (Rafael, 16 Oct: "sync this movement to match the others"): change n
    (1 … kitTurns) runs so the last swatch lands just as slot n begins, fills and text shades taking turns; with an
    even number of changes a loop, the loop ends where it began */
const swatchChange = (v: V, n: number, i: number) => n * kitSlot(v) - v.swatchDur - 7 * v.swatchGap - 40 + i * v.swatchGap
export const totalMs = (v: V) => v.loopMs
/** wheel races in the close-up, the first with the logo */
export function wheelRaces(v: V): number[] {
  const out = [v.logoAt]
  // evenly through the loop from the logo's race, so race n + 1 of this loop is the first of the next (Rafael, 16 Oct)
  const every = v.loopMs / v.wheelTurns
  for (let k = 1; k < v.wheelTurns; k++) out.push(v.logoAt + k * every)
  return out
}
export const kitSlot = (v: V) => v.loopMs / v.kitTurns
const partsEnd = (v: V) => v.partsAfter + v.partsOut + v.partsHold + v.partsBack

/** the timeline's lanes, from the same timings the drawing uses; `over` flags a beat that runs past the loop */
export function beats(v: V) {
  return [
    { id: 'logo', label: 'Logo', spans: [{ start: v.logoAt, end: logoEnd(v) }, { start: clearStart(v), end: clearStart(v) + v.clearDur }] },
    { id: 'wheel', label: 'Close-up wheel', spans: v.wheelMode === 'spin' ? [{ start: 0, end: v.loopMs }] : wheelRaces(v).map((t) => ({ start: t + RACE.wheel.delay, end: t + shapeEnd(v, 'wheel') })) },
    { id: 'fig', label: 'fig · counts the drawings', spans: Array.from({ length: v.kitTurns }, (_, i) => ({ start: figChange(v, i + 1), end: figChange(v, i + 1) + figLead(v) })) },
    { id: 'swatch', label: 'Swatches', spans: Array.from({ length: v.kitTurns }, (_, n) => ({ start: swatchChange(v, n + 1, 0), end: swatchChange(v, n + 1, 7) + v.swatchDur })) },
    { id: 'parts', label: 'Kit · parts', spans: Array.from({ length: v.kitTurns }, (_, n) => ({ start: n * kitSlot(v) + v.partsAfter, end: n * kitSlot(v) + partsEnd(v) })) },
  ].map((b) => ({ ...b, spans: b.spans.map((s) => ({ ...s, over: s.end > v.loopMs })) }))
}

export const clock = createClock({ duration: totalMs(params.values()), loop: true })
params.subscribe((st) => clock.setState({ duration: totalMs(st.values as V) }))

// ── Draw ───────────────────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D
type Box = { x: number; y: number; w: number; h: number }
const clipBox = (ctx: Ctx, b: Box) => { ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip() }
const fillBox = (ctx: Ctx, b: Box, c: string) => { ctx.fillStyle = c; ctx.fillRect(b.x, b.y, b.w, b.h) }

export function draw(ctx: Ctx, v: V, t: number, w: number, h: number) {
  ctx.fillStyle = SHEET // the bento's ground: white, like the logo tile and the card, which carry a hairline (Rafael, 16 Oct)
  ctx.fillRect(0, 0, w, h)
  if (!assets) return // still loading (or mid hot-reload)
  const k = Math.min(w, h) / S
  ctx.save()
  ctx.translate((w - S * k) / 2, (h - S * k) / 2)
  ctx.scale(k, k)
  if (v.grid) drawGrid(ctx)
  const tiles: [Box, (ctx: Ctx, v: V, t: number) => void][] = [
    [TILE.top, drawTop], [TILE.wheel, drawWheel], [TILE.fig, drawFig], [TILE.kit, drawKit], [TILE.poster, drawPoster], [TILE.swatch, drawSwatches],
  ]
  for (const [box, fn] of tiles) { ctx.save(); clipBox(ctx, box); fn(ctx, v, t); ctx.restore() }
  if (v.guides) {
    ctx.strokeStyle = 'rgba(255,0,128,.6)'; ctx.lineWidth = 1 / k
    for (const b of Object.values(TILE)) ctx.strokeRect(b.x, b.y, b.w, b.h)
  }
  ctx.restore()
}

// ── The grid: the landing's plate (src/landing/plate.css, light sheet) ─────────
// Rules down the middle of every gutter and rails round the margin, under the tiles, so they show only between them;
// crosshairs where two gutters cross inside the sheet, never on its edge.
const RULE = '#e0dedd', CROSS = '#aaa9a8'
const GUTTER_X = [COL_X[1] - G / 2, COL_X[2] - G / 2], GUTTER_Y = [ROW_Y[1] - G / 2, ROW_Y[2] - G / 2], RAIL = [G / 2, S - G / 2]
function drawGrid(ctx: Ctx) {
  ctx.strokeStyle = RULE; ctx.lineWidth = 1
  ctx.beginPath()
  // every rule ends on the rails, like the site's rows meeting its side rails
  // the rails run the full height; the gutters' verticals start at the gutter under the logo tile, which spans the row
  for (const x of RAIL) { ctx.moveTo(x, RAIL[0]); ctx.lineTo(x, RAIL[1]) }
  for (const x of GUTTER_X) { ctx.moveTo(x, GUTTER_Y[0]); ctx.lineTo(x, RAIL[1]) }
  for (const y of [...GUTTER_Y, ...RAIL]) { ctx.moveTo(RAIL[0], y); ctx.lineTo(RAIL[1], y) }
  ctx.stroke()
  ctx.strokeStyle = CROSS
  ctx.beginPath()
  for (const x of GUTTER_X) for (const y of GUTTER_Y) { ctx.moveTo(x - 4.5, y); ctx.lineTo(x + 4.5, y); ctx.moveTo(x, y - 4.5); ctx.lineTo(x, y + 4.5) }
  ctx.stroke()
}

// ── The race (shared by the lockup and the close-up) ─────────────────────────
/** one shape racing its folds from `t0`, from empty; `ink` is the last racer and the settled shape */
function raceShape(ctx: Ctx, v: V, s: Shape, t: number, t0: number, folds: string[], ink: string) {
  const r = RACE[s], ease = cubicBezier(v.raceEase)
  if (t < t0 + foldAt(v, s, 0)) return
  if (t >= t0 + shapeEnd(v, s)) { ctx.fillStyle = ink; ctx.fill(PATHS[s], 'evenodd'); return }
  for (let j = 0; j <= N; j++) {
    const reach = ease(clamp01((t - t0 - foldAt(v, s, j)) / r.dur))
    if (reach <= 1e-5) continue
    ctx.fillStyle = ctx.strokeStyle = j === N ? ink : folds[j]
    if (s === 'band') {
      ctx.save(); ctx.clip(PATHS.band, 'evenodd')
      ctx.lineWidth = BAND_W + 2; ctx.lineCap = 'butt'
      ctx.setLineDash([reach * BAND_LEN, BAND_LEN * 2]); bandPath(ctx); ctx.stroke(); ctx.setLineDash([])
      ctx.restore()
    } else {
      const c = s === 'wheel' ? WHEEL : WHORL, a0 = (r.start * Math.PI) / 180
      ctx.beginPath()
      if (reach >= 1 - 1e-5) ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      else { ctx.moveTo(c.cx, c.cy); ctx.arc(c.cx, c.cy, c.r, a0, a0 + reach * Math.PI * 2); ctx.closePath() }
      ctx.fill()
    }
  }
}

/** the lockup at height `hgt` centred on (cx, cy), `ink` on its ground. With `t0` it plays E2 from t0:
    the mark races centred and bigger, the word wipes in and pulls it over. Without, it sits settled. */
function lockup(ctx: Ctx, v: V, t: number, cx: number, cy: number, hgt: number, ink: string, t0?: number, dyes: Record<Dye, string> = DYE) {
  const swept = t0 == null ? 1 : cubicBezier(v.wordEase)(clamp01((t - wordStart(v)) / v.wordDur))
  const ext = SPAN * swept, markX = (SPAN - ext) / 2, sc = t0 == null ? 1 : v.soloScale + (1 - v.soloScale) * swept
  ctx.save()
  ctx.translate(cx, cy); ctx.scale(hgt / LOCK_H, hgt / LOCK_H); ctx.scale(sc, sc); ctx.translate(-LOCKUP.w / 2, -LOCK_H / 2)
  ctx.translate(markX, 0)
  if (swept > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(MARK_W - 10, -LOCK_H, ext + 20, LOCK_H * 3); ctx.clip()
    ctx.fillStyle = ink; ctx.fill(assets!.word); ctx.restore()
  }
  for (const s of SHAPES) {
    if (t0 == null) { ctx.fillStyle = ink; ctx.fill(PATHS[s], 'evenodd') }
    else raceShape(ctx, v, s, t, t0, FOLDS[s].map((d) => dyes[d]), ink)
  }
  ctx.restore()
}

// ── 1 · The lockup: ink on the white sheet (Rafael tried it dark, then Platino, 16 Oct) ──
function drawTop(ctx: Ctx, v: V, t: number) {
  const b = TILE.top
  fillBox(ctx, b, SHEET)
  // the end of the loop: the lockup wipes away left to right, so it can race in again from empty
  const gone = v.clearDur ? cubicBezier([0.65, 0, 0.35, 1])(clamp01((t - clearStart(v)) / v.clearDur)) : t >= clearStart(v) ? 1 : 0
  if (gone >= 1) return // no border on the logo tile (Rafael, 16 Oct)
  ctx.save(); ctx.beginPath(); ctx.rect(b.x + b.w * gone, b.y, b.w, b.h); ctx.clip()
  lockup(ctx, v, t, b.x + b.w / 2, b.y + b.h / 2, 115.19, INK, v.logoAt)
  ctx.restore()
}
/** a white card's edge on the white ground: a thin ink line just inside it */
const HAIRLINE = 'rgba(23,22,21,.16)'
const hairline = (ctx: Ctx, b: Box) => {
  ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 0.75
  ctx.strokeRect(b.x + 0.375, b.y + 0.375, b.w - 0.75, b.h - 0.75)
}

// ── 2 · The close-up: the drive wheel at about 3.8×, centred where Rafael put it ──
/* Spin (Rafael, 16 Oct: "kept spinning and the speed varied as it moved per fan"): fans set off from twelve o'clock
   one after another, evenly through the loop, each sweeping a full turn on the race's ease-out but at its own speed,
   so one can catch the one ahead; each lies over the ones before. The colours cycle through the wheel's set and its
   Lana ground, and both lists divide the loop's fans, so it repeats with the loop. */
const FAN_COLOURS = [DYE.gualda, DYE.malva, DYE.achiote, DYE.cochinilla, SHEET]
const FAN_SPEED = [1.0, 1.55, 0.75, 1.3, 0.9, 1.75] // times a fan's turn, against the beat between fans
function drawSpin(ctx: Ctx, v: V, t: number) {
  const L = v.loopMs, beat = L / v.fans, ease = cubicBezier(v.raceEase), c = WHEEL, a0 = -Math.PI / 2
  const turn = (k: number) => beat * 2.4 * (1 + (FAN_SPEED[((k % FAN_SPEED.length) + FAN_SPEED.length) % FAN_SPEED.length] - 1) * v.fanSpread)
  const longest = beat * 2.4 * (1 + 0.75 * v.fanSpread)
  const now = Math.floor(t / beat)
  // the fans still moving, and under them the newest one that has finished (it fills the wheel)
  let base = now - Math.ceil(longest / beat) - 1
  for (let k = now; k >= base; k--) if (t >= k * beat + turn(k)) { base = k; break }
  const colour = (k: number) => FAN_COLOURS[((k % FAN_COLOURS.length) + FAN_COLOURS.length) % FAN_COLOURS.length]
  ctx.fillStyle = colour(base); ctx.beginPath(); ctx.arc(c.cx, c.cy, c.r + 1, 0, Math.PI * 2); ctx.fill()
  for (let k = base + 1; k <= now; k++) {
    const reach = ease(clamp01((t - k * beat) / turn(k)))
    if (reach <= 1e-5) continue
    ctx.fillStyle = colour(k); ctx.beginPath()
    if (reach >= 1 - 1e-5) ctx.arc(c.cx, c.cy, c.r + 1, 0, Math.PI * 2)
    else { ctx.moveTo(c.cx, c.cy); ctx.arc(c.cx, c.cy, c.r + 1, a0, a0 + reach * Math.PI * 2); ctx.closePath() }
    ctx.fill()
  }
}

function drawWheel(ctx: Ctx, v: V, t: number) {
  fillBox(ctx, TILE.wheel, SHEET) // light theme on Lana, the lightest colour (Rafael, 16 Oct): each race sweeps back to it
  if (v.wheelMode === 'spin') {
    ctx.save()
    const sc = 234.402 / WHEEL.r
    ctx.translate(TILE.wheel.x + 147.302, TILE.wheel.y + 152.601); ctx.scale(sc, sc); ctx.translate(-WHEEL.cx, -WHEEL.cy)
    drawSpin(ctx, v, t)
    ctx.restore()
    return
  }
  const all = wheelRaces(v), races = all.filter((t0) => t >= t0 + RACE.wheel.delay)
  if (!races.length) return
  ctx.save()
  const sc = 234.402 / WHEEL.r
  ctx.translate(TILE.wheel.x + 147.302, TILE.wheel.y + 152.601); ctx.scale(sc, sc); ctx.translate(-WHEEL.cx, -WHEEL.cy) // where Rafael centred it
  // the paper dyes race round, and the last fold, in the ground's own colour, sweeps them away again
  // (a sunburst and a wireframe look were tried and dropped, Rafael 16 Oct)
  raceShape(ctx, v, 'wheel', t, races[races.length - 1], FOLDS.wheel.map((d) => DYE[d]), SHEET)
  ctx.restore()
}

// ── 3 · fig.N, in the pen: one number per kit drawing ─────────────────────────
/** where the fig is written: the hand sits where it sat in Rafael's tile, moved with the tile, centred in its new height */
const figAt = () => { const f = assets!.fig; return { x: f.x + TILE.fig.x - FIG_FROM.x, baseline: f.baseline + TILE.fig.y - FIG_FROM.y + (TILE.fig.h - FIG_FROM.h) / 2 } }
/** notebook rules across a box, on the fig's grid (every RULE_GAP, one through the fig's baseline), so the bottom row's
    pages line up; grey (Rafael tried each in a brand colour, then went back, 16 Oct) */
const RULE_GAP = 46
function rules(ctx: Ctx, b: Box) {
  const base = figAt().baseline
  ctx.save(); ctx.strokeStyle = 'rgba(23,22,21,.13)'; ctx.lineWidth = 0.75
  ctx.beginPath()
  for (let y = base - Math.floor((base - TILE.fig.y) / RULE_GAP) * RULE_GAP; y < b.y + b.h; y += RULE_GAP) { if (y > b.y + 4) { ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y) } }
  ctx.stroke(); ctx.restore()
}

function drawFig(ctx: Ctx, v: V, t: number) {
  fillBox(ctx, TILE.fig, SHEET) // Lana, the lightest colour, the fig in ink (Rafael, 16 Oct)
  const f = assets!.fig, N = Math.min(v.kitTurns, f.pens.length)
  const { x, baseline } = figAt()
  rules(ctx, TILE.fig) // a notebook page, the fig written on one of its lines (Rafael, 16 Oct)
  // the latest change that has started: change n turns fig.n into fig.(n + 1), the last one back into fig.1
  let n = 0
  for (let k = 1; k <= N; k++) if (t >= figChange(v, k)) n = k
  if (n === 0) { pen(ctx, f.pens[0], Infinity, x, baseline, INK); specs(ctx, f.pens[0], x, baseline, Infinity, 0); return }
  const t0 = figChange(v, n), from = f.pens[n - 1], to = f.pens[n % N]
  const { pen: penAt } = figSwap(v, t0, from)
  if (t < penAt) {
    // delete: the characters go one at a time, right to left (the specs went with the first)
    const left = from.text.length - Math.floor((t - t0) / v.delStep)
    if (left > 0) pen(ctx, from, Infinity, x, baseline, INK, from.ends[left - 1] + 2)
    return
  }
  pen(ctx, to, (t - penAt) / 1000, x, baseline, INK)
  specs(ctx, to, x, baseline, t - penAt, n % N)
}

/* Spec notes round the fig, in the Achiote pen, like a designer's markup on a hand-off (Rafael, 16 Oct): what the fig
   measures, as drawn, in bento units. In the hand font with hand-drawn lines, three to a fig, a different three each
   time. They draw on and write in while the pen writes the fig, and go when it's deleted. */
/** the small notes' pen (the arrow to the card's logo, the fig specs): as thin as the hand's own strokes at their 13
    size (Rafael, 16 Oct), lighter than the headline's circle and underline */
const NOTE_PEN = 0.75
const SPEC = { line: '#F6571C', text: '#F6571C' } // the words in the same orange as their lines (Rafael, 16 Oct)
/** a spec line in the pen of the arrow to the card's logo: a gentle bow, not a ruler line, drawn on from its start */
function penLine(a: [number, number], z: [number, number], bow: number): [number, number][] {
  const mx = (a[0] + z[0]) / 2, my = (a[1] + z[1]) / 2, len = Math.hypot(z[0] - a[0], z[1] - a[1]) || 1
  const cx = mx - ((z[1] - a[1]) / len) * bow * len, cy = my + ((z[0] - a[0]) / len) * bow * len
  return Array.from({ length: 25 }, (_, i): [number, number] => { const u = i / 24; return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * cx + u * u * z[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * cy + u * u * z[1]] })
}
/** a rounded corner in the same pen: one stroke that bends hard round the corner point, well clear of the label inside it */
function cornerLine(a: [number, number], corner: [number, number], z: [number, number]): [number, number][] {
  return Array.from({ length: 25 }, (_, i): [number, number] => { const u = i / 24; return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * corner[0] + u * u * z[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * corner[1] + u * u * z[1]] })
}
/** the arrow's head, at the end of a pen line, as on the logo arrow */
function penHead(pts: [number, number][], size = 5): [number, number][] {
  const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 4], len = Math.hypot(ex - px, ey - py) || 1, ux = (ex - px) / len, uy = (ey - py) / len
  const wing = (a: number): [number, number] => { const c = Math.cos(a), s = Math.sin(a); return [ex - size * (ux * c - uy * s), ey - size * (ux * s + uy * c)] }
  return [wing(0.5), [ex, ey], wing(-0.5)]
}
function specs(ctx: Ctx, p: Pen, x: number, baseline: number, el: number, which: number) {
  const b = TILE.fig
  ctx.save(); ctx.font = `${p.size}px ${FONT.hand}`
  const m = ctx.measureText(p.text)
  const left = x - m.actualBoundingBoxLeft, right = x + m.actualBoundingBoxRight
  const top = baseline - m.actualBoundingBoxAscent, bottom = baseline + m.actualBoundingBoxDescent
  const r = (n: number) => Math.round(n)
  const all: { d: [number, number][]; label: string; at: [number, number]; align?: CanvasTextAlign }[] = [
    { d: [[left + 24, b.y + 6], [left + 24, top - 4]], label: `margin-top ${r(top - b.y)}`, at: [left + 31, b.y + (top - b.y) / 2 + 4] },
    { d: [[left + 40, top - 10], [right, top - 10]], label: `${r(right - left)} × ${r(bottom - top)}`, at: [(left + 40 + right) / 2, top - 16], align: 'center' },
    { d: [[right + 6, baseline], [b.x + b.w - 12, baseline]], label: `baseline`, at: [b.x + b.w - 12, baseline - 6], align: 'right' },
    { d: [[b.x + 12, b.y + b.h - 44], [b.x + 12, b.y + b.h - 12], [b.x + 44, b.y + b.h - 12]], label: 'radius 20', at: [b.x + 40, b.y + b.h - 34] },
    { d: [[b.x + b.w - 40, b.y + 14], [b.x + b.w - 12, b.y + 14]], label: `${r(p.size)}pt`, at: [b.x + b.w - 44, b.y + 18], align: 'right' },
  ]
  // a different three each fig: margin-top 0, size 1, baseline 2, radius 3, point size 4 (padding sat on the radius
  // corner, so it went, Rafael 16 Oct)
  const SETS = [[0, 1, 3], [1, 2, 4], [0, 2, 3], [1, 3, 4], [0, 2, 4], [0, 1, 4]]
  const items = SETS[which % SETS.length].map((k) => all[k])
  ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = NOTE_PEN // the logo arrow's pen
  ctx.font = `13px ${FONT.hand}`
  const draw = cubicBezier([0.65, 0, 0.35, 1])
  items.forEach((it, i) => {
    // one after another, a line then its words, all done within the pen's 0.7 s, so the loop ends with fig.1 complete
    const k = draw(clamp01((el - 90 * i) / 260))
    if (k <= 0) return
    // a dimension: a bowed line with a head at each end; the corner: one curved stroke round it
    const corner = it.d.length > 2
    const line = corner ? cornerLine(it.d[0], it.d[1], it.d[2]) : penLine(it.d[0], it.d[1], 0.06 * (i % 2 ? 1 : -1))
    stroke(ctx, line, k, SPEC.line)
    if (!corner && k >= 1) { stroke(ctx, penHead(line), 1, SPEC.line); stroke(ctx, penHead([...line].reverse()), 1, SPEC.line) }
    // the words write in once the line is down: uncovered left to right, like the pen
    const w = clamp01((el - 90 * i - 220) / 300)
    if (w > 0) {
      const tw = ctx.measureText(it.label).width, align = it.align ?? 'left'
      const x0 = align === 'left' ? it.at[0] : align === 'right' ? it.at[0] - tw : it.at[0] - tw / 2
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 4, it.at[1] - 16, (tw + 8) * w, 24); ctx.clip()
      ctx.fillStyle = SPEC.text; ctx.textAlign = align; ctx.fillText(it.label, it.at[0], it.at[1])
      ctx.restore()
    }
  })
  ctx.restore()
}

// ── 4 · The kit drawings: each lands, settles, comes apart and back together, and hands over ──
function drawKit(ctx: Ctx, v: V, t: number) {
  const b = TILE.kit
  fillBox(ctx, b, NIGHT)
  const kit = assets!.kit, slot = kitSlot(v)
  const n = Math.floor(t / slot), into = t - n * slot
  // the parts: apart and back while the drawing rests, before the hand-over
  const e = cubicBezier(v.partsEase)
  const apart = into < v.partsAfter + v.partsOut + v.partsHold
    ? e(clamp01((into - v.partsAfter) / v.partsOut))
    : 1 - e(clamp01((into - v.partsAfter - v.partsOut - v.partsHold) / v.partsBack))
  // the change into slot n+1 starts kitDur before the slot's end, so the loop's last change lands on the first drawing;
  // the sheet runs on its own, shorter clock and lands first
  const changeAt = slot - v.kitDur, ke = cubicBezier(v.kitEase)
  const p = v.kitMove === 'cut' ? (into >= slot - 1 ? 1 : 0) : ke(clamp01((into - changeAt) / v.kitDur))
  const ps = ke(clamp01((into - changeAt) / Math.min(v.sheetDur, v.kitDur)))
  const ia = n % kit.length, ic = (n + 1) % kit.length
  // each drawing on a sheet of the colour paired with its accent (assets.ts KIT)
  const art = (i: number, k: number, dx: number) => {
    fillBox(ctx, { ...b, x: b.x + dx }, KIT[i].sheet)
    const s = b.w * v.kitScale
    ctx.drawImage(kit[i][Math.round(clamp01(k) * KP_STEPS)], b.x + (b.w - s) / 2 + dx, b.y + (b.h - s) / 2, s, s)
  }
  if (p <= 0) { art(ia, apart, 0); return }
  if (p >= 0.999) { art(ic, 0, 0); return } // landed: drawn exactly as the next slot starts (a sub-pixel offset would show at the loop's seam)
  if (v.kitMove === 'push') { art(ia, 0, -b.w * p); art(ic, 0, b.w * (1 - p)); return }
  if (v.kitMove === 'cut') { art(ic, 0, 0); return }
  // sheet: the next sheet slides in from the right over the last drawing, which stays put, with a soft shadow on its
  // leading edge; the drawing follows onto it, slower, seen only on its own sheet
  art(ia, 0, 0)
  const edge = b.x + b.w * (1 - ps)
  ctx.save(); ctx.shadowColor = 'rgba(23,22,21,.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = -3
  fillBox(ctx, { ...b, x: edge }, KIT[ic].sheet); ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.rect(edge, b.y, b.w, b.h); ctx.clip()
  art(ic, 0, b.w * (1 - p))
  ctx.restore()
}

// ── 5 · The poster: the card holds still; the page under it swipes to a second note and back ──
function drawPoster(ctx: Ctx, v: V, t: number) {
  const b = TILE.poster
  const settle = cubicBezier([0.32, 0.72, 0, 1])
  // one page per kit drawing, on that drawing's sheet colour, swiping in with it (Rafael, 16 Oct). A page is the strip
  // beside the card, no wider: its writing is clipped to it, so a new page shows the moment it starts in
  const pages = assets!.hand, slot = kitSlot(v), W = 52 + 2 // to just under the card's edge (Rafael's file: 21 → 73)
  const pageOf = (k: number) => (k % v.kitTurns) % pages.length
  const page = (i: number, dx: number) => {
    const { lines, baselines, size } = pages[i]
    ctx.save(); ctx.beginPath(); ctx.rect(b.x + dx, b.y, W, b.h); ctx.clip()
    fillBox(ctx, { ...b, x: b.x + dx, w: W }, KIT[i].sheet)
    rules(ctx, { ...b, x: b.x + dx, w: W }) // ruled like the fig card, on the same lines
    // straight, as fitted to the sheet (Rafael tried it at 30°, 16 Oct), clipped by the tile and the card
    ctx.fillStyle = INK; ctx.font = `${size}px ${FONT.hand}`
    lines.forEach((l, k) => ctx.fillText(l, b.x + dx + HAND_X, b.y + baselines[k]))
    ctx.restore()
  }
  const k = Math.floor(t / slot), into = t - k * slot
  const q = settle(clamp01((into - (slot - v.kitDur)) / v.pageDur))
  if (q >= 0.999) page(pageOf(k + 1), 0) // landed: exactly as the next slot starts
  else page(pageOf(k), 0)
  if (q > 0 && q < 0.999) {
    // the next page slides in from the left over the last, a soft shadow on its leading edge
    const dx = -W * (1 - q), next = pageOf(k + 1)
    ctx.save(); ctx.shadowColor = 'rgba(23,22,21,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2
    fillBox(ctx, { ...b, x: b.x + dx, w: W }, KIT[next].sheet); ctx.restore()
    page(next, dx)
  }
  // the card, laid out against the tile as in Rafael's file (where the tile sat at 21, 619)
  ctx.save(); ctx.translate(b.x - 21, b.y - 619)
  const x = 73, y = 619, right = 21 + b.w
  ctx.fillStyle = SHEET; ctx.fillRect(x, y, 360, b.h) // the card in white (Rafael, 16 Oct), edged like the logo tile
  hairline(ctx, { x, y, w: right - x, h: b.h })
  // the card's dividers in the same pen as its border (Rafael, 16 Oct)
  ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 0.75
  ctx.beginPath(); ctx.moveTo(x, 657.5); ctx.lineTo(right, 657.5); ctx.moveTo(258.5, y); ctx.lineTo(258.5, 657.5); ctx.stroke()
  ctx.fillStyle = INK
  ctx.save(); ctx.translate(87, 633); ctx.scale(12.19 / LOCK_H, 12.19 / LOCK_H)
  for (const s of SHAPES) ctx.fill(PATHS[s], 'evenodd')
  ctx.fill(assets!.word); ctx.restore()
  ctx.font = `14px ${FONT.hand}`; ctx.textAlign = 'right'; ctx.fillText('fig.3', 299, 642); ctx.textAlign = 'left'
  ctx.font = `38px ${FONT.serif}`
  const HEAD = ['Spin your', 'prototype', 'into a tool.'], HX = 86, HY = (i: number) => 829 + i * 33.5
  HEAD.forEach((l, i) => ctx.fillText(l, HX, HY(i)))
  headlineMarks(ctx, v, t, HX, HY)
  logoNote(ctx, v, t)
  ctx.restore()
}

/* An arrow up at the card's logo, then "open source" written beside it (Rafael, 16 Oct): the site's pen again,
   right after the headline marks; it draws back off with them before the loop ends. Card coordinates, as in his file. */
function logoNote(ctx: Ctx, v: V, t: number) {
  const draw = cubicBezier([0.65, 0, 0.35, 1])
  const at = v.marksAt + 1600, end = v.loopMs - v.marksOff
  // off in reverse, before the headline marks go (they start at `end`): the words, then the head, then the line
  const kLine = Math.min(draw(clamp01((t - at) / 600)), 1 - draw(clamp01((t - end + 380) / 300)))
  const kHead = Math.min(draw(clamp01((t - at - 600) / 220)), 1 - draw(clamp01((t - end + 500) / 120)))
  const write = (t - at - 900) / 1000, gone = t >= end - 520
  // the arrow: from beside the words, curving up to just under the logo
  const P0: [number, number] = [146, 712], C1: [number, number] = [118, 712], C2: [number, number] = [108, 686], P1: [number, number] = [116, 655]
  const curve = Array.from({ length: 41 }, (_, i): [number, number] => {
    const u = i / 40, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3
    return [a * P0[0] + b * C1[0] + c * C2[0] + d * P1[0], a * P0[1] + b * C1[1] + c * C2[1] + d * P1[1]]
  })
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = NOTE_PEN
  stroke(ctx, curve, kLine, PEN.achiote)
  if (kHead > 0) {
    const [ex, ey] = P1, len = Math.hypot(ex - C2[0], ey - C2[1]), ux = (ex - C2[0]) / len, uy = (ey - C2[1]) / len
    const wing = (a: number): [number, number] => { const c = Math.cos(a), s = Math.sin(a); return [ex - 7 * (ux * c - uy * s), ey - 7 * (ux * s + uy * c)] }
    stroke(ctx, [wing(0.5), [ex, ey], wing(-0.5)], kHead, PEN.achiote)
  }
  ctx.restore()
  if (write > 0 && !gone) pen(ctx, assets!.openSource, write, 151, 716, PEN.achiote) // the arrow's own orange
}

/* The site's pen on the headline (src/landing/HeroArrow.tsx, landing.css .hero-arrow), scaled to the card: a loose
   loop round "prototype" in Malva's pen, a hand underline under "tool" in Achiote (Rafael, 16 Oct). They draw on one
   after the other like a pen, hold, and draw back off before the loop ends, so the loop closes (lines draw, never fade). */
const PEN = { malva: '#C46FDB', achiote: '#F6571C' }
function headlineMarks(ctx: Ctx, v: V, t: number, x: number, baseline: (i: number) => number) {
  const draw = cubicBezier([0.65, 0, 0.35, 1])
  const on = (at: number, dur: number) => draw(clamp01((t - at) / dur))
  const off = (at: number, dur: number) => 1 - draw(clamp01((t - at) / dur))
  const end = v.loopMs - v.marksOff
  const kLoop = Math.min(on(v.marksAt, 750), off(end + 380, 420))
  const kLine = Math.min(on(v.marksAt + 850, 600), off(end, 380))
  if (kLoop <= 0 && kLine <= 0) return
  const k = 38 / 116 // the card's headline against the site's hero
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 2.5 * k * 1.35 // a touch heavier: it's small
  // the loop round "prototype": the hero's own curve (a superellipse a little more than one turn, opening out)
  const m = ctx.measureText('prototype')
  const left = x - m.actualBoundingBoxLeft, top = baseline(1) - m.actualBoundingBoxAscent
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const cx = left + w / 2, cy = top + h * 0.5 - 1, // a little higher than the site's (Rafael, 16 Oct)
    rx = w / 2 + 14 * k * 1.4, ry = h / 2 + 12 * k * 1.4, n = 2.5
  const tilt = -0.04, cos = Math.cos(tilt), sin = Math.sin(tilt)
  const sp = (q: number) => Math.sign(q) * Math.abs(q) ** (2 / n)
  const at = (a: number, grow: number): [number, number] => {
    const px = rx * (1 + 0.04 * grow) * sp(Math.cos(a)), py = ry * (1 + 0.1 * grow + 0.02 * Math.sin(3 * a)) * sp(Math.sin(a))
    return [cx + px * cos - py * sin, cy + px * sin + py * cos]
  }
  const loop = Array.from({ length: 97 }, (_, i) => at(-2.3 + ((Math.PI * 2 + 0.55) * i) / 96, i / 96))
  stroke(ctx, loop, kLoop, PEN.malva)
  // the underline under "tool": a quick hand line, a hair wavy, lifting at its end
  const before = ctx.measureText('into a ').width, word = ctx.measureText('tool')
  const x0 = x + before - 2, x1 = x + before + word.width + 3, y = baseline(2) + 5
  const line = Array.from({ length: 33 }, (_, i): [number, number] => {
    const u = i / 32
    return [x0 + (x1 - x0) * u, y + 0.9 * Math.sin(u * Math.PI * 1.6) - 2.2 * u ** 3]
  })
  stroke(ctx, line, kLine, PEN.achiote)
  ctx.restore()
}
/** a polyline drawn as far as `k` (0..1) of its length, from its start */
function stroke(ctx: Ctx, pts: [number, number][], k: number, colour: string) {
  if (k <= 0) return
  const len = pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0)
  ctx.strokeStyle = colour; ctx.setLineDash([len * k, len + 1])
  ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke()
  ctx.setLineDash([])
}

/** text in the pen: its strokes drawn as far as `el` seconds mask the real text (Infinity: written);
    `clipW` keeps only the first part of it, from its left edge (the delete) */
let scratch: OffscreenCanvas | null = null
function pen(ctx: Ctx, line: Pen, el: number, x: number, baseline: number, colour: string, clipW = Infinity) {
  ctx.save()
  if (clipW < Infinity) { ctx.beginPath(); ctx.rect(x - line.size, baseline - line.size * 2, clipW + line.size, line.size * 4); ctx.clip() }
  if (el >= line.total + 0.05) {
    ctx.fillStyle = colour; ctx.font = `${line.size}px ${FONT.hand}`; ctx.fillText(line.text, x, baseline); ctx.restore()
    return
  }
  const m = ctx.getTransform()
  const k = Math.hypot(m.a, m.b)
  const pad = line.size * 0.4, W = Math.ceil((line.ends[line.ends.length - 1] + pad * 2) * k), H = Math.ceil(line.size * 2 * k)
  const oy = line.size * 1.2 // the baseline inside the scratch canvas
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

// ── 6 · The swatches ───────────────────────────────────────────────────────────
const GLYPHS = '0123456789ABCDEF'
/** the hex running through characters, settling left to right */
function hexAt(to: string, q: number, seed: number) {
  if (q >= 1) return to
  return '#' + [...to.slice(1)].map((c, i) => (q * 7 > i + 1 ? c : GLYPHS[Math.floor((Math.sin(seed * 97 + i * 13 + Math.floor(q * 18)) * 0.5 + 0.5) * 16) % 16])).join('')
}
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => { x /= 255; return x <= 0.04 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }

/** each swatch's split, off the even one: irregular steps across the grid (Rafael, 16 Oct), the same every frame */
const STEPS = [-0.06, 0.24, -0.04, 0.4, 0.1, -0.05, 0.32, 0.02] // from about 14% to 60% of the swatch (Rafael: "vary more", then the two thinnest eased)
function drawSwatches(ctx: Ctx, v: V, t: number) {
  const ease = cubicBezier(v.swatchEase)
  SWATCHES.forEach((sw, i) => {
    const col = i % 4, row = Math.floor(i / 4)
    const cell = { x: CELL_X[col], y: CELL_Y[row], w: CELL_X[col + 1] - CELL_X[col], h: CELL_Y[row + 1] - CELL_Y[row] }
    // a band of one set: its colour, and (with labels on) its name, fig and hex
    const band = (hex: string, y: number, h: number, shown: string) => {
      fillBox(ctx, { ...cell, y, h }, hex)
      const fig = hex === sw.fill ? sw.fig : sw.figText
      if (v.labels === 'none' || (!fig && v.labels !== 'all')) return
      ctx.save(); ctx.beginPath(); ctx.rect(cell.x, y, cell.w, h); ctx.clip()
      ctx.fillStyle = lum(hex) < 0.18 ? TEXT : INK
      ctx.font = `400 12.5px ${FONT.sans}`; ctx.textAlign = 'left'
      ctx.fillText(sw.name, cell.x + 13, y + 22)
      ctx.fillText(shown, cell.x + 13, y + h - 14)
      if (fig) { ctx.font = `14px ${FONT.hand}`; ctx.textAlign = 'right'; ctx.fillText(fig, cell.x + cell.w - 12, y + 26) }
      ctx.restore()
    }
    // The sets alternate, fill and text shade: at rest the current one above, the next peeking in as a sliver below.
    // It runs one way, up, like a belt (Rafael, 16 Oct: "the next batch comes from the bottom to replace the last"),
    // and never shows more than two blocks: the sliver rises and pushes the current one out of the top, then the
    // one after comes up from the bottom as the new sliver.
    let m = 0
    for (let n = 1; n <= v.kitTurns; n++) if (t >= swatchChange(v, n, i)) m = n
    const from = m ? swatchChange(v, m, i) : -Infinity
    const [newer, older] = m % 2 ? [sw.text, sw.fill] : [sw.fill, sw.text]
    const q = from === -Infinity ? 1 : ease(clamp01((t - from) / v.swatchDur))
    const S = cell.h * clamp01(v.sliver + v.steps * STEPS[i]) // the sliver's height
    const run = v.scramble && from !== -Infinity ? clamp01((t - from) / v.scramble) : 1
    // the split, from the top, only ever rising: from (h − S) to 0 as the sliver takes the swatch, then from h back
    // to (h − S) as the next comes up under it
    const RISE = 0.62, split = q < RISE ? (cell.h - S) * (1 - q / RISE) : (cell.h - S) + S * (1 - (q - RISE) / (1 - RISE))
    const [above, below] = q < RISE ? [older, newer] : [newer, older]
    ctx.save(); clipBox(ctx, cell)
    band(above, cell.y, Math.max(0, split), q < RISE ? above.toUpperCase() : hexAt(above.toUpperCase(), run, i + 1))
    band(below, cell.y + split, cell.h - split, below.toUpperCase())
    ctx.restore()
  })
}
