/* ---------------------------------------------------------------------------
   Density tokens in JS. Most chrome sizes are CSS (h-control, h-lane…), but
   timelines and lists position rows in code. useDensityPx reads a token from
   <html> and re-reads when data-density (or the theme class) changes.

     const lane = useDensityPx('--d-lane', 24)
--------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react'

const cache = new Map<string, number>()
const subs = new Set<() => void>()
let observer: MutationObserver | null = null

/** A density token in px, read from <html>. Falls back when there's no DOM or the token isn't set. */
export function densityPx(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback
  let v = cache.get(name)
  if (v === undefined) {
    v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
    if (!Number.isFinite(v)) v = fallback
    if (observer) cache.set(name, v) // only cache while something watches for density changes
  }
  return v
}

function subscribe(cb: () => void) {
  subs.add(cb)
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
