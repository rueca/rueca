/* Right panel: the selected node's schema in the kit Inspector; document settings when nothing is selected. */
import { useLayoutEffect } from 'react'
import { useStore } from 'zustand'
import { Copy, Eye, EyeOff, MoreHorizontal, Trash2, ScanEye, MousePointerClick } from 'lucide-react'
import { Inspector, Panel, PanelHeader, IconButton, Menu, Badge, Section, Row, Button, Select, useValues } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { specOf } from '../engine/spec'
import { defOf, catVar } from './defs'
import { graph, updateData, duplicate, removeNodes, select, connect, disconnect, sourcesFor } from './store'
import { itemStoreFor, bindNode } from './nodeParams'
import { useEval } from './evaluator'
import { doc } from './doc'
import { portVar } from './NodeView'

export function NodeInspector() {
  const selKey = useStore(graph, (s) => s.nodes.filter((n) => n.selected).map((n) => n.id).join(','))
  const ids = selKey ? selKey.split(',') : []
  return (
    <Panel header={<PanelHeader title={ids.length === 1 ? 'Node' : ids.length > 1 ? `${ids.length} nodes` : 'Document'} />}>
      {ids.length === 1 ? <One id={ids[0]} /> : ids.length > 1 ? <Many ids={ids} /> : <DocSettings />}
    </Panel>
  )
}

function One({ id }: { id: string }) {
  const node = useStore(graph, (s) => s.nodes.find((n) => n.id === id))
  const incoming = useStore(graph, (s) => s.edges.filter((e) => e.target === id).map((e) => `${e.targetHandle}:${s.nodes.find((n) => n.id === e.source)?.data.title ?? '?'}`).join('|'))
  const status = useEval((s) => s.status[id])
  const thumb = useEval((s) => s.thumbs[id])
  const previewOf = useValues(doc, (v) => v.previewOf)
  const kind = node?.data.kind
  // bind before paint so the rows never flash another node's values
  useLayoutEffect(() => (kind ? bindNode(id) : undefined), [id, kind])
  if (!node) return null
  const def = defOf(node.data.kind)
  const spec = specOf(node.data.kind)
  const store = itemStoreFor(node.data.kind)
  const Icon = def.icon
  const wiredFrom = new Map(incoming ? incoming.split('|').map((x) => x.split(':') as [string, string]) : [])
  const error = status?.error ?? thumb?.error

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-2.5 px-pad pt-3 pb-2">
        <span className="mt-0.5 flex size-icon shrink-0 items-center justify-center rounded-control" style={{ background: `color-mix(in srgb, ${catVar(def.category)} 16%, transparent)`, color: catVar(def.category) }}>
          <Icon size={15} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <InlineText value={node.data.title} onCommit={(t) => updateData([id], () => ({ title: t }))} className="block truncate text-title font-semibold text-fg" label="Rename node" />
          <div className="mt-0.5 text-ui leading-snug text-fg-muted">{def.description}</div>
        </div>
        <IconButton icon={node.data.bypass ? EyeOff : Eye} label={node.data.bypass ? 'Enable node' : 'Bypass node'} shortcut="b" active={!!node.data.bypass} size="icon-sm" onClick={() => updateData([id], (d) => ({ bypass: !d.bypass }))} />
        <Menu align="end" trigger={<IconButton icon={MoreHorizontal} label="More" size="icon-sm" />}
          items={[
            { label: previewOf === 'selection' ? 'Preview the output' : 'Preview this node', icon: ScanEye, shortcut: 'p', onClick: () => doc.setValue('previewOf', previewOf === 'selection' ? 'output' : 'selection') },
            { label: 'Duplicate', icon: Copy, shortcut: 'mod+d', onClick: () => duplicate([id]) },
            { type: 'separator' },
            { label: 'Delete', icon: Trash2, danger: true, shortcut: 'backspace', onClick: () => removeNodes([id]) },
          ]} />
      </div>

      <div className="flex flex-wrap items-center gap-1 px-pad pb-2.5">
        <Badge>{def.category}</Badge>
        {node.data.bypass && <Badge tone="key">Bypassed</Badge>}
        {thumb && !error && <Badge tone="ok">{thumb.ms < 10 ? thumb.ms.toFixed(1) : Math.round(thumb.ms)} ms</Badge>}
      </div>
      {error && <div className="mx-pad mb-2.5 rounded-cluster bg-rec/10 px-2.5 py-2 text-ui leading-snug text-rec">{error}</div>}

      {spec.inputs.length > 0 && (
        <Section title="Inputs" first={false}>
          {spec.inputs.map((p) => {
            const src = wiredFrom.get(p.key)
            const current = graph.getState().edges.find((e) => e.target === id && e.targetHandle === p.key)
            const NONE = '__none'
            // The keyboard way to wire (WCAG 2.1.1): pick the source here instead of dragging a wire.
            // a short label so the field never truncates; whether it's optional lives in the row's hint
            const options = [{ value: NONE, label: 'None' }, ...sourcesFor(id, p.key)]
            return (
              <Row key={p.key} label={p.label} hint={`${p.type} input.${p.param ? ` Wiring this overrides the ${p.param} value below.` : ''}${p.optional ? ' Optional: None leaves it unconnected.' : src ? '' : ' Required.'}`}>
                <span className="size-2 shrink-0 rounded-full" aria-hidden style={{ background: src ? portVar(p.type) : 'transparent', boxShadow: `inset 0 0 0 1.5px ${portVar(p.type)}` }} />
                <Select label={`${p.label} source`} value={current ? `${current.source}:${current.sourceHandle}` : NONE} options={options}
                  className={!current && !p.optional ? 'text-rec' : undefined}
                  onChange={(v) => {
                    if (v === NONE) disconnect(id, p.key)
                    else { const [source, sourceHandle] = v.split(':'); connect({ source, sourceHandle, target: id, targetHandle: p.key }) }
                  }} />
              </Row>
            )
          })}
        </Section>
      )}

      {store && <div className="border-t border-line"><Inspector key={id} params={store} /></div>}
    </div>
  )
}

function Many({ ids }: { ids: string[] }) {
  const allBypassed = useStore(graph, (s) => s.nodes.filter((n) => ids.includes(n.id)).every((n) => n.data.bypass))
  return (
    <div className="flex flex-col gap-1.5 p-pad">
      <p className="pb-1 text-ui leading-relaxed text-fg-muted">Select a single node to edit its parameters.</p>
      <Button variant="default" onClick={() => updateData(ids, () => ({ bypass: !allBypassed }))}>{allBypassed ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}{allBypassed ? 'Enable all' : 'Bypass all'}</Button>
      <Button variant="default" onClick={() => duplicate(ids)}><Copy size={14} strokeWidth={1.5} />Duplicate</Button>
      <Button variant="danger" onClick={() => removeNodes(ids)}><Trash2 size={14} strokeWidth={1.5} />Delete {ids.length} nodes</Button>
      <Button variant="ghost" onClick={() => select([])}>Clear selection</Button>
    </div>
  )
}

function DocSettings() {
  const counts = useStore(graph, (s) => `${s.nodes.length} nodes · ${s.edges.length} wires`)
  const lastMs = useEval((s) => s.lastMs)
  const inline = useEval((s) => s.inline)
  return (
    <div className="flex flex-col">
      <div className="flex gap-2.5 px-pad pt-3 pb-3">
        <MousePointerClick size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-fg-faint" />
        <div className="min-w-0">
          <div className="text-ui leading-snug text-fg-muted">Select a node to edit it. With nothing selected, these settings apply to the whole document.</div>
          <div className="mt-1.5 tabular text-ui text-fg-faint">{counts} · last cook {lastMs < 10 ? lastMs.toFixed(1) : Math.round(lastMs)} ms{inline ? ' · main thread' : ' · worker'}</div>
        </div>
      </div>
      <div className="border-t border-line"><Inspector params={doc} folders={['preview', 'graph', 'export']} /></div>
    </div>
  )
}
