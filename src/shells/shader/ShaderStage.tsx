/* The live artwork. Full-bleed (Fill) or a fixed-ratio frame placed clear of
   the floating panels. Renders only when time moves or something changed,
   adapts its drawing resolution to hold the frame rate, and stops when the
   tab is hidden. */
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { TriangleAlert } from 'lucide-react'
import { useStudio, useValues } from '@kit'
import { ShaderRenderer } from './renderer'
import { structureKey } from './codegen'
import { clock, getLayers, params, perf, ui } from './state'
import { ASPECTS } from './output'
import { useFitFrame } from '@kit/stage/fit-frame'

/** The live canvas + its CSS frame, for exports that size from what you see. */
export const live = { canvas: null as HTMLCanvasElement | null }

export function ShaderStage() {
  const { present } = useStudio()
  const aspectKey = useValues(params, (v) => v.aspect)
  const quality = useValues(params, (v) => v.quality)
  const previewing = useStore(ui, (s) => !!s.preview)
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const aspect = ASPECTS[aspectKey] ?? null
  const frame = useFitFrame(wrap, aspect, { pad: present ? 32 : 12 })
  const frameRef = useRef(frame)
  frameRef.current = frame
  useEffect(() => { if (frame.w && frame.h) ui.setState({ frameW: frame.w, frameH: frame.h }) }, [frame.w, frame.h])
  const qualityRef = useRef(quality)
  qualityRef.current = quality

  useEffect(() => {
    const c = canvasRef.current!
    let r: ShaderRenderer
    try { r = new ShaderRenderer(c) } catch (e) { setError((e as Error).message); return }
    live.canvas = c
    let dirty = true
    let lastT = -1
    let last = performance.now()
    let avg = 16.7
    let auto = 1
    let since = 0
    let lastErr: string | null = null
    const mark = () => { dirty = true }
    let key = ''
    const offP = params.subscribe((st) => { dirty = true; const k = structureKey(st.values.layers); if (k !== key) { key = k; since = 0 } })
    const offU = ui.subscribe(mark)

    const tick = () => {
      if (document.hidden) return
      const now = performance.now()
      const dt = Math.min(250, now - last)
      last = now
      const v = params.values()
      const playing = clock.getState().playing && v.speed > 0
      if (playing) {
        avg = avg * 0.92 + dt * 0.08
        perf.fps = 1000 / avg
        perf.ms = avg
      }
      // Auto resolution: drop 15% when frames run long, creep back up when there is headroom.
      const q = qualityRef.current
      // Warm-up after mount / recompiles: first frames include shader compiles and thumbnails.
      if (q === 'auto' && playing && ++since > 60) {
        if (avg > 23 && auto > 0.35) { auto = Math.max(0.35, auto * 0.85); since = 0; avg = 16.7 }
        else if (avg < 17.4 && auto < 1 && since > 90) { auto = Math.min(1, auto * 1.12); since = 0 }
      }
      const s = q === 'auto' ? auto : Number(q) || 1
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const f = frameRef.current
      const bw = Math.max(2, Math.round(f.w * dpr * s))
      const bh = Math.max(2, Math.round(f.h * dpr * s))
      if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; dirty = true }
      const t = clock.time()
      if (!dirty && t === lastT) return
      dirty = false
      lastT = t
      const u = ui.getState()
      r.render(u.preview?.layers ?? getLayers(v), { time: t / 1000, loop: v.loop, seed: u.preview?.seed ?? v.seed, bg: u.preview?.bg ?? v.bg })
      perf.scale = s
      perf.res = `${bw} × ${bh}${q === 'auto' && s < 1 ? ` · ${Math.round(s * 100)}%` : ''}`
      if (r.error !== lastErr) { lastErr = r.error; setError(r.error) }
    }
    const offT = clock.onTick(tick)

    // Hidden tab: stop the clock (and therefore the GPU), resume where we were.
    let resume = false
    const onVis = () => {
      if (document.hidden) { resume = clock.getState().playing; if (resume) clock.pause() }
      else { if (resume) clock.play(); resume = false; last = performance.now(); dirty = true }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => { offP(); offU(); offT(); document.removeEventListener('visibilitychange', onVis); r.dispose(); if (live.canvas === c) live.canvas = null }
  }, [])

  const framed = !!aspect
  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden" style={{ background: framed ? undefined : '#000' }}>
      <canvas
        ref={canvasRef}
        aria-label="Gradient artwork"
        role="img"
        className={framed ? 'absolute shadow-[var(--shadow-artboard)]' : 'absolute'}
        style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
      />
      {framed && !present && frame.w > 0 && (
        <div className="pointer-events-none absolute flex items-center gap-1.5 text-ui text-fg-faint no-select" style={{ left: frame.x, top: frame.y - 20 }}>
          <span>{aspectKey}</span>
          <span className="tabular opacity-70">{frame.w} × {frame.h}</span>
        </div>
      )}
      {previewing && (
        <div className="pointer-events-none absolute top-[60px] left-1/2 -translate-x-1/2 rounded-full bg-overlay px-2.5 py-1 text-ui text-fg-muted shadow-[var(--shadow-cluster)]">
          Previewing — click to apply
        </div>
      )}
      {error && (
        <div className="absolute inset-x-0 bottom-20 mx-auto flex w-fit max-w-[520px] items-start gap-2 rounded-pop bg-overlay px-pad py-2 text-ui text-fg shadow-[var(--shadow-pop)]">
          <TriangleAlert size={14} strokeWidth={1.5} className="mt-px shrink-0 text-rec" />
          <span className="line-clamp-3 font-mono text-ui text-fg-muted">{error}</span>
        </div>
      )}
    </div>
  )
}
