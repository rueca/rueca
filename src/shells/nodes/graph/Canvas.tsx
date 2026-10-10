/* The graph canvas: React Flow wired to the store, add-node search at the cursor (Tab / double-click / wire drop), library drops, zoom HUD. */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, MiniMap, useReactFlow, useViewport, useStore as useFlowStore,
  type FinalConnectionState, type XYPosition,
} from '@xyflow/react'
import { Kbd, ZoomPill, toast, useHotkeys, useStudio, useTheme, useValues } from '@kit'
import { QuickAdd, type QuickAddItem } from '@kit/system/quick-add'
import { specOf, portOf, type PortType } from '../engine/spec'
import { DEF_LIST, catVar, defOf } from './defs'
import { graph, useGraph, onNodesChange, onEdgesChange, connect, isValidConnection, addNode, commit, load, type SavedGraph } from './store'
import { NodeView, portVar } from './NodeView'
import { TypedConnectionLine, TypedEdge } from './TypedEdge'
import { doc } from './doc'

const nodeTypes = { proc: NodeView }
const edgeTypes = { typed: TypedEdge }

export const LIB_MIME = 'application/x-studio-node'

type From = { nodeId: string; handleId: string; side: 'in' | 'out'; type: PortType; title: string }
interface AddState { screen: XYPosition; flow: XYPosition; from?: From }

/** Port-type dots for a node kind — reused by the library list. */
export function PortDots({ kind }: { kind: string }) {
  const s = specOf(kind)
  const dot = (t: PortType, i: number, hollow?: boolean) => (
    <span key={i} className="size-[7px] rounded-full" style={{ background: hollow ? 'transparent' : portVar(t), boxShadow: `inset 0 0 0 1.5px ${portVar(t)}` }} />
  )
  return (
    <span className="flex items-center gap-1">
      <span className="flex gap-[3px]">{s.inputs.map((p, i) => dot(p.type, i, true))}</span>
      {s.outputs.length > 0 && <span className="text-fg-faint">→</span>}
      <span className="flex gap-[3px]">{s.outputs.map((p, i) => dot(p.type, i))}</span>
    </span>
  )
}

/** Imperative handle so the toolbar / palette can open the add popover and frame the graph. */
export const canvasApi = { openAdd: () => {}, fit: () => {}, center: (): XYPosition => ({ x: 0, y: 0 }) }

export function GraphCanvas() {
  const nodes = useGraph((s) => s.nodes)
  const edges = useGraph((s) => s.edges)
  const v = useValues(doc)
  const { present } = useStudio()   // ⌘\ hides the canvas HUD too (break-it F3)
  const { theme } = useTheme()
  const rf = useReactFlow()
  const wrap = useRef<HTMLDivElement>(null)
  const pointer = useRef<XYPosition | null>(null)
  const [add, setAdd] = useState<AddState | null>(null)

  const openAt = useCallback((screen: XYPosition, from?: From) => setAdd({ screen, flow: rf.screenToFlowPosition(screen), from }), [rf])
  const centerScreen = () => {
    const r = wrap.current!.getBoundingClientRect()
    return { x: r.left + r.width / 2 - 140, y: r.top + r.height / 3 }
  }
  canvasApi.openAdd = () => openAt(pointer.current ?? centerScreen())
  canvasApi.fit = () => rf.fitView({ padding: 0.18, duration: 250 })
  canvasApi.center = () => { const r = wrap.current!.getBoundingClientRect(); return rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) }

  // Tab opens add-node at the cursor (Cables). Only when the pointer is over the graph.
  // Guarded: Tab is the keyboard's way through the UI, so only take it when the pointer is over the
  // graph AND focus isn't on a control (body or inside the graph). Otherwise Tab moves focus as usual.
  useHotkeys({ tab: {
    run: () => { if (pointer.current) openAt(pointer.current) },
    when: () => !!pointer.current && (document.activeElement === document.body || !!wrap.current?.contains(document.activeElement)),
    label: 'Add node at cursor', group: 'Graph',
  } }, [openAt])

  const items: QuickAddItem[] = useMemo(() => {
    const from = add?.from
    return DEF_LIST
      .filter((d) => {
        if (!from) return true
        const s = specOf(d.kind)
        return from.side === 'out' ? s.inputs.some((p) => p.type === from.type) : s.outputs.some((p) => p.type === from.type)
      })
      .map((d) => ({ id: d.kind, label: d.label, group: d.category, icon: d.icon, tint: catVar(d.category), keywords: d.keywords, meta: <PortDots kind={d.kind} /> }))
  }, [add?.from])

  const pick = (kind: string) => {
    if (!add) return
    if (kind === 'output' && graph.getState().nodes.some((n) => n.data.kind === 'output')) toast('There is already an Output', { description: 'The preview and export use the first one.' })
    const s = specOf(kind)
    const from = add.from
    // place so the connecting port lands near the cursor
    const pos = { x: add.flow.x - (from?.side === 'in' ? 176 : 0), y: add.flow.y - 44 }
    const id = addNode(kind, pos, { commit: false })
    if (from) {
      if (from.side === 'out') {
        const port = s.inputs.find((p) => p.type === from.type)
        if (port) connect({ source: from.nodeId, sourceHandle: from.handleId, target: id, targetHandle: port.key })
      } else {
        const port = s.outputs.find((p) => p.type === from.type)
        if (port) connect({ source: id, sourceHandle: port.key, target: from.nodeId, targetHandle: from.handleId })
      }
    }
    commit()
  }

  const onConnectEnd = useCallback((e: MouseEvent | TouchEvent, state: FinalConnectionState) => {
    const fromId = state.fromNode?.id, handleId = state.fromHandle?.id
    if (state.isValid || state.toNode || !fromId || !handleId) return
    const n = graph.getState().nodes.find((x) => x.id === fromId)
    if (!n) return
    const side = state.fromHandle?.type === 'source' ? 'out' : 'in'
    const port = portOf(n.data.kind, handleId, side)
    if (!port) return
    const pt = 'changedTouches' in e ? e.changedTouches[0] : e
    openAt({ x: pt.clientX, y: pt.clientY }, { nodeId: n.id, handleId, side, type: port.type, title: n.data.title })
  }, [openAt])

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData(LIB_MIME)
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    if (kind) { addNode(kind, { x: pos.x - 88, y: pos.y - 20 }); return }
    const file = e.dataTransfer.files[0]
    if (file && /json$/i.test(file.type || file.name)) {
      try { const g = JSON.parse(await file.text()) as SavedGraph; if (!Array.isArray(g.nodes)) throw new Error(); load(g); toast(`Loaded “${g.name ?? file.name}”`, { type: 'success' }); setTimeout(() => rf.fitView({ padding: 0.18 }), 50) }
      catch { toast('That file is not a graph', { type: 'error', description: 'Expected a JSON export from Nodes.' }) }
    }
  }

  useEffect(() => { const t = setTimeout(() => rf.fitView({ padding: 0.18 }), 30); return () => clearTimeout(t) }, [rf])

  const fromLabel = add?.from && (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: portVar(add.from.type) }} />
      {add.from.side === 'out' ? 'Feed' : 'Drive'} <span className="text-fg">{add.from.title}</span> · {add.from.type}
    </span>
  )

  return (
    <div
      ref={wrap}
      className="relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] bg-well shadow-[inset_0_0_0_1px_var(--line)]"
      onPointerMove={(e) => { pointer.current = { x: e.clientX, y: e.clientY } }}
      onPointerLeave={() => { pointer.current = null }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
      onDrop={onDrop}
    >
      <ReactFlow
        className="studio-flow"
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        connectionLineComponent={TypedConnectionLine}
        connectionRadius={28}
        onNodeDragStop={() => commit()}
        onSelectionDragStop={() => commit()}
        onDoubleClick={(e) => { if ((e.target as HTMLElement).classList.contains('react-flow__pane')) openAt({ x: e.clientX, y: e.clientY }) }}
        zoomOnDoubleClick={false}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionOnDrag
        panOnDrag={[1, 2]}
        panActivationKeyCode="Space"
        panOnScroll
        zoomActivationKeyCode={['Meta', 'Control']}
        snapToGrid={v.snap}
        snapGrid={[10, 10]}
        minZoom={0.15}
        maxZoom={2.5}
        attributionPosition="bottom-left"
        style={{ '--xy-edge-stroke-width': 1.75 } as CSSProperties}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="var(--line-strong)" />
        {v.minimap && !present && <MiniMap pannable zoomable position="bottom-left" nodeBorderRadius={8} nodeColor={(n) => catVar(defOf((n.data as any).kind).category)} maskColor="color-mix(in srgb, var(--field) 65%, transparent)" />}
        {!present && <FlowZoom />}
      </ReactFlow>

      {nodes.length <= 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] flex flex-col items-center gap-2 text-center">
          <div className="text-[13px] font-medium text-fg">Start by adding a generator</div>
          <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">Press <Kbd>Tab</Kbd> or double-click the canvas, or drag one in from the library</div>
        </div>
      )}

      <QuickAdd open={!!add} at={add?.screen ?? null} onClose={() => setAdd(null)} items={items} onPick={pick} context={fromLabel} placeholder={add?.from ? 'Add and connect…' : 'Add node…'} empty="No node takes that type" label="Add node" />
    </div>
  )
}

/** Zoom HUD: the kit pill, driven by React Flow's viewport. Fades while a wire is being dragged. */
function FlowZoom() {
  const rf = useReactFlow()
  const { zoom } = useViewport()
  const busy = useFlowStore((s) => s.connection.inProgress)
  return (
    <ZoomPill className={busy ? 'opacity-40' : undefined} zoom={zoom} presets={[0.5, 1, 1.5]}
      onZoom={(z) => rf.zoomTo(z, { duration: 150 })} onFit={() => rf.fitView({ padding: 0.18, duration: 250 })} />
  )
}
