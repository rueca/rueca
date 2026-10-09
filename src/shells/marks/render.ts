/* Marks — SVG composition (mark, lockups) and rasterising. Pure strings in, strings/blobs out. */
import { FAMILY, type DrawCtx } from './families'
import type { Mark, SV } from './model'

export function markInner(m: Mark, c: DrawCtx) {
  const fam = FAMILY[m.family]
  return fam.draw({ ...(fam.params.getState().defaults as Record<string, unknown>), ...m.v }, c)
}

/** A standalone SVG of the mark. `pad` is extra margin as a share of the 100-unit box. */
export function markSVG(m: Mark, c: DrawCtx, o: { bg?: string | null; pad?: number; size?: number; title?: string } = {}) {
  const pad = (o.pad ?? 0) * 100
  const vb = `${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}`
  const size = o.size ? ` width="${o.size}" height="${o.size}"` : ''
  const bg = o.bg ? `<rect x="${-pad}" y="${-pad}" width="${100 + pad * 2}" height="${100 + pad * 2}" fill="${o.bg}"/>` : ''
  const title = o.title ? `<title>${esc(o.title)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${size}>${title}${bg}${markInner(m, c)}</svg>`
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)

let measureCtx: CanvasRenderingContext2D | null = null
function textWidth(text: string, weight: number, size: number, trackingPct: number) {
  measureCtx ??= document.createElement('canvas').getContext('2d')!
  measureCtx.font = `${weight} ${size}px "Inter Variable", Inter, system-ui, sans-serif`
  return measureCtx.measureText(text).width + Math.max(0, text.length - 1) * (trackingPct / 100) * size
}

/** Mark + wordmark, light (ink on paper) or dark (paper on ink). */
export function lockupSVG(m: Mark, s: SV, mode: 'light' | 'dark', o: { bg?: boolean; layout?: 'horizontal' | 'stacked' } = {}) {
  const dark = mode === 'dark'
  const c: DrawCtx = { ink: dark ? s.paper : s.ink, paper: dark ? s.ink : s.paper, accent: s.accent, initials: s.initials }
  const layout = o.layout ?? (s.lockLayout as 'horizontal' | 'stacked')
  const cap = 34 * s.wordScale
  const fontSize = cap / 0.727 // Inter cap height ≈ 0.727 em
  const word = s.name || 'Brand'
  const tw = textWidth(word, s.wordWeight, fontSize, s.wordTracking)
  const pad = 24
  const mark = markInner(m, c)
  let w: number, h: number, body: string
  const text = (x: number, y: number, anchor: 'start' | 'middle') =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-family="Inter, 'Inter Variable', system-ui, -apple-system, Helvetica, Arial, sans-serif" font-size="${fontSize.toFixed(2)}" font-weight="${s.wordWeight}" letter-spacing="${((s.wordTracking / 100) * fontSize).toFixed(2)}" fill="${c.ink}">${esc(word)}</text>`
  if (layout === 'horizontal') {
    const gap = 14 * s.wordScale + 6
    w = pad + 100 + gap + tw + pad
    h = 100 + pad * 2
    body = `<g transform="translate(${pad} ${pad})">${mark}</g>${text(pad + 90 + gap, pad + 50 + cap / 2, 'start')}`
  } else {
    w = Math.max(100, tw) + pad * 2
    h = pad + 100 + 16 + cap + pad + 6
    body = `<g transform="translate(${(w - 100) / 2} ${pad})">${mark}</g>${text(w / 2, pad + 100 + 16 + cap, 'middle')}`
  }
  const bg = o.bg !== false ? `<rect width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c.paper}"/>` : ''
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">${bg}${body}</svg>`, w, h }
}

export const svgURL = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/** Rasterise an SVG string to a square PNG. */
export function svgToPNG(svg: string, size: number, bg?: string | null) {
  return new Promise<Blob>((res, rej) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const ctx = c.getContext('2d')!
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size) }
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, size, size)
      c.toBlob((b) => (b ? res(b) : rej(new Error('PNG failed'))), 'image/png')
    }
    img.onerror = rej
    img.src = svgURL(svg)
  })
}
