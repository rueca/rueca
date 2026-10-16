/* Pure, immutable helpers over the node tree. No store, no React. */
import { uid, type Node } from './types'

export function walk(nodes: Node[], fn: (n: Node, parent: Node | null, depth: number) => void | false, parent: Node | null = null, depth = 0) {
  for (const n of nodes) {
    if (fn(n, parent, depth) === false) continue
    if (n.children) walk(n.children, fn, n, depth + 1)
  }
}

export function find(nodes: Node[], id: string): Node | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const f = n.children && find(n.children, id)
    if (f) return f
  }
}

/** parent node (null = page root) and index */
export function locate(nodes: Node[], id: string, parent: Node | null = null): { parent: Node | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (n.id === id) return { parent, index: i }
    if (n.children) { const f = locate(n.children, id, n); if (f) return f }
  }
  return null
}

/** ancestors from the page root down to (not including) the node */
export function ancestors(nodes: Node[], id: string): Node[] {
  const path: Node[] = []
  const rec = (list: Node[]): boolean => {
    for (const n of list) {
      if (n.id === id) return true
      if (n.children) { path.push(n); if (rec(n.children)) return true; path.pop() }
    }
    return false
  }
  return rec(nodes) ? path : []
}

export function update(nodes: Node[], id: string, fn: (n: Node) => Node): Node[] {
  let hit = false
  const out = nodes.map((n) => {
    if (n.id === id) { hit = true; return fn(n) }
    if (n.children) {
      const c = update(n.children, id, fn)
      if (c !== n.children) { hit = true; return { ...n, children: c } }
    }
    return n
  })
  return hit ? out : nodes
}

export function updateMany(nodes: Node[], ids: Set<string>, fn: (n: Node) => Node): Node[] {
  let hit = false
  const out = nodes.map((n) => {
    let next = n
    if (ids.has(n.id)) { next = fn(n); hit = true }
    if (next.children) {
      const c = updateMany(next.children, ids, fn)
      if (c !== next.children) { next = { ...next, children: c }; hit = true }
    }
    return next
  })
  return hit ? out : nodes
}

export function remove(nodes: Node[], ids: Set<string>): Node[] {
  let hit = false
  const out: Node[] = []
  for (const n of nodes) {
    if (ids.has(n.id)) { hit = true; continue }
    if (n.children) {
      const c = remove(n.children, ids)
      if (c !== n.children) { hit = true; out.push({ ...n, children: c }); continue }
    }
    out.push(n)
  }
  return hit ? out : nodes
}

/** insert into parent (null = root) at index (paint order; undefined = top) */
export function insert(nodes: Node[], parentId: string | null, node: Node | Node[], index?: number): Node[] {
  const list = Array.isArray(node) ? node : [node]
  if (parentId === null) {
    const i = index ?? nodes.length
    return [...nodes.slice(0, i), ...list, ...nodes.slice(i)]
  }
  return update(nodes, parentId, (p) => {
    const kids = p.children ?? []
    const i = index ?? kids.length
    return { ...p, children: [...kids.slice(0, i), ...list, ...kids.slice(i)] }
  })
}

export function childrenOf(nodes: Node[], parentId: string | null): Node[] {
  return parentId === null ? nodes : find(nodes, parentId)?.children ?? []
}

/** a deep copy with fresh ids — duplicate, paste, components */
export function cloneFresh(n: Node): Node {
  return {
    ...structuredClone(n),
    id: uid(),
    fills: n.fills.map((f) => ({ ...f, id: uid('p') })),
    strokes: n.strokes.map((f) => ({ ...f, id: uid('p') })),
    effects: n.effects.map((f) => ({ ...f, id: uid('e') })),
    children: n.children?.map(cloneFresh),
  }
}

/** drop ids whose ancestor is also in the set — the "top-most" selection */
export function topMost(nodes: Node[], ids: string[]): string[] {
  const set = new Set(ids)
  return ids.filter((id) => !ancestors(nodes, id).some((a) => set.has(a.id)))
}



