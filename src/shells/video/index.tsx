import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'
import {
  Braces, Circle, CircleDashed, Clapperboard, Copy, Download, FileUp, Film, Image as ImageIcon, Magnet, Minus, Pause, Play, Plus, RectangleHorizontal,
  RectangleVertical, RotateCcw, Scissors, Shapes, SkipBack, SkipForward, Smartphone, Square, StepBack, StepForward, Trash2, Type,
} from 'lucide-react'
import {
  Artboard, Brand, Button, CanvasSurface, Cluster, CommandPalette, Empty, IconButton, Menu, Panel, PanelHeader, ParamActions, Section, Segmented, Stage,
  Studio, Toolbar, cn, download, exportJSON, fmtTime, shareMenuItems, toast, useCamera, useClock, useClockTime, useHotkeys, useValues,
  type Command, type MenuItem, type SurfaceHandle,
} from '@kit'
import { ASPECTS, demoComp, type Aspect, type Clip, type ClipKind } from './comp'
import { clipBox, drawComp, frameUnit, hitTest } from './render'
import { ClipInspector, thumbURL } from './ClipInspector'
import { TrackTimeline, type TTClip } from './local/TrackTimeline'
import { encodeVideo } from './local/encodeVideo'
import { progressToast } from './local/progressToast'
import {
  addClip, addTrack, clock, deleteClips, duplicateClips, frameMs, getComp, loadComp, params, patchTrack, removeEmptyTracks, setComp,
  settleClips, snapFrame, splitAt, ui, updateClip, updateClips, useComp, useUI, type V,
} from './store'

const KIND_COLOR: Record<ClipKind, string> = {
  text: 'var(--signal)',
  shape: 'var(--key)',
  image: 'var(--ok)',
  bg: 'var(--fg-faint)',
  progress: 'color-mix(in oklab, var(--signal) 45%, var(--rec))',
}
const KIND_ICON = { text: Type, shape: Shapes, image: ImageIcon, bg: Square, progress: Minus }
const ASPECT_ICON = { '9:16': Smartphone, '4:5': RectangleVertical, '1:1': Square, '16:9': RectangleHorizontal }

/* ---------- library (left) ---------- */
const LIB: { group: string; items: { label: string; kind: ClipKind; patch: Partial<Clip>; preview: React.ReactNode }[] }[] = [
  {
    group: 'Text', items: [
      { label: 'Headline', kind: 'text', patch: { name: 'Headline', text: 'Big idea', font: 'display', weight: 800, size: 150, tracking: -0.04 }, preview: <span className="text-[15px] font-extrabold tracking-tight">Aa</span> },
      { label: 'Subtitle', kind: 'text', patch: { name: 'Subtitle', text: 'A line that explains it', font: 'sans', weight: 500, size: 56, color: '#D9D3FF', tracking: -0.01, y: 0.55, enter: { preset: 'blur', dur: 600, ease: [0.16, 1, 0.3, 1] } }, preview: <span className="text-[12px] font-medium">Aa</span> },
      { label: 'Caption', kind: 'text', patch: { name: 'Caption', text: 'say it in captions', font: 'sans', weight: 700, size: 64, color: '#141414', highlight: '#FFD84D', y: 0.7, tracking: -0.01, enter: { preset: 'pop', dur: 400, ease: [0.34, 1.56, 0.64, 1] } }, preview: <span className="rounded-[3px] bg-[#FFD84D] px-1 text-[11px] font-bold text-[#141414]">Aa</span> },
      { label: 'Mono label', kind: 'text', patch: { name: 'Label', text: 'new · v2.0', font: 'mono', weight: 500, size: 38, tracking: 0.06, color: '#FFFFFFB3', y: 0.3, enter: { preset: 'typewriter', dur: 600, ease: [0, 0, 1, 1] } }, preview: <span className="font-mono text-[11px]">a_</span> },
    ],
  },
  {
    group: 'Shapes', items: [
      { label: 'Circle', kind: 'shape', patch: { name: 'Circle', shape: 'circle', fill: '#8B7CFF' }, preview: <Circle size={16} strokeWidth={1.5} /> },
      { label: 'Pill', kind: 'shape', patch: { name: 'Pill', shape: 'rect', w: 0.6, h: 0.11, radius: 1, fill: '#FFFFFF' }, preview: <span className="h-2.5 w-6 rounded-full bg-current" /> },
      { label: 'Ring', kind: 'shape', patch: { name: 'Ring', shape: 'ring', w: 0.7, h: 0.7, fill: '#FF6B9A', stroke: 0.015 }, preview: <CircleDashed size={16} strokeWidth={1.5} /> },
      { label: 'Blob', kind: 'shape', patch: { name: 'Blob', shape: 'blob', w: 0.6, h: 0.55, fill: '#18C3B1' }, preview: <Shapes size={16} strokeWidth={1.5} /> },
    ],
  },
]
const IMAGES = [['aurora', 'Aurora'], ['sunset', 'Sunset'], ['mesh', 'Mesh'], ['app', 'App UI']] as const

function LibraryPanel() {
  return (
    <Panel header={<PanelHeader title="Library" />}>
      {LIB.map((g, gi) => (
        <Section key={g.group} title={g.group} first={gi === 0}>
          <div className="grid grid-cols-2 gap-1.5 px-3">
            {g.items.map((it) => (
              <button key={it.label} type="button" onClick={() => { addClip(it.kind, it.patch); toast(`Added ${it.label.toLowerCase()} at ${fmtTime(clock.time())}`) }}
                className="group/lib flex h-14 flex-col items-center justify-center gap-1 rounded-[8px] bg-control text-fg-muted outline-none transition-colors hover:text-fg hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal">
                <span className="flex h-5 items-center text-fg">{it.preview}</span>
                <span className="text-[11px]">{it.label}</span>
              </button>
            ))}
          </div>
        </Section>
      ))}
      <Section title="Images">
        <div className="grid grid-cols-2 gap-1.5 px-3">
          {IMAGES.map(([gen, label]) => (
            <button key={gen} type="button" onClick={() => { addClip('image', { name: label, image: gen, seed: Math.floor(Math.random() * 9999), ...(gen === 'app' ? { w: 0.72, h: 1.28, radius: 0.06 } : {}) }); toast(`Added ${label} image`) }}
              className="group/lib relative h-16 overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-signal">
              <img src={thumbURL(gen, 7)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover/lib:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pt-3 pb-1 text-left text-[11px] text-white">{label}</span>
            </button>
          ))}
        </div>
        <p className="px-3 pt-2 text-[11px] leading-relaxed text-fg-faint">Generated on the device — reroll with the seed.</p>
      </Section>
      <Section title="Overlays">
        <div className="flex flex-col gap-1 px-3 pb-1">
          <Button size="md" variant="default" className="justify-start" onClick={() => addClip('progress')}><Minus size={14} strokeWidth={1.5} />Progress bar</Button>
          <Button size="md" variant="default" className="justify-start" onClick={() => addClip('bg')}><Square size={14} strokeWidth={1.5} />Gradient background</Button>
        </div>
      </Section>
    </Panel>
  )
}

/* ---------- transport ---------- */
function Transport() {
  const playing = useClock(clock, (s) => s.playing)
  const fps = useClock(clock, (s) => s.fps)
  const duration = useClock(clock, (s) => s.duration)
  const t = useClockTime(clock, 30)
  const v = useValues(params)
  const sel = useUI((s) => s.sel)
  return (
    <>
      <IconButton icon={SkipBack} label="Go to start" shortcut="home" tipSide="top" onClick={() => clock.seek(0)} />
      <IconButton icon={StepBack} label="Previous frame" shortcut="," tipSide="top" onClick={() => clock.step(-1)} />
      <IconButton icon={playing ? Pause : Play} label={playing ? 'Pause' : 'Play'} shortcut="space" tipSide="top" variant="default" onClick={() => clock.toggle()} />
      <IconButton icon={StepForward} label="Next frame" shortcut="." tipSide="top" onClick={() => clock.step(1)} />
      <IconButton icon={SkipForward} label="Go to end" shortcut="end" tipSide="top" onClick={() => clock.seek(duration)} />
      <div className="ml-1 flex h-7 items-baseline gap-1 rounded-[6px] px-2 tabular text-[12px] text-fg">
        {fmtTime(t, 'timecode', fps)}<span className="text-[11px] text-fg-faint">/ {fmtTime(duration, 'timecode', fps)}</span>
        <span className="ml-1 text-[10.5px] text-fg-faint">{fps} fps</span>
      </div>
      <div className="mx-1 h-4 w-px bg-line" />
      <IconButton icon={Scissors} label="Split at playhead" shortcut="mod+b" tipSide="top" disabled={!sel.length} onClick={() => { const n = splitAt(ui.getState().sel); if (!n) toast('Put the playhead inside a selected clip to split') }} />
      <Menu side="top" trigger={<IconButton icon={Plus} label="Add clip" tipSide="top" />}
        items={[
          { label: 'Text', icon: Type, shortcut: 'shift+t', onClick: () => addClip('text') },
          { label: 'Shape', icon: Shapes, onClick: () => addClip('shape') },
          { label: 'Image', icon: ImageIcon, onClick: () => addClip('image') },
          { label: 'Progress bar', icon: Minus, onClick: () => addClip('progress') },
          { label: 'Background', icon: Square, onClick: () => addClip('bg') },
          { type: 'separator' },
          { label: 'New track', icon: Plus, onClick: addTrack },
          { label: 'Remove empty tracks', onClick: () => { const n = removeEmptyTracks(); toast(n ? `Removed ${n} empty tracks` : 'No empty tracks') } },
        ]} />
      <IconButton icon={Magnet} label={v.snap ? 'Snapping on' : 'Snapping off'} tipSide="top" active={v.snap} onClick={() => params.setValue('snap', !v.snap)} />
    </>
  )
}

/* ---------- canvas overlay: selection, drag, snapping guides, safe areas ---------- */
function CanvasOverlay({ W, H }: { W: number; H: number }) {
  const comp = useComp()
  const sel = useUI((s) => s.sel)
  const v = useValues(params)
  const cam = useCamera()
  const zoom = useStore(cam, (s) => s.zoom)
  const t = useClockTime(clock, 10)
  const el = useRef<HTMLDivElement>(null)
  const [guides, setGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })

  const toFrame = (e: { clientX: number; clientY: number }) => {
    const r = el.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, k: W / r.width }
  }
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const p = toFrame(e)
    const hit = hitTest(comp, clock.time(), W, H, p.x, p.y)
    const selected = comp.clips.find((c) => c.id === ui.getState().sel[0])
    // keep dragging the selected clip if the press is inside its box even when another sits on top
    const U = frameUnit(comp, W, H)
    const inSel = selected && (() => { const b = clipBox(selected, W, H, U); return Math.abs(p.x - b.cx) <= b.w / 2 && Math.abs(p.y - b.cy) <= b.h / 2 })()
    const target = inSel ? selected! : hit
    if (!target) { ui.setState({ sel: [] }); return }
    e.stopPropagation()
    if (!inSel) ui.setState({ sel: [target.id] })
    if (comp.tracks.find((tr) => tr.id === target.track)?.locked || target.kind === 'bg' || target.kind === 'progress' || (target.kind === 'image' && target.frame)) return
    el.current!.setPointerCapture(e.pointerId)
    const x0 = target.x, y0 = target.y
    let moved = false
    const move = (ev: PointerEvent) => {
      const q = toFrame(ev)
      if (!moved && Math.hypot((q.x - p.x) / q.k, (q.y - p.y) / q.k) < 3) return
      moved = true
      let nx = x0 + (q.x - p.x) / W, ny = y0 + (q.y - p.y) / H
      if (ev.shiftKey) { if (Math.abs(nx - x0) * W > Math.abs(ny - y0) * H) ny = y0; else nx = x0 }
      const b = clipBox({ ...target, x: nx, y: ny }, W, H, U)
      const th = 10 * q.k
      const gx = !ev.altKey && Math.abs(b.cx - W / 2) < th, gy = !ev.altKey && Math.abs(b.cy - H / 2) < th
      if (gx) nx += (W / 2 - b.cx) / W
      if (gy) ny += (H / 2 - b.cy) / H
      setGuides({ x: gx, y: gy })
      updateClip(target.id, { x: Math.round(nx * 1000) / 1000, y: Math.round(ny * 1000) / 1000 }, false)
    }
    const up = () => {
      el.current?.removeEventListener('pointermove', move)
      el.current?.removeEventListener('pointerup', up)
      setGuides({ x: false, y: false })
      if (moved) params.commit()
    }
    el.current!.addEventListener('pointermove', move)
    el.current!.addEventListener('pointerup', up)
  }

  const c = comp.clips.find((x) => x.id === sel[0])
  const b = c ? clipBox(c, W, H, frameUnit(comp, W, H)) : null
  const live = c ? t >= c.start && t < c.start + c.dur : false
  const lw = 1.5 / zoom
  const aspect = v.aspect as Aspect
  return (
    <div ref={el} className="absolute inset-0" onPointerDown={onDown} onDoubleClick={() => { if (c?.kind === 'text') document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Text content"]')?.focus() }}>
      {v.safeArea && <SafeAreas aspect={aspect} W={W} H={H} zoom={zoom} />}
      {guides.x && <div className="pointer-events-none absolute top-0 bottom-0" style={{ left: W / 2 - lw / 2, width: lw, background: 'var(--rec)' }} />}
      {guides.y && <div className="pointer-events-none absolute right-0 left-0" style={{ top: H / 2 - lw / 2, height: lw, background: 'var(--rec)' }} />}
      {c && b && (
        <div className="pointer-events-none absolute" style={{ left: b.cx - b.w / 2, top: b.cy - b.h / 2, width: b.w, height: b.h, transform: `rotate(${b.rotation}deg)`, outline: `${lw}px ${live ? 'solid' : 'dashed'} var(--signal)` }}>
          <div className="absolute bottom-full left-0 flex origin-bottom-left items-center gap-1 rounded-[4px] bg-signal-strong px-1.5 py-0.5 text-[11px] whitespace-nowrap text-signal-fg" style={{ transform: `scale(${1 / zoom}) translateY(-4px)` }}>
            {c.name}{!live && <span className="opacity-70">· not at playhead</span>}
          </div>
          {live && [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
            <div key={i} className="absolute bg-white" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: 7 / zoom, height: 7 / zoom, transform: 'translate(-50%,-50%)', outline: `${1 / zoom}px solid var(--signal)` }} />
          ))}
        </div>
      )}
    </div>
  )
}

function SafeAreas({ aspect, W, H, zoom }: { aspect: Aspect; W: number; H: number; zoom: number }) {
  const zones = aspect === '9:16'
    ? [{ x: 0, y: 0, w: 1, h: 0.11, l: 'Status + profile' }, { x: 0, y: 0.8, w: 1, h: 0.2, l: 'Caption + CTA' }, { x: 0.86, y: 0.42, w: 0.14, h: 0.38, l: 'Buttons' }]
    : aspect === '16:9' ? [{ x: 0, y: 0.88, w: 1, h: 0.12, l: 'Player controls' }]
    : [{ x: 0, y: 0.86, w: 1, h: 0.14, l: 'Caption' }]
  return (
    <>
      {zones.map((z) => (
        <div key={z.l} className="pointer-events-none absolute flex items-start justify-start" style={{ left: z.x * W, top: z.y * H, width: z.w * W, height: z.h * H, background: 'repeating-linear-gradient(135deg, rgba(255,77,77,0.10) 0 10px, transparent 10px 22px)', boxShadow: `inset 0 0 0 ${1 / zoom}px rgba(255,77,77,0.35)` }}>
          <span className="m-1 origin-top-left rounded-[3px] bg-black/50 px-1 py-0.5 text-[10px] whitespace-nowrap text-white/80" style={{ transform: `scale(${1 / zoom})` }}>{z.l}</span>
        </div>
      ))}
    </>
  )
}

/* ---------- the shell ---------- */
export default function VideoShell() {
  const v = useValues(params) as V
  const comp = useComp()
  const sel = useUI((s) => s.sel)
  const surface = useRef<SurfaceHandle>(null)
  const fileIn = useRef<HTMLInputElement>(null)
  const { w: W, h: H } = ASPECTS[v.aspect as Aspect]
  const fps = Number(v.fps)

  // timeline clips derived from the composition
  const ttClips: TTClip[] = useMemo(() => comp.clips.map((c) => ({
    id: c.id, track: c.track, start: c.start, dur: c.dur, label: c.name, color: KIND_COLOR[c.kind], icon: KIND_ICON[c.kind],
    detail: c.kind === 'text' ? `“${c.text}”` : c.kind === 'image' ? c.image : c.kind === 'shape' ? c.shape : undefined,
    thumb: c.kind === 'image' ? thumbURL(c.image ?? 'mesh', c.seed ?? 1) : undefined,
    selected: sel.includes(c.id),
    rampIn: c.enter.preset !== 'none' ? c.enter.dur : 0,
    rampOut: c.exit.preset !== 'none' ? c.exit.dur : 0,
  })), [comp, sel])

  // keep the selection valid after undo
  useEffect(() => { const ids = new Set(comp.clips.map((c) => c.id)); if (sel.some((s) => !ids.has(s))) ui.setState({ sel: sel.filter((s) => ids.has(s)) }) }, [comp, sel])
  // play the teaser once on open
  useEffect(() => { clock.seek(0); const id = setTimeout(() => clock.play(), 400); return () => { clearTimeout(id); clock.pause() } }, [])

  /* exports */
  const exportMP4 = async () => {
    const snapshot = getComp()
    const matte = v.matte
    const dur = v.duration
    clock.pause()
    try { await Promise.all([800, 700, 600, 500].map((wt) => document.fonts.load(`${wt} 64px "Inter Variable"`))) } catch { /* fonts optional */ }
    const job = encodeVideo({ width: W, height: H, fps, duration: dur, draw: (ctx, tm) => drawComp(ctx, snapshot, tm, W, H, { matte }), onProgress: (p, f, total) => pt.set(p, `Exporting MP4 · frame ${f}/${total}`) })
    const pt = progressToast('Exporting MP4', { onCancel: job.cancel })
    try {
      const blob = await job.done
      if (!blob) { pt.fail('Export cancelled'); return }
      download(blob, `orbit-teaser-${v.aspect.replace(':', 'x')}.mp4`)
      pt.done('MP4 exported', `${W} × ${H} · ${fps} fps · ${(dur / 1000).toFixed(1)}s · ${(blob.size / 1e6).toFixed(1)} MB`)
    } catch (e) { pt.fail('Export failed', (e as Error).message) }
  }
  const exportPNG = () => {
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    drawComp(c.getContext('2d')!, getComp(), clock.time(), W, H, { matte: v.matte })
    c.toBlob((b) => { if (b) { download(b, `frame-${Math.round(clock.time())}ms.png`); toast('PNG exported', { type: 'success', description: `${W} × ${H} at ${fmtTime(clock.time(), 'timecode', fps)}` }) } })
  }
  const exportComp = () => {
    exportJSON({ format: 'cut-composition/1', settings: { aspect: v.aspect, fps, duration: v.duration, width: W, height: H, matte: v.matte }, ...getComp() }, 'orbit-teaser.composition.json')
    toast('Composition JSON exported', { type: 'success' })
  }
  const importComp = () => fileIn.current?.click()
  const onFile = async (f?: File | null) => {
    if (!f) return
    try { loadComp(JSON.parse(await f.text())); toast(`Loaded ${f.name}`, { type: 'success', action: { label: 'Undo', onClick: () => params.undo() } }) }
    catch (e) { toast('Could not load that file', { type: 'error', description: (e as Error).message }) }
  }

  const setAspect = (a: Aspect) => { params.setValue('aspect', a); toast(`${a} · ${ASPECTS[a].w} × ${ASPECTS[a].h}`, { description: 'Every clip re-laid out for the new frame.' }) }
  const nudge = (dx: number, dy: number) => (e: KeyboardEvent) => {
    const ids = ui.getState().sel
    if (!ids.length) return
    e.preventDefault()
    const cs = getComp().clips.filter((c) => ids.includes(c.id))
    updateClips(Object.fromEntries(cs.map((c) => [c.id, { x: Math.round((c.x + dx) * 1000) / 1000, y: Math.round((c.y + dy) * 1000) / 1000 }])))
  }
  const shift = (frames: number) => (e: KeyboardEvent) => {
    const ids = ui.getState().sel
    if (!ids.length) return
    e.preventDefault()
    const cs = getComp().clips.filter((c) => ids.includes(c.id))
    const orig = Object.fromEntries(cs.map((c) => [c.id, { start: c.start, track: c.track }]))
    updateClips(Object.fromEntries(cs.map((c) => [c.id, { start: Math.max(0, Math.min(v.duration - c.dur, c.start + frames * frameMs())) }])), false)
    settleClips(ids, orig)
    params.commit()
  }
  useHotkeys({
    delete: () => deleteClips(ui.getState().sel),
    esc: () => ui.setState({ sel: [] }),
    arrowleft: nudge(-0.005, 0), arrowright: nudge(0.005, 0), arrowup: nudge(0, -0.005), arrowdown: nudge(0, 0.005),
    'shift+arrowleft': nudge(-0.05, 0), 'shift+arrowright': nudge(0.05, 0), 'shift+arrowup': nudge(0, -0.05), 'shift+arrowdown': nudge(0, 0.05),
    'alt+arrowleft': shift(-1), 'alt+arrowright': shift(1), 'shift+alt+arrowleft': shift(-10), 'shift+alt+arrowright': shift(10),
  }, [v.duration])

  const exportItems: MenuItem[] = [
    { type: 'label', label: 'Export' },
    { label: `MP4 video · ${W} × ${H}`, icon: Film, shortcut: 'shift+mod+e', onClick: exportMP4 },
    { label: 'PNG (current frame)', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPNG },
    { label: 'Composition JSON', icon: Braces, onClick: exportComp },
    { type: 'separator' },
    { label: 'Import composition JSON…', icon: FileUp, onClick: importComp },
    { type: 'separator' },
    ...shareMenuItems(params),
  ]

  const commands: Command[] = [
    { id: 'play', label: 'Play / pause', group: 'Playback', shortcut: 'space', icon: Play, run: () => clock.toggle() },
    { id: 'start', label: 'Go to start', group: 'Playback', shortcut: 'home', icon: SkipBack, run: () => clock.seek(0) },
    { id: 'end', label: 'Go to end', group: 'Playback', shortcut: 'end', icon: SkipForward, run: () => clock.seek(v.duration) },
    { id: 'prev', label: 'Previous frame', group: 'Playback', shortcut: ',', run: () => clock.step(-1) },
    { id: 'next', label: 'Next frame', group: 'Playback', shortcut: '.', run: () => clock.step(1) },
    { id: 'prev10', label: 'Back 10 frames', group: 'Playback', shortcut: 'shift+,', run: () => clock.step(-10) },
    { id: 'next10', label: 'Forward 10 frames', group: 'Playback', shortcut: 'shift+.', run: () => clock.step(10) },
    { id: 'clip-start', label: 'Jump to selected clip', group: 'Playback', shortcut: 'j', run: () => { const c = getComp().clips.find((x) => x.id === ui.getState().sel[0]); if (c) { clock.pause(); clock.seek(c.start) } } },
    { id: 'add-text', label: 'Add text', group: 'Clips', shortcut: 'shift+t', icon: Type, run: () => addClip('text') },
    { id: 'add-shape', label: 'Add shape', group: 'Clips', icon: Shapes, run: () => addClip('shape') },
    { id: 'add-image', label: 'Add image', group: 'Clips', icon: ImageIcon, run: () => addClip('image') },
    { id: 'add-progress', label: 'Add progress bar', group: 'Clips', icon: Minus, run: () => addClip('progress') },
    { id: 'split', label: 'Split at playhead', group: 'Clips', shortcut: 'mod+b', icon: Scissors, run: () => { const n = splitAt(ui.getState().sel); if (!n) toast('Select a clip under the playhead to split') } },
    { id: 'dup', label: 'Duplicate selection', group: 'Clips', shortcut: 'mod+d', icon: Copy, run: () => duplicateClips(ui.getState().sel) },
    { id: 'del', label: 'Delete selection', group: 'Clips', shortcut: 'backspace', icon: Trash2, run: () => { const n = deleteClips(ui.getState().sel); if (n) toast(`Deleted ${n} ${n === 1 ? 'clip' : 'clips'}`, { action: { label: 'Undo', onClick: () => params.undo() } }) } },
    { id: 'all', label: 'Select all clips', group: 'Clips', shortcut: 'mod+a', run: () => ui.setState({ sel: getComp().clips.map((c) => c.id) }) },
    { id: 'track', label: 'New track', group: 'Clips', icon: Plus, run: addTrack },
    ...(Object.keys(ASPECTS) as Aspect[]).map((a, i) => ({ id: `aspect-${a}`, label: `Aspect ${a} — ${ASPECTS[a].label}`, group: 'Composition', shortcut: String(i + 1), icon: ASPECT_ICON[a], run: () => setAspect(a) })),
    { id: 'safe', label: v.safeArea ? 'Hide safe areas' : 'Show safe areas', group: 'View', shortcut: 'g', run: () => params.setValue('safeArea', !v.safeArea) },
    { id: 'quality', label: v.quality === '1' ? 'Preview at half resolution' : 'Preview at full resolution', group: 'View', run: () => params.setValue('quality', v.quality === '1' ? '0.5' : '1') },
    { id: 'mp4', label: 'Export MP4', group: 'Export', shortcut: 'shift+mod+e', icon: Film, run: exportMP4 },
    { id: 'png', label: 'Export PNG (current frame)', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPNG },
    { id: 'json', label: 'Export composition JSON', group: 'Export', icon: Braces, run: exportComp },
    { id: 'import', label: 'Import composition JSON…', group: 'Export', icon: FileUp, run: importComp },
    { id: 'blank', label: 'New blank composition', group: 'Composition', run: () => { setComp({ tracks: [], clips: [] }); ui.setState({ sel: [] }); toast('Blank composition', { action: { label: 'Undo', onClick: () => params.undo() } }) } },
    { id: 'demo', label: 'Load the demo teaser', group: 'Composition', icon: RotateCcw, run: () => { setComp(demoComp()); ui.setState({ sel: [] }) } },
  ]

  const selClip = comp.clips.find((c) => c.id === sel[0])
  const empty = comp.clips.length === 0

  return (
    <Studio
      leftWidth={232}
      toolbar={
        <Toolbar
          start={<Brand name="Cut" doc="Orbit launch teaser" mark={
            <a href="#/" aria-label="All shells" className="contents"><svg viewBox="0 0 16 16" width="11" height="11"><path d="M3 3h10v10H3z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M6.5 5.5l4 2.5-4 2.5z" fill="currentColor" /></svg></a>
          } />}
          center={
            <Cluster className="gap-1.5 pr-2">
              <div className="w-[268px]">
                <Segmented label="Aspect" value={v.aspect} onChange={(a) => setAspect(a as Aspect)}
                  options={(Object.keys(ASPECTS) as Aspect[]).map((a) => ({ value: a, label: a, icon: ASPECT_ICON[a], hint: `${ASPECTS[a].label} · ${ASPECTS[a].w} × ${ASPECTS[a].h}` }))} />
              </div>
              <span className="tabular text-[11.5px] text-fg-faint">{W} × {H}</span>
            </Cluster>
          }
          end={
            <>
              <Cluster><ParamActions params={params} presets={false} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={<LibraryPanel />}
      right={
        <Panel header={<PanelHeader title={selClip ? selClip.name : sel.length > 1 ? 'Selection' : 'Composition'} />}>
          <ClipInspector />
        </Panel>
      }
      bottom={
        <TrackTimeline
          clock={clock} duration={v.duration} fps={fps} snap={v.snap}
          tracks={comp.tracks} clips={ttClips}
          toolbar={<Transport />}
          onSeek={(t) => { clock.pause(); clock.seek(t) }}
          onSelect={(ids, mode) => ui.setState((s) => ({ sel: mode === 'replace' ? ids : s.sel.includes(ids[0]) ? s.sel.filter((x) => x !== ids[0]) : [...s.sel, ...ids] }))}
          onChange={(changes, final, original) => {
            updateClips(changes, false)
            if (final) { settleClips(Object.keys(changes), original); params.commit() }
          }}
          onTrackToggle={(id, prop) => { const tr = comp.tracks.find((x) => x.id === id)!; patchTrack(id, { [prop]: !tr[prop] }) }}
          onTrackRename={(id, name) => patchTrack(id, { name })}
          onClipDoubleClick={(id) => { const c = comp.clips.find((x) => x.id === id); if (c) { clock.pause(); clock.seek(snapFrame(c.start + Math.min(c.dur / 2, c.enter.dur + 100))) } }}
          height={244}
          empty={<Empty icon={Clapperboard} title="Nothing on the timeline" hint="Add a clip from the library, or press ⇧T for text." />}
        />
      }
    >
      <Stage contentSize={{ w: W, h: H }} padding={40} overlay={empty ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="cluster pointer-events-auto">
            <Empty icon={Clapperboard} title="An empty composition" hint="Start with a headline, drop in a generated image, or bring back the demo teaser."
              action={<div className="mt-1 flex gap-1.5"><Button size="sm" variant="primary" onClick={() => addClip('text')}><Type size={13} />Add text</Button><Button size="sm" variant="default" onClick={() => setComp(demoComp())}>Load demo</Button></div>} />
          </div>
        </div>
      ) : undefined}>
        <Artboard width={W} height={H} label={`${v.aspect} · ${ASPECTS[v.aspect as Aspect].label}`} background={v.matte} className={cn(v.aspect === '9:16' && 'rounded-[28px]')}>
          <CanvasSurface ref={surface} params={params} clock={clock} width={W} height={H} pixelRatio={Number(v.quality)}
            draw={(ctx, f) => drawComp(ctx, (f.v as V).comp as unknown as typeof comp, f.t, f.w, f.h, { matte: (f.v as V).matte })} />
          <CanvasOverlay W={W} H={H} />
        </Artboard>
      </Stage>
      <input ref={fileIn} type="file" accept="application/json,.json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: 'delete', label: 'Delete selection' },
        { keys: 'arrowleft', label: 'Nudge position (shift ×10)' },
        { keys: 'alt+arrowleft', label: 'Move clip a frame (shift ×10)' },
        { keys: 'esc', label: 'Deselect' },
        { keys: 'shift+1', label: 'Zoom to fit' },
        { keys: '\\', label: 'A/B compare' },
      ]} />
    </Studio>
  )
}

