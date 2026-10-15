/* ---------------------------------------------------------------------------
   CompareSplit — before / after. One component for the three ways tools
   compare (Lightroom's Y view, Photoshop's split preview, Midjourney's wipe):

     // 1. wipe: you hand it both pictures
     <CompareSplit before={<img src={a} />} after={<canvas … />} value={pos} onChange={setPos} />

     // 2. handle only: your renderer draws the split itself (a shader reading `value`)
     <CompareSplit value={split} onChange={setSplit} />

     // 3. side by side
     <CompareSplit layout="side" before={…} after={…} />

   Hold-to-peek (Lightroom's `\`): `peekKey="\\"` shows the before picture in
   full while the key is held — or drive `peek` yourself (a held toolbar
   button). `split={false}` hides the divider but keeps the peek, for tools
   whose before/after split is a toggle.

   Behaviour / keyboard: the divider is a real slider — focusable, ← / → 1%
   (Shift 10%), Home / End, double-click centres it. Drag the divider, or
   anywhere with `dragAnywhere`. `onChange(v, final)` reports final=true on
   release so owners can commit once.

   Inside a <Stage> it reads the camera zoom so the handle and labels stay a
   constant screen size on a zoomed artboard; pass `zoom` to override.
   Labels sit on the image scrim token. Fills its (sized) parent.
   Accessibility: role="slider" with aria-valuetext ("40% before").
   (Promoted from shells/photo/local/CompareSplit.tsx and
   shells/dither/local/BeforeAfter.tsx; covers generate's CompareSlider.)
--------------------------------------------------------------------------- */
import { useRef, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { ChevronsLeftRight } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import { useHoldKey } from '../core/hotkeys'
import { createCamera, useCamera } from './Stage'

const NO_CAMERA = createCamera()

export interface CompareSplitProps {
  /** divider position 0–1 (controlled) */
  value?: number
  defaultValue?: number
  onChange?: (v: number, final: boolean) => void
  /** omit both for a handle-only overlay */
  before?: ReactNode
  after?: ReactNode
  layout?: 'wipe' | 'side'
  /** show the divider (default true); false keeps peek working */
  split?: boolean
  labels?: [ReactNode, ReactNode] | false
  /** show the before picture in full */
  peek?: boolean
  /** hold this key to peek (kit useHoldKey); default off */
  peekKey?: string | false
  onPeekChange?: (held: boolean) => void
  peekLabel?: ReactNode
  /** world → screen scale for constant-size handles; defaults to the Stage camera */
  zoom?: number
  /** pointer-down anywhere moves the divider (a standalone viewer) */
  dragAnywhere?: boolean
  label?: string
  className?: string
}

export function CompareSplit({
  value: controlled, defaultValue = 0.5, onChange, before, after, layout = 'wipe', split = true, labels = ['Before', 'After'],
  peek: peekProp, peekKey = false, onPeekChange, peekLabel = 'Original', zoom: zoomProp, dragAnywhere, label = 'Before / after divider', className,
}: CompareSplitProps) {
  const [own, setOwn] = useState(defaultValue)
  const [held, setHeld] = useState(false)
  const v = controlled ?? own
  const set = (x: number, final: boolean) => { const c = clamp(x, 0, 1); setOwn(c); onChange?.(c, final) }
  useHoldKey(peekKey || '', (down) => { setHeld(down); onPeekChange?.(down) }, { enabled: !!peekKey })
  const peek = !!peekProp || held

  const cam = useCamera() ?? NO_CAMERA
  const camZoom = useStore(cam, (s) => s.zoom)
  const k = 1 / (zoomProp ?? camZoom)

  const box = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const at = (clientX: number) => { const r = box.current!.getBoundingClientRect(); return (clientX - r.left) / r.width }
  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    drag.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    set(at(e.clientX), false)
  }
  const move = (e: React.PointerEvent) => { if (drag.current) set(at(e.clientX), false) }
  const up = (e: React.PointerEvent) => { if (!drag.current) return; drag.current = false; set(at(e.clientX), true) }

  const chip = (text: ReactNode, side: 'left' | 'right') => (
    <div className="pointer-events-none absolute top-0 z-[2] no-select" style={{ [side]: 0, transform: `scale(${k})`, transformOrigin: `top ${side}` }}>
      <span className="m-2 inline-block rounded-[6px] bg-scrim px-2 py-0.5 text-ui font-medium whitespace-nowrap text-white backdrop-blur-sm">{text}</span>
    </div>
  )

  if (layout === 'side')
    return (
      <div className={cn('grid size-full grid-cols-2 gap-px', className)}>
        {[before, after].map((node, i) => (
          <div key={i} className="relative min-w-0 overflow-hidden">
            {node}
            {labels && chip(labels[i], 'left')}
          </div>
        ))}
      </div>
    )

  const content = before !== undefined || after !== undefined
  const showDivider = split && !peek
  const clip = peek ? 'none' : split ? `inset(0 ${(1 - v) * 100}% 0 0)` : 'inset(0 100% 0 0)'

  return (
    <div
      ref={box}
      className={cn('absolute inset-0', content ? 'overflow-hidden' : 'pointer-events-none', dragAnywhere && split && 'cursor-ew-resize touch-none', className)}
      onPointerDown={dragAnywhere && split ? down : undefined}
      onPointerMove={dragAnywhere ? move : undefined}
      onPointerUp={dragAnywhere ? up : undefined}
      onDoubleClick={dragAnywhere ? () => set(0.5, true) : undefined}
    >
      {content && (
        <>
          <div className="absolute inset-0">{after}</div>
          <div className="absolute inset-0" style={{ clipPath: clip }}>{before}</div>
        </>
      )}
      {peek && peekLabel && chip(peekLabel, 'left')}
      {showDivider && (
        <>
          {labels && v > 0.08 && chip(labels[0], 'left')}
          {labels && v < 0.92 && chip(labels[1], 'right')}
          <div
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(v * 100)}
            aria-valuetext={`${Math.round(v * 100)}% before`}
            className="group/split pointer-events-auto absolute inset-y-0 z-[3] -translate-x-1/2 cursor-ew-resize touch-none outline-none"
            style={{ left: `${v * 100}%`, width: 24 * k }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onDoubleClick={(e) => { e.stopPropagation(); set(0.5, true) }}
            onKeyDown={(e) => {
              const st = e.shiftKey ? 0.1 : 0.01
              const next = e.key === 'ArrowLeft' ? v - st : e.key === 'ArrowRight' ? v + st : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : null
              if (next === null) return
              e.preventDefault()
              e.stopPropagation()
              set(next, true)
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-white shadow-[0_0_0_0.5px_var(--scrim)]" style={{ width: 1.5 * k }} />
            <div className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full bg-white text-black shadow-[0_2px_8px_var(--scrim)] group-focus-visible/split:ring-2 group-focus-visible/split:ring-signal"
              style={{ width: 28, height: 28, transform: `translate(-50%, -50%) scale(${k})` }}>
              <ChevronsLeftRight size={14} strokeWidth={1.75} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
