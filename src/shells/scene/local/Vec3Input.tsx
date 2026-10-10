/* ---------------------------------------------------------------------------
   Vec3Input — X / Y / Z scrub fields with an optional uniform lock.

     <Vec3Input value={v} onChange={(v, final) => …} step={0.01} />
     <Vec3Input value={scale} onChange={…} lockable defaultLocked />   // Spline's uniform scale

   The kit's Vec3Fields has no lock. With `lockable`, a chain toggle sits at
   the end of the row; while locked, scrubbing any axis scales the other two
   by the same ratio (or sets them equal when the edited axis was zero).
   Each field keeps the kit ScrubValue behaviour: drag, type, expressions,
   arrows, double-click to reset.
--------------------------------------------------------------------------- */
import { useState } from 'react'
import { Link2, Unlink2 } from 'lucide-react'
import { ScrubValue, Tip, cn } from '@kit'

export type Vec3 = { x: number; y: number; z: number }

const AXES = [['x', 'X', 'text-cat-5'], ['y', 'Y', 'text-cat-3'], ['z', 'Z', 'text-cat-1']] as const

export function Vec3Input({
  value, onChange, step = 0.01, min, max, unit, changed, defaultValue, lockable, defaultLocked = true, label,
}: {
  value: Vec3
  onChange: (v: Vec3, final: boolean) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  changed?: boolean
  defaultValue?: Vec3
  lockable?: boolean
  defaultLocked?: boolean
  label?: string
}) {
  const [locked, setLocked] = useState(defaultLocked)
  const set = (k: keyof Vec3, n: number, final: boolean) => {
    if (!(lockable && locked)) return onChange({ ...value, [k]: n }, final)
    const old = value[k]
    if (Math.abs(old) < 1e-9) return onChange({ x: n, y: n, z: n }, final)
    const f = n / old
    const r = (x: number) => Number((x * f).toFixed(4))
    onChange({ x: k === 'x' ? n : r(value.x), y: k === 'y' ? n : r(value.y), z: k === 'z' ? n : r(value.z) }, final)
  }
  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
        {AXES.map(([k, l, c]) => (
          <ScrubValue
            key={k}
            boxed
            align="left"
            prefix={<span className={c}>{l}</span>}
            value={value[k]}
            step={step}
            min={min}
            max={max}
            unit={unit}
            changed={changed}
            defaultValue={defaultValue?.[k]}
            label={`${label ? `${label} ` : ''}${l}`}
            onChange={(n, f) => set(k, n, f)}
          />
        ))}
      </div>
      {lockable && (
        <Tip label={locked ? 'Uniform — click to scale axes independently' : 'Scale axes together'}>
          <button
            type="button"
            aria-pressed={locked}
            aria-label="Uniform scale"
            onClick={() => setLocked(!locked)}
            className={cn('flex size-6 shrink-0 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', locked ? 'text-signal' : 'text-fg-faint')}
          >
            {locked ? <Link2 size={13} strokeWidth={1.5} /> : <Unlink2 size={13} strokeWidth={1.5} />}
          </button>
        </Tip>
      )}
    </div>
  )
}
