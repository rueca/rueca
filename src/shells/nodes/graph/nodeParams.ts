/* ---------------------------------------------------------------------------
   The selected node in the kit <Inspector>, via the kit's item params:
   one small non-persisted store per node KIND (createItemParams), bound to
   whichever node is selected (bindItem). Live changes write into the graph
   (draft cook); the item's commit becomes ONE graph undo step; graph undo /
   redo flows back in through the subscription.

   Rows whose input port is wired are disabled ("driven") — the check reads
   the node currently bound, so the schema stays per kind.
--------------------------------------------------------------------------- */
import { bindItem, createItemParams, type AnyParams, type Folder, type ParamDef, type Schema } from '@kit'
import { specOf } from '../engine/spec'
import { defOf } from './defs'
import { commit, graph, setParams } from './store'

const stores = new Map<string, AnyParams>()
/** the node the inspector is bound to — driven-row checks read it */
let bound: string | null = null

export const isDriven = (nodeId: string, port: string) => graph.getState().edges.some((e) => e.target === nodeId && e.targetHandle === port)

function drivenSchema(kind: string): Schema {
  const base = defOf(kind).schema
  const ports = specOf(kind).inputs.filter((p) => p.param)
  if (!ports.length) return base
  const out: Schema = {}
  for (const [fk, f] of Object.entries(base)) {
    const params: Record<string, ParamDef> = {}
    for (const [k, d] of Object.entries(f.params)) {
      const port = ports.find((p) => p.param === k)
      params[k] = port && d.type !== 'action' && d.type !== 'monitor'
        ? { ...d, disabled: () => !!bound && isDriven(bound, port.key), hint: `${d.hint ? `${d.hint} ` : ''}Overridden while the ${port.label} input is wired.` }
        : d
    }
    out[fk] = { ...f, params } as Folder
  }
  return out
}

/** The item store for a node kind (created once). */
export function itemStoreFor(kind: string): AnyParams {
  let s = stores.get(kind)
  if (!s) { s = createItemParams(drivenSchema(kind), `nodes-${kind}`) as AnyParams; stores.set(kind, s) }
  return s
}

/** Bind a node to its kind's item store; returns the unbind. Call from a layout effect. */
export function bindNode(nodeId: string): () => void {
  const n = graph.getState().nodes.find((x) => x.id === nodeId)
  if (!n) return () => {}
  bound = nodeId
  const off = bindItem(itemStoreFor(n.data.kind), {
    read: () => graph.getState().nodes.find((x) => x.id === nodeId)?.data.params ?? null,
    write: (v) => setParams(nodeId, v, true),
    commit: () => commit(),
    subscribe: (fn) => graph.subscribe(fn),
  })
  return () => { off(); if (bound === nodeId) bound = null }
}
