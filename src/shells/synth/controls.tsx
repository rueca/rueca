/* Schema-bound wrappers: a knob or segmented control that reads its range,
   label, format and hint from the param definition — the same table the kit
   Inspector uses, just laid out as an instrument panel. */
import { Segmented, humanize, useValues, type NumberDef, type SelectDef } from '@kit'
import { params } from './params'
import { Knob } from '@kit'

/** Params whose perceptual scale is exponential. (The kit's NumberDef has no taper field yet.) */
const LOG = new Set(['cutoff', 'delayTone', 'attack', 'decay', 'release', 'kickDecay', 'snareDecay', 'hatDecay', 'glide'])

export function PKnob({ k, size = 'md', hideLabel, label, bipolar }: { k: string; size?: 'sm' | 'md' | 'lg'; hideLabel?: boolean; label?: string; bipolar?: boolean }) {
  const value = useValues(params, (v) => (v as Record<string, unknown>)[k]) as number
  const def = params.defs[k] as NumberDef
  const dflt = (params.getState().defaults as Record<string, unknown>)[k] as number
  return (
    <Knob
      value={value}
      min={def.min}
      max={def.max}
      step={def.step}
      defaultValue={dflt}
      label={label ?? def.label ?? humanize(k)}
      hint={def.hint}
      fmt={def.fmt}
      parse={def.parse}
      unit={def.unit}
      taper={LOG.has(k) && (def.min ?? 0) > 0 ? 'log' : 'linear'}
      bipolar={bipolar}
      size={size}
      hideLabel={hideLabel}
      changed={value !== dflt}
      onChange={(n, final) => params.setValue(k as never, n as never, { commit: final })}
    />
  )
}

export function PSegmented({ k, size = 'md' }: { k: string; size?: 'sm' | 'md' }) {
  const value = useValues(params, (v) => (v as Record<string, unknown>)[k]) as string
  const def = params.defs[k] as SelectDef
  const opts = def.options.map((o) => (typeof o === 'string' ? { value: o } : o))
  return <Segmented size={size} value={value} onChange={(s) => params.setValue(k as never, s as never)} options={opts} iconOnly={opts.every((o) => o.icon)} label={def.label ?? humanize(k)} />
}

export const sectionChanged = (keys: string[]) => keys.some((k) => params.isChanged(k as never))
