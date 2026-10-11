/* ---------------------------------------------------------------------------
   The template. A pure function of (values, row, size) → pixels on a Canvas
   2D context, in LOGICAL size units (the caller sets the transform for
   preview resolution or export scale). The studio never reaches in here.

   Layout rules (per size, overridable):
     stack  tall formats — logo, headline, subhead, product, button
     hero   square — copy top-left, product large bottom-right
     split  wide — copy column left, product right
   Copy is fitted, not cropped: a long headline shrinks to its line budget,
   and anything that had to give is reported back as an issue.

   Drawn in the wire style (src/demo/wire.ts): the product is a framed
   placeholder shot — the dithered top on the row's tone — with hairlines in
   place of shadows, and one ink for everything else.
--------------------------------------------------------------------------- */
import { WIRE, ditherTop } from '@/demo/wire'
import type { DataRow, SizeSpec, V } from './model'
import { contrastRatio, luminance } from '@kit'
import { mulberry32 } from '../util'

export const FONTS: Record<string, string> = {
  inter: '"Inter Variable", Inter, system-ui, sans-serif',
  serif: 'ui-serif, "New York", Georgia, "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
}

export interface DrawResult { issues: string[]; mode: 'stack' | 'hero' | 'split' }

/* --- small maths --- */
export { mulberry32 }
const rgb = (hex: string): [number, number, number] => {
  const h = /^#?[0-9a-f]{6}/i.test(hex) ? hex.replace('#', '').slice(0, 6) : '888888'
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const mix = (a: string, b: string, k: number) => {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`
}
/** whichever of ink / paper reads better on bg */
export const textOn = (bg: string, ink: string, paper: string) => (contrastRatio(bg, ink) >= contrastRatio(bg, paper) ? ink : paper)

/* --- text fitting --- */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width <= maxW || !line) line = test
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines
}

interface Fitted { lines: string[]; size: number; lh: number; shrunk: number; truncated: boolean; width: number }

function fit(ctx: CanvasRenderingContext2D, text: string, o: { size: number; min: number; maxW: number; maxLines: number; font: (s: number) => string; tracking?: number; lh?: number }): Fitted {
  let size = o.size
  const set = (s: number) => {
    ctx.font = o.font(s)
    ;(ctx as any).letterSpacing = `${((o.tracking ?? 0) / 100) * s}px`
  }
  let lines: string[] = []
  for (let i = 0; i < 40; i++) {
    set(size)
    lines = wrap(ctx, text, o.maxW)
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width))
    if ((lines.length <= o.maxLines && widest <= o.maxW) || size <= o.min) break
    size = Math.max(o.min, size * 0.94)
  }
  let truncated = false
  if (lines.length > o.maxLines) {
    truncated = true
    lines = lines.slice(0, o.maxLines)
    let last = lines[o.maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > o.maxW) last = last.slice(0, -1)
    lines[o.maxLines - 1] = `${last.trimEnd()}…`
  }
  const width = Math.max(0, ...lines.map((l) => ctx.measureText(l).width))
  return { lines, size, lh: size * (o.lh ?? 1.04), shrunk: size / o.size, truncated, width }
}

/** When true, layout runs without painting — used to place the product before the copy is drawn over it. */
let DRY = false

function drawLines(ctx: CanvasRenderingContext2D, f: Fitted, x: number, y: number, align: 'left' | 'center', font: (s: number) => string, color: string, tracking = 0) {
  const height = f.lines.length ? (f.lines.length - 1) * f.lh + f.size * 1.02 : 0
  if (DRY) return height
  ctx.font = font(f.size)
  ;(ctx as any).letterSpacing = `${(tracking / 100) * f.size}px`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  f.lines.forEach((l, i) => ctx.fillText(l, x, y + f.size * 0.8 + i * f.lh))
  ;(ctx as any).letterSpacing = '0px'
  return height
}

/* --- procedural pieces --- */
const MONO = "'Geist Mono Variable', 'Geist Mono', ui-monospace, Menlo, monospace"
/** width ÷ height of the product shot */
export const PRODUCT_RATIO = 0.6
const SHOT = { w: 312, h: 520 } // 156 × 260 dither cells, 2× — exactly PRODUCT_RATIO
const hex6 = (c: string) => (/^#[0-9a-f]{6}/i.test(c) ? c.slice(0, 7).toUpperCase() : WIRE.sheet)
const isNight = (tone: string) => luminance(tone) < 0.18

/* The product shot is a data-URL image (ditherTop), decoded once per tone. drawPost is
   synchronous, so it paints a plain slot until the image is ready and tells listeners. */
const shots = new Map<string, HTMLImageElement>()
const shotListeners = new Set<() => void>()
export function onShotReady(fn: () => void) { shotListeners.add(fn); return () => { shotListeners.delete(fn) } }
function shotImage(tone: string) {
  const night = isNight(tone), key = night ? 'night' : tone
  let img = shots.get(key)
  if (!img) {
    img = new Image()
    img.onload = () => shotListeners.forEach((f) => f())
    img.src = night ? ditherTop(SHOT.w, SHOT.h, { night: true, at: 0.5 }) : ditherTop(SHOT.w, SHOT.h, { light: tone, at: 0.5 })
    shots.set(key, img)
  }
  return img
}
/** decode the product shots for these rows (call before exporting) */
export const ensureShots = (rows: DataRow[]) =>
  Promise.all(rows.map((r) => shotImage(hex6(r.color)).decode().catch(() => {}))).then(() => {})

/** A fruit slice in hairline: rind, flesh line, segment spokes. Filled with the ground so it sits in front. */
export function drawSlice(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ground: string, ink: string, rot: number) {
  ctx.save()
  ctx.lineWidth = Math.max(1, r * 0.035)
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = ground; ctx.fill()
  ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.stroke()
  ctx.globalAlpha = 0.3
  ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, Math.PI * 2); ctx.stroke()
  const n = 9
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n
    ctx.moveTo(x + Math.cos(a) * r * 0.12, y + Math.sin(a) * r * 0.12)
    ctx.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86)
  }
  ctx.stroke()
  ctx.restore()
}

/** The product: a portrait shot slot — dithered top on the row tone, hairline frame, mono caption. */
function drawProduct(ctx: CanvasRenderingContext2D, cx: number, bottom: number, H: number, row: DataRow, v: V) {
  const W = H * PRODUCT_RATIO, x0 = cx - W / 2, top = bottom - H
  const tone = hex6(row.color), night = isNight(tone)
  const ink = night ? v.paper : v.ink
  ctx.save()
  ctx.fillStyle = night ? WIRE.ink : tone
  ctx.fillRect(x0, top, W, H)
  const img = shotImage(tone)
  if (img.complete && img.naturalWidth) {
    // crisp dither cells when enlarging; let the browser average them when shrinking (no moiré)
    const t = ctx.getTransform()
    ctx.imageSmoothingEnabled = (H * Math.abs(t.d || 1)) / SHOT.h < 1.4
    ctx.drawImage(img, x0, top, W, H)
    ctx.imageSmoothingEnabled = true
  }
  // hairline frame
  ctx.strokeStyle = night ? v.paper : v.ink
  ctx.globalAlpha = night ? 0.3 : 0.42
  const lw = Math.max(1, W * 0.004)
  ctx.lineWidth = lw
  ctx.strokeRect(x0 + lw / 2, top + lw / 2, W - lw, H - lw)
  // caption, top-left (the badge takes the top-right, front slices the bottom)
  const fs = W * 0.042
  ctx.font = `${fs}px ${MONO}`
  let name = (row.name || 'product').toLowerCase()
  const max = W * 0.62 // clear of the badge
  while (name.length > 2 && ctx.measureText(`${name}… · shot`).width > max) name = name.slice(0, -1)
  const label = `${name !== (row.name || 'product').toLowerCase() ? `${name.trimEnd()}…` : name} · shot`
  const tw = ctx.measureText(label).width, px = W * 0.05
  ctx.globalAlpha = 1
  ctx.fillStyle = night ? WIRE.ink : tone
  ctx.fillRect(x0 + px - fs * 0.5, top + px - fs * 0.3, tw + fs, fs * 1.8)
  ctx.fillStyle = ink; ctx.globalAlpha = 0.66
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(label, x0 + px, top + px + fs * 0.6)
  ctx.restore()
  return { left: x0, right: x0 + W, top, bottom, w: W }
}

/* --- logo --- */
function logoWidth(ctx: CanvasRenderingContext2D, v: V, h: number, img: HTMLImageElement | null) {
  if (img) return (img.naturalWidth / Math.max(1, img.naturalHeight)) * h * 1.15
  ctx.font = `800 ${h * 1.05}px ${FONTS[v.displayFont] ?? FONTS.inter}`
  const word = ctx.measureText(v.brandName || 'oro').width
  return v.logoStyle === 'mark' ? h : v.logoStyle === 'word' ? word : h + h * 0.32 + word
}
function drawLogo(ctx: CanvasRenderingContext2D, v: V, x: number, y: number, h: number, color: string, img: HTMLImageElement | null) {
  if (DRY) return
  if (img) { const w = logoWidth(ctx, v, h, img); ctx.drawImage(img, x, y - h * 0.075, w, h * 1.15); return }
  ctx.save()
  let cx = x
  if (v.logoStyle !== 'word') {
    const r = h / 2
    ctx.beginPath(); ctx.arc(x + r, y + r, r * 0.8, 0, Math.PI * 2)
    ctx.strokeStyle = color; ctx.lineWidth = h * 0.2; ctx.stroke()
    ctx.beginPath(); ctx.arc(x + r + r * 0.56, y + r - r * 0.56, r * 0.26, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
    cx = x + h + h * 0.32
  }
  if (v.logoStyle !== 'mark') {
    ctx.font = `800 ${h * 1.05}px ${FONTS[v.displayFont] ?? FONTS.inter}`
    ;(ctx as any).letterSpacing = `${-h * 0.03}px`
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(v.brandName || 'oro', cx, y + h * 0.86)
    ;(ctx as any).letterSpacing = '0px'
  }
  ctx.restore()
}

/* --- button + price --- */
function ctaWidth(ctx: CanvasRenderingContext2D, v: V, text: string, h: number) {
  ctx.font = `650 ${h * 0.36}px ${FONTS[v.bodyFont] ?? FONTS.inter}`
  const tw = ctx.measureText(text).width
  return v.ctaStyle === 'link' ? tw + h * 0.5 : tw + h * 1.1
}
function drawCta(ctx: CanvasRenderingContext2D, v: V, text: string, x: number, y: number, h: number, fg: string, bg: string) {
  const w = ctaWidth(ctx, v, text, h)
  if (DRY) return w
  ctx.save()
  ctx.font = `650 ${h * 0.36}px ${FONTS[v.bodyFont] ?? FONTS.inter}`
  ctx.textBaseline = 'middle'
  if (v.ctaStyle === 'link') {
    ctx.fillStyle = fg; ctx.textAlign = 'left'
    ctx.fillText(`${text}  →`, x, y + h / 2)
    ctx.fillRect(x, y + h / 2 + h * 0.26, w - h * 0.1, Math.max(1, h * 0.035))
  } else {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2)
    if (v.ctaStyle === 'pill') { ctx.fillStyle = fg; ctx.fill(); ctx.fillStyle = bg }
    else { ctx.lineWidth = Math.max(1, h * 0.045); ctx.strokeStyle = fg; ctx.stroke(); ctx.fillStyle = fg }
    ctx.textAlign = 'center'
    ctx.fillText(text, x + w / 2, y + h / 2 + h * 0.02)
  }
  ctx.restore()
  return w
}

function drawBadge(ctx: CanvasRenderingContext2D, v: V, text: string, x: number, y: number, r: number, bg: string, fg: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.21)
  ctx.beginPath()
  const n = 22
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.93 : r
    i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0)
  }
  ctx.closePath()
  ctx.fillStyle = bg; ctx.fill()
  ctx.lineWidth = Math.max(1, r * 0.03); ctx.strokeStyle = fg; ctx.stroke()
  let size = r * 0.42
  ctx.font = `800 ${size}px ${FONTS[v.displayFont] ?? FONTS.inter}`
  while (ctx.measureText(text).width > r * 1.45 && size > r * 0.18) { size *= 0.92; ctx.font = `800 ${size}px ${FONTS[v.displayFont] ?? FONTS.inter}` }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, size * 0.04)
  ctx.restore()
}

let grainCanvas: HTMLCanvasElement | null = null
function grainPattern(ctx: CanvasRenderingContext2D) {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas')
    grainCanvas.width = grainCanvas.height = 192
    const g = grainCanvas.getContext('2d')!
    const img = g.createImageData(192, 192)
    const rnd = mulberry32(42)
    for (let i = 0; i < img.data.length; i += 4) { const n = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255 }
    g.putImageData(img, 0, 0)
  }
  return ctx.createPattern(grainCanvas, 'repeat')
}

type Rect = { x: number; y: number; w: number; h: number }
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

/* --- the template --- */
/**
 * Paint one asset. `dryOnly` runs the layout without painting and returns the
 * issues — cheap enough to check every row × size on every change.
 */
export function drawPost(ctx: CanvasRenderingContext2D, w: number, h: number, row: DataRow, v: V, size: SizeSpec, logo: HTMLImageElement | null = null, dryOnly = false): DrawResult {
  const S = Math.min(w, h)
  const pad = (v.padding / 100) * S
  const L = size.safe.l + pad, T = size.safe.t + pad, R = w - size.safe.r - pad, B = h - size.safe.b - pad
  const cw = Math.max(1, R - L), ch = Math.max(1, B - T)
  const aspect = w / h
  let mode: DrawResult['mode'] = v.layout === 'auto' ? (aspect < 0.82 ? 'stack' : aspect > 1.3 ? 'split' : 'hero') : (v.layout as DrawResult['mode'])
  if (mode === 'hero' && v.align === 'center') mode = 'stack'
  const align = v.align as 'left' | 'center'
  const color = /^#[0-9a-f]{6}/i.test(row.color) ? row.color.slice(0, 7) : WIRE.sheet
  const disp = FONTS[v.displayFont] ?? FONTS.inter, bodyF = FONTS[v.bodyFont] ?? FONTS.inter
  const headFont = (s: number) => `${v.headlineWeight} ${s}px ${disp}`
  const subFont = (s: number) => `450 ${s}px ${bodyF}`

  const bg = v.bgStyle === 'flavour' ? color : v.paper
  const fg = textOn(bg, v.ink, v.paper)
  const splitRect: Rect | null = v.bgStyle !== 'split' ? null
    : mode === 'split' ? { x: w * 0.56, y: 0, w: w * 0.44, h } : mode === 'stack' ? { x: 0, y: h * 0.56, w, h: h * 0.44 } : { x: w * 0.6, y: 0, w: w * 0.4, h }
  const ctaText = row.cta || 'Shop now'
  const sub = v.showSubhead && row.subhead.trim()

  /* The copy block. Run once DRY to place the product, then again to paint on top of it. */
  const copy = () => {
    const issues: string[] = []
    const texts: Rect[] = []
    let can = { cx: 0, bottom: 0, H: 0 }
    const price = (x: number, y: number, ctaH: number) => {
      ctx.font = `650 ${ctaH * 0.4}px ${bodyF}`
      if (!DRY) { ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(row.price, x, y + ctaH / 2) }
    }
    if (mode === 'stack') {
      const logoH = cw * 0.058
      const logoW = logoWidth(ctx, v, logoH, logo)
      const lx = align === 'center' ? L + cw / 2 - logoW / 2 : L
      drawLogo(ctx, v, lx, T, logoH, fg, logo)
      texts.push({ x: lx, y: T, w: logoW, h: logoH })
      let y = T + logoH + cw * 0.075
      const base = cw * 0.105 * (v.headlineScale / 100)
      const head = fit(ctx, row.headline, { size: base, min: base * 0.55, maxW: cw, maxLines: 4, font: headFont, tracking: v.tracking, lh: 1.02 })
      const hx = align === 'center' ? L + cw / 2 : L
      const hh = drawLines(ctx, head, hx, y, align, headFont, fg, v.tracking)
      texts.push({ x: align === 'center' ? hx - head.width / 2 : L, y, w: head.width, h: hh })
      if (head.truncated) issues.push('Headline truncated')
      else if (head.shrunk < 0.9) issues.push(`Headline shrunk to ${Math.round(head.shrunk * 100)}%`)
      y += hh
      if (sub) {
        y += base * 0.32
        const sb = cw * 0.036 * (v.subheadScale / 100)
        const f = fit(ctx, row.subhead, { size: sb, min: sb * 0.8, maxW: cw * 0.86, maxLines: 3, font: subFont, lh: 1.32 })
        ctx.globalAlpha = 0.78
        const sh = drawLines(ctx, f, hx, y, align, subFont, fg)
        ctx.globalAlpha = 1
        texts.push({ x: align === 'center' ? hx - f.width / 2 : L, y, w: f.width, h: sh })
        if (f.truncated) issues.push('Subhead truncated')
        y += sh
      }
      const ctaH = cw * 0.1
      const ctaY = B - ctaH
      const top = y + cw * 0.05, bottom = ctaY - cw * 0.05
      const avail = bottom - top
      if (avail < cw * 0.42) issues.push('Product squeezed by copy')
      const H = Math.max(cw * 0.2, Math.min(avail, cw * 1.2)) * (v.imageScale / 100)
      can = { cx: L + cw / 2, bottom: bottom - Math.max(0, (avail - H) * 0.15), H }
      const cwid = ctaWidth(ctx, v, ctaText, ctaH)
      ctx.font = `650 ${ctaH * 0.4}px ${bodyF}`
      const pw = v.showPrice && row.price ? ctx.measureText(row.price).width + ctaH * 0.45 : 0
      const cx0 = align === 'center' ? L + cw / 2 - (cwid + pw) / 2 : L
      drawCta(ctx, v, ctaText, cx0, ctaY, ctaH, fg, bg)
      if (pw) price(cx0 + cwid + ctaH * 0.45, ctaY, ctaH)
      texts.push({ x: cx0, y: ctaY, w: cwid + pw, h: ctaH })
    } else {
      const isSplit = mode === 'split'
      const colW = cw * (isSplit ? 0.5 : 0.5)
      const logoH = isSplit ? Math.min(ch * 0.075, cw * 0.035) : cw * 0.055
      const logoW = logoWidth(ctx, v, logoH, logo)
      drawLogo(ctx, v, L, T, logoH, fg, logo)
      texts.push({ x: L, y: T, w: logoW, h: logoH })
      const base = (isSplit ? Math.min(ch * 0.14, cw * 0.062) : cw * 0.094) * (v.headlineScale / 100)
      const head = fit(ctx, row.headline, { size: base, min: base * 0.55, maxW: colW, maxLines: isSplit ? 3 : 4, font: headFont, tracking: v.tracking, lh: 1.02 })
      if (head.truncated) issues.push('Headline truncated')
      else if (head.shrunk < 0.9) issues.push(`Headline shrunk to ${Math.round(head.shrunk * 100)}%`)
      const sb = (isSplit ? Math.min(ch * 0.05, cw * 0.022) : cw * 0.034) * (v.subheadScale / 100)
      const subF = sub ? fit(ctx, row.subhead, { size: sb, min: sb * 0.8, maxW: colW * 0.92, maxLines: isSplit ? 2 : 3, font: subFont, lh: 1.32 }) : null
      if (subF?.truncated) issues.push('Subhead truncated')
      const ctaH = isSplit ? Math.min(ch * 0.13, cw * 0.05) : cw * 0.095
      const headH = (head.lines.length - 1) * head.lh + head.size * 1.02
      const subH = subF ? base * 0.3 + (subF.lines.length - 1) * subF.lh + subF.size * 1.02 : 0
      const blockH = headH + subH + ctaH * 1.6
      // split: centre the copy below the logo; hero: copy hangs from the logo, button sits on the bottom margin
      let y = isSplit ? Math.max(T + logoH + ch * 0.08, T + logoH + (ch - logoH - blockH) / 2) : T + logoH + cw * 0.07
      if (isSplit && y + blockH > B + ctaH * 0.2) issues.push('Copy taller than the format')
      drawLines(ctx, head, L, y, 'left', headFont, fg, v.tracking)
      texts.push({ x: L, y, w: head.width, h: headH })
      y += headH
      if (subF) {
        y += base * 0.3
        ctx.globalAlpha = 0.78
        const h2 = drawLines(ctx, subF, L, y, 'left', subFont, fg)
        ctx.globalAlpha = 1
        texts.push({ x: L, y, w: subF.width, h: h2 })
        y += h2
      }
      const ctaY = isSplit ? y + ctaH * 0.6 : B - ctaH
      const cwid = drawCta(ctx, v, ctaText, L, ctaY, ctaH, fg, bg)
      let pw = 0
      if (v.showPrice && row.price) { price(L + cwid + ctaH * 0.45, ctaY, ctaH); pw = ctx.measureText(row.price).width + ctaH * 0.45 }
      texts.push({ x: L, y: ctaY, w: cwid + pw, h: ctaH })
      if (!isSplit && y > ctaY - ctaH * 0.3) issues.push('Copy runs into the button')
      if (isSplit) {
        const areaL = splitRect ? splitRect.x : L + cw * 0.56
        const H = Math.min(ch * 0.92, ((R - areaL) * 0.8) / PRODUCT_RATIO) * (v.imageScale / 100)
        can = { cx: (areaL + (splitRect ? w : R)) / 2, bottom: T + ch / 2 + H / 2, H }
      } else {
        const H = ch * 0.76 * (v.imageScale / 100)
        can = { cx: R - (H * PRODUCT_RATIO) / 2 - cw * 0.03, bottom: B, H }
        if (L + Math.max(head.width, subF?.width ?? 0) > can.cx - (H * PRODUCT_RATIO) / 2 && y > B - H) issues.push('Product overlaps the copy')
      }
    }
    return { issues, texts, can }
  }

  DRY = true
  let plan: ReturnType<typeof copy>
  try { plan = copy() } finally { DRY = false }
  if (dryOnly) return { issues: plan.issues, mode }
  const { can, texts } = plan
  const rnd = mulberry32(v.seed * 7919 + row.name.length * 31)

  // scenery first: background, split block, hairline ring, slices, product
  const tone = hex6(color)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  if (splitRect) { ctx.fillStyle = tone; ctx.fillRect(splitRect.x, splitRect.y, splitRect.w, splitRect.h) }
  const canW = can.H * PRODUCT_RATIO, canTop = can.bottom - can.H
  if (v.bgStyle !== 'split') {
    ctx.save()
    ctx.beginPath(); ctx.arc(can.cx, canTop + can.H * 0.5, can.H * 0.56, 0, Math.PI * 2)
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.18; ctx.lineWidth = Math.max(1, S * 0.0018); ctx.stroke()
    ctx.restore()
  }
  const slices: { x: number; y: number; r: number; rot: number; front: boolean }[] = []
  const sliceGround = v.bgStyle === 'split' ? tone : bg
  const sliceInk = textOn(sliceGround, v.ink, v.paper)
  if (v.decor) {
    const anchors: [number, number, number, boolean][] = [[-0.92, 0.86, 0.34, false], [0.86, 0.3, 0.24, false], [0.78, 0.97, 0.36, true], [-0.84, 0.24, 0.18, false], [-0.5, 1.02, 0.2, true], [1.0, 0.62, 0.16, false]]
    for (const [ax, ay, ar, front] of anchors) {
      const r = canW * ar * (0.85 + rnd() * 0.3)
      const s = { x: can.cx + ax * canW * (0.95 + rnd() * 0.15), y: canTop + ay * can.H + (rnd() - 0.5) * canW * 0.2, r, rot: rnd() * Math.PI * 2, front }
      const box = { x: s.x - r, y: s.y - r, w: r * 2, h: r * 2 }
      if (texts.some((t) => hit(t, box))) continue
      slices.push(s)
    }
    for (const s of slices) if (!s.front) drawSlice(ctx, s.x, s.y, s.r, sliceGround, sliceInk, s.rot)
  }
  const c = drawProduct(ctx, can.cx, can.bottom, can.H, { ...row, color: tone }, v)
  for (const s of slices) if (s.front) drawSlice(ctx, s.x, s.y, s.r, sliceGround, sliceInk, s.rot)

  // copy on top
  copy()

  const issues = plan.issues
  if (v.showBadge && row.badge.trim()) {
    const r = Math.max(S * 0.06, c.w * 0.24)
    const right = { x: c.right - r * 1.1, y: c.top + c.w * 0.18 - r, w: r * 2, h: r * 2 }
    const left = { x: c.left - r * 1.15, y: right.y, w: r * 2, h: r * 2 }
    const fits = (b: Rect) => b.x >= 0 && b.x + b.w <= w && !texts.some((t) => hit(t, b))
    const at = fits(right) ? right : fits(left) ? left : right
    drawBadge(ctx, v, row.badge.trim(), at.x + r, at.y + r, r, WIRE.card, v.ink)
  }
  if (c.right > w + 1 || c.left < -1 || c.top < -1) issues.push('Product bleeds off the edge')

  if (v.grain > 0) {
    const pat = grainPattern(ctx)
    if (pat) {
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = v.grain * 0.22
      ctx.fillStyle = pat
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  }
  return { issues, mode }
}


/* --- assets the template needs --- */
const imgCache = new Map<string, HTMLImageElement>()
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const hitImg = imgCache.get(src)
    if (hitImg?.complete && hitImg.naturalWidth) return res(hitImg)
    const img = hitImg ?? new Image()
    img.onload = () => res(img)
    img.onerror = rej
    if (!hitImg) { img.src = src; imgCache.set(src, img) }
  })
}
/** returns the decoded image or null (and starts loading it) */
export function peekImage(src: string | null, onReady?: () => void) {
  if (!src) return null
  const img = imgCache.get(src)
  if (img?.complete && img.naturalWidth) return img
  loadImage(src).then(() => onReady?.()).catch(() => {})
  return null
}

let fontsReady: Promise<unknown> | null = null
export const ensureFonts = () =>
  (fontsReady ??= Promise.all([400, 450, 500, 600, 650, 700, 750, 800, 900].map((wt) => document.fonts.load(`${wt} 40px "Inter Variable"`))).catch(() => {}))
