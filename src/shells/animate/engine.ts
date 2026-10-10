/* ---------------------------------------------------------------------------
   Keyframe engine — pure, renderer-agnostic. Everything the stage, the
   timeline, the exporters and the state-machine runtime need is a function
   of (doc, animation, t). Nothing here touches React or the DOM.
--------------------------------------------------------------------------- */
import { interpolate, formatHex8, formatHex } from 'culori'
import { cssEasing, easeAt, type Bezier, type Ease } from '@kit/core/ease'

/* ---------- model ---------- */
/** Segment easing is the kit's `Ease`: bezier | spring (Duration + Bounce) | hold. */
export type { Bezier, Ease }
export type Val = number | string
export interface Key { id: string; t: number; v: Val; ease: Ease }

export type PropKey = 'x' | 'y' | 'rotation' | 'scale' | 'opacity' | 'w' | 'h' | 'radius' | 'fill' | 'stroke' | 'strokeWidth'
export type ObjKind = 'group' | 'rect' | 'ellipse' | 'path' | 'text' | 'image'

export interface Obj {
  id: string
  name: string
  kind: ObjKind
  parent: string | null
  visible: boolean
  locked: boolean
  base: Partial<Record<PropKey, Val>>
  /** path data, centred on the origin */
  d?: string
  /** text content; `{turns}` binds to a state-machine number input */
  text?: string
  fontSize?: number
  fontWeight?: number
  align?: 'start' | 'middle'
  /** 'hand' sets the text in the handwriting face (La Belle Aurore) */
  font?: 'hand'
  shadow?: boolean
  /** image source (same-origin), drawn w × h centred on the origin */
  href?: string
  /** an alpha mask drawn under the image in the paper colour: a solid backing, so what's behind doesn't show through hatching */
  under?: string
  /** continuous rotation: when states blend, the angle always travels forward round the circle instead of unwinding */
  spin?: boolean
}

export type LoopMode = 'loop' | 'once' | 'pingpong'
export interface Anim { id: string; name: string; duration: number; loop: LoopMode; tracks: Record<string, Key[]> }

export type InputType = 'trigger' | 'boolean' | 'number'
export interface SMInput { id: string; name: string; type: InputType; value: boolean | number }
export interface Condition { input: string; op: 'fired' | 'is' | 'gt' | 'lt'; value?: boolean | number }
/** from = animation id or 'any'; `exit` waits for a one-shot animation to finish */
export interface Transition { id: string; from: string; to: string; conds: Condition[]; exit?: boolean; mix: number }
export interface StateMachine { entry: string; inputs: SMInput[]; transitions: Transition[] }

export interface Doc { width: number; height: number; objects: Obj[]; anims: Anim[]; sm: StateMachine }

/* ---------- property table ---------- */
export interface PropDef { key: PropKey; label: string; short?: string; type: 'number' | 'color'; step: number; min?: number; max?: number; unit?: string; group: 'Transform' | 'Shape' | 'Fill' | 'Stroke'; fmt?: (v: number) => string }
export const PROPS: Record<PropKey, PropDef> = {
  x: { key: 'x', label: 'Position X', short: 'X', type: 'number', step: 1, group: 'Transform' },
  y: { key: 'y', label: 'Position Y', short: 'Y', type: 'number', step: 1, group: 'Transform' },
  rotation: { key: 'rotation', label: 'Rotation', type: 'number', step: 1, unit: '°', group: 'Transform' },
  scale: { key: 'scale', label: 'Scale', type: 'number', step: 0.01, min: 0, max: 10, group: 'Transform', fmt: (v) => `${Math.round(v * 100)}%` },
  opacity: { key: 'opacity', label: 'Opacity', type: 'number', step: 0.01, min: 0, max: 1, group: 'Transform', fmt: (v) => `${Math.round(v * 100)}%` },
  w: { key: 'w', label: 'Width', short: 'W', type: 'number', step: 1, min: 0, group: 'Shape' },
  h: { key: 'h', label: 'Height', short: 'H', type: 'number', step: 1, min: 0, group: 'Shape' },
  radius: { key: 'radius', label: 'Corner radius', type: 'number', step: 1, min: 0, group: 'Shape' },
  fill: { key: 'fill', label: 'Fill', type: 'color', step: 0, group: 'Fill' },
  stroke: { key: 'stroke', label: 'Stroke', type: 'color', step: 0, group: 'Stroke' },
  strokeWidth: { key: 'strokeWidth', label: 'Stroke width', type: 'number', step: 0.5, min: 0, group: 'Stroke' },
}
const T: PropKey[] = ['x', 'y', 'rotation', 'scale', 'opacity']
export const PROPS_FOR: Record<ObjKind, PropKey[]> = {
  group: T,
  rect: [...T, 'w', 'h', 'radius', 'fill', 'stroke', 'strokeWidth'],
  ellipse: [...T, 'w', 'h', 'fill', 'stroke', 'strokeWidth'],
  path: [...T, 'fill'],
  text: [...T, 'fill'],
  image: [...T, 'w', 'h'],
}
export const DEFAULTS: Record<PropKey, Val> = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, w: 40, h: 40, radius: 0, fill: '#ffffff', stroke: '#00000000', strokeWidth: 0 }

export const trackKey = (obj: string, prop: PropKey) => `${obj}.${prop}`
export const parseTrack = (k: string) => { const i = k.lastIndexOf('.'); return { obj: k.slice(0, i), prop: k.slice(i + 1) as PropKey } }

/* ---------- interpolation ---------- */
const mixers = new Map<string, (t: number) => unknown>()
export function lerpVal(a: Val, b: Val, k: number): Val {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k
  if (typeof a === 'string' && typeof b === 'string') {
    if (k <= 0) return a
    if (k >= 1) return b
    const id = a + b
    let m = mixers.get(id)
    if (!m) { m = interpolate([a, b], 'oklab'); if (mixers.size > 400) mixers.clear(); mixers.set(id, m) }
    const c = m(Math.max(0, Math.min(1, k))) as Parameters<typeof formatHex8>[0]
    return (c && (c as { alpha?: number }).alpha !== undefined && (c as { alpha?: number }).alpha! < 1 ? formatHex8(c) : formatHex(c)) ?? b
  }
  return k < 0.5 ? a : b
}

export function sample(keys: Key[], t: number): Val {
  if (!keys.length) return 0
  if (t <= keys[0].t) return keys[0].v
  const last = keys[keys.length - 1]
  if (t >= last.t) return last.v
  let i = 0
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++
  const a = keys[i], b = keys[i + 1]
  const seg = b.t - a.t
  return lerpVal(a.v, b.v, easeAt(a.ease, (t - a.t) / seg, seg))
}

export type Resolved = Record<string, Record<PropKey, Val>>

/** Every object's props at time t of an animation (base values where unanimated). */
export function resolve(doc: Doc, anim: Anim | undefined, t: number, overrides?: Record<string, Val>): Resolved {
  const out: Resolved = {}
  for (const o of doc.objects) {
    const r = {} as Record<PropKey, Val>
    for (const p of PROPS_FOR[o.kind]) r[p] = o.base[p] ?? DEFAULTS[p]
    out[o.id] = r
  }
  if (anim) for (const [k, keys] of Object.entries(anim.tracks)) {
    const { obj, prop } = parseTrack(k)
    if (out[obj] && keys.length) out[obj][prop] = sample(keys, t)
  }
  if (overrides) for (const [k, v] of Object.entries(overrides)) { const { obj, prop } = parseTrack(k); if (out[obj]) out[obj][prop] = v }
  return out
}

export function blendResolved(a: Resolved, b: Resolved, k: number, spin?: ReadonlySet<string>): Resolved {
  if (k >= 1) return b
  const out: Resolved = {}
  for (const id of Object.keys(b)) {
    const r = {} as Record<PropKey, Val>
    for (const p of Object.keys(b[id]) as PropKey[]) {
      const from = a[id]?.[p] ?? b[id][p], to = b[id][p]
      // a spinning object never unwinds: blend the angle forward, the short way round to the next equal position
      if (p === 'rotation' && spin?.has(id) && typeof from === 'number' && typeof to === 'number') r[p] = from + ((((to - from) % 360) + 360) % 360) * k
      else r[p] = lerpVal(from, to, k)
    }
    out[id] = r
  }
  return out
}

/** Time inside an animation for a running clock, honouring loop mode. */
export function localTime(anim: Anim, elapsed: number) {
  const d = Math.max(1, anim.duration)
  if (anim.loop === 'once') return Math.min(elapsed, d)
  if (anim.loop === 'loop') return elapsed % d
  const c = elapsed % (2 * d)
  return c <= d ? c : 2 * d - c
}

/* ---------- helpers ---------- */
let uid = 0
export const newId = (p = 'k') => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`

export const childrenOf = (doc: Doc, parent: string | null) => doc.objects.filter((o) => o.parent === parent)
export const isAnimated = (anim: Anim | undefined, obj: string, prop: PropKey) => !!anim?.tracks[trackKey(obj, prop)]?.length
export const keyAt = (keys: Key[] | undefined, t: number, tol = 0.5) => keys?.find((k) => Math.abs(k.t - t) <= tol)
export const objHasKeys = (anim: Anim | undefined, obj: string) => !!anim && Object.keys(anim.tracks).some((k) => k.startsWith(obj + '.') && anim.tracks[k].length > 0)

export const fmtSec = (ms: number) => `${(ms / 1000).toFixed(2)}s`

/** Text bindings: `{name}` → the state-machine input of that name. */
export const bindText = (s: string, inputs: SMInput[]) =>
  s.replace(/\{(\w+)\}/g, (_, n) => { const i = inputs.find((x) => x.name === n); return i ? String(typeof i.value === 'number' ? Math.round(i.value) : i.value) : `{${n}}` })

/* ---------- CSS export ---------- */
/** One @keyframes per CSS property (individual `translate` / `rotate` / `scale`
    transforms), so every property keeps its own key times and easing — no
    resampling. Springs become `linear()` easings. */
export function toCSSKeyframes(doc: Doc, anim: Anim, objId: string): string {
  const obj = doc.objects.find((o) => o.id === objId)
  if (!obj) return ''
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const base = `${slug(anim.name)}-${slug(obj.name)}`
  const res = (t: number) => resolve(doc, anim, t)[objId]
  const n = (v: Val, d = 2) => Number(Number(v).toFixed(d))
  const groups: { css: string; props: PropKey[]; value: (r: Record<PropKey, Val>) => string }[] = [
    { css: 'translate', props: ['x', 'y'], value: (r) => `${n(r.x, 1)}px ${n(r.y, 1)}px` },
    { css: 'rotate', props: ['rotation'], value: (r) => `${n(r.rotation, 1)}deg` },
    { css: 'scale', props: ['scale'], value: (r) => `${n(r.scale, 3)}` },
    { css: 'opacity', props: ['opacity'], value: (r) => `${n(r.opacity, 3)}` },
    { css: obj.kind === 'rect' ? 'background-color' : 'fill', props: ['fill'], value: (r) => String(r.fill) },
    { css: 'width', props: ['w'], value: (r) => `${n(r.w, 1)}px` },
    { css: 'height', props: ['h'], value: (r) => `${n(r.h, 1)}px` },
    { css: 'border-radius', props: ['radius'], value: (r) => `${n(r.radius, 1)}px` },
    { css: 'stroke', props: ['stroke'], value: (r) => String(r.stroke) },
    { css: 'stroke-width', props: ['strokeWidth'], value: (r) => `${n(r.strokeWidth, 2)}` },
  ]
  const blocks: string[] = []
  const uses: string[] = []
  for (const g of groups) {
    const tracks = g.props.filter((p) => PROPS_FOR[obj.kind].includes(p) && isAnimated(anim, objId, p)).map((p) => anim.tracks[trackKey(objId, p)])
    if (!tracks.length) continue
    const times = [...new Set([0, anim.duration, ...tracks.flatMap((ks) => ks.map((k) => k.t))])].sort((a, b) => a - b)
    const lines = times.map((t) => {
      const owner = tracks.map((ks) => ({ ks, i: ks.findIndex((k) => Math.abs(k.t - t) <= 0.5) })).find((x) => x.i >= 0)
      const k = owner ? owner.ks[owner.i] : null
      const next = owner ? owner.ks[owner.i + 1] : null
      const ease = k && next ? ` animation-timing-function: ${cssEasing(k.ease, next.t - k.t)};` : ''
      return `  ${+((t / anim.duration) * 100).toFixed(2)}% { ${g.css}: ${g.value(res(t))};${ease} }`
    })
    const name = `${base}-${g.css}`
    blocks.push(`@keyframes ${name} {\n${lines.join('\n')}\n}`)
    uses.push(name)
  }
  const iter = anim.loop === 'once' ? '1' : 'infinite'
  const dir = anim.loop === 'pingpong' ? ' alternate' : ''
  const animation = uses.map((u) => `${u} ${anim.duration}ms linear ${iter}${dir} both`).join(',\n    ')
  return `/* ${obj.name} — “${anim.name}”, exported from Tween.\n   One animation per property keeps each property's own keys and easing. */\n${blocks.join('\n\n')}\n\n.${slug(obj.name)} {\n  animation:\n    ${animation};\n  transform-box: fill-box;\n  transform-origin: center;\n}\n`
}
