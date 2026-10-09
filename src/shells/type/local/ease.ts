/* ---------------------------------------------------------------------------
   cubicBezier — evaluate a p.curve() value as an easing function.

     const ease = cubicBezier(v.curve)   // [x1, y1, x2, y2]
     ease(0.5)                            // → eased progress, may overshoot

   The kit ships CurveEditor (the UI) but not the maths, so every shell that
   animates re-implements this (motion/artifact.ts has a private copy).
   Newton–Raphson on x with a bisection fallback; results are memoised per
   curve so calling it inside a draw loop is free.
--------------------------------------------------------------------------- */

const cache = new Map<string, (x: number) => number>()

export function cubicBezier(c: readonly [number, number, number, number]): (x: number) => number {
  const key = c.join()
  const hit = cache.get(key)
  if (hit) return hit
  const [x1, y1, x2, y2] = c
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const fn = (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x
      if (Math.abs(err) < 1e-5) return sy(t)
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    // bisection fallback for flat derivatives
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t; else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
  if (cache.size > 64) cache.clear()
  cache.set(key, fn)
  return fn
}
