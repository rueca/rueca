/* ---------------------------------------------------------------------------
   Layout engine. One pass turns the node tree into absolute world boxes.
   The DOM renderer, the canvas exporter, hit-testing, snapping and the
   inspector all read the same boxes — so what you export is what you see.

   Auto layout is a small flexbox: direction, gap (or space-between),
   per-edge padding, spatial 3×3 alignment, and Fixed / Hug / Fill sizing.
   Text is measured with canvas metrics and wrapped here, so the DOM never
   wraps on its own and the PNG export matches pixel for pixel.
--------------------------------------------------------------------------- */
import type { Box, Node, Page, TextStyle } from './types'

export const FONTS: { value: string; label: string; css: string }[] = [
  { value: 'Inter', label: 'Inter', css: '"Inter Variable", Inter, system-ui, sans-serif' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans', css: '"IBM Plex Sans Variable", "IBM Plex Sans", system-ui, sans-serif' },
  { value: 'Newsreader', label: 'Newsreader', css: '"Newsreader Variable", Newsreader, Georgia, serif' },
  { value: 'La Belle Aurore', label: 'La Belle Aurore', css: '"La Belle Aurore", cursive' },
  { value: 'SF Pro', label: 'SF Pro', css: '-apple-system, system-ui, "Segoe UI", sans-serif' },
  { value: 'Helvetica Neue', label: 'Helvetica Neue', css: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { value: 'Georgia', label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  { value: 'Menlo', label: 'Menlo', css: 'Menlo, "SF Mono", ui-monospace, monospace' },
]
export const fontCss = (family: string) => FONTS.find((f) => f.value === family)?.css ?? FONTS[0].css
export const lineHeightOf = (t: TextStyle) => (t.lineHeight > 0 ? t.lineHeight : Math.round(t.size * 1.25))

/* --- text measurement ---------------------------------------------------- */
let mctx: CanvasRenderingContext2D | null = null
const cache = new Map<string, { lines: string[]; w: number }>()
export const clearMeasureCache = () => cache.clear()

export function setFont(ctx: CanvasRenderingContext2D, t: TextStyle) {
  ctx.font = `${t.weight} ${t.size}px ${fontCss(t.family)}`
  ;(ctx as any).letterSpacing = `${(t.letterSpacing / 100) * t.size}px`
}

/** Wrap text to a width (Infinity = no wrapping). Returns lines and the widest line. */
export function wrapText(t: TextStyle, width: number): { lines: string[]; w: number } {
  const key = `${t.content}|${t.family}|${t.weight}|${t.size}|${t.letterSpacing}|${width}`
  const hit = cache.get(key)
  if (hit) return hit
  if (!mctx) mctx = document.createElement('canvas').getContext('2d')!
  setFont(mctx, t)
  const measure = (s: string) => mctx!.measureText(s).width
  const lines: string[] = []
  let w = 0
  for (const para of t.content.split('\n')) {
    if (!Number.isFinite(width)) { lines.push(para); w = Math.max(w, measure(para)); continue }
    const words = para.split(/(\s+)/)
    let line = ''
    for (const word of words) {
      const next = line + word
      if (line && measure(next.trimEnd()) > width + 0.5) {
        lines.push(line.trimEnd())
        w = Math.max(w, measure(line.trimEnd()))
        line = word.trimStart()
        // a single word wider than the box: break by character
        while (measure(line) > width && line.length > 1) {
          let i = line.length - 1
          while (i > 1 && measure(line.slice(0, i)) > width) i--
          lines.push(line.slice(0, i)); w = Math.max(w, measure(line.slice(0, i)))
          line = line.slice(i)
        }
      } else line = next
    }
    lines.push(line.trimEnd())
    w = Math.max(w, measure(line.trimEnd()))
  }
  const out = { lines, w: Math.ceil(w) }
  if (cache.size > 2000) cache.clear()
  cache.set(key, out)
  return out
}

export function textLines(n: Node, width: number) {
  const t = n.text!
  return wrapText(t, t.resize === 'auto-width' ? Infinity : width).lines
}

/* --- sizing --------------------------------------------------------------- */
type Size = { w: number; h: number }

/** A node's size, given what its parent imposes (fill/stretch). */
export function sizeOf(n: Node, wIn?: number, hIn?: number): Size {
  if (n.type === 'text' && n.text) {
    const t = n.text
    if (wIn === undefined && t.resize === 'auto-width') {
      const m = wrapText(t, Infinity)
      return { w: Math.max(1, m.w), h: hIn ?? m.lines.length * lineHeightOf(t) }
    }
    const w = wIn ?? n.w
    if (t.resize === 'fixed') return { w, h: hIn ?? n.h }
    return { w, h: hIn ?? wrapText(t, w).lines.length * lineHeightOf(t) }
  }
  const L = n.type === 'frame' ? n.layout : null
  if (!L) return { w: wIn ?? n.w, h: hIn ?? n.h }
  const hugW = wIn === undefined && n.sizingW === 'hug'
  const hugH = hIn === undefined && n.sizingH === 'hug'
  let w = wIn ?? n.w
  let h = hIn ?? n.h
  if (hugW) w = flow(n, undefined, undefined).cw
  if (hugH) h = flow(n, w, undefined).ch
  return { w, h }
}

interface Flow { boxes: { node: Node; x: number; y: number; w: number; h: number }[]; cw: number; ch: number }

/** Place the children of an auto-layout frame inside a W×H box (undefined = hug). */
export function flow(n: Node, W: number | undefined, H: number | undefined): Flow {
  const L = n.layout!
  const [pt, pr, pb, pl] = L.pad
  const kids = (n.children ?? []).filter((k) => k.visible)
  const row = L.dir === 'row'
  const innerW = W !== undefined ? Math.max(0, W - pl - pr) : undefined
  const innerH = H !== undefined ? Math.max(0, H - pt - pb) : undefined
  const mainInner = row ? innerW : innerH
  const crossInner = row ? innerH : innerW
  const gaps = Math.max(0, kids.length - 1) * (L.between ? 0 : L.gap)

  const fillMain = (k: Node) => (row ? k.sizingW : k.sizingH) === 'fill' && mainInner !== undefined
  const fillCross = (k: Node) => (row ? k.sizingH : k.sizingW) === 'fill' && crossInner !== undefined
  const sized = (k: Node, main?: number) => {
    const cross = fillCross(k) ? crossInner : undefined
    return row ? sizeOf(k, main, cross) : sizeOf(k, cross, main)
  }

  // fixed / hug children first, then share what is left between the fills
  const sizes: Size[] = kids.map((k) => (fillMain(k) ? { w: 0, h: 0 } : sized(k)))
  const fixedMain = sizes.reduce((s, z, i) => s + (fillMain(kids[i]) ? 0 : row ? z.w : z.h), 0)
  const fills = kids.filter(fillMain).length
  if (fills) {
    const share = Math.max(0, (mainInner! - fixedMain - (L.between ? 0 : gaps)) / fills)
    kids.forEach((k, i) => { if (fillMain(k)) sizes[i] = sized(k, share) })
  }
  const sumMain = sizes.reduce((s, z) => s + (row ? z.w : z.h), 0)
  const maxCross = sizes.reduce((m, z) => Math.max(m, row ? z.h : z.w), 0)
  // a hug parent with fill-cross children stretches them to the tallest sibling
  if (crossInner === undefined)
    kids.forEach((k, i) => {
      if ((row ? k.sizingH : k.sizingW) === 'fill') sizes[i] = row ? { ...sizes[i], h: maxCross } : { ...sizes[i], w: maxCross }
    })

  const contentMain = sumMain + gaps
  const mainSpace = mainInner ?? contentMain
  const crossSpace = crossInner ?? maxCross
  const mainAlign = row ? L.alignX : L.alignY
  const crossAlign = row ? L.alignY : L.alignX
  let gap = L.gap
  let cursor = 0
  if (L.between && kids.length > 1) gap = Math.max(0, (mainSpace - sumMain) / (kids.length - 1))
  else if (L.between) cursor = (mainSpace - sumMain) / 2
  else cursor = mainAlign === 'center' ? (mainSpace - contentMain) / 2 : mainAlign === 'end' ? mainSpace - contentMain : 0

  const boxes = kids.map((k, i) => {
    const z = sizes[i]
    const m = row ? z.w : z.h
    const c = row ? z.h : z.w
    const co = crossAlign === 'center' ? (crossSpace - c) / 2 : crossAlign === 'end' ? crossSpace - c : 0
    const b = row ? { node: k, x: pl + cursor, y: pt + co, w: z.w, h: z.h } : { node: k, x: pl + co, y: pt + cursor, w: z.w, h: z.h }
    cursor += m + gap
    return b
  })
  const cw = row ? contentMain + pl + pr : maxCross + pl + pr
  const ch = row ? maxCross + pt + pb : contentMain + pt + pb
  return { boxes, cw: W ?? cw, ch: H ?? ch }
}

/* --- the whole page ------------------------------------------------------- */
export type LayoutMap = Map<string, Box>

function arrange(n: Node, x: number, y: number, w: number, h: number, out: LayoutMap) {
  out.set(n.id, { x, y, w, h })
  if (!n.children?.length) return
  if (n.type === 'frame' && n.layout) {
    const f = flow(n, w, h)
    for (const b of f.boxes) arrange(b.node, x + b.x, y + b.y, b.w, b.h, out)
    // hidden children keep a box so the layer panel can still select them
    for (const k of n.children) if (!k.visible && !out.has(k.id)) { const s = sizeOf(k); arrange(k, x + k.x, y + k.y, s.w, s.h, out) }
  } else {
    for (const k of n.children) { const s = sizeOf(k); arrange(k, x + k.x, y + k.y, s.w, s.h, out) }
  }
}

/* Memoised by tree identity: an untouched page never re-lays out. Bumping the
   font epoch (when web fonts finish loading) invalidates every entry. */
const memo = new WeakMap<Node[], { epoch: number; map: LayoutMap }>()
let fontEpoch = 0
export const bumpFontEpoch = () => { fontEpoch++; clearMeasureCache() }

export function layoutNodes(nodes: Node[]): LayoutMap {
  const hit = memo.get(nodes)
  if (hit && hit.epoch === fontEpoch) return hit.map
  const map: LayoutMap = new Map()
  for (const n of nodes) { const s = sizeOf(n); arrange(n, n.x, n.y, s.w, s.h, map) }
  memo.set(nodes, { epoch: fontEpoch, map })
  return map
}
export const layoutPage = (page: Page) => layoutNodes(page.nodes)

export function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const b of boxes) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h) }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const contains = (b: Box, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
export const intersects = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
