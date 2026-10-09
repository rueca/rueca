/* ---------------------------------------------------------------------------
   OverrideRows — inspector rows for a value layer that sits ON TOP of a
   params store: per-size overrides of a template, per-instance overrides of
   a component, per-locale tweaks of a layout.

     <OverrideRows params={template} keys={['headlineScale', 'align']}
       overrides={sizeOverrides}                   // Partial<values>
       onChange={(key, v, final) => …} onReset={(key) => …} />

   Each row shows the EFFECTIVE value (override ?? template). An overridden
   row gets an accent edge, full-contrast label and a reset button; the
   tooltip always says what the template value is, so you can tell "same as
   template" from "overridden to the same value". Controls come from the
   schema defs (number → slider + scrub, select → segmented/dropdown,
   boolean → switch), so the rows match schema rows exactly.
--------------------------------------------------------------------------- */
import { RotateCcw } from 'lucide-react'
import {
  cn, Row, Slider, ScrubValue, Segmented, Select, Switch, Tip, humanize, normOptions, useValues,
  type AnyParams, type NumberDef, type SelectDef,
} from '@kit'

const fmtValue = (def: any, v: unknown) => {
  if (def?.type === 'number') return def.fmt ? def.fmt(v) : `${v}${def.unit ?? ''}`
  if (def?.type === 'boolean') return v ? 'on' : 'off'
  if (def?.type === 'select') { const o = normOptions(def.options).find((x) => x.value === v); return o?.label ?? String(v) }
  return String(v)
}

export function OverrideRows({
  params, keys, overrides, onChange, onReset, disabled,
}: {
  params: AnyParams
  keys: string[]
  overrides: Record<string, unknown>
  onChange: (key: string, value: unknown, final: boolean) => void
  onReset: (key: string) => void
  disabled?: boolean
}) {
  const base = useValues(params) as Record<string, unknown>
  return (
    <div className={cn('flex flex-col gap-px', disabled && 'pointer-events-none opacity-40')}>
      {keys.map((k) => {
        const def = params.defs[k] as any
        if (!def) return null
        const over = k in overrides
        const v = over ? overrides[k] : base[k]
        const label = def.label ?? humanize(k)
        const hint = `${def.hint ? `${def.hint} ` : ''}Template: ${fmtValue(def, base[k])}.`
        const set = (nv: unknown, final = true) => onChange(k, nv, final)
        let control: React.ReactNode = null
        if (def.type === 'number') {
          const d = def as NumberDef
          control = (
            <>
              <Slider value={v as number} min={d.min} max={d.max} step={d.step ?? 1} label={label} onChange={(n, f) => set(n, f)} />
              <ScrubValue value={v as number} min={d.min} max={d.max} step={d.step ?? 1} unit={d.unit} fmt={d.fmt} label={label}
                defaultValue={base[k] as number} changed={over} className="w-[52px] shrink-0" onChange={(n, f) => set(n, f)} />
            </>
          )
        } else if (def.type === 'select') {
          const d = def as SelectDef
          const opts = normOptions(d.options)
          control = opts.length <= 3
            ? <Segmented value={v as string} options={opts} label={label} iconOnly={opts.every((o) => o.icon)} onChange={(s) => set(s)} />
            : <Select value={v as string} options={opts} label={label} onChange={(s) => set(s)} />
        } else if (def.type === 'boolean') {
          control = <div className="flex flex-1 justify-end"><Switch checked={!!v} label={label} onChange={(b) => set(b)} /></div>
        }
        return (
          <div key={k} className="relative">
            {over && <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-signal" aria-hidden />}
            <Row
              label={label}
              hint={hint}
              changed={over}
              onReset={() => onReset(k)}
              trailing={
                <Tip label={over ? 'Revert to template' : undefined}>
                  <button type="button" aria-label={`Revert ${label} to template`} disabled={!over} onClick={() => onReset(k)}
                    className={cn('flex size-5 shrink-0 items-center justify-center rounded-[4px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal',
                      !over && 'invisible')}>
                    <RotateCcw size={11} strokeWidth={1.75} />
                  </button>
                </Tip>
              }
            >
              {control}
            </Row>
          </div>
        )
      })}
    </div>
  )
}
