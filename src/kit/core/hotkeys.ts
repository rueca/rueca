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
/** A focused number field / slider owns bare digits, Backspace, Delete and arrows (break-it V3:
    typing "2" into a focused field must not fire the canvas "20% opacity" hotkey). */
const onField = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey) return false
  const el = e.target as HTMLElement | null
  if (!el?.closest?.('[role="spinbutton"],[role="slider"]')) return false
  return e.key.length === 1 || /^(Backspace|Delete|Arrow|Home|End|Page)/.test(e.key)
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
  // A bare Space binding (play / pause) fires on RELEASE, and only if the pointer wasn't pressed while
  // Space was held — Space+drag is the hand tool, so panning must not also toggle playback (break-it F8).
  let spacePending: { run: (e: KeyboardEvent) => void } | null = null
  let spaceUsed = false
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || typing(e) || onField(e)) return
    const hits = bindings.filter((b) => splitCombos(b.combo).some((c) => matches(c, e)) && (!b.when || b.when()))
    if (!hits.length) return
    if (onButton(e, normKey(e.key))) return
    hits.sort((a, b) => b.priority - a.priority || b.order - a.order)
    e.preventDefault()
    if (normKey(e.key) === 'space' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (!e.repeat && !spacePending) { spacePending = hits[0]; spaceUsed = false }
      return
    }
    hits[0].run(e)
  })
  window.addEventListener('pointerdown', () => { if (spacePending) spaceUsed = true }, true)
  window.addEventListener('keyup', (e) => {
    if (normKey(e.key) !== 'space' || !spacePending) return
    const b = spacePending
    spacePending = null
    if (!spaceUsed) b.run(e)
  })
  window.addEventListener('blur', () => { spacePending = null })
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
      if (import.meta.env?.DEV) console.warn(`[studio] hotkey "${b.combo}" ignored: bare Tab bindings need a \`when\` guard so keyboard focus still moves.`)
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
export function useHoldKey(combo: string, onChange: (down: boolean) => void, opts: { enabled?: boolean; priority?: number } = {}) {
  const ref = useRef(onChange)
  ref.current = onChange
  const down = useRef(false)
  // Pressing goes through the one dispatcher, so priority holds: a tool's held T beats the kit's T (break-it B3-S8).
  useHotkeys({ [combo]: () => { if (down.current) return; down.current = true; ref.current(true) } }, [], { enabled: opts.enabled !== false, priority: opts.priority })
  useEffect(() => {
    const last = combo.split('+').pop()!
    const release = () => { if (down.current) { down.current = false; ref.current(false) } }
    const ku = (e: KeyboardEvent) => { if (down.current && (normKey(e.key) === last || e.code.toLowerCase().endsWith(last))) release() }
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', release)
    return () => { window.removeEventListener('keyup', ku); window.removeEventListener('blur', release); release() }
  }, [combo])
}

/** ⌘⇧Z on Mac, Ctrl+Shift+Z elsewhere — for tooltips and menus. */
export function prettyCombo(combo: string) {
  const first = splitCombos(combo)[0] ?? combo
  const parts = first === '+' ? ['+'] : first.endsWith('+') ? [...first.slice(0, -1).split('+').filter(Boolean), '+'] : first.split('+')
  const map: Record<string, string> = isMac
    ? { mod: '⌘', shift: '⇧', alt: '⌥', ctrl: '⌃', space: 'Space', esc: 'Esc', enter: '↵', backspace: '⌫', delete: '⌦', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', plus: '+', home: 'Home', end: 'End', tab: 'Tab', pageup: 'PgUp', pagedown: 'PgDn' }
    : { mod: 'Ctrl+', shift: 'Shift+', alt: 'Alt+', ctrl: 'Ctrl+', space: 'Space', esc: 'Esc', enter: 'Enter', backspace: 'Bksp', delete: 'Del', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', plus: '+', home: 'Home', end: 'End', tab: 'Tab', pageup: 'PgUp', pagedown: 'PgDn' }
  return parts.map((p) => map[p.toLowerCase()] ?? p.toUpperCase()).join('')
}
