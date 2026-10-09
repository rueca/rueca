/* ---------------------------------------------------------------------------
   AlignGrid (kit candidate) — the 3×3 alignment pad from Figma auto layout /
   Rive layouts. Spatial: the cell you click is where the content sits,
   whatever the direction. The active cell draws bars oriented to `dir`,
   so the pad also previews the flow. Arrow keys move the active cell.

     <AlignGrid x="start" y="center" dir="row" onChange={(x, y) => …} />
--------------------------------------------------------------------------- */
import { cn } from '@kit'

type A = 'start' | 'center' | 'end'
const AX: A[] = ['start', 'center', 'end']

export function AlignGrid({ x, y, dir = 'row', onChange, between, className }: { x: A; y: A; dir?: 'row' | 'column'; onChange: (x: A, y: A) => void; between?: boolean; className?: string }) {
  const onKey = (e: React.KeyboardEvent) => {
    const xi = AX.indexOf(x), yi = AX.indexOf(y)
    const k = e.key
    if (k === 'ArrowLeft' && xi > 0) onChange(AX[xi - 1], y)
    else if (k === 'ArrowRight' && xi < 2) onChange(AX[xi + 1], y)
    else if (k === 'ArrowUp' && yi > 0) onChange(x, AX[yi - 1])
    else if (k === 'ArrowDown' && yi < 2) onChange(x, AX[yi + 1])
    else return
    e.preventDefault()
  }
  return (
    <div role="radiogroup" aria-label="Alignment" tabIndex={0} onKeyDown={onKey}
      className={cn('grid size-[64px] shrink-0 grid-cols-3 grid-rows-3 rounded-[6px] bg-control p-1 outline-none focus-visible:ring-2 focus-visible:ring-signal', className)}>
      {AX.map((cy) => AX.map((cx) => {
        // with space-between, the whole main axis is "on" for the cross position
        const on = between ? (dir === 'row' ? cy === y : cx === x) : cx === x && cy === y
        return (
          <button key={`${cx}${cy}`} type="button" tabIndex={-1} role="radio" aria-checked={on} aria-label={`${cy === 'center' ? 'middle' : cy === 'start' ? 'top' : 'bottom'} ${cx === 'center' ? 'centre' : cx === 'start' ? 'left' : 'right'}`}
            onClick={() => onChange(cx, cy)}
            className="group/cell flex items-center justify-center rounded-[3px] outline-none hover:bg-hover">
            {on ? (
              <span className={cn('flex gap-[2px]', dir === 'row' ? 'flex-row' : 'flex-col', dir === 'row' ? (cy === 'start' ? 'items-start' : cy === 'end' ? 'items-end' : 'items-center') : (cx === 'start' ? 'items-start' : cx === 'end' ? 'items-end' : 'items-center'))}>
                {[0.6, 1, 0.75].map((k, i) => (
                  <span key={i} className="rounded-[1px] bg-signal" style={dir === 'row' ? { width: 2, height: 9 * k } : { height: 2, width: 9 * k }} />
                ))}
              </span>
            ) : (
              <span className="size-[3px] rounded-full bg-fg-faint opacity-60 group-hover/cell:opacity-100" />
            )}
          </button>
        )
      }))}
    </div>
  )
}
