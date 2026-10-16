/* The flow canvas: React Flow in controlled mode over the undoable doc.
   Selection + measured sizes live in the UI store, so undo never steals focus. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode, SelectionMode, ViewportPortal, applyNodeChanges, useReactFlow, useViewport, useNodesInitialized, useKeyPress,
  type NodeChange, type EdgeChange, type Connection, type OnConnectStart, type FinalConnectionState,
} from '@xyflow/react'
import '@xyflow/react/dist/base.css'
import '@kit/xyflow.css'
import '../flows.css'
import { Hand, MessageCircle, MousePointer2, Square, StickyNote, Diamond, ChevronLeft, ChevronRight, X, Workflow, Play, Pause, Circle, CircleDot, Frame } from 'lucide-react'
import { ToolDock, Divider, IconButton, Button, Empty, ZoomPill, useHotkeys, useValues, useStudio, cn, toast } from '@kit'
import { QuickAdd, type QuickAddItem } from '@kit/system/quick-add'
import { nodeTypes, STATUS } from './nodes'
import { edgeTypes, TRIGGER_ICON } from './edges'
import { CommentLayer } from './comments'
import { happyPath } from '../layout'
import { makeEdge, TEMPLATES, type FlowEdge, type FlowNode, type Kind, type Template } from '../model'
import {
  params, ui, useUI, useFlow, setNodes, setEdges, settle, select, addNode, addScreen, activeFlow, viewport, doc, sizeOf, type Tool,
} from '../store'

const TOOLS: { value: Tool; label: string; icon: typeof Hand; shortcut: string }[] = [
  { value: 'select', label: 'Move', icon: MousePointer2, shortcut: 'v' },
  { value: 'hand', label: 'Hand', icon: Hand, shortcut: 'h' },
  { value: 'comment', label: 'Comment', icon: MessageCircle, shortcut: 'c' },
]

/** Keep node objects referentially stable unless their inputs changed — React Flow re-adopts changed objects. */
function useRFNodes(nodes: FlowNode[], sel: string[], measured: Record<string, { width: number; height: number }>) {
  const cache = useRef(new Map<string, { src: FlowNode; selected: boolean; m?: { width: number; height: number }; out: FlowNode }>())
  return useMemo(() => {
    const next = new Map<string, { src: FlowNode; selected: boolean; m?: { width: number; height: number }; out: FlowNode }>()
    const out = nodes.map((n) => {
      const selected = sel.includes(n.id)
      const m = measured[n.id]
      const hit = cache.current.get(n.id)
      if (hit && hit.src === n && hit.selected === selected && hit.m === m) { next.set(n.id, hit); return hit.out }
      const o: FlowNode = { ...n, selected, measured: m ?? n.measured, zIndex: n.type === 'section' ? -1 : n.zIndex }
      next.set(n.id, { src: n, selected, m, out: o })
      return o
    })
    cache.current = next
    return out
  }, [nodes, sel, measured])
}

/* What the add-at-cursor search offers: shapes first, then every screen template. */
const OPPOSITE: Record<string, string> = { r: 'l', l: 'r', t: 'b', b: 't' }
const ADD_ITEMS: QuickAddItem[] = [
  { id: 'shape:decision', label: 'Decision', group: 'Shapes', icon: Diamond, keywords: ['condition', 'branch', 'if'] },
  { id: 'shape:end', label: 'End point', group: 'Shapes', icon: CircleDot, keywords: ['finish', 'terminal'] },
  { id: 'shape:start', label: 'Start point', group: 'Shapes', icon: Circle, keywords: ['begin', 'terminal'] },
  { id: 'shape:note', label: 'Sticky note', group: 'Shapes', icon: StickyNote, keywords: ['comment', 'annotation'] },
  { id: 'shape:section', label: 'Section', group: 'Shapes', icon: Frame, keywords: ['group', 'swimlane'] },
  ...TEMPLATES.map((t) => ({ id: `screen:${t.value}`, label: t.label, group: `Screens · ${t.group}`, icon: Square, keywords: ['screen', t.group] })),
]
interface AddAt { screen: { x: number; y: number }; flow: { x: number; y: number }; from?: { node: string; handle: string; name: string } }

export function FlowCanvas() {
  const flow = useFlow()
  const v = useValues(params)
  const sel = useUI((s) => s.sel)
  const measured = useUI((s) => s.measured)
  const tool = useUI((s) => s.tool)
  // Space held = the hand tool, from anywhere (a node included): see `hand` below. useKeyPress ignores Space typed in a field.
  const spaceHeld = useKeyPress('Space')
  const walk = useUI((s) => s.walk)
  const animating = useUI((s) => s.animating)
  const rf = useReactFlow<FlowNode, FlowEdge>()
  const { zoom } = useViewport()
  const { present, setPresent } = useStudio()
  // The canvas box changes size when the interface hides or returns (⌘\\ / Esc); React Flow keeps its transform,
  // so the graph ended up off-centre and then under the inspector (cleanup L2). Refit on each toggle.
  const firstPresent = useRef(true)
  useEffect(() => {
    if (firstPresent.current) { firstPresent.current = false; return }
    const t = requestAnimationFrame(() => rf.fitView({ padding: 0.12, maxZoom: 1.25, duration: 200 }))
    return () => cancelAnimationFrame(t)
  }, [present]) // eslint-disable-line react-hooks/exhaustive-deps
  const wrap = useRef<HTMLDivElement>(null)
  const [connecting, setConnecting] = useState(false)
  const [adding, setAdding] = useState<AddAt | null>(null)

  const nodes = useRFNodes(flow.nodes, sel.nodes, measured)
  const edges = useMemo(() => flow.edges.map((e) => (sel.edges.includes(e.id) ? { ...e, selected: true } : e)), [flow.edges, sel.edges])

  /* ---- bridge the camera for panels, palette and store actions */
  useEffect(() => {
    viewport.fit = (o) => rf.fitView({ padding: 0.12, duration: o?.duration ?? 450, maxZoom: 1.25 })
    viewport.center = () => {
      const r = wrap.current?.getBoundingClientRect()
      return r ? rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 }
    }
    viewport.focus = (ids, o) => rf.fitView({ nodes: ids.map((id) => ({ id })), duration: o?.duration ?? 500, padding: 0.35, maxZoom: o?.zoom ?? 1.25 })
    viewport.focusPoint = (p) => rf.setCenter(p.x, p.y, { zoom: Math.max(rf.getZoom(), 0.9), duration: 450 })
    viewport.zoomTo = (z) => rf.zoomTo(z, { duration: 200 })
    viewport.zoomIn = () => rf.zoomIn({ duration: 200 })
    viewport.zoomOut = () => rf.zoomOut({ duration: 200 })
    viewport.el = () => wrap.current?.querySelector('.react-flow__viewport') as HTMLElement | null
    viewport.present = setPresent
    viewport.reveal = (r) => {
      const box = wrap.current?.getBoundingClientRect()
      if (!box) return
      const a = rf.flowToScreenPosition({ x: r.x, y: r.y }), b = rf.flowToScreenPosition({ x: r.x + r.w, y: r.y + r.h })
      const m = 80
      if (a.x >= box.left + m && b.x <= box.right - m && a.y >= box.top + m && b.y <= box.bottom - m) return
      rf.setCenter(r.x + r.w / 2, r.y + r.h / 2, { zoom: rf.getZoom(), duration: 350 })
    }
  }, [rf, setPresent])

  /* ---- first view of each flow: its first section (readable), else everything */
  const initialised = useNodesInitialized()
  const fittedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!initialised || fittedFor.current === flow.id) return
    fittedFor.current = flow.id
    const first = flow.nodes.find((n) => n.type === 'section')
    requestAnimationFrame(() => (first ? rf.fitView({ nodes: [{ id: first.id }], padding: 0.06, duration: 0 }) : rf.fitView({ padding: 0.12, maxZoom: 1.1, duration: 0 })))
  }, [initialised, flow.id, flow.nodes, rf])

  /* ---- changes from React Flow → doc / ui */
  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    const st = ui.getState()
    let selSet: Set<string> | null = null
    let m: typeof st.measured | null = null
    const docChanges: NodeChange<FlowNode>[] = []
    const dropped = new Set<string>()
    let resized = false
    for (const c of changes) {
      if (c.type === 'select') { selSet ??= new Set(st.sel.nodes); if (c.selected) selSet.add(c.id); else selSet.delete(c.id) }
      else if (c.type === 'dimensions') {
        if (c.dimensions) { m ??= { ...st.measured }; m[c.id] = c.dimensions }
        if (c.setAttributes || c.resizing !== undefined) { docChanges.push(c); if (c.resizing === false) resized = true }
      } else if (c.type === 'position') { docChanges.push(c); if (c.dragging === false) dropped.add(c.id) }
      else if (c.type !== 'remove') docChanges.push(c)
    }
    if (selSet) ui.setState({ sel: { ...ui.getState().sel, nodes: [...selSet] } })
    if (m) ui.setState({ measured: m })
    if (!docChanges.length) return
    // a section carries its members (unless they are being dragged themselves)
    const cur = activeFlow().nodes
    const moving = new Set(docChanges.filter((c) => c.type === 'position').map((c) => (c as { id: string }).id))
    const extra: NodeChange<FlowNode>[] = []
    for (const c of docChanges) {
      if (c.type !== 'position' || !c.position) continue
      const sec = cur.find((n) => n.id === c.id)
      if (sec?.type !== 'section') continue
      const dx = c.position.x - sec.position.x, dy = c.position.y - sec.position.y
      if (!dx && !dy && c.dragging !== false) continue
      for (const n of cur) if (n.data.section === sec.id && !moving.has(n.id)) {
        extra.push({ type: 'position', id: n.id, position: { x: n.position.x + dx, y: n.position.y + dy }, dragging: c.dragging })
        if (c.dragging === false) dropped.add(n.id)
      }
    }
    setNodes((ns) => applyNodeChanges([...docChanges, ...extra], ns), { commit: false })
    if (dropped.size) settle(dropped, dropped.size > 1 ? `Move ${dropped.size} nodes` : 'Move')
    if (resized) setTimeout(() => doc.commit('Resize section'), 0)
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange<FlowEdge>[]) => {
    const st = ui.getState()
    const s = new Set(st.sel.edges)
    let touched = false
    for (const c of changes) if (c.type === 'select') { touched = true; if (c.selected) s.add(c.id); else s.delete(c.id) }
    if (touched) ui.setState({ sel: { ...ui.getState().sel, edges: [...s] } })
  }, [])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    const e = makeEdge(c.source, c.target, { trigger: activeFlow().nodes.find((n) => n.id === c.source)?.type === 'decision' ? 'condition' : 'tap' }, [c.sourceHandle ?? 'r', c.targetHandle ?? 'l'])
    setEdges((es) => [...es, e], { label: 'Connect' })
    select([], [e.id])
  }, [])

  const onReconnect = useCallback((old: FlowEdge, c: Connection) => {
    setEdges((es) => es.map((e) => (e.id === old.id ? { ...e, source: c.source, target: c.target, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle, data: { ...e.data!, pinned: true } } : e)), { label: 'Reconnect' })
  }, [])

  const onConnectStart: OnConnectStart = useCallback(() => setConnecting(true), [])
  // Drop a connection on empty canvas → search what to add there, already connected (FigJam / Whimsical).
  const onConnectEnd = useCallback((e: MouseEvent | TouchEvent, st: FinalConnectionState) => {
    setConnecting(false)
    if (st.isValid || st.toNode || !st.fromNode || st.fromNode.type === 'note' || st.fromNode.type === 'section') return
    const pt = 'changedTouches' in e ? e.changedTouches[0] : e
    const screen = { x: pt.clientX, y: pt.clientY }
    setAdding({ screen, flow: rf.screenToFlowPosition(screen), from: { node: st.fromNode.id, handle: st.fromHandle?.id ?? 'r', name: (st.fromNode.data as FlowNode['data']).name } })
  }, [rf])
  const openAddAt = (screen: { x: number; y: number }) => setAdding({ screen, flow: rf.screenToFlowPosition(screen) })
  const pickAdd = (id: string) => {
    const a = adding
    if (!a) return
    const [type, value] = id.split(':')
    const node = type === 'screen' ? addScreen(value as Template, a.flow)
      : value === 'start' || value === 'end' ? addNode('terminal', a.flow, { role: value, name: value === 'end' ? 'End' : 'Start' })
        : addNode(value as Kind, a.flow)
    if (a.from && node.type !== 'note' && node.type !== 'section') {
      const from = activeFlow().nodes.find((n) => n.id === a.from!.node)
      const e = makeEdge(a.from.node, node.id, { trigger: from?.type === 'decision' ? 'condition' : 'tap' }, [a.from.handle, OPPOSITE[a.from.handle] ?? 'l'])
      setEdges((es) => [...es, e], { label: 'Connect' })
    }
  }

  const onPaneClick = useCallback((e: React.MouseEvent) => {
    const st = ui.getState()
    if (st.tool === 'comment') {
      const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      ui.setState({ draft: p, openComment: null })
      return
    }
    if (st.openComment || st.draft) ui.setState({ openComment: null, draft: null })
    select()
  }, [rf])

  // comment tool: clicking a node drops a pin on it, too
  const onNodeClick = useCallback((e: React.MouseEvent) => {
    if (ui.getState().tool !== 'comment') return
    ui.setState({ draft: rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }), openComment: null })
  }, [rf])

  /* ---- drag from the library */
  const onDragOver = (e: React.DragEvent) => { if (e.dataTransfer.types.includes('application/x-flows')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }
  const onDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData('application/x-flows')
    if (!raw) return
    e.preventDefault()
    const item = JSON.parse(raw) as { kind: Kind; template?: Template; role?: 'start' | 'end' }
    const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    if (item.kind === 'screen' && item.template) addScreen(item.template, at)
    else addNode(item.kind, at, item.role ? { role: item.role, name: item.role === 'end' ? 'End' : 'Start' } : {})
  }

  /* ---- walkthrough */
  const steps = useMemo(() => (walk === null ? [] : ui.getState().walkNodes), [walk])
  useEffect(() => {
    if (walk === null) return
    const id = ui.getState().walkNodes[walk]
    const n = activeFlow().nodes.find((x) => x.id === id)
    if (!n) return
    select()
    if (!params.values().follow) return
    const s = sizeOf(n)
    const r = wrap.current?.getBoundingClientRect()
    const z = r ? Math.min(1.15, (r.height * 0.62) / s.h, (r.width * 0.45) / s.w) : 1
    rf.setCenter(n.position.x + s.w / 2, n.position.y + s.h / 2, { zoom: Math.max(z, 0.4), duration: 650 })
  }, [walk, rf])
  // leaving present mode (Esc, “Show interface”) ends the walkthrough
  useEffect(() => { if (!present && walk !== null) ui.setState({ walk: null }) }, [present, walk])

  const stepTo = (i: number) => {
    const n = ui.getState().walkNodes.length
    ui.setState({ walk: Math.max(0, Math.min(n - 1, i)) })
  }
  const exitWalk = () => { ui.setState({ walk: null }); setPresent(false); setTimeout(() => viewport.fit?.(), 50) }
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (walk === null || !playing || !v.autoplay) return
    const t = setTimeout(() => (walk >= steps.length - 1 ? setPlaying(false) : stepTo(walk + 1)), v.autoplay * 1000)
    return () => clearTimeout(t)
  }, [walk, playing, v.autoplay, steps.length])

  useHotkeys(walk === null ? {
    v: () => ui.setState({ tool: 'select' }),
    h: () => ui.setState({ tool: 'hand' }),
    c: () => ui.setState({ tool: ui.getState().tool === 'comment' ? 'select' : 'comment' }),
    esc: () => { const s = ui.getState(); if (s.draft || s.openComment) ui.setState({ draft: null, openComment: null }); else if (s.tool !== 'select') ui.setState({ tool: 'select' }); else select() },
  } : {
    'arrowright,space,enter': () => stepTo((ui.getState().walk ?? 0) + 1),
    arrowleft: () => stepTo((ui.getState().walk ?? 0) - 1),
    home: () => stepTo(0),
    end: () => stepTo(steps.length - 1),
  }, [walk, steps.length])

  const empty = flow.nodes.length === 0
  const interactive = walk === null
  const hand = tool === 'hand' || (spaceHeld && interactive)
  // ⌘\ present mode hides the canvas HUD too (dock, zoom, minimap, pins); the walkthrough keeps its own HUD (break-it F3)
  const hud = interactive && !present

  return (
    <div ref={wrap} className="@container relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow<FlowNode, FlowEdge>
        className={cn('studio-flow handles-on-hover flows-rf', connecting && 'is-connecting', animating && 'is-animating', tool === 'comment' && '[&_.react-flow__pane]:!cursor-crosshair [&_.react-flow__node]:!cursor-crosshair')}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onDoubleClick={(e) => { if (tool === 'select' && interactive && (e.target as HTMLElement).classList.contains('react-flow__pane')) openAddAt({ x: e.clientX, y: e.clientY }) }}
        onReconnect={onReconnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={{ stroke: 'var(--signal)', strokeWidth: 1.5 }}
        defaultEdgeOptions={{ type: 'flow' }}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionOnDrag={tool === 'select' && interactive && !hand}
        selectionMode={SelectionMode.Partial}
        panOnDrag={hand || !interactive ? true : [1, 2]}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        nodesDraggable={tool === 'select' && interactive && !hand}
        nodesConnectable={tool === 'select' && interactive && !hand}
        elementsSelectable={!hand && interactive}
        edgesReconnectable={tool === 'select' && interactive && !hand}
        // 22 edge tab stops before the nodes made Tab useless; edges are reached from the inspector's Connections list (break-it A9)
        edgesFocusable={false}
        elevateNodesOnSelect={false}
        snapToGrid={v.snap}
        snapGrid={[v.grid, v.grid]}
        minZoom={0.1}
        maxZoom={3}
        attributionPosition="bottom-left"
      >
        {v.background !== 'none' && (
          <Background variant={v.background === 'lines' ? BackgroundVariant.Lines : BackgroundVariant.Dots} gap={v.background === 'lines' ? v.grid * 2 : 20} size={1.2}
            color={v.background === 'lines' ? 'var(--line)' : 'var(--line-strong)'} />
        )}
        {v.minimap && hud && (
          <MiniMap pannable zoomable maskStrokeColor="var(--signal)" maskStrokeWidth={1.5} position="bottom-right" style={{ width: 176, height: 112, bottom: 52, right: 12 }} ariaLabel="Minimap"
            nodeBorderRadius={4} nodeClassName={(n) => `mm-${n.type}`} />
        )}
        {!present && <ViewportPortal><CommentLayer zoom={zoom} /></ViewportPortal>}
      </ReactFlow>

      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto cluster rounded-[14px] px-2">
            <Empty icon={Workflow} title="Start mapping this flow" hint="Drag screens in from the library, or add a start point and keep pressing S to chain screens."
              action={<div className="mt-1 flex gap-1.5"><Button variant="primary" size="md" onClick={() => addNode('terminal', undefined, { role: 'start', name: 'Start' })}>Add start</Button><Button variant="default" size="md" onClick={() => addScreen('welcome')}>Add screen</Button></div>} />
          </div>
        </div>
      )}

      {hud ? (
        <>
          {/* narrow canvas: the dock centres in the space left of the zoom pill instead of under it (break-it F4) */}
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 @max-[760px]:right-[120px] @max-[760px]:left-auto @max-[760px]:translate-x-0">
            <ToolDock value={tool} onChange={(t) => ui.setState({ tool: t, draft: null })} tools={TOOLS}>
              <Divider vertical className="mx-1 h-5" />
              <IconButton icon={Square} label="Screen" shortcut="s" tipSide="top" size="dock" onClick={() => addScreen('home')} />
              <IconButton icon={Diamond} label="Decision" shortcut="d" tipSide="top" size="dock" onClick={() => addNode('decision')} />
              <IconButton icon={StickyNote} label="Sticky note" shortcut="n" tipSide="top" size="dock" onClick={() => addNode('note')} />
            </ToolDock>
          </div>
          <ZoomPill zoom={zoom} onZoom={(z) => rf.zoomTo(z, { duration: 200 })} onFit={() => viewport.fit?.()} />
          {tool === 'comment' && (
            <div className="cluster absolute top-3 left-1/2 z-10 flex h-bar -translate-x-1/2 items-center gap-2 px-pad text-ui text-fg-muted">
              <MessageCircle size={13} strokeWidth={1.5} className="text-signal" />Click anywhere to leave a comment
              <button type="button" className="text-fg hover:underline" onClick={() => ui.setState({ tool: 'select', draft: null })}>Done</button>
            </div>
          )}
        </>
      ) : walk !== null && (
        <WalkHUD index={walk!} onStep={stepTo} onExit={exitWalk} playing={playing} onPlay={() => setPlaying((p) => !p)} canPlay={v.autoplay > 0} />
      )}
      <QuickAdd open={!!adding} at={adding?.screen ?? null} onClose={() => setAdding(null)} items={adding?.from ? ADD_ITEMS.filter((i) => i.id !== 'shape:note' && i.id !== 'shape:section') : ADD_ITEMS} onPick={pickAdd}
        label="Add to flow" placeholder={adding?.from ? 'Add and connect…' : 'Add screen or shape…'}
        context={adding?.from ? <>Connect from <span className="text-fg">{adding.from.name}</span></> : undefined} />
    </div>
  )
}

/* Walkthrough heads-up display: step x of N, the screen, how you got here. */
function WalkHUD({ index, onStep, onExit, playing, onPlay, canPlay }: { index: number; onStep: (i: number) => void; onExit: () => void; playing: boolean; onPlay: () => void; canPlay: boolean }) {
  const flow = useFlow()
  const ids = useUI((s) => s.walkNodes)
  const edgeIds = useUI((s) => s.walkEdges)
  const node = flow.nodes.find((n) => n.id === ids[index])
  const via = flow.edges.find((e) => e.id === edgeIds[index])
  const next = flow.edges.find((e) => e.id === edgeIds[index + 1])
  const ViaIcon = TRIGGER_ICON[via?.data?.trigger ?? 'tap']
  const NextIcon = TRIGGER_ICON[next?.data?.trigger ?? 'tap']
  if (!node) return null
  return (
    <>
      <div className="cluster absolute top-3 left-3 z-10 flex h-bar items-center gap-2 px-pad text-ui">
        <span className="font-semibold">{flow.name}</span>
        <span className="text-fg-faint">Walkthrough · happy path</span>
      </div>
      <div className="absolute bottom-4 left-1/2 z-10 w-[min(560px,calc(100%-24px))] -translate-x-1/2">
        <div className="pop overflow-hidden rounded-[14px]">
          <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-ui text-fg-faint tabular">
                Step {index + 1} of {ids.length}
                {node.data.status && <span className={cn('flex items-center gap-1', STATUS[node.data.status].text)}>· {STATUS[node.data.status].label}</span>}
              </div>
              <div className="mt-0.5 truncate text-[15px] font-semibold tracking-[-0.01em]">{node.data.name}</div>
              {via && <div className="mt-1 flex items-center gap-1.5 text-ui text-fg-muted"><ViaIcon size={12} strokeWidth={1.5} />Arrived via {via.data?.label || via.data?.trigger}</div>}
              {node.data.notes && <p className="mt-1.5 text-title font-normal leading-relaxed text-fg-muted">{node.data.notes}</p>}
            </div>
            <IconButton icon={X} label="Exit walkthrough" shortcut="esc" tipSide="top" onClick={onExit} />
          </div>
          <div className="flex h-11 items-center gap-1 border-t border-line px-2">
            <IconButton icon={ChevronLeft} label="Previous step" shortcut="arrowleft" tipSide="top" disabled={index === 0} onClick={() => onStep(index - 1)} />
            {canPlay && <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Autoplay'} tipSide="top" onClick={onPlay} />}
            <div className="mx-2 flex flex-1 items-center gap-[3px]" role="progressbar" aria-valuemin={1} aria-valuemax={ids.length} aria-valuenow={index + 1}>
              {ids.map((id, i) => (
                <button key={id} type="button" aria-label={`Go to step ${i + 1}`} onClick={() => onStep(i)}
                  className={cn('h-1.5 flex-1 rounded-full transition-colors', i < index ? 'bg-signal/60' : i === index ? 'bg-signal' : 'bg-track hover:bg-line-strong')} />
              ))}
            </div>
            {next ? (
              <Button variant="primary" size="md" onClick={() => onStep(index + 1)} className="max-w-[200px]">
                <NextIcon size={13} strokeWidth={1.5} /><span className="truncate">{next.data?.label || 'Next'}</span><ChevronRight size={13} strokeWidth={1.75} />
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={onExit}>Finish</Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/** Start the walkthrough from anywhere (palette, toolbar). */
export function startWalkthrough() {
  const f = activeFlow()
  const path = happyPath(f.nodes, f.edges)
  if (path.length < 2) { toast('Nothing to walk through yet', { description: 'Connect a start point to at least one screen.' }); return }
  ui.setState({ walk: 0, walkNodes: path.map((p) => p.node), walkEdges: path.map((p) => p.via?.id ?? ''), sel: { nodes: [], edges: [] }, tool: 'select', draft: null, openComment: null })
  viewport.present?.(true)
}
