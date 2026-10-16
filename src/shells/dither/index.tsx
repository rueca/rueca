import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'
import {
  Columns2, Download, Eye, FileText, Grid3x3, Image as ImageIcon, ImageUp, Pipette, RotateCcw, Shapes, Images, ClipboardType, Link,
} from 'lucide-react'
import { ZoomPill,
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Section, Row, Stage, Artboard, Menu, Button, IconButton, Divider, Badge,
  PaletteField, ImageDrop, ParamActions, CommandPalette, useValues, useCamera, useHoldKey, shareMenuItems, equal, toast, promptText,
  copyText, download, stamp, cn, type Command, type MenuItem,
} from '@kit'
import { CompareSplit } from '@kit/stage/CompareSplit'
import { PresetGrid } from '@kit/ui/preset-grid'
import { useImageIntake } from '@kit/core/image-intake'
import { rejectReason, useIntakeRejects } from '../intake'
import { EFFECTS, PALETTES, image, params, view } from './state'
import { RASTER, type EffectId, type Result } from './engine'
import { out, loadImage, loadSample, start } from './run'
import { colorAt, drawVector, halftoneSVG, outSize, rasterCanvas, renderOutput } from './draw'
import { extractPalette, MAX_SIDE } from './image'
import { PalettePicker } from './local/PalettePicker'

/** integer-friendly zoom ladder: nearest-neighbour pixels stay square and crisp */
const PIXEL_STEPS = [0.125, 0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32]

const MAX_CANVAS = 16_777_216 // Safari's canvas area limit; Chrome allows more but files get silly

const Mark = (
  <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
    {[0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].filter((x) => (x + y) % 2 === 0 || (x === 3 && y === 3)).map((x) => <rect key={`${x}${y}`} x={2 + x * 3} y={2 + y * 3} width="2.4" height="2.4" />))}
  </svg>
)

/* ---------- exports ---------- */
const base = () => image.getState().name.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'dither'
const effectLabel = (id: string) => EFFECTS.find((e) => e.value === id)?.label ?? id

function exportPNG(scale: number) {
  const r = out.getState().result
  if (!r) return
  const { w, h } = outSize(r)
  let s = scale
  if (w * h * s * s > MAX_CANVAS) { s = Math.floor(Math.sqrt(MAX_CANVAS / (w * h)) * 100) / 100; toast(`Reduced to ${s}× (browser canvas limit)`) }
  const c = renderOutput(r, s)
  c.toBlob((b) => { if (b) { download(b, `${base()}-${params.values().effect}-${s}x-${stamp()}.png`); toast(`PNG exported · ${c.width} × ${c.height}`, { type: 'success' }) } }, 'image/png')
}
function exportSVG() {
  const r = out.getState().result
  if (r?.kind !== 'halftone') { toast('SVG export is for the halftone effect', { description: 'Switch the effect to Halftone to export circles.' }); return }
  download(new Blob([halftoneSVG(r)], { type: 'image/svg+xml' }), `${base()}-halftone.svg`)
  toast(`SVG exported · ${r.count.toLocaleString()} circles`, { type: 'success' })
}
async function copyASCII() {
  const r = out.getState().result
  if (r?.kind !== 'ascii') { toast('Switch the effect to ASCII first'); return }
  const ok = await copyText(r.chars)
  toast(ok ? 'ASCII copied' : 'Clipboard blocked', { type: ok ? 'success' : 'error', description: ok ? `${r.cols} × ${r.rows} characters` : undefined })
}
function downloadTXT() {
  const r = out.getState().result
  if (r?.kind !== 'ascii') { toast('Switch the effect to ASCII first'); return }
  download(new Blob([r.chars + '\n'], { type: 'text/plain' }), `${base()}-ascii.txt`)
}

async function take(file: Blob, name: string) {
  // refuse empties / non-images out loud (drops of non-images are caught by useIntakeRejects) — break-it S10
  const bad = rejectReason({ name, type: file.type, size: file.size })
  if (bad) { toast(bad, { type: 'error', description: 'Open a PNG, JPEG, WebP or GIF.' }); return }
  const r = await toast.promise(loadImage(file, name), {
    loading: 'Opening image…',
    success: `Opened ${name}`,
    error: 'Could not open image',
  }).catch(() => null /* the toast already said so */)
  if (r?.scaled) toast(`Scaled down to ${r.w} × ${r.h}`, { description: `The original is ${r.from.w} × ${r.from.h}; dithering works on at most ${MAX_SIDE}px on the long edge.` })
}

export default function DitherLab() {
  useEffect(() => start(), [])
  const v = useValues(params)
  const img = useStore(image)
  const result = useStore(out, (s) => s.result)
  const presets = useStore(params, (s) => s.presets)
  const thumbs = useStore(out, (s) => s.thumbs)
  const split = useStore(view, (s) => s.split)
  const grid = useStore(view, (s) => s.grid)
  // Drop anywhere on the window, paste, or Open… — the image stays out of params (see state.ts).
  // ⌘O is bound by the palette's Open command, so the hook doesn't bind it too.
  const intake = useImageIntake((img) => take(img.file, img.name), { hotkey: false })
  useIntakeRejects()
  useHoldKey('\\', (held) => view.setState({ peek: held }))

  const active = presets.length ? params.activePreset() : undefined // looks are partial: match only their keys
  const isRaster = RASTER.includes(v.effect as EffectId)
  const size = result ? outSize(result) : { w: img.w, h: img.h }
  // fit to the IMAGE, not the output: pixel size trims a few px and must not re-fit the camera
  const contentSize = useMemo(() => ({ w: img.w, h: img.h }), [img.w, img.h])

  const extract = () => {
    const data = image.getState().data
    if (!data) return
    const n = Math.max(2, Math.min(8, v.palette.length))
    params.patch({ palette: extractPalette(data, n), paletteName: 'From image' })
    toast(`Extracted ${n} colours from the image`, { type: 'success' })
  }

  const commands: Command[] = [
    { id: 'open', label: 'Open image…', group: 'Image', shortcut: 'mod+o', icon: ImageUp, run: intake.open },
    { id: 'sample', label: 'Use the sample image', group: 'Image', icon: Images, run: loadSample },
    ...EFFECTS.map((e, i) => ({ id: `fx-${e.value}`, label: `Effect: ${e.label}`, group: 'Effect', shortcut: String(i + 1), keywords: ['dither', e.hint], run: () => params.setValue('effect', e.value) })),
    { id: 'invert', label: 'Invert', group: 'Adjust', shortcut: 'i', run: () => params.setValue('invert', !params.values().invert) },
    { id: 'reset-adj', label: 'Reset adjustments', group: 'Adjust', icon: RotateCcw, run: () => params.reset(['levels', 'brightness', 'contrast', 'gamma', 'blur', 'sharpen', 'invert']) },
    ...PALETTES.map((p) => ({ id: `pal-${p.name}`, label: `Palette: ${p.name}`, group: 'Palette', run: () => params.patch({ palette: p.colors, paletteName: p.name }) })),
    { id: 'extract', label: 'Extract palette from image', group: 'Palette', icon: Pipette, run: extract },
    ...presets.map((p) => ({ id: `look-${p.name}`, label: `Look: ${p.name}`, group: 'Looks', run: () => params.applyPreset(p.name) })),
    { id: 'split', label: 'Toggle before / after split', group: 'View', shortcut: 'y', icon: Columns2, run: () => view.setState((s) => ({ split: !s.split })) },
    { id: 'grid', label: 'Toggle pixel grid', group: 'View', shortcut: 'shift+g', icon: Grid3x3, run: () => view.setState((s) => ({ grid: !s.grid })) },
    { id: 'png1', label: `Export PNG 1× (${size.w} × ${size.h})`, group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: () => exportPNG(1) },
    { id: 'png2', label: 'Export PNG 2×', group: 'Export', icon: ImageIcon, run: () => exportPNG(2) },
    { id: 'png4', label: 'Export PNG 4×', group: 'Export', icon: ImageIcon, run: () => exportPNG(4) },
    { id: 'svg', label: 'Export SVG (halftone circles)', group: 'Export', shortcut: 'shift+mod+e', icon: Shapes, run: exportSVG },
    { id: 'ascii', label: 'Copy ASCII text', group: 'Export', shortcut: 'shift+mod+c', icon: ClipboardType, run: copyASCII },
    { id: 'txt', label: 'Download ASCII (.txt)', group: 'Export', icon: FileText, run: downloadTXT },
    { id: 'reset', label: 'Reset all settings', group: 'Values', icon: RotateCcw, run: () => params.reset() },
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Dither lab" doc={img.name} mark={Mark} />}
          center={
            <Cluster>
              <Button size="md" variant="ghost" onClick={intake.open} title="Open image (⌘O), or drop or paste anywhere"><ImageUp size={14} strokeWidth={1.5} />Open image</Button>
              <IconButton icon={Images} label="Use the sample image" onClick={loadSample} active={img.sample} />
            </Cluster>
          }
          end={
            <>
              <Cluster>
                {/* No A/B: \ is hold-for-original here, and looks cover comparison */}
                <ParamActions params={params} presets={false} compare={false} />
              </Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: `Image · ${size.w} × ${size.h}${isRaster ? ', nearest-neighbour' : ', re-drawn at size'}` },
                  { label: `PNG 1× · ${size.w} × ${size.h}`, icon: ImageIcon, shortcut: 'mod+e', onClick: () => exportPNG(1) },
                  { label: `PNG 2× · ${size.w * 2} × ${size.h * 2}`, icon: ImageIcon, onClick: () => exportPNG(2) },
                  { label: `PNG 4× · ${size.w * 4} × ${size.h * 4}`, icon: ImageIcon, onClick: () => exportPNG(4) },
                  { type: 'separator' },
                  { label: 'SVG (halftone circles)', icon: Shapes, shortcut: 'shift+mod+e', disabled: v.effect !== 'halftone', onClick: exportSVG },
                  ...(v.effect === 'ascii' ? [
                    { label: 'Copy ASCII text', icon: ClipboardType, shortcut: 'shift+mod+c', onClick: copyASCII },
                    { label: 'Download ASCII .txt', icon: FileText, onClick: downloadTXT },
                  ] : []),
                  { type: 'separator' },
                  { type: 'submenu', label: 'Share settings', icon: Link, items: shareMenuItems(params) } as MenuItem,
                ]} />
            </>
          }
        />
      }
      left={
        <Panel header={<PanelHeader title="Image" />}>
          <div className="flex flex-col gap-2 px-pad pt-3 pb-3">
            <ImageDrop value={img.url} onChange={(url) => (url ? take(dataURLBlob(url), 'Untitled image') : loadSample())} />
            <div className="flex items-center justify-between gap-2 text-ui">
              <span className="min-w-0 truncate text-fg-muted" title={img.name}>{img.sample ? 'Sample photo' : img.name}</span>
              <span className="shrink-0 tabular text-fg-faint">{img.w} × {img.h}</span>
            </div>
          </div>
          <div className="border-t border-line">
            <Section title="Looks" hint="Your image under each look. Hover to preview on the stage, click to apply." first>
              <PresetGrid
                label="Looks"
                value={active?.name ?? null}
                items={presets.map((p) => ({ id: p.name, name: p.name, thumb: thumbs[p.name], removable: !p.builtin }))}
                onApply={(n) => { view.setState({ preview: null }); params.applyPreset(n) }}
                onPreview={(n) => view.setState({ preview: n })}
                onRemove={(n) => params.deletePreset(n)}
              />
              <div className="px-pad pb-1">
                <Button size="sm" variant="ghost" className="w-full" onClick={async () => { const name = await promptText({ title: 'Name this look', label: 'Name', defaultValue: `Look ${presets.filter((p) => !p.builtin).length + 1}`, confirmLabel: 'Save look' }); if (name) toast(`Saved “${params.savePreset(name)}”`, { type: 'success' }) }}>
                  Save current as look…
                </Button>
              </div>
            </Section>
          </div>
        </Panel>
      }
      right={
        <Panel header={<PanelHeader title="Process"><Badge tone="default">{effectLabel(v.effect)}</Badge></PanelHeader>}>
          {/* the effect decides which sliders exist, the palette is the look, adjust is the tail */}
          <Inspector params={params} folders={['effect']} />
          <PaletteSection extract={extract} />
          <div className="border-t border-line"><Inspector params={params} folders={['adjust']} /></div>
        </Panel>
      }
    >
      <div className="relative h-full">
        <Stage contentSize={contentSize} grid hud={false}
          overlay={<><ZoomPill steps={PIXEL_STEPS} presets={[0.5, 1, 2, 4, 8, 16]} keys className="h-bar" /><StatusPill /><ViewDock /></>}>
          <Canvas result={result} split={split} grid={grid} />
        </Stage>
        {intake.over && (
          <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-[var(--radius-panel)] bg-signal-soft shadow-[inset_0_0_0_2px_var(--signal)]">
            <div className="pop flex items-center gap-2 px-pad py-2 text-ui font-medium text-fg"><ImageUp size={14} strokeWidth={1.5} className="text-signal" />Drop to dither this image</div>
          </div>
        )}
      </div>
      {intake.input}
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: '\\', label: 'Hold to see the original' },
        { keys: 'shift+1', label: 'Zoom to fit' },
        { keys: 'shift+0', label: 'Zoom to 100%' },
        { keys: 'space', label: 'Hold and drag to pan' },
        { keys: 'mod+v', label: 'Paste an image' },
      ]} />
    </Studio>
  )
}

const dataURLBlob = (url: string) => {
  const [head, body] = url.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

/* ---------- palette (hand-built: a picker + an editable strip are one decision) ---------- */
function PaletteSection({ extract }: { extract: () => void }) {
  const palette = useValues(params, (v) => v.palette)
  const name = useValues(params, (v) => v.paletteName)
  const defaults = params.getState().defaults
  const changed = !equal(palette, defaults.palette)
  return (
    <div className="border-t border-line">
      <Section title="Palette" hint="Every effect quantises to these colours. Darkest is the ink, lightest the paper." changed={changed}
        onReset={changed ? () => params.reset(['palette', 'paletteName']) : undefined}
        actions={<IconButton icon={Pipette} label="Extract palette from image" size="icon-sm" onClick={extract} />}>
        <div className="px-pad pb-2">
          <PalettePicker value={name} options={PALETTES} onChange={(n, colors) => params.patch({ palette: colors, paletteName: n })} />
        </div>
        <Row label="Colours" hint="Click a swatch to edit, + to add (up to 16). Editing makes it a custom palette." stacked changed={changed}
          trailing={<span className="text-ui text-fg-faint">{PALETTES.some((p) => p.name === name) ? `${palette.length}` : `${name} · ${palette.length}`}</span>}>
          <PaletteField value={palette} max={16} onChange={(c, final) => params.patch({ palette: c, paletteName: PALETTES.some((p) => p.name === name && equal(p.colors, c)) ? name : 'Custom' }, { commit: final })} />
        </Row>
      </Section>
    </div>
  )
}

/* ---------- the stage content ---------- */
function Canvas({ result, split, grid }: { result: Result | null; split: boolean; grid: boolean }) {
  const cam = useCamera()
  const zoom = useStore(cam, (s) => s.zoom)
  const img = useStore(image)
  const pos = useStore(view, (s) => s.pos)
  const peek = useStore(view, (s) => s.peek)
  const before = useRef<HTMLCanvasElement>(null)
  const after = useRef<HTMLCanvasElement>(null)
  const size = result ? outSize(result) : { w: img.w, h: img.h }

  // a new image always fits, even after the user zoomed the last one
  useEffect(() => { cam.untouch(); const id = requestAnimationFrame(() => cam.fit()); return () => cancelAnimationFrame(id) }, [cam, img.w, img.h])

  // the original
  useEffect(() => {
    const c = before.current
    if (!c || !img.data) return
    c.width = img.data.width; c.height = img.data.height
    c.getContext('2d')!.putImageData(img.data, 0, 0)
  }, [img.data])

  // the result: raster at grid resolution (CSS scales it nearest-neighbour), vectors re-drawn for the zoom
  const res = result && result.kind !== 'raster' ? Math.min(4, Math.max(1, Math.ceil(zoom * (window.devicePixelRatio || 1) * 2) / 2)) : 1
  const resDebounced = useDebounced(res, 160)
  useEffect(() => {
    const c = after.current
    if (!c || !result) return
    if (result.kind === 'raster') { rasterCanvas(result, c); return }
    const k = Math.min(resDebounced, Math.sqrt(MAX_CANVAS / (result.srcW * result.srcH)))
    c.width = Math.round(result.srcW * k); c.height = Math.round(result.srcH * k)
    drawVector(c.getContext('2d')!, result, k)
  }, [result, resDebounced])

  const cell = result?.kind === 'raster' ? result.cell : 0
  const showGrid = grid && cell > 0 && zoom * cell >= 8
  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * size.w, y = ((e.clientY - r.top) / r.height) * size.h
    view.setState({ hover: { x: Math.floor(x), y: Math.floor(y), hex: colorAt(out.getState().result, x, y) } })
  }

  const px = { imageRendering: 'pixelated' as const }
  return (
    <Artboard width={size.w} height={size.h} label={img.name} background={result && result.kind !== 'raster' ? result.paper : '#000'}>
      <div className="absolute inset-0" onPointerMove={onMove} onPointerLeave={() => view.setState({ hover: null })}>
        <CompareSplit
          split={split}
          value={pos}
          onChange={(p) => view.setState({ pos: p })}
          peek={peek}
          zoom={zoom}
          before={<canvas ref={before} className="block size-full" style={zoom >= 2 ? px : undefined} aria-label="Original image" />}
          after={<canvas ref={after} className={cn('block size-full', !result && 'opacity-0')} style={px} aria-label="Dithered result" />}
        />
        {showGrid && (
          <div className="pointer-events-none absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, var(--line-strong) ${1 / zoom}px, transparent ${1 / zoom}px), linear-gradient(to bottom, var(--line-strong) ${1 / zoom}px, transparent ${1 / zoom}px)`,
            backgroundSize: `${cell}px ${cell}px`,
          }} />
        )}
      </div>
    </Artboard>
  )
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

/* ---------- HUD ---------- */
function StatusPill() {
  const r = useStore(out, (s) => s.result)
  const busy = useStore(out, (s) => s.busy)
  const error = useStore(out, (s) => s.error)
  const threaded = useStore(out, (s) => s.threaded)
  const hover = useStore(view, (s) => s.hover)
  const preview = useStore(view, (s) => s.preview)
  const effect = useValues(params, (v) => v.effect)
  const detail = !r ? 'Developing…'
    : r.kind === 'raster' ? `${r.w} × ${r.h} px`
    : r.kind === 'halftone' ? `${r.count.toLocaleString()} dots`
    : `${r.cols} × ${r.rows} chars`
  return (
    // narrow stages: the effect name gives way first, then the size — each with an ellipsis, never a hard clip (break-it F10).
    // h-bar, like the zoom pill and the view dock beside it: one height, one radius along the stage's bottom edge
    <div className="cluster absolute bottom-3 left-3 z-10 flex h-bar max-w-[calc(50%-96px)] min-w-0 items-center gap-2 overflow-hidden px-pad text-ui no-select" aria-live="polite">
      {error ? <span className="size-1.5 shrink-0 rounded-full bg-rec" />
        : busy ? <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-signal" />
        : <span className="size-1.5 shrink-0 rounded-full bg-ok" />}
      <span className={cn('min-w-0 shrink-[100] truncate text-fg', !error && !preview && 'max-[1180px]:hidden')}>{error ? error : preview ? `Preview: ${preview}` : effectLabel(effect)}</span>
      <span className="min-w-0 truncate tabular text-fg-muted">{detail}</span>
      {r && <span className="hidden shrink-0 tabular text-fg-faint min-[1180px]:inline" title={threaded ? 'Processed in a worker' : 'Processed on the main thread'}>{Math.round(r.ms)} ms</span>}
      {r?.draft && <Badge tone="key">Draft</Badge>}
      {hover && (
        <span className="flex shrink-0 items-center gap-1.5 border-l border-line pl-2 tabular text-fg-muted">
          {hover.x}, {hover.y}
          {hover.hex && <><span className="size-2.5 rounded-[3px] shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: hover.hex }} /><span className="uppercase">{hover.hex}</span></>}
        </span>
      )}
    </div>
  )
}

function ViewDock() {
  const split = useStore(view, (s) => s.split)
  const peek = useStore(view, (s) => s.peek)
  const grid = useStore(view, (s) => s.grid)
  const ascii = useValues(params, (v) => v.effect) === 'ascii'
  return (
    <div className="cluster absolute bottom-3 left-1/2 z-10 flex h-bar -translate-x-1/2 items-center gap-0.5 px-1" role="toolbar" aria-label="View">
      <IconButton icon={Columns2} label={split ? 'Hide split' : 'Before / after split'} shortcut="y" tipSide="top" active={split} onClick={() => view.setState({ split: !split })} />
      <IconButton icon={Eye} label="Hold to see the original" shortcut="\\" tipSide="top" active={peek}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); view.setState({ peek: true }) }}
        onPointerUp={() => view.setState({ peek: false })} onPointerCancel={() => view.setState({ peek: false })}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); view.setState({ peek: true }) } }}
        onKeyUp={() => view.setState({ peek: false })} />
      <Divider vertical />
      <IconButton icon={Grid3x3} label={grid ? 'Hide pixel grid' : 'Show pixel grid (at high zoom)'} shortcut="shift+g" tipSide="top" active={grid} onClick={() => view.setState({ grid: !grid })} />
      {ascii && <IconButton icon={ClipboardType} label="Copy ASCII text" shortcut="shift+mod+c" tipSide="top" onClick={copyASCII} />}
    </div>
  )
}
