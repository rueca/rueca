/* ---------------------------------------------------------------------------
   Stage — the workspace. Two modes:

     <Stage>                         an infinite canvas with a camera
       <Artboard width={390} height={844} label="iPhone 15" />
     </Stage>

     <Stage fill>                    the artifact fills the stage (shader, 3D, photo)
       <canvas … />
     </Stage>

   Camera (Figma conventions): wheel/trackpad scroll pans, ⌘/Ctrl+wheel and
   pinch zoom at the cursor, Space-drag or middle-drag pans, Shift+0 = 100%,
   Shift+1 = fit, ⌘+/⌘− step. The zoom pill sits bottom-right.
--------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { Minus, Plus } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import { useHotkeys } from '../core/hotkeys'
import { Menu } from '../ui/controls'

export interface Camera { x: number; y: number; zoom: number }
export type CameraStore = StoreApi<Camera> & { fit: () => void; zoomTo: (z: number, at?: { x: number; y: number }) => void; bounds?: () => DOMRect | null }

export const createCamera = (): CameraStore => Object.assign(createStore<Camera>(() => ({ x: 0, y: 0, zoom: 1 })), { fit: () => {}, zoomTo: () => {} })

const CamCtx = createContext<CameraStore | null>(null)
const NO_CAMERA = createCamera()
export const useCamera = () => useContext(CamCtx)!

export function Stage({
  children, fill, camera: external, contentSize, className, background, grid, minZoom = 0.05, maxZoom = 64, padding = 48, onBackgroundPointerDown, hud = true, overlay,
}: {
  children: ReactNode
  fill?: boolean
  camera?: CameraStore
  /** size of the content in world px; used by fit. Defaults to the first artboard's size. */
  contentSize?: { w: number; h: number }
  className?: string
  background?: string
  grid?: boolean
  minZoom?: number
  maxZoom?: number
  padding?: number
  onBackgroundPointerDown?: (e: React.PointerEvent) => void
  hud?: boolean
  overlay?: ReactNode
}) {
  const [cam] = useState(() => external ?? createCamera())
  const { x, y, zoom } = useStore(cam)
  const el = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState(false)
  const pan = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)

  const size = useCallback(() => {
    if (contentSize) return contentSize
    const w = world.current?.firstElementChild as HTMLElement | null
    return w ? { w: w.offsetWidth, h: w.offsetHeight } : { w: 800, h: 600 }
  }, [contentSize])

  const fit = useCallback(() => {
    const r = el.current?.getBoundingClientRect()
    if (!r) return
    const s = size()
    const z = clamp(Math.min((r.width - padding * 2) / s.w, (r.height - padding * 2) / s.h), minZoom, maxZoom)
    cam.setState({ zoom: z, x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [cam, size, padding, minZoom, maxZoom])

  const zoomTo = useCallback((z: number, at?: { x: number; y: number }) => {
    const r = el.current!.getBoundingClientRect()
    const p = at ?? { x: r.width / 2, y: r.height / 2 }
    const s = cam.getState()
    const nz = clamp(z, minZoom, maxZoom)
    cam.setState({ zoom: nz, x: p.x - ((p.x - s.x) * nz) / s.zoom, y: p.y - ((p.y - s.y) * nz) / s.zoom })
  }, [cam, minZoom, maxZoom])

  cam.fit = fit
  cam.zoomTo = zoomTo
  cam.bounds = () => el.current?.getBoundingClientRect() ?? null

  // Fit on mount and when the stage resizes, until the user takes the camera.
  const touched = useRef(false)
  useLayoutEffect(() => {
    if (fill) return
    fit()
    const ro = new ResizeObserver(() => !touched.current && fit())
    ro.observe(el.current!)
    return () => ro.disconnect()
  }, [fit, fill])

  useEffect(() => {
    if (fill) return
    const node = el.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      touched.current = true
      const r = node.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const s = cam.getState()
        zoomTo(s.zoom * Math.exp(-e.deltaY * (e.ctrlKey && !e.metaKey ? 0.01 : 0.0025)), { x: e.clientX - r.left, y: e.clientY - r.top })
      } else {
        const s = cam.getState()
        cam.setState({ x: s.x - (e.shiftKey ? e.deltaY : e.deltaX), y: s.y - (e.shiftKey ? 0 : e.deltaY) })
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [cam, zoomTo, fill])

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target as HTMLElement).closest('input,textarea,[contenteditable]')) setSpace(true) }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useHotkeys(fill ? {} : {
    'shift+0': () => { touched.current = true; zoomTo(1) },
    'shift+1': () => { touched.current = false; fit() },
    'mod+=,mod+plus': () => { touched.current = true; zoomTo(cam.getState().zoom * 2) },
    'mod+-': () => { touched.current = true; zoomTo(cam.getState().zoom / 2) },
  }, [fill])

  const onPointerDown = (e: React.PointerEvent) => {
    if (fill) return
    if (e.button === 1 || (e.button === 0 && space)) {
      e.preventDefault()
      touched.current = true
      const s = cam.getState()
      pan.current = { x: e.clientX, y: e.clientY, cx: s.x, cy: s.y }
      el.current!.setPointerCapture(e.pointerId)
      return
    }
    if (e.target === el.current || e.target === world.current) onBackgroundPointerDown?.(e)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pan.current) return
    cam.setState({ x: pan.current.cx + e.clientX - pan.current.x, y: pan.current.cy + e.clientY - pan.current.y })
  }
  const onPointerUp = () => { pan.current = null }

  return (
    <CamCtx.Provider value={cam}>
      <div
        ref={el}
        className={cn('relative h-full w-full overflow-hidden', fill ? '' : 'touch-none', space && (pan.current ? 'cursor-grabbing' : 'cursor-grab'), className)}
        style={{
          background,
          backgroundImage: grid ? `radial-gradient(circle, var(--grid) 1px, transparent 1px)` : undefined,
          backgroundSize: grid ? `${20 * zoom}px ${20 * zoom}px` : undefined,
          backgroundPosition: grid ? `${x}px ${y}px` : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {fill ? children : (
          <div ref={world} className="absolute top-0 left-0 origin-top-left will-change-transform" style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}>
            {children}
          </div>
        )}
        {overlay}
        {hud && !fill && <ZoomPill />}
      </div>
    </CamCtx.Provider>
  )
}

export function ZoomPill({ className }: { className?: string }) {
  const cam = useCamera()
  const zoom = useStore(cam, (s) => s.zoom)
  return (
    <div className={cn('cluster absolute right-3 bottom-3 z-10 flex h-8 items-center gap-0.5 px-1', className)}>
      <button type="button" aria-label="Zoom out" onClick={() => cam.zoomTo(zoom / 1.25)} className="flex size-6 items-center justify-center rounded-[5px] text-muted hover:bg-hover hover:text-fg"><Minus size={13} /></button>
      <Menu
        side="top"
        align="end"
        trigger={<button type="button" className="h-6 min-w-[46px] rounded-[5px] px-1 tabular text-[11.5px] text-fg hover:bg-hover">{Math.round(zoom * 100)}%</button>}
        items={[
          { label: 'Zoom to fit', shortcut: 'shift+1', onClick: () => cam.fit() },
          { label: 'Zoom to 50%', onClick: () => cam.zoomTo(0.5) },
          { label: 'Zoom to 100%', shortcut: 'shift+0', onClick: () => cam.zoomTo(1) },
          { label: 'Zoom to 200%', onClick: () => cam.zoomTo(2) },
        ]}
      />
      <button type="button" aria-label="Zoom in" onClick={() => cam.zoomTo(zoom * 1.25)} className="flex size-6 items-center justify-center rounded-[5px] text-muted hover:bg-hover hover:text-fg"><Plus size={13} /></button>
    </div>
  )
}

/* An artboard: positioned in world space, with a label above its top-left corner. */
export function Artboard({
  width, height, label, x = 0, y = 0, children, className, background = '#000', selected, onSelect, style,
}: { width: number; height: number; label?: ReactNode; x?: number; y?: number; children?: ReactNode; className?: string; background?: string; selected?: boolean; onSelect?: () => void; style?: React.CSSProperties }) {
  const zoom = useStore(useContext(CamCtx) ?? NO_CAMERA, (s) => s.zoom)
  return (
    <div className="absolute" style={{ left: x, top: y, width, height }}>
      {label && (
        <div
          onPointerDown={onSelect}
          className={cn('absolute bottom-full left-0 flex origin-bottom-left items-center gap-1.5 pb-1.5 text-[11px] whitespace-nowrap no-select', selected ? 'text-accent' : 'text-faint')}
          style={{ transform: `scale(${1 / zoom})` }}
        >
          {label}
          <span className="tabular opacity-60">{width} × {height}</span>
        </div>
      )}
      <div
        className={cn('relative h-full w-full overflow-hidden font-artboard', className)}
        style={{
          background,
          boxShadow: `var(--shadow-artboard), 0 0 0 ${1 / zoom}px ${selected ? 'var(--accent)' : 'var(--artboard-ring)'}`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}
