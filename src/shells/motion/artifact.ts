/* The artifact: pure functions of (values, t). The studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock, EASINGS } from '@kit'
import { cubicBezier } from '@kit/core/ease'

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
    bg: p.color('#F6F1EA', { label: 'Background', alpha: false }),
    ink: p.color('#A39E96', { label: 'Ring', hint: 'A ring at rest.' }),
    glow: p.color('#1C1A19', { label: 'Highlight', hint: 'A ring at the crest of the sweep, and the headline.' }),
    headline: p.text('Offers', { hint: 'Copy locked to the centre void.' }),
  }, { collapsed: false }),
})

export const params = createParams(schema, {
  id: 'motion',
  version: 2, // v2: wire-style palette (paper, ink, hairlines)
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

/* Drawn in the wire style (src/demo/wire.ts): a paper phone, one ink,
   hairlines for structure. The ripple is the only thing that moves; the screen
   around it is a skeleton — bars for copy, crossed slots for images. A lit ring
   gets heavier and darker, so the sweep reads by line weight, not colour. */
const W = { card: '#FBF8F2', sheet: '#E8E1D6', ink: '#1C1A19', muted: '#6E6A64', faint: '#A39E96', line: '#DCD5CA' }
const SANS = '"Inter Variable", Inter, sans-serif'
const MONO = "'Geist Mono Variable', 'Geist Mono', ui-monospace, Menlo, monospace"

export function draw(ctx: CanvasRenderingContext2D, v: V, t: number, w: number, h: number) {
  ctx.fillStyle = v.bg
  ctx.fillRect(0, 0, w, h)
  const ease = cubicBezier(v.ease)
  const cx = w / 2, cy = h * 0.38
  const level = new Array(v.rings).fill(0)
  for (const b of beats(v)) {
    if (t < b.start) continue
    const p = Math.min(1, (t - b.start) / (b.end - b.start))
    const e = ease(p)
    const bump = b.kind === 'out' ? Math.sin(e * Math.PI) : Math.sin(e * Math.PI) * 0.7
    level[b.ring] = Math.max(level[b.ring], bump)
  }
  ctx.setLineDash(v.dash === 'dashed' ? [6, 5] : v.dash === 'dotted' ? [1, 4] : [])
  ctx.lineCap = 'round'
  for (let i = 0; i < v.rings; i++) {
    const r = v.voidR + i * v.gap + level[i] * v.gap * 0.6
    ctx.lineWidth = v.weight * (1 + level[i] * 0.9)
    ctx.strokeStyle = mix(v.ink, v.glow, level[i])
    ctx.globalAlpha = 0.55 + level[i] * 0.45
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.setLineDash([])
  ctx.fillStyle = v.glow
  ctx.font = `600 ${Math.max(14, v.voidR * 0.42)}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(v.headline, cx, cy)
  skeleton(ctx, w, h)
}

/** The static screen around the ripple: status bar, header, an offers sheet. */
function skeleton(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 24
  ctx.textBaseline = 'middle'
  // status bar
  ctx.fillStyle = W.ink; ctx.textAlign = 'left'; ctx.font = `600 15px ${SANS}`
  ctx.fillText('9:41', 34, 30)
  ctx.strokeStyle = W.ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.6
  ctx.beginPath(); ctx.roundRect(w - 58.5, 24.5, 24, 12, 3.5); ctx.stroke()
  ctx.globalAlpha = 1; ctx.fillRect(w - 56, 27, 16, 7)
  bar(ctx, w - 84, 30, 16, 7, W.ink)
  // header: back + title bar + avatar slot
  ctx.strokeStyle = W.ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(pad + 8, 66); ctx.lineTo(pad, 74); ctx.lineTo(pad + 8, 82); ctx.stroke()
  bar(ctx, w / 2, 74, 72, 8, W.faint, 'center')
  ctx.save(); ctx.beginPath(); ctx.arc(w - pad - 15, 74, 15, 0, Math.PI * 2); ctx.clip()
  slot(ctx, w - pad - 30, 59, 30, 30, ''); ctx.restore()
  hair(ctx, () => { ctx.arc(w - pad - 15, 74, 14.5, 0, Math.PI * 2) })

  // the offers sheet
  const top = h * 0.66
  ctx.fillStyle = W.card
  ctx.beginPath(); ctx.roundRect(0, top, w, h - top + 40, [28, 28, 0, 0]); ctx.fill()
  hair(ctx, () => { ctx.roundRect(0.5, top + 0.5, w - 1, h - top + 40, [28, 28, 0, 0]) })
  ctx.fillStyle = W.sheet; ctx.beginPath(); ctx.roundRect(w / 2 - 18, top + 9, 36, 4, 2); ctx.fill()
  ctx.textAlign = 'left'; ctx.fillStyle = W.ink; ctx.font = `600 17px ${SANS}`
  ctx.fillText('What’s new', pad, top + 40)
  ctx.textAlign = 'right'; ctx.fillStyle = W.muted; ctx.font = `500 13px ${SANS}`
  ctx.fillText('See all', w - pad, top + 40)
  const rows: [number, number][] = [[150, 96], [118, 132], [136, 84]]
  rows.forEach(([a, b], i) => {
    const y = top + 62 + i * 70
    ctx.save(); ctx.beginPath(); ctx.roundRect(pad, y, 52, 52, 12); ctx.clip()
    slot(ctx, pad, y, 52, 52, 'offer'); ctx.restore()
    hair(ctx, () => { ctx.roundRect(pad + 0.5, y + 0.5, 51, 51, 12) })
    bar(ctx, pad + 68, y + 17, a, 9, W.ink)
    bar(ctx, pad + 68, y + 35, b, 7, W.faint)
    hair(ctx, () => { ctx.roundRect(w - pad - 56.5, y + 13.5, 56, 26, 13) })
    bar(ctx, w - pad - 28, y + 26.5, 24, 6, W.muted, 'center')
    if (i < rows.length - 1) hair(ctx, () => { ctx.moveTo(pad + 68, y + 61.5); ctx.lineTo(w - pad, y + 61.5) })
  })
  // home indicator
  ctx.fillStyle = W.ink; ctx.beginPath(); ctx.roundRect(w / 2 - 67, h - 13, 134, 5, 2.5); ctx.fill()
}

/** A skeleton text bar, centred on y. */
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, fill: string, align: 'left' | 'center' = 'left') {
  ctx.fillStyle = fill
  ctx.beginPath(); ctx.roundRect(align === 'center' ? x - bw / 2 : x, y - bh / 2, bw, bh, bh / 2); ctx.fill()
}
function hair(ctx: CanvasRenderingContext2D, path: () => void) {
  ctx.strokeStyle = W.line; ctx.lineWidth = 1; ctx.beginPath(); path(); ctx.stroke()
}
/** Image slot, painted in place (same look as wireImage): sheet, both diagonals, mono label. */
function slot(ctx: CanvasRenderingContext2D, x: number, y: number, sw: number, sh: number, label: string) {
  ctx.fillStyle = W.sheet; ctx.fillRect(x, y, sw, sh)
  ctx.strokeStyle = W.ink; ctx.globalAlpha = 0.28; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + sh); ctx.moveTo(x + sw, y); ctx.lineTo(x, y + sh); ctx.stroke()
  ctx.globalAlpha = 1
  if (!label) return
  ctx.font = `9px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const tw = ctx.measureText(label).width
  ctx.fillStyle = W.sheet; ctx.fillRect(x + sw / 2 - tw / 2 - 4, y + sh / 2 - 7, tw + 8, 14)
  ctx.fillStyle = W.ink; ctx.globalAlpha = 0.62; ctx.fillText(label, x + sw / 2, y + sh / 2 + 0.5); ctx.globalAlpha = 1
}

function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16)
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255]
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb)
  const m = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`
}
