/* The hero's background texture, built from the logo's own geometry (parts.tsx LOGO_MARK:
   big wheel r 60.5 at (200.5, 108.5), small wheel r 21 at (67, 148)), scaled up, and drawn
   entirely in short straight dashes on a still grid (after a reference Rafael shared, 11 Oct).
   The wheels' dashes stay put and turn on their own centres; the band's dashes run along it:
   - the wheels: dashes lie round the hub; the turning is phased by angle, so it travels
     round each wheel like gear teeth. The small wheel's dashes turn faster, at the band's ratio.
   - the string: the band stays a line, as contour rings rippling outward, each ring drawn as
     short dashes laid end to end that run along it like a moving belt. Belt and both wheel
     rims move at the same surface speed, so the band visibly drives the wheels.
   Ink only (the text colour), quiet in the manner of HEX's line-art textures. Pauses
   offscreen and in hidden tabs; reduced motion shows one still frame. */
import { useEffect, useRef } from 'react'

const VB = { w: 1440, h: 820 } // shared layout space, placed like a viewBox with xMaxYMid slice
const K = 2.7 // logo units → layout units
const BIG = { x: 1190, y: 330, r: 60.5 * K }
const SMALL = { x: BIG.x + (67 - 200.5) * K, y: BIG.y + (148 - 108.5) * K, r: 21 * K }
const PITCH = 24 // the big wheel's dash grid

/* ---- the string: perimeter of the band (hull of the two circles), walked clockwise ---- */
const DX = SMALL.x - BIG.x, DY = SMALL.y - BIG.y, D = Math.hypot(DX, DY)
const T = Math.atan2(DY, DX), F = Math.acos((BIG.r - SMALL.r) / D)
const L1 = BIG.r * (2 * Math.PI - 2 * F), L2 = Math.sqrt(D * D - (BIG.r - SMALL.r) ** 2), L3 = SMALL.r * 2 * F
const PERIM = L1 + 2 * L2 + L3
/* the band's outline grown by d, walked clockwise: [x, y, tangent, position on the d = 0 band] */
function alongBand(d: number, u: number): [number, number, number, number] {
  const A = BIG.r + d, B = SMALL.r + d, la = A * (2 * Math.PI - 2 * F), lc = B * 2 * F
  if (u < la) { const g = T + F + u / A; return [BIG.x + A * Math.cos(g), BIG.y + A * Math.sin(g), g + Math.PI / 2, BIG.r * (u / A)] }
  u -= la
  if (u < L2) { // tangent from the big wheel to the small one
    const g = T - F, x0 = BIG.x + A * Math.cos(g), y0 = BIG.y + A * Math.sin(g), x1 = SMALL.x + B * Math.cos(g), y1 = SMALL.y + B * Math.sin(g)
    return [x0 + ((x1 - x0) * u) / L2, y0 + ((y1 - y0) * u) / L2, Math.atan2(y1 - y0, x1 - x0), L1 + u]
  }
  u -= L2
  if (u < lc) { const g = T - F + u / B; return [SMALL.x + B * Math.cos(g), SMALL.y + B * Math.sin(g), g + Math.PI / 2, L1 + L2 + SMALL.r * (u / B)] }
  u -= lc
  const g = T + F, x0 = SMALL.x + B * Math.cos(g), y0 = SMALL.y + B * Math.sin(g), x1 = BIG.x + A * Math.cos(g), y1 = BIG.y + A * Math.sin(g)
  return [x0 + ((x1 - x0) * u) / L2, y0 + ((y1 - y0) * u) / L2, Math.atan2(y1 - y0, x1 - x0), L1 + L2 + L3 + u]
}
const RINGS = 20, DASH = 18, GAP = 12 // longer dashes (Rafael, 11 Oct)
/* the first string sits a little off the wheels, then the spacing opens up going out:
   the gap grows from ~19 to ~48 units */
const CLEAR = 15
const ringAt = (i: number) => CLEAR + 18 * i + 0.8 * i * i
const RING = Array.from({ length: RINGS }, (_, i) => {
  const d = ringAt(i), len = PERIM + 2 * Math.PI * d
  return { d, len, n: Math.round(len / (DASH + GAP)), alpha: 0.12 + 0.88 * Math.pow(1 - i / RINGS, 1.4) }
})

/* ---- the wheels: a lattice of dashes in each disc, in the wheel's own frame ---- */
type Dash = { x: number; y: number; tan: number; theta: number; alpha: number }
const SPIN = Math.PI / 7 // radians per second each dash turns (big wheel); the small one is faster
const TEETH = 6
/* the speed you see a wheel turn at is its teeth wave: SPIN / TEETH rad/s. At the rim that is
   BIG.r · SPIN / TEETH units/s for both wheels (the small one spins faster by the radius ratio),
   and the band's dashes run at exactly that, so belt and wheels move as one. */
const RIM_SPEED = (BIG.r * SPIN) / TEETH
function lattice(r: number, pitch: number): Dash[] {
  const out: Dash[] = []
  for (let y = -r; y <= r; y += pitch) {
    for (let x = -r; x <= r; x += pitch) {
      const rho = Math.hypot(x, y)
      if (rho > r - pitch * 0.45 || rho < pitch * 0.9) continue // inside the rim, clear of the hub
      const theta = Math.atan2(y, x)
      out.push({ x, y, tan: theta + Math.PI / 2, theta, alpha: 0.45 + 0.55 * (rho / r) })
    }
  }
  return out
}
/* teeth: how many times the phase wraps around the hub, so the turning reads as a gear. Same
   count on both wheels, so with the speed ratio their rims (and the band) move at one surface speed. */
const WHEELS = [
  { c: BIG, speed: 1, teeth: TEETH, dashes: lattice(BIG.r, PITCH), len: 15 },
  { c: SMALL, speed: BIG.r / SMALL.r, teeth: TEETH, dashes: lattice(SMALL.r, 16), len: 10 },
]

function useWheels(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, visible = true, w = 0, h = 0
    const t0 = performance.now()
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (now: number) => {
      const t = still ? 0 : (now - t0) / 1000
      const s = Math.max(w / VB.w, h / VB.h), ox = w - VB.w * s, oy = (h - VB.h * s) / 2 // like a viewBox with xMaxYMid slice
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = getComputedStyle(cv).color
      ctx.lineWidth = 1.25; ctx.lineCap = 'round'
      { // the string: dashes run along each ring at the rims' surface speed
        const belt = RIM_SPEED * t, half = (DASH * s) / 2
        for (const r of RING) {
          ctx.globalAlpha = r.alpha
          const shift = (belt * r.len) / PERIM // outer rings keep pace with the band so the ripple stays aligned
          ctx.beginPath()
          for (let k = 0; k < r.n; k++) {
            const [lx, ly, tan] = alongBand(r.d, ((((k + 0.5) * r.len) / r.n + shift) % r.len + r.len) % r.len)
            if (lx < -20 || lx > VB.w + 20 || ly < -20 || ly > VB.h + 20) continue
            const x = ox + s * lx, y = oy + s * ly, dx = Math.cos(tan) * half, dy = Math.sin(tan) * half
            ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy)
          }
          ctx.stroke()
        }
      }
      for (const wh of WHEELS) {
        const turn = SPIN * t * wh.speed, half = (wh.len * s) / 2
        for (const d of wh.dashes) {
          // the dashes stay put; each turns on its own centre, phased by its place round the hub
          const x = ox + s * (wh.c.x + d.x), y = oy + s * (wh.c.y + d.y)
          const a = d.tan + turn - wh.teeth * d.theta, dx = Math.cos(a) * half, dy = Math.sin(a) * half
          ctx.globalAlpha = d.alpha
          ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke()
        }
      }
    }
    const loop = (now: number) => { draw(now); raf = visible && !document.hidden && !still ? requestAnimationFrame(loop) : 0 }
    const wake = () => { if (!raf && visible && !document.hidden && !still) raf = requestAnimationFrame(loop) }
    size(); draw(t0)
    const ro = new ResizeObserver(() => { size(); draw(performance.now()) }); ro.observe(cv)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake() }); io.observe(cv)
    const onVis = () => wake()
    document.addEventListener('visibilitychange', onVis)
    // the ink follows the theme: redraw when <html>'s class flips
    const mo = new MutationObserver(() => draw(performance.now())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    wake()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [ref])
}

export function WheelField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useWheels(ref)
  return <canvas ref={ref} aria-hidden className={className} />
}
