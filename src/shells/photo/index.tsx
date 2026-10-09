/* Develop — a non-destructive photo editor. The artifact is a WebGL2 shader
   (develop.ts) drawing into a canvas on a kit Artboard; everything else is
   chrome. Docked layout, Lightroom's Develop module as the reference. */
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { Popover } from '@base-ui/react/popover'
import {
  Braces, Columns2, Contrast, Crop, Download, ImageDown, ImagePlus, ImageUp, Images, Palette, Plus, RectangleHorizontal, RectangleVertical,
  RotateCcw, Triangle, WandSparkles, X, ZoomIn,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Section, Row, Stage, Artboard, Menu, Button, IconButton, CommandPalette,
  HistoryButtons, HistoryList, ThemeToggle, Segmented, ScrubValue, TextInput, ImageDrop, Empty, Divider, Kbd, Badge, toast, download,
  shareMenuItems, createCamera, useParamState, useHotkeys, useHoldKey, clamp, cn, type Command,
} from '@kit'
import { ToneCurve, Histogram, histogramBins, type CurvePoint, type Bins } from '@kit/ui/charts'
import { ParamSlider, GradientSlider } from '@kit/ui/param-slider'
import { CropOverlay, Navigator, fitInsideRotated, rectForAspect, type CropRect as Rect } from '@kit/stage/overlays'
import { CompareSplit } from '@kit/stage/CompareSplit'
import { Filmstrip } from '@kit/ui/preset-grid'
import { useImageIntake } from '@kit/core/image-intake'
import {
  params, ui, history, stepLabel, BANDS, ASPECTS, FULL, LOOK_KEYS, DEFAULTS, lookDefaults, lookValues, activeLook, allLooks, type V, type Look, type CropDraft,
} from './state'
import { Develop, type ViewOpts } from './develop'
import { generateLandscape } from './landscape'

/* ===== engine glue (module level: outside React, like the artifact) ===== */
const cam = createCamera()
const eng: { dev: Develop | null } = { dev: null }
const stats = createStore<{ bins: Bins | null; nav: ImageData | null }>(() => ({ bins: null, nav: null }))
let sample: HTMLCanvasElement | null = null

const lookById = (id: string) => allLooks().find((l) => l.id === id)
function effective(): V {
  const v = params.values()
  const id = ui.getState().preview
  const l = id ? lookById(id) : null
  return l ? { ...v, ...lookValues(l) } : v
}
function currentView(): ViewOpts {
  const s = ui.getState()
  const v = params.values()
  if (s.cropping) return { crop: FULL, angle: s.cropping.angle, bypass: s.bypass, split: null, clip: s.clip }
  return { crop: v.crop as Rect, angle: v.angle, bypass: s.bypass, split: s.split, clip: s.clip }
}

let raf = 0
function requestRender() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw() }) }
function draw() {
  const dev = eng.dev
  if (!dev || !ui.getState().hasImage) return
  dev.draw(effective(), currentView())
  scheduleStats()
}
let statsTimer = 0
let lastStats = 0
function scheduleStats() {
  if (statsTimer) return
  statsTimer = window.setTimeout(() => {
    statsTimer = 0
    lastStats = performance.now()
    const dev = eng.dev
    if (!dev) return
    const vw = currentView()
    const { w, h } = dev.outSize(vw)
    const k = Math.min(1, 256 / Math.max(w, h))
    const sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k))
    const px = dev.pixels(effective(), { crop: vw.crop, angle: vw.angle }, sw, sh)
    stats.setState({ bins: histogramBins(px), nav: new ImageData(px, sw, sh) })
  }, Math.max(0, 80 - (performance.now() - lastStats)))
}
let thumbTimer = 0
function refreshThumbs(delay = 180) {
  clearTimeout(thumbTimer)
  thumbTimer = window.setTimeout(() => {
    const dev = eng.dev
    if (!dev || !ui.getState().hasImage) return
    const v = params.values()
    const vw = { crop: v.crop as Rect, angle: v.angle }
    const { w, h } = dev.outSize(vw)
    const tw = 240, th = Math.max(1, Math.round((240 * h) / w))
    const thumbs: Record<string, string> = {}
    for (const l of allLooks()) thumbs[l.id] = dev.thumb(lookValues(l), vw, tw, Math.min(th, 360))
    ui.setState({ thumbs })
  }, delay)
}

function loadSource(src: HTMLImageElement | HTMLCanvasElement, name: string, fresh: boolean) {
  const dev = eng.dev
  if (!dev) return
  let w = src instanceof HTMLImageElement ? src.naturalWidth : src.width
  let h = src instanceof HTMLImageElement ? src.naturalHeight : src.height
  let el: TexImageSource = src
  const MAX = Math.min(3200, dev.gl.getParameter(dev.gl.MAX_TEXTURE_SIZE) as number)
  if (Math.max(w, h) > MAX) {
    const k = MAX / Math.max(w, h)
    const c = document.createElement('canvas')
    c.width = Math.round(w * k)
    c.height = Math.round(h * k)
    const g = c.getContext('2d')!
    g.imageSmoothingQuality = 'high'
    g.drawImage(src, 0, 0, c.width, c.height)
    el = c
    w = c.width
    h = c.height
  }
  dev.setSource(el, w, h)
  ui.setState({ file: name, hasImage: true, imageSize: { w, h }, cropping: null, split: null })
  const v = params.values()
  if (fresh && (JSON.stringify(v.crop) !== JSON.stringify(FULL) || v.angle !== 0 || v.aspect !== 'free'))
    params.patch({ crop: FULL, angle: 0, aspect: 'free' }, { label: `Open ${name}` })
  requestRender()
  refreshThumbs(60)
  requestAnimationFrame(() => cam.fit())
}
const openSample = (fresh: boolean) => { sample ??= generateLandscape(); loadSource(sample, 'Ridgeline at dusk.jpg', fresh) }
async function openURL(url: string, name: string) {
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    loadSource(img, name, true)
    toast(`Opened ${name}`, { type: 'success', description: 'Your current look is kept — pick Original to start clean.' })
  } catch { toast('Could not read that image', { type: 'error' }) }
}

/* ===== actions ===== */
function applyLook(id: string) {
  const l = lookById(id)
  if (!l) return
  ui.setState({ preview: null })
  params.patch(lookValues(l), { label: `Preset: ${l.name}` })
}
function stepLook(d: number) {
  const looks = allLooks()
  const cur = activeLook(params.values(), looks)
  const i = looks.findIndex((l) => l.id === cur)
  applyLook(looks[(i + d + looks.length) % looks.length].id)
}
function resetAll() { params.patch(lookDefaults(), { label: 'Reset adjustments' }) }
function saveLook() {
  const name = prompt('Preset name', `My look ${ui.getState().userLooks.length + 1}`)
  if (!name) return
  const v = params.values()
  const values = Object.fromEntries(LOOK_KEYS.filter((k) => JSON.stringify(v[k]) !== JSON.stringify(DEFAULTS[k])).map((k) => [k, structuredClone(v[k])]))
  const look: Look = { id: `u${Date.now().toString(36)}`, name, values }
  ui.setState((s) => ({ userLooks: [...s.userLooks, look] }))
  toast(`Saved “${name}”`, { type: 'success', description: 'Only the look is saved — crop stays with the photo.' })
}
function autoTone() {
  const dev = eng.dev
  if (!dev) return
  const v = params.values()
  const vw = { crop: v.crop as Rect, angle: v.angle, bypass: true }
  const { w, h } = dev.outSize(vw)
  const k = 256 / Math.max(w, h)
  const b = histogramBins(dev.pixels(v, vw, Math.round(w * k), Math.round(h * k)))
  const pct = (p: number) => { let acc = 0; for (let i = 0; i < 256; i++) { acc += b.l[i]; if (acc >= b.total * p) return i / 255 } return 1 }
  const lo = pct(0.005), mid = pct(0.5), hi = pct(0.995)
  const lin = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  params.patch({
    exposure: Math.round(clamp(Math.log2(lin(0.45) / Math.max(1e-4, lin(mid))) * 0.65, -2, 2) * 100) / 100,
    contrast: 8,
    highlights: hi > 0.96 ? -38 : -12,
    shadows: mid < 0.4 ? 24 : 10,
    whites: Math.round(clamp((0.97 - hi) * 260, -30, 50)),
    blacks: Math.round(clamp(-(lo - 0.02) * 320, -45, 20)),
    vibrance: 12,
  }, { label: 'Auto tone' })
  toast('Auto tone applied', { description: 'Exposure, contrast and end points set from the histogram.' })
}
const fileBase = () => ui.getState().file.replace(/\.[a-z0-9]+$/i, '')
async function exportImage(o: { format: 'jpeg' | 'png'; quality: number; long: number | null; name: string }) {
  const dev = eng.dev
  if (!dev) return
  const v = params.values()
  const vw = { crop: v.crop as Rect, angle: v.angle }
  const { w, h } = dev.outSize(vw)
  const k = o.long ? Math.min(1, o.long / Math.max(w, h)) : 1
  const c = dev.toCanvas(v, vw, Math.round(w * k), Math.round(h * k))
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, o.format === 'jpeg' ? 'image/jpeg' : 'image/png', o.quality / 100))
  if (!blob) return void toast('Export failed', { type: 'error' })
  download(blob, `${o.name || fileBase()}.${o.format === 'jpeg' ? 'jpg' : 'png'}`)
  toast(`Exported ${o.format === 'jpeg' ? 'JPG' : 'PNG'}`, { type: 'success', description: `${c.width} × ${c.height} · ${(blob.size / 1024 / 1024).toFixed(1)} MB` })
}
function exportCube(n = 33) {
  const dev = eng.dev
  if (!dev) return
  const name = activeLook(params.values(), allLooks())
  const title = (name && lookById(name)?.name) || `${fileBase()} look`
  download(new Blob([dev.cube(params.values(), n, title)], { type: 'text/plain' }), `${title.replace(/[^\w-]+/g, '-').toLowerCase()}-${n}.cube`)
  toast('LUT exported', { type: 'success', description: `${n}³ .cube — global colour and tone only; crop, vignette, grain and sharpening are spatial and stay out.` })
}

/* crop */
const ratioOf = (a: string, W: number, H: number): number | null => {
  if (a === 'free') return null
  if (a === 'original') return W / H
  const [x, y] = a.split(':').map(Number)
  return x && y ? x / y : null
}
const presetOf = (a: string) => ASPECTS.find((x) => x.value === a || x.value === a.split(':').reverse().join(':'))?.value ?? 'free'
function enterCrop() {
  const v = params.values()
  ui.setState({ cropping: { crop: v.crop as Rect, angle: v.angle, aspect: v.aspect }, preview: null })
  requestAnimationFrame(() => cam.fit())
}
function applyCrop() {
  const d = ui.getState().cropping
  if (!d) return
  const v = params.values()
  ui.setState({ cropping: null })
  if (JSON.stringify([d.crop, d.angle, d.aspect]) === JSON.stringify([v.crop, v.angle, v.aspect])) return
  params.patch({ crop: d.crop, angle: d.angle, aspect: d.aspect }, { label: d.angle !== v.angle ? `Crop & straighten ${d.angle > 0 ? '+' : ''}${d.angle.toFixed(1)}°` : 'Crop' })
}
const cancelCrop = () => ui.setState({ cropping: null })
const setDraft = (p: Partial<CropDraft>) => ui.setState((s) => (s.cropping ? { cropping: { ...s.cropping, ...p } } : {}))
function fitDraft(d: CropDraft, aspect: number | null, crop = d.crop): Rect {
  const { w: W, h: H } = ui.getState().imageSize
  const cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2
  const ar = aspect ?? (crop.w * W) / (crop.h * H)
  return fitInsideRotated(rectForAspect(ar, W, H, cx, cy), d.angle, W, H)
}
function setAspect(a: string) {
  const d = ui.getState().cropping
  if (!d) return
  const { w: W, h: H } = ui.getState().imageSize
  const r = ratioOf(a, W, H)
  setDraft({ aspect: a, crop: r ? fitDraft(d, r) : d.crop })
}
function flipAspect() {
  const d = ui.getState().cropping
  if (!d) return
  const { w: W, h: H } = ui.getState().imageSize
  const a = d.aspect === 'original' ? `${H}:${W}` : d.aspect === 'free' ? null : d.aspect.split(':').reverse().join(':')
  if (!a) {
    const ar = (d.crop.h * H) / (d.crop.w * W)
    return setDraft({ crop: fitDraft(d, ar) })
  }
  setDraft({ aspect: a, crop: fitDraft(d, ratioOf(a, W, H)) })
}
function setAngle(angle: number) {
  const d = ui.getState().cropping
  if (!d) return
  const { w: W, h: H } = ui.getState().imageSize
  setDraft({ angle, crop: fitDraft({ ...d, angle }, ratioOf(d.aspect, W, H)) })
}
const resetCrop = () => setDraft({ crop: FULL, angle: 0, aspect: 'free' })

const toggleCrop = () => (ui.getState().cropping ? applyCrop() : enterCrop())
const toggleSplit = () => ui.setState((s) => ({ split: s.split === null ? 0.5 : null }))
const toggleClip = () => ui.setState((s) => { const on = !(s.clip.shadows && s.clip.highlights); return { clip: { shadows: on, highlights: on } } })
const toggleZoom = () => (Math.abs(cam.getState().zoom - 1) < 0.01 ? cam.fit() : cam.zoomTo(1))

/* track styles — the gradients depict what the slider does (Lightroom) */
const TRACK = {
  temp: 'linear-gradient(90deg,#3f74d9,#bdbdbd 50%,#e3c443)',
  tint: 'linear-gradient(90deg,#44a852,#bdbdbd 50%,#c24bb5)',
  tone: 'linear-gradient(90deg,#1f1f1f,#8c8c8c 50%,#ececec)',
  sat: 'linear-gradient(90deg,#8d8d8d,#c96c6c 30%,#d8c25a 50%,#5fb56a 70%,#5a86d6)',
}
const bandTrack = (hue: number, mode: 'h' | 's' | 'l') =>
  mode === 'h' ? `linear-gradient(90deg,hsl(${hue - 30} 75% 55%),hsl(${hue} 75% 55%),hsl(${hue + 30} 75% 55%))`
    : mode === 's' ? `linear-gradient(90deg,hsl(${hue} 0% 55%),hsl(${hue} 85% 55%))`
      : `linear-gradient(90deg,hsl(${hue} 60% 16%),hsl(${hue} 70% 50%),hsl(${hue} 70% 88%))`

const changedOf = (v: V, keys: string[]) => keys.some((k) => JSON.stringify(v[k]) !== JSON.stringify(DEFAULTS[k]))
const resetKeys = (title: string, keys: string[]) => () =>
  params.patch(Object.fromEntries(keys.map((k) => [k, structuredClone(DEFAULTS[k])])), { label: `Reset ${title.toLowerCase()}` })
/** A develop slider: Inspector-identical row, painted track, named undo step. */
const Slide = ({ k, track, label }: { k: string; track?: string; label?: string }) => <ParamSlider params={params} k={k} track={track} label={label} stepLabel={stepLabel(k)} />

/* ========================================================================== */
export default function DevelopShell() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const s = useStore(ui)
  const v = useParamState(params, (x) => x.values) as V
  const zoom = useStore(cam, (c) => c.zoom)
  const nav = useStore(stats, (x) => x.nav)
  const [exportOpen, setExportOpen] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  // Drop anywhere, paste, or Open… The photo is decoded into a texture and never stored in params.
  // ⌘O is bound by the palette's Open command below.
  const intake = useImageIntake((img) => openURL(img.url, img.name), { hotkey: false })

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    let dev: Develop
    try { dev = new Develop(c) } catch (e) { setFailed(e instanceof Error ? e.message : String(e)); return }
    eng.dev = dev
    if (ui.getState().hasImage) openSample(false)
    const offP = params.subscribe(requestRender)
    const offU = ui.subscribe((n, p) => {
      if (n.preview !== p.preview || n.bypass !== p.bypass || n.split !== p.split || n.clip !== p.clip || n.cropping !== p.cropping || n.hasImage !== p.hasImage) requestRender()
      if (n.userLooks !== p.userLooks) refreshThumbs()
    })
    let geo = JSON.stringify([params.values().crop, params.values().angle])
    const offC = params.onCommit((nv) => { const g = JSON.stringify([nv.crop, nv.angle]); if (g !== geo) { geo = g; refreshThumbs() } })
    return () => {
      offP(); offU(); offC()
      cancelAnimationFrame(raf); raf = 0
      clearTimeout(thumbTimer); clearTimeout(statsTimer); statsTimer = 0
      dev.dispose()
      if (eng.dev === dev) eng.dev = null
    }
  }, [])

  const W = s.imageSize.w, H = s.imageSize.h
  const crop = v.crop as Rect
  const out = s.cropping ? { w: W, h: H } : { w: Math.max(1, Math.round(crop.w * W)), h: Math.max(1, Math.round(crop.h * H)) }
  useEffect(() => { const id = requestAnimationFrame(() => cam.fit()); return () => cancelAnimationFrame(id) }, [out.w, out.h])

  useHoldKey('\\', (held) => ui.setState({ bypass: held }))
  useHotkeys(s.cropping ? { enter: applyCrop, esc: cancelCrop, x: flipAspect } : {}, [!!s.cropping])

  const looks = allLooks()
  const active = activeLook(v, looks)
  const commands: Command[] = [
    { id: 'crop', label: s.cropping ? 'Apply crop' : 'Crop & straighten', group: 'Edit', shortcut: 'c', icon: Crop, run: toggleCrop },
    { id: 'auto', label: 'Auto tone', group: 'Edit', shortcut: 'shift+a', icon: WandSparkles, run: autoTone },
    { id: 'reset', label: 'Reset all adjustments', group: 'Edit', shortcut: 'shift+mod+r', icon: RotateCcw, run: resetAll },
    { id: 'split', label: 'Before / after split view', group: 'View', shortcut: 'y', icon: Columns2, run: toggleSplit },
    { id: 'clip', label: 'Show clipping on the image', group: 'View', shortcut: 'j', icon: Triangle, run: toggleClip },
    { id: 'zoom', label: 'Toggle fit / 100%', group: 'View', shortcut: 'z', icon: ZoomIn, run: toggleZoom },
    { id: 'next', label: 'Next preset', group: 'Presets', shortcut: ']', run: () => stepLook(1) },
    { id: 'prev', label: 'Previous preset', group: 'Presets', shortcut: '[', run: () => stepLook(-1) },
    { id: 'save', label: 'Save look as preset…', group: 'Presets', icon: Plus, run: saveLook },
    ...looks.map((l) => ({ id: `look-${l.id}`, label: `Preset: ${l.name}`, group: 'Presets', run: () => applyLook(l.id) })),
    { id: 'export', label: 'Export…', group: 'Export', shortcut: 'mod+e', icon: Download, run: () => setExportOpen(true) },
    { id: 'quick', label: 'Quick export JPG, full size', group: 'Export', shortcut: 'shift+mod+e', icon: ImageDown, run: () => exportImage({ format: 'jpeg', quality: 90, long: null, name: fileBase() }) },
    { id: 'cube', label: 'Export look as .cube LUT', group: 'Export', shortcut: 'shift+mod+l', icon: Palette, run: () => exportCube(33) },
    { id: 'open', label: 'Open photo…', group: 'File', shortcut: 'mod+o', icon: ImageUp, run: intake.open },
    { id: 'sample', label: 'Use the sample photo', group: 'File', icon: Images, run: () => openSample(true) },
    { id: 'close', label: 'Close photo', group: 'File', icon: X, run: () => ui.setState({ hasImage: false, cropping: null }) },
  ]

  const mark = (
    <svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 2.4v11.2M8 2.4a5.6 5.6 0 0 1 0 11.2z" fill="currentColor" /></svg>
  )

  return (
    <Studio
      layout="docked"
      leftWidth={264}
      rightWidth={308}
      toolbar={
        <Toolbar
          start={<Brand name="Develop" doc={s.file} mark={mark} />}
          center={
            <Cluster>
              <IconButton icon={Crop} label={s.cropping ? 'Apply crop' : 'Crop & straighten'} shortcut="c" active={!!s.cropping} onClick={toggleCrop} disabled={!s.hasImage} />
              <IconButton icon={Columns2} label="Before / after split" shortcut="y" active={s.split !== null} onClick={toggleSplit} disabled={!s.hasImage || !!s.cropping} />
              <IconButton icon={Contrast} label="Hold to see the original" shortcut="\\" active={s.bypass} disabled={!s.hasImage}
                onPointerDown={() => ui.setState({ bypass: true })} onPointerUp={() => ui.setState({ bypass: false })} onPointerLeave={() => s.bypass && ui.setState({ bypass: false })} />
              <Divider vertical />
              <IconButton icon={Triangle} label="Clipping warnings" shortcut="j" active={s.clip.shadows && s.clip.highlights} onClick={toggleClip} disabled={!s.hasImage} />
              <IconButton icon={WandSparkles} label="Auto tone" shortcut="shift+a" onClick={autoTone} disabled={!s.hasImage} />
            </Cluster>
          }
          end={
            <>
              <Cluster>
                <HistoryButtons history={history} />
                <Divider vertical />
                <Menu align="end" trigger={<IconButton icon={Braces} label="Share & copy settings" />}
                  items={[...shareMenuItems(params), { type: 'separator' }, { label: 'Export look as .cube LUT', icon: Palette, shortcut: 'shift+mod+l', onClick: () => exportCube(33) }]} />
                <ThemeToggle />
              </Cluster>
              <ExportPopover open={exportOpen} onOpenChange={setExportOpen} out={out} disabled={!s.hasImage} />
            </>
          }
        />
      }
      left={
        <Panel>
          <Section title="Navigator" persistKey="photo:navigator" first>
            <Navigator camera={cam} content={out} image={nav} />
          </Section>
          <Section title="History" persistKey="photo:history" actions={<HistoryCount />}>
            <HistoryList history={history} openLabel="Open" className="px-1.5" />
          </Section>
          <Section title="Photo" persistKey="photo:photo">
            <div className="flex flex-col gap-2 px-3">
              <ImageDrop value={null} onChange={(url) => url && openURL(url, 'Pasted photo')} compact />
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="truncate text-fg-muted">{s.file}</span>
                <span className="tabular text-fg-faint">{W} × {H}</span>
              </div>
              <div className="flex gap-1.5">
                <Button size="md" variant="default" className="flex-1" onClick={intake.open}><ImageUp size={13} strokeWidth={1.5} />Open…</Button>
                <Button size="md" variant="default" className="flex-1" onClick={() => openSample(true)}><Images size={13} strokeWidth={1.5} />Sample</Button>
              </div>
              <p className="text-[11px] leading-relaxed text-fg-faint">Drop or paste a photo anywhere. Edits never touch the pixels — every setting is re-applied live from the original.</p>
            </div>
          </Section>
        </Panel>
      }
      right={
        <Panel header={<HistogramCard out={out} active={active ? lookById(active)?.name ?? null : null} />}>
          <Adjustments v={v} />
        </Panel>
      }
      bottom={
        <div className="h-[136px]">
          <Filmstrip
            label="Presets"
            items={looks.map((l) => ({ id: l.id, name: l.name, thumb: s.thumbs[l.id], removable: l.user, group: l.group }))}
            value={active}
            onApply={applyLook}
            onPreview={(id) => ui.setState({ preview: id })}
            onRemove={(id) => ui.setState((x) => ({ userLooks: x.userLooks.filter((l) => l.id !== id) }))}
            trailing={
              <button type="button" onClick={saveLook}
                className="flex shrink-0 flex-col items-center justify-center gap-1 self-start rounded-[8px] text-[11.5px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal"
                style={{ width: 120, height: 80, marginTop: 4, boxShadow: 'inset 0 0 0 1px var(--line-strong)' }}>
                <Plus size={16} strokeWidth={1.5} />Save look
              </button>
            }
          />
        </div>
      }
    >
      {intake.input}
      <div className="relative h-full w-full">
        <Stage camera={cam} contentSize={out} padding={40} overlay={<StageOverlay />}>
          <Artboard width={out.w} height={out.h} label={s.file} background="#111" className={cn(!s.hasImage && 'invisible')}>
            <canvas ref={canvas} className="absolute inset-0 block size-full" style={{ imageRendering: zoom >= 2 ? 'pixelated' : 'auto' }} />
            {s.cropping && (
              <CropOverlay
                frame={{ w: W, h: H }}
                rect={s.cropping.crop}
                aspect={ratioOf(s.cropping.aspect, W, H)}
                constrain={(r) => fitInsideRotated(r, s.cropping!.angle, W, H)}
                onChange={(r) => setDraft({ crop: r })}
                grid={s.cropping.angle !== 0 ? 'fine' : 'thirds'}
              />
            )}
            {/* the shader draws the split; this is the handle + labels */}
            {!s.cropping && s.split !== null && <CompareSplit value={s.split} onChange={(x) => ui.setState({ split: x })} peek={s.bypass} peekLabel={null} />}
          </Artboard>
        </Stage>
        {!s.hasImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-field">
            <Empty icon={ImagePlus} title="No photo open" hint="Drop a photo here, paste one with ⌘V, or start from the generated sample."
              action={<div className="mt-2 flex gap-2"><Button variant="primary" size="md" onClick={intake.open}>Open photo…</Button><Button variant="default" size="md" onClick={() => openSample(true)}>Use sample</Button></div>} />
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-field">
            <Empty icon={X} title="The develop engine couldn’t start" hint={`It needs WebGL2. ${failed}`} />
          </div>
        )}
        {intake.over && <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-[12px] bg-signal-soft text-[13px] font-medium text-signal shadow-[inset_0_0_0_2px_var(--signal)]">Drop to open</div>}
      </div>
      <CommandPalette
        commands={commands}
        extraShortcuts={[
          { keys: '\\', label: 'Hold for before' },
          { keys: 'enter', label: 'Apply crop (in crop)' },
          { keys: 'esc', label: 'Cancel crop' },
          { keys: 'x', label: 'Swap crop orientation' },
          { keys: 'shift+1', label: 'Zoom to fit' },
          { keys: 'shift+0', label: 'Zoom to 100%' },
          { keys: 'space', label: 'Drag to pan' },
        ]}
      />
    </Studio>
  )
}

function HistoryCount() {
  const n = useStore(history, (h) => h.past.length + 1)
  return <span className="pr-1 text-[11px] tabular text-fg-faint">{n}</span>
}

/* ===== stage overlay: crop bar + status chips ===== */
function StageOverlay() {
  const s = useStore(ui)
  const d = s.cropping
  const preview = s.preview ? lookById(s.preview)?.name : null
  const chip = 'cluster absolute top-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-2 px-3 text-[12px]'
  if (d)
    return (
      <div className="cluster absolute top-3 left-1/2 flex h-10 max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1.5 overflow-x-auto px-2">
        <span className="shrink-0 pl-1 text-[11.5px] text-fg-muted">Aspect</span>
        <div className="w-[268px] shrink-0">
          <Segmented size="sm" label="Aspect" value={presetOf(d.aspect)} onChange={setAspect} options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))} />
        </div>
        <IconButton size="icon-sm" icon={d.aspect.split(':').map(Number).reduce((a, b) => a / b) < 1 ? RectangleVertical : RectangleHorizontal} label="Swap orientation" shortcut="x" onClick={flipAspect} />
        <Divider vertical />
        <span className="shrink-0 text-[11.5px] text-fg-muted">Straighten</span>
        <div className="w-[112px] shrink-0"><GradientSlider value={d.angle} onChange={(a) => setAngle(a)} min={-45} max={45} step={0.1} origin={0} label="Straighten" /></div>
        <ScrubValue value={d.angle} onChange={(a) => setAngle(a)} min={-45} max={45} step={0.1} unit="°" defaultValue={0} label="Straighten angle" className="w-[50px] shrink-0" />
        <Divider vertical />
        <Button size="md" onClick={resetCrop}>Reset</Button>
        <Button size="md" onClick={cancelCrop}>Cancel</Button>
        <Button size="md" variant="primary" onClick={applyCrop} title="Apply crop (Enter)">Done</Button>
      </div>
    )
  if (s.bypass) return <div className={chip}><span className="size-1.5 rounded-full bg-key" />Before — release <Kbd>\</Kbd> for after</div>
  if (preview) return <div className={chip}><span className="size-1.5 rounded-full bg-signal" />Previewing <span className="font-medium">{preview}</span><span className="text-fg-faint">click to apply</span></div>
  return null
}

/* ===== right panel ===== */
function HistogramCard({ out, active }: { out: { w: number; h: number }; active: string | null }) {
  const bins = useStore(stats, (x) => x.bins)
  const clip = useStore(ui, (x) => x.clip)
  return (
    <div className="border-b border-line p-3">
      <Histogram
        bins={bins}
        clip={clip}
        onClip={(which) => ui.setState((x) => ({ clip: { ...x.clip, [which]: !x.clip[which] } }))}
        footer={
          <div className="flex items-center gap-2 text-[11px]">
            <span className="tabular text-fg-muted">{out.w} × {out.h}</span>
            <span className="text-fg-faint">·</span>
            <span className="text-fg-faint">sRGB</span>
            <span className="ml-auto truncate">{active ? <Badge tone="accent">{active}</Badge> : <Badge>Custom</Badge>}</span>
          </div>
        }
      />
    </div>
  )
}

const BASIC_WB = ['temp', 'tint']
const BASIC_TONE = ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks']
const BASIC_PRES = ['texture', 'clarity', 'dehaze', 'vibrance', 'saturation']
const CURVE_KEYS = ['curveRGB', 'curveR', 'curveG', 'curveB']
const HSL_KEYS = BANDS.flatMap((b) => ['h', 's', 'l'].map((c) => `hsl_${b.id}_${c}`))
const VIG_KEYS = ['vignette', 'vigMid', 'vigFeather']
const GRAIN_KEYS = ['grain', 'grainSize']
const SHARP_KEYS = ['sharpen', 'sharpRadius']
const sub = (t: string) => <div className="px-3 pt-2 pb-0.5 text-[11px] text-fg-faint no-select">{t}</div>

function Adjustments({ v }: { v: V }) {
  const s = useStore(ui)
  const bins = useStore(stats, (x) => x.bins)
  const basic = [...BASIC_WB, ...BASIC_TONE, ...BASIC_PRES]
  const ch = s.curveChannel
  const ck = { RGB: 'curveRGB', R: 'curveR', G: 'curveG', B: 'curveB' }[ch]
  const ccolor = { RGB: 'var(--fg)', R: 'var(--cat-5)', G: 'var(--cat-3)', B: 'var(--cat-1)' }[ch]
  const chist = bins ? { RGB: bins.l, R: bins.r, G: bins.g, B: bins.b }[ch] : null
  const pts = v[ck] as CurvePoint[]
  const curveStep = `Tone curve${ch === 'RGB' ? '' : ` · ${ch}`}`
  const curvePreset = (p: CurvePoint[], name: string) => params.setValue(ck, p, { label: `${curveStep} · ${name}` })
  return (
    <>
      <Section title="Basic" persistKey="photo:basic" first changed={changedOf(v, basic)} onReset={changedOf(v, basic) ? resetKeys('Basic', basic) : undefined}
        actions={<Button size="sm" variant="default" onClick={autoTone} className="mr-0.5">Auto</Button>}>
        {sub('White balance')}
        <Slide k="temp" track={TRACK.temp} />
        <Slide k="tint" track={TRACK.tint} />
        {sub('Tone')}
        {BASIC_TONE.map((k) => <Slide key={k} k={k} track={TRACK.tone} />)}
        {sub('Presence')}
        <Slide k="texture" />
        <Slide k="clarity" />
        <Slide k="dehaze" />
        <Slide k="vibrance" track={TRACK.sat} />
        <Slide k="saturation" track={TRACK.sat} />
      </Section>
      <Section title="Tone curve" persistKey="photo:curve" changed={changedOf(v, CURVE_KEYS)} onReset={changedOf(v, CURVE_KEYS) ? resetKeys('Tone curve', CURVE_KEYS) : undefined}>
        <div className="flex flex-col gap-2 px-3">
          <Segmented size="sm" label="Curve channel" value={ch} onChange={(c) => ui.setState({ curveChannel: c as typeof ch })}
            options={[{ value: 'RGB', label: 'RGB' }, { value: 'R', label: 'Red' }, { value: 'G', label: 'Green' }, { value: 'B', label: 'Blue' }]} />
          <ToneCurve value={pts} onChange={(p, final) => params.setValue(ck, p, { commit: final, label: curveStep })} color={ccolor} histogram={chist} label={`${ch} tone curve`} />
          <div className="flex gap-1">
            {([['Linear', [[0, 0], [1, 1]]], ['Medium', [[0, 0], [0.25, 0.21], [0.75, 0.8], [1, 1]]], ['Strong', [[0, 0], [0.25, 0.17], [0.75, 0.85], [1, 1]]]] as [string, CurvePoint[]][]).map(([n, p]) => (
              <button key={n} type="button" onClick={() => curvePreset(p, n)}
                className={cn('h-5 flex-1 rounded-[5px] text-[10.5px] outline-none focus-visible:ring-2 focus-visible:ring-signal', JSON.stringify(p) === JSON.stringify(pts) ? 'bg-signal-soft text-signal' : 'bg-hover text-fg-muted hover:text-fg')}>
                {n === 'Linear' ? n : `${n} contrast`}
              </button>
            ))}
          </div>
        </div>
      </Section>
      <Section title="Colour mixer" persistKey="photo:mixer" changed={changedOf(v, HSL_KEYS)} onReset={changedOf(v, HSL_KEYS) ? resetKeys('Colour mixer', HSL_KEYS) : undefined}>
        <div className="px-3 pb-1">
          <Segmented size="sm" label="Mixer mode" value={s.hslMode} onChange={(m) => ui.setState({ hslMode: m as 'h' | 's' | 'l' })}
            options={[{ value: 'h', label: 'Hue' }, { value: 's', label: 'Saturation' }, { value: 'l', label: 'Luminance' }]} />
        </div>
        {BANDS.map((b) => (
          <Slide key={`${b.id}-${s.hslMode}`} k={`hsl_${b.id}_${s.hslMode}`} label={b.name} track={bandTrack(b.hue, s.hslMode)} />
        ))}
      </Section>
      <Section title="Vignette" persistKey="photo:vignette" changed={changedOf(v, VIG_KEYS)} onReset={changedOf(v, VIG_KEYS) ? resetKeys('Vignette', VIG_KEYS) : undefined}>
        <Slide k="vignette" track="linear-gradient(90deg,#141414,#8c8c8c 50%,#f0f0f0)" />
        <Slide k="vigMid" />
        <Slide k="vigFeather" />
      </Section>
      {/* Hand-built (not <Inspector>) so each step is named "Grain 24", not "Amount". */}
      <Section title="Grain" persistKey="photo:grain" changed={changedOf(v, GRAIN_KEYS)} onReset={changedOf(v, GRAIN_KEYS) ? resetKeys('Grain', GRAIN_KEYS) : undefined}>
        <Slide k="grain" />
        <Slide k="grainSize" />
      </Section>
      <Section title="Sharpening" persistKey="photo:sharpen" changed={changedOf(v, SHARP_KEYS)} onReset={changedOf(v, SHARP_KEYS) ? resetKeys('Sharpening', SHARP_KEYS) : undefined}>
        <Slide k="sharpen" />
        <Slide k="sharpRadius" />
      </Section>
      <CropSummary v={v} />
    </>
  )
}

function CropSummary({ v }: { v: V }) {
  const size = useStore(ui, (x) => x.imageSize)
  const crop = v.crop as Rect
  const keys = ['crop', 'angle', 'aspect']
  const changed = changedOf(v, keys)
  return (
    <Section title="Crop & straighten" persistKey="photo:crop" changed={changed} onReset={changed ? resetKeys('Crop', keys) : undefined}>
      <Row label="Aspect"><span className="flex-1 text-right text-[11.5px] text-fg tabular">{ASPECTS.find((a) => a.value === v.aspect)?.label ?? v.aspect}</span></Row>
      <Row label="Straighten"><span className="flex-1 text-right text-[11.5px] text-fg tabular">{v.angle > 0 ? '+' : ''}{Number(v.angle).toFixed(1)}°</span></Row>
      <Row label="Output"><span className="flex-1 text-right text-[11.5px] text-fg tabular">{Math.round(crop.w * size.w)} × {Math.round(crop.h * size.h)}</span></Row>
      <div className="px-3 pt-1.5">
        <Button size="md" variant="default" className="w-full" onClick={enterCrop}><Crop size={13} strokeWidth={1.5} />Edit crop <Kbd>C</Kbd></Button>
      </div>
    </Section>
  )
}

/* ===== export ===== */
function ExportPopover({ open, onOpenChange, out, disabled }: { open: boolean; onOpenChange: (o: boolean) => void; out: { w: number; h: number }; disabled?: boolean }) {
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [quality, setQuality] = useState(88)
  const [size, setSize] = useState('full')
  const [name, setName] = useState('')
  const [lut, setLut] = useState('33')
  const long = size === 'full' ? null : Number(size)
  const k = long ? Math.min(1, long / Math.max(out.w, out.h)) : 1
  const dims = `${Math.round(out.w * k)} × ${Math.round(out.h * k)}`
  const file = useStore(ui, (x) => x.file)
  const base = name || file.replace(/\.[a-z0-9]+$/i, '')
  return (
    <Popover.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Popover.Trigger disabled={disabled} render={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
          <Popover.Popup className="pop w-[312px] origin-[var(--transform-origin)] py-2 outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <PanelHeader title="Export photo" className="-mt-2 mb-1" />
            <Row label="Format"><Segmented size="sm" label="Format" value={format} onChange={(f) => setFormat(f as 'jpeg' | 'png')} options={[{ value: 'jpeg', label: 'JPG' }, { value: 'png', label: 'PNG' }]} /></Row>
            {format === 'jpeg' && (
              <Row label="Quality">
                <GradientSlider value={quality} onChange={(q) => setQuality(q)} min={40} max={100} step={1} label="JPG quality" />
                <ScrubValue value={quality} onChange={(q) => setQuality(q)} min={40} max={100} step={1} label="JPG quality" className="w-[40px] shrink-0" />
              </Row>
            )}
            <Row label="Long edge"><Segmented size="sm" label="Size" value={size} onChange={setSize} options={[{ value: 'full', label: 'Full' }, { value: '2048', label: '2048' }, { value: '1080', label: '1080' }]} /></Row>
            <Row label="Pixels"><span className="flex-1 text-right text-[11.5px] tabular text-fg">{dims}</span></Row>
            <Row label="File name"><TextInput value={name} placeholder={file.replace(/\.[a-z0-9]+$/i, '')} onChange={setName} label="File name" /></Row>
            <div className="px-3 pt-2">
              <Button variant="primary" size="md" className="w-full" onClick={() => { onOpenChange(false); exportImage({ format, quality, long, name: base }) }}>
                Export {format === 'jpeg' ? 'JPG' : 'PNG'} · {dims}
              </Button>
            </div>
            <div className="mx-3 my-2.5 h-px bg-line" />
            <Row label="Look as LUT" hint="A 3D lookup table of the global colour and tone settings, for Resolve, Premiere, OBS or a camera monitor.">
              <Segmented size="sm" label="LUT size" value={lut} onChange={setLut} options={[{ value: '17', label: '17³' }, { value: '33', label: '33³' }, { value: '65', label: '65³' }]} />
            </Row>
            <div className="px-3 pt-1.5">
              <Button variant="default" size="md" className="w-full" onClick={() => { onOpenChange(false); exportCube(Number(lut)) }}><Palette size={13} strokeWidth={1.5} />Export .cube</Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
