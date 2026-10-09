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

function hash(n: number) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x) }

export function drawStage(ctx: CanvasRenderingContext2D, f: StageFrame) {
  if (f.style === 'horizon') return drawHorizon(ctx, f)
  const { w, h, env } = f
  const cx = w / 2, cy = h / 2
  const R = Math.min(w, h) * 0.2 * (1 + env.kick * 0.1)
  const glowHue = 255 + Math.log2(f.cutoff / 620) * 18

  // background: deep, tinted by the bass and the filter
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75)
  bg.addColorStop(0, `hsl(${glowHue}, 60%, ${8 + env.bass * 8 + env.kick * 5}%)`)
  bg.addColorStop(1, '#07070a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const idle = !f.started
  const breath = 0.5 + 0.5 * Math.sin(f.t * 1.4)

  // spectrum petals
  const bars = 96
  if (f.freq || idle) {
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * TAU - Math.PI / 2
      let m: number
      if (f.freq && !idle) {
        const bin = Math.floor(Math.pow(i / bars, 2) * f.freq.length * 0.5) + 2
        m = f.freq[bin] / 255
      } else m = 0.12 + 0.08 * Math.sin(i * 0.5 + f.t * 2) * breath
      const r0 = R * 1.72, r1 = r0 + m * R * 0.9
      ctx.strokeStyle = `hsla(${glowHue + i * 1.2}, 90%, ${55 + m * 25}%, ${0.25 + m * 0.6})`
      ctx.lineWidth = Math.max(1.5, (TAU * r0) / bars - 2.5)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
      ctx.stroke()
    }
  }

  // snare: expanding shock ring
  if (env.snare > 0.01) {
    const k = 1 - env.snare
    ctx.strokeStyle = `rgba(255, 210, 90, ${env.snare * 0.7})`
    ctx.lineWidth = 2 + env.snare * 6
    ctx.beginPath(); ctx.arc(cx, cy, R * (1.25 + k * 1.6), 0, TAU); ctx.stroke()
  }

  // kick: core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95)
  core.addColorStop(0, `rgba(255, 120, 80, ${0.12 + env.kick * 0.55})`)
  core.addColorStop(1, 'rgba(255, 90, 54, 0)')
  ctx.fillStyle = core
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.95, 0, TAU); ctx.fill()

  // circular oscilloscope
  ctx.lineWidth = 2
  ctx.strokeStyle = `rgba(232, 236, 255, ${idle ? 0.35 : 0.9})`
  ctx.beginPath()
  const N = 512
  const d = f.scope
  const start = d && !idle ? triggerIndex(d, N) : 0
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU - Math.PI / 2
    const s = d && !idle ? d[start + (i % N)] ?? 0 : Math.sin(i / N * TAU * 3 + f.t * 2) * 0.05 * breath
    const r = R * (1 + s * 0.55)
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  // 16 step beads, lit by the pattern, playhead bright
  for (let i = 0; i < STEPS; i++) {
    const a = (i / STEPS) * TAU - Math.PI / 2
    const rr = R * 1.42
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    let top: TrackId | null = null, vel = 0
    for (const id of ['bass', 'hat', 'snare', 'kick'] as TrackId[]) if (f.pattern[id][i] > 0 && f.pattern[id][i] >= vel * 0.7) { top = id; vel = Math.max(vel, f.pattern[id][i]) }
    const on = i === f.step
    ctx.beginPath()
    ctx.arc(x, y, (on ? 5.5 : 3) + vel * 2.5, 0, TAU)
    ctx.fillStyle = top ? COL[top] : 'rgba(255,255,255,0.14)'
    ctx.globalAlpha = on ? 1 : top ? 0.45 + vel * 0.4 : 1
    ctx.fill()
    if (on) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill() }
    ctx.globalAlpha = 1
  }

  // hats: sparks scattered around the ring
  if (env.hat > 0.02) {
    const seed = Math.floor(f.t * 20)
    for (let k = 0; k < 14; k++) {
      const a = hash(seed + k) * TAU, rr = R * (1.9 + hash(seed * 3 + k) * 0.9)
      ctx.fillStyle = `rgba(61, 220, 255, ${env.hat * (0.4 + hash(k + seed) * 0.6)})`
      ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 2)
    }
  }
}

function drawHorizon(ctx: CanvasRenderingContext2D, f: StageFrame) {
  const { w, h, env } = f
  const hy = h * 0.58
  const sky = ctx.createLinearGradient(0, 0, 0, hy)
  sky.addColorStop(0, '#07060f')
  sky.addColorStop(1, `hsl(${290 - env.bass * 30}, 70%, ${14 + env.kick * 10}%)`)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, hy)
  ctx.fillStyle = '#07060c'
  ctx.fillRect(0, hy, w, h - hy)

  // sun
  const sr = Math.min(w, h) * 0.2 * (1 + env.kick * 0.08)
  const sun = ctx.createLinearGradient(0, hy - sr * 2, 0, hy)
  sun.addColorStop(0, '#ffd36b'); sun.addColorStop(1, '#ff3d7f')
  ctx.save()
  ctx.beginPath(); ctx.arc(w / 2, hy, sr, Math.PI, 0); ctx.clip()
  ctx.fillStyle = sun; ctx.fillRect(w / 2 - sr, hy - sr, sr * 2, sr)
  ctx.fillStyle = '#07060f'
  for (let k = 0; k < 7; k++) { const y = hy - sr * 0.08 - k * sr * 0.13; ctx.fillRect(w / 2 - sr, y, sr * 2, 2 + (6 - k) * 0.9 + env.snare * 3) }
  ctx.restore()

  // spectrum ridge
  const d = f.freq
  ctx.beginPath()
  ctx.moveTo(0, hy)
  const N = 128
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * w
    const mirror = Math.abs(i / N - 0.5) * 2
    const bin = Math.floor(Math.pow(mirror, 1.8) * (d ? d.length * 0.45 : 1)) + 2
    const m = d && f.started ? d[bin] / 255 : 0.1 + 0.05 * Math.sin(i * 0.4 + f.t)
    ctx.lineTo(x, hy - m * h * 0.22 * (0.4 + mirror))
  }
  ctx.lineTo(w, hy); ctx.closePath()
  ctx.fillStyle = 'rgba(176, 124, 255, 0.28)'; ctx.fill()
  ctx.strokeStyle = `rgba(214, 190, 255, ${0.6 + env.bass * 0.4})`; ctx.lineWidth = 1.5; ctx.stroke()

  // floor grid, scrolling with the tempo
  const speed = (f.bpm / 60) * 0.5
  ctx.strokeStyle = `rgba(255, 61, 127, ${0.35 + env.kick * 0.4})`
  ctx.lineWidth = 1
  for (let k = 0; k < 18; k++) {
    const z = ((k + (f.playing ? (f.t * speed) % 1 : 0)) / 18)
    const y = hy + Math.pow(z, 2.2) * (h - hy)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  for (let k = -12; k <= 12; k++) {
    ctx.beginPath(); ctx.moveTo(w / 2 + k * 6, hy); ctx.lineTo(w / 2 + k * w * 0.12, h); ctx.stroke()
  }
  // hats twinkle
  if (env.hat > 0.02) for (let k = 0; k < 24; k++) {
    ctx.fillStyle = `rgba(61, 220, 255, ${env.hat * hash(k + Math.floor(f.t * 16))})`
    ctx.fillRect(hash(k * 7.7) * w, hash(k * 3.3) * hy * 0.7, 2, 2)
  }
  // step strip along the horizon
  for (let i = 0; i < STEPS; i++) {
    const x = w * 0.2 + (i / (STEPS - 1)) * w * 0.6
    ctx.fillStyle = i === f.step ? '#ffffff' : 'rgba(255,255,255,0.18)'
    ctx.fillRect(x - 6, h - 22, 12, i === f.step ? 4 : 2)
  }
}

/* ---------------- chrome instruments ---------------- */

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
