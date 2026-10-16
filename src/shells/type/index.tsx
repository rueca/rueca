import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Braces, Code2, Copy, Download, Film, FileCode2, Image as ImageIcon, Italic, PenLine, RotateCcw, Ruler, Shapes, Type as TypeIcon, Play,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, PanelTabs, Inspector, Section, Row, Stage, Artboard, CanvasSurface, Timeline,
  ParamActions, Menu, Button, IconButton, Segmented, CommandPalette, Badge, useValues, exportCanvasPNG, recordCanvas, recordFrames, download, copyText,
  toast, cn, type SurfaceHandle, type Lane, type Command, type MenuItem, shareMenuItems, NoteLayer,
} from '@kit'
import { params, clock, family, FORMATS, PAIRS, type Mode, type V } from './params'
import { FAMILIES, SPECIMEN_FAMILY, fontDataURI, loadSpecimenFonts } from './fonts'
import { SpecimenArtboard, GlyphPanel, WaterfallPanel, specimenCSS, focusEditor } from './specimen'
import { ScaleArtboard, TokensPanel, scaleWidth } from './scaleView'
import { buildScale, scaleCSS, scaleHeight, scaleTailwind3, scaleTailwind4 } from './scale'
import { clearMetrics, drawKinetic, kineticCSS, kineticSVG, kineticTiming } from './kinetic'
import { domTextToSVG, svgToPNG, type EmbedFont } from './local/textToSvg'
import { contrastRatio, wcagGrade } from '@kit'
import { slug as toSlug } from '../util'

const KINETIC = { w: 1280, h: 720 }
const MODE_KEY = 'studio:type:mode'
const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'specimen', label: 'Specimen', hint: 'Specimen (1)' },
  { value: 'kinetic', label: 'Kinetic', hint: 'Kinetic (2)' },
  { value: 'scale', label: 'Scale', hint: 'Scale (3)' },
]
const readMode = (): Mode => { try { const m = localStorage.getItem(MODE_KEY); if (m === 'specimen' || m === 'kinetic' || m === 'scale') return m } catch { /* noop */ } return 'specimen' }

const Mark = <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><path d="M3 3.5h10M8 3.5V13M5.5 13h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>

async function embedFonts(): Promise<EmbedFont[]> {
  const files = Object.values(FAMILIES).flatMap((fam) => (fam.embed ?? []).map((f) => ({ ...f, family: fam.face ?? SPECIMEN_FAMILY })))
  return Promise.all(files.map(async (f) => ({ family: f.family, dataURI: await fontDataURI(f.url), style: f.style })))
}
const fontFaceCSS = (fonts: EmbedFont[]) => fonts.map((f) => `@font-face{font-family:'${f.family}';src:url(${f.dataURI}) format('woff2');font-weight:100 900;font-style:${f.style}}`).join('')
const slug = (s: string) => toSlug(s, 'type', 32)

export default function TypeShell() {
  const v = useValues(params) as V
  const [mode, setModeState] = useState<Mode>(readMode)
  const setMode = (m: Mode) => { setModeState(m); try { localStorage.setItem(MODE_KEY, m) } catch { /* noop */ } }
  const [leftTab, setLeftTab] = useState<'glyphs' | 'waterfall'>('glyphs')
  const artboard = useRef<HTMLDivElement>(null)
  const surface = useRef<SurfaceHandle>(null)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    loadSpecimenFonts()
      .then(() => { clearMetrics(); setFontsReady(true); surface.current?.redraw() })
      .catch(() => toast('Specimen font failed to load', { type: 'error', description: 'Falling back to the interface font.' }))
  }, [])
  // Kinetic plays only while it is on screen.
  useEffect(() => { if (mode === 'kinetic') clock.replay(); else clock.pause() }, [mode])

  const steps = useMemo(() => buildScale(v), [v])
  const [scaleH, setScaleH] = useState(() => scaleHeight(steps))
  const fmt = FORMATS[v.format] ?? FORMATS.landscape
  const fam = family(v)
  const size = mode === 'scale' ? { w: scaleWidth(v), h: scaleH } : mode === 'kinetic' ? KINETIC : { w: fmt.w, h: fmt.h }

  /* ---------- timeline lanes, from the same timing maths the renderer uses ---------- */
  const lanes: Lane[] = useMemo(() => {
    if (mode !== 'kinetic') return []
    const T = kineticTiming(v)
    if (!T.length) return []
    // the kit Timeline doesn't scroll lanes, so keep the total ≤ 8 rows: sample letters evenly
    const max = v.effect === 'wave' ? 7 : v.outro ? 5 : 6
    const pick = T.length <= max ? T : Array.from({ length: max }, (_, k) => T[Math.round((k * (T.length - 1)) / (max - 1))])
    const name = (L: (typeof T)[number]) => `${L.ch === ' ' ? '␣' : L.ch}  · ${L.i + 1}`
    if (v.effect === 'wave')
      return [
        { id: 'cycle', label: 'Cycle', start: 0, end: v.duration, color: 'var(--signal)' },
        ...pick.map((L) => ({ id: `l${L.i}`, label: name(L), kind: 'keys' as const, depth: 1, keys: L.crests.map((t) => ({ t, value: 'crest' })) })),
      ]
    const inEnd = Math.max(...T.map((L) => L.inEnd))
    const out: Lane[] = [
      { id: 'in', label: 'In', start: 0, end: inEnd, color: 'var(--signal)' },
      ...pick.map((L) => ({ id: `l${L.i}`, label: name(L), start: L.inStart, end: L.inEnd, depth: 1, color: 'var(--signal)' })),
    ]
    if (v.outro) {
      const o0 = Math.min(...T.map((L) => L.outStart)), o1 = Math.max(...T.map((L) => L.outEnd))
      out.push({ id: 'out', label: 'Out', start: o0, end: o1, color: 'var(--cat-7)' })
    }
    out.push({ id: 'cues', label: 'Cues', kind: 'markers', color: 'var(--key)', keys: [{ t: 0, value: 'in' }, { t: inEnd, value: 'hold' }, ...(v.outro ? [{ t: inEnd + v.hold, value: 'out' }] : [])] })
    return out
  }, [mode, v])

  /* ---------- exports ---------- */
  const name = mode === 'kinetic' ? slug(v.ktext) : mode === 'scale' ? 'type-scale' : slug(v.text.split('\n')[0])
  const buildSVG = async () => {
    if (mode === 'kinetic') return kineticSVG(v, clock.time(), KINETIC.w, KINETIC.h, fontFaceCSS(await embedFonts()))
    if (!artboard.current) return null
    return domTextToSVG(artboard.current, { width: size.w, height: size.h, background: v.bg, fonts: await embedFonts() })
  }
  const exportSVGFile = async () => {
    const svg = await buildSVG()
    if (!svg) return
    download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`)
    toast('SVG exported', { type: 'success', description: 'Live text with the font embedded.' })
  }
  const exportPNG = async () => {
    if (mode === 'kinetic') {
      const c = surface.current?.canvas
      if (c) { await exportCanvasPNG(c, `${name}.png`); toast('PNG exported', { type: 'success', description: 'Current frame.' }) }
      return
    }
    const id = toast('Rendering PNG…', { type: 'loading', timeout: 0 })
    try {
      const svg = await buildSVG()
      if (!svg) { toast.dismiss(id); return }
      download(await svgToPNG(svg, size.w, size.h, 2), `${name}@2x.png`)
      toast.update(id, 'PNG exported', { description: `${size.w * 2} × ${size.h * 2}`, type: 'success' })
    } catch {
      toast.update(id, 'PNG export failed', { type: 'error', timeout: 4000 })
    }
  }
  /** One loop, frame by frame (WebCodecs MP4); real-time WebM capture only as a fallback. */
  const recordVideo = async () => {
    const vals = params.values() as V
    const fps = 60
    const out = document.createElement('canvas')
    out.width = KINETIC.w; out.height = KINETIC.h
    const ctx = out.getContext('2d', { alpha: false })!
    const ms = clock.getState().duration
    const ac = new AbortController()
    const pt = toast.progress('Rendering one loop', { onCancel: () => ac.abort() })
    let last = -1
    try {
      const blob = await recordFrames({
        canvas: out, fps, frames: Math.round((ms / 1000) * fps), name: `${name}.mp4`, signal: ac.signal,
        draw: (t) => { ctx.setTransform(1, 0, 0, 1, 0, 0); drawKinetic(ctx, vals, t, KINETIC.w, KINETIC.h) },
        onProgress: (p) => { const q = Math.round(p * 100); if (q !== last) { last = q; pt.set(p) } },
      })
      if (blob) { pt.done('Video exported', { description: `${KINETIC.w} × ${KINETIC.h} · ${fps} fps` }); return }
      if (ac.signal.aborted) { pt.fail('Export cancelled', { timeout: 2600 }); return }
      const c = surface.current?.canvas
      if (!c) { pt.fail('Nothing to record'); return }
      toast.update(pt.id, 'Recording one loop…', { type: 'loading', timeout: 0 })
      clock.setState({ region: null })
      clock.replay()
      await recordCanvas(c, ms, fps, `${name}.webm`)
      pt.done('Video exported', { description: 'Real-time WebM — this browser has no frame encoder.' })
    } catch {
      pt.fail('Recording failed')
    }
  }
  const copy = async (text: string, what: string) => { await copyText(text); toast(`${what} copied`, { type: 'success' }) }
  const copyCSS = () => (mode === 'scale' ? copy(scaleCSS(v, steps), 'CSS variables') : mode === 'kinetic' ? copy(kineticCSS(v), 'CSS animation') : copy(specimenCSS(v), 'CSS'))

  const exportItems: MenuItem[] = [
    { type: 'label', label: mode === 'kinetic' ? 'Kinetic' : mode === 'scale' ? 'Type scale' : 'Specimen' },
    { label: mode === 'kinetic' ? 'PNG (current frame)' : 'PNG @2x', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPNG },
    { label: mode === 'kinetic' ? 'SVG (current frame)' : 'SVG (live text)', icon: Shapes, shortcut: 'shift+mod+e', onClick: exportSVGFile },
    ...(mode === 'kinetic' ? [{ label: 'Video (one loop)', icon: Film, onClick: recordVideo } as MenuItem] : []),
    { type: 'separator' },
    ...(mode === 'scale'
      ? ([
        { label: 'Copy CSS variables', icon: Code2, shortcut: 'shift+mod+c', onClick: () => copy(scaleCSS(v, steps), 'CSS variables') },
        { label: 'Copy Tailwind v4 @theme', icon: FileCode2, onClick: () => copy(scaleTailwind4(v, steps), 'Tailwind theme') },
        { label: 'Copy Tailwind v3 config', icon: FileCode2, onClick: () => copy(scaleTailwind3(v, steps), 'Tailwind config') },
        { label: 'Download type-scale.css', icon: Download, onClick: () => download(new Blob([scaleCSS(v, steps)], { type: 'text/css' }), 'type-scale.css') },
      ] as MenuItem[])
      : [{ label: mode === 'kinetic' ? 'Copy CSS animation' : 'Copy CSS', icon: Code2, shortcut: 'shift+mod+c', onClick: copyCSS } as MenuItem]),
    { type: 'separator' },
    ...shareMenuItems(params),
  ]

  const nudge = (key: 'wght' | 'kwght', d: number) => params.setValue(key, Math.min(900, Math.max(100, params.values()[key] + d)))
  const commands: Command[] = [
    ...MODES.map((m, i) => ({ id: `mode-${m.value}`, label: `Mode: ${m.label}`, group: 'Mode', shortcut: String(i + 1), icon: [TypeIcon, Play, Ruler][i], run: () => setMode(m.value) })),
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPNG },
    { id: 'svg', label: 'Export SVG', group: 'Export', shortcut: 'shift+mod+e', icon: Shapes, run: exportSVGFile },
    { id: 'css', label: mode === 'scale' ? 'Copy CSS variables' : mode === 'kinetic' ? 'Copy CSS animation' : 'Copy CSS', group: 'Export', shortcut: 'shift+mod+c', icon: Code2, run: copyCSS },
    { id: 'video', label: 'Record kinetic loop (video)', group: 'Export', icon: Film, run: () => { setMode('kinetic'); setTimeout(recordVideo, 300) } },
    { id: 'tw4', label: 'Copy Tailwind v4 @theme', group: 'Export', icon: FileCode2, run: () => copy(scaleTailwind4(v, steps), 'Tailwind theme') },
    { id: 'tw3', label: 'Copy Tailwind v3 config', group: 'Export', icon: FileCode2, run: () => copy(scaleTailwind3(v, steps), 'Tailwind config') },
    { id: 'json', label: 'Copy values (JSON)', group: 'Export', icon: Braces, run: () => copy(JSON.stringify(params.toJSON({ changedOnly: true }), null, 2), 'Values') },
    { id: 'edit', label: 'Edit specimen text', group: 'Text', shortcut: 'e', icon: PenLine, run: () => { setMode('specimen'); setTimeout(focusEditor, 50) } },
    { id: 'italic', label: v.italic ? 'Italic off' : 'Italic on', group: 'Text', shortcut: 'i', icon: Italic, run: () => params.setValue('italic', !params.values().italic) },
    { id: 'lighter', label: 'Lighter', group: 'Text', shortcut: '[', run: () => nudge(mode === 'kinetic' ? 'kwght' : 'wght', -20) },
    { id: 'heavier', label: 'Heavier', group: 'Text', shortcut: ']', run: () => nudge(mode === 'kinetic' ? 'kwght' : 'wght', 20) },
    ...Object.values(FAMILIES).map((f) => ({ id: `fam-${f.id}`, label: `Font: ${f.label}`, group: 'Text', run: () => params.setValue('family', f.id) })),
    ...(['upper', 'lower', 'title', 'none'] as const).map((c) => ({ id: `case-${c}`, label: `Case: ${({ upper: 'Uppercase', lower: 'Lowercase', title: 'Title case', none: 'As typed' } as Record<string, string>)[c]}`, group: 'Text', run: () => params.setValue('textCase', c) })),
    ...PAIRS.map((p) => ({ id: `pair-${p.name}`, label: `Colours: ${p.name}`, group: 'Colour', run: () => params.patch({ fg: p.fg, bg: p.bg }) })),
    { id: 'swap', label: 'Swap text and paper', group: 'Colour', shortcut: 'x', run: () => { const s = params.values(); params.patch({ fg: s.bg, bg: s.fg }) } },
    ...(['wave', 'cascade', 'rotate', 'scale', 'blur', 'weight'] as const).map((e) => ({ id: `fx-${e}`, label: `Effect: ${e === 'blur' ? 'Blur in' : e[0].toUpperCase() + e.slice(1)}`, group: 'Kinetic', run: () => { params.setValue('effect', e); setMode('kinetic') } })),
    { id: 'replay', label: 'Replay', group: 'Kinetic', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
  ]

  /* ---------- panels ---------- */
  const left =
    mode === 'specimen' ? (
      <Panel header={<PanelHeader><PanelTabs value={leftTab} onChange={setLeftTab} tabs={[{ value: 'glyphs', label: 'Glyphs' }, { value: 'waterfall', label: 'Waterfall' }]} /></PanelHeader>}>
        {leftTab === 'glyphs' ? <GlyphPanel v={v} /> : <WaterfallPanel v={v} />}
      </Panel>
    ) : mode === 'scale' ? (
      <Panel header={<PanelHeader title="Tokens"><Badge>{steps.length}</Badge></PanelHeader>}>
        <TokensPanel v={v} steps={steps} />
      </Panel>
    ) : undefined

  const pairs = (
    <Section title="Colour pairs" first={false}>
      <div className="grid grid-cols-6 gap-1 px-pad pt-0.5">
        {PAIRS.map((p) => {
          const on = p.fg.toLowerCase() === v.fg.toLowerCase() && p.bg.toLowerCase() === v.bg.toLowerCase()
          return (
            <button key={p.name} type="button" aria-label={p.name} title={`${p.name} · ${contrastRatio(p.fg, p.bg).toFixed(1)}:1 ${wcagGrade(contrastRatio(p.fg, p.bg))}`}
              aria-pressed={on} onClick={() => params.patch({ fg: p.fg, bg: p.bg })}
              className={cn('flex aspect-square items-center justify-center rounded-[calc(var(--radius-control)+2px)] text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-signal',
                on ? 'shadow-[0_0_0_1.5px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line-strong)]')}
              style={{ background: p.bg, color: p.fg, fontFamily: `"${SPECIMEN_FAMILY}", sans-serif` }}>
              Aa
            </button>
          )
        })}
      </div>
    </Section>
  )

  const codePreview = (
    <Section title="Code" first={false}
      actions={<IconButton size="icon-sm" icon={Copy} label="Copy CSS variables" onClick={() => copy(scaleCSS(v, steps), 'CSS variables')} />}>
      <div className="px-pad">
        <pre className="max-h-[220px] overflow-auto rounded-control bg-control p-2 font-mono text-ui-sm leading-[1.55] text-fg-muted select-text">{scaleCSS(v, steps)}</pre>
        <div className="mt-2 grid grid-cols-2 gap-1">
          <Button size="sm" variant="default" onClick={() => copy(scaleTailwind4(v, steps), 'Tailwind theme')}>Tailwind v4</Button>
          <Button size="sm" variant="default" onClick={() => copy(scaleTailwind3(v, steps), 'Tailwind config')}>Tailwind v3</Button>
        </div>
      </div>
    </Section>
  )

  const right = (
    <Panel header={<PanelHeader title={mode === 'specimen' ? 'Specimen' : mode === 'kinetic' ? 'Kinetic' : 'Type scale'}>
      <span className="truncate text-ui text-fg-faint">{fam.label}</span>
    </PanelHeader>}>
      {mode === 'specimen' && (
        <>
          <Inspector params={params} folders={['font', 'axes', 'setting', 'colour', 'artboard']} />
          {pairs}
          <Row className="pb-3"><span className="text-ui leading-relaxed text-fg-faint">{fam.note}{!fam.axes.opsz ? ' — optical size is unavailable for this face.' : ''}</span></Row>
        </>
      )}
      {mode === 'kinetic' && (
        <>
          <Inspector params={params} folders={['kinetic', 'motion', 'colour']} />
          {pairs}
          {v.effect === 'weight' && !fam.axes.wght && <Row className="pb-3"><span className="text-ui text-fg-faint">{fam.label} has static weights, so the weight effect steps instead of morphing. Switch to Inter for a smooth wght animation.</span></Row>}
        </>
      )}
      {mode === 'scale' && (
        <>
          <Inspector params={params} folders={['scale', 'rules', 'fluid', 'sample']} />
          {codePreview}
        </>
      )}
    </Panel>
  )

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Type" mark={Mark} />}
          center={<Cluster className="w-[276px] px-1.5"><Segmented value={mode} onChange={(m) => setMode(m as Mode)} options={MODES.map((m) => ({ value: m.value, label: m.label, hint: m.hint }))} label="Mode" /></Cluster>}
          end={
            <>
              <Cluster><ParamActions params={params} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={left}
      right={right}
      bottom={mode === 'kinetic' ? <Timeline clock={clock} lanes={lanes} /> : undefined}
    >
      <Stage key={mode} contentSize={size} grid>
        <Artboard width={size.w} height={size.h} background={v.bg}
          label={mode === 'kinetic' ? 'Kinetic' : mode === 'scale' ? `Type scale${v.fluidOn ? ` @ ${v.previewVw}px` : ''}` : fmt.label}>
          {mode === 'specimen' && <SpecimenArtboard ref={artboard} v={v} w={size.w} h={size.h} />}
          {mode === 'scale' && <ScaleArtboard ref={artboard} v={v} steps={steps} onHeight={setScaleH} />}
          {mode === 'kinetic' && (
            <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => drawKinetic(ctx, f.v as V, f.t, f.w, f.h)} />
          )}
          <NoteLayer params={params} clock={mode === 'kinetic' ? clock : undefined} />
        </Artboard>
      </Stage>
      {!fontsReady && <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2"><Badge>Loading Inter…</Badge></div>}
      <CommandPalette
        commands={commands}
        extraShortcuts={[{ keys: 'esc', label: 'Stop editing text', group: 'Text' }]}
      />
    </Studio>
  )
}
