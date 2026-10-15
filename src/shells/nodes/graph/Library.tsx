/* Left panel: node library (click to add, drag to place) and sample graphs. */
import { useState } from 'react'
import { Search, FilePlus2 } from 'lucide-react'
import { Panel, PanelHeader, PanelTabs, Button, toast, cn } from '@kit'
import { CATEGORIES, DEF_LIST, catVar } from './defs'
import { addNode, load, useGraph } from './store'
import { SAMPLES, BLANK } from './samples'
import { LIB_MIME, PortDots, canvasApi } from './Canvas'

export function Library() {
  const [tab, setTab] = useState<'library' | 'samples'>('library')
  return (
    <Panel header={<PanelHeader><PanelTabs value={tab} onChange={setTab} tabs={[{ value: 'library', label: 'Library' }, { value: 'samples', label: 'Samples' }]} /></PanelHeader>}>
      {tab === 'library' ? <NodeList /> : <Samples />}
    </Panel>
  )
}

function NodeList() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const match = (d: (typeof DEF_LIST)[number]) => !needle || [d.label, d.category, ...(d.keywords ?? [])].some((s) => s.toLowerCase().includes(needle))
  const add = (kind: string) => {
    const c = canvasApi.center()
    addNode(kind, { x: c.x - 88 + (Math.random() - 0.5) * 40, y: c.y - 60 + (Math.random() - 0.5) * 40 })
  }
  return (
    <div className="flex flex-col pb-2">
      <div className="px-2 pt-2 pb-1">
        <label className="flex h-control items-center gap-2 rounded-control bg-control px-2 focus-within:shadow-[inset_0_0_0_1px_var(--signal)]">
          <Search size={13} strokeWidth={1.5} className="text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setQ('') }} placeholder="Filter nodes" aria-label="Filter nodes"
            className="h-full min-w-0 flex-1 bg-transparent text-ui text-fg outline-none placeholder:text-fg-faint" />
        </label>
      </div>
      {CATEGORIES.map((c) => {
        const list = DEF_LIST.filter((d) => d.category === c && match(d))
        if (!list.length) return null
        return (
          <section key={c} className="pt-2">
            <div className="flex items-center gap-1.5 px-pad pb-1 text-ui font-medium text-fg">
              <span className="size-1.5 rounded-full" style={{ background: catVar(c) }} />{c}
            </div>
            {list.map((d) => {
              const Icon = d.icon
              return (
                <button
                  key={d.kind}
                  type="button"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData(LIB_MIME, d.kind); e.dataTransfer.effectAllowed = 'copy' }}
                  onClick={() => add(d.kind)}
                  title={d.description}
                  className="group/lib mx-1 flex h-row w-[calc(100%-8px)] items-center gap-2 rounded-[6px] px-2 text-left outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal"
                >
                  <span className="flex size-icon-sm shrink-0 items-center justify-center rounded-[5px]" style={{ background: `color-mix(in srgb, ${catVar(c)} 16%, transparent)`, color: catVar(c) }}>
                    <Icon size={13} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ui text-fg">{d.label}</span>
                  <span className="opacity-70 group-hover/lib:opacity-100"><PortDots kind={d.kind} /></span>
                </button>
              )
            })}
          </section>
        )
      })}
      <p className="px-pad pt-3 text-ui leading-relaxed text-fg-faint">Click to add at the centre, drag to place, or press Tab over the canvas to search.</p>
    </div>
  )
}

function Samples() {
  const current = useGraph((s) => s.name)
  const open = (g: typeof BLANK, name: string) => {
    load(g)
    setTimeout(() => canvasApi.fit(), 60)
    toast(`Opened “${name}”`, { description: 'Undo (⌘Z) brings back your previous graph.' })
  }
  return (
    <div className="flex flex-col gap-1 p-2">
      {SAMPLES.map((s) => (
        <button key={s.id} type="button" onClick={() => open(s.graph, s.name)}
          className={cn('flex flex-col gap-0.5 rounded-[8px] px-pad py-2 text-left outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', current === s.name && 'bg-active')}>
          <span className="flex items-center justify-between text-ui font-medium text-fg">{s.name}<span className="tabular text-ui font-normal text-fg-faint">{s.graph.nodes.length} nodes</span></span>
          <span className="text-ui leading-snug text-fg-muted">{s.description}</span>
        </button>
      ))}
      <Button variant="outline" size="md" className="mt-2" onClick={() => open(BLANK, 'Untitled')}><FilePlus2 size={14} strokeWidth={1.5} />New empty graph</Button>
    </div>
  )
}
