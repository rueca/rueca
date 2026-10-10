/* One image in the grid: select, favourite, hover actions, provenance badges. */
import { memo } from 'react'
import { Heart, Sparkles, Maximize2, Download, Check, MoreHorizontal, Wand2, Copy, Trash2, FolderHeart, Expand } from 'lucide-react'
import { Menu, Tip, toast, cn } from '@kit'
import { clickSelect, toggleFavourite, toggleBoard, library, type ImageRec } from '../state/gallery'
import { usePix, exportPNG } from '../state/images'
import { ui } from '../state/ui'
import { variations, upscale, remix, copyParams, removeWithUndo } from '../state/actions'

/** Image scrim controls: these sit on arbitrary pixels, so they are dark glass in both themes. */
const glass = 'flex size-7 items-center justify-center rounded-[7px] bg-scrim text-white outline-none backdrop-blur-md transition-[filter] hover:brightness-150 focus-visible:ring-2 focus-visible:ring-signal'

export const Tile = memo(function Tile({ rec, selected, multi }: { rec: ImageRec; selected: boolean; multi: boolean }) {
  const pix = usePix(rec.id, rec.params, 'thumb')
  const open = () => { clickSelect(rec.id, {}); ui.setState({ overlay: { type: 'lightbox' } }) }
  const boards = library.get().boards
  return (
    <div className={cn('group/tile relative h-full w-full overflow-hidden rounded-[8px] bg-well', selected && 'shadow-[0_0_0_2px_var(--signal)]')}>
      <button
        type="button"
        aria-label={`Image: ${rec.params.prompt}`}
        aria-pressed={selected}
        onClick={(e) => { clickSelect(rec.id, e); ui.setState({ tab: 'details' }) }}
        onDoubleClick={open}
        className="absolute inset-0 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]"
      >
        {pix
          ? <img src={pix.url} alt="" draggable={false} className="h-full w-full object-cover transition-transform duration-300 group-hover/tile:scale-[1.015]" />
          : <span className="block h-full w-full animate-pulse bg-gradient-to-br from-well via-hover to-well" />}
      </button>

      {/* select tick: visible on hover, focus, or while multi-selecting */}
      <button type="button" aria-label={selected ? 'Deselect' : 'Add to selection'} onClick={() => clickSelect(rec.id, { metaKey: true })}
        className={cn('absolute top-1 left-1 flex size-6 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-signal',
          selected ? 'bg-signal-strong text-signal-fg opacity-100' : 'bg-scrim text-transparent opacity-0 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.8)] group-hover/tile:opacity-100 group-focus-within/tile:opacity-100',
          multi && 'opacity-100')}>
        <Check size={12} strokeWidth={3} />
      </button>

      <button type="button" aria-label={rec.favourite ? 'Remove from favourites' : 'Favourite'} aria-pressed={!!rec.favourite} onClick={() => toggleFavourite([rec.id])}
        className={cn('absolute top-2 right-2 flex size-7 items-center justify-center rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-signal',
          rec.favourite ? 'text-white opacity-100 drop-shadow-[0_1px_3px_rgba(0,0,0,.5)]' : 'bg-scrim text-white opacity-0 backdrop-blur-md group-hover/tile:opacity-100 group-focus-within/tile:opacity-100')}>
        <Heart size={14} strokeWidth={1.75} fill={rec.favourite ? 'currentColor' : 'none'} />
      </button>

      <div className="pointer-events-none absolute bottom-2 left-2 flex gap-1">
        {rec.params.upscale && <span className="rounded-[5px] bg-scrim px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-md">{rec.params.upscale}×</span>}
        {rec.kind === 'variation' && <span className="rounded-[5px] bg-scrim px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-md">Variation</span>}
        {rec.kind === 'remix' && <span className="rounded-[5px] bg-scrim px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-md">Remix</span>}
      </div>

      <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity group-hover/tile:opacity-100 group-focus-within/tile:opacity-100">
        <Tip label="Variations" shortcut="v"><button type="button" aria-label="Variations" className={glass} onClick={() => variations(rec)}><Sparkles size={14} strokeWidth={1.5} /></button></Tip>
        <Tip label="Upscale 2×" shortcut="u"><button type="button" aria-label="Upscale 2×" className={glass} onClick={() => upscale(rec)}><Maximize2 size={14} strokeWidth={1.5} /></button></Tip>
        <Menu align="end" side="top" trigger={<button type="button" aria-label="More actions" className={glass}><MoreHorizontal size={14} strokeWidth={1.5} /></button>}
          items={[
            { label: 'Open', icon: Expand, shortcut: 'space', onClick: open },
            { label: 'Remix', icon: Wand2, shortcut: 'r', onClick: () => remix(rec) },
            { label: 'Download PNG', icon: Download, onClick: async () => { await exportPNG(rec.params, rec.id); toast('PNG exported', { type: 'success' }) } },
            { label: 'Copy parameters', icon: Copy, onClick: () => copyParams(rec) },
            ...(boards.length ? [{ type: 'submenu' as const, label: 'Add to board', icon: FolderHeart, items: boards.map((b) => ({ label: b.name, checked: !!rec.boards?.includes(b.id), onClick: () => toggleBoard([rec.id], b.id) })) }] : []),
            { type: 'separator' },
            { label: 'Delete', icon: Trash2, danger: true, shortcut: 'backspace', onClick: () => removeWithUndo([rec.id]) },
          ]} />
      </div>
    </div>
  )
})
