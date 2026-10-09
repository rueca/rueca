/* ---------------------------------------------------------------------------
   PresetGrid — a visual preset picker: thumbnails of the actual output under
   each preset, hover to preview on the stage (Lightroom), click to apply.
   The kit's PresetMenu is a text list; for looks you choose with your eyes.

     <PresetGrid
       items={[{ id: 'Aurora', name: 'Aurora', thumb: dataUrl, active: true, removable: false }]}
       onApply={(id) => params.applyPreset(id)}
       onPreview={(id | null) => …}       // hover / focus preview; null = stop
       onRemove={(id) => params.deletePreset(id)}
       aspect="3 / 2" columns={2}
     />

   Thumbs that are still rendering show a quiet shimmer. Preview is also
   fired on keyboard focus so it is not hover-only.
--------------------------------------------------------------------------- */
import { X } from 'lucide-react'
import { cn } from '@kit'

export interface PresetTile { id: string; name: string; thumb?: string | null; active?: boolean; removable?: boolean }

export function PresetGrid({
  items, onApply, onPreview, onRemove, columns = 2, aspect = '3 / 2', className, pixelated,
}: {
  items: PresetTile[]
  onApply: (id: string) => void
  onPreview?: (id: string | null) => void
  onRemove?: (id: string) => void
  columns?: number
  aspect?: string
  className?: string
  /** nearest-neighbour thumbnails (pixel art) */
  pixelated?: boolean
}) {
  return (
    <div role="listbox" aria-label="Presets" className={cn('grid gap-2 px-3 pb-3', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      onPointerLeave={() => onPreview?.(null)}>
      {items.map((it) => (
        <div key={it.id} className="group/tile relative flex min-w-0 flex-col gap-1">
          <button
            type="button"
            role="option"
            aria-selected={!!it.active}
            aria-label={`Apply ${it.name}`}
            onClick={() => onApply(it.id)}
            onPointerEnter={() => onPreview?.(it.id)}
            onFocus={() => onPreview?.(it.id)}
            onBlur={() => onPreview?.(null)}
            className={cn(
              'relative w-full overflow-hidden rounded-[7px] bg-well outline-none transition-shadow duration-100',
              it.active ? 'shadow-[0_0_0_1.5px_var(--accent)]' : 'shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1.5px_var(--line-strong)]',
              'focus-visible:shadow-[0_0_0_2px_var(--accent)]',
            )}
            style={{ aspectRatio: aspect }}
          >
            {it.thumb ? (
              <img src={it.thumb} alt="" draggable={false} className="absolute inset-0 size-full object-cover" style={pixelated ? { imageRendering: 'pixelated' } : undefined} />
            ) : (
              <span className="absolute inset-0 animate-pulse bg-hover" />
            )}
          </button>
          <span className={cn('truncate px-0.5 text-[11.5px]', it.active ? 'text-fg' : 'text-muted')}>{it.name}</span>
          {it.removable && onRemove && (
            <button type="button" aria-label={`Delete ${it.name}`} onClick={() => onRemove(it.id)}
              className="absolute top-1 right-1 hidden size-5 items-center justify-center rounded-full bg-overlay text-muted shadow-[var(--shadow-segment)] outline-none group-focus-within/tile:flex group-hover/tile:flex hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
              <X size={11} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
