/* ---------------------------------------------------------------------------
   Smart-guide snapping (kit candidate — renderer-agnostic, pure maths).

     const r = snapRect(moving, targets, 6 / zoom)
     moving.x += r.dx; moving.y += r.dy; drawGuides(r.guides)

   Edges and centres of the moving rect snap to edges and centres of the
   targets (siblings + the parent frame). Returns the correction and the
   guide segments to draw, spanning every rect that shares the line — the
   Figma "pink line" behaviour. `snapEdges` does the same for resize, where
   only the dragged edges may move.
--------------------------------------------------------------------------- */

export interface SRect { x: number; y: number; w: number; h: number }
export interface SnapGuide { axis: 'x' | 'y'; at: number; from: number; to: number }

const linesX = (r: SRect) => [r.x, r.x + r.w / 2, r.x + r.w]
const linesY = (r: SRect) => [r.y, r.y + r.h / 2, r.y + r.h]

function best(moving: number[], targets: number[], threshold: number) {
  let d = Infinity
  for (const m of moving) for (const t of targets) { const dd = t - m; if (Math.abs(dd) < Math.abs(d)) d = dd }
  return Math.abs(d) <= threshold ? d : 0
}

function guidesFor(axis: 'x' | 'y', moved: SRect, targets: SRect[]): SnapGuide[] {
  const mine = axis === 'x' ? linesX(moved) : linesY(moved)
  const out: SnapGuide[] = []
  for (const at of mine) {
    const hits = targets.filter((t) => (axis === 'x' ? linesX(t) : linesY(t)).some((v) => Math.abs(v - at) < 0.5))
    if (!hits.length) continue
    const span = [moved, ...hits]
    const from = Math.min(...span.map((r) => (axis === 'x' ? r.y : r.x)))
    const to = Math.max(...span.map((r) => (axis === 'x' ? r.y + r.h : r.x + r.w)))
    out.push({ axis, at, from, to })
  }
  return out
}

export function snapRect(moving: SRect, targets: SRect[], threshold: number, axes: { x?: boolean; y?: boolean } = { x: true, y: true }) {
  const tx = targets.flatMap(linesX), ty = targets.flatMap(linesY)
  const dx = axes.x === false ? 0 : best(linesX(moving), tx, threshold)
  const dy = axes.y === false ? 0 : best(linesY(moving), ty, threshold)
  const moved = { ...moving, x: moving.x + dx, y: moving.y + dy }
  const guides = [...(axes.x === false ? [] : guidesFor('x', moved, targets)), ...(axes.y === false ? [] : guidesFor('y', moved, targets))]
  return { dx, dy, guides }
}

/** Snap only the edges being dragged: returns adjusted edges + guides. */
export function snapEdges(r: { l: number; t: number; r: number; b: number }, moving: { l?: boolean; t?: boolean; r?: boolean; b?: boolean }, targets: SRect[], threshold: number) {
  const tx = targets.flatMap(linesX), ty = targets.flatMap(linesY)
  const out = { ...r }
  const snap1 = (v: number, list: number[]) => { const d = best([v], list, threshold); return v + d }
  if (moving.l) out.l = snap1(r.l, tx)
  if (moving.r) out.r = snap1(r.r, tx)
  if (moving.t) out.t = snap1(r.t, ty)
  if (moving.b) out.b = snap1(r.b, ty)
  const rect = { x: out.l, y: out.t, w: out.r - out.l, h: out.b - out.t }
  const guides: SnapGuide[] = []
  const edgeGuide = (axis: 'x' | 'y', at: number) => {
    const hits = targets.filter((t) => (axis === 'x' ? linesX(t) : linesY(t)).some((v) => Math.abs(v - at) < 0.5))
    if (!hits.length) return
    const span = [rect, ...hits]
    guides.push({ axis, at, from: Math.min(...span.map((s) => (axis === 'x' ? s.y : s.x))), to: Math.max(...span.map((s) => (axis === 'x' ? s.y + s.h : s.x + s.w))) })
  }
  if (moving.l) edgeGuide('x', out.l)
  if (moving.r) edgeGuide('x', out.r)
  if (moving.t) edgeGuide('y', out.t)
  if (moving.b) edgeGuide('y', out.b)
  return { ...out, guides }
}

/** Gap between two rects along each axis, for ⌥-hover measurement. Negative = overlap. */
export function measure(a: SRect, b: SRect) {
  const segs: { x1: number; y1: number; x2: number; y2: number; value: number }[] = []
  const cy = Math.max(a.y, b.y) + (Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)) / 2
  const cx = Math.max(a.x, b.x) + (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) / 2
  const midY = Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y) ? cy : a.y + a.h / 2
  const midX = Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) ? cx : a.x + a.w / 2
  const inside = a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h
  if (inside) {
    // a inside b: distances to the four walls
    segs.push({ x1: b.x, y1: a.y + a.h / 2, x2: a.x, y2: a.y + a.h / 2, value: a.x - b.x })
    segs.push({ x1: a.x + a.w, y1: a.y + a.h / 2, x2: b.x + b.w, y2: a.y + a.h / 2, value: b.x + b.w - a.x - a.w })
    segs.push({ x1: a.x + a.w / 2, y1: b.y, x2: a.x + a.w / 2, y2: a.y, value: a.y - b.y })
    segs.push({ x1: a.x + a.w / 2, y1: a.y + a.h, x2: a.x + a.w / 2, y2: b.y + b.h, value: b.y + b.h - a.y - a.h })
    return segs.filter((s) => s.value > 0)
  }
  if (b.x >= a.x + a.w) segs.push({ x1: a.x + a.w, y1: midY, x2: b.x, y2: midY, value: b.x - a.x - a.w })
  if (a.x >= b.x + b.w) segs.push({ x1: b.x + b.w, y1: midY, x2: a.x, y2: midY, value: a.x - b.x - b.w })
  if (b.y >= a.y + a.h) segs.push({ x1: midX, y1: a.y + a.h, x2: midX, y2: b.y, value: b.y - a.y - a.h })
  if (a.y >= b.y + b.h) segs.push({ x1: midX, y1: b.y + b.h, x2: midX, y2: a.y, value: a.y - b.y - b.h })
  return segs
}
