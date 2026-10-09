/* ---------------------------------------------------------------------------
   PresetGrid + Filmstrip — visual preset pickers: a thumbnail of the actual
   output under each preset, hover (or focus) to preview it on the stage,
   click to apply. Lightroom's preset browser, VSCO's filter row, Unicorn
   Studio's looks. The kit's PresetMenu is a text list; use these for looks
   people choose with their eyes.

     <PresetGrid
       items={[{ id: 'aurora', name: 'Aurora', thumb: dataUrl, removable: false }]}
       value={activeId}                          // or `active` per item
       onApply={(id) => params.applyPreset(id)}
       onPreview={(id | null) => …}             // hover / focus preview; null = stop
       onRemove={(id) => params.deletePreset(id)}
       columns={2} aspect="3 / 2"
     />
     <Filmstrip items={…} value={…} onApply={…} onPreview={…} trailing={<SaveCard />} />   // horizontal

   Behaviour / keyboard: one tab stop (roving tabindex). Arrows move focus
   (and therefore the preview); Enter / Space apply; Delete removes a
   removable tile; Home / End jump. The filmstrip scrolls horizontally with a
   vertical wheel. Thumbs still rendering show a quiet shimmer; `group`
   labels a run of items (Filmstrip) or starts a new row heading (grid).

   Accessibility: role="listbox" of role="option" buttons with aria-selected;
   preview never fires on hover alone — focus triggers it too.
   (Promoted from shells/shader/local/PresetGrid.tsx and
   shells/photo/local/Filmstrip.tsx.)
--------------------------------------------------------------------------- */
import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../core/cn'

export interface PresetTile {
  id: string
  name: string
  thumb?: string | null
  active?: boolean
  removable?: boolean
  /** a heading for a run of items ("Film", "Yours") */
  group?: string
  hint?: string
}

interface Common {
  items: PresetTile[]
  /** the applied preset (alternative to `active` on items) */
  value?: string | null
  onApply: (id: string) => void
  onPreview?: (id: string | null) => void
  onRemove?: (id: string) => void
  /** nearest-neighbour thumbnails (pixel art) */
  pixelated?: boolean
  label?: string
  className?: string
}

function useRoving(n: number) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const focus = (i: number) => refs.current[Math.max(0, Math.min(n - 1, i))]?.focus()
  return { refs, focus }
}

const isActive = (it: PresetTile, value?: string | null) => (value !== undefined ? value === it.id : !!it.active)

function Thumb({ it, pixelated }: { it: PresetTile; pixelated?: boolean }) {
  return it.thumb ? (
    <img src={it.thumb} alt="" draggable={false} className="absolute inset-0 size-full object-cover" style={pixelated ? { imageRendering: 'pixelated' } : undefined} />
  ) : (
    <span className="absolute inset-0 animate-pulse bg-hover" />
  )
}

function RemoveButton({ it, onRemove, className }: { it: PresetTile; onRemove: (id: string) => void; className?: string }) {
  return (
    <button type="button" tabIndex={-1} aria-label={`Delete ${it.name}`} onClick={(e) => { e.stopPropagation(); onRemove(it.id) }}
      className={cn('absolute hidden size-5 items-center justify-center rounded-full bg-overlay text-fg-muted shadow-[var(--shadow-segment)] outline-none hover:text-fg', className)}>
      <X size={11} strokeWidth={2} />
    </button>
  )
}

export function PresetGrid({ items, value, onApply, onPreview, onRemove, columns = 2, aspect = '3 / 2', pixelated, label = 'Presets', className }: Common & { columns?: number; aspect?: string }) {
  const { refs, focus } = useRoving(items.length)
  const cur = items.findIndex((it) => isActive(it, value))
  return (
    <div role="listbox" aria-label={label} className={cn('grid gap-2 px-3 pb-3', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      onPointerLeave={() => onPreview?.(null)}>
      {items.map((it, i) => {
        const on = i === cur
        const head = it.group && (i === 0 || items[i - 1].group !== it.group)
        return (
          <div key={it.id} className="group/tile relative flex min-w-0 flex-col gap-1" style={head && i ? { gridColumnStart: 1 } : undefined}>
            {head && <span className="px-0.5 text-[11px] text-fg-faint">{it.group}</span>}
            <button
              ref={(el) => { refs.current[i] = el }}
              type="button"
              role="option"
              aria-selected={on}
              aria-label={it.name}
              title={it.hint}
              tabIndex={on || (cur < 0 && i === 0) ? 0 : -1}
              onClick={() => onApply(it.id)}
              onPointerEnter={() => onPreview?.(it.id)}
              onFocus={() => onPreview?.(it.id)}
              onBlur={() => onPreview?.(null)}
              onKeyDown={(e) => {
                const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[e.key]
                if (d) { e.preventDefault(); e.stopPropagation(); focus(i + d); return }
                if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); focus(e.key === 'Home' ? 0 : items.length - 1); return }
                if ((e.key === 'Delete' || e.key === 'Backspace') && it.removable && onRemove) { e.preventDefault(); e.stopPropagation(); onRemove(it.id); focus(i - 1) }
              }}
              className={cn(
                'relative w-full overflow-hidden rounded-[7px] bg-well outline-none transition-shadow duration-100',
                on ? 'shadow-[0_0_0_1.5px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1.5px_var(--line-strong)]',
                'focus-visible:shadow-[0_0_0_2px_var(--signal)]',
              )}
              style={{ aspectRatio: aspect }}
            >
              <Thumb it={it} pixelated={pixelated} />
            </button>
            <span className={cn('truncate px-0.5 text-[11.5px]', on ? 'text-fg' : 'text-fg-muted')}>{it.name}</span>
            {it.removable && onRemove && <RemoveButton it={it} onRemove={onRemove} className="top-1 right-1 group-focus-within/tile:flex group-hover/tile:flex" />}
          </div>
        )
      })}
    </div>
  )
}

export function Filmstrip({
  items, value, onApply, onPreview, onRemove, pixelated, label = 'Presets', className, thumbW = 120, thumbH = 80, leading, trailing,
}: Common & { thumbW?: number; thumbH?: number; leading?: ReactNode; trailing?: ReactNode }) {
  const { refs, focus } = useRoving(items.length)
  const scroller = useRef<HTMLDivElement>(null)
  const cur = items.findIndex((it) => isActive(it, value))
  const grouped = items.some((it) => it.group)
  return (
    <div
      ref={scroller}
      role="listbox"
      aria-label={label}
      aria-orientation="horizontal"
      className={cn('flex h-full items-center gap-2 overflow-x-auto overflow-y-hidden px-3 pb-2', grouped ? 'pt-6' : 'pt-2', className)}
      onPointerLeave={() => onPreview?.(null)}
      onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scroller.current) scroller.current.scrollLeft += e.deltaY }}
    >
      {leading}
      {items.map((it, i) => {
        const on = i === cur
        return (
          <div key={it.id} className="group/film relative shrink-0">
            {it.group && (i === 0 || items[i - 1].group !== it.group) && (
              <div className="absolute -top-0.5 left-1 -translate-y-full text-[10.5px] whitespace-nowrap text-fg-faint">{it.group}</div>
            )}
            <button
              ref={(n) => { refs.current[i] = n }}
              type="button"
              role="option"
              aria-selected={on}
              title={it.hint}
              tabIndex={on || (cur < 0 && i === 0) ? 0 : -1}
              onClick={() => onApply(it.id)}
              onPointerEnter={() => onPreview?.(it.id)}
              onFocus={() => onPreview?.(it.id)}
              onBlur={() => onPreview?.(null)}
              onKeyDown={(e) => {
                const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
                if (d) { e.preventDefault(); e.stopPropagation(); focus(i + d); return }
                if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); focus(e.key === 'Home' ? 0 : items.length - 1); return }
                if ((e.key === 'Delete' || e.key === 'Backspace') && it.removable && onRemove) { e.preventDefault(); e.stopPropagation(); onRemove(it.id); focus(i - 1) }
              }}
              className="flex flex-col gap-1 rounded-[8px] p-1 text-left outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal"
            >
              <div className={cn('relative overflow-hidden rounded-[5px] bg-control transition-shadow', on ? 'shadow-[0_0_0_2px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line)]')}
                style={{ width: thumbW, height: thumbH }}>
                <Thumb it={it} pixelated={pixelated} />
              </div>
              <span className={cn('truncate px-0.5 text-[11.5px]', on ? 'text-fg' : 'text-fg-muted')} style={{ maxWidth: thumbW }}>{it.name}</span>
            </button>
            {it.removable && onRemove && <RemoveButton it={it} onRemove={onRemove} className="top-2 right-2 group-focus-within/film:flex group-hover/film:flex" />}
          </div>
        )
      })}
      {trailing}
    </div>
  )
}
