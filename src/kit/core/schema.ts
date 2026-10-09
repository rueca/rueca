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
  /** Remember in localStorage (default true; false for big or private values — images default false). */
  persist?: boolean
  /** Include in share links (default true; images and data default false). */
  share?: boolean
}

export type Option = string | { value: string; label?: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; swatch?: string }

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
}
export interface RangeDef extends Base<[number, number]> { type: 'range'; min: number; max: number; step?: number; unit?: string; fmt?: (v: number) => string }
export interface AngleDef extends Base<number> { type: 'angle' }
export interface Vec2Def extends Base<{ x: number; y: number }> { type: 'vec2'; min?: number; max?: number; step?: number; display?: 'pad' | 'fields'; labels?: [string, string] }
export interface Vec3Def extends Base<{ x: number; y: number; z: number }> { type: 'vec3'; step?: number; min?: number; max?: number }
export interface SizeDef extends Base<{ w: number; h: number }> { type: 'size'; min?: number; max?: number; lock?: boolean; unit?: string; presets?: { label: string; w: number; h: number }[] }
export interface ColorDef extends Base<string> { type: 'color'; alpha?: boolean }
export interface PaletteDef extends Base<string[]> { type: 'palette'; max?: number }
export interface GradientDef extends Base<{ angle: number; stops: { pos: number; color: string }[] }> { type: 'gradient' }
export interface SelectDef extends Base<string> { type: 'select'; options: Option[]; display?: 'segmented' | 'dropdown' | 'tiles' | 'swatches' }
export interface MultiDef extends Base<string[]> { type: 'multi'; options: Option[]; min?: number; display?: 'tiles' | 'chips' }
export interface BoolDef extends Base<boolean> { type: 'boolean'; display?: 'switch' | 'checkbox' }
export interface TextDef extends Base<string> { type: 'text'; multiline?: boolean; placeholder?: string; maxLength?: number; mono?: boolean }
export interface SeedDef extends Base<number> { type: 'seed' }
export interface CurveDef extends Base<[number, number, number, number]> { type: 'curve'; presets?: Record<string, [number, number, number, number]> }
export interface SpringDef extends Base<{ stiffness: number; damping: number; mass: number }> { type: 'spring' }
export interface ImageDef extends Base<string | null> { type: 'image'; accept?: string }
/** Opaque document value — never rendered as a row, but undoable, persisted and (optionally) shared.
    Use for collections (a layer stack, clips, pattern steps) that other UI edits. */
export interface DataDef<T = unknown> extends Base<T> { type: 'data' }
export interface ActionDef { type: 'action'; label: string; onClick: (v: any) => void; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; variant?: 'primary' | 'default'; when?: (v: any) => boolean; value?: undefined }
export interface MonitorDef { type: 'monitor'; label?: string; get: () => number | string; graph?: boolean; min?: number; max?: number; fmt?: (v: number) => string; hint?: string; when?: (v: any) => boolean; value?: undefined }

export type ValueDef =
  | NumberDef | RangeDef | AngleDef | Vec2Def | Vec3Def | SizeDef | ColorDef | PaletteDef | GradientDef
  | SelectDef | MultiDef | BoolDef | TextDef | SeedDef | CurveDef | SpringDef | ImageDef | DataDef<any>
export type ParamDef = ValueDef | ActionDef | MonitorDef

export interface Folder<P extends Record<string, ParamDef> = Record<string, ParamDef>> {
  kind: 'folder'
  label: string
  params: P
  collapsed?: boolean
  hint?: string
  when?: (v: any) => boolean
}

type Opt<D> = Omit<D, 'type' | 'value'>

/* --- builders: terse and typed. Agents (and people) write these. --- */
export const p = {
  number: (value: number, o: Opt<NumberDef> = {}): NumberDef => ({ type: 'number', value, ...o }),
  range: (value: [number, number], o: Opt<RangeDef>): RangeDef => ({ type: 'range', value, ...o }),
  angle: (value: number, o: Opt<AngleDef> = {}): AngleDef => ({ type: 'angle', value, ...o }),
  vec2: (value: { x: number; y: number }, o: Opt<Vec2Def> = {}): Vec2Def => ({ type: 'vec2', value, ...o }),
  vec3: (value: { x: number; y: number; z: number }, o: Opt<Vec3Def> = {}): Vec3Def => ({ type: 'vec3', value, ...o }),
  size: (value: { w: number; h: number }, o: Opt<SizeDef> = {}): SizeDef => ({ type: 'size', value, ...o }),
  color: (value: string, o: Opt<ColorDef> = {}): ColorDef => ({ type: 'color', value, ...o }),
  palette: (value: string[], o: Opt<PaletteDef> = {}): PaletteDef => ({ type: 'palette', value, ...o }),
  gradient: (value: GradientDef['value'], o: Opt<GradientDef> = {}): GradientDef => ({ type: 'gradient', value, ...o }),
  select: <T extends string>(value: T, options: Option[], o: Omit<Opt<SelectDef>, 'options'> = {}): SelectDef => ({ type: 'select', value, options, ...o }),
  multi: (value: string[], options: Option[], o: Omit<Opt<MultiDef>, 'options'> = {}): MultiDef => ({ type: 'multi', value, options, ...o }),
  boolean: (value: boolean, o: Opt<BoolDef> = {}): BoolDef => ({ type: 'boolean', value, ...o }),
  text: (value: string, o: Opt<TextDef> = {}): TextDef => ({ type: 'text', value, ...o }),
  seed: (value = 1, o: Opt<SeedDef> = {}): SeedDef => ({ type: 'seed', value, ...o }),
  curve: (value: [number, number, number, number], o: Opt<CurveDef> = {}): CurveDef => ({ type: 'curve', value, ...o }),
  spring: (value: SpringDef['value'], o: Opt<SpringDef> = {}): SpringDef => ({ type: 'spring', value, ...o }),
  /** images are kept out of localStorage and share links by default (quota, privacy) */
  image: (value: string | null = null, o: Opt<ImageDef> = {}): ImageDef => ({ type: 'image', value, persist: false, share: false, ...o }),
  /** hidden document value: `p.data<Layer[]>([])` — typed, undoable, persisted, not rendered */
  data: <T,>(value: T, o: Opt<DataDef<T>> = {}): DataDef<T> => ({ type: 'data', value, share: false, ...o }),
  action: (label: string, onClick: (v: any) => void, o: Omit<ActionDef, 'type' | 'label' | 'onClick'> = {}): ActionDef => ({ type: 'action', label, onClick, ...o }),
  monitor: (get: () => number | string, o: Omit<MonitorDef, 'type' | 'get'> = {}): MonitorDef => ({ type: 'monitor', get, ...o }),
}

export const folder = <P extends Record<string, ParamDef>>(
  label: string,
  params: P,
  o: { collapsed?: boolean; hint?: string; when?: (v: any) => boolean } = {},
): Folder<P> => ({ kind: 'folder', label, params, ...o })

/* --- typing: flatten folders into one values object --- */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never
type ValuesOfParams<P> = { [K in keyof P as P[K] extends ValueDef ? K : never]: P[K] extends { value: infer V } ? V : never }
export type SchemaValues<S extends Schema> = UnionToIntersection<{ [F in keyof S]: ValuesOfParams<S[F]['params']> }[keyof S]> & {}

export type Schema = Record<string, Folder>

export function defineSchema<S extends Schema>(schema: S): S {
  const seen = new Set<string>()
  for (const f of Object.values(schema))
    for (const k of Object.keys(f.params)) {
      if (seen.has(k)) throw new Error(`defineSchema: duplicate key "${k}" — keys are flat across folders`)
      seen.add(k)
    }
  return schema
}

export const isValueDef = (d: ParamDef): d is ValueDef => d.type !== 'action' && d.type !== 'monitor'

export function defaultsOf<S extends Schema>(schema: S): SchemaValues<S> {
  const out: Values = {}
  for (const f of Object.values(schema))
    for (const [k, d] of Object.entries(f.params)) if (isValueDef(d)) out[k] = structuredClone(d.value)
  return out as SchemaValues<S>
}

export function defIndex(schema: Schema): Record<string, ParamDef> {
  const out: Record<string, ParamDef> = {}
  for (const f of Object.values(schema)) Object.assign(out, f.params)
  return out
}

export const humanize = (key: string) =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())

export const equal = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b)
