/* ---------------------------------------------------------------------------
   Canvas 2D renderer — the export path. Draws straight from the node tree +
   layout map (no DOM screenshot, no foreignObject, never taints), so PNG
   export works for any node at any scale. Mirrors NodeView's semantics.
--------------------------------------------------------------------------- */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Box, Node, Paint } from '../model/types'
import { lineHeightOf, setFont, textLines, layoutNodes, type LayoutMap } from '../model/layout'
import { loadImage, imageSync } from '../model/images'
import { ICONS } from '../model/icons'
import { walk } from '../model/tree'
import { rgba } from './css'
import { shapePath } from './shapes'

const iconImgs = new Map<string, HTMLImageElement>()
/* SVG images re-rasterise at the destination size, so one image per look is enough. */
const iconKey = (n: Node) => `${n.icon!.name}|${n.fills.find((f) => f.visible)?.color}|${n.fills.find((f) => f.visible)?.opacity}|${n.icon!.stroke}`

function iconSvg(n: Node, size: number) {
  const f = n.fills.find((p) => p.visible)
  const Icon = ICONS[n.icon!.name]
  if (!Icon) return ''
  return renderToStaticMarkup(createElement(Icon, { size, color: f ? rgba(f.color, f.opacity) : '#000', strokeWidth: n.icon!.stroke }))
}

/** Decode every image and rasterise every icon the subtree needs. */
export async function prepare(nodes: Node[]) {
  const jobs: Promise<unknown>[] = []
  walk(nodes, (n) => {
    for (const f of [...n.fills, ...n.strokes]) if (f.kind === 'image' && f.image) jobs.push(loadImage(f.image).catch(() => null))
    if (n.type === 'icon' && n.icon) {
      const key = iconKey(n)
      if (!iconImgs.has(key)) {
        let svg = iconSvg(n, 96)
        if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        const im = new Image()
        iconImgs.set(key, im)
        jobs.push(new Promise((r) => { im.onload = r; im.onerror = r; im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` }))
      }
    }
  })
  await Promise.all(jobs)
}

const DEG = Math.PI / 180

function shape(n: Node, b: Box, grow = 0) {
  const p = new Path2D(shapePath(n.type === 'ellipse' ? n : { ...n, radius: n.radius.map((r) => (r ? r + grow : 0)) as Node['radius'] }, b.x - grow, b.y - grow, b.w + grow * 2, b.h + grow * 2))
  return p
}

function paintStyle(ctx: CanvasRenderingContext2D, p: Paint, b: Box): string | CanvasGradient | CanvasPattern | null {
  if (p.kind === 'solid') return rgba(p.color, p.opacity)
  if (p.kind === 'linear' || p.kind === 'radial') {
    let g: CanvasGradient
    if (p.kind === 'linear') {
      // CSS angle semantics: 0deg = to top, 90deg = to right
      const a = ((p.angle ?? 180) - 90) * DEG
      const len = Math.abs(b.w * Math.cos(a)) + Math.abs(b.h * Math.sin(a))
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2
      g = ctx.createLinearGradient(cx - (Math.cos(a) * len) / 2, cy - (Math.sin(a) * len) / 2, cx + (Math.cos(a) * len) / 2, cy + (Math.sin(a) * len) / 2)
    } else {
      g = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 0, b.x + b.w / 2, b.y + b.h / 2, Math.hypot(b.w, b.h) / 2)
    }
    for (const s of p.stops ?? []) g.addColorStop(Math.min(1, Math.max(0, s.pos)), rgba(s.color, p.opacity))
    return g
  }
  return null
}

function drawFills(ctx: CanvasRenderingContext2D, n: Node, b: Box, path: Path2D) {
  for (const f of n.fills) {
    if (!f.visible) continue
    if (f.kind === 'image') {
      const im = f.image ? imageSync(f.image) : null
      if (!im?.complete || !im.naturalWidth) continue
      ctx.save(); ctx.clip(path); ctx.globalAlpha *= f.opacity
      const r = im.naturalWidth / im.naturalHeight
      let w = b.w, h = b.h
      if (f.fit === 'fit' ? b.w / b.h > r : b.w / b.h < r) w = h * r; else h = w / r
      ctx.drawImage(im, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h)
      ctx.restore()
      continue
    }
    const style = paintStyle(ctx, f, b)
    if (!style) continue
    ctx.fillStyle = style
    ctx.fill(path)
  }
}

function drawStrokes(ctx: CanvasRenderingContext2D, n: Node, b: Box, path: Path2D) {
  if (n.strokeWidth <= 0) return
  for (const s of n.strokes) {
    if (!s.visible) continue
    const style = paintStyle(ctx, s, b)
    if (!style) continue
    ctx.save()
    ctx.strokeStyle = style
    if (n.strokeAlign === 'center') { ctx.lineWidth = n.strokeWidth; ctx.stroke(path) }
    else if (n.strokeAlign === 'inside') { ctx.clip(path); ctx.lineWidth = n.strokeWidth * 2; ctx.stroke(path) }
    else {
      const outside = new Path2D(); outside.rect(b.x - 1e4, b.y - 1e4, b.w + 2e4, b.h + 2e4); outside.addPath(path)
      ctx.clip(outside, 'evenodd'); ctx.lineWidth = n.strokeWidth * 2; ctx.stroke(path)
    }
    ctx.restore()
  }
}

function dropShadows(ctx: CanvasRenderingContext2D, n: Node, b: Box) {
  for (const e of n.effects) {
    if (!e.visible || e.kind !== 'drop-shadow') continue
    ctx.save()
    // draw the shape far off-canvas and throw only its shadow back
    const off = 1e5
    ctx.shadowColor = rgba(e.color, e.opacity)
    ctx.shadowBlur = e.blur * ctxScale(ctx)
    ctx.shadowOffsetX = (e.x + off) * ctxScale(ctx)
    ctx.shadowOffsetY = e.y * ctxScale(ctx)
    ctx.translate(-off, 0)
    ctx.fillStyle = '#000'
    ctx.fill(shape(n, b, e.spread))
    ctx.restore()
  }
}

function innerShadows(ctx: CanvasRenderingContext2D, n: Node, b: Box, path: Path2D) {
  for (const e of n.effects) {
    if (!e.visible || e.kind !== 'inner-shadow') continue
    ctx.save()
    ctx.clip(path)
    const ring = new Path2D(); ring.rect(b.x - 1e4, b.y - 1e4, b.w + 2e4, b.h + 2e4); ring.addPath(shape(n, b, -e.spread))
    const off = 1e5
    ctx.shadowColor = rgba(e.color, e.opacity)
    ctx.shadowBlur = e.blur * ctxScale(ctx)
    ctx.shadowOffsetX = (e.x + off) * ctxScale(ctx)
    ctx.shadowOffsetY = e.y * ctxScale(ctx)
    ctx.translate(-off, 0)
    ctx.fillStyle = '#000'
    ctx.fill(ring, 'evenodd')
    ctx.restore()
  }
}
/* shadows and filters live in device pixels, so scale them by the current transform */
const ctxScale = (ctx: CanvasRenderingContext2D) => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) }

function drawText(ctx: CanvasRenderingContext2D, n: Node, b: Box) {
  const t = n.text!
  const lines = textLines(n, b.w)
  const lh = lineHeightOf(t)
  setFont(ctx, t)
  const f = n.fills.find((p) => p.visible)
  const style = f ? paintStyle(ctx, f, b) : null
  if (!style) return
  ctx.fillStyle = style
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = t.align === 'center' ? 'center' : t.align === 'right' ? 'right' : 'left'
  const m = ctx.measureText('Hg')
  const asc = m.fontBoundingBoxAscent ?? t.size * 0.8, desc = m.fontBoundingBoxDescent ?? t.size * 0.2
  const x = t.align === 'center' ? b.x + b.w / 2 : t.align === 'right' ? b.x + b.w : b.x
  lines.forEach((line, i) => ctx.fillText(line, x, b.y + i * lh + (lh - (asc + desc)) / 2 + asc))
}

function drawBool(ctx: CanvasRenderingContext2D, n: Node, b: Box) {
  const shapes = (n.children ?? []).filter((c) => c.visible && (c.type === 'rect' || c.type === 'ellipse'))
  const paths = shapes.map((c) => new Path2D(shapePath(c, b.x + c.x, b.y + c.y, c.w, c.h)))
  const f = n.fills.find((p) => p.visible)
  const style = f ? paintStyle(ctx, f, b) ?? '#d9d9d9' : '#d9d9d9'
  const op = n.bool ?? 'union'
  ctx.fillStyle = style
  if (op === 'union' || op === 'exclude') {
    const all = new Path2D(); paths.forEach((p) => all.addPath(p))
    ctx.fill(all, op === 'exclude' ? 'evenodd' : 'nonzero')
  } else if (op === 'intersect') {
    ctx.save(); paths.slice(0, -1).forEach((p) => ctx.clip(p)); ctx.fill(paths.at(-1)!); ctx.restore()
  } else {
    const m = ctx.getTransform()
    const c = document.createElement('canvas')
    c.width = ctx.canvas.width; c.height = ctx.canvas.height
    const o = c.getContext('2d')!
    o.setTransform(m); o.fillStyle = style; o.fill(paths[0])
    o.globalCompositeOperation = 'destination-out'; paths.slice(1).forEach((p) => o.fill(p))
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.restore()
  }
}

export function paintNode(ctx: CanvasRenderingContext2D, n: Node, L: LayoutMap) {
  const b = L.get(n.id)
  if (!b || !n.visible) return
  ctx.save()
  ctx.globalAlpha *= n.opacity
  if (n.blend !== 'normal') ctx.globalCompositeOperation = n.blend as GlobalCompositeOperation
  if (n.rotation) { ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.rotate(-n.rotation * DEG); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2)) }
  const blur = n.effects.find((e) => e.visible && e.kind === 'layer-blur')
  if (blur) ctx.filter = `blur(${(blur.blur / 2) * ctxScale(ctx)}px)`

  if (n.type === 'text' && n.text) drawText(ctx, n, b)
  else if (n.type === 'icon' && n.icon) {
    const s = Math.min(b.w, b.h)
    const im = iconImgs.get(iconKey(n))
    if (im?.complete && im.naturalWidth) ctx.drawImage(im, b.x + (b.w - s) / 2, b.y + (b.h - s) / 2, s, s)
  } else if (n.type === 'boolean') drawBool(ctx, n, b)
  else {
    const path = shape(n, b)
    dropShadows(ctx, n, b)
    drawFills(ctx, n, b, path)
    innerShadows(ctx, n, b, path)
    if (n.children?.length) {
      ctx.save()
      if (n.clip) ctx.clip(path)
      for (const c of n.children) paintNode(ctx, c, L)
      ctx.restore()
    }
    drawStrokes(ctx, n, b, path)
  }
  ctx.restore()
}

/** Render one node (and its subtree) to a canvas at `scale`. */
export async function renderNodeToCanvas(n: Node, pageNodes: Node[], scale = 2, background?: string) {
  await prepare([n])
  const L = layoutNodes(pageNodes)
  const b = L.get(n.id)!
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(b.w * scale))
  c.height = Math.max(1, Math.round(b.h * scale))
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.translate(-b.x, -b.y)
  if (background) { ctx.fillStyle = background; ctx.fillRect(b.x, b.y, b.w, b.h) }
  // the node's own rotation is baked into the frame; a rotated top-level export draws upright
  paintNode(ctx, n.rotation ? { ...n, rotation: 0 } : n, L)
  return c
}
