/* ---------------------------------------------------------------------------
   KeyframeTimeline — an EDITABLE keyframe timeline (the kit Timeline draws
   `kind: 'keys'` lanes but is read-only). Figma Motion / Rive / Theatre.js
   grammar:

     group rows   an object; summary diamonds move every key at that time
     prop rows    one animated property; diamonds + the segments between them
     diamonds     click select · shift/⌘ toggle · drag to retime (snaps to
                  playhead, other keys, 0 and the end; Alt disables snap) ·
                  double-click seeks · drag on empty track = marquee
     segments     click → onSegmentClick(anchorRect) for an easing popover;
                  dashed = hold
     ruler        drag to scrub; drag the end marker to change duration
     ⌘wheel       zoom at the cursor · shift-wheel / trackpad x pans

   Playhead and readouts are painted imperatively from the clock, so React
   never re-renders per frame. Selection is owned by the caller.

     <KeyframeTimeline clock={clock} mapTime={toAnimTime} duration={d} fps={60}
       lanes={lanes} onSeek={seek} onSelectKeys={…} onMoveKeys={…}
       onSegmentClick={…} onDurationChange={…} toolbar={<Transport/>} autoKey={on} />
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { clamp, cn, type Clock } from '@kit'

export interface KTKey {
  id: string
  t: number
  selected?: boolean
  /** a summary diamond that stands for several keys (group rows) */
  ids?: string[]
  /** the segment that starts at this key */
  out?: 'ease' | 'hold'
  glyph?: ReactNode
}
export interface KTLane {
  id: string
  label: string
  kind: 'group' | 'prop'
  depth?: number
  keys: KTKey[]
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  open?: boolean
  /** e.g. a KeyButton */
  trailing?: ReactNode
  /** current value readout */
  value?: ReactNode
  highlight?: boolean
}

const ROW = 24
const LABEL_W = 232

export interface KeyframeTimelineProps {
  clock: Clock
  /** clock time → timeline time (ping-pong etc.) */
  mapTime?: (t: number) => number
  duration: number
  fps: number
  lanes: KTLane[]
  snap?: boolean
  onSeek: (t: number) => void
  onSelectKeys: (ids: string[], mode: 'replace' | 'add' | 'toggle') => void
  onMoveKeys: (next: Record<string, number>, final: boolean) => void
  onSegmentClick?: (laneId: string, keyId: string, anchor: DOMRect) => void
  activeSegment?: string | null
  onToggleLane?: (laneId: string) => void
  onLaneClick?: (laneId: string) => void
  onDurationChange?: (ms: number, final: boolean) => void
  toolbar?: ReactNode
  autoKey?: boolean
  empty?: ReactNode
  /** cover the tracks with a message (e.g. while previewing a state machine) */
  blocked?: ReactNode
  height?: number
  className?: string
}

export function KeyframeTimeline(props: KeyframeTimelineProps) {
  const { clock, mapTime = (t) => t, duration, fps, lanes, snap = true, toolbar, autoKey, empty, blocked, height = 248, className } = props
  const track = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(600)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(track.current!)
    return () => ro.disconnect()
  }, [])

  // view range; follows the duration until the user zooms
  const [view, setView] = useState<[number, number]>([0, duration * 1.12 + 40])
  const zoomed = useRef(false)
  useEffect(() => { if (!zoomed.current) setView([0, duration * 1.12 + 40]) }, [duration])
  const span = view[1] - view[0]
  const X = (ms: number) => ((ms - view[0]) / span) * W
  const Tm = (px: number) => view[0] + (px / W) * span

  // live refs for imperative painting
  const live = useRef({ X, mapTime })
  live.current = { X, mapTime }
  const head = useRef<HTMLDivElement>(null)
  const headRuler = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const paint = () => {
      const x = live.current.X(live.current.mapTime(clock.time()))
      const tr = `translateX(${x}px)`
      if (head.current) head.current.style.transform = tr
      if (headRuler.current) headRuler.current.style.transform = tr
    }
    paint()
    return clock.onTick(paint)
  }, [clock])
  useLayoutEffect(() => {
    const x = X(mapTime(clock.time()))
    if (head.current) head.current.style.transform = `translateX(${x}px)`
    if (headRuler.current) headRuler.current.style.transform = `translateX(${x}px)`
  })

  const frame = 1000 / fps
  const keyIndex = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of lanes) if (l.kind === 'prop') for (const k of l.keys) m.set(k.id, k.t)
    return m
  }, [lanes])

  /* ---------- ruler ---------- */
  const steps = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000]
  const labelStep = steps.find((s) => (s / span) * W >= 56) ?? 5000
  const minor = labelStep / (labelStep >= 1000 ? 4 : 5)
  const ticks: number[] = []
  for (let m = Math.ceil(view[0] / minor) * minor; m <= view[1]; m += minor) ticks.push(Math.round(m))

  const ruler = useRef<{ mode: 'scrub' | 'end' } | null>(null)
  const rulerT = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect()
    return Math.round(clamp(Tm(e.clientX - r.left), 0, duration) / frame) * frame
  }
  const onRulerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const r = track.current!.getBoundingClientRect()
    if (props.onDurationChange && Math.abs(e.clientX - r.left - X(duration)) < 6) { ruler.current = { mode: 'end' }; return }
    ruler.current = { mode: 'scrub' }
    props.onSeek(rulerT(e))
  }
  const onRulerMove = (e: React.PointerEvent) => {
    if (!ruler.current) return
    if (ruler.current.mode === 'scrub') props.onSeek(rulerT(e))
    else {
      const r = track.current!.getBoundingClientRect()
      const ms = Math.max(100, Math.round(Tm(e.clientX - r.left) / frame) * frame)
      props.onDurationChange?.(Math.round(ms), false)
    }
  }
  const onRulerUp = (e: React.PointerEvent) => {
    if (ruler.current?.mode === 'end') {
      const r = track.current!.getBoundingClientRect()
      props.onDurationChange?.(Math.max(100, Math.round(Math.round(Tm(e.clientX - r.left) / frame) * frame)), true)
    }
    ruler.current = null
  }

  /* ---------- key drag ---------- */
  const [guide, setGuide] = useState<{ t: number; x: number } | null>(null)
  const drag = useRef<{ start: Map<string, number>; anchor: number; x0: number; moved: boolean; others: number[]; delta: number } | null>(null)
  const selectedIds = useMemo(() => new Set(lanes.flatMap((l) => (l.kind === 'prop' ? l.keys.filter((k) => k.selected).map((k) => k.id) : []))), [lanes])

  const onKeyDown = (e: React.PointerEvent, k: KTKey) => {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const ids = k.ids ?? [k.id]
    const all = ids.every((id) => selectedIds.has(id))
    let sel: Set<string>
    if (e.shiftKey || e.metaKey) {
      props.onSelectKeys(ids, all ? 'toggle' : 'add')
      sel = new Set(selectedIds)
      ids.forEach((id) => (all ? sel.delete(id) : sel.add(id)))
      if (all) { drag.current = null; return }
    } else if (!all) {
      props.onSelectKeys(ids, 'replace')
      sel = new Set(ids)
    } else sel = new Set(selectedIds)
    const start = new Map<string, number>()
    sel.forEach((id) => { const t = keyIndex.get(id); if (t !== undefined) start.set(id, t) })
    const others = [...keyIndex.entries()].filter(([id]) => !start.has(id)).map(([, t]) => t)
    drag.current = { start, anchor: k.t, x0: e.clientX, moved: false, others, delta: 0 }
  }
  const onKeyMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.abs(e.clientX - d.x0) < 3) return
    d.moved = true
    let cand = d.anchor + ((e.clientX - d.x0) / W) * span
    let snapped: number | null = null
    if (snap && !e.altKey) {
      const targets = [0, duration, mapTime(clock.time()), ...d.others]
      let best = Infinity
      for (const s of targets) { const px = Math.abs(X(s) - X(cand)); if (px < 7 && px < best) { best = px; snapped = s } }
    }
    cand = snapped ?? Math.round(cand / frame) * frame
    let delta = cand - d.anchor
    const ts = [...d.start.values()]
    delta = clamp(delta, -Math.min(...ts), duration - Math.max(...ts))
    d.delta = delta
    const next: Record<string, number> = {}
    d.start.forEach((t, id) => (next[id] = Math.round((t + delta) * 1000) / 1000))
    setGuide({ t: d.anchor + delta, x: X(d.anchor + delta) })
    props.onMoveKeys(next, false)
  }
  const onKeyUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGuide(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (!d?.moved) return
    const next: Record<string, number> = {}
    const delta = d.delta
    d.start.forEach((t, id) => (next[id] = Math.round((t + delta) * 1000) / 1000))
    props.onMoveKeys(next, true)
  }

  /* ---------- marquee ---------- */
  const [mq, setMq] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const mqRef = useRef<{ add: boolean } | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const onAreaDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const r = area.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    mqRef.current = { add: e.shiftKey || e.metaKey }
    if (!mqRef.current.add) props.onSelectKeys([], 'replace')
    setMq({ x0: x, y0: y, x1: x, y1: y })
  }
  const onAreaMove = (e: React.PointerEvent) => {
    if (!mq || !mqRef.current) return
    const r = area.current!.getBoundingClientRect()
    const next = { ...mq, x1: e.clientX - r.left, y1: e.clientY - r.top }
    setMq(next)
    const [xa, xb] = [Math.min(next.x0, next.x1), Math.max(next.x0, next.x1)]
    const [ya, yb] = [Math.min(next.y0, next.y1), Math.max(next.y0, next.y1)]
    const ids: string[] = []
    lanes.forEach((l, i) => {
      const cy = i * ROW + ROW / 2
      if (cy < ya || cy > yb) return
      for (const k of l.keys) { const x = X(k.t); if (x >= xa && x <= xb) ids.push(...(k.ids ?? [k.id])) }
    })
    props.onSelectKeys([...new Set(ids)], mqRef.current.add ? 'add' : 'replace')
  }
  const onAreaUp = () => { setMq(null); mqRef.current = null }

  /* ---------- zoom / pan ---------- */
  const onWheel = (e: React.WheelEvent) => {
    const r = track.current!.getBoundingClientRect()
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      zoomed.current = true
      const at = Tm(e.clientX - r.left)
      const ns = clamp(span * Math.exp(e.deltaY * 0.004), 80, Math.max(duration * 3, 1000))
      const a = Math.max(-ns * 0.05, at - ((at - view[0]) / span) * ns)
      setView([a, a + ns])
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      zoomed.current = true
      const d = ((e.shiftKey ? e.deltaY : e.deltaX) / W) * span
      const a = clamp(view[0] + d, -span * 0.05, Math.max(0, duration * 1.5 - span))
      setView([a, a + span])
    }
  }
  const fit = () => { zoomed.current = false; setView([0, duration * 1.12 + 40]) }

  const tEnd = X(duration)
  const bodyH = Math.max(lanes.length * ROW, 1)

  return (
    <div className={cn('panel flex flex-col overflow-hidden', autoKey && 'outline outline-[1.5px] -outline-offset-[1.5px] outline-rec', className)}>
      {toolbar && <div className="flex h-10 flex-none items-center gap-1 px-2">{toolbar}</div>}

      {/* ruler */}
      <div className="flex h-7 flex-none border-t border-line">
        <div className="flex flex-none items-center border-r border-line px-3 text-[11px] text-faint" style={{ width: LABEL_W }}>
          <button type="button" onClick={fit} className="rounded-[4px] px-1 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent" title="Zoom to fit (⌘wheel zooms)">
            {lanes.filter((l) => l.kind === 'prop').length} animated {lanes.filter((l) => l.kind === 'prop').length === 1 ? 'property' : 'properties'}
          </button>
        </div>
        <div ref={track} className="relative min-w-0 flex-1 cursor-ew-resize overflow-hidden border-b border-line no-select" onWheel={onWheel}
          onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={onRulerUp} onDoubleClick={fit}>
          <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/70" style={{ left: Math.max(0, tEnd) }} />
          {ticks.map((m) => {
            const major = m % labelStep === 0
            return (
              <div key={m} className="pointer-events-none absolute bottom-0" style={{ left: X(m) }}>
                <div className={cn('w-px', major ? 'h-2 bg-line-strong' : 'h-1 bg-line')} />
                {major && <div className="absolute bottom-2.5 left-1 tabular text-[10px] text-faint">{m >= 1000 ? `${+(m / 1000).toFixed(2)}s` : `${m}ms`}</div>}
              </div>
            )
          })}
          {props.onDurationChange && (
            <div className="group/end absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-col-resize" style={{ left: tEnd }} title="Drag to change duration">
              <div className="absolute inset-y-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-fg/40 group-hover/end:bg-fg" />
            </div>
          )}
          <div ref={headRuler} className="pointer-events-none absolute top-0 left-0 z-20 h-full">
            <div className={cn('absolute top-0 h-[10px] w-[11px] -translate-x-1/2 bg-rec [clip-path:polygon(0_0,100%_0,100%_55%,50%_100%,0_55%)]')} />
            <div className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-rec" />
          </div>
        </div>
      </div>

      {/* rows */}
      <div className="relative flex-none overflow-y-auto overflow-x-hidden" style={{ height }} onWheel={onWheel}>
        {lanes.length === 0 && empty ? (
          <div className="flex h-full items-center justify-center">{empty}</div>
        ) : (
          <div className="flex min-h-full">
            <div className="flex-none border-r border-line" style={{ width: LABEL_W }}>
              {lanes.map((l) => (
                <div key={l.id}
                  className={cn('group/row flex items-center gap-1 pr-1 text-[11.5px] no-select', l.kind === 'group' ? 'text-fg' : 'text-muted', l.highlight && 'bg-accent-soft')}
                  style={{ height: ROW, paddingLeft: 6 + (l.depth ?? 0) * 12 }}>
                  {l.kind === 'group' ? (
                    <button type="button" aria-label={l.open ? 'Collapse' : 'Expand'} aria-expanded={l.open} onClick={() => props.onToggleLane?.(l.id)}
                      className="flex size-4 shrink-0 items-center justify-center rounded-[3px] text-faint outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
                      <ChevronRight size={11} strokeWidth={2} className={cn('transition-transform', l.open && 'rotate-90')} />
                    </button>
                  ) : <span className="w-4 shrink-0" />}
                  {l.icon && <l.icon size={13} strokeWidth={1.5} className={cn('shrink-0', l.highlight ? 'text-accent' : 'text-faint')} />}
                  <button type="button" onClick={() => props.onLaneClick?.(l.id)} className={cn('min-w-0 flex-1 truncate text-left outline-none focus-visible:underline', l.kind === 'group' && 'font-medium')}>{l.label}</button>
                  {l.value !== undefined && <span className="shrink-0 tabular text-[11px] text-faint">{l.value}</span>}
                  {l.trailing}
                </div>
              ))}
            </div>
            <div ref={area} className="relative min-w-0 flex-1" style={{ minHeight: bodyH }}
              onPointerDown={onAreaDown} onPointerMove={onAreaMove} onPointerUp={onAreaUp} onWheel={onWheel}>
              {/* past-the-end shade */}
              <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/50" style={{ left: Math.max(0, tEnd) }} />
              {lanes.map((l, i) => (
                <div key={l.id} className={cn('pointer-events-none absolute inset-x-0', l.kind === 'group' ? 'bg-hover' : '', l.highlight && 'bg-accent-soft/60')} style={{ top: i * ROW, height: ROW }}>
                  {l.kind === 'prop' && l.keys.slice(0, -1).map((a, j) => {
                    const b = l.keys[j + 1]
                    const x0 = X(a.t), x1 = X(b.t), w = x1 - x0
                    const active = props.activeSegment === a.id
                    return (
                      <button key={a.id} type="button" aria-label="Edit easing"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => props.onSegmentClick?.(l.id, a.id, (e.currentTarget as HTMLElement).getBoundingClientRect())}
                        className="group/seg pointer-events-auto absolute top-0 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        style={{ left: x0 + 6, width: Math.max(0, w - 12), height: ROW }}>
                        <span className={cn('absolute inset-x-0 top-1/2 -translate-y-1/2',
                          a.out === 'hold' ? 'border-t border-dashed' : 'h-[2px] rounded-full',
                          active ? (a.out === 'hold' ? 'border-accent' : 'bg-accent') : a.out === 'hold' ? 'border-faint group-hover/seg:border-fg' : 'bg-line-strong group-hover/seg:bg-fg/50')} />
                        {w > 44 && a.glyph && (
                          <span className={cn('relative rounded-[4px] bg-panel px-0.5', active ? 'text-accent' : 'text-faint group-hover/seg:text-fg')}>{a.glyph}</span>
                        )}
                      </button>
                    )
                  })}
                  {l.keys.map((k) => {
                    const sel = k.ids ? k.ids.every((id) => selectedIds.has(id)) : k.selected
                    const group = l.kind === 'group'
                    return (
                      <button key={k.id} type="button" aria-label={`Keyframe at ${(k.t / 1000).toFixed(2)}s`} aria-pressed={!!sel} tabIndex={-1}
                        onPointerDown={(e) => onKeyDown(e, k)} onPointerMove={onKeyMove} onPointerUp={onKeyUp}
                        onDoubleClick={() => props.onSeek(k.t)}
                        className="pointer-events-auto absolute top-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center outline-none active:cursor-grabbing"
                        style={{ left: X(k.t) }}>
                        <span className={cn('block rotate-45 rounded-[1.5px] transition-colors',
                          group ? 'size-[7px]' : 'size-[9px]',
                          sel ? 'bg-accent shadow-[0_0_0_1.5px_var(--panel)]' : group ? 'bg-muted' : 'bg-fg/85 hover:bg-fg')} />
                      </button>
                    )
                  })}
                </div>
              ))}
              {guide && (
                <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-accent" style={{ left: guide.x }}>
                  <div className="absolute top-1 left-1.5 rounded-[4px] bg-accent-strong px-1 tabular text-[10px] text-accent-fg">{(guide.t / 1000).toFixed(3)}s</div>
                </div>
              )}
              {mq && (
                <div className="pointer-events-none absolute z-10 rounded-[2px] bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]"
                  style={{ left: Math.min(mq.x0, mq.x1), top: Math.min(mq.y0, mq.y1), width: Math.abs(mq.x1 - mq.x0), height: Math.abs(mq.y1 - mq.y0) }} />
              )}
              <div ref={head} className="pointer-events-none absolute top-0 bottom-0 left-0 z-20">
                <div className={cn('absolute top-0 bottom-0 -translate-x-1/2 bg-rec', autoKey ? 'w-[2px] shadow-[0_0_8px_var(--rec)]' : 'w-px')} />
              </div>
            </div>
          </div>
        )}
        {blocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-panel/85 backdrop-blur-[1px]">{blocked}</div>
        )}
      </div>
    </div>
  )
}
