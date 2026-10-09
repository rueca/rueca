/* Hit-testing and Figma's selection-depth rules. */
import type { Node } from '../model/types'
import { contains, type LayoutMap } from '../model/layout'
import { locate } from '../model/tree'

/** Path from the top-level node down to the deepest visible, unlocked node under the point. */
export function hitPath(nodes: Node[], L: LayoutMap, x: number, y: number): Node[] | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (!n.visible || n.locked) continue
    const b = L.get(n.id)
    if (!b) continue
    const inside = contains(b, x, y)
    if (n.children?.length && n.type !== 'boolean' && (inside || !n.clip)) {
      const sub = hitPath(n.children, L, x, y)
      if (sub) return [n, ...sub]
    }
    if (inside) return [n]
  }
  return null
}

/** Deepest frame under the point, excluding `exclude` and its subtree — drop targets for reparenting and drawing. */
export function containerAt(nodes: Node[], L: LayoutMap, x: number, y: number, exclude?: string): Node | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (!n.visible || n.id === exclude) continue
    const b = L.get(n.id)
    if (!b || n.type !== 'frame' || !contains(b, x, y)) continue
    return containerAt(n.children ?? [], L, x, y, exclude) ?? n
  }
  return null
}

/**
 * Which node a click selects. Figma: clicks land on children of top-level frames;
 * once you have drilled into a level, clicks stay at that level; ⌘ selects the deepest.
 */
export function pickTarget(nodes: Node[], path: Node[], selection: string[], deep: boolean): Node | null {
  if (deep) return path.at(-1)!
  // stay at the depth of the current selection when the click is among its siblings
  let best: Node | null = null
  for (const id of selection) {
    const parentId = locate(nodes, id)?.parent?.id ?? null
    for (const n of path) {
      const pid = locate(nodes, n.id)?.parent?.id ?? null
      if (pid === parentId && parentId !== null) best = n
    }
    if (path.some((n) => n.id === id)) return path.find((n) => n.id === id)!
  }
  if (best) return best
  if (path.length === 1) {
    const top = path[0]
    // empty area of a top-level frame with children starts a marquee instead
    return top.type === 'frame' && top.children?.length ? null : top
  }
  return path[1]
}
