/* ---------------------------------------------------------------------------
   Named history — Lightroom's History panel on top of the kit's params
   undo stack. The kit keeps snapshots (past / committed / future) but no
   names; this watches commits, works out whether each one was a new edit,
   an undo or a redo, and keeps a parallel list of labels.

     const history = createNamedHistory(params, describe)   // describe(prev, next) → 'Exposure +0.45'
     history.label('Preset: Golden hour')                    // name the next commit explicitly
     <HistoryList history={history} />                       // newest first, click a step to jump

   Jumping walks params.undo()/redo(), so the kit stack stays the source of
   truth and ⌘Z keeps working from wherever you land.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { cn, type AnyParams } from '@kit'

export interface NamedHistory {
  store: StoreApi<{ names: string[]; index: number }>
  label: (name: string) => void
  jump: (index: number) => void
  dispose: () => void
}

export function createNamedHistory(params: AnyParams, describe: (prev: Record<string, unknown>, next: Record<string, unknown>) => string, initial = 'Open'): NamedHistory {
  const store = createStore<{ names: string[]; index: number }>(() => ({ names: [initial], index: 0 }))
  let pending: string | null = null
  let prev = params.getState()
  const off = params.onCommit(() => {
    const s = params.getState()
    const { names } = store.getState()
    const wasUndo = s.future.length === prev.future.length + 1 && s.past.length === prev.past.length - 1
    const wasRedo = prev.future.length > 0 && s.committed === prev.future[0]
    if (wasUndo || wasRedo) store.setState({ index: s.past.length })
    else {
      const name = pending ?? describe(prev.committed as Record<string, unknown>, s.committed as Record<string, unknown>)
      // At the history limit the oldest snapshot fell off the front.
      const kept = names.slice(0, prev.past.length + 1)
      const shifted = s.past.length === prev.past.length ? kept.slice(1) : kept
      store.setState({ names: [...shifted, name], index: s.past.length })
    }
    pending = null
    prev = s
  })
  return {
    store,
    // Commits are synchronous, so a label only applies to the call right after it.
    // Cleared on the next microtask so a no-op patch can't leak its name onto a later edit.
    label: (name) => { pending = name; queueMicrotask(() => { pending = null }) },
    jump: (i) => {
      let guard = 500
      while (params.getState().past.length > i && guard--) params.undo()
      while (params.getState().past.length < i && params.getState().future.length && guard--) params.redo()
    },
    dispose: off,
  }
}

export function HistoryList({ history, max = 60 }: { history: NamedHistory; max?: number }) {
  const { names, index } = useStore(history.store)
  const rows = names.map((n, i) => ({ n, i })).reverse().slice(0, max)
  return (
    <div role="listbox" aria-label="History" className="flex flex-col py-0.5">
      {rows.map(({ n, i }) => (
        <button
          key={i}
          type="button"
          role="option"
          aria-selected={i === index}
          onClick={() => history.jump(i)}
          className={cn(
            'mx-1.5 flex h-7 shrink-0 items-center gap-2 rounded-[6px] px-2 text-left text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal',
            i === index ? 'bg-signal-soft text-fg' : i > index ? 'text-fg-faint hover:bg-hover' : 'text-fg-muted hover:bg-hover hover:text-fg',
          )}
        >
          <span className={cn('size-1.5 shrink-0 rounded-full', i === index ? 'bg-signal' : i > index ? 'shadow-[inset_0_0_0_1px_var(--fg-faint)]' : 'bg-[var(--fg-faint)]')} />
          <span className={cn('min-w-0 flex-1 truncate', i > index && 'line-through decoration-[var(--line-strong)]')}>{n}</span>
        </button>
      ))}
    </div>
  )
}
