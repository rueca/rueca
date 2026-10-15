/* ---------------------------------------------------------------------------
   The parameter schema. One table drives everything: inspector rows, defaults,
   per-section reset, the changed-from-default cue, undo, presets, URL share
   and JSON export. Adding a knob is one line here and nothing else.

     const schema = defineSchema({
       geometry: folder('Geometry', {
         radius: p.number(102, { min: 0, max: 190, unit: 'px', hint: 'Inner radius kept clear.' }),
         shape:  p.select('circle', ['circle', 'square']),
       }),
     })

   Keys are flat across folders, so render code reads `v.radius`, not
   `v.geometry.radius`. Duplicate keys throw at definition time.
--------------------------------------------------------------------------- */

import type React from 'react'

export type Values = Record<string, unknown>

interface Base<V> {
  value: V
  label?: string
  /** One sentence. Shown as the row tooltip — six months on, this is the documentation. */
  hint?: string
  /** Hide the row unless this returns true. Receives all current values. */
  when?: (v: any) => boolean
  disabled?: boolean | ((v: any) => boolean)
  /** false = expensive: the artifact should apply on commit (pointer up), not every frame. */
  live?: boolean
  /** Expose in the simplified client / present view (Nodes.io "publish"). */
  publish?: boolean
  /** A detail of its section: kept under the section's "N more" row until opened. A changed value always
      stays in view, so nothing hidden is ever off its default without showing. */
  more?: boolean
  /** Remember in localStorage (default true; false for big or private values — images default false). */
  persist?: boolean
  /** Include in share links (default true; images default false). */
  share?: boolean
}

export type Option<T extends string = string> = T | { value: T; label?: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; swatch?: string }

export interface NumberDef extends Base<number> {
  type: 'number'
  min?: number
  max?: number
  step?: number
  unit?: string
  fmt?: (v: number) => string
  /** inverse of fmt for typed input, e.g. percent fields: (s) => parseFloat(s) / 100 */
  parse?: (s: string) => number | null
  /** slider = rail + scrubbable value (default when min & max exist); field = scrubbable box only; stepper = − value + ; knob = rotary */
  display?: 'slider' | 'field' | 'stepper' | 'knob'
  /** log = perceptual taper for frequencies, sizes, time constants (min must be > 0) */
  scale?: 'linear' | 'log'
  /** soft range for dragging; typed values may go out to min/max (Blender) */
  soft?: [number, number]
  /** paint the slider track (a CSS gradient) — Temp, Tint, Hue rows */
  track?: string
  /** named stops, evenly spaced on the track whatever their values: an elevation ladder
      `[{ value: -3, label: 'Inset' }, { value: 0, label: 'Flat' }, …, { value: 40, label: 'Modal' }]`.
      The thumb snaps near each one. min / max default to the first and last stop. */
  detents?: ({ value: number; label?: string } | number)[]
  /** with detents: near = snap within reach of a stop, values between pass (default); only = the stops alone */
  snap?: 'near' | 'only'
}
export interface RangeDef extends Base<[number, number]> { type: 'range'; min: number; max: number; step?: number; unit?: string; fmt?: (v: number) => string }
export interface AngleDef extends Base<number> { type: 'angle' }
export interface Vec2Def extends Base<{ x: number; y: number }> { type: 'vec2'; min?: number; max?: number; step?: number; display?: 'pad' | 'fields'; labels?: [string, string] }
export interface Vec3Def extends Base<{ x: number; y: number; z: number }> { type: 'vec3'; step?: number; min?: number; max?: number }
export interface SizeDef extends Base<{ w: number; h: number }> { type: 'size'; min?: number; max?: number; lock?: boolean; unit?: string; presets?: { label: string; w: number; h: number }[] }
export interface ColorDef extends Base<string> { type: 'color'; alpha?: boolean }
export interface PaletteDef extends Base<string[]> { type: 'palette'; max?: number }
export interface GradientDef extends Base<{ angle: number; stops: { pos: number; color: string }[] }> { type: 'gradient' }
export interface SelectDef<T extends string = string> extends Base<T> { type: 'select'; options: Option<T>[]; display?: 'segmented' | 'dropdown' | 'tiles' | 'swatches' }
export interface MultiDef<T extends string = string> extends Base<T[]> { type: 'multi'; options: Option<T>[]; min?: number; display?: 'tiles' | 'chips' }
export interface BoolDef extends Base<boolean> { type: 'boolean'; display?: 'switch' | 'checkbox' }
export interface TextDef extends Base<string> { type: 'text'; multiline?: boolean; placeholder?: string; maxLength?: number; mono?: boolean }
export interface SeedDef extends Base<number> { type: 'seed' }
export interface CurveDef extends Base<[number, number, number, number]> { type: 'curve'; presets?: Record<string, [number, number, number, number]> }
export interface SpringDef extends Base<{ stiffness: number; damping: number; mass: number }> { type: 'spring' }
export interface ImageDef extends Base<string | null> { type: 'image'; accept?: string }
/** Opaque document value — never rendered as a row, but undoable, persisted and shared
   (`share: false` keeps a large one out of links).
    Use for collections (a layer stack, clips, pattern steps) that other UI edits. */
export interface DataDef<T = unknown> extends Base<T> {
  type: 'data'
  /** deep check for values arriving from storage, links or imports — return false to reject.
      Without one, only the shape family (array / object / primitive) is checked. */
  validate?: (v: unknown) => boolean
}
export interface ActionDef { type: 'action'; label: string; onClick: (v: any) => void; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; variant?: 'primary' | 'default'; when?: (v: any) => boolean; value?: undefined }
export interface MonitorDef { type: 'monitor'; label?: string; get: () => number | string; graph?: boolean; min?: number; max?: number; fmt?: (v: number) => string; hint?: string; when?: (v: any) => boolean; value?: undefined }

export type ValueDef =
  | NumberDef | RangeDef | AngleDef | Vec2Def | Vec3Def | SizeDef | ColorDef | PaletteDef | GradientDef
  | SelectDef | MultiDef | BoolDef | TextDef | SeedDef | CurveDef | SpringDef | ImageDef | DataDef<any>
export type ParamDef = ValueDef | ActionDef | MonitorDef

export interface FolderOptions {
  collapsed?: boolean
  hint?: string
  when?: (v: any) => boolean
  /** key of a boolean param in this folder that turns the whole section on and off. It renders as a switch in
      the header; while it's off the section stays closed and shows only that switch (vignette, grain, delay). */
  toggle?: string
  /** 'settings': view and document preferences (grid, snap, fps, units). Kept out of the Inspector and shown by
      <SettingsMenu> in the toolbar instead. An Inspector that names the folder in `folders` still renders it. */
  place?: 'settings'
}

export interface Folder<P extends Record<string, ParamDef> = Record<string, ParamDef>> extends FolderOptions {
  kind: 'folder'
  label: string
  params: P
}

type Opt<D> = Omit<D, 'type' | 'value'>

const detentValues = (d: NumberDef['detents']) => (d ?? []).map((x) => (typeof x === 'number' ? x : x.value)).filter(Number.isFinite)
/** min / max from the first and last stop, for `p.number(…, { detents })` */
const detentBounds = (d: NumberDef['detents']): { min?: number; max?: number } => {
  const vs = detentValues(d)
  return vs.length ? { min: Math.min(...vs), max: Math.max(...vs) } : {}
}

/* --- builders: terse and typed. Agents (and people) write these. --- */
export const p = {
  number: (value: number, o: Opt<NumberDef> = {}): NumberDef => ({ type: 'number', value, ...detentBounds(o.detents), ...o }),
  range: (value: [number, number], o: Opt<RangeDef>): RangeDef => ({ type: 'range', value, ...o }),
  angle: (value: number, o: Opt<AngleDef> = {}): AngleDef => ({ type: 'angle', value, ...o }),
  vec2: (value: { x: number; y: number }, o: Opt<Vec2Def> = {}): Vec2Def => ({ type: 'vec2', value, ...o }),
  vec3: (value: { x: number; y: number; z: number }, o: Opt<Vec3Def> = {}): Vec3Def => ({ type: 'vec3', value, ...o }),
  size: (value: { w: number; h: number }, o: Opt<SizeDef> = {}): SizeDef => ({ type: 'size', value, ...o }),
  color: (value: string, o: Opt<ColorDef> = {}): ColorDef => ({ type: 'color', value, ...o }),
  palette: (value: string[], o: Opt<PaletteDef> = {}): PaletteDef => ({ type: 'palette', value, ...o }),
  gradient: (value: GradientDef['value'], o: Opt<GradientDef> = {}): GradientDef => ({ type: 'gradient', value, ...o }),
  /** values are typed from the options: `p.select('circle', ['circle', 'square'])` → 'circle' | 'square' */
  select: <const T extends string>(value: NoInfer<T>, options: readonly Option<T>[], o: Omit<Opt<SelectDef<T>>, 'options'> = {}): SelectDef<T> => ({ type: 'select', value, options: [...options], ...o }),
  multi: <const T extends string>(value: NoInfer<T>[], options: readonly Option<T>[], o: Omit<Opt<MultiDef<T>>, 'options'> = {}): MultiDef<T> => ({ type: 'multi', value, options: [...options], ...o }),
  boolean: (value: boolean, o: Opt<BoolDef> = {}): BoolDef => ({ type: 'boolean', value, ...o }),
  text: (value: string, o: Opt<TextDef> = {}): TextDef => ({ type: 'text', value, ...o }),
  seed: (value = 1, o: Opt<SeedDef> = {}): SeedDef => ({ type: 'seed', value, ...o }),
  curve: (value: [number, number, number, number], o: Opt<CurveDef> = {}): CurveDef => ({ type: 'curve', value, ...o }),
  spring: (value: SpringDef['value'], o: Opt<SpringDef> = {}): SpringDef => ({ type: 'spring', value, ...o }),
  /** images are kept out of localStorage and share links by default (quota, privacy) */
  image: (value: string | null = null, o: Opt<ImageDef> = {}): ImageDef => ({ type: 'image', value, persist: false, share: false, ...o }),
  /** hidden document value: `p.data<Layer[]>([])` — typed, undoable, persisted, not rendered */
  data: <T,>(value: T, o: Opt<DataDef<T>> = {}): DataDef<T> => ({ type: 'data', value, ...o }),
  action: (label: string, onClick: (v: any) => void, o: Omit<ActionDef, 'type' | 'label' | 'onClick'> = {}): ActionDef => ({ type: 'action', label, onClick, ...o }),
  monitor: (get: () => number | string, o: Omit<MonitorDef, 'type' | 'get'> = {}): MonitorDef => ({ type: 'monitor', get, ...o }),
}

export const folder = <P extends Record<string, ParamDef>>(
  label: string,
  params: P,
  o: FolderOptions = {},
): Folder<P> => ({ kind: 'folder', label, params, ...o })

/* --- typing: flatten folders into one values object --- */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never
type ValuesOfParams<P> = { [K in keyof P as P[K] extends ValueDef ? K : never]: P[K] extends { value: infer V } ? V : never }
export type SchemaValues<S extends Schema> = UnionToIntersection<{ [F in keyof S]: ValuesOfParams<S[F]['params']> }[keyof S]> & {}

export type Schema = Record<string, Folder>

export function defineSchema<S extends Schema>(schema: S): S {
  const seen = new Set<string>()
  for (const f of Object.values(schema)) {
    for (const k of Object.keys(f.params)) {
      if (seen.has(k)) throw new Error(`defineSchema: duplicate key "${k}" — keys are flat across folders`)
      seen.add(k)
    }
    if (f.toggle && f.params[f.toggle]?.type !== 'boolean')
      throw new Error(`defineSchema: folder "${f.label}" toggles on "${f.toggle}", which isn't a boolean param in that folder`)
  }
  return schema
}

export const isValueDef = (d: ParamDef): d is ValueDef => d.type !== 'action' && d.type !== 'monitor'

export interface FolderLayout {
  /** the folder's on/off switch, if it has one, and whether it's on */
  toggle?: { key: string; on: boolean }
  /** rows to render, in schema order (excludes the toggle; empty while the toggle is off) */
  rows: string[]
  /** `more` rows waiting under the "N more" row: active, unchanged and not opened */
  more: string[]
  /** how many rows the "N more" row governs (whether open or not); 0 = no "more" row */
  moreCount: number
  /** something that affects the output differs from its default — the header dot. Rows hidden by `when`
      or by an off toggle don't count: there'd be nothing in view to explain the dot. */
  changed: boolean
  /** every value key in the folder, for "Reset section" */
  valueKeys: string[]
}

/** Which rows of a folder show, which wait under "N more", and whether its header gets the changed dot. */
export function layoutFolder(
  f: Folder, values: Values, defaults: Values,
  o: { keys?: string[]; published?: boolean; moreOpen?: boolean } = {},
): FolderLayout {
  const entries = Object.entries(f.params).filter(([k, d]) => d.type !== 'data' && (!o.keys || o.keys.includes(k)) && (!o.published || ('publish' in d && d.publish)))
  const changedKey = (k: string) => !equal(values[k], defaults[k])
  const active = ([, d]: [string, ParamDef]) => !d.when || d.when(values)
  const toggleDef = f.toggle ? f.params[f.toggle] : undefined
  const toggle = f.toggle && toggleDef?.type === 'boolean' && !o.published ? { key: f.toggle, on: values[f.toggle] === true } : undefined
  const body = entries.filter(([k]) => k !== toggle?.key)
  const live = toggle && !toggle.on ? [] : body.filter(active)
  const rows: string[] = [], more: string[] = []
  let moreCount = 0
  for (const [k, d] of live) {
    const extra = isValueDef(d) && d.more && !o.published && !changedKey(k)
    if (extra) moreCount++
    if (extra && !o.moreOpen) more.push(k)
    else rows.push(k)
  }
  const counted = [...(toggle ? [toggle.key] : []), ...live.filter(([, d]) => isValueDef(d)).map(([k]) => k)]
  return {
    toggle,
    rows,
    more,
    moreCount,
    changed: counted.some(changedKey),
    valueKeys: entries.filter(([, d]) => isValueDef(d)).map(([k]) => k),
  }
}

export function defaultsOf<S extends Schema>(schema: S): SchemaValues<S> {
  const out: Values = {}
  for (const f of Object.values(schema))
    for (const [k, d] of Object.entries(f.params)) if (isValueDef(d)) out[k] = structuredClone(d.value)
  return out as SchemaValues<S>
}

export function defIndex(schema: Schema): Record<string, ParamDef> {
  // no prototype: a saved or linked key like "constructor" or "toString" must not find Object's (break-it B5-05)
  const out: Record<string, ParamDef> = Object.create(null)
  for (const f of Object.values(schema)) Object.assign(out, f.params)
  return out
}

/** `fontSize` → "Font size" (sentence case, the kit's rule); acronyms stay ("bgURL" → "Bg URL"). */
export const humanize = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map((w, i) => (w.length > 1 && w === w.toUpperCase() ? w : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ')

export const equal = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b)

/* ---------------------------------------------------------------------------
   Validation. Every way a value enters a store — setValue, patch, presets,
   localStorage, share links, the iframe bridge — goes through coerce(). A
   string from an <input> ("30") becomes 30; a value that can't be made to fit
   the def is REJECTED (the store keeps its current value) instead of reaching
   a renderer that would crash on it. (Break-it QA round, DX1.)
--------------------------------------------------------------------------- */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}
const nums = (v: unknown, n: number): number[] | undefined => {
  if (!Array.isArray(v) || v.length !== n) return undefined
  const out = v.map(num)
  return out.every((x) => x !== undefined) ? (out as number[]) : undefined
}
const obj = (v: unknown, keys: string[]): Record<string, number> | undefined => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const out: Record<string, number> = {}
  for (const k of keys) { const n = num((v as Record<string, unknown>)[k]); if (n === undefined) return undefined; out[k] = n }
  return out
}
/** clamp every number in a record to the def's min / max (break-it B5-04: bounds held for vectors and sizes too) */
const within = <R extends Record<string, number>>(o: R, d: { min?: number; max?: number }): R => {
  const out = { ...o }
  for (const k of Object.keys(out) as (keyof R)[]) {
    let n = out[k] as number
    if (d.min !== undefined) n = Math.max(d.min, n)
    if (d.max !== undefined) n = Math.min(d.max, n)
    out[k] = n as R[keyof R]
  }
  return out
}
const optValues = (o: Option[]) => o.map((x) => (typeof x === 'string' ? x : x.value))

/** Coerce `value` to fit `def`, or report it invalid. */
export function coerce(def: ParamDef, value: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  const bad = (reason: string) => ({ ok: false as const, reason })
  if (!isValueDef(def)) return bad('not a value param')
  switch (def.type) {
    case 'number': case 'angle': case 'seed': {
      let n = num(value)
      if (n === undefined) return bad('expected a number')
      if (def.type === 'number') {
        if (def.min !== undefined) n = Math.max(def.min, n)
        if (def.max !== undefined) n = Math.min(def.max, n)
        // snap: 'only' allows the stops alone, so anything else lands on the nearest one
        const stops = def.snap === 'only' ? detentValues(def.detents) : []
        if (stops.length) n = stops.reduce((a, b) => (Math.abs(b - n!) < Math.abs(a - n!) ? b : a))
      }
      if (def.type === 'seed') n = Math.round(n)
      return { ok: true, value: n }
    }
    case 'range': { const r = nums(value, 2); if (!r) return bad('expected [lo, hi]'); const lo = Math.max(def.min, Math.min(r[0], r[1])), hi = Math.min(def.max, Math.max(r[0], r[1])); return { ok: true, value: [lo, hi] } }
    case 'curve': { const c = nums(value, 4); return c ? { ok: true, value: c } : bad('expected [x1, y1, x2, y2]') }
    case 'vec2': { const o = obj(value, ['x', 'y']); return o ? { ok: true, value: within(o, def) } : bad('expected { x, y }') }
    case 'vec3': { const o = obj(value, ['x', 'y', 'z']); return o ? { ok: true, value: within(o, def) } : bad('expected { x, y, z }') }
    case 'size': { const o = obj(value, ['w', 'h']); return o && o.w > 0 && o.h > 0 ? { ok: true, value: within(o, def) } : bad('expected { w, h } > 0') }
    case 'spring': { const o = obj(value, ['stiffness', 'damping', 'mass']); return o ? { ok: true, value: o } : bad('expected { stiffness, damping, mass }') }
    case 'color': return typeof value === 'string' && HEX.test(value.trim()) ? { ok: true, value: value.trim() } : bad('expected a hex colour')
    case 'palette': return Array.isArray(value) && value.length > 0 && value.every((c) => typeof c === 'string' && HEX.test(c)) ? { ok: true, value: def.max ? value.slice(0, def.max) : value } : bad('expected hex colours')
    case 'gradient': {
      const g = value as { angle?: unknown; stops?: unknown }
      const angle = num(g?.angle)
      const stops = Array.isArray(g?.stops) ? g.stops.map((s: any) => ({ pos: num(s?.pos), color: s?.color })) : null
      if (angle === undefined || !stops || stops.length < 2 || stops.some((s) => s.pos === undefined || typeof s.color !== 'string' || !HEX.test(s.color))) return bad('expected { angle, stops[] }')
      return { ok: true, value: { angle, stops } }
    }
    case 'select': { const s = typeof value === 'number' ? String(value) : value; return typeof s === 'string' && optValues(def.options).includes(s) ? { ok: true, value: s } : bad(`expected one of ${optValues(def.options).join(', ')}`) }
    case 'multi': {
      const ok = optValues(def.options)
      if (!Array.isArray(value) || !value.every((x) => typeof x === 'string' && ok.includes(x))) return bad('expected a subset of the options')
      const picked = [...new Set(value as string[])]
      return picked.length >= (def.min ?? 0) ? { ok: true, value: picked } : bad(`expected at least ${def.min} options`)
    }
    case 'boolean': return typeof value === 'boolean' ? { ok: true, value } : value === 'true' || value === 'false' ? { ok: true, value: value === 'true' } : bad('expected true / false')
    case 'text': { if (typeof value === 'number') value = String(value); if (typeof value !== 'string') return bad('expected text'); return { ok: true, value: def.maxLength ? value.slice(0, def.maxLength) : value } }
    case 'image': return value === null || typeof value === 'string' ? { ok: true, value } : bad('expected an image URL or null')
    case 'data': {
      // Opaque, but at least the same shape family as the default (array vs object vs primitive).
      const d = def.value as unknown
      const same = Array.isArray(d) ? Array.isArray(value) : d !== null && typeof d === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : typeof value === typeof d
      if (!same) return bad('data shape does not match the default')
      if (def.validate) { try { if (!def.validate(value)) return bad('data failed its validate()') } catch { return bad('data validate() threw') } }
      return { ok: true, value }
    }
  }
}
