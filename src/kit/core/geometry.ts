/* ---------------------------------------------------------------------------
   Geometry — small, pure helpers for chrome that draws its own shapes:
   emotion curves, sparklines, graph editors, hit tests, fit-to-view.

     const d = smoothPath(points, { smoothing: 0.75, clampY: [top, bottom] })
     const fill = smoothArea(points, baselineY, { smoothing: 0.75 })
     if (pointInRect(p, node)) …          const box = boundsOf(rects)
     const { scale, x, y } = fitRect(content, viewport, { padding: 24, max: 1 })

   smoothPath is Catmull-Rom converted to cubic Béziers. `smoothing` runs
   0 → 1 (0 = polyline, 1 = full Catmull-Rom). `clampY` keeps the CONTROL
   points inside a band, so the curve never overshoots the scale it sits on
   (a mood line that dips below "very negative" reads as a bug).

   No DOM, no React — safe in workers and tests.
   (Promoted from shells/journey/local/smooth.ts.)
--------------------------------------------------------------------------- */

export type Pt = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export interface SmoothOptions {
  /** 0 = straight segments, 1 = full Catmull-Rom. Default 0.75. */
  smoothing?: number
  /** keep control points between these y values (top, bottom) */
  clampY?: [number, number]
}

/** An SVG path `d` through every point. */
export function smoothPath(pts: Pt[], o: SmoothOptions = {}): string {
  if (!pts.length) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  const k = Math.max(0, Math.min(1, o.smoothing ?? 0.75))
  const lo = o.clampY ? Math.min(o.clampY[0], o.clampY[1]) : -Infinity
  const hi = o.clampY ? Math.max(o.clampY[0], o.clampY[1]) : Infinity
  const cy = (y: number) => Math.min(hi, Math.max(lo, y))
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: cy(p1.y + ((p2.y - p0.y) / 6) * k) }
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: cy(p2.y - ((p3.y - p1.y) / 6) * k) }
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`
  }
  return d
}

/** The same curve closed down to a baseline — for area fills under a line. */
export function smoothArea(pts: Pt[], baseline: number, o: SmoothOptions = {}): string {
  if (pts.length < 2) return ''
  return `${smoothPath(pts, o)} L${pts.at(-1)!.x},${baseline} L${pts[0].x},${baseline} Z`
}

/** Inclusive point-in-rectangle test. */
export const pointInRect = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

/** Do two rectangles overlap (touching edges count)? */
export const rectsOverlap = (a: Rect, b: Rect) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h

/** Bounding box of rectangles and/or points; null for an empty list. */
export function boundsOf(items: (Rect | Pt)[]): Rect | null {
  if (!items.length) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const it of items) {
    const w = 'w' in it ? it.w : 0, h = 'h' in it ? it.h : 0
    x0 = Math.min(x0, it.x); y0 = Math.min(y0, it.y)
    x1 = Math.max(x1, it.x + w); y1 = Math.max(y1, it.y + h)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Scale + offset that fits `content` inside `view` (contain), centred. `max` caps magnification. */
export function fitRect(content: Rect, view: { w: number; h: number }, o: { padding?: number; max?: number; min?: number } = {}) {
  const pad = o.padding ?? 0
  const sw = (view.w - pad * 2) / Math.max(1e-6, content.w)
  const sh = (view.h - pad * 2) / Math.max(1e-6, content.h)
  const scale = Math.max(o.min ?? 0, Math.min(o.max ?? Infinity, sw, sh))
  return { scale, x: (view.w - content.w * scale) / 2 - content.x * scale, y: (view.h - content.h * scale) / 2 - content.y * scale }
}
