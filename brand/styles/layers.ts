/* Capas (layers): the twelve hands stacked. Each recipe is a list of layers; each layer is drawn on its own sheet,
   masked, nudged (misregistration), screened back if it's a ghost, then laid down on the paper. Layering devices come
   from Rafael's Trove (research/31-one-tone-styles/layering.md): overprint, ghost plus one sharp layer, diagram over
   texture, glyphs filling a silhouette, the image cut into a grid, type knocked out of a texture, the resolution ladder.
   No transparency anywhere: a ghost is the same ink screened through an ordered dither, and two inks multiply only
   where they really overlap, as on a press. At most two inks a sheet, and the second is always Nogal. */
import { MARK, type Relief } from './tone'
import { HANDS, type At } from './wheel12'
import type { Box, StyleId } from './styles'

type Ctx = CanvasRenderingContext2D
export type Mask = 'all' | 'mark' | 'outside' | { band: [number, number] } | { col: [number, number] } | { rect: [number, number, number, number] }
export type Layer = {
  /** a hand, or one of the layer-only devices */
  draw: StyleId | 'diagram' | 'knockout' | 'rings' | 'hatch'
  ink: string
  mask?: Mask
  /** misregistration, px */
  dx?: number; dy?: number
  /** screened back to this share of its ink (an ordered dither), 1 = full */
  ghost?: number
  /** the hand's own crop: scale about the mark's centre */
  zoom?: number
  text?: string
}
export type Recipe = { id: string; name: string; english: string; why: string; after: string; inks: string[]; layers: Layer[] }

const NOGAL = '#171615', ACHIOTE = '#F6571C', MORA = '#6E1A3E', CIELO = '#5070F0', MALVA = '#EFA6FF'

export const RECIPES: Recipe[] = [
  { id: 'ghost-line', name: 'Fantasma', english: 'Ghost and line', inks: [NOGAL],
    why: 'the old drawing, under the new one', after: 'Ghosted engravings with one sharp layer: the embossed St George, the "phantom press" overprints.',
    layers: [{ draw: 'stipple', ink: NOGAL, ghost: 0.5, zoom: 1.35 }, { draw: 'engraving', ink: NOGAL }] },
  { id: 'overprint', name: 'Sobreimpresión', english: 'Overprint, two drums', inks: [ACHIOTE, NOGAL],
    why: 'two inks, slightly out of register', after: 'Spot-colour screenprint collages where flat fields and halftone trade transparency.',
    layers: [{ draw: 'riso', ink: ACHIOTE, dx: 10, dy: -6 }, { draw: 'lines', ink: NOGAL }] },
  { id: 'diagram', name: 'Construcción', english: 'Diagram over texture', inks: [NOGAL, ACHIOTE],
    why: 'how it’s built, over what it is', after: 'Keylines and technical annotations over coarse halftone; registration lines over an object.',
    layers: [{ draw: 'dither', ink: NOGAL }, { draw: 'diagram', ink: ACHIOTE }] },
  { id: 'glyph-mask', name: 'Máscara de letras', english: 'Glyphs inside, rings outside', inks: [NOGAL],
    why: 'type fills the wheel; the rings run on round it', after: 'Letter grids filling a silhouette over a painted ground.',
    layers: [{ draw: 'rings', ink: NOGAL, mask: 'outside' }, { draw: 'ascii', ink: NOGAL, mask: 'mark' }] },
  { id: 'columns', name: 'Doce manos en una', english: 'Twelve hands in one sheet', inks: [NOGAL],
    why: 'every hand gets a column', after: 'Images cut into strips and reassembled: sliced still lifes, the swallows grid.',
    layers: (['engraving', 'wood', 'stipple', 'lines', 'riso', 'dither', 'ascii', 'moire', 'plotter', 'contour', 'guilloche', 'cyanotype'] as StyleId[]).map((s, i) => ({ draw: s, ink: NOGAL, mask: { col: [i * 100, i * 100 + 100] as [number, number] } })) },
  { id: 'ladder', name: 'Escalera', english: 'Resolution ladder', inks: [NOGAL],
    why: 'a prototype, sharpening into a tool', after: 'Progressive rasterisation plates: the same image at rising screen frequencies.',
    layers: (['dither', 'riso', 'lines', 'engraving'] as StyleId[]).map((s, i) => ({ draw: s, ink: NOGAL, mask: { band: [128 + i * 236, 128 + (i + 1) * 236] as [number, number] } })) },
  { id: 'knockout', name: 'Calado', english: 'Type knocked out of a field', inks: [NOGAL],
    why: 'the verb, cut out of the pattern', after: 'Oversized type ghosted over imagery; letters left as paper in a dot field.',
    layers: [{ draw: 'rings', ink: NOGAL }, { draw: 'knockout', ink: NOGAL, text: 'hilar' }] },
  { id: 'veil', name: 'Velo', english: 'Rose engine over a woodcut', inks: [MORA, NOGAL],
    why: 'a banknote’s pattern laid over a block', after: 'Glassine over print; fine silver linework over a gradient sheet.',
    layers: [{ draw: 'wood', ink: NOGAL, ghost: 0.5 }, { draw: 'guilloche', ink: MORA }] },
  { id: 'blueprint', name: 'Plano', english: 'Engraving over cyanotype', inks: [CIELO, NOGAL],
    why: 'the sun’s print, then the burin’s', after: 'Cyanotype architecture cut into figures; two-colour botanical prints.',
    layers: [{ draw: 'cyanotype', ink: CIELO }, { draw: 'engraving', ink: NOGAL, mask: 'mark' }] },
  { id: 'double-moire', name: 'Doble muaré', english: 'Two moirés, out of register', inks: [MALVA, NOGAL],
    why: 'the second ring set drifts, and a third pattern appears', after: 'Translucent paper circles building a rosette from overlap alone.',
    layers: [{ draw: 'moire', ink: MALVA, dx: 9, dy: 6 }, { draw: 'moire', ink: NOGAL }] },
  { id: 'block-survey', name: 'Bloque y mapa', english: 'Solid block over a survey', inks: [CIELO, NOGAL],
    why: 'the block sits on the land it was cut from', after: 'Heavy ink silhouettes dropped over technical grid drawings.',
    layers: [{ draw: 'contour', ink: CIELO, zoom: 1.6 }, { draw: 'wood', ink: NOGAL }] },
  { id: 'order', name: 'Orden y desorden', english: 'Plotter over engraving', inks: [ACHIOTE, NOGAL],
    why: 'the grid holds, until the drawing shows through', after: 'Nees’s “Schotter” over a plate; dot-matrix redactions over a spec sheet.',
    layers: [{ draw: 'engraving', ink: NOGAL }, { draw: 'plotter', ink: ACHIOTE }] },
]

/** a 4 × 4 Bayer screen: a ghost keeps the cells whose threshold is under its share */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
function screen(g: OffscreenCanvasRenderingContext2D, w: number, h: number, share: number, cell = 2) {
  const img = g.getImageData(0, 0, w, h), d = img.data
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = BAYER[(Math.floor(y / cell) % 4) * 4 + (Math.floor(x / cell) % 4)] / 16
    if (t >= share) d[(y * w + x) * 4 + 3] = 0
  }
  g.putImageData(img, 0, 0)
}
function markPath(at: At) { const p = new Path2D(); const m = new DOMMatrix([at.k, 0, 0, at.k, at.x, at.y]); for (const d of Object.values(MARK.paths)) p.addPath(new Path2D(d), m); return p }

/** fields that cover the whole plate (the hands only draw where the mark is): rings round the drive wheel, or a hatch */
function field(g: OffscreenCanvasRenderingContext2D, kind: 'rings' | 'hatch', at: At, plate: Box, ink: string) {
  g.save(); g.beginPath(); g.rect(plate.x, plate.y, plate.w, plate.h); g.clip(); g.strokeStyle = ink; g.beginPath()
  if (kind === 'rings') { const x = at.x + MARK.wheel.cx * at.k, y = at.y + MARK.wheel.cy * at.k; g.lineWidth = 3.2; for (let r = 8; r < 1700; r += 8) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2) } }
  else { g.lineWidth = 1.2; for (let k = -1600; k < 1600; k += 7) { g.moveTo(plate.x + k, plate.y); g.lineTo(plate.x + k + plate.h, plate.y + plate.h) } }
  g.stroke(); g.restore()
}

/** the mark's construction, as a drafter would ink it: circles, the band's tangents, centres, lettered points, one dimension */
function diagram(g: OffscreenCanvasRenderingContext2D | Ctx, at: At, ink: string, font: string) {
  const P = (x: number, y: number): [number, number] => [at.x + x * at.k, at.y + y * at.k]
  g.strokeStyle = g.fillStyle = ink; g.lineWidth = 1.8
  const circle = (c: { cx: number; cy: number }, r: number, dash?: number[]) => { const [x, y] = P(c.cx, c.cy); g.setLineDash(dash ?? []); g.beginPath(); g.arc(x, y, r * at.k, 0, Math.PI * 2); g.stroke() }
  circle(MARK.wheel, MARK.wheel.r); circle(MARK.whorl, MARK.whorl.r)
  circle(MARK.big, MARK.big.r, [6, 5]); circle(MARK.small, MARK.small.r, [6, 5])
  circle(MARK.big, MARK.big.r - MARK.bandW, [2, 4]); circle(MARK.small, MARK.small.r - MARK.bandW, [2, 4])
  g.setLineDash([])
  // centres and the line joining them
  const [wx, wy] = P(MARK.wheel.cx, MARK.wheel.cy), [hx, hy] = P(MARK.whorl.cx, MARK.whorl.cy)
  g.beginPath(); for (const [x, y] of [[wx, wy], [hx, hy]]) { g.moveTo(x - 14, y); g.lineTo(x + 14, y); g.moveTo(x, y - 14); g.lineTo(x, y + 14) }
  g.moveTo(hx, hy); g.lineTo(wx, wy); g.stroke()
  // a dimension: the drive wheel's radius
  g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + MARK.wheel.r * at.k * Math.cos(-0.6), wy + MARK.wheel.r * at.k * Math.sin(-0.6)); g.stroke()
  g.font = `500 19px ${font}`
  const label = (t: string, x: number, y: number) => g.fillText(t, x, y)
  label('A', wx + 10, wy - 10); label('B', hx + 10, hy - 10)
  label(`r ${MARK.wheel.r}`, wx + MARK.wheel.r * at.k * 0.55, wy - MARK.wheel.r * at.k * 0.42)
  label('C', ...P(MARK.big.cx + MARK.big.r * 0.72, MARK.big.cy - MARK.big.r * 0.7))
  label('D', ...P(MARK.small.cx - MARK.small.r * 0.85, MARK.small.cy + 4))
}

export type Env = { relief: Relief; at: At; plate: Box; paper: string; mono: string }

/** compose a recipe onto the sheet; returns the settings line (one entry a layer) */
export function compose(ctx: Ctx, r: Recipe, env: Env) {
  const W = 1200, H = 1600, notes: string[] = []
  for (const L of r.layers) {
    const c = new OffscreenCanvas(W, H), g = c.getContext('2d', { willReadFrequently: true })!
    const z = L.zoom ?? 1, cx = env.at.x + (MARK.w / 2) * env.at.k, cy = env.at.y + (MARK.h / 2) * env.at.k
    const at: At = { k: env.at.k * z, x: cx - (MARK.w / 2) * env.at.k * z, y: cy - (MARK.h / 2) * env.at.k * z }
    let said = ''
    if (L.draw === 'diagram') { diagram(g, at, L.ink, env.mono); said = 'construction, 1.8 px' }
    else if (L.draw === 'rings' || L.draw === 'hatch') { field(g, L.draw, at, env.plate, L.ink) }
    else if (L.draw === 'knockout') {
      // the word, cut out of everything drawn so far, as paper
      ctx.save(); ctx.font = `400 470px "Styles Goudy", serif`; ctx.fillStyle = env.paper; ctx.textBaseline = 'alphabetic'
      ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = '-14px'
      const w = ctx.measureText(L.text ?? '').width; ctx.fillText(L.text ?? '', (W - w) / 2, 860); ctx.restore()
      notes.push(`“${L.text}” knocked out, Goudy 470 px`); continue
    } else said = HANDS[L.draw](g as unknown as Ctx, L.draw === 'cyanotype' ? { x: 64, y: 136, w: 1072, h: 936 } : env.plate, env.relief, at, { ink: L.ink, paper: env.paper, seed: 7 }, env.mono).split(' · ').slice(0, 2).join(' · ')
    // the mask: keep only its region
    const m = L.mask ?? 'all'
    if (m !== 'all') {
      g.globalCompositeOperation = m === 'outside' ? 'destination-out' : 'destination-in'
      g.fillStyle = '#000'
      if (m === 'mark' || m === 'outside') g.fill(markPath(env.at), 'evenodd')
      else if ('band' in m) g.fillRect(0, m.band[0], W, m.band[1] - m.band[0])
      else if ('col' in m) g.fillRect(m.col[0], 0, m.col[1] - m.col[0], H)
      else g.fillRect(...m.rect)
      g.globalCompositeOperation = 'source-over'
    }
    if (L.ghost && L.ghost < 1) screen(g, W, H, L.ghost)
    // lay it down: a second ink multiplies where it crosses the first, as on a press
    ctx.save()
    ctx.globalCompositeOperation = r.layers.indexOf(L) === 0 ? 'source-over' : 'multiply'
    ctx.drawImage(c, L.dx ?? 0, L.dy ?? 0)
    ctx.restore()
    const name = L.draw === 'diagram' ? 'construction' : L.draw === 'rings' ? 'rings every 8 px' : L.draw === 'hatch' ? 'hatch 7 px at 45°' : L.draw
    notes.push(`${name}${L.ghost ? ` ghost ${Math.round(L.ghost * 100)}%` : ''}${L.dx || L.dy ? ` off ${L.dx ?? 0},${L.dy ?? 0}` : ''}${typeof m === 'string' && m !== 'all' ? ` (${m === 'mark' ? 'in the mark' : 'round it'})` : ''}`)
    void said
  }
  // the column and band recipes list their hands once, compactly
  if (r.id === 'columns') return 'twelve 100 px columns, left to right: engraving, wood, stipple, lines, riso, dither, ASCII, moiré, plotter, contour, guilloché, cyanotype'
  if (r.id === 'ladder') return 'four 236 px bands, top to bottom: dither, riso, line screen, engraving'
  return notes.join(' + ')
}
