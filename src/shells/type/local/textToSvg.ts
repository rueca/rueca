/* ---------------------------------------------------------------------------
   domTextToSVG — serialise live DOM typography into a faithful SVG, and
   rasterise it to PNG. For artboards that are real HTML (editable text,
   CSS layout) but must export as vector.

     const svg = await domTextToSVG(artboardEl, { width, height, background, fonts })
     download(new Blob([svg], { type: 'image/svg+xml' }), 'specimen.svg')
     await svgToPNG(svg, width, height, 2)   // → Blob

   How: every element marked `data-svg-text` is measured with Range rects,
   one per character, so the browser's own line breaking, justification,
   kerning and wrapping are reproduced exactly. Words become <tspan x>,
   lines become <text>. Each element keeps its computed font, variation
   settings, letter-spacing, colour, case and CSS transform (scale/skew). The
   artboard's camera zoom is factored out. Elements marked `data-svg-box`
   contribute their background and borders as <rect>s (rules, swatches). Fonts passed in `fonts` are
   embedded as data URIs so the file renders identically anywhere (and so
   the PNG rasteriser — which can't see document fonts — gets them too).

   Kit candidate: io.ts has exportSVG(svgElement) only; DOM artboards have no
   vector path today.
--------------------------------------------------------------------------- */

export interface EmbedFont { family: string; dataURI: string; style?: 'normal' | 'italic'; weight?: string }
export interface SvgOptions { width: number; height: number; background?: string; fonts?: EmbedFont[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function applyCase(s: string, mode: string) {
  if (mode === 'uppercase') return s.toUpperCase()
  if (mode === 'lowercase') return s.toLowerCase()
  if (mode === 'capitalize') return s.replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
  return s
}

function colorAttrs(css: string, attr = 'fill') {
  const m = css.match(/rgba?\(([^)]+)\)/)
  if (!m) return `${attr}="${css}"`
  const [r, g, b, a] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
  return `${attr}="rgb(${r},${g},${b})"${a !== undefined && a < 1 ? ` ${attr}-opacity="${a}"` : ''}`
}

let mctx: CanvasRenderingContext2D | null = null
/** ascent / (ascent + descent) of the font's content box — puts the baseline inside a char rect. */
function ascentRatio(cs: CSSStyleDeclaration) {
  mctx ??= document.createElement('canvas').getContext('2d')!
  mctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`
  const m = mctx.measureText('Hg')
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent
  return a && d ? a / (a + d) : 0.8
}

interface Word { text: string; x: number; top: number; height: number }

function measureWords(el: HTMLElement, origin: DOMRect, zoom: number, clip: DOMRect | null): Word[] {
  const words: Word[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let cur: Word | null = null
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const s = node.data
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (/\s/.test(ch)) { cur = null; continue }
      // keep surrogate pairs together
      const len = ch.charCodeAt(0) >= 0xd800 && ch.charCodeAt(0) <= 0xdbff ? 2 : 1
      range.setStart(node, i)
      range.setEnd(node, i + len)
      const r = range.getClientRects()[0]
      const glyph = s.slice(i, i + len)
      i += len - 1
      if (!r) continue
      // glyphs scrolled out of an overflow:hidden box are not visible — leave them out
      if (clip && (r.left >= clip.right - 0.5 || r.right > clip.right + 1 || r.top >= clip.bottom)) { cur = null; continue }
      const x = (r.left - origin.left) / zoom, top = (r.top - origin.top) / zoom, height = r.height / zoom
      // a soft wrap inside a word (no whitespace) still starts a new line
      if (cur && Math.abs(top - cur.top) > height * 0.5) cur = null
      if (!cur) { cur = { text: '', x, top, height }; words.push(cur) }
      cur.text += glyph
    }
  }
  return words
}

export async function domTextToSVG(root: HTMLElement, o: SvgOptions): Promise<string> {
  const rootRect = root.getBoundingClientRect()
  const zoom = rootRect.width / root.offsetWidth || 1
  const blocks: string[] = []

  // boxes first (backgrounds and borders of elements marked data-svg-box), text on top
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-svg-box]'))) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect()
    const x = (r.left - rootRect.left) / zoom, y = (r.top - rootRect.top) / zoom, w = r.width / zoom, h = r.height / zoom
    const rect = (rx: number, ry: number, rw: number, rh: number, color: string) => blocks.push(`<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" ${colorAttrs(color)}/>`)
    const visible = (c: string) => c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c)
    if (visible(cs.backgroundColor)) rect(x, y, w, h, cs.backgroundColor)
    const bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth), bl = parseFloat(cs.borderLeftWidth), br = parseFloat(cs.borderRightWidth)
    if (bt && visible(cs.borderTopColor)) rect(x, y, w, bt, cs.borderTopColor)
    if (bb && visible(cs.borderBottomColor)) rect(x, y + h - bb, w, bb, cs.borderBottomColor)
    if (bl && visible(cs.borderLeftColor)) rect(x, y, bl, h, cs.borderLeftColor)
    if (br && visible(cs.borderRightColor)) rect(x + w - br, y, br, h, cs.borderRightColor)
  }

  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-svg-text]'))) {
    const cs = getComputedStyle(el)
    // measure untransformed, then re-apply the transform in SVG
    const prev = el.style.transform
    const transform = cs.transform
    const tOrigin = cs.transformOrigin.split(' ').map(parseFloat)
    el.style.transform = 'none'
    const elRect = el.getBoundingClientRect()
    const clips = cs.overflowX === 'hidden' || cs.overflowX === 'clip'
    const words = measureWords(el, rootRect, zoom, clips ? elRect : null)
    el.style.transform = prev
    if (!words.length) continue

    const asc = ascentRatio(cs)
    const lines: Word[][] = []
    for (const w of words) {
      const line = lines.at(-1)
      if (line && Math.abs(line[0].top - w.top) < w.height * 0.5) line.push(w)
      else lines.push([w])
    }
    const caseMode = cs.textTransform
    const ls = parseFloat(cs.letterSpacing) || 0
    const fvs = cs.fontVariationSettings !== 'normal' ? `font-variation-settings:${cs.fontVariationSettings.replace(/"/g, "'")};` : ''
    const style = `font-family:${cs.fontFamily.replace(/"/g, "'")};font-size:${parseFloat(cs.fontSize)}px;font-weight:${cs.fontWeight};font-style:${cs.fontStyle};${fvs}${ls ? `letter-spacing:${ls}px;` : ''}${cs.fontVariantNumeric !== 'normal' ? `font-variant-numeric:${cs.fontVariantNumeric};` : ''}${cs.fontFeatureSettings !== 'normal' ? `font-feature-settings:${cs.fontFeatureSettings.replace(/"/g, "'")};` : ''}font-kerning:normal`
    const texts = lines.map((line) => {
      const y = line[0].top + line[0].height * asc
      const spans = line.map((w) => `<tspan x="${w.x.toFixed(2)}">${esc(applyCase(w.text, caseMode))}</tspan>`).join('')
      return `<text y="${y.toFixed(2)}">${spans}</text>`
    }).join('\n    ')

    let g = `<g style="${style}" ${colorAttrs(cs.color)}>\n    ${texts}\n  </g>`
    if (transform && transform !== 'none') {
      const m = transform.match(/matrix\(([^)]+)\)/)
      if (m) {
        const ox = (elRect.left - rootRect.left) / zoom + (tOrigin[0] || 0)
        const oy = (elRect.top - rootRect.top) / zoom + (tOrigin[1] || 0)
        g = `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) matrix(${m[1]}) translate(${(-ox).toFixed(2)} ${(-oy).toFixed(2)})">${g}</g>`
      }
    }
    blocks.push(g)
  }

  const faces = (o.fonts ?? []).map((f) => `@font-face{font-family:'${f.family}';src:url(${f.dataURI}) format('woff2');font-weight:${f.weight ?? '100 900'};font-style:${f.style ?? 'normal'}}`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">
  <defs><style>${faces}</style></defs>
  ${o.background ? `<rect width="100%" height="100%" fill="${o.background}"/>` : ''}
  ${blocks.join('\n  ')}
</svg>`
}

/** Rasterise an SVG string. Fonts must be embedded (data URIs) — an SVG image can't see document fonts. */
export async function svgToPNG(svg: string, width: number, height: number, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    const c = document.createElement('canvas')
    c.width = Math.round(width * scale)
    c.height = Math.round(height * scale)
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}
