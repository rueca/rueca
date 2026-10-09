/* Multi-selection field plumbing: "Mixed" detection and delta scrubbing.
   Scrubbing a mixed field moves every node by the same delta (Figma);
   typing a value sets them all to it. One drag = one undo step. */
import * as S from '../model/store'
import { update } from '../model/tree'
import type { Box, Node } from '../model/types'
import type { LayoutMap } from '../model/layout'

export const MIXED = Symbol('mixed')
export type Mixed<T> = T | typeof MIXED

export function common<T>(nodes: Node[], f: (n: Node) => T): Mixed<T> {
  if (!nodes.length) return MIXED
  const first = f(nodes[0])
  const key = JSON.stringify(first)
  return nodes.every((n) => JSON.stringify(f(n)) === key) ? first : MIXED
}

const bases = new Map<string, Map<string, number>>()

export function numField(key: string, nodes: Node[], L: LayoutMap, get: (n: Node, b: Box) => number, apply: (n: Node, v: number, b: Box) => Partial<Node>) {
  const vals = nodes.map((n) => get(n, L.get(n.id) ?? { x: 0, y: 0, w: 0, h: 0 }))
  const mixed = vals.some((v) => Math.abs(v - vals[0]) > 0.01)
  return {
    value: vals[0] ?? 0,
    mixed,
    onChange: (v: number, final: boolean) => {
      let base = bases.get(key)
      if (!base && !final) { base = new Map(nodes.map((n, i) => [n.id, vals[i]])); bases.set(key, base) }
      const delta = base ? v - (base.get(nodes[0].id) ?? 0) : 0
      S.setNodes((ns) => {
        let out = ns
        for (const n of nodes) {
          const target = base ? (base.get(n.id) ?? 0) + delta : v
          out = update(out, n.id, (cur) => ({ ...cur, ...apply(cur, target, L.get(n.id) ?? { x: 0, y: 0, w: 0, h: 0 }) }))
        }
        return out
      }, { commit: final })
      if (final) bases.delete(key)
    },
  }
}

/** set a non-numeric property on every node */
export function setAll(nodes: Node[], patch: (n: Node) => Partial<Node>, final = true) {
  S.setNodes((ns) => {
    let out = ns
    for (const n of nodes) out = update(out, n.id, (cur) => ({ ...cur, ...patch(cur) }))
    return out
  }, { commit: final })
}
