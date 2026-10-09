/* ---------------------------------------------------------------------------
   Auto layout — a small layered (Sugiyama-lite) layout, no dagre.

   1. DFS from the start nodes (happy-path edges first) marks back edges, so
      loops like "Payment failed → Retry" don't break the ranking.
   2. Longest-path ranks on what remains = columns.
   3. The happy path claims row 0 (the spine); branches drop to row ≥ 1,
      ordered by the barycentre of their predecessors.
   4. Sections are laid out one after another along the main axis and all
      share one band (swimlane look). Stickies sit under the node they annotate.
   5. Handles are re-picked from geometry so edges leave from the right side.

   Pure: (nodes, edges, options) → { nodes, edges }.
--------------------------------------------------------------------------- */
import type { EdgeData, FlowEdge, FlowNode } from './model'

export interface LayoutOptions {
  direction: 'LR' | 'TB'
  rankGap: number
  nodeGap: number
  sizeOf: (n: FlowNode) => { w: number; h: number }
}

type Rect = { x: number; y: number; w: number; h: number }

const SECTION_PAD = 48
const SECTION_TITLE = 44
const SECTION_GAP = 96

export function autoLayout(nodes: FlowNode[], edges: FlowEdge[], o: LayoutOptions): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const LR = o.direction === 'LR'
  const flow = nodes.filter((n) => n.type !== 'note' && n.type !== 'section')
  const ids = new Set(flow.map((n) => n.id))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const live = edges.filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)
  const ordered = [...live].sort((a, b) => Number(!!b.data?.happy) - Number(!!a.data?.happy))
  const outs = new Map<string, FlowEdge[]>()
  const indeg = new Map<string, number>(flow.map((n) => [n.id, 0]))
  for (const e of ordered) {
    outs.set(e.source, [...(outs.get(e.source) ?? []), e])
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }

  // 1. back edges by DFS (start terminals first, then other sources, then leftovers)
  const roots = [...flow].sort((a, b) => score(b) - score(a)).map((n) => n.id)
  function score(n: FlowNode) { return (n.data.role === 'start' ? 2 : 0) + (indeg.get(n.id) === 0 ? 1 : 0) }
  const state = new Map<string, number>()
  const back = new Set<string>()
  const discovery: string[] = []
  const dfs = (u: string) => {
    state.set(u, 1)
    discovery.push(u)
    for (const e of outs.get(u) ?? []) {
      const s = state.get(e.target)
      if (s === 1) back.add(e.id)
      else if (!s) dfs(e.target)
    }
    state.set(u, 2)
  }
  for (const r of roots) if (!state.get(r)) dfs(r)

  // 2. longest-path ranks over the DAG
  const dag = live.filter((e) => !back.has(e.id))
  const preds = new Map<string, string[]>()
  const deg = new Map<string, number>(flow.map((n) => [n.id, 0]))
  for (const e of dag) { preds.set(e.target, [...(preds.get(e.target) ?? []), e.source]); deg.set(e.target, deg.get(e.target)! + 1) }
  const rank = new Map<string, number>()
  const queue = discovery.filter((id) => deg.get(id) === 0)
  queue.forEach((id) => rank.set(id, 0))
  while (queue.length) {
    const u = queue.shift()!
    for (const e of dag.filter((x) => x.source === u)) {
      rank.set(e.target, Math.max(rank.get(e.target) ?? 0, rank.get(u)! + 1))
      deg.set(e.target, deg.get(e.target)! - 1)
      if (deg.get(e.target) === 0) queue.push(e.target)
    }
  }

  const happyNodes = new Set<string>()
  for (const e of live) if (e.data?.happy) { happyNodes.add(e.source); happyNodes.add(e.target) }

  // group by section, in discovery order
  const sectionOf = (n: FlowNode) => (n.data.section && byId.get(n.data.section)?.type === 'section' ? n.data.section : '_')
  const groups: string[] = []
  for (const id of discovery) { const g = sectionOf(byId.get(id)!); if (!groups.includes(g)) groups.push(g) }

  const size = new Map(nodes.map((n) => [n.id, o.sizeOf(n)]))
  const main = (id: string) => (LR ? size.get(id)!.w : size.get(id)!.h)
  const cross = (id: string) => (LR ? size.get(id)!.h : size.get(id)!.w)

  // 3. columns + rows per group
  type Cell = { id: string; col: number; row: number }
  const cells = new Map<string, Cell>()
  const groupCols = new Map<string, string[][]>()
  for (const g of groups) {
    const members = discovery.filter((id) => sectionOf(byId.get(id)!) === g)
    const min = Math.min(...members.map((id) => rank.get(id) ?? 0))
    const cols: string[][] = []
    for (const id of members) {
      const c = (rank.get(id) ?? 0) - min
      ;(cols[c] ??= []).push(id)
    }
    for (let c = 0; c < cols.length; c++) {
      cols[c] ??= []
      const used = new Set<number>()
      const happy = cols[c].filter((id) => happyNodes.has(id))
      const rest = cols[c].filter((id) => !happyNodes.has(id))
      if (happy.length) { cells.set(happy[0], { id: happy[0], col: c, row: 0 }); used.add(0) }
      const bary = (id: string) => {
        const ps = (preds.get(id) ?? []).map((p) => cells.get(p)?.row ?? 0)
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 1
      }
      const others = [...happy.slice(1), ...rest].sort((a, b) => bary(a) - bary(b))
      for (const id of others) {
        let r = Math.max(1, Math.round(bary(id)))
        while (used.has(r)) r++
        used.add(r)
        cells.set(id, { id, col: c, row: r })
      }
    }
    groupCols.set(g, cols)
  }

  // global row heights (cross axis), so every section shares one band
  const rowSize: number[] = []
  for (const c of cells.values()) rowSize[c.row] = Math.max(rowSize[c.row] ?? 0, cross(c.id))
  const rowStart: number[] = []
  let acc = 0
  for (let r = 0; r < rowSize.length; r++) { rowStart[r] = acc; acc += (rowSize[r] ?? 0) + (rowSize[r] ? o.nodeGap : 0) }

  const pos = new Map<string, { m: number; c: number }>()
  const groupSpan = new Map<string, { m0: number; m1: number }>()
  let cursor = 0
  for (const g of groups) {
    const cols = groupCols.get(g)!
    const inSection = g !== '_'
    const m0 = cursor
    let m = cursor + (inSection ? SECTION_PAD : 0)
    for (const col of cols) {
      const w = Math.max(0, ...col.map(main))
      for (const id of col) {
        const cell = cells.get(id)!
        pos.set(id, { m: m + (w - main(id)) / 2, c: rowStart[cell.row] + ((rowSize[cell.row] ?? 0) - cross(id)) / 2 })
      }
      m += w + o.rankGap
    }
    m -= o.rankGap
    const m1 = m + (inSection ? SECTION_PAD : 0)
    groupSpan.set(g, { m0, m1 })
    cursor = m1 + (inSection ? SECTION_GAP : o.rankGap)
  }

  // 4. stickies: under the node they annotate (or the group's last column)
  const crossEnd = new Map<string, number>() // per attach target, the lowest occupied cross coordinate in its column
  const colBottom = (id: string) => {
    const cell = cells.get(id)
    if (!cell) return 0
    let max = 0
    for (const c of cells.values()) if (c.col === cell.col && sectionOf(byId.get(c.id)!) === sectionOf(byId.get(id)!)) max = Math.max(max, pos.get(c.id)!.c + cross(c.id))
    return max
  }
  for (const n of nodes) {
    if (n.type !== 'note') continue
    const target = n.data.attach && pos.has(n.data.attach) ? n.data.attach : null
    if (!target) continue
    const p = pos.get(target)!
    const start = crossEnd.get(target) ?? colBottom(target)
    pos.set(n.id, { m: p.m + (main(target) - main(n.id)) / 2, c: start + o.nodeGap * 0.75 })
    crossEnd.set(target, start + o.nodeGap * 0.75 + cross(n.id))
  }

  // band extent shared by every section
  let c0 = Infinity, c1 = -Infinity
  for (const [id, p] of pos) { c0 = Math.min(c0, p.c); c1 = Math.max(c1, p.c + cross(id)) }
  if (!Number.isFinite(c0)) { c0 = 0; c1 = 0 }

  const toXY = (p: { m: number; c: number }) => (LR ? { x: Math.round(p.m), y: Math.round(p.c) } : { x: Math.round(p.c), y: Math.round(p.m) })
  const outNodes = nodes.map((n) => {
    if (n.type === 'section') {
      const span = groupSpan.get(n.id)
      if (!span) return n
      const r = { m: span.m0, c: c0 - SECTION_PAD - SECTION_TITLE }
      const mSize = span.m1 - span.m0
      const cSize = c1 - c0 + SECTION_PAD * 2 + SECTION_TITLE
      const xy = toXY(r)
      return { ...n, position: xy, width: Math.round(LR ? mSize : cSize), height: Math.round(LR ? cSize : mSize) }
    }
    const p = pos.get(n.id)
    return p ? { ...n, position: toXY(p) } : n
  })

  const rects = new Map<string, Rect>(outNodes.map((n) => [n.id, { x: n.position.x, y: n.position.y, ...dims(size.get(n.id)!) }]))
  const outEdges = edges.map((e) => {
    if (e.data?.pinned) return e
    const a = rects.get(e.source), b = rects.get(e.target)
    if (!a || !b) return e
    const [sh, th] = pickHandles(a, b, o.direction, byId.get(e.source)?.type === 'decision')
    return { ...e, sourceHandle: sh, targetHandle: th }
  })
  return { nodes: outNodes, edges: outEdges }
}

const dims = (s: { w: number; h: number }) => ({ w: s.w, h: s.h })

/** Choose source/target sides from the two rectangles. */
export function pickHandles(a: Rect, b: Rect, dir: 'LR' | 'TB', fromDecision = false): [string, string] {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  if (dir === 'LR') {
    if (b.x >= a.x + a.w - 4) {
      if (fromDecision && b.y >= a.y + a.h) return ['b', 'l']
      if (fromDecision && b.y + b.h <= a.y) return ['t', 'l']
      return ['r', 'l']
    }
    if (b.x + b.w <= a.x + 4) return ['b', 'b']
    return bc.y > ac.y ? ['b', 't'] : ['t', 'b']
  }
  if (b.y >= a.y + a.h - 4) {
    if (fromDecision && b.x >= a.x + a.w) return ['r', 't']
    if (fromDecision && b.x + b.w <= a.x) return ['l', 't']
    return ['b', 't']
  }
  if (b.y + b.h <= a.y + 4) return ['r', 'r']
  return bc.x > ac.x ? ['r', 'l'] : ['l', 'r']
}

/** Smart handles for edges touching `moved`, after a drag. */
export function rehandle(nodes: FlowNode[], edges: FlowEdge[], moved: Set<string>, dir: 'LR' | 'TB', sizeOf: (n: FlowNode) => { w: number; h: number }): FlowEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const rect = (n: FlowNode): Rect => ({ x: n.position.x, y: n.position.y, ...dims(sizeOf(n)) })
  let changed = false
  const out = edges.map((e) => {
    if (e.data?.pinned || (!moved.has(e.source) && !moved.has(e.target))) return e
    const a = byId.get(e.source), b = byId.get(e.target)
    if (!a || !b) return e
    const [sh, th] = pickHandles(rect(a), rect(b), dir, a.type === 'decision')
    if (sh === e.sourceHandle && th === e.targetHandle) return e
    changed = true
    return { ...e, sourceHandle: sh, targetHandle: th }
  })
  return changed ? out : edges
}

/* Happy path for the walkthrough: from the start, follow happy edges (else the first edge). */
export function happyPath(nodes: FlowNode[], edges: FlowEdge[]): { node: string; via?: FlowEdge }[] {
  const steps = nodes.filter((n) => n.type !== 'note' && n.type !== 'section')
  if (!steps.length) return []
  const incoming = new Set(edges.map((e) => e.target))
  const start = steps.find((n) => n.data.role === 'start') ?? steps.find((n) => !incoming.has(n.id)) ?? steps[0]
  const out: { node: string; via?: FlowEdge }[] = [{ node: start.id }]
  const seen = new Set([start.id])
  let cur = start.id
  for (let i = 0; i < 200; i++) {
    const outs = edges.filter((e) => e.source === cur)
    const next = outs.find((e) => (e.data as EdgeData | undefined)?.happy && !seen.has(e.target)) ?? outs.find((e) => !seen.has(e.target))
    if (!next) break
    out.push({ node: next.target, via: next })
    seen.add(next.target)
    cur = next.target
  }
  return out
}
