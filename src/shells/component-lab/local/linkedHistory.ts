/* ---------------------------------------------------------------------------
   linkHistory (kit candidate) — one undo stack across several param stores.

     const history = linkHistory([props, tokens])
     history.undo(); history.redo(); useStore(history.state, (s) => s.canUndo)

   Each store keeps its own past/future (so presets, A/B and share stay
   per-store); this only remembers WHICH store committed last, and replays
   undo/redo against that store. The kit's HistoryButtons binds ⌘Z to a
   single store, which is wrong as soon as a tool has two.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import type { AnyParams } from '@kit'

export function linkHistory(stores: AnyParams[]) {
  const past: AnyParams[] = []
  const future: AnyParams[] = []
  let replaying = false
  const state = createStore(() => ({ canUndo: false, canRedo: false }))
  const sync = () => state.setState({ canUndo: past.length > 0, canRedo: future.length > 0 })
  for (const s of stores) s.onCommit(() => { if (replaying) return; past.push(s); future.length = 0; sync() })
  const replay = (s: AnyParams, fn: () => void) => { replaying = true; try { fn() } finally { replaying = false } ; void s }
  return {
    state,
    undo() { const s = past.pop(); if (!s) return; replay(s, () => s.undo()); future.push(s); sync() },
    redo() { const s = future.pop(); if (!s) return; replay(s, () => s.redo()); past.push(s); sync() },
  }
}
