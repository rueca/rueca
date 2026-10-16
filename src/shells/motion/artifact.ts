/* The artifact: pure functions of (values, t). The studio never reaches in here. */
import { defineSchema, folder, p, createParams, createClock, EASINGS } from '@kit'
import { cubicBezier } from '@kit/core/ease'
import { CAMPANA, DYE, loadDemo } from '@/demo/clients'

export const schema = defineSchema({
  geometry: folder('Geometry', {
    rings: p.number(22, { min: 3, max: 40, step: 1, hint: 'How many rings radiate from the centre.' }),
    voidR: p.number(140, { min: 0, max: 160, step: 1, unit: 'px', label: 'Centre void', hint: 'Inner radius kept clear for the bell.' }),
    gap: p.number(13.5, { min: 4, max: 30, step: 0.5, unit: 'px', hint: 'Distance between rings.' }),
    weight: p.number(2.7, { min: 0.5, max: 4, step: 0.05, label: 'Stroke weight', hint: 'Line thickness. Never scales, so it stays crisp at any zoom.' }),
    dash: p.select('dotted', ['solid', 'dashed', 'dotted'], { hint: 'Ring stroke style.' }),
  }),
  timing: folder('Timing', {
    duration: p.number(1450, { min: 400, max: 3000, step: 50, fmt: (v) => `${(v / 1000).toFixed(2)}s`, hint: 'Length of one outward sweep.' }),
    stagger: p.number(42, { min: 0, max: 120, step: 1, unit: 'ms', hint: 'Delay between each ring lighting up — what makes the sweep travel.' }),
    ease: p.curve(EASINGS['Out expo'], { hint: 'Easing of each ring’s rise.' }),
    returnSweep: p.boolean(true, { label: 'Return sweep', hint: 'Light sweeps back inward after the outward pass.' }),
    returnDelay: p.number(160, { min: 0, max: 800, step: 10, unit: 'ms', label: 'Return delay', when: (v) => v.returnSweep }),
  }),
  color: folder('Colour', {
    bg: p.color('#F3F1EB', { label: 'Background', alpha: false }),
    ink: p.color('#A39E96', { label: 'Ring', hint: 'A ring at rest.' }),
    glow: p.color('#181411', { label: 'Highlight', hint: 'A ring at the crest of the sweep, and the headline.' }),
    headline: p.text('Ring once.', { hint: 'Set under the rings.' }),
  }, { collapsed: true }),
})

export const params = createParams(schema, {
  id: 'motion',
  version: 4, // v4: Campana's bell rings; v2 was the wire-style offers screen
  presets: [
    { name: 'Calm', values: { stagger: 70, duration: 2200, rings: 10 } },
    { name: 'Punchy', values: { stagger: 18, duration: 800, ease: EASINGS['Out back'], weight: 2 } },
    { name: 'Dense', values: { rings: 32, gap: 5, weight: 0.8 } },
    // a second palette: fired clay, the rings warm and the crest brick red. It stays on a light ground, because the
    // header, the sheet and the bell's engraving are dark ink (Rafael's comment, 2026-10-16)
    { name: 'Arcilla', values: { bg: '#F4E4D8', ink: '#C4A797', glow: '#B23E1A' } },
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

/* Campana's app (src/demo/clients.ts): the engraved bell in the centre, and the
   ripple as the sound it makes, drawn like rings in a physics plate. A lit ring
   gets heavier and darker, so the sweep reads by line weight, not colour. The
   screen around it is the product sheet: the bell's three finishes. */
const W = { card: DYE.card, sheet: '#E7E3DB', ink: DYE.nogal, muted: DYE.mute, faint: DYE.faint, line: DYE.line }
const SANS = '"IBM Plex Sans Variable", "Inter Variable", Inter, sans-serif'
const SERIF = '"Newsreader Variable", Newsreader, Georgia, serif'
let bell: HTMLImageElement | null = null
loadDemo(CAMPANA.bell).then((im) => { bell = im }).catch(() => {})

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
  // the bell in the void (ink on transparent), struck lightly as the sweep starts
  if (bell && v.voidR > 8) {
    // sized to sit well inside the void, with air between it and the first ring
    const bh = v.voidR * 1.15, bw = (bh * bell.naturalWidth) / bell.naturalHeight
    const swing = Math.sin(Math.min(1, t / 420) * Math.PI * 3) * (1 - Math.min(1, t / 420)) * 0.06
    ctx.save(); ctx.translate(cx, cy - bh * 0.5); ctx.rotate(swing)
    ctx.drawImage(bell, -bw / 2, 0, bw, bh)
    ctx.restore()
  }
  const outer = v.voidR + (v.rings - 1) * v.gap
  ctx.fillStyle = v.glow
  ctx.font = `400 30px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (v.headline) ctx.fillText(v.headline, cx, Math.max(cy + outer + 26, h * 0.66 - 30))
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
  // header: back, the wordmark, the bag
  ctx.strokeStyle = W.ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(pad + 8, 66); ctx.lineTo(pad, 74); ctx.lineTo(pad + 8, 82); ctx.stroke()
  ctx.fillStyle = W.ink; ctx.textAlign = 'center'; ctx.font = `400 19px ${SERIF}`
  ctx.fillText('Campana', w / 2, 75)
  hair(ctx, () => { ctx.arc(w - pad - 15, 74, 14.5, 0, Math.PI * 2) })
  ctx.strokeStyle = W.ink; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.roundRect(w - pad - 21, 71, 12, 10, 2); ctx.moveTo(w - pad - 18, 71); ctx.arc(w - pad - 15, 71, 3, Math.PI, 0); ctx.stroke()

  // the product sheet: the bell's finishes
  const top = h * 0.66
  ctx.fillStyle = W.card
  ctx.beginPath(); ctx.roundRect(0, top, w, h - top + 40, [28, 28, 0, 0]); ctx.fill()
  hair(ctx, () => { ctx.roundRect(0.5, top + 0.5, w - 1, h - top + 40, [28, 28, 0, 0]) })
  ctx.fillStyle = W.sheet; ctx.beginPath(); ctx.roundRect(w / 2 - 18, top + 9, 36, 4, 2); ctx.fill()
  ctx.textAlign = 'left'; ctx.fillStyle = W.ink; ctx.font = `400 22px ${SERIF}`
  ctx.fillText('The hand bell', pad, top + 40)
  ctx.textAlign = 'right'; ctx.fillStyle = W.muted; ctx.font = `500 13px ${SANS}`
  ctx.fillText('Bronze, 19 cm tall', w - pad, top + 41)
  const rows: [string, string, string, string][] = [['Brass', 'Polished, lacquered', '#C9A14A', '€68'], ['Cacao', 'Dark patina, waxed', '#5B4A32', '€74'], ['Achiote', 'Enamel, hand-fired', DYE.achiote, '€82']]
  rows.forEach(([name, sub, dye, price], i) => {
    const y = top + 62 + i * 70
    ctx.fillStyle = dye; ctx.beginPath(); ctx.arc(pad + 26, y + 26, 22, 0, Math.PI * 2); ctx.fill()
    hair(ctx, () => { ctx.arc(pad + 26, y + 26, 22.5, 0, Math.PI * 2) })
    ctx.textAlign = 'left'; ctx.fillStyle = W.ink; ctx.font = `600 15px ${SANS}`; ctx.fillText(name, pad + 68, y + 18)
    ctx.fillStyle = W.muted; ctx.font = `400 13px ${SANS}`; ctx.fillText(sub, pad + 68, y + 37)
    if (i === 0) { ctx.fillStyle = W.ink; ctx.beginPath(); ctx.roundRect(w - pad - 56, y + 13, 56, 26, 13); ctx.fill() }
    else hair(ctx, () => { ctx.roundRect(w - pad - 56.5, y + 13.5, 56, 26, 13) })
    ctx.textAlign = 'center'; ctx.fillStyle = i === 0 ? W.card : W.ink; ctx.font = `600 13px ${SANS}`; ctx.fillText(price, w - pad - 28, y + 26.5)
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
function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1, 7), 16), pb = parseInt(b.slice(1, 7), 16)
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255]
  const [r1, g1, b1] = ch(pa), [r2, g2, b2] = ch(pb)
  const m = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`
}
