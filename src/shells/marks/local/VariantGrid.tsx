/* ---------------------------------------------------------------------------
   VariantGrid — a responsive grid of generated variants with keep/favourite
   affordances (Oddgrid, Midjourney, Components AI). The owner renders the
   artwork; the grid owns selection, hover actions and the reroll entrance.

     <VariantGrid items={items} render={(id) => <svg…/>} cursor={i} onCursor={setI}
       onOpen={focus} onLock={toggleLock} onFav={toggleFav}
       actions={(id) => <IconButton … />} onColumns={(n) => cols.current = n} />

   Conventions: locked and favourite states stay visible; every other action
   appears on hover AND on focus-within. Enter opens. Cards remount when an
   id changes, so rerolled slots animate in while kept ones stay still.
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ReactNode } from 'react'
import { Lock, LockOpen, Star, Maximize2 } from 'lucide-react'
import { cn, Tip } from '@kit'

export interface Variant { id: string; label: string; sub?: string; locked?: boolean; fav?: boolean; background?: string }

const KEYFRAMES = `@keyframes vg-pop { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: none } }`

function CardButton({ label, shortcut, onClick, children, on }: { label: string; shortcut?: string; onClick: () => void; children: ReactNode; on?: boolean }) {
  return (
    <Tip label={label} shortcut={shortcut}>
      <button type="button" aria-label={label} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onClick() }}
        className={cn('flex size-7 items-center justify-center rounded-[7px] bg-overlay/90 text-muted shadow-[var(--shadow-segment)] outline-none backdrop-blur-sm',
          'hover:text-fg focus-visible:ring-2 focus-visible:ring-accent', on && 'text-accent hover:text-accent')}>
        {children}
      </button>
    </Tip>
  )
}

export function VariantGrid({
  items, render, cursor, onCursor, onOpen, onLock, onFav, actions, minSize = 176, gap = 12, onColumns, className,
}: {
  items: Variant[]
  render: (id: string) => ReactNode
  cursor: number
  onCursor: (i: number) => void
  onOpen: (id: string) => void
  onLock?: (id: string) => void
  onFav?: (id: string) => void
  actions?: (id: string) => ReactNode
  minSize?: number
  gap?: number
  onColumns?: (n: number) => void
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!el.current || !onColumns) return
    const ro = new ResizeObserver(([e]) => onColumns(Math.max(1, Math.floor((e.contentRect.width + gap) / (minSize + gap)))))
    ro.observe(el.current)
    return () => ro.disconnect()
  }, [onColumns, minSize, gap])
  useEffect(() => { el.current?.querySelector(`[data-variant-index="${cursor}"]`)?.scrollIntoView({ block: 'nearest' }) }, [cursor])

  return (
    <div ref={el} role="grid" aria-label="Variants" className={cn('grid', className)} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minSize}px, 1fr))`, gap }}>
      <style>{KEYFRAMES}</style>
      {items.map((it, i) => {
        const active = i === cursor
        return (
          <div key={it.id} role="gridcell" aria-selected={active} data-variant-index={i} tabIndex={active ? 0 : -1}
            onClick={() => onCursor(i)}
            onDoubleClick={() => onOpen(it.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(it.id) }}
            className="group/card flex min-w-0 flex-col gap-1.5 outline-none"
            style={{ animation: `vg-pop 280ms cubic-bezier(.2,.8,.2,1) ${Math.min(i, 24) * 14}ms both` }}>
            <div className={cn('relative aspect-square overflow-hidden rounded-[10px] transition-shadow duration-150',
              active ? 'shadow-[0_0_0_2px_var(--accent)]' : it.locked ? 'shadow-[0_0_0_1px_var(--line-strong)]' : 'shadow-[0_0_0_1px_var(--line)] group-hover/card:shadow-[0_0_0_1px_var(--line-strong)]')}
              style={{ background: it.background }}>
              <div className="absolute inset-0 [&>svg]:size-full">{render(it.id)}</div>
              {/* persistent state */}
              <div className="pointer-events-none absolute top-2 left-2 flex gap-1">
                {it.locked && <span className="flex size-6 items-center justify-center rounded-[6px] bg-overlay/90 text-fg shadow-[var(--shadow-segment)]"><Lock size={12} strokeWidth={1.75} /></span>}
                {it.fav && <span className="flex size-6 items-center justify-center rounded-[6px] bg-overlay/90 text-key shadow-[var(--shadow-segment)]"><Star size={12} strokeWidth={1.75} fill="currentColor" /></span>}
              </div>
              {/* hover / focus actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-100 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
                {onLock && <CardButton label={it.locked ? 'Unlock' : 'Keep (lock)'} shortcut="l" on={it.locked} onClick={() => onLock(it.id)}>{it.locked ? <Lock size={13} strokeWidth={1.5} /> : <LockOpen size={13} strokeWidth={1.5} />}</CardButton>}
                {onFav && <CardButton label={it.fav ? 'Unfavourite' : 'Favourite'} shortcut="f" on={it.fav} onClick={() => onFav(it.id)}><Star size={13} strokeWidth={1.5} fill={it.fav ? 'currentColor' : 'none'} /></CardButton>}
              </div>
              <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity duration-100 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
                {actions?.(it.id)}
                <CardButton label="Open" shortcut="enter" onClick={() => onOpen(it.id)}><Maximize2 size={13} strokeWidth={1.5} /></CardButton>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 px-0.5 text-[11.5px]">
              <span className={cn('truncate', active ? 'text-fg' : 'text-muted')}>{it.label}</span>
              {it.sub && <span className="shrink-0 tabular text-faint">{it.sub}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
