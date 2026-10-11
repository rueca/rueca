/* The pipeline driver. Not React: it listens to the stores and keeps the
   stage result fresh.

   • mid-drag (values ≠ committed) → a draft: the working grid is capped so
     the worker answers in a frame or two, unless full renders are already fast
   • on commit (pointer up, undo, look applied) → the full-resolution result
   • requests coalesce in a microtask and the worker is latest-wins, so a
     burst of changes costs one render, never a queue */
import { createStore } from 'zustand/vanilla'
import { Processor } from './processor'
import type { Result, Settings } from './engine'
import { image, params, settingsOf, view } from './state'
import { asSource, decodeSized, previewURL, shrink } from './image'
import { paintSample } from './sample'
import { renderOutput } from './draw'

export const out = createStore<{ result: Result | null; busy: boolean; error: string | null; thumbs: Record<string, string>; threaded: boolean }>(() => ({
  result: null, busy: false, error: null, thumbs: {}, threaded: true,
}))

const THUMB_SIDE = 480
let proc: Processor | null = null
let lastFullMs = 0
let pending: 'draft' | 'full' | null = null

const current = (): Settings => {
  const v = params.values()
  const name = view.getState().preview
  const look = name ? params.getState().presets.find((p) => p.name === name) : null
  return settingsOf(look ? { ...v, ...look.values } : v)
}

function schedule(kind: 'draft' | 'full') {
  if (pending === 'full' && kind === 'draft') return
  const first = !pending
  pending = kind
  if (first) queueMicrotask(flush)
}

function flush() {
  const kind = pending
  pending = null
  if (!proc || !image.getState().data) return
  const draft = kind === 'draft' && lastFullMs > 45
  out.setState({ busy: true })
  proc.render(current(), draft ? 160_000 : undefined).then(
    (r) => { out.setState({ result: r, busy: false, error: null }); if (!r.draft) lastFullMs = r.ms },
    (e: Error) => { if (e.message !== 'superseded') out.setState({ busy: false, error: e.message }) },
  )
}

function thumbs() {
  if (!proc) return
  const img = image.getState()
  proc.clearThumbs()
  const scale = Math.min(1, THUMB_SIDE / Math.max(img.w, img.h))
  for (const p of params.getState().presets) {
    // looks are partial patches: lay them over the current settings, or unset keys (levels, gamma…) go NaN
    proc.thumb(settingsOf({ ...params.values(), ...p.values } as any), scale).then(
      (r) => out.setState((s) => ({ thumbs: { ...s.thumbs, [p.name]: renderOutput(r, 1).toDataURL('image/png') } })),
      () => { /* cancelled */ },
    )
  }
}

function setSource(img: ImageData) {
  proc?.setSource(asSource(img), asSource(shrink(img, THUMB_SIDE)))
  lastFullMs = 0
  out.setState({ thumbs: {} })
  schedule('full')
  thumbs()
}

/** Load a user image. Throws a readable error. */
export async function loadImage(input: Blob | string, name: string) {
  const { data, from } = await decodeSized(input)
  image.setState({ data, w: data.width, h: data.height, name, sample: false, url: previewURL(data) })
  return { w: data.width, h: data.height, from, scaled: data.width !== from.w || data.height !== from.h }
}

export function loadSample() {
  paintSample().then((data) => image.setState({ data, w: data.width, h: data.height, name: 'Sample — Campana bell.jpg', sample: true, url: previewURL(data) }))
}

/** Start the pipeline; returns a cleanup. Safe to call twice (StrictMode). */
export function start() {
  proc = new Processor()
  out.setState({ threaded: proc.threaded })
  const offs = [
    image.subscribe((s, prev) => { if (s.data && s.data !== prev.data) setSource(s.data) }),
    params.subscribe((s, prev) => {
      if (s.values !== s.committed) schedule('draft')
      if (s.presets !== prev.presets) thumbs()
    }),
    params.onCommit(() => schedule('full')),
    view.subscribe((s, prev) => { if (s.preview !== prev.preview) schedule(s.preview ? 'draft' : 'full') }),
  ]
  const have = image.getState().data
  if (have) setSource(have)
  else loadSample() // → image.subscribe → setSource
  return () => { offs.forEach((f) => f()); proc?.dispose(); proc = null }
}
