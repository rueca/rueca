/* Empty selection → page and document settings (Spline's rule: never a blank
   inspector). Page background, page colours, export presets, and the studio
   preferences rendered straight from their schema by the kit Inspector. */
import { useRef } from 'react'
import { RotateCcw, ImageDown, FileDown, FileUp, RefreshCw, Palette } from 'lucide-react'
import { Section, Row, ColorField, IconButton, Button, Inspector, Tip, Swatch, Badge } from '@kit'
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
      <div className="flex h-10 items-center gap-2 border-b border-line px-3">
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{pg.name}</span>
        <Badge>{frames} frames</Badge>
        <Badge>{layers} layers</Badge>
      </div>
      <Section title="Page" first>
        <Row label="Background" trailing={pg.bg ? <IconButton icon={RotateCcw} size="icon-sm" label="Follow the studio theme" onClick={() => S.setPage({ bg: '' })} /> : undefined}>
          <ColorField value={pg.bg || themeBg} alpha={false} changed={!!pg.bg} onChange={(c, f) => S.setPage({ bg: c.slice(0, 7) }, { commit: f })} />
        </Row>
        {colours.size > 0 && (
          <Row label="Colours" hint="Every solid fill on this page. Click one to select the layers using it." stacked>
            <div className="flex flex-wrap gap-1.5">
              {[...colours.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 18).map(([c, ids]) => (
                <Tip key={c} label={`${c.toUpperCase()} · ${ids.length} layer${ids.length > 1 ? 's' : ''}`}>
                  <button type="button" aria-label={`Select layers using ${c}`} onClick={() => S.select(ids)} className="rounded-[5px] outline-none hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-signal">
                    <Swatch color={c} size={20} className="rounded-[5px]" />
                  </button>
                </Tip>
              ))}
            </div>
          </Row>
        )}
      </Section>
      <Section title="Export">
        <div className="flex flex-wrap gap-1 px-3 pb-1.5">
          {[{ s: '1', f: 'png' }, { s: '2', f: 'png' }, { s: '3', f: 'png' }, { s: '2', f: 'jpg' }, { s: '2', f: 'webp' }].map((p) => {
            const on = v.exportScale === p.s && v.exportFormat === p.f
            return (
              <Button key={p.s + p.f} size="sm" variant={on ? 'default' : 'ghost'} active={on} onClick={() => prefs.patch({ exportScale: p.s, exportFormat: p.f, exportSuffix: p.s === '1' ? '' : `@${p.s}x` })}>
                {p.s}× {p.f.toUpperCase()}
              </Button>
            )
          })}
        </div>
        <div className="px-3">
          <Button variant="default" size="md" className="w-full" onClick={exportFrames} disabled={!frames}><ImageDown size={14} strokeWidth={1.5} />Export {frames} frame{frames === 1 ? '' : 's'}</Button>
        </div>
      </Section>
      <Section title="Document">
        <Row label="Components"><span className="flex-1 text-right tabular text-[11.5px] text-fg-muted">{comps} on this page</span></Row>
        <div className="grid grid-cols-2 gap-1.5 px-3 pt-1">
          <Button variant="default" size="md" onClick={downloadDocument}><FileDown size={14} strokeWidth={1.5} />Save .json</Button>
          <Button variant="default" size="md" onClick={() => file.current?.click()}><FileUp size={14} strokeWidth={1.5} />Open…</Button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) openDocument(f); e.target.value = '' }} />
        </div>
        <div className="px-3 pt-1.5">
          <Button variant="ghost" size="md" className="w-full" onClick={() => S.resetDocument()}><RefreshCw size={13} strokeWidth={1.5} />Reset to demo file</Button>
        </div>
      </Section>
      <div className="border-t border-line"><Inspector params={prefs} /></div>
      <div className="flex items-center gap-1.5 px-3 py-3 text-[11px] text-fg-faint"><Palette size={12} strokeWidth={1.5} />Select a layer to edit it. Hold ⌥ over a layer to measure.</div>
    </div>
  )
}
