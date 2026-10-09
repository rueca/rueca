/* ---------------------------------------------------------------------------
   Inspector — renders a schema into sections and rows.

     <Inspector params={params} />                    // every folder
     <Inspector params={params} folders={['look']} /> // a subset, e.g. split across tabs

   Rows are 28px lanes: label · control · value. A value that differs from
   its default renders at full contrast and gets a dot; untouched ones are
   faint — the single most useful cue in the panel. Double-click a label to
   reset. Hover a section header for its reset. Alt-click a header to solo it.
--------------------------------------------------------------------------- */
import { useState, type ReactNode } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { cn } from '../core/cn'
import { useParamState, type AnyParams } from '../core/params'
import { equal, humanize, isValueDef, type Folder, type ParamDef, type Schema, type ValueDef } from '../core/schema'
import { Tip } from '../ui/tooltip'
import { ScrubValue } from '../ui/scrub'
import { Slider } from '../ui/slider'
import { Segmented, Select, Switch, Checkbox, TextInput, Tiles, normOptions } from '../ui/controls'
import { ColorField } from '../ui/color'
import { AngleDial, XYPad, Vec3Fields, SizeFields, SeedField, CurveEditor, CurveGlyph, SpringEditor, GradientEditor, PaletteField, ImageDrop, Monitor } from '../ui/special'
import { Button } from '../ui/button'

const LS_OPEN = (id: string) => `studio:${id}:sections`

export function Inspector({ params, folders, keys, published, className }: {
  params: AnyParams
  folders?: string[]
  /** only these param keys (sections without any are skipped) */
  keys?: string[]
  /** only params marked `publish: true` — the client / present view */
  published?: boolean
  className?: string
}) {
  const values = useParamState(params, (s) => s.values) as Record<string, unknown>
  const defaults = params.getState().defaults as Record<string, unknown>
  const entries = Object.entries(params.schema as Schema).filter(([k]) => !folders || folders.includes(k)) as [string, Folder][]

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem(LS_OPEN(params.id)); if (s) return JSON.parse(s) } catch { /* noop */ }
    return Object.fromEntries(entries.map(([k, f]) => [k, !f.collapsed]))
  })
  const persist = (next: Record<string, boolean>) => { setOpen(next); try { localStorage.setItem(LS_OPEN(params.id), JSON.stringify(next)) } catch { /* noop */ } }

  return (
    <div className={cn('flex flex-col', className)}>
      {entries.map(([id, f], i) => {
        if (f.when && !f.when(values)) return null
        const rows = Object.entries(f.params).filter(([k, d]) => (!keys || keys.includes(k)) && (!published || ('publish' in d && d.publish)))
        if (!rows.length) return null
        const valueKeys = rows.filter(([, d]) => isValueDef(d)).map(([k]) => k)
        const changed = valueKeys.some((k) => !equal(values[k], defaults[k]))
        const isOpen = open[id] ?? !f.collapsed
        return (
          <Section
            key={id}
            title={f.label}
            hint={f.hint}
            open={isOpen}
            first={i === 0}
            changed={changed}
            onToggle={(solo) => persist(solo ? Object.fromEntries(entries.map(([k]) => [k, k === id])) : { ...open, [id]: !isOpen })}
            onReset={changed ? () => params.reset(valueKeys) : undefined}
          >
            {rows.map(([key, def]) => (
              <ParamRow key={key} k={key} def={def} params={params} values={values} defaults={defaults} />
            ))}
          </Section>
        )
      })}
    </div>
  )
}

export function Section({
  title, hint, open = true, onToggle, onReset, changed, children, first, actions,
}: { title: string; hint?: string; open?: boolean; onToggle?: (solo: boolean) => void; onReset?: () => void; changed?: boolean; children: ReactNode; first?: boolean; actions?: ReactNode }) {
  return (
    <section className={cn('group/section', !first && 'border-t border-line')}>
      <div className="flex h-8 items-center gap-1 pr-2 pl-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => onToggle?.(e.altKey)}
          className="flex h-full min-w-0 flex-1 items-center gap-1 text-left text-[11.5px] font-medium text-fg outline-none no-select focus-visible:text-accent"
        >
          <Tip label={hint} side="left"><span className="truncate">{title}</span></Tip>
          {changed && <span className="size-1 shrink-0 rounded-full bg-accent" aria-label="changed" />}
          <ChevronRight size={12} strokeWidth={1.75} className={cn('ml-0.5 shrink-0 text-faint transition-transform duration-150', open && 'rotate-90')} />
        </button>
        {actions}
        {onReset && (
          <Tip label="Reset section">
            <button type="button" aria-label={`Reset ${title}`} onClick={onReset}
              className="flex size-6 items-center justify-center rounded-[5px] text-faint opacity-0 outline-none hover:bg-hover hover:text-fg group-hover/section:opacity-100 focus-visible:opacity-100">
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
  label, hint, changed, onReset, children, stacked, className, trailing,
}: { label?: string; hint?: string; changed?: boolean; onReset?: () => void; children: ReactNode; stacked?: boolean; className?: string; trailing?: ReactNode }) {
  const lab = label && (
    <Tip label={hint} side="left">
      <span
        onDoubleClick={onReset}
        className={cn(
          'flex min-w-0 items-center gap-1 truncate text-[11.5px] no-select',
          changed ? 'text-fg' : 'text-muted',
          stacked ? 'h-6' : 'w-[84px] shrink-0',
        )}
      >
        <span className="truncate">{label}</span>
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

function ParamRow({ k, def, params, values, defaults }: { k: string; def: ParamDef; params: AnyParams; values: Record<string, unknown>; defaults: Record<string, unknown> }) {
  if (def.when && !def.when(values)) return null
  const label = ('label' in def && def.label) || humanize(k)

  if (def.type === 'action')
    return (
      <div className="px-3 py-1">
        <Button variant={def.variant === 'primary' ? 'primary' : 'default'} size="md" className="w-full" onClick={() => def.onClick(values)}>
          {def.icon && <def.icon size={14} strokeWidth={1.5} />}
          {def.label}
        </Button>
      </div>
    )
  if (def.type === 'monitor')
    return <Row label={label} hint={def.hint}><Monitor get={def.get} graph={def.graph} min={def.min} max={def.max} fmt={def.fmt} /></Row>

  const d = def as ValueDef
  const v = values[k]
  const changed = !equal(v, defaults[k])
  const set = (nv: unknown, final = true) => params.setValue(k, nv as never, { commit: final })
  const reset = () => params.reset([k])
  const disabled = typeof d.disabled === 'function' ? d.disabled(values) : d.disabled
  const common = { label, hint: d.hint, changed, onReset: reset }

  const control = renderControl(d, v, set, changed, defaults[k])
  const stacked = ['curve', 'spring', 'gradient', 'image', 'multi'].includes(d.type) || (d.type === 'vec2' && d.display !== 'fields') || (d.type === 'text' && d.multiline) || (d.type === 'select' && d.display === 'tiles')

  if (d.type === 'curve') {
    // Collapsed: glyph + numbers; the editor lives in a popover so it never pushes rows around.
    return (
      <Row {...common}>
        <Popover.Root>
          <Popover.Trigger className="flex h-6 w-full min-w-0 items-center gap-2 rounded-[5px] bg-input px-1.5 text-left outline-none hover:shadow-[inset_0_0_0_1px_var(--line-strong)] data-[popup-open]:shadow-[inset_0_0_0_1px_var(--accent)]">
            <CurveGlyph value={v as [number, number, number, number]} className="text-accent" />
            <span className={cn('truncate tabular text-[11px]', changed ? 'text-fg' : 'text-faint')}>{(v as number[]).map((n) => n.toFixed(2)).join(', ')}</span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} className="z-[100]">
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

function renderControl(d: ValueDef, v: any, set: (v: unknown, final?: boolean) => void, changed: boolean, dflt: any): ReactNode {
  switch (d.type) {
    case 'number': {
      const hasRange = d.min !== undefined && d.max !== undefined
      const display = d.display ?? (hasRange ? 'slider' : 'field')
      const scrub = (
        <ScrubValue value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step ?? 1} unit={d.unit} fmt={d.fmt}
          defaultValue={dflt} changed={changed} label={d.label} boxed={display !== 'slider'} className={display === 'slider' ? 'w-[52px] shrink-0' : 'flex-1'} />
      )
      if (display === 'slider')
        return (
          <>
            <Slider value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step ?? 1} label={d.label} />
            {scrub}
          </>
        )
      if (display === 'stepper')
        return (
          <div className="flex w-full items-center gap-1">
            <Button size="icon-sm" variant="default" aria-label="Decrease" onClick={() => set(Math.max(d.min ?? -Infinity, v - (d.step ?? 1)))}>−</Button>
            {scrub}
            <Button size="icon-sm" variant="default" aria-label="Increase" onClick={() => set(Math.min(d.max ?? Infinity, v + (d.step ?? 1)))}>+</Button>
          </div>
        )
      return scrub
    }
    case 'range':
      return (
        <>
          <ScrubValue value={v[0]} onChange={(n, f) => set([Math.min(n, v[1]), v[1]], f)} min={d.min} max={d.max} step={d.step} fmt={d.fmt} unit={d.unit} changed={changed} className="w-[44px] shrink-0" />
          <Slider value={v} onChange={(n, f) => set(n, f)} min={d.min} max={d.max} step={d.step ?? 1} />
          <ScrubValue value={v[1]} onChange={(n, f) => set([v[0], Math.max(n, v[0])], f)} min={d.min} max={d.max} step={d.step} fmt={d.fmt} unit={d.unit} changed={changed} className="w-[44px] shrink-0" />
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
      const display = d.display ?? (opts.length <= 4 && opts.every((o) => (o.label ?? o.value).length <= 9) ? 'segmented' : 'dropdown')
      if (display === 'segmented') return <Segmented value={v} onChange={(s) => set(s)} options={opts} iconOnly={opts.every((o) => o.icon)} label={d.label} />
      if (display === 'tiles' || display === 'swatches') return <Tiles value={[v]} onChange={(s) => s[0] && set(s[0])} options={opts} columns={Math.min(opts.length, 6)} />
      return <Select value={v} onChange={(s) => set(s)} options={opts} label={d.label} />
    }
    case 'multi': return <Tiles multiple value={v} onChange={(s) => (s.length >= (d.min ?? 0)) && set(s)} options={d.options} columns={Math.min(d.options.length, 6)} />
    case 'boolean':
      return d.display === 'checkbox'
        ? <Checkbox checked={v} onChange={(b) => set(b)} label={d.label} />
        : <div className="flex flex-1 justify-end"><Switch checked={v} onChange={(b) => set(b)} label={d.label} /></div>
    case 'text': return <TextInput value={v} onChange={(s) => set(s, false)} onCommit={() => set(v, true)} placeholder={d.placeholder} multiline={d.multiline} mono={d.mono} maxLength={d.maxLength} label={d.label} />
    case 'seed': return <SeedField value={v} onChange={(n, f) => set(n, f)} changed={changed} />
    case 'curve': return <CurveEditor value={v} onChange={(c, f) => set(c, f)} presets={d.presets} />
    case 'spring': return <SpringEditor value={v} onChange={(s, f) => set(s, f)} />
    case 'image': return <ImageDrop value={v} onChange={(s, f) => set(s, f)} accept={d.accept} />
  }
}
