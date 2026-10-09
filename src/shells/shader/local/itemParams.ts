/* ---------------------------------------------------------------------------
   Item params — drive the kit <Inspector> for ONE item inside a collection
   (a layer in a stack, a node in a graph, a fill in a fills list).

   The kit's Inspector renders a ParamStore. Collections hold many items of a
   few types, each with its own schema, inside the parent store. This makes a
   lightweight proxy store per item *type* and binds it two-way to whichever
   item is selected:

     const warpParams = createItemParams(warpSchema, 'shader-warp')
     useEffect(() => bindItemParams(warpParams, params,
       () => layer(selectedId)?.params ?? null,          // read the item
       (v) => patchLayer(selectedId, v, { commit: false }), // write mid-drag
     ), [selectedId])
     <Inspector params={warpParams} />

   Drags write through with commit:false; the proxy's commit becomes ONE undo
   step on the parent. Undo/redo on the parent flows back into the proxy.
   The proxy keeps its own defaults, so changed-dots and per-row reset work.

   Candidate for the kit: `params.item(schema, read, write)`.
--------------------------------------------------------------------------- */
import { createParams, equal, type AnyParams, type Schema } from '@kit'

export function createItemParams<S extends Schema>(schema: S, id: string) {
  return createParams(schema, { id, persist: false, url: false })
}

export function bindItemParams(
  item: AnyParams,
  parent: AnyParams,
  read: () => Record<string, unknown> | null,
  write: (values: Record<string, unknown>) => void,
): () => void {
  let syncing = false
  const pull = () => {
    const src = read()
    if (!src) return
    const next = { ...item.getState().defaults, ...src }
    if (equal(next, item.getState().values)) return
    syncing = true
    item.setState({ values: next, committed: next, past: [], future: [] })
    syncing = false
  }
  pull()
  const offParent = parent.subscribe(pull)
  const offItem = item.subscribe((s, prev) => {
    if (syncing || s.values === prev.values) return
    write(s.values as Record<string, unknown>)
  })
  const offCommit = item.onCommit(() => parent.commit())
  return () => { offParent(); offItem(); offCommit() }
}
