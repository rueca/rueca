/* Drop-in: the harness around an existing prototype it does not own.
   The prototype is public/protos/hero.html; it includes public/studio-bridge.js
   and maps values onto CSS custom properties. Nothing here knows how it renders. */
import { useState } from 'react'
import { LayoutGrid, ExternalLink, MousePointer2, Hand, RefreshCw, Monitor, Tablet, Smartphone, Code2 } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, FrameSurface,
  ParamActions, Segmented, Button, IconButton, Menu, CommandPalette, defineSchema, folder, p, createParams,
  copyText, toast, shareMenuItems, type Command,
} from '@kit'

const schema = defineSchema({
  copy: folder('Copy', {
    headline: p.text('Freight that *moves* like software.', { multiline: true, hint: 'Wrap a word in *asterisks* for the accent italic.' }),
    lede: p.text('Book, track and settle every shipment in one place — with prices that update as fast as the road does.', { multiline: true }),
  }),
  type: folder('Type & layout', {
    headlineSize: p.number(76, { min: 40, max: 120, step: 1, unit: 'px', label: 'Headline', hint: 'Desktop size; mobile is 55% of this.' }),
    gap: p.number(28, { min: 0, max: 96, step: 2, unit: 'px', hint: 'Space between the copy and the art.' }),
    radius: p.number(18, { min: 0, max: 40, step: 1, unit: 'px', label: 'Corner radius' }),
  }),
  color: folder('Colour', {
    bg: p.color('#f4f1ea', { label: 'Background', alpha: false }),
    ink: p.color('#1d1b16', { label: 'Ink', alpha: false }),
    accent: p.color('#ff5a1f', { label: 'Accent', alpha: false }),
  }),
  art: folder('Art', {
    blobSpeed: p.number(14, { min: 3, max: 40, step: 1, unit: 's', label: 'Drift', hint: 'Seconds per blob drift cycle.' }),
    tilt: p.number(0, { min: -8, max: 8, step: 0.5, unit: '°', hint: 'Rotate the art card.' }),
  }, { collapsed: true }),
})

const params = createParams(schema, {
  id: 'dropin',
  presets: [
    { name: 'Night', values: { bg: '#0f0f12', ink: '#f2efe8', accent: '#7c6cff' } },
    { name: 'Editorial', values: { headlineSize: 104, radius: 0, accent: '#1d1b16', gap: 56 } },
  ],
})

const SIZES = [
  { id: 'desktop', label: 'Desktop', w: 1280, h: 800, icon: Monitor },
  { id: 'tablet', label: 'Tablet', w: 768, h: 1024, icon: Tablet },
  { id: 'mobile', label: 'Mobile', w: 390, h: 844, icon: Smartphone },
] as const

const SRC = `${import.meta.env.BASE_URL}protos/hero.html`

export default function DropIn() {
  const [view, setView] = useState<'all' | (typeof SIZES)[number]['id']>('all')
  // Iframes swallow pointer + wheel events. In "Hand" mode a shield sits over them so the
  // canvas camera works; in "Interact" mode the prototype gets the pointer (Figma: design vs prototype).
  const [interact, setInteract] = useState(false)
  const [nonce, setNonce] = useState(0)
  const shown = SIZES.filter((s) => view === 'all' || s.id === view)
  let x = 0
  const placed = shown.map((s) => { const at = x; x += s.w + 120; return { ...s, x: at } })
  const content = { w: x - 120, h: Math.max(...shown.map((s) => s.h)) }

  const snippet = `<script src="studio-bridge.js"></script>\n<script>\n  studio.cssVars()            // values → CSS custom properties\n  studio.on((v) => { /* anything else */ })\n</script>`
  const commands: Command[] = [
    { id: 'interact', label: interact ? 'Switch to hand (pan the canvas)' : 'Switch to interact (use the prototype)', shortcut: 'i', run: () => setInteract((v) => !v) },
    { id: 'reload', label: 'Reload prototype', shortcut: 'mod+r', icon: RefreshCw, run: () => setNonce((n) => n + 1) },
    { id: 'snippet', label: 'Copy bridge snippet', group: 'Share', icon: Code2, run: async () => { await copyText(snippet); toast('Snippet copied', { type: 'success' }) } },
    ...SIZES.map((s) => ({ id: s.id, label: `Show ${s.label} only`, group: 'View', run: () => setView(s.id) })),
    { id: 'all', label: 'Show all breakpoints', group: 'View', run: () => setView('all') },
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Drop-in" doc="northwind / hero.html" mark={<svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>} />}
          center={
            <Cluster className="gap-1">
              <div className="w-[132px]">
                <Segmented value={view} onChange={(v) => setView(v as typeof view)}
                  iconOnly options={[{ value: 'all', label: 'All breakpoints', icon: LayoutGrid }, ...SIZES.map((s) => ({ value: s.id, label: s.label, icon: s.icon }))]} />
              </div>
              <IconButton icon={interact ? MousePointer2 : Hand} label={interact ? 'Interacting with prototype' : 'Panning canvas'} shortcut="i" active={interact} onClick={() => setInteract(!interact)} />
              <IconButton icon={RefreshCw} label="Reload prototype" onClick={() => setNonce((n) => n + 1)} />
            </Cluster>
          }
          end={
            <>
              <Cluster><ParamActions params={params} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Code2 size={14} strokeWidth={1.75} />Hand off</Button>}
                items={[
                  { type: 'label', label: 'Hand off' },
                  { label: 'Copy bridge snippet', icon: Code2, onClick: async () => { await copyText(snippet); toast('Snippet copied', { type: 'success' }) } },
                  { label: 'Open prototype in new tab', icon: ExternalLink, onClick: () => open(SRC, '_blank') },
                  { type: 'separator' },
                  ...shareMenuItems(params),
                ]} />
            </>
          }
        />
      }
      right={<Panel header={<PanelHeader title="hero.html" />}><Inspector params={params} /></Panel>}
    >
      <Stage key={view} contentSize={content} grid>
        {placed.map((s) => (
          <Artboard key={s.id} x={s.x} width={s.w} height={s.h} background="#fff" label={<><s.icon size={11} strokeWidth={1.75} />{s.label}</>}>
            <FrameSurface key={nonce} src={SRC} params={params} title={`Prototype at ${s.label}`} />
            {!interact && <div className="absolute inset-0" aria-hidden />}
          </Artboard>
        ))}
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
