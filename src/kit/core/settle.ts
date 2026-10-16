/* ---------------------------------------------------------------------------
   A burst of keyboard or wheel steps is one undo step, like a drag: each step
   goes out live (final=false) and the last one commits 500 ms after the burst,
   or at once on blur. If the value changes under the burst before then (an undo,
   a preset, another control), the burst is dropped instead of committing a value
   that's no longer true, which used to overwrite the undo and clear redo.

     const settle = useSettle(value, onChange)
     onKeyDown: settle.step(next)      // live now, commit later
     onBlur:    settle.flush()
--------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react'

const same = (a: unknown, b: unknown) =>
  Object.is(a, b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9) || (typeof a === 'object' && JSON.stringify(a) === JSON.stringify(b))

export function useSettle<T>(value: T, onChange: (v: T, final: boolean) => void, delay = 500) {
  // always call the latest onChange: a shell's handler may close over state from the render that started the burst
  const cb = useRef(onChange)
  cb.current = onChange
  const pending = useRef<{ v: T } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const self = useRef<{ flush(): void; step(v: T): void; defer(v: T): void; readonly current: T | undefined } | null>(null)
  self.current ??= {
    /** commit what's pending now */
    flush() { clearTimeout(timer.current); const p = pending.current; pending.current = null; if (p) cb.current(p.v, true) },
    /** send v live and commit it when the burst ends */
    step(v: T) { cb.current(v, false); self.current!.defer(v) },
    /** v has already gone out live (a slider did it): just commit it when the burst ends */
    defer(v: T) { pending.current = { v }; clearTimeout(timer.current); timer.current = setTimeout(() => self.current!.flush(), delay) },
    /** the value the burst has reached, if one is running */
    get current() { return pending.current?.v },
  }
  const api = self.current

  useEffect(() => {
    const p = pending.current
    if (p && !same(p.v, value)) { clearTimeout(timer.current); pending.current = null }
  }, [value])
  useEffect(() => () => { const p = pending.current; clearTimeout(timer.current); if (p) cb.current(p.v, true) }, [])
  return api
}
