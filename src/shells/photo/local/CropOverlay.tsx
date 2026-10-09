/* ---------------------------------------------------------------------------
   CropOverlay — a crop box for anything on an artboard (photo, frame,
   video). Lives inside <Artboard>, in world pixels; handles stay a constant
   screen size at any zoom.

     <CropOverlay frame={{ w, h }} rect={r} onChange={(r, final) => …}
       aspect={4 / 5} constrain={(r) => fitInside(r, angle, w, h)} />

   - rect is normalised 0–1 in the frame (x, y, w, h).
   - Drag inside to move, drag the 8 handles to resize; Shift on a corner
     keeps the current proportion when `aspect` is free; Alt resizes from
     the centre. `aspect` (px w / px h) locks the box.
   - `constrain` gets every candidate rect (e.g. to stay inside a rotated
     image) — `fitInsideRotated` is exported for that case.
   - Keyboard: the box is focusable; arrows move 1% (Shift 10%).
   Rule-of-thirds guides always; a finer grid while dragging or straightening.
--------------------------------------------------------------------------- */
import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import { clamp, cn, useCamera } from '@kit'

export interface Rect { x: number; y: number; w: number; h: number }
type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/** Shrink (and if needed recentre) rect so it lies inside a W×H image rotated by `deg` about its centre. */
export function fitInsideRotated(r: Rect, deg: number, W: number, H: number): Rect {
  const a = (deg * Math.PI) / 180
  const ca = Math.cos(a), sa = Math.sin(a)
  const inside = (q: Rect) => {
    for (const [px, py] of [[q.x, q.y], [q.x + q.w, q.y], [q.x, q.y + q.h], [q.x + q.w, q.y + q.h]]) {
      const dx = (px - 0.5) * W, dy = (py - 0.5) * H
      const ux = ca * dx + sa * dy + W / 2, uy = -sa * dx + ca * dy + H / 2
      if (ux < -0.5 || ux > W + 0.5 || uy < -0.5 || uy > H + 0.5) return false
    }
    return true
  }
  const scaled = (q: Rect, s: number): Rect => ({ x: q.x + (q.w * (1 - s)) / 2, y: q.y + (q.h * (1 - s)) / 2, w: q.w * s, h: q.h * s })
  if (inside(r)) return r
  let base = r
  if (!inside(scaled(r, 0.001))) base = { x: 0.5 - r.w / 2, y: 0.5 - r.h / 2, w: r.w, h: r.h }
  let lo = 0, hi = 1
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (inside(scaled(base, m))) lo = m; else hi = m }
  return scaled(base, lo)
}

/** Largest rect of a pixel aspect inside the frame, centred on (cx, cy). */
export function rectForAspect(aspect: number, W: number, H: number, cx = 0.5, cy = 0.5): Rect {
  let w = 1, h = W / aspect / H
  if (h > 1) { h = 1; w = (H * aspect) / W }
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h }
}

const MIN = 0.03

export function CropOverlay({
  frame, rect, onChange, aspect, constrain, dim = 0.55, grid = 'thirds',
}: {
  frame: { w: number; h: number }
  rect: Rect
  onChange: (r: Rect, final: boolean) => void
  aspect?: number | null
  constrain?: (r: Rect) => Rect
  dim?: number
  grid?: 'thirds' | 'fine'
}) {
  const zoom = useStore(useCamera(), (s) => s.zoom)
  const [active, setActive] = useState(false)
  const start = useRef<{ h: Handle; x: number; y: number; r: Rect; alt: boolean; shift: boolean } | null>(null)
  const ar = aspect ? aspect * (frame.h / frame.w) : null // aspect in normalised units: w/h

  const solve = (h: Handle, r0: Rect, dx: number, dy: number, alt: boolean, keep: boolean): Rect => {
    if (h === 'move') return { ...r0, x: clamp(r0.x + dx, 0, 1 - r0.w), y: clamp(r0.y + dy, 0, 1 - r0.h) }
    let { x, y, w, h: hh } = r0
    const L = h.includes('w'), R = h.includes('e'), T = h.includes('n'), B = h.includes('s')
    const k = alt ? 2 : 1
    if (R) w = r0.w + dx * k
    if (L) { w = r0.w - dx * k }
    if (B) hh = r0.h + dy * k
    if (T) hh = r0.h - dy * k
    w = Math.max(MIN, w)
    hh = Math.max(MIN, hh)
    const lockR = ar ?? (keep ? r0.w / r0.h : null)
    if (lockR) {
      if ((L || R) && (T || B)) { if (w / hh > lockR) hh = w / lockR; else w = hh * lockR }
      else if (L || R) hh = w / lockR
      else w = hh * lockR
    }
    if (alt) { x = r0.x + (r0.w - w) / 2; y = r0.y + (r0.h - hh) / 2 }
    else {
      x = L ? r0.x + r0.w - w : (T || B) && !(L || R) ? r0.x + (r0.w - w) / 2 : r0.x
      y = T ? r0.y + r0.h - hh : (L || R) && !(T || B) ? r0.y + (r0.h - hh) / 2 : r0.y
    }
    // keep inside the frame; with a locked ratio, shrink rather than squash
    if (x < 0 || y < 0 || x + w > 1 || y + hh > 1) {
      const s = Math.min(1, (L ? r0.x + r0.w : 1 - x) / w, (T ? r0.y + r0.h : 1 - y) / hh, x + w > 1 ? (1 - Math.max(0, x)) / w : 1, y + hh > 1 ? (1 - Math.max(0, y)) / hh : 1)
      if (lockR) { const nw = w * s, nh = hh * s; if (L) x += w - nw; if (T) y += hh - nh; w = nw; hh = nh }
      x = clamp(x, 0, 1); y = clamp(y, 0, 1); w = Math.min(w, 1 - x); hh = Math.min(hh, 1 - y)
    }
    return { x, y, w, h: hh }
  }

  const emit = (r: Rect, final: boolean) => onChange(constrain ? constrain(r) : r, final)

  const down = (h: Handle) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    start.current = { h, x: e.clientX, y: e.clientY, r: rect, alt: e.altKey, shift: e.shiftKey }
    setActive(true)
  }
  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = (e.clientX - s.x) / zoom / frame.w
    const dy = (e.clientY - s.y) / zoom / frame.h
    emit(solve(s.h, s.r, dx, dy, e.altKey, e.shiftKey), false)
  }
  const up = (e: React.PointerEvent) => {
    if (!start.current) return
    start.current = null
    setActive(false)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    emit(rect, true)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const st = e.shiftKey ? 0.1 : 0.01
    const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key]
    if (!d) return
    e.preventDefault()
    e.stopPropagation()
    emit(solve('move', rect, d[0], d[1], false, false), true)
  }

  const hs = 14 / zoom // handle size in world px
  const bw = 1.5 / zoom
  const handles: [Handle, number, number, string][] = [
    ['nw', 0, 0, 'cursor-nwse-resize'], ['n', 0.5, 0, 'cursor-ns-resize'], ['ne', 1, 0, 'cursor-nesw-resize'],
    ['e', 1, 0.5, 'cursor-ew-resize'], ['se', 1, 1, 'cursor-nwse-resize'], ['s', 0.5, 1, 'cursor-ns-resize'],
    ['sw', 0, 1, 'cursor-nesw-resize'], ['w', 0, 0.5, 'cursor-ew-resize'],
  ]
  const lines = grid === 'fine' || active ? [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6] : [1 / 3, 2 / 3]

  return (
    <div className="absolute inset-0" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div
        role="group"
        tabIndex={0}
        aria-label={`Crop box ${Math.round(rect.w * frame.w)} by ${Math.round(rect.h * frame.h)} pixels. Arrow keys move it.`}
        onKeyDown={onKey}
        onPointerDown={down('move')}
        className="absolute cursor-move outline-none focus-visible:outline-2 focus-visible:outline-accent"
        style={{
          left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%`,
          boxShadow: `0 0 0 100000px rgba(0,0,0,${dim}), inset 0 0 0 ${bw}px rgba(255,255,255,.9)`,
        }}
      >
        {lines.map((t) => (
          <div key={`v${t}`} className="pointer-events-none absolute inset-y-0" style={{ left: `${t * 100}%`, width: bw * (lines.length > 2 && t !== 0.5 ? 0.5 : 0.75), background: `rgba(255,255,255,${lines.length > 2 ? 0.35 : 0.5})` }} />
        ))}
        {lines.map((t) => (
          <div key={`h${t}`} className="pointer-events-none absolute inset-x-0" style={{ top: `${t * 100}%`, height: bw * (lines.length > 2 && t !== 0.5 ? 0.5 : 0.75), background: `rgba(255,255,255,${lines.length > 2 ? 0.35 : 0.5})` }} />
        ))}
        {handles.map(([h, fx, fy, cur]) => {
          const corner = h.length === 2
          const t = 3 / zoom
          const L = hs
          const bar = 'absolute rounded-[1px] bg-white shadow-[0_0_2px_rgba(0,0,0,.6)]'
          const ix = h.includes('w') ? 1 : -1, iy = h.includes('n') ? 1 : -1
          return (
            <div key={h} onPointerDown={down(h)} className={cn('absolute', cur)}
              style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, width: hs * 2, height: hs * 2, transform: 'translate(-50%,-50%)' }}>
              {corner ? (
                <>
                  <div className={bar} style={{ width: L, height: t, top: hs - t / 2, left: ix > 0 ? hs - t / 2 : hs + t / 2 - L }} />
                  <div className={bar} style={{ width: t, height: L, left: hs - t / 2, top: iy > 0 ? hs - t / 2 : hs + t / 2 - L }} />
                </>
              ) : (
                <div className={cn(bar, 'top-1/2 left-1/2 -translate-1/2')}
                  style={{ width: h === 'n' || h === 's' ? L * 1.3 : t, height: h === 'n' || h === 's' ? t : L * 1.3 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
