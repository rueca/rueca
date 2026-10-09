/* ---------------------------------------------------------------------------
   Per-node parameter stores, so the kit <Inspector> can edit any node.

   The kit Inspector is bound to a ParamStore, not to (values, onChange), so
   each node instance gets a small non-persisted store whose schema is the
   node type's schema with "driven" rows disabled while their port is wired.
   Live changes flow into the graph (draft cook); commits become one graph
   undo step. Graph undo/redo pushes values back without echoing.
--------------------------------------------------------------------------- */
import { createParams, type AnyParams, type Folder, type ParamDef, type Schema } from '@kit'
import { specOf } from '../engine/spec'
import { defOf } from './defs'
import { commit, graph, onJump, setParams } from './store'

const cache = new Map<string, { kind: string; store: AnyParams }>()
let syncing = false

export const isDriven = (nodeId: string, port: string) => graph.getState().edges.some((e) => e.target === nodeId && e.targetHandle === port)

function drivenSchema(nodeId: string, kind: string): Schema {
  const base = defOf(kind).schema
  const ports = specOf(kind).inputs.filter((p) => p.param)
  if (!ports.length) return base
  const out: Schema = {}
  for (const [fk, f] of Object.entries(base)) {
    const params: Record<string, ParamDef> = {}
    for (const [k, d] of Object.entries(f.params)) {
      const port = ports.find((p) => p.param === k)
      params[k] = port && d.type !== 'action' && d.type !== 'monitor'
        ? { ...d, disabled: () => isDriven(nodeId, port.key), hint: `${d.hint ? `${d.hint} ` : ''}Overridden while the ${port.label} input is wired.` }
        : d
    }
    out[fk] = { ...f, params } as Folder
  }
  return out
}

export function storeFor(nodeId: string): AnyParams | null {
  const n = graph.getState().nodes.find((x) => x.id === nodeId)
  if (!n) return null
  let e = cache.get(nodeId)
  if (!e || e.kind !== n.data.kind) {
    const store = createParams(drivenSchema(nodeId, n.data.kind), { id: `nodes-${n.data.kind}`, persist: false, url: false }) as AnyParams
    syncing = true
    store.setState({ values: { ...n.data.params }, committed: { ...n.data.params }, past: [], future: [] })
    syncing = false
    store.subscribe((s, prev) => { if (!syncing && s.values !== prev.values) setParams(nodeId, s.values as Record<string, unknown>, true) })
    store.onCommit(() => { if (!syncing) commit() })
    e = { kind: n.data.kind, store }
    cache.set(nodeId, e)
  }
  return e.store
}

/** Undo / redo / load: push graph values back into any live stores. */
onJump(() => {
  const nodes = new Map(graph.getState().nodes.map((n) => [n.id, n]))
  syncing = true
  for (const [id, e] of cache) {
    const n = nodes.get(id)
    if (!n || n.data.kind !== e.kind) { cache.delete(id); continue }
    e.store.setState({ values: { ...n.data.params }, committed: { ...n.data.params } })
  }
  syncing = false
})
