/* ---------------------------------------------------------------------------
   TransformBox (kit candidate) — the on-canvas selection frame.

     <TransformBox rect={screenRect} rotation={deg} badge="342 × 220"
       onHandle={(h, e) => startResize(e, h)} onRotate={startRotate} />

   Screen-space, so lines stay 1px and handles stay 8px at any zoom.
   Figma conventions: accent outline, eight white square handles (edge
   handles hide when the box is too small to grab them), invisible rotation
   zones just outside each corner, and a W × H badge centred below.
   Every drag here has a typed equivalent in the inspector (WCAG 2.5.7).
--------------------------------------------------------------------------- */
import type { CSSProperties, ReactNode } from 'react'

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const CURSOR: Record<Handle, string> = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' }

export function TransformBox({
  rect, rotation = 0, badge, onHandle, onRotate, handles = true, tone = 'var(--accent)', children,
}: {
  rect: { x: number; y: number; w: number; h: number }
  rotation?: number
  badge?: ReactNode
  onHandle?: (h: Handle, e: React.PointerEvent) => void
  onRotate?: (e: React.PointerEvent) => void
  handles?: boolean
  tone?: string
  children?: ReactNode
}) {
  const { x, y, w, h } = rect
  const small = w < 24 || h < 24
  const pos: Record<Handle, [number, number]> = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] }
  const list = (Object.keys(pos) as Handle[]).filter((k) => !small || k.length === 2)
  const wrap: CSSProperties = { position: 'absolute', left: x, top: y, width: w, height: h, transform: rotation ? `rotate(${-rotation}deg)` : undefined, transformOrigin: 'center' }
  return (
    <div style={wrap} className="pointer-events-none">
      <div className="absolute inset-0" style={{ boxShadow: `0 0 0 1px ${tone}` }} />
      {handles && onRotate && (['nw', 'ne', 'se', 'sw'] as Handle[]).map((k) => (
        <div key={`r${k}`} onPointerDown={onRotate} className="pointer-events-auto absolute size-[18px]"
          style={{ left: pos[k][0] * w - 9 + (pos[k][0] ? 9 : -9), top: pos[k][1] * h - 9 + (pos[k][1] ? 9 : -9), cursor: 'grab' }} aria-hidden />
      ))}
      {handles && onHandle && list.map((k) => (
        <div key={k} onPointerDown={(e) => onHandle(k, e)} aria-hidden
          className="pointer-events-auto absolute flex size-[14px] -translate-1/2 items-center justify-center"
          style={{ left: pos[k][0] * w, top: pos[k][1] * h, cursor: CURSOR[k] }}>
          <div className="size-[8px] rounded-[1.5px] bg-white" style={{ boxShadow: `0 0 0 1px ${tone}, 0 1px 2px rgba(0,0,0,.25)` }} />
        </div>
      ))}
      {badge != null && (
        <div className="absolute left-1/2 whitespace-nowrap rounded-[4px] bg-accent-strong px-1.5 py-px tabular text-[10.5px] font-medium text-accent-fg" style={{ top: h + 8, transform: `translateX(-50%) rotate(${rotation}deg)` }}>
          {badge}
        </div>
      )}
      {children}
    </div>
  )
}
