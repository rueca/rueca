import { Slider as Base } from '@base-ui/react/slider'
import { cn } from '../core/cn'

/* Slider. The rail is a TRACK (lighter than the panel in dark — there is no
   luminance room below it). The thumb hides until hover so a column of
   twenty reads as data, not noise. Accent only on the filled portion. */
export function Slider({
  value, onChange, min = 0, max = 1, step = 0.01, className, label, disabled, origin, track, format,
}: {
  value: number | [number, number]
  onChange: (v: any, final: boolean) => void
  min?: number; max?: number; step?: number
  className?: string; label?: string; disabled?: boolean
  /** fill from this value instead of min — e.g. 0 for a −1…1 bias */
  origin?: number
  /** a painted track (CSS gradient) instead of the groove + fill — the thumb stays visible */
  track?: string
  /** announce the value the way the UI shows it ("1.45s", "100%") */
  format?: (v: number) => string
}) {
  const range = Array.isArray(value)
  const fillFrom = !range && origin !== undefined ? ((origin - min) / (max - min)) * 100 : null
  const at = !range ? ((value - min) / (max - min)) * 100 : 0
  return (
    <Base.Root
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(v) => onChange(v, false)}
      onValueCommitted={(v) => onChange(v, true)}
      className={cn('group/slider relative flex h-control w-full min-w-0 items-center no-select data-[disabled]:opacity-40', className)}
    >
      <Base.Control data-studio-slider-control className="flex h-control w-full cursor-default touch-pan-y items-center">
        <Base.Track className={cn('relative w-full rounded-full', track ? 'h-[5px] shadow-[inset_0_0_0_0.5px_var(--line-strong)]' : 'h-[2px] bg-track shadow-[0_0_0_0.5px_var(--line-strong)]')} style={track ? { background: track } : undefined}>
          {track ? null : fillFrom === null ? (
            <Base.Indicator className="rounded-full bg-fill" />
          ) : (
            <div
              className="absolute inset-y-0 rounded-full bg-fill"
              style={{ left: `${Math.min(fillFrom, at)}%`, width: `${Math.abs(at - fillFrom)}%` }}
            />
          )}
          {(range ? [0, 1] : [0]).map((i) => (
            <Base.Thumb
              key={i}
              data-studio-thumb
              index={range ? i : undefined}
              aria-label={label}
              getAriaValueText={format ? (_f: string, v: number) => format(v) : undefined}
              className={cn(
                'size-3 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.4)] outline-none',
                // thumb rests small and quiet (always findable, WCAG 1.4.11), grows on hover/focus/drag
                track ? '' : 'scale-[0.6] transition-transform duration-100 group-hover/slider:scale-100',
                'focus-visible:scale-100 focus-visible:ring-2 focus-visible:ring-signal data-[dragging]:scale-100',
              )}
            />
          ))}
        </Base.Track>
      </Base.Control>
    </Base.Root>
  )
}
