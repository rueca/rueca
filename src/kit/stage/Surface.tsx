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
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import type { Clock } from '../core/clock'
import type { ParamStore } from '../core/params'
import type { Schema, SchemaValues } from '../core/schema'
import { cn } from '../core/cn'

export interface FrameInfo<V> { t: number; dt: number; w: number; h: number; dpr: number; v: V; frame: number }

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
  const { params, clock, width, height, pixelRatio, animate = true } = p

  useImperativeHandle(p.ref, () => ({ get canvas() { return canvas.current }, get el() { return canvas.current }, redraw: () => redraw.current(), invalidate: () => redraw.current() }), [])
  const sizeRef = useRef(p.size)
  sizeRef.current = p.size

  useEffect(() => {
    const c = canvas.current!
    const ctx = getContext(c)
    let w = 0, h = 0, dpr = 1, t0 = performance.now()
    const resize = () => {
      dpr = pixelRatio ?? Math.min(devicePixelRatio, 2)
      w = width ?? c.clientWidth
      h = height ?? c.clientHeight
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
 * WebGL2. `setup(gl)` runs once per context and returns whatever you need
 * (programs, buffers); `draw(gl, frame, state)` runs per tick. The viewport is
 * set to the drawing buffer for you. preserveDrawingBuffer is on so PNG export works.
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
  useEffect(() => {
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
export function FrameSurface<S extends Schema>({ src, params, className, title = 'Prototype' }: { src: string; params?: ParamStore<S>; className?: string; title?: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    if (!params) return
    const post = () => frame.current?.contentWindow?.postMessage({ type: 'studio:params', values: params.toJSON({ shareable: false }) }, '*')
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
  }, [params])
  return <iframe ref={frame} src={src} title={title} className={cn('block h-full w-full border-0 bg-white', className)} />
}
