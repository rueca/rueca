/* The nav logo's entrance: E2, the approved logo animation (brand/logo/fan/, e2-approved.json,
   Rafael 11 Oct), redrawn in SVG for the header so the page doesn't load the kit's canvas tool.
   - The mark's three shapes race to fill themselves: six folds of dye a beat apart, ink last, each
     shape from its own start (the band runs clockwise along its centreline, the discs sweep round).
   - At 82% of the race the word wipes in left to right.
   - In the header it all happens in place (Rafael): the mark races where the logo sits, flush left, at its
     final size, and the word's wipe is the only movement, horizontal. (E2 proper races the mark centred and
     bigger and glides it over; that stays in the tool.) It starts a beat after the page loads.
   It plays once per page load (not on route changes or theme switches), never with reduced motion,
   and hands over to the static <Logo> on its last frame, which it matches exactly. */
import { useEffect, useRef, useState } from 'react'
import { cubicBezier } from '@kit/core/ease'
import { site } from '@/site.config'
import { LOCKUP } from './logo.generated'
import { Logo } from './parts'

// E2's values (ms), from brand/logo/fan/e2-approved.json
const DELAY = 450 // ms after the nav mounts, so the page settles first
const N = 6, STAGGER = 130, INK_GAP = 80, TYPE_AT = 0.82, WORD_DUR = 800
const RACE = { band: { delay: 240, dur: 700, start: 0 }, wheel: { delay: 120, dur: 600, start: 270 }, whorl: { delay: 0, dur: 500, start: 27 } }
const ease = cubicBezier([0.33, 1, 0.68, 1]), wordEase = cubicBezier([0.45, 0, 0.2, 1])
type Shape = keyof typeof RACE
const SHAPES: Shape[] = ['band', 'wheel', 'whorl'] // drawn in this order, as in the tool
// each shape's dyes from its last colour fold back to the first (the tool's DYES)
const DYES: Record<Shape, Dye[]> = {
  band: ['gualda', 'malva', 'achiote', 'cielo', 'hoja', 'cochinilla'],
  wheel: ['malva', 'gualda', 'achiote', 'cielo', 'cochinilla', 'hoja'],
  whorl: ['achiote', 'malva', 'cielo', 'gualda', 'hoja', 'cochinilla'],
}
type Dye = 'achiote' | 'cielo' | 'gualda' | 'malva' | 'hoja' | 'cochinilla'
const PAPER: Record<Dye, string> = { achiote: '#E8582C', cielo: '#5DB4E8', gualda: '#F2C744', malva: '#A88BF6', hoja: '#2FA57C', cochinilla: '#EE7A68' }
const NIGHT: Record<Dye, string> = { achiote: '#F06A3E', cielo: '#6FC0EE', gualda: '#F5D05A', malva: '#B39AF8', hoja: '#3DB68B', cochinilla: '#F38B79' }

const foldStart = (s: Shape, j: number) => RACE[s].delay + j * STAGGER + (j === N ? INK_GAP : 0)
const inkEnd = (s: Shape) => foldStart(s, N) + RACE[s].dur
const SETTLED = Math.max(...SHAPES.map(inkEnd)) // 1800
const WORD_START = TYPE_AT * SETTLED // 1476
const END = Math.max(SETTLED, WORD_START + WORD_DUR) // 2276
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

/** The race geometry of a lockup cut, read off its mark paths (wheel, whorl, band). */
function geometry(cut: (typeof LOCKUP)['regular']) {
  const nums = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const disc = (d: string) => { const [x0, cy, r] = nums(d); return { cx: x0 + r, cy, r } }
  // band: outer run M bx H L sx H A Rs … L … A Rb …, then the inner run with rs and rb
  const n = nums(cut.mark[2])
  const H = n[1], bx = n[0], sx = n[2], Rs = n[4], Rb = n[13], rs = n[24], rb = n[33]
  const big = { cx: bx, cy: H - Rb, r: (Rb + rb) / 2 }, small = { cx: sx, cy: H - Rs, r: (Rs + rs) / 2 }
  const dx = big.cx - small.cx, dy = big.cy - small.cy
  const tan = Math.atan2(dy, dx) - Math.acos((small.r - big.r) / Math.hypot(dx, dy)) // the upper run's shared normal
  const at = (c: { cx: number; cy: number; r: number }, a: number) => [c.cx + c.r * Math.cos(a), c.cy + c.r * Math.sin(a)]
  const [ax, ay] = at(small, tan), [tx, ty] = at(big, tan)
  const bigSweep = Math.PI / 2 - tan, smallSweep = tan + Math.PI * 1.5
  // up the diagonal, round the wheel, back along the bottom, round the whorl: clockwise like a belt
  const bandD = `M${ax} ${ay}L${tx} ${ty}A${big.r} ${big.r} 0 ${+(bigSweep > Math.PI)} 1 ${big.cx} ${big.cy + big.r}`
    + `L${small.cx} ${small.cy + small.r}A${small.r} ${small.r} 0 ${+(smallSweep > Math.PI)} 1 ${ax} ${ay}`
  const bandLen = Math.hypot(tx - ax, ty - ay) + big.r * bigSweep + (big.cx - small.cx) + small.r * smallSweep
  return { wheel: disc(cut.mark[0]), whorl: disc(cut.mark[1]), bandD, bandLen, bandW: Rb - rb }
}

const sector = (c: { cx: number; cy: number; r: number }, a0: number, reach: number) => {
  if (reach >= 1 - 1e-5) return `M${c.cx - c.r} ${c.cy}a${c.r} ${c.r} 0 1 0 ${c.r * 2} 0a${c.r} ${c.r} 0 1 0 ${-c.r * 2} 0Z`
  const a1 = a0 + reach * Math.PI * 2
  return `M${c.cx} ${c.cy}L${c.cx + c.r * Math.cos(a0)} ${c.cy + c.r * Math.sin(a0)}A${c.r} ${c.r} 0 ${+(reach > 0.5)} 1 ${c.cx + c.r * Math.cos(a1)} ${c.cy + c.r * Math.sin(a1)}Z`
}

let played = false // once per page load

export function LogoIntro({ height }: { height: number }) {
  const [run] = useState(() => !played && typeof matchMedia !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [done, setDone] = useState(!run)
  const svg = useRef<SVGSVGElement>(null)
  const cut = LOCKUP[height <= 24 ? 'small' : 'regular']
  const [w, h] = cut.vb, k = height / cut.markH, span = w - cut.markW

  useEffect(() => {
    if (!run) return
    played = true
    const root = svg.current!, g = geometry(cut)
    const dye = document.documentElement.classList.contains('light') ? PAPER : NIGHT
    const clip = root.querySelector<SVGRectElement>('[data-clip]')!
    const folds = SHAPES.map((s) => [...root.querySelectorAll<SVGPathElement>(`[data-shape="${s}"] [data-fold]`)])
    const finals = SHAPES.map((s) => root.querySelector<SVGPathElement>(`[data-final="${s}"]`)!)
    folds.forEach((list, si) => list.forEach((p, j) => {
      const colour = j === N ? 'currentColor' : dye[DYES[SHAPES[si]][(N - 1 - j) % 6]]
      if (SHAPES[si] === 'band') p.setAttribute('stroke', colour)
      else p.setAttribute('fill', colour)
    }))
    let t0 = 0, raf = 0
    const frame = (now: number) => {
      if (!t0) t0 = now
      const t = now - t0 - DELAY
      SHAPES.forEach((s, si) => {
        const settled = t >= inkEnd(s)
        finals[si].style.display = settled ? '' : 'none'
        folds[si].forEach((p, j) => {
          const reach = ease(clamp01((t - foldStart(s, j)) / RACE[s].dur))
          p.style.display = settled || reach <= 1e-5 ? 'none' : ''
          if (settled || reach <= 1e-5) return
          if (s === 'band') p.setAttribute('stroke-dasharray', `${reach * g.bandLen} ${g.bandLen * 2}`)
          else p.setAttribute('d', sector(g[s], (RACE[s].start * Math.PI) / 180, reach))
        })
      })
      // the word's wipe, left to right
      const ext = span * wordEase(clamp01((t - WORD_START) / WORD_DUR))
      clip.setAttribute('width', String(t < WORD_START ? 0 : cut.markW + ext + w))
      if (t < END) raf = requestAnimationFrame(frame)
      else setDone(true)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run, cut, span, w])

  if (done) return <Logo height={height} />
  const g = geometry(cut)
  return (
    <svg ref={svg} role="img" aria-label={site.name} viewBox={`0 0 ${w} ${h}`} height={h * k} width={w * k} className="flex-none overflow-visible text-fg">
      <defs><clipPath id="logo-intro-wipe"><rect data-clip x={-w} y={-h} width={0} height={h * 3} /></clipPath></defs>
      <g>
        <path d={cut.word} fill="currentColor" clipPath="url(#logo-intro-wipe)" />
        {SHAPES.map((s, si) => (
          <g key={s} data-shape={s}>
            {Array.from({ length: N + 1 }, (_, j) => s === 'band'
              ? <path key={j} data-fold d={g.bandD} fill="none" strokeWidth={g.bandW} strokeLinecap="butt" style={{ display: 'none' }} />
              : <path key={j} data-fold style={{ display: 'none' }} />)}
            <path data-final={s} d={cut.mark[si === 0 ? 2 : si === 1 ? 0 : 1]} fillRule="evenodd" fill="currentColor" style={{ display: 'none' }} />
          </g>
        ))}
      </g>
    </svg>
  )
}
