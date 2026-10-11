/* ---------------------------------------------------------------------------
   KeyTimeline — an EDITABLE keyframe timeline (Figma Motion / Rive /
   Theatre.js / After Effects). The read-only <Timeline> shows beats; this
   one edits keys. Data in, callbacks out — the caller owns the document and
   the selection, so it fits any model (tracks per property, per layer…).

     <KeyTimeline clock={clock} duration={1200} fps={60} lanes={lanes}
       onSeek={seek}
       onSelectKeys={(ids, mode) => …}          // 'replace' | 'add' | 'toggle'
       onMoveKeys={(next, final) => …}          // { keyId: newTimeMs }
       onDeleteKeys={(ids) => …}
       segmentEditor={({ keyId }) => <EasingEditor … />}   // popover on segment click
       onDurationChange={(ms, final) => …}      // drag the end marker (stops at the last key)
       toolbar={<Transport />} autoKey={recording} />

   Lanes
     group   an object row; its summary diamonds (key.ids) move every key at that time
     prop    one animated property: diamonds + the segments between them
             (`out: 'hold'` draws a dashed segment, `glyph` sits on the segment)
     Each lane may carry `icon`, `value` (live readout), `trailing` (e.g. a
     KeyButton), `highlight` (the selected object), `open` (group disclosure).

   Mouse
     diamond          click select · shift/⌘ toggle · drag to retime — snaps to
                      the playhead, other keys, 0 and the end (Alt: no snap) ·
                      double-click seeks there
     empty track      drag = marquee select (shift/⌘ adds)
     segment          click → `segmentEditor` popover (or onSegmentClick)
     ruler            drag to scrub; drag the end marker to change duration;
                      double-click or the summary button fits
     ⌘wheel           zoom at the cursor · shift-wheel / trackpad x pans
   Keyboard (non-drag alternatives, WCAG 2.5.7)
     ruler (slider)   ← → one frame (Shift ×10) · Home / End
     key area         ← → nudge selected keys a frame (Shift ×10; with nothing
                      selected, steps the playhead) · [ ] select previous /
                      next key in time (in the selected key's lane, if one) · ⌘A select all · Delete removes ·
                      Esc clears the selection
   The playhead (bg-rec, never the accent) is painted from the clock, so
   React never re-renders per frame. `autoKey` rings the panel in rec and
   makes the playhead glow — the "recording" state.
   a11y: the ruler is a role="slider" over time; the key area is a focusable
   group whose diamonds are labelled toggle buttons ("Keyframe at 0.40s").
   (Promoted from shells/animate/local/KeyframeTimeline.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { ChevronRight } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import type { Clock } from '../core/clock'
import { PlayheadCap, PlayheadLine, RulerTicks, rulerTicks, snapTime, toFrame, usePlayhead } from './ruler'

export interface TimelineKey {
  id: string
  t: number
  selected?: boolean
  /** a summary diamond that stands for several keys (group rows) */
  ids?: string[]
  /** the segment that starts at this key */
  out?: 'ease' | 'hold'
  /** glyph drawn on the outgoing segment (e.g. <EaseGlyph />) */
  glyph?: ReactNode
}
export interface KeyLane {
  id: string
  label: string
  kind: 'group' | 'prop'
  depth?: number
  keys: TimelineKey[]
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  open?: boolean
  /** e.g. a KeyButton */
  trailing?: ReactNode
  /** current value readout */
  value?: ReactNode
  highlight?: boolean
}

export interface KeyTimelineProps {
  clock: Clock
  /** clock time → timeline time, if they differ (an offset, a state-machine time) */
  mapTime?: (t: number) => number
  duration: number
  fps: number
  lanes: KeyLane[]
  snap?: boolean
  onSeek: (t: number) => void
  onSelectKeys: (ids: string[], mode: 'replace' | 'add' | 'toggle') => void
  onMoveKeys: (next: Record<string, number>, final: boolean) => void
  onDeleteKeys?: (ids: string[]) => void
  /** popover body for a clicked segment (anchored to it); Esc / outside click closes */
  segmentEditor?: (seg: { laneId: string; keyId: string }, close: () => void) => ReactNode
  /** called on segment click (with or without segmentEditor) */
  onSegmentClick?: (laneId: string, keyId: string, anchor: DOMRect) => void
  /** highlight a segment (key id of its start) */
  activeSegment?: string | null
  onToggleLane?: (laneId: string) => void
  onLaneClick?: (laneId: string) => void
  onDurationChange?: (ms: number, final: boolean) => void
  toolbar?: ReactNode
  /** recording state: rec ring + glowing playhead */
  autoKey?: boolean
  empty?: ReactNode
  /** cover the tracks with a message (e.g. while previewing) */
  blocked?: ReactNode
  /** height of the lanes area (px); lanes scroll past it */
  height?: number
  labelWidth?: number
  /** left of the ruler: defaults to "N animated properties" (click = zoom to fit) */
  summary?: ReactNode
  className?: string
}

const ROW = 24

export function KeyTimeline(props: KeyTimelineProps) {
  const {
    clock, mapTime = (t: number) => t, duration, fps, lanes, snap = true, toolbar, autoKey, empty, blocked, height = 248, labelWidth = 232, className,
  } = props
  const track = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(600)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(1, e.contentRect.width)))
    ro.observe(track.current!)
    return () => ro.disconnect()
  }, [])

  // view range; follows the duration until the user zooms or pans
  const fitView = (): [number, number] => [0, duration * 1.12 + 40]
  const [view, setView] = useState<[number, number]>(fitView)
  const zoomed = useRef(false)
  useEffect(() => { if (!zoomed.current) setView(fitView()) }, [duration]) // eslint-disable-line react-hooks/exhaustive-deps
  const span = view[1] - view[0]
  const X = (ms: number) => ((ms - view[0]) / span) * W
  const Tm = (px: number) => view[0] + (px / W) * span
  const frame = 1000 / fps

  /* ---------- playhead ---------- */
  const head = useRef<HTMLDivElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  const rulerEl = useRef<HTMLDivElement>(null)
  usePlayhead(clock, (t) => X(mapTime(t)), [head, cap], (_x, t) => {
    const r = rulerEl.current
    if (r) { const tt = Math.round(mapTime(t)); r.setAttribute('aria-valuenow', String(tt)); r.setAttribute('aria-valuetext', `${(tt / 1000).toFixed(2)} seconds`) }
  })

  /* ---------- key index ---------- */
  const keyIndex = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of lanes) if (l.kind === 'prop') for (const k of l.keys) m.set(k.id, k.t)
    return m
  }, [lanes])
  const selectedIds = useMemo(() => new Set(lanes.flatMap((l) => (l.kind === 'prop' ? l.keys.filter((k) => k.selected).map((k) => k.id) : []))), [lanes])
  const propCount = lanes.filter((l) => l.kind === 'prop').length

  /* ---------- ruler ---------- */
  const ticks = rulerTicks(view[0], view[1], W / span)
  const ruler = useRef<{ mode: 'scrub' | 'end' } | null>(null)
  const rulerT = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect()
    return toFrame(clamp(Tm(e.clientX - r.left), 0, duration), fps)
  }
  const lastKeyT = useMemo(() => Math.max(0, ...lanes.flatMap((l) => (l.kind === 'prop' ? l.keys.map((k) => k.t) : []))), [lanes])
  const endT = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect()
    // never shorter than the last key — keys past the end would be unreachable (break-it V5)
    return Math.max(100, lastKeyT, Math.round(toFrame(Tm(e.clientX - r.left), fps)))
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
    else props.onDurationChange?.(endT(e), false)
  }
  const onRulerUp = (e: React.PointerEvent) => {
    if (ruler.current?.mode === 'end') props.onDurationChange?.(endT(e), true)
    ruler.current = null
  }
  const onRulerKey = (e: React.KeyboardEvent) => {
    const now = mapTime(clock.time())
    const step = frame * (e.shiftKey ? 10 : 1)
    let t: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = now + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = now - step
    else if (e.key === 'Home') t = 0
    else if (e.key === 'End') t = duration
    if (t === null) return
    e.preventDefault(); e.stopPropagation()
    props.onSeek(toFrame(clamp(t, 0, duration), fps))
  }

  /* ---------- key drag ---------- */
  const [guide, setGuide] = useState<{ t: number; x: number } | null>(null)
  const drag = useRef<{ start: Map<string, number>; anchor: number; x0: number; moved: boolean; others: number[]; delta: number } | null>(null)

  const onKeyDown = (e: React.PointerEvent, k: TimelineKey) => {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const ids = k.ids ?? [k.id]
    const all = ids.every((id) => selectedIds.has(id))
    let sel: Set<string>
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      props.onSelectKeys(ids, all ? 'toggle' : 'add')
      if (all) { drag.current = null; return }
      sel = new Set([...selectedIds, ...ids])
    } else if (!all) {
      props.onSelectKeys(ids, 'replace')
      sel = new Set(ids)
    } else sel = new Set(selectedIds)
    const start = new Map<string, number>()
    sel.forEach((id) => { const t = keyIndex.get(id); if (t !== undefined) start.set(id, t) })
    const others = [...keyIndex.entries()].filter(([id]) => !start.has(id)).map(([, t]) => t)
    drag.current = { start, anchor: k.t, x0: e.clientX, moved: false, others, delta: 0 }
  }
  const moved = (d: NonNullable<typeof drag.current>) => {
    const next: Record<string, number> = {}
    d.start.forEach((t, id) => (next[id] = Math.round((t + d.delta) * 1000) / 1000))
    return next
  }
  const onKeyMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.abs(e.clientX - d.x0) < 3) return
    d.moved = true
    const raw = d.anchor + ((e.clientX - d.x0) / W) * span
    const s = snap && !e.altKey ? snapTime(raw, [0, duration, mapTime(clock.time()), ...d.others], X, 7) : { t: raw, hit: null }
    const cand = s.hit ?? toFrame(raw, fps)
    const ts = [...d.start.values()]
    d.delta = ts.length ? clamp(cand - d.anchor, -Math.min(...ts), duration - Math.max(...ts)) : 0
    setGuide({ t: d.anchor + d.delta, x: X(d.anchor + d.delta) })
    props.onMoveKeys(moved(d), false)
  }
  const onKeyUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGuide(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (d?.moved) props.onMoveKeys(moved(d), true)
  }

  /* ---------- keyboard on the key area ---------- */
  const nudge = (frames: number) => {
    const ids = [...selectedIds]
    if (!ids.length) { props.onSeek(toFrame(clamp(mapTime(clock.time()) + frames * frame, 0, duration), fps)); return }
    const ts = ids.map((id) => keyIndex.get(id) ?? 0)
    const delta = clamp(frames * frame, -Math.min(...ts), duration - Math.max(...ts))
    if (!delta) return
    props.onMoveKeys(Object.fromEntries(ids.map((id, i) => [id, Math.round((ts[i] + delta) * 1000) / 1000])), true)
  }
  const selectAdjacent = (dir: 1 | -1) => {
    const now = mapTime(clock.time())
    // With keys selected in ONE lane, step along that lane (After Effects J/K); otherwise across all lanes.
    const laneOf = new Map(lanes.flatMap((l) => (l.kind === 'prop' ? l.keys.map((k) => [k.id, l.id] as const) : [])))
    const selLanes = new Set([...selectedIds].map((id) => laneOf.get(id)))
    const only = selLanes.size === 1 ? [...selLanes][0] : undefined
    const all = [...keyIndex.entries()].filter(([id]) => !only || laneOf.get(id) === only).sort((a, b) => a[1] - b[1])
    const hit = dir > 0 ? all.find(([, t]) => t > now + 0.5) : [...all].reverse().find(([, t]) => t < now - 0.5)
    if (!hit) return
    const at = all.filter(([, t]) => Math.abs(t - hit[1]) < 0.5).map(([id]) => id)
    props.onSelectKeys(at, 'replace')
    props.onSeek(hit[1])
  }
  const onAreaKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    const mod = e.metaKey || e.ctrlKey
    let handled = true
    if (e.key === 'ArrowLeft') nudge(e.shiftKey ? -10 : -1)
    else if (e.key === 'ArrowRight') nudge(e.shiftKey ? 10 : 1)
    else if (e.key === '[') selectAdjacent(-1)
    else if (e.key === ']') selectAdjacent(1)
    else if ((e.key === 'Delete' || e.key === 'Backspace') && props.onDeleteKeys && selectedIds.size) props.onDeleteKeys([...selectedIds])
    else if (mod && e.key.toLowerCase() === 'a') props.onSelectKeys([...keyIndex.keys()], 'replace')
    else if (e.key === 'Escape' && selectedIds.size) props.onSelectKeys([], 'replace')
    else handled = false
    if (handled) { e.preventDefault(); e.stopPropagation() }
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
    mqRef.current = { add: e.shiftKey || e.metaKey || e.ctrlKey }
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
  // ⌘wheel must not zoom the page: React's onWheel is passive, so bind natively.
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current!
    const on = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }
    el.addEventListener('wheel', on, { passive: false })
    return () => el.removeEventListener('wheel', on)
  }, [])
  const fit = () => { zoomed.current = false; setView(fitView()) }

  /* ---------- segment popover ---------- */
  const [seg, setSeg] = useState<{ laneId: string; keyId: string; rect: DOMRect } | null>(null)
  const closeSeg = () => setSeg(null)
  const activeSeg = seg?.keyId ?? props.activeSegment

  const tEnd = X(duration)
  const bodyH = Math.max(lanes.length * ROW, 1)

  return (
    <div ref={root} className={cn('panel flex flex-col overflow-hidden', autoKey && 'outline outline-[1.5px] -outline-offset-[1.5px] outline-rec', className)}>
      {toolbar && <div className="flex h-10 flex-none items-center gap-1 px-2">{toolbar}</div>}

      {/* ruler */}
      <div className="flex h-7 flex-none border-t border-line">
        <div className="flex flex-none items-center border-r border-line px-3 text-[11px] text-fg-faint" style={{ width: labelWidth }}>
          {props.summary ?? (
            <button type="button" onClick={fit} className="truncate rounded-[4px] px-1 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal" title="Zoom to fit (⌘wheel zooms)">
              {propCount} animated {propCount === 1 ? 'property' : 'properties'}
            </button>
          )}
        </div>
        <div ref={track} className="relative min-w-0 flex-1 overflow-hidden border-b border-line">
          <div ref={rulerEl} role="slider" tabIndex={0} aria-label="Playhead" aria-valuemin={0} aria-valuemax={Math.round(duration)}
            className="absolute inset-0 cursor-ew-resize outline-none no-select focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]"
            onWheel={onWheel} onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={onRulerUp} onDoubleClick={fit} onKeyDown={onRulerKey}>
            <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/70" style={{ left: Math.max(0, tEnd) }} />
            <RulerTicks ticks={ticks} x={X} />
            {props.onDurationChange && (
              <div className="group/end absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-col-resize" style={{ left: tEnd }} title="Drag to change duration">
                <div className="absolute inset-y-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-fg/40 group-hover/end:bg-fg" />
              </div>
            )}
          </div>
          <PlayheadCap ref={cap} line />
        </div>
      </div>

      {/* rows */}
      <div className="relative flex-none overflow-x-hidden overflow-y-auto" style={{ height }} onWheel={onWheel}>
        {lanes.length === 0 && empty ? (
          <div className="flex h-full items-center justify-center">{empty}</div>
        ) : (
          <div className="flex min-h-full">
            <div className="flex-none border-r border-line" style={{ width: labelWidth }}>
              {lanes.map((l) => (
                <div key={l.id}
                  className={cn('group/row flex items-center gap-1 pr-1 text-[11.5px] no-select', l.kind === 'group' ? 'text-fg' : 'text-fg-muted', l.highlight && 'bg-signal-soft')}
                  style={{ height: ROW, paddingLeft: 6 + (l.depth ?? 0) * 12 }}>
                  {l.kind === 'group' ? (
                    <button type="button" aria-label={`${l.open ? 'Collapse' : 'Expand'} ${l.label}`} aria-expanded={!!l.open} onClick={() => props.onToggleLane?.(l.id)}
                      className="flex h-6 w-4 shrink-0 items-center justify-center rounded-[3px] text-fg-faint outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
                      <ChevronRight size={11} strokeWidth={2} className={cn('transition-transform', l.open && 'rotate-90')} />
                    </button>
                  ) : <span className="w-4 shrink-0" />}
                  {l.icon && <l.icon size={13} strokeWidth={1.5} className={cn('shrink-0', l.highlight ? 'text-signal' : 'text-fg-faint')} />}
                  <button type="button" onClick={() => props.onLaneClick?.(l.id)} className={cn('h-6 min-w-0 flex-1 truncate text-left outline-none focus-visible:underline', l.kind === 'group' && 'font-medium')}>{l.label}</button>
                  {l.value !== undefined && <span className="shrink-0 tabular text-[11px] text-fg-faint">{l.value}</span>}
                  {l.trailing}
                </div>
              ))}
            </div>
            <div ref={area} role="group" tabIndex={0}
              aria-label={`Keyframes — ${selectedIds.size} selected. Arrow keys nudge, brackets select the previous or next key (within the selected key's lane), Delete removes.`}
              className="relative min-w-0 flex-1 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]" style={{ minHeight: bodyH }}
              onPointerDown={onAreaDown} onPointerMove={onAreaMove} onPointerUp={onAreaUp} onKeyDown={onAreaKey}>
              {/* past-the-end shade */}
              <div className="pointer-events-none absolute inset-y-0 right-0 bg-well/50" style={{ left: Math.max(0, tEnd) }} />
              {lanes.map((l, i) => (
                <div key={l.id} className={cn('pointer-events-none absolute inset-x-0', l.kind === 'group' && 'bg-hover', l.highlight && 'bg-signal-soft/60')} style={{ top: i * ROW, height: ROW }}>
                  {l.kind === 'prop' && l.keys.slice(0, -1).map((a, j) => {
                    const b = l.keys[j + 1]
                    const x0 = X(a.t), x1 = X(b.t), w = x1 - x0
                    const active = activeSeg === a.id
                    return (
                      <button key={a.id} type="button" tabIndex={-1} aria-label={`Edit easing ${(a.t / 1000).toFixed(2)}s to ${(b.t / 1000).toFixed(2)}s`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          props.onSegmentClick?.(l.id, a.id, rect)
                          if (props.segmentEditor) setSeg({ laneId: l.id, keyId: a.id, rect })
                        }}
                        className="group/seg pointer-events-auto absolute top-0 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-signal"
                        style={{ left: x0 + 6, width: Math.max(0, w - 12), height: ROW }}>
                        <span className={cn('absolute inset-x-0 top-1/2 -translate-y-1/2',
                          a.out === 'hold' ? 'border-t border-dashed' : 'h-[2px] rounded-full',
                          active ? (a.out === 'hold' ? 'border-signal' : 'bg-signal') : a.out === 'hold' ? 'border-fg-faint group-hover/seg:border-fg' : 'bg-line-strong group-hover/seg:bg-fg/50')} />
                        {w > 44 && a.glyph && (
                          <span className={cn('relative rounded-[4px] bg-panel px-0.5', active ? 'text-signal-text' : 'text-fg-faint group-hover/seg:text-fg')}>{a.glyph}</span>
                        )}
                      </button>
                    )
                  })}
                  {l.keys.map((k) => {
                    const sel = k.ids ? k.ids.length > 0 && k.ids.every((id) => selectedIds.has(id)) : k.selected
                    const group = l.kind === 'group'
                    return (
                      <button key={k.id} type="button" tabIndex={-1}
                        aria-label={`${group ? `${l.label} keys` : 'Keyframe'} at ${(k.t / 1000).toFixed(2)}s`} aria-pressed={!!sel}
                        onPointerDown={(e) => onKeyDown(e, k)} onPointerMove={onKeyMove} onPointerUp={onKeyUp}
                        onDoubleClick={() => props.onSeek(k.t)}
                        className="pointer-events-auto absolute top-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center outline-none active:cursor-grabbing"
                        style={{ left: X(k.t) }}>
                        <span className={cn('block rotate-45 rounded-[1.5px] transition-colors',
                          // selection is bigger AND ringed, not just blue (WCAG 1.4.1, break-it A14)
                          group ? 'size-[7px]' : sel ? 'size-[10px]' : 'size-[9px]',
                          sel ? 'bg-signal shadow-[0_0_0_1.5px_var(--panel),0_0_0_3px_var(--signal)]' : group ? 'bg-fg-muted' : 'bg-fg/85 hover:bg-fg')} />
                      </button>
                    )
                  })}
                </div>
              ))}
              {guide && (
                <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-signal" style={{ left: guide.x }}>
                  <div className="absolute top-1 left-1.5 rounded-[4px] bg-signal-strong px-1 tabular text-[10px] text-signal-fg">{(guide.t / 1000).toFixed(3)}s</div>
                </div>
              )}
              {mq && (
                <div className="pointer-events-none absolute z-10 rounded-[2px] bg-signal-soft shadow-[inset_0_0_0_1px_var(--signal)]"
                  style={{ left: Math.min(mq.x0, mq.x1), top: Math.min(mq.y0, mq.y1), width: Math.abs(mq.x1 - mq.x0), height: Math.abs(mq.y1 - mq.y0) }} />
              )}
              <PlayheadLine ref={head} glow={autoKey} />
            </div>
          </div>
        )}
        {blocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-panel/85 backdrop-blur-[1px]">{blocked}</div>
        )}
      </div>

      {props.segmentEditor && (
        <Popover.Root open={!!seg} onOpenChange={(o) => { if (!o) closeSeg() }}>
          <Popover.Portal>
            <Popover.Positioner side="top" align="center" sideOffset={8} collisionPadding={12} className="z-[160]"
              anchor={seg ? { getBoundingClientRect: () => seg.rect } : undefined}>
              <Popover.Popup className="pop outline-none">
                {seg && props.segmentEditor({ laneId: seg.laneId, keyId: seg.keyId }, closeSeg)}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  )
}
