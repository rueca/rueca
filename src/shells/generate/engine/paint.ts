/* ---------------------------------------------------------------------------
   The mock diffusion model. No network: an image is a pure function of its
   parameters — (prompt, negative, model, size, steps, guidance, seed,
   subseed) → pixels — so history can be re-rendered on reload instead of
   stored, and "same seed, same image" holds like the real thing.

   The "weights" are a small library of real Midjourney outputs made for the
   demo's three clients (src/demo/clients.ts, public/demo/): Campana's bell,
   Agalla's inks and desk, Gabinete's engraved plates. The prompt picks the
   subject (bell / ink / plate, a dye colour, night), the seed picks which
   picture and where the frame sits on it. Models are treatments: Lumen XL
   clean, Photon graded like film, Lumen Turbo a soft draft, Riso Press a
   one-ink halftone. Guidance drives contrast (and crushes past ~14 like real
   CFG); too few steps leaves blotchy residual noise.

   Pictures decode asynchronously; call ready(p) before paint(p). Until then
   paint() returns a plain paper frame, so a progress preview never throws.
   All geometry is in fractions of the canvas, so a 220px preview, the 1024px
   image and the 2048px upscale are the same picture.
--------------------------------------------------------------------------- */
import { modelOf, type GenParams } from './models'
import { AGALLA, CAMPANA, DYE, GABINETE, demo, loadDemo } from '@/demo/clients'
import { mulberry32 } from '../../util'

const INK = DYE.nogal
const PAPER = DYE.lana
const INK_RGB = [0x18, 0x14, 0x11] as const
const PAPER_RGB = [0xf3, 0xf1, 0xeb] as const

/* --- the library --- */
type Subject = 'bell' | 'ink' | 'desk' | 'plate'
interface Source { url: string; subject: Subject; night?: boolean; dye?: string; /** ink on transparent: lay it on paper */ inked?: boolean; label: string }
const g = (name: string) => demo(`generate/${name}.webp`)
const LIBRARY: Source[] = [
  { url: CAMPANA.photo, subject: 'bell', label: 'brass bell · saffron' },
  { url: g('bell-saffron-a'), subject: 'bell', label: 'brass bell · saffron' },
  { url: g('bell-saffron-b'), subject: 'bell', label: 'brass bell · saffron' },
  { url: g('bell-saffron-c'), subject: 'bell', label: 'brass bell · saffron' },
  { url: CAMPANA.night, subject: 'bell', night: true, label: 'brass bell · night' },
  { url: g('bell-night-a'), subject: 'bell', night: true, label: 'brass bell · night' },
  { url: g('bell-night-b'), subject: 'bell', night: true, label: 'brass bell · night' },
  { url: g('bell-night-c'), subject: 'bell', night: true, label: 'brass bell · night' },
  ...AGALLA.inks.map((i) => ({ url: i.img, subject: 'ink' as const, dye: i.id, label: `${i.name.toLowerCase()} ink` })),
  { url: AGALLA.hero, subject: 'ink', dye: 'achiote', label: 'ink and seal' },
  { url: g('ink-seal-a'), subject: 'ink', dye: 'achiote', label: 'ink and seal' },
  { url: g('ink-seal-b'), subject: 'ink', dye: 'achiote', label: 'ink and seal' },
  { url: g('ink-seal-c'), subject: 'ink', dye: 'achiote', label: 'ink and seal' },
  { url: AGALLA.still, subject: 'desk', night: true, label: 'desk still life' },
  { url: g('desk-a'), subject: 'desk', night: true, label: 'desk still life' },
  { url: g('desk-b'), subject: 'desk', night: true, label: 'desk still life' },
  { url: g('desk-c'), subject: 'desk', night: true, label: 'desk still life' },
  ...['orrery-a', 'orrery-b', 'armillary-a', 'armillary-b', 'astrolabe-a', 'astrolabe-b', 'telescope-a', 'balance-a', 'compass-a', 'bell-a']
    .map((n) => ({ url: g(`plate-${n}`), subject: 'plate' as const, label: `${n.replace(/-[ab]$/, '')} plate` })),
  ...GABINETE.instruments.map((i) => ({ url: i.img, subject: 'plate' as const, inked: true, label: `${i.id} plate` })),
]

const decoded = new Map<string, HTMLImageElement>()
/** Decode the picture this image is made from (call before paint). */
export async function ready(p: GenParams) {
  const src = pick(p)
  if (decoded.has(src.url)) return
  try { decoded.set(src.url, await loadDemo(src.url)) } catch { /* paint falls back to paper */ }
}

/* --- randomness --- */
export const fnv = (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) } return h >>> 0 }
/** Variation seeds: every draw blends the main stream toward a second stream by `strength`. */
function rngFor(p: GenParams) {
  const base = (fnv(p.prompt.trim().toLowerCase()) ^ Math.imul(p.seed, 2654435761)) >>> 0
  const a = mulberry32(base)
  if (p.subseed === undefined || !p.subStrength) return a
  const b = mulberry32((fnv(p.prompt.trim().toLowerCase()) ^ Math.imul(p.subseed, 2246822519)) >>> 0)
  const k = p.subStrength
  return () => { const x = a(), y = b(); return x + (y - x) * k }
}

/* --- reading the prompt --- */
const has = (text: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}`).test(text))
const NIGHT = ['night', 'midnight', 'dark', 'black', 'noir', 'low key', 'moody', 'spotlight']
const CLOSE = ['close', 'macro', 'detail', 'tight']
const WIDE = ['wide', 'minimal', 'small', 'distant', 'negative space']
const SUBJECTS: [Subject, string[]][] = [
  ['plate', ['engrav', 'plate', 'etching', 'copperplate', 'diagram', 'encyclop', 'astrolabe', 'orrery', 'armillary', 'telescope', 'compass', 'balance', 'instrument']],
  ['bell', ['bell', 'campana', 'brass']],
  ['desk', ['desk', 'quill', 'letter', 'window']],
  ['ink', ['ink', 'bottle', 'agalla', 'wax', 'seal', 'dye']],
]
const DYES: [string, string[]][] = [
  ['achiote', ['red', 'vermilion', 'orange', 'achiote', 'annatto']], ['cochinilla', ['pink', 'coral', 'crimson', 'cochineal', 'cochinilla']],
  ['gualda', ['yellow', 'saffron', 'gold', 'weld', 'gualda']], ['anil', ['blue', 'indigo', 'sky', 'añil', 'anil']],
  ['nogal', ['brown', 'walnut', 'sepia', 'nogal']], ['hoja', ['green', 'leaf', 'nettle', 'hoja']],
]

export type Style = 'clean' | 'draft' | 'film' | 'halftone'
const STYLE: Record<string, Style> = { 'lumen-xl': 'clean', 'lumen-turbo': 'draft', photon: 'film', riso: 'halftone' }

export interface Plan { source: Source; zoom: number; panX: number; panY: number; con: number; residual: number; style: Style; grain: number }

function pick(p: GenParams): Source {
  const text = p.prompt.toLowerCase(), neg = p.negative.toLowerCase()
  const subject = SUBJECTS.find(([, w]) => has(text, w))?.[0]
  const night = has(text, NIGHT) && !has(neg, ['night', 'dark'])
  const dye = DYES.find(([, w]) => has(text, w))?.[0]
  let pool = LIBRARY.filter((s) => !subject || s.subject === subject)
  if (dye && pool.some((s) => s.dye === dye)) pool = pool.filter((s) => s.dye === dye)
  if (subject !== 'plate' && pool.some((s) => !!s.night === night)) pool = pool.filter((s) => !!s.night === night)
  // consecutive seeds walk the pool, so a batch of four shows four different pictures
  return pool[(fnv(text) + (p.seed >>> 0)) % pool.length]
}

export function interpret(p: GenParams): Plan {
  const text = p.prompt.toLowerCase()
  const r = rngFor(p)
  const zoom = has(text, CLOSE) ? 1.45 : has(text, WIDE) ? 0.82 : 1 + r() * 0.12
  const m = modelOf(p.model)
  const g2 = p.guidance - m.guidance // relative to the model's own sweet spot
  const burn = Math.max(0, (p.guidance - 13) / 7)
  const con = Math.max(0.7, 1.02 + g2 * 0.03) * (1 + burn * 0.9)
  const residual = Math.max(0, Math.min(0.9, 1 - p.steps / m.steps)) * (p.model === 'lumen-turbo' ? 1.6 : 1)
  return { source: pick(p), zoom, panX: (r() - 0.5) * 0.3, panY: (r() - 0.5) * 0.18, con, residual, style: STYLE[p.model] ?? 'clean', grain: 0.35 + (p.detail ?? 0) * 0.8 }
}

/* --- composing the frame --- */
function compose(P: Plan, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d')!
  const img = decoded.get(P.source.url)
  x.fillStyle = PAPER; x.fillRect(0, 0, w, h)
  if (!img) return c
  const iw = img.naturalWidth, ih = img.naturalHeight
  if (P.source.inked || P.zoom < 1) {
    // the object sits on paper: contain, with air (wide prompts and the inked plates)
    if (!P.source.inked) { x.fillStyle = sampleEdge(img); x.fillRect(0, 0, w, h) }
    const k = Math.min(w / iw, h / ih) * (P.source.inked ? 0.82 : 1) * Math.min(1, P.zoom + 0.1)
    const dw = iw * k, dh = ih * k
    x.drawImage(img, (w - dw) / 2 + P.panX * (w - dw) * 0.5, (h - dh) / 2 + P.panY * (h - dh) * 0.4, dw, dh)
  } else {
    // cover the frame, then crop further for close-ups; the seed pans the window
    const k = Math.max(w / iw, h / ih) * P.zoom
    const sw = w / k, sh = h / k
    const sx = (iw - sw) / 2 + P.panX * (iw - sw), sy = (ih - sh) / 2 + P.panY * (ih - sh)
    x.drawImage(img, Math.max(0, Math.min(iw - sw, sx)), Math.max(0, Math.min(ih - sh, sy)), sw, sh, 0, 0, w, h)
  }
  return c
}
/** the photo's backdrop colour, from its top-left corner (to extend it when the frame is wider) */
function sampleEdge(img: HTMLImageElement) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 4
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(img, 0, 0, img.naturalWidth * 0.05, img.naturalHeight * 0.05, 0, 0, 4, 4)
  const d = x.getImageData(0, 0, 4, 4).data
  let r = 0, gg = 0, b = 0
  for (let i = 0; i < 16; i++) { r += d[i * 4]; gg += d[i * 4 + 1]; b += d[i * 4 + 2] }
  return `rgb(${r / 16 | 0},${gg / 16 | 0},${b / 16 | 0})`
}

/* --- treatments --- */
function grade(c: HTMLCanvasElement, P: Plan, r: () => number) {
  const w = c.width, h = c.height
  const x = c.getContext('2d', { willReadFrequently: true })!
  const img = x.getImageData(0, 0, w, h), d = img.data
  const film = P.style === 'film'
  // residual noise is blotchy (low-frequency) like an under-cooked latent
  const block = Math.max(2, Math.round(Math.min(w, h) / 24)), bw = Math.ceil(w / block)
  const blotch = P.residual > 0 ? Float32Array.from({ length: bw * Math.ceil(h / block) }, () => r() - 0.5) : null
  for (let i = 0; i < w * h; i++) {
    let R = d[i * 4] / 255, G = d[i * 4 + 1] / 255, B = d[i * 4 + 2] / 255
    R = (R - 0.5) * P.con + 0.5; G = (G - 0.5) * P.con + 0.5; B = (B - 0.5) * P.con + 0.5
    if (film) { R = R * 1.04 + 0.015; B = B * 0.93 + 0.02; const l = (R + G + B) / 3; R = l + (R - l) * 0.86; G = l + (G - l) * 0.86; B = l + (B - l) * 0.86 }
    if (blotch) { const px = i % w, py = (i / w) | 0; const n = blotch[Math.floor(py / block) * bw + Math.floor(px / block)] * P.residual * 0.5 + (r() - 0.5) * P.residual * 0.25; R += n; G += n; B += n }
    if (film) { const n = (r() - 0.5) * 0.05 * P.grain; R += n; G += n; B += n }
    d[i * 4] = Math.max(0, Math.min(255, R * 255)); d[i * 4 + 1] = Math.max(0, Math.min(255, G * 255)); d[i * 4 + 2] = Math.max(0, Math.min(255, B * 255))
  }
  x.putImageData(img, 0, 0)
  if (film) {
    const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6)
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.28)')
    x.fillStyle = v; x.fillRect(0, 0, w, h)
  }
  return c
}

/** a soft draft (Turbo's 6 steps): the picture out of focus, the detail not resolved yet */
function draft(c: HTMLCanvasElement) {
  const s = document.createElement('canvas'); s.width = c.width; s.height = c.height
  s.getContext('2d')!.drawImage(c, 0, 0)
  const x = c.getContext('2d')!
  x.filter = `blur(${(Math.min(c.width, c.height) / 110).toFixed(2)}px)`
  x.drawImage(s, 0, 0)
  x.filter = 'none'
  return c
}

/** One ink, clustered-dot screen at 45°, on Rueca's paper. */
function halftone(tone: HTMLCanvasElement, P: Plan, r: () => number) {
  const w = tone.width, h = tone.height
  const s = Math.min(w, h), cell = Math.max(3, s / 96)
  const soft = document.createElement('canvas'); soft.width = w; soft.height = h
  const sc = soft.getContext('2d', { willReadFrequently: true })!
  sc.filter = `blur(${(cell * 0.45).toFixed(2)}px)`; sc.drawImage(tone, 0, 0)
  const src = sc.getImageData(0, 0, w, h).data
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const oc = out.getContext('2d')!
  const img = oc.createImageData(w, h), d = img.data
  const c = Math.cos(Math.PI / 4), sn = Math.sin(Math.PI / 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let l = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]) / 255
      l = Math.min(1, Math.max(0, (l - 0.5) * P.con * 1.15 + 0.55 + (r() - 0.5) * P.residual * 0.5))
      const u = (x * c + y * sn) / cell, v = (-x * sn + y * c) / cell
      const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5
      const ink = fu * fu + fv * fv < (Math.pow(1 - l, 1.1) * 1.1) / Math.PI // dot area = ink coverage
      d.set([...(ink ? INK_RGB : PAPER_RGB), 255], i)
    }
  oc.putImageData(img, 0, 0)
  return out
}

/** Paint one image into a new canvas at `scale` × its nominal size. */
export function paint(p: GenParams, scale = 1): HTMLCanvasElement {
  const w = Math.max(8, Math.round(p.w * (p.upscale ?? 1) * scale)), h = Math.max(8, Math.round(p.h * (p.upscale ?? 1) * scale))
  const P = interpret(p)
  const r = rngFor(p)
  const frame = compose(P, w, h)
  if (!decoded.has(P.source.url)) return frame
  if (P.style === 'halftone') return halftone(frame, P, r)
  if (P.style === 'draft') draft(frame)
  return grade(frame, P, r)
}

const STYLE_LABEL: Record<Style, string> = { clean: 'clean', draft: 'soft draft', film: 'film grade', halftone: 'one-ink halftone' }

/** Short human description of what the "model" saw — shown in details. */
export function describe(p: GenParams) {
  const pl = interpret(p)
  const features = [pl.zoom > 1.3 ? 'close-up' : pl.zoom < 0.9 ? 'wide' : 'framed', STYLE_LABEL[pl.style]]
  if (pl.residual > 0.2) features.push('noisy')
  const dye = pl.source.dye ? AGALLA.inks.find((i) => i.id === pl.source.dye)?.dye : undefined
  const palette = pl.style === 'halftone' ? [PAPER, INK] : pl.source.subject === 'plate' ? [PAPER, INK] : pl.source.subject === 'bell' ? (pl.source.night ? [INK, DYE.gualda] : [DYE.gualda, INK]) : [dye ?? PAPER, INK]
  return { scene: pl.source.label, palette, features }
}
