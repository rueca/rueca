import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useStore } from 'zustand'
import {
  ArrowDown, ArrowUp, Braces, ChevronUp, Code, Copy, Dices, Download, Eye, Film, FileCode, Gauge, Image as ImageIcon, Layers2, Pause, Play,
  Plus, RotateCcw, SkipBack, StepBack, StepForward, Trash2,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Section, Row, Stage, Slider, ScrubValue, Select, Menu, Button, IconButton,
  Divider, Empty, Monitor, ParamActions, CommandPalette, useValues, useHotkeys, useClock, useClockTime, shareMenuItems, equal, toast, fmtTime,
  createItemParams, bindItem, cn, type Command,
} from '@kit'
import { EffectStack, StackAddMenu, type StackAddGroup } from '@kit/ui/stack'
import { PresetGrid } from '@kit/ui/preset-grid'
import { BLENDS, CATEGORIES, LAYER_TYPES, type BlendMode, type Layer, type LayerType } from './layers'
import {
  addLayer, clock, duplicateLayer, getLayers, lookOf, moveBy, moveLayer, params, perf, randomise, removeLayer, ui, updateLayer, type Look,
} from './state'
import { ShaderStage, live, LEFT_W, RIGHT_W } from './ShaderStage'
import { copyShader, downloadShader, exportLoop, exportStill, renderThumb, sizeFor } from './output'

/* stable getters so the transport's Monitor never restarts its loop */
const fpsNow = () => (clock.getState().playing && params.values().speed > 0 ? perf.fps : 0)
const fpsFmt = (v: number) => (v ? `${Math.round(v)} fps` : 'idle')

const QUALITY = [{ value: 'auto', label: 'Auto' }, { value: '0.5', label: '50%' }, { value: '0.75', label: '75%' }, { value: '1', label: '100%' }] as const
const SPEEDS = [0, 0.25, 0.5, 1, 1.5, 2, 3]

const Mark = (
  <svg viewBox="0 0 16 16" width="11" height="11"><defs><linearGradient id="gs-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".35" /><stop offset="1" stopColor="currentColor" /></linearGradient></defs><rect x="2" y="2" width="12" height="12" rx="3.5" fill="url(#gs-mark)" /></svg>
)

/* proxy stores, one per layer type, bound to whichever layer is selected */
const proxies = {} as Record<LayerType, ReturnType<typeof createItemParams>>
const proxyFor = (t: LayerType) => (proxies[t] ??= createItemParams(LAYER_TYPES[t].schema, `shader-${t}`))

const useLayers = () => useValues(params, (v) => v.layers)
const useSelected = () => {
  const id = useStore(ui, (s) => s.selected)
  const layers = useLayers()
  return layers.find((l) => l.id === id) ?? null
}

export default function GradientStudio() {
  const client = useClientView()
  const layers = useLayers()
  const sel = useSelected()
  const presets = useStore(params, (s) => s.presets)
  const values = useValues(params)
  const activeLook = presets.find((p) => equal(lookOf(p.values as any), lookOf(values)))

  // Keep the selection valid through undo/redo.
  useEffect(() => { const id = ui.getState().selected; if (id && !layers.some((l) => l.id === id)) ui.setState({ selected: null }) }, [layers])

  const fw = useStore(ui, (s) => s.frameW)
  const fh = useStore(ui, (s) => s.frameH)
  const aspect = fw / Math.max(1, fh)
  const sizes = {
    x1: sizeFor(Math.max(fw, fh), aspect),
    x2: sizeFor(Math.max(fw, fh) * 2, aspect),
    k4: sizeFor(3840, aspect),
    v1080: sizeFor(1920, aspect),
    v4k: sizeFor(3840, aspect),
  }
  const still = (s: { w: number; h: number }) => () => exportStill(s.w, s.h)
  const loop = (s: { w: number; h: number }) => () => exportLoop(s.w, s.h, live.canvas)

  const applyLook = (name: string) => {
    const p = params.getState().presets.find((x) => x.name === name)
    if (!p) return
    ui.setState({ preview: null })
    params.patch(lookOf(p.values as any))
  }
  const saveLook = () => {
    const name = prompt('Name this look', `Look ${presets.filter((p) => !p.builtin).length + 1}`)
    if (name) toast(`Saved “${params.savePreset(name)}”`, { type: 'success' })
  }

  const sid = sel?.id
  const addGroups: StackAddGroup[] = CATEGORIES.map((cat) => ({
    label: cat,
    items: Object.values(LAYER_TYPES).filter((d) => d.category === cat).map((d) => ({ label: d.label, icon: d.icon, hint: d.hint, onClick: () => addLayer(d.type) })),
  }))

  const commands: Command[] = [
    { id: 'play', label: 'Play / pause', group: 'Playback', shortcut: 'space', icon: Play, run: () => clock.toggle() },
    { id: 'restart', label: 'Restart loop', group: 'Playback', shortcut: 'home', icon: SkipBack, run: () => clock.replay() },
    { id: 'prev', label: 'Previous frame', group: 'Playback', shortcut: ',', icon: StepBack, run: () => clock.step(-1) },
    { id: 'next', label: 'Next frame', group: 'Playback', shortcut: '.', icon: StepForward, run: () => clock.step(1) },
    { id: 'rand', label: 'Randomise colours & seed', group: 'Look', shortcut: 'r', icon: Dices, run: randomise },
    { id: 'save-look', label: 'Save current look…', group: 'Look', icon: Plus, run: saveLook },
    ...presets.map((p) => ({ id: `look-${p.name}`, label: `Look: ${p.name}`, group: 'Look', run: () => applyLook(p.name) })),
    ...Object.values(LAYER_TYPES).map((d) => ({ id: `add-${d.type}`, label: `Add ${d.label.toLowerCase()}`, group: 'Layers', icon: d.icon, keywords: [d.category, 'effect', 'layer'], run: () => addLayer(d.type) })),
    { id: 'dup', label: 'Duplicate layer', group: 'Layers', shortcut: 'mod+d', icon: Copy, run: () => sid && duplicateLayer(sid) },
    { id: 'del', label: 'Remove layer', group: 'Layers', shortcut: 'backspace', icon: Trash2, run: () => sid && removeLayer(sid) },
    { id: 'up', label: 'Move layer up', group: 'Layers', shortcut: 'mod+]', icon: ArrowUp, run: () => sid && moveBy(sid, -1) },
    { id: 'down', label: 'Move layer down', group: 'Layers', shortcut: 'mod+[', icon: ArrowDown, run: () => sid && moveBy(sid, 1) },
    { id: 'vis', label: 'Show / hide layer', group: 'Layers', shortcut: 'shift+mod+h', icon: Eye, run: () => sid && updateLayer(sid, (l) => ({ ...l, visible: !l.visible })) },
    { id: 'desel', label: 'Select document', group: 'Layers', shortcut: 'esc', run: () => ui.setState({ selected: null }) },
    ...([['free', 'Fill window'], ['16:9', '16:9'], ['1:1', 'Square'], ['9:16', '9:16']] as const).map(([a, l]) => ({ id: `aspect-${a}`, label: `Canvas: ${l}`, group: 'Canvas', run: () => params.setValue('aspect', a) })),
    ...QUALITY.map((q) => ({ id: `q-${q.value}`, label: `Resolution: ${q.label}`, group: 'Canvas', icon: Gauge, run: () => params.setValue('quality', q.value) })),
    { id: 'png1', label: `Export PNG 1× (${sizes.x1.w} × ${sizes.x1.h})`, group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: still(sizes.x1) },
    { id: 'png2', label: `Export PNG 2× (${sizes.x2.w} × ${sizes.x2.h})`, group: 'Export', icon: ImageIcon, run: still(sizes.x2) },
    { id: 'png4k', label: `Export PNG 4K (${sizes.k4.w} × ${sizes.k4.h})`, group: 'Export', shortcut: 'shift+mod+e', icon: ImageIcon, run: still(sizes.k4) },
    { id: 'vid', label: 'Export loop video 1080p', group: 'Export', icon: Film, run: loop(sizes.v1080) },
    { id: 'vid4k', label: 'Export loop video 4K', group: 'Export', icon: Film, run: loop(sizes.v4k) },
    { id: 'code', label: 'Copy shader code', group: 'Export', shortcut: 'shift+mod+c', icon: Code, run: copyShader },
    { id: 'code-dl', label: 'Download shader (.frag + .json)', group: 'Export', icon: FileCode, run: downloadShader },
    { id: 'reset', label: 'Reset everything', group: 'Values', icon: RotateCcw, run: () => params.reset() },
  ]

  // Number keys set the selected layer's opacity (Figma / Paper): 1 = 10% … 0 = 100%.
  useHotkeys(Object.fromEntries('1234567890'.split('').map((k, i) => [k, () => { const id = ui.getState().selected; if (id) updateLayer(id, (l) => ({ ...l, opacity: (i + 1) / 10 })) }])), [])

  // Client view (#/shader?client): the gradient full-bleed with a bottom sheet of looks, Shuffle
  // and Download, the same pattern as the Client demo. The landing's phone hero shows this.
  if (client) return (
    <Studio layout="overlay">
      <Stage fill>
        <ShaderStage />
      </Stage>
      <ClientSheet presets={presets} active={activeLook?.name} onApply={applyLook} onShuffle={randomise}
        onSave={() => exportStill(sizes.x2.w, sizes.x2.h).then(() => toast('Saved to downloads', { type: 'success' }))} />
    </Studio>
  )

  return (
    <Studio
      layout="overlay"
      leftWidth={LEFT_W}
      rightWidth={RIGHT_W}
      toolbar={
        <Toolbar
          start={<Brand name="Gradient studio" doc={activeLook?.name ?? 'Untitled look'} mark={Mark} />}
          center={
            <Cluster>
              <Button size="md" variant="ghost" onClick={randomise} title="Randomise colours and seed (R)"><Dices size={14} strokeWidth={1.5} />Randomise</Button>
              <IconButton icon={Code} label="Copy shader code" shortcut="shift+mod+c" onClick={copyShader} />
            </Cluster>
          }
          end={
            <>
              <Cluster><ParamActions params={params} presets={false} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: 'Still — rendered at size, not upscaled' },
                  { label: `PNG 1× · ${sizes.x1.w} × ${sizes.x1.h}`, icon: ImageIcon, shortcut: 'mod+e', onClick: still(sizes.x1) },
                  { label: `PNG 2× · ${sizes.x2.w} × ${sizes.x2.h}`, icon: ImageIcon, onClick: still(sizes.x2) },
                  { label: `PNG 4K · ${sizes.k4.w} × ${sizes.k4.h}`, icon: ImageIcon, shortcut: 'shift+mod+e', onClick: still(sizes.k4) },
                  { type: 'separator' },
                  { type: 'label', label: 'Video — one seamless loop, frame by frame' },
                  { label: `MP4 1080p · ${sizes.v1080.w} × ${sizes.v1080.h}`, icon: Film, onClick: loop(sizes.v1080) },
                  { label: `MP4 4K · ${sizes.v4k.w} × ${sizes.v4k.h}`, icon: Film, onClick: loop(sizes.v4k) },
                  { type: 'separator' },
                  { type: 'label', label: 'Code' },
                  { label: 'Copy shader + uniforms', icon: Code, shortcut: 'shift+mod+c', onClick: copyShader },
                  { label: 'Download .frag + .json', icon: FileCode, onClick: downloadShader },
                  { type: 'separator' },
                  { type: 'submenu', label: 'Share values', icon: Braces, items: shareMenuItems(params) },
                ]} />
            </>
          }
        />
      }
      left={
        <Panel header={
          <PanelHeader title="Layers">
            <StackAddMenu label="Add effect" groups={addGroups} />
          </PanelHeader>
        }>
          <EffectStack
            items={layers.map((l) => {
              const d = LAYER_TYPES[l.type]
              return { id: l.id, name: l.name, icon: d.icon, visible: l.visible, opacity: l.opacity, blend: d.kind === 'domain' ? undefined : l.blend, meta: d.kind === 'domain' ? 'Distort' : undefined }
            })}
            selected={sel?.id ?? null}
            onSelect={(id) => ui.setState({ selected: id })}
            label="Layers"
            onToggle={(id) => updateLayer(id, (l) => ({ ...l, visible: !l.visible }), true, 'Show / hide layer')}
            onOpacity={(id, v, final) => updateLayer(id, (l) => ({ ...l, opacity: v }), final, 'Layer opacity')}
            onBlend={(id, b) => updateLayer(id, (l) => ({ ...l, blend: b as BlendMode }), true, 'Blend mode')}
            blendOptions={BLENDS}
            onMove={moveLayer}
            onRemove={removeLayer}
            onDuplicate={duplicateLayer}
            onRename={(id, name) => updateLayer(id, (l) => ({ ...l, name }), true, 'Rename layer')}
            empty={<Empty icon={Layers2} title="No layers" hint="Start with a fill — a mesh gradient makes a good base." action={<Button size="md" variant="default" onClick={() => addLayer('mesh')}>Add mesh gradient</Button>} />}
          />
          <Looks presets={presets} active={activeLook?.name} onApply={applyLook} onSave={saveLook} />
        </Panel>
      }
      right={
        <Panel header={
          <PanelHeader title={sel ? <span className="flex min-w-0 items-center gap-1.5">{(() => { const I = LAYER_TYPES[sel.type].icon; return <I size={14} strokeWidth={1.5} className="shrink-0 text-signal" /> })()}<span className="truncate">{sel.name}</span></span> : 'Document'}>
            {sel && (
              <>
                <IconButton icon={Copy} label="Duplicate" shortcut="mod+d" size="icon-sm" onClick={() => duplicateLayer(sel.id)} />
                <IconButton icon={Trash2} label="Remove" shortcut="backspace" size="icon-sm" onClick={() => removeLayer(sel.id)} />
              </>
            )}
          </PanelHeader>
        }>
          {sel && <LayerInspector key={sel.type} layer={sel} />}
          <div className={sel ? 'border-t border-line' : undefined}>
            <Inspector params={params} folders={['canvas', 'time', 'render']} />
          </div>
        </Panel>
      }
      bottom={<Transport />}
    >
      <Stage fill>
        <ShaderStage />
      </Stage>
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: '1', label: 'Layer opacity 10% … (0 = 100%)' },
        { keys: '\\', label: 'A/B compare' },
        { keys: 'alt+arrowup', label: 'Move focused layer' },
        { keys: 'enter', label: 'Rename focused layer' },
      ]} />
    </Studio>
  )
}

/* ---------- inspector for the selected layer ---------- */
function LayerInspector({ layer }: { layer: Layer }) {
  const def = LAYER_TYPES[layer.type]
  const proxy = proxyFor(layer.type)
  useLayoutEffect(() => bindItem(proxy, {
    read: () => getLayers().find((l) => l.id === layer.id)?.params ?? null,
    write: (vals) => updateLayer(layer.id, (l) => ({ ...l, params: vals }), false),
    commit: (label) => params.commit(label ? `${layer.name} · ${label}` : undefined),
    subscribe: (fn) => params.subscribe(fn),
  }), [proxy, layer.id, layer.name])
  const set = (patch: Partial<Layer>, final = true) => updateLayer(layer.id, (l) => ({ ...l, ...patch }), final)
  const domain = def.kind === 'domain'
  return (
    <>
      <Section title="Layer" hint={def.hint} first>
        <Row label="Blend" hint={domain ? 'A distortion has no blend mode — it bends everything below it.' : 'How this layer combines with everything below it.'} changed={layer.blend !== def.blend} onReset={() => set({ blend: def.blend })}>
          {domain
            ? <span className="text-[11.5px] text-fg-faint">Distorts layers below</span>
            : <Select value={layer.blend} options={BLENDS} onChange={(b) => set({ blend: b as BlendMode })} label="Blend mode" />}
        </Row>
        <Row label={domain ? 'Mix' : 'Opacity'} hint={domain ? 'Blend between straight and fully warped coordinates.' : 'Number keys set it: 1 = 10%, 0 = 100%.'} changed={layer.opacity !== def.opacity} onReset={() => set({ opacity: def.opacity })}>
          <Slider value={layer.opacity} min={0} max={1} step={0.01} onChange={(n, f) => set({ opacity: n }, f)} label={domain ? 'Mix' : 'Opacity'} />
          <ScrubValue value={Math.round(layer.opacity * 100)} min={0} max={100} step={1} unit="%" changed={layer.opacity !== def.opacity} defaultValue={def.opacity * 100}
            className="w-[52px] shrink-0" onChange={(n, f) => set({ opacity: n / 100 }, f)} label="Opacity" />
        </Row>
      </Section>
      <div className="border-t border-line">
        <Inspector params={proxy} />
      </div>
    </>
  )
}

/* ---------- looks grid ---------- */
function Looks({ presets, active, onApply, onSave }: { presets: { name: string; values: any; builtin?: boolean }[]; active?: string; onApply: (n: string) => void; onSave?: () => void }) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const loopLen = useValues(params, (v) => v.loop)
  const key = useMemo(() => JSON.stringify(presets.map((p) => [p.name, lookOf(p.values)])), [presets])

  // Render thumbnails one per frame so opening the shell never janks.
  useEffect(() => {
    let cancelled = false
    let i = 0
    const next = () => {
      if (cancelled || i >= presets.length) return
      const p = presets[i++]
      try {
        const look = lookOf(p.values) as unknown as Look
        const url = renderThumb(look, loopLen)
        setThumbs((t) => (t[p.name] === url ? t : { ...t, [p.name]: url }))
      } catch { /* WebGL unavailable: tiles keep their shimmer */ }
      requestAnimationFrame(next)
    }
    const id = requestAnimationFrame(next)
    return () => { cancelled = true; cancelAnimationFrame(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loopLen])

  const preview = (name: string | null) => {
    const p = name ? presets.find((x) => x.name === name) : null
    ui.setState({ preview: p ? (lookOf(p.values) as unknown as Look) : null })
  }

  return (
    <div className="border-t border-line">
      <Section title="Looks" hint="Hover or focus to preview on the canvas, click to apply. Applying is one undo step." persistKey="shader:looks" first
        actions={onSave && <IconButton icon={Plus} label="Save current look" size="icon-sm" onClick={onSave} />}>
        <PresetGrid
          label="Looks"
          value={active ?? null}
          items={presets.map((p) => ({ id: p.name, name: p.name, thumb: thumbs[p.name], removable: !p.builtin }))}
          onApply={onApply}
          onPreview={preview}
          onRemove={(n) => params.deletePreset(n)}
        />
      </Section>
    </div>
  )
}

/* ---------- client view ---------- */
const useClientView = () => {
  const read = () => /[?&]client\b/.test(location.hash)
  const [on, setOn] = useState(read)
  useEffect(() => { const f = () => setOn(read()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  // bigger touch targets, as in the Client demo
  useEffect(() => { document.documentElement.dataset.density = on ? 'comfortable' : ''; return () => { document.documentElement.dataset.density = '' } }, [on])
  return on
}

function ClientSheet({ presets, active, onApply, onShuffle, onSave }: {
  presets: { name: string; values: any; builtin?: boolean }[]; active?: string; onApply: (n: string) => void; onShuffle: () => void; onSave: () => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className={cn('panel pointer-events-auto flex w-full max-w-[420px] flex-col overflow-hidden transition-[max-height] duration-300', open ? 'max-h-[62vh]' : 'max-h-[64px]')}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-[64px] flex-none items-center gap-3 px-4 text-left">
          <div className="flex-1">
            <div className="text-[14px] font-semibold">Make it yours</div>
            <div className="text-[12px] text-fg-muted">Pick a look, shuffle, download</div>
          </div>
          <ChevronUp size={18} strokeWidth={1.5} className={cn('text-fg-faint transition-transform', open && 'rotate-180')} />
        </button>
        <div className="min-h-0 overflow-y-auto">
          <Looks presets={presets} active={active} onApply={onApply} />
        </div>
        <div className="flex flex-none gap-2 border-t border-line p-3">
          <Button variant="default" size="lg" className="h-11 flex-1 text-[13px]" onClick={onShuffle}><Dices size={16} strokeWidth={1.5} />Shuffle</Button>
          <Button variant="primary" size="lg" className="h-11 flex-1 text-[13px]" onClick={onSave}><Download size={16} strokeWidth={1.5} />Download</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- compact transport + performance ---------- */
function Transport() {
  const playing = useClock(clock, (s) => s.playing)
  const duration = useClock(clock, (s) => s.duration)
  const t = useClockTime(clock, 30)
  const speed = useValues(params, (v) => v.speed)
  const quality = useValues(params, (v) => v.quality)
  return (
    <div className="pointer-events-none flex justify-center">
      <div className="cluster pointer-events-auto flex h-10 items-center gap-1 px-1.5">
        <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Play'} shortcut="space" tipSide="top" onClick={() => clock.toggle()} />
        <span className="w-[86px] text-center tabular text-[11.5px] text-fg">{fmtTime(t)}<span className="text-fg-faint"> / {fmtTime(duration)}</span></span>
        <div className="w-[150px] px-1">
          <Slider value={duration ? t / duration : 0} min={0} max={1} step={0.001} label="Loop position" onChange={(n) => clock.seek(n * duration)} />
        </div>
        <Menu side="top" align="center"
          trigger={<Button size="sm" variant="ghost" className="w-[44px] tabular" aria-label="Playback speed">{speed}×</Button>}
          items={[{ type: 'label', label: 'Speed' }, ...SPEEDS.map((s) => ({ label: s === 0 ? 'Frozen' : `${s}×`, checked: s === speed, onClick: () => params.setValue('speed', s) }))]} />
        <Divider vertical />
        <div className="w-[104px]" title="Frame rate">
          <Monitor get={fpsNow} graph min={0} max={75} fmt={fpsFmt} />
        </div>
        <Menu side="top" align="end"
          trigger={<Button size="sm" variant="ghost" className="gap-1" aria-label="Drawing resolution"><Gauge size={13} strokeWidth={1.5} />{QUALITY.find((q) => q.value === quality)?.label}{quality === 'auto' && perf.scale < 0.99 && <span className="tabular text-fg-faint">{Math.round(perf.scale * 100)}%</span>}</Button>}
          items={[
            { type: 'label', label: 'Drawing resolution' },
            ...QUALITY.map((q) => ({ label: q.value === 'auto' ? 'Auto — hold the frame rate' : q.label, checked: q.value === quality, onClick: () => params.setValue('quality', q.value) })),
          ]} />
      </div>
    </div>
  )
}
