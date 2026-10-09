/* ---------------------------------------------------------------------------
   createDocStore — undoable *document* state, for editors whose content is
   not a param schema: node graphs, journey maps, lists of cards.

   Same grammar as createParams so the two read alike:

     export const doc = createDocStore(initial, { id: 'flows', version: 3 })
     doc.set((d) => ({ ...d, title: 'x' }))            // one undo step
     doc.set(fn, { commit: false })                      // mid-drag, no step
     doc.commit('Move 3 nodes')                          // pointer-up = the step
     doc.undo(); doc.redo(); useDoc(doc, (d) => d.title)

   Persistence (localStorage, versioned so a shape change never poisons a
   session) is automatic. Selection and view state should live OUTSIDE the
   doc so undo never fights the user's focus.

   createHistory([params, doc]) — ONE timeline across several undoable
   stores. ⌘Z undoes whichever store changed last, so a tweak in the
   inspector (params) and a node drag (doc) interleave correctly. The kit's
   HistoryButtons only know one params store; this is the generalisation.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

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
  get(): D
  set(next: D | ((d: D) => D), opts?: { commit?: boolean; label?: string }): void
  commit(label?: string): void
  undo(): string | undefined
  redo(): string | undefined
  /** replace the whole doc; history: false wipes the undo stack (import, reset) */
  replace(d: D, opts?: { history?: boolean; label?: string }): void
  onCommit(fn: (d: D) => void): () => void
  initial: D
}

interface Options { id: string; persist?: boolean; version?: number; limit?: number }

export function createDocStore<D>(initial: D, opts: Options): DocStore<D> {
  const key = `studio:${opts.id}:doc:v${opts.version ?? 1}`
  const limit = opts.limit ?? 120
  let start = initial
  if (opts.persist !== false) {
    try { const s = localStorage.getItem(key); if (s) start = JSON.parse(s) } catch { /* private mode / bad json */ }
  }
  const store = createStore<DocState<D>>(() => ({ doc: start, committed: start, past: [], future: [], dirty: false }))
  const listeners = new Set<(d: D) => void>()
  const save = (d: D) => { if (opts.persist !== false) try { localStorage.setItem(key, JSON.stringify(d)) } catch { /* quota */ } }
  let saveTimer = 0
  const saveSoon = (d: D) => { clearTimeout(saveTimer); saveTimer = window.setTimeout(() => save(d), 250) }

  const commit = (label?: string) => {
    const s = store.getState()
    if (!s.dirty || s.doc === s.committed) { if (s.dirty) store.setState({ dirty: false }); return }
    store.setState({ committed: s.doc, past: [...s.past, { doc: s.committed, label }].slice(-limit), future: [], dirty: false })
    saveSoon(s.doc)
    listeners.forEach((fn) => fn(s.doc))
  }

  const api = Object.assign(store, {
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
      const s = store.getState()
      if (s.dirty) commit()
      const st = store.getState()
      const prev = st.past.at(-1)
      if (!prev) return undefined
      store.setState({ doc: prev.doc, committed: prev.doc, past: st.past.slice(0, -1), future: [{ doc: st.committed, label: prev.label }, ...st.future], dirty: false })
      saveSoon(prev.doc)
      listeners.forEach((fn) => fn(prev.doc))
      return prev.label
    },
    redo: () => {
      const s = store.getState()
      const [next, ...rest] = s.future
      if (!next) return undefined
      store.setState({ doc: next.doc, committed: next.doc, future: rest, past: [...s.past, { doc: s.committed, label: next.label }], dirty: false })
      saveSoon(next.doc)
      listeners.forEach((fn) => fn(next.doc))
      return next.label
    },
    replace: (d: D, o: { history?: boolean; label?: string } = {}) => {
      if (o.history === false) {
        store.setState({ doc: d, committed: d, past: [], future: [], dirty: false })
        save(d)
        listeners.forEach((fn) => fn(d))
      } else {
        store.setState({ doc: d, dirty: true })
        commit(o.label)
      }
    },
    onCommit: (fn: (d: D) => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
  }) as DocStore<D>
  return api
}

/** React: subscribe to the doc or a slice of it. */
export function useDoc<D>(store: DocStore<D>): D
export function useDoc<D, T>(store: DocStore<D>, pick: (d: D) => T): T
export function useDoc<D, T>(store: DocStore<D>, pick?: (d: D) => T) {
  return useStore(store, (s) => (pick ? pick(s.doc) : s.doc))
}

/* ---------------------------------------------------------------------------
   One undo timeline over several stores (params + doc).
--------------------------------------------------------------------------- */
export interface Undoable { undo(): unknown; redo(): unknown; onCommit(fn: (v: any) => void): () => void }
export interface History extends StoreApi<{ past: number[]; future: number[] }> {
  undo(): void
  redo(): void
  /** forget everything (after import / reset) */
  clear(): void
}

export function createHistory(sources: Undoable[]): History {
  const store = createStore<{ past: number[]; future: number[] }>(() => ({ past: [], future: [] }))
  let replaying = false
  sources.forEach((src, i) =>
    src.onCommit(() => {
      if (replaying) return
      const s = store.getState()
      store.setState({ past: [...s.past, i].slice(-200), future: [] })
    }),
  )
  const run = (fn: () => void) => { replaying = true; try { fn() } finally { replaying = false } }
  return Object.assign(store, {
    undo: () => {
      const s = store.getState()
      const i = s.past.at(-1)
      if (i === undefined) return
      run(() => sources[i].undo())
      store.setState({ past: s.past.slice(0, -1), future: [i, ...s.future] })
    },
    redo: () => {
      const s = store.getState()
      const [i, ...rest] = s.future
      if (i === undefined) return
      run(() => sources[i].redo())
      store.setState({ future: rest, past: [...s.past, i] })
    },
    clear: () => store.setState({ past: [], future: [] }),
  })
}
