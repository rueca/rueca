import { useRef } from 'react'
import { Braces, Download, Film, Image as ImageIcon, RotateCcw } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface, Timeline,
  ParamActions, Menu, Button, CommandPalette, useValues, exportCanvasPNG, recordFrames, exportJSON, toast,
  shareMenuItems, NoteLayer, type SurfaceHandle, type Command,
} from '@kit'
import { params, clock, draw, sizeOf, totalMs, MOODS, type V } from './artifact'

// a wheel with one fan of colour
const MARK = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden fill="currentColor">
    <circle cx="8" cy="8" r="7" opacity=".45" /><path d="M8 8V1a7 7 0 0 1 7 7Z" />
  </svg>
)

export function MoodsTool() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle | null>(null)
  const size = sizeOf(v)
  const name = `rueca-moods-${v.view === 'board' ? 'board' : v.mood}-${v.ground}`

  const exportPng = () => {
    const c = surface.current?.canvas
    if (c) exportCanvasPNG(c, `${name}.png`).then(() => toast('PNG exported', { type: 'success' }))
  }
  const exportVideo = async () => {
    const vals = params.values() as V
    const fps = 60, out = document.createElement('canvas')
    out.width = size.w; out.height = size.h
    const ctx = out.getContext('2d', { alpha: false })!
    const ac = new AbortController()
    const pt = toast.progress('Rendering one loop', { onCancel: () => ac.abort() })
    try {
      const blob = await recordFrames({
        canvas: out, fps, frames: Math.round((totalMs(vals) / 1000) * fps), name: `${name}.mp4`, signal: ac.signal,
        draw: (t) => draw(ctx, vals, t, out.width, out.height), onProgress: (p) => pt.set(p),
      })
      if (blob) pt.done('Video exported', { description: `${out.width} × ${out.height} · ${fps} fps` })
      else pt.fail(ac.signal.aborted ? 'Export cancelled' : 'This browser has no frame encoder', { timeout: 2600 })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }

  const commands: Command[] = [
    { id: 'replay', label: 'Replay', group: 'Playback', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'video', label: 'Record one loop (video)', group: 'Export', icon: Film, run: exportVideo },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'rueca-moods.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...MOODS.map((m) => ({ id: `mood-${m.id}`, label: `Show: ${m.mood} (${m.word})`, group: 'Moods', run: () => params.patch({ view: 'one', mood: m.id }, { commit: true }) })),
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Moods" doc="Rueca · brand" mark={MARK} href={false} />}
          end={
            <>
              <Cluster><ParamActions params={params} clock={clock} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: `Export · ${size.w} × ${size.h}` },
                  { label: 'PNG (current frame)', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPng },
                  { label: 'Video (one loop)', icon: Film, onClick: exportVideo },
                  { type: 'separator' },
                  ...shareMenuItems(params),
                ]} />
            </>
          }
        />
      }
      right={<Panel header={<PanelHeader title="Wheel" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} />}
    >
      <Stage contentSize={{ w: size.w, h: size.h }}>
        <Artboard x={0} y={0} width={size.w} height={size.h} label={v.view === 'board' ? 'The wheel’s moods' : MOODS.find((m) => m.id === v.mood)?.mood} selected background="#FDFBFA">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
          <NoteLayer params={params} clock={clock} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
