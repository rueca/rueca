/* Client demo — one instrument, two audiences.
   Designer view: the full inspector, with the published params flagged.
   Client view: the kit's <ClientView> — full-bleed art, ONLY `publish: true` params at touch size,
   Shuffle, Download and Send. Forced on narrow screens and by `#/present?client`. */
import { useRef } from 'react'
import { Download, Eye, Shuffle, Send } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface, ParamActions, Button,
  ClientView, useClientMode, clientLink, CommandPalette, Badge, copyText, toast, download, useValues, type SurfaceHandle, type Command,
} from '@kit'
import { params, clock, draw, FRAMES, PALETTES, type V } from './artifact'

async function renderDownload(v: V) {
  const [w, h] = FRAMES[v.frame] ?? FRAMES.Story
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d')!, v, clock.time(), w, h)
  await new Promise<void>((res) => c.toBlob((b) => { if (b) download(b, `pattern-${v.palette.toLowerCase()}-${v.seed}.png`); res() }, 'image/png'))
}

export default function Present() {
  const { client, forced, setClient } = useClientMode({ hotkey: false })   // the palette command below owns ⌘⇧P
  const surface = useRef<SurfaceHandle>(null)
  const v = useValues(params) as V

  const shuffle = () => params.patch({ seed: Math.floor(Math.random() * 99999), palette: Object.keys(PALETTES)[Math.floor(Math.random() * Object.keys(PALETTES).length)] })
  const save = () => renderDownload(params.values() as V)
  const send = async () => { await copyText(clientLink(params)); toast('Client link copied', { type: 'success' }) }

  const commands: Command[] = [
    { id: 'client', label: client ? 'Designer view' : 'Client view', shortcut: 'mod+shift+p', icon: Eye, run: () => setClient((c) => !c) },
    { id: 'shuffle', label: 'Shuffle', shortcut: 'shift+r', icon: Shuffle, run: shuffle },
    { id: 'download', label: 'Download PNG', shortcut: 'mod+e', icon: Download, run: () => save().then(() => toast('Saved to downloads', { type: 'success' })) },
    { id: 'send', label: 'Copy client link', icon: Send, run: send },
  ]

  // The art is shown at its export size on an artboard, fitted to the screen: what the client tunes on a phone is
  // exactly what Download saves (client-view C7: a full-screen canvas drew 64px tiles at phone width, 2.8× bigger).
  const [fw, fh] = FRAMES[v.frame] ?? FRAMES.Story
  const art = (
    <Stage contentSize={{ w: fw, h: fh }} hud={!client} padding={client ? 16 : 48}>
      <Artboard width={fw} height={fh} label={client ? undefined : v.frame}>
        <CanvasSurface ref={surface} params={params} clock={clock} animate={v.drift} width={fw} height={fh} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
      </Artboard>
    </Stage>
  )

  if (client) return (
    <>
      <ClientView params={params} subtitle="Shuffle, tweak, download" onDownload={save} onExit={forced ? undefined : () => setClient(false)}
        actions={<Button variant="default" size="lg" className="h-11 flex-1 text-[14px]" onClick={shuffle}><Shuffle size={16} strokeWidth={1.5} />Shuffle</Button>}>
        {art}
      </ClientView>
      <CommandPalette commands={commands} />
    </>
  )

  return (
    <Studio
      layout="overlay"
      toolbar={
        <Toolbar
          start={<Brand name="Pattern" doc="Agalla wrapping paper" mark={<svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>} />}
          end={
            <>
              <Cluster><ParamActions params={params} presets={false} /></Cluster>
              <Button variant="primary" size="lg" onClick={() => setClient(true)}><Eye size={14} strokeWidth={1.75} />Client view</Button>
            </>
          }
        />
      }
      right={
        <Panel header={<PanelHeader title="Designer"><Badge tone="accent">{Object.values(params.defs).filter((d) => 'publish' in d && d.publish).length} published</Badge></PanelHeader>}>
          <Inspector params={params} />
          <div className="mx-3 mb-3 rounded-[8px] bg-well p-3 text-[11.5px] leading-relaxed text-fg-muted">
            Params marked <code className="text-fg">publish: true</code> appear in the client view. Everything else stays yours.
          </div>
        </Panel>
      }
    >
      {art}
      <CommandPalette commands={commands} />
    </Studio>
  )
}
