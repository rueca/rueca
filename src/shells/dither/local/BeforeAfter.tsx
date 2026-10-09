/* ---------------------------------------------------------------------------
   BeforeAfter — Lightroom-style comparison inside an artboard.

     <BeforeAfter
       before={<canvas … />} after={<canvas … />}
       split={splitOn} pos={0.5} onPos={(p, final) => …}
       peek={holdingBackslash}                // show the original fully
       zoom={camera.zoom}                     // keeps the handle a constant screen size
     />

   The divider is a real slider: focusable, ←/→ nudge 2% (Shift 10%), Home/End.
   Drag anywhere on the divider; the handle and labels never scale with zoom.
   Children fill the box, so the wrapper must be sized (an Artboard is).
--------------------------------------------------------------------------- */
import { useRef, type ReactNode } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { clamp, cn } from '@kit'

export function BeforeAfter({
  before, after, split, pos, onPos, peek, zoom = 1, labels = ['Before', 'After'], className,
}: {
  before: ReactNode
  after: ReactNode
  split: boolean
  pos: number
  onPos: (p: number, final: boolean) => void
  peek?: boolean
  zoom?: number
  labels?: [string, string]
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const k = 1 / zoom
  const at = (clientX: number) => { const r = box.current!.getBoundingClientRect(); return clamp((clientX - r.left) / r.width, 0, 1) }
  const clip = peek ? 'none' : split ? `inset(0 ${(1 - pos) * 100}% 0 0)` : 'inset(0 100% 0 0)'

  const chip = (text: string, side: 'left' | 'right') => (
    <div className="pointer-events-none absolute top-0 z-[2] no-select" style={{ [side]: 0, transform: `scale(${k})`, transformOrigin: `top ${side}` }}>
      <span className="m-2 inline-block rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">{text}</span>
    </div>
  )

  return (
    <div ref={box} className={cn('relative size-full', className)}>
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: clip }}>{before}</div>
      {peek && chip('Original', 'left')}
      {split && !peek && (
        <>
          {pos > 0.08 && chip(labels[0], 'left')}
          {pos < 0.92 && chip(labels[1], 'right')}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before / after divider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos * 100)}
            aria-valuetext={`${Math.round(pos * 100)}% original`}
            className="group/div absolute inset-y-0 z-[3] -translate-x-1/2 cursor-ew-resize touch-none outline-none"
            style={{ left: `${pos * 100}%`, width: 24 * k }}
            onPointerDown={(e) => { if (e.button !== 0) return; e.stopPropagation(); dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); onPos(at(e.clientX), false) }}
            onPointerMove={(e) => { if (dragging.current) onPos(at(e.clientX), false) }}
            onPointerUp={(e) => { if (!dragging.current) return; dragging.current = false; onPos(at(e.clientX), true) }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.1 : 0.02
              if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); onPos(clamp(pos - step, 0, 1), true) }
              if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); onPos(clamp(pos + step, 0, 1), true) }
              if (e.key === 'Home') { e.preventDefault(); onPos(0, true) }
              if (e.key === 'End') { e.preventDefault(); onPos(1, true) }
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.35)]" style={{ width: 1.5 * k }} />
            <div className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,.45)] transition-transform group-focus-visible/div:ring-2 group-focus-visible/div:ring-accent"
              style={{ width: 28 * k, height: 28 * k, transform: 'translate(-50%, -50%)' }}>
              <ChevronsLeftRight size={14 * k} strokeWidth={1.75} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
