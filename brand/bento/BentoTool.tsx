import { useMemo, useRef } from 'react'
import { Braces, Download, Film, Image as ImageIcon, RotateCcw } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface, Timeline,
  ParamActions, Menu, Button, CommandPalette, useValues, exportCanvasPNG, recordFrames, recordCanvas, exportJSON, toast,
  shareMenuItems, NoteLayer, type SurfaceHandle, type Lane, type Command,
} from '@kit'
import { params, clock, beats, draw, totalMs, kitSlot, type V } from './artifact'

const MARK = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden fill="currentColor">
    <rect x="0" y="0" width="16" height="5" rx="1" /><rect x="0" y="6.5" width="4.6" height="4.6" rx="1" /><rect x="5.7" y="6.5" width="4.6" height="4.6" rx="1" /><rect x="11.4" y="6.5" width="4.6" height="4.6" rx="1" /><rect x="0" y="12.2" width="4.6" height="3.8" rx="1" /><rect x="5.7" y="12.2" width="10.3" height="3.8" rx="1" />
  </svg>
)

export function BentoTool() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle | null>(null)

  // Lanes come from the same timings the drawing uses.
  const lanes: Lane[] = useMemo(() => {
    const out: Lane[] = []
    for (const b of beats(v)) b.spans.forEach((s, i) => out.push({ id: `${b.id}-${i}`, label: b.label, start: s.start, end: Math.min(s.end, v.loopMs), depth: i ? 1 : 0, color: s.over ? '#B0006A' : '#F6571C' }))
    const slot = kitSlot(v)
    out.push({ id: 'kit', label: 'Kit drawings', kind: 'markers', keys: Array.from({ length: v.kitTurns }, (_, i) => ({ t: (i + 1) * slot, value: `${(i + 1) % 6 + 1}` })), color: 'var(--fg)' })
    return out
  }, [v])

  const exportPng = () => {
    const c = surface.current?.canvas
    if (c) exportCanvasPNG(c, 'rueca-bento.png').then(() => toast('PNG exported', { type: 'success' }))
  }
  /** One loop, frame by frame (WebCodecs); real-time capture only as a fallback. */
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
        canvas: out, fps, frames: Math.round((ms / 1000) * fps), name: `rueca-bento-${out.width}x${out.height}.mp4`, signal: ac.signal,
        draw: (t) => draw(ctx, vals, t, out.width, out.height),
        onProgress: (p) => pt.set(p),
      })
      if (blob) { pt.done('Video exported', { description: `${out.width} × ${out.height} · ${fps} fps · ${(ms / 1000).toFixed(2)}s` }); return }
      if (ac.signal.aborted) { pt.fail('Export cancelled', { timeout: 2600 }); return }
      const c = surface.current?.canvas
      if (!c) { pt.fail('Nothing to record'); return }
      toast.update(pt.id, 'Recording one loop…', { type: 'loading', timeout: 0 })
      clock.replay()
      await recordCanvas(c, clock.getState().duration, fps, 'rueca-bento.webm')
      pt.done('Video exported', { description: 'Real-time WebM: this browser has no frame encoder.' })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }

  const commands: Command[] = [
    { id: 'replay', label: 'Replay', group: 'Playback', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'video', label: 'Record one loop (video)', group: 'Export', icon: Film, run: exportVideo },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'rueca-bento.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Bento" doc="Rueca · brand" mark={MARK} href={false} />}
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
      right={<Panel header={<PanelHeader title="Relay" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} lanes={lanes} />}
    >
      <Stage contentSize={{ w: v.size.w, h: v.size.h }}>
        <Artboard x={0} y={0} width={v.size.w} height={v.size.h} label="Bento" selected background="#FDFBFA">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
          {/* comments to the agent: pin one on the bento (or a knob), it lands in .rueca/notes/ with the playhead */}
          <NoteLayer params={params} clock={clock} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
