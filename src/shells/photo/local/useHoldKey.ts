/* ---------------------------------------------------------------------------
   useHoldKey — press-and-hold bindings (Lightroom's \ before/after peek,
   Figma's hold-Z zoom, any "show original while held"). The kit's
   useHotkeys only fires on keydown; this reports down AND up, ignores key
   repeat and typing in fields, and releases on window blur so a held state
   can never get stuck when focus leaves mid-press.

     useHoldKey('\\', (held) => ui.setState({ bypass: held }))
--------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react'

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((el as HTMLInputElement).type)))
}

export function useHoldKey(key: string, onChange: (held: boolean) => void) {
  const cb = useRef(onChange)
  cb.current = onChange
  useEffect(() => {
    let held = false
    const set = (v: boolean) => { if (v !== held) { held = v; cb.current(v) } }
    const match = (e: KeyboardEvent) => e.key === key && !e.metaKey && !e.ctrlKey && !e.altKey
    const down = (e: KeyboardEvent) => { if (!match(e) || typing(e.target)) return; e.preventDefault(); if (!e.repeat) set(true) }
    const up = (e: KeyboardEvent) => { if (e.key === key) set(false) }
    const blur = () => set(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [key])
}
