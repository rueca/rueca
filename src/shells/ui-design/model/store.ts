/* ---------------------------------------------------------------------------
   Document store with history. Same commit model as the kit's createParams:
   edits made with { commit: false } (mid-drag) are live but not undo steps;
   commit() on pointer-up pushes ONE step. Undo restores the selection that
   was current when the step was made (Figma does this).

   The document is too structured for a flat param schema, so it lives here;
   tunable studio preferences (snapping, nudge, export) use createParams.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { seedDoc } from './seed'
import { find, update, updateMany, remove, insert, locate, ancestors, cloneFresh, topMost, childrenOf } from './tree'
import { layoutPage, union, sizeOf } from './layout'
import { base, frame, solid } from './factory'
import { uid, type Box, type BoolOp, type Doc, type Node, type Page, type Tool } from './types'

const LS = 'studio:ui-design:doc:v1'
type Snap = { doc: Doc; selection: string[]; pageId: string }

export interface Guide { axis: 'x' | 'y'; at: number; from: number; to: number }
export interface DesignState {
  doc: Doc
  pageId: string
  selection: string[]
  hover: string | null
  tool: Tool
  editing: string | null
  tab: 'design' | 'prototype'
  /** a canvas gesture is in progress — hides the context bar */
  gesture: null | 'move' | 'resize' | 'rotate' | 'draw' | 'marquee' | 'pan'
  guides: Guide[]
  marquee: Box | null
  /** auto-layout insertion indicator in world space */
  insertion: { x: number; y: number; w: number; h: number } | null
  dropTarget: string | null
  /** comment thread open in the canvas */
  openComment: string | null
  /** the ⌥ key is down: show distance measurements */
  measuring: boolean
  anchor: Snap
  past: Snap[]
  future: Snap[]
}

function load(): Doc {
  try { const s = localStorage.getItem(LS); if (s) return JSON.parse(s) } catch { /* noop */ }
  return seedDoc()
}
const doc0 = load()

export const design = createStore<DesignState>(() => ({
  doc: doc0, pageId: doc0.pages[0].id, selection: [], hover: null, tool: 'move', editing: null, tab: 'design',
  gesture: null, guides: [], marquee: null, insertion: null, dropTarget: null, openComment: null, measuring: false,
  anchor: { doc: doc0, selection: [], pageId: doc0.pages[0].id }, past: [], future: [],
}))
export const useDesign = <T,>(pick: (s: DesignState) => T) => useStore(design, pick)

let saveTimer = 0
const persist = (doc: Doc) => { clearTimeout(saveTimer); saveTimer = window.setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(doc)) } catch { /* quota */ } }, 300) }

/* --- reading ---------------------------------------------------------------- */
export const get = () => design.getState()
export const page = (s: DesignState = get()): Page => s.doc.pages.find((p) => p.id === s.pageId) ?? s.doc.pages[0]
export const nodesOf = (s: DesignState = get()) => page(s).nodes
export const layout = (s: DesignState = get()) => layoutPage(page(s))
export const node = (id: string, s: DesignState = get()) => find(nodesOf(s), id)
export const selectedNodes = (s: DesignState = get()) => s.selection.map((id) => find(nodesOf(s), id)).filter(Boolean) as Node[]
export const parentOf = (id: string, s: DesignState = get()) => locate(nodesOf(s), id)?.parent ?? null
export const boxOf = (id: string, s: DesignState = get()) => layout(s).get(id)
export const selectionBox = (s: DesignState = get()) => union(s.selection.map((id) => layout(s).get(id)).filter(Boolean) as Box[])
export const inAutoLayout = (id: string, s: DesignState = get()) => !!parentOf(id, s)?.layout

/* --- writing ----------------------------------------------------------------- */
type Opt = { commit?: boolean }

export function setNodes(fn: (nodes: Node[]) => Node[], o: Opt = {}) {
  const s = get()
  const p = page(s)
  const next = fn(p.nodes)
  if (next === p.nodes) return
  design.setState({ doc: { ...s.doc, pages: s.doc.pages.map((x) => (x.id === p.id ? { ...x, nodes: next } : x)) } })
  if (o.commit !== false) commit()
}
export function setPage(patch: Partial<Page>, o: Opt = {}) {
  const s = get()
  design.setState({ doc: { ...s.doc, pages: s.doc.pages.map((x) => (x.id === s.pageId ? { ...x, ...patch } : x)) } })
  if (o.commit !== false) commit()
}
export function setDoc(fn: (d: Doc) => Doc, o: Opt = {}) {
  design.setState({ doc: fn(get().doc) })
  if (o.commit !== false) commit()
}
export function patchNode(id: string, patch: Partial<Node> | ((n: Node) => Partial<Node>), o: Opt = {}) {
  setNodes((ns) => update(ns, id, (n) => ({ ...n, ...(typeof patch === 'function' ? patch(n) : patch) })), o)
}
export function patchNodes(ids: string[], patch: Partial<Node> | ((n: Node) => Partial<Node>), o: Opt = {}) {
  setNodes((ns) => updateMany(ns, new Set(ids), (n) => ({ ...n, ...(typeof patch === 'function' ? patch(n) : patch) })), o)
}
export const patchSelection = (patch: Partial<Node> | ((n: Node) => Partial<Node>), o: Opt = {}) => patchNodes(get().selection, patch, o)

export function commit() {
  const s = get()
  if (s.doc === s.anchor.doc) return
  design.setState({ past: [...s.past, s.anchor].slice(-200), future: [], anchor: { doc: s.doc, selection: s.selection, pageId: s.pageId } })
  persist(s.doc)
}

const restore = (snap: Snap) => {
  const exists = (id: string) => snap.doc.pages.some((p) => find(p.nodes, id))
  design.setState({ doc: snap.doc, selection: snap.selection.filter(exists), pageId: snap.doc.pages.some((p) => p.id === snap.pageId) ? snap.pageId : snap.doc.pages[0].id, anchor: snap, editing: null })
  persist(snap.doc)
}
export function undo() {
  const s = get()
  const prev = s.past.at(-1)
  if (!prev) return false
  design.setState({ past: s.past.slice(0, -1), future: [{ ...s.anchor, selection: s.selection }, ...s.future] })
  restore(prev)
  return true
}
export function redo() {
  const s = get()
  const [next, ...rest] = s.future
  if (!next) return false
  design.setState({ future: rest, past: [...s.past, { ...s.anchor, selection: s.selection }] })
  restore(next)
  return true
}

export function select(ids: string[]) {
  const s = get()
  design.setState({ selection: ids, editing: s.editing && ids.includes(s.editing) ? s.editing : null, anchor: s.doc === s.anchor.doc ? { ...s.anchor, selection: ids } : s.anchor })
}
export const setTool = (tool: Tool) => design.setState({ tool, editing: null })
export const setHover = (hover: string | null) => get().hover !== hover && design.setState({ hover })
export const gotoPage = (pageId: string) => design.setState({ pageId, selection: [], hover: null, editing: null })

export function resetDocument() {
  const d = seedDoc()
  design.setState({ doc: d, pageId: d.pages[0].id, selection: [], editing: null })
  commit()
}

/* --- structural operations ----------------------------------------------------- */
export function deleteSelection() {
  const s = get()
  if (!s.selection.length) return
  setNodes((ns) => remove(ns, new Set(s.selection)))
  select([])
}

/** ⌘D. Free nodes are offset by 10px; auto-layout children are inserted after the original. */
export function duplicateSelection(offset = 10, inPlace = false) {
  const s = get()
  const ids = topMost(nodesOf(s), s.selection)
  if (!ids.length) return
  const fresh: string[] = []
  setNodes((ns) => {
    let out = ns
    for (const id of ids) {
      const loc = locate(out, id)
      const orig = find(out, id)
      if (!loc || !orig) continue
      const copy = cloneFresh(orig)
      const auto = !!loc.parent?.layout
      if (!auto) { copy.x += offset; copy.y += offset }
      if (!loc.parent && orig.type === 'frame' && !inPlace) { copy.x = orig.x + (boxOf(id, s)?.w ?? orig.w) + 80; copy.y = orig.y }
      copy.name = orig.name
      out = insert(out, loc.parent?.id ?? null, copy, loc.index + 1)
      fresh.push(copy.id)
    }
    return out
  })
  select(fresh)
}

let clipboard: Node[] = []
export function copySelection() {
  const s = get()
  clipboard = topMost(nodesOf(s), s.selection).map((id) => node(id, s)!).filter(Boolean).map((n) => structuredClone(n))
  // carry absolute positions so paste lands in place
  clipboard.forEach((n) => { const b = boxOf(n.id, s); if (b) { n.x = b.x; n.y = b.y } })
  return clipboard.length
}
export function paste() {
  if (!clipboard.length) return
  const s = get()
  const target = s.selection.length === 1 ? node(s.selection[0], s) : null
  const into = target?.type === 'frame' ? target : null
  const pb = into ? boxOf(into.id, s) : null
  const fresh = clipboard.map((n) => {
    const c = cloneFresh(n)
    if (pb) { c.x = Math.round(n.x - pb.x); c.y = Math.round(n.y - pb.y); if (c.x < 0 || c.x > pb.w || c.y < 0 || c.y > pb.h) { c.x = 16; c.y = 16 } }
    else { c.x += 20; c.y += 20 }
    return c
  })
  setNodes((ns) => insert(ns, into?.id ?? null, fresh))
  select(fresh.map((n) => n.id))
}

/** ⌘] / ⌘[ / ⌥⌘] / ⌥⌘[ — paint order within the parent */
export function reorder(dir: 'forward' | 'backward' | 'front' | 'back') {
  const s = get()
  for (const id of s.selection) {
    setNodes((ns) => {
      const loc = locate(ns, id)
      if (!loc) return ns
      const sibs = childrenOf(ns, loc.parent?.id ?? null)
      const to = dir === 'front' ? sibs.length - 1 : dir === 'back' ? 0 : dir === 'forward' ? Math.min(sibs.length - 1, loc.index + 1) : Math.max(0, loc.index - 1)
      if (to === loc.index) return ns
      const n = sibs[loc.index]
      return insert(remove(ns, new Set([id])), loc.parent?.id ?? null, n, to)
    }, { commit: false })
  }
  commit()
}

/** Move a node to a new parent (null = page), keeping its absolute position unless the parent is auto-layout. */
export function reparent(nodes: Node[], id: string, parentId: string | null, index?: number, abs?: { x: number; y: number }): Node[] {
  const n = find(nodes, id)
  if (!n) return nodes
  const without = remove(nodes, new Set([id]))
  const L = layoutPage({ id: '', name: '', bg: '', nodes, comments: [] })
  const a = abs ?? L.get(id) ?? { x: n.x, y: n.y }
  const pb = parentId ? L.get(parentId) : null
  const moved = { ...n, x: Math.round(a.x - (pb?.x ?? 0)), y: Math.round(a.y - (pb?.y ?? 0)) }
  return insert(without, parentId, moved, index)
}

/** ⌥⌘G frame selection / ⌘G group: wrap the top-most selection in a new frame. */
export function wrapSelection(kind: 'frame' | 'group' = 'frame') {
  const s = get()
  const ids = topMost(nodesOf(s), s.selection)
  if (!ids.length) return
  const L = layout(s)
  const parentId = parentOf(ids[0], s)?.id ?? null
  if (ids.some((id) => (parentOf(id, s)?.id ?? null) !== parentId)) return
  const parent = parentId ? node(parentId, s)! : null
  const pb = parentId ? L.get(parentId)! : { x: 0, y: 0, w: 0, h: 0 }
  const bb = union(ids.map((id) => L.get(id)!).filter(Boolean))!
  const sibs = childrenOf(nodesOf(s), parentId)
  const order = sibs.filter((n) => ids.includes(n.id))
  const index = Math.max(...order.map((n) => sibs.indexOf(n))) - order.length + 1
  const wrapper = frame({
    name: kind === 'group' ? 'Group' : 'Frame', group: kind === 'group', fills: [], clip: false,
    x: Math.round(bb.x - pb.x), y: Math.round(bb.y - pb.y), w: Math.round(bb.w), h: Math.round(bb.h),
    sizingW: parent?.layout ? 'hug' : 'fixed', sizingH: parent?.layout ? 'hug' : 'fixed',
    auto: parent?.layout ? { dir: 'row', gap: 0 } : null,
    children: order.map((n) => { const b = L.get(n.id)!; return { ...n, x: Math.round(b.x - bb.x), y: Math.round(b.y - bb.y) } }),
  })
  setNodes((ns) => insert(remove(ns, new Set(ids)), parentId, wrapper, Math.max(0, index)))
  select([wrapper.id])
}

/** ⇧⌘G — lift children out of the selected frames/groups/booleans. */
export function ungroup() {
  const s = get()
  const L = layout(s)
  const lifted: string[] = []
  let ns = nodesOf(s)
  for (const id of s.selection) {
    const n = find(ns, id)
    if (!n?.children?.length) continue
    const loc = locate(ns, id)!
    const pb = loc.parent ? L.get(loc.parent.id)! : { x: 0, y: 0 }
    const kids = n.children.map((k) => { const b = L.get(k.id) ?? { x: k.x, y: k.y }; lifted.push(k.id); return { ...k, x: Math.round(b.x - pb.x), y: Math.round(b.y - pb.y) } })
    ns = insert(remove(ns, new Set([id])), loc.parent?.id ?? null, kids, loc.index)
  }
  if (!lifted.length) return
  setNodes(() => ns)
  select(lifted)
}

/** ⇧A — add auto layout, inferring direction and gap from the children's arrangement. */
export function addAutoLayout() {
  const s = get()
  const sel = selectedNodes(s)
  if (sel.length === 1 && sel[0].type === 'frame') {
    const f = sel[0]
    if (f.layout) { patchNode(f.id, { layout: null, sizingW: 'fixed', sizingH: 'fixed', w: boxOf(f.id)!.w, h: boxOf(f.id)!.h }); return }
    const L = layout(s)
    const kids = (f.children ?? []).map((k) => ({ k, b: L.get(k.id)! })).filter((x) => x.b)
    const xs = kids.map((x) => x.b.x), ys = kids.map((x) => x.b.y)
    const spreadX = Math.max(...xs, 0) - Math.min(...xs, 0), spreadY = Math.max(...ys, 0) - Math.min(...ys, 0)
    const dir = spreadX >= spreadY ? 'row' : 'column'
    const sorted = [...kids].sort((a, b) => (dir === 'row' ? a.b.x - b.b.x : a.b.y - b.b.y))
    const fb = L.get(f.id)!
    let gap = 10
    if (sorted.length > 1) {
      const gaps = sorted.slice(1).map((x, i) => (dir === 'row' ? x.b.x - (sorted[i].b.x + sorted[i].b.w) : x.b.y - (sorted[i].b.y + sorted[i].b.h)))
      gap = Math.max(0, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length))
    }
    const bb = union(kids.map((x) => x.b))
    const pad: [number, number, number, number] = bb ? [Math.max(0, Math.round(bb.y - fb.y)), Math.max(0, Math.round(fb.x + fb.w - bb.x - bb.w)), Math.max(0, Math.round(fb.y + fb.h - bb.y - bb.h)), Math.max(0, Math.round(bb.x - fb.x))] : [16, 16, 16, 16]
    patchNode(f.id, { layout: { dir, gap, pad, alignX: 'start', alignY: 'start' }, sizingW: 'hug', sizingH: 'hug', children: sorted.map((x) => x.k) })
    return
  }
  if (!sel.length) return
  wrapSelection('frame')
  const w = selectedNodes()[0]
  if (!w) return
  const L = layout()
  const kids = (w.children ?? []).map((k) => ({ k, b: L.get(k.id)! }))
  const spreadX = Math.max(...kids.map((x) => x.b.x)) - Math.min(...kids.map((x) => x.b.x))
  const spreadY = Math.max(...kids.map((x) => x.b.y)) - Math.min(...kids.map((x) => x.b.y))
  const dir = spreadX >= spreadY ? 'row' : 'column'
  const sorted = [...kids].sort((a, b) => (dir === 'row' ? a.b.x - b.b.x : a.b.y - b.b.y)).map((x) => x.k)
  patchNode(w.id, { name: 'Frame', layout: { dir, gap: 10, pad: [0, 0, 0, 0], alignX: 'start', alignY: 'start' }, sizingW: 'hug', sizingH: 'hug', children: sorted })
}

export function toggleComponent() {
  const sel = selectedNodes()
  if (!sel.length) return
  if (sel.length === 1 && sel[0].type === 'frame') { patchNode(sel[0].id, { component: !sel[0].component }); return sel[0].component ? 'detached' : 'created' }
  wrapSelection('frame')
  patchSelection({ component: true, name: 'Component' })
  return 'created'
}

/** Boolean ops over shapes: wraps rects/ellipses into a boolean node with the first shape's fill. */
export function booleanOp(op: BoolOp) {
  const s = get()
  const sel = topMost(nodesOf(s), s.selection).map((id) => node(id, s)!).filter(Boolean)
  const existing = sel.length === 1 && sel[0].type === 'boolean' ? sel[0] : null
  if (existing) { patchNode(existing.id, { bool: op, name: op[0].toUpperCase() + op.slice(1) }); return true }
  if (sel.length < 2 || sel.some((n) => n.type !== 'rect' && n.type !== 'ellipse')) return false
  const L = layout(s)
  const parentId = parentOf(sel[0].id, s)?.id ?? null
  if (sel.some((n) => (parentOf(n.id, s)?.id ?? null) !== parentId)) return false
  const pb = parentId ? L.get(parentId)! : { x: 0, y: 0 }
  const bb = union(sel.map((n) => L.get(n.id)!))!
  const sibs = childrenOf(nodesOf(s), parentId)
  const ordered = sibs.filter((n) => sel.some((x) => x.id === n.id))
  const idx = sibs.indexOf(ordered[0])
  const b = base('boolean', {
    name: op[0].toUpperCase() + op.slice(1), bool: op, x: Math.round(bb.x - pb.x), y: Math.round(bb.y - pb.y), w: Math.round(bb.w), h: Math.round(bb.h),
    fills: ordered[0].fills.length ? ordered[0].fills : [solid('#d9d9d9')], strokes: ordered[0].strokes, effects: [],
    children: ordered.map((n) => { const nb = L.get(n.id)!; return { ...n, x: Math.round(nb.x - bb.x), y: Math.round(nb.y - bb.y) } }),
  })
  setNodes((ns) => insert(remove(ns, new Set(sel.map((n) => n.id))), parentId, b, idx))
  select([b.id])
  return true
}

/** Align the selection to its bounding box, or to the parent frame for a single node. */
export function align(edge: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
  const s = get()
  const ids = topMost(nodesOf(s), s.selection).filter((id) => !inAutoLayout(id, s))
  if (!ids.length) return
  const L = layout(s)
  const target = ids.length === 1 ? (parentOf(ids[0], s) ? L.get(parentOf(ids[0], s)!.id)! : null) : union(ids.map((id) => L.get(id)!))
  if (!target) return
  setNodes((ns) => {
    let out = ns
    for (const id of ids) {
      const b = L.get(id)!
      let dx = 0, dy = 0
      if (edge === 'left') dx = target.x - b.x
      if (edge === 'hcenter') dx = target.x + target.w / 2 - (b.x + b.w / 2)
      if (edge === 'right') dx = target.x + target.w - (b.x + b.w)
      if (edge === 'top') dy = target.y - b.y
      if (edge === 'vcenter') dy = target.y + target.h / 2 - (b.y + b.h / 2)
      if (edge === 'bottom') dy = target.y + target.h - (b.y + b.h)
      out = update(out, id, (n) => ({ ...n, x: Math.round(n.x + dx), y: Math.round(n.y + dy) }))
    }
    return out
  })
}

/** Equal spacing between 3+ nodes along an axis. */
export function distribute(axis: 'x' | 'y') {
  const s = get()
  const ids = topMost(nodesOf(s), s.selection).filter((id) => !inAutoLayout(id, s))
  if (ids.length < 3) return
  const L = layout(s)
  const items = ids.map((id) => ({ id, b: L.get(id)! })).sort((a, b) => (axis === 'x' ? a.b.x - b.b.x : a.b.y - b.b.y))
  const first = items[0].b, last = items.at(-1)!.b
  const total = axis === 'x' ? last.x + last.w - first.x : last.y + last.h - first.y
  const sizes = items.reduce((t, i) => t + (axis === 'x' ? i.b.w : i.b.h), 0)
  const gap = (total - sizes) / (items.length - 1)
  let cursor = axis === 'x' ? first.x : first.y
  setNodes((ns) => {
    let out = ns
    for (const it of items) {
      const d = cursor - (axis === 'x' ? it.b.x : it.b.y)
      out = update(out, it.id, (n) => (axis === 'x' ? { ...n, x: Math.round(n.x + d) } : { ...n, y: Math.round(n.y + d) }))
      cursor += (axis === 'x' ? it.b.w : it.b.h) + gap
    }
    return out
  })
}

/** Arrow keys. Free nodes nudge; auto-layout children reorder (Figma). */
export function nudge(dx: number, dy: number) {
  const s = get()
  const ids = topMost(nodesOf(s), s.selection)
  if (!ids.length) return
  const auto = ids.filter((id) => inAutoLayout(id, s))
  const free = ids.filter((id) => !inAutoLayout(id, s))
  let ns = nodesOf(s)
  for (const id of free) ns = update(ns, id, (n) => ({ ...n, x: n.x + dx, y: n.y + dy }))
  for (const id of auto) {
    const loc = locate(ns, id)!
    const p = loc.parent!
    const step = p.layout!.dir === 'row' ? Math.sign(dx) : Math.sign(dy)
    if (!step) continue
    const to = Math.max(0, Math.min(p.children!.length - 1, loc.index + step))
    const n = p.children![loc.index]
    ns = insert(remove(ns, new Set([id])), p.id, n, to)
  }
  setNodes(() => ns)
}

export function addNode(n: Node, parentId: string | null, index?: number) {
  setNodes((ns) => insert(ns, parentId, n, index))
  select([n.id])
}

export function renameNode(id: string, name: string) { patchNode(id, { name }) }

/** Every interaction pointing at a frame that no longer exists is dropped on read. */
export const frames = (s: DesignState = get()) => page(s).nodes.filter((n) => n.type === 'frame')

export function selectAll() {
  const s = get()
  const sel = s.selection[0]
  const parent = sel ? parentOf(sel, s) : null
  select((parent ? parent.children ?? [] : nodesOf(s)).filter((n) => n.visible && !n.locked).map((n) => n.id))
}

export function selectParent() {
  const s = get()
  const p = s.selection[0] && parentOf(s.selection[0], s)
  if (p) select([p.id]); else select([])
}
export function selectChildren() {
  const sel = selectedNodes()
  const kids = sel.flatMap((n) => n.children ?? []).filter((n) => n.visible)
  if (kids.length) select(kids.map((k) => k.id))
}

export function addPage() {
  const id = uid('pg')
  setDoc((d) => ({ ...d, pages: [...d.pages, { id, name: `Page ${d.pages.length + 1}`, bg: '', nodes: [], comments: [] }] }))
  gotoPage(id)
}
export function renamePage(id: string, name: string) { setDoc((d) => ({ ...d, pages: d.pages.map((p) => (p.id === id ? { ...p, name } : p)) })) }
export function deletePage(id: string) {
  const s = get()
  if (s.doc.pages.length < 2) return
  setDoc((d) => ({ ...d, pages: d.pages.filter((p) => p.id !== id) }))
  if (s.pageId === id) gotoPage(get().doc.pages[0].id)
}

export { ancestors, sizeOf }
