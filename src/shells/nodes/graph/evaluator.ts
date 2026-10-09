/* ---------------------------------------------------------------------------
   Main-thread side of the engine: owns the worker, coalesces graph changes
   into one cook per frame, and exposes results as a zustand store the node
   thumbnails and the preview subscribe to.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { createHost, type NodeStatus, type Request, type Response } from '../engine/runner'
import type { RGBA } from '../engine/image'
import { graph, engineGraph, outputId } from './store'
import { doc } from './doc'

export interface ThumbEntry { sig: string; ms: number; error?: string; blocked?: boolean; image?: ImageData; value?: number | RGBA }
export interface PreviewEntry { id: string; res: number; ms: number; error?: string; image?: ImageData; draft: boolean }

interface EvalState {
  thumbs: Record<string, ThumbEntry>
  status: Record<string, NodeStatus>
  preview: PreviewEntry | null
  busy: boolean
  lastMs: number
  inline: boolean
}

export const evals = createStore<EvalState>(() => ({ thumbs: {}, status: {}, preview: null, busy: false, lastMs: 0, inline: false }))
export const useEval = <T,>(pick: (s: EvalState) => T) => useStore(evals, pick)

export const THUMB_RES = 192

/* --- transport: a module worker, or the same host inline if workers fail --- */
let send: (m: Request) => void
const renders = new Map<number, (r: Extract<Response, { kind: 'render' }>) => void>()

function onResponse(m: Response) {
  if (m.kind === 'render') { renders.get(m.reqId)?.(m); renders.delete(m.reqId); return }
  if (m.gen !== gen) return // stale
  if (m.kind === 'status') evals.setState({ status: m.status })
  else if (m.kind === 'thumb') {
    const t = m.thumb
    const image = t.bytes && t.w && t.h ? new ImageData(t.bytes, t.w, t.h) : undefined
    evals.setState((s) => ({ thumbs: { ...s.thumbs, [t.id]: { sig: t.sig, ms: t.ms, error: t.error, blocked: t.blocked, image, value: t.value } } }))
  } else if (m.kind === 'preview') {
    const image = m.bytes && m.w && m.h ? new ImageData(m.bytes, m.w, m.h) : undefined
    const full = Number(doc.values().previewRes)
    evals.setState({ preview: { id: m.id, res: m.res, ms: m.ms, error: m.error, image, draft: m.res < full } })
  } else if (m.kind === 'done') evals.setState({ busy: false, lastMs: m.ms })
}

function inlineTransport() {
  const handle = createHost((m) => onResponse(m))
  evals.setState({ inline: true })
  return (m: Request) => { setTimeout(() => void handle(m), 0) }
}

try {
  const w = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module', name: 'nodes-engine' })
  w.onmessage = (e: MessageEvent<Response>) => onResponse(e.data)
  w.onerror = () => { send = inlineTransport(); lastKey = ''; schedule() }
  send = (m) => w.postMessage(m)
} catch {
  send = inlineTransport()
}

/* --- scheduling --- */
let gen = 0
let lastKey = ''
let queued = false

/** Which node the preview shows: the Output, or the selected node in "Selection" mode. */
export function previewTarget() {
  const s = graph.getState()
  if (doc.values().previewOf === 'selection') {
    const sel = s.nodes.filter((n) => n.selected)
    if (sel.length === 1 && sel[0].data.kind !== 'number' && sel[0].data.kind !== 'color') return sel[0].id
  }
  return outputId(s)
}

function run() {
  queued = false
  const v = doc.values()
  const g = engineGraph()
  const full = Number(v.previewRes)
  const draft = graph.getState().live && v.draft
  const previewRes = draft ? Math.round(full / 2) : full
  const target = previewTarget()
  const key = JSON.stringify([g, target, previewRes, v.thumbs])
  if (key === lastKey) return
  lastKey = key
  gen++
  evals.setState({ busy: true })
  // forget thumbs of deleted nodes
  const ids = new Set(g.nodes.map((n) => n.id))
  const thumbs = evals.getState().thumbs
  if (Object.keys(thumbs).some((k) => !ids.has(k))) evals.setState({ thumbs: Object.fromEntries(Object.entries(thumbs).filter(([k]) => ids.has(k))) })
  send({ kind: 'run', gen, graph: g, thumbRes: THUMB_RES, thumbs: v.thumbs, preview: target, previewRes, keepRes: [THUMB_RES, full, Math.round(full / 2)] })
}

export function schedule() {
  if (queued) return
  queued = true
  requestAnimationFrame(run)
}

graph.subscribe(schedule)
doc.subscribe(schedule)
schedule()

/** Cook one node at an arbitrary size, uncached (exports). */
let reqId = 0
export function render(nodeId: string, res: number): Promise<ImageData> {
  const id = ++reqId
  return new Promise((resolve, reject) => {
    renders.set(id, (r) => (r.bytes && r.w && r.h ? resolve(new ImageData(r.bytes, r.w, r.h)) : reject(new Error(r.error ?? 'Render failed'))))
    send({ kind: 'render', reqId: id, graph: engineGraph(), nodeId, res })
  })
}
