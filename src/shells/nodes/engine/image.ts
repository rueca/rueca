/* ---------------------------------------------------------------------------
   Image buffers + maths for the node engine. Float RGBA, straight alpha,
   0–1. Everything is evaluated in normalised uv so a 160px thumbnail and a
   2048px export are the same picture.
--------------------------------------------------------------------------- */
import { mulberry32 } from '../../util'

export interface Img { w: number; h: number; d: Float32Array }
export type RGBA = [number, number, number, number]

export const makeImg = (w: number, h: number): Img => ({ w, h, d: new Float32Array(w * h * 4) })

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (a: number, b: number, x: number) => {
  if (a === b) return x < a ? 0 : 1
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** '#rgb' '#rgba' '#rrggbb' '#rrggbbaa' or an RGBA tuple → RGBA 0–1 */
export function toRGBA(c: unknown): RGBA {
  if (Array.isArray(c)) return [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, c[3] ?? 1]
  let s = String(c ?? '#000').replace('#', '')
  if (s.length === 3 || s.length === 4) s = s.split('').map((x) => x + x).join('')
  const n = (i: number) => parseInt(s.slice(i, i + 2), 16) / 255
  return [n(0) || 0, n(2) || 0, n(4) || 0, s.length >= 8 ? n(6) : 1]
}
export const toHex = ([r, g, b, a]: RGBA) => {
  const h = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a) : ''}`
}

/* --- deterministic randomness --- */
const hash2 = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/* --- gradient noise (Perlin-style), seeded --- */
export function perlin(seed: number) {
  const rnd = mulberry32(seed * 9973 + 17)
  const perm = new Uint16Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]] }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const gx = new Float32Array(256), gy = new Float32Array(256)
  for (let i = 0; i < 256; i++) { const a = rnd() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a) }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const X = xi & 255, Y = yi & 255
    const g = (ix: number, iy: number, dx: number, dy: number) => { const h = perm[ix + perm[iy]]; return gx[h] * dx + gy[h] * dy }
    const n00 = g(X, Y, xf, yf), n10 = g(X + 1, Y, xf - 1, yf)
    const n01 = g(X, Y + 1, xf, yf - 1), n11 = g(X + 1, Y + 1, xf - 1, yf - 1)
    const u = fade(xf), v = fade(yf)
    const a = n00 + u * (n10 - n00), b = n01 + u * (n11 - n01)
    return (a + v * (b - a)) * 1.414 // ≈ −1…1
  }
}

/** Worley F1 / F2 distances. */
export function worley(seed: number) {
  return (x: number, y: number): [number, number] => {
    const xi = Math.floor(x), yi = Math.floor(y)
    let f1 = 9, f2 = 9
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = xi + i, cy = yi + j
        const px = cx + hash2(cx, cy, seed), py = cy + hash2(cy, cx, seed + 31)
        const dx = px - x, dy = py - y
        const d = dx * dx + dy * dy
        if (d < f1) { f2 = f1; f1 = d } else if (d < f2) f2 = d
      }
    return [Math.sqrt(f1), Math.sqrt(f2)]
  }
}

/** Bilinear sample with a wrap mode; writes into `out`. */
export function sample(img: Img, u: number, v: number, wrap: string, out: RGBA) {
  const { w, h, d } = img
  if (wrap === 'repeat') { u -= Math.floor(u); v -= Math.floor(v) }
  else if (wrap === 'mirror') { u = Math.abs(((u % 2) + 2) % 2); v = Math.abs(((v % 2) + 2) % 2); if (u > 1) u = 2 - u; if (v > 1) v = 2 - v }
  else if (wrap === 'none' && (u < 0 || u > 1 || v < 0 || v > 1)) { out[0] = out[1] = out[2] = out[3] = 0; return out }
  const x = clamp01(u) * w - 0.5, y = clamp01(v) * h - 0.5
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0
  const wrapI = (i: number, n: number) => (wrap === 'repeat' ? ((i % n) + n) % n : i < 0 ? 0 : i >= n ? n - 1 : i)
  const xa = wrapI(x0, w), xb = wrapI(x0 + 1, w), ya = wrapI(y0, h), yb = wrapI(y0 + 1, h)
  const i00 = (ya * w + xa) * 4, i10 = (ya * w + xb) * 4, i01 = (yb * w + xa) * 4, i11 = (yb * w + xb) * 4
  for (let c = 0; c < 4; c++) {
    const a = d[i00 + c] + (d[i10 + c] - d[i00 + c]) * fx
    const b = d[i01 + c] + (d[i11 + c] - d[i01 + c]) * fx
    out[c] = a + (b - a) * fy
  }
  return out
}

/** Separable box blur, `passes` times (3 ≈ gaussian). In place on a copy. */
export function boxBlur(src: Img, rx: number, ry: number, passes: number): Img {
  const { w, h } = src
  let a = new Float32Array(src.d)
  let b = new Float32Array(a.length)
  const blur1 = (from: Float32Array, to: Float32Array, r: number, horizontal: boolean) => {
    if (r < 0.5) { to.set(from); return }
    const R = Math.round(r)
    const n = horizontal ? w : h, lines = horizontal ? h : w
    const stride = horizontal ? 4 : w * 4
    const inv = 1 / (2 * R + 1)
    for (let l = 0; l < lines; l++) {
      const base = horizontal ? l * w * 4 : l * 4
      for (let c = 0; c < 4; c++) {
        let acc = 0
        for (let k = -R; k <= R; k++) acc += from[base + Math.min(n - 1, Math.max(0, k)) * stride + c]
        for (let i = 0; i < n; i++) {
          to[base + i * stride + c] = acc * inv
          const add = Math.min(n - 1, i + R + 1), sub = Math.max(0, i - R)
          acc += from[base + add * stride + c] - from[base + sub * stride + c]
        }
      }
    }
  }
  for (let p = 0; p < passes; p++) {
    blur1(a, b, rx, true); [a, b] = [b, a]
    blur1(a, b, ry, false); [a, b] = [b, a]
  }
  return { w, h, d: a }
}

/** Float image → 8-bit RGBA (for canvas). */
export function toBytes(img: Img): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(img.w * img.h * 4))
  const d = img.d
  for (let i = 0; i < d.length; i++) out[i] = d[i] * 255 + 0.5
  return out
}
