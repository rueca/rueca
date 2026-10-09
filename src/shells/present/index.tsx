/* Client demo — one instrument, two audiences.
   Designer view: the full inspector, with the published params flagged.
   Client view: full-bleed art, a bottom sheet with ONLY `publish: true` params,
   big touch targets, Shuffle and Download. Forced on narrow screens and by `#/present?client`. */
import { useEffect, useRef, useState } from 'react'
import { Download, Eye, Shuffle, Send, ChevronUp, PencilRuler } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, CanvasSurface, ParamActions, Button, IconButton,
  CommandPalette, Badge, copyText, toast, download, useValues, cn, type SurfaceHandle, type Command,
} from '@kit'
import { params, clock, draw, FRAMES, PALETTES, type V } from './artifact'

const useNarrow = () => {
  const q = '(max-width: 760px)'
  const [n, setN] = useState(() => matchMedia(q).matches)
  useEffect(() => { const m = matchMedia(q); const on = () => setN(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on) }, [])
  return n
}

async function renderDownload(v: V) {
  const [w, h] = FRAMES[v.frame] ?? FRAMES.Story
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d')!, v, clock.time(), w, h)
  await new Promise<void>((res) => c.toBlob((b) => { if (b) download(b, `pattern-${v.palette.toLowerCase()}-${v.seed}.png`); res() }, 'image/png'))
}

export default function Present() {
  const narrow = useNarrow()
  const [clientPref, setClient] = useState(() => location.hash.includes('client'))
  const client = clientPref || narrow
  const surface = useRef<SurfaceHandle>(null)
  const v = useValues(params) as V

  useEffect(() => {
    document.documentElement.dataset.density = client ? 'comfortable' : ''
    return () => { document.documentElement.dataset.density = '' }
  }, [client])

  const shuffle = () => params.patch({ seed: Math.floor(Math.random() * 99999), palette: Object.keys(PALETTES)[Math.floor(Math.random() * 4)] })
  const save = () => renderDownload(params.values() as V).then(() => toast('Saved to downloads', { type: 'success' }))
  const send = async () => { await copyText(params.shareURL() + '&client'); toast('Link copied — send it to your designer', { type: 'success' }) }

  const commands: Command[] = [
    { id: 'client', label: client ? 'Designer view' : 'Client view', shortcut: 'mod+shift+p', icon: Eye, run: () => setClient((c) => !c) },
    { id: 'shuffle', label: 'Shuffle', shortcut: 'shift+r', icon: Shuffle, run: shuffle },
    { id: 'download', label: 'Download PNG', shortcut: 'mod+e', icon: Download, run: save },
    { id: 'send', label: 'Copy client link', icon: Send, run: send },
  ]

  const art = (
    <Stage fill>
      <CanvasSurface ref={surface} params={params} clock={clock} animate={v.drift} draw={(ctx, f) => draw(ctx, f.v as V, f.t, f.w, f.h)} />
    </Stage>
  )

  if (client) return (
    <>
      <div className="relative h-full w-full overflow-hidden bg-field">
        {art}
        <ClientSheet onShuffle={shuffle} onSave={save} onSend={send} onExit={narrow ? undefined : () => setClient(false)} />
      </div>
      <CommandPalette commands={commands} />
    </>
  )

  return (
    <Studio
      layout="overlay"
      toolbar={
        <Toolbar
          start={<Brand name="Pattern" doc="Harbour Co. brand system" mark={<svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>} />}
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

function ClientSheet({ onShuffle, onSave, onSend, onExit }: { onShuffle: () => void; onSave: () => void; onSend: () => void; onExit?: () => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className={cn('panel pointer-events-auto flex w-full max-w-[420px] flex-col overflow-hidden transition-[max-height] duration-300', open ? 'max-h-[70vh]' : 'max-h-[64px]')}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-[64px] flex-none items-center gap-3 px-4 text-left">
          <div className="flex-1">
            <div className="text-[14px] font-semibold">Make it yours</div>
            <div className="text-[12px] text-fg-muted">Shuffle, tweak, download</div>
          </div>
          <ChevronUp size={18} strokeWidth={1.5} className={cn('text-fg-faint transition-transform', !open && 'rotate-180')} />
        </button>
        <div className="min-h-0 overflow-y-auto border-t border-line">
          <Inspector params={params} published />
        </div>
        <div className="flex flex-none gap-2 border-t border-line p-3">
          <Button variant="default" size="lg" className="h-11 flex-1 text-[13px]" onClick={onShuffle}><Shuffle size={16} strokeWidth={1.5} />Shuffle</Button>
          <Button variant="primary" size="lg" className="h-11 flex-1 text-[13px]" onClick={onSave}><Download size={16} strokeWidth={1.5} />Download</Button>
          <IconButton icon={Send} label="Send to designer" size="icon" className="size-11 shrink-0" variant="default" onClick={onSend} tipSide="top" />
          {onExit && <IconButton icon={PencilRuler} label="Back to designer view" size="icon" className="size-11 shrink-0" onClick={onExit} tipSide="top" />}
        </div>
      </div>
    </div>
  )
}
