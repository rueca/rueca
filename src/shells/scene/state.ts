/* ---------------------------------------------------------------------------
   Scene state. Two stores, both outside React so the vanilla three.js
   viewport and the React chrome read the same thing:

   - `params` (kit) — everything a client would tune and want to undo:
     per-object transforms, materials, lights, scene settings. Keys are flat:
     `body_color`, `key_intensity`, `speaker_pos`… The schema is generated
     from the OBJECTS table, one folder per object facet.
   - `ui` (zustand) — editor state that is not a design decision: selection,
     active tool, safe-area insets, saved camera views, thumbnails.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { saveLocal } from '../storage'
import { createParams, defineSchema, folder, p, type Folder, type ParamDef, type ParamStore, type Schema } from '@kit'

export type Kind = 'group' | 'mesh' | 'floor' | 'light' | 'camera'
export type MatType = 'standard' | 'physical' | 'toon'
export type LightType = 'directional' | 'spot' | 'point'
export type Vec3 = { x: number; y: number; z: number }
export type V = Record<string, any>

export interface ObjDef { id: string; name: string; kind: Kind; parent?: string }

export const OBJECTS: ObjDef[] = [
  // ids are historical (the demo used to be a speaker); the names are the bell's
  { id: 'speaker', name: 'Hand bell', kind: 'group' },
  { id: 'body', name: 'Bell', kind: 'mesh', parent: 'speaker' },
  { id: 'cap', name: 'Handle', kind: 'mesh', parent: 'speaker' },
  { id: 'ring', name: 'Ferrule', kind: 'mesh', parent: 'speaker' },
  { id: 'base', name: 'Clapper', kind: 'mesh', parent: 'speaker' },
  { id: 'pedestal', name: 'Plinth', kind: 'mesh' },
  { id: 'floor', name: 'Shadow catcher', kind: 'floor' },
  { id: 'key', name: 'Key light', kind: 'light' },
  { id: 'rim', name: 'Rim light', kind: 'light' },
  { id: 'fill', name: 'Fill light', kind: 'light' },
  { id: 'camera', name: 'Camera', kind: 'camera' },
]
export const OBJ: Record<string, ObjDef> = Object.fromEntries(OBJECTS.map((o) => [o.id, o]))
export const MESHES = OBJECTS.filter((o) => o.kind === 'mesh').map((o) => o.id)
export const LIGHTS = OBJECTS.filter((o) => o.kind === 'light').map((o) => o.id)

/* --- schema builders --------------------------------------------------- */
const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z })

function xf(id: string, pos: Vec3 = v3(), extra: Record<string, ParamDef> = {}): Folder {
  return folder('Transform', {
    [`${id}_pos`]: p.vec3(pos, { step: 0.01, label: 'Position' }),
    [`${id}_rot`]: p.vec3(v3(), { step: 1, label: 'Rotation' }),
    [`${id}_scale`]: p.vec3(v3(1, 1, 1), { step: 0.01, label: 'Scale' }),
    [`${id}_visible`]: p.boolean(true, { label: 'Visible' }),
    [`${id}_locked`]: p.boolean(false, { label: 'Locked' }),
    ...extra,
  })
}

interface Mat { type: MatType; color: string; rough: number; metal: number; clearcoat?: number; sheen?: number; transmission?: number; emission?: number }
function mat(id: string, m: Mat): Folder {
  const is = (t: MatType) => (v: V) => v[`${id}_mtype`] === t
  const notToon = (v: V) => v[`${id}_mtype`] !== 'toon'
  return folder('Material', {
    [`${id}_mtype`]: p.select(m.type, [{ value: 'standard', label: 'Standard' }, { value: 'physical', label: 'Physical' }, { value: 'toon', label: 'Toon' }], { label: 'Type', display: 'segmented', hint: 'Standard is cheapest. Physical adds clearcoat, sheen and glass. Toon flattens shading into bands.' }),
    [`${id}_color`]: p.color(m.color, { alpha: false, label: 'Colour' }),
    [`${id}_rough`]: p.number(m.rough, { min: 0, max: 1, step: 0.01, label: 'Roughness', when: notToon, hint: '0 is a mirror, 1 is chalk.' }),
    [`${id}_metal`]: p.number(m.metal, { min: 0, max: 1, step: 0.01, label: 'Metalness', when: notToon }),
    [`${id}_clearcoat`]: p.number(m.clearcoat ?? 0, { min: 0, max: 1, step: 0.01, label: 'Clearcoat', when: is('physical'), hint: 'A thin lacquer layer over the base — car paint, glazed ceramic.' }),
    [`${id}_sheen`]: p.number(m.sheen ?? 0, { min: 0, max: 1, step: 0.01, label: 'Sheen', when: is('physical'), hint: 'Soft rim highlight of fabric and velvet.' }),
    [`${id}_transmission`]: p.number(m.transmission ?? 0, { min: 0, max: 1, step: 0.01, label: 'Transmission', when: is('physical'), hint: 'Lets light through, like frosted glass. Costs an extra render pass.' }),
    [`${id}_bands`]: p.number(3, { min: 2, max: 6, step: 1, label: 'Bands', when: is('toon'), display: 'stepper', hint: 'How many flat tones the toon shader steps through.' }),
    [`${id}_emission`]: p.number(m.emission ?? 0, { min: 0, max: 6, step: 0.05, label: 'Emission', hint: 'Self-illumination in the material colour. Above ~1.5 it feeds the glow.' }),
  })
}

interface Lite { type: LightType; color: string; intensity: number; shadow: boolean; angle?: number }
function light(id: string, l: Lite): Folder {
  return folder('Light', {
    [`${id}_ltype`]: p.select(l.type, [{ value: 'directional', label: 'Directional' }, { value: 'spot', label: 'Spot' }, { value: 'point', label: 'Point' }], { label: 'Type', display: 'dropdown' }),
    [`${id}_intensity`]: p.number(l.intensity, { min: 0, max: 10, step: 0.05, label: 'Intensity', hint: 'Brightness at the subject. Spot and point lights are compensated for distance, so switching type keeps the exposure.' }),
    [`${id}_lcolor`]: p.color(l.color, { alpha: false, label: 'Colour' }),
    [`${id}_shadow`]: p.boolean(l.shadow, { label: 'Cast shadow', when: (v: V) => v.shadows }),
    [`${id}_angle`]: p.number(l.angle ?? 32, { min: 5, max: 80, step: 1, unit: '°', label: 'Cone', when: (v: V) => v[`${id}_ltype`] === 'spot' }),
    [`${id}_penumbra`]: p.number(0.65, { min: 0, max: 1, step: 0.01, label: 'Edge softness', when: (v: V) => v[`${id}_ltype`] === 'spot' }),
  })
}

const schema = defineSchema({
  speaker_xf: xf('speaker', v3(0, 0.6, 0)),
  body_xf: xf('body'), body_mat: mat('body', { type: 'standard', color: '#c9a14a', rough: 0.26, metal: 1 }),
  cap_xf: xf('cap'), cap_mat: mat('cap', { type: 'physical', color: '#5a3a26', rough: 0.42, metal: 0, clearcoat: 0.5 }),
  ring_xf: xf('ring'), ring_mat: mat('ring', { type: 'standard', color: '#d6b260', rough: 0.22, metal: 1 }),
  base_xf: xf('base'), base_mat: mat('base', { type: 'standard', color: '#8a6a35', rough: 0.35, metal: 1 }),
  pedestal_xf: xf('pedestal'), pedestal_mat: mat('pedestal', { type: 'standard', color: '#ffd84d', rough: 0.9, metal: 0 }),
  floor: folder('Shadow catcher', {
    floor_visible: p.boolean(true, { label: 'Visible' }),
    floor_locked: p.boolean(true, { label: 'Locked' }),
    floor_opacity: p.number(0.32, { min: 0, max: 1, step: 0.01, label: 'Shadow', when: (v: V) => v.shadows, hint: 'Opacity of the shadow on the invisible ground plane.' }),
  }),
  key_xf: xf('key', v3(3.2, 4.8, 2.6)), key_light: light('key', { type: 'spot', color: '#fff3e2', intensity: 3.2, shadow: true, angle: 30 }),
  rim_xf: xf('rim', v3(-3.4, 3.4, -3.2)), rim_light: light('rim', { type: 'spot', color: '#d9e6ff', intensity: 2.2, shadow: false, angle: 34 }),
  fill_xf: xf('fill', v3(-3.2, 1.8, 3.6)), fill_light: light('fill', { type: 'point', color: '#ffffff', intensity: 0.5, shadow: false }),

  /* scene settings — the inspector with nothing selected (Spline) */
  look: folder('Background', {
    bg: p.color('#ffd000', { alpha: false, label: 'Colour', hint: 'Also the colour behind a transparent export.' }),
  }),
  env: folder('Environment', {
    envIntensity: p.number(0.8, { min: 0, max: 3, step: 0.01, label: 'Intensity', hint: 'Strength of the studio reflection map (RoomEnvironment).' }),
    envRotation: p.angle(0, { label: 'Rotation' }),
  }),
  render: folder('Rendering', {
    toneMapping: p.select('neutral', [{ value: 'aces', label: 'ACES' }, { value: 'agx', label: 'AgX' }, { value: 'neutral', label: 'Neutral' }, { value: 'none', label: 'None' }], { label: 'Tone map', display: 'dropdown', hint: 'Neutral keeps product colours truest; ACES and AgX are more filmic.' }),
    exposure: p.number(1, { min: 0.1, max: 3, step: 0.01, label: 'Exposure' }),
    shadows: p.boolean(true, { label: 'Shadows' }),
    shadowSoft: p.number(5, { min: 0, max: 16, step: 0.5, label: 'Softness', when: (v: V) => v.shadows }),
    glow: p.number(0, { min: 0, max: 2, step: 0.01, more: true, label: 'Glow', hint: 'Bloom on emissive and very bright pixels.' }),
  }),
  viewport: folder('Viewport', {
    grid: p.boolean(false, { label: 'Grid floor' }),
    turntable: p.boolean(false, { label: 'Turntable', hint: 'Slowly orbit the camera — for presenting.' }),
    spin: p.number(1.2, { min: 0.1, max: 6, step: 0.1, label: 'Speed', when: (v: V) => v.turntable }),
  }, { place: 'settings' }),
  camera: folder('Lens', {
    projection: p.select('perspective', [{ value: 'perspective', label: 'Perspective' }, { value: 'orthographic', label: 'Orthographic' }], { label: 'Projection', display: 'segmented' }),
    fov: p.number(30, { min: 12, max: 75, step: 1, unit: '°', label: 'Field of view', when: (v: V) => v.projection === 'perspective', hint: 'Narrow lenses flatten the product, like a long portrait lens.' }),
  }),
})

// v2: Campana's bell; v1 was a speaker
export const params = createParams(schema as Schema, { id: 'scene', version: 2, historyLimit: 200 }) as unknown as ParamStore<Schema, V>

/* --- colourways: partial patches, so they never touch transforms ---------- */
export interface Colourway { id: string; name: string; values: V }
export const COLOURWAYS: Colourway[] = [
  { id: 'brass', name: 'Brass', values: { body_color: '#c9a14a', cap_color: '#5a3a26', ring_color: '#d6b260', base_color: '#8a6a35', pedestal_color: '#ffd84d', bg: '#ffd000' } },
  { id: 'achiote', name: 'Achiote', values: { body_color: '#f6571c', cap_color: '#222020', ring_color: '#d6b260', base_color: '#8a6a35', pedestal_color: '#e5e3e2', bg: '#f5f3f2' } },
  { id: 'cielo', name: 'Cielo', values: { body_color: '#5070f0', cap_color: '#e4e2e1', ring_color: '#c5c3c2', base_color: '#6c6a69', pedestal_color: '#e5e3e2', bg: '#f5f3f2' } },
  { id: 'nogal', name: 'Nogal', values: { body_color: '#5b4a32', cap_color: '#171615', ring_color: '#8a6a35', base_color: '#3b2f22', pedestal_color: '#2a2420', bg: '#131211' } },
  { id: 'lana', name: 'Lana', values: { body_color: '#ebe9e8', cap_color: '#8a5a3a', ring_color: '#c9a14a', base_color: '#8a6a35', pedestal_color: '#f5f3f2', bg: '#d9d7d6' } },
]
export const colourwayOf = (v: V) => COLOURWAYS.find((c) => Object.entries(c.values).every(([k, x]) => String(v[k]).toLowerCase() === String(x).toLowerCase()))?.id ?? null

/* --- camera views (bookmarks) ------------------------------------------- */
export type XYZ = [number, number, number]
export interface Pose { position: XYZ; target: XYZ }
export interface View extends Pose { id: string; name: string; builtin?: boolean }
export const BUILTIN_VIEWS: View[] = [
  { id: 'hero', name: 'Hero', builtin: true, position: [4.9, 3.6, 5.9], target: [0, 1.45, 0] },
  { id: 'front', name: 'Front', builtin: true, position: [0, 1.6, 8.6], target: [0, 1.5, 0] },
  { id: 'detail', name: 'Handle detail', builtin: true, position: [1.2, 2.9, 1.6], target: [0, 2.15, 0] },
  { id: 'low', name: 'Low angle', builtin: true, position: [-3.6, 0.35, 4.2], target: [0, 1.0, 0] },
]

/* --- editor ui ----------------------------------------------------------- */
export type Tool = 'select' | 'translate' | 'rotate' | 'scale'
/** px of the viewport covered by chrome, for the camera's view offset */
export interface Insets { l: number; r: number; t: number; b: number }
interface UI {
  /** the viewport is mounted (its handle is reachable through the MountSurface ref) */
  ready: boolean
  selected: string | null
  tool: Tool
  insets: Insets
  names: Record<string, string>
  views: View[]
  thumbs: Record<string, string>
  activeView: string | null
  preview: string | null
  stats: { tris: number; meshes: number; lights: number }
}
const LSK = 'studio:scene:ui'
// Guard the shape: a corrupt key must not crash the shell on every load (break-it S1).
const saved = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(LSK) || '{}')
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {} as Partial<UI>
    return {
      names: v.names && typeof v.names === 'object' && !Array.isArray(v.names) ? v.names : undefined,
      views: Array.isArray(v.views) ? v.views : undefined,
      thumbs: v.thumbs && typeof v.thumbs === 'object' && !Array.isArray(v.thumbs) ? v.thumbs : undefined,
    } as Partial<UI>
  } catch { return {} as Partial<UI> }
})()
export const ui = createStore<UI>(() => ({
  ready: false,
  selected: null,
  tool: 'translate',
  insets: { l: 0, r: 0, t: 0, b: 0 },
  names: saved.names ?? {},
  views: saved.views ?? [],
  thumbs: {},
  activeView: 'hero',
  preview: null,
  stats: { tris: 0, meshes: 0, lights: 0 },
}))
ui.subscribe((s, prev) => {
  if (s.names === prev.names && s.views === prev.views) return
  saveLocal(LSK, JSON.stringify({ names: s.names, views: s.views }))
})

export const nameOf = (id: string) => ui.getState().names[id] ?? OBJ[id]?.name ?? id
export const allViews = () => [...BUILTIN_VIEWS, ...ui.getState().views]
