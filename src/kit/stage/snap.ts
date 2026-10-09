/* ---------------------------------------------------------------------------
   Smart guides — snapping + ⌥ distance measurement, as pure maths. Works with
   any renderer (DOM, SVG, canvas, WebGL): give it rects in WORLD units.

     const r = snapRect(moving, targets, 6 / zoom)          // move
     moving.x += r.dx; moving.y += r.dy
     <Guides view={camera} guides={r.guides} />              // ./Guides.tsx

     const e = snapEdges(edges, { r: true, b: true }, targets, 6 / zoom)   // resize
     const m = measure(selectionBox, hoveredBox)             // ⌥ held: red gaps

   Behaviour
     · edges AND centres of the moving rect snap to edges and centres of the
       targets (siblings + the parent frame is the usual target set)
     · the threshold is in world units — divide a screen distance by zoom so
       snapping feels the same at every zoom
     · each guide spans every rect that shares the line (Figma's pink line)
     · `axes` turns an axis off (shift-constrained drags)
     · measure() returns the gaps between two rects, or the four wall
       distances when one sits inside the other; overlap → no segment
   Hold ⌘ (or a pref) to bypass snapping — that is the shell's call.
   Every snapped drag still needs a typed path (X/Y fields) — WCAG 2.5.7.
   (Promoted from shells/ui-design/local/snap.ts.)
--------------------------------------------------------------------------- */

export interface SRect { x: number; y: number; w: number; h: number }
/** A guide line: `axis: 'x'` is a vertical line at x = at, spanning y from → to. */
export interface SnapGuide { axis: 'x' | 'y'; at: number; from: number; to: number }
/** A measurement segment with its length (world units). */
export interface Measure { x1: number; y1: number; x2: number; y2: number; value: number }

const linesX = (r: SRect) => [r.x, r.x + r.w / 2, r.x + r.w]
const linesY = (r: SRect) => [r.y, r.y + r.h / 2, r.y + r.h]

function best(moving: number[], targets: number[], threshold: number) {
  let d = Infinity
  for (const m of moving) for (const t of targets) { const dd = t - m; if (Math.abs(dd) < Math.abs(d)) d = dd }
  return Math.abs(d) <= threshold ? d : 0
}

function guideAt(axis: 'x' | 'y', at: number, rect: SRect, targets: SRect[]): SnapGuide | null {
  const hits = targets.filter((t) => (axis === 'x' ? linesX(t) : linesY(t)).some((v) => Math.abs(v - at) < 0.5))
  if (!hits.length) return null
  const span = [rect, ...hits]
  return {
    axis, at,
    from: Math.min(...span.map((r) => (axis === 'x' ? r.y : r.x))),
    to: Math.max(...span.map((r) => (axis === 'x' ? r.y + r.h : r.x + r.w))),
  }
}

/** Snap a moving rect. Returns the correction to add and the guides to draw. */
export function snapRect(moving: SRect, targets: SRect[], threshold: number, axes: { x?: boolean; y?: boolean } = {}) {
  const ax = axes.x !== false, ay = axes.y !== false
  const dx = ax ? best(linesX(moving), targets.flatMap(linesX), threshold) : 0
  const dy = ay ? best(linesY(moving), targets.flatMap(linesY), threshold) : 0
  const moved = { ...moving, x: moving.x + dx, y: moving.y + dy }
  const guides: SnapGuide[] = []
  if (ax) for (const at of linesX(moved)) { const g = guideAt('x', at, moved, targets); if (g) guides.push(g) }
  if (ay) for (const at of linesY(moved)) { const g = guideAt('y', at, moved, targets); if (g) guides.push(g) }
  return { dx, dy, guides }
}

/** Snap only the edges being dragged (resize, draw). Returns adjusted edges + guides. */
export function snapEdges(
  e: { l: number; t: number; r: number; b: number },
  moving: { l?: boolean; t?: boolean; r?: boolean; b?: boolean },
  targets: SRect[], threshold: number,
) {
  const tx = targets.flatMap(linesX), ty = targets.flatMap(linesY)
  const out = { ...e }
  const snap1 = (v: number, list: number[]) => v + best([v], list, threshold)
  if (moving.l) out.l = snap1(e.l, tx)
  if (moving.r) out.r = snap1(e.r, tx)
  if (moving.t) out.t = snap1(e.t, ty)
  if (moving.b) out.b = snap1(e.b, ty)
  const rect = { x: out.l, y: out.t, w: out.r - out.l, h: out.b - out.t }
  const guides: SnapGuide[] = []
  const push = (g: SnapGuide | null) => { if (g) guides.push(g) }
  if (moving.l) push(guideAt('x', out.l, rect, targets))
  if (moving.r) push(guideAt('x', out.r, rect, targets))
  if (moving.t) push(guideAt('y', out.t, rect, targets))
  if (moving.b) push(guideAt('y', out.b, rect, targets))
  return { ...out, guides }
}

/** Distances from `a` to `b` (⌥-hover measurement). Inside → the four wall gaps. */
export function measure(a: SRect, b: SRect): Measure[] {
  const segs: Measure[] = []
  const inside = a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h
  if (inside) {
    const my = a.y + a.h / 2, mx = a.x + a.w / 2
    segs.push({ x1: b.x, y1: my, x2: a.x, y2: my, value: a.x - b.x })
    segs.push({ x1: a.x + a.w, y1: my, x2: b.x + b.w, y2: my, value: b.x + b.w - a.x - a.w })
    segs.push({ x1: mx, y1: b.y, x2: mx, y2: a.y, value: a.y - b.y })
    segs.push({ x1: mx, y1: a.y + a.h, x2: mx, y2: b.y + b.h, value: b.y + b.h - a.y - a.h })
    return segs.filter((s) => s.value > 0)
  }
  const overlapY = Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y)
  const overlapX = Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x)
  const midY = overlapY ? (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2 : a.y + a.h / 2
  const midX = overlapX ? (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2 : a.x + a.w / 2
  if (b.x >= a.x + a.w) segs.push({ x1: a.x + a.w, y1: midY, x2: b.x, y2: midY, value: b.x - a.x - a.w })
  if (a.x >= b.x + b.w) segs.push({ x1: b.x + b.w, y1: midY, x2: a.x, y2: midY, value: a.x - b.x - b.w })
  if (b.y >= a.y + a.h) segs.push({ x1: midX, y1: a.y + a.h, x2: midX, y2: b.y, value: b.y - a.y - a.h })
  if (a.y >= b.y + b.h) segs.push({ x1: midX, y1: b.y + b.h, x2: midX, y2: a.y, value: a.y - b.y - b.h })
  return segs
}
