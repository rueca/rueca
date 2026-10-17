/* Everything the bento draws that has to be prepared in the browser first, loaded once before the tool mounts:
   - fonts for the canvas (IBM Plex Sans, Sorts Mill Goudy, La Belle Aurore) and the lockup's word;
   - the kit drawings (src/landing/art), each turned into a standalone SVG with its styles inlined and its
     handwritten notes hidden, then loaded as images the canvas can draw (rasterised crisply at any size).
     Their parts come apart with the landing card's progress (--kp, pure CSS), so each drawing is loaded at
     KP_STEPS + 1 steps of it, and the bento plays through them;
   - the pen strokes for "fig.1" … "fig.12" (src/landing/handwrite.ts), in writing order, sized and placed
     to sit where Rafael's outlined "fig.1" sits: the fig tile counts the kit drawings. */
import isoCss from '@/landing/art/iso.css?raw'
import { strokesOf, timeline } from '@/landing/handwrite'
import { CONTROLS_SVG } from '@/landing/art/controls'
import { LAYOUT_SVG } from '@/landing/art/layout'
import { TIME_SVG } from '@/landing/art/time'
import { STRUCTURE_SVG } from '@/landing/art/structure'
import { WORKING_SVG } from '@/landing/art/working'
import { HANDOFF_SVG } from './art/handoff' // re-stacked portrait for the bento (art/handoff.build.mjs); the landing keeps its own
import plexUrl from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url' // the site's text face; Host Grotesk is for the logo only (Rafael, 16 Oct)
import goudyUrl from '@/landing/fonts/sorts-mill-goudy-regular.woff2?url'
import handUrl from '@fontsource/la-belle-aurore/files/la-belle-aurore-latin-400-normal.woff2?url'
import { LOCKUP, FIG1 } from './lockups'

export const FONT = { sans: '"Bento Plex", sans-serif', serif: '"Bento Goudy", serif', hand: '"Bento Hand", cursive' }

/** the kit cards in the landing's order, each on a sheet of a second palette colour paired with its one bright
    part (Rafael: accent on accent didn't work). The pairs come from the logo race's Stack (malva–cielo,
    gualda–malva, hoja–cielo), Achiote sits on Malva or Gualda, and no two sheets in a row match, round the loop too. */
export const KIT = [
  { name: 'Controls', svg: CONTROLS_SVG, bright: 'achiote', sheet: '#EFA6FF' },   // on Malva
  { name: 'Layout', svg: LAYOUT_SVG, bright: 'cielo', sheet: '#84C900' },         // on Hoja
  { name: 'Time', svg: TIME_SVG, bright: 'malva', sheet: '#FFD000' },             // on Gualda
  { name: 'Structure', svg: STRUCTURE_SVG, bright: 'cielo', sheet: '#EFA6FF' },   // on Malva
  { name: 'Workflow', svg: WORKING_SVG, bright: 'malva', sheet: '#5070F0' },      // on Cielo
  { name: 'Hand-off', svg: HANDOFF_SVG, bright: 'achiote', sheet: '#FFD000' },    // on Gualda
] as const
/** how finely the parts' travel is sampled: 0 (assembled) … 1 (apart) */
export const KP_STEPS = 40

/** the handwriting under the poster card: Rafael's note from the controls drawing, run on like a page of it */
/** the pages under the poster card, one per kit drawing in the same order: a big handwritten note on what that
    drawing does, filling the sheet. A page swipes in with each drawing, on that drawing's sheet colour (Rafael,
    16 Oct; worded through the copywriting skill: one concrete move each). The breaks are found, not set: see layoutPage;
    a no-break space (\u00a0) keeps a verb and its "it" on one line. */
export const HAND_PAGES = [
  'add a slider to anything you made',          // Controls
  'dock\u00a0it, float\u00a0it, or\u00a0go full-bleed',  // Layout
  'scrub the timeline frame by frame',          // Time
  'hide, lock, reorder layers',                 // Structure
  'try\u00a0it, undo\u00a0it, try\u00a0it again',     // Workflow
  'hand the dials to your client',              // Hand-off
]
/** how many lines a page may break into */
const HAND_LINES = [3, 5]
/** the size the poster card's page notes are set at, at most: each page is fitted to its sheet below that */
const HAND_MAX = 110
/** the width a page's widest line fills, in bento units: the sheet, plus the part past its left edge */
const HAND_FILL = 292
/** where the lines start, from the tile's left edge: outside it, so the text is clipped on both sides, by the tile
    and by the card (Rafael, 16 Oct) */
export const HAND_X = -14
/** the gap between one line's lowest ink and the next line's highest, in bento units */
const HAND_GAP = 5

export type Pen = {
  strokes: { pts: [number, number][]; len: number; at: number; dur: number }[]
  total: number; width: number; x: number; baseline: number; text: string; size: number
  /** where each character ends, from the text's left edge: the delete takes them back one at a time */
  ends: number[]
}

export type Assets = {
  word: Path2D
  /** per drawing, its images from assembled to apart */
  kit: HTMLImageElement[][]
  /** "fig.1" … "fig.12" (index 0 is fig.1), and where they're written: the left of the text and its baseline, in bento units */
  fig: { pens: Pen[]; x: number; baseline: number }
  /** "open source", written on the poster card beside the arrow to its logo (Rafael, 16 Oct) */
  openSource: Pen
  /** each page under the poster: its lines, their baselines from the top of the page, and its size */
  hand: { lines: string[]; baselines: number[]; size: number }[]
}
export let assets: Assets | null = null

async function font(family: string, url: string, weight = '400') {
  const f = new FontFace(family, `url(${url})`, { weight })
  await f.load()
  document.fonts.add(f)
}

// The landing scopes the drawing's tokens to `.site .rueca-iso`, with light-mode overrides under `:root.light`.
// Standalone, the svg itself carries both, in the same order, so the light ones win; plus the site's light-sheet
// tokens the engraving mixes from (read off the landing in light mode). Light theme (Rafael, 16 Oct).
const KIT_CSS = isoCss.replaceAll(':root.light .site .rueca-iso', 'svg').replaceAll('.site .rueca-iso', 'svg')
  + 'svg{--fg:#171615;--sheet:#fdfbfa;--logo-card:#EFA6FF;--logo-ink:#171615;--logo-pale:78%;--ink-achiote:#cd4000;--font-body:ui-sans-serif,system-ui,sans-serif}'
  + '.iso-svg .rueca-marks{display:none!important}' // no notes, no arrows (Rafael, 16 Oct): just the object

async function kitImage(svg: string, kp: number) {
  const W = 600 // about the landing card's size: its hairlines don't scale
  const doc = svg.replace('<svg ', `<svg width="${W}" height="${W}" `)
    .replace(/(<svg[^>]*>)/, `$1<style><![CDATA[${KIT_CSS}svg{--kp:${kp.toFixed(4)}}]]></style>`)
  const img = new Image()
  img.src = URL.createObjectURL(new Blob([doc], { type: 'image/svg+xml' }))
  await img.decode()
  return img
}

/** the bounding box of an SVG path's ink */
function bboxOf(d: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden'
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d); svg.appendChild(path); document.body.appendChild(svg)
  const b = path.getBBox(); svg.remove()
  return b
}

/** a page's note broken into lines: every way to break it into HAND_LINES lines is tried, and the one that sets
    the text biggest wins (its widest line filling the sheet's width and its lines its height, whichever gives
    first), so no page is left with empty space (Rafael, 16 Oct: "the yellow one has a lot of empty space").
    Baselines come from the measured ink, so no descender touches the line below; the block is centred. */
function layoutPage(g: CanvasRenderingContext2D, note: string) {
  g.font = `100px ${FONT.hand}`
  const words = note.split(' ')
  const measure = (l: string) => { const q = g.measureText(l); return { w: q.width, up: q.actualBoundingBoxAscent / 100, down: q.actualBoundingBoxDescent / 100 } }
  let best: { lines: string[]; size: number } | null = null
  // every way to cut the words into n runs: choose n - 1 of the gaps between words
  const cuts = (from: number, left: number): number[][] => left === 0 ? [[]]
    : Array.from({ length: words.length - from - left }, (_, k) => from + k + 1).flatMap((c) => cuts(c, left - 1).map((r) => [c, ...r]))
  for (let n = HAND_LINES[0]; n <= Math.min(HAND_LINES[1], words.length); n++) {
    for (const cut of cuts(0, n - 1)) {
      const edges = [0, ...cut, words.length]
      const lines = edges.slice(0, -1).map((a, k) => words.slice(a, edges[k + 1]).join(' '))
      const m = lines.map(measure)
      const wide = Math.max(...m.map((e) => e.w)), tall = m.reduce((h, e) => h + e.up + e.down, 0)
      const size = Math.min(HAND_MAX, (HAND_FILL / wide) * 100, (297 - (n - 1) * HAND_GAP - 24) / tall)
      if (!best || size > best.size + 0.5) best = { lines, size }
    }
  }
  const { lines, size } = best!
  const ext = lines.map(measure)
  const baselines: number[] = []
  ext.forEach((e, i) => baselines.push(i ? baselines[i - 1] + ext[i - 1].down * size + HAND_GAP + e.up * size : e.up * size + 12))
  const shift = (297 - (baselines[baselines.length - 1] + ext[ext.length - 1].down * size + 12)) / 2
  return { lines, baselines: baselines.map((y) => y + shift), size }
}

async function pen(text: string, size: number): Promise<Pen> {
  const s = await strokesOf(text, FONT.hand, size)
  const { strokes, total } = timeline(s, { most: 0.7 }) // quick: the fig changes with every kit drawing
  const g = document.createElement('canvas').getContext('2d')!
  g.font = `${size}px ${FONT.hand}`
  return {
    // timeline() hands back SVG path data; keep the points for the canvas
    strokes: strokes.map((k) => ({ pts: k.d.slice(1).split('L').map((q) => q.split(' ').map(Number) as [number, number]), len: k.len, at: k.at, dur: k.dur })),
    total, width: s.thickness * 1.7 + 1.4, x: s.x, baseline: s.baseline, text, size,
    ends: [...text].map((_, i) => g.measureText(text.slice(0, i + 1)).width),
  }
}

export async function loadAssets() {
  await Promise.all([
    font('Bento Plex', plexUrl, '100 700'),
    font('Bento Goudy', goudyUrl),
    font('Bento Hand', handUrl),
  ])
  // "fig.1" set in the hand at the size and place of Rafael's outlined one
  const box = bboxOf(FIG1)
  const g = document.createElement('canvas').getContext('2d')!
  g.font = `100px ${FONT.hand}`
  const m = g.measureText('fig.1')
  const size = 100 * box.width / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight)
  const k = size / 100
  const [kit, pens, openSource] = await Promise.all([
    Promise.all(KIT.map((d) => Promise.all(Array.from({ length: KP_STEPS + 1 }, (_, i) => kitImage(d.svg, i / KP_STEPS))))),
    Promise.all(Array.from({ length: 12 }, (_, i) => pen(`fig.${i + 1}`, size))),
    pen('open source', 13), // the size of the other small notes (the fig specs) (Rafael, 16 Oct)
  ])
  const hand = HAND_PAGES.map((note) => layoutPage(g, note))
  assets = {
    hand,
    word: new Path2D(LOCKUP.word),
    kit,
    openSource,
    fig: { pens, x: box.x + m.actualBoundingBoxLeft * k, baseline: box.y + m.actualBoundingBoxAscent * k },
  }
  return assets
}
