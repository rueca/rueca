/* ---------------------------------------------------------------------------
   Surfaces — how an artifact plugs into the studio, whatever it is made of.

   The contract is three things: a DOM element to own, the params, and the
   clock. Everything else (what renders, which library) is the artifact's
   business. That is what lets the same harness wrap Canvas 2D, WebGL,
   three.js, SVG, DOM, video, or an iframe.

     <CanvasSurface params={params} clock={clock} draw={(ctx, { t, w, h, v }) => …} />
     <MountSurface  params={params} clock={clock} mount={(el, api) => { …vanilla three.js…; return cleanup }} />
     <FrameSurface  src="/prototype/index.html" params={params} />   // postMessage bridge

   Draw functions should be pure in (values, t) so scrubbing, slow-mo and
   frame-accurate export work for free.
--------------------------------------------------------------------------- */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Clock } from '../core/clock'
import type { ParamStore } from '../core/params'
import type { Schema, SchemaValues } from '../core/schema'
import { cn } from '../core/cn'

export interface FrameInfo<V> { t: number; dt: number; w: number; h: number; dpr: number; v: V; frame: number }

export interface SurfaceHandle { canvas: HTMLCanvasElement | null; el: HTMLElement | null; redraw: () => void }

/** Canvas 2D. Handles DPR, resize, and redraws on tick or on param change. */
export const CanvasSurface = forwardRef(function CanvasSurface<S extends Schema>(
  { params, clock, draw, className, width, height, pixelRatio, animate = true }: {
    params: ParamStore<S>
    clock?: Clock
    draw: (ctx: CanvasRenderingContext2D, f: FrameInfo<SchemaValues<S>>) => void
    className?: string
    /** fixed output size in px; omit to fill the parent */
    width?: number
    height?: number
    pixelRatio?: number
    /** redraw every tick (true) or only on param change (false) */
    animate?: boolean
  },
  ref: React.Ref<SurfaceHandle>,
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const frame = useRef(0)
  const redraw = useRef<(dt?: number) => void>(() => {})

  useImperativeHandle(ref, () => ({ canvas: canvas.current, el: canvas.current, redraw: () => redraw.current() }))

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    let w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = pixelRatio ?? Math.min(devicePixelRatio, 2)
      w = width ?? c.clientWidth
      h = height ?? c.clientHeight
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      redraw.current()
    }
    redraw.current = (dt = 0) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawRef.current(ctx, { t: clock?.time() ?? 0, dt, w, h, dpr, v: params.values(), frame: frame.current++ })
    }
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    resize()
    const offTick = clock && animate ? clock.onTick((_t, dt) => redraw.current(dt)) : undefined
    const offParams = params.subscribe(() => (!clock || !animate || !clock.getState().playing) && redraw.current())
    return () => { ro.disconnect(); offTick?.(); offParams() }
  }, [params, clock, width, height, pixelRatio, animate])

  return <canvas ref={canvas} className={cn('block', !width && 'h-full w-full', className)} style={width ? { width, height } : undefined} />
})

/**
 * Hand an element to any renderer. `mount` runs once; read live values via
 * `api.values()` or `api.params.subscribe`. Return a cleanup.
 */
export function MountSurface<S extends Schema>({
  params, clock, mount, className,
}: {
  params: ParamStore<S>
  clock?: Clock
  mount: (el: HTMLDivElement, api: { params: ParamStore<S>; clock?: Clock; values: () => SchemaValues<S> }) => void | (() => void)
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const mountRef = useRef(mount)
  useEffect(() => {
    const cleanup = mountRef.current(el.current!, { params, clock, values: () => params.values() })
    return () => { cleanup?.() }
  }, [params, clock])
  return <div ref={el} className={cn('relative h-full w-full', className)} />
}

/**
 * An iframe artifact (another app, another framework, a built prototype).
 * Values are posted as { type: 'studio:params', values } on every change;
 * the frame can post { type: 'studio:set', key, value } back.
 */
export function FrameSurface<S extends Schema>({ src, params, className, title = 'Prototype' }: { src: string; params?: ParamStore<S>; className?: string; title?: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    if (!params) return
    const post = () => frame.current?.contentWindow?.postMessage({ type: 'studio:params', values: params.values() }, '*')
    const off = params.subscribe(post)
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'studio:ready') post()
      if (e.data?.type === 'studio:set') params.setValue(e.data.key, e.data.value)
    }
    window.addEventListener('message', onMsg)
    frame.current?.addEventListener('load', post)
    return () => { off(); window.removeEventListener('message', onMsg) }
  }, [params])
  return <iframe ref={frame} src={src} title={title} className={cn('block h-full w-full border-0 bg-white', className)} />
}
