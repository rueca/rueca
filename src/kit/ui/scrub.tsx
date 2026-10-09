/* ---------------------------------------------------------------------------
   ScrubValue — the control people reach for first.

   Figma / Spline / Rive behaviour, on one element:
     drag horizontally   → scrub (pointer-locked, so it never hits the screen edge)
       shift             → 10× coarse        alt → 0.1× fine
     click without drag  → type a value; accepts math: "120/2", "+8", "*1.5"
     double-click        → reset to default
     ↑ ↓                 → step (shift ×10, alt ×0.1)
     wheel while focused → step

   Reports `final=false` while moving and `final=true` on release, so owners
   can hold back expensive work until the drag ends.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clamp, cn, roundTo, decimalsOf } from '../core/cn'

export interface ScrubProps {
  value: number
  onChange: (v: number, final: boolean) => void
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  fmt?: (v: number) => string
  unit?: string
  /** prefix glyph or letter inside the field (X, W, ↻) — scrubbing it works too */
  prefix?: ReactNode
  /** pixels of drag per step */
  sensitivity?: number
  className?: string
  /** draw as a recessed input box rather than a bare value */
  boxed?: boolean
  changed?: boolean
  disabled?: boolean
  label?: string
  align?: 'left' | 'right'
  mixed?: boolean
}

function evaluate(text: string, current: number): number | null {
  const s = text.trim().replace(/,/g, '.').replace(/[a-z%°×]+$/i, '')
  if (!s) return null
  const rel = s.match(/^([+\-*/])\s*(-?[\d.]+)$/)
  if (rel && !/^-[\d.]+$/.test(s)) {
    const n = Number(rel[2])
    return rel[1] === '+' ? current + n : rel[1] === '-' ? current - n : rel[1] === '*' ? current * n : current / n
  }
  if (!/^[\d+\-*/().\s]+$/.test(s)) return null
  try {
    const r = Function(`"use strict";return (${s})`)() as number
    return Number.isFinite(r) ? r : null
  } catch { return null }
}

export function ScrubValue({
  value, onChange, min = -Infinity, max = Infinity, step = 1, defaultValue, fmt, unit, prefix,
  sensitivity = 2, className, boxed, changed, disabled, label, align = 'right', mixed,
}: ScrubProps) {
  const [editing, setEditing] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [draft, setDraft] = useState('')
  const el = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef({ x: 0, acc: 0, start: 0, moved: false, id: -1 })
  const live = useRef(value)
  live.current = value

  const range = Number.isFinite(max - min) ? max - min : null
  // Scale scrubbing to the range so a 0–1 param and a 0–2000 param both feel right.
  const perPx = range ? Math.max(step, range / 300) / sensitivity : step / sensitivity * 2

  const commitNum = (v: number, final: boolean) => onChange(clamp(roundTo(v, step), min, max), final)

  const display = mixed ? 'Mixed' : fmt ? fmt(value) : `${value.toFixed(decimalsOf(step))}${unit ?? ''}`

  useEffect(() => { if (editing) { input.current?.focus(); input.current?.select() } }, [editing])

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || editing || e.button !== 0) return
    e.preventDefault()
    drag.current = { x: e.clientX, acc: 0, start: live.current, moved: false, id: e.pointerId }
    el.current?.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.id !== e.pointerId || !el.current?.hasPointerCapture(e.pointerId)) return
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x) < 3) return
      d.moved = true
      d.acc = e.clientX
      setScrubbing(true)
      try { (el.current.requestPointerLock?.() as Promise<void> | undefined)?.catch?.(() => {}) } catch { /* unsupported */ }
      return
    }
    // Under pointer lock clientX freezes, so read movementX; otherwise diff clientX.
    const dx = document.pointerLockElement ? e.movementX : e.clientX - d.acc
    d.acc = e.clientX
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
    d.start = clamp(d.start + dx * perPx * mult, min, max)
    commitNum(d.start, false)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    d.id = -1
    el.current?.releasePointerCapture(e.pointerId)
    if (document.pointerLockElement) document.exitPointerLock()
    if (d.moved) { setScrubbing(false); commitNum(d.start, true) }
    else { setDraft(mixed ? '' : String(roundTo(value, step))); setEditing(true) }
  }

  const finishEdit = (apply: boolean) => {
    if (apply) {
      const v = evaluate(draft, value)
      if (v !== null) commitNum(v, true)
    }
    setEditing(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); commitNum(value + step * mult, true) }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); commitNum(value - step * mult, true) }
    if (e.key === 'Enter') { setDraft(String(value)); setEditing(true) }
    if (e.key === 'Home' && Number.isFinite(min)) commitNum(min, true)
    if (e.key === 'End' && Number.isFinite(max)) commitNum(max, true)
  }

  return (
    <div
      ref={el}
      role="spinbutton"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-valuetext={display}
      tabIndex={disabled ? -1 : 0}
      data-scrubbing={scrubbing || undefined}
      data-changed={changed || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => defaultValue !== undefined && commitNum(defaultValue, true)}
      onKeyDown={onKeyDown}
      className={cn(
        'group/scrub relative flex h-6 min-w-0 items-center gap-1 rounded-[5px] tabular text-[11px] outline-none no-select',
        'cursor-ew-resize focus-visible:ring-2 focus-visible:ring-accent',
        boxed ? 'bg-input px-1.5 hover:shadow-[inset_0_0_0_1px_var(--line-strong)]' : 'px-1 hover:bg-hover',
        'data-[scrubbing]:bg-active',
        changed === false ? 'text-faint' : 'text-fg',
        mixed && 'text-faint italic',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      {prefix != null && <span className="flex w-3 shrink-0 justify-center text-[10.5px] text-faint">{prefix}</span>}
      {editing ? (
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finishEdit(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEdit(true)
            if (e.key === 'Escape') finishEdit(false)
            e.stopPropagation()
          }}
          className={cn('w-full min-w-0 bg-transparent text-fg outline-none', align === 'right' ? 'text-right' : 'text-left')}
        />
      ) : (
        <span className={cn('flex-1 truncate', align === 'right' ? 'text-right' : 'text-left')}>{display}</span>
      )}
    </div>
  )
}
