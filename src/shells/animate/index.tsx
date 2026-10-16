import '@fontsource/la-belle-aurore/latin-400.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight, ArrowRight, Braces, Circle, CircleDot, ClipboardPaste, Code, Copy, Diamond, Download, Ellipsis, Film, Image as ImageIcon, Layers,
  Magnet, MousePointer2, Pause, PenTool, Play, Plus, Repeat, RotateCcw, SkipBack, Square, StepBack, StepForward, Trash2, Type, Workflow, Zap, Group,
  CopyPlus,
} from 'lucide-react'
import {
  Brand, Button, Cluster, CommandPalette, Divider, Empty, IconButton, LayerTree, Menu, Panel, PanelHeader, PanelTabs, ParamActions,
  Section, Segmented, Stage, Studio, Tip, Toolbar, cn, copyText, download, exportJSON, fmtTime, recordFrames, shareMenuItems, toast, useClock, useClockTime, useHotkeys, useValues,
  type Command, type LayerItem, type MenuItem, NoteLayer,
} from '@kit'
import { KeyTimeline, type KeyLane } from '@kit/timeline/KeyTimeline'
import { KeyButton, KeyDiamond } from '@kit/ui/key-button'
import { EaseGlyph, EasingEditor } from '@kit/ui/easing'
import { PROPS, PROPS_FOR, childrenOf, keyAt, objHasKeys, resolve, toCSSKeyframes, trackKey, type Anim, type Obj, type PropKey } from './engine'
import { CIELO, drawCanvas, inlineImages, loadImages } from './demo'
import { LiveScene } from './SceneView'
import { AnimInspector } from './AnimInspector'
import { InputsList, StateMachineGraph, TransitionsList } from './local/StateMachinePanel'
import {
  addAnim, addKeysAtPlayhead, animTime, clock, doc as docStore, commitPending, copyKeys, currentAnim, deleteAnim, deleteKeys, editProps, findKey, getDoc,
  history, moveKeys, nudgeKeys, params, pasteKeys, patchObject, reorderObject, runtime, seek, setDoc, setEase, toAnimTime, toggleKey, ui, updateAnim,
  useDoc, useUI,
} from './store'
import { demoDoc } from './demo'
import { ENTRY_TOP } from './local/PlateEntry'

const KIND_ICON = { group: Group, rect: Square, ellipse: Circle, path: PenTool, text: Type, image: ImageIcon }
const LOOP_ICON = { loop: Repeat, once: ArrowRight, pingpong: ArrowLeftRight }

const fmtVal = (p: PropKey, v: unknown) => {
  const d = PROPS[p]
  if (d.type === 'color') return String(v).slice(0, 7).toUpperCase()
  const n = Number(v)
  return d.fmt ? d.fmt(n) : `${Math.round(n * 10) / 10}${d.unit ?? ''}`
}

/* ---------- transport (inside the timeline header) ---------- */
function Transport() {
  const playing = useClock(clock, (s) => s.playing)
  const fps = useClock(clock, (s) => s.fps)
  const t = useClockTime(clock, 30)
  const doc = useDoc()
  const anim = currentAnim(doc)
  const anims = doc.anims
  const autoKey = useUI((s) => s.autoKey)
  const preview = useUI((s) => s.preview)
  const smState = useUI((s) => s.smState)
  const v = useValues(params)
  const [frames, setFrames] = useState(false)
  const at = toAnimTime(t)
  const keySel = useUI((s) => s.keySel)
  return (
    <>
      <IconButton icon={SkipBack} label="Go to start" shortcut="home" tipSide="top" onClick={() => seek(0)} />
      <IconButton icon={StepBack} label="Previous frame" shortcut="," tipSide="top" onClick={() => { clock.step(-1) }} />
      <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Play'} shortcut="space" tipSide="top" variant="default" onClick={() => clock.toggle()} />
      <IconButton icon={StepForward} label="Next frame" shortcut="." tipSide="top" onClick={() => clock.step(1)} />
      {preview ? (
        <span className="ml-1 flex h-icon items-center gap-1.5 px-2 text-ui text-fg"><span className="size-1.5 animate-pulse rounded-full bg-ok" />Live · {anims.find((x) => x.id === smState)?.name ?? '—'}</span>
      ) : <button type="button" onClick={() => setFrames(!frames)} title="Click to switch seconds / frames"
        className={cn('ml-1 flex h-icon items-center rounded-control px-2 tabular text-ui outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', autoKey ? 'text-rec' : 'text-fg')}>
        <span className="flex items-baseline gap-1">
          {frames ? `f${Math.round((at / 1000) * fps)}` : fmtTime(at)}
          <span className="text-ui text-fg-faint">/ {frames ? `f${Math.round((anim.duration / 1000) * fps)}` : fmtTime(anim.duration)}</span>
        </span>
      </button>}
      <div className="ml-1 w-[96px]">
        <Segmented iconOnly label="Loop mode" value={anim.loop} onChange={(l) => updateAnim({ loop: l as Anim['loop'] })}
          options={[{ value: 'loop', label: 'Loop', icon: Repeat, hint: 'Loop' }, { value: 'once', label: 'Once', icon: ArrowRight, hint: 'Play once' }, { value: 'pingpong', label: 'Ping-pong', icon: ArrowLeftRight, hint: 'Ping-pong' }]} />
      </div>
      <div className="flex-1" />
      {keySel.length > 0 && <span className="mr-1 text-ui text-fg-muted tabular">{keySel.length} selected</span>}
      <IconButton icon={Diamond} label="Add keyframe at playhead" shortcut="k" tipSide="top" onClick={addKey} />
      <IconButton icon={Magnet} label={v.snap ? 'Snapping on' : 'Snapping off'} tipSide="top" active={v.snap} onClick={() => params.setValue('snap', !v.snap)} />
      <Tip label={autoKey ? 'Auto-key on — changes write keys' : 'Auto-key'} shortcut="shift+k" side="top">
        <button type="button" aria-pressed={autoKey} aria-label="Auto-key" onClick={() => ui.setState({ autoKey: !autoKey })}
          className={cn('flex h-icon items-center gap-1.5 rounded-control px-2 text-ui font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal',
            autoKey ? 'bg-rec/15 text-rec' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
          <CircleDot size={14} strokeWidth={1.75} />Auto-key
        </button>
      </Tip>
    </>
  )
}

function addKey() {
  if (ui.getState().mode !== 'animate') { toast('Switch to Animate mode to add keys', { description: 'Press A' }); return }
  const n = addKeysAtPlayhead()
  if (n) toast(`Keyed ${n} ${n === 1 ? 'property' : 'properties'} at ${fmtTime(animTime())}`)
  else toast('Select a layer to key', { type: 'error' })
}

/* ---------- left: layers ---------- */
function LayersPanel() {
  const doc = useDoc()
  const sel = useUI((s) => s.sel)
  const animId = useUI((s) => s.animId)
  const anim = doc.anims.find((a) => a.id === animId)
  const items = useMemo(() => {
    const build = (parent: string | null): LayerItem[] => childrenOf(doc, parent).slice().reverse().map((o) => ({
      id: o.id, name: o.name, icon: KIND_ICON[o.kind], visible: o.visible, locked: o.locked,
      meta: objHasKeys(anim, o.id) ? <KeyDiamond state="animated" size={7} /> : undefined,
      children: o.kind === 'group' ? build(o.id) : undefined,
    }))
    return build(null)
  }, [doc, anim])
  return (
    <Panel header={<PanelHeader title="Layers"><span className="text-ui-sm text-fg-faint tabular">{doc.objects.length}</span></PanelHeader>}>
      <LayerTree items={items} selected={sel ? [sel] : []}
        onSelect={(ids) => ui.setState({ sel: ids.at(-1) ?? null })}
        onToggle={(id, prop) => { const o = doc.objects.find((x) => x.id === id)!; patchObject(id, prop === 'visible' ? { visible: !o.visible } : { locked: !o.locked }) }}
        onMove={reorderObject}
        onRename={(id, name) => patchObject(id, { name })} />
    </Panel>
  )
}

/* ---------- left: animations + state machine ---------- */
function AnimationsPanel() {
  const [tab, setTab] = useState<'anims' | 'sm'>('anims')
  const doc = useDoc()
  const animId = useUI((s) => s.animId)
  const preview = useUI((s) => s.preview)
  const smState = useUI((s) => s.smState)
  const last = useUI((s) => s.lastTransition)
  const inputs = useUI((s) => s.inputs)
  const fired = useUI((s) => s.fired)
  const [renaming, setRenaming] = useState<string | null>(null)
  // Enter / Esc end a rename by unmounting the input; put focus back on that row's name so it doesn't drop to <body>.
  const refocus = useRef(false)
  const focusRow = (id: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-anim-row="${CSS.escape(id)}"] [data-row-main]`)?.focus())
  useEffect(() => { if (fired) { const id = setTimeout(() => ui.setState({ fired: null }), 400); return () => clearTimeout(id) } }, [fired])
  const names = Object.fromEntries([...doc.anims.map((a) => [a.id, a.name]), ['any', 'Any state']])
  const label = (c: { input: string; op: string; value?: boolean | number }) =>
    c.op === 'fired' ? `${c.input} fired` : c.op === 'is' ? `${c.input} is ${c.value}` : `${c.input} ${c.op === 'gt' ? '>' : '<'} ${c.value}`
  return (
    <Panel header={
      <PanelHeader>
        <PanelTabs value={tab} onChange={setTab} tabs={[{ value: 'anims', label: 'Animations' }, { value: 'sm', label: 'State machine' }]} />
        {tab === 'anims' && <IconButton size="icon-sm" icon={Plus} label="New animation" onClick={() => addAnim()} />}
      </PanelHeader>
    }>
      {tab === 'anims' ? (
        <div className="flex flex-col py-1">
          {doc.anims.map((a, i) => {
            const Icon = LOOP_ICON[a.loop]
            const on = a.id === animId && !preview
            return (
              // The row is a plain container: its name is the button, the ⋯ menu a sibling — no button inside a button (axe nested-interactive, break-it A20).
              <div key={a.id} data-anim-row={a.id}
                onClick={() => { ui.setState({ animId: a.id, preview: false, keySel: [], pending: {} }); clock.pause(); seek(0) }}
                onDoubleClick={() => setRenaming(a.id)}
                className={cn('group/row mx-1.5 flex h-row cursor-default items-center gap-2 rounded-control pr-1 pl-2 text-ui has-[[data-row-main]:focus-visible]:ring-2 has-[[data-row-main]:focus-visible]:ring-signal', on ? 'bg-signal-soft' : 'hover:bg-hover')}>
                <Film size={14} strokeWidth={1.5} className={on ? 'text-signal' : 'text-fg-faint'} />
                {renaming === a.id ? (
                  <input autoFocus defaultValue={a.name} onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { updateAnim({ name: e.target.value || a.name }, true, a.id); setRenaming(null); if (refocus.current) { refocus.current = false; focusRow(a.id) } }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { refocus.current = true; (e.target as HTMLInputElement).blur() } if (e.key === 'Escape') { setRenaming(null); focusRow(a.id) } }}
                    className="h-control-sm min-w-0 flex-1 rounded-control bg-control px-1 text-ui text-fg outline-none shadow-[inset_0_0_0_1px_var(--signal)]" />
                ) : (
                  <button type="button" data-row-main aria-current={on || undefined} title="Double-click or F2 to rename"
                    onKeyDown={(e) => { if (e.key === 'F2') { e.preventDefault(); setRenaming(a.id) } }}
                    className="min-w-0 flex-1 self-stretch truncate text-left text-fg outline-none">{a.name}</button>
                )}
                {doc.sm.entry === a.id && <span className="text-ui-sm text-fg-faint">entry</span>}
                <Tip label={a.loop === 'loop' ? 'Loops' : a.loop === 'once' ? 'Plays once' : 'Ping-pong'}><span className="text-fg-faint"><Icon size={12} strokeWidth={1.5} /></span></Tip>
                <span className="w-9 text-right tabular text-ui text-fg-faint">{(a.duration / 1000).toFixed(1)}s</span>
                <span className="text-ui-sm text-fg-faint tabular opacity-0 group-hover/row:opacity-100">{i + 1}</span>
                <Menu align="end" trigger={<button type="button" aria-label="Animation options" onClick={(e) => e.stopPropagation()} className="flex size-icon-sm items-center justify-center rounded-control text-fg-faint opacity-0 outline-none hover:bg-hover hover:text-fg group-hover/row:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"><Ellipsis size={14} strokeWidth={1.5} /></button>}
                  items={[
                    { label: 'Rename', onClick: () => setRenaming(a.id) },
                    { label: 'Duplicate', icon: CopyPlus, onClick: () => addAnim(a) },
                    { label: 'Set as entry state', checked: doc.sm.entry === a.id, onClick: () => setDoc({ ...getDoc(), sm: { ...getDoc().sm, entry: a.id } }) },
                    { type: 'separator' },
                    { label: 'Delete', icon: Trash2, danger: true, disabled: doc.anims.length <= 1, onClick: () => { if (deleteAnim(a.id)) toast(`Deleted “${a.name}”`, { action: { label: 'Undo', onClick: () => history.undo() } }) } },
                  ]} />
              </div>
            )
          })}
          <p className="px-3.5 pt-2 pb-1 text-ui leading-relaxed text-fg-faint">Double-click (or F2) to rename. Keys 1–9 switch animations.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-pad pt-2.5 pb-1">
            <Button size="sm" variant={preview ? 'primary' : 'default'} className="flex-1" onClick={() => togglePreview()}>
              {preview ? <Pause size={13} strokeWidth={1.75} /> : <Play size={13} strokeWidth={1.75} />}{preview ? 'Stop preview' : 'Preview'}
            </Button>
            <IconButton size="icon-sm" icon={RotateCcw} label="Restart state machine" onClick={() => { runtime.reset(); ui.setState({ smState: getDoc().sm.entry, lastTransition: null }) }} />
          </div>
          <div className="px-2">
            <StateMachineGraph states={doc.anims.map((a) => ({ id: a.id, name: a.name }))} entry={doc.sm.entry} current={preview ? smState : null} lastTransition={preview ? last : null}
              transitions={doc.sm.transitions.map((t) => ({ id: t.id, from: t.from, to: t.to, label: '', mix: t.mix }))}
              onSelect={(id) => { if (!preview) ui.setState({ animId: id }) }} />
          </div>
          <Section title="Inputs" collapsible={false}>
            <InputsList fired={fired}
              inputs={doc.sm.inputs.map((i) => ({ id: i.id, name: i.name, type: i.type, value: (inputs[i.name] ?? i.value) as boolean | number }))}
              onInput={(id, v) => { const i = doc.sm.inputs.find((x) => x.id === id)!; ui.setState((s) => ({ inputs: { ...s.inputs, [i.name]: v } })) }}
              onFire={(id) => fire(doc.sm.inputs.find((x) => x.id === id)!.name)} />
          </Section>
          <Section title="Listeners" collapsible={false}>
            <div className="flex flex-col gap-1 px-pad pb-1.5 font-mono text-ui-sm text-fg-muted">
              <span><span className="text-fg-faint">pointer enter / exit →</span> hover</span>
              <span><span className="text-fg-faint">pointer down →</span> press, turns + 3</span>
            </div>
          </Section>
          <Section title="Transitions" collapsible={false}>
            <TransitionsList names={names}
              transitions={doc.sm.transitions.map((t) => ({ id: t.id, from: t.from, to: t.to, mix: t.mix, label: [t.exit ? 'at end' : '', ...t.conds.map(label)].filter(Boolean).join(' · ') }))}
              onMix={(id, ms, f) => setDoc({ ...getDoc(), sm: { ...getDoc().sm, transitions: getDoc().sm.transitions.map((t) => (t.id === id ? { ...t, mix: ms } : t)) } }, f)} />
          </Section>
        </div>
      )}
    </Panel>
  )
}

function togglePreview(on = !ui.getState().preview) {
  if (on) {
    runtime.reset()
    ui.setState({ preview: true, smState: getDoc().sm.entry, lastTransition: null, keySel: [], pending: {} })
    clock.play()
  } else {
    ui.setState({ preview: false, smState: null, lastTransition: null })
    clock.pause()
    seek(0)
  }
}
function fire(name: string) {
  if (!ui.getState().preview) togglePreview(true)
  runtime.fire(name)
  ui.setState((s) => ({ fired: name, inputs: name === 'press' ? { ...s.inputs, turns: Number(s.inputs.turns ?? 0) + 3 } : s.inputs }))
}

/* ---------- the shell ---------- */
export default function AnimateShell() {
  const doc = useDoc()
  const v = useValues(params)
  const mode = useUI((s) => s.mode)
  const animId = useUI((s) => s.animId)
  const sel = useUI((s) => s.sel)
  const keySel = useUI((s) => s.keySel)
  const closed = useUI((s) => s.closed)
  const autoKey = useUI((s) => s.autoKey)
  const preview = useUI((s) => s.preview)
  const pending = useUI((s) => s.pending)
  const smState = useUI((s) => s.smState)
  const svgRef = useRef<SVGSVGElement>(null)
  const anim = currentAnim(doc)
  useClockTime(clock, 12)
  const t = animTime()

  /* timeline lanes, derived from the document */
  const lanes = useMemo(() => {
    const out: KeyLane[] = []
    const r = resolve(doc, anim, t, pending)
    const walk = (parent: string | null) => {
      for (const o of childrenOf(doc, parent).slice().reverse()) {
        const props = PROPS_FOR[o.kind].filter((p) => anim.tracks[trackKey(o.id, p)]?.length)
        if (props.length || o.id === sel) {
          const all = props.flatMap((p) => anim.tracks[trackKey(o.id, p)])
          const times = [...new Set(all.map((k) => Math.round(k.t)))].sort((a, b) => a - b)
          const open = !closed[o.id]
          out.push({
            id: `o:${o.id}`, kind: 'group', label: o.name, icon: KIND_ICON[o.kind], open, highlight: o.id === sel,
            depth: depthOf(o),
            keys: times.map((tm) => { const ids = all.filter((k) => Math.round(k.t) === tm).map((k) => k.id); return { id: `g:${o.id}:${ids[0]}`, t: tm, ids } }),
            value: !props.length ? <span className="text-fg-faint">no keys</span> : undefined,
          })
          if (open) for (const p of props) {
            const keys = anim.tracks[trackKey(o.id, p)]
            const k = trackKey(o.id, p)
            const ks = keyAt(keys, Math.round(t))
            out.push({
              id: k, kind: 'prop', label: PROPS[p].label, depth: depthOf(o) + 1,
              value: fmtVal(p, r[o.id][p]),
              keys: keys.map((x) => ({ id: x.id, t: x.t, selected: keySel.includes(x.id), out: x.ease.kind === 'hold' ? 'hold' : 'ease', glyph: <EaseGlyph ease={x.ease} className="size-3.5" /> })),
              trailing: <KeyButton state={pending[k] !== undefined ? 'edited' : ks ? 'key' : 'animated'} property={`${o.name} ${PROPS[p].label}`} onToggle={() => toggleKey(o.id, p)} />,
            })
          }
        }
        walk(o.id)
      }
    }
    const depthOf = (o: Obj) => { let d = 0; for (let p = o.parent; p; p = doc.objects.find((x) => x.id === p)?.parent ?? null) d++; return Math.min(d, 2) }
    walk(null)
    return out
  }, [doc, anim, t, pending, keySel, closed, sel])

  // anim switch → stop at 0. On first open, play the current animation once so the page is alive.
  useEffect(() => { clock.pause(); seek(0) }, [animId])
  useEffect(() => { const id = setTimeout(() => clock.play(), 350); return () => clearTimeout(id) }, [])

  /* exports */
  const scale = Number(v.exportScale)
  const exportPNG = async () => {
    await loadImages(doc)
    const c = document.createElement('canvas')
    c.width = doc.width * scale; c.height = doc.height * scale
    const r = mode === 'design' ? resolve(doc, undefined, 0) : resolve(doc, anim, animTime(), pending)
    drawCanvas(c.getContext('2d')!, doc, r, [v.bgTop, v.bgBottom], c.width, c.height)
    c.toBlob((b) => { if (b) { download(b, `${anim.name.toLowerCase()}-${Math.round(animTime())}ms.png`); toast('PNG exported', { type: 'success', description: `${c.width} × ${c.height}` }) } })
  }
  const exportSVGFrame = async () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.querySelectorAll('[data-overlay]').forEach((n) => n.remove())
    clone.querySelector('[data-bg]')?.setAttribute('fill', 'url(#tw-bg)') // the stage is bare; a file keeps its paper
    await inlineImages(clone)
    download(new Blob([clone.outerHTML], { type: 'image/svg+xml' }), `${anim.name.toLowerCase()}-frame.svg`)
    toast('SVG exported', { type: 'success' })
  }
  const exportVideo = async () => {
    const a = anim
    const W = Math.round((doc.width * scale) / 2) * 2, H = Math.round((doc.height * scale) / 2) * 2 // H.264 wants even sizes
    const fps = Number(v.fps)
    // one full cycle: a ping-pong animation plays forward then back
    const dur = a.loop === 'pingpong' ? a.duration * 2 : a.duration
    const fold = (ms: number) => (a.loop === 'pingpong' && ms > a.duration ? 2 * a.duration - ms : ms)
    const docNow = getDoc()
    await loadImages(docNow) // decoded before the first frame, or the opening frames render blank
    const bg: [string, string] = [v.bgTop, v.bgBottom]
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d', { alpha: false })!
    const ac = new AbortController()
    const pt = toast.progress(`Rendering “${a.name}”`, { onCancel: () => ac.abort() })
    let last = -1
    try {
      const blob = await recordFrames({
        canvas, fps, frames: Math.max(1, Math.round((dur / 1000) * fps)), name: `${a.name.toLowerCase()}.mp4`, signal: ac.signal,
        draw: (ms) => drawCanvas(ctx, docNow, resolve(docNow, a, fold(ms)), bg, W, H),
        onProgress: (p) => { const q = Math.round(p * 100); if (q !== last) { last = q; pt.set(p) } },
      })
      if (blob) pt.done('Video exported', { description: `${W} × ${H} · ${fps} fps · ${(dur / 1000).toFixed(2)}s` })
      else if (ac.signal.aborted) pt.fail('Export cancelled', { timeout: 2600 })
      else pt.fail('This browser cannot encode video', { description: 'Try Chrome, Edge or Safari 17+.' })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }
  const exportCSS = async () => {
    if (!sel) { toast('Select a layer to export its CSS', { type: 'error' }); return }
    const css = toCSSKeyframes(doc, anim, sel)
    if (!objHasKeys(anim, sel)) { toast(`“${doc.objects.find((o) => o.id === sel)?.name}” has no keys in ${anim.name}`, { type: 'error' }); return }
    await copyText(css)
    download(new Blob([css], { type: 'text/css' }), `${anim.name}-${sel}.css`.toLowerCase())
    toast('CSS @keyframes copied and downloaded', { type: 'success' })
  }
  const exportDocJSON = () => { exportJSON({ format: 'tween-animation/1', ...getDoc() }, 'rueca.animation.json'); toast('Animation JSON exported', { type: 'success' }) }

  const exportItems: MenuItem[] = [
    { type: 'label', label: 'Export' },
    { label: 'Video (MP4, frame-accurate)', icon: Film, shortcut: 'shift+mod+e', onClick: exportVideo },
    { label: 'PNG (current frame)', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPNG },
    { label: 'SVG (current frame)', icon: PenTool, onClick: exportSVGFrame },
    { type: 'separator' },
    { label: 'CSS @keyframes (selected layer)', icon: Code, onClick: exportCSS, disabled: !sel },
    { label: 'Animation JSON', icon: Braces, onClick: exportDocJSON },
    { type: 'separator' },
    ...shareMenuItems(params),
  ]

  /* commands + shortcuts */
  const setMode = (m: 'design' | 'animate') => { if (preview) togglePreview(false); ui.setState({ mode: m, pending: {} }); clock.pause() }
  const jump = (dir: 1 | -1) => {
    const now = animTime()
    const ts = [...new Set(Object.values(anim.tracks).flatMap((ks) => ks.map((k) => k.t)).concat([0, anim.duration]))].sort((a, b) => a - b)
    const next = dir > 0 ? ts.find((x) => x > now + 0.5) : [...ts].reverse().find((x) => x < now - 0.5)
    if (next !== undefined) { clock.pause(); seek(next) }
  }
  const ease = (name: string, e: Parameters<typeof setEase>[1]) => ({ id: `ease-${name}`, label: `Easing: ${name}`, group: 'Keyframes', run: () => { if (!keySel.length) return toast('Select keyframes first'); setEase(keySel, e); toast(`${name} on ${keySel.length} keys`) } })
  const commands: Command[] = [
    { id: 'mode-design', label: 'Design mode', group: 'Mode', shortcut: 'd', icon: MousePointer2, run: () => setMode('design') },
    { id: 'mode-animate', label: 'Animate mode', group: 'Mode', shortcut: 'a', icon: Diamond, run: () => setMode('animate') },
    { id: 'preview', label: preview ? 'Stop state machine preview' : 'Preview state machine', group: 'Mode', shortcut: 'p', icon: Workflow, run: () => togglePreview() },
    { id: 'fire', label: 'Fire “press” trigger', group: 'Mode', shortcut: 'f', icon: Zap, run: () => fire('press') },
    { id: 'hover', label: 'Toggle “hover” input', group: 'Mode', shortcut: 'h', run: () => ui.setState((s) => ({ inputs: { ...s.inputs, hover: !s.inputs.hover } })) },
    { id: 'play', label: 'Play / pause', group: 'Playback', shortcut: 'space', icon: Play, run: () => clock.toggle() },
    { id: 'start', label: 'Go to start', group: 'Playback', shortcut: 'home', icon: SkipBack, run: () => seek(0) },
    { id: 'end', label: 'Go to end', group: 'Playback', shortcut: 'end', run: () => { clock.pause(); seek(anim.duration) } },
    { id: 'prev-frame', label: 'Previous frame', group: 'Playback', shortcut: ',', run: () => clock.step(-1) },
    { id: 'next-frame', label: 'Next frame', group: 'Playback', shortcut: '.', run: () => clock.step(1) },
    { id: 'prev-10', label: 'Back 10 frames', group: 'Playback', shortcut: 'shift+,', run: () => clock.step(-10) },
    { id: 'next-10', label: 'Forward 10 frames', group: 'Playback', shortcut: 'shift+.', run: () => clock.step(10) },
    { id: 'prev-key', label: 'Previous keyframe', group: 'Playback', shortcut: 'j', run: () => jump(-1) },
    { id: 'next-key', label: 'Next keyframe', group: 'Playback', shortcut: 'l', run: () => jump(1) },
    { id: 'loop', label: 'Loop', group: 'Playback', icon: Repeat, run: () => updateAnim({ loop: 'loop' }) },
    { id: 'once', label: 'Play once', group: 'Playback', icon: ArrowRight, run: () => updateAnim({ loop: 'once' }) },
    { id: 'pingpong', label: 'Ping-pong', group: 'Playback', icon: ArrowLeftRight, run: () => updateAnim({ loop: 'pingpong' }) },
    { id: 'add-key', label: 'Add keyframe at playhead', group: 'Keyframes', shortcut: 'k', icon: Diamond, run: addKey },
    { id: 'auto-key', label: autoKey ? 'Turn auto-key off' : 'Turn auto-key on', group: 'Keyframes', shortcut: 'shift+k', icon: CircleDot, run: () => ui.setState({ autoKey: !autoKey }) },
    { id: 'select-all', label: 'Select all keyframes', group: 'Keyframes', shortcut: 'mod+a', run: () => ui.setState({ keySel: Object.values(anim.tracks).flatMap((ks) => ks.map((k) => k.id)) }) },
    { id: 'copy', label: 'Copy keyframes', group: 'Keyframes', shortcut: 'mod+c', icon: Copy, run: () => { const n = copyKeys(keySel); if (n) toast(`Copied ${n} keys`) } },
    { id: 'paste', label: 'Paste keyframes at playhead', group: 'Keyframes', shortcut: 'mod+v', icon: ClipboardPaste, run: () => { const n = pasteKeys(); if (n) toast(`Pasted ${n} keys`) } },
    { id: 'delete', label: 'Delete selected keyframes', group: 'Keyframes', shortcut: 'backspace,delete', icon: Trash2, run: () => { const n = deleteKeys(ui.getState().keySel); if (n) toast(`Deleted ${n} ${n === 1 ? 'key' : 'keys'}`, { action: { label: 'Undo', onClick: () => history.undo() } }) } },
    ease('Linear', { kind: 'bezier', p: [0, 0, 1, 1] }),
    ease('Ease in', { kind: 'bezier', p: [0.42, 0, 1, 1] }),
    ease('Ease out', { kind: 'bezier', p: [0, 0, 0.58, 1] }),
    ease('Ease in out', { kind: 'bezier', p: [0.42, 0, 0.58, 1] }),
    ease('Back', { kind: 'bezier', p: [0.34, 1.56, 0.64, 1] }),
    ease('Spring', { kind: 'spring', duration: 500, bounce: 0.3 }),
    ease('Hold', { kind: 'hold' }),
    ...doc.anims.slice(0, 9).map((a, i) => ({ id: `anim-${a.id}`, label: `Edit “${a.name}”`, group: 'Animations', shortcut: String(i + 1), icon: Film, run: () => ui.setState({ animId: a.id, preview: false, keySel: [], pending: {} }) })),
    { id: 'new-anim', label: 'New animation', group: 'Animations', icon: Plus, run: () => addAnim() },
    { id: 'dup-anim', label: `Duplicate “${anim.name}”`, group: 'Animations', icon: CopyPlus, run: () => addAnim(anim) },
    { id: 'onion', label: v.onion ? 'Hide onion skin' : 'Show onion skin', group: 'View', shortcut: 'o', icon: Layers, run: () => params.setValue('onion', !v.onion) },
    { id: 'png', label: 'Export PNG (current frame)', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPNG },
    { id: 'mp4', label: 'Export video (MP4)', group: 'Export', shortcut: 'shift+mod+e', icon: Film, run: exportVideo },
    { id: 'svg', label: 'Export SVG (current frame)', group: 'Export', icon: PenTool, run: exportSVGFrame },
    { id: 'css', label: 'Export CSS @keyframes (selected layer)', group: 'Export', icon: Code, run: exportCSS },
    { id: 'json', label: 'Export animation JSON', group: 'Export', icon: Braces, run: exportDocJSON },
    { id: 'reset-doc', label: 'Reset demo scene', group: 'Document', icon: RotateCcw, run: () => { setDoc(demoDoc()); ui.setState({ keySel: [], pending: {}, animId: 'press', sel: 'wheel' }); toast('Demo scene restored', { action: { label: 'Undo', onClick: () => history.undo() } }) } },
  ]

  const K = 'Keyframes', L = 'Layer'
  useHotkeys({
    esc: { run: () => { if (ui.getState().keySel.length) ui.setState({ keySel: [] }); else ui.setState({ sel: null }) }, label: 'Deselect', group: 'Edit' },
    'alt+arrowleft': { run: () => nudgeKeys(ui.getState().keySel, -1), label: 'Nudge keys a frame earlier', group: K },
    'alt+arrowright': { run: () => nudgeKeys(ui.getState().keySel, 1), label: 'Nudge keys a frame later', group: K },
    'shift+alt+arrowleft': { run: () => nudgeKeys(ui.getState().keySel, -10), label: 'Nudge keys 10 frames earlier', group: K },
    'shift+alt+arrowright': { run: () => nudgeKeys(ui.getState().keySel, 10), label: 'Nudge keys 10 frames later', group: K },
    arrowleft: { run: (e) => nudgeObj(-1, 0, e), label: 'Nudge layer left', group: L },
    arrowright: { run: (e) => nudgeObj(1, 0, e), label: 'Nudge layer right', group: L },
    arrowup: { run: (e) => nudgeObj(0, -1, e), label: 'Nudge layer up', group: L },
    arrowdown: { run: (e) => nudgeObj(0, 1, e), label: 'Nudge layer down', group: L },
    'shift+arrowleft': { run: (e) => nudgeObj(-10, 0, e), label: 'Nudge layer 10px left', group: L },
    'shift+arrowright': { run: (e) => nudgeObj(10, 0, e), label: 'Nudge layer 10px right', group: L },
    'shift+arrowup': { run: (e) => nudgeObj(0, -10, e), label: 'Nudge layer 10px up', group: L },
    'shift+arrowdown': { run: (e) => nudgeObj(0, 10, e), label: 'Nudge layer 10px down', group: L },
    enter: { run: () => commitPending(), label: 'Key edited values', group: K },
  }, [])

  const brandMark = <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><rect x="4" y="4" width="8" height="8" rx="1.5" transform="rotate(45 8 8)" fill="currentColor" /></svg>

  const objName = doc.objects.find((o) => o.id === sel)?.name
  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Tween" mark={brandMark} />}
          center={
            <Cluster className="gap-1.5 pr-1.5">
              <div className="w-[176px]">
                <Segmented label="Mode" value={preview ? '' : mode} onChange={(m) => setMode(m as 'design' | 'animate')}
                  options={[{ value: 'design', label: 'Design', icon: MousePointer2, hint: 'Design mode (D) — edit the base state' }, { value: 'animate', label: 'Animate', icon: Diamond, hint: 'Animate mode (A) — edits write keyframes' }]} />
              </div>
              <Divider vertical />
              <Tip label={preview ? 'Stop preview' : 'Preview the state machine'} shortcut="p">
                {/* one label in both states: the fill says it's on, so the cluster never shifts */}
                <Button size="md" variant={preview ? 'primary' : 'ghost'} aria-pressed={preview} onClick={() => togglePreview()}>
                  <Workflow size={14} strokeWidth={1.5} />Preview
                </Button>
              </Tip>
            </Cluster>
          }
          end={
            <>
              {/* params here are view prefs, not the animation: A/B and share would act on the wrong thing */}
              <Cluster><ParamActions params={params} history={history} doc={docStore} clock={clock} presets={false} compare={false} share={false} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={
        <div className="flex h-full min-h-0 flex-col gap-[var(--gutter)]">
          {/* each panel hugs its content and only shrinks (and scrolls) when the column runs out of room */}
          <div className="flex min-h-0 flex-initial flex-col"><LayersPanel /></div>
          <div className="flex min-h-0 flex-initial flex-col"><AnimationsPanel /></div>
        </div>
      }
      right={
        <Panel header={<PanelHeader title={sel ? objName : preview ? 'Preview' : mode === 'animate' ? anim.name : 'Document'}>
          <span className={cn('rounded-control px-1.5 py-0.5 text-ui', mode === 'animate' && !preview ? 'bg-signal-soft text-signal-text' : 'bg-hover text-fg-muted')}>{preview ? 'State machine' : mode === 'animate' ? 'Animate' : 'Design'}</span>
        </PanelHeader>}>
          <AnimInspector />
        </Panel>
      }
      bottom={mode === 'animate' || preview ? (
        <KeyTimeline
          clock={clock} mapTime={toAnimTime} duration={anim.duration} fps={Number(v.fps)} lanes={lanes} snap={v.snap}
          autoKey={autoKey && !preview}
          toolbar={<Transport />}
          onSeek={(tm) => { clock.pause(); seek(tm) }}
          onSelectKeys={(ids, m) => ui.setState((s) => ({ keySel: m === 'replace' ? ids : m === 'add' ? [...new Set([...s.keySel, ...ids])] : s.keySel.filter((x) => !ids.includes(x)) }))}
          onMoveKeys={moveKeys}
          onDeleteKeys={(ids) => { const n = deleteKeys(ids); if (n) toast(`Deleted ${n} ${n === 1 ? 'key' : 'keys'}`, { action: { label: 'Undo', onClick: () => history.undo() } }) }}
          segmentEditor={({ keyId }) => {
            const info = findKey(keyId)
            if (!info?.next) return null
            const ids = keySel.includes(keyId) && keySel.length > 1 ? keySel : [keyId]
            return (
              <EasingEditor key={keyId} value={info.key.ease} span={info.next.t - info.key.t} onChange={(e, f) => setEase(ids, e, f)}
                footer={<span className="tabular">{ids.length > 1 ? `Applies to ${ids.length} keys` : `${doc.objects.find((o) => o.id === info.track.split('.')[0])?.name} › ${PROPS[info.track.split('.')[1] as PropKey]?.label} · ${(info.key.t / 1000).toFixed(2)}s → ${(info.next.t / 1000).toFixed(2)}s`}</span>} />
            )
          }}
          onToggleLane={(id) => { const o = id.slice(2); ui.setState((s) => ({ closed: { ...s.closed, [o]: !s.closed[o] } })) }}
          onLaneClick={(id) => ui.setState({ sel: id.startsWith('o:') ? id.slice(2) : id.split('.')[0] })}
          onDurationChange={(ms, f) => updateAnim({ duration: ms }, f)}
          height={196}
          empty={<Empty icon={Diamond} title={`No keys in “${anim.name}” yet`} hint="Select a layer and press K, or turn on auto-key and change a value." />}
          blocked={preview ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-ui font-medium text-fg">Previewing the state machine</div>
              <div className="text-ui text-fg-muted">Hover and click the button on the artboard, or use the inputs. Now playing: <span className="text-signal-text">{doc.anims.find((a) => a.id === smState)?.name ?? '—'}</span></div>
              <Button size="sm" variant="default" onClick={() => togglePreview(false)}>Back to editing</Button>
            </div>
          ) : undefined}
        />
      ) : (
        <div className="cluster flex h-bar items-center gap-2 px-pad text-ui text-fg-muted">
          <MousePointer2 size={14} strokeWidth={1.5} className="text-fg-faint" />
          Design mode — edits change the base state every animation starts from.
          <div className="flex-1" />
          <Button size="sm" variant="default" onClick={() => setMode('animate')}><Diamond size={13} strokeWidth={1.5} />Animate<span className="text-fg-faint">A</span></Button>
        </div>
      )}
    >
      <Stage contentSize={{ w: doc.width, h: doc.height + ENTRY_TOP, y: -ENTRY_TOP }} fitMaxZoom={0.45} grid onBackgroundPointerDown={() => { if (!preview) ui.setState({ sel: null, keySel: [] }) }} overlay={
        preview ? (
          <div className="pointer-events-none absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 cluster h-bar px-pad text-ui">
            <span className="size-1.5 animate-pulse rounded-full bg-ok" />
            <span className="text-fg-muted">State machine</span>
            <span className="font-medium text-fg">{doc.anims.find((a) => a.id === smState)?.name ?? '—'}</span>
          </div>
        ) : Object.keys(pending).length > 0 ? (
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 cluster h-bar pr-1 pl-pad text-ui">
            <span className="size-1.5 rounded-full bg-key" />
            <span className="text-fg-muted">{Object.keys(pending).length} edited, not keyed</span>
            <Button size="sm" variant="default" onClick={() => commitPending()}>Key<span className="text-fg-faint">↵</span></Button>
            <Button size="sm" onClick={() => ui.setState({ pending: {} })}>Discard</Button>
          </div>
        ) : null
      }>
        {/* no artboard: the plate sits straight on the canvas, its inks following the theme */}
        <div className="absolute [--plate-ink:#181411] [--plate-measure:rgba(24,20,17,.42)] [--plate-mute:#6E6A64] dark:[--plate-ink:#B8B1A7] dark:[--plate-measure:rgba(243,241,235,.34)] dark:[--plate-mute:#8C857C]"
          style={{ left: 0, top: 0, width: doc.width, height: doc.height, '--signal': CIELO } as React.CSSProperties} data-studio-artifact="">
          <LiveScene svgRef={svgRef} />
          <NoteLayer params={params} clock={clock} doc={docStore} />
        </div>
      </Stage>

      <CommandPalette commands={commands} extraShortcuts={[
        // the kit timeline's bracket keys (focus the key area first) — they jump across ALL lanes, not per lane (break-it A17)
        { keys: ']', label: 'Timeline: select every key at the next keyframe time (all lanes)', group: 'Timeline' },
        { keys: '[', label: 'Timeline: select every key at the previous keyframe time (all lanes)', group: 'Timeline' },
      ]} />
    </Studio>
  )
}

function nudgeObj(dx: number, dy: number, e: KeyboardEvent) {
  const s = ui.getState()
  if (!s.sel || s.preview) return
  e.preventDefault()
  const doc = getDoc()
  const o = doc.objects.find((x) => x.id === s.sel)
  if (!o || o.locked) return
  const r = resolve(doc, s.mode === 'design' ? undefined : currentAnim(doc), animTime(), s.pending)[o.id]
  editProps(o.id, { x: Number(r.x) + dx, y: Number(r.y) + dy }, true)
}
