/* ---------------------------------------------------------------------------
   ZoomControls — the kit's zoom pill, decoupled from <Stage>'s camera so any
   canvas (React Flow, a map, a 3D viewport) can use it. Same look, same menu.

     <ZoomControls zoom={zoom} onZoom={(z) => rf.zoomTo(z)} onFit={() => rf.fitView()}
       extra={[{ label: 'Zoom to selection', shortcut: 'shift+2', onClick }]} />
--------------------------------------------------------------------------- */
import { Minus, Plus } from 'lucide-react'
import { cn, Menu, type MenuItem } from '@kit'

export function ZoomControls({ zoom, onZoom, onFit, extra = [], className }: { zoom: number; onZoom: (z: number) => void; onFit: () => void; extra?: MenuItem[]; className?: string }) {
  return (
    <div className={cn('cluster flex h-8 items-center gap-0.5 px-1', className)}>
      <button type="button" aria-label="Zoom out" onClick={() => onZoom(zoom / 1.25)} className="flex size-6 items-center justify-center rounded-[5px] text-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"><Minus size={13} /></button>
      <Menu
        side="top"
        align="end"
        trigger={<button type="button" className="h-6 min-w-[46px] rounded-[5px] px-1 tabular text-[11.5px] text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent">{Math.round(zoom * 100)}%</button>}
        items={[
          { label: 'Zoom to fit', shortcut: 'shift+1', onClick: onFit },
          ...extra,
          { type: 'separator' },
          { label: 'Zoom to 50%', onClick: () => onZoom(0.5) },
          { label: 'Zoom to 100%', shortcut: 'shift+0', onClick: () => onZoom(1) },
          { label: 'Zoom to 200%', onClick: () => onZoom(2) },
        ]}
      />
      <button type="button" aria-label="Zoom in" onClick={() => onZoom(zoom * 1.25)} className="flex size-6 items-center justify-center rounded-[5px] text-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"><Plus size={13} /></button>
    </div>
  )
}
