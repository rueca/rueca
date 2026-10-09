/* ---------------------------------------------------------------------------
   CompareSlider — before/after wipe. A on the left of the divider, B on the
   right. Drag anywhere to move the divider; the handle is a focusable
   slider (←/→ 1%, Shift 10%, Home/End), so the comparison never needs a
   drag (WCAG 2.5.7). Double-click centres it.

     <CompareSlider a={<img …/>} b={<img …/>} labelA="Seed 12" labelB="Seed 13" />

   Kit candidate: photo, upscale, A/B preset and before/after shells all need it.
--------------------------------------------------------------------------- */
import { useRef, useState, type ReactNode } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { cn, clamp } from '@kit'

export function CompareSlider({
  a, b, labelA = 'A', labelB = 'B', value: controlled, onChange, className,
}: { a: ReactNode; b: ReactNode; labelA?: ReactNode; labelB?: ReactNode; value?: number; onChange?: (v: number) => void; className?: string }) {
  const [own, setOwn] = useState(0.5)
  const v = controlled ?? own
  const set = (x: number) => { const c = clamp(x, 0, 1); setOwn(c); onChange?.(c) }
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const at = (e: React.PointerEvent) => { const r = root.current!.getBoundingClientRect(); set((e.clientX - r.left) / r.width) }

  return (
    <div
      ref={root}
      className={cn('relative h-full w-full cursor-ew-resize overflow-hidden select-none', className)}
      onPointerDown={(e) => { if (e.button !== 0) return; drag.current = true; root.current!.setPointerCapture(e.pointerId); at(e) }}
      onPointerMove={(e) => drag.current && at(e)}
      onPointerUp={() => { drag.current = false }}
      onDoubleClick={() => set(0.5)}
    >
      <div className="absolute inset-0">{b}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${(1 - v) * 100}% 0 0)` }}>{a}</div>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,.4)]" style={{ left: `${v * 100}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        onKeyDown={(e) => {
          const st = e.shiftKey ? 0.1 : 0.01
          if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); set(v - st) }
          if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); set(v + st) }
          if (e.key === 'Home') set(0)
          if (e.key === 'End') set(1)
        }}
        className="absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_10px_rgba(0,0,0,.35)] outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ left: `${v * 100}%` }}
      >
        <ChevronsLeftRight size={14} strokeWidth={1.75} />
      </div>
      <span className="pointer-events-none absolute top-3 left-3 rounded-[6px] bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{labelA}</span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-[6px] bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{labelB}</span>
    </div>
  )
}
