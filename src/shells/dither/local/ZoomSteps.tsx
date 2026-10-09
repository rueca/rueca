/* ---------------------------------------------------------------------------
   ZoomSteps — a zoom pill for pixel work: integer steps only (25 … 3200%),
   so nearest-neighbour pixels stay square and crisp. The kit's ZoomPill
   multiplies by a fixed `step`, so from a fit zoom (63%) it lands on
   fractional zooms (79%, 98%…) where pixels shimmer. Kit gap: ZoomPill
   needs a `steps` ladder (snap to the next / previous rung) to replace this.

     <Stage hud={false} overlay={<ZoomSteps />}>…</Stage>

   Must render inside <Stage> (uses useCamera). Keys: Shift+0 100%,
   Shift+1 fit (from Stage), plus `-` / `=` step through the ladder here.
--------------------------------------------------------------------------- */
import { useStore } from 'zustand'
import { Minus, Plus } from 'lucide-react'
import { cn, Menu, useCamera, useHotkeys } from '@kit'

const LADDER = [0.125, 0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32]

export function ZoomSteps({ className }: { className?: string }) {
  const cam = useCamera()
  const zoom = useStore(cam, (s) => s.zoom)
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? LADDER.find((z) => z > zoom * 1.001) : [...LADDER].reverse().find((z) => z < zoom * 0.999)
    if (next) { cam.touch(); cam.zoomTo(next) }
  }
  useHotkeys({
    '=': { run: () => step(1), label: 'Zoom in (pixel steps)', group: 'View' },
    '-': { run: () => step(-1), label: 'Zoom out (pixel steps)', group: 'View' },
  }, [zoom])
  const btn = 'flex size-6 items-center justify-center rounded-[5px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal'
  return (
    <div className={cn('cluster absolute right-3 bottom-3 z-10 flex h-8 items-center gap-0.5 px-1', className)}>
      <button type="button" aria-label="Zoom out" title="Zoom out (−)" onClick={() => step(-1)} className={btn}><Minus size={13} strokeWidth={1.5} /></button>
      <Menu
        side="top"
        align="end"
        trigger={<button type="button" aria-label="Zoom level" className="h-6 min-w-[50px] rounded-[5px] px-1 tabular text-[11.5px] text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">{Math.round(zoom * 100)}%</button>}
        items={[
          { label: 'Zoom to fit', shortcut: 'shift+1', onClick: () => { cam.untouch(); cam.fit() } },
          { type: 'separator' },
          ...[0.5, 1, 2, 4, 8, 16].map((z) => ({ label: `${z * 100}%`, shortcut: z === 1 ? 'shift+0' : undefined, checked: Math.abs(zoom - z) < 0.001, onClick: () => { cam.touch(); cam.zoomTo(z) } })),
        ]}
      />
      <button type="button" aria-label="Zoom in" title="Zoom in (=)" onClick={() => step(1)} className={btn}><Plus size={13} strokeWidth={1.5} /></button>
    </div>
  )
}
