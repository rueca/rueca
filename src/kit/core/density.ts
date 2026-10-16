/* ---------------------------------------------------------------------------
   Density tokens in JS. Most chrome sizes are CSS (h-control, h-lane…), but
   timelines and lists position rows in code. useDensityPx reads a token from
   the kit's root (<html> here; .studio in a registry install) and re-reads when data-density or the theme changes.

     const lane = useDensityPx('--d-lane', 20)
--------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react'

const cache = new Map<string, number>()
const subs = new Set<() => void>()
let observer: MutationObserver | null = null
let recheck = false // one re-read per batch of mounts, not one per subscriber

/** A density token in px, read from <html>. Falls back when there's no DOM or the token isn't set. */
export function densityPx(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback
  let v = cache.get(name)
  if (v === undefined) {
    // the tokens live on <html> in this repo, but a registry install scopes them to the kit's own root
    const root = document.querySelector('.studio:not(.studio-touch), [data-studio]') ?? document.documentElement
    v = parseFloat(getComputedStyle(root).getPropertyValue(name))
    if (!Number.isFinite(v) && root !== document.documentElement) v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
    if (!Number.isFinite(v)) v = fallback
    if (observer) cache.set(name, v) // only cache while something watches for density changes
  }
  return v
}

function subscribe(cb: () => void) {
  subs.add(cb)
  // the first read can happen before the kit's root is in the DOM (same commit): read again once it is
  if (!recheck) { recheck = true; queueMicrotask(() => { recheck = false; cache.clear(); subs.forEach((f) => f()) }) }
  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => { cache.clear(); subs.forEach((f) => f()) })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-density', 'class', 'style'] })
  }
  return () => {
    subs.delete(cb)
    if (!subs.size) { observer?.disconnect(); observer = null; cache.clear() }
  }
}

export function useDensityPx(name: string, fallback: number): number {
  return useSyncExternalStore(subscribe, () => densityPx(name, fallback), () => fallback)
}

/* ---------------------------------------------------------------------------
   The density choice: default, comfortable or compact, remembered per browser
   (`studio:density`) like the theme. <Studio> restores it on mount; the
   command palette lists the three as View commands.
--------------------------------------------------------------------------- */
export type Density = 'default' | 'comfortable' | 'compact'
const KEY = 'studio:density'

export function currentDensity(): Density {
  if (typeof document === 'undefined') return 'default'
  const d = document.documentElement.dataset.density
  return d === 'comfortable' || d === 'compact' ? d : 'default'
}

export function setDensity(d: Density) {
  const root = document.documentElement
  if (d === 'default') delete root.dataset.density
  else root.dataset.density = d
  try { localStorage.setItem(KEY, d) } catch { /* noop */ }
}

/** Apply the saved choice, unless something already set the attribute (a host app, a client view). */
export function restoreDensity() {
  if (typeof document === 'undefined' || document.documentElement.dataset.density) return
  let d: string | null = null
  try { d = localStorage.getItem(KEY) } catch { /* noop */ }
  if (d === 'comfortable' || d === 'compact') document.documentElement.dataset.density = d
}

export function useDensity() {
  const density = useSyncExternalStore(subscribe, currentDensity, () => 'default' as Density)
  return { density, setDensity }
}
