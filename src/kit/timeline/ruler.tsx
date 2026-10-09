/* ---------------------------------------------------------------------------
   Ruler + playhead helpers shared by every kit timeline (KeyTimeline,
   TrackTimeline, and the read-only Timeline). Time is always ms.

     const ticks = rulerTicks(view[0], view[1], pxPerMs)   // adaptive density
     <RulerTicks ticks={ticks} x={(t) => X(t)} />
     <PlayheadCap ref={capRef} />  <PlayheadLine ref={lineRef} glow={autoKey} />
     usePlayhead(clock, (t) => X(t), [capRef, lineRef])      // painted per tick, no React render

     snapTime(candidate, targets, X, 7)   → { t, hit }        // pixel-threshold snapping
     toFrame(t, fps)                                          // round to the frame grid

   Behaviour notes
     · Labels never sit closer than `minLabelPx` (default 56): the label step
       walks 10ms → 25 → 50 → 100 → 250 → 500 → 1s → 2s → 5s → 10s → 30s → 1min.
     · Minor ticks are a quarter (≥ 1s) or a fifth (< 1s) of the label step.
     · The playhead is `bg-rec` — deliberately not the accent, so it never
       reads as selection. It is painted imperatively from the clock.
   a11y: tick labels are decorative (aria-hidden); the scrub surface that
   owns the ruler should be a role="slider" (see KeyTimeline / TrackTimeline).
   (Extracted from shells/animate/local/KeyframeTimeline.tsx and
   shells/video/local/TrackTimeline.tsx, which each had a copy.)
--------------------------------------------------------------------------- */
import { forwardRef, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { cn } from '../core/cn'
import type { Clock } from '../core/clock'

export const TICK_STEPS = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000]

export interface Ticks { labelStep: number; minor: number; ticks: { t: number; major: boolean }[] }

/** Tick marks for the visible range [from, to] at a given zoom (px per ms). */
export function rulerTicks(from: number, to: number, pxPerMs: number, minLabelPx = 56): Ticks {
  const labelStep = TICK_STEPS.find((s) => s * pxPerMs >= minLabelPx) ?? TICK_STEPS[TICK_STEPS.length - 1]
  const minor = labelStep / (labelStep >= 1000 ? 4 : 5)
  const ticks: Ticks['ticks'] = []
  const start = Math.max(0, Math.ceil(from / minor) * minor)
  for (let m = start, n = 0; m <= to + 0.5 && n < 2000; m += minor, n++) {
    const t = Math.round(m)
    ticks.push({ t, major: Math.abs(t % labelStep) < 0.5 || Math.abs((t % labelStep) - labelStep) < 0.5 })
  }
  return { labelStep, minor, ticks }
}

/** Ruler label: ms below 1s steps, seconds above, m:ss past a minute. */
export function fmtTick(ms: number, labelStep: number) {
  if (labelStep < 100) return `${ms}ms`
  const s = ms / 1000
  if (labelStep < 1000) return `${+s.toFixed(labelStep < 500 ? 2 : 1)}s`
  return s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${+s.toFixed(1)}s`
}

/** Round to the frame grid. */
export const toFrame = (t: number, fps: number) => { const f = 1000 / fps; return Math.round(t / f) * f }

/** Snap `t` to the nearest target within `px` screen pixels. */
export function snapTime(t: number, targets: number[], X: (ms: number) => number, px = 7): { t: number; hit: number | null } {
  let best = Infinity, hit: number | null = null
  const x = X(t)
  for (const s of targets) { const d = Math.abs(X(s) - x); if (d < px && d < best) { best = d; hit = s } }
  return { t: hit ?? t, hit }
}

/** Tick marks + labels, positioned by `x(t)` (px). Put it inside a `relative` ruler strip. */
export function RulerTicks({ ticks, x, fmt, className }: { ticks: Ticks; x: (t: number) => number; fmt?: (ms: number, labelStep: number) => string; className?: string }) {
  const f = fmt ?? fmtTick
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {ticks.ticks.map(({ t, major }) => (
        <div key={t} className="absolute bottom-0" style={{ left: x(t) }}>
          <div className={cn('w-px', major ? 'h-2 bg-line-strong' : 'h-1 bg-line')} />
          {major && <div className="absolute bottom-2.5 left-1 whitespace-nowrap tabular text-[10px] text-fg-faint">{f(t, ticks.labelStep)}</div>}
        </div>
      ))}
    </div>
  )
}

/** The red pentagon cap that sits in the ruler. Positioned by `usePlayhead`. */
export const PlayheadCap = forwardRef<HTMLDivElement, { className?: string; line?: boolean }>(function PlayheadCap({ className, line }, ref) {
  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none absolute top-0 left-0 z-20 h-full will-change-transform', className)}>
      <div className="absolute top-0 h-[10px] w-[11px] -translate-x-1/2 bg-rec [clip-path:polygon(0_0,100%_0,100%_55%,50%_100%,0_55%)]" />
      {line && <div className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-rec" />}
    </div>
  )
})

/** The playhead line over the lanes. `glow` = recording / auto-key. */
export const PlayheadLine = forwardRef<HTMLDivElement, { className?: string; glow?: boolean }>(function PlayheadLine({ className, glow }, ref) {
  return (
    <div ref={ref} aria-hidden className={cn('pointer-events-none absolute top-0 bottom-0 left-0 z-20 will-change-transform', className)}>
      <div className={cn('absolute top-0 bottom-0 -translate-x-1/2 bg-rec', glow ? 'w-[2px] shadow-[0_0_8px_var(--rec)]' : 'w-px')} />
    </div>
  )
})

/**
 * Paint playhead elements from the clock without re-rendering React.
 * `toX(t)` maps clock time → px (read through a ref, so it may change every render).
 * `onPaint(x, t)` runs after each paint (e.g. auto-follow scrolling).
 */
export function usePlayhead(clock: Clock, toX: (t: number) => number, els: RefObject<HTMLElement | null>[], onPaint?: (x: number, t: number) => void) {
  const live = useRef({ toX, onPaint, els })
  live.current = { toX, onPaint, els }
  const paint = () => {
    const t = clock.time()
    const x = live.current.toX(t)
    const tr = `translateX(${x}px)`
    for (const r of live.current.els) if (r.current) r.current.style.transform = tr
    live.current.onPaint?.(x, t)
  }
  useEffect(() => { paint(); return clock.onTick(paint) }, [clock]) // eslint-disable-line react-hooks/exhaustive-deps
  // repaint after every render too (zoom / scroll / resize change the mapping)
  useLayoutEffect(() => { paint() })
}
