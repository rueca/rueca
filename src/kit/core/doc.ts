/* ---------------------------------------------------------------------------
   createDocStore — undoable DOCUMENT state, for editors whose content is not a
   param schema: node graphs, journey maps, rows of data, a layer tree.

   Same grammar as createParams so the two read alike:

     export const doc = createDocStore(initial, { id: 'flows', version: 3 })
     doc.set((d) => ({ ...d, title: 'x' }))             // one undo step
     doc.set(fn, { commit: false })                       // mid-drag, no step
     doc.commit('Move 3 nodes')                           // pointer-up = the step
     doc.undo(); doc.redo(); useDoc(doc, (d) => d.title)

   Persistence (localStorage, versioned so a shape change never poisons a
   session) is automatic. Keep selection and view state OUTSIDE the doc so
   undo never fights the user's focus.

   Join it to params with createHistory([params, doc]) for one ⌘Z timeline.
   (Promoted from shells/flows/local/doc-store.ts; batch, photo, ui-design and
   nodes each grew the same thing independently.)
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { storageWarned, type CommitMeta } from './params'

export interface DocState<D> {
  doc: D
  /** last committed snapshot — the undo anchor */
  committed: D
  past: { doc: D; label?: string }[]
  future: { doc: D; label?: string }[]
  /** true while there are uncommitted (mid-drag) changes */
  dirty: boolean
}

export interface DocStore<D> extends StoreApi<DocState<D>> {
  id: string
  initial: D
  get(): D
  set(next: D | ((d: D) => D), opts?: { commit?: boolean; label?: string }): void
  commit(label?: string): void
  undo(): string | undefined
  redo(): string | undefined
  canUndo(): boolean
  canRedo(): boolean
  /** replace the whole doc; `history: false` wipes the undo stack (import, reset, load) */
  replace(d: D, opts?: { history?: boolean; label?: string }): void
  onCommit(fn: (d: D, meta: CommitMeta) => void): () => void
}

export interface DocOptions<D = unknown> {
  id: string
  persist?: boolean
  version?: number
  limit?: number
  /** upgrade a saved doc from an older version / key; return null to discard it */
  migrate?: (raw: unknown, fromVersion: number | null) => D | null
  /** older localStorage keys to try (and remove) when nothing is saved under the current one */
  legacyKeys?: string[]
  /** deep-check a loaded / imported / other-tab doc; false → fall back to `initial` (load) or
      refuse (replace). Strongly recommended: a doc that loads wrong-shaped crashes the shell on
      every reload (break-it S1). */
  validate?: (d: unknown) => boolean
}

export function createDocStore<D>(initial: D, opts: DocOptions<D>): DocStore<D> {
  const key = `studio:${opts.id}:doc:v${opts.version ?? 1}`
  const limit = opts.limit ?? 120
  const ok = (d: unknown): d is D => {
    if (d === null || d === undefined) return false
    try { return opts.validate ? !!opts.validate(d) : matchesShape(d, initial) } catch { return false }
  }
  let start = initial
  if (opts.persist !== false && typeof localStorage !== 'undefined') {
    const parse = (raw: string | null) => { try { return raw === null ? undefined : JSON.parse(raw) } catch { return undefined } }
    const saved = parse(localStorage.getItem(key))
    if (saved !== undefined) {
      const m = opts.migrate ? opts.migrate(saved, opts.version ?? 1) : saved
      if (ok(m)) start = m
      else {
        // Never silently destroy someone's work: park the rejected doc where it can be recovered.
        try { localStorage.setItem(`${key}:rejected`, JSON.stringify(saved)) } catch { /* noop */ }
        console.warn(`[trompo] ${opts.id}: saved document failed validation — starting fresh (kept as ${key}:rejected)`)
      }
    } else {
      // nothing under this version: try older versions, then legacy keys; migrate once, remove what we used
      const older = [...Array(Math.max(0, (opts.version ?? 1) - 1)).keys()].map((i) => `studio:${opts.id}:doc:v${i + 1}`).reverse()
      for (const k of [...older, ...(opts.legacyKeys ?? [])]) {
        const raw = parse(localStorage.getItem(k))
        if (raw === undefined) continue
        const v = Number(k.match(/:v(\d+)$/)?.[1] ?? NaN)
        const m = opts.migrate ? opts.migrate(raw, Number.isNaN(v) ? null : v) : null
        if (m && ok(m)) {
          start = m
          try { localStorage.setItem(key, JSON.stringify(m)); localStorage.removeItem(k) } catch { /* noop */ }
          break
        }
      }
    }
  }
  const store = createStore<DocState<D>>(() => ({ doc: start, committed: start, past: [], future: [], dirty: false }))
  const listeners = new Set<(d: D, meta: CommitMeta) => void>()
  const emit = (d: D, meta: CommitMeta) => listeners.forEach((fn) => fn(d, meta))
  const save = (d: D) => {
    if (opts.persist === false) return
    try { localStorage.setItem(key, JSON.stringify(d)); storageWarned.quota = false } catch (e) {
      if (!storageWarned.quota) { storageWarned.quota = true; window.dispatchEvent(new CustomEvent('studio:storage-error', { detail: { key, error: String(e) } })) }
    }
  }
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let pending: D | null = null
  const flush = () => { if (pending !== null) { save(pending); pending = null } }
  const saveSoon = (d: D) => { pending = d; clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250) }
  if (typeof window !== 'undefined' && opts.persist !== false) {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
  }

  const commit = (label?: string) => {
    const s = store.getState()
    if (!s.dirty || s.doc === s.committed) { if (s.dirty) store.setState({ dirty: false }); return }
    store.setState({ committed: s.doc, past: [...s.past, { doc: s.committed, label }].slice(-limit), future: [], dirty: false })
    saveSoon(s.doc)
    emit(s.doc, { label, kind: 'edit' })
  }

  return Object.assign(store, {
    id: opts.id,
    initial,
    get: () => store.getState().doc,
    set: (next: D | ((d: D) => D), o: { commit?: boolean; label?: string } = {}) => {
      const cur = store.getState().doc
      const d = typeof next === 'function' ? (next as (d: D) => D)(cur) : next
      if (d === cur) return
      store.setState({ doc: d, dirty: true })
      if (o.commit !== false) commit(o.label)
    },
    commit,
    undo: () => {
      if (store.getState().dirty) commit()
      const st = store.getState()
      const prev = st.past.at(-1)
      if (!prev) return undefined
      store.setState({ doc: prev.doc, committed: prev.doc, past: st.past.slice(0, -1), future: [{ doc: st.committed, label: prev.label }, ...st.future], dirty: false })
      saveSoon(prev.doc)
      emit(prev.doc, { kind: 'undo', label: prev.label })
      return prev.label
    },
    redo: () => {
      const s = store.getState()
      const [next, ...rest] = s.future
      if (!next) return undefined
      store.setState({ doc: next.doc, committed: next.doc, future: rest, past: [...s.past, { doc: s.committed, label: next.label }], dirty: false })
      saveSoon(next.doc)
      emit(next.doc, { kind: 'redo', label: next.label })
      return next.label
    },
    canUndo: () => store.getState().past.length > 0,
    canRedo: () => store.getState().future.length > 0,
    replace: (d: D, o: { history?: boolean; label?: string } = {}) => {
      // An imported file that doesn't validate must never become the saved doc (break-it S2).
      if (!ok(d)) throw new Error(`${opts.id}: that document doesn't have the expected shape`)
      if (o.history === false) {
        store.setState({ doc: d, committed: d, past: [], future: [], dirty: false })
        save(d)
        emit(d, { kind: 'replace', label: o.label })
      } else {
        store.setState({ doc: d, dirty: true })
        commit(o.label)
      }
    },
    onCommit: (fn: (d: D, meta: CommitMeta) => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
  }) as DocStore<D>
}

/**
 * Default doc check when no `validate` is given: the value has the same SHAPE FAMILY as the initial
 * doc — objects keep the initial's keys (with matching kinds, three levels deep), arrays stay arrays
 * whose items are the same kind as the initial's first item. Extra keys are fine. Catches `{}`, `null`
 * and `{ pages: [1] }`; pass a real `validate` for anything finer.
 */
export function matchesShape(value: unknown, template: unknown, depth = 3): boolean {
  const kind = (x: unknown) => (x === null ? 'null' : Array.isArray(x) ? 'array' : typeof x)
  if (template === undefined || template === null) return true
  if (kind(value) !== kind(template)) return false
  if (depth <= 0) return true
  if (Array.isArray(template)) {
    if (!template.length) return true
    const t0 = template[0]
    return (value as unknown[]).every((v) => kind(v) === kind(t0) && (kind(t0) !== 'object' || depth <= 1 || true))
  }
  if (kind(template) === 'object') {
    const t = template as Record<string, unknown>, v = value as Record<string, unknown>
    return Object.keys(t).every((k) => t[k] === undefined || t[k] === null || (k in v && matchesShape(v[k], t[k], depth - 1)))
  }
  return true
}

/** React: subscribe to the doc or a slice of it. */
export function useDoc<D>(store: DocStore<D>): D
export function useDoc<D, T>(store: DocStore<D>, pick: (d: D) => T): T
export function useDoc<D, T>(store: DocStore<D>, pick?: (d: D) => T) {
  return useStore(store, (s) => (pick ? pick(s.doc) : s.doc))
}
