/* Colour maths for the artifact: OKLab for perceptual mixing, OKLCH for
   generating harmonious random palettes. Pure functions, no DOM. */

export type Vec3 = [number, number, number]

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function hexToRgb01(hex: string): Vec3 {
  let h = hex.replace('#', '').trim()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const rgb01ToHex = ([r, g, b]: Vec3) =>
  '#' + [r, g, b].map((x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0')).join('')

// sRGB → OKLab, after Björn Ottosson's reference (c) 2020, public domain / MIT. See THIRD_PARTY_NOTICES.md
export function hexToOklab(hex: string): Vec3 {
  const [r, g, b] = hexToRgb01(hex).map(toLin) as Vec3
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToHex([L, a, b]: Vec3): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return rgb01ToHex([
    toGam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ])
}

export const oklchToHex = (L: number, C: number, hDeg: number) => {
  const h = (hDeg * Math.PI) / 180
  return oklabToHex([L, C * Math.cos(h), C * Math.sin(h)])
}

/** Small seeded PRNG (mulberry32) so a seed always yields the same palette. */
export function rng(seed: number) {
  let a = (seed >>> 0) || 1
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A harmonious 4–5 colour palette: one dark anchor, a few mid chroma notes, one light lift. */
export function randomPalette(seed: number): string[] {
  const r = rng(seed)
  const base = r() * 360
  const scheme = Math.floor(r() * 4) // 0 analogous · 1 split · 2 triad-ish · 3 complementary
  const offsets = [[0, 28, 56, -30], [0, 150, 210, 30], [0, 120, 240, 60], [0, 180, 20, 200]][scheme]
  const n = 4 + (r() < 0.5 ? 1 : 0)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const h = base + offsets[i % offsets.length] + (r() - 0.5) * 18
    const L = i === 0 ? 0.22 + r() * 0.12 : i === n - 1 ? 0.86 + r() * 0.08 : 0.5 + r() * 0.26
    const C = i === n - 1 ? 0.04 + r() * 0.05 : 0.1 + r() * 0.1
    out.push(oklchToHex(L, C, h))
  }
  // shuffle all but keep the dark one first so the field has depth
  for (let i = out.length - 1; i > 1; i--) { const j = 1 + Math.floor(r() * i); [out[i], out[j]] = [out[j], out[i]] }
  return out
}
