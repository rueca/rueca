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
import { Menu, type MenuItem } from '../ui/controls'
import { useStudio, useSafeArea } from '../layout/Studio'

export interface Camera { x: number; y: number; zoom: number }
export type CameraStore = StoreApi<Camera> & {
  fit: () => void
  zoomTo: (z: number, at?: { x: number; y: number }) => void
  bounds?: () => DOMRect | null
  /** the user has taken the camera — stop auto-fitting on resize (call from outside gestures too) */
  touch: () => void
  /** resume auto-fit */
  untouch: () => void
}

export const createCamera = (): CameraStore =>
  Object.assign(createStore<Camera>(() => ({ x: 0, y: 0, zoom: 1 })), { fit: () => {}, zoomTo: () => {}, touch: () => {}, untouch: () => {} })

const CamCtx = createContext<CameraStore | null>(null)
const NO_CAMERA = createCamera()
export const useCamera = () => useContext(CamCtx)!

export function Stage({
  children, fill, camera: external, contentSize, className, background, grid, minZoom = 0.05, maxZoom = 64, fitMaxZoom = 1, padding = 48, onBackgroundPointerDown, hud = true, overlay, hotkeys = true,
}: {
  children: ReactNode
  fill?: boolean
  camera?: CameraStore
  /** bounds of the content in world px; used by fit. Defaults to the first artboard's box. An inline object is fine — compared by value. */
  contentSize?: { w: number; h: number; x?: number; y?: number }
  /** fit never zooms past this (a small board shouldn't blow up to 156%) */
  fitMaxZoom?: number
  /** Shift+0 / Shift+1 / ⌘± (priority 0) */
  hotkeys?: boolean
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
  // Present mode (⌘\\) hides chrome — including the stage's own HUD and overlays (break-it F3).
  const { present, layout } = useStudio()
  // In the islands layout the content box stops at the panels; a camera stage bleeds back out to the
  // edges so the grid and artboard run under the floating panels. Fit and zoom aim at the visible gap.
  // Only the stage that IS the main content bleeds — not one nested in a split pane or a card.
  const [isMain, setIsMain] = useState(false)
  const bleed = layout === 'islands' && !fill && !present && isMain
  const safe = useSafeArea()
  const inset = present || (layout === 'islands' && !bleed) ? NO_INSET : safe
  const insetRef = useRef(inset)
  insetRef.current = inset
  const { x, y, zoom } = useStore(cam)
  const el = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState(false)
  const pan = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)

  // Compare content bounds by VALUE: an inline `contentSize={{…}}` must not refit every render.
  const cw = contentSize?.w, ch = contentSize?.h, cx = contentSize?.x ?? 0, cy = contentSize?.y ?? 0
  const size = useCallback(() => {
    if (cw !== undefined && ch !== undefined) return { w: cw, h: ch, x: cx, y: cy }
    const w = world.current?.firstElementChild as HTMLElement | null
    return w ? { w: w.offsetWidth, h: w.offsetHeight, x: w.offsetLeft, y: w.offsetTop } : { w: 800, h: 600, x: 0, y: 0 }
  }, [cw, ch, cx, cy])

  const fit = useCallback(() => {
    const r = el.current?.getBoundingClientRect()
    if (!r || !r.width) return
    const s = size()
    const i = insetRef.current
    const w = Math.max(1, r.width - i.left - i.right), h = Math.max(1, r.height - i.top - i.bottom)
    const z = clamp(Math.min((w - padding * 2) / s.w, (h - padding * 2) / s.h, fitMaxZoom), minZoom, maxZoom)
    cam.setState({ zoom: z, x: i.left + (w - s.w * z) / 2 - s.x * z, y: i.top + (h - s.h * z) / 2 - s.y * z })
  }, [cam, size, padding, minZoom, maxZoom, fitMaxZoom])

  const zoomTo = useCallback((z: number, at?: { x: number; y: number }) => {
    const r = el.current!.getBoundingClientRect()
    const i = insetRef.current
    const p = at ?? { x: i.left + (r.width - i.left - i.right) / 2, y: i.top + (r.height - i.top - i.bottom) / 2 }
    const s = cam.getState()
    const nz = clamp(z, minZoom, maxZoom)
    cam.setState({ zoom: nz, x: p.x - ((p.x - s.x) * nz) / s.zoom, y: p.y - ((p.y - s.y) * nz) / s.zoom })
  }, [cam, minZoom, maxZoom])

  // Fit on mount and when the stage resizes, until the user takes the camera.
  const touched = useRef(false)
  cam.fit = fit
  useLayoutEffect(() => {
    if (layout !== 'islands' || fill || isMain) return
    const node = el.current, main = node?.closest<HTMLElement>('[data-studio-main]')
    if (!node || !main) return
    const a = node.getBoundingClientRect(), b = main.getBoundingClientRect()
    if (Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2 && Math.abs(a.left - b.left) < 2 && Math.abs(a.top - b.top) < 2) setIsMain(true)
  }, [layout, fill, isMain])
  // Panels are measured after the first fit (and change on resize / present mode): refit unless the user took over.
  useEffect(() => { if (!fill && !touched.current) fit() }, [inset.top, inset.right, inset.bottom, inset.left]) // eslint-disable-line react-hooks/exhaustive-deps
  cam.zoomTo = zoomTo
  cam.bounds = () => el.current?.getBoundingClientRect() ?? null
  cam.touch = () => { touched.current = true }
  cam.untouch = () => { touched.current = false }
  useLayoutEffect(() => {
    if (fill || touched.current) return
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
        // Trackpad pinches send small deltas; a mouse-wheel notch sends ~100 (×16 in line mode). Cap one event at ~1.35×
        // (it was 2.7× a notch, 12× for a big delta — t2 judge); pinches stay smooth and proportional.
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1)
        const step = Math.max(-0.3, Math.min(0.3, -dy * (e.ctrlKey && !e.metaKey ? 0.01 : 0.0025)))
        zoomTo(s.zoom * Math.exp(step), { x: e.clientX - r.left, y: e.clientY - r.top })
      } else {
        const s = cam.getState()
        cam.setState({ x: s.x - (e.shiftKey ? e.deltaY : e.deltaX), y: s.y - (e.shiftKey ? 0 : e.deltaY) })
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [cam, zoomTo, fill])

  useEffect(() => {
    if (fill) return
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat && !(e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable],button')) setSpace(true) }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false)
    // ⌘-Tab away with Space held: the keyup lands in another app, so drop the hand tool on blur (break-it F19)
    const blur = () => setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [fill])

  useHotkeys(fill || !hotkeys ? {} : {
    'shift+0': { run: () => { touched.current = true; zoomTo(1) }, label: 'Zoom to 100%', group: 'View' },
    'shift+1': { run: () => { touched.current = false; fit() }, label: 'Zoom to fit', group: 'View' },
    'mod+=,mod+plus': { run: () => { touched.current = true; zoomTo(cam.getState().zoom * 2) }, label: 'Zoom in', group: 'View' },
    'mod+-': { run: () => { touched.current = true; zoomTo(cam.getState().zoom / 2) }, label: 'Zoom out', group: 'View' },
  }, [fill, hotkeys], { priority: 0 })

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
        className={cn(bleed ? 'absolute' : 'relative h-full w-full', 'overflow-hidden', fill ? '' : 'touch-none', space && (pan.current ? 'cursor-grabbing' : 'cursor-grab'), className)}
        style={{
          ...(bleed ? BLEED : null),
          background,
          backgroundImage: grid ? `radial-gradient(circle, var(--grid) 1px, transparent 1px)` : undefined,
          backgroundSize: grid ? `${20 * zoom}px ${20 * zoom}px` : undefined,
          backgroundPosition: grid ? `${x}px ${y}px` : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {fill ? <div data-studio-artifact="" className="absolute inset-0">{children}</div> : (
          <div ref={world} className="absolute top-0 left-0 origin-top-left will-change-transform" style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}>
            {children}
          </div>
        )}
        {/* HUD: when the stage bleeds under the panels, keep it in the visible gap (where it always was) */}
        {!present && overlay && (bleed ? <div className="pointer-events-none absolute [&>*]:pointer-events-auto" style={HUD_INSET}>{overlay}</div> : overlay)}
        {hud && !fill && !present && <ZoomPill style={bleed ? { right: HUD_INSET.right, bottom: HUD_INSET.bottom } : layout === 'overlay' ? { right: `calc(${inset.right}px + 12px)`, bottom: `calc(${inset.bottom}px + 12px)` } : undefined} />}
      </div>
    </CamCtx.Provider>
  )
}

const NO_INSET = { top: 0, right: 0, bottom: 0, left: 0 }
/** The visible gap inside a bleeding stage (mirrors Studio's SAFE_INSET). */
const HUD_INSET = {
  top: 'calc(var(--safe-top, 0px) + var(--gutter, 12px))', right: 'calc(var(--safe-right, 0px) + var(--gutter, 12px))',
  bottom: 'calc(var(--safe-bottom, 0px) + var(--gutter, 12px))', left: 'calc(var(--safe-left, 0px) + var(--gutter, 12px))',
} as const
/** Undo the islands content inset (Studio's SAFE_INSET), so the stage covers the whole workspace. */
const BLEED = {
  top: 'calc(-1 * (var(--safe-top, 0px) + var(--gutter, 12px)))', right: 'calc(-1 * (var(--safe-right, 0px) + var(--gutter, 12px)))',
  bottom: 'calc(-1 * (var(--safe-bottom, 0px) + var(--gutter, 12px)))', left: 'calc(-1 * (var(--safe-left, 0px) + var(--gutter, 12px)))',
} as const

/**
 * Zoom pill. Inside a <Stage> it drives that camera; anywhere else (React Flow,
 * a custom canvas) pass zoom / onZoom / onFit.
 */
export function ZoomPill({
  className, style, zoom: zoomProp, onZoom, onFit, step = 1.25, steps, presets, floating = true, extra, fitShortcut = 'shift+1', keys = false,
}: { className?: string; style?: React.CSSProperties; zoom?: number; onZoom?: (z: number) => void; onFit?: () => void; step?: number; /** a zoom ladder (e.g. integer pixel zooms) instead of ×step */ steps?: number[]; /** menu shortcuts (default: the ladder, or 50/100/200%) */ presets?: number[]; floating?: boolean; /** more menu items after "Zoom to fit" (e.g. Zoom to selection) */ extra?: MenuItem[]; /** shown next to Zoom to fit; false hides it */ fitShortcut?: string | false; /** bind `=` / `-` to step in / out */ keys?: boolean }) {
  const cam = useContext(CamCtx) ?? NO_CAMERA
  const camZoom = useStore(cam, (s) => s.zoom)
  const zoom = zoomProp ?? camZoom
  const set = (z: number) => { if (onZoom) onZoom(z); else { cam.touch(); cam.zoomTo(z) } }
  const fit = () => { if (onFit) onFit(); else { cam.untouch(); cam.fit() } }
  const go = (dir: 1 | -1) => steps
    ? (dir > 0 ? steps.find((z) => z > zoom * 1.001) : [...steps].reverse().find((z) => z < zoom * 0.999)) ?? zoom
    : dir > 0 ? zoom * step : zoom / step
  useHotkeys(keys ? {
    '=': { run: () => set(go(1)), label: steps ? 'Zoom in (next step)' : 'Zoom in', group: 'View' },
    '-': { run: () => set(go(-1)), label: steps ? 'Zoom out (next step)' : 'Zoom out', group: 'View' },
  } : {}, [keys, zoom, steps], { priority: 0 })
  const btn = 'flex size-icon-sm items-center justify-center rounded-control text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal'
  const pct = Math.round(zoom * 100)
  return (
    <div style={style} className={cn('cluster flex h-button-lg items-center gap-0.5 px-1', floating && 'absolute right-3 bottom-3 z-10', className)}>
      <button type="button" aria-label="Zoom out" onClick={() => set(go(-1))} className={btn}><Minus size={13} strokeWidth={1.5} /></button>
      <Menu
        side="top"
        align="end"
        trigger={<button type="button" aria-label={`Zoom level ${pct}%`} className="h-icon-sm min-w-[46px] rounded-control px-1 tabular text-ui text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">{pct}%</button>}
        items={[
          { label: 'Zoom to fit', shortcut: fitShortcut || undefined, onClick: fit },
          ...(extra ?? []),
          ...(presets ?? steps ?? [0.5, 1, 2]).map((z) => ({ label: `Zoom to ${Math.round(z * 100)}%`, shortcut: z === 1 ? 'shift+0' : undefined, checked: Math.abs(zoom - z) < 0.001, onClick: () => set(z) })),
        ]}
      />
      <button type="button" aria-label="Zoom in" onClick={() => set(go(1))} className={btn}><Plus size={13} strokeWidth={1.5} /></button>
    </div>
  )
}

/* An artboard: positioned in world space, with a label above its top-left corner. */
export function Artboard({
  width, height, label, x = 0, y = 0, children, className, background = '#ffffff', selected, onSelect, style,
}: { width: number; height: number; label?: ReactNode; x?: number; y?: number; children?: ReactNode; className?: string; background?: string; selected?: boolean; onSelect?: () => void; style?: React.CSSProperties }) {
  const zoom = useStore(useContext(CamCtx) ?? NO_CAMERA, (s) => s.zoom)
  return (
    <div className="absolute" style={{ left: x, top: y, width, height }}>
      {label && (
        <div
          onPointerDown={onSelect}
          className={cn('absolute bottom-full left-0 flex origin-bottom-left items-center gap-1.5 overflow-hidden pb-1.5 text-ui whitespace-nowrap no-select', selected ? 'text-signal-text' : 'text-fg-faint')}
          // never wider than the board on screen, so neighbouring boards' labels can't overlap (cleanup L5)
          style={{ transform: `scale(${1 / zoom})`, maxWidth: Math.max(48, width * zoom) }}
        >
          <span className="min-w-0 truncate">{label}</span>
          <span className="shrink-0 tabular opacity-60">{width} × {height}</span>
        </div>
      )}
      <div
        className={cn('relative h-full w-full overflow-hidden font-artboard', className)}
        style={{
          background,
          // The chrome's Inter features (cv11, ss01) must not leak into the artwork's type.
          fontFeatureSettings: 'normal',
          ...style,
          // Keep the ring even when a shell supplies its own shadow.
          boxShadow: `${style?.boxShadow ?? 'var(--shadow-artboard)'}, 0 0 0 ${1 / zoom}px ${selected ? 'var(--signal)' : 'var(--artboard-ring)'}`,
        }}
        data-studio-artifact=""
      >
        {children}
      </div>
    </div>
  )
}
