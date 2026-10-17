/* Tone maps: every style draws from one of these. A tone map is a grid of darkness, 0 for bare paper and 1 for full
   ink, read with `at(u, v)` in 0..1 across the source. Three kinds of source:
     · a photograph (Midjourney, black and white): luminance, levelled so the backdrop is paper;
     · an engraved plate (line art): its ink spread into tone by a blur, so screens and dithers can read it;
     · the logo's own geometry: the Pulido mark filled and lit from the upper left, as a shallow relief. */

export type Tone = { w: number; h: number; d: Float32Array; at: (u: number, v: number) => number }

export function makeTone(w: number, h: number, d: Float32Array): Tone {
  return {
    w, h, d,
    at(u, v) {
      const x = Math.min(w - 1.001, Math.max(0, u * (w - 1))), y = Math.min(h - 1.001, Math.max(0, v * (h - 1)))
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, i = y0 * w + x0
      return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + w] * (1 - fx) + d[i + w + 1] * fx) * fy
    },
  }
}

/** a separable box blur, `passes` times (three passes is close to a gaussian) */
export function blur(t: Tone, r: number, passes = 3): Tone {
  if (r < 1) return t
  const { w, h } = t
  let a = Float32Array.from(t.d), b = new Float32Array(w * h)
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let s = 0
      for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]
      for (let x = 0; x < w; x++) {
        b[y * w + x] = s / (2 * r + 1)
        s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let y = -r; y <= r; y++) s += b[Math.min(h - 1, Math.max(0, y)) * w + x]
      for (let y = 0; y < h; y++) {
        a[y * w + x] = s / (2 * r + 1)
        s += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x]
      }
    }
  }
  return makeTone(w, h, a)
}

/** levels and a curve: `lo`..`hi` stretched to 0..1, then raised to `gamma` */
export function levels(t: Tone, lo: number, hi: number, gamma = 1): Tone {
  const d = new Float32Array(t.d.length)
  for (let i = 0; i < d.length; i++) d[i] = Math.max(0, Math.min(1, (t.d[i] - lo) / (hi - lo))) ** gamma
  return makeTone(t.w, t.h, d)
}

const pct = (d: Float32Array, q: number) => { const s = Float32Array.from(d.filter((_, i) => i % 7 === 0)).sort(); return s[Math.floor((s.length - 1) * q)] }

async function pixels(url: string, W: number) {
  const img = await createImageBitmap(await (await fetch(url)).blob())
  const h = Math.round((W * img.height) / img.width)
  const c = new OffscreenCanvas(W, h), g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, h); g.drawImage(img, 0, 0, W, h)
  return { w: W, h, px: g.getImageData(0, 0, W, h).data }
}

/** a black-and-white photograph: darker is more ink; the backdrop (its brightest `paper` share) becomes bare paper */
export async function fromPhoto(url: string, { W = 720, paper = 0.55, black = 0.01, gamma = 1 } = {}) {
  const { w, h, px } = await pixels(url, W)
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = 1 - (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255
  const lo = pct(d, paper), hi = pct(d, 1 - black)
  return levels(makeTone(w, h, d), lo + 0.02, hi, gamma)
}

/** an engraved plate: its lines (ink) as darkness, spread by `spread` px so the hatching becomes tone */
export async function fromPlate(url: string, { W = 720, spread = 3, paper = 0.6 } = {}) {
  const { w, h, px } = await pixels(url, W)
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = 1 - (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255
  const lo = pct(d, paper)
  const lines = levels(makeTone(w, h, d), lo + 0.04, pct(d, 0.995))
  const t = blur(lines, spread)
  return { tone: levels(t, 0.02, pct(t.d, 0.995), 0.85), lines }
}

// ── The mark (brand/logo/pulido.json) ─────────────────────────────────────────
export const MARK = {
  w: 309.1, h: 217.2,
  wheel: { cx: 200.5, cy: 108.6, r: 61.1 }, whorl: { cx: 76.5, cy: 140.7, r: 29 },
  big: { cx: 200.5, cy: 108.6, r: 96.1 }, small: { cx: 76.5, cy: 140.7, r: 64 }, bandW: 25,
  paths: {
    wheel: 'M139.4 108.6A61.1 61.1 0 1 0 261.6 108.6A61.1 61.1 0 1 0 139.4 108.6Z',
    whorl: 'M47.5 140.7A29 29 0 1 0 105.5 140.7A29 29 0 1 0 47.5 140.7Z',
    band: 'M200.5 217.2L76.5 217.2A76.5 76.5 0 0 1 39.38 73.81L147.8 13.64A108.6 108.6 0 1 1 200.5 217.2ZM200.5 192.2L76.5 192.2A51.5 51.5 0 0 1 51.51 95.67L159.94 35.5A83.6 83.6 0 1 1 200.5 192.2Z',
  },
}
/** points along the band's centre line, start to end (the belt), `n` of them */
export function bandLine(n = 400): [number, number][] {
  const { big, small } = MARK
  const mid = { b: big.r - MARK.bandW / 2, s: small.r - MARK.bandW / 2 }
  const dx = big.cx - small.cx, dy = big.cy - small.cy, L = Math.hypot(dx, dy)
  const tan = Math.atan2(dy, dx) - Math.acos((mid.s - mid.b) / L)
  const pts: [number, number][] = []
  // straight, big arc, bottom straight, small arc: sampled by length
  const A: [number, number] = [small.cx + mid.s * Math.cos(tan), small.cy + mid.s * Math.sin(tan)]
  const B: [number, number] = [big.cx + mid.b * Math.cos(tan), big.cy + mid.b * Math.sin(tan)]
  const segs = [
    { len: Math.hypot(B[0] - A[0], B[1] - A[1]), at: (u: number): [number, number] => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u] },
    { len: mid.b * (Math.PI / 2 - tan), at: (u: number): [number, number] => { const a = tan + (Math.PI / 2 - tan) * u; return [big.cx + mid.b * Math.cos(a), big.cy + mid.b * Math.sin(a)] } },
    { len: big.cx - small.cx, at: (u: number): [number, number] => [big.cx + (small.cx - big.cx) * u, big.cy + mid.b] },
    { len: mid.s * (tan + Math.PI * 1.5), at: (u: number): [number, number] => { const a = Math.PI / 2 + (tan + Math.PI * 1.5) * u; return [small.cx + mid.s * Math.cos(a), small.cy + mid.s * Math.sin(a)] } },
  ]
  const total = segs.reduce((a, s) => a + s.len, 0)
  for (let i = 0; i < n; i++) {
    let L0 = (i / (n - 1)) * total
    for (const s of segs) { if (L0 <= s.len + 1e-6) { pts.push(s.at(L0 / s.len)); break } L0 -= s.len }
  }
  return pts
}

/** the mark as tone: filled, lit from the upper left like a shallow relief, `W` px wide with `pad` of paper round it */
export function fromMark(W = 720, pad = 0.12): Tone {
  const k = (W * (1 - pad * 2)) / MARK.w, H = Math.round(MARK.h * k + W * pad * 2)
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H)
  g.translate(W * pad, W * pad); g.scale(k, k); g.fillStyle = '#fff'
  for (const p of Object.values(MARK.paths)) g.fill(new Path2D(p), 'evenodd')
  const px = g.getImageData(0, 0, W, H).data, mask = new Float32Array(W * H)
  for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4] / 255
  const soft = blur(makeTone(W, H, mask), Math.round(W / 90))
  const d = new Float32Array(W * H), lx = -0.6, ly = -0.8
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (mask[i] < 0.5) continue
    const gx = soft.d[i + 1] - soft.d[i - 1], gy = soft.d[i + W] - soft.d[i - W]
    const n = Math.hypot(gx, gy) || 1
    const lit = (gx / n) * lx + (gy / n) * ly // edges facing the light are bright, the far edges dark
    const edge = Math.min(1, Math.hypot(gx, gy) * 18)
    d[i] = Math.max(0.12, Math.min(1, 0.62 - 0.38 * lit * edge + 0.18 * (1 - soft.d[i])))
  }
  return makeTone(W, H, d)
}

/** The mark as a carved relief, worked out from its exact geometry (no photo, no blur): the band a round belt, the
    wheel and whorl shallow domes, lit from the upper left. Returns, on one grid in mark units (`res` px a unit, `pad`
    units of paper round it):
      · tone: the shading (0 lit to 1 in shadow), only where there is mark;
      · height: px-like height for engraved hatching, 0 at every edge, growing inward (along the belt, round the domes);
      · part: 0 paper, 1 band, 2 wheel, 3 whorl. */
export type Relief = { tone: Tone; height: Tone; part: Uint8Array; res: number; pad: number }
export function markRelief(res = 5, pad = 6): Relief {
  const W = Math.round((MARK.w + pad * 2) * res), H = Math.round((MARK.h + pad * 2) * res)
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d', { willReadFrequently: true })!
  const part = new Uint8Array(W * H)
  const paint = (d: string, id: number) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H)
    g.setTransform(res, 0, 0, res, pad * res, pad * res); g.fillStyle = '#fff'; g.fill(new Path2D(d), 'evenodd')
    const px = g.getImageData(0, 0, W, H).data
    for (let i = 0; i < part.length; i++) if (px[i * 4 + 3] > 127) part[i] = id
  }
  paint(MARK.paths.band, 1); paint(MARK.paths.wheel, 2); paint(MARK.paths.whorl, 3)
  const line = bandLine(1200), half = MARK.bandW / 2
  const L = [-0.526, -0.669, 0.526]
  const tone = new Float32Array(W * H), height = new Float32Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = part[i]
    if (!p) continue
    const ux = x / res - pad, uy = y / res - pad
    let n: [number, number, number], h: number
    if (p === 1) {
      // nearest point on the belt's centre line: coarse pass, then refine
      let best = 0, bd = Infinity
      for (let j = 0; j < line.length; j += 12) { const d = (line[j][0] - ux) ** 2 + (line[j][1] - uy) ** 2; if (d < bd) { bd = d; best = j } }
      for (let j = Math.max(0, best - 12); j < Math.min(line.length, best + 12); j++) { const d = (line[j][0] - ux) ** 2 + (line[j][1] - uy) ** 2; if (d < bd) { bd = d; best = j } }
      const d = Math.sqrt(bd), s = Math.min(0.999, d / half), vx = (ux - line[best][0]) / (d || 1), vy = (uy - line[best][1]) / (d || 1)
      n = [vx * s, vy * s, Math.sqrt(1 - s * s)]; h = half * Math.sqrt(1 - s * s)
    } else {
      const C = p === 2 ? MARK.wheel : MARK.whorl, dx = (ux - C.cx) / C.r, dy = (uy - C.cy) / C.r, r = Math.min(1, Math.hypot(dx, dy))
      const k = 0.9 // a dome: its rim leans out, its middle faces you
      const nl = Math.hypot(dx * k, dy * k, 1); n = [(dx * k) / nl, (dy * k) / nl, 1 / nl]; h = C.r * (1 - r)
    }
    const shade = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2])
    tone[i] = Math.min(1, Math.max(0.04, 1 - (0.06 + 0.94 * shade) ** 0.85))
    height[i] = h
  }
  return { tone: makeTone(W, H, tone), height: makeTone(W, H, height), part, res, pad }
}
