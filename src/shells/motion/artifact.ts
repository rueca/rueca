/* The artifact: pure functions of (values, t). The studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock, EASINGS } from '@kit'

export const schema = defineSchema({
  geometry: folder('Geometry', {
    rings: p.number(14, { min: 3, max: 40, step: 1, hint: 'How many rings radiate from the centre.' }),
    voidR: p.number(64, { min: 0, max: 160, step: 1, unit: 'px', label: 'Centre void', hint: 'Inner radius kept clear for the headline.' }),
    gap: p.number(11, { min: 4, max: 30, step: 0.5, unit: 'px', hint: 'Distance between rings.' }),
    weight: p.number(1.3, { min: 0.5, max: 4, step: 0.05, label: 'Stroke weight', hint: 'Line thickness. Never scales, so it stays crisp at any zoom.' }),
    dash: p.select('solid', ['solid', 'dashed', 'dotted'], { hint: 'Ring stroke style.' }),
  }),
  timing: folder('Timing', {
    duration: p.number(1450, { min: 400, max: 3000, step: 50, fmt: (v) => `${(v / 1000).toFixed(2)}s`, hint: 'Length of one outward sweep.' }),
    stagger: p.number(42, { min: 0, max: 120, step: 1, unit: 'ms', hint: 'Delay between each ring lighting up — what makes the sweep travel.' }),
    ease: p.curve(EASINGS['Out expo'], { hint: 'Easing of each ring’s rise.' }),
    returnSweep: p.boolean(true, { label: 'Return sweep', hint: 'Light sweeps back inward after the outward pass.' }),
    returnDelay: p.number(160, { min: 0, max: 800, step: 10, unit: 'ms', label: 'Return delay', when: (v) => v.returnSweep }),
  }),
  color: folder('Colour', {
    bg: p.color('#0b0b0f', { label: 'Background', alpha: false }),
    ink: p.color('#5b8cff', { label: 'Ring' }),
    glow: p.color('#e8f0ff', { label: 'Highlight' }),
    headline: p.text('Offers', { hint: 'Copy locked to the centre void.' }),
  }, { collapsed: false }),
})

export const params = createParams(schema, {
  id: 'motion',
  presets: [
    { name: 'Calm', values: { stagger: 70, duration: 2200, rings: 10 } },
    { name: 'Punchy', values: { stagger: 18, duration: 800, ease: EASINGS['Out back'], weight: 2 } },
    { name: 'Dense', values: { rings: 32, gap: 5, weight: 0.8 } },
  ],
})
export type V = ReturnType<typeof params.values>

export const totalMs = (v: V) => v.duration + v.stagger * v.rings + (v.returnSweep ? v.returnDelay + v.duration * 0.8 + v.stagger * 0.6 * v.rings : 0) + 400

export const clock = createClock({ duration: totalMs(params.values()), loop: true })
params.subscribe((s) => clock.setState({ duration: totalMs(s.values as V) }))

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  return (x: number) => {
    let t = x
    for (let i = 0; i < 6; i++) { const d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d }
    return sy(Math.min(1, Math.max(0, t)))
  }
}

/** Beats — the SAME function the timeline reads. */
export function beats(v: V) {
  const out: { ring: number; start: number; end: number; kind: 'out' | 'back' }[] = []
  for (let i = 0; i < v.rings; i++) out.push({ ring: i, start: i * v.stagger, end: i * v.stagger + v.duration, kind: 'out' })
  if (v.returnSweep) {
    const t0 = (v.rings - 1) * v.stagger + v.duration + v.returnDelay
    for (let i = v.rings - 1; i >= 0; i--) out.push({ ring: i, start: t0 + (v.rings - 1 - i) * v.stagger * 0.6, end: t0 + (v.rings - 1 - i) * v.stagger * 0.6 + v.duration * 0.8, kind: 'back' })
  }
  return out
}

export function draw(ctx: CanvasRenderingContext2D, v: V, t: number, w: number, h: number) {
  ctx.fillStyle = v.bg
  ctx.fillRect(0, 0, w, h)
  const ease = bezier(...v.ease)
  const cx = w / 2, cy = h * 0.42
  const level = new Array(v.rings).fill(0)
  for (const b of beats(v)) {
    if (t < b.start) continue
    const p = Math.min(1, (t - b.start) / (b.end - b.start))
    const e = ease(p)
    const bump = b.kind === 'out' ? Math.sin(e * Math.PI) : Math.sin(e * Math.PI) * 0.7
    level[b.ring] = Math.max(level[b.ring], bump)
  }
  ctx.lineWidth = v.weight
  ctx.setLineDash(v.dash === 'dashed' ? [6, 5] : v.dash === 'dotted' ? [1, 4] : [])
  ctx.lineCap = 'round'
  for (let i = 0; i < v.rings; i++) {
    const r = v.voidR + i * v.gap + level[i] * v.gap * 0.6
    ctx.strokeStyle = mix(v.ink, v.glow, level[i])
    ctx.globalAlpha = 0.35 + level[i] * 0.65
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.setLineDash([])
  ctx.fillStyle = v.glow
  ctx.font = `600 ${Math.max(14, v.voidR * 0.42)}px "Inter Variable", Inter, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(v.headline, cx, cy)
  ctx.fillStyle = mix(v.bg, v.glow, 0.55)
  ctx.font = `500 13px "Inter Variable", Inter, sans-serif`
  ctx.fillText('Tap to see what’s new', cx, h * 0.8)
}

function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16)
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255]
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb)
  const m = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`
}
