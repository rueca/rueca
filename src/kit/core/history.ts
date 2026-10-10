/* ---------------------------------------------------------------------------
   createHistory — ONE undo timeline across several undoable stores.

     export const history = createHistory([params, doc])
     <HistoryButtons history={history} />      // buttons + ⌘Z / ⇧⌘Z
     <HistoryList history={history} />         // Lightroom-style named steps

   ⌘Z undoes whichever store changed last, so an inspector tweak (params) and
   a node drag (doc) interleave correctly. Any object with undo/redo/onCommit
   fits — params stores, doc stores, a custom engine.

   A single params store is already a History (it has undo/redo/canUndo), so
   kit components accept either.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useSyncExternalStore } from 'react'
import type { CommitMeta } from './params'

export interface Undoable {
  undo(): unknown
  redo(): unknown
  onCommit(fn: (v: any, meta: CommitMeta) => void): () => void
  /** optional: lets history skip steps a store can no longer undo, and flush mid-drag edits */
  canUndo?(): boolean
  canRedo?(): boolean
  commit?(label?: string): void
}

export interface Step { source: number; label: string }
export interface HistoryState { past: Step[]; future: Step[] }

export interface History extends StoreApi<HistoryState> {
  undo(): string | undefined
  redo(): string | undefined
  canUndo(): boolean
  canRedo(): boolean
  /** jump so that `index` steps remain in the past (0 = the opening state) */
  jumpTo(index: number): void
  /** forget the timeline (after import / reset); the stores keep their own stacks */
  clear(): void
  dispose(): void
}

export function createHistory(sources: Undoable[], opts: { limit?: number } = {}): History {
  const limit = opts.limit ?? 200
  const store = createStore<HistoryState>(() => ({ past: [], future: [] }))
  let replaying = false
  const offs = sources.map((src, i) =>
    src.onCommit((_v, meta) => {
      // Replays (undo/redo) and silent replaces are not new steps.
      if (replaying || (meta && meta.kind !== 'edit')) return
      const s = store.getState()
      store.setState({ past: [...s.past, { source: i, label: meta?.label ?? 'Edit' }].slice(-limit), future: [] })
    }),
  )
  // Mid-drag edits in any store become real steps BEFORE we undo (else they'd be committed during the
  // undo and recorded on top of it — break-it DX8).
  const flush = () => sources.forEach((src) => src.commit?.())
  const api: History = Object.assign(store, {
    undo: () => {
      flush()
      // Skip steps whose store has run out of its own history (its limit may be smaller — DX7).
      for (let guard = 0; guard < 1000; guard++) {
        const s = store.getState()
        const step = s.past.at(-1)
        if (!step) return undefined
        const src = sources[step.source]
        if (src.canUndo && !src.canUndo()) { store.setState({ past: s.past.slice(0, -1) }); continue }
        replaying = true
        try { src.undo() } finally { replaying = false }
        store.setState({ past: store.getState().past.slice(0, -1), future: [step, ...store.getState().future] })
        return step.label
      }
      return undefined
    },
    redo: () => {
      for (let guard = 0; guard < 1000; guard++) {
        const s = store.getState()
        const [step, ...rest] = s.future
        if (!step) return undefined
        const src = sources[step.source]
        if (src.canRedo && !src.canRedo()) { store.setState({ future: rest }); continue }
        replaying = true
        try { src.redo() } finally { replaying = false }
        store.setState({ future: rest, past: [...store.getState().past, step] })
        return step.label
      }
      return undefined
    },
    canUndo: () => store.getState().past.length > 0,
    canRedo: () => store.getState().future.length > 0,
    jumpTo: (index: number) => {
      let guard = 500
      while (store.getState().past.length > index && guard--) api.undo()
      while (store.getState().past.length < index && store.getState().future.length && guard--) api.redo()
    },
    clear: () => store.setState({ past: [], future: [] }),
    dispose: () => offs.forEach((off) => off()),
  })
  return api
}

/** Anything kit history UI accepts: a History, or a single params / doc store. */
export interface HistoryLike {
  undo(): unknown
  redo(): unknown
  canUndo(): boolean
  canRedo(): boolean
  subscribe: StoreApi<any>['subscribe']
}

/** React: re-render when undo/redo availability changes. */
export function useCanUndo(h: HistoryLike) {
  const read = () => `${h.canUndo() ? 1 : 0}${h.canRedo() ? 1 : 0}`
  // useSyncExternalStore, not zustand's useStore: a HistoryLike needn't have getState.
  const v = useSyncExternalStore(h.subscribe as (cb: () => void) => () => void, read, read)
  return { canUndo: v[0] === '1', canRedo: v[1] === '1' }
}
