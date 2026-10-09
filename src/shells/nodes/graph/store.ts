/* ---------------------------------------------------------------------------
   The editor graph: React Flow nodes/edges + snapshot undo history.

   History follows the kit's params model: live changes (dragging a node,
   scrubbing a param) mutate state without a history entry; `commit()` on
   release records one undo step. Snapshots are JSON so they are cheap to
   compare and trivially serialisable.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type XYPosition } from '@xyflow/react'
import { portOf, type EngineGraph, type PortType } from '../engine/spec'
import { defOf, defaultParams } from './defs'
import { SAMPLES } from './samples'

export interface NodeData extends Record<string, unknown> { kind: string; title: string; params: Record<string, unknown>; bypass?: boolean }
export type GNode = Node<NodeData, 'proc'>
export type GEdge = Edge<{ ptype: PortType }, 'typed'>

export interface SavedGraph { version: 1; name: string; nodes: { id: string; kind: string; title: string; x: number; y: number; params: Record<string, unknown>; bypass?: boolean }[]; edges: { source: string; sourceHandle: string; target: string; targetHandle: string }[] }

interface GraphState {
  name: string
  nodes: GNode[]
  edges: GEdge[]
  committed: string
  past: string[]
  future: string[]
  /** true while a live (uncommitted) change is in flight — the evaluator renders a draft */
  live: boolean
}

const LS = 'studio:nodes:graph'

export const toSaved = (s: Pick<GraphState, 'name' | 'nodes' | 'edges'>): SavedGraph => ({
  version: 1,
  name: s.name,
  nodes: s.nodes.map((n) => ({ id: n.id, kind: n.data.kind, title: n.data.title, x: Math.round(n.position.x), y: Math.round(n.position.y), params: n.data.params, ...(n.data.bypass ? { bypass: true } : {}) })),
  edges: s.edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle ?? 'out', target: e.target, targetHandle: e.targetHandle ?? 'in' })),
})

const snap = (s: Pick<GraphState, 'name' | 'nodes' | 'edges'>) => JSON.stringify(toSaved(s))

const edgeType = (nodes: GNode[], source: string, sourceHandle: string | null | undefined): PortType => {
  const n = nodes.find((x) => x.id === source)
  return (n && portOf(n.data.kind, sourceHandle, 'out')?.type) || 'image'
}

const mkEdge = (nodes: GNode[], e: { source: string; sourceHandle: string; target: string; targetHandle: string }): GEdge => ({
  id: `e-${e.source}.${e.sourceHandle}-${e.target}.${e.targetHandle}`,
  type: 'typed',
  source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle,
  data: { ptype: edgeType(nodes, e.source, e.sourceHandle) },
})

export function fromSaved(g: SavedGraph): { name: string; nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = g.nodes.map((n) => ({
    id: n.id, type: 'proc', position: { x: n.x, y: n.y },
    data: { kind: n.kind, title: n.title ?? defOf(n.kind).label, params: { ...defaultParams(n.kind), ...n.params }, bypass: n.bypass },
  }))
  return { name: g.name, nodes, edges: g.edges.map((e) => mkEdge(nodes, e)) }
}

function initial(): GraphState {
  let g: { name: string; nodes: GNode[]; edges: GEdge[] } | null = null
  try { const s = localStorage.getItem(LS); if (s) g = fromSaved(JSON.parse(s)) } catch { /* corrupt */ }
  g ??= fromSaved(SAMPLES[0].graph)
  return { ...g, committed: snap(g), past: [], future: [], live: false }
}

export const graph = createStore<GraphState>(initial)
export const useGraph = <T,>(pick: (s: GraphState) => T) => useStore(graph, pick)

/* persistence — debounced */
let saveT: ReturnType<typeof setTimeout> | undefined
graph.subscribe((s, prev) => {
  if (s.nodes === prev.nodes && s.edges === prev.edges && s.name === prev.name) return
  clearTimeout(saveT)
  saveT = setTimeout(() => { try { localStorage.setItem(LS, snap(graph.getState())) } catch { /* quota */ } }, 300)
})

/* listeners told when history jumps (undo/redo/load) so per-node param stores can resync */
const jumpListeners = new Set<() => void>()
export const onJump = (fn: () => void) => { jumpListeners.add(fn); return () => jumpListeners.delete(fn) }

export function commit() {
  const s = graph.getState()
  const now = snap(s)
  if (now === s.committed) { if (s.live) graph.setState({ live: false }); return }
  graph.setState({ committed: now, past: [...s.past, s.committed].slice(-150), future: [], live: false })
}

function restore(json: string) {
  const sel = new Set(graph.getState().nodes.filter((n) => n.selected).map((n) => n.id))
  const g = fromSaved(JSON.parse(json))
  graph.setState({ ...g, nodes: g.nodes.map((n) => ({ ...n, selected: sel.has(n.id) })), committed: json, live: false })
  jumpListeners.forEach((fn) => fn())
}

export function undo() {
  const s = graph.getState()
  const prev = s.past.at(-1)
  if (!prev) return
  graph.setState({ past: s.past.slice(0, -1), future: [s.committed, ...s.future] })
  restore(prev)
}
export function redo() {
  const s = graph.getState()
  const [next, ...rest] = s.future
  if (!next) return
  graph.setState({ future: rest, past: [...s.past, s.committed] })
  restore(next)
}

/** Replace the whole document (load sample / import / new). One undo step. */
export function load(g: SavedGraph) {
  const s = graph.getState()
  const next = fromSaved(g)
  graph.setState({ ...next, live: false })
  const now = snap(next)
  graph.setState({ committed: now, past: [...s.past, s.committed].slice(-150), future: [] })
  jumpListeners.forEach((fn) => fn())
}

/* --- React Flow change handlers --- */
export function onNodesChange(changes: NodeChange<GNode>[]) {
  const s = graph.getState()
  // Output is the document's sink; keep at least the graph valid by allowing delete but warn in UI.
  graph.setState({ nodes: applyNodeChanges(changes, s.nodes) })
  if (changes.some((c) => c.type === 'remove')) {
    const ids = new Set(changes.filter((c) => c.type === 'remove').map((c) => (c as { id: string }).id))
    graph.setState({ edges: graph.getState().edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)) })
    commit()
  }
}
export function onEdgesChange(changes: EdgeChange<GEdge>[]) {
  graph.setState({ edges: applyEdgeChanges(changes, graph.getState().edges) })
  if (changes.some((c) => c.type === 'remove')) commit()
}

/** Would connecting source → target create a loop? */
export function createsCycle(source: string, target: string) {
  if (source === target) return true
  const edges = graph.getState().edges
  const stack = [target]
  const seen = new Set<string>()
  while (stack.length) {
    const id = stack.pop()!
    if (id === source) return true
    if (seen.has(id)) continue
    seen.add(id)
    for (const e of edges) if (e.source === id) stack.push(e.target)
  }
  return false
}

export function isValidConnection(c: Connection | GEdge) {
  const nodes = graph.getState().nodes
  const s = nodes.find((n) => n.id === c.source), t = nodes.find((n) => n.id === c.target)
  if (!s || !t) return false
  const out = portOf(s.data.kind, c.sourceHandle, 'out'), inp = portOf(t.data.kind, c.targetHandle, 'in')
  if (!out || !inp || out.type !== inp.type) return false
  return !createsCycle(c.source, c.target)
}

export function connect(c: Connection) {
  if (!isValidConnection(c)) return
  const s = graph.getState()
  // An input takes one wire: a new connection replaces the old one.
  const edges = s.edges.filter((e) => !(e.target === c.target && e.targetHandle === c.targetHandle))
  graph.setState({ edges: [...edges, mkEdge(s.nodes, { source: c.source, sourceHandle: c.sourceHandle ?? 'out', target: c.target, targetHandle: c.targetHandle ?? 'in' })] })
  commit()
}

const uid = (kind: string) => `${kind}-${Math.random().toString(36).slice(2, 7)}`

function uniqueTitle(label: string, nodes: GNode[]) {
  const taken = new Set(nodes.map((n) => n.data.title))
  if (!taken.has(label)) return label
  for (let i = 2; ; i++) if (!taken.has(`${label} ${i}`)) return `${label} ${i}`
}

export function addNode(kind: string, position: XYPosition, opts: { select?: boolean; params?: Record<string, unknown>; commit?: boolean } = {}) {
  const s = graph.getState()
  const id = uid(kind)
  const node: GNode = {
    id, type: 'proc', position,
    selected: opts.select !== false,
    data: { kind, title: uniqueTitle(defOf(kind).label, s.nodes), params: { ...defaultParams(kind), ...opts.params } },
  }
  graph.setState({ nodes: [...s.nodes.map((n) => (opts.select !== false ? { ...n, selected: false } : n)), node], edges: s.edges.map((e) => (e.selected ? { ...e, selected: false } : e)) })
  if (opts.commit !== false) commit()
  return id
}

export function setParams(id: string, params: Record<string, unknown>, live: boolean) {
  const s = graph.getState()
  graph.setState({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, params } } : n)), live })
}

export function updateData(ids: string[], fn: (d: NodeData) => Partial<NodeData>) {
  const set = new Set(ids)
  graph.setState({ nodes: graph.getState().nodes.map((n) => (set.has(n.id) ? { ...n, data: { ...n.data, ...fn(n.data) } } : n)) })
  commit()
}

export const selectedIds = () => graph.getState().nodes.filter((n) => n.selected).map((n) => n.id)

export function select(ids: string[]) {
  const set = new Set(ids)
  graph.setState({ nodes: graph.getState().nodes.map((n) => (n.selected === set.has(n.id) ? n : { ...n, selected: set.has(n.id) })), edges: graph.getState().edges.map((e) => (e.selected ? { ...e, selected: false } : e)) })
}

export function removeNodes(ids: string[]) {
  if (!ids.length) return
  const set = new Set(ids)
  const s = graph.getState()
  graph.setState({ nodes: s.nodes.filter((n) => !set.has(n.id)), edges: s.edges.filter((e) => !set.has(e.source) && !set.has(e.target)) })
  commit()
}

/* --- clipboard: nodes + the wires between them --- */
let clip: SavedGraph | null = null
export function copy(ids: string[]) {
  const set = new Set(ids)
  const s = graph.getState()
  const saved = toSaved({ name: s.name, nodes: s.nodes.filter((n) => set.has(n.id)), edges: s.edges.filter((e) => set.has(e.source) && set.has(e.target)) })
  clip = saved
  return saved.nodes.length
}
export function paste(offset = 32) {
  if (!clip?.nodes.length) return 0
  const s = graph.getState()
  const map = new Map(clip.nodes.map((n) => [n.id, uid(n.kind)]))
  const all = [...s.nodes]
  const fresh: GNode[] = clip.nodes.map((n) => {
    const node: GNode = { id: map.get(n.id)!, type: 'proc', selected: true, position: { x: n.x + offset, y: n.y + offset }, data: { kind: n.kind, title: uniqueTitle(n.title.replace(/ \d+$/, ''), all), params: structuredClone(n.params), bypass: n.bypass } }
    all.push(node)
    return node
  })
  const nodes = [...s.nodes.map((n) => ({ ...n, selected: false })), ...fresh]
  const edges = [...s.edges, ...clip.edges.map((e) => mkEdge(nodes, { ...e, source: map.get(e.source)!, target: map.get(e.target)! }))]
  graph.setState({ nodes, edges })
  clip = { ...clip, nodes: clip.nodes.map((n) => ({ ...n, x: n.x + offset, y: n.y + offset })) }
  commit()
  return fresh.length
}
export function duplicate(ids: string[]) { if (copy(ids)) paste(40) }

/** The engine's view of the graph: no positions, no selection. */
export function engineGraph(s = graph.getState()): EngineGraph {
  return {
    nodes: s.nodes.map((n) => ({ id: n.id, type: n.data.kind, params: n.data.params, bypass: n.data.bypass })),
    edges: s.edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle ?? 'out', target: e.target, targetHandle: e.targetHandle ?? 'in' })),
  }
}

export const outputId = (s = graph.getState()) => s.nodes.find((n) => n.data.kind === 'output')?.id ?? null
