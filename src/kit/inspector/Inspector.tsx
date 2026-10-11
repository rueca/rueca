/* ---------------------------------------------------------------------------
   Inspector — renders a schema into sections and rows.

     <Inspector params={params} />                          // every folder, schema order
     <Inspector params={params} folders={['look', 'size']} /> // a subset, in THIS order
     <Inspector params={params} published />                 // client view: publish:true only

   Rows are 28px lanes: label · control · value. A value that differs from
   its default renders at full contrast and gets a dot; untouched ones are
   faint — the single most useful cue in the panel. Double-click a label to
   reset. Hover a section header for its reset. Alt-click a header to solo it.

   Building a panel by hand? Use <Section>, <Row>, <ParamRow> (one schema row
   bound to a store) and <ParamControl> (just the control) so it matches.
--------------------------------------------------------------------------- */
import { memo, useState, type ReactNode } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { cn } from '../core/cn'
import { useParamState, type AnyParams } from '../core/params'
import { equal, humanize, isValueDef, type Folder, type ParamDef, type Schema, type ValueDef, type NumberDef } from '../core/schema'
import { Tip } from '../ui/tooltip'
import { ScrubValue } from '../ui/scrub'
import { Slider } from '../ui/slider'
import { Knob } from '../ui/knob'
import { Segmented, Select, Switch, Checkbox, TextInput, Tiles, normOptions } from '../ui/controls'
import { ColorField } from '../ui/color'
import { AngleDial, XYPad, Vec3Fields, SizeFields, SeedField, CurveEditor, CurveGlyph, SpringEditor, GradientEditor, PaletteField, ImageDrop, Monitor } from '../ui/special'
import { Button } from '../ui/button'

const LS = {
  get: (k: string) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null } catch { return null } },
  set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* noop */ } },
}

export function Inspector({ params, folders, keys, published, className, id }: {
  params: AnyParams
  /** a subset of folders, rendered in the order given */
  folders?: string[]
  /** only these param keys (sections without any are skipped) */
  keys?: string[]
  /** only params marked `publish: true` — the client / present view */
  published?: boolean
  className?: string
  /** distinguishes several inspectors on one store when remembering open sections */
  id?: string
}) {
  const values = useParamState(params, (s) => s.values) as Record<string, unknown>
  const defaults = params.getState().defaults as Record<string, unknown>
  const schema = params.schema as Schema
  if ((import.meta as any).env?.DEV && folders) for (const f of folders) if (!schema[f])
    console.warn(`[studio] <Inspector folders>: "${f}" isn't a folder id in ${params.id} (ids: ${Object.keys(schema).join(', ')}). Folder ids are the schema keys, not their labels.`)
  const entries = (folders ? folders.filter((k) => schema[k]).map((k) => [k, schema[k]]) : Object.entries(schema)) as [string, Folder][]
  const lsKey = `studio:${params.id}:sections:${id ?? (folders?.join(',') ?? 'all')}${published ? ':pub' : ''}`

  const [open, setOpen] = useState<Record<string, boolean>>(() => LS.get(lsKey) ?? Object.fromEntries(entries.map(([k, f]) => [k, !f.collapsed])))
  const persist = (next: Record<string, boolean>) => { setOpen(next); LS.set(lsKey, next) }

  let shown = 0
  return (
    <div className={cn('flex flex-col', className)}>
      {entries.map(([fid, f]) => {
        if (f.when && !f.when(values)) return null
        const rows = Object.entries(f.params).filter(([k, d]) => d.type !== 'data' && (!keys || keys.includes(k)) && (!published || ('publish' in d && d.publish)))
        if (!rows.length) return null
        const valueKeys = rows.filter(([, d]) => isValueDef(d)).map(([k]) => k)
        const changed = valueKeys.some((k) => !equal(values[k], defaults[k]))
        const isOpen = open[fid] ?? !f.collapsed
        const first = shown++ === 0
        return (
          <Section
            key={fid}
            title={f.label}
            hint={f.hint}
            open={isOpen}
            first={first}
            changed={changed}
            onToggle={(solo) => persist(solo ? Object.fromEntries(entries.map(([k]) => [k, k === fid])) : { ...open, [fid]: !isOpen })}
            onReset={changed ? () => params.reset(valueKeys) : undefined}
          >
            {rows.map(([key, def]) => <LiveRow key={key} k={key} def={def} params={params} />)}
          </Section>
        )
      })}
    </div>
  )
}

/**
 * A collapsible section. Controlled (`open` + `onToggle`) or uncontrolled
 * (`defaultOpen`, remembered under `persistKey`). `collapsible={false}` drops the chevron.
 */
export function Section({
  title, hint, open: openProp, defaultOpen = true, onToggle, onReset, changed, children, first, actions, collapsible = true, persistKey,
}: {
  title: ReactNode; hint?: string; open?: boolean; defaultOpen?: boolean; onToggle?: (solo: boolean) => void; onReset?: () => void
  changed?: boolean; children: ReactNode; first?: boolean; actions?: ReactNode; collapsible?: boolean; persistKey?: string
}) {
  const [own, setOwn] = useState<boolean>(() => (persistKey ? LS.get(`studio:section:${persistKey}`) ?? defaultOpen : defaultOpen))
  const controlled = openProp !== undefined
  const open = !collapsible || (controlled ? openProp : own)
  const toggle = (solo: boolean) => {
    if (!collapsible) return
    if (onToggle) onToggle(solo)
    if (!controlled) { setOwn(!own); if (persistKey) LS.set(`studio:section:${persistKey}`, !own) }
  }
  return (
    <section className={cn('group/section', !first && 'border-t border-line')}>
      <div className="flex h-8 items-center gap-1 pr-2 pl-3">
        <button
          type="button"
          aria-expanded={collapsible ? open : undefined}
          onClick={(e) => toggle(e.altKey)}
          className={cn('flex h-full min-w-0 flex-1 items-center gap-1 text-left text-[11.5px] font-medium text-fg outline-none no-select rounded-[4px] focus-visible:text-signal-text focus-visible:ring-2 focus-visible:ring-signal', !collapsible && 'cursor-default')}
        >
          <Tip label={hint} side="left"><span className="truncate">{title}</span></Tip>
          {changed && <span className="size-1 shrink-0 rounded-full bg-signal" aria-label="changed" />}
          {collapsible && <ChevronRight size={12} strokeWidth={1.75} className={cn('ml-0.5 shrink-0 text-fg-faint transition-transform duration-150', open && 'rotate-90')} />}
        </button>
        {actions}
        {onReset && (
          <Tip label="Reset section">
            <button type="button" aria-label={`Reset ${typeof title === 'string' ? title.toLowerCase() : 'section'}`} onClick={onReset}
              className="flex size-6 items-center justify-center rounded-[5px] text-fg-faint opacity-0 outline-none hover:bg-hover hover:text-fg group-hover/section:opacity-100 focus-visible:opacity-100">
              <RotateCcw size={12} strokeWidth={1.75} />
            </button>
          </Tip>
        )}
      </div>
      {open && <div className="flex flex-col gap-px pb-2.5">{children}</div>}
    </section>
  )
}

/** One lane. Use directly for hand-built rows that should match schema rows. */
export function Row({
  label, hint, changed, onReset, children, stacked, className, trailing, labelWidth = 84,
}: { label?: ReactNode; hint?: string; changed?: boolean; onReset?: () => void; children: ReactNode; stacked?: boolean; className?: string; trailing?: ReactNode; labelWidth?: number }) {
  const lab = label != null && (
    <Tip label={hint} side="left">
      <span
        data-row-label
        onDoubleClick={onReset}
        className={cn('flex min-w-0 items-center gap-1 truncate text-[11.5px] no-select', changed ? 'text-fg' : 'text-fg-muted', stacked ? 'h-6' : 'shrink-0')}
        style={stacked ? undefined : { width: labelWidth }}
      >
        <span className="truncate">{label}</span>
        {/* changed-from-default: a dot as well as brighter text (WCAG 1.4.1, break-it A14) */}
        {changed && <><span aria-hidden className="size-1 shrink-0 rounded-full bg-signal" /><span className="sr-only">, changed from default</span></>}
      </span>
    </Tip>
  )
  if (stacked)
    return (
      <div className={cn('flex flex-col gap-1 px-3 py-1', className)}>
        <div className="flex items-center justify-between">{lab}{trailing}</div>
        {children}
      </div>
    )
  return (
    <div className={cn('flex min-h-[var(--row)] items-center gap-2 px-3', className)}>
      {lab}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
      {trailing}
    </div>
  )
}

/** A schema row bound to a params store — what <Inspector> renders per param. */
/* The Inspector's own rows: each subscribes to ITS value (plus booleans for `when` / `disabled`), so a drag
   re-renders one row, not all of them — 150 open rows cost 15 ms per move before (break-it B3-S2). */
const LiveRow = memo(function LiveRow({ k, def, params }: { k: string; def: ParamDef; params: AnyParams }) {
  const v = useParamState(params, (s) => (s.values as Record<string, unknown>)[k])
  const shown = useParamState(params, (s) => !def.when || def.when(s.values as Record<string, unknown>))
  const off = useParamState(params, (s) => isValueDef(def) && typeof def.disabled === 'function' ? def.disabled(s.values as Record<string, unknown>) : false)
  if (!shown) return null
  return <ParamRow k={k} def={def} params={params} single={{ v, off }} />
})

export function ParamRow({ k, def, params, values: valuesProp, defaults: defaultsProp, trailing, single }: { k: string; def?: ParamDef; params: AnyParams; values?: Record<string, unknown>; defaults?: Record<string, unknown>; trailing?: ReactNode; /** @internal LiveRow's own subscription */ single?: { v: unknown; off: boolean } }) {
  const liveValues = useParamState(params, (s) => (valuesProp || single ? null : s.values)) as Record<string, unknown> | null
  // with `single`, the rest of the values are read only when needed (action clicks), never subscribed to
  const values = valuesProp ?? liveValues ?? (params.getState().values as Record<string, unknown>)
  const defaults = defaultsProp ?? (params.getState().defaults as Record<string, unknown>)
  def = def ?? params.defs[k]
  if (!def || def.type === 'data') return null
  if (!single && def.when && !def.when(values)) return null
  const label = ('label' in def && def.label) || humanize(k)

  if (def.type === 'action')
    return (
      <div className="px-3 py-1">
        <Button variant={def.variant === 'primary' ? 'primary' : 'default'} size="md" className="w-full" onClick={() => def.onClick(single ? params.getState().values : values)}>
          {def.icon && <def.icon size={14} strokeWidth={1.5} />}
          {def.label}
        </Button>
      </div>
    )
  if (def.type === 'monitor')
    return <Row label={label} hint={def.hint}><Monitor get={def.get} graph={def.graph} min={def.min} max={def.max} fmt={def.fmt} /></Row>

  const d = def as ValueDef
  const v = single ? single.v : values[k]
  const changed = !equal(v, defaults[k])
  const set = (nv: unknown, final = true) => params.setValue(k, nv as never, { commit: final })
  const reset = () => params.reset([k])
  const disabled = single ? (typeof d.disabled === 'function' ? single.off : d.disabled) : typeof d.disabled === 'function' ? d.disabled(values) : d.disabled
  const common = { label, hint: d.hint, changed, onReset: reset, trailing }

  const control = <ParamControl def={d} value={v} onChange={set} changed={changed} defaultValue={defaults[k]} label={label} />
  const stacked = ['curve', 'spring', 'gradient', 'image', 'multi'].includes(d.type) || (d.type === 'vec2' && d.display !== 'fields') || (d.type === 'text' && d.multiline) || (d.type === 'select' && d.display === 'tiles')

  if (d.type === 'curve') {
    // Collapsed: glyph + numbers; the editor lives in a popover so it never pushes rows around.
    return (
      <Row {...common}>
        <Popover.Root>
          <Popover.Trigger className="flex h-6 w-full min-w-0 items-center gap-2 rounded-[5px] bg-control px-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal hover:shadow-[inset_0_0_0_1px_var(--line-strong)] data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]">
            <CurveGlyph value={v as [number, number, number, number]} className="text-signal" />
            <span className={cn('truncate tabular text-[11px]', changed ? 'text-fg' : 'text-fg-faint')}>{(v as number[]).map((n) => n.toFixed(2)).join(', ')}</span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} className="z-[160]">
              <Popover.Popup className="pop w-[260px] p-3 outline-none">{control}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Row>
    )
  }

  return (
    <div className={cn(disabled && 'pointer-events-none opacity-40')}>
      <Row {...common} stacked={stacked}>{control}</Row>
    </div>
  )
}

/** Segmented if it will fit: ≤4 options whose labels total ≲20 characters (~180px at 11.5px). */
export function fitsSegmented(options: ReturnType<typeof normOptions>) {
  if (options.length > 4) return false
  if (options.every((o) => o.icon)) return true
  const chars = options.reduce((n, o) => n + (o.label ?? o.value).length, 0)
  return chars + options.length * 2 <= 22
}

/** Step when a def doesn't say: integers for wide ranges, ~1/100 of a narrow one (0..1 → 0.01). */
export function inferStep(min?: number, max?: number) {
  if (min === undefined || max === undefined) return 1
  const r = Math.abs(max - min)
  if (r >= 100) return 1
  const raw = r / 100, p = Math.pow(10, Math.floor(Math.log10(raw)))
  return [1, 2, 5, 10].map((m) => m * p).find((x) => x >= raw * 0.999) ?? p
}

/** Log taper helpers for sliders on frequencies, sizes, time constants. */
const toLog = (v: number, min: number, max: number) => Math.log(v / min) / Math.log(max / min)
const fromLog = (t: number, min: number, max: number) => min * Math.pow(max / min, t)

/** Just the control for one def — for hand-built rows. */
export function ParamControl({ def: d, value: v, onChange: set, changed, defaultValue: dflt, label }: { def: ValueDef; value: any; onChange: (v: unknown, final?: boolean) => void; changed?: boolean; defaultValue?: any; label?: string }): ReactNode {
  switch (d.type) {
    case 'number': {
      const step = d.step ?? inferStep(d.min, d.max)
      const show = (n: number) => (d.fmt ? d.fmt(n) : `${n}${d.unit ?? ''}`)
      const hasRange = d.min !== undefined && d.max !== undefined
      const display = d.display ?? (hasRange ? 'slider' : 'field')
      const scrub = (
        <ScrubValue value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={step} unit={d.unit} fmt={d.fmt} parse={d.parse} soft={d.soft}
          defaultValue={dflt} changed={changed} label={label} boxed={display !== 'slider'} className={display === 'slider' ? 'w-[56px] shrink-0' : 'flex-1'} />
      )
      if (display === 'knob')
        return <div className="flex flex-1 justify-end"><Knob value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step} defaultValue={dflt} label={label ?? ''} hideLabel fmt={d.fmt} unit={d.unit} taper={d.scale === 'log' ? 'log' : 'linear'} bipolar={(d.min ?? 0) < 0 && (d.max ?? 0) > 0} size="sm" changed={changed} /></div>
      if (display === 'slider') {
        const log = d.scale === 'log' && (d.min ?? 0) > 0
        const lo = d.soft?.[0] ?? d.min!, hi = d.soft?.[1] ?? d.max!
        const origin = lo < 0 && hi > 0 ? 0 : undefined
        return (
          <>
            {log ? (
              <Slider value={toLog(Math.max(lo, v), lo, hi)} min={0} max={1} step={0.001} label={label}
                onChange={(t, f) => set(Number(fromLog(t, lo, hi).toPrecision(4)), f)} />
            ) : (
              <Slider value={Math.min(hi, Math.max(lo, v))} onChange={(n, f) => set(n, f)} min={lo} max={hi} step={step} label={label} origin={origin} track={d.track} format={show} />
            )}
            {scrub}
          </>
        )
      }
      if (display === 'stepper')
        return (
          <div className="flex w-full items-center gap-1">
            <Button size="icon-sm" variant="default" aria-label="Decrease" onClick={() => set(Math.max(d.min ?? -Infinity, v - step))}>−</Button>
            {scrub}
            <Button size="icon-sm" variant="default" aria-label="Increase" onClick={() => set(Math.min(d.max ?? Infinity, v + step))}>+</Button>
          </div>
        )
      return scrub
    }
    case 'range':
      return (
        <>
          <ScrubValue value={v[0]} onChange={(n, f) => set([Math.min(n, v[1]), v[1]], f)} min={d.min} max={d.max} step={d.step} fmt={d.fmt} unit={d.unit} changed={changed} className="w-[52px] shrink-0" />
          <Slider value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step ?? 1} />
          <ScrubValue value={v[1]} onChange={(n, f) => set([v[0], Math.max(n, v[0])], f)} min={d.min} max={d.max} step={d.step} fmt={d.fmt} unit={d.unit} changed={changed} className="w-[52px] shrink-0" />
        </>
      )
    case 'angle': return <AngleDial value={v} onChange={(n, f) => set(n, f)} changed={changed} />
    case 'vec2': return <XYPad value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step} labels={d.labels} changed={changed} pad={d.display !== 'fields'} />
    case 'vec3': return <Vec3Fields value={v} onChange={(n, f) => set(n, f)} step={d.step} min={d.min} max={d.max} changed={changed} />
    case 'size': return <SizeFields value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} unit={d.unit} lockDefault={d.lock} changed={changed} />
    case 'color': return <ColorField value={v} onChange={(c, f) => set(c, f)} alpha={d.alpha !== false} changed={changed} />
    case 'palette': return <PaletteField value={v} onChange={(c, f) => set(c, f)} max={d.max} />
    case 'gradient': return <GradientEditor value={v} onChange={(g, f) => set(g, f)} />
    case 'select': {
      const opts = normOptions(d.options)
      const display = d.display ?? (fitsSegmented(opts) ? 'segmented' : 'dropdown')
      if (display === 'segmented') return <Segmented value={v} onChange={(s) => set(s)} options={opts} iconOnly={opts.every((o) => o.icon)} label={label} />
      if (display === 'tiles' || display === 'swatches') return <Tiles value={[v]} onChange={(s) => s[0] && set(s[0])} options={opts} columns={balancedColumns(opts.length)} />
      return <Select value={v} onChange={(s) => set(s)} options={opts} label={label} />
    }
    case 'multi': return <Tiles multiple value={v} onChange={(s) => (s.length >= (d.min ?? 0)) && set(s)} options={d.options} columns={balancedColumns(d.options.length)} />
    case 'boolean':
      return d.display === 'checkbox'
        ? <Checkbox checked={v} onChange={(b) => set(b)} label={label} />
        : <div className="flex flex-1 justify-end"><Switch checked={v} onChange={(b) => set(b)} label={label} /></div>
    case 'text': return <TextInput value={v} onChange={(s) => set(s, false)} onCommit={(s) => set(s, true)} placeholder={d.placeholder} multiline={d.multiline} mono={d.mono} maxLength={d.maxLength} label={label} />
    case 'seed': return <SeedField value={v} onChange={(n, f) => set(n, f)} changed={changed} label={label} />
    case 'curve': return <CurveEditor value={v} onChange={(c, f) => set(c, f)} presets={d.presets} />
    case 'spring': return <SpringEditor value={v} onChange={(s, f) => set(s, f)} />
    case 'image': return <ImageDrop value={v} onChange={(s, f) => set(s, f)} accept={d.accept} />
    case 'data': return null
  }
}

/** 7 options → 4 + 3, not 6 + 1. */
export function balancedColumns(n: number, max = 6) {
  const rows = Math.ceil(n / max)
  return Math.ceil(n / rows)
}

export type { NumberDef }
