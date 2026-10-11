/* Flows — state: view params (schema), the undoable document, transient UI. */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { defineSchema, folder, p, createParams, createDocStore, createHistory, useDoc, toast } from '@kit'
import { autoLayout, rehandle } from './layout'
import {
  demoFlows, makeEdge, makeNode, screenSize, SIZE, uid, SECTION_HUES,
  type Comment, type EdgeData, type Flow, type FlowEdge, type FlowNode, type FlowsDoc, type Kind, type NodeData, type Template,
} from './model'

/* ---------------------------------------------------------------- params */
export const schema = defineSchema({
  canvas: folder('Canvas', {
    background: p.select('dots', ['dots', 'lines', 'none'], { hint: 'Canvas pattern behind the flow.' }),
    snap: p.boolean(true, { label: 'Snap to grid', hint: 'Snap nodes to the grid while dragging.' }),
    grid: p.number(16, { min: 8, max: 48, step: 4, unit: 'px', label: 'Grid size', when: (v) => v.snap }),
    thumbnails: p.boolean(true, { label: 'Wireframes', hint: 'Draw the wireframe thumbnail inside each screen node.' }),
    minimap: p.boolean(true, { label: 'Minimap' }),
  }),
  connections: folder('Connections', {
    edgeStyle: p.select('smooth', [{ value: 'smooth', label: 'Step' }, { value: 'bezier', label: 'Curve' }, { value: 'straight', label: 'Straight' }], { label: 'Style', hint: 'Default route for connections without their own style.' }),
    edgeLabels: p.boolean(true, { label: 'Labels', hint: 'Show trigger + label pills on connections.' }),
    smartHandles: p.boolean(true, { label: 'Smart sides', hint: 'Re-pick the side a connection leaves from when you move a node.' }),
  }),
  layout: folder('Auto layout', {
    direction: p.select('LR', [{ value: 'LR', label: 'Across' }, { value: 'TB', label: 'Down' }], { hint: 'Main reading direction of the tidy-up.' }),
    rankGap: p.number(88, { min: 40, max: 240, step: 4, unit: 'px', label: 'Column gap' }),
    nodeGap: p.number(56, { min: 24, max: 160, step: 4, unit: 'px', label: 'Row gap' }),
    tidy: p.action('Tidy up', () => tidy(), { hint: 'Lay the flow out again (⇧L).' }),
  }, { collapsed: true }),
  walkthrough: folder('Walkthrough', {
    follow: p.boolean(true, { label: 'Camera follows' }),
    dim: p.boolean(true, { label: 'Dim others', hint: 'Fade everything that is not on the current step.' }),
    autoplay: p.number(0, { min: 0, max: 8, step: 0.5, unit: 's', hint: '0 = step manually with ← →.' }),
  }, { collapsed: true }),
})
export const params = createParams(schema, {
  id: 'flows',
  presets: [
    { name: 'Presentation', values: { background: 'none', thumbnails: true, edgeLabels: true, minimap: false } },
    { name: 'Dense map', values: { thumbnails: false, rankGap: 56, nodeGap: 32, background: 'lines' } },
  ],
})
export type V = ReturnType<typeof params.values>

/* ---------------------------------------------------------------- doc */
function initialDoc(): FlowsDoc {
  const v = params.values()
  const flows = demoFlows().map((f) => {
    const laid = autoLayout(f.nodes, f.edges, { direction: 'LR', rankGap: 88, nodeGap: 56, sizeOf: (n) => defaultSize(n, v.thumbnails) })
    return { ...f, nodes: laid.nodes, edges: laid.edges }
  })
  return { flows }
}
export const doc = createDocStore<FlowsDoc>(initialDoc(), { id: 'flows', version: 4 }) // v4: Gabinete demo (11 Oct 2026)
export const history = createHistory([doc, params])

/* ---------------------------------------------------------------- ui (not undoable) */
export type Tool = 'select' | 'hand' | 'comment'
export interface UI {
  flowId: string
  sel: { nodes: string[]; edges: string[] }
  measured: Record<string, { width: number; height: number }>
  tool: Tool
  /** walkthrough step index, null when not presenting */
  walk: number | null
  walkNodes: string[]
  walkEdges: string[]
  openComment: string | null
  draft: { x: number; y: number } | null
  showResolved: boolean
  rightTab: 'inspect' | 'comments'
  animating: boolean
}
export const ui = createStore<UI>(() => ({
  flowId: (() => { try { return localStorage.getItem('studio:flows:active') || 'flow-main' } catch { return 'flow-main' } })(),
  sel: { nodes: [], edges: [] },
  measured: {},
  tool: 'select',
  walk: null,
  walkNodes: [],
  walkEdges: [],
  openComment: null,
  draft: null,
  showResolved: false,
  rightTab: 'inspect',
  animating: false,
}))
export const useUI = <T,>(pick: (s: UI) => T) => useStore(ui, pick)

export const activeFlow = (): Flow => {
  const d = doc.get()
  return d.flows.find((f) => f.id === ui.getState().flowId) ?? d.flows[0]
}
export function useFlow(): Flow {
  const id = useUI((s) => s.flowId)
  return useDoc(doc, (d) => d.flows.find((f) => f.id === id) ?? d.flows[0])
}

export function defaultSize(n: FlowNode, thumbs = params.values().thumbnails) {
  if (n.type === 'screen') return screenSize(thumbs)
  if (n.type === 'section') return { w: n.width ?? SIZE.section.w, h: n.height ?? SIZE.section.h }
  return SIZE[(n.type as Kind) ?? 'screen']
}
export function sizeOf(n: FlowNode) {
  if (n.type === 'section') return defaultSize(n)
  const m = ui.getState().measured[n.id]
  return m ? { w: m.width, h: m.height } : defaultSize(n)
}

/* ---------------------------------------------------------------- mutations */
type FlowPatch = (f: Flow) => Flow
export function editFlow(fn: FlowPatch, opts: { commit?: boolean; label?: string } = {}) {
  const id = activeFlow().id
  doc.set((d) => ({ flows: d.flows.map((f) => (f.id === id ? { ...fn(f), updated: Date.now() } : f)) }), opts)
}
export const setNodes = (fn: (n: FlowNode[]) => FlowNode[], o?: { commit?: boolean; label?: string }) => editFlow((f) => ({ ...f, nodes: fn(f.nodes) }), o)
export const setEdges = (fn: (e: FlowEdge[]) => FlowEdge[], o?: { commit?: boolean; label?: string }) => editFlow((f) => ({ ...f, edges: fn(f.edges) }), o)

export const updateNodeData = (id: string, data: Partial<NodeData>, o?: { commit?: boolean }) =>
  setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)), o)
export const updateEdgeData = (id: string, data: Partial<EdgeData>, o?: { commit?: boolean }) =>
  setEdges((es) => es.map((e) => (e.id === id ? { ...e, data: { ...e.data!, ...data } } : e)), o)

export const select = (nodes: string[] = [], edges: string[] = []) => ui.setState({ sel: { nodes, edges } })

/** Which section rectangle contains this node's centre? */
export function sectionAt(nodes: FlowNode[], n: FlowNode): string | undefined {
  const s = sizeOf(n)
  const cx = n.position.x + s.w / 2, cy = n.position.y + s.h / 2
  const hit = nodes.filter((x) => x.type === 'section' && x.id !== n.id).find((x) => {
    const w = x.width ?? SIZE.section.w, h = x.height ?? SIZE.section.h
    return cx >= x.position.x && cx <= x.position.x + w && cy >= x.position.y && cy <= x.position.y + h
  })
  return hit?.id
}

/** After a drop: refresh section membership and smart handles for what moved. */
export function settle(moved: Set<string>, label = 'Move') {
  const v = params.values()
  setNodes((ns) => ns.map((n) => (moved.has(n.id) && n.type !== 'section' ? { ...n, data: { ...n.data, section: sectionAt(ns, n) } } : n)), { commit: false })
  if (v.smartHandles) {
    const f = activeFlow()
    setEdges((es) => rehandle(f.nodes, es, moved, v.direction as 'LR' | 'TB', sizeOf), { commit: false })
  }
  doc.commit(label)
}

export function addNode(kind: Kind, at?: { x: number; y: number }, data: Partial<NodeData> = {}) {
  const f = activeFlow()
  const size = kind === 'screen' ? screenSize(params.values().thumbnails) : SIZE[kind]
  const center = at ?? viewportCenter()
  const pos = { x: Math.round(center.x - size.w / 2), y: Math.round(center.y - size.h / 2) }
  const extra: Partial<NodeData> = kind === 'section' ? { hue: SECTION_HUES[f.nodes.filter((n) => n.type === 'section').length % SECTION_HUES.length], name: `Section ${f.nodes.filter((n) => n.type === 'section').length + 1}` } : {}
  const node = makeNode(kind, pos, { ...extra, ...data })
  node.data.section = kind === 'section' ? undefined : sectionAt(f.nodes, node)
  // Connect from the single selected node, Whimsical-style, when adding a step.
  const from = ui.getState().sel.nodes.length === 1 ? f.nodes.find((n) => n.id === ui.getState().sel.nodes[0]) : undefined
  const link = from && kind !== 'note' && kind !== 'section' && from.type !== 'note' && from.type !== 'section' && !at
  if (link) {
    const fs = sizeOf(from)
    const dir = params.values().direction
    node.position = dir === 'LR' ? { x: from.position.x + fs.w + 88, y: Math.round(from.position.y + fs.h / 2 - size.h / 2) } : { x: Math.round(from.position.x + fs.w / 2 - size.w / 2), y: from.position.y + fs.h + 72 }
    node.data.section = from.data.section
  }
  editFlow((fl) => ({
    ...fl,
    nodes: kind === 'section' ? [node, ...fl.nodes] : [...fl.nodes, node],
    edges: link ? [...fl.edges, makeEdge(from!.id, node.id, { trigger: 'tap' }, params.values().direction === 'LR' ? ['r', 'l'] : ['b', 't'])] : fl.edges,
  }), { label: `Add ${kind}` })
  select([node.id])
  const s = kind === 'section' ? SIZE.section : size
  if (!at) setTimeout(() => viewport.reveal?.({ ...node.position, w: s.w, h: s.h }), 0)
  return node
}

export const addScreen = (template: Template, at?: { x: number; y: number }) => addNode('screen', at, { template, name: TEMPLATE_NAME(template) })
const TEMPLATE_NAME = (t: Template) => ({ splash: 'Splash', welcome: 'Welcome', signup: 'Sign up', login: 'Log in', otp: 'Verify code', permissions: 'Permission', paywall: 'Paywall', home: 'Home feed', search: 'Search', product: 'Product', cart: 'Cart', address: 'Address', payment: 'Payment', review: 'Review', success: 'Success', error: 'Error', empty: 'Empty state', profile: 'Profile', settings: 'Settings' })[t]

export function deleteSelection() {
  const { nodes, edges } = ui.getState().sel
  if (!nodes.length && !edges.length) return
  const ns = new Set(nodes)
  editFlow((f) => ({
    ...f,
    nodes: f.nodes.filter((n) => !ns.has(n.id)).map((n) => (n.data.section && ns.has(n.data.section) ? { ...n, data: { ...n.data, section: undefined } } : n)),
    edges: f.edges.filter((e) => !edges.includes(e.id) && !ns.has(e.source) && !ns.has(e.target)),
    comments: f.comments.filter((c) => !c.node || !ns.has(c.node)),
  }), { label: 'Delete' })
  select()
}

/* clipboard: copy / paste / duplicate keep internal edges */
let clipboard: { nodes: FlowNode[]; edges: FlowEdge[] } | null = null
export function copySelection() {
  const f = activeFlow()
  const ids = new Set(ui.getState().sel.nodes)
  if (!ids.size) return false
  clipboard = { nodes: f.nodes.filter((n) => ids.has(n.id)), edges: f.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) }
  return true
}
export function paste(offset = 32) {
  if (!clipboard) return
  const map = new Map<string, string>()
  const nodes = clipboard.nodes.map((n) => {
    const id = uid()
    map.set(n.id, id)
    return { ...n, id, position: { x: n.position.x + offset, y: n.position.y + offset }, data: { ...n.data } }
  })
  const edges = clipboard.edges.map((e) => ({ ...e, id: uid('e'), source: map.get(e.source)!, target: map.get(e.target)! }))
  editFlow((f) => ({ ...f, nodes: [...f.nodes, ...nodes], edges: [...f.edges, ...edges] }), { label: 'Paste' })
  clipboard = { nodes: nodes, edges }
  select(nodes.map((n) => n.id))
}
export function duplicate() { if (copySelection()) paste(24) }

/* ---------------------------------------------------------------- layout */
export function tidy() {
  const v = params.values()
  const f = activeFlow()
  if (!f.nodes.length) return
  const out = autoLayout(f.nodes, f.edges, { direction: v.direction as 'LR' | 'TB', rankGap: v.rankGap, nodeGap: v.nodeGap, sizeOf })
  ui.setState({ animating: true })
  editFlow((fl) => ({ ...fl, nodes: out.nodes, edges: out.edges }), { label: 'Tidy up' })
  setTimeout(() => ui.setState({ animating: false }), 480)
  setTimeout(() => viewport.fit?.(), 60)
}

/* ---------------------------------------------------------------- flows list */
export function switchFlow(id: string) {
  ui.setState({ flowId: id, sel: { nodes: [], edges: [] }, walk: null, openComment: null, draft: null })
  try { localStorage.setItem('studio:flows:active', id) } catch { /* noop */ }
}
export function newFlow() {
  const f: Flow = { id: uid('flow-'), name: `Untitled flow ${doc.get().flows.length + 1}`, description: '', owner: 'you', nodes: [], edges: [], comments: [], updated: Date.now() }
  doc.set((d) => ({ flows: [...d.flows, f] }), { label: 'New flow' })
  switchFlow(f.id)
}
export function renameFlow(id: string, name: string) {
  doc.set((d) => ({ flows: d.flows.map((f) => (f.id === id ? { ...f, name } : f)) }), { label: 'Rename flow' })
}
export function duplicateFlow(id: string) {
  const src = doc.get().flows.find((f) => f.id === id)
  if (!src) return
  const f = { ...structuredClone(src), id: uid('flow-'), name: `${src.name} copy`, updated: Date.now() }
  doc.set((d) => ({ flows: [...d.flows, f] }), { label: 'Duplicate flow' })
  switchFlow(f.id)
}
export function deleteFlow(id: string) {
  const d = doc.get()
  if (d.flows.length <= 1) { toast('A file needs at least one flow'); return }
  const idx = d.flows.findIndex((f) => f.id === id)
  doc.set({ flows: d.flows.filter((f) => f.id !== id) }, { label: 'Delete flow' })
  if (ui.getState().flowId === id) switchFlow(doc.get().flows[Math.max(0, idx - 1)].id)
  toast('Flow deleted', { action: { label: 'Undo', onClick: () => history.undo() } })
}
export function importFlow(f: Flow) {
  const flow = { ...f, id: uid('flow-'), updated: Date.now() }
  doc.set((d) => ({ flows: [...d.flows, flow] }), { label: 'Import flow' })
  switchFlow(flow.id)
}
export function resetDemo() {
  doc.replace(initialDoc(), { history: false })
  params.reset()
  history.clear()
  switchFlow('flow-main')
}

/* ---------------------------------------------------------------- comments */
export function addComment(at: { x: number; y: number }, text: string) {
  const f = activeFlow()
  // anchor to the node under the pin so it travels with it
  const host = [...f.nodes].reverse().find((n) => n.type !== 'section' && (() => { const s = sizeOf(n); return at.x >= n.position.x && at.x <= n.position.x + s.w && at.y >= n.position.y && at.y <= n.position.y + s.h })())
  const c: Comment = host
    ? { id: uid('c'), node: host.id, x: at.x - host.position.x, y: at.y - host.position.y, author: 'you', text, at: Date.now(), replies: [] }
    : { id: uid('c'), x: at.x, y: at.y, author: 'you', text, at: Date.now(), replies: [] }
  editFlow((fl) => ({ ...fl, comments: [...fl.comments, c] }), { label: 'Comment' })
  return c
}
export const updateComment = (id: string, fn: (c: Comment) => Comment | null) =>
  editFlow((f) => ({ ...f, comments: f.comments.map((c) => (c.id === id ? fn(c) : c)).filter(Boolean) as Comment[] }), { label: 'Comment' })
export const commentPos = (f: Flow, c: Comment) => {
  const host = c.node ? f.nodes.find((n) => n.id === c.node) : undefined
  return host ? { x: host.position.x + c.x, y: host.position.y + c.y } : { x: c.x, y: c.y }
}

/* ---------------------------------------------------------------- viewport bridge
   The canvas registers its React Flow helpers here so palette commands and
   panels (outside the ReactFlowProvider) can drive the camera. */
export const viewport: {
  fit?: (o?: { duration?: number }) => void
  center?: () => { x: number; y: number }
  focus?: (ids: string[], o?: { duration?: number; zoom?: number }) => void
  focusPoint?: (p: { x: number; y: number }) => void
  zoomIn?: () => void
  zoomOut?: () => void
  zoomTo?: (z: number) => void
  el?: () => HTMLElement | null
  present?: (b: boolean) => void
  /** pan (not zoom) so this flow-space rect is on screen */
  reveal?: (r: { x: number; y: number; w: number; h: number }) => void
} = {}
export const viewportCenter = () => viewport.center?.() ?? { x: 0, y: 0 }
