/* Empty selection → the page and the document (never a blank inspector): page
   background, page colours, export presets. Studio preferences (snapping, nudge,
   view, export defaults) live in the toolbar's <SettingsMenu>. */
import { useRef } from 'react'
import { RotateCcw, ImageDown, FileDown, FileUp, MousePointerClick } from 'lucide-react'
import { PanelHeader, Section, Row, ColorField, IconButton, Button, Tip, Swatch, Badge } from '@kit'
import * as S from '../model/store'
import { prefs } from '../model/prefs'
import { walk } from '../model/tree'
import { exportFrames, downloadDocument, openDocument } from '../actions'
import { useValues } from '@kit'

export function DocumentPanel() {
  S.useDesign((s) => s.doc)
  S.useDesign((s) => s.pageId)
  const v = useValues(prefs)
  const file = useRef<HTMLInputElement>(null)
  const st = S.get()
  const pg = S.page(st)
  let layers = 0, comps = 0
  const colours = new Map<string, string[]>()
  walk(pg.nodes, (n) => {
    layers++
    if (n.component) comps++
    for (const f of n.fills) if (f.visible && f.kind === 'solid') colours.set(f.color.toLowerCase(), [...(colours.get(f.color.toLowerCase()) ?? []), n.id])
  })
  const frames = pg.nodes.filter((n) => n.type === 'frame').length
  const themeBg = getComputedStyle(document.documentElement).getPropertyValue('--field').trim() || '#1e1e1e'

  return (
    <div className="flex flex-col">
      <PanelHeader className="gap-2">
        <span className="min-w-0 flex-1 truncate text-title font-medium">{pg.name}</span>
        <Badge>{frames} frames</Badge>
        <Badge>{layers} layers</Badge>
      </PanelHeader>
      <Section title="Page" first>
        <Row label="Background" trailing={pg.bg ? <IconButton icon={RotateCcw} size="icon-sm" label="Follow the studio theme" onClick={() => S.setPage({ bg: '' })} /> : undefined}>
          <ColorField value={pg.bg || themeBg} alpha={false} changed={!!pg.bg} onChange={(c, f) => S.setPage({ bg: c.slice(0, 7) }, { commit: f })} />
        </Row>
        {colours.size > 0 && (
          <Row label="Colours" hint="Every solid fill on this page. Click one to select the layers using it." stacked>
            <div className="flex flex-wrap gap-1.5">
              {[...colours.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 18).map(([c, ids]) => (
                <Tip key={c} label={`${c.toUpperCase()} · ${ids.length} layer${ids.length > 1 ? 's' : ''}`}>
                  <button type="button" aria-label={`Select layers using ${c}`} onClick={() => S.select(ids)} className="rounded-control outline-none hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-signal">
                    <Swatch color={c} size={20} className="rounded-control" />
                  </button>
                </Tip>
              ))}
            </div>
          </Row>
        )}
      </Section>
      <Section title="Export">
        <div className="flex flex-wrap gap-1 px-pad pb-1.5">
          {([{ s: '1', f: 'png' }, { s: '2', f: 'png' }, { s: '3', f: 'png' }, { s: '2', f: 'jpg' }, { s: '2', f: 'webp' }] as const).map((p) => {
            const on = v.exportScale === p.s && v.exportFormat === p.f
            return (
              <Button key={p.s + p.f} size="sm" variant={on ? 'default' : 'ghost'} active={on} onClick={() => prefs.patch({ exportScale: p.s, exportFormat: p.f, exportSuffix: p.s === '1' ? '' : `@${p.s}x` })}>
                {p.s}× {p.f.toUpperCase()}
              </Button>
            )
          })}
        </div>
        <div className="px-pad">
          <Button variant="default" size="md" className="w-full" onClick={exportFrames} disabled={!frames}><ImageDown size={14} strokeWidth={1.5} />Export {frames} frame{frames === 1 ? '' : 's'}</Button>
        </div>
      </Section>
      <Section title="Document">
        <Row label="Components"><span className="flex-1 text-right tabular text-ui text-fg-muted">{comps} on this page</span></Row>
        <div className="grid grid-cols-2 gap-1.5 px-pad pt-1">
          <Button variant="default" size="md" onClick={downloadDocument}><FileDown size={14} strokeWidth={1.5} />Save .json</Button>
          <Button variant="default" size="md" onClick={() => file.current?.click()}><FileUp size={14} strokeWidth={1.5} />Open…</Button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) openDocument(f); e.target.value = '' }} />
        </div>
        <div className="px-pad pt-1.5">
          <Button variant="ghost" size="md" className="w-full" onClick={() => S.resetDocument()}><RotateCcw size={13} strokeWidth={1.5} />Reset to demo file</Button>
        </div>
      </Section>
      <div className="flex items-start gap-1.5 px-pad py-3 text-ui text-fg-faint"><MousePointerClick size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />Select a layer to edit it. Hold ⌥ over a layer to measure.</div>
    </div>
  )
}
