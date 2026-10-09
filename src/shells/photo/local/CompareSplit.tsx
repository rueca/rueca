/* ---------------------------------------------------------------------------
   CompareSplit — the before / after divider (Lightroom's Y view), drawn over
   an artboard. The artifact renders "before" left of `value` and "after" to
   the right; this is only the handle, labels and keyboard access.

     <CompareSplit value={0.5} onChange={setSplit} />

   Drag anywhere on the line or its knob; arrows nudge 1% (Shift 10%),
   Home / End jump to the edges. Labels and knob stay a constant screen size.
--------------------------------------------------------------------------- */
import { useRef } from 'react'
import { useStore } from 'zustand'
import { ChevronsLeftRight } from 'lucide-react'
import { clamp, useCamera } from '@kit'

export function CompareSplit({ value, onChange, before = 'Before', after = 'After' }: { value: number; onChange: (v: number) => void; before?: string; after?: string }) {
  const zoom = useStore(useCamera(), (s) => s.zoom)
  const root = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const at = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect()
    onChange(clamp((e.clientX - r.left) / r.width, 0, 1))
  }
  const s = 1 / zoom
  const chip = 'pointer-events-none absolute top-0 rounded-[5px] bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm'
  return (
    <div ref={root} className="pointer-events-none absolute inset-0">
      <div className={chip} style={{ left: 0, transform: `translate(${10 * s}px, ${10 * s}px) scale(${s})`, transformOrigin: 'top left' }}>{before}</div>
      <div className={chip} style={{ right: 0, transform: `translate(${-10 * s}px, ${10 * s}px) scale(${s})`, transformOrigin: 'top right' }}>{after}</div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before / after divider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); e.stopPropagation() }}
        onPointerMove={(e) => dragging.current && at(e)}
        onPointerUp={() => { dragging.current = false }}
        onKeyDown={(e) => {
          const st = e.shiftKey ? 0.1 : 0.01
          const next = e.key === 'ArrowLeft' ? value - st : e.key === 'ArrowRight' ? value + st : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : null
          if (next === null) return
          e.preventDefault()
          e.stopPropagation()
          onChange(clamp(next, 0, 1))
        }}
        className="group/split pointer-events-auto absolute inset-y-0 cursor-ew-resize outline-none"
        style={{ left: `${value * 100}%`, width: 16 * s, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-white shadow-[0_0_3px_rgba(0,0,0,.5)]" style={{ width: 1.5 * s }} />
        <div className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full bg-white text-black shadow-[0_1px_4px_rgba(0,0,0,.45)] group-focus-visible/split:ring-2 group-focus-visible/split:ring-accent"
          style={{ width: 28, height: 28, transform: `translate(-50%,-50%) scale(${s})` }}>
          <ChevronsLeftRight size={14} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}
