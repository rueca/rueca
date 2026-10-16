/* ---------------------------------------------------------------------------
   TransformBox — the on-canvas selection frame (Figma / Framer / Affinity).

     <TransformBox rect={screenRect} rotation={deg} badge="342 × 220"
       onHandle={(h, e) => startResize(e, h)} onRotate={startRotate} />

     // the maths, renderer-agnostic — call it from your pointermove:
     const r = resizeRect(start, h, dx, dy, { aspect: e.shiftKey, fromCenter: e.altKey })

   Screen space: put it in a Stage `overlay` (or any absolutely positioned
   layer over the canvas) with `rect` already multiplied by the camera, so
   the outline stays 1 px and the handles stay `handleSize` px at any zoom.

   Behaviour
     8 square handles     → onHandle(handle, e). Edge handles hide when the
                            box is too small to grab them (corners stay).
     just outside corners → onRotate(e) — invisible rotation zones, as in Figma
     badge                → W × H (or X, Y while moving) centred below, kept
                            upright when the box is rotated
     resizeRect()         → shift = keep aspect ratio, alt = from centre,
                            optional `snap` between the two (Figma order:
                            aspect wins over snapping), never below `min`
     rotateDelta()        → angle from the centre; shift snaps to 15°

   Accessibility: handles are pointer affordances only (aria-hidden). Every
   drag here MUST have a typed equivalent in the inspector — X/Y/W/H/rotation
   fields — which is the WCAG 2.5.7 non-drag path. `label` names the frame
   for assistive tech (role="group").
   Rotation is CSS-clockwise degrees; pass `-deg` for counter-clockwise models.
   (Promoted from shells/ui-design/local/TransformBox.tsx.)
--------------------------------------------------------------------------- */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../core/cn'

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export interface ScreenRect { x: number; y: number; w: number; h: number }
export interface Edges { l: number; t: number; r: number; b: number }

export const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
}
const POS: Record<Handle, [number, number]> = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] }
const CORNERS: Handle[] = ['nw', 'ne', 'se', 'sw']

export interface TransformBoxProps {
  rect: ScreenRect
  /** degrees, CSS clockwise */
  rotation?: number
  /** W × H while idle, X, Y while moving — whatever helps; null hides it */
  badge?: ReactNode
  onHandle?: (h: Handle, e: React.PointerEvent) => void
  onRotate?: (e: React.PointerEvent) => void
  /** false hides the handles (mid-move) but keeps the outline */
  handles?: boolean
  /** which handles to offer (default all eight) */
  only?: Handle[]
  /** outline / handle-border colour (default the accent) */
  tone?: string
  /** handle square in screen px (default 8) */
  handleSize?: number
  /** below this many screen px either side, edge handles hide (default 24) */
  minGrab?: number
  label?: string
  className?: string
  children?: ReactNode
}

export function TransformBox({
  rect, rotation = 0, badge, onHandle, onRotate, handles = true, only, tone = 'var(--signal)', handleSize = 8, minGrab = 24, label = 'Selection', className, children,
}: TransformBoxProps) {
  const { x, y, w, h } = rect
  const small = w < minGrab || h < minGrab
  const list = (only ?? (Object.keys(POS) as Handle[])).filter((k) => !small || k.length === 2)
  const hit = Math.max(14, handleSize + 6)
  const wrap: CSSProperties = { position: 'absolute', left: x, top: y, width: w, height: h, transform: rotation ? `rotate(${rotation}deg)` : undefined, transformOrigin: 'center' }
  return (
    <div style={wrap} role="group" aria-label={label} className={cn('pointer-events-none', className)} data-chrome>
      <div className="absolute inset-0" style={{ boxShadow: `0 0 0 1px ${tone}` }} />
      {handles && onRotate && CORNERS.map((k) => (
        <div key={`r${k}`} aria-hidden onPointerDown={onRotate} className="pointer-events-auto absolute size-[18px]"
          style={{ left: POS[k][0] * w + (POS[k][0] ? 0 : -18), top: POS[k][1] * h + (POS[k][1] ? 0 : -18), cursor: 'grab' }} />
      ))}
      {handles && onHandle && list.map((k) => (
        <div key={k} aria-hidden onPointerDown={(e) => onHandle(k, e)}
          className="pointer-events-auto absolute flex -translate-1/2 items-center justify-center"
          style={{ left: POS[k][0] * w, top: POS[k][1] * h, width: hit, height: hit, cursor: HANDLE_CURSOR[k] }}>
          <div className="rounded-[1.5px] bg-signal-fg" style={{ width: handleSize, height: handleSize, boxShadow: `0 0 0 1px ${tone}, var(--shadow-segment)` }} />
        </div>
      ))}
      {badge != null && badge !== false && (
        <div className="absolute left-1/2 rounded-[4px] bg-signal-strong px-1.5 py-px tabular text-ui-sm font-medium whitespace-nowrap text-signal-fg"
          style={{ top: h + 8, transform: `translateX(-50%) rotate(${-rotation}deg)`, transformOrigin: 'top center' }}>
          {badge}
        </div>
      )}
      {children}
    </div>
  )
}

/* --- maths ---------------------------------------------------------------- */

/** Which edges a handle drags. */
export function handleEdges(h: Handle) {
  return { l: h.includes('w'), r: h.includes('e'), t: h.includes('n'), b: h.includes('s') }
}

/**
 * New edges for a resize from `start` by a pointer delta (in the same space
 * as `start`, usually world units). Modifiers: `aspect` keeps start's ratio,
 * `fromCenter` mirrors the opposite edge. `snap` adjusts the moving edges and
 * only runs when `aspect` is off. The result is never thinner than `min`.
 */
export function resizeRect(
  start: ScreenRect, h: Handle, dx: number, dy: number,
  o: { aspect?: boolean; fromCenter?: boolean; min?: number; snap?: (e: Edges, moving: ReturnType<typeof handleEdges>) => Edges } = {},
): Edges {
  const mv = handleEdges(h)
  const hx = mv.l ? 'l' : mv.r ? 'r' : null
  const hy = mv.t ? 't' : mv.b ? 'b' : null
  let l = start.x, t = start.y, r = start.x + start.w, b = start.y + start.h
  if (hx === 'l') l += dx
  if (hx === 'r') r += dx
  if (hy === 't') t += dy
  if (hy === 'b') b += dy
  if (o.fromCenter) {
    if (hx === 'l') r = start.x + start.w - dx
    if (hx === 'r') l = start.x - dx
    if (hy === 't') b = start.y + start.h - dy
    if (hy === 'b') t = start.y - dy
  }
  if (o.aspect && start.w > 0 && start.h > 0) {
    const ratio = start.w / start.h
    let w = r - l, hh = b - t
    if (hx && hy) { if (Math.abs(w / start.w) > Math.abs(hh / start.h)) hh = w / ratio; else w = hh * ratio }
    else if (hx) hh = w / ratio
    else w = hh * ratio
    const cx = start.x + start.w / 2, cy = start.y + start.h / 2
    if (hx === 'l') l = r - w; else if (hx === 'r') r = l + w; else { l = cx - w / 2; r = cx + w / 2 }
    if (hy === 't') t = b - hh; else if (hy === 'b') b = t + hh; else { t = cy - hh / 2; b = cy + hh / 2 }
  } else if (o.snap) {
    ;({ l, t, r, b } = o.snap({ l, t, r, b }, mv))
  }
  const min = o.min ?? 1
  // From-centre collapses onto the centre, not onto the far edge (break-it V4: the box jumped 400px)
  const cx = start.x + start.w / 2, cy = start.y + start.h / 2
  if (r - l < min) { if (o.fromCenter && hx) { l = cx - min / 2; r = cx + min / 2 } else if (hx === 'l') l = r - min; else r = l + min }
  if (b - t < min) { if (o.fromCenter && hy) { t = cy - min / 2; b = cy + min / 2 } else if (hy === 't') t = b - min; else b = t + min }
  return { l, t, r, b }
}

/** Rotation in degrees (CSS clockwise) from a drag around `center`; shift-style `step` snapping. Result in (-180, 180]. */
export function rotateDelta(center: { x: number; y: number }, from: { x: number; y: number }, to: { x: number; y: number }, startDeg = 0, step?: number) {
  const a0 = Math.atan2(from.y - center.y, from.x - center.x)
  const a1 = Math.atan2(to.y - center.y, to.x - center.x)
  let r = startDeg + ((a1 - a0) * 180) / Math.PI
  if (step) r = Math.round(r / step) * step
  r = ((((r + 180) % 360) + 360) % 360) - 180
  return r === -180 ? 180 : r
}
