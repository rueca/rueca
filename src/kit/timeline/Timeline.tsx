/* ---------------------------------------------------------------------------
   Timeline — a floating card: transport, a labelled ruler, lanes, playhead.

   Lanes are DATA, derived from the same functions that drive the render —
   never a hand-maintained list, or the timeline silently drifts.

     const lanes = useMemo(() => beatsFrom(params.values()), [values])
     <Timeline clock={clock} lanes={lanes} />

   Lane kinds:
     bar        { start, end }               a beat / clip / tween
     keys       { keys: [{ t, ease? }] }    keyframes (diamonds), segments between
     markers    { keys: [{ t, label }] }    cue points

   Interaction: drag ruler to scrub (shift snaps to keys), shift-drag in the
   ruler sets a loop region, double-click clears it. Space plays, `,`/`.`
   step frames (shift ×10), J/K jump between keys, ⌘wheel zooms.
--------------------------------------------------------------------------- */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Pause, Play, Repeat, SkipBack, StepBack, StepForward, Gauge, ArrowLeftRight, ArrowRightToLine } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import { useClock, useClockTime, fmtTime, type Clock } from '../core/clock'
import { useHotkeys } from '../core/hotkeys'
import { IconButton } from '../ui/button'
import { Menu } from '../ui/controls'
import { useStudio } from '../layout/Studio'
import { useDensityPx } from '../core/density'

export interface Key { t: number; ease?: string; value?: string | number; selected?: boolean }
export interface Lane {
  id: string
  label: string
  kind?: 'bar' | 'keys' | 'markers'
  start?: number
  end?: number
  keys?: Key[]
  color?: string
  depth?: number
  /** dim when the lane is idle at the current time */
  muted?: boolean
}

const LABEL_W = 148

export function Timeline({
  clock, lanes = [], className, collapsible = true, defaultOpen = true, timeMode: tmInit = 'seconds', onKeyClick, extra, height, hotkeys = true,
}: {
  clock: Clock
  lanes?: Lane[]
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  timeMode?: 'seconds' | 'frames' | 'timecode'
  onKeyClick?: (lane: Lane, key: Key) => void
  extra?: ReactNode
  /** max height of the lanes area; lanes scroll past it */
  height?: number
  /** bind Space, , . J K Home S (priority 0 — shell bindings win). false when a shell drives its own transport. */
  hotkeys?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [timeMode, setTimeMode] = useState(tmInit)
  const { layout } = useStudio()
  const playing = useClock(clock, (s) => s.playing)
  const duration = useClock(clock, (s) => s.duration)
  const mode = useClock(clock, (s) => s.mode)
  const rate = useClock(clock, (s) => s.rate)
  const fps = useClock(clock, (s) => s.fps)
  const region = useClock(clock, (s) => s.region)
  const t = useClockTime(clock, 30)
  const [view, setView] = useState<[number, number]>([0, duration])
  useEffect(() => setView([0, duration]), [duration])

  const allKeys = useMemo(() => lanes.flatMap((l) => (l.keys ?? []).map((k) => k.t).concat(l.kind === 'bar' || !l.kind ? [l.start ?? 0, l.end ?? 0] : [])).sort((a, b) => a - b), [lanes])
  const jump = (dir: 1 | -1) => {
    const now = clock.time()
    const next = dir > 0 ? allKeys.find((k) => k > now + 1) : [...allKeys].reverse().find((k) => k < now - 1)
    if (next !== undefined) { clock.pause(); clock.seek(next) }
  }

  useHotkeys(hotkeys ? {
    space: { run: () => clock.toggle(), label: 'Play / pause', group: 'Playback' },
    enter: { run: () => clock.replay(), label: 'Replay', group: 'Playback' },
    ',': { run: () => clock.step(-1), label: 'Previous frame', group: 'Playback' },
    '.': { run: () => clock.step(1), label: 'Next frame', group: 'Playback' },
    'shift+,': { run: () => clock.step(-10), label: 'Back 10 frames', group: 'Playback' },
    'shift+.': { run: () => clock.step(10), label: 'Forward 10 frames', group: 'Playback' },
    j: { run: () => jump(-1), label: 'Previous key', group: 'Playback' },
    k: { run: () => jump(1), label: 'Next key', group: 'Playback' },
    home: { run: () => clock.seek(region?.[0] ?? 0), label: 'Go to start', group: 'Playback' },
    s: { run: () => clock.setRate(clock.getState().rate === 1 ? 0.25 : 1), label: 'Slow motion', group: 'Playback' },
  } : {}, [allKeys, region, hotkeys], { priority: 0 })

  const nextMode = mode === 'loop' ? 'pingpong' : mode === 'pingpong' ? 'once' : 'loop'
  const ModeIcon = mode === 'loop' ? Repeat : mode === 'pingpong' ? ArrowLeftRight : ArrowRightToLine
  const modeLabel = mode === 'loop' ? 'Looping' : mode === 'pingpong' ? 'Ping-pong' : 'Play once'

  const docked = layout === 'docked'
  return (
    <div className={cn('flex flex-col overflow-hidden', docked ? '' : 'panel', className)}>
      {/* transport */}
      <div className="flex h-header flex-none items-center gap-1 px-2">
        <IconButton icon={SkipBack} label="Go to start" shortcut="home" tipSide="top" onClick={() => clock.seek(region?.[0] ?? 0)} />
        <IconButton icon={StepBack} label="Previous frame" shortcut="," tipSide="top" onClick={() => clock.step(-1)} />
        <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Play'} shortcut="space" tipSide="top" onClick={() => clock.toggle()} variant="default" />
        <IconButton icon={StepForward} label="Next frame" shortcut="." tipSide="top" onClick={() => clock.step(1)} />
        <button type="button" onClick={() => setTimeMode(timeMode === 'seconds' ? 'frames' : timeMode === 'frames' ? 'timecode' : 'seconds')}
          className="ml-1 flex h-icon items-center gap-1 rounded-control px-2 tabular text-ui text-fg hover:bg-hover" title="Click to change units">
          {fmtTime(t, timeMode, fps)}
          <span className="text-fg-faint">/ {fmtTime(duration, timeMode, fps)}</span>
        </button>
        <div className="flex-1" />
        {extra}
        <IconButton icon={ModeIcon} label={`${modeLabel}. Click for ${nextMode === 'pingpong' ? 'ping-pong' : nextMode}`} tipSide="top" active={mode !== 'once'} onClick={() => clock.setState({ mode: nextMode })} />
        <Menu
          side="top" align="end"
          trigger={<button type="button" className={cn('flex h-icon items-center gap-1 rounded-control px-1.5 tabular text-ui hover:bg-hover', rate !== 1 ? 'text-signal-text' : 'text-fg-muted')}><Gauge size={13} strokeWidth={1.5} />{rate}×</button>}
          items={[0.1, 0.25, 0.5, 1, 2].map((r) => ({ label: `${r}×`, checked: r === rate, onClick: () => clock.setRate(r), shortcut: r === 0.25 ? 's' : undefined }))}
        />
        {collapsible && (
          <IconButton icon={ChevronDown} label={open ? 'Collapse timeline' : 'Expand timeline'} tipSide="top" onClick={() => setOpen(!open)}
            className={cn('transition-transform', !open && 'rotate-180')} />
        )}
      </div>
      {open && (
        <TrackArea clock={clock} lanes={lanes} view={view} setView={setView} duration={duration} region={region} fps={fps} t={t} allKeys={allKeys} onKeyClick={onKeyClick} height={height} />
      )}
    </div>
  )
}

function TrackArea({
  clock, lanes, view, setView, duration, region, fps, t, allKeys, onKeyClick, height,
}: {
  clock: Clock; lanes: Lane[]; view: [number, number]; setView: (v: [number, number]) => void; duration: number; region: [number, number] | null; fps: number; t: number; allKeys: number[]; onKeyClick?: (l: Lane, k: Key) => void; height?: number
}) {
  const area = useRef<HTMLDivElement>(null)
  const lane = useDensityPx('--d-lane', 24)
  const ruler = useDensityPx('--d-ruler', 28)
  const [w, setW] = useState(600)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(area.current!)
    return () => ro.disconnect()
  }, [])
  const span = view[1] - view[0]
  const X = (ms: number) => ((ms - view[0]) / span) * w
  const T = (px: number) => view[0] + (px / w) * span

  // Tick density adapts to zoom: ≥ 60px between labels.
  const steps = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000]
  const labelStep = steps.find((s) => (s / span) * w >= 64) ?? 10000
  const minor = labelStep / (labelStep >= 1000 ? 4 : 5)
  const ticks: number[] = []
  for (let m = Math.ceil(view[0] / minor) * minor; m <= view[1]; m += minor) ticks.push(Math.round(m))

  const drag = useRef<{ mode: 'scrub' | 'region'; from: number } | null>(null)
  const pointerT = (e: React.PointerEvent) => {
    const r = area.current!.getBoundingClientRect()
    let v = clamp(T(e.clientX - r.left), 0, duration)
    if (e.shiftKey && drag.current?.mode === 'scrub') {
      const near = allKeys.reduce((a, k) => (Math.abs(k - v) < Math.abs(a - v) ? k : a), Infinity)
      if (Math.abs(X(near) - X(v)) < 8) v = near
    }
    return Math.round((v / 1000) * fps) / fps * 1000
  }

  const onRulerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const v = pointerT(e)
    if (e.shiftKey) { drag.current = { mode: 'region', from: v }; clock.setState({ region: [v, v] }) }
    else { drag.current = { mode: 'scrub', from: v }; clock.pause(); clock.seek(v) }
  }
  const onRulerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const v = pointerT(e)
    if (drag.current.mode === 'scrub') clock.seek(v)
    else { const a = drag.current.from; clock.setState({ region: [Math.min(a, v), Math.max(a, v)] }) }
  }
  const onRulerUp = () => {
    if (drag.current?.mode === 'region') { const r = clock.getState().region; if (r && r[1] - r[0] < 20) clock.setState({ region: null }) }
    drag.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey) && !e.shiftKey) return
    const r = area.current!.getBoundingClientRect()
    const at = T(e.clientX - r.left)
    if (e.ctrlKey || e.metaKey) {
      const k = Math.exp(e.deltaY * 0.004)
      const ns = clamp(span * k, 100, duration)
      const a = clamp(at - ((at - view[0]) / span) * ns, 0, duration - ns)
      setView([a, a + ns])
    } else {
      const d = (e.deltaY / w) * span
      const a = clamp(view[0] + d, 0, duration - span)
      setView([a, a + span])
    }
  }

  const playX = X(t)
  const contentH = ruler + lanes.length * lane + 8
  return (
    <div className="flex min-h-0 items-start overflow-y-auto overflow-x-hidden border-t border-line" style={{ maxHeight: height ?? 240, height: contentH }} onWheel={onWheel}>
      {/* names — both columns keep their content height, so a clamped strip scrolls instead of clipping lanes */}
      <div className="flex-none overflow-hidden border-r border-line" style={{ width: LABEL_W, height: contentH }}>
        <div className="h-ruler" />
        {lanes.map((l) => (
          <div key={l.id} className="flex h-lane items-center gap-1.5 pr-2 text-ui text-fg-muted" style={{ paddingLeft: 12 + (l.depth ?? 0) * 12 }}>
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: l.color ?? 'var(--lane)' }} />
            <span className="truncate">{l.label}</span>
          </div>
        ))}
      </div>
      {/* tracks */}
      <div ref={area} className="relative min-w-0 flex-1 overflow-hidden" style={{ height: contentH }}>
        <div className="absolute inset-x-0 top-0 h-ruler cursor-ew-resize border-b border-line" onPointerDown={onRulerDown} onPointerMove={onRulerMove} onPointerUp={onRulerUp}
          onDoubleClick={() => clock.setState({ region: null })}>
          {ticks.map((m) => {
            const major = m % labelStep === 0
            return (
              <div key={m} className="pointer-events-none absolute bottom-0" style={{ left: X(m) }}>
                <div className={cn('w-px', major ? 'h-2 bg-line-strong' : 'h-1 bg-line')} />
                {major && <div className="absolute bottom-2.5 left-1 tabular text-ui-sm text-fg-muted">{m >= 1000 ? `${m / 1000}s` : `${m}ms`}</div>}
              </div>
            )
          })}
          {region && <div className="pointer-events-none absolute top-0 bottom-0 bg-signal/15 shadow-[inset_1px_0_var(--signal),inset_-1px_0_var(--signal)]" style={{ left: X(region[0]), width: X(region[1]) - X(region[0]) }} />}
        </div>
        <div className="absolute inset-x-0 top-ruler bottom-0">
          {lanes.map((l, i) => {
            const active = l.kind !== 'keys' && l.kind !== 'markers' && t >= (l.start ?? 0) && t <= (l.end ?? 0)
            return (
              <div key={l.id} className="absolute inset-x-0 h-lane" style={{ top: i * lane }}>
                {(l.kind ?? 'bar') === 'bar' && (
                  <div className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full transition-opacity"
                    style={{ left: X(l.start ?? 0), width: Math.max(4, X(l.end ?? 0) - X(l.start ?? 0)), background: l.color ?? 'var(--signal)', opacity: active ? 1 : 0.38 }} />
                )}
                {l.kind === 'keys' && l.keys && (
                  <>
                    {l.keys.slice(1).map((k, j) => {
                      const a = l.keys![j]
                      const hold = a.value !== undefined && a.value === k.value
                      return <div key={j} className={cn('absolute top-1/2 h-0.5 -translate-y-1/2', hold ? 'border-t border-dashed border-fg-faint' : 'bg-line-strong')} style={{ left: X(a.t), width: X(k.t) - X(a.t) }} />
                    })}
                    {l.keys.map((k, j) => (
                      <button key={j} type="button" aria-label={`Key at ${fmtTime(k.t)}`} onClick={() => { clock.pause(); clock.seek(k.t); onKeyClick?.(l, k) }}
                        className={cn('absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1.5px] after:absolute after:-inset-[7px] after:content-[""] outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1 focus-visible:ring-offset-panel',
                          k.selected ? 'bg-signal' : 'bg-fg/80 hover:bg-fg', Math.abs(k.t - t) < 1 && 'ring-2 ring-signal/60')}
                        style={{ left: X(k.t) }} />
                    ))}
                  </>
                )}
                {l.kind === 'markers' && l.keys?.map((k, j) => (
                  <div key={j} className="absolute top-1/2 flex -translate-x-px -translate-y-1/2 items-center gap-1" style={{ left: X(k.t) }}>
                    <div className="h-4 w-0.5 rounded-full" style={{ background: l.color ?? 'var(--key)' }} />
                    {k.value !== undefined && <span className="text-ui-sm text-fg-muted">{k.value}</span>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        {/* playhead — red/orange, deliberately NOT the accent, so it never reads as selection */}
        <div className="pointer-events-none absolute top-0 bottom-0 z-10" style={{ left: playX }}>
          <div className="absolute top-0 left-1/2 h-[9px] w-[11px] -translate-x-1/2 bg-rec [clip-path:polygon(0_0,100%_0,100%_55%,50%_100%,0_55%)]" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-rec" />
        </div>
      </div>
    </div>
  )
}
