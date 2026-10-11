/* ---------------------------------------------------------------------------
   TrackTimeline — a multi-track CLIP timeline (CapCut / Premiere / Remotion
   Studio / Descript). The read-only <Timeline> shows bars; this edits them.
   Data in, callbacks out: the caller owns tracks, clips and the selection.

     <TrackTimeline clock={clock} duration={8000} fps={30}
       tracks={[{ id: 't1', name: 'Titles', muted: false, locked: false }]}
       clips={[{ id: 'c1', track: 't1', start: 0, dur: 2000, label: 'Hello', color: 'var(--cat-1)', selected: true }]}
       onSeek={seek}
       onSelect={(ids, mode) => …}                         // 'replace' | 'toggle'
       onChange={(changes, final, original) => …}          // { id: { start?, dur?, track? } }
       onDelete={(ids) => …}
       onTrackToggle={(id, 'muted' | 'locked') => …} onTrackRename={(id, name) => …}
       toolbar={<Transport />} />

   Mouse
     clip        drag to move (across tracks too) · drag either edge to trim ·
                 click / shift-click to select · double-click → onClipDoubleClick
     snapping    moves and trims snap to the playhead, 0, the end and every
                 other clip edge within 8px; Alt disables; snap guide in accent
     empty lane  click = deselect + seek
     ruler       drag to scrub · ⌘wheel zooms at the cursor · zoom slider · Fit
     follow      the view scrolls to keep the playhead visible while playing
   Keyboard (non-drag alternatives, WCAG 2.5.7)
     ruler (slider)   ← → one frame (Shift ×10) · Home / End
     clip area        ← → move selected clips a frame (Shift ×10) · Tab cycles
                      the selection through clips in time order · Delete
                      removes (onDelete) · Esc deselects
     track name       double-click, Enter or F2 renames; eye / lock buttons
   Trims have no keyboard path here — expose start / duration fields in your
   inspector (as the video shell does).

   Positions and durations are ms. `onChange` reports final=false while
   dragging and final=true on release (one undo step); `original` holds the
   pre-drag values so the caller can settle overlaps or revert.
   Clip colours are any CSS colour — use tokens (`var(--cat-3)`), never hex.
   (Promoted from shells/video/local/TrackTimeline.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, LockOpen, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import type { Clock } from '../core/clock'
import { IconButton } from '../ui/button'
import { Slider } from '../ui/slider'
import { PlayheadCap, PlayheadLine, RulerTicks, rulerTicks, snapTime, toFrame, usePlayhead } from './ruler'

export interface TimelineTrack { id: string; name: string; muted: boolean; locked: boolean }
export interface TimelineClip {
  id: string
  track: string
  start: number
  dur: number
  label: string
  /** any CSS colour; tokens like var(--cat-2) recommended */
  color: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  detail?: string
  /** image URL tiled along the clip (filmstrip) */
  thumb?: string
  selected?: boolean
  /** entrance / exit ramps drawn on the clip (ms) */
  rampIn?: number
  rampOut?: number
}
export type ClipChange = Record<string, { start?: number; dur?: number; track?: string }>
export type ClipOriginal = Record<string, { start: number; dur: number; track: string }>

export interface TrackTimelineProps {
  clock: Clock
  duration: number
  fps: number
  tracks: TimelineTrack[]
  clips: TimelineClip[]
  snap?: boolean
  /** scroll to keep the playhead in view while playing (default true) */
  follow?: boolean
  onSeek: (t: number) => void
  onSelect: (ids: string[], mode: 'replace' | 'toggle') => void
  onChange: (changes: ClipChange, final: boolean, original: ClipOriginal) => void
  onDelete?: (ids: string[]) => void
  onTrackToggle?: (id: string, prop: 'muted' | 'locked') => void
  onTrackRename?: (id: string, name: string) => void
  onClipDoubleClick?: (id: string) => void
  toolbar?: ReactNode
  /** extra controls before the zoom cluster */
  headerExtra?: ReactNode
  empty?: ReactNode
  /** height of the scrolling tracks area (px) */
  height?: number
  headerWidth?: number
  rowHeight?: number
  className?: string
}

const RULER = 26

export function TrackTimeline(props: TrackTimelineProps) {
  const { clock, duration, fps, tracks, clips, snap = true, follow = true, toolbar, empty, height = 236, headerWidth: HEAD_W = 164, rowHeight: ROW = 36, className } = props
  const scroller = useRef<HTMLDivElement>(null)
  const [vw, setVw] = useState(800)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setVw(Math.max(1, e.contentRect.width - HEAD_W)))
    ro.observe(scroller.current!)
    return () => ro.disconnect()
  }, [HEAD_W])
  // content is duration·ppm + 64, so fit must leave the same 64 or the track is always 16px too wide (L6)
  const fitPx = Math.max(0.01, (vw - 64) / Math.max(1, duration))
  const [zoom, setZoom] = useState(1) // × fit
  const ppm = fitPx * zoom // px per ms
  const contentW = Math.max(vw, duration * ppm + 64)
  const X = (ms: number) => ms * ppm
  const frame = 1000 / fps

  /* ---------- playhead: painted from the clock; follows while playing ---------- */
  const head = useRef<HTMLDivElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  const rulerEl = useRef<HTMLDivElement>(null)
  usePlayhead(clock, (t) => t * ppm, [head, cap], (x, t) => {
    const sc = scroller.current
    if (sc && follow && clock.getState().playing && (x > sc.scrollLeft + vw - 40 || x < sc.scrollLeft)) sc.scrollLeft = Math.max(0, x - 40)
    const r = rulerEl.current
    if (r) { r.setAttribute('aria-valuenow', String(Math.round(t))); r.setAttribute('aria-valuetext', `${(t / 1000).toFixed(2)} seconds`) }
  })

  /* ---------- ruler ---------- */
  const ticks = rulerTicks(0, duration, ppm, 64)
  const timeAt = (clientX: number) => {
    const r = scroller.current!.getBoundingClientRect()
    return clamp((clientX - r.left - HEAD_W + scroller.current!.scrollLeft) / ppm, 0, duration)
  }
  const scrub = useRef(false)
  const onRulerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    scrub.current = true
    props.onSeek(toFrame(timeAt(e.clientX), fps))
  }
  const onRulerMove = (e: React.PointerEvent) => { if (scrub.current) props.onSeek(toFrame(timeAt(e.clientX), fps)) }
  const onRulerUp = () => { scrub.current = false }
  const onRulerKey = (e: React.KeyboardEvent) => {
    const step = frame * (e.shiftKey ? 10 : 1)
    const now = clock.time()
    const t = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? now + step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? now - step : e.key === 'Home' ? 0 : e.key === 'End' ? duration : null
    if (t === null) return
    e.preventDefault(); e.stopPropagation()
    props.onSeek(toFrame(clamp(t, 0, duration), fps))
  }

  /* ---------- zoom ---------- */
  const zoomAt = (z: number, clientX?: number) => {
    const sc = scroller.current!
    const nz = clamp(z, 1, 40)
    const r = sc.getBoundingClientRect()
    const cx = clientX !== undefined ? clientX - r.left - HEAD_W : vw / 2
    const t = (sc.scrollLeft + cx) / ppm
    setZoom(nz)
    requestAnimationFrame(() => { sc.scrollLeft = Math.max(0, t * fitPx * nz - cx) })
  }
  const zoomRef = useRef(zoomAt)
  zoomRef.current = zoomAt
  const zoomNow = useRef(zoom)
  zoomNow.current = zoom
  useEffect(() => {
    const sc = scroller.current!
    const on = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomRef.current(zoomNow.current * Math.exp(-e.deltaY * 0.006), e.clientX) } }
    sc.addEventListener('wheel', on, { passive: false })
    return () => sc.removeEventListener('wheel', on)
  }, [])

  /* ---------- drag: move / trim ---------- */
  const [guide, setGuide] = useState<number | null>(null)
  type Drag = { mode: 'move' | 'start' | 'end'; anchor: string; x0: number; y0: number; moved: boolean; orig: ClipOriginal; targets: number[]; lo: number; hi: number }
  const drag = useRef<Drag | null>(null)
  const trackIndex = (id: string) => tracks.findIndex((t) => t.id === id)
  const lockedTrack = (id: string) => !!tracks.find((t) => t.id === id)?.locked

  const begin = (e: React.PointerEvent, c: TimelineClip, mode: Drag['mode']) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (e.shiftKey || e.metaKey || e.ctrlKey) { props.onSelect([c.id], 'toggle'); return }
    const selected = c.selected ? clips.filter((x) => x.selected) : [c]
    if (!c.selected) props.onSelect([c.id], 'replace')
    if (lockedTrack(c.track)) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const moving = mode === 'move' ? selected.filter((x) => !lockedTrack(x.track)) : [c]
    const orig: ClipOriginal = Object.fromEntries(moving.map((x) => [x.id, { start: x.start, dur: x.dur, track: x.track }]))
    const others = clips.filter((x) => !orig[x.id])
    const targets = [0, duration, clock.time(), ...others.flatMap((x) => [x.start, x.start + x.dur])]
    // trim limits: neighbours on the same track
    const same = others.filter((x) => x.track === c.track)
    const lo = Math.max(0, ...same.filter((x) => x.start + x.dur <= c.start + 0.5).map((x) => x.start + x.dur))
    const hi = Math.min(duration, ...same.filter((x) => x.start >= c.start + c.dur - 0.5).map((x) => x.start))
    drag.current = { mode, anchor: c.id, x0: e.clientX, y0: e.clientY, moved: false, orig, targets, lo, hi }
  }
  const snapTo = (d: Drag, v: number, alt: boolean) => {
    if (!snap || alt) return { v: toFrame(v, fps), hit: null as number | null }
    const s = snapTime(v, d.targets, X, 8)
    return { v: s.hit ?? toFrame(v, fps), hit: s.hit }
  }
  const compute = (e: React.PointerEvent, d: Drag): ClipChange => {
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
    let delta = toFrame(dt, fps)
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

  /* ---------- keyboard on the clip area ---------- */
  const onAreaKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    const sel = clips.filter((c) => c.selected && !lockedTrack(c.track))
    let handled = true
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (!sel.length) handled = false
      else {
        const frames = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1)
        const delta = clamp(frames * frame, -Math.min(...sel.map((c) => c.start)), duration - Math.max(...sel.map((c) => c.start + c.dur)))
        const orig: ClipOriginal = Object.fromEntries(sel.map((c) => [c.id, { start: c.start, dur: c.dur, track: c.track }]))
        if (delta) props.onChange(Object.fromEntries(sel.map((c) => [c.id, { start: c.start + delta }])), true, orig)
      }
    } else if (e.key === 'Tab' && clips.length) {
      const order = [...clips].sort((a, b) => a.start - b.start || trackIndex(a.track) - trackIndex(b.track))
      const cur = order.findIndex((c) => c.selected)
      const next = cur + (e.shiftKey ? -1 : 1)
      if (next < 0 || next >= order.length) handled = false // let focus leave the timeline
      else props.onSelect([order[next].id], 'replace')
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && props.onDelete && sel.length) props.onDelete(sel.map((c) => c.id))
    else if (e.key === 'Escape' && clips.some((c) => c.selected)) props.onSelect([], 'replace')
    else handled = false
    if (handled) { e.preventDefault(); e.stopPropagation() }
  }

  /* ---------- rename ---------- */
  const [renaming, setRenaming] = useState<string | null>(null)
  const selCount = clips.filter((c) => c.selected).length

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
            <div className="sticky left-0 z-30 flex flex-none items-center border-r border-line bg-panel px-3 text-[11px] text-fg-faint" style={{ width: HEAD_W }}>
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} · {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
            </div>
            <div className="relative flex-none" style={{ width: contentW }}>
              <div ref={rulerEl} role="slider" tabIndex={0} aria-label="Playhead" aria-valuemin={0} aria-valuemax={Math.round(duration)}
                className="absolute inset-0 cursor-ew-resize outline-none no-select focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]"
                onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={onRulerUp} onKeyDown={onRulerKey}>
                <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/60" style={{ left: X(duration) }} />
                <RulerTicks ticks={ticks} x={X} />
              </div>
              <PlayheadCap ref={cap} className="z-10" />
            </div>
          </div>

          {tracks.length === 0 && empty ? <div className="sticky left-0 flex h-[160px] items-center justify-center" style={{ width: HEAD_W + vw }}>{empty}</div> : null}

          <div role="group" tabIndex={tracks.length ? 0 : -1} onKeyDown={onAreaKey}
            aria-label={`Clips, ${selCount} selected. Tab cycles clips, arrow keys move them a frame, Delete removes.`}
            className="relative outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]">
            {tracks.map((tr) => (
              <div key={tr.id} className="flex border-b border-line" style={{ height: ROW }}>
                <div className={cn('group/track sticky left-0 z-[18] flex flex-none items-center gap-1 border-r border-line bg-panel pr-1 pl-3', tr.muted && 'text-fg-faint')} style={{ width: HEAD_W }}>
                  {renaming === tr.id ? (
                    <input autoFocus defaultValue={tr.name} aria-label="Track name" onFocus={(e) => e.currentTarget.select()}
                      onBlur={(e) => { props.onTrackRename?.(tr.id, e.target.value || tr.name); setRenaming(null) }}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
                      className="h-6 min-w-0 flex-1 rounded-[4px] bg-control px-1.5 text-[11.5px] text-fg outline-none shadow-[inset_0_0_0_1px_var(--signal)]" />
                  ) : (
                    <button type="button" tabIndex={props.onTrackRename ? 0 : -1}
                      onDoubleClick={() => props.onTrackRename && setRenaming(tr.id)}
                      onKeyDown={(e) => { if (props.onTrackRename && (e.key === 'Enter' || e.key === 'F2')) { e.preventDefault(); e.stopPropagation(); setRenaming(tr.id) } }}
                      title={props.onTrackRename ? 'Double-click or Enter to rename' : undefined}
                      className={cn('min-w-0 flex-1 truncate rounded-[4px] text-left text-[11.5px] outline-none focus-visible:ring-2 focus-visible:ring-signal', tr.muted ? 'text-fg-faint' : 'text-fg')}>
                      {tr.name}
                    </button>
                  )}
                  {props.onTrackToggle && (
                    <>
                      <button type="button" aria-label={tr.muted ? `Show ${tr.name}` : `Hide ${tr.name}`} aria-pressed={tr.muted} onClick={() => props.onTrackToggle!(tr.id, 'muted')}
                        className={cn('flex size-6 items-center justify-center rounded-[5px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal', !tr.muted && 'opacity-0 group-hover/track:opacity-100 group-focus-within/track:opacity-100')}>
                        {tr.muted ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                      </button>
                      <button type="button" aria-label={tr.locked ? `Unlock ${tr.name}` : `Lock ${tr.name}`} aria-pressed={tr.locked} onClick={() => props.onTrackToggle!(tr.id, 'locked')}
                        className={cn('flex size-6 items-center justify-center rounded-[5px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal', !tr.locked && 'opacity-0 group-hover/track:opacity-100 group-focus-within/track:opacity-100')}>
                        {tr.locked ? <Lock size={13} strokeWidth={1.5} /> : <LockOpen size={13} strokeWidth={1.5} />}
                      </button>
                    </>
                  )}
                </div>
                <div className={cn('relative flex-none', tr.locked && 'bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--line)_6px_7px)]')} style={{ width: contentW }}
                  onPointerDown={(e) => { if (e.button === 0 && e.target === e.currentTarget) { props.onSelect([], 'replace'); props.onSeek(toFrame(timeAt(e.clientX), fps)) } }}>
                  {clips.filter((c) => c.track === tr.id).map((c) => {
                    const Icon = c.icon
                    const w = Math.max(6, X(c.dur))
                    const mix = (p: number) => `color-mix(in oklab, ${c.color} ${p}%, var(--panel))`
                    return (
                      <div key={c.id} role="button" tabIndex={-1} aria-label={`${c.label}, ${(c.start / 1000).toFixed(2)}s to ${((c.start + c.dur) / 1000).toFixed(2)}s`} aria-pressed={!!c.selected}
                        onPointerDown={(e) => begin(e, c, 'move')} onPointerMove={onMove} onPointerUp={onUp}
                        onDoubleClick={() => props.onClipDoubleClick?.(c.id)}
                        className={cn('group/clip absolute top-[4px] bottom-[4px] overflow-hidden rounded-[6px] no-select', tr.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing', tr.muted && 'opacity-40')}
                        style={{
                          left: X(c.start), width: w,
                          // painted as an image layer so the fill composites over the panel exactly
                          backgroundImage: `linear-gradient(${mix(c.selected ? 34 : 24)}, ${mix(c.selected ? 34 : 24)})`,
                          boxShadow: c.selected ? `0 0 0 1.5px var(--signal), inset 0 0 0 1px ${mix(60)}` : `inset 0 0 0 1px ${mix(46)}`,
                        }}>
                        {c.thumb && <div className="pointer-events-none absolute inset-y-0 right-0 w-[70%] opacity-60" style={{ backgroundImage: `url(${c.thumb})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x', backgroundPosition: 'right center', maskImage: 'linear-gradient(to right, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)' }} />}
                        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: c.color }} />
                        {!!c.rampIn && <div className="pointer-events-none absolute top-0 bottom-0 left-0" style={{ width: Math.min(w, X(c.rampIn)), background: `linear-gradient(to top right, ${c.color} 0 49%, transparent 51%)`, opacity: 0.14 }} />}
                        {!!c.rampOut && <div className="pointer-events-none absolute top-0 right-0 bottom-0" style={{ width: Math.min(w, X(c.rampOut)), background: `linear-gradient(to top left, ${c.color} 0 49%, transparent 51%)`, opacity: 0.14 }} />}
                        <div className="relative flex h-full min-w-0 items-center gap-1.5 px-2">
                          {Icon && w > 34 && <Icon size={12} strokeWidth={1.75} className="shrink-0 text-fg/80" />}
                          {w > 52 && <span className="truncate text-[11px] font-medium text-fg">{c.label}</span>}
                          {c.detail && w > 140 && <span className="truncate text-[10.5px] text-fg-muted">{c.detail}</span>}
                        </div>
                        {!tr.locked && (
                          <>
                            <div aria-hidden onPointerDown={(e) => begin(e, c, 'start')} onPointerMove={onMove} onPointerUp={onUp}
                              className="absolute top-0 bottom-0 left-0 flex w-2 cursor-ew-resize items-center justify-center opacity-0 group-hover/clip:opacity-100">
                              <div className="h-3 w-[3px] rounded-full bg-fg/70" />
                            </div>
                            <div aria-hidden onPointerDown={(e) => begin(e, c, 'end')} onPointerMove={onMove} onPointerUp={onUp}
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
          </div>

          {/* playhead + snap guide over the tracks */}
          <div className="pointer-events-none absolute top-0 bottom-0 z-[15]" style={{ left: HEAD_W, width: contentW }}>
            <PlayheadLine ref={head} className="z-0" />
            {guide !== null && <div className="absolute top-0 bottom-0 w-px bg-signal" style={{ left: X(guide) }} />}
          </div>
        </div>
      </div>
    </div>
  )
}
