/* Review helpers for the agent: render posters off-screen and post the PNG to a local receiver (127.0.0.1:5299),
   so a contact sheet can be checked without the studio. Not used by the tool itself. */
import * as A from './artifact'
import { STYLES, type StyleId } from './styles'

async function send(c: HTMLCanvasElement, name: string, type = 'image/png') {
  const b = await new Promise<Blob | null>((r) => c.toBlob(r, type, 0.92))
  await fetch(`http://127.0.0.1:5299/?name=${name}`, { method: 'POST', body: b, mode: 'no-cors' })
  return b?.size ?? 0
}
export async function ready() { await Promise.race([A.loadAssets(), new Promise((_, j) => setTimeout(() => j(new Error('load timeout')), 25000))]) }

export function poster(id: StyleId, over: Partial<A.V> = {}, artOnly = false, transparent = false) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1600
  const ctx = c.getContext('2d')!
  if (!transparent) { ctx.fillStyle = '#FDFBFA'; ctx.fillRect(0, 0, 1200, 1600) }
  A.drawPoster(ctx, id, { ...(A.params.values() as A.V), view: 'poster', style: id, ...over } as A.V, artOnly)
  return c
}
export async function sheet(name: string, ids: StyleId[] = STYLES.map((s) => s.id), scale = 0.3, over: Partial<A.V> = {}) {
  const W = 1200 * scale, H = 1600 * scale, cols = Math.min(4, ids.length)
  const s = document.createElement('canvas'); s.width = (W + 16) * cols; s.height = (H + 16) * Math.ceil(ids.length / cols)
  const g = s.getContext('2d')!; g.fillStyle = '#999'; g.fillRect(0, 0, s.width, s.height)
  ids.forEach((id, i) => g.drawImage(poster(id, over), (i % cols) * (W + 16) + 8, Math.floor(i / cols) * (H + 16) + 8, W, H))
  return send(s, name)
}
export const one = (id: StyleId, name: string, over: Partial<A.V> = {}) => send(poster(id, over), name)
/** the plate alone, on transparent, for Figma (the type is rebuilt there as live text) */
export const art = (id: StyleId, name: string) => send(poster(id, {}, true, true), name)
export const spec = (id: StyleId) => A.posterEls(id, A.params.values() as A.V)

/** the plate alone at `scale`×, cropped to its box, on transparent: for Figma's image fill */
export async function plate(id: StyleId, name: string, scale = 2, over: Partial<A.V> = {}) {
  const v = { ...(A.params.values() as A.V), ...over } as A.V
  const els = v.series === 'layers' ? A.layerEls(v).els : A.posterEls(id, v), box = els.find((e) => e.kind === 'art')! as { x: number; y: number; w: number; h: number }
  const c = document.createElement('canvas'); c.width = box.w * scale; c.height = box.h * scale
  const ctx = c.getContext('2d')!; ctx.scale(scale, scale); ctx.translate(-box.x, -box.y)
  A.drawPoster(ctx, id, { ...v, view: 'poster', style: id } as A.V, true)
  return send(c, name)
}

/** the sheet's type and rules, resolved for Figma: final sizes, wrapped lines, and the top of each text box */
export function figmaSpec(id: StyleId, over: Partial<A.V> = {}) {
  const v = { ...(A.params.values() as A.V), ...over } as A.V
  const layered = v.series === 'layers' ? A.layerEls(v) : null
  const els = layered ? layered.els : A.posterEls(id, v)
  const g = document.createElement('canvas').getContext('2d')!
  const out: unknown[] = []
  for (const e of els) {
    if (e.kind !== 'text') { out.push(e); continue }
    g.font = A.fontOf(e.font, e.size)
    ;(g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = e.font === 'plexCaps' ? `${e.size * 0.1}px` : e.font === 'goudy' ? `${-e.size * 0.015}px` : '0px'
    let size = e.size
    if (e.maxW && !e.lead) { const mw = g.measureText(e.text).width; if (mw > e.maxW) { size = (e.size * e.maxW) / mw; g.font = A.fontOf(e.font, size) } }
    const lines = e.lead ? A.wrap(g, e.text, e.maxW ?? 1e9) : [e.text]
    const m = g.measureText('Hxgy'), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent
    const lead = e.lead ?? asc + desc
    const top = e.y - ((lead - (asc + desc)) / 2 + asc)
    out.push({ kind: 'text', text: lines.join('\n'), font: e.font, size: Math.round(size * 100) / 100, x: e.x, top: Math.round(top * 10) / 10, lead: e.lead ?? null, align: e.align ?? 'left', rotate: e.rotate ? -e.rotate * (180 / Math.PI) : 0 })
  }
  return { id: layered ? v.recipe : id, ink: layered ? layered.ink : A.inkFor(id), els: out }
}
