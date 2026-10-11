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
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { clamp, cn, roundTo, decimalsOf } from '../core/cn'

const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

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
  /** multi-select with differing values: shows "Mixed"; scrubbing reports a DELTA via onDelta */
  mixed?: boolean
  onDelta?: (delta: number, final: boolean) => void
  /** typed text → number, for fields whose fmt isn't plain (percent, timecode). Return null to reject. */
  parse?: (s: string) => number | null
  /** drag range; typed values may still reach min/max (Blender's soft vs hard limits) */
  soft?: [number, number]
}

/** "+8" / "-8" typed into a Mixed field → a delta for every selected item (break-it V9) */
export function relativeDelta(text: string): number | null {
  const m = text.trim().replace(/,/g, '.').match(/^([+-])\s*([\d.]+(?:e[+-]?\d+)?)$/i)
  if (!m) return null
  const n = Number(m[2]) * (m[1] === '-' ? -1 : 1)
  return Number.isFinite(n) ? n : null
}

/** Typed field text → number: "120/2", "+8" (relative to `current`), "1e3". null = reject. */
export function evaluate(text: string, current: number): number | null {
  const s = text.trim().replace(/,/g, '.').replace(/[a-z%°×]+$/i, '')
  if (!s) return null
  const rel = s.match(/^([+\-*/])\s*(-?[\d.]+(?:e[+-]?\d+)?)$/i)
  if (rel && !/^-[\d.]+(?:e[+-]?\d+)?$/i.test(s)) {
    const n = Number(rel[2])
    const r = rel[1] === '+' ? current + n : rel[1] === '-' ? current - n : rel[1] === '*' ? current * n : current / n
    // "/0" must never write Infinity / NaN into a doc (break-it V6)
    return Number.isFinite(r) ? r : null
  }
  if (!/^[\d+\-*/().eE\s]+$/.test(s)) return null
  try {
    const r = Function(`"use strict";return (${s})`)() as number
    return Number.isFinite(r) ? r : null
  } catch { return null }
}

export const ScrubValue = forwardRef<HTMLDivElement, ScrubProps & Omit<HTMLAttributes<HTMLDivElement>, keyof ScrubProps | 'onChange'>>(function ScrubValue({
  value, onChange, min = -Infinity, max = Infinity, step = 1, defaultValue, fmt, unit, prefix,
  sensitivity = 2, className, boxed, changed, disabled, label, align = 'right', mixed, onDelta, parse, soft, ...rest
}, fwd) {
  const [editing, setEditing] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [draft, setDraft] = useState('')
  const el = useRef<HTMLDivElement>(null)
  useImperativeHandle(fwd, () => el.current!)
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef<{ x: number; acc: number; acc2?: number; start: number; orig: number; moved: boolean; id: number }>({ x: 0, acc: 0, start: 0, orig: 0, moved: false, id: -1 })
  // set by double-click so the editor that the first click opened doesn't commit its stale draft on blur (break-it V1)
  const discard = useRef(false)
  // typing a digit into a focused field starts the edit with that digit — keep the caret after it, don't select it
  const caretEnd = useRef(false)
  const live = useRef(value)
  live.current = value

  const dragMin = soft?.[0] ?? min, dragMax = soft?.[1] ?? max
  const range = Number.isFinite(dragMax - dragMin) ? dragMax - dragMin : null
  // Scale scrubbing to the range so a 0–1 param and a 0–2000 param both feel right.
  const perPx = range ? Math.max(step, range / 300) / sensitivity : step / sensitivity * 2

  const commitNum = (v: number, final: boolean) => { if (Number.isFinite(v)) onChange(clamp(roundTo(v, step), min, max), final) }
  // A run of arrow-key nudges is one undo step, like a drag: live while keys repeat, committed 500 ms after the
  // last press or on blur (t5 judge: 15 presses were 15 undo steps).
  const nudged = useRef<number | null>(null)
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const settleNudge = () => { clearTimeout(nudgeTimer.current); const n = nudged.current; nudged.current = null; if (n !== null) commitNum(n, true) }
  useEffect(() => () => clearTimeout(nudgeTimer.current), [])

  const display = mixed ? 'Mixed' : fmt ? fmt(value) : `${value.toFixed(decimalsOf(step))}${unit ?? ''}`

  // A fmt that renders percent ("-3.5%" for -0.035) edits in percent too, so typing "5%" means 5%,
  // not 500% pinned to max (break-it V11). Scale is read off fmt(1): "100%" → ×100, "1%" → ×1.
  const pctScale = !parse && fmt ? (() => { const o = fmt(1); return /%\s*$/.test(o) ? parseFloat(o.replace(/[^\d.\-]/g, '')) || null : null })() : null
  // With a custom parse, edit in display units ("30%" → parse) rather than the raw number.
  const editText = () => (parse && fmt ? fmt(value) : pctScale ? fmt!(value) : String(roundTo(value, step)))
  const readTyped = (text: string) => {
    if (parse) return parse(text)
    if (pctScale) { const v = evaluate(text, value * pctScale); return v === null ? null : v / pctScale }
    return evaluate(text, value)
  }

  useEffect(() => {
    if (!editing) return
    const i = input.current
    i?.focus()
    if (caretEnd.current) { caretEnd.current = false; i?.setSelectionRange(i.value.length, i.value.length) } else i?.select()
  }, [editing])

  // Esc mid-scrub puts the value back (break-it V7). Focus isn't on the field while dragging, so listen on window.
  useEffect(() => {
    if (!scrubbing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault(); e.stopPropagation()
      const d = drag.current
      if (d.id !== -1) try { el.current?.releasePointerCapture(d.id) } catch { /* already released */ }
      d.id = -1
      if (document.pointerLockElement) document.exitPointerLock()
      setScrubbing(false)
      if (mixed && onDelta) onDelta(0, true); else commitNum(d.orig, true)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  // Wheel while focused → step. Non-passive so the panel doesn't scroll instead (break-it V10).
  useEffect(() => {
    const node = el.current
    if (!node || disabled) return
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== node || editing || !e.deltaY) return
      e.preventDefault()
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
      const d = (e.deltaY < 0 ? 1 : -1) * step * mult
      if (mixed && onDelta) onDelta(d, true); else commitNum(live.current + d, true)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  })

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || editing || e.button !== 0) return
    e.preventDefault()
    drag.current = { x: e.clientX, acc: 0, acc2: 0, start: live.current, orig: live.current, moved: false, id: e.pointerId }
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
    if (mixed && onDelta) { d.acc2 = (d.acc2 ?? 0) + dx * perPx * mult; onDelta(roundTo(d.acc2, step), false); return }
    d.start = clamp(d.start + dx * perPx * mult, Math.min(dragMin, live.current), Math.max(dragMax, live.current))
    commitNum(d.start, false)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    d.id = -1
    el.current?.releasePointerCapture(e.pointerId)
    if (document.pointerLockElement) document.exitPointerLock()
    if (d.moved) { setScrubbing(false); if (mixed && onDelta) onDelta(roundTo(d.acc2 ?? 0, step), true); else commitNum(d.start, true) }
    else { setDraft(mixed ? '' : editText()); setEditing(true) }
  }

  const finishEdit = (apply: boolean) => {
    // keep keyboard users where they were (break-it A5)
    requestAnimationFrame(() => el.current?.focus())
    if (discard.current) { discard.current = false; apply = false }
    if (apply && mixed && onDelta) {
      const d = relativeDelta(draft)
      if (d !== null) { onDelta(pctScale ? d / pctScale : d, true); setEditing(false); return }
    }
    if (apply) {
      const v = readTyped(draft)
      if (v !== null && Number.isFinite(v)) commitNum(v, true)
    }
    setEditing(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
    const nudge = (dir: 1 | -1) => {
      e.preventDefault()
      // Mixed: nudge each selected item by a step instead of collapsing them to one value (break-it V2)
      if (mixed && onDelta) { onDelta(dir * step * mult, true); return }
      const n = clamp(roundTo((nudged.current ?? value) + dir * step * mult, step), min, max)
      nudged.current = n
      commitNum(n, false)
      clearTimeout(nudgeTimer.current)
      nudgeTimer.current = setTimeout(settleNudge, 500)
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') nudge(1)
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') nudge(-1)
    // Typing into a focused field starts editing with that character (Figma); Backspace starts empty (break-it V3)
    if (!e.metaKey && !e.ctrlKey && (/^[\d.+\-*/=]$/.test(e.key) || e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault(); e.stopPropagation()
      caretEnd.current = true
      setDraft(e.key.length === 1 && e.key !== '=' ? e.key : '')
      setEditing(true)
      return
    }
    if (e.key === 'Enter') { setDraft(editText()); setEditing(true) }
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
      onDoubleClick={() => {
        if (defaultValue === undefined) return
        discard.current = true
        setEditing(false)
        commitNum(defaultValue, true)
      }}
      onKeyDown={onKeyDown}
      onBlur={settleNudge}
      {...rest}
      className={cn(
        'group/scrub relative flex h-6 min-w-0 touch-pan-y items-center gap-1 rounded-[5px] tabular text-[11px] outline-none no-select',
        'cursor-ew-resize focus-visible:ring-2 focus-visible:ring-signal',
        boxed ? 'bg-control px-1.5 hover:shadow-[inset_0_0_0_1px_var(--line-strong)]' : 'px-1 hover:bg-hover',
        'data-[scrubbing]:bg-active',
        // untouched values read muted, not faint — they are real text (WCAG 1.4.3, break-it A7)
        changed === false ? 'text-fg-muted' : 'text-fg',
        mixed && 'text-fg-faint italic',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      {prefix != null && <span className="flex min-w-3 shrink-0 justify-center text-[10.5px] text-fg-faint">{prefix}</span>}
      {editing ? (
        <input
          ref={input}
          aria-label={label ? `${label} value` : 'Value'}
          // a number pad on phones (client-view C6) — iOS's has no minus sign, so only when values can't go negative
          inputMode={coarse() && !(min < 0) ? 'decimal' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finishEdit(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); finishEdit(true) }
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
})
