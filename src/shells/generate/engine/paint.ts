/* ---------------------------------------------------------------------------
   The mock diffusion model. No network: an image is a pure function of its
   parameters — (prompt, negative, model, size, steps, guidance, seed,
   subseed) → pixels — so history can be re-rendered on reload instead of
   stored, and "same seed, same image" holds like the real thing.

   The prompt is read for a scene (landscape, city, planet, bloom, waves,
   fluid, dunes, forest), a palette (sunset, neon, ocean…, else one derived
   from the prompt hash in OKLCH) and features (stars, fog, sun, moon, rain,
   reflections, grain). The negative prompt removes features. Guidance
   drives saturation/contrast (and burns past ~14 like real CFG). Too few
   steps leaves residual noise. Models are post styles.

   All geometry is in fractions of the canvas, so a 256px progress preview,
   the 1024px image and the 2048px upscale are the same picture.
--------------------------------------------------------------------------- */
import { clampChroma, formatHex } from 'culori'
import { modelOf, type GenParams } from './models'

type C = CanvasRenderingContext2D

/* --- randomness --- */
export const fnv = (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) } return h >>> 0 }
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** Variation seeds: every draw blends the main stream toward a second stream by `strength`. */
function rngFor(p: GenParams) {
  const base = (fnv(p.prompt.trim().toLowerCase()) ^ Math.imul(p.seed, 2654435761)) >>> 0
  const a = mulberry32(base)
  if (p.subseed === undefined || !p.subStrength) return a
  const b = mulberry32((fnv(p.prompt.trim().toLowerCase()) ^ Math.imul(p.subseed, 2246822519)) >>> 0)
  const k = p.subStrength
  return () => { const x = a(), y = b(); return x + (y - x) * k }
}

/* --- colour helpers --- */
const hex = (h: string): [number, number, number] => { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)] }
const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` }
const mixHex = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}` }
const rgba = (h: string, a: number) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})` }
const oklch = (l: number, c: number, h: number) => formatHex(clampChroma({ mode: 'oklch', l, c, h: ((h % 360) + 360) % 360 }, 'oklch')) ?? '#888888'

/* --- reading the prompt --- */
export type Scene = 'landscape' | 'city' | 'orb' | 'bloom' | 'waves' | 'fluid' | 'dunes' | 'forest'
const SCENES: [Scene, string[]][] = [
  ['city', ['city', 'skyline', 'street', 'tower', 'building', 'metropolis', 'downtown', 'rooftop', 'tokyo', 'urban']],
  ['orb', ['planet', 'orb', 'sphere', 'globe', 'galaxy', 'nebula', 'cosmic', 'space', 'saturn']],
  ['bloom', ['flower', 'bloom', 'botanical', 'petal', 'garden', 'lotus', 'orchid', 'floral', 'blossom', 'dahlia']],
  ['waves', ['ocean', 'sea', 'wave', 'surf', 'tide', 'coast', 'beach']],
  ['fluid', ['abstract', 'fluid', 'marble', 'silk', 'liquid', 'ink', 'smoke', 'swirl', 'texture', 'pattern']],
  ['dunes', ['desert', 'dune', 'sand', 'sahara']],
  ['forest', ['forest', 'trees', 'woods', 'pine', 'jungle', 'grove', 'woodland']],
  ['landscape', ['mountain', 'alpine', 'alps', 'peak', 'valley', 'landscape', 'hills', 'canyon', 'lake', 'fjord', 'ridge']],
]
const PALETTES: [string[], string[]][] = [
  [['neon', 'cyberpunk', 'synthwave', 'vaporwave'], ['#120428', '#ff2e88', '#3ef0ff', '#7a1fff', '#07020f']],
  [['aurora', 'northern lights'], ['#03141a', '#0c3b3f', '#6dffc0', '#7b5cff', '#020509']],
  [['lava', 'volcano', 'fire', 'ember', 'inferno'], ['#1a0505', '#ff6a1a', '#ffd27a', '#a3160d', '#0a0202']],
  [['iridescent', 'holographic', 'chrome', 'pearl'], ['#b8e3ff', '#ffd1f3', '#ffffff', '#9b8cff', '#2b2450']],
  [['emerald', 'jade'], ['#0c2b24', '#3f8f6b', '#e9d7a1', '#16634b', '#04120e']],
  [['gold', 'luxury', 'brass'], ['#2a1f0e', '#c9a24a', '#ffe9a8', '#7a5a1f', '#120d05']],
  [['coral', 'peach'], ['#ffb4a2', '#ffe5d9', '#fff8f0', '#e5707e', '#5a2a35']],
  [['pastel', 'candy', 'soft'], ['#f7c6d9', '#fde7c9', '#ffffff', '#b9c8f2', '#7a7fb8']],
  [['noir', 'monochrome', 'black and white', 'b&w', 'grayscale'], ['#d9d9d9', '#f2f2f2', '#ffffff', '#6b6b6b', '#111111']],
  [['night', 'midnight', 'starry', 'stars', 'nocturne'], ['#05070f', '#1b2550', '#e8ecff', '#2c3a6e', '#03040a']],
  [['sunset', 'golden hour', 'dusk', 'twilight'], ['#2b1d4f', '#f2a65a', '#ffd59e', '#b4566f', '#2a1630']],
  [['dawn', 'sunrise', 'morning'], ['#9bb7d8', '#f7c8a8', '#fff1d6', '#7d8fb3', '#2e3a59']],
  [['snow', 'ice', 'winter', 'arctic', 'glacier', 'frost'], ['#cfe3f2', '#f3f8fc', '#ffffff', '#8fb3cf', '#2d4a63']],
  [['autumn', 'fall', 'amber', 'harvest'], ['#e8a35c', '#f6d6a2', '#fff0d0', '#b14d26', '#3b1a0e']],
  [['ocean', 'sea', 'coast', 'tropical', 'lagoon'], ['#7fc4e8', '#d7f0f5', '#ffffff', '#1f7fa6', '#06314a']],
  [['forest', 'jungle', 'moss', 'fern'], ['#a8c8a0', '#e6eedb', '#fff8e0', '#3d6b3a', '#0f2614']],
  [['desert', 'dune', 'sand'], ['#e9b384', '#f8dcb4', '#fff3dc', '#c7763f', '#5a2a17']],
  [['rose', 'blush', 'pink'], ['#f4b6c2', '#fde2e4', '#fff5f5', '#d16b86', '#4a1d2c']],
]
const FEATURES: Record<string, string[]> = {
  stars: ['night', 'stars', 'starry', 'galaxy', 'space', 'midnight', 'cosmic', 'nebula'],
  fog: ['mist', 'misty', 'fog', 'foggy', 'haze', 'hazy', 'atmospheric', 'fading'],
  sun: ['sunset', 'sunrise', 'sun', 'golden hour', 'dawn', 'dusk', 'sunlit'],
  moon: ['moon', 'crescent', 'lunar'],
  clouds: ['cloud', 'clouds', 'overcast', 'cumulus'],
  grain: ['film', 'grain', 'analog', '35mm', 'kodak', 'portra', 'vintage', 'print'],
  reflection: ['lake', 'reflection', 'reflections', 'water', 'wet', 'mirror', 'puddle'],
  rain: ['rain', 'rainy', 'storm', 'drizzle'],
  birds: ['birds', 'flock', 'gulls'],
  minimal: ['minimal', 'minimalist', 'simple', 'clean', 'flat'],
  glow: ['glow', 'neon', 'bioluminescent', 'luminous', 'light'],
  ring: ['ring', 'rings', 'saturn'],
}
export type Feature = keyof typeof FEATURES

const has = (text: string, words: string[]) => words.some((w) => new RegExp(`\\b${w.replace(/[&]/g, '\\$&')}\\b`).test(text))

export interface Plan { scene: Scene; pal: string[]; f: Record<Feature, boolean>; sat: number; con: number; bri: number; burn: number; residual: number; grain: number }

export function interpret(p: GenParams): Plan {
  const text = p.prompt.toLowerCase()
  const neg = p.negative.toLowerCase()
  const h = fnv(text)
  // earliest scene keyword wins
  let scene: Scene | null = null, at = Infinity
  for (const [s, words] of SCENES) for (const w of words) { const i = text.search(new RegExp(`\\b${w}`)); if (i >= 0 && i < at) { at = i; scene = s } }
  scene ??= (['landscape', 'fluid', 'orb', 'bloom', 'dunes', 'forest', 'waves', 'city'] as Scene[])[h % 8]

  // Light and mood words (sunset, neon, night…) beat subject words (ocean, forest…) wherever they appear.
  let pal: string[] | null = null; at = Infinity
  const SUBJECT = new Set(['snow', 'ocean', 'forest', 'desert'])
  for (const [words, colours] of PALETTES) {
    for (const w of words) {
      const i = text.indexOf(w)
      const rank = i < 0 ? Infinity : i + (SUBJECT.has(words[0]) ? 10_000 : 0)
      if (rank < at) { at = rank; pal = colours }
    }
  }
  if (!pal) {
    const hue = h % 360
    pal = [oklch(0.42, 0.09, hue + 20), oklch(0.86, 0.07, hue - 25), oklch(0.97, 0.04, hue + 60), oklch(0.62, 0.13, hue + 160), oklch(0.2, 0.05, hue + 10)]
  }

  const f = {} as Record<Feature, boolean>
  for (const [k, words] of Object.entries(FEATURES)) f[k as Feature] = has(text, words) && !has(neg, [k, ...words.slice(0, 2)])
  if (scene === 'landscape' && !f.moon && !f.stars && !has(neg, ['sun'])) f.sun ||= h % 3 !== 0
  if (has(text, ['night', 'midnight']) && scene !== 'city') { f.moon ||= !has(neg, ['moon']); f.sun = false }
  if (p.model === 'photon') f.grain = !has(neg, ['grain', 'noise'])

  const m = modelOf(p.model)
  const g = p.guidance - m.guidance // relative to the model's own sweet spot
  const sat = Math.min(1.9, Math.max(0.35, 1.05 + g * 0.065)) * (has(text, ['vibrant', 'saturated', 'vivid']) ? 1.15 : 1) * (has(text, ['muted', 'desaturated', 'faded']) ? 0.75 : 1)
  const con = Math.max(0.7, 1.02 + g * 0.018)
  const burn = Math.max(0, (p.guidance - 13) / 7)
  const residual = Math.max(0, Math.min(0.9, 1 - p.steps / m.steps)) * (p.model === 'lumen-turbo' ? 1.6 : 1)
  const grain = (f.grain ? 0.06 : 0.018) + (p.detail ?? 0) * 0.03
  return { scene, pal, f, sat, con, bri: has(text, ['dark', 'moody', 'low key']) ? 0.86 : has(text, ['bright', 'airy', 'high key']) ? 1.1 : 1, burn, residual, grain }
}

/* --- 1D / 2D value noise --- */
function noise1(r: () => number) {
  const n = 256, v = Array.from({ length: n }, r)
  return (x: number) => { const i = Math.floor(x), t = x - i, a = v[((i % n) + n) % n], b = v[(((i + 1) % n) + n) % n]; const s = t * t * (3 - 2 * t); return a + (b - a) * s }
}
function noise2(seed: number) {
  const r = mulberry32(seed), n = 256
  const v = new Float32Array(n * n).map(() => r())
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), tx = x - xi, ty = y - yi
    const X = xi & 255, Y = yi & 255, X1 = (X + 1) & 255, Y1 = (Y + 1) & 255
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const a = v[Y * n + X], b = v[Y * n + X1], c = v[Y1 * n + X], d = v[Y1 * n + X1]
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

/* --- shared painters --- */
function sky(c: C, w: number, h: number, top: string, horizon: string, hz: number) {
  const g = c.createLinearGradient(0, 0, 0, hz)
  g.addColorStop(0, top); g.addColorStop(1, horizon)
  c.fillStyle = g; c.fillRect(0, 0, w, h)
}
function stars(c: C, w: number, maxY: number, r: () => number, density: number, colour = '#ffffff') {
  const count = Math.round(density * (w * maxY) / 4000)
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * r() * maxY, s = Math.max(0.5, r() * r() * w * 0.0022)
    c.fillStyle = rgba(colour, 0.25 + r() * 0.75)
    c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill()
  }
}
function glow(c: C, x: number, y: number, rad: number, core: string, halo: string, haloScale = 6) {
  const g = c.createRadialGradient(x, y, 0, x, y, rad * haloScale)
  g.addColorStop(0, rgba(halo, 0.55)); g.addColorStop(0.25, rgba(halo, 0.18)); g.addColorStop(1, rgba(halo, 0))
  c.fillStyle = g; c.beginPath(); c.arc(x, y, rad * haloScale, 0, Math.PI * 2); c.fill()
  c.fillStyle = core; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill()
}
function crescent(c: C, x: number, y: number, rad: number, colour: string, _bg: string) {
  // halo, then a true crescent (disc minus an offset disc) so the sky shows through the dark side
  const g = c.createRadialGradient(x, y, rad * 0.8, x, y, rad * 5)
  g.addColorStop(0, rgba(colour, 0.22)); g.addColorStop(1, rgba(colour, 0))
  c.fillStyle = g; c.beginPath(); c.arc(x, y, rad * 5, 0, Math.PI * 2); c.fill()
  const t = document.createElement('canvas'); const S = Math.ceil(rad * 2 + 4); t.width = S; t.height = S
  const k = t.getContext('2d')!
  k.fillStyle = colour; k.beginPath(); k.arc(S / 2, S / 2, rad, 0, Math.PI * 2); k.fill()
  k.globalCompositeOperation = 'destination-out'
  k.beginPath(); k.arc(S / 2 + rad * 0.45, S / 2 - rad * 0.2, rad * 0.9, 0, Math.PI * 2); k.fill()
  c.drawImage(t, x - S / 2, y - S / 2)
}
function clouds(c: C, w: number, h: number, r: () => number, colour: string, yMax: number, s: number) {
  c.save()
  c.filter = `blur(${Math.round(s * 0.018)}px)`
  for (let i = 0; i < 9; i++) {
    const cx = r() * w, cy = (0.08 + r() * 0.75) * yMax, rx = s * (0.12 + r() * 0.22), ry = rx * (0.18 + r() * 0.12)
    c.fillStyle = rgba(colour, 0.12 + r() * 0.22)
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill()
  }
  c.restore()
  void h
}
function fogBand(c: C, w: number, y: number, height: number, colour: string, a = 0.55) {
  const g = c.createLinearGradient(0, y - height, 0, y + height * 0.3)
  g.addColorStop(0, rgba(colour, 0)); g.addColorStop(0.75, rgba(colour, a)); g.addColorStop(1, rgba(colour, a * 0.6))
  c.fillStyle = g; c.fillRect(0, y - height, w, height * 1.3)
}
function birds(c: C, x: number, y: number, s: number, r: () => number, colour: string) {
  c.strokeStyle = rgba(colour, 0.75); c.lineWidth = Math.max(1, s * 0.0016); c.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    const bx = x + (r() - 0.5) * s * 0.25, by = y + (r() - 0.5) * s * 0.1, k = s * (0.006 + r() * 0.008)
    c.beginPath(); c.moveTo(bx - k, by - k * 0.4); c.quadraticCurveTo(bx - k * 0.4, by - k * 0.6, bx, by); c.quadraticCurveTo(bx + k * 0.4, by - k * 0.6, bx + k, by - k * 0.4); c.stroke()
  }
}
function reflect(c: C, w: number, h: number, waterY: number, tint: string, s: number) {
  const src = c.canvas
  const span = Math.min(waterY, h - waterY)
  c.save()
  c.globalAlpha = 0.55
  c.filter = `blur(${Math.max(1, Math.round(s * 0.003))}px)`
  c.translate(0, waterY * 2); c.scale(1, -1)
  c.drawImage(src, 0, waterY - span, w, span, 0, waterY - span, w, span)
  c.restore()
  const g = c.createLinearGradient(0, waterY, 0, h)
  g.addColorStop(0, rgba(tint, 0.25)); g.addColorStop(1, rgba(tint, 0.7))
  c.fillStyle = g; c.fillRect(0, waterY, w, h - waterY)
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = Math.max(1, s * 0.0012)
  for (let y = waterY + s * 0.01; y < h; y += s * (0.008 + (y - waterY) / h * 0.03)) {
    const x0 = (Math.sin(y * 12.9) * 0.5 + 0.5) * w * 0.7
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + w * (0.05 + ((y * 7.3) % 1) * 0.25), y); c.stroke()
  }
}

/* --- scenes --- */
type Paint = (c: C, w: number, h: number, P: Plan, r: () => number) => void

const landscape: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const hz = h * (0.52 + r() * 0.14)
  sky(c, w, h, pal[0], pal[1], hz)
  if (P.f.stars) stars(c, w, hz, r, 1.2)
  const sx = w * (0.22 + r() * 0.56), sy = hz - h * (0.1 + r() * 0.2), sr = s * (0.04 + r() * 0.04)
  if (P.f.moon) crescent(c, sx, sy, sr, '#f6f1e3', pal[0])
  else if (P.f.sun) glow(c, sx, sy, sr, mixHex(pal[2], '#ffffff', 0.4), pal[2], 7)
  if (P.f.clouds || (!P.f.stars && r() > 0.5)) clouds(c, w, h, r, mixHex(pal[2], '#ffffff', 0.5), hz, s)
  if (P.f.birds) birds(c, sx - s * 0.1, sy + s * 0.08, s, r, pal[4])
  const layers = P.f.minimal ? 3 : 5
  const lake = P.f.reflection
  const n = noise1(r)
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1)
    if (lake && i === layers - 1) { reflect(c, w, h, hz + h * 0.07, pal[3], s); break }
    const base = hz + h * (lake ? 0.07 * t : 0.05 + 0.34 * Math.pow(t, 1.4))
    const amp = h * (0.26 - 0.17 * t) * (0.7 + r() * 0.5)
    const freq = 2.2 + t * 2.5 + r() * 1.5, off = r() * 100
    const colour = mix(mixHex(pal[1], pal[3], 0.35 + 0.15 * t), pal[4], Math.pow(t, 0.8) * 0.92)
    c.fillStyle = colour
    c.beginPath(); c.moveTo(0, h)
    for (let x = 0; x <= w; x += Math.max(2, w / 300)) {
      const u = x / w * freq + off
      const ridge = 1 - Math.abs(n(u) * 2 - 1)
      const y = base - amp * (0.55 * ridge * ridge + 0.3 * n(u * 2.7 + 9) + 0.15 * n(u * 7.1 + 3))
      c.lineTo(x, y)
    }
    c.lineTo(w, h); c.closePath(); c.fill()
    if (P.f.fog && i < layers - 1) fogBand(c, w, base + h * 0.02, h * 0.12, pal[1], 0.5)
  }
  if (lake) {
    // a dark near shore
    c.fillStyle = pal[4]
    c.beginPath(); c.moveTo(0, h)
    for (let x = 0; x <= w; x += w / 120) c.lineTo(x, h - h * (0.04 + 0.05 * n(x / w * 6 + 40) + 0.08 * Math.pow(Math.abs(x / w - 0.5) * 2, 3)))
    c.lineTo(w, h); c.closePath(); c.fill()
  }
}

const city: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const hz = h * (0.62 + r() * 0.1)
  sky(c, w, h, pal[0], pal[1], hz)
  if (P.f.stars) stars(c, w, hz * 0.7, r, 0.8)
  const sx = w * (0.2 + r() * 0.6), sy = hz - h * (0.18 + r() * 0.2)
  if (P.f.moon) crescent(c, sx, sy, s * 0.035, '#f6f1e3', pal[0])
  else if (P.f.sun) glow(c, sx, sy, s * 0.07, mixHex(pal[2], '#ffffff', 0.3), pal[2], 5)
  if (P.f.fog || P.f.rain) fogBand(c, w, hz, h * 0.2, pal[1], 0.5)
  const layer = (depth: number) => {
    const colour = mix(mixHex(pal[1], pal[3], 0.5), pal[4], depth)
    let x = -r() * s * 0.05
    while (x < w) {
      const bw = s * (0.035 + r() * 0.07) * (1 + depth * 0.4)
      const bh = h * (0.12 + r() * (0.3 + depth * 0.15)) * (r() > 0.88 ? 1.5 : 1)
      const top = hz - bh * (1.1 - depth * 0.3)
      c.fillStyle = colour
      c.fillRect(x, top, bw, h - top)
      if (r() > 0.7) c.fillRect(x + bw * 0.45, top - bh * 0.15, bw * 0.08, bh * 0.15) // antenna
      if (depth > 0.5) {
        const cell = s * 0.011
        c.save()
        if (P.f.glow) { c.shadowColor = pal[2]; c.shadowBlur = s * 0.01 }
        for (let wy = top + cell; wy < hz - cell; wy += cell * 1.7)
          for (let wx = x + cell * 0.6; wx < x + bw - cell; wx += cell * 1.4)
            if (r() > 0.62) { c.fillStyle = rgba(r() > 0.85 ? pal[1] : pal[2], 0.55 + r() * 0.4); c.fillRect(wx, wy, cell * 0.6, cell * 0.8) }
        c.restore()
      }
      x += bw + s * r() * 0.006
    }
  }
  layer(0.25); layer(0.6); layer(0.95)
  c.fillStyle = pal[4]; c.fillRect(0, hz, w, h - hz)
  if (P.f.reflection || P.f.rain) {
    reflect(c, w, h, hz, pal[4], s)
    c.save(); c.globalCompositeOperation = 'screen'
    for (let i = 0; i < 40; i++) { const x = r() * w; const g = c.createLinearGradient(0, hz, 0, h); g.addColorStop(0, rgba(r() > 0.5 ? pal[2] : pal[1], 0.35)); g.addColorStop(1, rgba(pal[2], 0)); c.fillStyle = g; c.fillRect(x, hz, s * 0.004, (h - hz) * (0.4 + r() * 0.6)) }
    c.restore()
  }
  if (P.f.rain) {
    c.strokeStyle = rgba(mixHex(pal[1], '#ffffff', 0.5), 0.18); c.lineWidth = Math.max(1, s * 0.0012)
    for (let i = 0; i < 500; i++) { const x = r() * w * 1.2, y = r() * h, l = s * (0.02 + r() * 0.03); c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * 0.25, y + l); c.stroke() }
  }
}

const orb: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, mixHex(pal[4], pal[0], 0.3)); bg.addColorStop(1, pal[4])
  c.fillStyle = bg; c.fillRect(0, 0, w, h)
  c.save(); c.filter = `blur(${Math.round(s * 0.06)}px)`; c.globalCompositeOperation = 'screen'
  for (let i = 0; i < 6; i++) { c.fillStyle = rgba(r() > 0.5 ? pal[3] : pal[1], 0.12 + r() * 0.14); c.beginPath(); c.ellipse(r() * w, r() * h, s * (0.15 + r() * 0.3), s * (0.08 + r() * 0.2), r() * 3, 0, Math.PI * 2); c.fill() }
  c.restore()
  stars(c, w, h, r, 1.4)
  const cx = w * (0.38 + r() * 0.24), cy = h * (0.4 + r() * 0.2), R = s * (0.22 + r() * 0.1)
  const tilt = (r() - 0.5) * 0.8
  const lx = -0.55 + r() * 0.3, ly = -0.6 + r() * 0.3
  const ring = P.f.ring || r() > 0.55
  const ringPath = (front: boolean) => {
    c.save(); c.translate(cx, cy); c.rotate(tilt)
    c.lineWidth = R * 0.08
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = rgba(k === 1 ? pal[2] : pal[1], 0.55 - k * 0.12)
      c.beginPath(); c.ellipse(0, 0, R * (1.55 + k * 0.14), R * (0.32 + k * 0.03), 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke()
    }
    c.restore()
  }
  if (ring) ringPath(false)
  // body
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip()
  const body = c.createRadialGradient(cx + lx * R, cy + ly * R, R * 0.05, cx, cy, R * 1.2)
  body.addColorStop(0, mixHex(pal[2], '#ffffff', 0.2)); body.addColorStop(0.45, pal[3]); body.addColorStop(1, pal[4])
  c.fillStyle = body; c.fillRect(cx - R, cy - R, R * 2, R * 2)
  c.translate(cx, cy); c.rotate(tilt)
  const n = noise1(r)
  for (let i = 0; i < 26; i++) {
    const y = -R + (i / 26) * R * 2, th = R * (0.02 + r() * 0.07)
    c.fillStyle = rgba(r() > 0.5 ? pal[1] : pal[4], 0.08 + r() * 0.16)
    c.beginPath(); c.moveTo(-R, y)
    for (let x = -R; x <= R; x += R / 30) c.lineTo(x, y + Math.sin(x / R * 4 + i) * th * 0.6 + (n(x / R * 3 + i * 7) - 0.5) * th)
    c.lineTo(R, y + th); c.lineTo(-R, y + th); c.closePath(); c.fill()
  }
  c.setTransform(1, 0, 0, 1, 0, 0)
  const shade = c.createRadialGradient(cx + lx * R * 0.8, cy + ly * R * 0.8, R * 0.3, cx + lx * R * 0.4, cy + ly * R * 0.4, R * 1.9)
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(0.55, 'rgba(0,0,0,0.25)'); shade.addColorStop(1, 'rgba(0,0,0,0.92)')
  c.fillStyle = shade; c.fillRect(cx - R, cy - R, R * 2, R * 2)
  c.restore()
  // rim light
  c.save(); c.globalCompositeOperation = 'screen'
  const rim = c.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.12)
  rim.addColorStop(0, rgba(pal[2], 0)); rim.addColorStop(0.45, rgba(pal[2], 0.35)); rim.addColorStop(1, rgba(pal[2], 0))
  c.fillStyle = rim; c.beginPath(); c.arc(cx, cy, R * 1.12, 0, Math.PI * 2); c.fill(); c.restore()
  if (ring) ringPath(true)
  if (r() > 0.4) { const mr = R * (0.08 + r() * 0.08), a = r() * Math.PI * 2; const mx = cx + Math.cos(a) * R * 2.1, my = cy + Math.sin(a) * R * 1.3; const g = c.createRadialGradient(mx - mr * 0.4, my - mr * 0.4, 0, mx, my, mr); g.addColorStop(0, pal[1]); g.addColorStop(1, pal[4]); c.fillStyle = g; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill() }
}

const bloom: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const bg = c.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
  bg.addColorStop(0, mixHex(pal[1], '#ffffff', 0.2)); bg.addColorStop(1, mixHex(pal[0], pal[4], 0.25))
  c.fillStyle = bg; c.fillRect(0, 0, w, h)
  c.save(); c.filter = `blur(${Math.round(s * 0.012)}px)`
  for (let i = 0; i < 18; i++) { c.fillStyle = rgba(r() > 0.5 ? pal[2] : pal[3], 0.08 + r() * 0.18); c.beginPath(); c.arc(r() * w, r() * h, s * (0.02 + r() * 0.06), 0, Math.PI * 2); c.fill() }
  c.restore()
  const flower = (cx: number, cy: number, R: number, depth: number) => {
    const count = 5 + Math.floor(r() * 8)
    const rings = 4
    for (let k = 0; k < rings; k++) {
      const rr = R * (1 - k * 0.2), rot = r() * Math.PI + k * 0.4
      for (let i = 0; i < count + k; i++) {
        const a = rot + (i / (count + k)) * Math.PI * 2
        c.save(); c.translate(cx, cy); c.rotate(a)
        const g = c.createLinearGradient(0, 0, 0, -rr)
        g.addColorStop(0, mixHex(pal[3], pal[4], 0.25 + depth * 0.3)); g.addColorStop(0.7, mixHex(pal[3], pal[2], 0.25 + k * 0.12)); g.addColorStop(1, mixHex(pal[2], '#ffffff', 0.3))
        c.fillStyle = g
        c.beginPath(); c.moveTo(0, 0)
        const wd = rr * (0.32 + r() * 0.12)
        c.bezierCurveTo(-wd, -rr * 0.35, -wd * 0.7, -rr * 0.95, 0, -rr)
        c.bezierCurveTo(wd * 0.7, -rr * 0.95, wd, -rr * 0.35, 0, 0)
        c.fill()
        c.strokeStyle = rgba(pal[4], 0.12); c.lineWidth = Math.max(1, s * 0.0012); c.stroke()
        c.strokeStyle = rgba('#ffffff', 0.18); c.beginPath(); c.moveTo(0, -rr * 0.15); c.lineTo(0, -rr * 0.8); c.stroke()
        c.restore()
      }
    }
    const core = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22)
    core.addColorStop(0, '#fff3c4'); core.addColorStop(0.6, mixHex(pal[2], '#d9a441', 0.6)); core.addColorStop(1, mixHex(pal[4], '#8a5a1a', 0.5))
    c.fillStyle = core; c.beginPath(); c.arc(cx, cy, R * 0.22, 0, Math.PI * 2); c.fill()
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = R * 0.2 * Math.sqrt(r()); c.fillStyle = rgba('#fff8d8', 0.6); c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * 0.003, 0, Math.PI * 2); c.fill() }
  }
  if (!P.f.minimal && r() > 0.3) { c.save(); c.filter = `blur(${Math.round(s * 0.008)}px)`; flower(w * (r() > 0.5 ? 0.85 : 0.15), h * (0.15 + r() * 0.7), s * 0.22, 0.8); c.restore() }
  flower(w * (0.42 + r() * 0.16), h * (0.42 + r() * 0.16), s * (0.3 + r() * 0.08), 0)
}

const waves: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const hz = h * (0.38 + r() * 0.12)
  sky(c, w, h, pal[0], pal[1], hz)
  if (P.f.stars) stars(c, w, hz, r, 1)
  const sx = w * (0.25 + r() * 0.5)
  if (P.f.moon) crescent(c, sx, hz - h * 0.15, s * 0.04, '#f6f1e3', pal[0])
  else glow(c, sx, hz - h * (0.04 + r() * 0.12), s * 0.06, mixHex(pal[2], '#ffffff', 0.4), pal[2], 6)
  if (P.f.clouds) clouds(c, w, h, r, '#ffffff', hz, s)
  const bands = P.f.minimal ? 5 : 9
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const y0 = hz + (h - hz) * Math.pow(t, 1.6) * 0.95
    const amp = s * (0.004 + 0.05 * t * t), freq = (16 - t * 12) * (0.8 + r() * 0.4), ph = r() * 10
    const g = c.createLinearGradient(0, y0 - amp, 0, y0 + (h - hz) * 0.3)
    g.addColorStop(0, mix(pal[3], pal[1], 0.4 * (1 - t))); g.addColorStop(1, mix(pal[3], pal[4], 0.3 + t * 0.6))
    c.fillStyle = g
    c.beginPath(); c.moveTo(0, h)
    const pts: [number, number][] = []
    for (let x = 0; x <= w; x += w / 160) { const u = x / w; const y = y0 - amp * (Math.pow(Math.sin(u * freq + ph) * 0.5 + 0.5, 3) + 0.3 * Math.sin(u * freq * 2.3 + ph * 2)); pts.push([x, y]); c.lineTo(x, y) }
    c.lineTo(w, h); c.closePath(); c.fill()
    c.strokeStyle = rgba('#ffffff', 0.25 + t * 0.4); c.lineWidth = Math.max(1, s * 0.002 * (0.5 + t * 2))
    c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke()
  }
  // sun glitter
  c.save(); c.globalCompositeOperation = 'screen'
  for (let i = 0; i < 160; i++) { const y = hz + (h - hz) * Math.pow(r(), 1.5) * 0.8, x = sx + (r() - 0.5) * s * (0.05 + (y - hz) / h * 0.6); c.fillStyle = rgba(pal[2], 0.3 + r() * 0.5); c.fillRect(x, y, s * (0.004 + r() * 0.012), Math.max(1, s * 0.0016)) }
  c.restore()
}

const fluid: Paint = (c, w, h, P, r) => {
  const scale = 4
  const W = Math.ceil(w / scale), H = Math.ceil(h / scale)
  const n = noise2(Math.floor(r() * 1e9))
  const s = Math.min(W, H)
  const freq = 2.2 + r() * 2.5
  const warp = 3 + r() * 3
  const fbm = (x: number, y: number) => { let a = 0.5, f = 1, v = 0; for (let o = 0; o < 4; o++) { v += a * n(x * f, y * f); a *= 0.5; f *= 2.03 } return v }
  const pal = P.pal.map(hex)
  const order = [4, 3, 0, 1, 2]
  const img = new ImageData(W, H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = (x / s) * freq, py = (y / s) * freq
      const qx = fbm(px, py), qy = fbm(px + 5.2, py + 1.3)
      const rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2), ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8)
      let v = fbm(px + warp * rx, py + warp * ry)
      v = Math.min(1, Math.max(0, (v - 0.25) * 1.9))
      const f = v * (order.length - 1), i = Math.min(order.length - 2, Math.floor(f)), k = f - i
      const A = pal[order[i]], B = pal[order[i + 1]]
      const sheen = Math.max(0, 1 - Math.abs(rx - 0.55) * 18) * 0.5
      const j = (y * W + x) * 4
      for (let ch = 0; ch < 3; ch++) img.data[j + ch] = Math.min(255, A[ch] + (B[ch] - A[ch]) * k + sheen * 255)
      img.data[j + 3] = 255
    }
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H
  tmp.getContext('2d')!.putImageData(img, 0, 0)
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  c.drawImage(tmp, 0, 0, w, h)
}

const dunes: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const hz = h * (0.45 + r() * 0.12)
  sky(c, w, h, mixHex(pal[0], '#ffffff', 0.1), pal[1], hz)
  const sx = w * (r() > 0.5 ? 0.2 + r() * 0.15 : 0.65 + r() * 0.15)
  if (P.f.moon || P.f.stars) { stars(c, w, hz, r, 1); crescent(c, sx, hz - h * 0.2, s * 0.035, '#f6f1e3', pal[0]) }
  else glow(c, sx, hz - h * (0.03 + r() * 0.1), s * 0.07, mixHex(pal[2], '#ffffff', 0.5), pal[2], 6)
  const layers = P.f.minimal ? 3 : 5
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1)
    const base = hz + (h - hz) * (0.05 + 0.75 * Math.pow(t, 1.2))
    const amp = h * (0.05 + 0.1 * r()), f1 = 1 + r() * 2, f2 = 2.5 + r() * 3, ph = r() * 10
    const crest = (x: number) => base - amp * (0.6 * Math.sin(x / w * f1 * Math.PI + ph) + 0.4 * Math.sin(x / w * f2 * Math.PI + ph * 2))
    const lit = mix(mixHex(pal[2], pal[3], 0.3), pal[4], t * 0.55), shadow = mix(pal[3], pal[4], 0.35 + t * 0.6)
    const g = c.createLinearGradient(sx > w / 2 ? w : 0, 0, sx > w / 2 ? 0 : w, 0)
    g.addColorStop(0, lit); g.addColorStop(1, shadow)
    c.fillStyle = g
    c.beginPath(); c.moveTo(0, h)
    for (let x = 0; x <= w; x += w / 200) c.lineTo(x, crest(x))
    c.lineTo(w, h); c.closePath(); c.fill()
    c.strokeStyle = rgba(pal[2], 0.35 - t * 0.2); c.lineWidth = Math.max(1, s * 0.0015)
    c.beginPath(); for (let x = 0; x <= w; x += w / 200) (x ? c.lineTo(x, crest(x)) : c.moveTo(x, crest(x))); c.stroke()
    if (P.f.fog) fogBand(c, w, base, h * 0.06, pal[1], 0.35)
  }
}

const forest: Paint = (c, w, h, P, r) => {
  const s = Math.min(w, h), pal = P.pal
  const hz = h * (0.55 + r() * 0.1)
  sky(c, w, h, pal[0], pal[1], hz)
  if (P.f.stars) stars(c, w, hz, r, 1)
  const sx = w * (0.3 + r() * 0.4), sy = hz - h * 0.2
  if (P.f.moon) crescent(c, sx, sy, s * 0.04, '#f6f1e3', pal[0])
  else if (P.f.sun || !P.f.stars) glow(c, sx, sy, s * 0.05, mixHex(pal[2], '#ffffff', 0.4), pal[2], 7)
  const layers = P.f.minimal ? 3 : 6
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1)
    const base = hz + (h - hz) * (0.05 + 0.95 * Math.pow(t, 1.3))
    const colour = mix(mixHex(pal[1], pal[3], 0.4), pal[4], 0.25 + t * 0.75)
    c.fillStyle = colour
    c.fillRect(0, base, w, h - base)
    let x = -r() * s * 0.05
    while (x < w + s * 0.05) {
      const th = s * (0.08 + r() * 0.12) * (0.6 + t * 1.6), tw = th * (0.28 + r() * 0.1)
      c.beginPath(); c.moveTo(x, base - th)
      for (let k = 1; k <= 4; k++) { const yy = base - th + (th * k) / 4; c.lineTo(x + (tw / 2) * (k / 4) * 1.3, yy); c.lineTo(x + (tw / 2) * (k / 4) * 0.7, yy) }
      c.lineTo(x + tw * 0.08, base); c.lineTo(x - tw * 0.08, base)
      for (let k = 4; k >= 1; k--) { const yy = base - th + (th * k) / 4; c.lineTo(x - (tw / 2) * (k / 4) * 0.7, yy); c.lineTo(x - (tw / 2) * (k / 4) * 1.3, yy) }
      c.closePath(); c.fill()
      x += tw * (0.45 + r() * 0.5)
    }
    if (P.f.fog || i < layers - 2) fogBand(c, w, base, h * 0.07, pal[1], P.f.fog ? 0.5 : 0.25)
  }
  if (!P.f.stars) {
    c.save(); c.globalCompositeOperation = 'screen'
    for (let i = 0; i < 5; i++) { const a = -0.3 + r() * 0.6; c.fillStyle = rgba(pal[2], 0.05 + r() * 0.06); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.sin(a - 0.05) * h * 2, sy + h * 2); c.lineTo(sx + Math.sin(a + 0.05) * h * 2, sy + h * 2); c.closePath(); c.fill() }
    c.restore()
  }
}

const PAINTERS: Record<Scene, Paint> = { landscape, city, orb, bloom, waves, fluid, dunes, forest }

/* --- post: tone, bloom, vignette, grain, residual noise, riso --- */
function post(out: C, src: HTMLCanvasElement, w: number, h: number, P: Plan, p: GenParams, r: () => number) {
  const s = Math.min(w, h)
  const sat = P.sat * (1 + P.burn * 0.6), con = P.con * (1 + P.burn * 0.35)
  out.filter = `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) brightness(${P.bri.toFixed(3)})`
  out.drawImage(src, 0, 0)
  out.filter = 'none'
  if (p.model === 'photon' || P.f.glow) {
    out.save(); out.globalCompositeOperation = 'screen'; out.globalAlpha = p.model === 'photon' ? 0.28 : 0.22
    out.filter = `blur(${Math.round(s * 0.02)}px) brightness(1.15)`
    out.drawImage(out.canvas, 0, 0); out.restore()
  }
  const vig = p.model === 'photon' ? 0.55 : p.model === 'riso' ? 0 : 0.28
  if (vig) {
    const g = out.createRadialGradient(w / 2, h / 2, s * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vig})`)
    out.fillStyle = g; out.fillRect(0, 0, w, h)
  }
  const img = out.getImageData(0, 0, w, h)
  const d = img.data
  const grain = P.grain * 255, res = P.residual
  const rr = mulberry32(Math.floor(r() * 1e9))
  if (p.model === 'riso') { riso(d, w, h, P, s, rr); out.putImageData(img, 0, 0); return }
  // residual noise is blotchy (low-frequency) like an under-cooked latent
  const block = Math.max(2, Math.round(s / 96))
  const bw = Math.ceil(w / block)
  const blotch = res > 0 ? new Float32Array(bw * Math.ceil(h / block) * 3).map(() => (rr() - 0.5) * 2) : null
  const posterize = P.burn > 0.3 ? Math.max(6, 32 - P.burn * 26) : 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const g = (rr() + rr() - 1) * grain
      for (let ch = 0; ch < 3; ch++) {
        let v = d[i + ch] + g
        if (blotch) v += blotch[((Math.floor(y / block) * bw + Math.floor(x / block)) * 3 + ch)] * res * 90 + (rr() - 0.5) * res * 120
        if (posterize) v = Math.round(v / posterize) * posterize
        d[i + ch] = v
      }
    }
  }
  out.putImageData(img, 0, 0)
}

/** Two inks on cream stock: auto-levelled, clustered-dot halftone at two screen angles, a hair of misregistration. */
function riso(d: Uint8ClampedArray, w: number, h: number, P: Plan, s: number, rr: () => number) {
  const paper = [242, 234, 219]
  const byLum = [...P.pal].sort((a, b) => lumHex(a) - lumHex(b))
  const inkA = hex(mixHex(byLum[0], '#1d3a8a', 0.55)) // the dark ink leans riso blue
  const accent = byLum.slice(1, 4).sort((a, b) => satHex(b) - satHex(a))[0]
  const inkB = hex(satHex(accent) < 60 ? '#ff6c5c' : mixHex(accent, '#ff5a7a', 0.25)) // fluoro-ish second ink
  const src = new Uint8ClampedArray(d)
  // auto-levels on luminance (2nd–98th percentile)
  const hist = new Uint32Array(256)
  for (let i = 0; i < src.length; i += 4) hist[Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2])]++
  const total = w * h
  let lo = 0, hi = 255, acc = 0
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > total * 0.02) { lo = i; break } }
  acc = 0
  for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > total * 0.02) { hi = i; break } }
  const span = Math.max(24, hi - lo)
  const cell = Math.max(3, s / 210)
  const off = Math.max(1, Math.round(s * 0.0025))
  const screen = (x: number, y: number, ang: number, cov: number) => {
    const c = Math.cos(ang), sn = Math.sin(ang)
    const u = (x * c + y * sn) / cell, v = (-x * sn + y * c) / cell
    const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5
    return fu * fu + fv * fv < cov / Math.PI ? 1 : 0
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const l = Math.min(1, Math.max(0, (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2] - lo) / span))
      const j = (Math.min(h - 1, y + off) * w + Math.min(w - 1, x + off)) * 4
      const r = src[j] / 255, g = src[j + 1] / 255, b = src[j + 2] / 255
      const sat = Math.max(r, g, b) - Math.min(r, g, b)
      const a = screen(x, y, 0.26, Math.pow(1 - l, 1.15) * 1.05) * 0.94
      const lm = Math.min(1, Math.max(0, (0.299 * src[j] + 0.587 * src[j + 1] + 0.114 * src[j + 2] - lo) / span))
      const bcov = Math.min(0.85, sat * 1.6 + Math.max(0, 0.55 - Math.abs(lm - 0.45)) * 0.7)
      const bInk = screen(x + off, y, 1.31, bcov) * 0.85
      const n = (rr() - 0.5) * 16
      for (let ch = 0; ch < 3; ch++) {
        let v = paper[ch] + n
        v *= 1 - bInk * (1 - inkB[ch] / 255)
        v *= 1 - a * (1 - inkA[ch] / 255)
        d[i + ch] = v
      }
    }
}
const lumHex = (h: string) => { const [r, g, b] = hex(h); return 0.299 * r + 0.587 * g + 0.114 * b }
const satHex = (h: string) => { const v = hex(h); return Math.max(...v) - Math.min(...v) }

/** Paint one image into a new canvas at `scale` × its nominal size. */
export function paint(p: GenParams, scale = 1): HTMLCanvasElement {
  const w = Math.max(8, Math.round(p.w * (p.upscale ?? 1) * scale)), h = Math.max(8, Math.round(p.h * (p.upscale ?? 1) * scale))
  const plan = interpret(p)
  const r = rngFor(p)
  const scene = document.createElement('canvas'); scene.width = w; scene.height = h
  const sc = scene.getContext('2d', { willReadFrequently: false })!
  PAINTERS[plan.scene](sc, w, h, plan, r)
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const oc = out.getContext('2d', { willReadFrequently: true })!
  post(oc, scene, w, h, plan, p, r)
  return out
}

/** Short human description of what the "model" saw — shown in details. */
export function describe(p: GenParams) {
  const pl = interpret(p)
  const feats = (Object.keys(pl.f) as Feature[]).filter((k) => pl.f[k])
  return { scene: pl.scene, palette: pl.pal, features: feats }
}
