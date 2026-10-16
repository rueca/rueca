/* Colour maths for the artifact: OKLab for perceptual mixing, and the brand
   palette Randomise draws from. Pure functions, no DOM. */

export type Vec3 = [number, number, number]

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function hexToRgb01(hex: string): Vec3 {
  let h = hex.replace('#', '').trim()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

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
  { light: '#FFD0C1', base: '#F6571C', dark: '#7C2300' }, // Achiote
  { light: '#FFCCDF', base: '#B0006A', dark: '#7D134C' }, // Cochinilla
  { light: '#F2DB95', base: '#FFD000', dark: '#564400' }, // Gualda
  { light: '#C5EBA0', base: '#84C900', dark: '#325100' }, // Hoja
  { light: '#CFDCFF', base: '#5070F0', dark: '#293D90' }, // Cielo
  { light: '#EDD2F2', base: '#EFA6FF', dark: '#5e3168' }, // Malva
  { light: '#CFDCFC', base: '#3D5BD6', dark: '#283D8F' }, // Añil (Cielo's deep blue since Mora)
]
/** the grounds: walnut, madder and the deepest dyes */
const GROUNDS = ['#171615', '#171615', '#6E1A3E', '#561600', '#182768', '#421e49', '#203600']
const LANA = '#F5F3F2'

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
