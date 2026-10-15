/* Scene — a product configurator. The artifact is vanilla three.js (viewport.ts)
   mounted through <MountSurface>; everything here is chrome. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import {
  Box, Braces, Camera, Circle, CircleDot, Cylinder, Disc, Download, Focus, Grid3x3, Image as ImageIcon, ImageDown, Lightbulb,
  MousePointer2, Move3d, Orbit, Package, Plus, Rotate3d, Scale3d, SquareDashed, Spotlight, Sun, Video, X, Eye, EyeOff, ChevronDown, FileBox,
} from 'lucide-react'
import { Vec3Fields,
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, PanelTabs, Inspector, SettingsMenu, Section, Row, Stage, MountSurface, ParamActions, Menu,
  Button, IconButton, CommandPalette, ToolDock, LayerTree, Badge, Swatch, Divider, Kbd, Tip, toast, download, copyText, stamp,
  useParamState, useSafeArea, useStudio, equal, shareMenuItems, cn, type Command, type LayerItem, type MenuItem,
} from '@kit'
import { AxisGizmo } from '@kit/stage/overlays'
import {
  params, ui, OBJ, COLOURWAYS, BUILTIN_VIEWS, LIGHTS, colourwayOf, nameOf, allViews, type V, type Tool, type View, type Vec3,
} from './state'
import { mountViewport, type EngineApi } from './viewport'
import { SwatchTiles } from './local/SwatchTiles'

/* The three.js viewport is reached through MountSurface's handle — no module-level engine.
   `ui.ready` flips when it mounts so the chrome re-renders and the ref is current. */
type Viewport = { el: HTMLDivElement | null; handle: (EngineApi & { dispose: () => void }) | null }
const viewport: { current: Viewport | null } = { current: null }
const engine = () => viewport.current?.handle ?? null

const LEFT_W = 248
const RIGHT_W = 304

const MESH_ICON: Record<string, typeof Box> = { speaker: Package, body: Cylinder, cap: Circle, ring: CircleDot, base: Disc, pedestal: Cylinder, floor: SquareDashed, camera: Video }
const LIGHT_ICON = { directional: Sun, spot: Spotlight, point: Lightbulb }
const iconOf = (id: string, v: V) => (OBJ[id].kind === 'light' ? LIGHT_ICON[v[`${id}_ltype`] as keyof typeof LIGHT_ICON] : MESH_ICON[id]) ?? Box
const kindLabel = (id: string, v: V) => {
  const k = OBJ[id].kind
  if (k === 'light') return `${String(v[`${id}_ltype`]).replace(/^./, (c) => c.toUpperCase())} light`
  return { group: 'Group', mesh: 'Mesh', floor: 'Shadow catcher', camera: 'Camera' }[k] ?? k
}
const swatchOptions = COLOURWAYS.map((c) => ({ value: c.id, label: c.name, colors: [c.values.body_color, c.values.cap_color, c.values.pedestal_color] }))
const applyColourway = (id: string) => {
  const c = COLOURWAYS.find((x) => x.id === id)
  if (!c) return
  params.patch(c.values)
  ui.setState({ preview: null })
}
const cycleColourway = (d: number) => {
  const cur = colourwayOf(params.values())
  const i = COLOURWAYS.findIndex((c) => c.id === cur)
  const next = COLOURWAYS[(i + d + COLOURWAYS.length) % COLOURWAYS.length]
  applyColourway(next.id)
  toast(`Colourway: ${next.name}`)
}

/* --- exports --------------------------------------------------------------- */
const cwName = () => colourwayOf(params.values()) ?? 'custom'
async function exportPNG(transparent = false) {
  const e = engine()
  if (!e) return
  const id = toast('Rendering at 2×…', { type: 'loading' })
  try {
    const blob = await e.render({ scale: 2, transparent })
    download(blob, `aura-${cwName()}${transparent ? '-alpha' : ''}-${stamp()}.png`)
    toast.update(id, 'PNG rendered', { type: 'success', description: transparent ? 'Transparent background, 2×' : '2× the visible viewport' })
  } catch { toast.update(id, 'Render failed', { type: 'error' }) }
}
async function exportGLB() {
  const e = engine()
  if (!e) return
  try {
    download(await e.glb(), `aura-${cwName()}.glb`)
    toast('GLB exported', { type: 'success', description: 'Speaker, pedestal and lights' })
  } catch { toast('GLB export failed', { type: 'error' }) }
}
async function copyCamera() {
  const e = engine()
  if (!e) return
  await copyText(JSON.stringify(e.cameraJSON(), null, 2))
  toast('Camera copied as JSON', { type: 'success' })
}

/* --- views ----------------------------------------------------------------- */
function goView(v: View) {
  engine()?.goTo({ position: v.position, target: v.target })
  ui.setState({ activeView: v.id })
}
function saveView() {
  const e = engine()
  if (!e) return
  const n = ui.getState().views.length + 1
  const v: View = { id: `v${Date.now().toString(36)}`, name: `View ${n}`, ...e.pose() }
  ui.setState((s) => ({ views: [...s.views, v], activeView: v.id }))
  toast(`Saved “${v.name}”`, { type: 'success', description: `Press ${BUILTIN_VIEWS.length + n} to return to it` })
}
let thumbTimer = 0
function refreshThumbs(delay = 500) {
  clearTimeout(thumbTimer)
  thumbTimer = window.setTimeout(async () => {
    const e = engine()
    if (!e) return
    const thumbs = await e.thumbnails(allViews())
    ui.setState({ thumbs })
  }, delay)
}

/* ========================================================================== */
export default function SceneShell() {
  const [tab, setTab] = useState<'outliner' | 'views'>('outliner')
  const selected = useStore(ui, (s) => s.selected)
  const tool = useStore(ui, (s) => s.tool)
  const views = useStore(ui, (s) => s.views)
  const ready = useStore(ui, (s) => s.ready)
  const v = useParamState(params, (s) => s.values) as V
  const cw = colourwayOf(v)

  useEffect(() => {
    if (!ready) return
    refreshThumbs(250)
    const off = params.onCommit(() => refreshThumbs())
    return () => { off(); clearTimeout(thumbTimer) }
  }, [ready])
  useEffect(() => { refreshThumbs(50) }, [views])

  const setTool = (t: Tool) => ui.setState({ tool: t })
  const toggle = (k: string) => params.setValue(k, !params.values()[k])
  const select = (id: string | null) => ui.setState({ selected: id })

  const commands: Command[] = useMemo(() => {
    const all = allViews()
    return [
      { id: 'select', label: 'Select tool', group: 'Tools', shortcut: 'v', icon: MousePointer2, run: () => setTool('select') },
      { id: 'move', label: 'Move', group: 'Tools', shortcut: 'w', icon: Move3d, run: () => setTool('translate') },
      { id: 'rotate', label: 'Rotate', group: 'Tools', shortcut: 'e', icon: Rotate3d, run: () => setTool('rotate') },
      { id: 'scale', label: 'Scale', group: 'Tools', shortcut: 'r', icon: Scale3d, run: () => setTool('scale') },
      { id: 'deselect', label: 'Deselect (scene settings)', group: 'Selection', shortcut: 'esc', run: () => select(null) },
      { id: 'hide', label: 'Hide / show selection', group: 'Selection', shortcut: 'h', icon: EyeOff, run: () => { const s = ui.getState().selected; if (s && OBJ[s].kind !== 'camera') toggle(`${s}_visible`) } },
      { id: 'frame', label: 'Frame selection', group: 'View', shortcut: 'f', icon: Focus, run: () => engine()?.frame() },
      { id: 'proj', label: 'Toggle perspective / orthographic', group: 'View', shortcut: 'm', icon: Box, run: () => params.setValue('projection', params.values().projection === 'perspective' ? 'orthographic' : 'perspective') },
      { id: 'grid', label: 'Toggle grid floor', group: 'View', shortcut: 'g', icon: Grid3x3, run: () => toggle('grid') },
      { id: 'turntable', label: 'Toggle turntable', group: 'View', shortcut: 'o', icon: Orbit, run: () => toggle('turntable') },
      { id: 'save-view', label: 'Save current view', group: 'View', shortcut: 'shift+v', icon: Plus, run: saveView },
      ...all.slice(0, 9).map((x, i) => ({ id: `view-${x.id}`, label: `Go to view: ${x.name}`, group: 'Views', shortcut: String(i + 1), icon: Camera, run: () => goView(x) })),
      ...COLOURWAYS.map((c) => ({ id: `cw-${c.id}`, label: `Colourway: ${c.name}`, group: 'Colourways', icon: Circle, run: () => applyColourway(c.id) })),
      { id: 'cw-next', label: 'Next colourway', group: 'Colourways', shortcut: ']', run: () => cycleColourway(1) },
      { id: 'cw-prev', label: 'Previous colourway', group: 'Colourways', shortcut: '[', run: () => cycleColourway(-1) },
      ...['speaker', 'body', 'cap', 'ring', 'base', 'pedestal', ...LIGHTS, 'camera'].map((id) => ({ id: `sel-${id}`, label: `Select ${nameOf(id)}`, group: 'Selection', keywords: ['outliner'], run: () => select(id) })),
      { id: 'png', label: 'Render PNG (2×)', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: () => exportPNG(false) },
      { id: 'png-alpha', label: 'Render PNG, transparent (2×)', group: 'Export', icon: ImageDown, run: () => exportPNG(true) },
      { id: 'glb', label: 'Export GLB', group: 'Export', shortcut: 'shift+mod+e', icon: FileBox, run: exportGLB },
      { id: 'cam', label: 'Copy camera as JSON', group: 'Export', shortcut: 'shift+mod+c', icon: Braces, run: copyCamera },
      { id: 'reset', label: 'Reset the whole scene', group: 'Values', run: () => params.reset() },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views])

  const exportItems: MenuItem[] = [
    { type: 'label', label: 'Render' },
    { label: 'PNG at 2×', icon: ImageIcon, shortcut: 'mod+e', onClick: () => exportPNG(false) },
    { label: 'PNG at 2×, transparent', icon: ImageDown, onClick: () => exportPNG(true) },
    { type: 'separator' },
    { type: 'label', label: 'Hand-off' },
    { label: 'GLB model', icon: FileBox, shortcut: 'shift+mod+e', onClick: exportGLB },
    { label: 'Copy camera JSON', icon: Braces, shortcut: 'shift+mod+c', onClick: copyCamera },
    { type: 'separator' },
    ...shareMenuItems(params),
  ]

  const mark = (
    <svg viewBox="0 0 16 16" width="11" height="11"><path d="M8 1.8 13.5 5v6L8 14.2 2.5 11V5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M2.8 5.2 8 8.2l5.2-3M8 8.2v5.8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
  )

  return (
    <Studio
      layout="overlay"
      leftWidth={LEFT_W}
      rightWidth={RIGHT_W}
      toolbar={
        <Toolbar
          start={<Brand name="Scene" doc="Campana hand bell" mark={mark} />}
          center={
            <Cluster className="gap-1.5 pr-2 pl-3">
              <span className="text-[11.5px] text-fg-muted">Colourway</span>
              <SwatchTiles size="sm" value={cw} options={swatchOptions} onChange={applyColourway} onPreview={(p) => ui.setState({ preview: p })} label="Colourway" />
            </Cluster>
          }
          end={
            <>
              <Cluster><SettingsMenu params={params} /><ParamActions params={params} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={
        <Panel header={<PanelHeader><PanelTabs value={tab} onChange={setTab} tabs={[{ value: 'outliner', label: 'Outliner' }, { value: 'views', label: 'Views' }]} /></PanelHeader>}>
          {tab === 'outliner' ? <Outliner v={v} selected={selected} /> : <ViewsPanel />}
        </Panel>
      }
      right={
        <Panel header={<InspectorHeader id={selected} v={v} />}>
          {selected ? <SelectionInspector key={selected} id={selected} v={v} /> : <SceneSettings v={v} cw={cw} />}
        </Panel>
      }
    >
      <Stage
        fill
        overlay={
          <Hud>
            <ViewChip v={v} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <ToolDock<Tool>
                value={tool}
                onChange={setTool}
                tools={[
                  { value: 'select', label: 'Select', icon: MousePointer2, shortcut: 'v' },
                  { value: 'translate', label: 'Move', icon: Move3d, shortcut: 'w' },
                  { value: 'rotate', label: 'Rotate', icon: Rotate3d, shortcut: 'e' },
                  { value: 'scale', label: 'Scale', icon: Scale3d, shortcut: 'r' },
                ]}
              >
                <Divider vertical className="mx-1" />
                <IconButton tipSide="top" icon={Box} label={v.projection === 'perspective' ? 'Switch to orthographic' : 'Switch to perspective'} shortcut="m" active={v.projection === 'orthographic'}
                  onClick={() => params.setValue('projection', v.projection === 'perspective' ? 'orthographic' : 'perspective')} className="size-8 rounded-[8px]" />
                <IconButton tipSide="top" icon={Grid3x3} label="Grid floor" shortcut="g" active={!!v.grid} onClick={() => toggle('grid')} className="size-8 rounded-[8px]" />
                <IconButton tipSide="top" icon={Orbit} label="Turntable" shortcut="o" active={!!v.turntable} onClick={() => toggle('turntable')} className="size-8 rounded-[8px]" />
                <IconButton tipSide="top" icon={Focus} label="Frame selection" shortcut="f" onClick={() => engine()?.frame()} className="size-8 rounded-[8px]" />
              </ToolDock>
            </div>
            <AxisGizmoSlot />
            <Stats />
          </Hud>
        }
      >
        <MountSurface params={params} ref={viewport} mount={(el) => mountViewport(el)} />
      </Stage>
      <CommandPalette
        commands={commands}
        extraShortcuts={[
          { keys: 'mod+click', label: 'Select a part inside a group' },
          { keys: 'alt+drag', label: 'Orbit (drag on empty space also orbits)' },
          { keys: '\\', label: 'A/B compare' },
        ]}
      />
    </Studio>
  )
}

/* --- viewport HUD ---------------------------------------------------------- */
/* The HUD box: the stage area no floating panel covers (kit useSafeArea), plus a gutter.
   Its insets go to the viewport, which shifts the camera's projection centre into it. */
function Hud({ children }: { children: ReactNode }) {
  const safe = useSafeArea()
  const { present } = useStudio()
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = el.current
    const parent = node?.offsetParent as HTMLElement | null
    if (!node || !parent) return
    const report = () => {
      const a = parent.getBoundingClientRect(), b = node.getBoundingClientRect()
      const next = { l: b.left - a.left, r: a.right - b.right, t: b.top - a.top, b: a.bottom - b.bottom }
      const cur = ui.getState().insets
      if (cur.l !== next.l || cur.r !== next.r || cur.t !== next.t || cur.b !== next.b) ui.setState({ insets: next })
    }
    const ro = new ResizeObserver(report)
    ro.observe(node)
    ro.observe(parent)
    report()
    return () => ro.disconnect()
  }, [present, safe.left, safe.right, safe.top, safe.bottom])
  // the kit Stage unmounts its overlay in present mode (⌘\) — give the viewport its full width back
  useEffect(() => () => ui.setState({ insets: { l: 0, r: 0, t: 0, b: 0 } }), [])
  const g = 'var(--gutter)'
  return (
    <div ref={el} className="pointer-events-none absolute [&>*]:pointer-events-auto"
      style={{ left: `calc(${safe.left}px + ${g})`, right: `calc(${safe.right}px + ${g})`, top: `calc(${safe.top}px + ${g})`, bottom: `calc(${safe.bottom}px + ${g})` }}>
      {children}
    </div>
  )
}

function AxisGizmoSlot() {
  const ready = useStore(ui, (s) => s.ready)
  // re-subscribe once the viewport handle exists
  const subscribe = useCallback((fn: (m: ArrayLike<number>) => void) => engine()?.onCamera(fn) ?? (() => {}), [ready]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="absolute right-1 bottom-1">
      <AxisGizmo subscribe={subscribe} onSnap={(a) => engine()?.snapAxis(a)} />
    </div>
  )
}

function ViewChip({ v }: { v: V }) {
  const active = useStore(ui, (s) => s.activeView)
  const views = useStore(ui, (s) => s.views)
  const all = [...BUILTIN_VIEWS, ...views]
  const cur = all.find((x) => x.id === active)
  return (
    <div className="cluster absolute top-0 left-0 flex h-8 items-center gap-0.5 px-1">
      <span className="px-1.5 text-[11.5px] text-fg-muted">{v.projection === 'perspective' ? `Perspective · ${v.fov}°` : 'Orthographic'}</span>
      <Divider vertical />
      <Menu
        items={[
          { type: 'label', label: 'Camera views' },
          ...all.map((x, i) => ({ label: x.name, checked: x.id === active, shortcut: i < 9 ? String(i + 1) : undefined, onClick: () => goView(x) })),
          { type: 'separator' },
          { label: 'Save current view', icon: Plus, shortcut: 'shift+v', onClick: saveView },
          { label: 'Copy camera JSON', icon: Braces, onClick: copyCamera },
        ]}
        trigger={<Button size="sm" className="gap-1"><Camera size={13} strokeWidth={1.5} />{cur?.name ?? 'Free camera'}<ChevronDown size={12} className="text-fg-faint" /></Button>}
      />
    </div>
  )
}

function Stats() {
  const s = useStore(ui, (x) => x.stats)
  return (
    // top-right: bottom-left collided with the tool dock on stages ≤1280px wide (break-it F5)
    <div className="pointer-events-none absolute top-0 right-0 h-8 max-w-[calc(100%-220px)] truncate leading-8 text-[11px] tabular text-fg-faint no-select">
      {(s.tris / 1000).toFixed(1)}k triangles · {s.meshes} meshes · {s.lights} lights
    </div>
  )
}

/* --- left: outliner + views ------------------------------------------------ */
function Outliner({ v, selected }: { v: V; selected: string | null }) {
  const names = useStore(ui, (s) => s.names)
  const item = (id: string, children?: LayerItem[]): LayerItem => {
    const kind = OBJ[id].kind
    return {
      id,
      name: names[id] ?? OBJ[id].name,
      icon: iconOf(id, v),
      visible: v[`${id}_visible`] !== false,
      locked: !!v[`${id}_locked`],
      meta: kind === 'mesh' ? <Swatch color={v[`${id}_color`]} size={12} className="rounded-full" /> : kind === 'light' ? <Swatch color={v[`${id}_lcolor`]} size={12} className="rounded-full" /> : undefined,
      children,
    }
  }
  const objects = [item('speaker', ['body', 'cap', 'ring', 'base'].map((id) => item(id))), item('pedestal'), item('floor')]
  const lights = LIGHTS.map((id) => item(id))
  const sel = selected ? [selected] : []
  const onSelect = (ids: string[]) => ui.setState({ selected: ids.at(-1) ?? null })
  const onToggle = (id: string, prop: 'visible' | 'locked') => { const k = `${id}_${prop}`; params.setValue(k, !params.values()[k]) }
  const onRename = (id: string, name: string) => ui.setState((s) => ({ names: { ...s.names, [id]: name } }))
  const head = (t: string) => <div className="px-3 pt-2.5 pb-0.5 text-[11px] text-fg-faint no-select">{t}</div>
  return (
    <div className="pb-2">
      {head('Objects')}
      <LayerTree items={objects} selected={sel} onSelect={onSelect} onToggle={onToggle} onRename={onRename} className="py-0" />
      {head('Lights')}
      <LayerTree items={lights} selected={sel} onSelect={onSelect} onToggle={onToggle} onRename={onRename} className="py-0" />
      {head('Camera')}
      {/* No onToggle: a camera has nothing to hide or lock. */}
      <LayerTree items={[{ id: 'camera', name: 'Camera', icon: Video, meta: <span className="tabular">{v.projection === 'perspective' ? `${v.fov}°` : 'Ortho'}</span> }]} selected={sel} onSelect={onSelect} className="py-0" />
    </div>
  )
}

function ViewsPanel() {
  const views = useStore(ui, (s) => s.views)
  const thumbs = useStore(ui, (s) => s.thumbs)
  const active = useStore(ui, (s) => s.activeView)
  const all = [...BUILTIN_VIEWS, ...views]
  return (
    <div className="flex flex-col gap-2 p-2.5">
      <Button variant="default" size="md" className="w-full" onClick={saveView}><Plus size={14} strokeWidth={1.5} />Save current view</Button>
      <div className="grid grid-cols-2 gap-2">
        {all.map((x, i) => (
          <div key={x.id} className="group/view relative">
            <button
              type="button"
              onClick={() => goView(x)}
              className={cn('flex w-full flex-col gap-1 rounded-[8px] p-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
                active === x.id ? 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--signal)]' : 'hover:bg-hover')}
            >
              <div className="aspect-[176/112] w-full overflow-hidden rounded-[5px] bg-control">
                {thumbs[x.id] && <img src={thumbs[x.id]} alt="" className="size-full object-cover" />}
              </div>
              <div className="flex items-center gap-1 px-0.5">
                <span className={cn('min-w-0 flex-1 truncate text-[11.5px]', active === x.id ? 'text-fg' : 'text-fg-muted')}>{x.name}</span>
                {i < 9 && <Kbd>{i + 1}</Kbd>}
              </div>
            </button>
            {!x.builtin && (
              <button type="button" aria-label={`Delete ${x.name}`}
                onClick={() => ui.setState((s) => ({ views: s.views.filter((y) => y.id !== x.id) }))}
                className="absolute top-2 right-2 hidden size-6 items-center justify-center rounded-full bg-black/60 text-white group-focus-within/view:flex group-hover/view:flex">
                <X size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
      {views.length === 0 && <p className="px-1 pt-1 text-[11.5px] leading-relaxed text-fg-faint">Orbit to a framing you like and save it. Saved views get a number key and survive reloads.</p>}
    </div>
  )
}

/* --- right: inspector ------------------------------------------------------ */
function InspectorHeader({ id, v }: { id: string | null; v: V }) {
  if (!id) return <PanelHeader title="Scene"><Badge>No selection</Badge></PanelHeader>
  const Icon = iconOf(id, v)
  const hideable = OBJ[id].kind !== 'camera'
  const hidden = v[`${id}_visible`] === false
  return (
    <PanelHeader>
      <Icon size={14} strokeWidth={1.5} className="shrink-0 text-signal" />
      <div className="ml-1 min-w-0 flex-1 truncate text-[12px] font-semibold">{nameOf(id)}</div>
      <Badge>{kindLabel(id, v)}</Badge>
      {hideable && <IconButton size="icon-sm" icon={hidden ? EyeOff : Eye} label={hidden ? 'Show' : 'Hide'} shortcut="h" onClick={() => params.setValue(`${id}_visible`, hidden)} />}
      <IconButton size="icon-sm" icon={X} label="Deselect" shortcut="esc" onClick={() => ui.setState({ selected: null })} />
    </PanelHeader>
  )
}

function SceneSettings({ v, cw }: { v: V; cw: string | null }) {
  return (
    <>
      <Section title="Colourway" first>
        <div className="px-3 pt-0.5 pb-1">
          <SwatchTiles value={cw} options={swatchOptions} onChange={applyColourway} onPreview={(p) => ui.setState({ preview: p })} label="Colourway" />
        </div>
        <p className="px-3 pt-1 text-[11px] leading-relaxed text-fg-faint">
          {cw ? 'Colourways change materials and background only — transforms and lights stay put.' : 'Custom colours. Pick a colourway to snap back to a defined variant.'}
        </p>
      </Section>
      <div className="border-t border-line"><Inspector params={params} folders={['look', 'env', 'render']} /></div>
      <Section title="Selection">
        <p className="px-3 text-[11.5px] leading-relaxed text-fg-muted">
          Click the product to select it, click again to select a part. <Kbd>W</Kbd> <Kbd>E</Kbd> <Kbd>R</Kbd> switch the gizmo; <Kbd>F</Kbd> frames it. {v.turntable ? 'Turntable is on.' : ''}
        </p>
      </Section>
    </>
  )
}

function SelectionInspector({ id, v }: { id: string; v: V }) {
  const kind = OBJ[id].kind
  if (kind === 'camera')
    return (
      <>
        <Inspector params={params} folders={['camera']} />
        <Section title="Views">
          <div className="flex flex-col gap-px">
            {allViews().map((x, i) => (
              <Row key={x.id} label={x.name} trailing={i < 9 ? <Kbd>{i + 1}</Kbd> : undefined}>
                <Button size="sm" variant="default" className="ml-auto" onClick={() => goView(x)}>Go</Button>
              </Row>
            ))}
          </div>
          <div className="flex gap-1.5 px-3 pt-2">
            <Button size="md" variant="default" className="flex-1" onClick={saveView}><Plus size={13} strokeWidth={1.5} />Save view</Button>
            <Button size="md" variant="default" className="flex-1" onClick={copyCamera}><Braces size={13} strokeWidth={1.5} />Copy JSON</Button>
          </div>
        </Section>
      </>
    )
  if (kind === 'floor') return <Inspector params={params} folders={['floor']} />
  return (
    <>
      <TransformSection id={id} v={v} positionOnly={kind === 'light'} />
      {kind === 'mesh' && <div className="border-t border-line"><Inspector params={params} folders={[`${id}_mat`]} /></div>}
      {kind === 'light' && (
        <>
          <div className="border-t border-line"><Inspector params={params} folders={[`${id}_light`]} /></div>
          <p className="px-3 pb-3 text-[11px] leading-relaxed text-fg-faint">Spot and directional lights always aim at the product, so moving one re-angles it.</p>
        </>
      )}
      {kind === 'group' && (
        <Section title="Parts">
          {['body', 'cap', 'ring', 'base'].map((c) => {
            const Icon = iconOf(c, v)
            return (
              <button key={c} type="button" onClick={() => ui.setState({ selected: c })}
                className="mx-1.5 flex h-7 items-center gap-2 rounded-[6px] px-2 text-left text-[12px] text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
                <Icon size={14} strokeWidth={1.5} className="text-fg-faint" />
                <span className="flex-1 truncate">{nameOf(c)}</span>
                <Swatch color={v[`${c}_color`]} size={12} className="rounded-full" />
                <span className="text-[11px] text-fg-faint">{String(v[`${c}_mtype`]).replace(/^./, (x) => x.toUpperCase())}</span>
              </button>
            )
          })}
        </Section>
      )}
    </>
  )
}

function TransformSection({ id, v, positionOnly }: { id: string; v: V; positionOnly?: boolean }) {
  const defaults = params.getState().defaults as V
  const keys = positionOnly ? [`${id}_pos`] : [`${id}_pos`, `${id}_rot`, `${id}_scale`]
  const changed = keys.some((k) => !equal(v[k], defaults[k]))
  const row = (k: string, label: string, o: { step: number; unit?: string; lockable?: boolean; min?: number }) => {
    const ch = !equal(v[k], defaults[k])
    return (
      <Row key={k} label={label} changed={ch} onReset={() => params.reset([k])} hint={o.lockable ? 'Double-click the label to reset. The chain keeps proportions.' : 'Double-click the label to reset.'}>
        <Vec3Fields value={v[k] as Vec3} defaultValue={defaults[k] as Vec3} step={o.step} unit={o.unit} min={o.min} lockable={o.lockable} changed={ch} label={label}
          onChange={(nv, final) => params.setValue(k, nv, { commit: final })} />
      </Row>
    )
  }
  const locked = !!v[`${id}_locked`]
  return (
    <Section title="Transform" first changed={changed} onReset={changed ? () => params.reset(keys) : undefined}
      actions={locked ? <Tip label="Locked in the outliner — the gizmo is off"><span><Badge>Locked</Badge></span></Tip> : undefined}>
      {row(`${id}_pos`, 'Position', { step: 0.01 })}
      {!positionOnly && row(`${id}_rot`, 'Rotation', { step: 1, unit: '°' })}
      {!positionOnly && row(`${id}_scale`, 'Scale', { step: 0.01, lockable: true, min: 0.01 })}
    </Section>
  )
}
