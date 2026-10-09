/* ---------------------------------------------------------------------------
   EffectStack — a fills / effects / adjustment-layer list.

   The pattern every pro tool converges on (Paper fills, Figma fills+effects,
   Affinity live filters, Unicorn Studio layers, Spline post-fx): one row per
   item with type icon · name · blend chip · opacity scrub · eye · remove,
   drag to reorder, "+" to add. The kit's LayerTree is a scene outliner
   (nesting, lock) and has no blend/opacity/remove, hence this.

     <EffectStack
       items={[{ id, name, icon, visible, opacity, blend }]}
       selected={id} onSelect={setId}
       blendOptions={[{ value: 'normal', label: 'Normal' }, …]}
       onToggle={(id) => …} onOpacity={(id, v, final) => …} onBlend={(id, b) => …}
       onMove={(id, toIndex) => …} onRemove={(id) => …} onDuplicate={…} onRename={…}
     />

   Index 0 is the TOP of the stack (drawn last), as in every layers panel.
   Keyboard (WCAG 2.5.7, every drag has an alternative): ↑/↓ select,
   ⌥↑/⌥↓ move, Enter rename, F2 rename. Right-click for the row menu.
   Rows omit the blend chip when `blend` is undefined (e.g. a distortion) and
   show `kindLabel` there instead.
--------------------------------------------------------------------------- */
import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ContextMenu } from '@base-ui/react/context-menu'
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, PenLine, Trash2 } from 'lucide-react'
import { cn, Menu, ScrubValue, Tip } from '@kit'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface StackRow {
  id: string
  name: string
  icon?: Icon
  visible: boolean
  /** 0–1 */
  opacity: number
  blend?: string
  kindLabel?: string
  thumb?: string
}

export function EffectStack({
  items, selected, onSelect, onToggle, onOpacity, onBlend, blendOptions = [], onMove, onRemove, onDuplicate, onRename, empty, className,
}: {
  items: StackRow[]
  selected: string | null
  onSelect: (id: string | null) => void
  onToggle: (id: string) => void
  onOpacity: (id: string, v: number, final: boolean) => void
  onBlend?: (id: string, blend: string) => void
  blendOptions?: { value: string; label: string }[]
  onMove: (id: string, toIndex: number) => void
  onRemove: (id: string) => void
  onDuplicate?: (id: string) => void
  onRename?: (id: string, name: string) => void
  empty?: ReactNode
  className?: string
}) {
  const [drag, setDrag] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ id: string; where: 'before' | 'after' } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [ctx, setCtx] = useState<string | null>(null)
  const noDrag = useRef(false)
  const rows = useRef<Record<string, HTMLDivElement | null>>({})

  const focusRow = (id?: string) => id && requestAnimationFrame(() => rows.current[id]?.focus())
  const indexOf = (id: string) => items.findIndex((x) => x.id === id)

  const finishDrop = () => {
    if (drag && drop && drag !== drop.id) {
      const from = indexOf(drag)
      let to = indexOf(drop.id) + (drop.where === 'after' ? 1 : 0)
      if (from < to) to -= 1
      if (to !== from) onMove(drag, to)
    }
    setDrag(null)
    setDrop(null)
  }

  if (!items.length) return <>{empty}</>

  const ctxItem = ctx ? items.find((x) => x.id === ctx) : undefined

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        render={<div role="listbox" aria-label="Layers" className={cn('flex flex-col py-1', className)} onDragEnd={() => { setDrag(null); setDrop(null) }} />}
      >
        {items.map((it, i) => {
          const sel = selected === it.id
          const Icon = it.icon
          const blendLabel = it.blend !== undefined ? blendOptions.find((b) => b.value === it.blend)?.label ?? it.blend : it.kindLabel
          return (
            <div
              key={it.id}
              ref={(el) => { rows.current[it.id] = el }}
              role="option"
              aria-selected={sel}
              tabIndex={sel || (!selected && i === 0) ? 0 : -1}
              draggable={editing !== it.id}
              onPointerDownCapture={() => { noDrag.current = false }}
              onDragStart={(e) => {
                if (noDrag.current) { e.preventDefault(); return }
                setDrag(it.id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', it.name)
              }}
              onDragOver={(e) => {
                if (!drag || drag === it.id) return
                e.preventDefault()
                const r = e.currentTarget.getBoundingClientRect()
                setDrop({ id: it.id, where: e.clientY - r.top < r.height / 2 ? 'before' : 'after' })
              }}
              onDrop={(e) => { e.preventDefault(); finishDrop() }}
              onClick={() => onSelect(it.id)}
              onContextMenu={() => { setCtx(it.id); onSelect(it.id) }}
              onDoubleClick={() => onRename && setEditing(it.id)}
              onKeyDown={(e) => {
                if (editing) return
                const k = e.key
                if ((k === 'ArrowUp' || k === 'ArrowDown') && e.altKey) {
                  e.preventDefault(); e.stopPropagation()
                  const to = Math.max(0, Math.min(items.length - 1, i + (k === 'ArrowUp' ? -1 : 1)))
                  if (to !== i) { onMove(it.id, to); focusRow(it.id) }
                } else if (k === 'ArrowUp' || k === 'ArrowDown') {
                  e.preventDefault(); e.stopPropagation()
                  const n = items[Math.max(0, Math.min(items.length - 1, i + (k === 'ArrowUp' ? -1 : 1)))]
                  onSelect(n.id); focusRow(n.id)
                } else if ((k === 'Enter' || k === 'F2') && onRename) {
                  e.preventDefault(); setEditing(it.id)
                }
              }}
              className={cn(
                'group/row relative mx-1.5 flex h-[30px] shrink-0 items-center gap-1.5 rounded-[6px] pr-1 pl-2 text-[12px] outline-none no-select',
                sel ? 'bg-accent-soft text-fg' : 'text-fg hover:bg-hover',
                !it.visible && 'text-faint',
                drag === it.id && 'opacity-40',
                'focus-visible:ring-2 focus-visible:ring-accent',
              )}
            >
              {drop?.id === it.id && (
                <div className={cn('pointer-events-none absolute right-1 left-1 h-0.5 rounded-full bg-accent', drop.where === 'before' ? '-top-px' : '-bottom-px')} />
              )}
              {it.thumb ? (
                <img src={it.thumb} alt="" className="size-5 shrink-0 rounded-[4px] object-cover shadow-[inset_0_0_0_1px_var(--line)]" />
              ) : Icon ? (
                <Icon size={14} strokeWidth={1.5} className={cn('shrink-0', sel ? 'text-accent' : 'text-faint')} />
              ) : null}

              {editing === it.id ? (
                <input
                  autoFocus
                  defaultValue={it.name}
                  aria-label="Layer name"
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => { onRename?.(it.id, e.target.value.trim() || it.name); setEditing(null); focusRow(it.id) }}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setEditing(null); focusRow(it.id) } }}
                  className="h-5 min-w-0 flex-1 rounded-[4px] bg-input px-1 text-[12px] text-fg shadow-[inset_0_0_0_1px_var(--accent)] outline-none"
                />
              ) : (
                <span className={cn('min-w-0 flex-1 truncate', !it.visible && 'line-through decoration-[var(--line-strong)]')}>{it.name}</span>
              )}

              {/* controls: never start a row drag from here */}
              <div className="flex shrink-0 items-center" onPointerDown={() => { noDrag.current = true }}>
                {it.blend !== undefined && onBlend ? (
                  <Menu
                    align="end"
                    trigger={
                      <button type="button" aria-label={`Blend mode: ${blendLabel}`}
                        className="h-5 max-w-[68px] truncate rounded-[4px] px-1 text-[11px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent data-[popup-open]:bg-hover data-[popup-open]:text-fg">
                        {blendLabel}
                      </button>
                    }
                    items={[{ type: 'label', label: 'Blend mode' }, ...blendOptions.map((b) => ({ label: b.label, checked: b.value === it.blend, onClick: () => onBlend(it.id, b.value) }))]}
                  />
                ) : (
                  blendLabel && <span className="max-w-[68px] truncate px-1 text-[11px] text-faint">{blendLabel}</span>
                )}
                <ScrubValue
                  value={Math.round(it.opacity * 100)}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  label={`${it.name} opacity`}
                  changed={it.opacity < 1}
                  className="w-[42px] shrink-0"
                  onChange={(v, final) => onOpacity(it.id, v / 100, final)}
                />
                <Tip label={it.visible ? 'Hide' : 'Show'} shortcut="shift+mod+h">
                  <button type="button" aria-label={it.visible ? `Hide ${it.name}` : `Show ${it.name}`} aria-pressed={!it.visible}
                    onClick={(e) => { e.stopPropagation(); onToggle(it.id) }}
                    className={cn('flex size-6 items-center justify-center rounded-[5px] outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent', it.visible ? 'text-faint' : 'text-muted')}>
                    {it.visible ? <Eye size={13} strokeWidth={1.5} /> : <EyeOff size={13} strokeWidth={1.5} />}
                  </button>
                </Tip>
                <Tip label="Remove" shortcut="backspace">
                  <button type="button" aria-label={`Remove ${it.name}`} onClick={(e) => { e.stopPropagation(); onRemove(it.id) }}
                    className="flex size-6 items-center justify-center rounded-[5px] text-faint opacity-0 outline-none group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-hover hover:text-rec focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent">
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </Tip>
              </div>
            </div>
          )
        })}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-[100] outline-none">
          <ContextMenu.Popup className="pop min-w-[200px] origin-[var(--transform-origin)] p-1 outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {ctxItem && (
              <>
                {onRename && <CtxItem icon={PenLine} label="Rename" hint="↵" onClick={() => setEditing(ctxItem.id)} />}
                {onDuplicate && <CtxItem icon={Copy} label="Duplicate" hint="⌘D" onClick={() => onDuplicate(ctxItem.id)} />}
                <CtxItem icon={ctxItem.visible ? EyeOff : Eye} label={ctxItem.visible ? 'Hide' : 'Show'} onClick={() => onToggle(ctxItem.id)} />
                <ContextMenu.Separator className="mx-2 my-1 h-px bg-line" />
                <CtxItem icon={ArrowUp} label="Move up" hint="⌥↑" disabled={indexOf(ctxItem.id) === 0} onClick={() => onMove(ctxItem.id, indexOf(ctxItem.id) - 1)} />
                <CtxItem icon={ArrowDown} label="Move down" hint="⌥↓" disabled={indexOf(ctxItem.id) === items.length - 1} onClick={() => onMove(ctxItem.id, indexOf(ctxItem.id) + 1)} />
                <ContextMenu.Separator className="mx-2 my-1 h-px bg-line" />
                <CtxItem icon={Trash2} label="Remove" hint="⌫" danger onClick={() => onRemove(ctxItem.id)} />
              </>
            )}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function CtxItem({ icon: Icon, label, hint, onClick, danger, disabled }: { icon: Icon; label: string; hint?: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <ContextMenu.Item disabled={disabled} onClick={onClick}
      className={cn('group/item flex h-7 cursor-default items-center gap-2 rounded-[5px] px-2 text-[12px] outline-none select-none data-[disabled]:opacity-40 data-[highlighted]:bg-accent-strong data-[highlighted]:text-accent-fg', danger ? 'text-rec' : 'text-fg')}>
      <span className="flex w-4 justify-center text-muted group-data-[highlighted]/item:text-accent-fg"><Icon size={14} strokeWidth={1.5} /></span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-faint group-data-[highlighted]/item:text-accent-fg/70">{hint}</span>}
    </ContextMenu.Item>
  )
}
