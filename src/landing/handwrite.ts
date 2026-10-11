/* Handwriting that writes itself (the pen in <Hand>, plate.tsx). A font has no stroke order,
   only filled outlines, so a wipe reads as a reveal, not a pen. Each string is rendered once in its
   hand on a canvas, the ink is thinned to its centreline (Zhang–Suen), the centreline is traced into
   pen strokes in writing order, and those strokes, drawn at the pen's speed, mask the real text. The
   letterforms stay the font's own; only the order they appear in is the pen's.
   - Order: pieces left to right, each from its top-left; through every join the pen carries on the
     way it was heading (over the knots thinning leaves, within a nib's reach); after a lift it goes
     back to the leftmost stroke still to do; dots wait until after their word.
   - Timing: a steady pen, a quick slide back along ink it has just laid (down an i's stem), a beat
     when it leaves the paper, and never more than `most` seconds for the whole string.
   Trial and stroke debugger: brand/illustration-trials/handwriting/. */
import { useEffect, type RefObject } from 'react'

type Pt = [number, number]
type Edge = { pts: Pt[]; a: number; b: number; len: number }
export type Strokes = { width: number; height: number; x: number; baseline: number; advance: number; size: number; thickness: number; strokes: Pt[][] }

const SCALE = 4 // rendered 4× up, so the skeleton has room at small sizes

/** The pen strokes for `text` in `font` (a CSS font-family list) at `size` px, in the order they're written. */
export async function strokesOf(text: string, font: string, size: number): Promise<Strokes> {
  const px = size * SCALE, spec = `${px}px ${font}`
  await document.fonts.load(spec, text)
  const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true })!
  g.font = spec
  const m = g.measureText(text), pad = Math.ceil(px * 0.12)
  const left = Math.ceil(m.actualBoundingBoxLeft) + pad, ascent = Math.ceil(m.actualBoundingBoxAscent) + pad
  const W = Math.ceil(left + m.actualBoundingBoxRight + pad), H = Math.ceil(ascent + m.actualBoundingBoxDescent + pad)
  c.width = W; c.height = H
  g.font = spec; g.fillStyle = '#000'; g.fillText(text, left, ascent)
  const alpha = g.getImageData(0, 0, W, H).data, img = new Uint8Array(W * H)
  let ink = 0
  for (let i = 0; i < W * H; i++) if (alpha[i * 4 + 3] > 110) { img[i] = 1; ink++ }
  thin(img, W, H)
  unstair(img, W, H)
  let bones = 0
  for (let i = 0; i < W * H; i++) bones += img[i]
  const thickness = bones ? ink / bones : 1 // the ink's mean width, in canvas px
  const strokes = order(trace(img, W, H), thickness, px).map((pts) => simplify(pts, 0.7).map(([x, y]): Pt => [x / SCALE, y / SCALE]))
  return { width: W / SCALE, height: H / SCALE, x: left / SCALE, baseline: ascent / SCALE, advance: m.width / SCALE, size, thickness: thickness / SCALE, strokes }
}

// ── thinning: Zhang–Suen, then the staircase corners it leaves, so every path pixel has two neighbours ──
function thin(p: Uint8Array, W: number, H: number) {
  const gone: number[] = []
  for (let changed = true; changed;) {
    changed = false
    for (let step = 0; step < 2; step++) {
      gone.length = 0
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x
        if (!p[i]) continue
        const n = p[i - W], ne = p[i - W + 1], e = p[i + 1], se = p[i + W + 1], s = p[i + W], sw = p[i + W - 1], w = p[i - 1], nw = p[i - W - 1]
        const b = n + ne + e + se + s + sw + w + nw
        if (b < 2 || b > 6) continue
        const a = +(!n && !!ne) + +(!ne && !!e) + +(!e && !!se) + +(!se && !!s) + +(!s && !!sw) + +(!sw && !!w) + +(!w && !!nw) + +(!nw && !!n)
        if (a !== 1) continue
        if (step === 0 ? n * e * s || e * s * w : n * e * w || n * s * w) continue
        gone.push(i)
      }
      for (const i of gone) p[i] = 0
      if (gone.length) changed = true
    }
  }
}
function unstair(p: Uint8Array, W: number, H: number) {
  // a pixel whose only neighbours are two orthogonal ones that touch each other diagonally (plus,
  // at most, that diagonal) is a staircase corner: its neighbours stay joined without it
  const turns = [[-W, 1, -W + 1], [1, W, W + 1], [W, -1, W - 1], [-1, -W, -W - 1]]
  const around = [-W - 1, -W, -W + 1, 1, W + 1, W, W - 1, -1]
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (!p[i]) continue
    for (const [a, b, d] of turns) {
      if (!p[i + a] || !p[i + b]) continue
      if (around.every((o) => !p[i + o] || o === a || o === b || o === d)) { p[i] = 0; break }
    }
  }
}

// ── tracing: the skeleton as a graph, ends and joins as nodes, the runs between them as edges ──
function trace(p: Uint8Array, W: number, H: number): Edge[] {
  const around = [-W - 1, -W, -W + 1, 1, W + 1, W, W - 1, -1]
  const near = (i: number) => around.map((o) => i + o).filter((j) => j >= 0 && j < W * H && p[j] && Math.abs((j % W) - (i % W)) <= 1)
  const degree = new Map<number, number>(), at = (i: number): Pt => [i % W, (i / W) | 0]
  for (let i = 0; i < W * H; i++) if (p[i]) degree.set(i, near(i).length)
  const seen = new Set<number>(), key = (a: number, b: number) => (a < b ? a * W * H + b : b * W * H + a), walked = new Set<number>()
  const paths: number[][] = []
  const walk = (from: number, to: number) => {
    const path = [from, to]
    seen.add(key(from, to))
    let prev = from, cur = to
    while (degree.get(cur) === 2) {
      walked.add(cur)
      const next = near(cur).find((j) => j !== prev && !seen.has(key(cur, j)))
      if (next === undefined) break
      seen.add(key(cur, next))
      path.push(next); prev = cur; cur = next
    }
    return path
  }
  for (const [i, d] of degree) if (d !== 2) for (const j of near(i)) if (!seen.has(key(i, j))) paths.push(walk(i, j))
  // a full stop thins to a single pixel: keep it as a dot
  for (const [i, d] of degree) if (d === 0) paths.push([i, i])
  // closed loops with no end or join (an o, a 0)
  for (const [i, d] of degree) {
    if (d !== 2 || walked.has(i)) continue
    const j = near(i)[0]
    if (j === undefined || seen.has(key(i, j))) continue
    paths.push(walk(i, j))
  }
  return paths.map((path) => ({ pts: path.map(at), a: path[0], b: path[path.length - 1], len: path.length }))
}

// ── order: how a hand would write it ──
function order(edges: Edge[], thickness: number, px: number): Pt[][] {
  // drop the burrs thinning leaves at stroke ends: short runs from a join out to a dead end
  const ends = new Map<number, number>()
  const count = () => { ends.clear(); for (const e of edges) for (const n of [e.a, e.b]) ends.set(n, (ends.get(n) ?? 0) + 1) }
  count()
  edges = edges.filter((e) => !(e.len < thickness * 1.6 && e.a !== e.b && (ends.get(e.a) === 1) !== (ends.get(e.b) === 1)))
  // the pieces that touch (union–find over their nodes)
  const root = new Map<number, number>(), find = (n: number) => { while (root.get(n) !== n) n = root.get(n)!; return n }
  for (const e of edges) for (const n of [e.a, e.b]) if (!root.has(n)) root.set(n, n)
  for (const e of edges) root.set(find(e.a), find(e.b))
  const groups = new Map<number, Edge[]>()
  for (const e of edges) { const r = find(e.a); if (!groups.has(r)) groups.set(r, []); groups.get(r)!.push(e) }
  type Piece = { list: Edge[]; x0: number; x1: number; len: number }
  const pieces: Piece[] = [...groups.values()].map((list) => {
    const xs = list.flatMap((e) => e.pts.map(([x]) => x))
    return { list, x0: Math.min(...xs), x1: Math.max(...xs), len: list.reduce((s, e) => s + e.len, 0) }
  })
  // a dot (small) is made after the word it sits in, as the pen lifts at the end
  const small = (q: Piece) => q.len < Math.max(thickness * 3, px * 0.07)
  const words: { x0: number; x1: number; items: Piece[] }[] = []
  for (const q of pieces.filter((q) => !small(q)).sort((a, b) => a.x0 - b.x0)) {
    const w = words[words.length - 1]
    if (w && q.x0 - w.x1 < px * 0.3) { w.items.push(q); w.x1 = Math.max(w.x1, q.x1) } else words.push({ x0: q.x0, x1: q.x1, items: [q] })
  }
  for (const q of pieces.filter(small).sort((a, b) => a.x0 - b.x0)) {
    const mid = (q.x0 + q.x1) / 2, w = words.find((w) => mid <= w.x1 + px * 0.15) ?? words[words.length - 1]
    if (w) w.items.push(q); else words.push({ x0: q.x0, x1: q.x1, items: [q] })
  }
  return words.flatMap((w) => w.items.flatMap((q) => pen(q.list, Math.max(2.5, thickness * 0.9))))
}

/** one connected piece as pen-down runs: start near its top-left and keep going, into whichever
    unused run starts under the nib (within `reach`, so the knots thinning leaves at joins don't stop
    the pen) and carries on the way it was heading; lift to the leftmost run left when nothing does */
function pen(list: Edge[], reach: number): Pt[][] {
  const used = new Set<Edge>(), runs: Pt[][] = []
  const head = (e: Edge, end: boolean) => (end ? e.pts[e.pts.length - 1] : e.pts[0])
  const dir = (pts: Pt[]): Pt => { const k = Math.min(pts.length - 1, 8), [x0, y0] = pts[0], [x1, y1] = pts[k], l = Math.hypot(x1 - x0, y1 - y0) || 1; return [(x1 - x0) / l, (y1 - y0) / l] }
  const degree = new Map<number, number>()
  for (const e of list) for (const n of [e.a, e.b]) degree.set(n, (degree.get(n) ?? 0) + 1)
  while (used.size < list.length) {
    // start where a hand would: a new piece near its top-left; after a lift, the stroke still to do
    // that's furthest left, so nothing is skipped and filled in later. Scored left first, then high
    // (letters start at their top-left; an e's tail or a t's bar doesn't), and a new piece leans to a
    // free end, where a pen can come down
    const starts = list.filter((e) => !used.has(e)).flatMap((e) => [{ e, end: false, dead: degree.get(e.a) === 1 }, { e, end: true, dead: degree.get(e.b) === 1 }])
    const score = (o: (typeof starts)[number]) => { const [x, y] = head(o.e, o.end); return x + 0.35 * y - (!runs.length && o.dead ? reach * 2 : 0) }
    const first = starts.reduce((m, o) => (score(o) < score(m) ? o : m))
    let pts = first.end ? [...first.e.pts].reverse() : first.e.pts
    const run = [...pts]
    used.add(first.e)
    for (;;) {
      const [x, y] = run[run.length - 1], back = dir([...pts].reverse()), heading = [-back[0], -back[1]]
      const options: { e: Edge; pts: Pt[] }[] = []
      for (const e of list) {
        if (used.has(e)) continue
        for (const end of [false, true]) {
          const [hx, hy] = head(e, end)
          if (Math.hypot(hx - x, hy - y) <= reach) options.push({ e, pts: end ? [...e.pts].reverse() : e.pts })
        }
      }
      if (!options.length) break
      const along = (o: { pts: Pt[] }) => { const d = dir(o.pts); return d[0] * heading[0] + d[1] * heading[1] }
      const next = options.reduce((m, o) => (along(o) > along(m) ? o : m))
      used.add(next.e)
      pts = next.pts
      run.push(...pts.slice(1))
    }
    if (run.length > 1) runs.push(run)
  }
  return runs
}

// Ramer–Douglas–Peucker, in canvas px
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts
  const a = pts[0], b = pts[pts.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1])
  let far = 0, at = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], d = l ? Math.abs((b[0] - a[0]) * (a[1] - y) - (a[0] - x) * (b[1] - a[1])) / l : Math.hypot(x - a[0], y - a[1])
    if (d > far) { far = d; at = i }
  }
  return far > eps ? [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)] : [a, b]
}
const lengthOf = (pts: Pt[]) => pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0)
const segDist = ([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt) => {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

type Timed = { d: string; len: number; at: number; dur: number }
/** When each of the pen's strokes runs, in seconds. `speed` is the pen's, in px a second, raised if
    need be so the whole string takes no more than `most` seconds; `lift` is the beat when the pen
    leaves the paper. */
export function timeline(s: Strokes, { speed = 200 * (s.size / 24), most = 2.4, lift = 0.12 } = {}) {
  const strokes = s.strokes.map((pts): Pt[] => (lengthOf(pts) < 0.3 ? [pts[0], [pts[0][0] + 0.3, pts[0][1]]] : pts)) // a dot: a dab of the nib
  // between runs the pen either slides back along ink it has just laid (back down an i's stem to the
  // join) or leaves the paper: a slide is quick, a lift is a beat
  const inked = (q: Pt, drawn: Pt[][]) => drawn.some((pts) => pts.some((a, i) => i > 0 && segDist(q, pts[i - 1], a) < s.thickness * 1.5))
  const moves = strokes.map((pts, i): { slide?: number; lift?: boolean } => {
    if (!i) return {}
    const from = strokes[i - 1][strokes[i - 1].length - 1], gap = Math.hypot(pts[0][0] - from[0], pts[0][1] - from[1])
    if (gap <= s.thickness * 3) return {}
    return inked(pts[0], strokes.slice(0, i)) ? { slide: gap } : { lift: true }
  })
  const ink = strokes.reduce((t, pts) => t + lengthOf(pts), 0), slid = moves.reduce((t, m) => t + (m.slide ?? 0), 0)
  const lifts = moves.filter((m) => m.lift).length
  const v = Math.max(speed, (ink + slid / 3) / Math.max(0.2, most - lifts * lift))
  let t = 0
  const timed = strokes.map((pts, i): Timed => {
    const m = moves[i]
    if (m.lift) t += lift
    else if (m.slide) t += m.slide / (v * 3)
    const len = lengthOf(pts), dur = len / v, at = t
    t += dur
    return { d: 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L'), len, at, dur }
  })
  return { strokes: timed, total: t }
}

let uid = 0
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
/** The text as an SVG whose mask strokes carry their timing (--len, --at, --for), for CSS to write
    (plate.css). */
export function writtenSvg(text: string, s: Strokes, options: Parameters<typeof timeline>[1] & { debug?: boolean } = {}) {
  const id = `hw-${++uid}`, width = (s.thickness * 1.7 + 1.4).toFixed(2)
  const { strokes, total } = timeline(s, options)
  const paths = strokes.map((k) => `<path d="${k.d}" style="--len:${(k.len + 1).toFixed(2)};--at:${k.at.toFixed(3)}s;--for:${k.dur.toFixed(3)}s"/>`)
  const svg = `<svg class="hw" role="img" aria-label="${esc(text)}" viewBox="0 0 ${s.width.toFixed(2)} ${s.height.toFixed(2)}" width="${s.width.toFixed(2)}" height="${s.height.toFixed(2)}" style="--hw-total:${total.toFixed(3)}s">`
    + `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${s.width}" height="${s.height}"><g class="hw-pen" stroke-width="${width}">${paths.join('')}</g></mask>`
    + `<text x="${s.x}" y="${s.baseline}" font-size="${s.size}" mask="url(#${id})">${esc(text)}</text>`
    + (options.debug ? `<g class="hw-debug">${paths.join('')}</g>` : '')
    + `</svg>`
  return { svg, duration: total }
}

/* The pen in the drawings (art/*.ts, generated with each mark set in a .rueca-marks group carrying its
   write progress, --pw). Each note's strokes are traced as above; each arrow or loop is its own stroke,
   one per sub-path. Every mark in a set gets a mask of those strokes, timed as fractions of the set's
   whole run (--a, --f), so iso.css draws each one as --pw passes it: the note, then its arrow. */
const NS = 'http://www.w3.org/2000/svg'
const MARK_SPEED = 520, GAP = 0.1 // a mark's pen, in sheet units a second; the beat between marks
async function marksOf(el: SVGGraphicsElement): Promise<{ strokes: Timed[]; total: number; width: number; shift: string }> {
  if (el.matches('.rueca-note')) {
    const text = el.textContent ?? '', size = +(el.getAttribute('font-size') ?? 30), font = getComputedStyle(el).fontFamily
    const s = await strokesOf(text, font, size)
    const anchor = el.getAttribute('text-anchor'), x = +(el.getAttribute('x') ?? 0), y = +(el.getAttribute('y') ?? 0)
    const start = x - (anchor === 'middle' ? s.advance / 2 : anchor === 'end' ? s.advance : 0)
    return { ...timeline(s, { most: 1.6 }), width: s.thickness * 1.7 + 1.4, shift: `translate(${(start - s.x).toFixed(2)} ${(y - s.baseline).toFixed(2)})` }
  }
  // a hand mark: each sub-path (an arrow's line, then its two flicks) in turn
  let t = 0
  const strokes = (el.getAttribute('d') ?? '').split(/(?=M)/).filter(Boolean).map((d): Timed => {
    const probe = document.createElementNS(NS, 'path')
    probe.setAttribute('d', d)
    const len = probe.getTotalLength(), dur = len / MARK_SPEED, at = t
    t += dur
    return { d, len, at, dur }
  })
  return { strokes, total: t, width: 9, shift: '' }
}
export async function penMarks(root: SVGSVGElement) {
  for (const set of root.querySelectorAll<SVGGElement>('.rueca-marks')) {
    if (set.dataset.pen) continue
    set.dataset.pen = 'wait'
    const items = [...set.children].filter((e): e is SVGGraphicsElement => e.matches('.rueca-note, .rueca-pen'))
    const parts = await Promise.all(items.map(marksOf))
    const whole = parts.reduce((t, p) => t + p.total, 0) + GAP * (parts.length - 1)
    let start = 0
    items.forEach((el, i) => {
      const { strokes, total, width, shift } = parts[i], id = `pen-${++uid}`
      const mask = document.createElementNS(NS, 'mask')
      mask.id = id
      mask.setAttribute('maskUnits', 'userSpaceOnUse')
      for (const [k, v] of Object.entries({ x: '-600', y: '-600', width: '1800', height: '1800' })) mask.setAttribute(k, v)
      mask.innerHTML = `<g${shift ? ` transform="${shift}"` : ''} stroke-width="${width.toFixed(2)}">${strokes.map((k) => `<path class="pen-ink" d="${k.d}" style="--len:${(k.len + 1).toFixed(2)};--a:${((start + k.at) / whole).toFixed(4)};--f:${Math.max(0.0005, k.dur / whole).toFixed(4)}"/>`).join('')}</g>`
      set.insertBefore(mask, el)
      el.setAttribute('mask', `url(#${id})`)
      start += total + GAP
    })
    set.dataset.pen = 'ready'
  }
}
/** Write a drawing's pen marks (see penMarks) once its markup is in `ref`. */
export function usePenMarks(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (svg && 'fonts' in document) penMarks(svg).catch(() => {})
  }, [ref])
}

const cache = new Map<string, Promise<Strokes>>()
/** The pen for a <Hand>: once its font is in, lays the written SVG over the span's own text (which
    stays, hidden, for layout) exactly where that text sits, and marks the span data-pen so the
    plate's CSS writes it on the scroll reveal instead of wiping it. If anything fails, the span
    keeps its wipe. */
export function usePen(ref: RefObject<HTMLElement | null>, text: string, on: boolean) {
  useEffect(() => {
    const el = ref.current, words = el?.firstElementChild as HTMLElement | null
    if (!on || !el || !words || !('fonts' in document)) return
    let gone = false, svg: SVGSVGElement | null = null
    el.setAttribute('data-pen', 'wait')
    const css = getComputedStyle(el), size = parseFloat(css.fontSize), font = css.fontFamily
    const key = `${size}|${font}|${text}`
    if (!cache.has(key)) cache.set(key, strokesOf(text, font, size))
    cache.get(key)!.then((s) => {
      if (gone) return
      // where the text's pen starts in the span: the words' left edge and their baseline
      const probe = document.createElement('span')
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
      words.appendChild(probe)
      const x = words.offsetLeft, y = probe.offsetTop
      probe.remove()
      const box = document.createElement('span')
      box.innerHTML = writtenSvg(text, s).svg
      svg = box.firstElementChild as SVGSVGElement
      svg.style.left = `${x - s.x}px`
      svg.style.top = `${y - s.baseline}px`
      el.appendChild(svg)
      el.setAttribute('data-pen', 'ready')
    }).catch(() => { if (!gone) el.removeAttribute('data-pen') })
    return () => { gone = true; svg?.remove(); el.removeAttribute('data-pen') }
  }, [ref, text, on])
}
