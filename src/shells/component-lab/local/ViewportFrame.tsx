/* ---------------------------------------------------------------------------
   ViewportFrame (kit candidate) — a responsive preview frame: Storybook's
   viewport addon + Framer breakpoints + Chrome's device mode in one.

     <ViewportFrame width={w} onWidth={(w, final) => …}
       presets={[{ label: 'Mobile', width: 375, icon: Smartphone }, …]}>
       <App />
     </ViewportFrame>

   - centred frame; drag either edge handle (symmetric, like device mode)
   - a ruler with breakpoint ticks; click a tick to jump to it
   - typed width field + preset segmented control (non-drag path, WCAG 2.5.7)
   - frames wider than the stage scale down to fit and say so ("64%")
   - the frame is a size container, so CSS container queries respond to it
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ScrubValue, Segmented, Tip, cn, clamp } from '@kit'

export interface ViewportPreset { label: string; width: number; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }

export function ViewportFrame({
  width, onWidth, presets = [], min = 280, max = 1600, minHeight = 420, background, className, children, toolbar,
}: {
  width: number
  onWidth: (w: number, final: boolean) => void
  presets?: ViewportPreset[]
  min?: number
  max?: number
  minHeight?: number
  background?: string
  className?: string
  children: ReactNode
  /** extra controls on the right of the frame's header */
  toolbar?: ReactNode
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(1000)
  const [drag, setDrag] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const [innerH, setInnerH] = useState(minHeight)
  useLayoutEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => setInnerH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail(el.clientWidth - 48))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = Math.min(1, avail / width)
  const active = presets.find((p) => p.width === width)?.label ?? ''

  const startDrag = (e: React.PointerEvent, side: -1 | 1) => {
    e.preventDefault()
    const x0 = e.clientX, w0 = width
    setDrag(true)
    const mv = (ev: PointerEvent) => onWidth(Math.round(clamp(w0 + ((ev.clientX - x0) * 2 * side) / scale, min, max)), false)
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up)
      setDrag(false)
      onWidth(Math.round(clamp(w0 + ((ev.clientX - x0) * 2 * side) / scale, min, max)), true)
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onWidth(clamp(width + step, min, max), true) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onWidth(clamp(width - step, min, max), true) }
  }
  const handle = (side: -1 | 1) => (
    <div role="slider" aria-label="Viewport width" aria-valuenow={width} aria-valuemin={min} aria-valuemax={max} tabIndex={0}
      onPointerDown={(e) => startDrag(e, side)} onKeyDown={key}
      className={cn('group/h absolute top-0 bottom-0 z-10 flex w-4 cursor-ew-resize items-center justify-center outline-none', side < 0 ? '-left-4' : '-right-4')}>
      <div className={cn('h-12 w-1 rounded-full bg-line-strong transition-colors group-hover/h:bg-accent group-focus-visible/h:bg-accent', drag && 'bg-accent')} />
    </div>
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex flex-none items-center justify-center gap-2 px-4 pt-3 pb-2">
        {presets.length > 0 && (
          <div className="w-[260px]">
            <Segmented size="sm" value={active} onChange={(l) => { const p = presets.find((x) => x.label === l); if (p) onWidth(p.width, true) }}
              options={presets.map((p) => ({ value: p.label, label: p.label, icon: p.icon, hint: `${p.label} · ${p.width}px` }))} label="Viewport" />
          </div>
        )}
        <ScrubValue boxed value={width} min={min} max={max} step={1} unit="px" label="Viewport width" onChange={(v, f) => onWidth(v, f)} className="w-[76px]" />
        {scale < 1 && <Tip label="The frame is wider than the stage and is shown scaled down"><span className="tabular text-[11px] text-faint">{Math.round(scale * 100)}%</span></Tip>}
        {toolbar}
      </div>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full items-start justify-center px-6 pt-6 pb-16">
          <div className="relative" style={{ width: width * scale }}>
            {/* ruler with breakpoint ticks */}
            <div className="relative mb-2 h-5 tabular text-[10.5px] text-faint no-select">
              <div className="absolute inset-x-0 top-2.5 h-px bg-line" />
              {presets.filter((p) => p.width < width).flatMap((p) => [-1, 1].map((side) => {
                const x = (width / 2 + (side * p.width) / 2) * scale
                return (
                  <Tip key={p.label + side} label={`${p.label} · ${p.width}px`}>
                    <button type="button" onClick={() => onWidth(p.width, true)} className="absolute top-0 h-5 w-3 -translate-x-1/2" style={{ left: x }} aria-label={`${p.label} breakpoint`}>
                      <span className="absolute top-1.5 left-1/2 h-2 w-px -translate-x-1/2 bg-line-strong" />
                    </button>
                  </Tip>
                )
              }))}
              <div className={cn('absolute left-1/2 -translate-x-1/2 rounded-[4px] px-1.5 leading-5', drag ? 'bg-accent-strong text-accent-fg' : 'bg-field text-muted')}>{width}px</div>
            </div>
            <div className="relative" style={{ height: scale < 1 ? innerH * scale : undefined }}>
              {handle(-1)}
              {handle(1)}
              <div ref={frame} className="origin-top-left overflow-hidden rounded-[10px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
                style={{ width, minHeight, transform: scale < 1 ? `scale(${scale})` : undefined, background, containerType: 'inline-size' }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
