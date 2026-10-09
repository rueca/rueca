/* ---------------------------------------------------------------------------
   Filmstrip — a horizontal strip of preset cards with rendered thumbnails
   (Lightroom's preset browser, VSCO's filter row, Figma's variants strip).

     <Filmstrip items={[{ id, name, thumb }]} active="warm" onApply={apply} onPreview={(id) => …} />

   Hover or focus a card to preview it on the canvas (`onPreview(id)`,
   `onPreview(null)` on leave); click or Enter applies. Arrow keys walk the
   strip, so the whole thing works without a pointer. Optional `onDelete`
   adds a remove button to user cards; `trailing` is a slot for "+ Save".
--------------------------------------------------------------------------- */
import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@kit'

export interface FilmItem { id: string; name: string; thumb?: string; user?: boolean; group?: string }

export function Filmstrip({
  items, active, onApply, onPreview, onDelete, trailing, thumbW = 120, thumbH = 80, leading,
}: {
  items: FilmItem[]
  active?: string | null
  onApply: (id: string) => void
  onPreview?: (id: string | null) => void
  onDelete?: (id: string) => void
  trailing?: ReactNode
  leading?: ReactNode
  thumbW?: number
  thumbH?: number
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={scroller}
      role="listbox"
      aria-label="Presets"
      aria-orientation="horizontal"
      className="flex h-full items-center gap-2 overflow-x-auto overflow-y-hidden px-3 pt-6 pb-2"
      onPointerLeave={() => onPreview?.(null)}
      onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) scroller.current!.scrollLeft += e.deltaY }}
    >
      {leading}
      {items.map((it, i) => (
        <div key={it.id} className="group/film relative shrink-0">
          {it.group && (i === 0 || items[i - 1].group !== it.group) && (
            <div className="absolute -top-0.5 left-0.5 -translate-y-full text-[10.5px] text-fg-faint">{it.group}</div>
          )}
          <button
            ref={(n) => { refs.current[i] = n }}
            type="button"
            role="option"
            aria-selected={active === it.id}
            onClick={() => onApply(it.id)}
            onPointerEnter={() => onPreview?.(it.id)}
            onFocus={() => onPreview?.(it.id)}
            onBlur={() => onPreview?.(null)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              e.stopPropagation()
              refs.current[Math.max(0, Math.min(items.length - 1, i + d))]?.focus()
            }}
            className="flex flex-col gap-1 rounded-[8px] p-1 text-left outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal"
          >
            <div
              className={cn('overflow-hidden rounded-[5px] bg-control transition-shadow', active === it.id ? 'shadow-[0_0_0_2px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line)]')}
              style={{ width: thumbW, height: thumbH }}
            >
              {it.thumb && <img src={it.thumb} alt="" draggable={false} className="size-full object-cover" />}
            </div>
            <span className={cn('truncate px-0.5 text-[11.5px]', active === it.id ? 'text-fg' : 'text-fg-muted')} style={{ maxWidth: thumbW }}>{it.name}</span>
          </button>
          {it.user && onDelete && (
            <button type="button" aria-label={`Delete ${it.name}`} onClick={() => onDelete(it.id)}
              className="absolute top-2 right-2 hidden size-5 items-center justify-center rounded-full bg-black/60 text-white group-focus-within/film:flex group-hover/film:flex">
              <X size={11} />
            </button>
          )}
        </div>
      ))}
      {trailing}
    </div>
  )
}
