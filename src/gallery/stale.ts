/* After a deploy, the previous build's chunks are gone (they 404). A tab opened before the deploy then
   fails the first time it lazy-loads a page or a shell, and sat on "Loading…" or in the error boundary.
   Reload once to pick up the new build. The timestamp guard stops a loop when a chunk is missing for
   some other reason (offline, a bad build): within 30 s of a reload, the error goes through as before. */

const KEY = 'rueca:stale-reload'

/** The messages browsers give a dynamic import whose file is missing (Chrome, Firefox, Safari). */
export const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i
    .test(String((e as Error)?.message ?? e))

/** Reload the page unless we already did in the last 30 s. True if a reload is on its way. */
export function reloadOnce(now = Date.now()) {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (now - last < 30_000) return false
    sessionStorage.setItem(KEY, String(now))
  } catch { return false } // no storage, no guard: never risk a reload loop
  location.reload()
  return true
}

/** Wrap a lazy import: a missing chunk reloads the page instead of failing. */
export const fresh = <T,>(load: () => Promise<T>) => () =>
  load().catch((e) => {
    if (isChunkError(e) && reloadOnce()) return new Promise<T>(() => {}) // the reload replaces the page; keep Suspense waiting
    throw e
  })

/** Vite's own preload helper reports failures as `vite:preloadError`; handle those the same way. */
export function listenForStaleChunks() {
  addEventListener('vite:preloadError', (e) => { if (reloadOnce()) e.preventDefault() })
}
