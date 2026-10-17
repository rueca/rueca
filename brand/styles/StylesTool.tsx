import { useRef } from 'react'
import { Braces, Download, Image as ImageIcon } from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Inspector, Stage, Artboard, CanvasSurface,
  ParamActions, Menu, Button, CommandPalette, useValues, exportCanvasPNG, exportJSON, toast,
  shareMenuItems, NoteLayer, type SurfaceHandle, type Command,
} from '@kit'
import { params, clock, draw, drawPoster, sizeOf, type V } from './artifact'
import { STYLES, type StyleId } from './styles'

// a square of hatching: the series' one idea, a line that carries tone
const MARK = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden fill="currentColor">
    <rect x="1" y="2" width="14" height="1.2" /><rect x="1" y="5" width="14" height="2" /><rect x="1" y="8.6" width="14" height="2.8" /><rect x="1" y="13" width="14" height="1.2" />
  </svg>
)

export function StylesTool() {
  const v = useValues(params) as V
  const surface = useRef<SurfaceHandle | null>(null)
  const size = sizeOf(v)

  const exportPng = () => {
    const c = surface.current?.canvas
    const name = v.view === 'board' ? 'rueca-styles-board' : `rueca-lamina-${String(STYLES.findIndex((s) => s.id === v.style) + 1).padStart(2, '0')}-${v.style}`
    if (c) exportCanvasPNG(c, `${name}.png`).then(() => toast('PNG exported', { type: 'success' }))
  }
  /** all twelve posters, one after another, at 1200 × 1600 */
  const exportAll = async () => {
    const vals = params.values() as V
    for (const [i, s] of STYLES.entries()) {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 1600
      const ctx = c.getContext('2d')!; ctx.fillStyle = '#FDFBFA'; ctx.fillRect(0, 0, 1200, 1600)
      drawPoster(ctx, s.id as StyleId, { ...vals, view: 'poster', style: s.id })
      await exportCanvasPNG(c, `rueca-lamina-${String(i + 1).padStart(2, '0')}-${s.id}.png`)
    }
    toast('Twelve posters exported', { type: 'success' })
  }

  const commands: Command[] = [
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'all', label: 'Export all twelve posters', group: 'Export', icon: ImageIcon, run: exportAll },
    { id: 'json', label: 'Download values', group: 'Export', icon: Braces, run: () => exportJSON(params.toJSON(), 'rueca-styles.json') },
    { id: 'reset', label: 'Reset all values', group: 'Values', run: () => params.reset() },
    ...STYLES.map((s, i) => ({ id: `style-${s.id}`, label: `Poster ${i + 1}: ${s.name}`, group: 'Posters', run: () => params.patch({ view: 'poster', style: s.id }, { commit: true }) })),
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Styles" doc="Rueca · brand" mark={MARK} href={false} />}
          end={
            <>
              <Cluster><ParamActions params={params} clock={clock} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: 'Export' },
                  { label: 'PNG (this view)', icon: ImageIcon, shortcut: 'mod+e', onClick: exportPng },
                  { label: 'All twelve posters', icon: ImageIcon, onClick: exportAll },
                  { type: 'separator' },
                  ...shareMenuItems(params),
                ]} />
            </>
          }
        />
      }
      right={<Panel header={<PanelHeader title="Muestrario" />}><Inspector params={params} /></Panel>}
    >
      <Stage contentSize={{ w: size.w, h: size.h }}>
        <Artboard x={0} y={0} width={size.w} height={size.h} label={v.view === 'board' ? 'All twelve' : STYLES.find((s) => s.id === v.style)?.english} selected background="#FDFBFA">
          <CanvasSurface ref={surface} params={params} clock={clock} draw={(ctx, f) => draw(ctx, f.v as V, f.w, f.h)} />
          <NoteLayer params={params} clock={clock} />
        </Artboard>
      </Stage>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
