/* ---------------------------------------------------------------------------
   Document store + linked history.

   The kit's params store covers tunable values. Real instruments also hold
   DOCUMENT state that is not a schema — rows of data, a list of output sizes,
   per-size overrides, a grid of generated variants. That state needs the same
   things params get: undo/redo, commit-on-release, persistence.

     export const doc = createDocStore(initial, { id: 'batch' })
     doc.set((d) => ({ ...d, rows }), { commit: false })   // mid-drag
     doc.commit()                                           // pointer-up

   And when a tool has BOTH a params store and a doc store, ⌘Z must undo
   whichever changed last. `linkHistory` keeps one ordered stack across any
   number of sources (anything with undo/redo/onCommit — params stores fit):

     export const history = linkHistory([params, doc])
     <HistoryCluster history={history} />   // buttons + ⌘Z / ⇧⌘Z
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { Redo2, Undo2 } from 'lucide-react'
import { IconButton, useHotkeys } from '@kit'

export interface DocState<T> { doc: T; committed: T; past: T[]; future: T[] }

export interface DocStore<T> extends StoreApi<DocState<T>> {
  id: string
  /** current document (non-reactive) */
  get(): T
  /** replace the document; `commit: false` while dragging, then call commit() */
  set(next: T | ((d: T) => T), opts?: { commit?: boolean }): void
  commit(): void
  undo(): void
  redo(): void
  /** swap the whole document without an undo step (load, reset) */
  replace(doc: T): void
  onCommit(fn: (d: T) => void): () => void
}

export function createDocStore<T>(initial: T, opts: { id: string; persist?: boolean; limit?: number; migrate?: (raw: unknown) => T | null }): DocStore<T> {
  const key = `studio:${opts.id}:doc`
  const limit = opts.limit ?? 100
  let start = initial
  if (opts.persist !== false) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) { const parsed = JSON.parse(raw); start = opts.migrate ? (opts.migrate(parsed) ?? initial) : parsed }
    } catch { /* corrupt or private mode */ }
  }
  const store = createStore<DocState<T>>(() => ({ doc: start, committed: start, past: [], future: [] }))
  const listeners = new Set<(d: T) => void>()
  const save = (d: T) => { if (opts.persist !== false) try { localStorage.setItem(key, JSON.stringify(d)) } catch { /* quota */ } }
  const fire = (d: T) => listeners.forEach((fn) => fn(d))

  const commit = () => {
    const s = store.getState()
    if (s.doc === s.committed) return
    store.setState({ committed: s.doc, past: [...s.past, s.committed].slice(-limit), future: [] })
    save(s.doc)
    fire(s.doc)
  }
  const jump = (d: T) => { store.setState({ doc: d, committed: d }); save(d) }

  return Object.assign(store, {
    id: opts.id,
    get: () => store.getState().doc,
    set: (next: T | ((d: T) => T), o: { commit?: boolean } = {}) => {
      const cur = store.getState().doc
      const d = typeof next === 'function' ? (next as (d: T) => T)(cur) : next
      if (d === cur) return
      store.setState({ doc: d })
      if (o.commit !== false) commit()
    },
    commit,
    undo: () => {
      const s = store.getState()
      const prev = s.past.at(-1)
      if (prev === undefined) return
      store.setState({ past: s.past.slice(0, -1), future: [s.committed, ...s.future] })
      jump(prev)
    },
    redo: () => {
      const s = store.getState()
      const [next, ...rest] = s.future
      if (next === undefined) return
      store.setState({ future: rest, past: [...s.past, s.committed] })
      jump(next)
    },
    replace: (d: T) => { store.setState({ doc: d, committed: d }); save(d) },
    onCommit: (fn: (d: T) => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
  })
}

/* --- one undo stack across several stores --- */

export interface HistorySource { undo(): void; redo(): void; onCommit(fn: (v: any) => void): () => void }
export interface LinkedHistory extends StoreApi<{ canUndo: boolean; canRedo: boolean; last?: string }> {
  undo(): void
  redo(): void
}

export function linkHistory(sources: HistorySource[], names: string[] = []): LinkedHistory {
  const order: number[] = []
  const redoStack: number[] = []
  let replaying = false
  const state = createStore<{ canUndo: boolean; canRedo: boolean; last?: string }>(() => ({ canUndo: false, canRedo: false }))
  const sync = (last?: number) => state.setState({ canUndo: order.length > 0, canRedo: redoStack.length > 0, last: last === undefined ? undefined : names[last] })
  sources.forEach((s, i) =>
    s.onCommit(() => {
      if (replaying) return
      order.push(i)
      if (order.length > 200) order.shift()
      redoStack.length = 0
      sync()
    }),
  )
  const run = (i: number, fn: () => void) => { replaying = true; try { fn() } finally { replaying = false } ; sync(i) }
  return Object.assign(state, {
    undo: () => { const i = order.pop(); if (i === undefined) return; redoStack.push(i); run(i, () => sources[i].undo()) },
    redo: () => { const i = redoStack.pop(); if (i === undefined) return; order.push(i); run(i, () => sources[i].redo()) },
  })
}

/** Undo / redo buttons + ⌘Z / ⇧⌘Z / ⌘Y bound to a linked history. */
export function HistoryCluster({ history }: { history: LinkedHistory }) {
  const canUndo = useStore(history, (s) => s.canUndo)
  const canRedo = useStore(history, (s) => s.canRedo)
  useHotkeys({ 'mod+z': () => history.undo(), 'shift+mod+z,mod+y': () => history.redo() }, [history])
  return (
    <>
      <IconButton icon={Undo2} label="Undo" shortcut="mod+z" disabled={!canUndo} onClick={() => history.undo()} />
      <IconButton icon={Redo2} label="Redo" shortcut="shift+mod+z" disabled={!canRedo} onClick={() => history.redo()} />
    </>
  )
}

export const useDoc = <T, R>(store: DocStore<T>, pick: (d: T) => R) => useStore(store, (s) => pick(s.doc))
