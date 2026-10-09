/* ---------------------------------------------------------------------------
   SpringField — a spring as Duration + Bounce (Framer / Apple / Figma
   Motion), with a "Physics" view that edits the same spring as stiffness /
   damping / mass using the kit SpringEditor. research/04 names Duration +
   Bounce as the kit default; the kit SpringEditor only speaks physics.

     <SpringField value={{ duration: 500, bounce: 0.3 }} onChange={(v, final) => …} span={600} />

   `span` (ms) is the window the preview plots — pass the segment length so
   a spring that is cut off by the next key is visibly cut off.
--------------------------------------------------------------------------- */
import { useState } from 'react'
import { cn, ScrubValue, Slider, SpringEditor, Switch } from '@kit'
import { physicsToSpring, spring, springToPhysics } from '../engine'

export type SpringDB = { duration: number; bounce: number }

export const SPRING_PRESETS: Record<string, SpringDB> = {
  Gentle: { duration: 700, bounce: 0.1 },
  Quick: { duration: 300, bounce: 0.15 },
  Bouncy: { duration: 500, bounce: 0.45 },
  Slow: { duration: 1000, bounce: 0.2 },
}

export function SpringGraph({ value, span, height = 64 }: { value: SpringDB; span: number; height?: number }) {
  const f = spring(value.duration, value.bounce)
  const N = 120
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * 100
    const y = f((i / N) * Math.max(span, 1))
    pts.push(`${x.toFixed(2)},${(52 - y * 36).toFixed(2)}`)
  }
  const settle = Math.min(1, value.duration / Math.max(span, 1)) * 100
  return (
    <svg viewBox="0 0 100 64" preserveAspectRatio="none" className="w-full rounded-[6px] bg-input" style={{ height }}>
      <line x1={0} x2={100} y1={16} y2={16} stroke="var(--line-strong)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <line x1={0} x2={100} y1={52} y2={52} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
      {settle < 100 && <line x1={settle} x2={settle} y1={4} y2={60} stroke="var(--fg-faint)" strokeDasharray="1.5 2" vectorEffect="non-scaling-stroke" />}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function SpringField({ value, onChange, span }: { value: SpringDB; onChange: (v: SpringDB, final: boolean) => void; span: number }) {
  const [physics, setPhysics] = useState(false)
  const ph = springToPhysics(value.duration, value.bounce)
  const presetName = Object.entries(SPRING_PRESETS).find(([, p]) => p.duration === value.duration && p.bounce === value.bounce)?.[0]
  return (
    <div className="flex w-full flex-col gap-2">
      {physics
        ? <SpringEditor value={ph} onChange={(p, f) => onChange(physicsToSpring(p.stiffness, p.damping, p.mass), f)} />
        : <SpringGraph value={value} span={span} />}
      {!physics && (
        <div className="flex flex-col gap-0.5">
          <div className="flex h-7 items-center gap-2">
            <span className="w-[58px] shrink-0 text-[11.5px] text-muted">Duration</span>
            <Slider value={value.duration} min={50} max={2000} step={10} label="Duration" onChange={(d, f) => onChange({ ...value, duration: d }, f)} />
            <ScrubValue value={value.duration} min={50} max={4000} step={10} unit="ms" className="w-[56px] shrink-0" label="Duration"
              onChange={(d, f) => onChange({ ...value, duration: d }, f)} defaultValue={500} />
          </div>
          <div className="flex h-7 items-center gap-2">
            <span className="w-[58px] shrink-0 text-[11.5px] text-muted">Bounce</span>
            <Slider value={value.bounce} min={-0.5} max={0.9} step={0.01} origin={0} label="Bounce" onChange={(b, f) => onChange({ ...value, bounce: b }, f)} />
            <ScrubValue value={value.bounce} min={-0.5} max={0.9} step={0.01} className="w-[56px] shrink-0" label="Bounce"
              fmt={(b) => `${Math.round(b * 100)}%`} onChange={(b, f) => onChange({ ...value, bounce: b }, f)} defaultValue={0.25} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1">
        {Object.entries(SPRING_PRESETS).map(([n, p]) => (
          <button key={n} type="button" onClick={() => onChange(p, true)}
            className={cn('h-5 rounded-[5px] px-1.5 text-[10.5px] outline-none focus-visible:ring-2 focus-visible:ring-accent', presetName === n ? 'bg-accent-soft text-accent' : 'bg-hover text-muted hover:text-fg')}>
            {n}
          </button>
        ))}
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-[11px] text-muted">
          Physics
          <Switch size="sm" checked={physics} onChange={setPhysics} label="Edit as stiffness, damping and mass" />
        </label>
      </div>
    </div>
  )
}
