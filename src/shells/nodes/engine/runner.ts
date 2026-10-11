/* ---------------------------------------------------------------------------
   Lazy, cached graph evaluation.

   Every node gets a signature: hash(type, params, bypass, upstream sigs).
   Results are cached per (resolution, node) and reused while the signature
   holds, so dragging a Blur radius only recooks Blur and what is downstream
   of it. Evaluation is pull-based from whatever is being looked at (a
   thumbnail, the preview, an export) — nodes nobody looks at never cook.

   `handle(msg, post)` is the whole protocol; worker.ts wraps it in a Worker,
   client.ts can also run it inline if workers are unavailable.
--------------------------------------------------------------------------- */
import { OPS, emptyImg, isImg, type Outputs, type Value } from './ops'
import { toBytes, type RGBA } from './image'
import { portOf, specOf, type EngineGraph, type EngineNode, type PortSpec } from './spec'

export interface NodeStatus { error?: string; blocked?: boolean }
interface Result { sig: string; outputs: Outputs | null; error?: string; ms: number }

const fnv = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(36)
}

class Cancelled extends Error {}

export class Runner {
  private graph: EngineGraph = { nodes: [], edges: [] }
  private byId = new Map<string, EngineNode>()
  private sigs = new Map<string, string>()
  status = new Map<string, NodeStatus>()
  private cache = new Map<string, Result>()
  gen = 0

  setGraph(g: EngineGraph) {
    this.graph = g
    this.byId = new Map(g.nodes.map((n) => [n.id, n]))
    this.analyse()
  }

  sigOf(id: string) { return this.sigs.get(id) ?? '' }

  /** Incoming edge per input port. */
  private incoming(id: string) {
    const m = new Map<string, { source: string; sourceHandle: string }>()
    for (const e of this.graph.edges) if (e.target === id) m.set(e.targetHandle, e)
    return m
  }

  /** Structural checks + signatures, in one dependency walk. */
  private analyse() {
    this.sigs.clear()
    this.status.clear()
    const state = new Map<string, 0 | 1 | 2>() // 1 visiting, 2 done
    const visit = (id: string): string => {
      const st = state.get(id)
      if (st === 2) return this.sigs.get(id)!
      if (st === 1) { this.status.set(id, { error: 'Part of a loop. Break a wire' }); return 'cycle' }
      state.set(id, 1)
      const n = this.byId.get(id)!
      const spec = specOf(n.type)
      const ins = this.incoming(id)
      let error: string | undefined
      let blocked = false
      const parts: string[] = [n.type, JSON.stringify(n.params), n.bypass ? 'b' : '']
      for (const port of spec.inputs) {
        const e = ins.get(port.key)
        if (!e) {
          if (!port.optional && !n.bypass && !error) error = `Connect an input to ${port.label}`
          parts.push('-')
          continue
        }
        const src = this.byId.get(e.source)
        const out = src && portOf(src.type, e.sourceHandle, 'out')
        if (!src || !out) { error ??= `${port.label} is wired to a missing port`; parts.push('x'); continue }
        if (out.type !== port.type) { error ??= `${port.label} expects ${port.type}, got ${out.type}`; parts.push('x'); continue }
        parts.push(`${visit(e.source)}:${e.sourceHandle}`)
        const up = this.status.get(e.source)
        if (up?.error || up?.blocked) blocked = true
      }
      if (!OPS[n.type]) error ??= `Unknown node type “${n.type}”`
      const prev = this.status.get(id)
      if (prev?.error) error = prev.error // cycle flagged while visiting
      if (error) this.status.set(id, { error })
      else if (blocked) this.status.set(id, { blocked: true })
      const sig = fnv(parts.join('|'))
      this.sigs.set(id, sig)
      state.set(id, 2)
      return sig
    }
    for (const n of this.graph.nodes) visit(n.id)
  }

  /** Drop cached results for nodes that no longer exist or resolutions no longer used. */
  prune(keepRes: number[]) {
    for (const k of this.cache.keys()) {
      const [r, id] = k.split('|')
      if (!keepRes.includes(Number(r)) || !this.byId.has(id)) this.cache.delete(k)
    }
  }

  async evaluate(id: string, res: number, opts: { gen?: number; cache?: Map<string, Result>; yieldEvery?: boolean } = {}): Promise<Result> {
    const cache = opts.cache ?? this.cache
    const sig = this.sigs.get(id) ?? ''
    const key = `${res}|${id}`
    const hit = cache.get(key)
    if (hit && hit.sig === sig) return hit
    const st = this.status.get(id)
    if (st?.error) return { sig, outputs: null, error: st.error, ms: 0 }
    if (st?.blocked) return { sig, outputs: null, error: 'Waiting for a valid input', ms: 0 }

    const n = this.byId.get(id)!
    const spec = specOf(n.type)
    const ins = this.incoming(id)
    const inputs: Record<string, Value | undefined> = {}
    for (const port of spec.inputs) {
      const e = ins.get(port.key)
      if (!e) continue
      const r = await this.evaluate(e.source, res, opts)
      if (!r.outputs) return { sig, outputs: null, error: 'Waiting for a valid input', ms: 0 }
      inputs[port.key] = r.outputs[e.sourceHandle]
    }
    if (opts.yieldEvery) {
      await new Promise((r) => setTimeout(r, 0))
      if (opts.gen !== undefined && opts.gen !== this.gen) throw new Cancelled()
    }

    const t0 = performance.now()
    let result: Result
    try {
      const outputs = n.bypass ? bypass(spec.inputs, spec.outputs, inputs, res) : OPS[n.type](drive(n, spec.inputs, inputs), res, inputs)
      result = { sig, outputs, ms: performance.now() - t0 }
    } catch (err) {
      result = { sig, outputs: null, error: err instanceof Error ? err.message : String(err), ms: performance.now() - t0 }
    }
    cache.set(key, result)
    return result
  }
}

/** Substitute connected parameter inputs into the params. */
function drive(n: EngineNode, ports: PortSpec[], inputs: Record<string, Value | undefined>) {
  const p = { ...n.params }
  for (const port of ports) if (port.param && inputs[port.key] !== undefined) p[port.param] = inputs[port.key]
  return p
}

/** A bypassed node passes its first matching input through (TouchDesigner). */
function bypass(ins: PortSpec[], outs: PortSpec[], inputs: Record<string, Value | undefined>, res: number): Outputs {
  const o: Outputs = {}
  for (const out of outs) {
    const pass = ins.find((i) => i.type === out.type && inputs[i.key] !== undefined)
    o[out.key] = pass ? inputs[pass.key]! : out.type === 'image' ? emptyImg(res) : out.type === 'number' ? 0 : ([0, 0, 0, 0] as RGBA)
  }
  // Output has no output port; pass its input as the result.
  if (!outs.length && inputs.in) o.out = inputs.in
  return o
}

/* ---------------------------------------------------------------------------
   Protocol
--------------------------------------------------------------------------- */
export type Request =
  | { kind: 'run'; gen: number; graph: EngineGraph; thumbRes: number; thumbs: boolean; preview: string | null; previewRes: number; keepRes: number[]; resend?: boolean }
  | { kind: 'render'; reqId: number; graph: EngineGraph; nodeId: string; res: number }

export type Thumb = { id: string; sig: string; ms: number; error?: string; blocked?: boolean; w?: number; h?: number; bytes?: Uint8ClampedArray<ArrayBuffer>; value?: number | RGBA }

export type Response =
  | { kind: 'status'; gen: number; status: Record<string, NodeStatus> }
  | { kind: 'thumb'; gen: number; thumb: Thumb }
  | { kind: 'preview'; gen: number; id: string; res: number; ms: number; error?: string; w?: number; h?: number; bytes?: Uint8ClampedArray<ArrayBuffer> }
  | { kind: 'done'; gen: number; ms: number }
  | { kind: 'render'; reqId: number; error?: string; w?: number; h?: number; bytes?: Uint8ClampedArray<ArrayBuffer> }

type Post = (m: Response, transfer?: Transferable[]) => void

export function createHost(post: Post) {
  const runner = new Runner()
  const sent = new Map<string, string>() // id → last thumb sig sent
  return async function handle(msg: Request) {
    if (msg.kind === 'render') {
      const r = new Runner()
      r.setGraph(msg.graph)
      const out = await r.evaluate(msg.nodeId, msg.res, { cache: new Map() })
      const img = out.outputs?.out
      if (!img || !isImg(img)) return post({ kind: 'render', reqId: msg.reqId, error: out.error ?? 'Nothing to render' })
      const bytes = toBytes(img)
      return post({ kind: 'render', reqId: msg.reqId, w: img.w, h: img.h, bytes }, [bytes.buffer])
    }

    runner.gen = msg.gen
    const gen = msg.gen
    if (msg.resend) sent.clear()
    const t0 = performance.now()
    runner.setGraph(msg.graph)
    runner.prune(msg.keepRes)
    post({ kind: 'status', gen, status: Object.fromEntries(runner.status) })
    try {
      if (msg.preview && msg.graph.nodes.some((n) => n.id === msg.preview)) {
        const pt = performance.now()
        const r = await runner.evaluate(msg.preview, msg.previewRes, { gen, yieldEvery: true })
        const img = r.outputs?.out
        if (img && isImg(img)) {
          const bytes = toBytes(img)
          post({ kind: 'preview', gen, id: msg.preview, res: msg.previewRes, ms: performance.now() - pt, w: img.w, h: img.h, bytes }, [bytes.buffer])
        } else post({ kind: 'preview', gen, id: msg.preview, res: msg.previewRes, ms: 0, error: r.error ?? 'This node has no image output' })
      } else post({ kind: 'preview', gen, id: msg.preview ?? '', res: msg.previewRes, ms: 0, error: 'Add an Output node to see the result' })

      if (msg.thumbs) {
        for (const n of msg.graph.nodes) {
          const sig = runner.sigOf(n.id)
          if (sent.get(n.id) === `${sig}@${msg.thumbRes}`) continue
          const r = await runner.evaluate(n.id, msg.thumbRes, { gen, yieldEvery: true })
          const thumb: Thumb = { id: n.id, sig, ms: r.ms, error: r.error }
          const st = runner.status.get(n.id)
          if (st?.blocked) thumb.blocked = true
          const out = r.outputs?.out
          const transfer: Transferable[] = []
          if (out !== undefined) {
            if (isImg(out)) { thumb.bytes = toBytes(out); thumb.w = out.w; thumb.h = out.h; transfer.push(thumb.bytes.buffer) }
            else thumb.value = out as number | RGBA
          }
          sent.set(n.id, `${sig}@${msg.thumbRes}`)
          post({ kind: 'thumb', gen, thumb }, transfer)
        }
      }
      post({ kind: 'done', gen, ms: performance.now() - t0 })
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e
      // A newer request superseded this one; thumbs not yet sent stay dirty.
    }
  }
}
