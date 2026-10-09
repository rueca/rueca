/* ---------------------------------------------------------------------------
   QuadField (kit candidate) — one value that can split into four: padding,
   corner radius, border widths. Figma/Rive/Paper all do "one field + an
   independent toggle".

     <QuadField value={[t, r, b, l]} onChange={…} mode="pairs" icons={…} />

   mode="single": one field (all four) ↔ four fields.
   mode="pairs":  horizontal + vertical (padding) ↔ four fields.
   Collapsed fields show "Mixed" when the parts differ; scrubbing a mixed
   field sets them all. Independence is remembered while the panel lives.
--------------------------------------------------------------------------- */
import { useState, type ReactNode } from 'react'
import { ScrubValue, Tip, cn } from '@kit'

export type Quad = [number, number, number, number]

export function QuadField({
  value, onChange, mode = 'single', labels = ['T', 'R', 'B', 'L'], prefix, toggleIcon, min = 0, max = 999, mixed, className,
}: {
  value: Quad
  onChange: (v: Quad, final: boolean) => void
  mode?: 'single' | 'pairs'
  labels?: [ReactNode, ReactNode, ReactNode, ReactNode]
  prefix?: ReactNode | [ReactNode, ReactNode]
  toggleIcon: ReactNode
  min?: number
  max?: number
  /** multi-selection with differing values */
  mixed?: boolean
  className?: string
}) {
  const [split, setSplit] = useState(() => (mode === 'single' ? value.some((v) => v !== value[0]) : value[0] !== value[2] || value[1] !== value[3]))
  const field = (v: number, set: (n: number, f: boolean) => void, p: ReactNode, isMixed = false, label?: string) => (
    <ScrubValue boxed align="left" prefix={p} value={v} min={min} max={max} step={1} mixed={isMixed} onChange={set} label={label} className="min-w-0 flex-1" />
  )
  const toggle = (
    <Tip label={split ? 'Use one value' : 'Independent values'}>
      <button type="button" aria-pressed={split} onClick={() => setSplit(!split)}
        className={cn('flex size-6 shrink-0 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', split ? 'bg-active text-fg' : 'text-fg-faint')}>
        {toggleIcon}
      </button>
    </Tip>
  )
  if (split)
    return (
      <div className={cn('flex w-full items-start gap-1', className)}>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1">
          {value.map((v, i) => <div key={i} className="flex min-w-0">{field(v, (n, f) => { const next = [...value] as Quad; next[i] = n; onChange(next, f) }, labels[i], mixed, `Side ${i + 1}`)}</div>)}
        </div>
        {toggle}
      </div>
    )
  if (mode === 'pairs') {
    const [ph, pv] = Array.isArray(prefix) ? prefix : [prefix, prefix]
    return (
      <div className={cn('flex w-full items-center gap-1', className)}>
        {field(value[3], (n, f) => onChange([value[0], n, value[2], n], f), ph, mixed || value[1] !== value[3], 'Horizontal')}
        {field(value[0], (n, f) => onChange([n, value[1], n, value[3]], f), pv, mixed || value[0] !== value[2], 'Vertical')}
        {toggle}
      </div>
    )
  }
  return (
    <div className={cn('flex w-full items-center gap-1', className)}>
      {field(value[0], (n, f) => onChange([n, n, n, n], f), prefix as ReactNode, mixed || value.some((v) => v !== value[0]), 'All')}
      {toggle}
    </div>
  )
}
