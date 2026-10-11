/* ---------------------------------------------------------------------------
   Component lab — a component playground (Storybook × Framer × tweakcn).

   Islands layout: components + generated props on the left, the preview or
   the states matrix on the stage, tokens / code on the right. The component
   set has its OWN token theme and light/dark switch, independent of the
   studio chrome. Undo spans props and tokens (kit createHistory).
--------------------------------------------------------------------------- */
import '@fontsource-variable/ibm-plex-sans'
import '@fontsource-variable/newsreader'
import { Download, Braces, FileCode2, Wind, Code, Undo2, Redo2, Eye, Grid3x3, Sun, Moon, Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react'
import {
  Studio, Toolbar, Brand, Cluster, Panel, PanelHeader, PanelTabs, Stage, CommandPalette, IconButton, Button, Menu, Divider, Segmented,
  CompareButton, PresetMenu, ThemeToggle, HistoryButtons, createHistory, shareMenuItems, useHotkeys, copyText, toast, download, exportJSON, type Command,
} from '@kit'
import { tokens, tokensCSS, tokensDTCG, tokensTailwind } from './tokens'
import { buttonProps, inputProps, cardProps, jsxFor, STORES } from './props'
import { LIB_CSS } from './lib/styles'
import { useUI, setUI, ui } from './ui'
import { LeftPanel, COMPONENTS } from './panels/LeftPanel'
import { TokensPanel, CodePanel } from './panels/RightPanel'
import { Preview, VIEWPORTS } from './views/Preview'
import { Matrix } from './views/Matrix'

/** One ⌘Z timeline across the three prop stores and the token theme. */
const history = createHistory([buttonProps, inputProps, cardProps, tokens])

const exportCSS = () => { download(new Blob([tokensCSS(tokens.values())], { type: 'text/css' }), 'tokens.css'); toast('tokens.css downloaded', { type: 'success', description: 'Light + dark CSS variables' }) }
const exportDTCG = () => { exportJSON(tokensDTCG(tokens.values()), 'tokens.json'); toast('tokens.json downloaded', { type: 'success', description: 'W3C design tokens format' }) }
const exportTailwind = () => { download(new Blob([tokensTailwind(tokens.values())], { type: 'text/css' }), 'theme.css'); toast('theme.css downloaded', { type: 'success', description: 'Tailwind v4 @theme block' }) }
const copyJSX = async () => { await copyText(jsxFor(ui.getState().comp)); toast('JSX copied', { type: 'success' }) }
const copyVars = async () => { await copyText(tokensCSS(tokens.values())); toast('CSS variables copied', { type: 'success' }) }

export default function ComponentLab() {
  const view = useUI((s) => s.view)
  const comp = useUI((s) => s.comp)
  const rightTab = useUI((s) => s.rightTab)
  const previewTheme = useUI((s) => s.previewTheme)

  const cycleViewport = (dir: 1 | -1) => {
    const w = ui.getState().width
    const i = VIEWPORTS.findIndex((p) => p.width === w)
    const next = i < 0 ? VIEWPORTS.reduce((a, p) => (Math.abs(p.width - w) < Math.abs(a.width - w) ? p : a)) : VIEWPORTS[(i + dir + VIEWPORTS.length) % VIEWPORTS.length]
    setUI({ width: next.width, view: 'preview' })
  }

  useHotkeys({
    '[': { run: () => cycleViewport(-1), label: 'Previous viewport', group: 'View' },
    ']': { run: () => cycleViewport(1), label: 'Next viewport', group: 'View' },
  })

  const commands: Command[] = [
    ...COMPONENTS.map((c, i) => ({ id: `comp-${c.id}`, label: `Show ${c.name.toLowerCase()}`, group: 'Components', shortcut: String(i + 1), icon: c.icon, run: () => setUI({ comp: c.id, picked: null }) })),
    { id: 'preview', label: 'Preview', group: 'View', shortcut: 'p', icon: Eye, run: () => setUI({ view: 'preview' }) },
    { id: 'states', label: 'States matrix', group: 'View', shortcut: 'm', icon: Grid3x3, run: () => setUI({ view: 'states' }) },
    { id: 'dark', label: previewTheme === 'light' ? 'Preview in dark' : 'Preview in light', group: 'View', shortcut: 'd', icon: previewTheme === 'light' ? Moon : Sun, run: () => setUI({ previewTheme: ui.getState().previewTheme === 'light' ? 'dark' : 'light' }) },
    { id: 'both', label: 'Matrix: light and dark side by side', group: 'View', icon: Grid3x3, run: () => setUI({ view: 'states', matrixThemes: 'both' }) },
    ...VIEWPORTS.map((p) => ({ id: `vp-${p.width}`, label: `Viewport: ${p.label} (${p.width}px)`, group: 'Viewport', icon: p.width < 500 ? Smartphone : p.width < 1000 ? Tablet : Monitor, run: () => setUI({ width: p.width, view: 'preview' }) })),
    { id: 'tokens-tab', label: 'Edit tokens', group: 'Panels', run: () => setUI({ rightTab: 'tokens' }) },
    { id: 'code-tab', label: 'Show code', group: 'Panels', icon: Code, run: () => setUI({ rightTab: 'code' }) },
    { id: 'undo', label: 'Undo', group: 'Edit', icon: Undo2, run: () => history.undo() },
    { id: 'redo', label: 'Redo', group: 'Edit', icon: Redo2, run: () => history.redo() },
    { id: 'reset-props', label: 'Reset props', group: 'Edit', icon: RotateCcw, run: () => STORES[ui.getState().comp].reset() },
    { id: 'reset-tokens', label: 'Reset tokens to default', group: 'Edit', icon: RotateCcw, run: () => tokens.reset() },
    ...tokens.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Look: ${p.name}`, group: 'Token presets', run: () => tokens.applyPreset(p.name) })),
    { id: 'css', label: 'Download tokens.css', group: 'Export', shortcut: 'mod+e', icon: FileCode2, run: exportCSS },
    { id: 'json', label: 'Download tokens.json (W3C)', group: 'Export', icon: Braces, run: exportDTCG },
    { id: 'tw', label: 'Download Tailwind theme', group: 'Export', icon: Wind, run: exportTailwind },
    { id: 'jsx', label: 'Copy JSX for current props', group: 'Export', shortcut: 'shift+mod+c', icon: Code, run: copyJSX },
    { id: 'vars', label: 'Copy CSS variables', group: 'Export', run: copyVars },
  ]

  return (
    <Studio
      leftWidth={280}
      rightWidth={308}
      toolbar={
        <Toolbar
          start={<Brand name="Component lab" doc="Gabinete UI" mark={<svg viewBox="0 0 16 16" width="11" height="11"><rect x="2.5" y="4.5" width="11" height="7" rx="3.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>} />}
          center={
            <Cluster className="px-1">
              <div className="w-[200px]">
                <Segmented value={view} onChange={(v) => setUI({ view: v as 'preview' })} label="View"
                  options={[{ value: 'preview', label: 'Preview', icon: Eye, hint: 'Preview (P)' }, { value: 'states', label: 'States', icon: Grid3x3, hint: 'States matrix (M)' }]} />
              </div>
            </Cluster>
          }
          end={
            <>
              <Cluster>
                <HistoryButtons history={history} />
                <CompareButton params={tokens} />
                <Divider vertical />
                <PresetMenu params={tokens} />
                <Menu align="end" trigger={<IconButton icon={Braces} label="Share tokens" />} items={shareMenuItems(tokens)} />
                <ThemeToggle />
              </Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: 'Tokens' },
                  { label: 'tokens.css (light + dark)', icon: FileCode2, shortcut: 'mod+e', onClick: exportCSS },
                  { label: 'tokens.json (W3C)', icon: Braces, onClick: exportDTCG },
                  { label: 'Tailwind v4 theme', icon: Wind, onClick: exportTailwind },
                  { type: 'separator' },
                  { type: 'label', label: 'Component' },
                  { label: 'Copy JSX', icon: Code, shortcut: 'shift+mod+c', onClick: copyJSX },
                  { label: 'Copy CSS variables', icon: FileCode2, onClick: copyVars },
                ]} />
            </>
          }
        />
      }
      left={<Panel header={<PanelHeader title="Components" />}><LeftPanel /></Panel>}
      right={
        <Panel header={<PanelHeader><PanelTabs value={rightTab} onChange={(t) => setUI({ rightTab: t })} tabs={[{ value: 'tokens', label: 'Tokens' }, { value: 'code', label: 'Code' }]} /></PanelHeader>}>
          {rightTab === 'tokens' ? <TokensPanel /> : <CodePanel />}
        </Panel>
      }
    >
      <style>{LIB_CSS}</style>
      <div className="panel h-full overflow-hidden">
        <Stage fill className="bg-field" grid>
          {view === 'preview' ? <Preview key={comp} /> : <Matrix />}
        </Stage>
      </div>
      <CommandPalette commands={commands} />
    </Studio>
  )
}
