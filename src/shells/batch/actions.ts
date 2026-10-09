/* Document mutations, shared by panels, the stage and the command palette. Each is one undo step. */
import { toast, readFileAsDataURL } from '@kit'
import { doc, ui, params, history, blankRow, uid, COLUMNS, DEMO_DOC, SIZE_PRESETS, type DataRow, type Doc, type OverrideKey, type SizeSpec } from './model'
import { parseDelimited, toCSV } from '@kit/ui/data-grid'
import { download } from '@kit'
import { slug } from './exporter'

const KEYS = COLUMNS.map((c) => c.key)
const ALIASES: Record<string, keyof DataRow> = {
  product: 'name', name: 'name', flavour: 'name', flavor: 'name', title: 'name',
  headline: 'headline', heading: 'headline',
  subhead: 'subhead', subheading: 'subhead', body: 'subhead', description: 'subhead',
  button: 'cta', cta: 'cta', 'call to action': 'cta',
  price: 'price',
  colour: 'color', color: 'color', hex: 'color',
  badge: 'badge', tag: 'badge', sticker: 'badge',
}

export const setRow = (i: number) => {
  const n = doc.get().rows.length
  if (!n) return
  ui.setState({ row: ((i % n) + n) % n })
}
export const nextRow = () => setRow(ui.getState().row + 1)
export const prevRow = () => setRow(ui.getState().row - 1)

export function editCell(r: number, key: string, value: string, final = true) {
  doc.set((d) => ({ ...d, rows: d.rows.map((row, i) => (i === r ? { ...row, [key]: value } : row)) }), { commit: final, label: 'Edit cell' })
}

export function addRow(after = ui.getState().row) {
  doc.set((d) => {
    const rows = [...d.rows]
    rows.splice(after + 1, 0, blankRow())
    return { ...d, rows }
  }, { label: 'Add row' })
  setRow(after + 1)
}

export function duplicateRow(i = ui.getState().row) {
  const src = doc.get().rows[i]
  if (!src) return
  doc.set((d) => { const rows = [...d.rows]; rows.splice(i + 1, 0, { ...src, name: `${src.name} copy` }); return { ...d, rows } }, { label: 'Duplicate row' })
  setRow(i + 1)
}

export function removeRow(i = ui.getState().row) {
  const d = doc.get()
  if (!d.rows[i]) return
  const name = d.rows[i].name
  doc.set({ ...d, rows: d.rows.filter((_, k) => k !== i) }, { label: 'Delete row' })
  if (ui.getState().row >= d.rows.length - 1) setRow(Math.max(0, d.rows.length - 2))
  toast(`Deleted “${name}”`, { action: { label: 'Undo', onClick: () => history.undo() } })
}

/** Is this matrix row a header (names our columns)? */
const headerMap = (cells: string[]) => {
  const map = cells.map((c) => ALIASES[c.trim().toLowerCase()] ?? null)
  return map.filter(Boolean).length >= 2 ? map : null
}

export function rowsFromMatrix(matrix: string[][]): DataRow[] {
  const hdr = headerMap(matrix[0] ?? [])
  const body = hdr ? matrix.slice(1) : matrix
  return body.filter((r) => r.some((c) => c.trim())).map((cells) => {
    const row = blankRow()
    const out: Record<string, string> = { ...row, badge: '' }
    cells.forEach((c, i) => {
      const key = hdr ? hdr[i] : KEYS[i]
      if (key) out[key] = key === 'color' && c && !c.startsWith('#') ? `#${c}` : c
    })
    return out as unknown as DataRow
  })
}

/** Paste a block into the grid at (r, c). A block with a header row replaces the data. */
export function pasteBlock(r: number, c: number, matrix: string[][]) {
  if (headerMap(matrix[0] ?? [])) return importRows(rowsFromMatrix(matrix), 'replace')
  doc.set((d) => {
    const rows = d.rows.map((x) => ({ ...x }))
    matrix.forEach((cells, dr) => {
      const ri = r + dr
      if (!rows[ri]) rows[ri] = { ...blankRow(), badge: '' }
      cells.forEach((val, dc) => {
        const key = KEYS[c + dc]
        if (key) (rows[ri] as unknown as Record<string, string>)[key] = val
      })
    })
    return { ...d, rows }
  }, { label: 'Paste cells' })
  toast(`Pasted ${matrix.length} × ${Math.max(...matrix.map((m) => m.length))} cells`, { action: { label: 'Undo', onClick: () => history.undo() } })
}

export function importRows(rows: DataRow[], mode: 'replace' | 'append') {
  if (!rows.length) { toast('No rows found', { type: 'error' }); return }
  doc.set((d) => ({ ...d, rows: mode === 'replace' ? rows : [...d.rows, ...rows] }), { label: mode === 'replace' ? 'Replace rows' : 'Append rows' })
  if (mode === 'replace') setRow(0)
  toast(`${mode === 'replace' ? 'Replaced with' : 'Added'} ${rows.length} rows`, { type: 'success', action: { label: 'Undo', onClick: () => history.undo() } })
}

export const importText = (text: string, mode: 'replace' | 'append') => importRows(rowsFromMatrix(parseDelimited(text)), mode)

export function pickCSV() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.tsv,text/csv,text/tab-separated-values,text/plain'
  input.onchange = async () => {
    const f = input.files?.[0]
    if (f) importText(await f.text(), 'replace')
  }
  input.click()
}

export function exportCSV() {
  const d = doc.get()
  download(new Blob([toCSV(d.rows as unknown as Record<string, string>[], KEYS, COLUMNS.map((c) => c.label))], { type: 'text/csv' }), `${slug(params.values().brandName)}-data.csv`)
}

/* --- sizes --- */
export const selectSize = (id: string | null) => ui.setState({ selected: id })

export function addSize(spec: Omit<SizeSpec, 'id'>) {
  const id = `${slug(spec.name)}-${uid()}`
  doc.set((d) => ({ ...d, sizes: [...d.sizes, { ...spec, id, visible: true }] }), { label: `Add ${spec.name}` })
  selectSize(id)
  toast(`Added ${spec.name}`, { description: `${spec.w} × ${spec.h}` })
}
export const addPreset = (name: string) => { const p = SIZE_PRESETS.find((s) => s.name === name); if (p) addSize(p) }

export function removeSize(id: string) {
  const s = doc.get().sizes.find((x) => x.id === id)
  if (!s) return
  doc.set((d) => { const { [id]: _drop, ...overrides } = d.overrides; void _drop; return { ...d, sizes: d.sizes.filter((x) => x.id !== id), overrides } }, { label: `Remove ${s.name}` })
  if (ui.getState().selected === id) selectSize(null)
  toast(`Removed ${s.name}`, { action: { label: 'Undo', onClick: () => history.undo() } })
}

export function patchSize(id: string, patch: Partial<SizeSpec>, final = true) {
  doc.set((d) => ({ ...d, sizes: d.sizes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }), { commit: final, label: 'Edit size' })
}

export function moveSize(id: string, target: string, where: 'before' | 'after' | 'inside') {
  doc.set((d) => {
    const moving = d.sizes.find((s) => s.id === id)
    if (!moving || id === target) return d
    const rest = d.sizes.filter((s) => s.id !== id)
    const at = rest.findIndex((s) => s.id === target)
    rest.splice(where === 'before' ? at : at + 1, 0, moving)
    return { ...d, sizes: rest }
  }, { label: 'Reorder sizes' })
}

/* --- overrides --- */
export function setOverride(sizeId: string, key: string, value: unknown, final = true) {
  doc.set((d) => ({ ...d, overrides: { ...d.overrides, [sizeId]: { ...d.overrides[sizeId], [key]: value } } }), { commit: final, label: 'Override' })
}
export function clearOverride(sizeId: string, key?: string) {
  doc.set((d) => {
    const cur = { ...(d.overrides[sizeId] ?? {}) } as Record<string, unknown>
    if (key) delete cur[key]
    const overrides = { ...d.overrides }
    if (!key || !Object.keys(cur).length) delete overrides[sizeId]
    else overrides[sizeId] = cur as Doc['overrides'][string]
    return { ...d, overrides }
  }, { label: key ? 'Revert override' : 'Clear overrides' })
}
export function clearAllOverrides() {
  if (!Object.keys(doc.get().overrides).length) return
  doc.set((d) => ({ ...d, overrides: {} }), { label: 'Clear all overrides' })
  toast('Cleared all overrides', { action: { label: 'Undo', onClick: () => history.undo() } })
}
/** Push a size's overrides up into the template, then clear them everywhere they now match. */
export function promoteOverrides(sizeId: string) {
  const o = doc.get().overrides[sizeId]
  if (!o) return
  params.patch(o as never)
  clearOverride(sizeId)
  toast('Overrides applied to the template', { description: 'Other sizes now inherit them too.' })
}
export const overrideCount = (d: Doc, id: string) => Object.keys(d.overrides[id] ?? {}).length
export type { OverrideKey }

export function resetDemo() {
  doc.set(DEMO_DOC, { label: 'Restore demo' })
  setRow(0)
  selectSize(null)
  toast('Demo data restored', { action: { label: 'Undo', onClick: () => history.undo() } })
}

export async function setLogoFromFile(file: File) {
  params.setValue('logo', await readFileAsDataURL(file))
}
