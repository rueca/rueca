/* Drop-in: the harness around an existing prototype it does not own.
   The prototype is public/protos/hero.html; it includes public/studio-bridge.js
   and maps values onto CSS custom properties. Nothing here knows how it renders. */
import '@fontsource/la-belle-aurore/latin-400.css'
import { useState } from 'react'
import { LayoutGrid, ExternalLink, MousePointer2, Hand, RefreshCw, Monitor, Tablet, Smartphone, Code2 } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, FrameSurface,
  ParamActions, Segmented, Button, IconButton, Menu, CommandPalette, defineSchema, folder, p, createParams,
  copyText, toast, shareMenuItems, type Command,
} from '@kit'
import { WIRE } from '@/demo/wire'
import { DYE } from '@/demo/clients'

const schema = defineSchema({
  copy: folder('Copy', {
    headline: p.text('Ink that remembers where it came from.', { multiline: true, hint: 'Wrap a word in *asterisks* for the accent italic.' }),
    lede: p.text('Six natural inks, made in small batches from seeds, beetles, leaves and walnut husks. Each bottle says where its colour grew.', { multiline: true }),
  }),
  type: folder('Type & layout', {
    headlineSize: p.number(80, { min: 40, max: 120, step: 1, unit: 'px', label: 'Headline', hint: 'Desktop size; mobile is 55% of this.' }),
    gap: p.number(36, { min: 0, max: 96, step: 2, unit: 'px', hint: 'Space between the copy and the art.' }),
    radius: p.number(4, { min: 0, max: 40, step: 1, unit: 'px', label: 'Corner radius' }),
  }),
  color: folder('Colour', {
    bg: p.color(WIRE.paper, { label: 'Background', alpha: false }),
    ink: p.color(WIRE.ink, { label: 'Ink', alpha: false }),
    accent: p.color(DYE.achiote, { label: 'Accent', alpha: false, hint: 'The italic word and the primary button: Agalla’s one bright, with ink on it.' }),
  }),
  art: folder('Art', {
    blobSpeed: p.number(14, { min: 3, max: 40, step: 1, unit: 's', label: 'Float', hint: 'Seconds per float cycle of the hero image.' }),
    tilt: p.number(0, { min: -8, max: 8, step: 0.5, unit: '°', hint: 'Rotate the art card.' }),
  }, { collapsed: true }),
})

const params = createParams(schema, {
  id: 'dropin',
  version: 5, // v5: copy pass; v4 plain headline; v3 was Agalla with an Achiote italic
  presets: [
    { name: 'Night', values: { bg: WIRE.ink, ink: WIRE.paper } },
    { name: 'Editorial', values: { headlineSize: 104, radius: 0, gap: 56, accent: WIRE.ink } },
  ],
})

const SIZES = [
  { id: 'desktop', label: 'Desktop', w: 1280, h: 800, icon: Monitor },
  { id: 'tablet', label: 'Tablet', w: 768, h: 1024, icon: Tablet },
  { id: 'mobile', label: 'Mobile', w: 390, h: 844, icon: Smartphone },
] as const

/* Red-pen notes under the first artboard: annotation only, never content. */
const NOTES = ['hero · the bottle, shot on its own dye', 'one flat bright · the action, ink on Achiote']
const NOTES_H = 36 + NOTES.length * 46
function PenNotes({ x, y }: { x: number; y: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute flex flex-col gap-3" style={{ left: x, top: y, color: WIRE.pen, font: `36px/40px ${PEN_FONT}` }}>
      {NOTES.map((n, i) => (
        <div key={n} className="flex items-center gap-3 whitespace-nowrap">
          <span className="grid place-items-center rounded-full" style={{ width: 34, height: 34, border: `2px solid ${WIRE.pen}`, font: `600 17px/1 'Geist Mono Variable', ui-monospace, monospace` }}>{i + 1}</span>{n}
        </div>
      ))}
    </div>
  )
}
/* the red pen writes in the hand (brand/RUECA.md §2: notes are La Belle Aurore, in Achiote) */
const PEN_FONT = "'La Belle Aurore', cursive"

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
  const content = { w: x - 120, h: Math.max(...shown.map((s) => s.h)) + NOTES_H }

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
          start={<Brand name="Drop-in" doc="agalla / hero.html" mark={<svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>} />}
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
          <Artboard key={s.id} x={s.x} width={s.w} height={s.h} background={WIRE.paper} label={<><s.icon size={11} strokeWidth={1.75} />{s.label}</>}>
            {/* inert outside Interact: Tab ran through every link in all three frames, and Enter followed them */}
            <div className="contents" inert={!interact}>
              <FrameSurface key={nonce} src={SRC} params={params} title={`Prototype at ${s.label}`} />
            </div>
            {!interact && <div className="absolute inset-0" aria-hidden />}
          </Artboard>
        ))}
        <PenNotes x={placed[0].x} y={placed[0].h + 36} />
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
