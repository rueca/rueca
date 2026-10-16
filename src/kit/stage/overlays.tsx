/* ---------------------------------------------------------------------------
   Stage overlays — chrome that sits ON the artifact.

   CropOverlay — a crop box for anything on an artboard (photo, video frame,
   export region). Lives inside <Artboard>, in world px; handles stay a
   constant screen size at any zoom.

     <CropOverlay frame={{ w, h }} rect={r} onChange={(r, final) => …}
       aspect={4 / 5} constrain={(r) => fitInsideRotated(r, angle, w, h)} />

     rect is normalised 0–1 in the frame. Drag inside to move, the 8 handles
     to resize; Shift on a corner keeps the proportion when `aspect` is free;
     Alt resizes from the centre. Keyboard (the non-drag path): the box is
     focusable — arrows move 1% (Shift 10%), Alt+arrows resize from the
     bottom-right edge. Rule-of-thirds always; a finer grid while dragging
     or with grid="fine" (straightening).
     fitInsideRotated(rect, deg, W, H) shrinks a rect to stay inside a
     rotated image; rectForAspect(ratio, W, H, cx, cy) is the largest rect of
     a ratio centred on a point.

   Navigator — a minimap with the visible viewport drawn on it (Lightroom /
   Photoshop Navigator). Bind it to any kit Stage camera, or drive it with
   plain props for a custom canvas.

     <Navigator camera={cam} content={{ w, h }} image={imageData} />
     <Navigator content={size} image={url} view={{ x, y, w, h }} onCenter={(x, y) => …} zoom={z} onZoom={…} />

     Click or drag to centre the view there. Keyboard: the map is focusable —
     arrows pan by a tenth of the view (Shift: half); the zoom segment gives
     Fit / 50 / 100 / 200% without a pointer.

   AxisGizmo — the orientation widget in a 3D viewport's corner (Blender's
   navigation gizmo, three's ViewHelper, Spline's view cube), as SVG chrome,
   renderer-agnostic. Feed it ONE of:
     matrix      the view matrix, column-major (three: camera.matrixWorldInverse.elements)
     quaternion  the camera's orientation [x, y, z, w] (three: camera.quaternion.toArray())
     yaw/pitch   orbit angles in degrees (pitch > 0 looks down from above)
     subscribe   (fn) => unsubscribe — push matrices without re-rendering the parent

     <AxisGizmo subscribe={engine.onCamera} onSnap={(axis) => engine.snapAxis(axis)} />

     Click a tip to look down that axis. Every tip is a real button (Tab +
     Enter), so the snap never needs a pointer (WCAG 2.5.7). Axis colours are
     categorical tokens (X cat-5, Y cat-3, Z cat-1); override with `colors`.

   (Promoted from shells/photo/local/CropOverlay.tsx, photo/local/Navigator.tsx
   and scene/local/AxisGizmo.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { clamp, cn } from '../core/cn'
import { Segmented } from '../ui/controls'
import { createCamera, useCamera, type CameraStore } from './Stage'

const NO_CAMERA = createCamera()
const useZoom = (override?: number) => {
  const cam = useCamera() ?? NO_CAMERA
  const z = useStore(cam, (s) => s.zoom)
  return override ?? z
}

/* =========================================================================
   CropOverlay
   ========================================================================= */
/** a normalised (0–1) rect in the frame; named apart from core/geometry's world-px Rect */
export interface CropRect { x: number; y: number; w: number; h: number }
type Rect = CropRect
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

/** Largest rect of a pixel aspect (w / h) inside a W×H frame, centred on (cx, cy). Normalised. */
export function rectForAspect(aspect: number, W: number, H: number, cx = 0.5, cy = 0.5): Rect {
  let w = 1, h = W / aspect / H
  if (h > 1) { h = 1; w = (H * aspect) / W }
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h }
}

const MIN = 0.03

export function CropOverlay({
  frame, rect, onChange, aspect, constrain, dim, grid = 'thirds', zoom: zoomProp, label = 'Crop box',
}: {
  /** the frame's size in px (the artboard) */
  frame: { w: number; h: number }
  rect: Rect
  onChange: (r: Rect, final: boolean) => void
  /** lock to a pixel ratio (w / h); null / undefined = free */
  aspect?: number | null
  /** post-process every candidate (e.g. stay inside a rotated image) */
  constrain?: (r: Rect) => Rect
  /** mask opacity 0–1 outside the box (default: the scrim token) */
  dim?: number
  grid?: 'thirds' | 'fine'
  /** world → screen scale; defaults to the enclosing Stage camera */
  zoom?: number
  label?: string
}) {
  const zoom = useZoom(zoomProp)
  const [active, setActive] = useState(false)
  const start = useRef<{ h: Handle; x: number; y: number; r: Rect } | null>(null)
  const ar = aspect ? aspect * (frame.h / frame.w) : null // aspect in normalised units: w/h

  const solve = (h: Handle, r0: Rect, dx: number, dy: number, alt: boolean, keep: boolean): Rect => {
    if (h === 'move') return { ...r0, x: clamp(r0.x + dx, 0, 1 - r0.w), y: clamp(r0.y + dy, 0, 1 - r0.h) }
    let { x, y, w, h: hh } = r0
    const L = h.includes('w'), R = h.includes('e'), T = h.includes('n'), B = h.includes('s')
    const k = alt ? 2 : 1
    if (R) w = r0.w + dx * k
    if (L) w = r0.w - dx * k
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
    start.current = { h, x: e.clientX, y: e.clientY, r: rect }
    setActive(true)
  }
  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    emit(solve(s.h, s.r, (e.clientX - s.x) / zoom / frame.w, (e.clientY - s.y) / zoom / frame.h, e.altKey, e.shiftKey), false)
  }
  const up = (e: React.PointerEvent) => {
    if (!start.current) return
    start.current = null
    setActive(false)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    emit(rect, true)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const st = e.shiftKey ? 0.1 : 0.01
    const d = ({ ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] } as Record<string, number[]>)[e.key]
    if (!d) return
    e.preventDefault()
    e.stopPropagation()
    emit(solve(e.altKey ? (d[0] ? 'e' : 's') : 'move', rect, d[0], d[1], false, false), true)
  }

  const hs = 14 / zoom // handle size in world px
  const bw = 1.5 / zoom
  const handles: [Handle, number, number, string][] = [
    ['nw', 0, 0, 'cursor-nwse-resize'], ['n', 0.5, 0, 'cursor-ns-resize'], ['ne', 1, 0, 'cursor-nesw-resize'],
    ['e', 1, 0.5, 'cursor-ew-resize'], ['se', 1, 1, 'cursor-nwse-resize'], ['s', 0.5, 1, 'cursor-ns-resize'],
    ['sw', 0, 1, 'cursor-nesw-resize'], ['w', 0, 0.5, 'cursor-ew-resize'],
  ]
  const fine = grid === 'fine' || active
  const lines = fine ? [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6] : [1 / 3, 2 / 3]
  const mask = dim !== undefined ? `rgba(0,0,0,${dim})` : 'var(--scrim)'
  const lineStyle = (t: number) => ({ background: `rgba(255,255,255,${fine ? 0.35 : 0.5})`, size: bw * (fine && t !== 0.5 ? 0.5 : 0.75) })

  return (
    <div className="absolute inset-0" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div
        role="group"
        tabIndex={0}
        aria-label={`${label}, ${Math.round(rect.w * frame.w)} by ${Math.round(rect.h * frame.h)} pixels. Arrow keys move it, Alt+arrows resize.`}
        onKeyDown={onKey}
        onPointerDown={down('move')}
        className="absolute cursor-move outline-none focus-visible:outline-2 focus-visible:outline-signal"
        style={{
          left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%`,
          boxShadow: `0 0 0 100000px ${mask}, inset 0 0 0 ${bw}px rgba(255,255,255,.9)`,
        }}
      >
        {lines.map((t) => { const s = lineStyle(t); return <div key={`v${t}`} className="pointer-events-none absolute inset-y-0" style={{ left: `${t * 100}%`, width: s.size, background: s.background }} /> })}
        {lines.map((t) => { const s = lineStyle(t); return <div key={`h${t}`} className="pointer-events-none absolute inset-x-0" style={{ top: `${t * 100}%`, height: s.size, background: s.background }} /> })}
        {handles.map(([h, fx, fy, cur]) => {
          const corner = h.length === 2
          const t = 3 / zoom
          const bar = 'absolute rounded-[1px] bg-white shadow-[0_0_2px_rgba(0,0,0,.6)]'
          const ix = h.includes('w') ? 1 : -1, iy = h.includes('n') ? 1 : -1
          return (
            <div key={h} onPointerDown={down(h)} className={cn('absolute', cur)}
              style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, width: hs * 2, height: hs * 2, transform: 'translate(-50%,-50%)' }}>
              {corner ? (
                <>
                  <div className={bar} style={{ width: hs, height: t, top: hs - t / 2, left: ix > 0 ? hs - t / 2 : hs + t / 2 - hs }} />
                  <div className={bar} style={{ width: t, height: hs, left: hs - t / 2, top: iy > 0 ? hs - t / 2 : hs + t / 2 - hs }} />
                </>
              ) : (
                <div className={cn(bar, 'top-1/2 left-1/2 -translate-1/2')}
                  style={{ width: h === 'n' || h === 's' ? hs * 1.3 : t, height: h === 'n' || h === 's' ? t : hs * 1.3 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================================
   Navigator
   ========================================================================= */
type NavImage = ImageData | HTMLCanvasElement | HTMLImageElement | ImageBitmap | string | null | undefined

export function Navigator({
  content, image, camera, view: viewProp, onCenter, zoom: zoomProp, onZoom, zoomPresets = [0.5, 1, 2], height = 132, label = 'Navigator', className,
}: {
  /** the content's size in world px */
  content: { w: number; h: number }
  image?: NavImage
  /** a kit Stage camera (createCamera() passed to <Stage camera>) */
  camera?: CameraStore
  /** without a camera: the visible rect in world px */
  view?: { x: number; y: number; w: number; h: number } | null
  /** without a camera: centre the view on this world point */
  onCenter?: (x: number, y: number) => void
  zoom?: number
  /** a number, or 'fit' */
  onZoom?: (z: number | 'fit') => void
  /** the zoom segment's steps; false hides it */
  zoomPresets?: number[] | false
  height?: number
  label?: string
  className?: string
}) {
  const cam = useStore(camera ?? NO_CAMERA)
  const canvas = useRef<HTMLCanvasElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [bw, setBw] = useState(240)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setBw(el.clientWidth))
    ro.observe(el)
    setBw(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const c = canvas.current
    if (!c || !image) return
    const ctx = c.getContext('2d')!
    if (image instanceof ImageData) { c.width = image.width; c.height = image.height; ctx.putImageData(image, 0, 0); return }
    const paint = (src: CanvasImageSource, w: number, h: number) => { c.width = w; c.height = h; ctx.drawImage(src, 0, 0, w, h) }
    if (typeof image === 'string') {
      const img = new Image()
      img.onload = () => paint(img, img.naturalWidth, img.naturalHeight)
      img.src = image
      return
    }
    const w = 'naturalWidth' in image ? image.naturalWidth : image.width
    const h = 'naturalHeight' in image ? image.naturalHeight : image.height
    paint(image, w, h)
  }, [image])

  const zoom = zoomProp ?? (camera ? cam.zoom : 1)
  const s = Math.min(bw / content.w, height / content.h)
  const dw = content.w * s, dh = content.h * s
  const b = camera?.bounds?.()
  const vis = viewProp ?? (camera && b ? { x: -cam.x / cam.zoom, y: -cam.y / cam.zoom, w: b.width / cam.zoom, h: b.height / cam.zoom } : null)
  const r = vis && {
    l: clamp(vis.x / content.w, 0, 1), t: clamp(vis.y / content.h, 0, 1),
    r: clamp((vis.x + vis.w) / content.w, 0, 1), b: clamp((vis.y + vis.h) / content.h, 0, 1),
  }
  const whole = !r || (r.l <= 0.001 && r.t <= 0.001 && r.r >= 0.999 && r.b >= 0.999)

  const centreOn = (wx: number, wy: number) => {
    if (onCenter) return onCenter(wx, wy)
    if (!camera) return
    const bb = camera.bounds?.()
    if (!bb) return
    const z = camera.getState().zoom
    camera.touch()
    camera.setState({ x: bb.width / 2 - wx * z, y: bb.height / 2 - wy * z })
  }
  const centreAt = (e: React.PointerEvent) => {
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
    centreOn(clamp((e.clientX - el.left) / el.width, 0, 1) * content.w, clamp((e.clientY - el.top) / el.height, 0, 1) * content.h)
  }
  const setZoom = (z: number | 'fit') => {
    if (onZoom) return onZoom(z)
    if (!camera) return
    if (z === 'fit') { camera.untouch(); camera.fit() } else { camera.touch(); camera.zoomTo(z) }
  }

  const presets = zoomPresets || []
  const preset = presets.find((p) => Math.abs(zoom - p) < 0.005)
  return (
    <div className={cn('flex flex-col gap-2 px-pad pb-1', className)}>
      <div ref={box} className="flex items-center justify-center rounded-control bg-well" style={{ height }}>
        <div
          role="group"
          tabIndex={0}
          aria-label={`${label}. Click to centre the view there; arrow keys pan.`}
          className="relative cursor-crosshair overflow-hidden rounded-[3px] shadow-[0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-signal"
          style={{ width: dw, height: dh }}
          onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); centreAt(e) }}
          onPointerMove={(e) => dragging.current && centreAt(e)}
          onPointerUp={() => { dragging.current = false }}
          onKeyDown={(e) => {
            const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key]
            if (!d || !vis) return
            e.preventDefault()
            e.stopPropagation()
            const k = e.shiftKey ? 0.5 : 0.1
            centreOn(vis.x + vis.w / 2 + d[0] * vis.w * k, vis.y + vis.h / 2 + d[1] * vis.h * k)
          }}
        >
          <canvas ref={canvas} className="absolute inset-0 size-full" />
          {r && !whole && (
            <div className="pointer-events-none absolute shadow-[0_0_0_1.5px_white,0_0_0_9999px_var(--scrim)]"
              style={{ left: `${r.l * 100}%`, top: `${r.t * 100}%`, width: `${(r.r - r.l) * 100}%`, height: `${(r.b - r.t) * 100}%` }} />
          )}
        </div>
      </div>
      {zoomPresets !== false && (
        <div className="flex items-center gap-2">
          <Segmented size="sm" label="Zoom" value={preset !== undefined ? String(preset) : 'fit'} onChange={(z) => setZoom(z === 'fit' ? 'fit' : Number(z))}
            options={[{ value: 'fit', label: 'Fit' }, ...presets.map((p) => ({ value: String(p), label: `${Math.round(p * 100)}%` }))]} />
          <span className="w-10 shrink-0 text-right text-ui tabular text-fg-faint">{Math.round(zoom * 100)}%</span>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   AxisGizmo
   ========================================================================= */
export type AxisId = '+x' | '-x' | '+y' | '-y' | '+z' | '-z'
type V3 = [number, number, number]

const AXES: { id: AxisId; v: V3; axis: 'x' | 'y' | 'z'; name: string }[] = [
  { id: '+x', v: [1, 0, 0], axis: 'x', name: 'Right' },
  { id: '-x', v: [-1, 0, 0], axis: 'x', name: 'Left' },
  { id: '+y', v: [0, 1, 0], axis: 'y', name: 'Top' },
  { id: '-y', v: [0, -1, 0], axis: 'y', name: 'Bottom' },
  { id: '+z', v: [0, 0, 1], axis: 'z', name: 'Front' },
  { id: '-z', v: [0, 0, -1], axis: 'z', name: 'Back' },
]
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/** world → view rotation of a direction, from whichever input was given. */
function toView(o: { matrix?: ArrayLike<number>; quaternion?: ArrayLike<number>; yaw?: number; pitch?: number }): (v: V3) => V3 {
  if (o.matrix) {
    const m = o.matrix
    const n = m.length === 9 ? 3 : 4 // column-major 3×3 or 4×4
    return ([x, y, z]) => [m[0] * x + m[n] * y + m[2 * n] * z, m[1] * x + m[n + 1] * y + m[2 * n + 1] * z, m[2] * x + m[n + 2] * y + m[2 * n + 2] * z]
  }
  if (o.quaternion) {
    // camera → world orientation; rotate by its conjugate for world → view
    const qx = -o.quaternion[0], qy = -o.quaternion[1], qz = -o.quaternion[2], qw = o.quaternion[3]
    return ([x, y, z]) => {
      const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x)
      return [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)]
    }
  }
  const yaw = ((o.yaw ?? 0) * Math.PI) / 180, pitch = ((o.pitch ?? 0) * Math.PI) / 180
  const cy = Math.cos(-yaw), sy = Math.sin(-yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
  return ([x, y, z]) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy // about Y by −yaw
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp] // then about X by pitch
  }
}

export function AxisGizmo({
  matrix, quaternion, yaw, pitch, subscribe, onSnap, size = 88, colors, className, label = 'View axes',
}: {
  matrix?: ArrayLike<number>
  quaternion?: ArrayLike<number>
  yaw?: number
  pitch?: number
  subscribe?: (fn: (viewMatrix: ArrayLike<number>) => void) => () => void
  onSnap?: (axis: AxisId) => void
  size?: number
  colors?: Partial<Record<'x' | 'y' | 'z', string>>
  className?: string
  label?: string
}) {
  const [pushed, setPushed] = useState<ArrayLike<number> | null>(null)
  const [hover, setHover] = useState<AxisId | null>(null)
  useEffect(() => (subscribe ? subscribe((m) => setPushed(Array.from(m))) : undefined), [subscribe])

  const col = { x: 'var(--cat-5)', y: 'var(--cat-3)', z: 'var(--cat-1)', ...colors }
  const rot = toView(pushed ? { matrix: pushed } : matrix ? { matrix } : quaternion ? { quaternion } : yaw !== undefined || pitch !== undefined ? { yaw, pitch } : { matrix: IDENTITY })
  const c = size / 2
  const r = size / 2 - 13
  const tips = AXES.map((a) => {
    const [vx, vy, vz] = rot(a.v)
    return { ...a, sx: c + vx * r, sy: c - vy * r, depth: vz }
  }).sort((a, b) => a.depth - b.depth)

  return (
    <div className={cn('group/gizmo relative', className)} style={{ width: size, height: size }} role="group" aria-label={label}>
      <svg width={size} height={size} className="overflow-visible" aria-hidden>
        <circle cx={c} cy={c} r={c - 2} className="fill-transparent transition-colors group-hover/gizmo:fill-[var(--hover)]" />
        {tips.map((t) => {
          const pos = t.id[0] === '+'
          return (
            <g key={t.id} opacity={0.55 + 0.45 * Math.max(0, (t.depth + 1) / 2)}>
              {pos && <line x1={c} y1={c} x2={t.sx} y2={t.sy} stroke={col[t.axis]} strokeWidth={2} strokeLinecap="round" />}
              <circle cx={t.sx} cy={t.sy} r={pos ? 8.5 : 6} fill={pos ? col[t.axis] : 'var(--panel)'} stroke={col[t.axis]} strokeWidth={pos ? 0 : 1.5}
                style={hover === t.id ? { filter: 'brightness(1.25)' } : undefined} />
              {pos && <text x={t.sx} y={t.sy + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--field)" className="pointer-events-none select-none">{t.axis.toUpperCase()}</text>}
            </g>
          )
        })}
      </svg>
      {onSnap && tips.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-label={`View from ${t.name.toLowerCase()} (${t.id.toUpperCase()})`}
          title={`${t.name} view`}
          onPointerEnter={() => setHover(t.id)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(t.id)}
          onBlur={() => setHover(null)}
          onClick={() => onSnap(t.id)}
          className="absolute size-6 -translate-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-signal"
          style={{ left: t.sx, top: t.sy }}
        />
      ))}
    </div>
  )
}
