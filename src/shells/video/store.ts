/* ---------------------------------------------------------------------------
   State: the kit params store holds the composition settings (aspect, fps,
   duration, matte, view); the tracks + clips live in a kit doc store. One
   `history` joins them, so ⌘Z undoes whichever changed last. `ui` holds
   selection and tool — kept out of the doc so undo never fights focus.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { RectangleHorizontal, RectangleVertical, Square, Smartphone } from 'lucide-react'
import { createClock, createDocStore, createHistory, createParams, defineSchema, folder, matchesShape, p, useDoc } from '@kit'
import { WIRE } from '@/demo/wire'
import { ASPECTS, demoComp, newClip, uid, type Aspect, type Clip, type ClipKind, type Comp, type Track } from './comp'

export const schema = defineSchema({
  // the toolbar's aspect switcher is this folder's home, so <SettingsMenu> leaves it out
  frame: folder('Frame', {
    aspect: p.select('9:16', [
      { value: '9:16', label: '9:16', icon: Smartphone, hint: 'Story / Reel · 1080 × 1920' },
      { value: '4:5', label: '4:5', icon: RectangleVertical, hint: 'Portrait feed · 1080 × 1350' },
      { value: '1:1', label: '1:1', icon: Square, hint: 'Square · 1080 × 1080' },
      { value: '16:9', label: '16:9', icon: RectangleHorizontal, hint: 'Landscape · 1920 × 1080' },
    ], { label: 'Aspect', hint: 'Every clip is laid out relative to the frame, so switching aspect re-lays the whole video.' }),
  }, { place: 'settings' }),
  composition: folder('Composition', {
    fps: p.select('30', [{ value: '24', label: '24' }, { value: '30', label: '30' }, { value: '60', label: '60' }], { label: 'Frame rate', hint: 'Frames per second for stepping, snapping and MP4 export.' }),
    duration: p.number(8000, { min: 1000, max: 60000, step: 100, fmt: (v) => `${(v / 1000).toFixed(1)}s`, label: 'Duration', hint: 'Length of the composition.' }),
    matte: p.color(WIRE.paper, { alpha: false, label: 'Matte', hint: 'Shown wherever no clip covers the frame.' }),
  }, { place: 'settings' }),
  view: folder('View', {
    safeArea: p.boolean(true, { label: 'Safe areas', hint: 'Shade the zones that platform UI (captions, buttons, profile) covers.' }),
    snap: p.boolean(true, { label: 'Snapping', hint: 'Clips snap to the playhead and to each other’s edges.' }),
    quality: p.select('0.5', [{ value: '0.5', label: 'Half' }, { value: '1', label: 'Full' }], { label: 'Preview', hint: 'Preview resolution. Export is always full resolution.' }),
  }, { place: 'settings' }),
})

export const params = createParams(schema, { id: 'video', version: 3 }) // v3: paper matte (wire style)
export type V = ReturnType<typeof params.values>

export const doc = createDocStore<Comp>(demoComp(), { id: 'video', version: 3 }) // v3: Campana's launch film; v2 (wire style) and v1 are not carried over
export const history = createHistory([params, doc])
export const getComp = () => doc.get()
export const setComp = (c: Comp, final = true, label?: string) => doc.set(c, { commit: final, label })
export const commitComp = (label?: string) => doc.commit(label)
export const useComp = () => useDoc(doc)

export interface UI { sel: string[]; tool: 'select' | 'text' | 'shape' }
export const ui = createStore<UI>(() => ({ sel: ['title'], tool: 'select' }))
export const useUI = <T,>(pick: (s: UI) => T) => useStore(ui, pick)

export const clock = createClock({ duration: params.values().duration, loop: true, playing: false, fps: Number(params.values().fps) })
params.subscribe((s) => {
  const v = s.values as V
  const st = clock.getState()
  if (st.duration !== v.duration || st.fps !== Number(v.fps)) clock.setState({ duration: v.duration, fps: Number(v.fps) })
})
export const frameMs = () => 1000 / Number(params.values().fps)
export const snapFrame = (ms: number) => Math.round(ms / frameMs()) * frameMs()

/* ---------- edits ---------- */
export function updateClips(changes: Record<string, Partial<Clip>>, final = true) {
  const c = getComp()
  setComp({ ...c, clips: c.clips.map((x) => (changes[x.id] ? { ...x, ...changes[x.id] } : x)) }, final)
}
export const updateClip = (id: string, patch: Partial<Clip>, final = true) => updateClips({ [id]: patch }, final)

const overlaps = (a: { start: number; dur: number }, b: { start: number; dur: number }) => a.start < b.start + b.dur - 0.5 && b.start < a.start + a.dur - 0.5

/** Topmost unlocked track with room at [start, start+dur), or a new track. */
function placeFor(comp: Comp, start: number, dur: number, prefer?: string): { comp: Comp; track: string } {
  const free = (t: Track) => !t.locked && !comp.clips.some((c) => c.track === t.id && overlaps(c, { start, dur }))
  const pref = comp.tracks.find((t) => t.id === prefer)
  if (pref && free(pref)) return { comp, track: pref.id }
  const t = comp.tracks.find(free)
  if (t) return { comp, track: t.id }
  const nt: Track = { id: uid('t'), name: `Track ${comp.tracks.length + 1}`, muted: false, locked: false }
  return { comp: { ...comp, tracks: [nt, ...comp.tracks] }, track: nt.id }
}

export function addClip(kind: ClipKind, patch: Partial<Clip> = {}, at = snapFrame(clock.time())) {
  let comp = getComp()
  const dur = params.values().duration
  const c0 = { ...newClip(kind, '', Math.min(at, Math.max(0, dur - 500))), ...patch }
  if (kind === 'bg' || kind === 'progress') { c0.start = 0; c0.dur = dur }
  c0.dur = Math.min(c0.dur, dur - c0.start)
  const pref = kind === 'text' ? comp.tracks.find((t) => /title|caption|text/i.test(t.name))?.id : kind === 'bg' ? comp.tracks.at(-1)?.id : undefined
  const placed = placeFor(comp, c0.start, c0.dur, pref)
  comp = placed.comp
  const clip = { ...c0, track: placed.track }
  setComp({ ...comp, clips: [...comp.clips, clip] }, true, `Add ${clip.name.toLowerCase()}`)
  ui.setState({ sel: [clip.id] })
  return clip
}

export function deleteClips(ids: string[]) {
  if (!ids.length) return 0
  const c = getComp()
  const locked = new Set(c.tracks.filter((t) => t.locked).map((t) => t.id))
  const kill = new Set(c.clips.filter((x) => ids.includes(x.id) && !locked.has(x.track)).map((x) => x.id))
  if (!kill.size) return 0
  setComp({ ...c, clips: c.clips.filter((x) => !kill.has(x.id)) }, true, kill.size === 1 ? 'Delete clip' : `Delete ${kill.size} clips`)
  ui.setState({ sel: [] })
  return kill.size
}

export function duplicateClips(ids: string[]) {
  let comp = getComp()
  const made: string[] = []
  for (const id of ids) {
    const src = comp.clips.find((x) => x.id === id)
    if (!src) continue
    const start = src.start + src.dur
    const dur = Math.min(src.dur, Math.max(100, params.values().duration - start))
    const placed = placeFor(comp, start < params.values().duration ? start : src.start, dur, src.track)
    comp = placed.comp
    const nc = { ...src, id: uid(), name: `${src.name} copy`, track: placed.track, start: start < params.values().duration ? start : src.start, dur }
    comp = { ...comp, clips: [...comp.clips, nc] }
    made.push(nc.id)
  }
  setComp(comp, true, 'Duplicate')
  ui.setState({ sel: made })
  return made.length
}

export function splitAt(ids: string[], t = snapFrame(clock.time())) {
  const comp = getComp()
  const made: string[] = []
  const clips = comp.clips.flatMap((c) => {
    if (!ids.includes(c.id) || t <= c.start + 50 || t >= c.start + c.dur - 50) return [c]
    const a = { ...c, dur: t - c.start, exit: { ...c.exit, preset: 'none' as const } }
    const b = { ...c, id: uid(), name: `${c.name} (2)`, start: t, dur: c.start + c.dur - t, enter: { ...c.enter, preset: 'none' as const } }
    made.push(b.id)
    return [a, b]
  })
  if (!made.length) return 0
  setComp({ ...comp, clips }, true, 'Split')
  ui.setState({ sel: made })
  return made.length
}

export function patchTrack(id: string, patch: Partial<Track>) {
  const c = getComp()
  setComp({ ...c, tracks: c.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
}
export function addTrack() {
  const c = getComp()
  setComp({ ...c, tracks: [{ id: uid('t'), name: `Track ${c.tracks.length + 1}`, muted: false, locked: false }, ...c.tracks] })
}
export function removeEmptyTracks() {
  const c = getComp()
  const used = new Set(c.clips.map((x) => x.track))
  const tracks = c.tracks.filter((t) => used.has(t.id))
  if (tracks.length === c.tracks.length) return 0
  setComp({ ...c, tracks })
  return c.tracks.length - tracks.length
}

/** After a move: if a clip landed on another, slide it to the nearest free gap on that track; otherwise revert. */
export function settleClips(ids: string[], original: Record<string, Pick<Clip, 'start' | 'track'>>) {
  const comp = getComp()
  const dur = params.values().duration
  const fix: Record<string, Partial<Clip>> = {}
  for (const id of ids) {
    const c = comp.clips.find((x) => x.id === id)
    if (!c) continue
    const others = comp.clips.filter((x) => x.track === c.track && x.id !== id && !ids.includes(x.id)).sort((a, b) => a.start - b.start)
    if (!others.some((o) => overlaps(o, c))) continue
    const cands = [0, ...others.map((o) => o.start + o.dur), ...others.map((o) => o.start - c.dur)].filter((s) => s >= 0 && s + c.dur <= dur + 0.5)
    const ok = cands.filter((s) => !others.some((o) => overlaps(o, { start: s, dur: c.dur }))).sort((a, b) => Math.abs(a - c.start) - Math.abs(b - c.start))
    fix[id] = ok.length ? { start: ok[0] } : { start: original[id].start, track: original[id].track }
  }
  if (Object.keys(fix).length) updateClips(fix, false)
}

/** Make the current aspect the design frame without changing what is on screen. */
export function rebaseDesign(aspect: Aspect) {
  const c = getComp()
  const { w, h } = ASPECTS[aspect]
  const d = ASPECTS[c.design ?? '9:16']
  const k = Math.min(w / d.w, h / d.h)
  if (Math.abs(k - 1) < 1e-6) { setComp({ ...c, design: aspect }); return }
  const r = (v: number | undefined, dp = 4) => (v === undefined ? v : Number((v * k).toFixed(dp)))
  setComp({
    ...c, design: aspect,
    clips: c.clips.map((x) => ({ ...x, size: r(x.size, 1), w: r(x.w)!, h: r(x.h)!, stroke: r(x.stroke), radius: x.radius !== undefined && x.radius >= 1 ? x.radius : r(x.radius), thickness: r(x.thickness, 1) })),
  })
}

export function loadComp(data: unknown) {
  const d = data as Partial<Comp> & { settings?: Partial<V> }
  if (!d || !Array.isArray(d.clips) || !Array.isArray(d.tracks)) throw new Error('Not a Cut composition (needs tracks and clips).')
  // Every clip and track must look like the ones we have (break-it S2: `clips: [null]` killed the shell).
  const cur = getComp()
  if (!matchesShape(d.clips, cur.clips) || !matchesShape(d.tracks, cur.tracks)) throw new Error('Clips or tracks have the wrong shape.')
  const patch = { comp: { tracks: d.tracks, clips: d.clips, design: d.design ?? (d.settings?.aspect as Aspect | undefined) ?? '9:16' } }
  const settings: Record<string, unknown> = {}
  if (d.settings?.aspect) settings.aspect = d.settings.aspect
  if (d.settings?.fps) settings.fps = d.settings.fps
  if (d.settings?.duration) settings.duration = d.settings.duration
  if (Object.keys(settings).length) params.patch(settings as never, { label: 'Import settings' })
  setComp(patch.comp as Comp, true, 'Import composition')
  ui.setState({ sel: [] })
}
