/* ---------------------------------------------------------------------------
   ViewportFrame — a responsive preview frame: Storybook's viewport addon +
   Framer breakpoints + Chrome device mode in one.

     <ViewportFrame width={w} onWidth={(w, final) => setW(w)}
       presets={[{ label: 'Mobile', width: 375, icon: Smartphone }, …]}
       toolbar={<ThemeSwitch />}>
       <App />
     </ViewportFrame>

   Behaviour
     · centred frame; drag either edge handle — symmetric, like device mode
       (pointer-captured, so iframes inside never steal the drag)
     · a ruler with breakpoint ticks for every preset narrower than the frame;
       click a tick to jump to it; the live width rides the ruler
     · typed width field + preset segmented control (the non-drag path)
     · frames wider than the stage scale down to fit and say so ("64%")
     · the frame is a CSS size container (`container-type: inline-size`), so
       container queries inside respond to it exactly like a viewport
   Keyboard: each handle is role="slider" — ← → ±1 px (shift ±10), PgUp / PgDn
   ±100, Home / End min / max. Reports final=false mid-drag, true on release.
   Use it inside <Stage fill> or any full-height box; it scrolls vertically.
   `chrome={false}` drops the header row when the shell's own toolbar carries
   the width controls; presets go icon-only when the stage is narrow.
   (Promoted from shells/component-lab/local/ViewportFrame.tsx.)
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { clamp, cn } from '../core/cn'
import { ScrubValue } from '../ui/scrub'
import { Segmented } from '../ui/controls'
import { Tip } from '../ui/tooltip'

export interface ViewportPreset { label: string; width: number; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }

export function ViewportFrame({
  width, onWidth, presets = [], min = 280, max = 1600, minHeight = 420, background, label = 'Viewport', toolbar, chrome = true, frameClassName, frameStyle, className, children,
}: {
  width: number
  onWidth: (w: number, final: boolean) => void
  presets?: ViewportPreset[]
  min?: number
  max?: number
  minHeight?: number
  /** frame background (the artifact's, so any colour is fine here) */
  background?: string
  /** accessible name of the width controls */
  label?: string
  /** extra controls at the end of the header row */
  toolbar?: ReactNode
  /** false = no header row (presets, width field, toolbar) — drive `width` from your own toolbar */
  chrome?: boolean
  frameClassName?: string
  frameStyle?: CSSProperties
  className?: string
  children: ReactNode
}) {
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(1000)
  const [innerH, setInnerH] = useState(minHeight)
  const [drag, setDrag] = useState<{ x0: number; w0: number; side: -1 | 1 } | null>(null)
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
  const scale = Math.min(1, Math.max(0.1, avail / width))
  const active = presets.find((p) => p.width === width)?.label ?? ''
  // narrow stage: icon-only presets so the header never clips (QA F10)
  const iconOnly = avail < 720 && presets.length > 0 && presets.every((p) => p.icon)
  const widthAt = (clientX: number, d: NonNullable<typeof drag>) => Math.round(clamp(d.w0 + ((clientX - d.x0) * 2 * d.side) / scale, min, max))

  const handle = (side: -1 | 1) => (
    <div role="slider" aria-label={`${label} width`} aria-valuenow={width} aria-valuemin={min} aria-valuemax={max} aria-valuetext={`${width} pixels`} tabIndex={0}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDrag({ x0: e.clientX, w0: width, side }) }}
      onPointerMove={(e) => { if (drag && e.currentTarget.hasPointerCapture(e.pointerId)) onWidth(widthAt(e.clientX, drag), false) }}
      onPointerUp={(e) => { if (!drag) return; onWidth(widthAt(e.clientX, drag), true); setDrag(null) }}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        const step: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 100, PageDown: -100 }
        if (e.key in step) onWidth(clamp(width + step[e.key] * (e.shiftKey && Math.abs(step[e.key]) === 1 ? 10 : 1), min, max), true)
        else if (e.key === 'Home') onWidth(min, true)
        else if (e.key === 'End') onWidth(max, true)
        else return
        e.preventDefault()
        e.stopPropagation()
      }}
      className={cn('group/h absolute top-0 bottom-0 z-10 flex w-4 cursor-ew-resize touch-none items-center justify-center outline-none', side < 0 ? '-left-4' : '-right-4')}>
      <div className={cn('h-12 w-1 rounded-full bg-line-strong transition-colors group-hover/h:bg-signal group-focus-visible/h:bg-signal', drag && 'bg-signal')} />
    </div>
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {chrome && <div className="flex flex-none items-center justify-center gap-2 px-4 pt-3 pb-2">
        {presets.length > 0 && (
          <div style={{ width: iconOnly ? presets.length * 30 : Math.min(360, presets.length * 88) }}>
            <Segmented size="sm" value={active} label={`${label} preset`} iconOnly={iconOnly}
              onChange={(l) => { const p = presets.find((x) => x.label === l); if (p) onWidth(p.width, true) }}
              options={presets.map((p) => ({ value: p.label, label: p.label, icon: p.icon, hint: `${p.label} · ${p.width}px` }))} />
          </div>
        )}
        <ScrubValue boxed value={width} min={min} max={max} step={1} unit="px" label={`${label} width`} onChange={(v, f) => onWidth(v, f)} className="w-[76px]" />
        {scale < 1 && <Tip label="The frame is wider than the stage and is shown scaled down"><span className="tabular text-[11px] text-fg-faint">{Math.round(scale * 100)}%</span></Tip>}
        {toolbar}
      </div>}
      <div ref={stage} className="relative min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full items-start justify-center px-6 pt-6 pb-16">
          <div className="relative" style={{ width: width * scale }}>
            <div className="relative mb-2 h-5 tabular text-[10.5px] text-fg-faint no-select">
              <div className="absolute inset-x-0 top-2.5 h-px bg-line" />
              {presets.filter((p) => p.width < width).flatMap((p) => [-1, 1].map((side) => (
                <Tip key={p.label + side} label={`${p.label} · ${p.width}px`}>
                  <button type="button" onClick={() => onWidth(p.width, true)} aria-label={`${p.label} breakpoint, ${p.width} pixels`} tabIndex={side < 0 ? 0 : -1}
                    className="absolute top-0 h-5 w-3 -translate-x-1/2 rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-signal"
                    style={{ left: (width / 2 + (side * p.width) / 2) * scale }}>
                    <span className="absolute top-1.5 left-1/2 h-2 w-px -translate-x-1/2 bg-line-strong" />
                  </button>
                </Tip>
              )))}
              <div className={cn('absolute left-1/2 -translate-x-1/2 rounded-[4px] px-1.5 leading-5', drag ? 'bg-signal-strong text-signal-fg' : 'bg-field text-fg-muted')}>{width}px</div>
            </div>
            <div className="relative" style={{ height: scale < 1 ? innerH * scale : undefined }}>
              {handle(-1)}
              {handle(1)}
              <div ref={frame} data-studio-artifact
                className={cn('origin-top-left overflow-hidden rounded-[10px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]', drag && 'pointer-events-none', frameClassName)}
                style={{ width, minHeight, transform: scale < 1 ? `scale(${scale})` : undefined, background, containerType: 'inline-size', ...frameStyle }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
