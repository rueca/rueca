import '@fontsource-variable/newsreader'
import { useDeferredValue, useMemo, useState } from 'react'
import { useStore } from 'zustand'
import {
  ChevronLeft, ChevronRight, ChevronDown, Download, SquareDashed, Plus, Copy, Trash2, ClipboardPaste, FileUp, FileDown, Lock, Image as ImageIcon,
  Braces, Rows3, RotateCcw, Package, X, Eraser, ArrowRightLeft, PanelBottom,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, PanelTabs, Button, IconButton, Menu, Divider, PresetMenu, ThemeToggle, CommandPalette,
  createCamera, shareMenuItems, useHotkeys, useValues, useDoc, exportCanvasPNG, exportJSON, toast, Badge, Tip, HistoryButtons, type Command,
  cn,
} from '@kit'
import { doc, params, ui, history, effective, SIZE_PRESETS, type V } from './model'
import { drawPost, ensureFonts, ensureShots, loadImage, peekImage } from './artifact'
import { BatchStage } from './stage'
import { SizesPanel, DesignTab, BrandTab, ExportTab, DataPanel, PasteDialog, CustomSizeDialog, addSizeItems } from './panels'
import {
  nextRow, prevRow, setRow, addRow, duplicateRow, removeRow, pickCSV, exportCSV, selectSize, removeSize, clearAllOverrides, clearOverride, resetDemo, addPreset,
} from './actions'
import { runExport, cancelExport, exporter, jobs, plannedJobs, slug } from './exporter'

const camera = createCamera()
const measure = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d')! : (null as unknown as CanvasRenderingContext2D)

// Brand links the mark home itself.
const Mark = () => <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" /><rect x="9" y="1.5" width="5.5" height="8" rx="1" /><rect x="1.5" y="9" width="5.5" height="5.5" rx="1" /><rect x="9" y="11.5" width="5.5" height="3" rx="1" /></svg>

/** Layout checks for every row × size — dry runs of the same drawPost the stage paints with. */
function useIssues() {
  const d = useDoc(doc, (x) => x)
  const v = useDeferredValue(useValues(params) as V)
  const logo = peekImage(v.logo)
  return useMemo(() => d.rows.map((r) => Object.fromEntries(d.sizes.map((s) => [s.id, drawPost(measure, s.w, s.h, r, effective(v, d.overrides[s.id]), s, logo, true).issues]))), [d, v, logo])
}

export default function BatchShell() {
  const rows = useDoc(doc, (d) => d.rows)
  const sizes = useDoc(doc, (d) => d.sizes)
  const row = useStore(ui, (s) => Math.min(s.row, Math.max(0, rows.length - 1)))
  const selected = useStore(ui, (s) => s.selected)
  const safe = useStore(ui, (s) => s.safe)
  const tab = useStore(ui, (s) => s.tab)
  const showData = useStore(ui, (s) => s.data)
  const running = useStore(jobs, (s) => s.status === 'running')
  const exportCount = useStore(exporter, (s) => plannedJobs(s.settings).length)
  const brand = useValues(params, (v) => (v as V).brandName)
  const locked = useValues(params, (v) => (v as V).brandLocked)
  const [paste, setPaste] = useState(false)
  const [custom, setCustom] = useState(false)

  const issues = useIssues()
  const rowIssueCount = issues.map((m) => Object.values(m).reduce((n, a) => n + a.length, 0))
  const totalIssues = rowIssueCount.reduce((a, b) => a + b, 0)
  const current = rows[row]

  const toggleSafe = () => ui.setState((s) => ({ safe: !s.safe }))
  const toggleData = () => ui.setState((s) => ({ data: !s.data }))
  const startExport = () => { ui.setState({ tab: 'export' }); void runExport() }
  const exportSelectedPNG = async () => {
    const id = ui.getState().selected ?? sizes.find((s) => s.visible !== false)?.id
    const size = sizes.find((s) => s.id === id)
    if (!size || !current) return
    await ensureFonts()
    await ensureShots([current])
    const v = params.values()
    const logo = v.logo ? await loadImage(v.logo).catch(() => null) : null
    const c = document.createElement('canvas')
    c.width = size.w; c.height = size.h
    drawPost(c.getContext('2d')!, size.w, size.h, current, effective(v, doc.get().overrides[size.id]), size, logo)
    await exportCanvasPNG(c, `${slug(brand)}-${slug(current.name)}-${slug(size.name)}.png`)
    toast('PNG exported', { type: 'success', description: `${current.name} — ${size.name}` })
  }
  const nextIssue = () => {
    const n = rows.length
    for (let k = 1; k <= n; k++) { const i = (row + k) % n; if (rowIssueCount[i]) { setRow(i); toast(`Row ${i + 1}: ${rows[i].name}`, { description: Object.entries(issues[i]).filter(([, a]) => a.length).map(([id, a]) => `${sizes.find((s) => s.id === id)?.name}: ${a.join(', ')}`).join(' · ') }); return } }
    toast('No layout issues', { type: 'success' })
  }

  useHotkeys({ esc: { run: () => (running ? cancelExport() : selectSize(null)), label: 'Deselect size / cancel export', group: 'Edit' } }, [running])

  const commands: Command[] = [
    { id: 'next', label: 'Next row', group: 'Rows', shortcut: 'arrowright', icon: ChevronRight, run: nextRow },
    { id: 'prev', label: 'Previous row', group: 'Rows', shortcut: 'arrowleft', icon: ChevronLeft, run: prevRow },
    ...rows.map((r, i) => ({ id: `row-${i}`, label: `Go to ${r.name}`, group: 'Rows', keywords: [r.headline, `row ${i + 1}`], run: () => setRow(i) })),
    { id: 'add-row', label: 'Add row', group: 'Data', icon: Plus, shortcut: 'mod+enter', run: () => addRow() },
    { id: 'dup-row', label: 'Duplicate row', group: 'Data', icon: Copy, shortcut: 'mod+d', run: () => duplicateRow() },
    { id: 'del-row', label: 'Delete row', group: 'Data', icon: Trash2, run: () => removeRow() },
    { id: 'paste', label: 'Paste CSV…', group: 'Data', icon: ClipboardPaste, keywords: ['import', 'spreadsheet', 'sheets', 'excel'], run: () => setPaste(true) },
    { id: 'import', label: 'Import CSV file…', group: 'Data', icon: FileUp, run: pickCSV },
    { id: 'csv', label: 'Download data as CSV', group: 'Data', icon: FileDown, run: exportCSV },
    { id: 'data', label: showData ? 'Hide data table' : 'Show data table', group: 'View', icon: PanelBottom, shortcut: 'd', run: toggleData },
    { id: 'safe', label: safe ? 'Hide safe areas' : 'Show safe areas', group: 'View', icon: SquareDashed, shortcut: 's', run: toggleSafe },
    { id: 'issue', label: 'Jump to next layout issue', group: 'View', shortcut: 'i', run: nextIssue },
    { id: 'fit', label: 'Zoom to fit', group: 'View', run: () => camera.fit() },
    ...sizes.map((s) => ({ id: `sel-${s.id}`, label: `Select ${s.name}`, group: 'Sizes', keywords: [`${s.w}x${s.h}`], run: () => selectSize(s.id) })),
    ...SIZE_PRESETS.map((p) => ({ id: `add-${p.name}`, label: `Add size: ${p.name}`, group: 'Sizes', icon: Plus, keywords: [`${p.w}x${p.h}`], run: () => addPreset(p.name) })),
    { id: 'custom', label: 'Add custom size…', group: 'Sizes', icon: Plus, run: () => setCustom(true) },
    ...(selected ? [
      { id: 'clear-ov', label: 'Revert this size to the template', group: 'Sizes', icon: Eraser, run: () => clearOverride(selected) },
      { id: 'rm-size', label: 'Remove selected size', group: 'Sizes', icon: Trash2, shortcut: 'backspace', run: () => removeSize(selected) },
    ] : []),
    { id: 'clear-all', label: 'Clear all size overrides', group: 'Sizes', icon: Eraser, run: clearAllOverrides },
    { id: 'export', label: `Export all (${exportCount} images)`, group: 'Export', icon: Package, shortcut: 'shift+mod+e', run: startExport },
    { id: 'export-row', label: 'Export current row (zip)', group: 'Export', icon: Package, run: () => { ui.setState({ tab: 'export' }); void runExport({ rows: 'current' }) } },
    { id: 'export-one', label: 'Export selected artboard as PNG', group: 'Export', icon: ImageIcon, shortcut: 'mod+e', run: () => void exportSelectedPNG() },
    ...(running ? [{ id: 'cancel', label: 'Cancel export', group: 'Export', icon: X, run: cancelExport }] : []),
    { id: 'json', label: 'Download template + data (JSON)', group: 'Export', icon: Braces, run: () => exportJSON({ template: params.toJSON(), ...doc.get() }, `${slug(brand)}-batch.json`) },
    { id: 'lock', label: locked ? 'Unlock brand' : 'Lock brand', group: 'Brand', icon: Lock, shortcut: 'shift+mod+l', run: () => params.setValue('brandLocked', !locked) },
    { id: 'brand', label: 'Edit brand', group: 'Brand', run: () => ui.setState({ tab: 'brand' }) },
    ...params.getState().presets.map((p) => ({ id: `preset-${p.name}`, label: `Look: ${p.name}`, group: 'Template', run: () => params.applyPreset(p.name) })),
    { id: 'reset-tpl', label: 'Reset template to defaults', group: 'Template', icon: RotateCcw, run: () => params.reset(['layout', 'align', 'headlineScale', 'subheadScale', 'imageScale', 'padding', 'showSubhead', 'showBadge', 'showPrice', 'bgStyle', 'ctaStyle', 'decor', 'grain', 'seed'] as never) },
    { id: 'demo', label: 'Restore demo data', group: 'Template', icon: Rows3, run: resetDemo },
  ]

  return (
    <Studio
      toolbar={
        <Toolbar
          start={<Brand name="Batch" doc="Agalla — the six inks" mark={<Mark />} />}
          center={
            <Cluster>
              <IconButton icon={ChevronLeft} label="Previous row" shortcut="arrowleft" onClick={prevRow} disabled={rows.length < 2} />
              <Menu align="center" trigger={
                <Button size="md" className="min-w-[180px] max-w-[260px] justify-between gap-2 px-2 max-[1180px]:min-w-[132px] max-[1180px]:max-w-[160px]">
                  <span className="tabular text-fg-faint">{rows.length ? row + 1 : 0}/{rows.length}</span>
                  <span className="min-w-0 flex-1 truncate text-left text-fg">{current?.name ?? 'No rows'}</span>
                  {rowIssueCount[row] ? <span className="text-key"><Badge tone="key">{rowIssueCount[row]}</Badge></span> : null}
                  <ChevronDown size={12} className="text-fg-faint" />
                </Button>
              } items={[
                { type: 'label', label: 'Preview row' },
                ...rows.map((r, i) => ({ label: `${i + 1}. ${r.name}`, checked: i === row, hint: rowIssueCount[i] ? `${rowIssueCount[i]} issues` : undefined, onClick: () => setRow(i) })),
                { type: 'separator' },
                { label: 'Add row', icon: Plus, onClick: () => addRow() },
              ]} />
              <IconButton icon={ChevronRight} label="Next row" shortcut="arrowright" onClick={nextRow} disabled={rows.length < 2} />
              <Divider vertical />
              <IconButton icon={SquareDashed} label={safe ? 'Hide safe areas' : 'Show safe areas'} shortcut="s" active={safe} onClick={toggleSafe} />
              <Tip label={totalIssues ? `${totalIssues} layout issues across all rows — jump to next` : 'Every row fits every size'} shortcut="i">
                <Button size="md" className="gap-1 px-2" onClick={nextIssue} aria-label={totalIssues ? `${totalIssues} layout issues` : 'Fits: no layout issues'}>
                  <span aria-hidden className={totalIssues ? 'size-1.5 rounded-full bg-key' : 'size-1.5 rounded-full bg-ok'} />
                  <span className={cn('tabular', !totalIssues && 'max-[1180px]:hidden')}>{totalIssues || 'Fits'}</span>
                </Button>
              </Tip>
            </Cluster>
          }
          end={
            <>
              <Cluster>
                <HistoryButtons history={history} />
                <Divider vertical />
                <PresetMenu params={params} />
                <Menu align="end" trigger={<IconButton icon={ArrowRightLeft} label="Share & copy" />} items={shareMenuItems(params)} />
                <ThemeToggle />
              </Cluster>
              <Button variant="primary" size="lg" onClick={startExport} disabled={running || !exportCount}>
                <Download size={14} strokeWidth={1.75} />{running ? 'Exporting…' : `Export ${exportCount}`}
              </Button>
            </>
          }
        />
      }
      left={<SizesPanel openCustom={() => setCustom(true)} />}
      right={
        <Panel scroll={tab !== 'export'} className={tab === 'export' ? 'h-full' : undefined} header={
          <PanelHeader>
            <PanelTabs value={tab} onChange={(t) => ui.setState({ tab: t })} tabs={[{ value: 'design', label: 'Design' }, { value: 'brand', label: 'Brand' }, { value: 'export', label: 'Export' }]} />
            {tab === 'brand' && locked && <Tip label="Brand locked"><span className="text-signal"><Lock size={13} strokeWidth={1.5} /></span></Tip>}
            {tab === 'design' && <Menu align="end" trigger={<IconButton icon={Plus} label="Add size" size="icon-sm" />} items={addSizeItems(() => setCustom(true))} />}
          </PanelHeader>
        }>
          {tab === 'design' ? <DesignTab issues={issues[row] ?? {}} /> : tab === 'brand' ? <BrandTab /> : <ExportTab />}
        </Panel>
      }
      bottom={showData ? <DataPanel openPaste={() => setPaste(true)} rowIssues={(i) => Object.entries(issues[i] ?? {}).filter(([, a]) => a.length).map(([id, a]) => `${sizes.find((s) => s.id === id)?.name}: ${a.join(', ')}`)} /> : undefined}
    >
      <BatchStage camera={camera} issues={issues[row] ?? {}} />
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: 'shift+1', label: 'Zoom to fit' }, { keys: 'shift+0', label: 'Zoom to 100%' },
        { keys: 'enter', label: 'Edit cell (data table)' }, { keys: 'mod+v', label: 'Paste a block into the table' },
      ]} />
      <PasteDialog open={paste} onOpenChange={setPaste} />
      <CustomSizeDialog open={custom} onOpenChange={setCustom} />
    </Studio>
  )
}
