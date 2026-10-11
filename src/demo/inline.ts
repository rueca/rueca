/* Demo pictures as data URLs, for shells whose exports snapshot the DOM: an
   SVG <image> pointing at a file can drop out of a snapshot, a data URL can't.
   inlineDemo(url) returns the data URL once it has loaded and the plain URL
   until then (so the screen never waits); useInlined() re-renders a component
   when another picture lands. */
import { useSyncExternalStore } from 'react'

const inlined = new Map<string, string>()
const listeners = new Set<() => void>()
let version = 0

export function inlineDemo(url: string): string {
  if (!inlined.has(url)) {
    inlined.set(url, url)
    fetch(url)
      .then((r) => r.blob())
      .then((b) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(b) }))
      .then((data) => { inlined.set(url, data); version++; listeners.forEach((f) => f()) })
      .catch(() => { /* keep the URL: the screen still shows it */ })
  }
  return inlined.get(url)!
}

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
/** Re-render when an inlined picture finishes loading. */
export const useInlined = () => useSyncExternalStore(subscribe, () => version)
