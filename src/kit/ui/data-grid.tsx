/* ---------------------------------------------------------------------------
   DataGrid — a small spreadsheet for driving templates with rows of data
   (products, campaigns, locales, names on badges, test fixtures).

     <DataGrid columns={cols} rows={rows} activeRow={i} onActiveRow={setI}
       onEdit={(r, key, value, final) => …} onPaste={(r, c, matrix) => …}
       onAddRow={…} onRemoveRow={…} rowIssues={(r) => warnings[r]} />

     parseDelimited(text)            // CSV or TSV (auto-detected) → string[][]
     toCSV(rows, keys, header?)      // and toTSV(...) for the clipboard

   Spreadsheet muscle memory:
     click a cell → select it (and make its row the active / previewed row)
     type         → replace the cell         Enter / F2 / double-click → edit
     Enter        → commit, move down        Tab / ⇧Tab → commit, move right / left
     Esc          → cancel edit (or clear the selection)
     ⌫ / Delete   → clear the cell           arrows → move
     ⌘C           → copy the cell            ⌘V → paste a block (TSV/CSV from
                                              Sheets, Excel, Numbers) from the cell
   A single pasted value edits the cell; a block calls `onPaste` and the
   owner decides whether extra rows are appended. Every value is a string;
   the owner parses. `kind: 'color'` columns get a swatch with a colour
   popover; `readOnly` columns select but never edit.

   Accessibility: role="grid" with aria-rowcount / aria-colcount; the grid
   is ONE tab stop and the selected cell is exposed via aria-activedescendant
   (cells carry aria-rowindex / aria-colindex and aria-selected). Row delete
   buttons are labelled and appear on hover and keyboard focus. Handled keys
   call preventDefault, so the tool's global shortcuts never fire mid-edit.
   (Promoted from shells/batch/local/DataGrid.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { cn } from '../core/cn'
import { copyText } from '../core/io'
import { ColorPanel, Swatch } from './color'
import { Tip } from './tooltip'
import { revealInScroller } from '../core/scroll'

export interface GridColumn {
  key: string
  label: string
  /** minimum width in px; columns grow proportionally */
  width: number
  kind?: 'text' | 'color'
  mono?: boolean
  placeholder?: string
  align?: 'left' | 'right'
  hint?: string
  readOnly?: boolean
}

export interface DataGridProps<R extends object> {
  columns: GridColumn[]
  rows: R[]
  activeRow?: number
  onActiveRow?: (i: number) => void
  onEdit: (row: number, key: string, value: string, final: boolean) => void
  onPaste?: (row: number, col: number, matrix: string[][]) => void
  onAddRow?: () => void
  onRemoveRow?: (i: number) => void
  /** warnings per row, shown as a triangle with a tooltip */
  rowIssues?: (i: number) => string[] | undefined
  rowLabel?: (i: number) => ReactNode
  empty?: ReactNode
  /** accessible name */
  label?: string
  className?: string
}

const cellOf = (row: object | undefined, key: string) => {
  const v = (row as Record<string, unknown> | undefined)?.[key]
  return v == null ? '' : String(v)
}

export function DataGrid<R extends object>({
  columns, rows, activeRow = -1, onActiveRow, onEdit, onPaste, onAddRow, onRemoveRow, rowIssues, rowLabel, empty, label = 'Data', className,
}: DataGridProps<R>) {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const uid = useId()
  const cellId = (r: number, c: number) => `${uid}-${r}-${c}`
  const template = `36px ${columns.map((c) => `minmax(${c.width}px, ${c.width}fr)`).join(' ')}${onRemoveRow ? ' 32px' : ''}`

  // Keep the selection valid when rows are removed.
  useEffect(() => { if (sel && sel.r >= rows.length) setSel(rows.length ? { r: rows.length - 1, c: sel.c } : null) }, [rows.length, sel])

  const select = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(rows.length - 1, r)), cc = Math.max(0, Math.min(columns.length - 1, c))
    setSel({ r: rr, c: cc })
    if (rr !== activeRow) onActiveRow?.(rr)
    requestAnimationFrame(() => revealInScroller(document.getElementById(cellId(rr, cc))))
  }
  const startEdit = (initial?: string) => {
    if (!sel || columns[sel.c]?.readOnly) return
    setDraft(initial ?? cellOf(rows[sel.r], columns[sel.c].key))
    setEditing(true)
  }
  const committing = useRef(false)
  const commit = (move?: 'down' | 'right' | 'left') => {
    if (committing.current) return
    committing.current = true
    requestAnimationFrame(() => { committing.current = false })
    if (sel && editing) {
      const key = columns[sel.c].key
      if (draft !== cellOf(rows[sel.r], key)) onEdit(sel.r, key, draft, true)
    }
    setEditing(false)
    if (sel && move === 'down') select(sel.r + 1, sel.c)
    if (sel && move === 'right') select(sel.r, sel.c + 1)
    if (sel && move === 'left') select(sel.r, sel.c - 1)
    root.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // keys inside a cell's own control (colour picker, editor) belong to that control
    if (e.target !== e.currentTarget) return
    if (editing) return
    if (!sel) {
      // first arrow / Enter into an unselected grid picks the active row's first cell
      if (rows.length && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) { e.preventDefault(); select(Math.max(0, activeRow), 0) }
      return
    }
    const k = e.key
    const col = columns[sel.c]
    const nav: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (nav[k]) { e.preventDefault(); select(sel.r + nav[k][0], sel.c + nav[k][1]); return }
    if (k === 'Tab') {
      // Tab moves between cells; leave the grid from the last / first cell
      const atEdge = e.shiftKey ? sel.c === 0 : sel.c === columns.length - 1
      if (atEdge) return
      e.preventDefault(); select(sel.r, sel.c + (e.shiftKey ? -1 : 1)); return
    }
    if (k === 'Enter' || k === 'F2') { e.preventDefault(); startEdit(); return }
    if (k === 'Escape') { e.preventDefault(); setSel(null); return }
    if ((k === 'Backspace' || k === 'Delete') && !col.readOnly) { e.preventDefault(); onEdit(sel.r, col.key, '', true); return }
    if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'c') { e.preventDefault(); void copyText(cellOf(rows[sel.r], col.key)); return }
    if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && !col.readOnly) { e.preventDefault(); startEdit(k) }
  }

  const onPasteEvent = (e: React.ClipboardEvent) => {
    if (editing) return
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    e.preventDefault()
    const matrix = parseDelimited(text)
    const at = sel ?? { r: Math.max(0, activeRow), c: 0 }
    if (matrix.length === 1 && matrix[0].length === 1) { if (!columns[at.c]?.readOnly && rows[at.r]) onEdit(at.r, columns[at.c].key, matrix[0][0], true) }
    else onPaste?.(at.r, at.c, matrix)
  }

  return (
    <div
      ref={root}
      tabIndex={0}
      role="grid"
      aria-label={label}
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      aria-activedescendant={sel ? cellId(sel.r, sel.c) : undefined}
      onKeyDown={onKeyDown}
      onPaste={onPasteEvent}
      className={cn('relative min-h-0 overflow-auto outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]', className)}
    >
      <div className="min-w-max" role="rowgroup">
        <div role="row" aria-rowindex={1} className="sticky top-0 z-10 grid h-row items-center border-b border-line bg-panel text-ui text-fg-muted" style={{ gridTemplateColumns: template }}>
          <div role="columnheader" className="pl-pad tabular"><span aria-hidden>#</span><span className="sr-only">Row</span></div>
          {columns.map((c, ci) => (
            <Tip key={c.key} label={c.hint}>
              <div role="columnheader" aria-colindex={ci + 1} className={cn('truncate px-2', c.align === 'right' && 'text-right')}>{c.label}</div>
            </Tip>
          ))}
          {onRemoveRow && <div role="columnheader"><span className="sr-only">Actions</span></div>}
        </div>

        {rows.map((row, r) => {
          const issues = rowIssues?.(r)
          const isActive = r === activeRow
          return (
            <div key={r} role="row" aria-rowindex={r + 2} aria-selected={isActive}
              className={cn('group/row relative grid h-row items-center border-b border-line text-ui', isActive ? 'bg-signal-soft' : 'hover:bg-hover')}
              style={{ gridTemplateColumns: template }}>
              {isActive && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" aria-hidden />}
              {/* controls live inside cells — a row can only own cells (axe aria-required-children / nested-interactive) */}
              <div role="rowheader" className="flex h-full min-w-0">
              <button type="button" tabIndex={-1} aria-label={`Row ${r + 1}`} onClick={() => { onActiveRow?.(r); setSel({ r, c: sel?.c ?? 0 }); root.current?.focus() }}
                className={cn('flex h-full flex-1 items-center gap-1 pl-pad text-left tabular text-ui', isActive ? 'text-signal-text' : 'text-fg-muted hover:text-fg')}>
                {rowLabel ? rowLabel(r) : r + 1}
                {issues?.length ? (
                  <Tip label={issues.join(' · ')}><span className="text-key" aria-label={`${issues.length} issues`}><AlertTriangle size={11} strokeWidth={1.75} /></span></Tip>
                ) : null}
              </button>
              </div>
              {columns.map((col, c) => {
                const selected = sel?.r === r && sel?.c === c
                const value = cellOf(row, col.key)
                return (
                  <div
                    key={col.key}
                    id={cellId(r, c)}
                    role="gridcell"
                    aria-colindex={c + 1}
                    aria-selected={selected}
                    aria-readonly={col.readOnly || undefined}
                    onPointerDown={(e) => { if (selected && editing) return; e.preventDefault(); if (editing) commit(); select(r, c); root.current?.focus() }}
                    onDoubleClick={() => { if (col.readOnly) return; select(r, c); setDraft(value); setEditing(true) }}
                    className={cn('relative flex h-full min-w-0 items-center gap-1.5 px-2', selected && 'z-[1] rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--signal)]')}
                  >
                    {col.kind === 'color' && <ColorCell value={value} disabled={col.readOnly} onChange={(v, f) => onEdit(r, col.key, v, f)} />}
                    {selected && editing ? (
                      <input
                        autoFocus
                        value={draft}
                        aria-label={`${col.label}, row ${r + 1}`}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commit()}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') { e.preventDefault(); commit('down') }
                          if (e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? 'left' : 'right') }
                          if (e.key === 'Escape') { e.preventDefault(); setEditing(false); root.current?.focus() }
                        }}
                        className={cn('h-control w-full min-w-0 rounded-control bg-control px-1 text-ui text-fg outline-none', col.mono && 'font-mono', col.align === 'right' && 'text-right')}
                      />
                    ) : (
                      <span className={cn('min-w-0 flex-1 truncate', !value && 'text-fg-faint', col.mono && 'font-mono uppercase', col.align === 'right' && 'text-right tabular')}>
                        {value || col.placeholder || ''}
                      </span>
                    )}
                  </div>
                )
              })}
              {onRemoveRow && (
                <div role="gridcell" className="flex items-center">
                <Tip label="Delete row">
                  <button type="button" aria-label={`Delete row ${r + 1}`} onClick={() => onRemoveRow(r)}
                    className="flex size-icon-sm items-center justify-center rounded-control text-fg-muted opacity-0 outline-none hover:bg-hover hover:text-rec group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal">
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </Tip>
                </div>
              )}
            </div>
          )
        })}

        {!rows.length && empty && <div role="row"><div role="gridcell">{empty}</div></div>}

        {onAddRow && (
          <div role="row"><div role="gridcell">
          <button type="button" onClick={onAddRow}
            className="flex h-row w-full items-center gap-1.5 pl-pad text-left text-ui text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
            <Plus size={12} strokeWidth={1.75} /> Add row
          </button>
          </div></div>
        )}
      </div>
    </div>
  )
}

function ColorCell({ value, onChange, disabled }: { value: string; onChange: (v: string, final: boolean) => void; disabled?: boolean }) {
  const valid = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)
  if (disabled) return <Swatch color={valid ? value : 'transparent'} size={14} />
  return (
    <Popover.Root>
      <Popover.Trigger aria-label="Pick colour" onPointerDown={(e) => e.stopPropagation()}
        className="-m-[5px] flex shrink-0 rounded-[4px] p-[5px] outline-none focus-visible:ring-2 focus-visible:ring-signal">
        <Swatch color={valid ? value : 'transparent'} size={14} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={8} collisionPadding={12} className="z-[160]">
          <Popover.Popup aria-label="Colour" className="pop outline-none"><ColorPanel value={valid ? value : '#888888'} alpha={false} onChange={onChange} /></Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* ------------------------------------------------------------------ CSV / TSV */

/** Parse CSV or TSV (auto-detected; `;` too) with quoted fields and escaped quotes. Cells are trimmed. */
export function parseDelimited(text: string, delimiter?: ',' | '\t' | ';'): string[][] {
  const src = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  const firstLine = src.split('\n')[0] ?? ''
  const delim = delimiter ?? (firstLine.includes('\t') ? '\t' : firstLine.split(';').length > firstLine.split(',').length ? ';' : ',')
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

const delimited = (sep: string) => (rows: object[], keys: string[], header: string[] | false = keys) => {
  const esc = (s: string) => (new RegExp(`["\\n${sep === '\t' ? '\\t' : sep}]`).test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const body = rows.map((r) => keys.map((k) => esc(cellOf(r, k))).join(sep))
  return (header ? [header.map(esc).join(sep), ...body] : body).join('\n')
}
/** Rows → CSV text. Pass `header={false}` to omit the header line. */
export const toCSV = delimited(',')
/** Rows → TSV text (what spreadsheets put on the clipboard). */
export const toTSV = delimited('\t')
