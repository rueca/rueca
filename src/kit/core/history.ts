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
import { useStore } from 'zustand'
import type { CommitMeta } from './params'

export interface Undoable {
  undo(): unknown
  redo(): unknown
  onCommit(fn: (v: any, meta: CommitMeta) => void): () => void
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
  const offs = sources.map((src, i) =>
    src.onCommit((_v, meta) => {
      // Replays (undo/redo) and silent replaces are not new steps.
      if (meta && meta.kind !== 'edit') return
      const s = store.getState()
      store.setState({ past: [...s.past, { source: i, label: meta?.label ?? 'Edit' }].slice(-limit), future: [] })
    }),
  )
  const api: History = Object.assign(store, {
    undo: () => {
      const s = store.getState()
      const step = s.past.at(-1)
      if (!step) return undefined
      sources[step.source].undo()
      store.setState({ past: s.past.slice(0, -1), future: [step, ...s.future] })
      return step.label
    },
    redo: () => {
      const s = store.getState()
      const [step, ...rest] = s.future
      if (!step) return undefined
      sources[step.source].redo()
      store.setState({ future: rest, past: [...s.past, step] })
      return step.label
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
  const v = useStore(h as unknown as StoreApi<unknown>, read)
  return { canUndo: v[0] === '1', canRedo: v[1] === '1' }
}
