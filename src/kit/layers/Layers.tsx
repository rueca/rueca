/* ---------------------------------------------------------------------------
   Layers — a tree of rows: disclosure, type icon, name, eye + lock on hover.
   Used for scene outliners, effect stacks, artboard frames, flow screens.

     <LayerTree items={tree} selected={sel} onSelect={setSel}
       onToggle={(id, prop) => …} onMove={(id, toParent, index) => …} onRename={…} />

   Drag to reorder shows a 2px accent insertion line; dropping on the middle
   of a group nests. Every drag has a non-drag path (Move up/down via ⌥↑/⌥↓)
   for WCAG 2.5.7.
--------------------------------------------------------------------------- */
import { useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight, Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { cn } from '../core/cn'

export interface LayerItem {
  id: string
  name: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  children?: LayerItem[]
  visible?: boolean
  locked?: boolean
  /** a right-aligned adornment: blend mode, an fx badge, a count */
  meta?: ReactNode
  thumb?: string
}

type Drop = { id: string; where: 'before' | 'after' | 'inside' } | null

export function LayerTree({
  items, selected = [], onSelect, onToggle, onMove, onRename, className, rowHeight = 28,
}: {
  items: LayerItem[]
  selected?: string[]
  onSelect?: (ids: string[], e?: React.MouseEvent) => void
  onToggle?: (id: string, prop: 'visible' | 'locked') => void
  onMove?: (id: string, target: string, where: 'before' | 'after' | 'inside') => void
  onRename?: (id: string, name: string) => void
  className?: string
  rowHeight?: number
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<string | null>(null)
  const [drop, setDrop] = useState<Drop>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const flat: { item: LayerItem; depth: number; hiddenParent: boolean }[] = []
  const walk = (list: LayerItem[], depth: number, hiddenParent: boolean) => {
    for (const it of list) {
      flat.push({ item: it, depth, hiddenParent })
      if (it.children?.length && !closed[it.id]) walk(it.children, depth + 1, hiddenParent || it.visible === false)
    }
  }
  walk(items, 0, false)

  return (
    <div role="tree" aria-multiselectable className={cn('flex flex-col py-1', className)} onDragEnd={() => { setDrag(null); setDrop(null) }}>
      {flat.map(({ item, depth, hiddenParent }) => {
        const sel = selected.includes(item.id)
        const Icon = item.icon
        const hasKids = !!item.children?.length
        const hidden = item.visible === false
        return (
          <div
            key={item.id}
            role="treeitem"
            aria-selected={sel}
            aria-expanded={hasKids ? !closed[item.id] : undefined}
            tabIndex={sel ? 0 : -1}
            draggable={!!onMove && editing !== item.id}
            onDragStart={(e) => { setDrag(item.id); e.dataTransfer.effectAllowed = 'move' }}
            onDragOver={(e) => {
              if (!drag || drag === item.id) return
              e.preventDefault()
              const r = e.currentTarget.getBoundingClientRect()
              const y = (e.clientY - r.top) / r.height
              setDrop({ id: item.id, where: hasKids && y > 0.3 && y < 0.7 ? 'inside' : y < 0.5 ? 'before' : 'after' })
            }}
            onDrop={(e) => { e.preventDefault(); if (drag && drop) onMove?.(drag, drop.id, drop.where); setDrag(null); setDrop(null) }}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey) onSelect?.(sel ? selected.filter((s) => s !== item.id) : [...selected, item.id], e)
              else onSelect?.([item.id], e)
            }}
            onDoubleClick={() => onRename && setEditing(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' && hasKids) setClosed({ ...closed, [item.id]: false })
              if (e.key === 'ArrowLeft' && hasKids) setClosed({ ...closed, [item.id]: true })
              if (e.altKey && e.key === 'ArrowUp') onMove?.(item.id, flat[Math.max(0, flat.findIndex((f) => f.item.id === item.id) - 1)].item.id, 'before')
              if (e.altKey && e.key === 'ArrowDown') onMove?.(item.id, flat[Math.min(flat.length - 1, flat.findIndex((f) => f.item.id === item.id) + 1)].item.id, 'after')
              if (e.key === 'Enter' && onRename) setEditing(item.id)
            }}
            className={cn(
              'group/row relative mx-1.5 flex shrink-0 items-center gap-1 rounded-[6px] pr-1 text-[12px] outline-none no-select',
              sel ? 'bg-accent-soft text-fg' : 'text-fg hover:bg-hover',
              (hidden || hiddenParent) && 'text-faint',
              drag === item.id && 'opacity-40',
              drop?.id === item.id && drop.where === 'inside' && 'shadow-[inset_0_0_0_1.5px_var(--accent)]',
              'focus-visible:ring-2 focus-visible:ring-accent',
            )}
            style={{ height: rowHeight, paddingLeft: 4 + depth * 12 }}
          >
            {drop?.id === item.id && drop.where !== 'inside' && (
              <div className={cn('pointer-events-none absolute right-1 h-0.5 rounded-full bg-accent', drop.where === 'before' ? '-top-px' : '-bottom-px')} style={{ left: 4 + depth * 12 }} />
            )}
            <button type="button" tabIndex={-1} aria-hidden onClick={(e) => { e.stopPropagation(); setClosed({ ...closed, [item.id]: !closed[item.id] }) }}
              className={cn('flex size-4 shrink-0 items-center justify-center text-faint', !hasKids && 'invisible')}>
              <ChevronRight size={11} strokeWidth={2} className={cn('transition-transform', !closed[item.id] && 'rotate-90')} />
            </button>
            {item.thumb ? (
              <img src={item.thumb} alt="" className="size-5 shrink-0 rounded-[3px] object-cover shadow-[inset_0_0_0_1px_var(--line)]" />
            ) : Icon ? (
              <Icon size={14} strokeWidth={1.5} className={cn('shrink-0', sel ? 'text-accent' : 'text-faint')} />
            ) : null}
            {editing === item.id ? (
              <input autoFocus defaultValue={item.name} onClick={(e) => e.stopPropagation()}
                onBlur={(e) => { onRename?.(item.id, e.target.value || item.name); setEditing(null) }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null) }}
                className="ml-1 h-5 min-w-0 flex-1 rounded-[4px] bg-input px-1 text-[12px] text-fg outline-none shadow-[inset_0_0_0_1px_var(--accent)]" />
            ) : (
              <span className="ml-1 min-w-0 flex-1 truncate">{item.name}</span>
            )}
            {item.meta && <span className="shrink-0 text-[11px] text-faint group-hover/row:hidden">{item.meta}</span>}
            {onToggle && (
              <div className="flex shrink-0 items-center">
                <RowToggle on={item.locked} label={item.locked ? 'Unlock' : 'Lock'} onClick={() => onToggle(item.id, 'locked')} icon={item.locked ? Lock : Unlock} />
                <RowToggle on={hidden} label={hidden ? 'Show' : 'Hide'} onClick={() => onToggle(item.id, 'visible')} icon={hidden ? EyeOff : Eye} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RowToggle({ on, label, onClick, icon: Icon }: { on?: boolean; label: string; onClick: () => void; icon: ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn('flex size-6 items-center justify-center rounded-[5px] text-faint outline-none hover:text-fg focus-visible:opacity-100',
        on ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100')}>
      <Icon size={13} strokeWidth={1.5} />
    </button>
  )
}

/* Tree helpers so shells don't re-invent them. */
export function updateTree(items: LayerItem[], id: string, fn: (it: LayerItem) => LayerItem): LayerItem[] {
  return items.map((it) => (it.id === id ? fn(it) : it.children ? { ...it, children: updateTree(it.children, id, fn) } : it))
}
export function moveInTree(items: LayerItem[], id: string, target: string, where: 'before' | 'after' | 'inside'): LayerItem[] {
  let moving: LayerItem | null = null
  const strip = (list: LayerItem[]): LayerItem[] => list.filter((it) => (it.id === id ? ((moving = it), false) : true)).map((it) => (it.children ? { ...it, children: strip(it.children) } : it))
  const without = strip(items)
  if (!moving) return items
  const insert = (list: LayerItem[]): LayerItem[] => {
    const out: LayerItem[] = []
    for (const it of list) {
      if (it.id === target && where === 'before') out.push(moving!)
      out.push(it.id === target && where === 'inside' ? { ...it, children: [moving!, ...(it.children ?? [])] } : it.children ? { ...it, children: insert(it.children) } : it)
      if (it.id === target && where === 'after') out.push(moving!)
    }
    return out
  }
  return insert(without)
}
export function findInTree(items: LayerItem[], id: string): LayerItem | undefined {
  for (const it of items) { if (it.id === id) return it; const f = it.children && findInTree(it.children, id); if (f) return f }
}
