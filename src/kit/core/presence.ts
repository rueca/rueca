/* ---------------------------------------------------------------------------
   Presence: how much room the chrome takes while you work. Three levels on
   top of ⌘\ (hide everything), each a per-browser choice (`studio:presence`):

     fade      islands drop to 35% while you drag on the canvas, back on release
     dim       islands rest at 55% until the pointer comes near or focus enters
     minimised ⇧\ — panels fold to their headers, the timeline to its transport

   <Studio> reads them and sets data attributes; theme.css does the rest.
   The command palette lists them under View.
--------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react'

export interface Presence { fade: boolean; dim: boolean; minimised: boolean }
const KEY = 'studio:presence'
const DEFAULT: Presence = { fade: false, dim: false, minimised: false }

const load = (): Presence => {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULT }
}
let state: Presence | null = null
const subs = new Set<() => void>()

export const getPresence = (): Presence => (state ??= typeof localStorage === 'undefined' ? DEFAULT : load())

export function setPresence(patch: Partial<Presence>) {
  state = { ...getPresence(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* noop */ }
  subs.forEach((f) => f())
}

const subscribe = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb) } }

export function usePresence(): Presence & { set: typeof setPresence } {
  const p = useSyncExternalStore(subscribe, getPresence, () => DEFAULT)
  return { ...p, set: setPresence }
}
