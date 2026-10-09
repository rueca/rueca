/* ---------------------------------------------------------------------------
   Node operations — one pure function per node type:
     (inputs, params, res) → outputs
   Inputs are already resolved (driven params substituted). No DOM.
--------------------------------------------------------------------------- */
import { boxBlur, clamp01, lum, makeImg, perlin, sample, smoothstep, toRGBA, worley, type Img, type RGBA } from './image'

export type Value = Img | number | RGBA
export type Outputs = Record<string, Value>
type P = Record<string, any>
type Ins = Record<string, Value | undefined>

const isImg = (v: unknown): v is Img => !!v && typeof v === 'object' && 'd' in (v as object)

/** Fill an image from a per-pixel function of normalised (u, v). */
function paint(res: number, fn: (u: number, v: number, out: RGBA) => void): Img {
  const img = makeImg(res, res)
  const px: RGBA = [0, 0, 0, 0]
  const inv = 1 / res
  for (let y = 0; y < res; y++)
    for (let x = 0; x < res; x++) {
      fn((x + 0.5) * inv, (y + 0.5) * inv, px)
      const i = (y * res + x) * 4
      img.d[i] = px[0]; img.d[i + 1] = px[1]; img.d[i + 2] = px[2]; img.d[i + 3] = px[3]
    }
  return img
}

function mapImg(src: Img, fn: (r: number, g: number, b: number, a: number, out: RGBA, i: number) => void): Img {
  const out = makeImg(src.w, src.h)
  const px: RGBA = [0, 0, 0, 0]
  const s = src.d
  for (let i = 0; i < s.length; i += 4) {
    fn(s[i], s[i + 1], s[i + 2], s[i + 3], px, i)
    out.d[i] = px[0]; out.d[i + 1] = px[1]; out.d[i + 2] = px[2]; out.d[i + 3] = px[3]
  }
  return out
}

/** Resample to `res` if an input arrived at a different size (never in practice, but safe). */
const fit = (img: Img, res: number): Img => {
  if (img.w === res && img.h === res) return img
  const tmp: RGBA = [0, 0, 0, 0]
  return paint(res, (u, v, o) => { sample(img, u, v, 'clamp', tmp); o[0] = tmp[0]; o[1] = tmp[1]; o[2] = tmp[2]; o[3] = tmp[3] })
}

/* --- generators --- */

function noise(p: P, res: number): Outputs {
  const seed = Math.round(p.seed ?? 1)
  const n = perlin(seed), wn = worley(seed)
  const oct = Math.max(1, Math.round(p.octaves ?? 5))
  const gain = p.roughness ?? 0.5, lac = p.lacunarity ?? 2
  const scale = Math.max(0.01, p.scale ?? 4)
  const off = p.offset ?? { x: 0, y: 0 }
  const kind = p.kind ?? 'fbm'
  const contrast = p.contrast ?? 1
  const warp = p.warp ?? 0

  const fbm = (x: number, y: number) => {
    let a = 1, f = 1, s = 0, norm = 0
    for (let o = 0; o < oct; o++) {
      let v: number
      if (kind === 'ridged') { v = 1 - Math.abs(n(x * f, y * f)); v *= v }
      else if (kind === 'turbulence') v = Math.abs(n(x * f, y * f))
      else if (kind === 'cells' || kind === 'cracks') { const [f1, f2] = wn(x * f, y * f); v = kind === 'cells' ? Math.min(1, f1) : Math.min(1, (f2 - f1) * 1.6) }
      else v = n(x * f, y * f) * 0.5 + 0.5
      s += v * a; norm += a; a *= gain; f *= lac
    }
    return s / norm
  }

  return {
    out: paint(res, (u, v, o) => {
      let x = (u - 0.5 + off.x) * scale, y = (v - 0.5 + off.y) * scale
      if (warp > 0) {
        // two-octave low-frequency warp field: smooth, not streaky
        const qx = n(x * 0.5 + 1.7, y * 0.5 + 9.2) + 0.5 * n(x + 4.1, y + 3.3)
        const qy = n(x * 0.5 + 8.3, y * 0.5 + 2.8) + 0.5 * n(x + 7.9, y + 1.2)
        x += warp * qx; y += warp * qy
      }
      let g = fbm(x, y)
      g = clamp01((g - 0.5) * contrast + 0.5)
      if (p.invert) g = 1 - g
      o[0] = o[1] = o[2] = g; o[3] = 1
    }),
  }
}

function gradient(p: P, res: number, ins: Ins): Outputs {
  const g = p.grad ?? { angle: 0, stops: [{ pos: 0, color: '#000' }, { pos: 1, color: '#fff' }] }
  const stops = [...g.stops].sort((a: any, b: any) => a.pos - b.pos).map((s: any) => ({ pos: s.pos, c: toRGBA(s.color) }))
  if (ins.colorA && !isImg(ins.colorA)) stops[0] = { ...stops[0], c: ins.colorA as RGBA }
  if (ins.colorB && !isImg(ins.colorB)) stops[stops.length - 1] = { ...stops[stops.length - 1], c: ins.colorB as RGBA }
  const ang = ((g.angle ?? 0) * Math.PI) / 180
  const ca = Math.cos(ang), sa = Math.sin(ang)
  const c = p.center ?? { x: 0, y: 0 }
  const spread = Math.max(0.01, p.spread ?? 1)
  const rep = Math.max(1, p.repeat ?? 1)
  const kind = p.kind ?? 'linear'
  const at = (t: number, o: RGBA) => {
    if (t <= stops[0].pos) { o.splice(0, 4, ...stops[0].c); return }
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i].pos) {
        const a = stops[i - 1], b = stops[i]
        const k = (t - a.pos) / Math.max(1e-6, b.pos - a.pos)
        for (let j = 0; j < 4; j++) o[j] = a.c[j] + (b.c[j] - a.c[j]) * k
        return
      }
    }
    o.splice(0, 4, ...stops[stops.length - 1].c)
  }
  return {
    out: paint(res, (u, v, o) => {
      const x = u - 0.5 - c.x, y = v - 0.5 - c.y
      let t: number
      if (kind === 'radial') t = Math.hypot(x, y) / (0.5 * spread)
      else if (kind === 'conic') { t = (Math.atan2(y, x) - ang) / (Math.PI * 2); t -= Math.floor(t) }
      else if (kind === 'diamond') t = (Math.abs(x) + Math.abs(y)) / (0.5 * spread)
      else t = (x * ca + y * sa) / spread + 0.5
      if (rep > 1) { t *= rep; t -= Math.floor(t) }
      at(clamp01(t), o)
    }),
  }
}

function shape(p: P, res: number): Outputs {
  const kind = p.kind ?? 'circle'
  const size = (p.size ?? 0.5) / 2
  const rot = ((p.rotation ?? 0) * Math.PI) / 180
  const cr = Math.cos(-rot), sr = Math.sin(-rot)
  const pos = p.position ?? { x: 0, y: 0 }
  const fill = toRGBA(p.fill ?? '#ffffff')
  const bg = toRGBA(p.background ?? '#00000000')
  const aa = 1.2 / res
  const soft = Math.max(aa, p.softness ?? 0)
  const n = Math.max(3, Math.round(p.points ?? 5))
  // star: m in [2, n]; inner=1 → regular polygon
  const m = kind === 'polygon' ? 2 : n - clamp01(p.inner ?? 0.45) * (n - 2)
  const an = Math.PI / n, en = Math.PI / m
  const acx = Math.cos(an), acy = Math.sin(an), ecx = Math.cos(en), ecy = Math.sin(en)
  const round = Math.min(size, p.roundness ?? 0)

  const sdf = (x: number, y: number) => {
    if (kind === 'circle') return Math.hypot(x, y) - size
    if (kind === 'rect') {
      const qx = Math.abs(x) - (size - round), qy = Math.abs(y) - (size - round)
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - round
    }
    // iq's sdStar
    let bn = Math.atan2(x, -y) % (2 * an)
    if (bn < 0) bn += 2 * an
    bn -= an
    const l = Math.hypot(x, y)
    let px = l * Math.cos(bn), py = Math.abs(l * Math.sin(bn))
    px -= size * acx; py -= size * acy
    const k = Math.min(Math.max(-(px * ecx + py * ecy), 0), (size * acy) / ecy)
    px += ecx * k; py += ecy * k
    return Math.hypot(px, py) * Math.sign(px)
  }

  return {
    out: paint(res, (u, v, o) => {
      const x0 = u - 0.5 - pos.x, y0 = v - 0.5 - pos.y
      const x = x0 * cr - y0 * sr, y = x0 * sr + y0 * cr
      let d = sdf(x, y)
      if (p.outline) d = Math.abs(d) - (p.stroke ?? 0.02) / 2
      const a = (1 - smoothstep(-soft, soft, d)) * fill[3]
      const ao = a + bg[3] * (1 - a)
      for (let j = 0; j < 3; j++) o[j] = ao > 0 ? (fill[j] * a + bg[j] * bg[3] * (1 - a)) / ao : 0
      o[3] = ao
    }),
  }
}

/* --- filters --- */

function transform(p: P, res: number, ins: Ins): Outputs {
  const src = fit(ins.in as Img, res)
  const off = p.offset ?? { x: 0, y: 0 }
  const s = Math.max(0.01, p.scale ?? 1)
  const r = ((p.rotate ?? 0) * Math.PI) / 180
  const cr = Math.cos(-r), sr = Math.sin(-r)
  const wrap = p.wrap ?? 'repeat'
  return {
    out: paint(res, (u, v, o) => {
      const x = (u - 0.5 - off.x) / s, y = (v - 0.5 - off.y) / s
      sample(src, x * cr - y * sr + 0.5, x * sr + y * cr + 0.5, wrap, o)
    }),
  }
}

function blur(p: P, res: number, ins: Ins): Outputs {
  const src = fit(ins.in as Img, res)
  const r = ((p.radius ?? 2) / 100) * res
  const dir = p.direction ?? 'both'
  // premultiply so transparent pixels never bleed their colour
  const pre = mapImg(src, (R, G, B, A, o) => { o[0] = R * A; o[1] = G * A; o[2] = B * A; o[3] = A })
  const b = boxBlur(pre, dir === 'vertical' ? 0 : r / 1.7, dir === 'horizontal' ? 0 : r / 1.7, Math.round(p.quality ?? 3))
  return { out: mapImg(b, (R, G, B, A, o) => { const k = A > 1e-5 ? 1 / A : 0; o[0] = R * k; o[1] = G * k; o[2] = B * k; o[3] = A }) }
}

function threshold(p: P, res: number, ins: Ins): Outputs {
  const src = fit(ins.in as Img, res)
  const level = p.level ?? 0.5, soft = (p.softness ?? 0.02) / 2
  return {
    out: mapImg(src, (r, g, b, a, o) => {
      let t = smoothstep(level - soft, level + soft, lum(r, g, b))
      if (p.invert) t = 1 - t
      o[0] = o[1] = o[2] = t; o[3] = a
    }),
  }
}

function ramp(p: P, res: number, ins: Ins): Outputs {
  const src = fit(ins.in as Img, res)
  let cols = ((p.colors as string[]) ?? ['#000', '#fff']).map(toRGBA)
  if (p.reverse) cols = [...cols].reverse()
  const n = cols.length
  const gamma = Math.pow(2, -(p.bias ?? 0) * 1.5)
  const interp = p.interp ?? 'smooth'
  return {
    out: mapImg(src, (r, g, b, a, o) => {
      const t = Math.pow(clamp01(lum(r, g, b)), gamma)
      if (n === 1) { o[0] = cols[0][0]; o[1] = cols[0][1]; o[2] = cols[0][2]; o[3] = a * cols[0][3]; return }
      if (interp === 'steps') {
        const c = cols[Math.min(n - 1, Math.floor(t * n))]
        o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; o[3] = a * c[3]; return
      }
      const f = t * (n - 1)
      const i = Math.min(n - 2, Math.floor(f))
      let k = f - i
      if (interp === 'smooth') k = k * k * (3 - 2 * k)
      const c0 = cols[i], c1 = cols[i + 1]
      o[0] = c0[0] + (c1[0] - c0[0]) * k; o[1] = c0[1] + (c1[1] - c0[1]) * k; o[2] = c0[2] + (c1[2] - c0[2]) * k
      o[3] = a * (c0[3] + (c1[3] - c0[3]) * k)
    }),
  }
}

/* --- composite --- */

const MODES: Record<string, (b: number, s: number) => number> = {
  normal: (_b, s) => s,
  multiply: (b, s) => b * s,
  screen: (b, s) => b + s - b * s,
  overlay: (b, s) => (b < 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s)),
  'soft light': (b, s) => (s < 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * ((b < 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b)) - b)),
  add: (b, s) => Math.min(1, b + s),
  subtract: (b, s) => Math.max(0, b - s),
  difference: (b, s) => Math.abs(b - s),
  lighten: (b, s) => Math.max(b, s),
  darken: (b, s) => Math.min(b, s),
}
export const BLEND_MODES = Object.keys(MODES)

function blend(p: P, res: number, ins: Ins): Outputs {
  const base = fit(ins.base as Img, res), top = fit(ins.top as Img, res)
  const fn = MODES[p.mode ?? 'normal'] ?? MODES.normal
  const op = clamp01(p.opacity ?? 1)
  const out = makeImg(res, res)
  const B = base.d, S = top.d, O = out.d
  for (let i = 0; i < O.length; i += 4) {
    const ab = B[i + 3], as = S[i + 3] * op
    const ao = as + ab * (1 - as)
    for (let c = 0; c < 3; c++) {
      const cb = B[i + c], cs = S[i + c]
      const mixed = cs + (fn(cb, cs) - cs) * ab // where base is empty, the top shows unblended
      O[i + c] = ao > 1e-6 ? (mixed * as + cb * ab * (1 - as)) / ao : 0
    }
    O[i + 3] = ao
  }
  return { out }
}

function mix(p: P, res: number, ins: Ins): Outputs {
  const a = fit(ins.a as Img, res), b = fit(ins.b as Img, res)
  const m = ins.mask ? fit(ins.mask as Img, res) : null
  const amt = clamp01(p.amount ?? 0.5)
  const out = makeImg(res, res)
  for (let i = 0; i < out.d.length; i += 4) {
    const t = m ? amt * lum(m.d[i], m.d[i + 1], m.d[i + 2]) * m.d[i + 3] : amt
    for (let c = 0; c < 4; c++) out.d[i + c] = a.d[i + c] + (b.d[i + c] - a.d[i + c]) * t
  }
  return { out }
}

function output(p: P, res: number, ins: Ins): Outputs {
  const src = fit(ins.in as Img, res)
  if (!p.flatten) return { out: src }
  const bg = toRGBA(p.background ?? '#000000')
  return { out: mapImg(src, (r, g, b, a, o) => { o[0] = bg[0] + (r - bg[0]) * a; o[1] = bg[1] + (g - bg[1]) * a; o[2] = bg[2] + (b - bg[2]) * a; o[3] = 1 }) }
}

export const OPS: Record<string, (p: P, res: number, ins: Ins) => Outputs> = {
  noise: (p, r) => noise(p, r),
  gradient,
  shape: (p, r) => shape(p, r),
  transform,
  blend,
  blur,
  threshold,
  ramp,
  mix,
  number: (p) => ({ out: Number(p.value ?? 0) }),
  color: (p) => ({ out: toRGBA(p.color ?? '#ffffff') }),
  output,
}

export const emptyImg = (res: number) => makeImg(res, res)
export { isImg }
