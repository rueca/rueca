/* ---------------------------------------------------------------------------
   GradientSlider + ParamSlider — sliders whose track SHOWS what they do:
   Lightroom's blue→yellow Temp, green→magenta Tint, the hue / saturation /
   luminance rails of a colour mixer, a black→white tone rail.

     <GradientSlider value={t} onChange={(v, final) => …} min={-100} max={100}
       track="linear-gradient(90deg, #3f74d9, #bdbdbd 50%, #e3c443)" />

     <ParamSlider params={params} k="temp" track={TEMP} />          // one schema row
     <ParamSlider params={params} k="exposure" stepLabel={(v, l) => `${l} ${v}`} />

   GradientSlider: with a `track` the rail is painted and the thumb always
   shows (there is no fill to read the value from); without one it is the
   kit Slider look — accent fill from `origin` (default 0 when the range
   spans zero, so bipolar controls fill from the centre), thumb on hover.
   The track gradient is artwork (it depicts the effect), so it may hold
   literal colours; the chrome around it is tokens.

   ParamSlider: one Inspector-identical row bound to a schema number key —
   label with hint tooltip, changed cue, double-click the label to reset,
   scrubbable typed value (the non-drag path) — with your own track.
   `stepLabel` names the undo step on release ("Exposure +0.45") so a
   HistoryList reads like Lightroom's.

   Keyboard: the thumb is a Base UI slider (←/→, PgUp/PgDn, Home/End);
   the value is a kit ScrubValue (type, arrows, expressions).
   Accessibility: role="slider" with aria-label from the row label.
   (Promoted from shells/photo/local/ParamSlider.tsx.)
--------------------------------------------------------------------------- */
import { Slider as Base } from '@base-ui/react/slider'
import { cn } from '../core/cn'
import { useParamState, type AnyParams } from '../core/params'
import { equal, humanize, type NumberDef } from '../core/schema'
import { Row } from '../inspector/Inspector'
import { ScrubValue } from './scrub'

export function GradientSlider({
  value, onChange, min = 0, max = 1, step = 0.01, track, origin, label, disabled, className,
}: {
  value: number
  onChange: (v: number, final: boolean) => void
  min?: number; max?: number; step?: number
  /** CSS background for the rail (a gradient); omit for the kit's plain track */
  track?: string
  /** fill from this value (plain track only); defaults to 0 when min < 0 < max */
  origin?: number
  label?: string
  disabled?: boolean
  className?: string
}) {
  const o = origin ?? (min < 0 && max > 0 ? 0 : min)
  const at = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100
  const from = ((o - min) / (max - min)) * 100
  return (
    <Base.Root value={value} min={min} max={max} step={step} disabled={disabled}
      onValueChange={(v) => onChange(v as number, false)} onValueCommitted={(v) => onChange(v as number, true)}
      className={cn('group/slider relative flex h-control w-full min-w-0 items-center no-select data-[disabled]:opacity-40', className)}>
      <Base.Control className="flex h-control w-full cursor-default items-center">
        <Base.Track className={cn('relative w-full rounded-full', track ? 'h-[5px] shadow-[inset_0_0_0_0.5px_var(--line-strong)]' : 'h-[2px] bg-track shadow-[0_0_0_0.5px_var(--line-strong)]')} style={track ? { background: track } : undefined}>
          {!track && <div className="absolute inset-y-0 rounded-full bg-fill" style={{ left: `${Math.min(from, at)}%`, width: `${Math.abs(at - from)}%` }} />}
          <Base.Thumb
            aria-label={label}
            className={cn(
              'rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.3),0_1px_3px_rgba(0,0,0,.45)] outline-none duration-100',
              // like <Slider>: the thumb rests small but always visible (WCAG 1.4.11) and grows on hover, focus and drag
              'has-[:focus-visible]:scale-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-signal data-[dragging]:scale-100',
              track ? 'size-[11px]' : 'size-3 scale-[0.6] transition-transform group-hover/slider:scale-100',
            )}
          />
        </Base.Track>
      </Base.Control>
    </Base.Root>
  )
}

/** "+12" / "−0.45": a signed formatter for bipolar values, decimals from the step. */
export const signedFmt = (step: number) => (v: number) => {
  const d = step < 1 ? (String(step).split('.')[1]?.length ?? 2) : 0
  const s = v.toFixed(d)
  return v > 0 ? `+${s}` : s
}

export function ParamSlider({
  params, k, track, label, signed = true, stepLabel, valueWidth = 46, className,
}: {
  params: AnyParams
  /** a `p.number` key with min / max */
  k: string
  track?: string
  /** row label (default: the def's label) */
  label?: string
  /** show + on positive values when the range spans zero (default true) */
  signed?: boolean
  /** name the undo step on release, e.g. (v, label) => `${label} ${v}` */
  stepLabel?: (value: number, label: string, fmt: (v: number) => string) => string
  valueWidth?: number
  className?: string
}) {
  const def = params.defs[k] as NumberDef | undefined
  const v = useParamState(params, (s: { values: Record<string, unknown> }) => s.values[k]) as number
  // re-render when a `when` / `disabled` condition flips, not on every value
  const gate = useParamState(params, (s: { values: Record<string, unknown> }) =>
    `${!def?.when || def.when(s.values) ? 1 : 0}${typeof def?.disabled === 'function' && def.disabled(s.values) ? 1 : 0}`)
  if (!def || gate[0] === '0') return null
  const values = params.values() as Record<string, unknown>
  const dflt = params.getState().defaults[k] as number
  const changed = !equal(v, dflt)
  const min = def.min ?? 0, max = def.max ?? 1, step = def.step ?? 1
  const name = label ?? def.label ?? humanize(k)
  const fmt = def.fmt ?? (signed && min < 0 ? signedFmt(step) : undefined)
  const show = fmt ?? ((n: number) => `${n}${def.unit ?? ''}`)
  const set = (n: number, final: boolean) => params.setValue(k, n, { commit: final, label: final && stepLabel ? stepLabel(n, name, show) : undefined })
  const disabled = typeof def.disabled === 'function' ? def.disabled(values) : def.disabled
  return (
    <Row label={name} hint={def.hint} changed={changed} className={cn(disabled && 'pointer-events-none opacity-40', className)}
      onReset={() => (stepLabel ? params.setValue(k, dflt, { label: `Reset ${name.toLowerCase()}` }) : params.reset([k]))}>
      <GradientSlider value={v} onChange={set} min={def.soft?.[0] ?? min} max={def.soft?.[1] ?? max} step={step} track={track} label={name} disabled={disabled} />
      <ScrubValue value={v} onChange={set} min={min} max={max} step={step} defaultValue={dflt} changed={changed} label={name} parse={def.parse}
        fmt={fmt} unit={def.unit} className="shrink-0" style={{ width: valueWidth }} />
    </Row>
  )
}
