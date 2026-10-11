import { useMemo, useRef } from 'react'
import { Download, Film, Image as ImageIcon, RotateCcw, Smartphone, Braces } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface, Timeline,
  ParamActions, Menu, Button, IconButton, CommandPalette, useValues, exportCanvasPNG, recordCanvas, recordFrames, exportJSON, toast,
  type SurfaceHandle, type Lane, type Command, shareMenuItems,
} from '@kit'
import { params, clock, beats, draw, totalMs, type V } from './artifact'

const DEVICE = { w: 390, h: 844 }

export default function MotionShell() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle>(null)

  // Lanes come from the same beats() the renderer uses — never hand-maintained.
  const lanes: Lane[] = useMemo(() => {
    const b = beats(v)
    const out = b.filter((x) => x.kind === 'out')
    const back = b.filter((x) => x.kind === 'back')
    const lanes: Lane[] = [
      { id: 'sweep', label: 'Outward sweep', start: out[0]?.start ?? 0, end: out.at(-1)?.end ?? 0, color: 'var(--signal)' },
      ...out.filter((_, i) => i % Math.ceil(v.rings / 6) === 0).map((x) => ({ id: `r${x.ring}`, label: `Ring ${x.ring + 1}`, start: x.start, end: x.end, depth: 1, color: 'var(--signal)' })),
    ]
    if (back.length) lanes.push({ id: 'back', label: 'Return sweep', start: back[0].start, end: back.at(-1)!.end, color: 'var(--cat-7)' })
    lanes.push({ id: 'cues', label: 'Cues', kind: 'markers', keys: [{ t: 0, value: 'in' }, { t: out.at(-1)?.end ?? 0, value: 'peak' }], color: 'var(--key)' })
    return lanes
  }, [v])

  const canvas = () => surface.current?.canvas
  const exportPng = () => { const c = canvas(); if (c) exportCanvasPNG(c, 'motion.png').then(() => toast('PNG exported', { type: 'success' })) }
  /** One loop, frame by frame (WebCodecs) at 2× the device size; real-time capture only as a fallback. */
  const exportVideo = async () => {
    const vals = params.values() as V
    const fps = 60, k = 2
    const out = document.createElement('canvas')
    out.width = DEVICE.w * k; out.height = DEVICE.h * k
    const ctx = out.getContext('2d', { alpha: false })!
    const ms = totalMs(vals)
    const ac = new AbortController()
    const pt = toast.progress('Rendering one loop', { onCancel: () => ac.abort() })
    let last = -1
    try {
      const blob = await recordFrames({
        canvas: out, fps, frames: Math.round((ms / 1000) * fps), name: 'motion.mp4', signal: ac.signal,
        draw: (t) => { ctx.setTransform(k, 0, 0, k, 0, 0); draw(ctx, vals, t, DEVICE.w, DEVICE.h) },
        onProgress: (p) => { const q = Math.round(p * 100); if (q !== last) { last = q; pt.set(p) } },
      })
      if (blob) { pt.done('Video exported', { description: `${out.width} × ${out.height} · ${fps} fps · ${(ms / 1000).toFixed(2)}s` }); return }
      if (ac.signal.aborted) { pt.fail('Export cancelled', { timeout: 2600 }); return }
      // No WebCodecs encoder: fall back to a real-time recording of the live canvas.
      const c = canvas()
      if (!c) { pt.fail('Nothing to record'); return }
      toast.update(pt.id, 'Recording one loop…', { type: 'loading', timeout: 0 })
      clock.replay()
      await recordCanvas(c, clock.getState().duration, fps, 'motion.webm')
      pt.done('Video exported', { description: 'Real-time WebM: this browser has no frame encoder.' })
    } catch (e) { pt.fail('Video export failed', { description: (e as Error).message }) }
  }

  const commands: Command[] = [
    { id: 'replay', label: 'Replay', group: 'Playback', shortcut: 'r', icon: RotateCcw, run: () => clock.replay() },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'video', label: 'Record one loop (video)', group: 'Export', icon: Film, run: exportVideo },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'motion.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Ripple" doc="Offers hub intro" mark={<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>} />}
          center={<Cluster><Button size="md" variant="ghost"><Smartphone size={14} strokeWidth={1.5} />iPhone 15</Button><IconButton icon={RotateCcw} label="Replay" shortcut="r" onClick={() => clock.replay()} /></Cluster>}
          end={
            <>
              <Cluster><ParamActions params={params} /></Cluster>
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
      right={<Panel header={<PanelHeader title="Design" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} lanes={lanes} />}
    >
      <Stage contentSize={{ w: DEVICE.w, h: DEVICE.h }}>
        <Artboard width={DEVICE.w} height={DEVICE.h} label="iPhone 15" background={v.bg} className="rounded-[44px]">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
