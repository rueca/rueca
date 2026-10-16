/* ---------------------------------------------------------------------------
   EasingEditor — the popover body you get by clicking the segment between two
   keyframes (Figma Motion / Theatre.js / Rive). One preset row above three
   editors: Curve (kit CurveEditor), Spring (Duration + Bounce, with a Physics
   toggle for stiffness / damping / mass) and Hold. Pastes a CSS
   `cubic-bezier(…)` from the clipboard.

     <EasingEditor value={ease} onChange={(e, final) => …} span={segmentMs} />
     <SpringField value={{ duration: 500, bounce: 0.3 }} onChange={(s, final) => …} span={600} />
     <EaseGlyph ease={ease} />          // 16px glyph for segments, menus and rows

   `value` is a kit `Ease` (core/ease): { kind: 'bezier', p } | { kind: 'spring',
   duration, bounce } | { kind: 'hold' }. `span` (ms) is the window the spring
   preview plots — pass the segment length so a spring the next key cuts off
   is visibly cut off (dotted line marks the spring's own duration).

   Behaviour: switching Curve ↔ Spring ↔ Hold remembers the last value of each
   kind, so flipping tabs is lossless. Every drag reports final=false, and
   release / preset clicks report final=true — one undo step per gesture.
   Keyboard + non-drag: presets are buttons; the curve has typed x1 y1 x2 y2
   fields; Duration and Bounce are sliders with typed fields (bounce is typed
   in percent: 30 means 30%); the type switch is a Segmented (arrow keys).
   (Promoted from shells/animate/local/EasingEditor.tsx + SpringField.tsx.)
--------------------------------------------------------------------------- */
import { useState, type ReactNode } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { cn } from '../core/cn'
import { EASINGS, SPRINGS, easeName, parseCubicBezier, physicsToSpring, springCurve, springToPhysics, type Bezier, type Ease, type Spring } from '../core/ease'
import { CurveEditor, CurveGlyph, SpringEditor } from './special'
import { Segmented, Switch } from './controls'
import { IconButton } from './button'
import { ScrubValue } from './scrub'
import { Slider } from './slider'
import { toast } from '../system/toast'

export { easeName }

/** The default preset row: a curve for each common feel, plus a spring and a hold. */
export const EASE_PRESETS: { name: string; ease: Ease }[] = [
  { name: 'Linear', ease: { kind: 'bezier', p: EASINGS.Linear } },
  { name: 'Ease in', ease: { kind: 'bezier', p: EASINGS['Ease in'] } },
  { name: 'Ease out', ease: { kind: 'bezier', p: EASINGS['Ease out'] } },
  { name: 'Ease in out', ease: { kind: 'bezier', p: EASINGS['Ease in out'] } },
  { name: 'Back', ease: { kind: 'bezier', p: EASINGS['Out back'] } },
  { name: 'Spring', ease: { kind: 'spring', duration: 500, bounce: 0.3 } },
  { name: 'Hold', ease: { kind: 'hold' } },
]

const sameEase = (a: Ease, b: Ease) => JSON.stringify(a) === JSON.stringify(b)

/** Small glyph for an ease — timeline segments, menus, inspector rows. */
export function EaseGlyph({ ease, className }: { ease: Ease; className?: string }) {
  if (ease.kind === 'bezier') return <CurveGlyph value={ease.p} className={className} />
  if (ease.kind === 'hold')
    return <svg viewBox="-2 -6 24 28" aria-hidden className={cn('size-4', className)}><path d="M0,20 H14 V0 H20" fill="none" stroke="currentColor" strokeWidth={1.75} /></svg>
  return <svg viewBox="-2 -6 24 28" aria-hidden className={cn('size-4', className)}><path d="M0,20 C4,-6 7,-6 9,4 C11,12 13,2 15,0 C17,-2 18,1 20,0" fill="none" stroke="currentColor" strokeWidth={1.75} /></svg>
}

export interface EasingEditorProps {
  value: Ease
  onChange: (e: Ease, final: boolean) => void
  /** segment length (ms) — the spring preview window */
  span: number
  /** preset chips; [] hides the row */
  presets?: { name: string; ease: Ease }[]
  /** curves offered under the CurveEditor */
  curves?: Record<string, Bezier>
  /** which editors to offer (default all three) */
  kinds?: Ease['kind'][]
  footer?: ReactNode
  className?: string
}

export function EasingEditor({ value, onChange, span, presets = EASE_PRESETS, curves = {}, kinds = ['bezier', 'spring', 'hold'], footer, className }: EasingEditorProps) {
  // Remember the last of each kind so flipping tabs is lossless.
  const [memo, setMemo] = useState<{ bezier: Bezier; spring: Spring }>(() => ({
    bezier: value.kind === 'bezier' ? value.p : EASINGS['Ease in out'],
    spring: value.kind === 'spring' ? { duration: value.duration, bounce: value.bounce } : { duration: Math.min(800, Math.max(200, span)), bounce: 0.3 },
  }))
  const set = (e: Ease, final: boolean) => {
    if (e.kind === 'bezier') setMemo((m) => ({ ...m, bezier: e.p }))
    if (e.kind === 'spring') setMemo((m) => ({ ...m, spring: { duration: e.duration, bounce: e.bounce } }))
    onChange(e, final)
  }
  const paste = async () => {
    try {
      const p = parseCubicBezier(await navigator.clipboard.readText())
      if (p) set({ kind: 'bezier', p }, true)
      else toast('No cubic-bezier() on the clipboard', { type: 'error' })
    } catch { toast('Clipboard is not available', { type: 'error' }) }
  }
  const KIND_LABEL = { bezier: 'Curve', spring: 'Spring', hold: 'Hold' } as const
  return (
    <div className={cn('flex w-[264px] flex-col gap-2.5 p-3', className)}>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Easing presets">
          {presets.filter((p) => kinds.includes(p.ease.kind)).map((p) => {
            const on = sameEase(p.ease, value)
            return (
              <button key={p.name} type="button" aria-pressed={on} onClick={() => set(p.ease, true)}
                className={cn('flex h-control items-center gap-1 rounded-control pr-1.5 pl-1 text-ui outline-none focus-visible:ring-2 focus-visible:ring-signal',
                  on ? 'bg-signal-soft text-signal-text' : 'bg-hover text-fg-muted hover:text-fg')}>
                <EaseGlyph ease={p.ease} className="size-3.5" />
                {p.name}
              </button>
            )
          })}
        </div>
      )}
      {kinds.length > 1 && (
        <div className="flex items-center gap-1">
          <Segmented size="sm" label="Easing type" value={value.kind}
            onChange={(k) => set(k === 'bezier' ? { kind: 'bezier', p: memo.bezier } : k === 'spring' ? { kind: 'spring', ...memo.spring } : { kind: 'hold' }, true)}
            options={kinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
          {value.kind === 'bezier' && <IconButton icon={ClipboardPaste} size="icon-sm" label="Paste cubic-bezier()" onClick={paste} />}
        </div>
      )}
      {value.kind === 'bezier' && <CurveEditor value={value.p} onChange={(p, f) => set({ kind: 'bezier', p }, f)} presets={curves} height={120} />}
      {value.kind === 'spring' && <SpringField value={{ duration: value.duration, bounce: value.bounce }} span={span} onChange={(s, f) => set({ kind: 'spring', ...s }, f)} />}
      {value.kind === 'hold' && (
        <div className="flex flex-col gap-2">
          <svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden className="h-16 w-full rounded-control bg-control">
            <polyline points="8,52 88,52 88,16 92,16" fill="none" stroke="var(--signal)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="text-ui leading-relaxed text-fg-muted">The value stays put, then jumps when the next key is reached. Use it for colour swaps and visibility.</p>
        </div>
      )}
      {footer && <div className="border-t border-line pt-2 text-ui text-fg-faint">{footer}</div>}
    </div>
  )
}

/** Response plot of a Duration + Bounce spring over `span` ms. */
export function SpringGraph({ value, span, height = 64 }: { value: Spring; span: number; height?: number }) {
  const f = springCurve(value)
  const N = 120
  const pts: string[] = []
  for (let i = 0; i <= N; i++) pts.push(`${((i / N) * 100).toFixed(2)},${(52 - f((i / N) * Math.max(span, 1)) * 36).toFixed(2)}`)
  const settle = Math.min(1, value.duration / Math.max(span, 1)) * 100
  return (
    <svg viewBox="0 0 100 64" preserveAspectRatio="none" role="img" aria-label={`Spring response, ${Math.round(value.duration)} ms, bounce ${Math.round(value.bounce * 100)}%`}
      className="w-full rounded-control bg-control" style={{ height }}>
      <line x1={0} x2={100} y1={16} y2={16} stroke="var(--line-strong)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <line x1={0} x2={100} y1={52} y2={52} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
      {settle < 100 && <line x1={settle} x2={settle} y1={4} y2={60} stroke="var(--fg-faint)" strokeDasharray="1.5 2" vectorEffect="non-scaling-stroke" />}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--signal)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export interface SpringFieldProps {
  value: Spring
  onChange: (v: Spring, final: boolean) => void
  /** preview window in ms (default: twice the duration) */
  span?: number
  /** named springs offered as chips; {} hides them */
  presets?: Record<string, Spring>
  /** start in the stiffness / damping / mass view */
  defaultPhysics?: boolean
}

/** A spring as Duration + Bounce (the default), or as stiffness / damping / mass behind the Physics toggle. */
export function SpringField({ value, onChange, span, presets = SPRINGS, defaultPhysics = false }: SpringFieldProps) {
  const [physics, setPhysics] = useState(defaultPhysics)
  const win = span ?? value.duration * 2
  const presetName = Object.entries(presets).find(([, p]) => p.duration === value.duration && p.bounce === value.bounce)?.[0]
  return (
    <div className="flex w-full flex-col gap-2">
      {physics
        ? <SpringEditor value={springToPhysics(value)} onChange={(p, f) => onChange(physicsToSpring(p), f)} />
        : <SpringGraph value={value} span={win} />}
      {!physics && (
        <div className="flex flex-col gap-0.5">
          <div className="flex h-row items-center gap-2">
            <span className="w-[58px] shrink-0 text-ui text-fg-muted">Duration</span>
            <Slider value={Math.min(2000, value.duration)} min={50} max={2000} step={10} label="Duration" onChange={(d, f) => onChange({ ...value, duration: d }, f)} />
            <ScrubValue value={value.duration} min={50} max={4000} step={10} unit="ms" className="w-[56px] shrink-0" label="Duration"
              onChange={(d, f) => onChange({ ...value, duration: d }, f)} defaultValue={500} />
          </div>
          <div className="flex h-row items-center gap-2">
            <span className="w-[58px] shrink-0 text-ui text-fg-muted">Bounce</span>
            <Slider value={value.bounce} min={-0.5} max={0.9} step={0.01} origin={0} label="Bounce" onChange={(b, f) => onChange({ ...value, bounce: b }, f)} />
            {/* edited in percent so typing 30 means 30% */}
            <ScrubValue value={Math.round(value.bounce * 100)} min={-50} max={90} step={1} unit="%" className="w-[56px] shrink-0" label="Bounce"
              onChange={(b, f) => onChange({ ...value, bounce: b / 100 }, f)} defaultValue={25} />
          </div>
        </div>
      )}
      {/* wraps rather than pushing the Physics switch out of the popover */}
      <div className="flex flex-wrap items-center gap-1">
        {Object.entries(presets).map(([n, p]) => (
          <button key={n} type="button" aria-pressed={presetName === n} onClick={() => onChange(p, true)}
            className={cn('h-icon-sm rounded-control px-1.5 text-ui-sm outline-none focus-visible:ring-2 focus-visible:ring-signal', presetName === n ? 'bg-signal-soft text-signal-text' : 'bg-hover text-fg-muted hover:text-fg')}>
            {n}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-ui text-fg-muted">
          Physics
          <Switch size="sm" checked={physics} onChange={setPhysics} label="Edit as stiffness, damping and mass" />
        </label>
      </div>
    </div>
  )
}
