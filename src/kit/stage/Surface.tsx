/* ---------------------------------------------------------------------------
   Surfaces — how an artifact plugs into the studio, whatever it is made of.

   The contract is three things: a DOM element to own, the params, and the
   clock. Everything else (what renders, which library) is the artifact's
   business. That is what lets the same harness wrap Canvas 2D, WebGL,
   three.js, SVG, DOM, video, or an iframe.

     <CanvasSurface params={params} clock={clock} draw={(ctx, { t, w, h, v }) => …} />
     <WebGLSurface  params={params} clock={clock} setup={(gl) => prog} draw={(gl, f, prog) => …} />
     <MountSurface  params={params} clock={clock} mount={(el, api) => { …vanilla three.js…; return cleanup }} />
     <FrameSurface  src="/prototype/index.html" params={params} />   // postMessage bridge

   Draw functions should be pure in (values, t) so scrubbing, slow-mo and
   frame-accurate export work for free.
--------------------------------------------------------------------------- */
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { Hand, MousePointer2 } from 'lucide-react'
import type { Clock } from '../core/clock'
import type { ParamStore } from '../core/params'
import type { Schema, SchemaValues } from '../core/schema'
import { cn } from '../core/cn'
import { MAX_CANVAS_SIDE, MAX_PREVIEW_AREA, type RenderFrame } from '../core/io'
import { useHotkeys } from '../core/hotkeys'
import { IconButton } from '../ui/button'

/** `t` and `dt` in ms, `w` / `h` the logical size in css px, `dpr` the pixels per css px, `frame` a counter. */
export type FrameInfo<V> = RenderFrame<V>

export interface SurfaceHandle { canvas: HTMLCanvasElement | null; el: HTMLElement | null; redraw: () => void; /** alias of redraw — call when non-param inputs change */ invalidate: () => void }

interface CanvasCommon<S extends Schema> {
  params: ParamStore<S>
  /** omit for a static picture; with `animate` and no clock, the surface runs its own rAF */
  clock?: Clock
  className?: string
  /** fixed output size in css px; omit to fill the parent */
  width?: number
  height?: number
  pixelRatio?: number
  /** redraw every tick (true) or only on param change / deps change (false) */
  animate?: boolean
  /** extra inputs that should trigger a redraw (a doc store's version, a selection) */
  deps?: unknown[]
  /** drawing-buffer size per frame (adaptive resolution, native image pixels). Default css size × dpr. */
  size?: (cssW: number, cssH: number, dpr: number) => { w: number; h: number }
  ref?: Ref<SurfaceHandle>
}

/** Shared size / tick / redraw plumbing for canvas-backed surfaces. */
function useCanvasLoop<S extends Schema, C>(
  canvas: React.RefObject<HTMLCanvasElement | null>,
  p: CanvasCommon<S>,
  getContext: (c: HTMLCanvasElement) => C,
  paint: (ctx: C, f: FrameInfo<SchemaValues<S>>) => void,
) {
  const paintRef = useRef(paint)
  paintRef.current = paint
  const frame = useRef(0)
  const redraw = useRef<(dt?: number) => void>(() => {})
  // Without a clock a surface is a static picture unless you ask for `animate` (break-it DX14).
  const { params, clock, width, height, pixelRatio, animate = !!clock } = p

  useImperativeHandle(p.ref, () => ({ get canvas() { return canvas.current }, get el() { return canvas.current }, redraw: () => redraw.current(), invalidate: () => redraw.current() }), [])
  const sizeRef = useRef(p.size)
  sizeRef.current = p.size

  useEffect(() => {
    const c = canvas.current!
    const ctx = getContext(c)
    let w = 0, h = 0, dpr = 1, t0 = performance.now()
    const resize = () => {
      w = width ?? c.clientWidth
      h = height ?? c.clientHeight
      // A preview canvas is never bigger than a phone can hold: past ~16.7 MP iOS Safari draws nothing,
      // and past 16k a side every browser does. A 4K artboard at 2× would be 33 MP (break-it B3-S7).
      const cap = Math.sqrt(MAX_PREVIEW_AREA / Math.max(1, w * h))
      dpr = Math.min(pixelRatio ?? Math.min(devicePixelRatio, 2), cap, MAX_CANVAS_SIDE / Math.max(1, w, h))
      c.width = Math.max(1, Math.round(w * dpr))
      c.height = Math.max(1, Math.round(h * dpr))
      redraw.current()
    }
    redraw.current = (dt = 0) => {
      if (sizeRef.current) {
        const want = sizeRef.current(w, h, dpr)
        const bw = Math.max(1, Math.round(want.w)), bh = Math.max(1, Math.round(want.h))
        if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh }
      }
      const t = clock ? clock.time() : performance.now() - t0
      paintRef.current(ctx, { t, dt, w, h, dpr, v: params.values() as SchemaValues<S>, frame: frame.current++ })
    }
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    resize()
    let raf = 0
    let offTick: (() => void) | undefined
    if (animate && clock) offTick = clock.onTick((_t, dt) => redraw.current(dt))
    else if (animate) {
      let last = performance.now()
      const loop = (now: number) => { raf = requestAnimationFrame(loop); if (document.hidden) return; redraw.current(now - last); last = now }
      raf = requestAnimationFrame(loop)
      t0 = performance.now()
    }
    const offParams = params.subscribe(() => (!animate || (clock && !clock.getState().playing)) && redraw.current())
    return () => { ro.disconnect(); offTick?.(); cancelAnimationFrame(raf); offParams() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, clock, width, height, pixelRatio, animate])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { redraw.current() }, p.deps ?? [])
}

/** Canvas 2D. Handles DPR, resize, and redraws on tick, param change or `deps` change. */
export function CanvasSurface<S extends Schema>(
  props: CanvasCommon<S> & { draw: (ctx: CanvasRenderingContext2D, f: FrameInfo<SchemaValues<S>>) => void },
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useCanvasLoop(canvas, props, (c) => c.getContext('2d')!, (ctx, f) => { ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); props.draw(ctx, f) })
  const { width, height, className } = props
  return <canvas ref={canvas} className={cn('block', !width && 'h-full w-full', className)} style={width ? { width, height } : undefined} />
}

/**
 * WebGL2 (a `webgl2` context; there is no WebGL1 fallback). `setup(gl)` runs once per context and returns
 * whatever you need (programs, buffers); `draw(gl, frame, state)` runs per tick with the same frame as
 * CanvasSurface. The viewport is set to the drawing buffer for you: size shaders by
 * `gl.drawingBufferWidth` / `Height` (`f.w × f.dpr` unless `size` changes it), not by `f.w`. preserveDrawingBuffer is on, so the
 * canvas still holds the last frame after it ends (comment thumbnails, a quick copy). For a sharp export,
 * re-render with renderWebGLPNG(setup, draw, …) rather than upscaling this canvas.
 */
export function WebGLSurface<S extends Schema, State = unknown>(
  props: CanvasCommon<S> & {
    setup: (gl: WebGL2RenderingContext) => State
    draw: (gl: WebGL2RenderingContext, f: FrameInfo<SchemaValues<S>>, state: State) => void
    dispose?: (gl: WebGL2RenderingContext, state: State) => void
    attributes?: WebGLContextAttributes
  },
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef<{ gl: WebGL2RenderingContext; s: State } | null>(null)
  useCanvasLoop(canvas, props, (c) => {
    const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true, premultipliedAlpha: true, ...props.attributes })!
    state.current = { gl, s: props.setup(gl) }
    return gl
  }, (gl, f) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    props.draw(gl, f, state.current!.s)
  })
  useEffect(() => () => { const st = state.current; if (st && props.dispose) props.dispose(st.gl, st.s) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const { width, height, className } = props
  return <canvas ref={canvas} className={cn('block', !width && 'h-full w-full', className)} style={width ? { width, height } : undefined} />
}

/**
 * Hand an element to any renderer. `mount` runs once; read live values via
 * `api.values()` or `api.params.subscribe`. Return a cleanup — or an object
 * with `dispose` plus anything you want reachable through the ref (`handle`).
 */
export function MountSurface<S extends Schema, H extends object = object>({
  params, clock, mount, className, ref,
}: {
  params: ParamStore<S>
  clock?: Clock
  mount: (el: HTMLDivElement, api: { params: ParamStore<S>; clock?: Clock; values: () => SchemaValues<S> }) => void | (() => void) | (H & { dispose?: () => void })
  className?: string
  ref?: Ref<{ el: HTMLDivElement | null; handle: H | null }>
}) {
  const el = useRef<HTMLDivElement>(null)
  const handle = useRef<H | null>(null)
  const mountRef = useRef(mount)
  // getters: the handle exists only after mount() runs, which is after the ref is attached
  useImperativeHandle(ref, () => ({ get el() { return el.current }, get handle() { return handle.current } }), [])
  // Layout effect: cleanup runs BEFORE React removes the element, so renderers that unbind from
  // el.getRootNode() (OrbitControls) still find `document` — else they leak (break-it PERF-1).
  useLayoutEffect(() => {
    const out = mountRef.current(el.current!, { params, clock, values: () => params.values() as SchemaValues<S> })
    if (out && typeof out === 'object') handle.current = out as H
    return () => {
      if (typeof out === 'function') out()
      else if (out && typeof out === 'object') (out as { dispose?: () => void }).dispose?.()
      handle.current = null
    }
  }, [params, clock])
  return <div ref={el} className={cn('relative h-full w-full', className)} />
}

/**
 * An iframe artifact (another app, another framework, a built prototype).
 * Values are posted as { type: 'studio:params', values } on every change;
 * the frame can post { type: 'studio:set', key, value } back.
 * Drop public/studio-bridge.js into the prototype for a 6-line hookup.
 */
/** Mirror scalar values to CSS custom properties (`accentColor` → `--accent-color`), like studio-bridge's `cssVars()`. */
export interface CssVarsOptions {
  /** only these param keys (default: every scalar) — keep texts and private knobs off the client's page */
  keys?: string[]
  /** numbers written without a unit */
  unitless?: string[]
  /** unit for numbers (default 'px'); per key: `{ headlineSize: 'rem', gap: 'px' }` */
  suffix?: string | Record<string, string>
}
export function writeCssVars(doc: Document, values: Record<string, unknown>, o: CssVarsOptions = {}) {
  const s = doc.documentElement.style
  for (const [k, val] of Object.entries(values)) {
    if (o.keys && !o.keys.includes(k)) continue
    const name = '--' + k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    const unit = typeof o.suffix === 'object' ? (o.suffix[k] ?? 'px') : (o.suffix ?? 'px')
    if (typeof val === 'number') s.setProperty(name, o.unitless?.includes(k) ? String(val) : val + unit)
    else if (typeof val === 'string' || typeof val === 'boolean') s.setProperty(name, String(val))
  }
}

/** The inverse of writeCssVars: read a page's own custom properties (`--headline-size: 64px` → headlineSize: 64), so a
    wrapped page's current values become the tool's starting point and the client team's edits carry through (t4 judge).
    Numbers lose their unit; anything else stays a string. Only keys that exist on the page come back. */
export function readCssVars(doc: Document, keys: string[]): Record<string, string | number> {
  const cs = doc.defaultView?.getComputedStyle(doc.documentElement)
  const out: Record<string, string | number> = {}
  if (!cs) return out
  for (const k of keys) {
    const raw = cs.getPropertyValue('--' + k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()).trim()
    if (!raw) continue
    const n = /^-?\d*\.?\d+(px|rem|em|%|s|ms|deg)?$/.test(raw) ? parseFloat(raw) : NaN
    out[k] = Number.isFinite(n) ? n : raw
  }
  return out
}

/**
 * An existing page in an iframe. Two ways to drive it:
 *  - same-origin page (served by your dev server): `apply={(doc, v) => …}` and/or `cssVars` write straight
 *    into its DOM — the page needs NO changes, so a client's file stays untouched;
 *  - any other page: add studio-bridge.js to it and handle values there (postMessage, always sent).
 */
export function FrameSurface<S extends Schema>({ src, params, className, title = 'Prototype', apply, cssVars, shield }: {
  src: string; params?: ParamStore<S>; className?: string; title?: string
  /** a transparent cover so the canvas camera can pan/zoom over the page ("Hand" mode); pair with
      `useInteractMode()` and `<InteractToggle>` so I flips to using the page itself */
  shield?: boolean
  /** same-origin only: write values into the page's document (runs on load and on every change) */
  apply?: (doc: Document, values: SchemaValues<S>) => void
  /** same-origin only: mirror scalar values to CSS custom properties on the page's :root */
  cssVars?: boolean | CssVarsOptions
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const applyRef = useRef(apply)
  applyRef.current = apply
  const varsRef = useRef(cssVars)
  varsRef.current = cssVars
  useEffect(() => {
    if (!params) return
    const direct = () => {
      const vars = varsRef.current
      if (!applyRef.current && !vars) return
      let doc: Document | null = null
      try { doc = frame.current?.contentDocument ?? null } catch { /* cross-origin: use the bridge */ }
      if (!doc?.documentElement) return
      const v = params.values() as SchemaValues<S>
      try {
        if (vars) writeCssVars(doc, v as Record<string, unknown>, vars === true ? {} : vars)
        applyRef.current?.(doc, v)
      } catch (err) { console.error('[studio] FrameSurface apply failed:', err) }
    }
    // Values (private ones too) go only to the origin of `src`, never to whatever the frame navigated to (break-it B5-11).
    let target = '*'
    try { const o = new URL(src, location.href).origin; if (o !== 'null') target = o } catch { /* keep '*' for odd srcs */ }
    const post = () => { frame.current?.contentWindow?.postMessage({ type: 'studio:params', values: params.toJSON({ shareable: false }) }, target); direct() }
    const off = params.subscribe(post)
    let commitTimer: ReturnType<typeof setTimeout> | undefined
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'studio:ready') post()
      if (e.data?.type === 'studio:set' && typeof e.data.key === 'string') {
        // Validated by the store (wrong types are coerced or rejected). Typing in the page
        // arrives per keystroke — coalesce into one undo step after a short pause.
        params.setValue(e.data.key, e.data.value, { commit: false })
        clearTimeout(commitTimer)
        commitTimer = setTimeout(() => params.commit(), 400)
      }
    }
    window.addEventListener('message', onMsg)
    const f = frame.current
    f?.addEventListener('load', post)
    return () => { off(); clearTimeout(commitTimer); params.commit(); window.removeEventListener('message', onMsg); f?.removeEventListener('load', post) }
  }, [params, src])
  const iframe = <iframe ref={frame} src={src} title={title} className={cn('block h-full w-full border-0 bg-white', className)} />
  if (shield === undefined) return iframe
  return <div className="relative h-full w-full">{iframe}{shield && <div className="absolute inset-0" aria-hidden data-studio-shield />}</div>
}

/** Hand vs Interact (Figma's design vs prototype): iframes swallow pointer and wheel events, so a shield
    covers them while you pan the canvas; `I` hands the pointer to the page. */
export function useInteractMode(key = 'i') {
  const [interact, setInteract] = useState(false)
  useHotkeys({ [key]: { run: () => setInteract((v) => !v), label: 'Hand / interact with the page', group: 'View' } }, [])
  return [interact, setInteract] as const
}
export function InteractToggle({ interact, onChange }: { interact: boolean; onChange: (v: boolean) => void }) {
  return <IconButton icon={interact ? MousePointer2 : Hand} label={interact ? 'Interacting with the page' : 'Panning the canvas'} shortcut="i" active={interact} onClick={() => onChange(!interact)} />
}
