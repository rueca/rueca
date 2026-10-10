/* Batch export — renders every row × size to PNG/JPEG through the same drawPost the stage uses. */
import { createStore } from 'zustand/vanilla'
import { download, toast } from '@kit'
import { drawPost, ensureFonts, ensureShots, loadImage } from './artifact'
import { doc, params, ui, effective, type DataRow, type SizeSpec } from './model'
import { canvasBlob, createZip, fmtBytes } from '@kit'
import { createJobRunner, type JobTask } from '@kit/system/jobs'
import { site } from '@/site.config'

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
  bytes: number
  zip: Blob | null
  settings: ExportSettings
}

const DEFAULTS: ExportSettings = { rows: 'all', sizeIds: null, scale: '1', format: 'png', pack: 'zip', naming: '{product}/{brand}-{product}-{size}' }

/** Export settings and the finished zip. The job list itself lives in the kit runner below. */
export const exporter = createStore<ExportState>(() => ({ bytes: 0, zip: null, settings: DEFAULTS }))
/** One job per row × size: status, thumbnail, size — rendered by the kit JobQueue. */
export const jobs = createJobRunner()

const blobs = new Map<string, { blob: Blob; name: string }>()

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
  jobs.clear()
  blobs.clear()
  exporter.setState({ bytes: 0, zip: null })
}

export function cancelExport() { jobs.cancel() }

export function downloadJob(id: string) {
  const b = blobs.get(id)
  if (b) download(b.blob, b.name.replace(/\//g, '-'))
}

export function downloadZip() {
  const { zip } = exporter.getState()
  if (zip) download(zip, `${slug(params.values().brandName)}-assets.zip`)
}

export async function runExport(overrides: Partial<ExportSettings> = {}) {
  if (jobs.getState().status === 'running') return
  clearExport()
  const settings = { ...exporter.getState().settings, ...overrides }
  const planned = plannedJobs(settings)
  if (!planned.length) { toast('Nothing to export', { type: 'error', description: 'Choose at least one row and one size.' }); return }

  const v = params.values()
  const d = doc.get()
  const ext = settings.format === 'png' ? 'png' : 'jpg'
  const mime = settings.format === 'png' ? 'image/png' : 'image/jpeg'
  const scale = Number(settings.scale)
  exporter.setState({ settings })

  await ensureFonts()
  await ensureShots(planned.map((p) => p.row))
  const logo = v.logo ? await loadImage(v.logo).catch(() => null) : null
  const zip = settings.pack === 'zip' ? createZip() : null

  const tasks: JobTask<Blob>[] = planned.map((p, k) => {
    const name = fileName(settings.naming, { brand: v.brandName, row: p.row, index: p.index, size: p.size }, ext)
    return {
      id: `${k}`,
      label: `${p.row.name} — ${p.size.name}`,
      detail: `${Math.round(p.size.w * scale)} × ${Math.round(p.size.h * scale)} · ${name}`,
      aspect: p.size.w / p.size.h,
      run: async ({ set }) => {
        const c = document.createElement('canvas')
        c.width = Math.round(p.size.w * scale)
        c.height = Math.round(p.size.h * scale)
        const ctx = c.getContext('2d')!
        ctx.setTransform(scale, 0, 0, scale, 0, 0)
        drawPost(ctx, p.size.w, p.size.h, p.row, effective(v, d.overrides[p.size.id]), p.size, logo)
        const blob = await canvasBlob(c, mime, 0.92)
        blobs.set(`${k}`, { blob, name })
        if (zip) await zip.addBlob(name, blob)
        else { download(blob, name.replace(/\//g, '-')); await new Promise((r) => setTimeout(r, 220)) }
        exporter.setState((s) => ({ bytes: s.bytes + blob.size }))
        set({ thumb: URL.createObjectURL(blob), meta: fmtBytes(blob.size) })
        return blob
      },
    }
  })

  const { cancelled } = await jobs.run(tasks)
  const done = jobs.getState().done
  if (zip && done) {
    zip.add('manifest.json', JSON.stringify({
      generator: `Batch — ${site.name}`, created: new Date().toISOString(),
      template: params.toJSON(), rows: d.rows, sizes: d.sizes.map(({ id, name, w, h }) => ({ id, name, w, h, overrides: d.overrides[id] ?? {} })),
      files: [...blobs.values()].map((b) => b.name),
    }, null, 2))
    const blob = zip.toBlob()
    exporter.setState({ zip: blob })
    download(blob, `${slug(v.brandName)}-assets.zip`)
  }
  const bytes = exporter.getState().bytes
  if (cancelled) toast(`Cancelled after ${done} of ${planned.length}`, { description: done && zip ? 'The finished images were zipped.' : undefined })
  else toast(`Exported ${done} images`, { type: 'success', description: zip ? `${fmtBytes(exporter.getState().zip?.size ?? bytes)} zip` : 'Downloaded one by one' })
}
