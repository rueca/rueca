/* ---------------------------------------------------------------------------
   smoothPath — a curve through points as an SVG path (Catmull-Rom → cubic
   Bézier), with a 0…1 `smoothing` (0 = polyline) and optional y clamping so
   the curve never overshoots the scale it is drawn on. Useful for emotion
   curves, sparklines, graph editors.

     const d = smoothPath(points, { smoothing: 0.75, clampY: [top, bottom] })
     const area = smoothArea(points, baselineY, opts)   // closed, for fills
--------------------------------------------------------------------------- */
export type Pt = { x: number; y: number }

export function smoothPath(pts: Pt[], o: { smoothing?: number; clampY?: [number, number] } = {}) {
  if (!pts.length) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  const k = (o.smoothing ?? 0.75) * 1.0
  const cy = (y: number) => (o.clampY ? Math.min(o.clampY[1], Math.max(o.clampY[0], y)) : y)
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: cy(p1.y + ((p2.y - p0.y) / 6) * k) }
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: cy(p2.y - ((p3.y - p1.y) / 6) * k) }
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`
  }
  return d
}

export function smoothArea(pts: Pt[], baseline: number, o: { smoothing?: number; clampY?: [number, number] } = {}) {
  if (pts.length < 2) return ''
  return `${smoothPath(pts, o)} L${pts.at(-1)!.x},${baseline} L${pts[0].x},${baseline} Z`
}
