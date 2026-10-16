/* Left island: the file's flows + the screen library (drag or click to add). */
import { useState } from 'react'
import { Workflow, Plus, MoreHorizontal, Trash2, Pencil, Search, Braces, CopyPlus } from 'lucide-react'
import { Panel, PanelHeader, Section, IconButton, Menu, Tip, useDoc, cn } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { Wireframe } from '../wireframes'
import { ShapeGlyph } from '../canvas/nodes'
import { TEMPLATES, type Kind, type Template } from '../model'
import { doc, useUI, switchFlow, newFlow, renameFlow, duplicateFlow, deleteFlow, addScreen, addNode } from '../store'
import { exportFlowJSON } from '../export'

const SHAPES: { kind: Kind; glyph: 'decision' | 'start' | 'end' | 'note' | 'section'; label: string; role?: 'start' | 'end' }[] = [
  { kind: 'decision', glyph: 'decision', label: 'Decision' },
  { kind: 'terminal', glyph: 'start', label: 'Start', role: 'start' },
  { kind: 'terminal', glyph: 'end', label: 'End', role: 'end' },
  { kind: 'note', glyph: 'note', label: 'Sticky' },
  { kind: 'section', glyph: 'section', label: 'Section' },
]

const drag = (e: React.DragEvent, payload: object) => {
  e.dataTransfer.setData('application/x-flows', JSON.stringify(payload))
  e.dataTransfer.effectAllowed = 'copy'
}

export function LeftPanel() {
  const flows = useDoc(doc, (d) => d.flows)
  const active = useUI((s) => s.flowId)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({ flows: true, shapes: true, screens: true })
  const list = TEMPLATES.filter((t) => t.label.toLowerCase().includes(q.toLowerCase()))
  const groups = [...new Set(list.map((t) => t.group))]

  return (
    <Panel header={<PanelHeader title="Flows"><IconButton icon={Plus} label="New flow" size="icon-sm" onClick={newFlow} /></PanelHeader>}>
      <div className="flex flex-col py-1" role="listbox" aria-label="Flows">
        {flows.map((f) => {
          const on = f.id === active
          const screens = f.nodes.filter((n) => n.type === 'screen').length
          return (
            <div key={f.id} role="option" aria-selected={on} tabIndex={0}
              onClick={() => switchFlow(f.id)} onKeyDown={(e) => { if (e.key === 'Enter') switchFlow(f.id) }}
              className={cn('group/row mx-1.5 flex h-row items-center gap-2 rounded-control pr-1 pl-2 outline-none focus-visible:ring-2 focus-visible:ring-signal', on ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
              <Workflow size={14} strokeWidth={1.5} className={on ? 'text-signal' : 'text-fg-faint'} />
              <InlineText bare focusable={false} value={f.name} onCommit={(s) => renameFlow(f.id, s)} editing={renaming === f.id} onEditingChange={(b) => setRenaming(b ? f.id : null)}
                className="min-w-0 flex-1 truncate text-ui" label="Flow name" />
              <span className="text-ui text-fg-muted tabular group-hover/row:hidden group-focus-within/row:hidden">{screens}</span>
              <div className="hidden group-hover/row:block group-focus-within/row:block" onClick={(e) => e.stopPropagation()}>
                <Menu align="end" trigger={<IconButton icon={MoreHorizontal} size="icon-sm" label="Flow actions" />}
                  items={[
                    { label: 'Rename', icon: Pencil, onClick: () => setRenaming(f.id) },
                    { label: 'Duplicate', icon: CopyPlus, onClick: () => duplicateFlow(f.id) },
                    { label: 'Download JSON', icon: Braces, onClick: () => { switchFlow(f.id); setTimeout(exportFlowJSON, 0) } },
                    { type: 'separator' },
                    { label: 'Delete', icon: Trash2, danger: true, disabled: flows.length < 2, onClick: () => deleteFlow(f.id) },
                  ]} />
              </div>
            </div>
          )
        })}
      </div>

      <Section title="Shapes" open={open.shapes} onToggle={() => setOpen((o) => ({ ...o, shapes: !o.shapes }))}>
        <div className="grid grid-cols-5 gap-1 px-pad">
          {SHAPES.map((s) => (
            <Tip key={s.label} label={`${s.label} — drag or click`}>
              <button type="button" draggable aria-label={`Add ${s.label.toLowerCase()}`}
                onDragStart={(e) => drag(e, { kind: s.kind, role: s.role })}
                onClick={() => addNode(s.kind, undefined, s.role ? { role: s.role, name: s.role === 'end' ? 'End' : 'Start' } : {})}
                className="flex aspect-square items-center justify-center rounded-control bg-control text-fg-muted outline-none transition-colors hover:text-fg hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal active:cursor-grabbing">
                <ShapeGlyph kind={s.glyph} />
              </button>
            </Tip>
          ))}
        </div>
      </Section>

      <Section title="Screens" open={open.screens} onToggle={() => setOpen((o) => ({ ...o, screens: !o.screens }))}>
        <div className="px-pad pb-1">
          <label className="flex h-control items-center gap-1.5 rounded-control bg-control px-2 text-fg-faint focus-within:shadow-[inset_0_0_0_1px_var(--signal)]">
            <Search size={12} strokeWidth={1.5} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder="Search screens" aria-label="Search screens"
              className="min-w-0 flex-1 bg-transparent text-ui text-fg outline-none placeholder:text-fg-faint" />
          </label>
        </div>
        {groups.map((g) => (
          <div key={g} className="px-pad pt-1.5">
            <div className="pb-1 text-ui text-fg-faint">{g}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {list.filter((t) => t.group === g).map((t) => <LibraryTile key={t.value} template={t.value} label={t.label} />)}
            </div>
          </div>
        ))}
        {!list.length && <div className="px-pad py-4 text-center text-ui text-fg-muted">No screens match “{q}”</div>}
        <div className="px-pad pt-3 pb-1 text-ui leading-relaxed text-fg-faint">Drag onto the canvas, or click to add next to the selection.</div>
      </Section>
    </Panel>
  )
}

function LibraryTile({ template, label }: { template: Template; label: string }) {
  return (
    <button type="button" draggable onDragStart={(e) => drag(e, { kind: 'screen', template })} onClick={() => addScreen(template)} aria-label={`Add ${label} screen`}
      className="group/tile flex min-w-0 flex-col items-center gap-1 rounded-control p-1 outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
      <span className="block w-full overflow-hidden rounded-[5px] shadow-[0_0_0_1px_var(--line-strong)] transition-shadow group-hover/tile:shadow-[0_0_0_1px_var(--signal)]">
        <Wireframe template={template} className="block h-auto w-full" />
      </span>
      <span className="line-clamp-2 w-full text-center text-ui-sm leading-tight hyphens-auto text-fg-muted group-hover/tile:text-fg">{label}</span>
    </button>
  )
}
