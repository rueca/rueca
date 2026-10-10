/* Colour maths for the artifact: OKLab for perceptual mixing, and the brand
   palette Randomise draws from. Pure functions, no DOM. */

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

/* Rueca dye families (brand/data.js ruecaRamps): a light wash (200), the dye itself
   and a deep dark (800). Randomise only ever mixes these, so every shuffle stays
   on brand. */
const DYES: { light: string; base: string; dark: string }[] = [
  { light: '#FED0C3', base: '#E8582C', dark: '#7F1E0C' }, // Achiote
  { light: '#FED0C7', base: '#EE7A68', dark: '#752B25' }, // Cochinilla
  { light: '#F0DBA1', base: '#F2C744', dark: '#5E4000' }, // Gualda
  { light: '#B6EAD2', base: '#2FA57C', dark: '#015341' }, // Hoja
  { light: '#B9E3FF', base: '#5DB4E8', dark: '#0B4C6C' }, // Cielo
  { light: '#DED6FF', base: '#A88BF6', dark: '#503578' }, // Malva
  { light: '#D0DBFE', base: '#3440C8', dark: '#2C3A95' }, // Añil
]
/** the grounds: walnut, madder and the deepest dyes */
const GROUNDS = ['#181411', '#181411', '#5E2219', '#5B0C04', '#1B246C', '#372156', '#00382C']
const LANA = '#F3F1EB'

/** A 4–5 colour palette from the brand: one dark ground, two or three dyes, one light lift. */
export function randomPalette(seed: number): string[] {
  const r = rng(seed)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const deck = [...DYES]
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]] }
  const families = deck.slice(0, r() < 0.5 ? 2 : 3)
  // each dye at its own strength, or a step lighter or deeper, for variety
  const mids = families.map((f) => { const x = r(); return x < 0.6 ? f.base : x < 0.8 ? f.light : f.dark })
  const lift = r() < 0.5 ? LANA : families[0].light
  return [pick(GROUNDS), ...mids, lift]
}
