/* ---------------------------------------------------------------------------
   SplitPane — two panes side by side with a draggable gutter.

     <SplitPane id="nodes" a={<Graph />} b={<Preview />} show="both" />

   The gutter is the studio gutter (--gutter), so islands keep their rhythm;
   a grip appears on hover and turns accent while dragging. Keyboard: focus
   the gutter, ←/→ move 2% (Shift 10%), Home/End to the limits, Enter or
   double-click resets to the default. `show="a" | "b"` collapses to one pane
   without unmounting either (state and canvases survive). Ratio persists
   per `id`.

   Kit candidate: the kit has no resizable split (Studio panel widths are
   fixed props).
--------------------------------------------------------------------------- */
import { useRef, useState, type ReactNode } from 'react'
import { cn, clamp } from '@kit'

export function SplitPane({
  id, a, b, show = 'both', defaultRatio = 0.55, min = 0.2, max = 0.8, className, label = 'Resize panes',
}: { id: string; a: ReactNode; b: ReactNode; show?: 'both' | 'a' | 'b'; defaultRatio?: number; min?: number; max?: number; className?: string; label?: string }) {
  const key = `studio:${id}:split`
  const [ratio, setRatioState] = useState(() => { try { const v = Number(localStorage.getItem(key)); return v > 0 && v < 1 ? v : defaultRatio } catch { return defaultRatio } })
  const [drag, setDrag] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const setRatio = (r: number) => { const v = clamp(r, min, max); setRatioState(v); try { localStorage.setItem(key, String(v)) } catch { /* noop */ } }

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag(true)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag || !root.current) return
    const r = root.current.getBoundingClientRect()
    setRatio((e.clientX - r.left) / r.width)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02
    if (e.key === 'ArrowLeft') { e.preventDefault(); setRatio(ratio - step) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setRatio(ratio + step) }
    else if (e.key === 'Home') setRatio(min)
    else if (e.key === 'End') setRatio(max)
    else if (e.key === 'Enter') setRatio(defaultRatio)
  }

  const both = show === 'both'
  return (
    <div ref={root} className={cn('flex h-full w-full min-w-0', drag && 'cursor-col-resize select-none', className)}>
      <div className={cn('relative min-w-0', show === 'b' && 'hidden')} style={{ flex: both ? `${ratio} 1 0` : '1 1 0' }}>{a}</div>
      {both && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={label}
          aria-valuenow={Math.round(ratio * 100)}
          aria-valuemin={Math.round(min * 100)}
          aria-valuemax={Math.round(max * 100)}
          tabIndex={0}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(false)}
          onDoubleClick={() => setRatio(defaultRatio)}
          onKeyDown={onKey}
          className="group/split relative flex w-[var(--gutter)] shrink-0 cursor-col-resize items-center justify-center outline-none"
        >
          <span className={cn('h-10 w-[3px] rounded-full transition-colors', drag ? 'bg-accent' : 'bg-transparent group-hover/split:bg-line-strong group-focus-visible/split:bg-accent')} />
        </div>
      )}
      <div className={cn('relative min-w-0', show === 'a' && 'hidden')} style={{ flex: both ? `${1 - ratio} 1 0` : '1 1 0' }}>{b}</div>
    </div>
  )
}
