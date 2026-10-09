import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'studio:theme'

const read = (): Theme => {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

/** The theme is a class on <html>, defaults to the OS, persists. index.html sets it before first paint. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(read)
  const setTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    root.classList.toggle('light', t === 'light')
    root.classList.toggle('dark', t === 'dark')
    try { localStorage.setItem(KEY, t) } catch { /* noop */ }
    setThemeState(t)
    window.dispatchEvent(new CustomEvent('studio:theme', { detail: t }))
  }, [])
  useEffect(() => {
    const on = (e: Event) => setThemeState((e as CustomEvent).detail)
    window.addEventListener('studio:theme', on)
    return () => window.removeEventListener('studio:theme', on)
  }, [])
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
