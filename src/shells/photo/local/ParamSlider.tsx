/* ---------------------------------------------------------------------------
   GradientSlider + ParamSlider.

   GradientSlider: the kit Slider with a painted track — Lightroom's
   blue→yellow Temp, green→magenta Tint, and the hue / saturation rails of a
   colour mixer. With a gradient the thumb is always visible (there is no
   fill to read the value from); without one it behaves like the kit Slider
   (accent fill from `origin`, thumb on hover).

   ParamSlider: one inspector row bound to a schema key, so hand-built
   panels match <Inspector> rows exactly (label, changed cue, double-click to
   reset, hint tooltip, scrubbable value) but can choose their own track.

     <ParamSlider params={params} k="temp" track="linear-gradient(90deg,#4a7bd8,#e8d14a)" />
--------------------------------------------------------------------------- */
import { Slider as Base } from '@base-ui/react/slider'
import { Row, ScrubValue, cn, equal, humanize, useParamState, type AnyParams, type NumberDef } from '@kit'

export function GradientSlider({
  value, onChange, min = 0, max = 1, step = 0.01, track, origin, label, className,
}: {
  value: number
  onChange: (v: number, final: boolean) => void
  min?: number; max?: number; step?: number
  /** CSS background for the rail; omit for the kit's plain track */
  track?: string
  /** fill from this value (plain track only), e.g. 0 for a −100…100 control */
  origin?: number
  label?: string
  className?: string
}) {
  const at = ((value - min) / (max - min)) * 100
  const from = origin !== undefined ? ((origin - min) / (max - min)) * 100 : 0
  return (
    <Base.Root value={value} min={min} max={max} step={step} onValueChange={(v) => onChange(v as number, false)} onValueCommitted={(v) => onChange(v as number, true)}
      className={cn('group/slider relative flex h-6 w-full min-w-0 items-center no-select', className)}>
      <Base.Control className="flex h-6 w-full cursor-default items-center">
        <Base.Track className={cn('relative w-full rounded-full', track ? 'h-[5px]' : 'h-[3px] bg-track')} style={track ? { background: track } : undefined}>
          {!track && <div className="absolute inset-y-0 rounded-full bg-signal" style={{ left: `${Math.min(from, at)}%`, width: `${Math.abs(at - from)}%` }} />}
          <Base.Thumb
            aria-label={label}
            className={cn(
              'rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.3),0_1px_3px_rgba(0,0,0,.45)] outline-none transition-opacity duration-100',
              'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal data-[dragging]:opacity-100',
              track ? 'size-[11px]' : 'size-3 opacity-0 group-hover/slider:opacity-100',
            )}
          />
        </Base.Track>
      </Base.Control>
    </Base.Root>
  )
}

const signed = (step: number) => (v: number) => {
  const d = step < 1 ? (String(step).split('.')[1]?.length ?? 2) : 0
  const s = v.toFixed(d)
  return v > 0 ? `+${s}` : s
}

export function ParamSlider({ params, k, track, label, signedValue = true, className }: { params: AnyParams; k: string; track?: string; label?: string; signedValue?: boolean; className?: string }) {
  const v = useParamState(params, (s: any) => s.values[k]) as number
  const def = params.defs[k] as NumberDef
  const dflt = params.getState().defaults[k] as number
  const changed = !equal(v, dflt)
  const min = def.min ?? 0, max = def.max ?? 1, step = def.step ?? 1
  const set = (n: number, final: boolean) => params.setValue(k, n, { commit: final })
  const name = label ?? def.label ?? humanize(k)
  return (
    <Row label={name} hint={def.hint} changed={changed} onReset={() => params.reset([k])} className={className}>
      <GradientSlider value={v} onChange={set} min={min} max={max} step={step} track={track} origin={min < 0 ? 0 : min} label={name} />
      <ScrubValue value={v} onChange={set} min={min} max={max} step={step} defaultValue={dflt} changed={changed} label={name}
        fmt={def.fmt ?? (signedValue && min < 0 ? signed(step) : undefined)} unit={def.unit} className="w-[46px] shrink-0" />
    </Row>
  )
}
