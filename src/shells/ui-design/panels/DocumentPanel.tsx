/* Empty selection → the page and the document (never a blank inspector): page
   background, page colours, export presets. Studio preferences (snapping, nudge,
   view, export defaults) live in the toolbar's <SettingsMenu>. */
import { useRef } from 'react'
import { RotateCcw, ImageDown, FileDown, FileUp, MousePointerClick } from 'lucide-react'
import { PanelHeader, Section, Row, ColorField, IconButton, Button, Tip, Swatch, Badge, Select, Segmented } from '@kit'
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
            <div className="grid grid-cols-[repeat(auto-fit,minmax(16px,1fr))] gap-1.5">
              {[...colours.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 18).map(([c, ids]) => (
                <Tip key={c} label={`${c.toUpperCase()} · ${ids.length} layer${ids.length > 1 ? 's' : ''}`}>
                  <button type="button" aria-label={`Select layers using ${c}`} onClick={() => S.select(ids)} className="block w-full max-w-7 rounded-control outline-none hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-signal">
                    {/* the swatch fills its grid cell, so a row never strands one swatch on its own line */}
                    <Swatch color={c} size={20} className="block aspect-square h-auto! w-full! rounded-control" />
                  </button>
                </Tip>
              ))}
            </div>
          </Row>
        )}
      </Section>
      <Section title="Export">
        <Row label="Format">
          <Select label="Export format" value={v.exportFormat} onChange={(f) => prefs.patch({ exportFormat: f })}
            options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }, { value: 'webp', label: 'WebP' }]} />
        </Row>
        <Row label="Scale">
          <Segmented label="Export scale" className="flex-1" value={v.exportScale} onChange={(sc) => prefs.patch({ exportScale: sc, exportSuffix: sc === '1' ? '' : `@${sc}x` })}
            options={[{ value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }]} />
        </Row>
        <div className="px-pad pt-1">
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
