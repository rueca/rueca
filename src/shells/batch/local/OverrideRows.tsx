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
   schema defs through the kit's ParamControl, so the rows match schema rows
   exactly (sliders, segmented / dropdown by fit, switches, colours…).
--------------------------------------------------------------------------- */
import { RotateCcw } from 'lucide-react'
import { cn, Row, ParamControl, Tip, humanize, normOptions, useValues, type AnyParams, type ValueDef } from '@kit'

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
        const def = params.defs[k] as ValueDef | undefined
        if (!def || def.type === 'data') return null
        const over = k in overrides
        const v = over ? overrides[k] : base[k]
        const label = ('label' in def && def.label) || humanize(k)
        const hint = `${def.hint ? `${def.hint} ` : ''}Template: ${fmtValue(def, base[k])}.`
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
                    className={cn('flex size-5 shrink-0 items-center justify-center rounded-[4px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal',
                      !over && 'invisible')}>
                    <RotateCcw size={11} strokeWidth={1.75} />
                  </button>
                </Tip>
              }
            >
              {/* the same control a schema row renders, bound to the override layer */}
              <ParamControl def={def} value={v} label={label} changed={over} defaultValue={base[k]} onChange={(nv, final = true) => onChange(k, nv, final)} />
            </Row>
          </div>
        )
      })}
    </div>
  )
}
