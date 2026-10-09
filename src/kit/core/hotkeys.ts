/* ---------------------------------------------------------------------------
   Hotkeys. `mod` = ⌘ on macOS, Ctrl elsewhere. Ignored while typing in a field.

     useHotkeys({ 'space': clock.toggle, 'mod+z': params.undo, 'shift+mod+z': params.redo })

   A registry is kept so the command palette and the shortcut sheet can list
   every binding without a hand-maintained table.
--------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const typing = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return el.isContentEditable || tag === 'TEXTAREA' || (tag === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((el as HTMLInputElement).type))
}

const normKey = (k: string) => {
  const key = k.toLowerCase()
  return key === ' ' ? 'space' : key === 'escape' ? 'esc' : key
}

export function matches(combo: string, e: KeyboardEvent) {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop()!
  const want = { mod: parts.includes('mod'), shift: parts.includes('shift'), alt: parts.includes('alt'), ctrl: parts.includes('ctrl') }
  const mod = isMac ? e.metaKey : e.ctrlKey
  if (want.mod !== mod) return false
  if (want.shift !== e.shiftKey) return false
  if (want.alt !== e.altKey) return false
  if (isMac && want.ctrl !== e.ctrlKey) return false
  const k = normKey(e.key)
  const code = e.code.toLowerCase().replace(/^key|^digit/, '')
  return k === key || code === key
}

export function useHotkeys(map: Record<string, ((e: KeyboardEvent) => void) | undefined>, deps: unknown[] = []) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (typing(e) || e.defaultPrevented) return
      for (const [combo, fn] of Object.entries(ref.current)) {
        if (!fn) continue
        if (combo.split(',').some((c) => matches(c.trim(), e))) { e.preventDefault(); fn(e); return }
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** ⌘⇧Z on Mac, Ctrl+Shift+Z elsewhere — for tooltips and menus. */
export function prettyCombo(combo: string) {
  const parts = combo.split(',')[0].trim().split('+')
  const map: Record<string, string> = isMac
    ? { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃', space: 'Space', esc: 'Esc', enter: '↵', backspace: '⌫', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓' }
    : { mod: 'Ctrl+', shift: 'Shift+', alt: 'Alt+', ctrl: 'Ctrl+', space: 'Space', esc: 'Esc', enter: 'Enter', backspace: 'Bksp', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓' }
  return parts.map((p) => map[p.toLowerCase()] ?? p.toUpperCase()).join('')
}
