/* The hero's pen annotation, in the accent: a loose loop drawn round the headline's last
   word ("tool"), then an arrow from the loop out around the paragraph and the actions,
   pointing down at the live preview. The loop is sized from the word's real glyph bounds
   (canvas text metrics), and the arrow from the real text lines (not the column's box,
   which is wider than centred text), so the arrow never crosses text at any width. It
   stays off when there isn't room (phones, narrow tablets). Loop, line and head draw in
   one after another like a pen (landing.css .hero-arrow), once the hero has come to rest. */
import { useEffect, useRef, useState } from 'react'

type Geometry = { loop: string; line: string; head: string; w: number; h: number }

const lineRects = (el: Element) => {
  const r = document.createRange()
  r.selectNodeContents(el)
  return [...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0)
}

/** The ink box of a word, in page coordinates. */
function glyphBox(word: HTMLElement) {
  const text = word.firstChild
  if (!text || text.nodeType !== Node.TEXT_NODE) return word.getBoundingClientRect()
  const range = document.createRange()
  range.selectNodeContents(text)
  const r = range.getBoundingClientRect()
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return r
  const cs = getComputedStyle(word)
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing
  const m = ctx.measureText(word.textContent ?? '')
  if (!m.fontBoundingBoxAscent) return r
  const base = r.top + m.fontBoundingBoxAscent
  return new DOMRect(r.left - m.actualBoundingBoxLeft, base - m.actualBoundingBoxAscent,
    m.actualBoundingBoxLeft + m.actualBoundingBoxRight, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)
}

export function HeroArrow({ column, preview }: { column: React.RefObject<HTMLElement | null>; preview: React.RefObject<HTMLElement | null> }) {
  const box = useRef<HTMLDivElement>(null)
  const [g, setG] = useState<Geometry | null>(null)

  useEffect(() => {
    const measure = () => {
      const b = box.current, col = column.current, pv = preview.current
      const h1 = col?.querySelector('h1')
      const words = h1 ? [...h1.querySelectorAll<HTMLElement>('.reveal-word > span')] : []
      // offsetParent is null while the box is display:none (below md)
      if (!b || !col || !pv || !h1 || !words.length || b.offsetParent === null) return setG(null)
      const o = b.getBoundingClientRect()

      // the loop: round the last word's ink, a little more than one turn, opening out as it goes
      // and tilted a touch, so it reads as drawn by hand rather than constructed. A superellipse,
      // not an ellipse: it hugs the word's box, so in this tight leading it clears the line above
      // and the word before instead of sweeping through them
      const k = glyphBox(words[words.length - 1])
      // centred a little below the word's middle: the loop sits low, clear of the line above
      const cx = k.left + k.width / 2 - o.left, cy = k.top + k.height * 0.62 - o.top
      const rx = k.width / 2 + 14, ry = k.height / 2 + 12, n = 2.5
      const tilt = -0.04, cos = Math.cos(tilt), sin = Math.sin(tilt)
      const sp = (v: number) => Math.sign(v) * Math.abs(v) ** (2 / n)
      const at = (t: number, grow: number) => {
        const x = rx * (1 + 0.04 * grow) * sp(Math.cos(t)), y = ry * (1 + 0.1 * grow + 0.02 * Math.sin(3 * t)) * sp(Math.sin(t))
        return [cx + x * cos - y * sin, cy + x * sin + y * cos] as const
      }
      const t0 = -2.3, turn = Math.PI * 2 + 0.55, N = 96
      const loop = Array.from({ length: N + 1 }, (_, i) => at(t0 + (turn * i) / N, i / N))
        .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

      // everything the arrow must stay clear of: headline, paragraph lines, the action buttons
      const text = [...lineRects(h1), ...[...col.querySelectorAll('p')].flatMap(lineRects), ...[...col.querySelectorAll(':scope > div > *')].map((e) => e.getBoundingClientRect())]
      const R = Math.max(...text.map((q) => q.right)) - o.left
      const B = Math.max(...text.map((q) => q.bottom)) - o.top
      const P = pv.getBoundingClientRect().top - o.top

      // the arrow leaves the loop low on its right side
      const [sx, sy] = at(0.45, 1)
      // one gentle curve: out just past the text's right edge, then down onto the preview
      const X = Math.max(R + 28, sx + 16)
      const ex = X - 8, ey = P - 14
      if (X + 24 > o.width || ey - B < 56) return setG(null)

      const c1x = X + 14, c1y = sy + 22
      const c2x = X + 6, c2y = ey - (ey - sy) * 0.4
      const line = `M${sx} ${sy}C${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`
      // the head: two short strokes back along the curve's final direction
      const len = Math.hypot(ex - c2x, ey - c2y), ux = (ex - c2x) / len, uy = (ey - c2y) / len
      const wing = (a: number) => {
        const c = Math.cos(a), s = Math.sin(a)
        return `${ex - 12 * (ux * c - uy * s)} ${ey - 12 * (ux * s + uy * c)}`
      }
      setG({ loop, line, head: `M${wing(0.5)}L${ex} ${ey}L${wing(-0.5)}`, w: o.width, h: ey + 16 })
    }
    // Measure once, after the hero has come to rest: the words rise in (transforms move their
    // rects) and the fonts swap, so a loop measured earlier would draw in one place and then
    // jump. So: wait for the fonts, for the reveal to start on the headline and the preview,
    // then for those entrance animations to finish. After that, only a resize re-measures.
    let alive = true, settled = false
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const begun = (el: Element | null | undefined) => !document.documentElement.hasAttribute('data-reveals') || !el || el.hasAttribute('data-in')
    ;(async () => {
      await document.fonts?.ready
      for (let i = 0; i < 180 && alive; i++) {
        if (begun(column.current?.querySelector('[data-reveal]')) && begun(preview.current?.querySelector('[data-reveal]'))) break
        await frame()
      }
      // only what moves things: the hero text, and the preview's own rise (not the fades inside it)
      const anims = [...(column.current?.getAnimations({ subtree: true }) ?? []), ...(preview.current?.querySelector('[data-reveal]')?.getAnimations() ?? [])]
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
      await Promise.allSettled(anims.map((a) => a.finished))
      if (!alive) return
      settled = true
      measure()
    })()
    const ro = new ResizeObserver(() => { if (settled) measure() })
    if (box.current) ro.observe(box.current)
    if (column.current) ro.observe(column.current)
    return () => { alive = false; ro.disconnect() }
  }, [column, preview])

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0 z-[2] hidden md:block">
      {g && (
        <svg className="hero-arrow absolute top-0 left-0 overflow-visible text-signal" width={g.w} height={g.h}
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={g.loop} pathLength={1} className="hero-arrow-loop" />
          <path d={g.line} pathLength={1} className="hero-arrow-line" />
          <path d={g.head} pathLength={1} className="hero-arrow-head" />
        </svg>
      )}
    </div>
  )
}
