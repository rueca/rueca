// OKLCH tonal ramps for the Rueca palette: same hue, stepped lightness, chroma eased at the ends, gamut-clipped.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
function hexToOklch(h) {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI]
}
function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}
const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)
function toHex(L, C, H) {
  let c = C
  while (c > 0 && !inGamut(oklchToRgb(L, c, H))) c -= 0.002
  return '#' + oklchToRgb(L, Math.max(c, 0), H).map((v) => Math.round(toGam(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const LT = [0.975, 0.945, 0.895, 0.825, 0.745, 0.665, 0.575, 0.485, 0.395, 0.305]
const CK = [0.16, 0.3, 0.52, 0.78, 0.94, 1, 0.94, 0.84, 0.72, 0.6]
function ramp(base, opts = {}) {
  const [bl, bc, bh] = hexToOklch(base)
  const near = LT.reduce((bi, l, i) => (Math.abs(l - bl) < Math.abs(LT[bi] - bl) ? i : bi), 0)
  const warm = opts.warmDarks ?? 0 // degrees the darks lean toward red/brown: the "dyed" end
  return STEPS.map((step, i) => {
    if (i === near) return { step, hex: base.toUpperCase(), base: true }
    const t = i > near ? (i - near) / (STEPS.length - 1 - near) : 0
    return { step, hex: toHex(LT[i], bc * CK[i] * (opts.chroma ?? 1), bh - warm * t) }
  })
}
const fam = {
  Achiote: ramp('#E8582C', { warmDarks: 6 }),
  Cochinilla: ramp('#EE7A68', { warmDarks: 4 }),
  Gualda: ramp('#F2C744', { warmDarks: 14 }),
  Hoja: ramp('#2FA57C', { warmDarks: -8 }),
  Cielo: ramp('#5DB4E8'),
  Malva: ramp('#A88BF6', { warmDarks: -6 }),
  'Añil': ramp('#3440C8'),
  Rubia: ramp('#5E2219', { chroma: 0.9 }),
  Lana: ramp('#181411', { chroma: 1.4 }),
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(fam).map(([k, r]) => [k, r.map((x) => (x.base ? x.hex + '*' : x.hex))]))))

// neutral: undyed wool down to walnut, walnut's hue, a whisper of chroma
const [ll] = hexToOklch('#F3F1EB'), [nl, nc, nh] = hexToOklch('#181411')
const neutral = STEPS.map((step, i) => {
  if (i === 0) return { step, hex: '#F3F1EB', base: true }
  if (i === 9) return { step, hex: '#181411', base: true }
  const t = i / 9, L = [0, 0.915, 0.86, 0.79, 0.71, 0.63, 0.545, 0.455, 0.365][i]
  return { step, hex: toHex(L, 0.006 + 0.008 * Math.sin(Math.PI * t), nh) }
})
const out = { Tierra: neutral, ...Object.fromEntries(Object.entries(fam).filter(([k]) => k !== 'Lana')) }
import { writeFileSync } from 'node:fs'
writeFileSync(new URL('./ramps.json', import.meta.url), JSON.stringify(out, null, 1))
