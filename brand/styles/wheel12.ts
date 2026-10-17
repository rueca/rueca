/* "One wheel, twelve hands" (research/31-one-tone-styles, critique of v3): the same subject at the same crop through
   twelve one-tone renderers, like a type specimen, so the style is the only thing that changes. The subject is the
   logo itself, carved as a relief from its exact geometry (tone.ts markRelief), never a photo.
   Every renderer records the numbers it used (`readout`), and the sheet prints them: each poster is a render of a
   rule with its dials showing, which is the tool's own promise. */
import { MARK, makeTone, blur, type Relief, type Tone } from './tone'
import { ribbons, rng, hex, glyphRamp, guilloche as guillocheRings, type Box } from './styles'
import type { StyleId } from './styles'

type Ctx = CanvasRenderingContext2D
/** where the mark sits on the sheet: its origin (mark unit 0, 0) in px, and px per mark unit */
export type At = { x: number; y: number; k: number }
export type Hand = { ink: string; paper: string; seed: number }

/** read a relief field at a sheet point */
const sampler = (R: Relief, f: Tone, at: At) => (x: number, y: number) => {
  const gx = ((x - at.x) / at.k + R.pad) * R.res, gy = ((y - at.y) / at.k + R.pad) * R.res
  return gx < 0 || gy < 0 || gx > f.w - 1 || gy > f.h - 1 ? 0 : f.at(gx / (f.w - 1), gy / (f.h - 1))
}
const toSheet = (R: Relief, at: At) => (gx: number, gy: number): [number, number] => [at.x + (gx / R.res - R.pad) * at.k, at.y + (gy / R.res - R.pad) * at.k]
const clipTo = (ctx: Ctx, b: Box) => { ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip() }
/** the mark's silhouette as a path on the sheet */
function markPath(at: At) { const p = new Path2D(); const m = new DOMMatrix([at.k, 0, 0, at.k, at.x, at.y]); for (const d of Object.values(MARK.paths)) p.addPath(new Path2D(d), m); return p }

/** every iso-line crossing, all levels in one pass over the grid: emit(level index, x0, y0, x1, y1) in grid units */
function isoAll(f: Tone, levels: number[], emit: (li: number, x0: number, y0: number, x1: number, y1: number) => void, mask?: Uint8Array) {
  const { w, d } = f
  for (let y = 0; y < f.h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const i = y * w + x
    if (mask && !mask[i] && !mask[i + 1] && !mask[i + w] && !mask[i + w + 1]) continue
    const a = d[i], c = d[i + 1], e = d[i + w], g = d[i + w + 1]
    const lo = Math.min(a, c, e, g), hi = Math.max(a, c, e, g)
    if (hi - lo < 1e-6) continue
    // levels are ascending: binary search the first one above lo
    let li = 0, l1 = levels.length
    while (li < l1) { const mid = (li + l1) >> 1; if (levels[mid] <= lo) li = mid + 1; else l1 = mid }
    for (; li < levels.length && levels[li] < hi; li++) {
      const iso = levels[li]
      const t = (v0: number, v1: number) => (iso - v0) / (v1 - v0 || 1e-9)
      const pts: [number, number][] = []
      if ((a > iso) !== (c > iso)) pts.push([x + t(a, c), y])
      if ((c > iso) !== (g > iso)) pts.push([x + 1, y + t(c, g)])
      if ((e > iso) !== (g > iso)) pts.push([x + t(e, g), y + 1])
      if ((a > iso) !== (e > iso)) pts.push([x, y + t(a, e)])
      if (pts.length >= 2) emit(li, pts[0][0], pts[0][1], pts[1][0], pts[1][1])
      if (pts.length === 4) emit(li, pts[2][0], pts[2][1], pts[3][0], pts[3][1])
    }
  }
}

/** strokes bucketed by width, so thousands of segments of varying weight draw in a few calls */
function bucketed(ctx: Ctx, n: number, maxW: number) {
  const paths = Array.from({ length: n }, () => new Path2D())
  return {
    add(w: number, x0: number, y0: number, x1: number, y1: number) { if (w < 0.15) return; const b = Math.min(n - 1, Math.floor((w / maxW) * n)); paths[b].moveTo(x0, y0); paths[b].lineTo(x1, y1) },
    stroke() { ctx.lineCap = 'round'; paths.forEach((p, b) => { ctx.lineWidth = ((b + 0.5) / n) * maxW; ctx.stroke(p) }) },
  }
}

export type Render = (ctx: Ctx, plate: Box, R: Relief, at: At, o: Hand, font: string) => string

/** 1 · Copperplate: hatching that follows the form (along the belt, round the domes), swelling into the shadow */
const engraving: Render = (ctx, plate, R, at, o) => {
  const gap = 5, gapU = gap / at.k, maxW = 2.6, levels: number[] = []
  for (let h = gapU / 2; h < 70; h += gapU) levels.push(h)
  const tone = sampler(R, R.tone, at), pt = toSheet(R, at)
  ctx.save(); clipTo(ctx, plate); ctx.strokeStyle = o.ink
  const b = bucketed(ctx, 10, maxW)
  isoAll(R.height, levels, (_li, x0, y0, x1, y1) => {
    const [X0, Y0] = pt(x0, y0), [X1, Y1] = pt(x1, y1)
    const v = tone((X0 + X1) / 2, (Y0 + Y1) / 2)
    b.add(0.55 + (maxW - 0.55) * v ** 1.25, X0, Y0, X1, Y1)
  }, R.part)
  b.stroke()
  // a straight cross-hatch, in the deepest shadow only
  ctx.fillStyle = o.ink
  const deep = (x: number, y: number) => Math.max(0, tone(x, y) - 0.62) / 0.38
  ctx.clip(markPath(at), 'evenodd')
  ribbons(ctx, plate, deep, { gap: gap * 0.9, angle: -Math.PI / 6, width: (v) => (v < 0.05 ? 0 : 0.4 + 0.9 * v) })
  ctx.restore()
  return `gap ${gap} px · line 0.55–${maxW} px · cross-hatch below 38% light · light from upper left`
}

/** 2 · Wood engraving, white line: the mark a solid block; white lines cut along the form, widest in the light */
const wood: Render = (ctx, plate, R, at, o) => {
  const gap = 7, gapU = gap / at.k, levels: number[] = []
  for (let h = gapU * 0.75; h < 70; h += gapU) levels.push(h)
  const tone = sampler(R, R.tone, at), pt = toSheet(R, at)
  ctx.save(); clipTo(ctx, plate)
  ctx.fillStyle = o.ink; ctx.fill(markPath(at), 'evenodd')
  ctx.strokeStyle = o.paper
  const b = bucketed(ctx, 10, 3.2)
  isoAll(R.height, levels, (_li, x0, y0, x1, y1) => {
    const [X0, Y0] = pt(x0, y0), [X1, Y1] = pt(x1, y1)
    const light = 1 - tone((X0 + X1) / 2, (Y0 + Y1) / 2)
    b.add(light < 0.12 ? 0 : 3.2 * light ** 1.4, X0, Y0, X1, Y1)
  }, R.part)
  b.stroke(); ctx.restore()
  return `block 100% · cut every ${gap} px · cut 0–3.2 px, widest in the light`
}

/** 3 · Stipple: one dot, density from the tone, never more than 40 per cent ink */
const stipple: Render = (ctx, plate, R, at, o) => {
  const r = 1.2, gap = 3.4, tone = sampler(R, R.tone, at), rand = rng(o.seed)
  ctx.save(); clipTo(ctx, plate); ctx.fillStyle = o.ink; ctx.beginPath()
  for (let y = plate.y; y < plate.y + plate.h; y += gap) for (let x = plate.x; x < plate.x + plate.w; x += gap) {
    const px = x + (rand() - 0.5) * gap * 0.9, py = y + (rand() - 0.5) * gap * 0.9
    if (rand() < tone(px, py) ** 1.15) { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, Math.PI * 2) }
  }
  ctx.fill(); ctx.restore()
  return `dot 2.4 px · jittered grid ${gap} px · ink 0–40% · seed ${o.seed}`
}

/** 4 · Line screen: straight lines, their width the tone */
const lines: Render = (ctx, plate, R, at, o) => {
  const tone = sampler(R, R.tone, at)
  ctx.save(); clipTo(ctx, plate); ctx.fillStyle = o.ink
  ribbons(ctx, plate, tone, { gap: 7, angle: 0, width: (v) => (v < 0.04 ? 0 : 0.5 + 5 * v), step: 1.5 })
  ctx.restore()
  return 'pitch 7 px · angle 0° · line 0.5–5.5 px'
}

/** 5 · Riso, one drum: the darkest parts print solid, the midtones in halftone, and the drum leaves its grain */
const riso: Render = (ctx, plate, R, at, o) => {
  const tone = sampler(R, R.tone, at), rand = rng(o.seed), c = 10, a = (15 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a)
  ctx.save(); clipTo(ctx, plate); ctx.fillStyle = o.ink
  // solids: where the tone passes 82 per cent, a flat block (from a 2 px grid so its edge is the drum's, not a vector's)
  ctx.beginPath()
  for (let y = plate.y; y < plate.y + plate.h; y += 2) for (let x = plate.x; x < plate.x + plate.w; x += 2) if (tone(x, y) > 0.82) ctx.rect(x, y, 2.2, 2.2)
  ctx.fill()
  const cx = plate.x + plate.w / 2, cy = plate.y + plate.h / 2, Rr = Math.hypot(plate.w, plate.h) / 2 + c
  ctx.beginPath()
  for (let j = -Rr; j <= Rr; j += c) for (let i = -Rr; i <= Rr; i += c) {
    const x = cx + ca * i - sa * j, y = cy + sa * i + ca * j, v = tone(x, y)
    if (v < 0.06 || v > 0.82) continue
    const r = c * 0.6 * Math.sqrt(v) * (1.05 + (rand() - 0.5) * 0.1); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2)
  }
  ctx.fill()
  // the grain: paper specks knocked out of the ink
  ctx.fillStyle = o.paper
  for (let n = 0; n < (plate.w * plate.h) / 90; n++) { const x = plate.x + rand() * plate.w, y = plate.y + rand() * plate.h; if (tone(x, y) > 0.3) ctx.fillRect(x, y, 2, 2) }
  ctx.restore()
  return `solid above 82% · halftone ${c} px at 15° · grain 2 px knocked out · seed ${o.seed}`
}

/** 6 · 1-bit dither, Atkinson, on an 8 px pixel */
const dither: Render = (ctx, plate, R, at, o) => {
  const s = 8, tone = sampler(R, R.tone, at), W = Math.ceil(plate.w / s), H = Math.ceil(plate.h / s), e = new Float32Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) e[y * W + x] = tone(plate.x + (x + 0.5) * s, plate.y + (y + 0.5) * s)
  ctx.save(); clipTo(ctx, plate); ctx.fillStyle = o.ink; ctx.beginPath()
  const add = (x: number, y: number, v: number) => { if (x >= 0 && x < W && y < H) e[y * W + x] += v }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = e[y * W + x], on = v > 0.5, err = (v - (on ? 1 : 0)) / 8
    if (on) ctx.rect(plate.x + x * s, plate.y + y * s, s, s)
    add(x + 1, y, err); add(x + 2, y, err); add(x - 1, y + 1, err); add(x, y + 1, err); add(x + 1, y + 1, err); add(x, y + 2, err)
  }
  ctx.fill(); ctx.restore()
  return `pixel ${s} px · Atkinson, 6 neighbours, ¾ of the error kept`
}

/** 7 · ASCII: a 12 px cell and a ten-step ramp measured from the font */
let ramp10: string[] | null = null
const ascii: Render = (ctx, plate, R, at, o, font) => {
  const h = 12, w = 7.2, tone = sampler(R, R.tone, at)
  ramp10 ??= glyphRamp(font, 10)
  ctx.save(); clipTo(ctx, plate); ctx.fillStyle = o.ink; ctx.font = `500 ${h}px ${font}`; ctx.textBaseline = 'middle'
  for (let y = plate.y + h / 2; y < plate.y + plate.h; y += h) for (let x = plate.x; x < plate.x + plate.w; x += w) {
    const v = tone(x + w / 2, y)
    if (v < 0.05) continue
    ctx.fillText(ramp10[Math.min(9, Math.round(v * 9))], x, y)
  }
  ctx.restore()
  return `cell ${w} × ${h} px · 10 steps: ${ramp10.join('').replace(/^ /, '·')}`
}

/** 8 · Guilloché: rose-engine rings at the same crop; the outer rose heavier than the inner */
const guilloche: Render = (ctx, plate, _R, at, o) => {
  ctx.save(); clipTo(ctx, plate)
  guillocheRings(ctx, plate, { x: at.x, y: at.y, k: at.k }, { ink: o.ink, paper: o.paper, scale: 10, seed: o.seed, angle: 0 })
  ctx.restore()
  return 'rose curves, 12 + 6 + 5 + 8 phases · wave chain on the band · line 1.3 px'
}

/** 9 · Moiré: rings round both wheels, inside the mark's own silhouette */
const moire: Render = (ctx, plate, _R, at, o) => {
  const gap = 9
  ctx.save(); clipTo(ctx, plate); ctx.clip(markPath(at), 'evenodd'); ctx.strokeStyle = o.ink; ctx.lineWidth = 2
  for (const c of [MARK.wheel, MARK.whorl]) {
    const x = at.x + c.cx * at.k, y = at.y + c.cy * at.k
    ctx.beginPath(); for (let r = gap; r < 1600; r += gap) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2) } ctx.stroke()
  }
  ctx.restore()
  return `rings every ${gap} px · line 2 px · centres: drive wheel and whorl`
}

/** 10 · Plotter, after Nees: half-column squares on the grid; disorder grows down the sheet, faster on the mark */
const plotter: Render = (ctx, plate, R, at, o, _f) => {
  const m = 64, gut = 24, col = (1200 - m * 2 - gut * 11) / 12, pitch = (col + gut) / 2, q = pitch * 0.74, rand = rng(o.seed)
  const tone = sampler(R, R.tone, at)
  const rows = Math.floor((plate.h - 8) / pitch)
  ctx.save(); clipTo(ctx, plate); ctx.strokeStyle = o.ink; ctx.lineWidth = 1; ctx.beginPath()
  for (let r = 0; r < rows; r++) for (let c = 0; c < 24; c++) {
    const x = m + c * pitch + q / 2, y = plate.y + 4 + r * pitch + q / 2
    if (tone(x, y) < 0.04) { rand(); rand(); rand(); continue } // only the wheel is plotted; the paper stays empty
    const d = (r / rows) ** 1.5 // Nees: order at the top, disorder growing down the sheet
    const a = (rand() - 0.5) * d * Math.PI * 0.6, ox = (rand() - 0.5) * d * q * 0.8, oy = (rand() - 0.5) * d * q * 0.8, s = q / 2
    const co = Math.cos(a), si = Math.sin(a)
    const p = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([u, v]) => [x + ox + u * co - v * si, y + oy + u * si + v * co])
    ctx.moveTo(p[0][0], p[0][1]); for (const pt of p.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.closePath()
  }
  ctx.stroke(); ctx.restore()
  return `square ${q.toFixed(1)} px on the half-column · only on the mark; disorder grows down the sheet · seed ${o.seed}`
}

/** 11 · Contour survey: the relief's shading read as height, 22 levels, an index line every fifth */
let smooth: Tone | null = null
const contour: Render = (ctx, plate, R, at, o) => {
  smooth ??= blur(R.tone, Math.round(R.res * 1.2))
  const pt = toSheet(R, at), levels = Array.from({ length: 31 }, (_, i) => (i + 1) / 32)
  const fine = new Path2D(), index = new Path2D()
  isoAll(smooth, levels, (li, x0, y0, x1, y1) => { const p = (li + 1) % 5 === 0 ? index : fine; const [X0, Y0] = pt(x0, y0), [X1, Y1] = pt(x1, y1); p.moveTo(X0, Y0); p.lineTo(X1, Y1) })
  ctx.save(); clipTo(ctx, plate); ctx.strokeStyle = o.ink; ctx.lineCap = 'round'
  ctx.lineWidth = 0.6; ctx.stroke(fine); ctx.lineWidth = 1.4; ctx.stroke(index)
  ctx.restore()
  return 'height = shade, smoothed 6 px · 32 levels · 0.6 px, index 1.4 px every fifth'
}

/** 12 · Cyanotype: a photogram. The coated plate is the ink; where the mark lay, the paper stays white. */
const cyanotype: Render = (ctx, plate, R, at, o) => {
  const g = 3, rand = rng(o.seed), mask = blurMask(R), tone = sampler(R, R.tone, at), shade = sampler(R, mask, at)
  const W = Math.ceil(plate.w / g), H = Math.ceil(plate.h / g), img = new ImageData(W, H), ink = hex(o.ink)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = plate.x + (x + 0.5) * g, Y = plate.y + (y + 0.5) * g
    const blocked = shade(X, Y), exposure = 1 - blocked * (1 - 0.22 * tone(X, Y))
    if (rand() < exposure ** 1.5) { const i = (y * W + x) * 4; img.data[i] = ink[0]; img.data[i + 1] = ink[1]; img.data[i + 2] = ink[2]; img.data[i + 3] = 255 }
  }
  const c = new OffscreenCanvas(W, H); c.getContext('2d')!.putImageData(img, 0, 0)
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, plate.x, plate.y, W * g, H * g); ctx.restore()
  return `grain ${g} px · penumbra 1.5 mark units · the relief shows at 22% · seed ${o.seed}`
}
let maskT: Tone | null = null
function blurMask(R: Relief) {
  if (!maskT) { const d = new Float32Array(R.part.length); for (let i = 0; i < d.length; i++) d[i] = R.part[i] ? 1 : 0; maskT = blur(makeTone(R.tone.w, R.tone.h, d), Math.round(R.res * 0.75)) }
  return maskT
}

export const HANDS: Record<StyleId, Render> = { engraving, wood, stipple, lines, riso, dither, ascii, guilloche, moire, plotter, contour, cyanotype }
