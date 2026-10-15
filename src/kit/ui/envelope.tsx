/* ---------------------------------------------------------------------------
   EnvelopeEditor — an ADSR envelope you shape directly on the curve
   (Ableton / Vital / Serum grammar). Any "rise, hold, fall" shape fits:
   amp and filter envelopes, LFO fades, light cues, haptics.

     <EnvelopeEditor value={{ a: 4, d: 220, s: 0.35, r: 160 }}
                     onChange={(env, final) => …}
                     max={{ a: 2000, d: 2000, r: 3000 }}
                     defaults={{ a: 4, d: 220, s: 0.35, r: 160 }}
                     marker={() => ({ t: secondsSinceNoteOn, gate: gateSeconds })} />

   Behaviour
     peak handle        drag x → attack
     decay handle       drag x → decay, y → sustain level
     release handle     drag x → release
     sustain segment    drag y → sustain
     double-click       reset that stage (needs `defaults`)
     keyboard           Tab to a handle; ← / → time, ↑ / ↓ sustain (decay
                        handle), Shift = fine. Home / End = min / max time.
     fields below       A · D · S · R kit ScrubValues — type exact numbers
                        (the non-drag alternative WCAG 2.5.7 asks for)

   Times (ms) use a square-root taper inside fixed slots so a 2 ms click and
   a 2 s swell are both reachable. `marker` is polled per animation frame
   (no React re-render) and returns { t, gate } in SECONDS since note-on;
   it draws a live dot where the last note is on the envelope.
   a11y: each handle is role="slider" with aria-valuetext in ms / %; the
   graph's fill and grid are decorative. Accent only on the curve.
   (Promoted from shells/synth/local/EnvelopeEditor.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { clamp, cn } from '../core/cn'
import { ScrubValue } from './scrub'

export interface ADSR { a: number; d: number; s: number; r: number }
type T = 'a' | 'd' | 'r'

const W = 280, H = 96, PAD = 8
// x slots: attack | decay | sustain hold | release
const SLOT = { a: 0.24, d: 0.26, hold: 0.16, r: 0.34 }

export const fmtMs = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`)

export interface EnvelopeEditorProps {
  value: ADSR
  onChange: (v: ADSR, final: boolean) => void
  max?: { a: number; d: number; r: number }
  min?: { a: number; d: number; r: number }
  /** double-click / reset targets and the changed-from-default cue on the fields */
  defaults?: ADSR
  /** live position of the last note: { t, gate } in seconds since note-on, or null */
  marker?: () => { t: number; gate: number } | null
  /** hide the A D S R fields (when the values are edited elsewhere) */
  hideFields?: boolean
  /** accessible name for the group */
  label?: string
  className?: string
}

export function EnvelopeEditor({
  value, onChange, max = { a: 2000, d: 2000, r: 3000 }, min = { a: 1, d: 10, r: 10 }, defaults, marker, hideFields, label = 'Envelope', className,
}: EnvelopeEditorProps) {
  const svg = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const drag = useRef<{ which: T | 's'; id: number } | null>(null)
  const live = useRef(value)
  live.current = value

  const iw = W - PAD * 2, ih = H - PAD * 2
  const slotX = { a: PAD, d: PAD + iw * SLOT.a, hold: PAD + iw * (SLOT.a + SLOT.d), r: PAD + iw * (SLOT.a + SLOT.d + SLOT.hold) }
  const tx = (t: number, k: T) => Math.sqrt(clamp((t - min[k]) / (max[k] - min[k]), 0, 1))
  const fromX = (f: number, k: T) => Math.round(min[k] + f * f * (max[k] - min[k]))
  const yOf = (lvl: number) => PAD + (1 - lvl) * ih

  const pA = [slotX.a + tx(value.a, 'a') * iw * SLOT.a, yOf(1)] as const
  const pD = [pA[0] + tx(value.d, 'd') * iw * SLOT.d, yOf(value.s)] as const
  const pS = [pD[0] + iw * SLOT.hold, yOf(value.s)] as const
  const pR = [pS[0] + tx(value.r, 'r') * iw * SLOT.r, yOf(0)] as const
  const p0 = [PAD, yOf(0)] as const
  // gentle exponential-looking curves for decay and release
  const path = `M${p0[0]},${p0[1]} L${pA[0]},${pA[1]} Q${pA[0] + (pD[0] - pA[0]) * 0.15},${pD[1]} ${pD[0]},${pD[1]} L${pS[0]},${pS[1]} Q${pS[0] + (pR[0] - pS[0]) * 0.15},${pR[1]} ${pR[0]},${pR[1]}`

  const local = (e: PointerEvent | React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const
  }
  const apply = (which: T | 's', x: number, y: number, final: boolean) => {
    const v = { ...live.current }
    const lvl = clamp(1 - (y - PAD) / ih, 0, 1)
    if (which === 'a') v.a = fromX(clamp((x - slotX.a) / (iw * SLOT.a), 0, 1), 'a')
    if (which === 'd') { v.d = fromX(clamp((x - pA[0]) / (iw * SLOT.d), 0, 1), 'd'); v.s = Math.round(lvl * 100) / 100 }
    if (which === 's') v.s = Math.round(lvl * 100) / 100
    if (which === 'r') v.r = fromX(clamp((x - pS[0]) / (iw * SLOT.r), 0, 1), 'r')
    onChange(v, final)
  }
  const down = (which: T | 's') => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag.current = { which, id: e.pointerId }
    setActive(which)
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const [x, y] = local(e)
    apply(d.which, x, y, false)
  }
  const up = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const [x, y] = local(e)
    apply(d.which, x, y, true)
    drag.current = null
    setActive(null)
  }

  const key = (which: T) => (e: React.KeyboardEvent) => {
    const v = { ...live.current }
    const f = e.shiftKey ? 0.2 : 1
    const scaleT = (t: number, k: T, dir: number) => clamp(Math.round(t * Math.pow(1.12, dir * f) + dir * f), min[k], max[k])
    let hit = true
    if (e.key === 'ArrowRight') v[which] = scaleT(v[which], which, 1)
    else if (e.key === 'ArrowLeft') v[which] = scaleT(v[which], which, -1)
    else if (e.key === 'Home') v[which] = min[which]
    else if (e.key === 'End') v[which] = max[which]
    else if (which === 'd' && e.key === 'ArrowUp') v.s = clamp(Math.round((v.s + 0.05 * f) * 100) / 100, 0, 1)
    else if (which === 'd' && e.key === 'ArrowDown') v.s = clamp(Math.round((v.s - 0.05 * f) * 100) / 100, 0, 1)
    else hit = false
    if (hit) { e.preventDefault(); e.stopPropagation(); onChange(v, true) }
  }
  const reset = (which: T) => () => { if (defaults) onChange({ ...live.current, [which]: defaults[which], ...(which === 'd' ? { s: defaults.s } : {}) }, true) }

  // live marker (no React re-render per frame)
  const dot = useRef<SVGCircleElement>(null)
  useEffect(() => {
    if (!marker) return
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const m = marker(), el = dot.current
      if (!el) return
      const v = live.current
      if (!m || m.t < 0) { el.style.opacity = '0'; return }
      const A = v.a / 1000, D = v.d / 1000, R = v.r / 1000
      let x: number, lvl: number
      if (m.t < m.gate) {
        if (m.t < A) { x = slotX.a + (pA[0] - slotX.a) * (m.t / A); lvl = m.t / A }
        else { const k = Math.min(1, (m.t - A) / Math.max(0.001, D * 3)); x = pA[0] + (pD[0] - pA[0]) * Math.min(1, (m.t - A) / Math.max(0.001, D)); lvl = 1 - (1 - v.s) * (1 - Math.exp(-3 * k)) }
        if (m.t >= A + D) x = pD[0] + (pS[0] - pD[0]) * Math.min(1, (m.t - A - D) / 0.5)
      } else {
        const k = (m.t - m.gate) / Math.max(0.001, R)
        if (k > 1.2) { el.style.opacity = '0'; return }
        x = pS[0] + (pR[0] - pS[0]) * Math.min(1, k); lvl = v.s * Math.exp(-4 * k)
      }
      el.style.opacity = '1'
      el.setAttribute('cx', String(x))
      el.setAttribute('cy', String(yOf(lvl)))
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker, pA[0], pD[0], pS[0], pR[0]])

  const handle = (k: T, [x, y]: readonly [number, number], name: string, text: string) => (
    <g key={k}>
      <circle cx={x} cy={y} r={11} fill="transparent" className="cursor-grab" onPointerDown={down(k)} onDoubleClick={reset(k)} />
      <circle
        cx={x} cy={y} r={active === k ? 5 : 4}
        role="slider" tabIndex={0} aria-label={name} aria-valuetext={text}
        aria-valuenow={live.current[k]} aria-valuemin={min[k]} aria-valuemax={max[k]}
        onKeyDown={key(k)} onPointerDown={down(k)} onDoubleClick={reset(k)}
        className="cursor-grab fill-[var(--panel)] stroke-[var(--signal)] outline-none transition-[r] [stroke-width:2] hover:fill-[var(--signal)] focus-visible:fill-[var(--signal)]"
      />
    </g>
  )

  return (
    <div role="group" aria-label={label} className={cn('flex w-full flex-col gap-1.5', className)}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none rounded-[6px] bg-control" style={{ aspectRatio: `${W} / ${H}` }}
        onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={PAD} x2={W - PAD} y1={yOf(g)} y2={yOf(g)} stroke="var(--line)" />)}
        {[slotX.d, slotX.hold, slotX.r].map((x) => <line key={x} x1={x} x2={x} y1={PAD} y2={H - PAD} stroke="var(--line)" strokeDasharray="2 3" />)}
        <path d={`${path} L${pR[0]},${yOf(0)} L${p0[0]},${yOf(0)} Z`} fill="var(--signal-soft)" />
        <path d={path} fill="none" stroke="var(--signal)" strokeWidth={1.75} strokeLinejoin="round" />
        {/* sustain segment: drag vertically */}
        <line x1={pD[0]} x2={pS[0]} y1={pS[1]} y2={pS[1]} stroke="transparent" strokeWidth={12} className="cursor-ns-resize" onPointerDown={down('s')} />
        <circle ref={dot} r={3.5} fill="var(--rec)" style={{ opacity: 0 }} />
        {handle('a', pA, 'Attack', fmtMs(value.a))}
        {handle('d', pD, 'Decay and sustain', `${fmtMs(value.d)}, sustain ${Math.round(value.s * 100)}%`)}
        {handle('r', pR, 'Release', fmtMs(value.r))}
      </svg>
      {!hideFields && (
        // two by two: four boxed values don't fit an inspector-wide row once they read "220ms"
        <div className="grid grid-cols-2 gap-1">
          {([
            ['a', 'A', 1, min.a, max.a, fmtMs],
            ['d', 'D', 1, min.d, max.d, fmtMs],
            // sustain is edited in percent, so typing 35 means 35%
            ['s', 'S', 100, 0, 100, (n: number) => `${Math.round(n)}%`],
            ['r', 'R', 1, min.r, max.r, fmtMs],
          ] as const).map(([k, p, k100, lo, hi, f]) => (
            <ScrubValue key={k} boxed align="left" prefix={p} value={Math.round(value[k] * k100 * 100) / 100} min={lo} max={hi} step={1} fmt={f}
              label={{ a: 'Attack', d: 'Decay', s: 'Sustain', r: 'Release' }[k]}
              defaultValue={defaults ? defaults[k] * k100 : undefined} changed={defaults ? defaults[k] !== value[k] : undefined}
              onChange={(n, fin) => onChange({ ...live.current, [k]: n / k100 }, fin)} className={cn(active === k && 'shadow-[inset_0_0_0_1px_var(--signal)]')} />
          ))}
        </div>
      )}
    </div>
  )
}
