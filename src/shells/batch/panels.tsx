/* Batch panels: sizes (left), design / brand / export (right), data (bottom). */
import { useMemo, useState, type CSSProperties } from 'react'
import { useStore } from 'zustand'
import {
  ArrowLeft, ArrowUpFromLine, ClipboardPaste, Download, FileDown, FileUp, Lock, LockOpen, Plus, RectangleHorizontal, RectangleVertical,
  Square, Trash2, TriangleAlert, X, Package, Check,
} from 'lucide-react'
import {
  Panel, PanelHeader, Inspector, Section, Row, LayerTree, Menu, Button, IconButton, Segmented, Checkbox, TextInput, SizeFields, Switch, Badge, Swatch, Tip, Empty,
  useValues, useDoc, type LayerItem, type MenuItem,
} from '@kit'
import { doc, params, ui, OVERRIDABLE, COLUMNS, SIZE_PRESETS, type V, type SizeSpec } from './model'
import { OverrideRows } from './local/OverrideRows'
import { DataGrid, parseDelimited } from '@kit/ui/data-grid'
import { JobQueue, Progress, useJobs } from '@kit/system/jobs'
import { Dialog } from '@kit/system/dialog'
import { fmtBytes } from '@kit'
import { drawPost } from './artifact'
import {
  addPreset, addRow, addSize, clearAllOverrides, clearOverride, editCell, exportCSV, importText, moveSize, overrideCount, pasteBlock, patchSize, pickCSV,
  promoteOverrides, removeRow, removeSize, selectSize, setOverride, setRow,
} from './actions'
import { exporter, jobs, plannedJobs, runExport, cancelExport, clearExport, downloadJob, downloadZip, setExportSettings } from './exporter'
import { rowsFromMatrix } from './actions'

/** 1080×1920 → 9:16, 1200×627 → 1.91:1 */
const ratio = (w: number, h: number) => {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a)
  const d = g(w, h)
  if (w / d <= 21 && h / d <= 21) return `${w / d}:${h / d}`
  return w >= h ? `${(w / h).toFixed(2).replace(/0$/, '')}:1` : `1:${(h / w).toFixed(2).replace(/0$/, '')}`
}
const shapeIcon = (s: SizeSpec) => (s.w / s.h > 1.15 ? RectangleHorizontal : s.w / s.h < 0.87 ? RectangleVertical : Square)

/* ---------------- left: sizes ---------------- */

export function addSizeItems(openCustom: () => void): MenuItem[] {
  return [
    { type: 'label', label: 'Add a platform size' },
    ...SIZE_PRESETS.map((p) => ({ label: p.name, hint: `${p.w} × ${p.h}`, icon: shapeIcon({ ...p, id: '' }), onClick: () => addPreset(p.name) })),
    { type: 'separator' },
    { label: 'Custom size…', icon: Plus, onClick: openCustom },
  ]
}

export function SizesPanel({ openCustom }: { openCustom: () => void }) {
  const sizes = useDoc(doc, (d) => d.sizes)
  const d = useDoc(doc, (x) => x)
  const selected = useStore(ui, (s) => s.selected)
  const items: LayerItem[] = sizes.map((s) => {
    const n = overrideCount(d, s.id)
    return {
      id: s.id, name: s.name, icon: shapeIcon(s), visible: s.visible !== false, locked: !!s.locked,
      meta: <span className="flex items-center gap-1.5 tabular">{n > 0 && <span role="img" className="size-1.5 rounded-full bg-signal" aria-label={`${n} overrides`} title={`${n} overrides`} />}{ratio(s.w, s.h)}</span>,
    }
  })
  return (
    <Panel
      header={
        <PanelHeader title="Sizes">
          <Menu align="end" trigger={<IconButton icon={Plus} label="Add size" size="icon-sm" />} items={addSizeItems(openCustom)} />
        </PanelHeader>
      }
      footer={<div className="px-pad py-2 text-ui text-fg-faint">{sizes.filter((s) => s.visible !== false).length} of {sizes.length} on stage · drag to reorder</div>}
    >
      {sizes.length ? (
        <LayerTree
          items={items}
          selected={selected ? [selected] : []}
          onSelect={(ids) => selectSize(ids.at(-1) ?? null)}
          onToggle={(id, prop) => {
            const s = sizes.find((x) => x.id === id)!
            patchSize(id, prop === 'visible' ? { visible: s.visible === false } : { locked: !s.locked })
          }}
          onMove={moveSize}
          onRename={(id, name) => patchSize(id, { name })}
        />
      ) : (
        <Empty icon={Square} title="No output sizes" hint="Add the formats this campaign ships in." action={<Button variant="default" className="mt-2" onClick={openCustom}><Plus size={14} strokeWidth={1.5} />Add size</Button>} />
      )}
    </Panel>
  )
}

/* ---------------- right: design ---------------- */

export function DesignTab({ issues }: { issues: Record<string, string[]> }) {
  const selected = useStore(ui, (s) => s.selected)
  const size = useDoc(doc, (d) => d.sizes.find((s) => s.id === selected))
  return size ? <SizeInspector size={size} issues={issues[size.id] ?? []} /> : <TemplateInspector />
}

function TemplateInspector() {
  const d = useDoc(doc, (x) => x)
  const withOverrides = d.sizes.filter((s) => overrideCount(d, s.id) > 0)
  return (
    <>
      <div className="px-pad pt-3 pb-1 text-ui leading-relaxed text-fg-muted">
        Template — every size inherits these. Select a size to override it.
      </div>
      <Inspector params={params} folders={['template', 'look']} />
      <Section title="Overrides" changed={withOverrides.length > 0} onReset={withOverrides.length ? clearAllOverrides : undefined}>
        {withOverrides.length ? withOverrides.map((s) => {
          const keys = Object.keys(d.overrides[s.id] ?? {})
          return (
            <button key={s.id} type="button" onClick={() => selectSize(s.id)}
              className="group/ov mx-1.5 flex min-h-row items-center gap-2 rounded-control px-1.5 py-1 text-left outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
              <span className="size-1.5 shrink-0 rounded-full bg-signal" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ui text-fg">{s.name}</span>
                <span className="block truncate text-ui text-fg-faint">{keys.map((k) => (params.defs[k] as { label?: string })?.label ?? k).join(', ')}</span>
              </span>
              <Badge>{keys.length}</Badge>
            </button>
          )
        }) : <div className="px-pad pb-1 text-ui text-fg-faint">No size overrides the template.</div>}
      </Section>
    </>
  )
}

/* one stable empty object: `?? {}` inside the selector made a new snapshot every read (getSnapshot loop) */
const NO_OVERRIDES: Record<string, unknown> = {}

function SizeInspector({ size, issues }: { size: SizeSpec; issues: string[] }) {
  const overrides = useDoc(doc, (d) => (d.overrides[size.id] ?? NO_OVERRIDES) as Record<string, unknown>)
  const v = useValues(params) as V
  const n = Object.keys(overrides).length
  const eff = { ...v, ...overrides } as V
  const mode = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d')!
    const row = doc.get().rows[ui.getState().row]
    return row ? drawPost(ctx, size.w, size.h, row, eff, size, null, true).mode : 'stack'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, JSON.stringify(eff)])
  const custom = !size.builtin
  return (
    <>
      <div className="flex items-center gap-1 border-b border-line px-1.5 py-1.5">
        <Button size="sm" onClick={() => selectSize(null)}><ArrowLeft size={13} strokeWidth={1.5} />Template</Button>
        <span className="flex-1" />
        <IconButton icon={size.locked ? Lock : LockOpen} label={size.locked ? 'Unlock size' : 'Lock size (freeze its overrides)'} size="icon-sm" active={!!size.locked}
          onClick={() => patchSize(size.id, { locked: !size.locked })} />
      </div>
      <Section title={size.name} first>
        <Row label="Name"><TextInput value={size.name} label="Size name" onChange={(s) => patchSize(size.id, { name: s }, false)} onCommit={() => doc.commit()} /></Row>
        <Row label="Size" hint={custom ? undefined : 'Platform sizes are fixed. Add a custom size to change dimensions.'}>
          {custom
            ? <SizeFields value={{ w: size.w, h: size.h }} min={16} max={8000} onChange={(s, f) => patchSize(size.id, { w: Math.round(s.w), h: Math.round(s.h) }, f)} />
            : <span className="tabular text-ui text-fg">{size.w} × {size.h} px</span>}
        </Row>
        <Row label="Safe area" hint="Insets kept clear of platform UI. Toggle the overlay with S.">
          <span className="tabular text-ui text-fg-muted">{[size.safe.t, size.safe.r, size.safe.b, size.safe.l].join(' · ')} px</span>
        </Row>
        <Row label="Layout used" hint="The rule this size resolves to with the current values.">
          <span className="text-ui text-fg capitalize">{mode}</span>
          {eff.layout === 'auto' && <span className="text-ui text-fg-faint">(auto)</span>}
        </Row>
      </Section>
      <Section
        title="Overrides"
        changed={n > 0}
        onReset={n && !size.locked ? () => clearOverride(size.id) : undefined}
        actions={<Badge tone={n ? 'accent' : 'default'}>{n}</Badge>}
      >
        {size.locked && <div className="px-pad pb-1 text-ui text-fg-muted">Size is locked. Unlock it to change overrides.</div>}
        <OverrideRows
          params={params}
          keys={[...OVERRIDABLE]}
          overrides={overrides}
          disabled={!!size.locked}
          onChange={(k, val, f) => setOverride(size.id, k, val, f)}
          onReset={(k) => clearOverride(size.id, k)}
        />
        {n > 0 && !size.locked && (
          <div className="px-pad pt-2">
            <Button variant="outline" size="md" className="w-full" onClick={() => promoteOverrides(size.id)}>
              <ArrowUpFromLine size={13} strokeWidth={1.5} />Push overrides to template
            </Button>
          </div>
        )}
      </Section>
      <Section title="Checks" changed={issues.length > 0}>
        {issues.length ? issues.map((i) => (
          <div key={i} className="flex min-h-row items-center gap-2 px-pad text-ui text-fg"><TriangleAlert size={12} strokeWidth={1.75} className="shrink-0 text-key" />{i}</div>
        )) : <div className="flex min-h-row items-center gap-2 px-pad text-ui text-fg-muted"><Check size={12} strokeWidth={2} className="text-ok" />Copy and product fit this row.</div>}
      </Section>
      <div className="border-t border-line p-2">
        <Button variant="danger" size="md" className="w-full" onClick={() => removeSize(size.id)}><Trash2 size={13} strokeWidth={1.5} />Remove size</Button>
      </div>
    </>
  )
}

/* ---------------- right: brand ---------------- */

export function BrandTab() {
  const locked = useValues(params, (v) => (v as V).brandLocked)
  const v = useValues(params) as V
  const rows = useDoc(doc, (d) => d.rows)
  return (
    <>
      <div className="p-2">
        <button type="button" onClick={() => params.setValue('brandLocked', !locked)} aria-pressed={locked}
          className="flex w-full items-center gap-2.5 rounded-cluster bg-control px-2.5 py-2 text-left outline-none hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal">
          <span className={locked ? 'text-signal' : 'text-fg-faint'}>{locked ? <Lock size={14} strokeWidth={1.5} /> : <LockOpen size={14} strokeWidth={1.5} />}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-ui font-medium text-fg">{locked ? 'Brand locked' : 'Brand unlocked'}</span>
            <span className="block text-ui text-fg-muted">{locked ? 'Logo, colours and type are read-only.' : 'Lock before handing over to keep the brand fixed.'}</span>
          </span>
          <Switch checked={locked} label="Lock brand" onChange={(b) => params.setValue('brandLocked', b)} />
        </button>
      </div>
      <Inspector params={params} folders={['brand']} />
      <Section title="Palette in use">
        <div className="flex flex-wrap gap-1 px-pad pb-1">
          <Tip label="Paper"><span><Swatch color={v.paper} size={20} /></span></Tip>
          <Tip label="Ink"><span><Swatch color={v.ink} size={20} /></span></Tip>
          <span className="mx-1 w-px self-stretch bg-line" />
          {rows.map((r, i) => <Tip key={i} label={`${r.name} · ${r.color}`}><button type="button" onClick={() => setRow(i)} className="rounded-control outline-none focus-visible:ring-2 focus-visible:ring-signal"><Swatch color={r.color} size={20} /></button></Tip>)}
        </div>
        <div className="px-pad pt-1 text-ui text-fg-faint">Row colours come from the data table.</div>
      </Section>
    </>
  )
}

/* ---------------- right: export ---------------- */

export function ExportTab() {
  const st = useStore(exporter)
  const run = useJobs(jobs)
  const sizes = useDoc(doc, (d) => d.sizes)
  const rows = useDoc(doc, (d) => d.rows.length)
  useStore(ui, (s) => s.row)
  const s = st.settings
  const planned = plannedJobs(s)
  const running = run.status === 'running'
  const chosen = (id: string) => (s.sizeIds ? s.sizeIds.includes(id) : sizes.find((x) => x.id === id)?.visible !== false)
  const toggleSize = (id: string) => {
    const cur = sizes.filter((x) => chosen(x.id)).map((x) => x.id)
    setExportSettings({ sizeIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
  }
  const total = run.jobs.length
  return (
    <div className="flex h-full flex-col">
      <div className={total ? 'min-h-0 flex-none overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto'} style={{ maxHeight: total ? '42%' : undefined }}>
      <Section title="Output" first>
        <Row label="Rows"><Segmented value={s.rows} onChange={(x) => setExportSettings({ rows: x as 'all' | 'current' })} options={[{ value: 'all', label: `All ${rows}` }, { value: 'current', label: 'Current' }]} /></Row>
        <Row label="Format"><Segmented value={s.format} onChange={(x) => setExportSettings({ format: x as 'png' | 'jpeg' })} options={[{ value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPEG' }]} /></Row>
        <Row label="Scale" hint="2× for retina placements; 0.5× for quick review."><Segmented value={s.scale} onChange={(x) => setExportSettings({ scale: x as '1' })} options={[{ value: '0.5', label: '0.5×' }, { value: '1', label: '1×' }, { value: '2', label: '2×' }]} /></Row>
        <Row label="Package" hint="Zip is one download with a folder per product and a manifest. Files triggers one download per image."><Segmented value={s.pack} onChange={(x) => setExportSettings({ pack: x as 'zip' })} options={[{ value: 'zip', label: 'Zip' }, { value: 'files', label: 'Files' }]} /></Row>
        <Row label="File names" stacked hint="Tokens: {brand} {product} {size} {w} {h} {n}. A slash makes a folder inside the zip.">
          <TextInput mono value={s.naming} label="File name pattern" onChange={(x) => setExportSettings({ naming: x })} />
        </Row>
      </Section>
      <Section title="Sizes" actions={<Button size="sm" onClick={() => setExportSettings({ sizeIds: null })}>Visible</Button>}>
        {sizes.map((z) => (
          <label key={z.id} className="flex h-row cursor-default items-center gap-2 px-pad text-ui hover:bg-hover">
            <Checkbox checked={chosen(z.id)} onChange={() => toggleSize(z.id)} label={z.name} />
            <span className="min-w-0 flex-1 truncate text-fg">{z.name}</span>
            <span className="tabular text-ui text-fg-faint">{z.w}×{z.h}</span>
          </label>
        ))}
      </Section>
      </div>
      <div className="flex flex-none flex-col gap-2 border-t border-line p-pad">
        {running ? (
          <>
            <div className="flex items-center justify-between text-ui">
              <span className="text-fg tabular">Rendering {run.done + 1 > total ? total : run.done + 1} of {total}</span>
              <span className="text-fg-faint tabular">{fmtBytes(st.bytes)}</span>
            </div>
            <Progress value={run.done / Math.max(1, total)} label="Export progress" />
            <Button variant="outline" size="md" className="w-full" onClick={cancelExport}><X size={13} strokeWidth={1.5} />Cancel</Button>
          </>
        ) : run.status === 'done' || run.status === 'cancelled' ? (
          <>
            <div className="flex items-center justify-between text-ui">
              <span className="text-fg tabular">{run.done} of {total} rendered{run.status === 'cancelled' ? ' — cancelled' : ''}{run.failed ? ` · ${run.failed} failed` : ''}</span>
              <span className="text-fg-faint tabular">{(run.elapsed / 1000).toFixed(1)}s</span>
            </div>
            <Progress value={run.done / Math.max(1, total)} label="Export progress" tone={run.status === 'cancelled' ? 'rec' : 'ok'} />
            {st.zip && <Button variant="primary" size="lg" className="w-full" onClick={downloadZip}><Package size={14} strokeWidth={1.5} />Download zip · {fmtBytes(st.zip.size)}</Button>}
            <div className="flex gap-2">
              <Button variant="default" size="md" className="flex-1" onClick={() => void runExport()}>Render again</Button>
              <Button size="md" onClick={clearExport}>Clear</Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-ui text-fg-muted tabular">{planned.length} image{planned.length === 1 ? '' : 's'} · {s.format.toUpperCase()} at {s.scale}× · {s.pack === 'zip' ? 'one zip' : 'separate files'}</div>
            <Button variant="primary" size="lg" className="w-full" disabled={!planned.length} onClick={() => void runExport()}>
              <Download size={14} strokeWidth={1.75} />Render {planned.length} image{planned.length === 1 ? '' : 's'}
            </Button>
          </>
        )}
      </div>
      {total > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-1.5">
          <JobQueue jobs={run.jobs} onOpen={(j) => downloadJob(j.id)} />
        </div>
      )}
    </div>
  )
}

/* ---------------- bottom: data ---------------- */

/* the row-number column, every data column's minimum and the remove column (kit DataGrid template) */
const GRID_MIN = 36 + COLUMNS.reduce((n, c) => n + c.width, 0) + 32

export function DataPanel({ rowIssues, openPaste }: { rowIssues: (i: number) => string[] | undefined; openPaste: () => void }) {
  const rows = useDoc(doc, (d) => d.rows)
  const row = useStore(ui, (s) => s.row)
  return (
    <Panel
      className="h-[232px]"
      scroll={false}
      header={
        <PanelHeader title={<span>Data <span className="font-normal text-fg-faint">· {rows.length} row{rows.length === 1 ? '' : 's'} · each row is one set of assets</span></span>}>
          <IconButton icon={ClipboardPaste} label="Paste CSV…" size="icon-sm" onClick={openPaste} />
          <IconButton icon={FileUp} label="Import CSV file" size="icon-sm" onClick={pickCSV} />
          <IconButton icon={FileDown} label="Download as CSV" size="icon-sm" onClick={exportCSV} />
          <span className="mx-0.5 h-4 w-px bg-line" />
          <Button size="sm" onClick={() => addRow()}><Plus size={12} strokeWidth={1.75} />Row</Button>
        </PanelHeader>
      }
    >
      {/* Shell-side patches for the kit DataGrid (break-it A15/A20 — proper fix belongs in kit/ui/data-grid.tsx):
          the grid's keydown handler swallowed Enter/Space on the colour cell's "Pick colour" button, so let those
          reach the button; and pad that 14px swatch button to a 24px target. */}
      {/* The kit grid's rowgroup is min-w-max, so its fr columns grew to the longest Subhead and the table ran ~220px
          past the panel (Badge off-screen). Cap it at the panel width, but never below the columns' minimums. */}
      <div className="contents" style={{ '--grid-min': `${GRID_MIN}px` } as CSSProperties} onKeyDownCapture={(e) => {
        const t = e.target as HTMLElement
        if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute('aria-label') === 'Pick colour') e.stopPropagation()
      }}>
      <DataGrid
        className="h-full [&>[role=rowgroup]]:w-full [&>[role=rowgroup]]:min-w-[var(--grid-min)] [&_[aria-label='Pick_colour']]:-m-[5px] [&_[aria-label='Pick_colour']]:p-[5px]"
        columns={COLUMNS}
        rows={rows}
        activeRow={row}
        onActiveRow={setRow}
        label="Data rows"
        onEdit={editCell}
        onPaste={pasteBlock}
        onAddRow={() => addRow(rows.length - 1)}
        onRemoveRow={removeRow}
        rowIssues={rowIssues}
        empty={<div className="px-pad py-4 text-ui text-fg-muted">No rows. Paste from a spreadsheet (⌘V) or add one.</div>}
      />
      </div>
    </Panel>
  )
}

/* ---------------- dialogs ---------------- */

export function PasteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => (text.trim() ? rowsFromMatrix(parseDelimited(text)) : []), [text])
  const first = text.trim() ? parseDelimited(text)[0] : []
  const header = first.some((c) => /^(product|name|headline|subhead|button|cta|price|colou?r|badge)$/i.test(c.trim()))
  const done = (mode: 'replace' | 'append') => { importText(text, mode); setText(''); onOpenChange(false) }
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Paste data" width={560}
      description={<>Paste rows from Sheets, Excel or Numbers (tab- or comma-separated). With a header row, columns are matched by name — {COLUMNS.map((c) => c.label).join(', ')}. Without one, they are read in that order.</>}
      onSubmit={() => parsed.length && done('replace')}
      footer={
        <>
          <span className="mr-auto text-ui text-fg-muted tabular">{parsed.length ? `${parsed.length} row${parsed.length === 1 ? '' : 's'}${header ? ' · header detected' : ''}` : 'Waiting for data'}</span>
          <Button size="md" variant="default" disabled={!parsed.length} onClick={() => done('append')}>Append</Button>
          <Button size="md" variant="primary" disabled={!parsed.length} onClick={() => done('replace')}>Replace rows</Button>
        </>
      }>
      <TextInput multiline mono rows={10} value={text} onChange={setText} label="CSV"
        placeholder={'Product,Headline,Subhead,Button,Price,Colour,Badge\nYuzu & ginger,"Bright, sharp, a little bit wild.",Zero sugar.,Shop now,£2.20,#F2B705,New'} />
    </Dialog>
  )
}

export function CustomSizeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('Custom')
  const [dim, setDim] = useState({ w: 1200, h: 1200 })
  const add = () => { addSize({ name: name.trim() || 'Custom', platform: 'custom', w: dim.w, h: dim.h, safe: { t: 0, r: 0, b: 0, l: 0 }, zones: [] }); onOpenChange(false) }
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add custom size" width={380} onSubmit={add}
      description="Any width and height. The layout rule is picked from its aspect ratio; override it per size afterwards."
      footer={<><Button size="md" onClick={() => onOpenChange(false)}>Cancel</Button><Button size="md" variant="primary" onClick={add}>Add size</Button></>}>
      <div className="-mx-3 flex flex-col">
        <Row label="Name"><TextInput value={name} onChange={setName} label="Name" /></Row>
        <Row label="Size"><SizeFields value={dim} min={16} max={8000} onChange={(s) => setDim({ w: Math.round(s.w), h: Math.round(s.h) })} /></Row>
        <Row label="Aspect"><span className="tabular text-ui text-fg-muted">{(dim.w / dim.h).toFixed(2)} · {dim.w / dim.h < 0.82 ? 'stack' : dim.w / dim.h > 1.3 ? 'split' : 'hero'} layout</span></Row>
      </div>
    </Dialog>
  )
}

