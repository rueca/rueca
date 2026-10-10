/* Right island: inspector for the selection, the flow document when nothing is
   selected (Spline convention), and the comments list. */
import type { ReactNode } from 'react'
import {
  ArrowRight, Copy, Trash2, Play, MessageCircle, Plus, ArrowLeftRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Frame, Square, Diamond, StickyNote, CircleDot,
} from 'lucide-react'
import {
  Panel, PanelHeader, PanelTabs, Section, Row, TextInput, Segmented, Select, Switch, ScrubValue, Button, IconButton, Inspector, Tiles, Empty, Tip, cn,
} from '@kit'
import { Wireframe } from '../wireframes'
import { StatusDot, STATUS } from '../canvas/nodes'
import { TRIGGER_ICON } from '../canvas/edges'
import { Avatar, ago } from '../canvas/comments'
import { startWalkthrough } from '../canvas/FlowCanvas'
import { happyPath } from '../layout'
import { makeEdge, PEOPLE, SECTION_HUES, STICKY, stickyOf, TEMPLATES, TRIGGERS, templateLabel, uid, type FlowEdge, type FlowNode, type Status, type StickyColor, type Template, type Trigger, type EdgeStyle } from '../model'
import {
  params, doc, ui, useUI, useFlow, select, updateNodeData, updateEdgeData, setNodes, setEdges, editFlow, deleteSelection, duplicate, addScreen, sizeOf, commentPos, viewport,
} from '../store'

const KIND_ICON = { screen: Square, decision: Diamond, terminal: CircleDot, note: StickyNote, section: Frame }
const STATUS_OPTS = (['draft', 'ready', 'shipped'] as Status[]).map((s) => ({ value: s, label: STATUS[s].label }))

export function RightPanel() {
  const tab = useUI((s) => s.rightTab)
  const n = useFlow().comments.filter((c) => !c.resolved).length
  return (
    <Panel header={
      <PanelHeader>
        <PanelTabs value={tab} onChange={(t) => ui.setState({ rightTab: t })} tabs={[{ value: 'inspect', label: 'Inspect' }, { value: 'comments', label: n ? `Comments ${n}` : 'Comments' }]} />
      </PanelHeader>
    }>
      {tab === 'inspect' ? <InspectTab /> : <CommentsTab />}
    </Panel>
  )
}

function InspectTab() {
  const flow = useFlow()
  const sel = useUI((s) => s.sel)
  const nodes = flow.nodes.filter((n) => sel.nodes.includes(n.id))
  const edges = flow.edges.filter((e) => sel.edges.includes(e.id))
  if (nodes.length === 1 && !edges.length) return <NodeInspector key={nodes[0].id} node={nodes[0]} />
  if (edges.length === 1 && !nodes.length) return <EdgeInspector key={edges[0].id} edge={edges[0]} />
  if (nodes.length + edges.length > 1) return <MultiInspector nodes={nodes} edges={edges} />
  return <DocInspector />
}

/* text field that edits live without an undo step per keystroke */
function LiveText({ value, onLive, label, multiline, placeholder, rows }: { value: string; onLive: (s: string) => void; label: string; multiline?: boolean; placeholder?: string; rows?: number }) {
  return <TextInput value={value} label={label} multiline={multiline} rows={rows} placeholder={placeholder} onChange={onLive} onCommit={() => doc.commit(`Edit ${label.toLowerCase()}`)} />
}

function NodeInspector({ node }: { node: FlowNode }) {
  const flow = useFlow()
  const d = node.data
  const set = (patch: Partial<FlowNode['data']>, commit = true) => updateNodeData(node.id, patch, { commit })
  const Icon = KIND_ICON[(node.type ?? 'screen') as keyof typeof KIND_ICON]
  const sections = flow.nodes.filter((n) => n.type === 'section')
  const ins = flow.edges.filter((e) => e.target === node.id)
  const outs = flow.edges.filter((e) => e.source === node.id)
  const name = (id: string) => flow.nodes.find((n) => n.id === id)?.data.name || 'Untitled'
  const flowish = node.type !== 'note' && node.type !== 'section'

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="flex size-6 items-center justify-center rounded-[6px] bg-active text-fg-muted"><Icon size={13} strokeWidth={1.5} /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold">{d.name || 'Untitled'}</div>
          <div className="text-[11px] text-fg-faint">{node.type === 'screen' ? templateLabel(d.template) : node.type === 'terminal' ? (d.role === 'end' ? 'End point' : 'Start point') : node.type === 'decision' ? 'Decision' : node.type === 'note' ? 'Sticky note' : 'Section'}</div>
        </div>
        <IconButton icon={Copy} label="Duplicate" shortcut="mod+d" size="icon-sm" onClick={duplicate} />
        <IconButton icon={Trash2} label="Delete" shortcut="backspace" size="icon-sm" onClick={deleteSelection} />
      </div>

      <Section title={node.type === 'note' ? 'Note' : 'Node'} first>
        <Row label={node.type === 'note' ? 'Text' : 'Name'} stacked={node.type === 'note'}>
          <LiveText label="Name" value={d.name} multiline={node.type === 'note'} rows={4} onLive={(s) => set({ name: s }, false)} />
        </Row>
        {flowish && (
          <Row label="Status" hint="Draft → ready for build → shipped. Shown as the dot on the canvas.">
            <Segmented value={d.status ?? 'draft'} onChange={(s) => set({ status: s as Status })} options={STATUS_OPTS} label="Status" />
          </Row>
        )}
        {node.type === 'terminal' && (
          <Row label="Role"><Segmented value={d.role ?? 'start'} onChange={(s) => set({ role: s as 'start' | 'end' })} options={['start', 'end']} label="Role" /></Row>
        )}
        {node.type === 'note' && (
          <Row label="Colour">
            <Tiles value={[stickyOf(d.color)]} onChange={(s) => s[0] && set({ color: s[0] as StickyColor })} columns={3}
              options={(Object.keys(STICKY) as StickyColor[]).map((c) => ({ value: c, swatch: STICKY[c], hint: c === 'pen' ? 'Red pen · annotation' : c[0].toUpperCase() + c.slice(1) }))} />
          </Row>
        )}
        {node.type === 'section' && (
          <Row label="Colour">
            <Tiles value={[d.hue ?? SECTION_HUES[0]]} onChange={(s) => s[0] && set({ hue: s[0] })} columns={3} options={SECTION_HUES.map((h, i) => ({ value: h, swatch: h, hint: ['Paper', 'Card', 'Sheet'][i] ?? h }))} />
          </Row>
        )}
        {node.type !== 'section' && (
          <Row label="Section" hint="Updates automatically when you drop a node inside a section.">
            <Select value={d.section ?? '_'} onChange={(s) => set({ section: s === '_' ? undefined : s })} label="Section"
              options={[{ value: '_', label: 'None' }, ...sections.map((s) => ({ value: s.id, label: s.data.name, swatch: s.data.hue }))]} />
          </Row>
        )}
        <Row label="Position">
          <ScrubValue boxed prefix="X" value={Math.round(node.position.x)} onChange={(x, f) => setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, position: { ...n.position, x } } : n)), { commit: f })} className="flex-1" label="X" />
          <ScrubValue boxed prefix="Y" value={Math.round(node.position.y)} onChange={(y, f) => setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, position: { ...n.position, y } } : n)), { commit: f })} className="flex-1" label="Y" />
        </Row>
      </Section>

      {node.type === 'screen' && (
        <Section title="Screen">
          <Row label="Template">
            <Select value={d.template ?? 'home'} onChange={(t) => set({ template: t as Template })} options={TEMPLATES.map((t) => ({ value: t.value, label: t.label }))} label="Template" />
          </Row>
          <div className="px-3 pt-1">
            <div className="mx-auto w-[124px] overflow-hidden rounded-[10px] shadow-[0_0_0_1px_var(--line-strong)]"><Wireframe template={d.template ?? 'home'} className="block h-auto w-full" /></div>
          </div>
        </Section>
      )}

      {node.type !== 'note' && (
        <Section title="Notes">
          <div className="px-3 py-1"><LiveText label="Notes" multiline rows={4} placeholder="Behaviour, edge cases, copy to review…" value={d.notes ?? ''} onLive={(s) => set({ notes: s }, false)} /></div>
        </Section>
      )}

      {flowish && (
        <Section title="Connections" actions={<IconButton icon={Plus} size="icon-sm" label="Add next screen" shortcut="s" onClick={() => addScreen('home')} />}>
          {!ins.length && !outs.length && <div className="px-3 py-1 text-[11.5px] text-fg-faint">Drag from a handle, pick a screen below, or add the next screen.</div>}
          {/* The keyboard / single-pointer way to connect (WCAG 2.1.1, 2.5.7). */}
          <Row label="Connect to">
            <Select label="Connect to" value="" placeholder="Choose a node…"
              options={flow.nodes.filter((n) => n.id !== node.id && n.type !== 'section' && n.type !== 'note' && !outs.some((e) => e.target === n.id)).map((n) => ({ value: n.id, label: n.data.name || n.type || 'Node' }))}
              onChange={(target) => {
                const e = makeEdge(node.id, target, { trigger: node.type === 'decision' ? 'condition' : 'tap' }, ['r', 'l'])
                setEdges((es) => [...es, e], { label: 'Connect' })
              }} />
          </Row>
          {[...ins.map((e) => ({ e, dir: 'in' as const })), ...outs.map((e) => ({ e, dir: 'out' as const }))].map(({ e, dir }) => {
            const T = TRIGGER_ICON[e.data?.trigger ?? 'tap']
            return (
              <button key={e.id} type="button" onClick={() => select([], [e.id])}
                className="mx-1.5 flex h-7 items-center gap-2 rounded-[6px] px-1.5 text-left text-[11.5px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
                <span className="w-7 shrink-0 text-[10.5px] text-fg-faint">{dir === 'in' ? 'From' : 'To'}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{name(dir === 'in' ? e.source : e.target)}</span>
                <T size={11} strokeWidth={1.5} className="shrink-0 text-fg-faint" />
                <span className="max-w-[72px] truncate text-fg-faint">{e.data?.label || e.data?.trigger}</span>
                {e.data?.happy && <span role="img" className="size-1.5 shrink-0 rounded-full bg-signal" aria-label="Happy path" title="Happy path" />}
              </button>
            )
          })}
        </Section>
      )}
    </div>
  )
}

function EdgeInspector({ edge }: { edge: FlowEdge }) {
  const flow = useFlow()
  const d = edge.data ?? { trigger: 'tap' as Trigger }
  const set = (patch: Partial<NonNullable<FlowEdge['data']>>, commit = true) => updateEdgeData(edge.id, patch, { commit })
  const src = flow.nodes.find((n) => n.id === edge.source)
  const tgt = flow.nodes.find((n) => n.id === edge.target)
  const T = TRIGGER_ICON[d.trigger]
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="flex size-6 items-center justify-center rounded-[6px] bg-active text-fg-muted"><T size={13} strokeWidth={1.5} /></span>
        <div className="min-w-0 flex-1 text-[12.5px] font-semibold">Connection</div>
        <IconButton icon={ArrowLeftRight} label="Reverse direction" size="icon-sm" onClick={() => setEdges((es) => es.map((e) => (e.id === edge.id ? { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle, targetHandle: e.sourceHandle } : e)), { label: 'Reverse' })} />
        <IconButton icon={Trash2} label="Delete" shortcut="backspace" size="icon-sm" onClick={deleteSelection} />
      </div>
      <div className="mx-3 my-1.5 flex items-center gap-1.5 rounded-[8px] bg-well p-1.5 text-[11.5px]">
        <button type="button" className="min-w-0 flex-1 truncate rounded-[5px] bg-raised px-2 py-1 text-left shadow-[var(--shadow-segment)] hover:text-signal" onClick={() => src && select([src.id])}>{src?.data.name ?? '—'}</button>
        <ArrowRight size={12} className="shrink-0 text-fg-faint" />
        <button type="button" className="min-w-0 flex-1 truncate rounded-[5px] bg-raised px-2 py-1 text-left shadow-[var(--shadow-segment)] hover:text-signal" onClick={() => tgt && select([tgt.id])}>{tgt?.data.name ?? '—'}</button>
      </div>
      <Section title="Interaction" first>
        <Row label="Trigger" hint="What the user does (or what happens) to move along this connection.">
          <Select value={d.trigger} onChange={(t) => set({ trigger: t as Trigger })} options={TRIGGERS} label="Trigger" />
        </Row>
        <Row label={d.trigger === 'condition' ? 'Condition' : 'Label'}>
          <LiveText label="Label" value={d.label ?? ''} placeholder={d.trigger === 'condition' ? 'If logged in' : 'Button or gesture'} onLive={(s) => set({ label: s }, false)} />
        </Row>
        <Row label="Happy path" hint="The walkthrough follows happy-path connections first.">
          <div className="flex flex-1 justify-end"><Switch checked={!!d.happy} onChange={(b) => set({ happy: b })} label="Happy path" /></div>
        </Row>
      </Section>
      <Section title="Route">
        <Row label="Style">
          <Segmented value={d.style ?? 'default'} onChange={(s) => set({ style: s === 'default' ? undefined : (s as EdgeStyle) })} label="Route style"
            options={[{ value: 'default', label: 'Auto' }, { value: 'smooth', label: 'Step' }, { value: 'bezier', label: 'Curve' }, { value: 'straight', label: 'Line' }]} />
        </Row>
        <Row label="Keep sides" hint="Off: the connection re-picks which sides it leaves and enters from as nodes move.">
          <div className="flex flex-1 justify-end"><Switch checked={!!d.pinned} onChange={(b) => set({ pinned: b })} label="Keep sides" /></div>
        </Row>
        <Row label="Sides">
          <span className="text-[11.5px] text-fg-muted tabular">{side(edge.sourceHandle)} → {side(edge.targetHandle)}</span>
        </Row>
      </Section>
    </div>
  )
}
const side = (h?: string | null) => ({ t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' } as Record<string, string>)[h ?? ''] ?? 'Auto'

function MultiInspector({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) {
  const movable = nodes.filter((n) => n.type !== 'section')
  const align = (how: 'l' | 'c' | 'r' | 't' | 'm' | 'b') => {
    const r = movable.map((n) => ({ n, s: sizeOf(n) }))
    const minX = Math.min(...r.map((x) => x.n.position.x)), maxX = Math.max(...r.map((x) => x.n.position.x + x.s.w))
    const minY = Math.min(...r.map((x) => x.n.position.y)), maxY = Math.max(...r.map((x) => x.n.position.y + x.s.h))
    const pos = new Map(r.map(({ n, s }) => [n.id, {
      x: how === 'l' ? minX : how === 'r' ? maxX - s.w : how === 'c' ? (minX + maxX) / 2 - s.w / 2 : n.position.x,
      y: how === 't' ? minY : how === 'b' ? maxY - s.h : how === 'm' ? (minY + maxY) / 2 - s.h / 2 : n.position.y,
    }]))
    setNodes((ns) => ns.map((n) => (pos.has(n.id) ? { ...n, position: pos.get(n.id)! } : n)), { label: 'Align' })
  }
  const distribute = (axis: 'x' | 'y') => {
    const r = movable.map((n) => ({ n, s: sizeOf(n) })).sort((a, b) => a.n.position[axis] - b.n.position[axis])
    if (r.length < 3) return
    const len = (x: (typeof r)[number]) => (axis === 'x' ? x.s.w : x.s.h)
    const total = r.reduce((a, x) => a + len(x), 0)
    const span = r.at(-1)!.n.position[axis] + len(r.at(-1)!) - r[0].n.position[axis]
    const gap = (span - total) / (r.length - 1)
    let at = r[0].n.position[axis]
    const pos = new Map<string, number>()
    for (const x of r) { pos.set(x.n.id, Math.round(at)); at += len(x) + gap }
    setNodes((ns) => ns.map((n) => (pos.has(n.id) ? { ...n, position: { ...n.position, [axis]: pos.get(n.id)! } } : n)), { label: 'Distribute' })
  }
  const wrapInSection = () => {
    const r = movable.map((n) => ({ n, s: sizeOf(n) }))
    const minX = Math.min(...r.map((x) => x.n.position.x)) - 48, minY = Math.min(...r.map((x) => x.n.position.y)) - 92
    const maxX = Math.max(...r.map((x) => x.n.position.x + x.s.w)) + 48, maxY = Math.max(...r.map((x) => x.n.position.y + x.s.h)) + 48
    const id = uid('sec-')
    const count = sectionCount()
    editFlow((f) => ({
      ...f,
      nodes: [
        { id, type: 'section', position: { x: minX, y: minY }, width: maxX - minX, height: maxY - minY, zIndex: -1, data: { name: `Section ${count + 1}`, hue: SECTION_HUES[count % SECTION_HUES.length] } },
        ...f.nodes.map((n) => (movable.some((m) => m.id === n.id) ? { ...n, data: { ...n.data, section: id } } : n)),
      ],
    }), { label: 'Wrap in section' })
    select([id])
  }
  const statuses = new Set(nodes.map((n) => n.data.status ?? 'draft'))
  const flowish = nodes.filter((n) => n.type !== 'note' && n.type !== 'section')
  return (
    <div className="flex flex-col">
      <div className="px-3 pt-3 pb-2 text-[12.5px] font-semibold">{nodes.length ? `${nodes.length} nodes` : ''}{nodes.length && edges.length ? ', ' : ''}{edges.length ? `${edges.length} connections` : ''}</div>
      {movable.length > 1 && (
        <Section title="Arrange" first>
          <div className="flex items-center gap-0.5 px-2.5">
            {([['l', AlignStartVertical, 'Align left'], ['c', AlignCenterVertical, 'Align centre'], ['r', AlignEndVertical, 'Align right'], ['t', AlignStartHorizontal, 'Align top'], ['m', AlignCenterHorizontal, 'Align middle'], ['b', AlignEndHorizontal, 'Align bottom']] as const).map(([k, I, l]) => (
              <IconButton key={k} icon={I} label={l} onClick={() => align(k)} />
            ))}
          </div>
          <div className="flex items-center gap-0.5 px-2.5">
            <IconButton icon={AlignHorizontalDistributeCenter} label="Distribute horizontally" disabled={movable.length < 3} onClick={() => distribute('x')} />
            <IconButton icon={AlignVerticalDistributeCenter} label="Distribute vertically" disabled={movable.length < 3} onClick={() => distribute('y')} />
            <div className="flex-1" />
            <Button size="sm" variant="default" onClick={wrapInSection}><Frame size={12} strokeWidth={1.5} />Wrap in section</Button>
          </div>
        </Section>
      )}
      {flowish.length > 0 && (
        <Section title="Status" first={movable.length < 2}>
          <Row label="All">
            <Segmented value={statuses.size === 1 ? [...statuses][0] : ''} onChange={(s) => setNodes((ns) => ns.map((n) => (flowish.some((f) => f.id === n.id) ? { ...n, data: { ...n.data, status: s as Status } } : n)), { label: 'Set status' })} options={STATUS_OPTS} label="Status" />
          </Row>
          {statuses.size > 1 && <div className="px-3 text-[11px] text-fg-faint">Mixed — pick one to apply to all.</div>}
        </Section>
      )}
      {edges.length > 0 && (
        <Section title="Connections" first={!nodes.length}>
          <Row label="Trigger"><Select value={new Set(edges.map((e) => e.data?.trigger)).size === 1 ? edges[0].data?.trigger ?? 'tap' : ''} placeholder="Mixed" onChange={(t) => setEdges((es) => es.map((e) => (edges.some((x) => x.id === e.id) ? { ...e, data: { ...e.data!, trigger: t as Trigger } } : e)), { label: 'Set trigger' })} options={TRIGGERS} label="Trigger" /></Row>
        </Section>
      )}
      <div className="flex gap-1.5 px-3 pt-2 pb-3">
        <Button size="md" variant="default" className="flex-1" onClick={duplicate} disabled={!nodes.length}><Copy size={13} strokeWidth={1.5} />Duplicate</Button>
        <Button size="md" variant="danger" className="flex-1" onClick={deleteSelection}><Trash2 size={13} strokeWidth={1.5} />Delete</Button>
      </div>
    </div>
  )
}
const sectionCount = () => doc.get().flows.find((f) => f.id === ui.getState().flowId)?.nodes.filter((n) => n.type === 'section').length ?? 0

function Stat({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[8px] bg-well px-2.5 py-2">
      <span className="text-[11px] text-fg-faint">{label}</span>
      <span className="text-[15px] font-semibold tabular">{value}</span>
      {children}
    </div>
  )
}

function DocInspector() {
  const flow = useFlow()
  const screens = flow.nodes.filter((n) => n.type === 'screen')
  const flowish = flow.nodes.filter((n) => n.type !== 'note' && n.type !== 'section')
  const counts = { draft: 0, ready: 0, shipped: 0 } as Record<Status, number>
  for (const n of flowish) if (n.type !== 'terminal') counts[n.data.status ?? 'draft']++
  const total = counts.draft + counts.ready + counts.shipped || 1
  const steps = happyPath(flow.nodes, flow.edges).length
  const setFlow = (patch: Partial<typeof flow>, commit = true) => editFlow((f) => ({ ...f, ...patch }), { commit, label: 'Edit flow' })
  return (
    <div className="flex flex-col">
      <Section title="Flow" first>
        <Row label="Name"><LiveText label="Flow name" value={flow.name} onLive={(s) => setFlow({ name: s }, false)} /></Row>
        <Row label="Owner">
          <Select value={flow.owner} onChange={(o) => setFlow({ owner: o })} label="Owner" options={Object.entries(PEOPLE).map(([k, p]) => ({ value: k, label: p.name, swatch: p.hue }))} />
        </Row>
        <Row label="About" stacked>
          <LiveText label="Description" multiline rows={3} placeholder="What this flow covers and who it is for" value={flow.description} onLive={(s) => setFlow({ description: s }, false)} />
        </Row>
      </Section>
      <Section title="Overview">
        <div className="grid grid-cols-3 gap-1.5 px-3">
          <Stat label="Screens" value={screens.length} />
          <Stat label="Decisions" value={flow.nodes.filter((n) => n.type === 'decision').length} />
          <Stat label="Links" value={flow.edges.length} />
        </div>
        <div className="px-3 pt-2.5">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-track" role="img" aria-label={`Status breakdown: ${counts.shipped} shipped, ${counts.ready} ready, ${counts.draft} draft`}>
            {(['shipped', 'ready', 'draft'] as Status[]).map((s) => <div key={s} className={cn(STATUS[s].dot, s === 'draft' && 'bg-line-strong')} style={{ width: `${(counts[s] / total) * 100}%` }} />)}
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-fg-muted">
            {(['shipped', 'ready', 'draft'] as Status[]).map((s) => <span key={s} className="flex items-center gap-1.5 tabular"><StatusDot status={s} decorative />{STATUS[s].label} {counts[s]}</span>)}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="min-w-0 flex-1 text-[11.5px] text-fg-muted">Happy path · <span className="tabular text-fg">{steps}</span> steps</div>
          <Tip label="Walk through the happy path" shortcut="p"><Button size="sm" variant="default" onClick={startWalkthrough} disabled={steps < 2}><Play size={12} strokeWidth={1.5} />Walkthrough</Button></Tip>
        </div>
        <div className="px-3 pt-1 text-[11px] text-fg-faint">Edited {ago(flow.updated)} · {PEOPLE[flow.owner]?.name ?? 'You'}</div>
      </Section>
      <div className="border-t border-line">
        <Inspector params={params} />
      </div>
    </div>
  )
}

function CommentsTab() {
  const flow = useFlow()
  const open = useUI((s) => s.openComment)
  const showResolved = useUI((s) => s.showResolved)
  const list = flow.comments.filter((c) => showResolved || !c.resolved).sort((a, b) => b.at - a.at)
  const resolved = flow.comments.filter((c) => c.resolved).length
  return (
    <div className="flex flex-col">
      <div className="flex h-9 items-center gap-2 border-b border-line px-3 text-[11.5px] text-fg-muted">
        <span className="flex-1">Show resolved{resolved ? ` (${resolved})` : ''}</span>
        <Switch size="sm" checked={showResolved} onChange={(b) => ui.setState({ showResolved: b })} label="Show resolved" />
      </div>
      {!list.length && (
        <Empty icon={MessageCircle} title="No open comments" hint="Press C, then click anywhere on the canvas — pins on a screen move with it."
          action={<Button size="sm" variant="default" className="mt-1" onClick={() => ui.setState({ tool: 'comment' })}>Add a comment</Button>} />
      )}
      {list.map((c) => {
        const host = c.node ? flow.nodes.find((n) => n.id === c.node) : undefined
        return (
          <button key={c.id} type="button"
            onClick={() => { ui.setState({ openComment: c.id, draft: null }); viewport.focusPoint?.(commentPos(flow, c)) }}
            className={cn('flex gap-2.5 border-b border-line px-3 py-2.5 text-left outline-none hover:bg-hover focus-visible:bg-hover', open === c.id && 'bg-signal-soft', c.resolved && 'opacity-60')}>
            <Avatar who={c.author} size={22} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 text-[12px]"><span className="font-medium">{PEOPLE[c.author]?.name ?? 'You'}</span><span className="text-[11px] text-fg-faint">{ago(c.at)}</span></div>
              {host && <div className="truncate text-[11px] text-signal">on {host.data.name}</div>}
              <p className="mt-0.5 line-clamp-3 text-[12px] leading-relaxed text-fg/90">{c.text}</p>
              {c.replies.length > 0 && <div className="mt-1 text-[11px] text-fg-faint">{c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}</div>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
