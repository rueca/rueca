/* ---------------------------------------------------------------------------
   useHoldKey — spring-loaded keys: true while a key is held, false on release.
   For hold-to-peek (Lightroom's `\`), spring-loaded tools (hold H to pan,
   hold Z to zoom) and "hold Alt to see the mask". The kit's useHotkeys only
   fires on keydown, so it cannot express "while held".

     const peeking = useHoldKey('\\')
     const [peek, setPeek] = useState(false); useHoldKey('\\', setPeek)   // or a callback

   Ignores auto-repeat and keys typed into fields; releases on window blur
   (otherwise a ⌘-Tab mid-hold leaves it stuck on).
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((el as HTMLInputElement).type))
}

export function useHoldKey(key: string, onChange?: (held: boolean) => void) {
  const [held, setHeld] = useState(false)
  const cb = useRef(onChange)
  cb.current = onChange
  useEffect(() => {
    let on = false
    const set = (v: boolean) => { if (v === on) return; on = v; setHeld(v); cb.current?.(v) }
    const match = (e: KeyboardEvent) => e.key === key || e.key.toLowerCase() === key.toLowerCase()
    const down = (e: KeyboardEvent) => {
      if (!match(e) || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      if (!e.repeat) set(true)
    }
    const up = (e: KeyboardEvent) => { if (match(e)) set(false) }
    const blur = () => set(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [key])
  return held
}
