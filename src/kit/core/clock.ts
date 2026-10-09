/* ---------------------------------------------------------------------------
   The clock. One playhead for the whole studio, outside React.

   Artifacts should render as a pure function of time — draw(t) — never by
   accumulating state per frame. Then scrubbing the timeline, slow-mo, frame
   stepping and frame-accurate video export all work for free, in any
   renderer: Canvas 2D, WebGL, SVG, DOM.

     export const clock = createClock({ duration: 2400, loop: true })
     clock.onTick((t) => draw(ctx, params.values(), t))      // artifact
     const t = useClockTime(clock, 15)                        // React readout, throttled

   React never re-renders per frame: the playhead lives here, not in state.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { useEffect, useState } from 'react'

export interface ClockState {
  playing: boolean
  rate: number
  duration: number
  /** kept for compatibility: true = 'loop', false = 'once' */
  loop: boolean
  /** what happens at the end: stop, wrap, or bounce back (Rive / Figma Motion) */
  mode: 'once' | 'loop' | 'pingpong'
  /** current direction while ping-ponging */
  direction: 1 | -1
  fps: number
  /** keep emitting ticks (dt = 0) while paused — for artifacts with their own life (physics, cursors). Default true. */
  idle: boolean
  /** loop/work-area region in ms; null = whole duration */
  region: [number, number] | null
}

export interface Clock extends StoreApi<ClockState> {
  /** current time in ms — read freely, it is not reactive */
  time: () => number
  seek: (t: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  replay: () => void
  step: (frames: number) => void
  setRate: (r: number) => void
  onTick: (fn: (t: number, dt: number) => void) => () => void
  /** stop the rAF loop and drive time manually — used by frame-accurate export */
  hold: () => () => void
}

export function createClock(init: Partial<ClockState> = {}): Clock {
  const mode = init.mode ?? (init.loop === false ? 'once' : 'loop')
  const store = createStore<ClockState>(() => ({
    playing: init.playing ?? true,
    rate: 1,
    duration: 3000,
    fps: 60,
    region: null,
    idle: true,
    direction: 1,
    ...init,
    mode,
    loop: mode !== 'once',
  }))
  // keep `loop` and `mode` in step whichever one a caller sets
  store.subscribe((s, prev) => {
    if (s.loop !== prev.loop && s.mode === prev.mode) store.setState({ mode: s.loop ? 'loop' : 'once' })
    else if (s.mode !== prev.mode && s.loop !== (s.mode !== 'once')) store.setState({ loop: s.mode !== 'once', direction: 1 })
  })

  let t = 0
  let last = 0
  let raf = 0
  let held = false
  const ticks = new Set<(t: number, dt: number) => void>()
  const emit = (dt: number) => ticks.forEach((fn) => fn(t, dt))

  const bounds = () => {
    const s = store.getState()
    return s.region ?? [0, s.duration]
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    // Hidden tab: browsers throttle rAF anyway; don't advance or render at all.
    if (typeof document !== 'undefined' && document.hidden) { last = 0; return }
    const dtReal = last ? Math.min(now - last, 100) : 0
    last = now
    const s = store.getState()
    let dt = 0
    if (s.playing && !held) {
      dt = dtReal * s.rate * (s.mode === 'pingpong' ? s.direction : 1)
      t += dt
      const [a, b] = bounds()
      if (s.mode === 'pingpong') {
        if (t >= b) { t = b - (t - b); store.setState({ direction: -1 }) }
        else if (t <= a) { t = a + (a - t); store.setState({ direction: 1 }) }
      } else if (t >= b) {
        if (s.mode === 'loop') t = a + ((t - a) % Math.max(1, b - a))
        else { t = b; store.setState({ playing: false }) }
      }
      emit(dt)
    } else if (s.idle) emit(0)
  }

  const start = () => { if (!raf && typeof window !== 'undefined') { last = 0; raf = requestAnimationFrame(frame) } }
  start()

  const api: Clock = Object.assign(store, {
    time: () => t,
    seek: (to: number) => {
      const s = store.getState()
      t = Math.max(0, Math.min(s.duration, to))
      emit(0)
    },
    play: () => {
      const [a, b] = bounds()
      if (t >= b) t = a
      store.setState({ playing: true })
    },
    pause: () => store.setState({ playing: false }),
    toggle: () => (store.getState().playing ? api.pause() : api.play()),
    replay: () => { t = bounds()[0]; store.setState({ playing: true, direction: 1 }); emit(0) },
    step: (frames: number) => {
      const s = store.getState()
      store.setState({ playing: false })
      api.seek(t + (frames * 1000) / s.fps)
    },
    setRate: (r: number) => store.setState({ rate: r }),
    onTick: (fn: (t: number, dt: number) => void) => { ticks.add(fn); return () => ticks.delete(fn) },
    hold: () => { held = true; return () => { held = false; last = 0 } },
  })
  return api
}

/** Throttled time readout for React — ~15fps is plenty for a label and keeps React out of the frame loop. */
export function useClockTime(clock: Clock, fps = 15) {
  const [t, setT] = useState(clock.time())
  useEffect(() => {
    let lastSet = 0
    return clock.onTick((now) => {
      const wall = performance.now()
      if (wall - lastSet > 1000 / fps || !clock.getState().playing) { lastSet = wall; setT(now) }
    })
  }, [clock, fps])
  return t
}

export const useClock = <T,>(clock: Clock, pick: (s: ClockState) => T) => useStore(clock, pick)

export const fmtTime = (ms: number, mode: 'seconds' | 'frames' | 'timecode' = 'seconds', fps = 60) => {
  if (mode === 'frames') return String(Math.round((ms / 1000) * fps))
  if (mode === 'timecode') {
    const total = Math.floor((ms / 1000) * fps)
    const f = total % fps, s = Math.floor(total / fps) % 60, m = Math.floor(total / fps / 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
