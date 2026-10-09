/* Left panel: Pages (collapsible list) over the kit LayerTree. The tree shows
   the top layer first, so display order is the reverse of paint order. */
import { useEffect, useMemo, useRef, useState } from 'react'
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
      children: n.type === 'boolean' || !n.children?.length ? (n.children?.length ? toItems(n.children) : undefined) : toItems(n.children),
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
  const scroller = useRef<HTMLDivElement>(null)
  // keep the selected row in view when the selection comes from the canvas
  useEffect(() => {
    const row = scroller.current?.querySelector('[role=treeitem][aria-selected=true]') as HTMLElement | null
    row?.scrollIntoView({ block: 'nearest' })
  }, [selection])

  const onMove = (id: string, target: string, where: 'before' | 'after' | 'inside') => {
    const ns = S.nodesOf()
    if (id === target || S.ancestors(ns, target).some((a) => a.id === id)) return
    const tgt = find(ns, target)
    if (!tgt) return
    if (where === 'inside') {
      if (tgt.type !== 'frame') return
      S.setNodes((all) => S.reparent(all, id, target))
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
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-line">
        <div className="flex h-10 items-center gap-1 pr-2 pl-3">
          <button type="button" aria-expanded={pagesOpen} onClick={() => setPagesOpen(!pagesOpen)} className="flex flex-1 items-center gap-1 text-left text-[11.5px] font-medium outline-none focus-visible:text-signal">
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
                className={cn('group/page mx-1.5 flex h-7 items-center gap-2 rounded-[6px] pr-1 pl-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal', p.id === pageId ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
                {p.id === pageId ? <Check size={12} strokeWidth={2} className="shrink-0 text-fg" /> : <FileText size={12} strokeWidth={1.5} className="shrink-0 text-fg-faint" />}
                {renaming === p.id ? (
                  <input autoFocus defaultValue={p.name} onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { S.renamePage(p.id, e.target.value || p.name); setRenaming(null) }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
                    className="h-5 min-w-0 flex-1 rounded-[4px] bg-control px-1 text-[12px] text-fg outline-none shadow-[inset_0_0_0_1px_var(--signal)]" />
                ) : <span className="min-w-0 flex-1 truncate">{p.name}</span>}
                <span className="text-[10.5px] text-fg-faint tabular group-hover/page:hidden">{p.nodes.length || ''}</span>
                {doc.pages.length > 1 && (
                  <div className="hidden group-hover/page:flex group-focus-within/page:flex" onClick={(e) => e.stopPropagation()}>
                    <Menu align="end" trigger={<button type="button" aria-label="Page options" className="flex size-5 items-center justify-center rounded-[4px] text-fg-faint hover:text-fg">⋯</button>}
                      items={[{ label: 'Rename', onClick: () => setRenaming(p.id) }, { type: 'separator' }, { label: 'Delete page', icon: Trash2, danger: true, onClick: () => S.deletePage(p.id) }]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex h-9 flex-none items-center pr-2 pl-3 text-[11.5px] font-medium">Layers</div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {items.length ? (
          <LayerTree
            items={items}
            selected={selection}
            onSelect={(ids) => S.select(ids)}
            onToggle={(id, prop) => { const n = find(S.nodesOf(), id); if (n) S.patchNode(id, prop === 'visible' ? { visible: !n.visible } : { locked: !n.locked }) }}
            onMove={onMove}
            onRename={(id, name) => S.renameNode(id, name)}
          />
        ) : <div className="px-3 py-2 text-[11.5px] text-fg-faint">No layers on this page.</div>}
      </div>
    </div>
  )
}
