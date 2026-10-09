/* ---------------------------------------------------------------------------
   snapshotElement — rasterise a live DOM subtree (HTML + inline SVG) to a
   canvas, with no dependency (no html-to-image) and no network.

     const canvas = await snapshotElement(el, { width, height, scale: 2,
       style: { transform: 'translate(40px,40px) scale(1)' },   // override root
       filter: (n) => !n.classList?.contains('react-flow__handle'),
       background: 'var(--field)' })
     exportCanvasPNG(canvas, 'flow.png')

   How: clone the tree, inline each element's *computed* style (diffed
   against a clean iframe's defaults so the string stays small; inherited
   props are kept when they differ from the parent), embed the page's
   Inter @font-face as data URLs, wrap in <foreignObject>, draw to canvas.
   Computed styles resolve every token var(), so the snapshot matches the
   current theme exactly. Pseudo-elements and <canvas> children are skipped.
   (Promoted from shells/flows/local/snapshot.ts.)
--------------------------------------------------------------------------- */

const INHERITED = new Set([
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant', 'font-feature-settings',
  'font-variation-settings', 'font-kerning', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-indent',
  'text-transform', 'text-shadow', 'text-rendering', 'white-space', 'word-break', 'overflow-wrap', 'visibility', 'direction',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-linecap', 'stroke-linejoin', 'paint-order', 'text-anchor', 'dominant-baseline', '-webkit-font-smoothing',
  'list-style-type', 'border-collapse', 'tab-size', 'hyphens',
])
const SKIP = new Set(['cursor', 'pointer-events', 'user-select', '-webkit-user-select', 'transition', 'transition-property', 'transition-duration', 'animation', 'animation-name', 'will-change', 'caret-color'])

const ALWAYS = /^(border-(top|right|bottom|left)-width|outline-width|column-rule-width)$/

let sandbox: HTMLIFrameElement | null = null
const defaults = new Map<string, Map<string, string>>()

function defaultStyle(tag: string, ns: string | null) {
  const k = `${ns}|${tag}`
  const hit = defaults.get(k)
  if (hit) return hit
  if (!sandbox) {
    sandbox = document.createElement('iframe')
    sandbox.setAttribute('aria-hidden', 'true')
    sandbox.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;visibility:hidden;border:0'
    document.body.appendChild(sandbox)
  }
  const d = sandbox.contentDocument!
  const el = ns === 'http://www.w3.org/2000/svg' ? d.createElementNS(ns, tag) : d.createElement(tag)
  if (ns === 'http://www.w3.org/2000/svg' && tag !== 'svg') {
    const svg = d.createElementNS(ns, 'svg'); svg.appendChild(el); d.body.appendChild(svg)
  } else d.body.appendChild(el)
  const cs = sandbox.contentWindow!.getComputedStyle(el)
  const map = new Map<string, string>()
  for (let i = 0; i < cs.length; i++) map.set(cs[i], cs.getPropertyValue(cs[i]))
  ;((el as SVGElement).ownerSVGElement ?? el).remove()
  defaults.set(k, map)
  return map
}

function inlineStyles(src: Element, dst: Element, parent: CSSStyleDeclaration | null) {
  const cs = getComputedStyle(src)
  const def = defaultStyle(src.localName, src.namespaceURI)
  const out: string[] = []
  for (let i = 0; i < cs.length; i++) {
    const p = cs[i]
    if (SKIP.has(p) || p.startsWith('--')) continue
    const v = cs.getPropertyValue(p)
    // widths are always written: a 0px border with style `solid` (Tailwind preflight)
    // equals the default computed width, but would fall back to `medium` if omitted
    if (ALWAYS.test(p) || def.get(p) !== v || (INHERITED.has(p) && parent && parent.getPropertyValue(p) !== v)) out.push(`${p}:${v}`)
  }
  ;(dst as HTMLElement).setAttribute('style', out.join(';'))
  return cs
}

function cloneTree(src: Node, parent: CSSStyleDeclaration | null, filter?: (el: Element) => boolean, hide?: (el: Element) => boolean): Node | null {
  if (src.nodeType === Node.TEXT_NODE) return src.cloneNode()
  if (src.nodeType !== Node.ELEMENT_NODE) return null
  const el = src as Element
  if (filter && !filter(el)) return null
  if (el.localName === 'canvas' || el.localName === 'script' || el.localName === 'iframe') return null
  const dst = el.cloneNode(false) as Element
  const cs = inlineStyles(el, dst, parent)
  if (cs.display === 'none') return null
  // keep the box (grid/flex placement stays put) but paint nothing
  if (hide?.(el)) { (dst as HTMLElement).style.visibility = 'hidden'; return dst }
  if (el instanceof HTMLTextAreaElement) dst.textContent = el.value
  if (el instanceof HTMLInputElement) dst.setAttribute('value', el.value)
  for (const c of Array.from(el.childNodes)) {
    const k = cloneTree(c, cs, filter, hide)
    if (k) dst.appendChild(k)
  }
  return dst
}

let fontCSS: Promise<string> | null = null
const toDataURL = (b: Blob) => new Promise<string>((r) => { const f = new FileReader(); f.onload = () => r(f.result as string); f.readAsDataURL(b) })

/** The page's @font-face rules (latin subsets only) with their files inlined. */
function embedFonts(): Promise<string> {
  fontCSS ??= (async () => {
    const rules: string[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList
      try { list = sheet.cssRules } catch { continue }
      for (const r of Array.from(list)) {
        if (!(r instanceof CSSFontFaceRule)) continue
        const css = r.cssText
        if (/latin-ext|cyrillic|greek|vietnamese/.test(css)) continue
        const m = css.match(/url\(["']?([^"')]+\.woff2)["']?\)/)
        if (!m) continue
        try {
          const blob = await (await fetch(new URL(m[1], sheet.href ?? location.href))).blob()
          rules.push(css.replace(/src:[^;]+;/, `src: url(${await toDataURL(blob)}) format("woff2");`))
        } catch { /* font unavailable: fall back to system sans */ }
      }
    }
    return rules.join('\n')
  })()
  return fontCSS
}

export interface SnapshotOptions {
  width: number
  height: number
  /** device-pixel multiplier for the output */
  scale?: number
  /** css background behind the content; tokens are resolved first */
  background?: string
  /** extra inline style for the cloned root (e.g. a fit transform) */
  style?: Partial<CSSStyleDeclaration>
  /** drop these subtrees entirely */
  filter?: (el: Element) => boolean
  /** keep these boxes for layout but leave them blank (grid cells, buttons in a row) */
  hide?: (el: Element) => boolean
}

const resolveColor = (c: string) => {
  const probe = document.createElement('div')
  probe.style.color = c
  document.body.appendChild(probe)
  const v = getComputedStyle(probe).color
  probe.remove()
  return v
}

export async function snapshotElement(el: HTMLElement, o: SnapshotOptions): Promise<HTMLCanvasElement> {
  const scale = o.scale ?? 2
  const clone = cloneTree(el, getComputedStyle(el.parentElement ?? document.body), o.filter, o.hide) as HTMLElement
  if (o.style) Object.assign(clone.style, o.style)
  const fonts = await embedFonts()
  const ns = 'http://www.w3.org/1999/xhtml'
  const wrap = document.createElementNS(ns, 'div') as HTMLDivElement
  wrap.setAttribute('style', `width:${o.width}px;height:${o.height}px;position:relative;overflow:hidden;${o.background ? `background:${resolveColor(o.background)};` : ''}`)
  wrap.appendChild(clone)
  const xml = new XMLSerializer().serializeToString(wrap)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}"><defs><style>${fonts}</style></defs><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`
  const img = new Image()
  img.decoding = 'sync'
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode().catch(() => new Promise((r) => { img.onload = r }))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(o.width * scale)
  canvas.height = Math.round(o.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, o.width, o.height)
  return canvas
}
