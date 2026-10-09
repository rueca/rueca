/* ---------------------------------------------------------------------------
   State. Three stores, one undo timeline:
     params  — the kit store: tunable artboard / playback values.
     doc     — the animation document (objects, animations, state machine) in a
               kit doc store; `history` joins it to params so ⌘Z undoes
               whichever changed last.
     ui      — selection, mode, pending (edited-not-keyed) values, preview.
               Kept OUT of the doc so undo never fights focus.
   Every document edit goes through the functions below.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { createClock, createDocStore, createHistory, createParams, defineSchema, folder, p, useDoc as useDocStore } from '@kit'
import {
  DEFAULTS, PROPS_FOR, blendResolved, keyAt, localTime, newId, parseTrack, resolve, trackKey,
  type Anim, type Doc, type Ease, type Key, type PropKey, type Resolved, type Val,
} from './engine'
import { demoDoc } from './demo'

export const schema = defineSchema({
  artboard: folder('Artboard', {
    bgTop: p.color('#2E2466', { alpha: false, label: 'Background', hint: 'Top of the artboard gradient.' }),
    bgBottom: p.color('#100C26', { alpha: false, label: 'Background end', hint: 'Bottom of the artboard gradient.' }),
    onion: p.boolean(false, { label: 'Onion skin', hint: 'Ghost the selected object a few frames before and after the playhead.' }),
    onionSpan: p.number(120, { min: 20, max: 500, step: 10, unit: 'ms', label: 'Onion span', hint: 'Time between ghosts.', when: (v) => v.onion }),
  }),
  playback: folder('Playback', {
    fps: p.select('60', [{ value: '24', label: '24 fps' }, { value: '30', label: '30 fps' }, { value: '60', label: '60 fps' }], { label: 'Frame rate', hint: 'Frame grid for stepping, snapping and video export.' }),
    snap: p.boolean(true, { label: 'Snap keys', hint: 'Dragged keys snap to the playhead, other keys and the ends. Hold Alt to disable.' }),
    exportScale: p.select('2', [{ value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }], { label: 'Export scale', hint: 'Resolution multiplier for PNG and MP4 export.' }),
  }),
})

export const params = createParams(schema, { id: 'animate', version: 2 })
export type V = ReturnType<typeof params.values>

export const doc = createDocStore<Doc>(demoDoc(), { id: 'animate', version: 1 })
export const history = createHistory([params, doc])

export const getDoc = () => doc.get()
export const setDoc = (d: Doc, final = true, label?: string) => doc.set(d, { commit: final, label })
export const commitDoc = (label?: string) => doc.commit(label)
export const useDoc = () => useDocStore(doc)

/* ---------- ui ---------- */
export type Mode = 'design' | 'animate'
export interface UI {
  mode: Mode
  animId: string
  sel: string | null
  keySel: string[]
  pending: Record<string, Val>
  autoKey: boolean
  closed: Record<string, boolean>
  preview: boolean
  smState: string | null
  lastTransition: string | null
  inputs: Record<string, boolean | number>
  fired: string | null
}
export const ui = createStore<UI>(() => ({
  mode: 'animate',
  animId: 'press',
  sel: 'heart',
  keySel: [],
  pending: {},
  autoKey: false,
  closed: {},
  preview: false,
  smState: null,
  lastTransition: null,
  inputs: Object.fromEntries(getDoc().sm.inputs.map((i) => [i.name, i.value])),
  fired: null,
}))
export const useUI = <T,>(pick: (s: UI) => T) => useStore(ui, pick)

export const currentAnim = (doc = getDoc()): Anim => doc.anims.find((a) => a.id === ui.getState().animId) ?? doc.anims[0]

/* ---------- clock ---------- */
// The kit clock loops, plays once or ping-pongs natively, so clock time IS animation time.
export const clock = createClock({ duration: currentAnim().duration, mode: currentAnim().loop, playing: false, fps: 60 })
export function syncClock() {
  if (ui.getState().preview) { clock.setState({ duration: 1e9, mode: 'loop' }); return }
  const a = currentAnim()
  const fps = Number(params.values().fps)
  const st = clock.getState()
  if (st.duration !== a.duration || st.mode !== a.loop || st.fps !== fps) clock.setState({ duration: a.duration, mode: a.loop, fps })
  if (clock.time() > a.duration) clock.seek(a.duration)
}
/** clock time → animation time (clamped; the state-machine preview runs a longer clock) */
export const toAnimTime = (t: number) => Math.max(0, Math.min(t, currentAnim().duration))
export const animTime = () => toAnimTime(clock.time())
export function seek(t: number) {
  if (Object.keys(ui.getState().pending).length) ui.setState({ pending: {} })
  clock.seek(t)
}
params.subscribe(() => syncClock())
doc.subscribe(() => syncClock())
ui.subscribe((s, prev) => { if (s.animId !== prev.animId || s.preview !== prev.preview) syncClock() })

/* ---------- document edits ---------- */
const mapAnim = (doc: Doc, id: string, fn: (a: Anim) => Anim): Doc => ({ ...doc, anims: doc.anims.map((a) => (a.id === id ? fn(a) : a)) })
const sortKeys = (keys: Key[]) => [...keys].sort((a, b) => a.t - b.t)
const DEFAULT_EASE: Ease = { kind: 'bezier', p: [0.42, 0, 0.58, 1] }

export function updateAnim(patch: Partial<Anim>, final = true, id = ui.getState().animId) {
  setDoc(mapAnim(getDoc(), id, (a) => ({ ...a, ...patch })), final)
}

export function setBase(obj: string, prop: PropKey, v: Val, final: boolean) {
  const doc = getDoc()
  setDoc({ ...doc, objects: doc.objects.map((o) => (o.id === obj ? { ...o, base: { ...o.base, [prop]: v } } : o)) }, final)
}

export function setKey(obj: string, prop: PropKey, t: number, v: Val, final: boolean) {
  const doc = getDoc()
  const a = currentAnim(doc)
  const k = trackKey(obj, prop)
  const keys = a.tracks[k] ?? []
  const at = keyAt(keys, t)
  let next: Key[]
  if (at) next = keys.map((x) => (x === at ? { ...x, v } : x))
  else {
    next = sortKeys([...keys, { id: newId(), t, v, ease: DEFAULT_EASE }])
    // First key placed later than 0 with a new value: anchor the old value at 0 so it animates.
    const base = doc.objects.find((o) => o.id === obj)?.base[prop] ?? DEFAULTS[prop]
    if (!keys.length && t > 0 && base !== v) next = [{ id: newId(), t: 0, v: base, ease: DEFAULT_EASE }, ...next]
  }
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks: { ...an.tracks, [k]: next } })), final, 'Set key')
}

export function removeKeyAt(obj: string, prop: PropKey, t: number) {
  const doc = getDoc()
  const a = currentAnim(doc)
  const k = trackKey(obj, prop)
  const keys = (a.tracks[k] ?? []).filter((x) => Math.abs(x.t - t) > 0.5)
  const tracks = { ...a.tracks }
  if (keys.length) tracks[k] = keys
  else delete tracks[k]
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), true, 'Remove key')
}

/** Inspector / canvas edits. Design mode writes base values; Animate mode keys
    (auto-key, or a key already at the playhead), marks animated props as
    edited-not-keyed, and writes base values for props that have no keys. */
export function editProps(obj: string, patch: Partial<Record<PropKey, Val>>, final: boolean) {
  const s = ui.getState()
  let doc = getDoc()
  const entries = Object.entries(patch) as [PropKey, Val][]
  const setBaseIn = (d: Doc, p: PropKey, v: Val): Doc => ({ ...d, objects: d.objects.map((o) => (o.id === obj ? { ...o, base: { ...o.base, [p]: v } } : o)) })
  if (s.mode === 'design' || s.preview) {
    for (const [p, v] of entries) doc = setBaseIn(doc, p, v)
    return setDoc(doc, final)
  }
  const a = currentAnim(doc)
  const t = Math.round(animTime())
  const pending = { ...s.pending }
  const tracks = { ...a.tracks }
  let touched = false
  for (const [p, v] of entries) {
    const k = trackKey(obj, p)
    const keys = tracks[k]
    if (keyAt(keys, t) || s.autoKey) {
      delete pending[k]
      const ks = keys ?? []
      const at = keyAt(ks, t)
      let next = at ? ks.map((x) => (x === at ? { ...x, v } : x)) : sortKeys([...ks, { id: newId(), t, v, ease: DEFAULT_EASE }])
      // First key placed later than 0 with a new value: anchor the old value at 0 so it animates.
      const base = doc.objects.find((o) => o.id === obj)?.base[p] ?? DEFAULTS[p]
      if (!ks.length && t > 0 && base !== v) next = [{ id: newId(), t: 0, v: base, ease: DEFAULT_EASE }, ...next]
      tracks[k] = next
      touched = true
    } else if (keys?.length) pending[k] = v
    else doc = setBaseIn(doc, p, v)
  }
  if (touched) doc = mapAnim(doc, a.id, (an) => ({ ...an, tracks }))
  ui.setState({ pending })
  if (doc !== getDoc()) setDoc(doc, final)
  else if (final) commitDoc()
}
export const editProp = (obj: string, prop: PropKey, v: Val, final: boolean) => editProps(obj, { [prop]: v }, final)

export function commitPending(only?: string) {
  const s = ui.getState()
  const entries = Object.entries(s.pending).filter(([k]) => !only || k === only)
  if (!entries.length) return 0
  const t = Math.round(animTime())
  let doc = getDoc()
  const a = currentAnim(doc)
  const tracks = { ...a.tracks }
  for (const [k, v] of entries) {
    const keys = tracks[k] ?? []
    const at = keyAt(keys, t)
    tracks[k] = at ? keys.map((x) => (x === at ? { ...x, v } : x)) : sortKeys([...keys, { id: newId(), t, v, ease: DEFAULT_EASE }])
  }
  doc = mapAnim(doc, a.id, (an) => ({ ...an, tracks }))
  setDoc(doc, true, 'Key edits')
  const rest = { ...s.pending }
  entries.forEach(([k]) => delete rest[k])
  ui.setState({ pending: rest })
  return entries.length
}

/** K: key the pending values, else every animated prop of the selection, else its transform. */
export function addKeysAtPlayhead(): number {
  const s = ui.getState()
  if (Object.keys(s.pending).length) return commitPending()
  if (!s.sel) return 0
  const doc = getDoc()
  const o = doc.objects.find((x) => x.id === s.sel)
  if (!o) return 0
  const a = currentAnim(doc)
  const t = Math.round(animTime())
  const r = resolve(doc, a, t)[o.id]
  let props = PROPS_FOR[o.kind].filter((p) => a.tracks[trackKey(o.id, p)]?.length)
  if (!props.length) props = ['x', 'y', 'rotation', 'scale', 'opacity']
  const tracks = { ...a.tracks }
  for (const p of props) {
    const k = trackKey(o.id, p)
    const keys = tracks[k] ?? []
    if (keyAt(keys, t)) continue
    tracks[k] = sortKeys([...keys, { id: newId(), t, v: r[p], ease: DEFAULT_EASE }])
  }
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), true, 'Add keys')
  return props.length
}

export function toggleKey(obj: string, prop: PropKey) {
  const k = trackKey(obj, prop)
  const s = ui.getState()
  const t = Math.round(animTime())
  const a = currentAnim()
  if (s.pending[k] !== undefined) return commitPending(k)
  if (keyAt(a.tracks[k], t)) return removeKeyAt(obj, prop, t)
  const v = resolve(getDoc(), a, t)[obj][prop]
  setKey(obj, prop, t, v, true)
}

export function moveKeys(next: Record<string, number>, final: boolean) {
  const doc = getDoc()
  const a = currentAnim(doc)
  const tracks: Record<string, Key[]> = {}
  for (const [k, keys] of Object.entries(a.tracks)) {
    let ks = sortKeys(keys.map((x) => (next[x.id] !== undefined ? { ...x, t: next[x.id] } : x)))
    if (final) {
      // a moved key landing on another wins the slot
      const moved = new Set(Object.keys(next))
      ks = ks.filter((x, i) => !ks.some((y, j) => j !== i && Math.abs(y.t - x.t) < 0.5 && moved.has(y.id) && !moved.has(x.id)))
    }
    tracks[k] = ks
  }
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), final, 'Move keys')
}

export function deleteKeys(ids: string[]) {
  if (!ids.length) return 0
  const set = new Set(ids)
  const doc = getDoc()
  const a = currentAnim(doc)
  const tracks: Record<string, Key[]> = {}
  let n = 0
  for (const [k, keys] of Object.entries(a.tracks)) {
    const ks = keys.filter((x) => !set.has(x.id))
    n += keys.length - ks.length
    if (ks.length) tracks[k] = ks
  }
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), true, 'Delete keys')
  ui.setState({ keySel: [] })
  return n
}

export function setEase(ids: string[], ease: Ease, final = true) {
  const set = new Set(ids)
  const doc = getDoc()
  const a = currentAnim(doc)
  const tracks = Object.fromEntries(Object.entries(a.tracks).map(([k, keys]) => [k, keys.map((x) => (set.has(x.id) ? { ...x, ease } : x))]))
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), final, 'Easing')
}

export function findKey(id: string): { track: string; key: Key; next?: Key } | null {
  const a = currentAnim()
  for (const [k, keys] of Object.entries(a.tracks)) {
    const i = keys.findIndex((x) => x.id === id)
    if (i >= 0) return { track: k, key: keys[i], next: keys[i + 1] }
  }
  return null
}

/* clipboard for keys: relative to the earliest copied key */
let clip: { track: string; dt: number; v: Val; ease: Ease }[] = []
export function copyKeys(ids: string[]) {
  const a = currentAnim()
  const found = Object.entries(a.tracks).flatMap(([k, keys]) => keys.filter((x) => ids.includes(x.id)).map((x) => ({ track: k, key: x })))
  if (!found.length) return 0
  const t0 = Math.min(...found.map((f) => f.key.t))
  clip = found.map((f) => ({ track: f.track, dt: f.key.t - t0, v: f.key.v, ease: f.key.ease }))
  return clip.length
}
export function pasteKeys() {
  if (!clip.length) return 0
  const doc = getDoc()
  const a = currentAnim(doc)
  const t = Math.round(animTime())
  const tracks = { ...a.tracks }
  const ids: string[] = []
  for (const c of clip) {
    const at = t + c.dt
    if (at > a.duration) continue
    const keys = (tracks[c.track] ?? []).filter((x) => Math.abs(x.t - at) > 0.5)
    const id = newId()
    ids.push(id)
    tracks[c.track] = sortKeys([...keys, { id, t: at, v: c.v, ease: c.ease }])
  }
  setDoc(mapAnim(doc, a.id, (an) => ({ ...an, tracks })), true, 'Paste keys')
  ui.setState({ keySel: ids })
  return ids.length
}

export function nudgeKeys(ids: string[], frames: number) {
  if (!ids.length) return
  const a = currentAnim()
  const step = 1000 / Number(params.values().fps)
  const next: Record<string, number> = {}
  for (const keys of Object.values(a.tracks)) for (const k of keys) if (ids.includes(k.id)) next[k.id] = Math.max(0, Math.min(a.duration, Math.round((k.t + frames * step) * 1000) / 1000))
  moveKeys(next, true)
}

/* animations */
export function addAnim(from?: Anim) {
  const doc = getDoc()
  const id = newId('a')
  const base = from ?? { id, name: 'Untitled', duration: 1000, loop: 'once' as const, tracks: {} }
  let name = from ? `${from.name} copy` : 'Untitled'
  let i = 2
  while (doc.anims.some((a) => a.name === name)) name = `${from ? `${from.name} copy` : 'Untitled'} ${i++}`
  const tracks = from ? Object.fromEntries(Object.entries(from.tracks).map(([k, keys]) => [k, keys.map((x) => ({ ...x, id: newId() }))])) : {}
  setDoc({ ...doc, anims: [...doc.anims, { ...base, id, name, tracks }] }, true, from ? 'Duplicate animation' : 'New animation')
  ui.setState({ animId: id, keySel: [], pending: {} })
}
export function deleteAnim(id: string) {
  const doc = getDoc()
  if (doc.anims.length <= 1) return false
  const anims = doc.anims.filter((a) => a.id !== id)
  const sm = { ...doc.sm, entry: doc.sm.entry === id ? anims[0].id : doc.sm.entry, transitions: doc.sm.transitions.filter((t) => t.from !== id && t.to !== id) }
  setDoc({ ...doc, anims, sm }, true, 'Delete animation')
  if (ui.getState().animId === id) ui.setState({ animId: anims[0].id, keySel: [] })
  return true
}

/* objects */
export function patchObject(id: string, patch: Partial<Doc['objects'][number]>, final = true) {
  const doc = getDoc()
  setDoc({ ...doc, objects: doc.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }, final)
}
export function reorderObject(id: string, target: string, where: 'before' | 'after' | 'inside') {
  // The layer list is drawn top-most first, the objects array bottom-most first.
  const doc = getDoc()
  const moving = doc.objects.find((o) => o.id === id)
  const tgt = doc.objects.find((o) => o.id === target)
  if (!moving || !tgt || id === target) return
  // refuse to parent into own subtree
  for (let p: string | null = tgt.id; p; p = doc.objects.find((o) => o.id === p)?.parent ?? null) if (p === id) return
  const rest = doc.objects.filter((o) => o.id !== id)
  const parent = where === 'inside' ? (tgt.kind === 'group' ? tgt.id : tgt.parent) : tgt.parent
  const moved = { ...moving, parent }
  const ti = rest.findIndex((o) => o.id === target)
  const at = where === 'before' ? ti + 1 : where === 'after' ? ti : rest.length
  rest.splice(at, 0, moved)
  setDoc({ ...doc, objects: rest }, true, 'Reorder layers')
}

/* ---------- state machine runtime ---------- */
export function createRuntime() {
  let state = getDoc().sm.entry
  let t = 0
  let last: Resolved | null = null
  let mixFrom: Resolved | null = null
  let mixT = 0, mixDur = 0
  const fired = new Set<string>()
  return {
    get state() { return state },
    reset() { state = getDoc().sm.entry; t = 0; last = null; mixFrom = null; fired.clear() },
    fire(name: string) { fired.add(name) },
    step(dt: number): Resolved {
      const doc = getDoc()
      const inputs = ui.getState().inputs
      const anim = doc.anims.find((a) => a.id === state) ?? doc.anims[0]
      t += dt
      const ok = (c: { input: string; op: string; value?: boolean | number }) => {
        const v = inputs[c.input]
        if (c.op === 'fired') return fired.has(c.input)
        if (c.op === 'is') return v === c.value
        if (c.op === 'gt') return Number(v) > Number(c.value)
        if (c.op === 'lt') return Number(v) < Number(c.value)
        return false
      }
      for (const tr of doc.sm.transitions) {
        if (tr.from !== state && tr.from !== 'any') continue
        if (tr.exit && t < anim.duration) continue
        if (!tr.conds.every(ok)) continue
        if (tr.from === 'any' && tr.to === state && !tr.conds.some((c) => c.op === 'fired')) continue
        mixFrom = last
        mixT = 0
        mixDur = tr.mix
        state = tr.to
        t = 0
        ui.setState({ smState: state, lastTransition: tr.id })
        break
      }
      fired.clear()
      const cur = doc.anims.find((a) => a.id === state) ?? doc.anims[0]
      // Rive semantics: properties the animation does not key keep their last value.
      let out = resolve(doc, cur, localTime(cur, t))
      if (last) for (const id of Object.keys(out)) for (const p of Object.keys(out[id]) as PropKey[]) {
        if (!cur.tracks[trackKey(id, p)]?.length && last[id]) out[id][p] = last[id][p]
      }
      if (mixFrom && mixDur > 0) {
        mixT += dt
        const k = Math.min(1, mixT / mixDur)
        out = blendResolved(mixFrom, out, k)
        if (k >= 1) mixFrom = null
      }
      last = out
      return out
    },
  }
}
export const runtime = createRuntime()

export { parseTrack }
