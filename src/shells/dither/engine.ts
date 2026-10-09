/* ---------------------------------------------------------------------------
   Dither engine. Pure: (source pixels, settings) → result data. No DOM, so it
   runs the same in the worker, on the main thread, and in tests.

     source ─ downsample to the working grid ─ adjust (blur, sharpen, levels)
            ─ effect (diffusion · ordered · halftone · ASCII · pixelate) ─ result

   Results are DATA, not pixels, wherever the effect is vector-like:
     raster    palette-indexed pixels on the working grid (drawn nearest-neighbour)
     halftone  dot centres + radii + colour index (drawn as circles / SVG)
     ascii     a character grid + per-cell colours (drawn as text / copied as text)
--------------------------------------------------------------------------- */

export type EffectId = 'floyd' | 'atkinson' | 'stucki' | 'bayer4' | 'bayer8' | 'halftone' | 'ascii' | 'pixelate'

export interface Settings {
  levels: boolean
  brightness: number
  contrast: number
  gamma: number
  blur: number
  sharpen: number
  invert: boolean
  effect: EffectId
  pixel: number
  strength: number
  serpentine: boolean
  spread: number
  cell: number
  angle: number
  gain: number
  dotColor: 'ink' | 'palette'
  ramp: string
  fontSize: number
  asciiColor: 'ink' | 'palette' | 'source'
  quantise: boolean
  swap: boolean
  /** tone: map brightness onto the palette's brightness ramp · colour: nearest colour */
  match: 'tone' | 'colour'
  palette: string[]
}

export interface Source { w: number; h: number; data: Uint8ClampedArray }

export type Result =
  | { kind: 'raster'; w: number; h: number; cell: number; outW: number; outH: number; srcW: number; srcH: number; rgba: Uint8ClampedArray; ms: number; draft: boolean }
  | { kind: 'halftone'; srcW: number; srcH: number; dots: Float32Array; count: number; colors: string[]; paper: string; ms: number; draft: boolean }
  | { kind: 'ascii'; srcW: number; srcH: number; cols: number; rows: number; cellW: number; cellH: number; fontSize: number; chars: string; rgb: Uint8Array | null; ink: string; paper: string; ms: number; draft: boolean }

type DistOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

export const RASTER: EffectId[] = ['floyd', 'atkinson', 'stucki', 'bayer4', 'bayer8', 'pixelate']
export const DIFFUSION: EffectId[] = ['floyd', 'atkinson', 'stucki']
export const ASCII_ASPECT = 0.6 // monospace advance / font size

/* ---------- colour ---------- */
const hexRgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b

interface Pal { n: number; rgb: Float32Array; hex: string[]; dark: number; light: number }
function makePalette(hex: string[]): Pal {
  const list = hex.length ? hex : ['#000000', '#ffffff']
  const rgb = new Float32Array(list.length * 3)
  let dark = 0, light = 0, lo = Infinity, hi = -Infinity
  list.forEach((h, i) => {
    const [r, g, b] = hexRgb(h)
    rgb.set([r, g, b], i * 3)
    const l = lum(r, g, b)
    if (l < lo) { lo = l; dark = i }
    if (l > hi) { hi = l; light = i }
  })
  return { n: list.length, rgb, hex: list.map((h) => h.slice(0, 7)), dark, light }
}

/** Nearest palette entry, perceptually weighted ("redmean"-style weights on sRGB). */
function nearest(p: Pal, r: number, g: number, b: number) {
  let best = 0, bd = Infinity
  const c = p.rgb
  for (let i = 0; i < p.n; i++) {
    const dr = r - c[i * 3], dg = g - c[i * 3 + 1], db = b - c[i * 3 + 2]
    const rm = (r + c[i * 3]) * 0.5
    const d = (2 + rm) * dr * dr + 4 * dg * dg + (3 - rm) * db * db
    if (d < bd) { bd = d; best = i }
  }
  return best
}

/* ---------- resampling ---------- */
/** Area-average downsample (or nearest upsample) RGBA8 → float RGB 0–1. */
export function resample(src: Source, tw: number, th: number): Float32Array {
  const out = new Float32Array(tw * th * 3)
  const sx = src.w / tw, sy = src.h / th
  const d = src.data
  for (let ty = 0; ty < th; ty++) {
    const y0 = Math.floor(ty * sy), y1 = Math.max(y0 + 1, Math.min(src.h, Math.floor((ty + 1) * sy)))
    for (let tx = 0; tx < tw; tx++) {
      const x0 = Math.floor(tx * sx), x1 = Math.max(x0 + 1, Math.min(src.w, Math.floor((tx + 1) * sx)))
      let r = 0, g = 0, b = 0, n = 0
      for (let y = y0; y < y1; y++) {
        let i = (y * src.w + x0) * 4
        for (let x = x0; x < x1; x++, i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++ }
      }
      const o = (ty * tw + tx) * 3
      const k = 1 / (n * 255)
      out[o] = r * k; out[o + 1] = g * k; out[o + 2] = b * k
    }
  }
  return out
}

/** Separable box blur ×3 ≈ gaussian. radius in grid px (fractional ok). Cache-friendly: rows slide
 *  a window along x; the vertical pass keeps running column sums so it also walks memory in order. */
function blur(buf: Float32Array, w: number, h: number, radius: number) {
  if (radius < 0.35) return buf
  const r = Math.max(1, Math.round(radius * 0.6))
  const inv = 1 / (2 * r + 1)
  const W3 = w * 3
  const tmp = new Float32Array(buf.length)
  const acc = new Float32Array(W3)
  const horiz = (src: Float32Array, dst: Float32Array) => {
    for (let y = 0; y < h; y++) {
      const row = y * W3
      for (let c = 0; c < 3; c++) {
        let a = src[row + c] * (r + 1)
        for (let k = 1; k <= r; k++) a += src[row + (k < w ? k : w - 1) * 3 + c]
        for (let x = 0; x < w; x++) {
          dst[row + x * 3 + c] = a * inv
          const ax = x + r + 1, sx = x - r
          a += src[row + (ax < w ? ax : w - 1) * 3 + c] - src[row + (sx > 0 ? sx : 0) * 3 + c]
        }
      }
    }
  }
  const vert = (src: Float32Array, dst: Float32Array) => {
    for (let i = 0; i < W3; i++) acc[i] = src[i] * (r + 1)
    for (let k = 1; k <= r; k++) { const o = (k < h ? k : h - 1) * W3; for (let i = 0; i < W3; i++) acc[i] += src[o + i] }
    for (let y = 0; y < h; y++) {
      const o = y * W3, ay = y + r + 1, sy = y - r
      const oa = (ay < h ? ay : h - 1) * W3, os = (sy > 0 ? sy : 0) * W3
      for (let i = 0; i < W3; i++) { dst[o + i] = acc[i] * inv; acc[i] += src[oa + i] - src[os + i] }
    }
  }
  for (let it = 0; it < 3; it++) { horiz(buf, tmp); vert(tmp, buf) }
  return buf
}

/** Adjustments in a fixed order: blur → sharpen → brightness/contrast → gamma → invert. */
export function adjust(buf: Float32Array, w: number, h: number, s: Settings, pxScale: number) {
  let out = buf
  if (s.blur > 0) out = blur(new Float32Array(out), w, h, s.blur * pxScale)
  if (s.sharpen > 0) {
    const soft = blur(new Float32Array(out), w, h, Math.max(1, 1.5 * pxScale))
    for (let i = 0; i < out.length; i++) out[i] = out[i] + s.sharpen * (out[i] - soft[i])
  }
  // auto levels: stretch the 0.5th–99.5th luminance percentiles to the full range
  let lo = 0, sc = 1
  if (s.levels) {
    const hist = new Uint32Array(256)
    const stride = Math.max(1, Math.floor(out.length / 3 / 40000)) * 3
    let n = 0
    for (let i = 0; i < out.length; i += stride) { hist[Math.min(255, Math.max(0, (lum(out[i], out[i + 1], out[i + 2]) * 255) | 0))]++; n++ }
    const pick = (q: number) => { let acc = 0; for (let b = 0; b < 256; b++) { acc += hist[b]; if (acc >= q * n) return b / 255 } return 1 }
    lo = pick(0.005)
    const hi = pick(0.995)
    sc = hi - lo > 0.05 ? 1 / (hi - lo) : 1
    if (sc === 1) lo = 0
  }
  const cf = Math.tan(((Math.min(0.99, s.contrast) + 1) * Math.PI) / 4) // −1…1 → 0…∞, 0 → 1
  const ig = 1 / s.gamma
  // the whole tone curve as a 2048-step LUT over the clamped input
  const N = 2048
  const lut = new Float32Array(N + 1)
  for (let j = 0; j <= N; j++) {
    let v = ((j / N - lo) * sc - 0.5) * cf + 0.5 + s.brightness
    v = v <= 0 ? 0 : v >= 1 ? 1 : v
    if (ig !== 1) v = Math.pow(v, ig)
    lut[j] = s.invert ? 1 - v : v
  }
  for (let i = 0; i < out.length; i++) {
    const x = out[i]
    const f = (x <= 0 ? 0 : x >= 1 ? 1 : x) * N
    const j = f | 0
    out[i] = j >= N ? lut[N] : lut[j] + (lut[j + 1] - lut[j]) * (f - j)
  }
  return out
}

/* ---------- effects ---------- */
const KERNELS: Record<string, [number, number, number][]> = {
  floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
  atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  stucki: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2], [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1]].map(([x, y, k]) => [x, y, k / 42] as [number, number, number]),
}

function diffuse(buf: Float32Array, w: number, h: number, p: Pal, kernel: [number, number, number][], strength: number, serpentine: boolean) {
  const idx = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const rev = serpentine && y % 2 === 1
    for (let k = 0; k < w; k++) {
      const x = rev ? w - 1 - k : k
      const i = (y * w + x) * 3
      const r = Math.min(1, Math.max(0, buf[i])), g = Math.min(1, Math.max(0, buf[i + 1])), b = Math.min(1, Math.max(0, buf[i + 2]))
      const c = nearest(p, r, g, b)
      idx[y * w + x] = c
      const er = (r - p.rgb[c * 3]) * strength, eg = (g - p.rgb[c * 3 + 1]) * strength, eb = (b - p.rgb[c * 3 + 2]) * strength
      for (const [dx, dy, wt] of kernel) {
        const nx = x + (rev ? -dx : dx), ny = y + dy
        if (nx < 0 || nx >= w || ny >= h) continue
        const j = (ny * w + nx) * 3
        buf[j] += er * wt; buf[j + 1] += eg * wt; buf[j + 2] += eb * wt
      }
    }
  }
  return idx
}

/* ---- tone mode: dither brightness along the palette's own brightness ramp ---- */
interface Ramp { lum: Float32Array; idx: Uint8Array; lo: number; hi: number }
function rampOf(p: Pal): Ramp {
  const order = Array.from({ length: p.n }, (_, i) => i).sort((a, b) => lum(p.rgb[a * 3], p.rgb[a * 3 + 1], p.rgb[a * 3 + 2]) - lum(p.rgb[b * 3], p.rgb[b * 3 + 1], p.rgb[b * 3 + 2]))
  const l = Float32Array.from(order, (i) => lum(p.rgb[i * 3], p.rgb[i * 3 + 1], p.rgb[i * 3 + 2]))
  return { lum: l, idx: Uint8Array.from(order), lo: l[0], hi: l[l.length - 1] }
}
const nearest1 = (r: Ramp, v: number) => { let best = 0, bd = Infinity; for (let i = 0; i < r.lum.length; i++) { const d = Math.abs(v - r.lum[i]); if (d < bd) { bd = d; best = i } } return best }
/** Luminance of each pixel, stretched to the palette's brightness range so the whole ramp gets used. */
function greyOf(buf: Float32Array, n: number, r: Ramp) {
  const g = new Float32Array(n)
  for (let i = 0; i < n; i++) g[i] = r.lo + lum(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]) * (r.hi - r.lo)
  return g
}
function diffuseTone(g: Float32Array, w: number, h: number, r: Ramp, kernel: [number, number, number][], strength: number, serpentine: boolean) {
  const idx = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const rev = serpentine && y % 2 === 1
    for (let k = 0; k < w; k++) {
      const x = rev ? w - 1 - k : k
      const i = y * w + x
      const v = g[i]
      const c = nearest1(r, v)
      idx[i] = r.idx[c]
      const e = (v - r.lum[c]) * strength
      for (const [dx, dy, wt] of kernel) {
        const nx = x + (rev ? -dx : dx), ny = y + dy
        if (nx < 0 || nx >= w || ny >= h) continue
        g[ny * w + nx] += e * wt
      }
    }
  }
  return idx
}
function orderedTone(g: Float32Array, w: number, h: number, r: Ramp, n: 4 | 8, spread: number) {
  const m = BAYER[n]
  const amt = (spread * (r.hi - r.lo)) / Math.max(1, r.lum.length - 1)
  const idx = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) idx[y * w + x] = r.idx[nearest1(r, g[y * w + x] + m[(y % n) * n + (x % n)] * amt)]
  return idx
}

function bayerMatrix(n: number): Float32Array {
  let m = [0]
  let size = 1
  while (size < n) {
    const next = new Array(size * 2 * size * 2)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const v = m[y * size + x] * 4
        next[y * 2 * size + x] = v
        next[y * 2 * size + x + size] = v + 2
        next[(y + size) * 2 * size + x] = v + 3
        next[(y + size) * 2 * size + x + size] = v + 1
      }
    m = next
    size *= 2
  }
  return Float32Array.from(m, (v) => (v + 0.5) / (n * n) - 0.5)
}
const BAYER: Record<number, Float32Array> = { 4: bayerMatrix(4), 8: bayerMatrix(8) }

function ordered(buf: Float32Array, w: number, h: number, p: Pal, n: 4 | 8, spread: number) {
  const m = BAYER[n]
  const amt = spread / Math.max(1, Math.sqrt(p.n) - 0.4)
  const idx = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = m[(y % n) * n + (x % n)] * amt
      const i = (y * w + x) * 3
      idx[y * w + x] = nearest(p, buf[i] + t, buf[i + 1] + t, buf[i + 2] + t)
    }
  return idx
}

function toRGBA(idx: Uint8Array, p: Pal) {
  const out = new Uint8ClampedArray(idx.length * 4)
  for (let i = 0; i < idx.length; i++) {
    const c = idx[i] * 3
    out[i * 4] = p.rgb[c] * 255; out[i * 4 + 1] = p.rgb[c + 1] * 255; out[i * 4 + 2] = p.rgb[c + 2] * 255; out[i * 4 + 3] = 255
  }
  return out
}

/** Bilinear sample of a float RGB grid. */
function sample(buf: Float32Array, w: number, h: number, x: number, y: number, out: number[]) {
  x = Math.min(w - 1.001, Math.max(0, x - 0.5)); y = Math.min(h - 1.001, Math.max(0, y - 0.5))
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0
  const i00 = (y0 * w + x0) * 3, i10 = i00 + 3, i01 = i00 + w * 3, i11 = i01 + 3
  for (let c = 0; c < 3; c++) {
    const a = buf[i00 + c] + (buf[i10 + c] - buf[i00 + c]) * fx
    const b = buf[i01 + c] + (buf[i11 + c] - buf[i01 + c]) * fx
    out[c] = a + (b - a) * fy
  }
}

/* ---------- entry point ---------- */
/**
 * @param maxWork  cap on working-grid pixels — the draft path while dragging.
 * @param scale    multiply size-like settings (thumbnails of a smaller source).
 */
export function process(src: Source, s: Settings, opts: { maxWork?: number; scale?: number; cache?: Map<string, Float32Array> } = {}): Result {
  const t0 = performance.now()
  const k = opts.scale ?? 1
  const p = makePalette(s.palette)
  const cache = opts.cache
  const grid = (tw: number, th: number) => {
    const key = `${tw}x${th}`
    let g = cache?.get(key)
    if (!g) { g = resample(src, tw, th); if (cache) { if (cache.size > 6) cache.clear(); cache.set(key, g) } }
    return new Float32Array(g)
  }
  const done = (r: DistOmit<Result, 'ms'>): Result => ({ ...r, ms: performance.now() - t0 }) as Result

  if (RASTER.includes(s.effect)) {
    let cell = Math.max(1, Math.round(s.pixel * k))
    let w = Math.max(1, Math.floor(src.w / cell)), h = Math.max(1, Math.floor(src.h / cell))
    // the output frame is always the FULL render's size, so a draft never moves the artboard
    const outW = w * cell, outH = h * cell
    let draft = false
    if (opts.maxWork && w * h > opts.maxWork) {
      const f = Math.sqrt(opts.maxWork / (w * h))
      w = Math.max(1, Math.floor(w * f)); h = Math.max(1, Math.floor(h * f)); draft = true
      cell = outW / w
    }
    const buf = adjust(grid(w, h), w, h, s, 1 / cell)
    let rgba: Uint8ClampedArray
    const tone = s.match !== 'colour'
    const ramp = tone ? rampOf(p) : null
    if (s.effect === 'pixelate') {
      if (s.quantise) {
        const idx = new Uint8Array(w * h)
        if (ramp) { const g = greyOf(buf, w * h, ramp); for (let i = 0; i < w * h; i++) idx[i] = ramp.idx[nearest1(ramp, g[i])] }
        else for (let i = 0; i < w * h; i++) idx[i] = nearest(p, buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2])
        rgba = toRGBA(idx, p)
      } else {
        rgba = new Uint8ClampedArray(w * h * 4)
        for (let i = 0; i < w * h; i++) { rgba[i * 4] = buf[i * 3] * 255; rgba[i * 4 + 1] = buf[i * 3 + 1] * 255; rgba[i * 4 + 2] = buf[i * 3 + 2] * 255; rgba[i * 4 + 3] = 255 }
      }
    } else if (s.effect === 'bayer4' || s.effect === 'bayer8') {
      const n = s.effect === 'bayer4' ? 4 : 8
      rgba = toRGBA(ramp ? orderedTone(greyOf(buf, w * h, ramp), w, h, ramp, n, s.spread) : ordered(buf, w, h, p, n, s.spread), p)
    } else {
      rgba = toRGBA(ramp ? diffuseTone(greyOf(buf, w * h, ramp), w, h, ramp, KERNELS[s.effect], s.strength, s.serpentine) : diffuse(buf, w, h, p, KERNELS[s.effect], s.strength, s.serpentine), p)
    }
    return done({ kind: 'raster', w, h, cell, outW, outH, srcW: src.w, srcH: src.h, rgba, draft })
  }

  const ink = s.swap ? p.light : p.dark
  const paper = s.swap ? p.dark : p.light

  if (s.effect === 'halftone') {
    const cell = Math.max(2, s.cell * k)
    // analyse on a grid ~3 samples per cell, capped for drafts
    let g = Math.max(1, cell / 3)
    let w = Math.max(2, Math.round(src.w / g)), h = Math.max(2, Math.round(src.h / g))
    let draft = false
    if (opts.maxWork && w * h > opts.maxWork) { const f = Math.sqrt(opts.maxWork / (w * h)); w = Math.round(w * f); h = Math.round(h * f); draft = true }
    g = src.w / w
    const buf = adjust(grid(w, h), w, h, s, 1 / g)
    const a = (s.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a)
    const cx = src.w / 2, cy = src.h / 2
    const half = Math.hypot(src.w, src.h) / 2 + cell
    const n = Math.ceil(half / cell)
    const dots = new Float32Array((2 * n + 1) * (2 * n + 1) * 4)
    let count = 0
    const c3 = [0, 0, 0]
    // area-true dots (coverage = darkness) that grow to touch-and-merge in deep shadows
    const rFor = (a: number) => cell * Math.sqrt(a / Math.PI) * (a > 0.78 ? 1 + (a - 0.78) * 1.15 : 1) * s.gain
    for (let j = -n; j <= n; j++)
      for (let i = -n; i <= n; i++) {
        const u = (i + 0.5) * cell, v = (j + 0.5) * cell
        const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca
        if (x < -cell || y < -cell || x > src.w + cell || y > src.h + cell) continue
        sample(buf, w, h, x / g, y / g, c3)
        const l = lum(c3[0], c3[1], c3[2])
        const amount = s.swap ? l : 1 - l
        const r = rFor(Math.max(0, amount))
        if (r < 0.2) continue
        let col = ink
        if (s.dotColor === 'palette') {
          col = nearest(p, c3[0], c3[1], c3[2])
          if (col === paper) col = ink
        }
        dots[count * 4] = x; dots[count * 4 + 1] = y; dots[count * 4 + 2] = r; dots[count * 4 + 3] = col
        count++
      }
    return done({ kind: 'halftone', srcW: src.w, srcH: src.h, dots: dots.slice(0, count * 4), count, colors: p.hex, paper: p.hex[paper], draft })
  }

  if (s.effect === 'ascii') {
    const fontSize = Math.max(3, s.fontSize * k)
    const cellW = fontSize * ASCII_ASPECT, cellH = fontSize
    let cols = Math.max(1, Math.floor(src.w / cellW)), rows = Math.max(1, Math.floor(src.h / cellH))
    const draft = false
    if (opts.maxWork && cols * rows > opts.maxWork * 4) { const f = Math.sqrt((opts.maxWork * 4) / (cols * rows)); cols = Math.floor(cols * f); rows = Math.floor(rows * f) }
    const buf = adjust(grid(cols, rows), cols, rows, s, 1 / cellW)
    const ramp = s.ramp.length ? [...s.ramp] : [' ', '#']
    const L = ramp.length - 1
    let chars = ''
    const rgb = s.asciiColor === 'ink' ? null : new Uint8Array(cols * rows * 3)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 3
        const l = lum(buf[i], buf[i + 1], buf[i + 2])
        const amount = s.swap ? l : 1 - l
        chars += ramp[Math.round(Math.min(1, Math.max(0, amount)) * L)]
        if (rgb) {
          if (s.asciiColor === 'palette') {
            let c = nearest(p, buf[i], buf[i + 1], buf[i + 2])
            if (c === paper) c = ink
            rgb[i] = p.rgb[c * 3] * 255; rgb[i + 1] = p.rgb[c * 3 + 1] * 255; rgb[i + 2] = p.rgb[c * 3 + 2] * 255
          } else { rgb[i] = buf[i] * 255; rgb[i + 1] = buf[i + 1] * 255; rgb[i + 2] = buf[i + 2] * 255 }
        }
      }
      if (y < rows - 1) chars += '\n'
    }
    return done({ kind: 'ascii', srcW: src.w, srcH: src.h, cols, rows, cellW: src.w / cols, cellH: src.h / rows, fontSize, chars, rgb, ink: p.hex[ink], paper: p.hex[paper], draft })
  }

  throw new Error(`Unknown effect ${s.effect}`)
}
