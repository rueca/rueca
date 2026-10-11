/* ---------------------------------------------------------------------------
   Visuals — pure draw functions of (frame data). The stage visual is the
   artifact (its colours are its own); scope and spectrum are chrome
   instruments and take theme tokens as arguments.
--------------------------------------------------------------------------- */
import { STEPS, TRACKS, type Pattern, type TrackId } from './pattern'

export interface StageFrame {
  t: number // seconds, wall clock
  w: number
  h: number
  started: boolean
  playing: boolean
  step: number
  env: Record<TrackId, number>
  scope: Float32Array | null
  freq: Uint8Array | null
  pattern: Pattern
  cutoff: number
  bpm: number
  style: string
}

const COL = Object.fromEntries(TRACKS.map((t) => [t.id, t.color])) as Record<TrackId, string>
const TAU = Math.PI * 2

/** Find a rising zero crossing so the waveform holds still (oscilloscope trigger). */
export function triggerIndex(d: Float32Array, span: number) {
  for (let i = 1; i < d.length - span; i++) if (d[i - 1] < 0 && d[i] >= 0) return i
  return 0
}

/* The stage is drawn the way the 18th century drew sound (brand/prototypes/DIRECTION.md):
   ink on Rueca's paper, the four tracks as the only colour. Two plates:
     plate          Chladni figures: sand on a bowed brass plate gathers on the lines that don't move.
                    The bass note picks the mode; the kick scatters the sand; the rest settles it.
     harmonograph   a pendulum drawing: two swings at the ratio of the bass intervals,
                    decaying, restarted by each kick. */
const PAPER = '#F3F1EB', INK = '#181411', MUTE = '#6E6A64', LINE = '#DCD7CE'
const SANS = '"IBM Plex Sans Variable", "Inter Variable", system-ui, sans-serif'
const HAND = '"La Belle Aurore", cursive'

export function drawStage(ctx: CanvasRenderingContext2D, f: StageFrame) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, f.w, f.h)
  if (f.style === 'harmonograph') drawHarmonograph(ctx, f)
  else drawPlate(ctx, f)
}

/* --- Chladni plate --- */
/** Mode pairs (n, m) of a square plate, simplest first; the bass note walks them. */
const MODES: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [1, 5], [3, 5], [4, 5], [2, 7], [1, 6], [4, 7]]
const chladni = (n: number, m: number, x: number, y: number) =>
  Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)
const SAND = 7000
let sx: Float32Array | null = null, sy: Float32Array | null = null
let modeFrom = 0, modeTo = 0, modeAt = 0, lastT = 0

function modeFor(f: StageFrame) {
  if (!f.started || !f.playing) return (Math.floor(f.t / 6) + 4) % MODES.length // idle: a new figure every few seconds, from (3, 4)
  // the bass note of the current bar picks the figure
  const bar = Math.floor(f.step / 4) * 4
  let note = 36
  for (let i = bar; i < bar + 4; i++) if (f.pattern.bass[i] > 0) { note = f.pattern.notes[i]; break }
  return ((note % 12) + Math.floor(f.step / 8)) % MODES.length
}

function drawPlate(ctx: CanvasRenderingContext2D, f: StageFrame) {
  const { w, h, env } = f
  const S = Math.min(w, h) * 0.66, x0 = (w - S) / 2, y0 = (h - S) / 2 - h * 0.02
  const want = modeFor(f)
  if (!sx || !sy) {
    // first frame: scatter the sand and let it settle on the opening figure, so the plate never opens as noise
    sx = new Float32Array(SAND); sy = new Float32Array(SAND)
    modeFrom = modeTo = want
    const [n, m] = MODES[want]
    for (let i = 0; i < SAND; i++) {
      let x = Math.random(), y = Math.random()
      for (let k = 0; k < 420; k++) {
        const hop = Math.abs(chladni(n, m, x, y)) * 0.05 + 0.0002 * Math.random()
        x = Math.min(1, Math.max(0, x + (Math.random() - 0.5) * hop)); y = Math.min(1, Math.max(0, y + (Math.random() - 0.5) * hop))
      }
      sx[i] = x; sy[i] = y
    }
  }
  if (want !== modeTo) { modeFrom = modeTo; modeTo = want; modeAt = f.t }
  const k = Math.min(1, (f.t - modeAt) / 0.6) // cross-fade the figure over 0.6s
  const [n0, m0] = MODES[modeFrom], [n1, m1] = MODES[modeTo]
  const field = (x: number, y: number) => chladni(n0, m0, x, y) * (1 - k) + chladni(n1, m1, x, y) * k
  const dt = Math.min(0.05, Math.max(0.001, f.t - lastT)); lastT = f.t
  // each grain hops in proportion to how hard its spot vibrates; the kick shakes everything
  const shake = 0.0004 + env.kick * 0.022 + env.snare * 0.006
  for (let sub = 0; sub < 3; sub++)
    for (let i = 0; i < SAND; i++) {
      const a = Math.abs(field(sx[i], sy[i]))
      const hop = (a * 0.06 + shake * Math.random()) * (dt * 30) // linear in the vibration: grains drift until they find a line that's still
      sx[i] += (Math.random() - 0.5) * hop
      sy[i] += (Math.random() - 0.5) * hop
      if (sx[i] < 0 || sx[i] > 1 || sy[i] < 0 || sy[i] > 1) { sx[i] = Math.random(); sy[i] = Math.random() }
    }

  // the plate: a brass square in hairline, its clamp at the centre
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.5; ctx.lineWidth = 1
  ctx.strokeRect(x0 - 0.5, y0 - 0.5, S + 1, S + 1)
  ctx.globalAlpha = 0.18; ctx.strokeRect(x0 - 6.5, y0 - 6.5, S + 13, S + 13)
  ctx.globalAlpha = 1
  // the sand
  ctx.fillStyle = INK
  const g = Math.max(1, S / 520)
  for (let i = 0; i < SAND; i++) ctx.fillRect(x0 + sx[i] * S - g / 2, y0 + sy[i] * S - g / 2, g, g)
  ctx.beginPath(); ctx.arc(x0 + S / 2, y0 + S / 2, Math.max(2.5, S * 0.008), 0, TAU); ctx.fill()

  // the four tracks: one dye mark per corner, filled as the track sounds
  const ids: TrackId[] = ['kick', 'snare', 'hat', 'bass']
  ids.forEach((id, i) => {
    const cx = i % 2 ? x0 + S + 18 : x0 - 18, cy = i < 2 ? y0 - 18 : y0 + S + 18
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU)
    ctx.fillStyle = COL[id]; ctx.globalAlpha = 0.18 + env[id] * 0.82; ctx.fill()
    ctx.globalAlpha = 0.5; ctx.strokeStyle = INK; ctx.lineWidth = 0.75; ctx.stroke()
  })
  ctx.globalAlpha = 1

  // the plate's caption, engraved small; the mode in the red pen
  const fs = Math.max(10, S * 0.03)
  ctx.font = `500 ${fs}px ${SANS}`; ctx.fillStyle = MUTE; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(`Fig. ${modeTo + 1} · ${f.started ? `${Math.round(f.bpm)} bpm` : 'click to start'}`, x0, y0 + S + fs * 3)
  ctx.font = `${fs * 1.5}px ${HAND}`; ctx.fillStyle = COL.kick; ctx.textAlign = 'right'
  ctx.fillText(`n = ${n1}, m = ${m1}`, x0 + S, y0 + S + fs * 3.1)
}

/* --- harmonograph --- */
let swingAt = 0, lastKick = 0
function drawHarmonograph(ctx: CanvasRenderingContext2D, f: StageFrame) {
  const { w, h, env } = f
  const S = Math.min(w, h) * 0.34, cx = w / 2, cy = h / 2 - h * 0.02
  if (env.kick > 0.7 && lastKick <= 0.7) swingAt = f.t // a kick restarts the swing
  lastKick = env.kick
  // frequencies from the bass: the current note against the root, as a ratio near a simple fraction
  const bar = Math.floor(f.step / 4) * 4
  let rel = 7
  if (f.started) for (let i = bar; i < bar + 4; i++) if (f.pattern.bass[i] > 0) { rel = ((f.pattern.notes[i] - 36) % 12 + 12) % 12 || 7; break }
  const ratio = Math.pow(2, rel / 12)
  const f1 = 2, f2 = 2 * ratio, decay = 0.0016 + (1 - Math.min(1, f.cutoff / 6000)) * 0.002
  const age = f.started ? f.t - swingAt : (f.t % 12)
  const ph = age * 0.35 + env.snare * 0.6
  ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.85
  ctx.beginPath()
  const N = 2600
  for (let i = 0; i <= N; i++) {
    const t = i * 0.045
    const d = Math.exp(-decay * i)
    const x = cx + S * d * (Math.sin(f1 * t + ph) * 0.62 + Math.sin(f2 * t * 1.003) * 0.38)
    const y = cy + S * d * (Math.sin(f2 * t + Math.PI / 2) * 0.62 + Math.sin(f1 * t * 0.997 + ph * 0.5) * 0.38)
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.stroke(); ctx.globalAlpha = 1
  // the hat ticks round the rim like a dial; the bass a dye ring
  ctx.strokeStyle = LINE; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(cx, cy, S * 1.12, 0, TAU); ctx.stroke()
  for (let i = 0; i < STEPS; i++) {
    const a = (i / STEPS) * TAU - Math.PI / 2, on = f.started && i === f.step
    ctx.strokeStyle = on ? COL.hat : INK; ctx.globalAlpha = on ? 1 : 0.35; ctx.lineWidth = on ? 2 : 1
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * S * 1.12, cy + Math.sin(a) * S * 1.12); ctx.lineTo(cx + Math.cos(a) * S * (1.12 + (i % 4 ? 0.04 : 0.08)), cy + Math.sin(a) * S * (1.12 + (i % 4 ? 0.04 : 0.08))); ctx.stroke()
  }
  ctx.globalAlpha = 0.25 + env.bass * 0.75; ctx.strokeStyle = COL.bass; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy, S * 1.2, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1
  const fs = Math.max(10, S * 0.06)
  ctx.font = `500 ${fs}px ${SANS}`; ctx.fillStyle = MUTE; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(f.started ? `${f1} : ${f2.toFixed(2)}` : 'click to start', cx, cy + S * 1.2 + fs * 2.4)
}

export interface Ink { line: string; accent: string; faint: string; well: string }

export function drawScope(ctx: CanvasRenderingContext2D, w: number, h: number, d: Float32Array | null, ink: Ink) {
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = ink.line
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2)
  for (let k = 1; k < 4; k++) { ctx.moveTo((w * k) / 4, 0); ctx.lineTo((w * k) / 4, h) }
  ctx.stroke()
  if (!d) return
  const span = 768
  const s = triggerIndex(d, span)
  ctx.strokeStyle = ink.accent
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < span; i++) {
    const x = (i / (span - 1)) * w, y = h / 2 - (d[s + i] ?? 0) * h * 0.45
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.stroke()
}

export function drawSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number, d: Uint8Array | null, sampleRate: number, ink: Ink, peaks: Float32Array) {
  ctx.clearRect(0, 0, w, h)
  // decade grid: 100 Hz, 1k, 10k
  const fx = (hz: number) => (Math.log10(hz / 20) / Math.log10(20000 / 20)) * w
  ctx.strokeStyle = ink.line
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const hz of [100, 1000, 10000]) { ctx.moveTo(fx(hz), 0); ctx.lineTo(fx(hz), h) }
  ctx.stroke()
  ctx.fillStyle = ink.faint
  ctx.font = '9.5px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('100', fx(100) + 3, h - 4); ctx.fillText('1k', fx(1000) + 3, h - 4); ctx.fillText('10k', fx(10000) + 3, h - 4)
  if (!d) return
  const bars = Math.floor(w / 4)
  const nyq = sampleRate / 2
  for (let b = 0; b < bars; b++) {
    const f0 = 20 * Math.pow(1000, b / bars), f1 = 20 * Math.pow(1000, (b + 1) / bars)
    const i0 = Math.max(1, Math.floor((f0 / nyq) * d.length)), i1 = Math.max(i0 + 1, Math.ceil((f1 / nyq) * d.length))
    let m = 0
    for (let i = i0; i < i1 && i < d.length; i++) m = Math.max(m, d[i])
    const v = m / 255
    peaks[b] = Math.max(v, (peaks[b] ?? 0) - 0.012)
    const x = (b / bars) * w, bw = w / bars - 1
    ctx.fillStyle = ink.accent
    ctx.globalAlpha = 0.35 + v * 0.65
    ctx.fillRect(x, h - v * h, bw, v * h)
    ctx.globalAlpha = 1
    ctx.fillStyle = ink.faint
    ctx.fillRect(x, h - peaks[b] * h - 1, bw, 1)
  }
}
