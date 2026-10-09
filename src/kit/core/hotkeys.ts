/* ---------------------------------------------------------------------------
   Hotkeys. `mod` = ⌘ on macOS, Ctrl elsewhere. Ignored while typing in a field.

     useHotkeys({
       'mod+e': exportPng,                                  // plain handler
       't': { run: textTool, label: 'Text tool' },          // labelled → appears in the ? sheet
     })

   ONE window listener dispatches to every registered binding. Priority
   decides who wins a shared key: shell code defaults to 10, kit defaults
   (theme T, timeline Space, stage Shift+1) register at 0 — so a shell's own
   T for "Text tool" beats the theme toggle without anyone renaming anything.
   Equal priority → the most recently mounted wins, and dev builds warn.

   Hold keys (Lightroom's "hold \ to see the original"):
     useHoldKey('\\', (down) => setPeek(down))
--------------------------------------------------------------------------- */
import { useEffect, useRef, useSyncExternalStore } from 'react'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export type HotkeyHandler = ((e: KeyboardEvent) => void) | { run: (e: KeyboardEvent) => void; label?: string; group?: string; when?: () => boolean } | undefined | false

const typing = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  if (!el || !el.tagName) return false
  const tag = el.tagName
  return el.isContentEditable || tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((el as HTMLInputElement).type))
}
/** Space / Enter on a focused button belong to the button. */
const onButton = (e: KeyboardEvent, key: string) => {
  if (key !== 'space' && key !== 'enter') return false
  const el = e.target as HTMLElement | null
  return !!el?.closest?.('button,[role="button"],[role="checkbox"],[role="switch"],[role="radio"],[role="tab"],[role="menuitem"],a[href]')
}

const normKey = (k: string) => {
  const key = k.toLowerCase()
  return key === ' ' ? 'space' : key === 'escape' ? 'esc' : key
}

const CODE_CHARS: Record<string, string> = { slash: '/', backslash: '\\', comma: ',', period: '.', minus: '-', equal: '=', bracketleft: '[', bracketright: ']', semicolon: ';', quote: "'", backquote: '`' }

export function matches(combo: string, e: KeyboardEvent) {
  const parts = combo.toLowerCase().split('+')
  let key = parts.pop()!
  if (key === '' && combo.endsWith('+')) key = '+'
  const want = { mod: parts.includes('mod'), shift: parts.includes('shift'), alt: parts.includes('alt'), ctrl: parts.includes('ctrl') }
  const mod = isMac ? e.metaKey : e.ctrlKey
  if (want.mod !== mod) return false
  if (want.alt !== e.altKey) return false
  if (isMac && want.ctrl !== e.ctrlKey) return false
  const k = normKey(e.key)
  const rawCode = e.code.toLowerCase().replace(/^key|^digit/, '')
  const code = CODE_CHARS[rawCode] ?? rawCode
  const symbolic = key.length === 1 && !/[a-z0-9]/.test(key)
  if (symbolic) {
    // '?' is typed with shift: a character match doesn't demand it. A physical-key match
    // ('shift+,' vs ',') must agree on shift so both can coexist.
    if (k === key) return !want.shift || e.shiftKey
    if (code === key) return want.shift === e.shiftKey
    return false
  }
  if (want.shift !== e.shiftKey) return false
  return k === key || code === key || (key === 'plus' && k === '+')
}

/** Split 'mod+z,mod+y' into alternatives — but ',' and 'shift+,' are keys, not separators. */
export function splitCombos(s: string) {
  const out: string[] = []
  let cur = ''
  for (const ch of s) {
    if (ch === ',' && cur && !cur.endsWith('+')) { out.push(cur.trim()); cur = '' } else cur += ch
  }
  if (cur) out.push(cur.trim())
  return out
}

interface Binding { id: number; combo: string; run: (e: KeyboardEvent) => void; label?: string; group?: string; priority: number; when?: () => boolean; order: number }
let bindings: Binding[] = []
let seq = 0
const subs = new Set<() => void>()
const notify = () => subs.forEach((f) => f())

let installed = false
function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || typing(e)) return
    const hits = bindings.filter((b) => splitCombos(b.combo).some((c) => matches(c, e)) && (!b.when || b.when()))
    if (!hits.length) return
    if (onButton(e, normKey(e.key))) return
    hits.sort((a, b) => b.priority - a.priority || b.order - a.order)
    e.preventDefault()
    hits[0].run(e)
  })
}

export function useHotkeys(map: Record<string, HotkeyHandler>, deps: unknown[] = [], opts: { priority?: number; group?: string; enabled?: boolean } = {}) {
  const ref = useRef(map)
  ref.current = map
  const priority = opts.priority ?? 10
  const enabled = opts.enabled ?? true
  const keys = Object.keys(map).filter((k) => !!map[k]).join('|')
  useEffect(() => {
    if (!enabled) return
    install()
    const mine: Binding[] = Object.keys(ref.current).filter((c) => !!ref.current[c]).map((combo) => {
      const h = ref.current[combo]
      const meta = typeof h === 'object' && h ? h : undefined
      return {
        id: ++seq, combo, priority, order: seq, group: meta?.group ?? opts.group, label: meta?.label,
        when: meta?.when,
        run: (e: KeyboardEvent) => { const cur = ref.current[combo]; if (typeof cur === 'function') cur(e); else if (cur) cur.run(e) },
      }
    })
    // Tab is how keyboard users move through the UI. A bare Tab / Shift+Tab binding must say WHEN it
    // applies, or it would trap focus for everyone (break-it QA A1). Unguarded ones are dropped.
    const isTab = (c: string) => splitCombos(c).some((x) => x === 'tab' || x === 'shift+tab')
    for (const b of mine) if (isTab(b.combo) && !b.when) {
      if (import.meta.env?.DEV) console.warn(`[trompo] hotkey "${b.combo}" ignored: bare Tab bindings need a \`when\` guard so keyboard focus still moves.`)
    }
    const kept = mine.filter((b) => !(isTab(b.combo) && !b.when))
    mine.length = 0; mine.push(...kept)
    if (import.meta.env?.DEV) for (const b of mine) {
      const clash = bindings.find((o) => o.priority === b.priority && o.combo === b.combo)
      if (clash) console.warn(`[studio] hotkey "${b.combo}" bound twice at priority ${b.priority}${clash.label ? ` (also "${clash.label}")` : ''}. The newest wins; pass { priority } to choose.`)
    }
    bindings = [...bindings, ...mine]
    notify()
    return () => { const ids = new Set(mine.map((m) => m.id)); bindings = bindings.filter((b) => !ids.has(b.id)); notify() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, priority, enabled, ...deps])
}

/** Every labelled binding currently mounted — feeds the ? sheet and the palette. */
export function useHotkeyRegistry() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f) },
    () => bindings,
    () => bindings,
  )
    .filter((b) => b.label)
    .sort((a, b) => b.priority - a.priority)
    .filter((b, i, arr) => arr.findIndex((o) => o.combo === b.combo) === i)
}

/** Fire on press and on release — hold-to-peek, hold-to-pan. */
export function useHoldKey(combo: string, onChange: (down: boolean) => void, opts: { enabled?: boolean } = {}) {
  const ref = useRef(onChange)
  ref.current = onChange
  useEffect(() => {
    if (opts.enabled === false) return
    let down = false
    const kd = (e: KeyboardEvent) => { if (down || typing(e) || e.repeat || !matches(combo, e)) return; down = true; e.preventDefault(); ref.current(true) }
    const ku = (e: KeyboardEvent) => { if (!down) return; if (normKey(e.key) === combo.split('+').pop() || e.code.toLowerCase().endsWith(combo.split('+').pop()!)) { down = false; ref.current(false) } }
    const blur = () => { if (down) { down = false; ref.current(false) } }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur) }
  }, [combo, opts.enabled])
}

/** ⌘⇧Z on Mac, Ctrl+Shift+Z elsewhere — for tooltips and menus. */
export function prettyCombo(combo: string) {
  const first = splitCombos(combo)[0] ?? combo
  const parts = first === '+' ? ['+'] : first.endsWith('+') ? [...first.slice(0, -1).split('+').filter(Boolean), '+'] : first.split('+')
  const map: Record<string, string> = isMac
    ? { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃', space: 'Space', esc: 'Esc', enter: '↵', backspace: '⌫', delete: '⌦', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', plus: '+' }
    : { mod: 'Ctrl+', shift: 'Shift+', alt: 'Alt+', ctrl: 'Ctrl+', space: 'Space', esc: 'Esc', enter: 'Enter', backspace: 'Bksp', delete: 'Del', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', plus: '+' }
  return parts.map((p) => map[p.toLowerCase()] ?? p.toUpperCase()).join('')
}
