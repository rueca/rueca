/* ---------------------------------------------------------------------------
   DetentSlider — a slider with named, magnetic stops whose values need not be
   evenly spaced: an elevation ladder (Inset −3 · Flat 0 · Raised 2 · Card 6 ·
   Dropdown 14 · Popover 24 · Modal 40).

     <DetentSlider value={z} onChange={(v, final) => …}
       stops={[{ value: -3, label: 'Inset' }, { value: 0, label: 'Flat' }, …]} />

     p.number(6, { detents: [{ value: -3, label: 'Inset' }, …] })   // the Inspector draws it

   The stops sit evenly along the track whatever their values, and the stretch
   between two stops is linear, so every rung gets the same room. Near a stop
   the thumb snaps onto it; past that pull, values between stops go through
   (snap="only" allows the stops alone). The names sit under the track. When
   the track is too narrow for all of them, names that would collide drop out:
   the current stop's name always stays, then the two ends, then the rest in
   order. Click a name to go there.

   Keyboard: ←/→ (and ↓/↑, PgDn/PgUp) move one stop, ⇧ + arrow moves by
   `step` (between stops), Home/End go to the ends.
   Accessibility: role="slider"; the value text reads "Card, 6".
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Slider as Base } from '@base-ui/react/slider'
import { cn } from '../core/cn'

export type Detent = number | { value: number; label?: string }

/** Stops sorted by value, duplicates dropped. */
export function normDetents(detents: readonly Detent[]): { value: number; label?: string }[] {
  const out = detents.map((d) => (typeof d === 'number' ? { value: d } : d)).filter((d) => Number.isFinite(d.value)).sort((a, b) => a.value - b.value)
  return out.filter((d, i) => i === 0 || d.value !== out[i - 1].value)
}

/** Value → track position, in stops: 0 at the first stop, n−1 at the last, linear between neighbours. */
export function detentPos(stops: readonly number[], v: number): number {
  const n = stops.length
  if (n < 2 || v <= stops[0]) return 0
  if (v >= stops[n - 1]) return n - 1
  let i = 0
  while (v > stops[i + 1]) i++
  return i + (v - stops[i]) / (stops[i + 1] - stops[i])
}

/** Track position (in stops) → value. */
export function detentValue(stops: readonly number[], t: number): number {
  const n = stops.length
  if (n < 2) return stops[0] ?? 0
  const c = Math.min(n - 1, Math.max(0, t))
  const i = Math.min(n - 2, Math.floor(c))
  return stops[i] + (stops[i + 1] - stops[i]) * (c - i)
}

/** Where a drag to position `t` lands: the stop when within `pull` of it (or always, with `only`),
    otherwise the value between, rounded to `step`. */
export function detentSnap(stops: readonly number[], t: number, { pull = 0.2, only = false, step }: { pull?: number; only?: boolean; step?: number } = {}): number {
  const i = Math.min(stops.length - 1, Math.max(0, Math.round(t)))
  if (only || Math.abs(t - i) <= pull) return stops[i]
  const v = detentValue(stops, t)
  return step ? Number((Math.round(v / step) * step).toFixed(6)) : v
}

/** The next stop above (dir 1) or below (dir −1) `v`, or `v` itself at the end. */
export function detentStep(stops: readonly number[], v: number, dir: 1 | -1): number {
  const eps = 1e-9
  return dir > 0 ? (stops.find((s) => s > v + eps) ?? v) : ([...stops].reverse().find((s) => s < v - eps) ?? v)
}

const GAP = 6 // px kept clear between two names

export function DetentSlider({
  value, onChange, stops: detents, snap = 'near', pull = 0.2, step = 0.1, origin, label, format, disabled, className,
}: {
  value: number
  onChange: (v: number, final: boolean) => void
  stops: readonly Detent[]
  /** near = snap within `pull` of a stop, values between pass (default); only = stops alone */
  snap?: 'near' | 'only'
  /** how close to a stop (as a share of the gap between two stops) a drag snaps onto it */
  pull?: number
  /** rounding for values between stops, and the ⇧ + arrow nudge */
  step?: number
  /** fill from this value; defaults to 0 when the stops span zero, else the first stop */
  origin?: number
  label?: string
  /** announce the value the way the UI shows it ("6px") */
  format?: (v: number) => string
  disabled?: boolean
  className?: string
}) {
  const list = normDetents(detents)
  const stops = list.map((d) => d.value)
  const n = stops.length
  const lo = stops[0] ?? 0, hi = stops[n - 1] ?? 0
  const pct = (t: number) => (n < 2 ? 0 : (t / (n - 1)) * 100)
  const at = pct(detentPos(stops, value))
  const o = origin ?? (lo < 0 && hi > 0 ? 0 : lo)
  const from = pct(detentPos(stops, o))
  const on = stops.findIndex((s) => Math.abs(s - value) < 1e-9)
  const near = n ? Math.round(detentPos(stops, value)) : -1
  const show = format ?? ((v: number) => String(v))

  /* names: hide the ones that would collide; the current stop wins, then the ends */
  const row = useRef<HTMLDivElement>(null)
  const names = useRef<(HTMLSpanElement | null)[]>([])
  const [hidden, setHidden] = useState<boolean[]>([])
  const key = list.map((d) => d.label ?? '').join('|')
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const fit = () => {
      const W = el.clientWidth
      const order = [near, 0, n - 1, ...list.map((_, i) => i)].filter((i, k, a) => i >= 0 && a.indexOf(i) === k)
      const placed: [number, number][] = []
      const next = list.map(() => true)
      for (const i of order) {
        const w = names.current[i]?.offsetWidth ?? 0
        if (!w) continue
        const c = (pct(i) / 100) * W
        const l = n > 1 && i === 0 ? 0 : n > 1 && i === n - 1 ? W - w : c - w / 2
        if (placed.some(([a, b]) => l < b + GAP && l + w > a - GAP)) continue
        placed.push([l, l + w])
        next[i] = false
      }
      setHidden((prev) => (prev.length === next.length && prev.every((h, i) => h === next[i]) ? prev : next))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, near, n])

  const keys = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0
    if (!dir || disabled || !n) return
    e.preventDefault()
    e.stopPropagation()
    const fine = e.shiftKey && snap !== 'only' && e.key.startsWith('Arrow')
    const next = fine ? Math.min(hi, Math.max(lo, Number((value + dir * step).toFixed(6)))) : detentStep(stops, value, dir)
    if (next !== value) onChange(next, true)
  }

  return (
    <Base.Root
      value={n < 2 ? 0 : detentPos(stops, value)}
      min={0}
      max={Math.max(1, n - 1)}
      step={0.001}
      disabled={disabled || n < 2}
      onValueChange={(t) => { const v = detentSnap(stops, t as number, { pull, only: snap === 'only', step }); if (v !== value) onChange(v, false) }}
      onValueCommitted={(t) => onChange(detentSnap(stops, t as number, { pull, only: snap === 'only', step }), true)}
      onKeyDownCapture={keys}
      className={cn('group/slider relative w-full min-w-0 no-select data-[disabled]:opacity-40', className)}
    >
      <Base.Control data-studio-slider-control className="flex w-full cursor-default touch-pan-y flex-col">
        <div className="flex h-6 items-center">
          <Base.Track className="relative h-[3px] w-full rounded-full bg-track shadow-[0_0_0_0.5px_var(--line-strong)]">
            <div className="absolute inset-y-0 rounded-full bg-signal" style={{ left: `${Math.min(from, at)}%`, width: `${Math.abs(at - from)}%` }} />
            {list.map((_, i) => {
              const filled = pct(i) >= Math.min(from, at) - 1e-6 && pct(i) <= Math.max(from, at) + 1e-6
              return <span key={i} aria-hidden className={cn('absolute top-1/2 h-[7px] w-px -translate-x-1/2 -translate-y-1/2', filled ? 'bg-signal' : 'bg-fg-faint')} style={{ left: `${pct(i)}%` }} />
            })}
            <Base.Thumb
              data-studio-thumb
              aria-label={label}
              getAriaValueText={() => { const name = on >= 0 ? list[on].label : undefined; return name ? `${name}, ${show(value)}` : show(value) }}
              className={cn(
                'size-3 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.4)] outline-none',
                'scale-[0.75] transition-transform duration-100 group-hover/slider:scale-100',
                'focus-visible:scale-100 focus-visible:ring-2 focus-visible:ring-signal data-[dragging]:scale-100',
              )}
            />
          </Base.Track>
        </div>
        {/* a name goes straight to its stop: a press there would otherwise drag from the text's own x, which can miss the pull */}
        <div ref={row} aria-hidden className="relative h-4">
          {list.map((d, i) => d.label && (
            <span
              key={i}
              ref={(el) => { names.current[i] = el }}
              onPointerDown={(e) => { if (disabled) return; e.stopPropagation(); e.preventDefault(); onChange(list[i].value, true) }}
              className={cn(
                'absolute top-0 cursor-pointer whitespace-nowrap text-ui-sm leading-4 transition-colors duration-100 hover:text-fg',
                n > 1 && i === 0 ? 'left-0' : n > 1 && i === n - 1 ? 'right-0' : '-translate-x-1/2',
                i === on ? 'font-medium text-fg' : 'text-fg-faint',
                hidden[i] && 'invisible',
              )}
              style={n > 1 && (i === 0 || i === n - 1) ? undefined : { left: `${pct(i)}%` }}
            >
              {d.label}
            </span>
          ))}
        </div>
      </Base.Control>
    </Base.Root>
  )
}
