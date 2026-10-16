/* ---------------------------------------------------------------------------
   Mark families. Each is a schema (so the kit Inspector renders its params)
   plus a pure draw(values, colours) → SVG markup in a 0–100 box. Same seed +
   same values = same mark, forever — that is what makes "keep", "more like
   this" and the params JSON meaningful.
--------------------------------------------------------------------------- */
import { Grid2x2, Orbit, Flower2, Spline, Type, type LucideIcon } from 'lucide-react'
import { defineSchema, folder, p, createParams, type AnyParams } from '@kit'
import { glyph } from './letters'
import { mulberry32 } from '../util'

export type FamilyId = 'scribble' | 'orbit' | 'grid' | 'bloom' | 'monogram'
export interface Colors { ink: string; paper: string; accent: string }
export interface DrawCtx extends Colors { initials: string }

export interface Family {
  id: FamilyId
  name: string
  icon: LucideIcon
  blurb: string
  params: AnyParams
  /** tasteful ranges for reroll (numbers); selects and booleans pick freely */
  explore: Record<string, [number, number]>
  draw: (v: Record<string, any>, c: DrawCtx) => string
}

/* --- maths --- */
export { mulberry32 }
const f = (n: number) => Math.round(n * 100) / 100
const TAU = Math.PI * 2

/** Smooth open/closed path through points (quadratic through midpoints). */
function smooth(pts: [number, number][], closed = false) {
  if (pts.length < 3) return pts.map((q, i) => `${i ? 'L' : 'M'}${f(q[0])} ${f(q[1])}`).join('')
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = closed ? `M${f(mid(pts.at(-1)!, pts[0])[0])} ${f(mid(pts.at(-1)!, pts[0])[1])}` : `M${f(pts[0][0])} ${f(pts[0][1])}`
  const n = pts.length
  for (let i = closed ? 0 : 1; i < (closed ? n : n - 1); i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`
  }
  if (!closed) d += `L${f(pts[n - 1][0])} ${f(pts[n - 1][1])}`
  return d + (closed ? 'Z' : '')
}

/** A smooth 1D signal from three seeded sines, roughly in −1…1. */
function wave(rng: () => number) {
  const fr = [0.7 + rng() * 0.6, 1.7 + rng() * 1.3, 3.3 + rng() * 2.2], ph = fr.map(() => rng() * TAU)
  return (t: number) => (Math.sin(t * fr[0] + ph[0]) + 0.5 * Math.sin(t * fr[1] + ph[1]) + 0.25 * Math.sin(t * fr[2] + ph[2])) / 1.75
}

/** Fit points into a centred square of `size`, keeping aspect. */
function fitPts(pts: [number, number][], size = 76) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  const s = size / Math.max(x1 - x0, y1 - y0, 1e-6)
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  return pts.map(([x, y]) => [50 + (x - cx) * s, 50 + (y - cy) * s] as [number, number])
}

const stroke = (c: string, w: number) => `fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"`

/* ============================ families ============================ */

const scribbleSchema = defineSchema({
  shape: folder('Line', {
    loops: p.number(5, { min: 1, max: 12, step: 1, hint: 'Passes of the pen around the centre.' }),
    chaos: p.number(0.55, { min: 0, max: 1, step: 0.01, hint: '0 is a near-perfect circle (order); 1 is a loose tangle (exploring).' }),
    wobble: p.number(0.5, { min: 0, max: 1, step: 0.01, hint: 'Hand tremor along the line.' }),
    drift: p.number(0.6, { min: 0, max: 1, step: 0.01, hint: 'How far each loop’s centre wanders. Scaled by chaos.' }),
    squash: p.number(0.12, { min: 0, max: 0.6, step: 0.01, hint: 'Flattens the loops into ellipses.' }),
  }),
  stroke: folder('Stroke', {
    weight: p.number(3.2, { min: 0.6, max: 9, step: 0.1, hint: 'Line weight in mark units (the mark is 100 wide). Check the 16px ladder.' }),
  }),
  seedF: folder('Seed', { seed: p.seed(2718) }),
})
const scribble: Family = {
  id: 'scribble', name: 'Scribble', icon: Spline, blurb: 'One continuous line looping around a centre — order to chaos on one slider.',
  params: createParams(scribbleSchema, { id: 'marks-scribble', persist: false, url: false, presets: [
    { name: 'Mentor circle', values: { loops: 4, chaos: 0.06, wobble: 0.7, drift: 0.2, squash: 0, weight: 2.4 } },
    { name: 'Tangle', values: { loops: 7, chaos: 0.85, wobble: 0.45, drift: 0.8, squash: 0.2, weight: 2.2 } },
    { name: 'Bold loop', values: { loops: 2, chaos: 0.35, wobble: 0.2, drift: 0.4, squash: 0.1, weight: 7 } },
  ] }),
  explore: { loops: [2, 8], chaos: [0.05, 0.95], wobble: [0.15, 0.8], drift: [0.2, 0.9], squash: [0, 0.3], weight: [1.8, 6] },
  draw: (v, c) => {
    const rng = mulberry32(v.seed)
    const nR = wave(rng), nX = wave(rng), nY = wave(rng), nA = wave(rng), nS = wave(rng)
    const loops = Math.max(1, Math.round(v.loops))
    const ch = v.chaos
    const N = loops * 56 + 8
    const span = loops * TAU + ch * 1.4
    const pts: [number, number][] = []
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * span
      const r = 1 + v.wobble * (0.035 + 0.2 * ch) * nR(t * 2.4)
      const cx = v.drift * ch * 0.42 * nX(t * 0.21), cy = v.drift * ch * 0.42 * nY(t * 0.23)
      const a = t + ch * 0.9 * nA(t * 0.31)
      const sq = 1 - v.squash * (0.6 + 0.4 * nS(t * 0.17))
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a) * sq])
    }
    return `<path d="${smooth(fitPts(pts, 80 - v.weight))}" ${stroke(c.ink, v.weight)}/>`
  },
}

const orbitSchema = defineSchema({
  rings: folder('Rings', {
    rings: p.number(3, { min: 1, max: 7, step: 1 }),
    tilt: p.number(64, { min: 0, max: 86, step: 1, unit: '°', hint: 'Viewing angle of each ring. 0 is a flat circle.' }),
    spread: p.number(120, { min: 0, max: 180, step: 1, unit: '°', hint: 'How the rings’ axes fan out.' }),
    nest: p.number(0, { min: 0, max: 1, step: 0.01, hint: 'Shrinks inner rings — 0 keeps every ring the same size.' }),
    gap: p.number(0.14, { min: 0, max: 0.6, step: 0.01, hint: 'A break in each ring.' }),
  }),
  detail: folder('Detail', {
    weight: p.number(3, { min: 0.6, max: 8, step: 0.1 }),
    weave: p.boolean(true, { hint: 'Knocks a paper-coloured gap where rings cross, so they read as over and under.' }),
    planet: p.boolean(true, { hint: 'An accent dot where the first ring breaks.' }),
    core: p.select('dot', ['none', 'dot', 'ring']),
    coreSize: p.number(0.16, { min: 0.04, max: 0.4, step: 0.01, label: 'Core size', when: (v) => v.core !== 'none' }),
  }),
  seedF: folder('Seed', { seed: p.seed(1604) }),
})
const orbit: Family = {
  id: 'orbit', name: 'Orbit', icon: Orbit, blurb: 'Tilted rings around a core — atoms, planets, gyroscopes.',
  params: createParams(orbitSchema, { id: 'marks-orbit', persist: false, url: false, presets: [
    { name: 'Atom', values: { rings: 3, tilt: 70, spread: 120, gap: 0, core: 'dot', planet: false } },
    { name: 'Gyro', values: { rings: 2, tilt: 76, spread: 90, gap: 0.2, core: 'ring', weight: 4.2 } },
    { name: 'Nested', values: { rings: 5, tilt: 50, spread: 30, nest: 0.9, gap: 0.3, core: 'none' } },
  ] }),
  explore: { rings: [1, 5], tilt: [30, 80], spread: [30, 180], nest: [0, 0.8], gap: [0, 0.35], weight: [1.6, 5.5], coreSize: [0.08, 0.24] },
  draw: (v, c) => {
    const rng = mulberry32(v.seed)
    const R = 40 - v.weight / 2
    const tilt = (v.tilt * Math.PI) / 180
    const base = rng() * Math.PI
    const out: string[] = []
    let planet: [number, number] | null = null
    const n = Math.max(1, Math.round(v.rings))
    for (let i = 0; i < n; i++) {
      const rot = base + (i / n) * ((v.spread * Math.PI) / 180) + (rng() - 0.5) * 0.08
      const rx = R * (1 - (i / Math.max(1, n)) * v.nest * 0.7)
      const ry = Math.max(rx * 0.02, rx * Math.cos(tilt))
      const g0 = rng() * TAU, glen = v.gap * Math.PI
      const pts: [number, number][] = []
      const steps = 96
      for (let k = 0; k <= steps; k++) {
        const t = g0 + glen + (k / steps) * (TAU - glen)
        const x = rx * Math.cos(t), y = ry * Math.sin(t)
        pts.push([50 + x * Math.cos(rot) - y * Math.sin(rot), 50 + x * Math.sin(rot) + y * Math.cos(rot)])
      }
      if (i === 0) planet = pts[0]
      const d = smooth(pts, v.gap === 0)
      if (v.weave && i > 0) out.push(`<path d="${d}" ${stroke(c.paper, v.weight * 2.6)}/>`)
      out.push(`<path d="${d}" ${stroke(c.ink, v.weight)}/>`)
    }
    if (v.core === 'dot') out.push(`<circle cx="50" cy="50" r="${f(40 * v.coreSize)}" fill="${c.ink}"/>`)
    if (v.core === 'ring') out.push(`<circle cx="50" cy="50" r="${f(40 * v.coreSize)}" ${stroke(c.ink, v.weight)}/>`)
    if (v.planet && planet) out.push(`<circle cx="${f(planet[0])}" cy="${f(planet[1])}" r="${f(v.weight * 1.25 + 2.2)}" fill="${c.accent}"/>`)
    return out.join('')
  },
}

const gridSchema = defineSchema({
  grid: folder('Grid', {
    cells: p.number(5, { min: 2, max: 8, step: 1, hint: 'Cells per side.' }),
    symmetry: p.select('mirror', [
      { value: 'mirror', label: 'Mirror', hint: 'Left–right mirror' }, { value: 'quad', label: 'Quad', hint: 'Mirrored both ways' },
      { value: 'radial', label: 'Radial', hint: 'Four-fold rotation' }, { value: 'none', label: 'None', hint: 'No symmetry' },
    ]),
    density: p.number(0.55, { min: 0.15, max: 0.95, step: 0.01, hint: 'Share of cells filled.' }),
  }),
  cell: folder('Cell', {
    shape: p.select('mixed', ['square', 'circle', 'quarter', 'mixed'], { display: 'dropdown' }),
    gap: p.number(0.1, { min: 0, max: 0.4, step: 0.01, hint: 'Space between cells, as a share of a cell.' }),
    round: p.number(0.15, { min: 0, max: 0.5, step: 0.01, label: 'Corner', hint: 'Corner radius of square cells.' }),
    accents: p.number(1, { min: 0, max: 4, step: 1, hint: 'Cells filled with the accent colour.' }),
  }),
  seedF: folder('Seed', { seed: p.seed(828) }),
})
const grid: Family = {
  id: 'grid', name: 'Grid glyph', icon: Grid2x2, blurb: 'Symmetric glyphs on a small grid of squares, dots and quarter-circles.',
  params: createParams(gridSchema, { id: 'marks-grid', persist: false, url: false, presets: [
    { name: 'Pixel', values: { shape: 'square', gap: 0.04, round: 0, cells: 6, symmetry: 'mirror' } },
    { name: 'Quilt', values: { shape: 'quarter', gap: 0, cells: 4, symmetry: 'radial', density: 0.8 } },
    { name: 'Dots', values: { shape: 'circle', gap: 0.12, cells: 5, symmetry: 'quad', density: 0.6 } },
  ] }),
  explore: { cells: [3, 6], density: [0.45, 0.85], gap: [0, 0.18], round: [0, 0.5], accents: [0, 2] },
  draw: (v, c) => {
    const rng = mulberry32(v.seed)
    const n = Math.max(2, Math.round(v.cells))
    const size = 80 / n, g = size * v.gap
    type Cell = { on: boolean; kind: number; o: number }
    const cells: Cell[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ on: false, kind: 0, o: 0 })))
    const kinds = v.shape === 'square' ? [0] : v.shape === 'circle' ? [1] : v.shape === 'quarter' ? [2] : [0, 1, 2, 3]
    const pick = (): Cell => ({ on: rng() < v.density, kind: kinds[Math.floor(rng() * kinds.length)], o: Math.floor(rng() * 4) })
    const H = [1, 0, 3, 2], Vv = [3, 2, 1, 0] // corner maps for quarter (TL TR BR BL) mirrors
    const HH = [0, 3, 2, 1], VH = [2, 1, 0, 3]  // edge maps for half-circles (up right down left)
    const mh = (x: Cell) => ({ ...x, o: x.kind === 3 ? HH[x.o] : H[x.o] })
    const mv = (x: Cell) => ({ ...x, o: x.kind === 3 ? VH[x.o] : Vv[x.o] })
    const half = Math.ceil(n / 2)
    if (v.symmetry === 'none') for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) cells[r][q] = pick()
    // a cell that mirrors onto itself must be symmetric itself: quarters and halves become dots
    const fix = (y: Cell, onAxis: boolean) => (onAxis && y.kind >= 2 ? { ...y, kind: 1 } : y)
    const mid = (a: number) => a === n - 1 - a
    if (v.symmetry === 'none') { /* filled above */ }
    else if (v.symmetry === 'mirror') for (let r = 0; r < n; r++) for (let q = 0; q < half; q++) { const x = fix(pick(), mid(q)); cells[r][q] = x; cells[r][n - 1 - q] = mid(q) ? x : mh(x) }
    else if (v.symmetry === 'quad') for (let r = 0; r < half; r++) for (let q = 0; q < half; q++) {
      const x = fix(pick(), mid(q) || mid(r))
      cells[r][q] = x; cells[r][n - 1 - q] = mh(x); cells[n - 1 - r][q] = mv(x); cells[n - 1 - r][n - 1 - q] = mv(mh(x))
    } else for (let r = 0; r < half; r++) for (let q = 0; q < half; q++) {
      const x = fix(pick(), mid(r) && mid(q))
      let rr = r, qq = q, o = x.o
      for (let k = 0; k < 4; k++) { cells[rr][qq] = { ...x, o }; [rr, qq] = [qq, n - 1 - rr]; o = (o + 1) % 4 }
    }
    const on = cells.flat().filter((x) => x.on)
    if (!on.length) { const m = Math.floor(n / 2); cells[m][m] = { on: true, kind: 0, o: 0 } }
    const filled: [number, number][] = []
    cells.forEach((row, r) => row.forEach((x, q) => x.on && filled.push([r, q])))
    const acc = new Set<string>()
    for (let k = 0; k < Math.min(v.accents, filled.length); k++) { const [r, q] = filled[Math.floor(rng() * filled.length)]; acc.add(`${r}:${q}`) }
    const out: string[] = []
    cells.forEach((row, r) => row.forEach((x, q) => {
      if (!x.on) return
      const x0 = 10 + q * size + g / 2, y0 = 10 + r * size + g / 2, s = size - g
      const fill = acc.has(`${r}:${q}`) ? c.accent : c.ink
      if (x.kind === 0) out.push(`<rect x="${f(x0)}" y="${f(y0)}" width="${f(s)}" height="${f(s)}" rx="${f(s * v.round)}" fill="${fill}"/>`)
      else if (x.kind === 1) out.push(`<circle cx="${f(x0 + s / 2)}" cy="${f(y0 + s / 2)}" r="${f(s / 2)}" fill="${fill}"/>`)
      else if (x.kind === 2) {
        const corners = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]]
        const [ax, ay] = corners[x.o], [bx, by] = corners[(x.o + 1) % 4], [dx, dy] = corners[(x.o + 3) % 4]
        out.push(`<path d="M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}A${f(s)} ${f(s)} 0 0 1 ${f(dx)} ${f(dy)}Z" fill="${fill}"/>`)
      } else {
        const cx = x0 + s / 2, cy = y0 + s / 2, r2 = s / 2
        const a = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][x.o]
        const p1 = [cx + Math.cos(a - Math.PI / 2) * r2, cy + Math.sin(a - Math.PI / 2) * r2], p2 = [cx + Math.cos(a + Math.PI / 2) * r2, cy + Math.sin(a + Math.PI / 2) * r2]
        out.push(`<path d="M${f(p1[0])} ${f(p1[1])}A${f(r2)} ${f(r2)} 0 0 1 ${f(p2[0])} ${f(p2[1])}Z" fill="${fill}"/>`)
      }
    }))
    return out.join('')
  },
}

const bloomSchema = defineSchema({
  petals: folder('Petals', {
    petals: p.number(6, { min: 3, max: 16, step: 1 }),
    length: p.number(0.9, { min: 0.3, max: 1, step: 0.01 }),
    width: p.number(0.55, { min: 0.1, max: 1, step: 0.01 }),
    twist: p.number(0.3, { min: -1, max: 1, step: 0.01, hint: 'Bends each petal tip around the centre — a pinwheel at the extremes.' }),
    inner: p.number(0.12, { min: 0, max: 0.5, step: 0.01, label: 'Hole', hint: 'Radius left open at the centre.' }),
    irregular: p.number(0.1, { min: 0, max: 1, step: 0.01, hint: 'Seeded variation in petal length.' }),
  }),
  style: folder('Style', {
    style: p.select('fill', ['fill', 'outline', 'alternate']),
    weight: p.number(2.4, { min: 0.6, max: 6, step: 0.1, when: (v) => v.style === 'outline' }),
    core: p.boolean(true, { hint: 'An accent dot in the centre.' }),
  }),
  seedF: folder('Seed', { seed: p.seed(3141) }),
})
const bloom: Family = {
  id: 'bloom', name: 'Bloom', icon: Flower2, blurb: 'Radial petals with twist — flowers, pinwheels, shutters.',
  params: createParams(bloomSchema, { id: 'marks-bloom', persist: false, url: false, presets: [
    { name: 'Pinwheel', values: { petals: 4, twist: 0.9, width: 0.8, inner: 0, style: 'fill', core: false } },
    { name: 'Daisy', values: { petals: 12, length: 0.95, width: 0.35, twist: 0, inner: 0.22, core: true } },
    { name: 'Shutter', values: { petals: 7, twist: -0.7, width: 1, inner: 0.3, style: 'alternate' } },
  ] }),
  explore: { petals: [4, 12], length: [0.7, 1], width: [0.25, 0.9], twist: [-0.8, 0.8], inner: [0, 0.3], irregular: [0, 0.3], weight: [1.4, 4] },
  draw: (v, c) => {
    const rng = mulberry32(v.seed)
    const n = Math.max(3, Math.round(v.petals))
    const R = 40, r0 = R * v.inner
    const rot0 = -Math.PI / 2
    const out: string[] = []
    for (let i = 0; i < n; i++) {
      const a = rot0 + (i * TAU) / n
      const L = R * v.length * (1 - v.irregular * rng() * 0.45)
      const hw = (Math.PI / n) * v.width
      const tipA = a + v.twist * (Math.PI / n) * 1.6
      const P = (ang: number, r: number) => `${f(50 + Math.cos(ang) * r)} ${f(50 + Math.sin(ang) * r)}`
      const d = `M${P(a - hw * 0.5, r0)}C${P(a - hw * 1.25, r0 + (L - r0) * 0.45)} ${P(tipA - hw * 0.9, L * 0.92)} ${P(tipA, L)}C${P(tipA + hw * 0.9, L * 0.92)} ${P(a + hw * 1.25, r0 + (L - r0) * 0.45)} ${P(a + hw * 0.5, r0)}Z`
      if (v.style === 'outline') out.push(`<path d="${d}" ${stroke(c.ink, v.weight)}/>`)
      else out.push(`<path d="${d}" fill="${v.style === 'alternate' && i % 2 ? c.accent : c.ink}"/>`)
    }
    if (v.core) out.push(`<circle cx="50" cy="50" r="${f(Math.max(3, r0 * 0.6 || 5))}" fill="${c.accent}"/>`)
    return out.join('')
  },
}

const monogramSchema = defineSchema({
  letters: folder('Letters', {
    arrange: p.select('interlock', [
      { value: 'row', label: 'Row' }, { value: 'stack', label: 'Stack' }, { value: 'interlock', label: 'Knot', hint: 'Overlapping, the later letter knocked out over the earlier' }, { value: 'step', label: 'Step', hint: 'Diagonal steps' },
    ], { label: 'Arrange' }),
    spacing: p.number(-0.15, { min: -1, max: 1, step: 0.01, hint: 'Gap between letters; negative overlaps them.' }),
    slant: p.number(0, { min: -16, max: 16, step: 1, unit: '°' }),
    weight: p.number(5, { min: 1, max: 12, step: 0.1, hint: 'Stroke weight in mark units.' }),
    caps: p.select('round', ['round', 'square'], { label: 'Ends' }),
  }),
  frame: folder('Container', {
    container: p.select('circle', ['none', 'circle', 'square', 'hex']),
    invert: p.boolean(false, { hint: 'Fill the container with ink and draw the letters in paper.', when: (v) => v.container !== 'none' }),
    padding: p.number(0.22, { min: 0.06, max: 0.4, step: 0.01, hint: 'Space between letters and container.', when: (v) => v.container !== 'none' }),
  }),
  seedF: folder('Seed', { seed: p.seed(42) }),
})
const monogram: Family = {
  id: 'monogram', name: 'Monogram', icon: Type, blurb: 'Initials in a monoline geometric alphabet, arranged and framed. Initials come from the brand settings.',
  params: createParams(monogramSchema, { id: 'marks-monogram', persist: false, url: false, presets: [
    { name: 'Seal', values: { arrange: 'row', container: 'circle', spacing: 0.3, weight: 4, padding: 0.26 } },
    { name: 'Knot', values: { arrange: 'interlock', container: 'none', spacing: -0.4, weight: 6.5 } },
    { name: 'Badge', values: { arrange: 'stack', container: 'hex', invert: true, weight: 4.4 } },
  ] }),
  explore: { spacing: [-0.4, 0.4], slant: [-10, 10], weight: [2.5, 6], padding: [0.16, 0.3] },
  draw: (v, c) => {
    const rng = mulberry32(v.seed)
    const chars = (c.initials || 'M').replace(/\s+/g, '').slice(0, 3).split('')
    const gl = chars.map(glyph)
    const box = v.container === 'none' ? 80 : 80 * (1 - v.padding * 1.6)
    const frameOut: string[] = []
    const fg = v.invert && v.container !== 'none' ? c.paper : c.ink
    const bg = v.invert && v.container !== 'none' ? c.ink : c.paper
    const W = v.weight
    if (v.container !== 'none') {
      const filled = v.invert ? `fill="${c.ink}"` : stroke(c.ink, W * 0.8)
      const r = 42 - (v.invert ? 0 : W * 0.4)
      if (v.container === 'circle') frameOut.push(`<circle cx="50" cy="50" r="${f(r)}" ${filled}/>`)
      if (v.container === 'square') frameOut.push(`<rect x="${f(50 - r)}" y="${f(50 - r)}" width="${f(r * 2)}" height="${f(r * 2)}" rx="${f(r * 0.18)}" ${filled}/>`)
      if (v.container === 'hex') frameOut.push(`<path d="${Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${f(50 + Math.cos(i * Math.PI / 3 - Math.PI / 2) * r * 1.04)} ${f(50 + Math.sin(i * Math.PI / 3 - Math.PI / 2) * r * 1.04)}`).join('')}Z" ${filled} stroke-linejoin="round"/>`)
    }
    // Lay letters out in letter units (cap height 6), then scale the group into the box.
    const sp = v.spacing * 2.2
    type Placed = { g: typeof gl[number]; x: number; y: number; s: number }
    const placed: Placed[] = []
    if (v.arrange === 'row') {
      let x = 0
      gl.forEach((g) => { placed.push({ g, x, y: 0, s: 1 }); x += g.w + 1.6 + sp })
    } else if (v.arrange === 'stack') {
      let y = 0
      gl.forEach((g) => { placed.push({ g, x: -g.w / 2, y, s: 1 }); y += 6 + 1.4 + sp })
    } else if (v.arrange === 'interlock') {
      let x = 0
      gl.forEach((g, i) => { placed.push({ g, x, y: i % 2 ? 1.6 : 0, s: 1 }); x += g.w * 0.55 + 0.6 + sp })
    } else {
      // step: each letter drops half a cap height and overlaps the previous by a third of its width
      let x = 0
      gl.forEach((g, i) => { placed.push({ g, x, y: i * (3.2 + sp * 0.6), s: 1 }); x += g.w * 0.62 + 1.2 + sp })
    }
    const x0 = Math.min(...placed.map((q) => q.x)), x1 = Math.max(...placed.map((q) => q.x + q.g.w))
    const y0 = Math.min(...placed.map((q) => q.y)), y1 = Math.max(...placed.map((q) => q.y + 6))
    const k = Math.min(box / Math.max(1, x1 - x0 + W / 6), box / Math.max(1, y1 - y0 + W / 6)) * 0.98
    const ox = 50 - ((x0 + x1) / 2) * k, oy = 50 - ((y0 + y1) / 2) * k
    const skew = Math.tan((v.slant * Math.PI) / 180)
    const order = placed.map((_, i) => i)
    if (v.arrange === 'interlock' && rng() < 0.5) order.reverse()
    const cap = v.caps === 'square' ? 'square' : 'round'
    const letters: string[] = []
    order.forEach((i, n) => {
      const q = placed[i]
      const t = `matrix(${f(k)} 0 ${f(-skew * k)} ${f(k)} ${f(ox + q.x * k + skew * k * 3)} ${f(oy + q.y * k)})`
      const sw = W / k
      if (n > 0 && (v.arrange === 'interlock' || v.arrange === 'step')) letters.push(`<path d="${q.g.d}" transform="${t}" fill="none" stroke="${bg}" stroke-width="${f(sw * 2.4)}" stroke-linecap="${cap}" stroke-linejoin="round"/>`)
      letters.push(`<path d="${q.g.d}" transform="${t}" fill="none" stroke="${fg}" stroke-width="${f(sw)}" stroke-linecap="${cap}" stroke-linejoin="${cap === 'round' ? 'round' : 'miter'}"/>`)
    })
    return frameOut.join('') + letters.join('')
  },
}

export const FAMILIES: Family[] = [scribble, orbit, grid, bloom, monogram]
export const FAMILY: Record<FamilyId, Family> = Object.fromEntries(FAMILIES.map((x) => [x.id, x])) as Record<FamilyId, Family>

/* --- sampling --- */
const defaultsOf = (fam: Family) => ({ ...(fam.params.getState().defaults as Record<string, unknown>) })

/** A fresh, tasteful random set of params for a family. */
export function sampleParams(fam: Family, rng: () => number, randomise = true): Record<string, unknown> {
  const out = defaultsOf(fam)
  out.seed = Math.floor(rng() * 99999)
  if (!randomise) return out
  for (const [k, d] of Object.entries(fam.params.defs)) {
    const def = d
    if (k === 'seed') continue
    if (def.type === 'number') {
      const [lo, hi] = fam.explore[k] ?? [def.min ?? 0, def.max ?? 1]
      const step = def.step ?? 1
      out[k] = Math.round((lo + rng() * (hi - lo)) / step) * step
      out[k] = Number((out[k] as number).toFixed(4))
    } else if (def.type === 'select') {
      const opts = def.options.map((o) => (typeof o === 'string' ? o : o.value))
      out[k] = opts[Math.floor(rng() * opts.length)]
    } else if (def.type === 'boolean') out[k] = rng() < 0.6 ? def.value : !def.value
  }
  return out
}

/** Nudge every param a little around `v` — "more like this". */
export function mutateParams(fam: Family, v: Record<string, unknown>, rng: () => number, spread: number): Record<string, unknown> {
  const out = { ...v }
  const gauss = () => (rng() + rng() + rng() - 1.5) / 1.5
  for (const [k, d] of Object.entries(fam.params.defs)) {
    const def = d
    if (k === 'seed') continue
    if (def.type === 'number') {
      const min = def.min ?? 0, max = def.max ?? 1, step = def.step ?? 0.01
      const nv = (v[k] as number) + gauss() * spread * (max - min) * 0.35
      out[k] = Number((Math.round(Math.min(max, Math.max(min, nv)) / step) * step).toFixed(4))
    } else if (def.type === 'select' && rng() < spread * 0.25) {
      const opts = def.options.map((o) => (typeof o === 'string' ? o : o.value))
      out[k] = opts[Math.floor(rng() * opts.length)]
    } else if (def.type === 'boolean' && rng() < spread * 0.15) out[k] = !v[k]
  }
  out.seed = rng() < 0.55 ? v.seed : Math.floor(rng() * 99999)
  return out
}
