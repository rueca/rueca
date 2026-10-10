/* ---------------------------------------------------------------------------
   Document state. Everything undoable lives in ONE param store — including the
   layer stack, a hidden `p.data<Layer[]>()` value. So ⌘Z, looks, A/B, share
   links and persistence all cover adding, deleting, reordering and editing
   layers.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { createClock, createParams, defineSchema, folder, p } from '@kit'
import { LAYER_TYPES, makeLayer, newId, type Layer, type LayerType } from './layers'
import { randomPalette, rng } from './color'

/* ---------- looks (built-in presets) ----------
   Colours from the Rueca palette and its tonal ramps (brand/data.js ruecaPalette,
   ruecaRamps). The first look, the default, is the logo's three dyes on walnut. */
const L = makeLayer
const look = (name: string, bg: string, seed: number, layers: Layer[]) => ({ name, values: { bg, seed, layers } })

export const LOOKS = [
  look('Achiote', '#181411', 4127, [
    L('grain', { params: { size: 1.2 } }),
    L('vignette', { opacity: 0.6 }),
    L('warp', { params: { amount: 0.3, scale: 0.85, detail: 3, evolve: 0.45 } }),
    L('mesh', { params: { colors: ['#181411', '#5B0C04', '#E8582C', '#F2C744', '#5DB4E8'], softness: 0.62, drift: 0.65 } }),
  ]),
  look('Cochinilla', '#531816', 812, [
    L('grain', { opacity: 0.26, params: { size: 1.6 } }),
    L('warp', { params: { amount: 0.32, scale: 0.9, detail: 3, evolve: 0.4 } }),
    L('mesh', { params: { colors: ['#BC5448', '#EE7A68', '#F0DBA1', '#FEAEA0', '#F3F1EB'], softness: 0.7, drift: 0.5 } }),
  ]),
  look('Riso', '#F3F1EB', 2290, [
    L('grain', { blend: 'multiply', opacity: 0.18, params: { size: 2, animated: false } }),
    L('halftone', { params: { shape: 'dot', cell: 11, angle: 22, contrast: 1.2, inkMode: 'source', paper: '#F3F1EB' } }),
    L('warp', { params: { style: 'swirl', amount: 0.8, scale: 1.6, cycles: 1 } }),
    L('mesh', { params: { colors: ['#E8582C', '#3440C8', '#F2C744', '#F3F1EB', '#2FA57C'], softness: 0.5, drift: 0.7 } }),
  ]),
  look('Nocturne', '#0E0B09', 5531, [
    L('scanlines', { opacity: 0.22, params: { pitch: 3.5, sharpness: 0.3, roll: 2 } }),
    L('vignette', { opacity: 0.85, params: { size: 0.45, softness: 1.1 } }),
    L('chromatic', { params: { amount: 9, radial: true } }),
    L('warp', { params: { amount: 0.5, scale: 1.1, detail: 4, evolve: 0.7 } }),
    L('mesh', { params: { colors: ['#0E0B09', '#1B246C', '#EE7A68', '#6FC0EE', '#372156'], softness: 0.42, drift: 0.8 } }),
  ]),
  look('Lava', '#181411', 913, [
    L('grain', { opacity: 0.3 }),
    L('posterize', { opacity: 0.55, params: { levels: 6, gamma: 1.1 } }),
    L('warp', { params: { style: 'swirl', amount: 1.1, scale: 1.4, cycles: 1 } }),
    L('warp', { name: 'Warp flow', params: { amount: 0.3, scale: 1.6, detail: 3, evolve: 0.5 } }),
    L('mesh', { params: { colors: ['#5B0C04', '#E8582C', '#F2C744', '#7F1E0C', '#FE8562'], softness: 0.48, drift: 0.9 } }),
  ]),
  look('Leaf print', '#F3F1EB', 3301, [
    L('grain', { blend: 'multiply', opacity: 0.14, params: { size: 1.8, animated: false } }),
    L('halftone', { params: { shape: 'line', cell: 10, angle: -30, contrast: 0.8, inkMode: 'source', paper: '#F3F1EB' } }),
    L('warp', { params: { style: 'waves', amount: 1.1, scale: 1.1, cycles: 1 } }),
    L('gradient', { params: { ramp: { angle: 135, stops: [{ pos: 0, color: '#015341' }, { pos: 0.45, color: '#5DC39B' }, { pos: 1, color: '#F3F1EB' }] }, shape: 'linear', spin: 0 } }),
  ]),
  look('Duotone', '#181411', 6612, [
    L('grain', { opacity: 0.34, params: { size: 1.2 } }),
    L('gradmap', { params: { colors: ['#181411', '#E8582C', '#F3F1EB'], offset: 0.02 } }),
    L('warp', { params: { amount: 0.45, scale: 0.9, detail: 3, evolve: 0.6 } }),
    L('mesh', { params: { colors: ['#111111', '#777777', '#eeeeee', '#333333', '#bbbbbb'], softness: 0.5, drift: 0.7 } }),
  ]),
  look('Malva', '#181411', 7240, [
    L('grain', { opacity: 0.28 }),
    L('vignette', { opacity: 0.8, params: { tint: '#181411' } }),
    L('warp', { params: { style: 'ripple', amount: 0.8, scale: 1.1, cycles: 2 } }),
    L('mesh', { params: { colors: ['#181411', '#503578', '#A88BF6', '#5DB4E8', '#372156'], softness: 0.5, drift: 0.6 } }),
  ]),
]

/* ---------- schema ---------- */
export const perf = { fps: 60, ms: 16.7, scale: 1, res: '—' }

// Layers arrive from share links and saved looks — check each one names a known type (break-it S4).
const validLayers = (v: unknown) => Array.isArray(v) && v.every((l) =>
  !!l && typeof l === 'object' && typeof (l as Layer).id === 'string' && (l as Layer).type in LAYER_TYPES &&
  typeof (l as Layer).visible === 'boolean' && typeof (l as Layer).opacity === 'number' &&
  !!(l as Layer).params && typeof (l as Layer).params === 'object')

export const schema = defineSchema({
  canvas: folder('Canvas', {
    aspect: p.select('free', [{ value: 'free', label: 'Fill' }, { value: '16:9', label: '16:9' }, { value: '1:1', label: '1:1' }, { value: '9:16', label: '9:16' }], { hint: 'Fill uses the whole window. Fixed ratios frame the artwork for export.' }),
    bg: p.color('#181411', { alpha: false, label: 'Background', hint: 'What shows beneath the bottom layer.' }),
  }),
  time: folder('Time', {
    speed: p.number(1, { min: 0, max: 3, step: 0.05, unit: '×', hint: 'Playback rate. Video exports keep the loop seamless at any speed.' }),
    loop: p.number(10, { min: 2, max: 30, step: 0.5, unit: 's', label: 'Loop length', hint: 'All motion repeats exactly once per loop, so recordings tile.' }),
    seed: p.seed(4127, { hint: 'Reshuffles point positions and noise. R randomises colours too.' }),
  }),
  render: folder('Render', {
    quality: p.select('auto', [{ value: 'auto', label: 'Auto' }, { value: '0.5', label: '50%' }, { value: '0.75', label: '75%' }, { value: '1', label: '100%' }], { label: 'Resolution', hint: 'Auto lowers the drawing resolution when the frame rate drops, and raises it again when there is headroom.' }),
    fps: p.monitor(() => perf.fps, { label: 'Frame rate', graph: true, min: 0, max: 75, fmt: (v) => `${Math.round(v)} fps` }),
    drawing: p.monitor(() => perf.res, { label: 'Drawing at' }),
  }, { collapsed: true }),
  // never rendered as a row; the layers panel edits it. Shared, so a link carries the whole look.
  stack: folder('Stack', { layers: p.data<Layer[]>(LOOKS[0].values.layers, { label: 'Layers', share: true, validate: validLayers }) }),
})

export const LOOK_KEYS = ['layers', 'bg', 'seed'] as const
// "Save current look" captures the stack + background + seed, never canvas or playback settings.
export const params = createParams(schema, { id: 'shader', presets: LOOKS, presetKeys: [...LOOK_KEYS] })
export type V = ReturnType<typeof params.values>

export const lookOf = (v: V) => ({ layers: v.layers, bg: v.bg, seed: v.seed })

/* ---------- clock: one loop, rate = speed ---------- */
export const clock = createClock({ duration: params.values().loop * 1000, loop: true, fps: 60 })
clock.setRate(params.values().speed)
params.subscribe((s, prev) => {
  if (s.values.loop !== prev.values.loop) clock.setState({ duration: s.values.loop * 1000 })
  if (s.values.speed !== prev.values.speed) clock.setRate(s.values.speed)
})

/* ---------- ui state (not undoable) ---------- */
export interface Look { layers: Layer[]; bg: string; seed: number }
export const ui = createStore<{ selected: string | null; preview: Look | null; frameW: number; frameH: number }>(() => ({ selected: null, preview: null, frameW: 1280, frameH: 720 }))

/* ---------- layer operations: each is one undo step ---------- */
export const getLayers = (v: V = params.values()) => v.layers
export const setLayers = (next: Layer[], commit = true, label?: string) => params.setValue('layers', next, { commit, label })
const nameOf = (id: string) => getLayers().find((l) => l.id === id)?.name ?? 'layer'

export function updateLayer(id: string, fn: (l: Layer) => Layer, commit = true, label?: string) {
  setLayers(getLayers().map((l) => (l.id === id ? fn(l) : l)), commit, label)
}

export function addLayer(type: LayerType) {
  const layers = getLayers()
  const sel = ui.getState().selected
  const at = Math.max(0, layers.findIndex((l) => l.id === sel))
  const layer = makeLayer(type)
  const next = [...layers]
  next.splice(sel ? at : 0, 0, layer)
  setLayers(next, true, `Add ${LAYER_TYPES[type].label.toLowerCase()}`)
  ui.setState({ selected: layer.id })
}

export function removeLayer(id: string) {
  const layers = getLayers()
  const i = layers.findIndex((l) => l.id === id)
  if (i < 0) return
  const next = layers.filter((l) => l.id !== id)
  setLayers(next, true, `Remove ${nameOf(id)}`)
  ui.setState({ selected: next[Math.min(i, next.length - 1)]?.id ?? null })
}

export function duplicateLayer(id: string) {
  const layers = getLayers()
  const i = layers.findIndex((l) => l.id === id)
  if (i < 0) return
  const src = structuredClone(layers[i])
  const copy: Layer = { ...src, id: newId(), name: `${src.name} copy` }
  const next = [...layers]
  next.splice(i, 0, copy)
  setLayers(next, true, `Duplicate ${src.name}`)
  ui.setState({ selected: copy.id })
}

export function moveLayer(id: string, to: number) {
  const layers = [...getLayers()]
  const from = layers.findIndex((l) => l.id === id)
  if (from < 0) return
  const [it] = layers.splice(from, 1)
  layers.splice(Math.max(0, Math.min(layers.length, to)), 0, it)
  setLayers(layers, true, `Move ${it.name}`)
}

export const moveBy = (id: string, d: number) => { const i = getLayers().findIndex((l) => l.id === id); if (i >= 0) moveLayer(id, i + d) }

/* ---------- randomise: one commit, keeps the stack's structure ---------- */
export function randomise() {
  const seed = Math.floor(Math.random() * 99999)
  const r = rng(seed ^ 0x9e3779b9)
  const pal = randomPalette(seed)
  const layers = getLayers().map((l): Layer => {
    switch (l.type) {
      case 'mesh': return { ...l, params: { ...l.params, colors: pal, softness: 0.35 + r() * 0.45, drift: 0.35 + r() * 0.7 } }
      case 'gradmap': return { ...l, params: { ...l.params, colors: [pal[0], pal[Math.floor(pal.length / 2)], pal.at(-1)!] } }
      case 'gradient': return { ...l, params: { ...l.params, ramp: { angle: Math.round(r() * 360), stops: pal.slice(0, 3).map((c, i) => ({ pos: i / 2, color: c })) } } }
      case 'warp': return { ...l, params: { ...l.params, amount: +(0.2 + r() * 0.7).toFixed(2), scale: +(0.8 + r() * 1.8).toFixed(2) } }
      case 'halftone': return { ...l, params: { ...l.params, angle: Math.round(r() * 90) } }
      default: return l
    }
  })
  params.patch({ seed, layers }, { label: 'Randomise' })
}
