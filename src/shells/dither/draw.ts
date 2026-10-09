/* Results → pixels / SVG / text. `scale` is output px per image px, so the
   same function draws the stage (scale = zoom-aware) and exports at 1×–4×. */
import type { Result } from './engine'

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

/** The working-grid image for a raster result (1 px per output cell). */
export function rasterCanvas(r: Extract<Result, { kind: 'raster' }>, into?: HTMLCanvasElement) {
  const c = into ?? document.createElement('canvas')
  if (c.width !== r.w || c.height !== r.h) { c.width = r.w; c.height = r.h }
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(r.rgba), r.w, r.h), 0, 0)
  return c
}

/** Output size in image px (raster results are a whole number of cells). */
export const outSize = (r: Result) => r.kind === 'raster' ? { w: r.outW, h: r.outH } : { w: r.srcW, h: r.srcH }

/** Draw a vector-ish result (halftone, ASCII) at `scale` output px per image px. */
export function drawVector(ctx: CanvasRenderingContext2D, r: Result, scale: number) {
  if (r.kind === 'halftone') {
    ctx.fillStyle = r.paper
    ctx.fillRect(0, 0, r.srcW * scale, r.srcH * scale)
    // batch by colour: one path per ink
    const byColor = new Map<number, Path2D>()
    for (let i = 0; i < r.count; i++) {
      const ci = r.dots[i * 4 + 3]
      let path = byColor.get(ci)
      if (!path) byColor.set(ci, (path = new Path2D()))
      const x = r.dots[i * 4] * scale, y = r.dots[i * 4 + 1] * scale, rad = r.dots[i * 4 + 2] * scale
      path.moveTo(x + rad, y)
      path.arc(x, y, rad, 0, Math.PI * 2)
    }
    for (const [ci, path] of byColor) { ctx.fillStyle = r.colors[ci]; ctx.fill(path) }
  } else if (r.kind === 'ascii') {
    ctx.fillStyle = r.paper
    ctx.fillRect(0, 0, r.srcW * scale, r.srcH * scale)
    ctx.font = `500 ${r.fontSize * scale}px ${MONO}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = r.ink
    const cw = r.cellW * scale, ch = r.cellH * scale
    let x = 0, y = 0
    for (let i = 0; i < r.chars.length; i++) {
      const c = r.chars[i]
      if (c === '\n') { y++; x = 0; continue }
      if (c !== ' ') {
        if (r.rgb) { const k = (y * r.cols + x) * 3; ctx.fillStyle = `rgb(${r.rgb[k]},${r.rgb[k + 1]},${r.rgb[k + 2]})` }
        ctx.fillText(c, (x + 0.5) * cw, (y + 0.5) * ch)
      }
      x++
    }
  }
}

/** A finished image at `scale` (1, 2, 4…). Raster scales nearest-neighbour; vectors re-draw. */
export function renderOutput(r: Result, scale: number): HTMLCanvasElement {
  const { w, h } = outSize(r)
  const c = document.createElement('canvas')
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  const ctx = c.getContext('2d')!
  if (r.kind === 'raster') {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(rasterCanvas(r), 0, 0, c.width, c.height)
  } else drawVector(ctx, r, scale)
  return c
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0')

/** Halftone as real circles — prints and scales forever. */
export function halftoneSVG(r: Extract<Result, { kind: 'halftone' }>) {
  const groups = new Map<number, string[]>()
  for (let i = 0; i < r.count; i++) {
    const ci = r.dots[i * 4 + 3]
    if (!groups.has(ci)) groups.set(ci, [])
    groups.get(ci)!.push(`<circle cx="${r.dots[i * 4].toFixed(2)}" cy="${r.dots[i * 4 + 1].toFixed(2)}" r="${r.dots[i * 4 + 2].toFixed(2)}"/>`)
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.srcW} ${r.srcH}" width="${r.srcW}" height="${r.srcH}">`,
    `<rect width="100%" height="100%" fill="${r.paper}"/>`,
    ...[...groups].map(([ci, cs]) => `<g fill="${r.colors[ci]}">${cs.join('')}</g>`),
    '</svg>',
  ].join('\n')
}

/** Colour of the output under an image-space point, for the readout. */
export function colorAt(r: Result | null, x: number, y: number): string | null {
  if (!r) return null
  if (r.kind === 'raster') {
    const gx = Math.floor((x / r.outW) * r.w), gy = Math.floor((y / r.outH) * r.h)
    if (gx < 0 || gy < 0 || gx >= r.w || gy >= r.h) return null
    const i = (gy * r.w + gx) * 4
    return `#${hex2(r.rgba[i])}${hex2(r.rgba[i + 1])}${hex2(r.rgba[i + 2])}`
  }
  if (r.kind === 'ascii') {
    const cx = Math.floor(x / r.cellW), cy = Math.floor(y / r.cellH)
    if (cx < 0 || cy < 0 || cx >= r.cols || cy >= r.rows) return null
    const ch = r.chars[cy * (r.cols + 1) + cx]
    return ch === ' ' ? r.paper : r.ink
  }
  return null
}
