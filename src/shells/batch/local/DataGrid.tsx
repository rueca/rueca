/* ---------------------------------------------------------------------------
   DataGrid — a small spreadsheet for driving templates with rows of data
   (products, campaigns, locales, names on badges).

     <DataGrid columns={cols} rows={rows} activeRow={i} onActiveRow={setI}
       onEdit={(r, key, value, final) => …} onPaste={(r, c, matrix) => …}
       onAddRow={…} onRemoveRow={…} />

   Spreadsheet behaviour, because that is the muscle memory:
     click a cell → select (and make its row the previewed row)
     type         → replace the cell          Enter / F2 / double-click → edit
     Enter        → commit, move down         Tab / ⇧Tab → commit, move right/left
     Esc          → cancel edit               ⌫ / Delete → clear cell
     arrows       → move                       ⌘C → copy cell, ⌘V → paste a block
   Pasting TSV/CSV (from Sheets, Excel, Numbers) fills from the selected cell
   down and right; the owner decides whether extra rows are appended.
   Every value is a string; the owner parses.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { cn, ColorPanel, Swatch, Tip, copyText } from '@kit'

export interface GridColumn {
  key: string
  label: string
  width: number
  kind?: 'text' | 'color'
  mono?: boolean
  placeholder?: string
  align?: 'left' | 'right'
  hint?: string
}

type Row = Record<string, string>

export function DataGrid({
  columns, rows, activeRow, onActiveRow, onEdit, onPaste, onAddRow, onRemoveRow, rowIssues, rowLabel, empty, className,
}: {
  columns: GridColumn[]
  rows: Row[]
  activeRow: number
  onActiveRow: (i: number) => void
  onEdit: (row: number, key: string, value: string, final: boolean) => void
  onPaste: (row: number, col: number, matrix: string[][]) => void
  onAddRow: () => void
  onRemoveRow: (i: number) => void
  rowIssues?: (i: number) => string[] | undefined
  rowLabel?: (i: number) => ReactNode
  empty?: ReactNode
  className?: string
}) {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const template = `36px ${columns.map((c) => `minmax(${c.width}px, ${c.width}fr)`).join(' ')} 32px`

  // Keep the selection valid when rows are removed.
  useEffect(() => { if (sel && sel.r >= rows.length) setSel(rows.length ? { r: rows.length - 1, c: sel.c } : null) }, [rows.length, sel])

  const select = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(rows.length - 1, r)), cc = Math.max(0, Math.min(columns.length - 1, c))
    setSel({ r: rr, c: cc })
    if (rr !== activeRow) onActiveRow(rr)
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-cell="${rr}:${cc}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
  }
  const startEdit = (initial?: string) => {
    if (!sel) return
    setDraft(initial ?? rows[sel.r]?.[columns[sel.c].key] ?? '')
    setEditing(true)
  }
  const committing = useRef(false)
  const commit = (move?: 'down' | 'right' | 'left') => {
    if (committing.current) return
    committing.current = true
    requestAnimationFrame(() => { committing.current = false })
    if (sel && editing) {
      const key = columns[sel.c].key
      if (draft !== rows[sel.r]?.[key]) onEdit(sel.r, key, draft, true)
    }
    setEditing(false)
    if (sel && move === 'down') select(sel.r + 1, sel.c)
    if (sel && move === 'right') select(sel.r, sel.c + 1)
    if (sel && move === 'left') select(sel.r, sel.c - 1)
    root.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || !sel) return
    const k = e.key
    const nav: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (nav[k]) { e.preventDefault(); select(sel.r + nav[k][0], sel.c + nav[k][1]); return }
    if (k === 'Tab') { e.preventDefault(); select(sel.r, sel.c + (e.shiftKey ? -1 : 1)); return }
    if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(); return }
    if (k === 'Escape') { e.preventDefault(); setSel(null); return }
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); onEdit(sel.r, columns[sel.c].key, '', true); return }
    if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'c') { e.preventDefault(); void copyText(rows[sel.r]?.[columns[sel.c].key] ?? ''); return }
    if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); startEdit(k) }
  }

  const onPasteEvent = (e: React.ClipboardEvent) => {
    if (editing) return
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    e.preventDefault()
    const matrix = parseDelimited(text)
    const at = sel ?? { r: 0, c: 0 }
    if (matrix.length === 1 && matrix[0].length === 1) onEdit(at.r, columns[at.c].key, matrix[0][0], true)
    else onPaste(at.r, at.c, matrix)
  }

  return (
    <div
      ref={root}
      tabIndex={0}
      role="grid"
      aria-label="Data"
      aria-rowcount={rows.length}
      onKeyDown={onKeyDown}
      onPaste={onPasteEvent}
      className={cn('relative min-h-0 overflow-auto outline-none', className)}
    >
      <div className="min-w-max">
        {/* header */}
        <div role="row" className="sticky top-0 z-10 grid h-7 items-center border-b border-line bg-panel text-[11px] text-fg-faint" style={{ gridTemplateColumns: template }}>
          <div className="pl-3 tabular">#</div>
          {columns.map((c) => (
            <Tip key={c.key} label={c.hint}>
              <div role="columnheader" className={cn('truncate px-2', c.align === 'right' && 'text-right')}>{c.label}</div>
            </Tip>
          ))}
          <div />
        </div>

        {rows.map((row, r) => {
          const issues = rowIssues?.(r)
          const isActive = r === activeRow
          return (
            <div key={r} role="row" aria-selected={isActive}
              className={cn('group/row relative grid h-7 items-center border-b border-line text-[12px]', isActive ? 'bg-signal-soft' : 'hover:bg-hover')}
              style={{ gridTemplateColumns: template }}>
              {isActive && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
              <button type="button" tabIndex={-1} onClick={() => { onActiveRow(r); setSel({ r, c: sel?.c ?? 0 }); root.current?.focus() }}
                className={cn('flex h-full items-center gap-1 pl-3 text-left tabular text-[11px]', isActive ? 'text-signal' : 'text-fg-faint hover:text-fg')}>
                {rowLabel ? rowLabel(r) : r + 1}
                {issues?.length ? (
                  <Tip label={issues.join(' · ')}><span className="text-key"><AlertTriangle size={11} strokeWidth={1.75} /></span></Tip>
                ) : null}
              </button>
              {columns.map((col, c) => {
                const selected = sel?.r === r && sel?.c === c
                const value = row[col.key] ?? ''
                return (
                  <div
                    key={col.key}
                    role="gridcell"
                    data-cell={`${r}:${c}`}
                    aria-selected={selected}
                    onPointerDown={(e) => { if (selected && editing) return; e.preventDefault(); if (editing) commit(); select(r, c); root.current?.focus() }}
                    onDoubleClick={() => { select(r, c); setDraft(value); setEditing(true) }}
                    className={cn('relative flex h-full min-w-0 items-center gap-1.5 px-2', selected && 'z-[1] rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--signal)]')}
                  >
                    {col.kind === 'color' && <ColorCell value={value} onChange={(v, f) => onEdit(r, col.key, v, f)} />}
                    {selected && editing ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commit()}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') { e.preventDefault(); commit('down') }
                          if (e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? 'left' : 'right') }
                          if (e.key === 'Escape') { e.preventDefault(); setEditing(false); root.current?.focus() }
                        }}
                        className={cn('h-6 w-full min-w-0 rounded-[4px] bg-control px-1 text-[12px] text-fg outline-none', col.mono && 'font-mono text-[11.5px]', col.align === 'right' && 'text-right')}
                      />
                    ) : (
                      <span className={cn('min-w-0 flex-1 truncate', !value && 'text-fg-faint', col.mono && 'font-mono text-[11.5px] uppercase', col.align === 'right' && 'text-right tabular')}>
                        {value || col.placeholder || ''}
                      </span>
                    )}
                  </div>
                )
              })}
              <Tip label="Delete row">
                <button type="button" aria-label={`Delete row ${r + 1}`} onClick={() => onRemoveRow(r)}
                  className="flex size-6 items-center justify-center rounded-[5px] text-fg-faint opacity-0 outline-none hover:bg-hover hover:text-rec group-hover/row:opacity-100 focus-visible:opacity-100">
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </Tip>
            </div>
          )
        })}

        {!rows.length && empty}

        <button type="button" onClick={onAddRow}
          className="flex h-7 w-full items-center gap-1.5 pl-3 text-left text-[11.5px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
          <Plus size={12} strokeWidth={1.75} /> Add row
        </button>
      </div>
    </div>
  )
}

function ColorCell({ value, onChange }: { value: string; onChange: (v: string, final: boolean) => void }) {
  const valid = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)
  return (
    <Popover.Root>
      <Popover.Trigger aria-label="Pick colour" onPointerDown={(e) => e.stopPropagation()}
        className="flex shrink-0 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-signal">
        <Swatch color={valid ? value : '#00000000'} size={14} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={8} collisionPadding={12} className="z-[100]">
          <Popover.Popup className="pop outline-none"><ColorPanel value={valid ? value : '#888888'} alpha={false} onChange={onChange} /></Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* --- CSV / TSV --- */

/** Parse CSV or TSV (auto-detected) with quoted fields and escaped quotes. */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  const firstLine = src.split('\n')[0] ?? ''
  const delim = firstLine.includes('\t') ? '\t' : firstLine.split(';').length > firstLine.split(',').length ? ';' : ','
  const out: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"' && cell === '') q = true
    else if (ch === delim) { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); out.push(row); row = []; cell = '' }
    else cell += ch
  }
  row.push(cell)
  out.push(row)
  return out.map((r) => r.map((c) => c.trim()))
}

export function toCSV(rows: Row[], keys: string[], header: string[] = keys) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  return [header.map(esc).join(','), ...rows.map((r) => keys.map((k) => esc(r[k] ?? '')).join(','))].join('\n')
}
