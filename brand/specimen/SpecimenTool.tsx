import { useMemo, useRef } from 'react'
import { Braces, Download, Film, Image as ImageIcon, RotateCcw } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface, Timeline,
  ParamActions, Menu, Button, CommandPalette, useValues, exportCanvasPNG, recordFrames, exportJSON, toast,
  shareMenuItems, NoteLayer, type SurfaceHandle, type Lane, type Command,
} from '@kit'
import { params, clock, beats, draw, totalMs, type V } from './artifact'

// a swatch card: Werner's small rectangle beside its name
const MARK = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden fill="currentColor">
    <rect x="0" y="1" width="6" height="4" rx="0.8" /><rect x="8" y="2" width="8" height="1.6" rx="0.8" />
    <rect x="0" y="6" width="6" height="4" rx="0.8" /><rect x="8" y="7" width="8" height="1.6" rx="0.8" />
    <rect x="0" y="11" width="6" height="4" rx="0.8" /><rect x="8" y="12" width="8" height="1.6" rx="0.8" />
  </svg>
)

export function SpecimenTool() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle | null>(null)
  const name = v.format === 'plate' ? 'rueca-dye-plate' : 'rueca-dye-tile'

  const lanes: Lane[] = useMemo(() => {
    const b = beats(v)
    const out: Lane[] = [{ id: 'colours', label: 'Colours', kind: 'markers', keys: b.map((x) => ({ t: x.at, value: x.name })), color: 'var(--fg)' }]
    if (v.format === 'tile') out.push({ id: 'pen', label: 'Pen writes the job', kind: 'keys', keys: b.map((x) => ({ t: x.pen.start })), color: v.pen })
    return out
  }, [v])

  const exportPng = () => {
    const c = surface.current?.canvas
    if (c) exportCanvasPNG(c, `${name}.png`).then(() => toast('PNG exported', { type: 'success' }))
  }
  const exportVideo = async () => {
    const vals = params.values() as V
    const fps = 60
    const out = document.createElement('canvas')
    out.width = vals.size.w; out.height = vals.size.h
    const ctx = out.getContext('2d', { alpha: false })!
    const ms = totalMs(vals)
    const ac = new AbortController()
    const pt = toast.progress('Rendering one loop', { onCancel: () => ac.abort() })
    try {
      const blob = await recordFrames({
        canvas: out, fps, frames: Math.round((ms / 1000) * fps), name: `${name}-${out.width}x${out.height}.mp4`, signal: ac.signal,
        draw: (t) => draw(ctx, vals, t, out.width, out.height),
        onProgress: (p) => pt.set(p),
      })
      if (blob) pt.done('Video exported', { description: `${out.width} × ${out.height} · ${fps} fps · ${(ms / 1000).toFixed(2)}s` })
      else pt.fail(ac.signal.aborted ? 'Export cancelled' : 'This browser has no frame encoder', { timeout: 2600 })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }

  const commands: Command[] = [
    { id: 'replay', label: 'Replay', group: 'Playback', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'video', label: 'Record one loop (video)', group: 'Export', icon: Film, run: exportVideo },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'rueca-specimen.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Specimen" doc="Rueca · brand" mark={MARK} href={false} />}
          end={
            <>
              <Cluster><ParamActions params={params} clock={clock} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: 'Export' },
                  { label: 'PNG (current frame)', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPng },
                  { label: 'Video (one loop)', icon: Film, onClick: exportVideo },
                  { type: 'separator' },
                  ...shareMenuItems(params),
                ]} />
            </>
          }
        />
      }
      right={<Panel header={<PanelHeader title="Nomenclature" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} lanes={lanes} />}
    >
      <Stage contentSize={{ w: v.size.w, h: v.size.h }}>
        <Artboard x={0} y={0} width={v.size.w} height={v.size.h} label={v.format === 'plate' ? 'Plate' : 'Tile'} selected background="#FDFBFA">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
          <NoteLayer params={params} clock={clock} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
