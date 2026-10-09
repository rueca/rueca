/* ---------------------------------------------------------------------------
   Kinetic type — pure maths. layoutKinetic(v, t) returns every letter's
   transform at time t; the canvas renderer, the SVG writer and the timeline
   lanes all read from here, so they can never disagree.
--------------------------------------------------------------------------- */
import type { V } from './params'
import { FAMILIES } from './fonts'
import { cubicBezier } from './local/ease'

export interface Glyph {
  ch: string
  /** centre x, baseline y */
  x: number
  y: number
  /** vertical centre of the cap height, the pivot for rotate/scale */
  cy: number
  rot: number
  scale: number
  blur: number
  alpha: number
  wght: number
}

export interface LetterTiming { ch: string; i: number; ord: number; inStart: number; inEnd: number; outStart: number; outEnd: number; crests: number[] }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

type KV = Pick<V, 'ktext' | 'effect' | 'stagger' | 'duration' | 'hold' | 'outro' | 'order' | 'seed'>

/** Each letter's place in the sequence. */
export function orders(v: KV): number[] {
  const n = [...v.ktext].length
  const idx = Array.from({ length: n }, (_, i) => i)
  if (v.order === 'reverse') return idx.map((i) => n - 1 - i)
  if (v.order === 'centre') return idx.map((i) => Math.round(Math.abs(i - (n - 1) / 2)))
  if (v.order === 'random') {
    // seeded Fisher–Yates (mulberry32)
    let a = v.seed >>> 0
    const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
    const perm = [...idx]
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]] }
    const out = new Array(n)
    perm.forEach((letter, slot) => (out[letter] = slot))
    return out
  }
  return idx
}

export function kineticDuration(v: KV) {
  if (v.effect === 'wave') return Math.max(200, v.duration)
  const o = orders(v)
  const maxOrd = Math.max(0, ...o)
  const inLen = maxOrd * v.stagger + v.duration
  return Math.round(inLen + v.hold + (v.outro ? inLen + 350 : 600))
}

/** Per-letter timing — the SAME numbers the renderer uses; the timeline reads this. */
export function kineticTiming(v: KV): LetterTiming[] {
  const o = orders(v)
  const chars = [...v.ktext]
  const maxOrd = Math.max(0, ...o)
  const outBase = maxOrd * v.stagger + v.duration + v.hold
  const total = kineticDuration(v)
  return chars.map((ch, i) => {
    const inStart = o[i] * v.stagger
    const outStart = outBase + o[i] * v.stagger
    const crests: number[] = []
    if (v.effect === 'wave') {
      // sin peaks where (t - ord*stagger)/period = 1/4 (mod 1)
      const P = Math.max(200, v.duration)
      let c = (((o[i] * v.stagger + P / 4) % P) + P) % P
      for (; c < total; c += P) crests.push(c)
    }
    return { ch, i, ord: o[i], inStart, inEnd: inStart + v.duration, outStart, outEnd: v.outro ? outStart + v.duration : outStart, crests }
  })
}

/* --- measurement, cached per font string --- */
let mctx: CanvasRenderingContext2D | null = null
const widths = new Map<string, number>()
function measure(font: string, s: string) {
  const key = font + '|' + s
  let w = widths.get(key)
  if (w === undefined) {
    mctx ??= document.createElement('canvas').getContext('2d')!
    mctx.font = font
    w = mctx.measureText(s).width
    if (widths.size > 4000) widths.clear()
    widths.set(key, w)
  }
  return w
}
const capCache = new Map<string, number>()
function capHeight(font: string) {
  let c = capCache.get(font)
  if (c === undefined) {
    mctx ??= document.createElement('canvas').getContext('2d')!
    mctx.font = font
    c = mctx.measureText('H').actualBoundingBoxAscent
    capCache.set(font, c)
  }
  return c
}
/** Call after fonts load so cached metrics from fallback faces are dropped. */
export function clearMetrics() { widths.clear(); capCache.clear() }

export const fontString = (v: Pick<V, 'family' | 'italic'>, wght: number, size: number) =>
  `${v.italic ? 'italic ' : ''}${Math.round(Math.min(900, Math.max(100, wght)))} ${size}px ${(FAMILIES[v.family] ?? FAMILIES.inter).css}`

export function layoutKinetic(v: V, t: number, w: number, h: number): Glyph[] {
  const chars = [...v.ktext]
  if (!chars.length) return []
  const timing = kineticTiming(v)
  const ease = cubicBezier(v.curve)
  const amp = v.amplitude / 100
  const size = v.ksize
  const P = Math.max(200, v.duration)

  const states = timing.map((L) => {
    let k = 1, alpha = 1, s = 0
    if (v.effect === 'wave') {
      s = Math.sin(2 * Math.PI * ((t - L.ord * v.stagger) / P))
    } else {
      const pin = clamp01((t - L.inStart) / v.duration)
      const pout = v.outro ? clamp01((t - L.outStart) / v.duration) : 0
      k = ease(pin) - ease(pout)
      alpha = clamp01(pin * 2.2) * (1 - clamp01(pout * 2.2 - 1.2))
    }
    let wght = v.kwght, dy = 0, rot = 0, scale = 1, blur = 0
    switch (v.effect) {
      case 'wave': dy = -amp * size * 0.3 * s; break
      case 'cascade': dy = -(1 - k) * amp * size * 1.1; break
      case 'rotate': rot = (1 - k) * amp * Math.PI; dy = -(1 - k) * size * 0.15; break
      case 'scale': scale = 1 - amp + amp * k; break
      case 'blur': blur = Math.max(0, (1 - k) * amp * size * 0.22); scale = 1 + (1 - k) * 0.12 * amp; break
      case 'weight': {
        const lo = v.kwght >= 500 ? v.kwght - (v.kwght - 100) * amp : v.kwght + (900 - v.kwght) * amp
        wght = lo + (v.kwght - lo) * k
        alpha = 1
        break
      }
    }
    return { wght: Math.min(900, Math.max(100, wght)), dy, rot, scale, blur, alpha }
  })

  const base = fontString(v, v.kwght, size)
  const track = v.ktracking * size
  const adv = chars.map((ch, i) => measure(fontString(v, states[i].wght, size), ch))
  const kern = chars.map((ch, i) => (i < chars.length - 1 ? measure(base, ch + chars[i + 1]) - measure(base, ch) - measure(base, chars[i + 1]) : 0))
  const total = adv.reduce((a, b) => a + b, 0) + kern.reduce((a, b) => a + b, 0) + track * (chars.length - 1)
  const cap = capHeight(base)
  const baseline = h / 2 + cap / 2
  let x = (w - total) / 2
  return chars.map((ch, i) => {
    const g: Glyph = { ch, x: x + adv[i] / 2, y: baseline + states[i].dy, cy: baseline - cap / 2 + states[i].dy, rot: states[i].rot, scale: states[i].scale, blur: states[i].blur, alpha: states[i].alpha, wght: states[i].wght }
    x += adv[i] + kern[i] + track
    return g
  })
}

export function drawKinetic(ctx: CanvasRenderingContext2D, v: V, t: number, w: number, h: number) {
  ctx.fillStyle = v.bg
  ctx.fillRect(0, 0, w, h)
  const glyphs = layoutKinetic(v, t, w, h)
  ctx.fillStyle = v.fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  for (const g of glyphs) {
    if (g.alpha <= 0.001 || g.scale <= 0.001) continue
    ctx.save()
    ctx.globalAlpha = g.alpha
    ctx.filter = g.blur > 0.05 ? `blur(${g.blur.toFixed(2)}px)` : 'none'
    ctx.font = fontString(v, g.wght, v.ksize)
    ctx.translate(g.x, g.cy)
    ctx.rotate(g.rot)
    ctx.scale(g.scale, g.scale)
    ctx.fillText(g.ch, 0, g.y - g.cy)
    ctx.restore()
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The current frame as SVG text — one <text> per letter, live and editable in Figma/Illustrator. */
export function kineticSVG(v: V, t: number, w: number, h: number, fontFace = '') {
  const glyphs = layoutKinetic(v, t, w, h)
  const fam = FAMILIES[v.family] ?? FAMILIES.inter
  const defs: string[] = []
  const body = glyphs.map((g, i) => {
    if (g.alpha <= 0.001 || g.scale <= 0.001) return ''
    let filter = ''
    if (g.blur > 0.05) { defs.push(`<filter id="b${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${g.blur.toFixed(2)}"/></filter>`); filter = ` filter="url(#b${i})"` }
    const axes = fam.axes.wght ? ` style="font-variation-settings:'wght' ${Math.round(g.wght)}"` : ''
    return `<text transform="translate(${g.x.toFixed(2)} ${g.cy.toFixed(2)}) rotate(${((g.rot * 180) / Math.PI).toFixed(2)}) scale(${g.scale.toFixed(4)})" y="${(g.y - g.cy).toFixed(2)}" text-anchor="middle" font-weight="${Math.round(g.wght)}"${axes} opacity="${g.alpha.toFixed(3)}"${filter}>${esc(g.ch)}</text>`
  }).join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><style>${fontFace}</style>${defs.join('')}</defs>
<rect width="100%" height="100%" fill="${v.bg}"/>
<g font-family='${fam.css.replace(/'/g, '"')}' font-size="${v.ksize}" font-style="${v.italic ? 'italic' : 'normal'}" fill="${v.fg}">
  ${body}
</g>
</svg>`
}

/** The intro as plain CSS — wrap each letter in a <span>. Loops/outros need JS (or the video). */
export function kineticCSS(v: V) {
  const o = orders(v)
  const a = v.amplitude / 100
  const [x1, y1, x2, y2] = v.curve
  const lo = v.kwght >= 500 ? v.kwght - (v.kwght - 100) * a : v.kwght + (900 - v.kwght) * a
  const fromRule: Record<string, string> = {
    cascade: `transform: translateY(${-(a * 1.1).toFixed(3)}em); opacity: 0;`,
    rotate: `transform: translateY(-0.15em) rotate(${Math.round(a * 180)}deg); opacity: 0;`,
    scale: `transform: scale(${(1 - a).toFixed(3)}); opacity: 0;`,
    blur: `filter: blur(${(a * 0.22).toFixed(3)}em); transform: scale(${(1 + 0.12 * a).toFixed(3)}); opacity: 0;`,
    weight: `font-variation-settings: "wght" ${Math.round(lo)};`,
  }
  const delays = o.map((ord, i) => `.kinetic > span:nth-child(${i + 1}) { animation-delay: ${ord * v.stagger}ms; }`).join('\n')
  const head = `.kinetic { font-size: ${v.ksize}px; letter-spacing: ${v.ktracking}em; font-variation-settings: "wght" ${Math.round(v.kwght)}; }
.kinetic > span { display: inline-block; white-space: pre; }`
  if (v.effect === 'wave')
    return `${head}
.kinetic > span { animation: kinetic-wave ${v.duration}ms ease-in-out infinite; }
@keyframes kinetic-wave {
  0%, 50%, 100% { transform: translateY(0); }
  25% { transform: translateY(${-(a * 0.3).toFixed(3)}em); }
  75% { transform: translateY(${(a * 0.3).toFixed(3)}em); }
}
${o.map((ord, i) => `.kinetic > span:nth-child(${i + 1}) { animation-delay: ${-(v.duration - ((ord * v.stagger) % v.duration))}ms; }`).join('\n')}`
  return `${head}
.kinetic > span { animation: kinetic-in ${v.duration}ms cubic-bezier(${x1}, ${y1}, ${x2}, ${y2}) both; }
@keyframes kinetic-in {
  from { ${fromRule[v.effect]} }
}
${delays}`
}
