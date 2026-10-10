/* ---------------------------------------------------------------------------
   Knob — a rotary control for dense instrument panels (Ableton / OP-1 / Rive).

     <Knob label="Cutoff" value={hz} min={40} max={18000} taper="log"
           defaultValue={620} fmt={(n) => `${n}Hz`} onChange={(v, final) => …} />

   Behaviour
     drag vertically       → change (pointer-locked, so it never hits the screen edge)
       shift               → fine (×0.1)
     double-click          → reset to defaultValue
     ↑ / → , ↓ / ←         → step 1% of the range (shift: 0.1%)
     PgUp / PgDn           → 10%     Home / End → min / max
     wheel while focused   → step
     the value below       → click to type (it is a kit ScrubValue) — the
                             non-drag alternative WCAG 2.5.7 asks for

   Accessibility: the dial is role="slider" with aria-valuenow/-min/-max and
   aria-valuetext in display units. Reports final=false while dragging and
   final=true on release, like every kit control, so one drag = one undo step.

   Taper: 'log' maps the arc exponentially (frequencies, times); 'linear'
   otherwise. `bipolar` fills from the centre (pan, detune ±).
   Sizes: sm 28 · md 36 · lg 48 px. Accent only on the value arc.
   (Promoted from shells/synth/local/Knob.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { clamp, cn, roundTo } from '../core/cn'
import { ScrubValue } from './scrub'
import { Tip } from './tooltip'

export interface KnobProps {
  value: number
  onChange: (v: number, final: boolean) => void
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  label: string
  hint?: string
  fmt?: (v: number) => string
  /** typed text → number for the value field, when `fmt` isn't plain (see ScrubValue) */
  parse?: (s: string) => number | null
  unit?: string
  taper?: 'linear' | 'log'
  bipolar?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** hide the typed readout (e.g. when a row shows values elsewhere) */
  hideValue?: boolean
  /** hide the text label (when a column header already names it) */
  hideLabel?: boolean
  changed?: boolean
  disabled?: boolean
  className?: string
}

const SWEEP = 270 // degrees of travel
const START = -135
const PX_FULL = 220 // pixels of vertical drag for the full range

export function Knob({
  value, onChange, min = 0, max = 1, step = 0.01, defaultValue, label, hint, fmt, parse, unit, taper = 'linear', bipolar,
  size = 'md', hideValue, hideLabel, changed, disabled, className,
}: KnobProps) {
  const log = taper === 'log' && min > 0
  const toNorm = (v: number) => clamp(log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min), 0, 1)
  const fromNorm = (n: number) => clamp(roundTo(log ? min * Math.pow(max / min, n) : min + n * (max - min), step), min, max)

  const dial = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; norm: number; y: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const live = useRef(value)
  live.current = value

  const norm = toNorm(value)
  const px = size === 'sm' ? 28 : size === 'lg' ? 48 : 36
  const display = fmt ? fmt(value) : `${roundTo(value, step)}${unit ?? ''}`

  const commit = (n: number, final: boolean) => onChange(fromNorm(clamp(n, 0, 1)), final)

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0) return
    e.preventDefault()
    dial.current?.focus()
    dial.current?.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, norm: toNorm(live.current), y: e.clientY, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      if (Math.abs(e.clientY - d.y) < 3) return
      d.moved = true
      setDragging(true)
      d.y = e.clientY
      try { (dial.current?.requestPointerLock?.() as Promise<void> | undefined)?.catch?.(() => {}) } catch { /* unsupported */ }
      return
    }
    const dy = document.pointerLockElement ? -e.movementY : d.y - e.clientY
    d.y = e.clientY
    d.norm = clamp(d.norm + (dy / PX_FULL) * (e.shiftKey ? 0.1 : 1), 0, 1)
    commit(d.norm, false)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    dial.current?.releasePointerCapture(e.pointerId)
    if (document.pointerLockElement) document.exitPointerLock()
    if (d.moved) { setDragging(false); commit(d.norm, true) }
  }

  const nudge = (dn: number) => commit(toNorm(live.current) + dn, true)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const fine = e.shiftKey ? 0.1 : 1
    const map: Record<string, () => void> = {
      ArrowUp: () => nudge(0.01 * fine), ArrowRight: () => nudge(0.01 * fine),
      ArrowDown: () => nudge(-0.01 * fine), ArrowLeft: () => nudge(-0.01 * fine),
      PageUp: () => nudge(0.1), PageDown: () => nudge(-0.1),
      Home: () => commit(0, true), End: () => commit(1, true),
    }
    const fn = map[e.key]
    if (fn) { e.preventDefault(); fn() }
  }

  // wheel while focused (non-passive so the panel doesn't scroll)
  useEffect(() => {
    const el = dial.current
    if (!el) return
    const on = (e: WheelEvent) => {
      if (document.activeElement !== el || disabled) return
      e.preventDefault()
      commit(toNorm(live.current) - Math.sign(e.deltaY) * (e.shiftKey ? 0.002 : 0.01), true)
    }
    el.addEventListener('wheel', on, { passive: false })
    return () => el.removeEventListener('wheel', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, step, taper, disabled])

  // geometry
  const r = 40, cx = 50, cy = 50
  const ang = (n: number) => ((START + n * SWEEP) * Math.PI) / 180
  const pt = (n: number, rad = r) => [cx + rad * Math.sin(ang(n)), cy - rad * Math.cos(ang(n))] as const
  const arc = (a: number, b: number) => {
    if (Math.abs(b - a) < 1e-4) return ''
    const [x0, y0] = pt(a), [x1, y1] = pt(b)
    const large = Math.abs(b - a) * SWEEP > 180 ? 1 : 0
    return `M${x0},${y0} A${r},${r} 0 ${large} ${b > a ? 1 : 0} ${x1},${y1}`
  }
  const from = bipolar ? 0.5 : 0
  const [hx0, hy0] = pt(norm, r * 0.28), [hx1, hy1] = pt(norm, r * 0.74)
  const stroke = size === 'sm' ? 9 : 7.5

  const dialEl = (
    <div
      ref={dial}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={display}
      aria-disabled={disabled || undefined}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue, true)}
      onKeyDown={onKeyDown}
      className={cn('group/knob relative shrink-0 cursor-ns-resize touch-none rounded-full outline-none no-select', 'focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-panel')}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 100 100" width={px} height={px} className="block overflow-visible" aria-hidden>
        <path d={arc(0, 1)} fill="none" stroke="var(--track)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={arc(Math.min(from, norm), Math.max(from, norm))} fill="none" stroke="var(--signal)" strokeWidth={stroke} strokeLinecap="round"
          className={cn(!changed && changed !== undefined && 'opacity-70')} />
        <circle cx={cx} cy={cy} r={r * 0.68} fill="var(--raised)" className="transition-[fill] group-hover/knob:fill-[var(--active)] group-data-[dragging]/knob:fill-[var(--active)]" />
        <circle cx={cx} cy={cy} r={r * 0.68} fill="none" stroke="var(--line-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <line x1={hx0} y1={hy0} x2={hx1} y2={hy1} stroke="var(--fg)" strokeWidth={size === 'sm' ? 8 : 6} strokeLinecap="round" />
      </svg>
    </div>
  )

  return (
    <div className={cn('flex min-w-0 flex-col items-center gap-0.5', disabled && 'pointer-events-none opacity-40', className)}>
      {hint ? <Tip label={hint} side="top">{dialEl}</Tip> : dialEl}
      {!hideLabel && (
        <span onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue, true)}
          className={cn('max-w-full truncate text-[10.5px] leading-tight no-select', changed ? 'text-fg' : 'text-fg-muted')}>{label}</span>
      )}
      {!hideValue && (
        <ScrubValue value={value} onChange={onChange} min={min} max={max} step={step} defaultValue={defaultValue} fmt={fmt} parse={parse} unit={unit}
          label={`${label} value`} changed={changed} align="left" className={cn('h-[18px] justify-center px-0.5 text-[10.5px] [&>span]:text-center', dragging && 'text-signal')} />
      )}
    </div>
  )
}
