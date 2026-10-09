/* ---------------------------------------------------------------------------
   Develop state. `params` holds every develop setting (undoable, persisted,
   shareable). The source photo is NOT a param: a data URL can be megabytes
   and would blow the localStorage quota that persists the rest. `ui` holds
   view state — crop draft, split, peek, clipping overlay, hover preview.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { createParams, defineSchema, folder, humanize, p, type ParamStore, type Schema, type ValueDef } from '@kit'
import { IDENTITY_CURVE, type CurvePoint } from './local/ToneCurve'
import type { Rect } from './local/CropOverlay'
import { createNamedHistory } from './local/history'

export type V = Record<string, any>

/** An opaque value the kit has no control for (curve points, a crop rect).
    It still gets defaults, undo, persistence and share links; the shell draws its own UI. */
const custom = <T,>(value: T, o: { label?: string; hint?: string } = {}) => ({ type: 'custom', value, ...o }) as unknown as ValueDef

const sgn = (v: number) => (v > 0 ? `+${v}` : `${v}`)
const bi = (label: string, hint?: string) => p.number(0, { min: -100, max: 100, step: 1, label, hint, fmt: sgn })

export const BANDS = [
  { id: 'red', name: 'Red', hue: 0 },
  { id: 'orange', name: 'Orange', hue: 30 },
  { id: 'yellow', name: 'Yellow', hue: 60 },
  { id: 'green', name: 'Green', hue: 120 },
  { id: 'aqua', name: 'Aqua', hue: 180 },
  { id: 'blue', name: 'Blue', hue: 240 },
  { id: 'purple', name: 'Purple', hue: 270 },
  { id: 'magenta', name: 'Magenta', hue: 300 },
] as const
const hslParams = Object.fromEntries(BANDS.flatMap((b) => (['h', 's', 'l'] as const).map((c) => [`hsl_${b.id}_${c}`, bi(`${b.name} ${{ h: 'hue', s: 'saturation', l: 'luminance' }[c]}`)])))

export const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 }
export const ASPECTS = [
  { value: 'free', label: 'Free', ratio: null },
  { value: 'original', label: 'Original', ratio: 0 },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:5', label: '4:5', ratio: 4 / 5 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
] as const

const schema = defineSchema({
  wb: folder('White balance', {
    temp: bi('Temp', 'Cooler (blue) to warmer (yellow).'),
    tint: bi('Tint', 'Greener to more magenta.'),
  }),
  tone: folder('Tone', {
    exposure: p.number(0, { min: -4, max: 4, step: 0.01, label: 'Exposure', hint: 'In stops. +1 doubles the light.', fmt: (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) }),
    contrast: bi('Contrast'),
    highlights: bi('Highlights', 'Recover (−) or brighten (+) the brightest tones only.'),
    shadows: bi('Shadows', 'Open up (+) or deepen (−) the darkest tones only.'),
    whites: bi('Whites', 'Sets the white point. Watch the right clipping triangle.'),
    blacks: bi('Blacks', 'Sets the black point. + lifts to a matte look.'),
  }),
  presence: folder('Presence', {
    texture: bi('Texture', 'Fine detail — grass, skin, fabric.'),
    clarity: bi('Clarity', 'Mid-size local contrast.'),
    dehaze: bi('Dehaze', 'Cuts (+) or adds (−) atmospheric haze.'),
    vibrance: bi('Vibrance', 'Boosts muted colours more than saturated ones, and spares skin tones.'),
    saturation: bi('Saturation'),
  }),
  curve: folder('Tone curve', {
    curveRGB: custom<CurvePoint[]>(IDENTITY_CURVE, { label: 'RGB curve' }),
    curveR: custom<CurvePoint[]>(IDENTITY_CURVE, { label: 'Red curve' }),
    curveG: custom<CurvePoint[]>(IDENTITY_CURVE, { label: 'Green curve' }),
    curveB: custom<CurvePoint[]>(IDENTITY_CURVE, { label: 'Blue curve' }),
  }),
  hsl: folder('Colour mixer', hslParams),
  vignette: folder('Vignette', {
    vignette: bi('Amount', 'Darken (−) or lighten (+) the corners of the crop.'),
    vigMid: p.number(50, { min: 0, max: 100, step: 1, label: 'Midpoint', when: (v: V) => v.vignette !== 0 }),
    vigFeather: p.number(50, { min: 0, max: 100, step: 1, label: 'Feather', when: (v: V) => v.vignette !== 0 }),
  }),
  grain: folder('Grain', {
    grain: p.number(0, { min: 0, max: 100, step: 1, label: 'Amount' }),
    grainSize: p.number(25, { min: 0, max: 100, step: 1, label: 'Size', when: (v: V) => v.grain > 0 }),
  }),
  detail: folder('Sharpening', {
    sharpen: p.number(25, { min: 0, max: 150, step: 1, label: 'Amount' }),
    sharpRadius: p.number(1, { min: 0.5, max: 3, step: 0.1, label: 'Radius', unit: 'px', when: (v: V) => v.sharpen > 0 }),
  }),
  geometry: folder('Crop', {
    crop: custom<Rect>(FULL, { label: 'Crop' }),
    angle: p.number(0, { min: -45, max: 45, step: 0.1, unit: '°', label: 'Straighten' }),
    aspect: p.select('free', ASPECTS.map((a) => ({ value: a.value, label: a.label })), { label: 'Aspect' }),
  }),
})

export const params = createParams(schema as Schema, { id: 'photo', historyLimit: 200 }) as unknown as ParamStore<Schema, V>
export const DEFAULTS = params.getState().defaults as V
export const GEOMETRY_KEYS = ['crop', 'angle', 'aspect']
export const LOOK_KEYS = Object.keys(DEFAULTS).filter((k) => !GEOMETRY_KEYS.includes(k))
export const lookDefaults = () => Object.fromEntries(LOOK_KEYS.map((k) => [k, structuredClone(DEFAULTS[k])]))

/* --- looks (filmstrip). Partial patches: they reset the look, never the crop. */
export interface Look { id: string; name: string; values: V; user?: boolean; group?: string }
export const LOOKS: Look[] = [
  { id: 'original', name: 'Original', group: 'Basics', values: {} },
  { id: 'clean', name: 'Clean', group: 'Basics', values: { exposure: 0.12, contrast: 12, highlights: -28, shadows: 22, whites: 8, blacks: -6, clarity: 8, vibrance: 15 } },
  { id: 'punch', name: 'Punch', group: 'Basics', values: { contrast: 32, highlights: -18, shadows: 12, clarity: 24, dehaze: 14, vibrance: 34, sharpen: 55 } },
  { id: 'golden', name: 'Golden hour', group: 'Colour', values: { temp: 30, tint: 7, exposure: 0.08, highlights: -32, shadows: 10, vibrance: 22, hsl_orange_s: 16, hsl_yellow_h: -12, vignette: -18 } },
  { id: 'teal', name: 'Teal & orange', group: 'Colour', values: { temp: 4, contrast: 16, hsl_blue_h: -22, hsl_aqua_h: -8, hsl_green_h: 45, hsl_green_s: -22, hsl_orange_s: 22, hsl_yellow_h: -18, curveB: [[0, 0.07], [0.5, 0.5], [1, 0.93]], vibrance: 10 } },
  { id: 'nordic', name: 'Nordic', group: 'Colour', values: { temp: -20, tint: -3, contrast: 8, blacks: 10, saturation: -22, hsl_green_s: -38, hsl_blue_s: -12, clarity: 10, curveRGB: [[0, 0.05], [0.5, 0.52], [1, 0.97]] } },
  { id: 'warmfilm', name: 'Warm film', group: 'Film', values: { temp: 16, tint: 4, contrast: -6, highlights: -20, shadows: 14, saturation: -6, grain: 24, grainSize: 30, vignette: -14, curveRGB: [[0, 0.07], [0.25, 0.27], [0.75, 0.77], [1, 0.95]] } },
  { id: 'matte', name: 'Matte fade', group: 'Film', values: { contrast: -18, blacks: 22, saturation: -14, grain: 14, curveRGB: [[0, 0.12], [0.5, 0.52], [1, 0.93]] } },
  { id: 'cross', name: 'Cross process', group: 'Film', values: { contrast: 10, saturation: 8, curveR: [[0, 0], [0.25, 0.18], [0.75, 0.84], [1, 1]], curveG: [[0, 0], [0.3, 0.26], [0.7, 0.78], [1, 1]], curveB: [[0, 0.16], [1, 0.84]] } },
  { id: 'softmono', name: 'Soft mono', group: 'Mono', values: { saturation: -100, contrast: 8, clarity: 12, highlights: -15, shadows: 15, hsl_blue_l: -25, hsl_green_l: 10, grain: 22, vignette: -18 } },
  { id: 'noir', name: 'Noir', group: 'Mono', values: { saturation: -100, contrast: 46, blacks: -24, whites: 16, hsl_blue_l: -55, hsl_orange_l: 22, hsl_yellow_l: 20, clarity: 18, grain: 34, grainSize: 40, vignette: -40 } },
]
export const lookValues = (l: Look): V => ({ ...lookDefaults(), ...structuredClone(l.values) })
export const activeLook = (v: V, looks: Look[]) =>
  looks.find((l) => { const lv = lookValues(l); return LOOK_KEYS.every((k) => JSON.stringify(lv[k]) === JSON.stringify(v[k])) })?.id ?? null

/* --- view state -------------------------------------------------------- */
export interface CropDraft { crop: Rect; angle: number; aspect: string }
interface UI {
  file: string
  hasImage: boolean
  imageSize: { w: number; h: number }
  cropping: CropDraft | null
  split: number | null
  bypass: boolean
  clip: { shadows: boolean; highlights: boolean }
  preview: string | null
  thumbs: Record<string, string>
  userLooks: Look[]
  curveChannel: 'RGB' | 'R' | 'G' | 'B'
  hslMode: 'h' | 's' | 'l'
}
const LSK = 'studio:photo:looks'
const savedLooks = (() => { try { return JSON.parse(localStorage.getItem(LSK) || '[]') as Look[] } catch { return [] } })()
export const ui = createStore<UI>(() => ({
  file: 'Ridgeline at dusk.jpg',
  hasImage: true,
  imageSize: { w: 2000, h: 1333 },
  cropping: null,
  split: null,
  bypass: false,
  clip: { shadows: false, highlights: false },
  preview: null,
  thumbs: {},
  userLooks: savedLooks,
  curveChannel: 'RGB',
  hslMode: 's',
}))
ui.subscribe((s, prev) => { if (s.userLooks !== prev.userLooks) try { localStorage.setItem(LSK, JSON.stringify(s.userLooks)) } catch { /* quota */ } })
export const allLooks = () => [...LOOKS, ...ui.getState().userLooks.map((l) => ({ ...l, user: true, group: 'Yours' }))]

/* --- history names ------------------------------------------------------- */
const fmt = (k: string, v: unknown) => {
  if (typeof v !== 'number') return ''
  const d = params.defs[k] as { fmt?: (n: number) => string; unit?: string } | undefined
  return d?.fmt ? d.fmt(v) : `${v}${d?.unit ?? ''}`
}
export function describe(prev: V, next: V): string {
  const changed = Object.keys(next).filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(next[k]))
  if (!changed.length) return 'Edit'
  if (changed.every((k) => GEOMETRY_KEYS.includes(k))) return changed.includes('crop') ? 'Crop' : changed.includes('angle') ? `Straighten ${fmt('angle', next.angle)}` : 'Aspect'
  if (changed.length > 2) return `${changed.length} settings`
  const k = changed[0]
  if (k.startsWith('curve')) return `Tone curve${k === 'curveRGB' ? '' : ` · ${k.slice(5)}`}`
  const label = (params.defs[k] as { label?: string })?.label ?? humanize(k)
  const name = k.startsWith('hsl_') ? `Mixer · ${label}` : ['vigMid', 'vigFeather'].includes(k) ? `Vignette ${label.toLowerCase()}` : ['grainSize'].includes(k) ? 'Grain size' : ['vignette'].includes(k) ? 'Vignette' : ['grain'].includes(k) ? 'Grain' : ['sharpen'].includes(k) ? 'Sharpening' : label
  return `${name} ${fmt(k, next[k])}`.trim() + (changed.length === 2 ? ' +1' : '')
}
export const history = createNamedHistory(params, describe, 'Open')
