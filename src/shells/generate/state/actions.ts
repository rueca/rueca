/* User-level verbs: generate, variations, remix, upscale, reuse. Shared by the composer, the
   tile hover actions, the details panel, the lightbox and the command palette. */
import { toast, copyText, exportJSON } from '@kit'
import { aspectOf, modelOf, paramsText, type GenParams } from '../engine/models'
import { params, prompt } from './params'
import { history, snapshot, setView, byId, select, deleteImages, visible, viewTitle, newSession, addImages, uid, type ImageRec } from './gallery'
import { enqueue } from './queue'
import { ui, focusPrompt } from './ui'
import { exportPNG } from './images'
import { slug as toSlug } from '../../util'

const rnd = () => Math.floor(Math.random() * 999_999)

/** Where new images go: the session on screen, else the last active one (and show it). */
function targetSession() {
  const s = snapshot()
  if (s.view.type === 'session') return s.view.id
  const id = s.sessions.some((x) => x.id === s.activeSession) ? s.activeSession : s.sessions[0].id
  setView({ type: 'session', id })
  return id
}

export function generate() {
  const v = params.values()
  const t = prompt.values()
  if (!t.prompt.trim()) { toast('Describe an image first', { description: 'Type a prompt, then ⌘↵.' }); focusPrompt(); return }
  prompt.commit()
  const a = aspectOf(v.aspect)
  const seed = v.lockSeed ? v.seed : rnd()
  const remixOf = byId(ui.getState().remixOf)
  const items: GenParams[] = Array.from({ length: v.batch }, (_, k) => ({
    prompt: t.prompt.trim(), negative: t.negative.trim(), model: v.model as GenParams['model'], aspect: v.aspect, w: a.w, h: a.h,
    steps: v.steps, guidance: v.guidance, seed: seed + k,
  }))
  enqueue(items, { kind: remixOf ? 'remix' : 'generate', parentId: remixOf?.id, sessionId: targetSession() })
  if (remixOf) ui.setState({ remixOf: null })
}

export function variations(rec: ImageRec, strength = params.values().varStrength) {
  const n = params.values().batch
  const items = Array.from({ length: n }, () => ({ ...rec.params, subseed: rnd(), subStrength: strength }))
  enqueue(items, { kind: 'variation', parentId: rec.id, sessionId: targetSession() })
  toast(`${n} variation${n > 1 ? 's' : ''} queued`, { description: strength < 0.3 ? 'Subtle' : strength < 0.6 ? 'Medium' : 'Strong' })
}

export function upscale(rec: ImageRec) {
  if (rec.params.upscale) { toast('Already upscaled', { description: `${rec.params.w * 2} × ${rec.params.h * 2}` }); return }
  const creative = params.values().upscaleMode === 'creative'
  enqueue([{ ...rec.params, upscale: 2, detail: creative ? 1 : 0, ...(creative ? { subseed: rnd(), subStrength: 0.06 } : {}) }], { kind: 'upscale', parentId: rec.id, sessionId: targetSession() })
  toast('Upscale queued', { description: `${rec.params.w * 2} × ${rec.params.h * 2} · ${creative ? 'creative' : 'subtle'}` })
}

/** Remix: load everything back into the composer with the seed locked, then edit the prompt. */
export function remix(rec: ImageRec) {
  reuseAll(rec, true)
  ui.setState({ remixOf: rec.id })
  focusPrompt()
}

export function reusePrompt(rec: ImageRec) {
  prompt.patch({ prompt: rec.params.prompt, negative: rec.params.negative })
  if (rec.params.negative) ui.setState({ negativeOpen: true })
  focusPrompt()
  toast('Prompt loaded')
}

export function reuseAll(rec: ImageRec, quiet = false) {
  const p = rec.params
  prompt.patch({ prompt: p.prompt, negative: p.negative })
  params.patch({ model: p.model, aspect: p.aspect, steps: p.steps, guidance: p.guidance, lockSeed: true, seed: p.seed })
  if (p.negative) ui.setState({ negativeOpen: true })
  if (!quiet) toast('Settings loaded', { description: `Seed ${p.seed} locked · ${modelOf(p.model).name}` })
}

export function lockSeedFrom(rec: ImageRec) {
  params.patch({ lockSeed: true, seed: rec.params.seed })
  toast(`Seed ${rec.params.seed} locked`)
}

export async function copyParams(rec: ImageRec) {
  await copyText(paramsText(rec.params))
  toast('Parameters copied', { type: 'success', description: 'A1111 format — paste into any SD tool.' })
}

export function removeWithUndo(ids: string[]) {
  if (!ids.length) return
  deleteImages(ids)
  toast(`Deleted ${ids.length} image${ids.length > 1 ? 's' : ''}`, { action: { label: 'Undo', onClick: () => { history.undo(); select(ids, ids[0]) } }, timeout: 5000 })
}

export async function exportSelected() {
  const s = snapshot()
  const recs = s.selection.map((id) => byId(id)).filter(Boolean) as ImageRec[]
  if (!recs.length) { toast('Select an image to export'); return }
  const id = toast(`Rendering ${recs.length} PNG${recs.length > 1 ? 's' : ''}…`, { type: 'loading' })
  for (const r of recs) await exportPNG(r.params, r.id)
  toast.update(id, `Exported ${recs.length} PNG${recs.length > 1 ? 's' : ''}`, { type: 'success', description: recs.length === 1 ? `${recs[0].params.w * (recs[0].params.upscale ?? 1)} × ${recs[0].params.h * (recs[0].params.upscale ?? 1)}` : undefined })
}

const slug = (s: string) => toSlug(s, 'session')

export function exportSession() {
  const s = snapshot()
  const title = viewTitle(s)
  const images = visible(s)
  const data = {
    format: 'studio.generate.session', version: 1, name: title, exportedAt: new Date().toISOString(),
    images: images.map((i) => ({ id: i.id, kind: i.kind, parentId: i.parentId, createdAt: new Date(i.createdAt).toISOString(), favourite: !!i.favourite, params: i.params, parameters: paramsText(i.params) })),
  }
  exportJSON(data, `${slug(title)}.session.json`)
  toast('Session exported', { type: 'success', description: `${images.length} images · re-renders from params` })
}

export async function importSession(file: File) {
  try {
    const d = JSON.parse(await file.text())
    if (d.format !== 'studio.generate.session' || !Array.isArray(d.images)) throw new Error('Not a session export')
    // Skip entries the renderer can't draw rather than poisoning the session (break-it S2).
    const usable = d.images.filter((i: any) => i && typeof i === 'object' && i.params && typeof i.params === 'object' && typeof i.params.prompt === 'string' && Number.isFinite(i.params.seed))
    if (!usable.length) throw new Error('No usable images in this file')
    d.images = usable
    const sess = newSession(String(d.name ?? 'Imported'))
    addImages(d.images.map((i: any, k: number) => ({ id: uid('i-'), sessionId: sess.id, jobId: 'import', createdAt: Date.now() - k, params: i.params, kind: i.kind ?? 'generate', favourite: !!i.favourite, boards: [], ms: 0 })))
    toast(`Imported “${sess.name}”`, { type: 'success', description: `${d.images.length} images` })
  } catch (e) {
    toast('Could not import', { type: 'error', description: e instanceof Error ? e.message : 'Expected a session JSON.' })
  }
}

