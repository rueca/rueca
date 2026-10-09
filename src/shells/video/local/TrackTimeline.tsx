/* ---------------------------------------------------------------------------
   TrackTimeline — a multi-track clip timeline (CapCut / Premiere / Remotion
   Studio). The kit Timeline shows read-only bars; this one edits them.

     tracks    rows with a sticky header: name (double-click to rename),
               hide (eye) and lock. Top track draws on top.
     clips     drag to move (also across tracks), drag either edge to trim,
               click / shift-click to select, double-click to focus. Moves
               and trims snap to the playhead, 0, the end and every other
               clip edge (8px); Alt disables. Locked tracks are inert.
     ruler     drag to scrub · ⌘wheel zooms at the cursor · zoom slider ·
               Fit. Follows the playhead while playing.

   Positions and durations are in ms. The caller owns the data and the
   selection; this reports changes as { id: { start?, dur?, track? } } with
   `final` false while dragging and true on release (one undo step).
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, LockOpen, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { clamp, cn, IconButton, Slider, type Clock } from '@kit'

export interface TTTrack { id: string; name: string; muted: boolean; locked: boolean }
export interface TTClip {
  id: string
  track: string
  start: number
  dur: number
  label: string
  /** any CSS colour; token expressions like var(--accent) recommended */
  color: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  detail?: string
  thumb?: string
  selected?: boolean
  /** entrance / exit ramps drawn on the clip (ms) */
  rampIn?: number
  rampOut?: number
}
export type ClipChange = Record<string, { start?: number; dur?: number; track?: string }>

const HEAD_W = 164
const ROW = 36
const RULER = 26

export interface TrackTimelineProps {
  clock: Clock
  duration: number
  fps: number
  tracks: TTTrack[]
  clips: TTClip[]
  snap?: boolean
  onSeek: (t: number) => void
  onSelect: (ids: string[], mode: 'replace' | 'toggle') => void
  onChange: (changes: ClipChange, final: boolean, original: Record<string, { start: number; dur: number; track: string }>) => void
  onTrackToggle?: (id: string, prop: 'muted' | 'locked') => void
  onTrackRename?: (id: string, name: string) => void
  onClipDoubleClick?: (id: string) => void
  toolbar?: ReactNode
  headerExtra?: ReactNode
  empty?: ReactNode
  height?: number
  className?: string
}

export function TrackTimeline(props: TrackTimelineProps) {
  const { clock, duration, fps, tracks, clips, snap = true, toolbar, empty, height = 236, className } = props
  const scroller = useRef<HTMLDivElement>(null)
  const [vw, setVw] = useState(800)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setVw(e.contentRect.width - HEAD_W))
    ro.observe(scroller.current!)
    return () => ro.disconnect()
  }, [])
  const fitPx = Math.max(0.01, (vw - 48) / Math.max(1, duration))
  const [zoom, setZoom] = useState(1) // × fit
  const ppm = fitPx * zoom // px per ms
  const contentW = Math.max(vw, duration * ppm + 64)
  const X = (ms: number) => ms * ppm
  const frame = 1000 / fps

  /* playhead: painted imperatively; follows while playing */
  const head = useRef<HTMLDivElement>(null)
  const headRuler = useRef<HTMLDivElement>(null)
  const live = useRef({ ppm, vw })
  live.current = { ppm, vw }
  useEffect(() => {
    const paint = () => {
      const x = clock.time() * live.current.ppm
      if (head.current) head.current.style.transform = `translateX(${x}px)`
      if (headRuler.current) headRuler.current.style.transform = `translateX(${x}px)`
      const sc = scroller.current
      if (sc && clock.getState().playing) {
        const view = live.current.vw
        if (x > sc.scrollLeft + view - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 40)
      }
    }
    paint()
    return clock.onTick(paint)
  }, [clock])
  useLayoutEffect(() => {
    const x = clock.time() * ppm
    if (head.current) head.current.style.transform = `translateX(${x}px)`
    if (headRuler.current) headRuler.current.style.transform = `translateX(${x}px)`
  })

  /* ruler ticks */
  const steps = [100, 250, 500, 1000, 2000, 5000, 10000, 30000]
  const labelStep = steps.find((s) => s * ppm >= 64) ?? 30000
  const minor = labelStep / (labelStep >= 1000 ? 4 : 5)
  const ticks: number[] = []
  for (let m = 0; m <= duration + 0.5; m += minor) ticks.push(Math.round(m))
  const fmtTick = (m: number) => {
    const s = m / 1000
    if (labelStep < 1000) return `${s.toFixed(labelStep < 500 ? 2 : 1)}s`
    return s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s)}s`
  }

  const timeAt = (clientX: number) => {
    const r = scroller.current!.getBoundingClientRect()
    return clamp((clientX - r.left - HEAD_W + scroller.current!.scrollLeft) / ppm, 0, duration)
  }
  const scrub = useRef(false)
  const onRulerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    scrub.current = true
    props.onSeek(Math.round(timeAt(e.clientX) / frame) * frame)
  }
  const onRulerMove = (e: React.PointerEvent) => { if (scrub.current) props.onSeek(Math.round(timeAt(e.clientX) / frame) * frame) }
  const onRulerUp = () => { scrub.current = false }

  /* zoom */
  const zoomAt = (z: number, clientX?: number) => {
    const sc = scroller.current!
    const nz = clamp(z, 1, 40)
    const r = sc.getBoundingClientRect()
    const cx = clientX !== undefined ? clientX - r.left - HEAD_W : vw / 2
    const t = (sc.scrollLeft + cx) / ppm
    setZoom(nz)
    requestAnimationFrame(() => { sc.scrollLeft = Math.max(0, t * fitPx * nz - cx) })
  }
  useEffect(() => {
    const sc = scroller.current!
    const on = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(zoom * Math.exp(-e.deltaY * 0.006), e.clientX) } }
    sc.addEventListener('wheel', on, { passive: false })
    return () => sc.removeEventListener('wheel', on)
  })

  /* drag: move / trim */
  const [guide, setGuide] = useState<number | null>(null)
  type Drag = {
    mode: 'move' | 'start' | 'end'; anchor: string; x0: number; y0: number; moved: boolean
    orig: Record<string, { start: number; dur: number; track: string }>; targets: number[]; lo: number; hi: number
  }
  const drag = useRef<Drag | null>(null)
  const trackIndex = (id: string) => tracks.findIndex((t) => t.id === id)

  const begin = (e: React.PointerEvent, c: TTClip, mode: Drag['mode']) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const tr = tracks.find((t) => t.id === c.track)
    if (e.shiftKey || e.metaKey) { props.onSelect([c.id], 'toggle'); return }
    const selected = c.selected ? clips.filter((x) => x.selected) : [c]
    if (!c.selected) props.onSelect([c.id], 'replace')
    if (tr?.locked) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const moving = mode === 'move' ? selected.filter((x) => !tracks.find((t) => t.id === x.track)?.locked) : [c]
    const orig = Object.fromEntries(moving.map((x) => [x.id, { start: x.start, dur: x.dur, track: x.track }]))
    const others = clips.filter((x) => !orig[x.id])
    const targets = [0, duration, clock.time(), ...others.flatMap((x) => [x.start, x.start + x.dur])]
    // trim limits: neighbours on the same track
    const same = others.filter((x) => x.track === c.track)
    const lo = Math.max(0, ...same.filter((x) => x.start + x.dur <= c.start + 0.5).map((x) => x.start + x.dur))
    const hi = Math.min(duration, ...same.filter((x) => x.start >= c.start + c.dur - 0.5).map((x) => x.start))
    drag.current = { mode, anchor: c.id, x0: e.clientX, y0: e.clientY, moved: false, orig, targets, lo, hi }
  }
  const snapTo = (d: Drag, v: number, alt: boolean, exclude?: number) => {
    if (!snap || alt) return { v: Math.round(v / frame) * frame, hit: null as number | null }
    let best = Infinity, hit: number | null = null
    for (const s of d.targets) { if (s === exclude) continue; const d = Math.abs(X(s) - X(v)); if (d < 8 && d < best) { best = d; hit = s } }
    return { v: hit ?? Math.round(v / frame) * frame, hit }
  }
  const compute = (e: React.PointerEvent | PointerEvent, d: Drag): ClipChange => {
    const dt = (e.clientX - d.x0) / ppm
    const a = d.orig[d.anchor]
    const minDur = frame * 3
    if (d.mode === 'start') {
      const end = a.start + a.dur
      const s = snapTo(d, a.start + dt, e.altKey)
      const start = clamp(s.v, d.lo, end - minDur)
      setGuide(s.hit !== null && start === s.v ? start : null)
      return { [d.anchor]: { start, dur: end - start } }
    }
    if (d.mode === 'end') {
      const s = snapTo(d, a.start + a.dur + dt, e.altKey)
      const end = clamp(s.v, a.start + minDur, d.hi)
      setGuide(s.hit !== null && end === s.v ? end : null)
      return { [d.anchor]: { dur: end - a.start } }
    }
    // move: snap the anchor's start or end, whichever is closer to a target
    const s1 = snapTo(d, a.start + dt, e.altKey), s2 = snapTo(d, a.start + a.dur + dt, e.altKey)
    let delta = Math.round(dt / frame) * frame
    let g: number | null = null
    if (s1.hit !== null && (s2.hit === null || Math.abs(s1.hit - (a.start + dt)) <= Math.abs(s2.hit - (a.start + a.dur + dt)))) { delta = s1.hit - a.start; g = s1.hit }
    else if (s2.hit !== null) { delta = s2.hit - (a.start + a.dur); g = s2.hit }
    const vals = Object.values(d.orig)
    delta = clamp(delta, -Math.min(...vals.map((o) => o.start)), duration - Math.max(...vals.map((o) => o.start + o.dur)))
    setGuide(g !== null ? a.start + delta + (g === s2.hit ? a.dur : 0) : null)
    const dRow = Math.round((e.clientY - d.y0) / ROW)
    const out: ClipChange = {}
    for (const [id, o] of Object.entries(d.orig)) {
      const ti = clamp(trackIndex(o.track) + dRow, 0, tracks.length - 1)
      const target = tracks[ti]
      out[id] = { start: o.start + delta, track: target && !target.locked ? target.id : o.track }
    }
    return out
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 3) return
    d.moved = true
    props.onChange(compute(e, d), false, d.orig)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGuide(null)
    if (d?.moved) props.onChange(compute(e, d), true, d.orig)
  }

  /* rename */
  const [renaming, setRenaming] = useState<string | null>(null)

  return (
    <div className={cn('panel flex flex-col overflow-hidden', className)}>
      <div className="flex h-10 flex-none items-center gap-1 px-2">
        {toolbar}
        <div className="flex-1" />
        {props.headerExtra}
        <IconButton icon={ZoomOut} label="Zoom out" tipSide="top" onClick={() => zoomAt(zoom / 1.5)} />
        <div className="w-[88px]"><Slider value={Math.log(zoom)} min={0} max={Math.log(40)} step={0.01} label="Timeline zoom" onChange={(v) => zoomAt(Math.exp(v))} /></div>
        <IconButton icon={ZoomIn} label="Zoom in" tipSide="top" onClick={() => zoomAt(zoom * 1.5)} />
        <IconButton icon={Maximize2} label="Fit to window" tipSide="top" onClick={() => { setZoom(1); if (scroller.current) scroller.current.scrollLeft = 0 }} />
      </div>
      <div ref={scroller} className="relative flex-none overflow-auto border-t border-line" style={{ height }}>
        <div className="relative" style={{ width: HEAD_W + contentW, minHeight: '100%' }}>
          {/* ruler */}
          <div className="sticky top-0 z-20 flex border-b border-line bg-panel" style={{ height: RULER }}>
            <div className="sticky left-0 z-30 flex flex-none items-center border-r border-line bg-panel px-3 text-[11px] text-faint" style={{ width: HEAD_W }}>
              {tracks.length} tracks · {clips.length} clips
            </div>
            <div className="relative flex-none cursor-ew-resize no-select" style={{ width: contentW }} onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={onRulerUp}>
              <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/60" style={{ left: X(duration) }} />
              {ticks.map((m) => {
                const major = m % labelStep === 0
                return (
                  <div key={m} className="pointer-events-none absolute bottom-0" style={{ left: X(m) }}>
                    <div className={cn('w-px', major ? 'h-2 bg-line-strong' : 'h-1 bg-line')} />
                    {major && <div className="absolute bottom-2.5 left-1 tabular text-[10px] text-faint">{fmtTick(m)}</div>}
                  </div>
                )
              })}
              <div ref={headRuler} className="pointer-events-none absolute top-0 left-0 z-10 h-full">
                <div className="absolute top-0 h-[10px] w-[11px] -translate-x-1/2 bg-rec [clip-path:polygon(0_0,100%_0,100%_55%,50%_100%,0_55%)]" />
              </div>
            </div>
          </div>

          {tracks.length === 0 && empty ? <div className="sticky left-0 flex h-[160px] items-center justify-center" style={{ width: HEAD_W + vw }}>{empty}</div> : null}

          {tracks.map((tr) => (
            <div key={tr.id} className="flex border-b border-line" style={{ height: ROW }}>
              <div className={cn('group/track sticky left-0 z-[18] flex flex-none items-center gap-1 border-r border-line bg-panel pr-1 pl-3', tr.muted && 'text-faint')} style={{ width: HEAD_W }}>
                {renaming === tr.id ? (
                  <input autoFocus defaultValue={tr.name}
                    onBlur={(e) => { props.onTrackRename?.(tr.id, e.target.value || tr.name); setRenaming(null) }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
                    className="h-6 min-w-0 flex-1 rounded-[4px] bg-input px-1.5 text-[11.5px] text-fg outline-none shadow-[inset_0_0_0_1px_var(--accent)]" />
                ) : (
                  <span onDoubleClick={() => setRenaming(tr.id)} className="min-w-0 flex-1 truncate text-[11.5px] text-fg">{tr.name}</span>
                )}
                {props.onTrackToggle && (
                  <>
                    <button type="button" aria-label={tr.muted ? 'Show track' : 'Hide track'} aria-pressed={tr.muted} onClick={() => props.onTrackToggle!(tr.id, 'muted')}
                      className={cn('flex size-6 items-center justify-center rounded-[5px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent', !tr.muted && 'opacity-0 group-hover/track:opacity-100')}>
                      {tr.muted ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                    </button>
                    <button type="button" aria-label={tr.locked ? 'Unlock track' : 'Lock track'} aria-pressed={tr.locked} onClick={() => props.onTrackToggle!(tr.id, 'locked')}
                      className={cn('flex size-6 items-center justify-center rounded-[5px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent', !tr.locked && 'opacity-0 group-hover/track:opacity-100')}>
                      {tr.locked ? <Lock size={13} strokeWidth={1.5} /> : <LockOpen size={13} strokeWidth={1.5} />}
                    </button>
                  </>
                )}
              </div>
              <div className={cn('relative flex-none', tr.locked && 'bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--line)_6px_7px)]')} style={{ width: contentW }}
                onPointerDown={(e) => { if (e.button === 0 && e.target === e.currentTarget) { props.onSelect([], 'replace'); props.onSeek(Math.round(timeAt(e.clientX) / frame) * frame) } }}>
                {clips.filter((c) => c.track === tr.id).map((c) => {
                  const Icon = c.icon
                  const w = Math.max(6, X(c.dur))
                  const mix = (p: number) => `color-mix(in oklab, ${c.color} ${p}%, var(--panel))`
                  return (
                    <div key={c.id} role="button" tabIndex={-1} aria-label={c.label} aria-pressed={!!c.selected}
                      onPointerDown={(e) => begin(e, c, 'move')} onPointerMove={onMove} onPointerUp={onUp}
                      onDoubleClick={() => props.onClipDoubleClick?.(c.id)}
                      className={cn('group/clip absolute top-[4px] bottom-[4px] overflow-hidden rounded-[6px] no-select', tr.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing', tr.muted && 'opacity-40')}
                      style={{
                        left: X(c.start), width: w,
                        background: mix(c.selected ? 34 : 24),
                        boxShadow: c.selected ? `0 0 0 1.5px var(--accent), inset 0 0 0 1px ${mix(60)}` : `inset 0 0 0 1px ${mix(46)}`,
                      }}>
                      {c.thumb && <div className="pointer-events-none absolute inset-y-0 right-0 w-[70%] opacity-60" style={{ backgroundImage: `url(${c.thumb})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x', backgroundPosition: 'right center', maskImage: 'linear-gradient(to right, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)' }} />}
                      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: c.color }} />
                      {!!c.rampIn && <div className="pointer-events-none absolute top-0 bottom-0 left-0" style={{ width: Math.min(w, X(c.rampIn)), background: `linear-gradient(to top right, ${c.color} 0 49%, transparent 51%)`, opacity: 0.14 }} />}
                      {!!c.rampOut && <div className="pointer-events-none absolute top-0 right-0 bottom-0" style={{ width: Math.min(w, X(c.rampOut)), background: `linear-gradient(to top left, ${c.color} 0 49%, transparent 51%)`, opacity: 0.14 }} />}
                      <div className="relative flex h-full min-w-0 items-center gap-1.5 px-2">
                        {Icon && w > 34 && <Icon size={12} strokeWidth={1.75} className="shrink-0 text-fg/80" />}
                        {w > 52 && <span className="truncate text-[11px] font-medium text-fg">{c.label}</span>}
                        {c.detail && w > 140 && <span className="truncate text-[10.5px] text-muted">{c.detail}</span>}
                      </div>
                      {!tr.locked && (
                        <>
                          <div onPointerDown={(e) => begin(e, c, 'start')} onPointerMove={onMove} onPointerUp={onUp}
                            className="absolute top-0 bottom-0 left-0 flex w-2 cursor-ew-resize items-center justify-center opacity-0 group-hover/clip:opacity-100">
                            <div className="h-3 w-[3px] rounded-full bg-fg/70" />
                          </div>
                          <div onPointerDown={(e) => begin(e, c, 'end')} onPointerMove={onMove} onPointerUp={onUp}
                            className="absolute top-0 right-0 bottom-0 flex w-2 cursor-ew-resize items-center justify-center opacity-0 group-hover/clip:opacity-100">
                            <div className="h-3 w-[3px] rounded-full bg-fg/70" />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* playhead + snap guide over the tracks */}
          <div className="pointer-events-none absolute top-0 bottom-0 z-[15]" style={{ left: HEAD_W, width: contentW }}>
            <div ref={head} className="absolute top-0 bottom-0 left-0"><div className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-rec" /></div>
            {guide !== null && <div className="absolute top-0 bottom-0 w-px bg-accent" style={{ left: X(guide) }} />}
          </div>
        </div>
      </div>
    </div>
  )
}
