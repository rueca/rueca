/* ---------------------------------------------------------------------------
   EffectStack — an ordered stack of fills, effects or
   adjustment layers: the list every pro tool converges on (Figma fills +
   effects, Paper fills, Affinity live filters, Rive / Spline post-fx,
   Lightroom-style adjustment layers). One row per item:

     [⌄] icon/thumb/swatch · name (or your row) · blend chip · opacity · eye · remove

     <EffectStack
       items={layers}                         // { id, name, icon?, visible?, opacity?, blend? }
       selected={sel} onSelect={setSel}
       blendOptions={BLENDS}
       onToggle={(id) => …} onOpacity={(id, v, final) => …} onBlend={(id, b) => …}
       onMove={(id, toIndex) => …} onRemove={(id) => …} onDuplicate={…} onRename={…}
     />
     <PanelHeader title="Layers"><StackAddMenu groups={[{ label: 'Fill', items: [{ label: 'Mesh', onClick }] }]} /></PanelHeader>

   Value style (a fills list held as one array): pass `onChange(next, final)`
   instead of the per-action callbacks — eye, opacity, blend, reorder and
   remove then produce the next array for you. `order="bottom-first"` when the
   array is in paint order (Figma's model); the TOP of the stack always
   renders first. `renderRow` replaces the name with your own controls (a
   paint field), `renderDetails` adds a disclosure that expands the row into
   its parameters.

   Behaviour / keyboard (rows use a roving tabindex)
     ↑ / ↓            focus + select the previous / next row   Home / End  first / last
     ⌥↑ / ⌥↓          move the row (the non-drag path, WCAG 2.5.7)
     → / ←            expand / collapse details (with renderDetails)
     Enter / F2       rename                 Delete / ⌫   remove
     drag a row       reorder; an accent insertion line shows the drop point.
                      Drags never start on a control inside the row.
     right-click      Rename · Duplicate · Show/Hide · Move up/down · Remove
   Opacity is a kit ScrubValue (drag, type, arrows); the blend chip is a menu.

   Accessibility: role="grid" of focusable role="row"s with aria-selected (a
   listbox can't hold buttons — axe nested-interactive); one gridcell per row;
   every icon button has an aria-label; hover-revealed controls also show on
   focus-within. Index semantics: `onMove(id, toIndex)` gets the item's new
   index in YOUR `items` array, whatever `order` is.
   (Promoted from shells/shader/local/EffectStack.tsx, merged with
   ui-design/local/StackList.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ContextMenu } from '@base-ui/react/context-menu'
import { ArrowDown, ArrowUp, ChevronRight, Copy, Eye, EyeOff, GripVertical, Minus, PenLine, Plus, Trash2 } from 'lucide-react'
import { cn } from '../core/cn'
import { ScrubValue } from './scrub'
import { Tip } from './tooltip'
import { Menu, type MenuItem } from './controls'
import { IconButton } from './button'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface StackItem {
  id: string
  name?: string
  icon?: Icon
  /** image URL drawn as a 20px thumbnail */
  thumb?: string
  /** CSS colour / gradient drawn as a chip (a fill's paint) */
  swatch?: string
  /** omit for items that cannot be hidden (no eye) */
  visible?: boolean
  /** 0–1; omit for no opacity field */
  opacity?: number
  /** omit for items without a blend mode (a distortion) — `meta` shows instead */
  blend?: string
  /** right-aligned note in the blend slot, e.g. "Distort" */
  meta?: ReactNode
}

export interface StackRowContext<T> {
  /** patch this item (value style); needs `onChange` */
  set: (patch: Partial<T>, final?: boolean) => void
  /** index in `items` */
  index: number
  selected: boolean
}

export interface EffectStackProps<T extends StackItem> {
  items: T[]
  /** how `items` is ordered; the top of the stack always renders first */
  order?: 'top-first' | 'bottom-first'
  selected?: string | null
  onSelect?: (id: string | null) => void
  /** value style: every built-in action produces the next array */
  onChange?: (next: T[], final: boolean) => void
  onToggle?: (id: string) => void
  onOpacity?: (id: string, opacity: number, final: boolean) => void
  onBlend?: (id: string, blend: string) => void
  /** `toIndex` is the item's new index in `items` */
  onMove?: (id: string, toIndex: number) => void
  onRemove?: (id: string) => void
  onDuplicate?: (id: string) => void
  onRename?: (id: string, name: string) => void
  blendOptions?: { value: string; label: string }[]
  /** replaces the name with your own controls */
  renderRow?: (item: T, ctx: StackRowContext<T>) => ReactNode
  /** adds a disclosure; the row expands into this */
  renderDetails?: (item: T, ctx: StackRowContext<T>) => ReactNode
  /** controlled expansion (ids) */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** multi-selection with differing stacks */
  mixed?: boolean
  mixedHint?: ReactNode
  empty?: ReactNode
  /** accessible name of the list */
  label?: string
  /** Figma's minus or a trash can; default trash, revealed on hover */
  removeIcon?: 'trash' | 'minus'
  /** show a grip on hover (default: when renderRow is used) */
  grip?: boolean
  /** right-click menu (default true) */
  contextMenu?: boolean
  rowHeight?: number
  className?: string
}

const INTERACTIVE = 'button,input,textarea,select,a[href],[role="spinbutton"],[role="slider"],[role="switch"],[role="checkbox"],[contenteditable="true"],[data-no-drag]'

export function EffectStack<T extends StackItem>({
  items, order = 'top-first', selected = null, onSelect, onChange, onToggle, onOpacity, onBlend, onMove, onRemove, onDuplicate, onRename,
  blendOptions = [], renderRow, renderDetails, expanded: expandedProp, defaultExpanded = [], onExpandedChange, mixed, mixedHint = 'Mixed. Add one to replace them all',
  empty, label = 'Layers', removeIcon = 'trash', grip, contextMenu = true, rowHeight = 30, className,
}: EffectStackProps<T>) {
  const [drag, setDrag] = useState<{ id: string; to: number } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [ctx, setCtx] = useState<string | null>(null)
  const [ownExpanded, setOwnExpanded] = useState<string[]>(defaultExpanded)
  const expanded = expandedProp ?? ownExpanded
  const setExpanded = (ids: string[]) => { if (!expandedProp) setOwnExpanded(ids); onExpandedChange?.(ids) }
  const rows = useRef<Record<string, HTMLDivElement | null>>({})
  const list = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  const cleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanup.current?.(), [])

  const display = order === 'bottom-first' ? [...items].reverse() : items
  const itemIndex = (displayIndex: number) => (order === 'bottom-first' ? items.length - 1 - displayIndex : displayIndex)
  const dIndexOf = (id: string) => display.findIndex((x) => x.id === id)

  /* --- actions: per-action callbacks win, else the value-style default --- */
  const patch = (id: string, p: Partial<T>, final = true) => onChange?.(items.map((x) => (x.id === id ? { ...x, ...p } : x)), final)
  const toggle = onToggle ?? (onChange ? (id: string) => { const it = items.find((x) => x.id === id); if (it) patch(id, { visible: !it.visible } as Partial<T>) } : undefined)
  const setOpacity = onOpacity ?? (onChange ? (id: string, v: number, final: boolean) => patch(id, { opacity: v } as Partial<T>, final) : undefined)
  const setBlend = onBlend ?? (onChange ? (id: string, b: string) => patch(id, { blend: b } as Partial<T>) : undefined)
  const remove = onRemove ?? (onChange ? (id: string) => onChange(items.filter((x) => x.id !== id), true) : undefined)
  const rename = onRename ?? (onChange ? (id: string, name: string) => patch(id, { name } as Partial<T>) : undefined)
  const moveTo = (id: string, displayTo: number) => {
    const to = itemIndex(Math.max(0, Math.min(display.length - 1, displayTo)))
    const from = items.findIndex((x) => x.id === id)
    if (from < 0 || from === to) return
    if (onMove) return onMove(id, to)
    if (!onChange) return
    const next = items.filter((x) => x.id !== id)
    next.splice(to, 0, items[from])
    onChange(next, true)
  }
  const canMove = !!(onMove || onChange)

  const focusRow = (id?: string) => id && requestAnimationFrame(() => rows.current[id]?.focus())
  const rowCtx = (it: T): StackRowContext<T> => ({ set: (p, final = true) => patch(it.id, p, final), index: items.indexOf(it), selected: selected === it.id })

  /* --- pointer drag (works with controls inside rows, unlike HTML5 DnD) --- */
  const startDrag = (e: React.PointerEvent, id: string, fromGrip = false) => {
    if (e.button !== 0 || !canMove || editing === id) return
    if (!fromGrip && (e.target as HTMLElement).closest(INTERACTIVE)) return
    const y0 = e.clientY
    let active = false
    let to = dIndexOf(id)
    const gapAt = (y: number) => {
      const els = display.map((x) => rows.current[x.id]).filter(Boolean) as HTMLElement[]
      for (let i = 0; i < els.length; i++) { const r = els[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i }
      return els.length
    }
    const move = (ev: PointerEvent) => {
      if (!active && Math.abs(ev.clientY - y0) < 4) return
      active = true
      to = gapAt(ev.clientY)
      setDrag({ id, to })
    }
    const end = (commit: boolean) => {
      cleanup.current?.()
      if (!active) return
      suppressClick.current = true
      setTimeout(() => { suppressClick.current = false }, 0)
      setDrag(null)
      const from = dIndexOf(id)
      if (commit && to !== from && to !== from + 1) { moveTo(id, to > from ? to - 1 : to); focusRow(id) }
    }
    const up = () => end(true)
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.preventDefault(); end(false) } }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('keydown', key, true)
    cleanup.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', key, true)
      cleanup.current = null
    }
  }

  if (mixed) return <div className={cn('px-3 py-1.5 text-[11.5px] text-fg-faint', className)}>{mixedHint}</div>
  if (!items.length) return <>{empty}</>

  const showGrip = grip ?? !!renderRow
  const ctxItem = ctx ? items.find((x) => x.id === ctx) : undefined
  const noop = drag ? (() => { const f = dIndexOf(drag.id); return drag.to === f || drag.to === f + 1 })() : true

  const listEl = (
    <div ref={list} role="grid" aria-label={label} className={cn('flex flex-col py-1', className)}>
      {display.map((it, i) => {
        const sel = selected === it.id
        const Icon = it.icon
        const open = !!renderDetails && expanded.includes(it.id)
        const name = it.name ?? ''
        const blendLabel = it.blend !== undefined ? blendOptions.find((b) => b.value === it.blend)?.label ?? it.blend : undefined
        const hidden = it.visible === false
        const c = rowCtx(it)
        const tabbable = sel || (!display.some((x) => x.id === selected) && i === 0)
        return (
          <div key={it.id} role="presentation" className="relative">
            {drag && !noop && drag.to === i && <InsertLine />}
            <div
              ref={(el) => { rows.current[it.id] = el }}
              role="row"
              aria-selected={sel}
              aria-expanded={renderDetails ? open : undefined}
              aria-label={name || undefined}
              tabIndex={tabbable ? 0 : -1}
              onPointerDown={(e) => startDrag(e, it.id)}
              onClick={() => { if (!suppressClick.current) onSelect?.(it.id) }}
              onContextMenu={() => { setCtx(it.id); onSelect?.(it.id) }}
              onDoubleClick={(e) => { if (rename && !(e.target as HTMLElement).closest(INTERACTIVE)) setEditing(it.id) }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget || editing) return
                const k = e.key
                const go = (j: number) => { const n = display[Math.max(0, Math.min(display.length - 1, j))]; onSelect?.(n.id); focusRow(n.id) }
                const done = () => { e.preventDefault(); e.stopPropagation() }
                if ((k === 'ArrowUp' || k === 'ArrowDown') && e.altKey) { done(); if (canMove) { moveTo(it.id, i + (k === 'ArrowUp' ? -1 : 1)); focusRow(it.id) } }
                else if (k === 'ArrowUp' || k === 'ArrowDown') { done(); go(i + (k === 'ArrowUp' ? -1 : 1)) }
                else if (k === 'Home' || k === 'End') { done(); go(k === 'Home' ? 0 : display.length - 1) }
                else if (renderDetails && (k === 'ArrowRight' || k === 'ArrowLeft')) { done(); setExpanded(k === 'ArrowRight' ? [...new Set([...expanded, it.id])] : expanded.filter((x) => x !== it.id)) }
                else if ((k === 'Enter' || k === 'F2') && rename) { done(); setEditing(it.id) }
                else if ((k === 'Delete' || k === 'Backspace') && remove) { done(); remove(it.id); focusRow(display[i + 1]?.id ?? display[i - 1]?.id) }
              }}
              className={cn(
                'group/row relative mx-1.5 flex shrink-0 items-center gap-1.5 rounded-[6px] pr-1 text-[12px] outline-none no-select',
                showGrip || renderDetails ? 'pl-0.5' : 'pl-2',
                sel ? 'bg-signal-soft text-fg' : 'text-fg hover:bg-hover',
                hidden && 'text-fg-faint',
                drag?.id === it.id && 'opacity-40',
                'focus-visible:ring-2 focus-visible:ring-signal',
              )}
              style={{ minHeight: rowHeight }}
            >
              <div role="gridcell" className="contents">
              {showGrip && (
                <span aria-hidden onPointerDown={(e) => { e.stopPropagation(); startDrag(e, it.id, true) }}
                  className={cn('flex h-6 w-3 shrink-0 cursor-grab items-center justify-center text-fg-faint opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100', (!canMove || display.length < 2) && 'invisible')}>
                  <GripVertical size={12} strokeWidth={1.5} />
                </span>
              )}
              {renderDetails && (
                <button type="button" tabIndex={-1} aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
                  onClick={(e) => { e.stopPropagation(); setExpanded(open ? expanded.filter((x) => x !== it.id) : [...expanded, it.id]) }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-[4px] text-fg-faint outline-none hover:text-fg">
                  <ChevronRight size={11} strokeWidth={2} className={cn('transition-transform duration-150', open && 'rotate-90')} />
                </button>
              )}
              {it.thumb ? (
                <img src={it.thumb} alt="" draggable={false} className="size-5 shrink-0 rounded-[4px] object-cover shadow-[inset_0_0_0_1px_var(--line)]" />
              ) : it.swatch ? (
                <span className="checker size-4 shrink-0 overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_var(--line-strong)]"><span className="block size-full" style={{ background: it.swatch }} /></span>
              ) : Icon ? (
                <Icon size={14} strokeWidth={1.5} className={cn('shrink-0', sel ? 'text-signal' : 'text-fg-faint')} />
              ) : null}

              {editing === it.id ? (
                <input
                  autoFocus
                  defaultValue={name}
                  aria-label="Name"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={(e) => { rename?.(it.id, e.target.value.trim() || name); setEditing(null); focusRow(it.id) }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setEditing(null); focusRow(it.id) } }}
                  className="h-5 min-w-0 flex-1 rounded-[4px] bg-control px-1 text-[12px] text-fg shadow-[inset_0_0_0_1px_var(--signal)] outline-none"
                />
              ) : renderRow ? (
                <div className={cn('flex min-w-0 flex-1 items-center gap-1.5', hidden && 'opacity-50')}>{renderRow(it, c)}</div>
              ) : (
                <span className={cn('min-w-0 flex-1 truncate', hidden && 'line-through decoration-[var(--line-strong)]')}>{name}</span>
              )}

              <div className="flex shrink-0 items-center">
                {it.blend !== undefined && setBlend && blendOptions.length > 0 ? (
                  <Menu
                    align="end"
                    trigger={
                      <button type="button" aria-label={`Blend mode: ${blendLabel}`}
                        className="h-5 max-w-[72px] truncate rounded-[4px] px-1 text-[11px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:bg-hover data-[popup-open]:text-fg">
                        {blendLabel}
                      </button>
                    }
                    items={[{ type: 'label', label: 'Blend mode' }, ...blendOptions.map((b) => ({ label: b.label, checked: b.value === it.blend, onClick: () => setBlend(it.id, b.value) }))]}
                  />
                ) : it.blend !== undefined ? (
                  <span className="max-w-[72px] truncate px-1 text-[11px] text-fg-faint">{blendLabel}</span>
                ) : it.meta != null ? (
                  <span className="max-w-[72px] truncate px-1 text-[11px] text-fg-faint">{it.meta}</span>
                ) : null}
                {it.opacity !== undefined && setOpacity && (
                  <ScrubValue value={Math.round(it.opacity * 100)} min={0} max={100} step={1} unit="%" label={`${name || 'Item'} opacity`} changed={it.opacity < 1}
                    className="w-[42px] shrink-0" onChange={(v, final) => setOpacity(it.id, v / 100, final)} />
                )}
                {it.visible !== undefined && toggle && (
                  <Tip label={hidden ? 'Show' : 'Hide'}>
                    <button type="button" aria-label={hidden ? `Show ${name}` : `Hide ${name}`} aria-pressed={hidden}
                      onClick={(e) => { e.stopPropagation(); toggle(it.id) }}
                      className={cn('flex size-6 items-center justify-center rounded-[5px] outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', hidden ? 'text-fg-muted' : 'text-fg-faint')}>
                      {hidden ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                    </button>
                  </Tip>
                )}
                {remove && (
                  <Tip label="Remove">
                    <button type="button" aria-label={`Remove ${name}`} onClick={(e) => { e.stopPropagation(); remove(it.id) }}
                      className={cn('flex size-6 items-center justify-center rounded-[5px] text-fg-faint outline-none hover:bg-hover focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal',
                        removeIcon === 'minus' ? 'hover:text-fg' : 'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:text-rec')}>
                      {removeIcon === 'minus' ? <Minus size={13} strokeWidth={1.5} /> : <Trash2 size={13} strokeWidth={1.5} />}
                    </button>
                  </Tip>
                )}
              </div>
              </div>
            </div>
            {open && (
              <div role="row"><div role="gridcell" aria-label={`${name} settings`} className="pt-1 pb-2">{renderDetails!(it, c)}</div></div>
            )}
            {drag && !noop && drag.to === display.length && i === display.length - 1 && <InsertLine bottom />}
          </div>
        )
      })}
    </div>
  )

  if (!contextMenu) return listEl
  const ci = ctxItem ? dIndexOf(ctxItem.id) : -1
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={listEl} />
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-[160] outline-none">
          <ContextMenu.Popup className="pop min-w-[200px] origin-[var(--transform-origin)] p-1 outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {ctxItem && (
              <>
                {rename && <CtxItem icon={PenLine} label="Rename" hint="↵" onClick={() => setEditing(ctxItem.id)} />}
                {onDuplicate && <CtxItem icon={Copy} label="Duplicate" onClick={() => onDuplicate(ctxItem.id)} />}
                {ctxItem.visible !== undefined && toggle && <CtxItem icon={ctxItem.visible ? EyeOff : Eye} label={ctxItem.visible ? 'Hide' : 'Show'} onClick={() => toggle(ctxItem.id)} />}
                {canMove && (
                  <>
                    <ContextMenu.Separator className="mx-2 my-1 h-px bg-line" />
                    <CtxItem icon={ArrowUp} label="Move up" hint="⌥↑" disabled={ci <= 0} onClick={() => moveTo(ctxItem.id, ci - 1)} />
                    <CtxItem icon={ArrowDown} label="Move down" hint="⌥↓" disabled={ci >= display.length - 1} onClick={() => moveTo(ctxItem.id, ci + 1)} />
                  </>
                )}
                {remove && (
                  <>
                    <ContextMenu.Separator className="mx-2 my-1 h-px bg-line" />
                    <CtxItem icon={Trash2} label="Remove" hint="⌫" danger onClick={() => remove(ctxItem.id)} />
                  </>
                )}
              </>
            )}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

/** Same component, the name ui-design uses for fills / strokes / effects lists. */

function InsertLine({ bottom }: { bottom?: boolean }) {
  return <div aria-hidden className={cn('pointer-events-none absolute right-2.5 left-2.5 z-10 h-0.5 rounded-full bg-signal', bottom ? '-bottom-px' : '-top-px')} />
}

function CtxItem({ icon: I, label, hint, onClick, danger, disabled }: { icon: Icon; label: string; hint?: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <ContextMenu.Item disabled={disabled} onClick={onClick}
      className={cn('group/item flex h-7 cursor-default items-center gap-2 rounded-[5px] px-2 text-[12px] outline-none select-none data-[disabled]:opacity-40 data-[highlighted]:bg-signal-strong data-[highlighted]:text-signal-fg', danger ? 'text-rec' : 'text-fg')}>
      <span className="flex w-4 justify-center text-fg-muted group-data-[highlighted]/item:text-signal-fg"><I size={14} strokeWidth={1.5} /></span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-fg-faint group-data-[highlighted]/item:text-signal-fg/70">{hint}</span>}
    </ContextMenu.Item>
  )
}

/* ---------------------------------------------------------------------------
   The "+" that adds to a stack, grouped by category (Fill · Distort · …).
     <StackAddMenu label="Add effect" groups={[{ label: 'Fill', items: [{ label: 'Mesh gradient', icon, hint, onClick }] }]} />
--------------------------------------------------------------------------- */
export interface StackAddGroup { label?: string; items: { label: string; icon?: Icon; hint?: string; disabled?: boolean; onClick: () => void }[] }

export const stackAddItems = (groups: StackAddGroup[]): MenuItem[] =>
  groups.flatMap((g, i) => [
    ...(i ? [{ type: 'separator' } as MenuItem] : []),
    ...(g.label ? [{ type: 'label', label: g.label } as MenuItem] : []),
    ...g.items.map((it) => ({ label: it.label, icon: it.icon, hint: it.hint, disabled: it.disabled, onClick: it.onClick }) as MenuItem),
  ])

export function StackAddMenu({ groups, label = 'Add', shortcut, trigger, align = 'end' }: { groups: StackAddGroup[]; label?: string; shortcut?: string; trigger?: React.ReactElement; align?: 'start' | 'center' | 'end' }) {
  return <Menu align={align} trigger={trigger ?? <IconButton icon={Plus} label={label} shortcut={shortcut} size="icon-sm" />} items={stackAddItems(groups)} />
}
