import { useRef } from 'react'
import { Braces, Download, Film, Image as ImageIcon, RotateCcw } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface,
  ParamActions, Menu, Button, CommandPalette, useValues, exportCanvasPNG, recordFrames, exportJSON, toast,
  shareMenuItems, NoteLayer, type SurfaceHandle, type Command,
} from '@kit'
import { params, clock, draw, sizeOf, totalMs, FORMATS, type V } from './artifact'

// a card with a fold of colour along its foot
const MARK = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden fill="currentColor">
    <path d="M2 2h12a1 1 0 0 1 1 1v8H1V3a1 1 0 0 1 1-1Z" opacity=".45" /><path d="M1 12h14v1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z" />
  </svg>
)

export function CardsTool() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle | null>(null)
  const size = sizeOf(v)
  const name = `rueca-${v.template === 'release' ? `lamina-${v.version}` : v.template === 'dye' ? `dye-${v.entry.toLowerCase()}` : 'share'}-${v.format}`

  /** the PNG at the card's own size: drawn fresh with the pen finished, whatever the playhead */
  const exportPng = () => {
    const out = document.createElement('canvas')
    out.width = size.w; out.height = size.h
    draw(out.getContext('2d')!, { ...(params.values() as V), animate: false }, 0, size.w, size.h)
    exportCanvasPNG(out, `${name}.png`).then(() => toast('PNG exported', { type: 'success', description: `${size.w} × ${size.h}` }))
  }
  const exportVideo = async () => {
    const vals = { ...(params.values() as V), animate: true }
    const fps = 60, out = document.createElement('canvas')
    out.width = size.w; out.height = size.h
    const ctx = out.getContext('2d', { alpha: false })!
    const ac = new AbortController()
    const pt = toast.progress('Rendering the pen', { onCancel: () => ac.abort() })
    try {
      const blob = await recordFrames({
        canvas: out, fps, frames: Math.round((totalMs() / 1000) * fps), name: `${name}.mp4`, signal: ac.signal,
        draw: (t) => draw(ctx, vals, t, out.width, out.height), onProgress: (p) => pt.set(p),
      })
      if (blob) pt.done('Video exported', { description: `${out.width} × ${out.height} · ${fps} fps` })
      else pt.fail(ac.signal.aborted ? 'Export cancelled' : 'This browser has no frame encoder', { timeout: 2600 })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }

  const commands: Command[] = [
    { id: 'replay', label: 'Replay the pen', group: 'Playback', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'video', label: 'Export the pen (video)', group: 'Export', icon: Film, run: exportVideo },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'rueca-cards.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...Object.entries(FORMATS).map(([k, f]) => ({ id: `format-${k}`, label: `Format: ${f.label}`, group: 'Format', run: () => params.patch({ format: k }, { commit: true }) })),
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Cards" doc="Rueca · brand" mark={MARK} href={false} />}
          end={
            <>
              <Cluster><ParamActions params={params} clock={clock} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: `Export · ${size.w} × ${size.h}` },
                  { label: 'PNG', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPng },
                  { label: 'Video (the pen drawing on)', icon: Film, onClick: exportVideo },
                  { type: 'separator' },
                  ...shareMenuItems(params),
                ]} />
            </>
          }
        />
      }
      right={<Panel header={<PanelHeader title="Card" />}><Inspector params={params} /></Panel>}
    >
      <Stage contentSize={{ w: size.w, h: size.h }}>
        <Artboard x={0} y={0} width={size.w} height={size.h} label={`${FORMATS[v.format]?.label ?? ''} ${size.w} × ${size.h}`} selected background="#FDFBFA">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
          <NoteLayer params={params} clock={clock} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
