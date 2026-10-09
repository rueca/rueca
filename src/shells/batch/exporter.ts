/* Batch export — renders every row × size to PNG/JPEG through the same drawPost the stage uses. */
import { createStore } from 'zustand/vanilla'
import { download, toast } from '@kit'
import { drawPost, ensureFonts, loadImage } from './artifact'
import { doc, params, ui, effective, type DataRow, type SizeSpec } from './model'
import { canvasBlob, createZip, fmtBytes } from './local/zip'
import type { Job } from './local/JobQueue'

export interface ExportSettings {
  rows: 'all' | 'current'
  /** null = every visible size */
  sizeIds: string[] | null
  scale: '0.5' | '1' | '2'
  format: 'png' | 'jpeg'
  pack: 'zip' | 'files'
  naming: string
}

interface ExportState {
  status: 'idle' | 'running' | 'done' | 'cancelled'
  jobs: Job[]
  done: number
  bytes: number
  zip: Blob | null
  settings: ExportSettings
  startedAt: number
  elapsed: number
}

const DEFAULTS: ExportSettings = { rows: 'all', sizeIds: null, scale: '1', format: 'png', pack: 'zip', naming: '{product}/{brand}-{product}-{size}' }

export const exporter = createStore<ExportState>(() => ({
  status: 'idle', jobs: [], done: 0, bytes: 0, zip: null, settings: DEFAULTS, startedAt: 0, elapsed: 0,
}))

const blobs = new Map<string, { blob: Blob; name: string }>()
let cancelled = false

export const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'

export function fileName(pattern: string, ctx: { brand: string; row: DataRow; index: number; size: SizeSpec }, ext: string) {
  const name = pattern
    .replace(/\{brand\}/g, slug(ctx.brand))
    .replace(/\{product\}/g, slug(ctx.row.name))
    .replace(/\{size\}/g, slug(ctx.size.name))
    .replace(/\{w\}/g, String(ctx.size.w))
    .replace(/\{h\}/g, String(ctx.size.h))
    .replace(/\{n\}/g, String(ctx.index + 1).padStart(2, '0'))
  return `${name.replace(/^\/+|\/+$/g, '') || 'asset'}.${ext}`
}

/** What a run would produce with the current settings. */
export function plannedJobs(settings = exporter.getState().settings) {
  const d = doc.get()
  const cur = Math.min(ui.getState().row, d.rows.length - 1)
  const rows = settings.rows === 'all' ? d.rows.map((r, i) => ({ r, i })) : d.rows[cur] ? [{ r: d.rows[cur], i: cur }] : []
  const sizes = d.sizes.filter((s) => (settings.sizeIds ? settings.sizeIds.includes(s.id) : s.visible !== false))
  return rows.flatMap(({ r, i }) => sizes.map((size) => ({ row: r, index: i, size })))
}

export function setExportSettings(patch: Partial<ExportSettings>) {
  exporter.setState((s) => ({ settings: { ...s.settings, ...patch } }))
}

export function clearExport() {
  for (const j of exporter.getState().jobs) if (j.thumb) URL.revokeObjectURL(j.thumb)
  blobs.clear()
  exporter.setState({ status: 'idle', jobs: [], done: 0, bytes: 0, zip: null, elapsed: 0 })
}

export function cancelExport() { cancelled = true }

export function downloadJob(id: string) {
  const b = blobs.get(id)
  if (b) download(b.blob, b.name.replace(/\//g, '-'))
}

export function downloadZip() {
  const { zip } = exporter.getState()
  if (zip) download(zip, `${slug(params.values().brandName)}-assets.zip`)
}

const tick = () => new Promise((r) => setTimeout(r, 0))

export async function runExport(overrides: Partial<ExportSettings> = {}) {
  if (exporter.getState().status === 'running') return
  clearExport()
  const settings = { ...exporter.getState().settings, ...overrides }
  const planned = plannedJobs(settings)
  if (!planned.length) { toast('Nothing to export', { type: 'error', description: 'Choose at least one row and one size.' }); return }

  const v = params.values()
  const d = doc.get()
  const ext = settings.format === 'png' ? 'png' : 'jpg'
  const mime = settings.format === 'png' ? 'image/png' : 'image/jpeg'
  const scale = Number(settings.scale)
  const jobs: Job[] = planned.map((p, k) => ({
    id: `${k}`,
    label: `${p.row.name} — ${p.size.name}`,
    detail: `${Math.round(p.size.w * scale)} × ${Math.round(p.size.h * scale)} · ${fileName(settings.naming, { brand: v.brandName, row: p.row, index: p.index, size: p.size }, ext)}`,
    status: 'queued',
    aspect: p.size.w / p.size.h,
  }))
  cancelled = false
  const startedAt = performance.now()
  exporter.setState({ status: 'running', jobs, done: 0, bytes: 0, zip: null, settings, startedAt, elapsed: 0 })

  await ensureFonts()
  const logo = v.logo ? await loadImage(v.logo).catch(() => null) : null
  const zip = settings.pack === 'zip' ? createZip() : null
  const setJob = (k: number, patch: Partial<Job>) =>
    exporter.setState((s) => ({ jobs: s.jobs.map((j, i) => (i === k ? { ...j, ...patch } : j)) }))

  let bytes = 0
  for (let k = 0; k < planned.length; k++) {
    if (cancelled) {
      exporter.setState((s) => ({ jobs: s.jobs.map((j) => (j.status === 'queued' ? { ...j, status: 'cancelled' } : j)) }))
      break
    }
    const { row, index, size } = planned[k]
    setJob(k, { status: 'running' })
    await tick()
    try {
      const c = document.createElement('canvas')
      c.width = Math.round(size.w * scale)
      c.height = Math.round(size.h * scale)
      const ctx = c.getContext('2d')!
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawPost(ctx, size.w, size.h, row, effective(v, d.overrides[size.id]), size, logo)
      const blob = await canvasBlob(c, mime, 0.92)
      const name = fileName(settings.naming, { brand: v.brandName, row, index, size }, ext)
      blobs.set(`${k}`, { blob, name })
      if (zip) await zip.addBlob(name, blob)
      else { download(blob, name.replace(/\//g, '-')); await new Promise((r) => setTimeout(r, 220)) }
      bytes += blob.size
      setJob(k, { status: 'done', thumb: URL.createObjectURL(blob), meta: fmtBytes(blob.size) })
      exporter.setState({ done: k + 1, bytes, elapsed: performance.now() - startedAt })
    } catch {
      setJob(k, { status: 'error' })
    }
  }

  const done = exporter.getState().done
  if (zip && done) {
    zip.add('manifest.json', JSON.stringify({
      generator: 'Batch — Prototype Studio', created: new Date().toISOString(),
      template: params.toJSON(), rows: d.rows, sizes: d.sizes.map(({ id, name, w, h }) => ({ id, name, w, h, overrides: d.overrides[id] ?? {} })),
      files: [...blobs.values()].map((b) => b.name),
    }, null, 2))
    const blob = zip.toBlob()
    exporter.setState({ zip: blob })
    download(blob, `${slug(v.brandName)}-assets.zip`)
  }
  exporter.setState({ status: cancelled ? 'cancelled' : 'done', elapsed: performance.now() - startedAt })
  if (cancelled) toast(`Cancelled after ${done} of ${planned.length}`, { description: done && zip ? 'The finished images were zipped.' : undefined })
  else toast(`Exported ${done} images`, { type: 'success', description: zip ? `${fmtBytes(exporter.getState().zip?.size ?? bytes)} zip` : 'Downloaded one by one' })
}
