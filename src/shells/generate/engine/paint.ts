/* ---------------------------------------------------------------------------
   The mock diffusion model. No network: an image is a pure function of its
   parameters — (prompt, negative, model, size, steps, guidance, seed,
   subseed) → pixels — so history can be re-rendered on reload instead of
   stored, and "same seed, same image" holds like the real thing.

   Every output is the spinning top, in one ink on paper (the wire
   style: the tool is the hero, not the pictures). The seed places it —
   position, size, lean, which side the key light comes from; the prompt
   moves it (night / dark → lit top on an ink ground, close-up → bigger,
   wide / minimal → smaller, centred → upright in the middle). Guidance
   drives contrast (and crushes past ~14 like real CFG). Too few steps
   leaves blotchy residual noise. Models are dither styles: Lumen XL
   Atkinson, Turbo a coarse draft Atkinson, Photon fine Floyd–Steinberg,
   Riso Press a one-ink halftone.

   All geometry is in fractions of the canvas, so a 220px progress preview,
   the 1024px image and the 2048px upscale are the same picture.
--------------------------------------------------------------------------- */
import { modelOf, type GenParams } from './models'
import { paintTop } from '@/demo/top'
import { mulberry32 } from '../../util'

const INK = '#1C1A19'
const PAPER = '#F6F1EA'
const INK_RGB = [0x1c, 0x1a, 0x19] as const
const PAPER_RGB = [0xf6, 0xf1, 0xea] as const

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
const has = (text: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}\\b`).test(text))
const NIGHT = ['night', 'midnight', 'dark', 'noir', 'low key', 'moody', 'spotlight']
const CLOSE = ['close', 'close-up', 'closeup', 'macro', 'detail', 'tight']
const WIDE = ['wide', 'minimal', 'minimalist', 'small', 'distant', 'negative space']
const CENTRED = ['centred', 'centered', 'symmetrical', 'upright', 'still']

export type Style = 'atkinson' | 'draft' | 'diffusion' | 'halftone'
const STYLE: Record<string, Style> = { 'lumen-xl': 'atkinson', 'lumen-turbo': 'draft', photon: 'diffusion', riso: 'halftone' }

export interface Plan { night: boolean; at: number; size: number; tilt: number; key: number; con: number; residual: number; style: Style; grain: number }

export function interpret(p: GenParams): Plan {
  const text = p.prompt.toLowerCase()
  const neg = p.negative.toLowerCase()
  const r = rngFor(p)
  const night = has(text, NIGHT) && !has(neg, ['night', 'dark'])
  const centred = has(text, CENTRED)
  const at = centred ? 0.5 : 0.5 + (r() - 0.5) * 0.34
  const size = (has(text, CLOSE) ? 0.86 : has(text, WIDE) ? 0.42 : 0.5 + r() * 0.2) * (p.w > p.h * 1.8 ? 0.92 : 1)
  const tilt = centred ? 0 : -0.34 + r() * 0.42
  const key = r() < 0.5 ? -1 : 1
  const m = modelOf(p.model)
  const g = p.guidance - m.guidance // relative to the model's own sweet spot
  const burn = Math.max(0, (p.guidance - 13) / 7)
  const con = Math.max(0.7, 1.04 + g * 0.03) * (1 + burn * 0.9)
  const residual = Math.max(0, Math.min(0.9, 1 - p.steps / m.steps)) * (p.model === 'lumen-turbo' ? 1.6 : 1)
  return { night, at, size, tilt, key, con, residual, style: STYLE[p.model] ?? 'atkinson', grain: 0.45 + (p.detail ?? 0) * 0.8 }
}

/** Day: the tone is painted on bare paper (paintTop `paper`); a small levels lift keeps that ground
    above the threshold, so ink lands only on the top, its shadow and the floor right under it —
    the brand's dithered top. Night: a light
    levels stretch for the halftone screen; error diffusion takes night tones as they are. */
const lift = (v: number, night: boolean, screen = false) => (night ? (screen ? (v - 0.08) / 0.78 : v) : Math.min(1, v / 0.9))

/* --- dithering --- */
const KERNELS: Record<'atkinson' | 'floyd', [number, number, number][]> = {
  atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
  floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
}

/** Tone canvas → luminance grid at `cell` px, contrast + residual noise, error-diffused to ink / paper. */
function diffuse(tone: HTMLCanvasElement, w: number, h: number, cell: number, P: Plan, kernel: 'atkinson' | 'floyd', r: () => number) {
  const W = Math.max(8, Math.round(w / cell)), H = Math.max(8, Math.round(h / cell))
  const sc = document.createElement('canvas'); sc.width = W; sc.height = H
  const sx = sc.getContext('2d', { willReadFrequently: true })!
  sx.imageSmoothingQuality = 'high'; sx.drawImage(tone, 0, 0, W, H)
  const d = sx.getImageData(0, 0, W, H).data
  const L = new Float32Array(W * H)
  // residual noise is blotchy (low-frequency) like an under-cooked latent
  const block = Math.max(2, Math.round(Math.min(W, H) / 24)), bw = Math.ceil(W / block)
  const blotch = P.residual > 0 ? Float32Array.from({ length: bw * Math.ceil(H / block) }, () => r() - 0.5) : null
  for (let i = 0; i < W * H; i++) {
    let v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
    v = lift(v, P.night)
    v = (v - 0.5) * P.con + 0.5
    if (blotch) { const x = i % W, y = (i / W) | 0; v += blotch[Math.floor(y / block) * bw + Math.floor(x / block)] * P.residual * 0.9 + (r() - 0.5) * P.residual * 0.6 }
    L[i] = v
  }
  const k = KERNELS[kernel]
  const on = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    const rtl = kernel === 'floyd' && y % 2 === 1 // serpentine for Floyd–Steinberg
    for (let n = 0; n < W; n++) {
      const x = rtl ? W - 1 - n : n, i = y * W + x
      const o = L[i] < 0.5 ? 0 : 1, e = L[i] - o
      on[i] = o
      for (const [dx, dy, wt] of k) { const X = x + (rtl ? -dx : dx), Y = y + dy; if (X >= 0 && X < W && Y < H) L[Y * W + X] += e * wt }
    }
  }
  const pc = document.createElement('canvas'); pc.width = W; pc.height = H
  const px = pc.getContext('2d')!, img = px.createImageData(W, H)
  for (let i = 0; i < W * H; i++) img.data.set([...(on[i] ? PAPER_RGB : INK_RGB), 255], i * 4)
  px.putImageData(img, 0, 0)
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const oc = out.getContext('2d')!
  oc.imageSmoothingEnabled = false
  oc.drawImage(pc, 0, 0, w, h)
  return out
}

/** One ink, clustered-dot screen at 45°, a hair of paper noise. */
function halftone(tone: HTMLCanvasElement, w: number, h: number, P: Plan, r: () => number) {
  const s = Math.min(w, h), cell = Math.max(3, s / 96)
  // sample a softened copy so the paper grain doesn't fray the dot edges
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
      l = lift(l, P.night, true)
      l = Math.min(1, Math.max(0, (l - 0.5) * P.con + 0.5 + (r() - 0.5) * P.residual * 0.5))
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
  const tone = paintTop(w, h, { at: P.at, size: P.size, tilt: P.tilt, key: P.key, night: P.night, grain: P.grain, vignette: P.night ? 0.5 : 0, paper: true, seed: p.seed })
  if (P.style === 'halftone') return halftone(tone, w, h, P, r)
  // the grid is set by the nominal size, so a preview, the image and its upscale share one pattern
  const s = Math.min(w, h), up = p.upscale ?? 1
  const per = P.style === 'draft' ? 150 : P.style === 'diffusion' ? 380 : 270
  return diffuse(tone, w, h, Math.max(1, s / (per * up)), P, P.style === 'diffusion' ? 'floyd' : 'atkinson', r)
}

const STYLE_LABEL: Record<Style, string> = { atkinson: 'atkinson', draft: 'draft dither', diffusion: 'fine diffusion', halftone: 'halftone' }

/** Short human description of what the "model" saw — shown in details. */
export function describe(p: GenParams) {
  const pl = interpret(p)
  const features = [pl.night ? 'night' : 'studio', pl.key < 0 ? 'key left' : 'key right', STYLE_LABEL[pl.style]]
  if (pl.residual > 0.2) features.push('noisy')
  return { scene: 'spinning top', palette: pl.night ? [INK, PAPER] : [PAPER, INK], features }
}
