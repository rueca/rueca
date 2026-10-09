/* ---------------------------------------------------------------------------
   Easing maths — the numbers behind CurveEditor, SpringEditor and the
   EasingEditor popover. Pure functions, no React, safe inside a draw loop.

     const ease = cubicBezier(0.16, 1, 0.3, 1)        // or cubicBezier(v.curve)
     ease(0.5)                                          // → eased progress, may overshoot

     springAt({ duration: 500, bounce: 0.3 }, 120)      // position 0→1 at 120 ms
     springToPhysics({ duration: 500, bounce: 0.3 })    // → { stiffness, damping, mass }
     physicsToSpring({ stiffness: 180, damping: 18, mass: 1 })

     easeAt({ kind: 'spring', duration: 500, bounce: 0.3 }, p, segmentMs)
     cssEasing(ease, segmentMs)                         // cubic-bezier() / linear() / steps()

   Springs speak Duration + Bounce by default (Apple / Framer / Figma Motion):
     ω₀ = 2π / duration      ζ = 1 − bounce        (bounce < 0 → overdamped: ζ = 1 / (1 + bounce))
     stiffness = ω₀² · mass   damping = 2ζω₀ · mass
   so "Physics" (stiffness / damping / mass) is the same spring seen another
   way, and both views round-trip. `springAt` is the closed-form solution of
   a unit step, so it is frame-rate independent and scrubbable.

   cubicBezier: Newton–Raphson on x with a bisection fallback; one solver per
   curve is memoised, so calling it per frame is free.
   (Promoted from shells/type/local/ease.ts and shells/animate/engine.ts;
   motion/artifact.ts and video/render.ts had private copies.)
--------------------------------------------------------------------------- */

export type Bezier = [number, number, number, number]
/** Perceptual spring: duration (ms) and bounce (−1…1; 0 = critically damped, no overshoot). */
export interface Spring { duration: number; bounce: number }
/** Physical spring, as the kit SpringEditor and `p.spring()` store it. */
export interface SpringPhysics { stiffness: number; damping: number; mass: number }
/** The easing of one keyframe segment. */
export type Ease =
  | { kind: 'bezier'; p: Bezier }
  | ({ kind: 'spring' } & Spring)
  | { kind: 'hold' }

/** Named cubic-bezier curves — the presets every curve UI in the kit offers. */
export const EASINGS: Record<string, Bezier> = {
  Linear: [0, 0, 1, 1],
  'Ease in': [0.42, 0, 1, 1],
  'Ease out': [0, 0, 0.58, 1],
  'Ease in out': [0.42, 0, 0.58, 1],
  'Out expo': [0.16, 1, 0.3, 1],
  'Out back': [0.34, 1.56, 0.64, 1],
  'In out quint': [0.83, 0, 0.17, 1],
}

/** Named springs (Duration + Bounce). */
export const SPRINGS: Record<string, Spring> = {
  Gentle: { duration: 700, bounce: 0.1 },
  Quick: { duration: 300, bounce: 0.15 },
  Bouncy: { duration: 500, bounce: 0.45 },
  Slow: { duration: 1000, bounce: 0.2 },
}

/* ---------- cubic-bezier ---------- */

const cache = new Map<string, (x: number) => number>()

export function cubicBezier(c: readonly [number, number, number, number]): (x: number) => number
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number
export function cubicBezier(a: number | readonly number[], b?: number, c?: number, d?: number): (x: number) => number {
  const [x1, y1, x2, y2] = typeof a === 'number' ? [a, b!, c!, d!] : a
  const key = `${x1},${y1},${x2},${y2}`
  const hit = cache.get(key)
  if (hit) return hit
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
      const dd = dx(t)
      if (Math.abs(dd) < 1e-6) break
      t -= err / dd
    }
    // bisection fallback for flat derivatives
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 30; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t; else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
  if (cache.size > 128) cache.clear()
  cache.set(key, fn)
  return fn
}

/* ---------- springs ---------- */

const dampingRatio = (bounce: number) => {
  const b = Math.max(-0.9, Math.min(0.95, bounce))
  return b >= 0 ? 1 - b : 1 / (1 + b)
}

/** Step response of a spring as a function of time (ms) → position (0 → 1, may overshoot). */
export function springCurve(s: Spring): (ms: number) => number {
  const w0 = (2 * Math.PI) / Math.max(0.05, s.duration / 1000)
  const z = dampingRatio(s.bounce)
  return (ms: number) => {
    const t = Math.max(0, ms) / 1000
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z)
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
    }
    if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
    const r = Math.sqrt(z * z - 1), r1 = -w0 * (z - r), r2 = -w0 * (z + r)
    return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
  }
}

/** Position of a spring `ms` after it starts (0 → 1). Accepts Duration+Bounce or physics. */
export function springAt(s: Spring | SpringPhysics, ms: number): number {
  return springCurve('stiffness' in s ? physicsToSpring(s) : s)(ms)
}

/** Duration + Bounce → stiffness / damping / mass (Apple's SwiftUI / Framer model). */
export function springToPhysics(s: Spring, mass = 1): SpringPhysics {
  const w0 = (2 * Math.PI) / Math.max(0.05, s.duration / 1000)
  const z = dampingRatio(s.bounce)
  return { stiffness: Math.round(w0 * w0 * mass * 10) / 10, damping: Math.round(2 * z * w0 * mass * 10) / 10, mass }
}

/** stiffness / damping / mass → Duration + Bounce (inverse of springToPhysics). */
export function physicsToSpring(p: SpringPhysics): Spring {
  const w0 = Math.sqrt(p.stiffness / p.mass)
  const z = p.damping / (2 * Math.sqrt(p.stiffness * p.mass))
  return { duration: Math.round(((2 * Math.PI) / w0) * 1000), bounce: Math.round((z <= 1 ? 1 - z : 1 / z - 1) * 100) / 100 }
}

/** Time (ms) until the spring stays within `epsilon` of rest — for sizing a segment to its spring. */
export function springSettle(s: Spring | SpringPhysics, epsilon = 0.001, maxMs = 10000): number {
  const f = springCurve('stiffness' in s ? physicsToSpring(s) : s)
  let last = maxMs
  for (let ms = maxMs; ms >= 0; ms -= 8) { if (Math.abs(1 - f(ms)) > epsilon) return Math.min(maxMs, last); last = ms }
  return 0
}

/* ---------- segment easing ---------- */

/** Eased progress for segment progress p ∈ [0, 1] of a segment `segMs` long. */
export function easeAt(e: Ease, p: number, segMs: number): number {
  if (e.kind === 'hold') return p >= 1 ? 1 : 0
  if (e.kind === 'bezier') return cubicBezier(e.p)(p)
  // a spring runs on its own clock; the next key cuts it off
  return springCurve(e)(p * segMs)
}

/** Sample any easing as a CSS `linear()` function (springs, custom curves). */
export function cssLinear(fn: (p: number) => number, samples = 24) {
  return `linear(${Array.from({ length: samples + 1 }, (_, i) => Number(fn(i / samples).toFixed(4))).join(', ')})`
}

/** The CSS timing function for a segment: cubic-bezier(), linear() for springs, steps() for holds. */
export function cssEasing(e: Ease, segMs: number) {
  if (e.kind === 'hold') return 'steps(1, end)'
  if (e.kind === 'bezier') return `cubic-bezier(${e.p.join(', ')})`
  const f = springCurve(e)
  return cssLinear((p) => f(p * segMs))
}

/** Parse `cubic-bezier(a, b, c, d)` (e.g. from the clipboard). */
export function parseCubicBezier(s: string): Bezier | null {
  const m = s.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  return m ? [+m[1], +m[2], +m[3], +m[4]] : null
}

/** Human name for an ease: a preset name, "Spring 500ms", "Hold" or "Custom curve". */
export function easeName(e: Ease, curves: Record<string, Bezier> = EASINGS) {
  if (e.kind === 'hold') return 'Hold'
  if (e.kind === 'spring') {
    const n = Object.entries(SPRINGS).find(([, s]) => s.duration === e.duration && s.bounce === e.bounce)?.[0]
    return n ? `Spring · ${n}` : `Spring ${Math.round(e.duration)}ms`
  }
  return Object.entries(curves).find(([, v]) => v.join() === e.p.join())?.[0] ?? 'Custom curve'
}
