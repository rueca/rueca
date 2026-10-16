/* Left panel: Pages (collapsible list) over the kit LayerTree. The tree shows
   the top layer first, so display order is the reverse of paint order.
   Expansion is controlled here so a canvas selection reveals its row (Figma):
   top-level frames start open, nested groups closed; the tree scrolls the
   selected row into view itself. Hovering a row highlights it on the canvas. */
import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Plus, FileText, Trash2, Check } from 'lucide-react'
import { LayerTree, IconButton, Menu, cn, type LayerItem } from '@kit'
import * as S from '../model/store'
import { find, locate, childrenOf, update } from '../model/tree'
import { typeIcon } from './DesignPanel'
import type { Node } from '../model/types'
import { imageURL } from '../model/images'

function toItems(nodes: Node[]): LayerItem[] {
  return [...nodes].reverse().map((n) => {
    const img = n.type === 'rect' && n.fills.find((f) => f.visible && f.kind === 'image')
    return {
      id: n.id,
      name: n.name,
      icon: typeIcon(n),
      thumb: img ? imageURL(img.image) : undefined,
      visible: n.visible,
      locked: n.locked,
      meta: n.interactions?.length ? '⚡' : undefined,
      // frames accept drops even when empty
      container: n.type === 'frame',
      children: n.children?.length ? toItems(n.children) : undefined,
    }
  })
}

export function LayersPanel() {
  const doc = S.useDesign((s) => s.doc)
  const pageId = S.useDesign((s) => s.pageId)
  const selection = S.useDesign((s) => s.selection)
  const [pagesOpen, setPagesOpen] = useState(true)
  const [renaming, setRenaming] = useState<string | null>(null)
  const pg = S.page()
  const items = useMemo(() => toItems(pg.nodes), [pg.nodes])
  const [expanded, setExpanded] = useState<string[]>(() => doc.pages.flatMap((p) => p.nodes.filter((n) => n.children?.length).map((n) => n.id)))
  // reveal the selection: open every ancestor of a selected layer
  useEffect(() => {
    const need = selection.flatMap((id) => S.ancestors(S.nodesOf(), id).map((a) => a.id))
    if (need.some((id) => !expanded.includes(id))) setExpanded((e) => [...new Set([...e, ...need])])
  }, [selection, pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (id: string, target: string, where: 'before' | 'after' | 'inside') => {
    const ns = S.nodesOf()
    if (id === target || S.ancestors(ns, target).some((a) => a.id === id)) return
    const tgt = find(ns, target)
    if (!tgt) return
    if (where === 'inside') {
      if (tgt.type !== 'frame') return
      S.setNodes((all) => S.reparent(all, id, target), { label: 'Move layer' })
      return
    }
    const loc = locate(ns, target)!
    const parentId = loc.parent?.id ?? null
    // display "before" (above) = later in paint order
    S.setNodes((all) => {
      const moved = S.reparent(all, id, parentId)
      const sibs = childrenOf(moved, parentId)
      const me = sibs.find((n) => n.id === id)
      if (!me) return all
      const rest = sibs.filter((n) => n.id !== id)
      const ti = rest.findIndex((n) => n.id === target)
      rest.splice(where === 'before' ? ti + 1 : ti, 0, me)
      return parentId ? update(moved, parentId, (p) => ({ ...p, children: rest })) : rest
    }, { label: 'Move layer' })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-line">
        <div className="flex h-header items-center gap-1 pr-2 pl-pad">
          <button type="button" aria-expanded={pagesOpen} onClick={() => setPagesOpen(!pagesOpen)} className="-ml-1 flex flex-1 items-center gap-1 self-center rounded-control px-1 py-0.5 text-left text-ui font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal">
            Pages
            <ChevronRight size={12} strokeWidth={1.75} className={cn('text-fg-faint transition-transform', pagesOpen && 'rotate-90')} />
          </button>
          <IconButton icon={Plus} size="icon-sm" label="Add page" onClick={S.addPage} />
        </div>
        {pagesOpen && (
          <div className="flex flex-col pb-1.5">
            {doc.pages.map((p) => (
              <div key={p.id} role="button" tabIndex={0} aria-current={p.id === pageId}
                onClick={() => S.gotoPage(p.id)} onDoubleClick={() => setRenaming(p.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setRenaming(p.id) }}
                className={cn('group/page mx-1.5 flex h-row items-center gap-2 rounded-control pr-1 pl-2 text-ui outline-none focus-visible:ring-2 focus-visible:ring-signal', p.id === pageId ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
                {p.id === pageId ? <Check size={12} strokeWidth={2} className="shrink-0 text-fg" /> : <FileText size={12} strokeWidth={1.5} className="shrink-0 text-fg-faint" />}
                {renaming === p.id ? (
                  <input autoFocus defaultValue={p.name} onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { S.renamePage(p.id, e.target.value || p.name); setRenaming(null) }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
                    className="h-control-sm min-w-0 flex-1 rounded-control bg-control px-1 text-ui text-fg outline-none shadow-[inset_0_0_0_1px_var(--signal)]" />
                ) : <span className="min-w-0 flex-1 truncate">{p.name}</span>}
                <span className="text-ui-sm text-fg-faint tabular group-hover/page:hidden">{p.nodes.length || ''}</span>
                {doc.pages.length > 1 && (
                  <div className="hidden group-hover/page:flex group-focus-within/page:flex" onClick={(e) => e.stopPropagation()}>
                    <Menu align="end" trigger={<button type="button" aria-label="Page options" className="flex size-icon-sm items-center justify-center rounded-control text-fg-faint outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">⋯</button>}
                      items={[{ label: 'Rename', onClick: () => setRenaming(p.id) }, { type: 'separator' }, { label: 'Delete page', icon: Trash2, danger: true, onClick: () => S.deletePage(p.id) }]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex h-section flex-none items-center pr-2 pl-pad text-ui font-medium">Layers</div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length ? (
          <LayerTree
            items={items}
            selected={selection}
            onSelect={(ids) => S.select(ids)}
            onToggle={(id, prop) => {
              const n = find(S.nodesOf(), id)
              if (!n) return
              if (prop === 'visible') S.patchNode(id, { visible: !n.visible }, { label: n.visible ? 'Hide' : 'Show' })
              else S.patchNode(id, { locked: !n.locked }, { label: n.locked ? 'Unlock' : 'Lock' })
            }}
            onMove={onMove}
            onRename={(id, name) => S.renameNode(id, name)}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onHover={S.setHover}
          />
        ) : <div className="px-pad py-2 text-ui text-fg-faint">No layers on this page.</div>}
      </div>
    </div>
  )
}
