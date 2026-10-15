import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'studio:theme'
const ATTR = 'data-studio-theme'

/* The kit's theme lives on its OWN attribute, <html data-studio-theme="light|dark">, so the tool can be dark while the
   app it sits in is light (and toggling one never flips the other — break-it B2-05). With no attribute it follows the
   OS. A site that drives its whole page from `.dark` / `.light` on <html> (this repo's gallery and landing) opts back
   into classes once, before rendering: configureTheme({ htmlClass: true }). */
let htmlClass = false
export function configureTheme(o: { htmlClass?: boolean }) { htmlClass = !!o.htmlClass }

const stored = (): Theme | null => {
  try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : null } catch { return null }
}
const os = (): Theme => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

const read = (): Theme => {
  if (typeof document === 'undefined') return 'dark'
  const root = document.documentElement
  if (htmlClass) return root.classList.contains('light') ? 'light' : root.classList.contains('dark') ? 'dark' : stored() ?? os()
  const a = root.getAttribute(ATTR)
  // no attribute yet: what the tokens are showing — the saved choice, else the OS (the first click must flip it, B2-06)
  return a === 'light' || a === 'dark' ? a : stored() ?? os()
}

/** The theme the tool is showing right now (non-reactive). */
export const currentTheme = read

const apply = (t: Theme) => {
  const root = document.documentElement
  if (htmlClass) { root.classList.toggle('light', t === 'light'); root.classList.toggle('dark', t === 'dark') }
  else root.setAttribute(ATTR, t)
}

/** The tool's light / dark theme: defaults to the OS, persists (`studio:theme`). */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(read)
  const setTheme = useCallback((t: Theme) => {
    apply(t)
    try { localStorage.setItem(KEY, t) } catch { /* noop */ }
    setThemeState(t)
    window.dispatchEvent(new CustomEvent('studio:theme', { detail: t }))
  }, [])
  useEffect(() => {
    // a saved choice with no head script to set it before paint: apply it now (B2-06: lost on reload otherwise)
    const s = stored()
    if (s && !htmlClass && !document.documentElement.hasAttribute(ATTR)) { apply(s); setThemeState(s) }
    const on = (e: Event) => setThemeState((e as CustomEvent).detail)
    window.addEventListener('studio:theme', on)
    return () => window.removeEventListener('studio:theme', on)
  }, [])
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
