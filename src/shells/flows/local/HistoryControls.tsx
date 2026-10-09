/* ---------------------------------------------------------------------------
   Undo / redo buttons + ⌘Z / ⇧⌘Z for a createHistory() timeline.
   The kit's HistoryButtons is hard-wired to ONE params store; editors with a
   document (graph, map) need the same buttons over doc + params.

     const history = createHistory([doc, params])
     <Cluster><HistoryControls history={history} /></Cluster>
--------------------------------------------------------------------------- */
import { Redo2, Undo2 } from 'lucide-react'
import { useStore } from 'zustand'
import { IconButton, useHotkeys } from '@kit'
import type { History } from './doc-store'

export function HistoryControls({ history }: { history: History }) {
  const canUndo = useStore(history, (s) => s.past.length > 0)
  const canRedo = useStore(history, (s) => s.future.length > 0)
  useHotkeys({ 'mod+z': () => history.undo(), 'shift+mod+z,mod+y': () => history.redo() }, [history])
  return (
    <>
      <IconButton icon={Undo2} label="Undo" shortcut="mod+z" disabled={!canUndo} onClick={() => history.undo()} />
      <IconButton icon={Redo2} label="Redo" shortcut="shift+mod+z" disabled={!canRedo} onClick={() => history.redo()} />
    </>
  )
}
