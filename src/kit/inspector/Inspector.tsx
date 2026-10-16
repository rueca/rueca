/* ---------------------------------------------------------------------------
   Inspector — renders a schema into sections and rows.

     <Inspector params={params} />                          // every folder, schema order
     <Inspector params={params} folders={['look', 'size']} /> // a subset, in THIS order
     <Inspector params={params} published />                 // client view: publish:true only

   Rows are --row lanes (24px by default): label · control · value. The label column fits the longest label. A value that differs from
   its default renders at full contrast and gets a dot; untouched ones are
   faint — the single most useful cue in the panel. Double-click a label to
   reset. Hover a section header for its reset. Alt-click a header to solo it.

   Building a panel by hand? Use <Section>, <Row>, <ParamRow> (one schema row
   bound to a store) and <ParamControl> (just the control) so it matches.
--------------------------------------------------------------------------- */
import { memo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, RotateCcw, Settings2 } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { cn } from '../core/cn'
import { LabelScope, useLabelScope, useReportLabel } from './label-fit'
import { useParamState, type AnyParams } from '../core/params'
import { equal, humanize, isValueDef, layoutFolder, type Folder, type ParamDef, type Schema, type ValueDef, type NumberDef } from '../core/schema'
import { Tip } from '../ui/tooltip'
import { ScrubValue, evaluate } from '../ui/scrub'
import { Slider } from '../ui/slider'
import { DetentSlider, normDetents } from '../ui/detent'
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
  /** a subset of folders, rendered in the order given (a `place: 'settings'` folder renders only when named here) */
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
  const entries = (folders
    ? folders.filter((k) => schema[k]).map((k) => [k, schema[k]])
    : Object.entries(schema).filter(([, f]) => f.place !== 'settings')) as [string, Folder][]
  const lsKey = `studio:${params.id}:sections:${id ?? (folders?.join(',') ?? 'all')}${published ? ':pub' : ''}`

  const [open, setOpen] = useState<Record<string, boolean>>(() => LS.get(lsKey) ?? Object.fromEntries(entries.map(([k, f]) => [k, !f.collapsed])))
  const persist = (next: Record<string, boolean>) => { setOpen(next); LS.set(lsKey, next) }
  const [moreOpen, setMoreOpen] = useState<Record<string, boolean>>(() => LS.get(`${lsKey}:more`) ?? {})
  const toggleMore = (fid: string) => { const next = { ...moreOpen, [fid]: !moreOpen[fid] }; setMoreOpen(next); LS.set(`${lsKey}:more`, next) }

  // the label column fits the longest label on screen (label-fit.tsx): shared with the panel it sits in, or its own
  const Wrap = useLabelScope() ? 'div' : LabelScope

  let shown = 0
  return (
    <Wrap className={cn('flex flex-col', className)}>
      {entries.map(([fid, f]) => {
        if (f.when && !f.when(values)) return null
        const lay = layoutFolder(f, values, defaults, { keys, published, moreOpen: !!moreOpen[fid] })
        if (!lay.rows.length && !lay.toggle && !lay.moreCount) return null
        const isOpen = open[fid] ?? !f.collapsed
        const first = shown++ === 0
        const toggleDef = lay.toggle && (f.params[lay.toggle.key] as ValueDef)
        return (
          <Section
            key={fid}
            title={f.label}
            hint={f.hint}
            open={isOpen}
            first={first}
            changed={lay.changed}
            enabled={lay.toggle?.on}
            onEnabledChange={lay.toggle ? (on) => {
              params.setValue(lay.toggle!.key, on as never, { label: `${on ? 'Turn on' : 'Turn off'} ${f.label.toLowerCase()}` })
              // turning a feature on shows what it just revealed
              if (on && !isOpen) persist({ ...open, [fid]: true })
            } : undefined}
            enabledLabel={toggleDef ? (toggleDef.label ?? f.label) : undefined}
            onToggle={(solo) => persist(solo ? Object.fromEntries(entries.map(([k]) => [k, k === fid])) : { ...open, [fid]: !isOpen })}
            onReset={lay.changed ? () => params.reset(lay.valueKeys) : undefined}
          >
            {lay.rows.map((key) => <LiveRow key={key} k={key} def={f.params[key]} params={params} />)}
            {lay.moreCount > 0 && <MoreRow count={lay.moreCount} open={!!moreOpen[fid]} onClick={() => toggleMore(fid)} />}
          </Section>
        )
      })}
    </Wrap>
  )
}

/** The quiet last row of a section with `more` params: "3 more" / "Fewer". */
export function MoreRow({ count, open, onClick }: { count: number; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="flex h-row items-center gap-1 rounded-control px-pad text-left text-ui text-fg-faint outline-none no-select hover:text-fg focus-visible:text-fg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal"
    >
      <ChevronDown size={12} strokeWidth={1.75} className={cn('shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      {open ? 'Fewer' : `${count} more`}
    </button>
  )
}

/**
 * The toolbar home for view and document preferences: every `place: 'settings'` folder (or the folders you
 * name), in a popover behind one button. The button carries the changed dot when a setting is off its default.
 *   <SettingsMenu params={params} />
 */
export function SettingsMenu({ params, folders, label = 'View settings', icon: Icon = Settings2 }: {
  params: AnyParams; folders?: string[]; label?: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
}) {
  const schema = params.schema as Schema
  const ids = folders ?? Object.keys(schema).filter((k) => schema[k].place === 'settings')
  const changed = useParamState(params, (s) => {
    const v = s.values as Record<string, unknown>, d = s.defaults as Record<string, unknown>
    return ids.some((k) => schema[k] && (!schema[k].when || schema[k].when!(v)) && layoutFolder(schema[k], v, d).changed)
  })
  if (!ids.length) return null
  return (
    <Popover.Root>
      <Tip label={label}>
        <Popover.Trigger
          aria-label={changed ? `${label}, changed from default` : label}
          className="relative flex size-icon items-center justify-center rounded-control text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:bg-hover data-[popup-open]:text-fg"
        >
          <Icon size={14} strokeWidth={1.5} />
          {changed && <span aria-hidden className="absolute top-1 right-1 size-1 rounded-full bg-signal" />}
        </Popover.Trigger>
      </Tip>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-[160]">
          <Popover.Popup aria-label={label} className="pop max-h-[min(70vh,560px)] w-[var(--inspector-w)] overflow-y-auto py-1 outline-none">
            <Inspector params={params} folders={ids} id="settings" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/**
 * A collapsible section. Controlled (`open` + `onToggle`) or uncontrolled
 * (`defaultOpen`, remembered under `persistKey`). `collapsible={false}` drops the chevron.
 */
export function Section({
  title, hint, open: openProp, defaultOpen = true, onToggle, onReset, changed, children, first, actions, collapsible = true, persistKey,
  enabled, onEnabledChange, enabledLabel,
}: {
  title: ReactNode; hint?: string; open?: boolean; defaultOpen?: boolean; onToggle?: (solo: boolean) => void; onReset?: () => void
  changed?: boolean; children: ReactNode; first?: boolean; actions?: ReactNode; collapsible?: boolean; persistKey?: string
  /** an optional feature's on/off switch in the header. Off = the section stays closed (Blender's panel checkbox). */
  enabled?: boolean; onEnabledChange?: (on: boolean) => void; enabledLabel?: string
}) {
  const [own, setOwn] = useState<boolean>(() => (persistKey ? LS.get(`studio:section:${persistKey}`) ?? defaultOpen : defaultOpen))
  const controlled = openProp !== undefined
  const off = enabled === false
  collapsible = collapsible && !off
  const open = !off && (!collapsible || (controlled ? openProp : own))
  const toggle = (solo: boolean) => {
    if (!collapsible) return
    if (onToggle) onToggle(solo)
    if (!controlled) { setOwn(!own); if (persistKey) LS.set(`studio:section:${persistKey}`, !own) }
  }
  return (
    <section className={cn('group/section', !first && 'border-t border-line')}>
      <div data-section-header className="flex h-section items-center gap-1 pr-2 pl-pad">
        <button
          type="button"
          aria-expanded={collapsible ? open : undefined}
          onClick={(e) => toggle(e.altKey)}
          // the ring sits inside the button (inset, with a little room) so the panel's scroller can't clip it
          className={cn('-ml-1 flex h-full min-w-0 flex-1 items-center gap-1 rounded-control pl-1 text-left text-ui font-[550] text-fg outline-none no-select focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal', !collapsible && 'cursor-default', off && 'text-fg-faint')}
        >
          <Tip label={hint} side="left"><span className="truncate">{title}</span></Tip>
          {changed && <><span aria-hidden className="size-1 shrink-0 rounded-full bg-signal" /><span className="sr-only">, changed</span></>}
          {collapsible && <ChevronRight size={12} strokeWidth={1.75} className={cn('ml-0.5 shrink-0 text-fg-faint transition-transform duration-150', open && 'rotate-90')} />}
        </button>
        {actions}
        {onReset && !off && (
          <Tip label="Reset section">
            <button type="button" aria-label={`Reset ${typeof title === 'string' ? title.toLowerCase() : 'section'}`}
              // the button hides once nothing is changed: move focus to the section title first, not <body>
              onClick={(e) => { e.currentTarget.closest('[data-section-header]')?.querySelector('button')?.focus(); onReset() }}
              className="flex size-icon-sm items-center justify-center rounded-control text-fg-faint opacity-0 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal hover:text-fg group-hover/section:opacity-100 focus-visible:opacity-100">
              <RotateCcw size={12} strokeWidth={1.75} />
            </button>
          </Tip>
        )}
        {onEnabledChange && <Switch size="sm" checked={!off} onChange={onEnabledChange} label={`${enabledLabel ?? (typeof title === 'string' ? title : 'Section')}`} />}
      </div>
      {open && <div className="flex flex-col gap-px pb-1">{children}</div>}
    </section>
  )
}

/** One lane. Use directly for hand-built rows that should match schema rows. */
export function Row({
  label, hint, changed, onReset, children, stacked, className, trailing, labelWidth, param,
}: { label?: ReactNode; hint?: string; changed?: boolean; onReset?: () => void; children: ReactNode; stacked?: boolean; className?: string; trailing?: ReactNode; labelWidth?: number
  /** the param key this row edits (data-param): comments anchor to it */
  param?: string }) {
  // hand-built and schema rows alike report their label so the panel's column fits it
  useReportLabel(!stacked && labelWidth == null && (typeof label === 'string' || typeof label === 'number') ? String(label) : null)
  const lab = label != null && label !== '' && (
    <Tip label={hint} side="left">
      <span
        data-row-label
        onDoubleClick={onReset}
        // labels sit a step under their values: read once, while the values are read on every scrub
        className={cn('flex min-w-0 items-center gap-1 truncate text-ui font-[450] no-select', changed ? 'text-fg' : 'text-fg-faint', stacked ? 'h-control' : 'w-[min(max(var(--d-label),var(--label-fit,0px)),42%)] shrink-0')}
        style={stacked || labelWidth == null ? undefined : { width: labelWidth }}
      >
        <span className="truncate">{label}</span>
        {/* changed-from-default: a dot as well as brighter text (WCAG 1.4.1, break-it A14) */}
        {changed && <><span aria-hidden className="size-1 shrink-0 rounded-full bg-signal" /><span className="sr-only">, changed from default</span></>}
      </span>
    </Tip>
  )
  if (stacked)
    return (
      <div data-param={param} className={cn('flex flex-col gap-1 px-pad py-1', className)}>
        {(lab || trailing) && <div className="flex items-center justify-between">{lab}{trailing}</div>}
        {children}
      </div>
    )
  return (
    <div data-param={param} className={cn('flex min-h-row items-center gap-2 px-pad', className)}>
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
      <div className="px-pad py-1">
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
  const common = { label, hint: d.hint, changed, onReset: reset, trailing, param: k }

  const control = <ParamControl def={d} value={v} onChange={set} changed={changed} defaultValue={defaults[k]} label={label} />
  const stacked = ['curve', 'spring', 'gradient', 'image', 'multi'].includes(d.type) || (d.type === 'vec2' && d.display !== 'fields') || (d.type === 'text' && d.multiline) || (d.type === 'select' && d.display === 'tiles')

  if (d.type === 'number' && hasDetents(d)) {
    // the track takes the full width (its stop names need it); the typed value sits on the label line
    const step = d.step ?? inferStep(d.min, d.max)
    const stops = normDetents(d.detents!)
    const parse = d.parse ?? ((s: string) => stops.find((x) => x.label?.toLowerCase() === s.trim().toLowerCase())?.value ?? evaluate(s, v as number))
    const scrub = <ScrubValue value={v as number} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={step} unit={d.unit} fmt={d.fmt} parse={parse}
      defaultValue={defaults[k] as number} changed={changed} label={`${label} value`} className="w-[56px] shrink-0" />
    return (
      <div className={cn(disabled && 'pointer-events-none opacity-40')}>
        <Row {...common} stacked trailing={<div className="flex items-center gap-1">{scrub}{trailing}</div>}>{control}</Row>
      </div>
    )
  }

  if (d.type === 'curve') {
    // Collapsed: glyph + numbers; the editor lives in a popover so it never pushes rows around.
    return (
      <Row {...common}>
        <Popover.Root>
          <Popover.Trigger className="flex h-control w-full min-w-0 items-center gap-2 rounded-control bg-control px-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal hover:shadow-[inset_0_0_0_1px_var(--line-strong)] data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]">
            <CurveGlyph value={v as [number, number, number, number]} className="text-fg-muted" />
            <span className={cn('truncate tabular text-ui', changed ? 'text-fg' : 'text-fg-value')}>{(v as number[]).map((n) => +n.toFixed(2)).join(', ')}</span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} className="z-[160]">
              <Popover.Popup aria-label={`${label} editor`} className="pop w-[260px] p-3 outline-none">{control}</Popover.Popup>
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

/** A number def drawn as a detent track: it has stops and no other display asked for. */
const hasDetents = (d: NumberDef) => !!d.detents?.length && (d.display ?? 'slider') === 'slider'

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
      if (hasDetents(d))
        return <DetentSlider value={v} onChange={(n, f) => set(n, f)} stops={d.detents!} snap={d.snap} step={step} label={label} format={show} />
      const scrub = (
        <ScrubValue value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={step} unit={d.unit} fmt={d.fmt} parse={d.parse} soft={d.soft}
          // beside a slider it's the same param, so it needs its own name (two tab stops both called "Rings" was confusing)
          defaultValue={dflt} changed={changed} label={display === 'slider' ? `${label} value` : label} boxed={display !== 'slider'} className={display === 'slider' ? 'w-[56px] shrink-0' : 'flex-1'} />
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
            <Button size="control" variant="default" aria-label="Decrease" onClick={() => set(Math.max(d.min ?? -Infinity, v - step))}>−</Button>
            {scrub}
            <Button size="control" variant="default" aria-label="Increase" onClick={() => set(Math.min(d.max ?? Infinity, v + step))}>+</Button>
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
