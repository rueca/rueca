/* Paint → CSS. Used by the DOM renderer and by "Copy CSS". */
import type { Box, Effect, Node, Paint } from '../model/types'
import { imageURL, IMAGE_LABELS } from '../model/images'
import { fontCss, lineHeightOf } from '../model/layout'

export function rgba(hex: string, alpha = 1) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  const a = (h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1) * alpha
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return a >= 1 ? `#${h.slice(0, 6)}` : `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`
}

export function paintCss(p: Paint, forExport = false): string {
  if (p.kind === 'solid') { const c = rgba(p.color, p.opacity); return `linear-gradient(${c}, ${c})` }
  if (p.kind === 'linear' || p.kind === 'radial') {
    const stops = [...(p.stops ?? [])].sort((a, b) => a.pos - b.pos).map((s) => `${rgba(s.color, p.opacity)} ${Math.round(s.pos * 100)}%`).join(', ')
    return p.kind === 'linear' ? `linear-gradient(${p.angle ?? 180}deg, ${stops})` : `radial-gradient(circle at center, ${stops})`
  }
  const url = forExport ? `${(IMAGE_LABELS[p.image ?? ''] ?? 'image').toLowerCase().replace(/\s+/g, '-')}.jpg` : imageURL(p.image)
  const size = p.fit === 'fit' ? 'contain' : p.fit === 'tile' ? 'auto' : 'cover'
  return `url("${url}") center / ${size} ${p.fit === 'tile' ? 'repeat' : 'no-repeat'}`
}

/** CSS lists the top layer first; Figma lists the top layer last. */
export const fillsCss = (fills: Paint[], forExport = false) => fills.filter((f) => f.visible).map((f) => paintCss(f, forExport)).reverse().join(', ')

export const radiusCss = (r: [number, number, number, number]) => (r.every((v) => v === r[0]) ? `${r[0]}px` : r.map((v) => `${v}px`).join(' '))

export function strokeShadow(n: Node): string[] {
  const s = n.strokes.filter((p) => p.visible && p.kind === 'solid')
  if (!s.length || n.strokeWidth <= 0) return []
  return s.map((p) => {
    const c = rgba(p.color, p.opacity)
    const w = n.strokeWidth
    return n.strokeAlign === 'inside' ? `inset 0 0 0 ${w}px ${c}` : n.strokeAlign === 'outside' ? `0 0 0 ${w}px ${c}` : `inset 0 0 0 ${w / 2}px ${c}, 0 0 0 ${w / 2}px ${c}`
  })
}

export function shadowCss(e: Effect) {
  return `${e.kind === 'inner-shadow' ? 'inset ' : ''}${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${rgba(e.color, e.opacity)}`
}

export function effectStyle(n: Node): React.CSSProperties {
  const fx = n.effects.filter((e) => e.visible)
  const shadows = fx.filter((e) => e.kind === 'drop-shadow' || e.kind === 'inner-shadow')
  const blur = fx.find((e) => e.kind === 'layer-blur')
  const bg = fx.find((e) => e.kind === 'background-blur')
  const out: React.CSSProperties = {}
  const box = [...strokeShadow(n)]
  if (n.type === 'text' || n.type === 'icon' || n.type === 'boolean') {
    const ds = shadows.filter((e) => e.kind === 'drop-shadow').map((e) => `drop-shadow(${e.x}px ${e.y}px ${e.blur / 2}px ${rgba(e.color, e.opacity)})`)
    const f = [...ds, blur ? `blur(${blur.blur / 2}px)` : ''].filter(Boolean)
    if (f.length) out.filter = f.join(' ')
  } else {
    box.push(...shadows.map(shadowCss))
    if (blur) out.filter = `blur(${blur.blur / 2}px)`
  }
  if (box.length) out.boxShadow = box.join(', ')
  if (bg) { out.backdropFilter = `blur(${bg.blur / 2}px)`; (out as any).WebkitBackdropFilter = `blur(${bg.blur / 2}px)` }
  return out
}

/** "Copy CSS" — what a developer would paste. */
export function cssFor(n: Node, b: Box, parentAuto: boolean): string {
  const lines: string[] = [`/* ${n.name} */`]
  const add = (k: string, v: string | number | undefined | false) => { if (v !== undefined && v !== false && v !== '') lines.push(`${k}: ${v};`) }
  if (!parentAuto) { add('position', 'absolute'); add('left', `${Math.round(n.x)}px`); add('top', `${Math.round(n.y)}px`) }
  add('width', n.sizingW === 'fill' ? '100%' : n.sizingW === 'hug' && n.type !== 'text' ? 'fit-content' : `${Math.round(b.w)}px`)
  if (n.type !== 'text') add('height', n.sizingH === 'hug' ? 'fit-content' : `${Math.round(b.h)}px`)
  if (n.sizingW === 'fill' && parentAuto) add('flex', '1 0 0')
  if (n.layout) {
    const L = n.layout
    add('display', 'flex')
    add('flex-direction', L.dir)
    const main = L.dir === 'row' ? L.alignX : L.alignY
    const cross = L.dir === 'row' ? L.alignY : L.alignX
    const fl = (a: string) => (a === 'start' ? 'flex-start' : a === 'end' ? 'flex-end' : 'center')
    add('justify-content', L.between ? 'space-between' : fl(main))
    add('align-items', fl(cross))
    if (!L.between) add('gap', `${L.gap}px`)
    if (L.pad.some(Boolean)) add('padding', L.pad.every((p) => p === L.pad[0]) ? `${L.pad[0]}px` : L.pad.map((p) => `${p}px`).join(' '))
  }
  if (n.type === 'text' && n.text) {
    const t = n.text
    const f = n.fills.find((p) => p.visible && p.kind === 'solid')
    if (f) add('color', rgba(f.color, f.opacity))
    add('font-family', fontCss(t.family))
    add('font-size', `${t.size}px`)
    add('font-weight', t.weight)
    add('line-height', `${lineHeightOf(t)}px`)
    if (t.letterSpacing) add('letter-spacing', `${(t.letterSpacing / 100).toFixed(3)}em`)
    if (t.align !== 'left') add('text-align', t.align)
  } else if (n.type !== 'icon') {
    const bg = fillsCss(n.fills, true)
    if (bg) add('background', n.fills.filter((f) => f.visible).length === 1 && n.fills.find((f) => f.visible)?.kind === 'solid' ? rgba(n.fills.find((f) => f.visible)!.color, n.fills.find((f) => f.visible)!.opacity) : bg)
  }
  if (n.type === 'ellipse') add('border-radius', '50%')
  else if (n.radius.some(Boolean)) add('border-radius', radiusCss(n.radius))
  const solidStroke = n.strokes.find((s) => s.visible && s.kind === 'solid')
  if (solidStroke && n.strokeWidth > 0) {
    if (n.strokeAlign === 'center') add('border', `${n.strokeWidth}px solid ${rgba(solidStroke.color, solidStroke.opacity)}`)
    else add('outline', `${n.strokeWidth}px solid ${rgba(solidStroke.color, solidStroke.opacity)}`), add('outline-offset', n.strokeAlign === 'inside' ? `-${n.strokeWidth}px` : '0')
  }
  const fx = effectStyle({ ...n, strokes: [] })
  if (fx.boxShadow) add('box-shadow', fx.boxShadow)
  if (fx.filter) add('filter', fx.filter)
  if (fx.backdropFilter) add('backdrop-filter', fx.backdropFilter)
  if (n.opacity < 1) add('opacity', Number(n.opacity.toFixed(2)))
  if (n.rotation) add('transform', `rotate(${-n.rotation}deg)`)
  if (n.blend !== 'normal') add('mix-blend-mode', n.blend)
  if (n.clip && n.children?.length) add('overflow', 'hidden')
  return lines.join('\n')
}
