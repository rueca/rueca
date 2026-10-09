/* ---------------------------------------------------------------------------
   The audio engine.

   createGraph(ctx, v) builds the whole instrument on ANY BaseAudioContext —
   the live AudioContext and the OfflineAudioContext used for WAV export run
   the exact same code, so the bounce sounds like what you hear.

   Live playback uses the "two clocks" pattern: a 25 ms JS timer schedules
   notes 120 ms ahead on the audio clock, and the UI reads back which step
   is sounding *now* from the queue of scheduled times.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { params, audible, num, patternOf, type V } from './params'
import { mtof, STEPS, type Pattern, type TrackId } from './pattern'
import { encodeWAV } from './wav'

export const IDS: TrackId[] = ['kick', 'snare', 'hat', 'bass']
export const stepSeconds = (bpm: number) => 60 / bpm / 4
/** Off-beat 16ths slide late; 100% = triplet shuffle. */
export const swingOffset = (i: number, v: Pick<V, 'swing' | 'bpm'>) => (i % 2 === 1 ? ((v.swing / 100) * stepSeconds(v.bpm)) / 3 : 0)
export const delaySeconds = (v: Pick<V, 'delayTime' | 'bpm'>) => (({ '1/16': 1, '1/8': 2, '3/16': 3, '1/4': 4 } as Record<string, number>)[v.delayTime] ?? 3) * stepSeconds(v.bpm)

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function noiseBuffer(ctx: BaseAudioContext) {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = b.getChannelData(0), r = mulberry(11)
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1
  return b
}
/** Synthetic stereo hall: decorrelated noise under an exponential decay, a few early reflections. */
function impulse(ctx: BaseAudioContext, seconds: number) {
  const len = Math.max(1, Math.floor(seconds * ctx.sampleRate))
  const b = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch), r = mulberry(97 + ch * 31)
    for (let i = 0; i < len; i++) { const x = i / len; d[i] = (r() * 2 - 1) * Math.pow(1 - x, 2.6) * (x < 0.002 ? x / 0.002 : 1) }
    for (const [ms, g] of [[11, 0.5], [19, 0.35], [29, 0.28], [41, 0.2]]) { const k = Math.floor(((ms + ch * 3) / 1000) * ctx.sampleRate); if (k < len) d[k] += g * (ch ? -1 : 1) }
  }
  return b
}
function driveCurve(amount: number) {
  const k = 1 + amount * 18, n = 1024, c = new Float32Array(n), norm = Math.tanh(k)
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / norm }
  return c
}

export interface BassInfo { time: number; gate: number; a: number; d: number; s: number; r: number }

export interface Graph {
  out: AudioNode
  apply: (v: V, immediate?: boolean) => void
  trigger: (track: TrackId, time: number, vel: number, v: V, note: number, stepDur: number) => void
  primeBass: (note: number | null) => void
}

export function createGraph(ctx: BaseAudioContext, onBass?: (b: BassInfo) => void): Graph {
  const master = ctx.createGain()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.16
  comp.connect(master)

  // delay return
  const delayIn = ctx.createGain(), delay = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter(), delayRet = ctx.createGain()
  tone.type = 'lowpass'; tone.Q.value = 0.5
  delayIn.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(delayRet); delayRet.connect(comp)
  // reverb return (high-passed so the low end stays dry)
  const revIn = ctx.createGain(), revHP = ctx.createBiquadFilter(), revRet = ctx.createGain()
  revHP.type = 'highpass'; revHP.frequency.value = 220
  revIn.connect(revHP); revRet.connect(comp)
  let conv: ConvolverNode | null = null

  const strips = {} as Record<TrackId, { gain: GainNode; dly: GainNode; rev: GainNode }>
  for (const id of IDS) {
    const gain = ctx.createGain(), dly = ctx.createGain(), rev = ctx.createGain()
    gain.connect(comp); gain.connect(dly); dly.connect(delayIn); gain.connect(rev); rev.connect(revIn)
    strips[id] = { gain, dly, rev }
  }
  const bassBus = ctx.createGain(), shaper = ctx.createWaveShaper(), bassPost = ctx.createGain()
  shaper.oversample = '2x'
  bassBus.connect(shaper); shaper.connect(bassPost); bassPost.connect(strips.bass.gain)

  const noise = noiseBuffer(ctx)
  let revSize = -1, driveAmt = -1
  let prevNote: number | null = null, prevEnd = -1

  const apply = (v: V, immediate = false) => {
    const now = ctx.currentTime
    const set = (p: AudioParam, x: number) => { if (immediate) { p.cancelScheduledValues(0); p.setValueAtTime(x, now) } else p.setTargetAtTime(x, now, 0.02) }
    set(master.gain, v.volume)
    for (const id of IDS) {
      set(strips[id].gain.gain, audible(v, id) ? num(v, `${id}Lvl`) : 0)
      set(strips[id].dly.gain, num(v, `${id}Dly`))
      set(strips[id].rev.gain, num(v, `${id}Rev`))
    }
    set(delay.delayTime, delaySeconds(v))
    set(fb.gain, v.delayFb)
    set(tone.frequency, v.delayTone)
    set(delayRet.gain, v.delayRet)
    set(revRet.gain, v.revRet)
    if (Math.abs(v.revSize - revSize) > 0.04) {
      // a fresh node rather than reassigning .buffer (not allowed everywhere)
      const next = ctx.createConvolver()
      next.buffer = impulse(ctx, v.revSize)
      revHP.connect(next); next.connect(revRet)
      if (conv) { const old = conv; revHP.disconnect(old); setTimeout(() => old.disconnect(), 50) }
      conv = next
      revSize = v.revSize
    }
    if (v.drive !== driveAmt) {
      shaper.curve = driveCurve(v.drive)
      set(bassPost.gain, 1 / (1 + v.drive * 1.2))
      driveAmt = v.drive
    }
  }

  const env = (g: GainNode, t: number, peak: number, decay: number, attack = 0.002) => {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  }
  const noiseSrc = (t: number, dur: number) => {
    const s = ctx.createBufferSource()
    s.buffer = noise
    s.loop = true
    s.start(t, (t * 7.31) % 0.8)
    s.stop(t + dur + 0.05)
    return s
  }

  const trigger: Graph['trigger'] = (track, t, vel, v, note, stepDur) => {
    if (track === 'kick') {
      const dec = v.kickDecay / 1000, f0 = v.kickTune
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(f0 * 4.2, t)
      o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.028)
      o.frequency.exponentialRampToValueAtTime(f0, t + 0.11)
      env(g, t, vel, dec, 0.003)
      o.connect(g); g.connect(strips.kick.gain)
      o.start(t); o.stop(t + dec + 0.05)
      // beater click
      const n = noiseSrc(t, 0.02), hp = ctx.createBiquadFilter(), cg = ctx.createGain()
      hp.type = 'highpass'; hp.frequency.value = 2500
      env(cg, t, vel * 0.22, 0.012, 0.001)
      n.connect(hp); hp.connect(cg); cg.connect(strips.kick.gain)
    } else if (track === 'snare') {
      const dec = v.snareDecay / 1000
      const o = ctx.createOscillator(), og = ctx.createGain()
      o.type = 'triangle'
      o.frequency.setValueAtTime(196, t)
      o.frequency.exponentialRampToValueAtTime(150, t + 0.09)
      env(og, t, vel * (1 - v.snareTone) * 0.95, 0.09 + dec * 0.35)
      o.connect(og); og.connect(strips.snare.gain)
      o.start(t); o.stop(t + dec + 0.1)
      const n = noiseSrc(t, dec), hp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), ng = ctx.createGain()
      hp.type = 'highpass'; hp.frequency.value = 900 + v.snareTone * 1400
      pk.type = 'peaking'; pk.frequency.value = 4200; pk.gain.value = 5; pk.Q.value = 0.8
      env(ng, t, vel * (0.32 + 0.6 * v.snareTone), dec)
      n.connect(hp); hp.connect(pk); pk.connect(ng); ng.connect(strips.snare.gain)
    } else if (track === 'hat') {
      const dec = v.hatDecay / 1000
      const n = noiseSrc(t, dec), hp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(), g = ctx.createGain()
      hp.type = 'highpass'; hp.frequency.value = 6200 + v.hatTone * 3800
      bp.type = 'peaking'; bp.frequency.value = 10500; bp.gain.value = 6; bp.Q.value = 1.2
      env(g, t, vel * 0.5, dec, 0.001)
      n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(strips.hat.gain)
    } else {
      const f = mtof(note + 12 * v.octave)
      const gate = Math.max(0.02, stepDur * v.gate)
      const A = Math.min(v.attack / 1000, gate * 0.9), D = v.decay / 1000, S = v.sustain, R = v.release / 1000
      const end = t + gate + R * 1.3 + 0.05
      const filter = ctx.createBiquadFilter(), vca = ctx.createGain()
      filter.type = v.filterType as BiquadFilterType
      filter.Q.value = v.filterType === 'lowpass' || v.filterType === 'highpass' ? v.resonance : Math.max(0.5, v.resonance * 0.6)
      const c = v.cutoff
      const peak = Math.min(18000, c * Math.pow(2, v.envAmt * 5 * (0.4 + 0.6 * vel)))
      filter.frequency.setValueAtTime(c, t)
      filter.frequency.linearRampToValueAtTime(peak, t + Math.max(0.001, A))
      filter.frequency.setTargetAtTime(c + (peak - c) * S, t + A, Math.max(0.005, D / 3))
      filter.frequency.setTargetAtTime(c, t + gate, Math.max(0.005, R / 3))
      const lvl = vel * 0.5
      vca.gain.setValueAtTime(0, t)
      vca.gain.linearRampToValueAtTime(lvl, t + Math.max(0.001, A))
      vca.gain.setTargetAtTime(lvl * S, t + A, Math.max(0.005, D / 3))
      vca.gain.setTargetAtTime(0, t + gate, Math.max(0.005, R / 4))
      filter.connect(vca); vca.connect(bassBus)

      const glide = v.glide / 1000
      const legato = glide > 0 && prevNote !== null && t - prevEnd < stepDur * 1.5
      const from = legato ? mtof(prevNote! + 12 * v.octave) : f
      const oscs: OscillatorNode[] = []
      const voices = v.detune > 0 ? [-v.detune / 2, v.detune / 2] : [0]
      for (const dt of voices) {
        const o = ctx.createOscillator()
        o.type = v.wave as OscillatorType
        o.detune.value = dt
        o.frequency.setValueAtTime(from, t)
        if (legato) o.frequency.exponentialRampToValueAtTime(f, t + glide)
        const vg = ctx.createGain(); vg.gain.value = 1 / voices.length
        o.connect(vg); vg.connect(filter)
        oscs.push(o)
      }
      if (v.sub > 0) {
        const o = ctx.createOscillator(), sg = ctx.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(from / 2, t)
        if (legato) o.frequency.exponentialRampToValueAtTime(f / 2, t + glide)
        sg.gain.value = v.sub * 0.9
        o.connect(sg); sg.connect(vca)
        oscs.push(o)
      }
      for (const o of oscs) { o.start(t); o.stop(end) }
      prevNote = note; prevEnd = t + gate
      onBass?.({ time: t, gate, a: A, d: D, s: S, r: R })
    }
  }

  return { out: master, apply, trigger, primeBass: (n) => { prevNote = n; prevEnd = n === null ? -1 : 0 } }
}

/* ======================= live engine ======================= */

export interface EngineState { started: boolean; playing: boolean; step: number }
export const engineState = createStore<EngineState>(() => ({ started: false, playing: false, step: -1 }))

const TAU: Record<TrackId, number> = { kick: 0.16, snare: 0.13, hat: 0.05, bass: 0.22 }

class Engine {
  ctx: AudioContext | null = null
  graph: Graph | null = null
  analyser: AnalyserNode | null = null
  scope = new Float32Array(2048)
  freq = new Uint8Array(1024)
  bass: BassInfo | null = null
  private timer: ReturnType<typeof setInterval> | 0 = 0
  private nextTime = 0
  private nextStep = 0
  private queue: { step: number; time: number }[] = []
  private hits: Record<TrackId, { time: number; vel: number }[]> = { kick: [], snare: [], hat: [], bass: [] }
  private raf = 0
  private unsub: (() => void) | null = null

  /** Must run inside a user gesture the first time (autoplay policy). */
  start() {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: 'interactive' })
      const g = createGraph(ctx, (b) => (this.bass = b))
      const an = ctx.createAnalyser()
      an.fftSize = 2048
      an.smoothingTimeConstant = 0.8
      g.out.connect(an)
      an.connect(ctx.destination)
      g.apply(params.values(), true)
      this.unsub = params.subscribe((s) => this.graph?.apply(s.values as V))
      this.ctx = ctx; this.graph = g; this.analyser = an
      this.scope = new Float32Array(an.fftSize)
      this.freq = new Uint8Array(an.frequencyBinCount)
    }
    const ctx = this.ctx
    const ready = ctx.state === 'running' ? Promise.resolve() : ctx.resume()
    return ready.then(() => { engineState.setState({ started: true }); this.loop() })
  }

  get now() { return this.ctx?.currentTime ?? 0 }
  get sampleRate() { return this.ctx?.sampleRate ?? 48000 }

  play() {
    const go = () => {
      if (this.timer || !this.ctx) return
      this.nextStep = 0
      this.nextTime = this.ctx.currentTime + 0.06
      this.queue = []
      this.graph?.primeBass(null)
      this.timer = setInterval(() => this.tick(), 25)
      this.tick()
      engineState.setState({ playing: true })
    }
    if (this.ctx?.state === 'running') go()
    else void this.start().then(go)
  }
  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = 0
    this.queue = []
    engineState.setState({ playing: false, step: -1 })
  }
  toggle() { if (engineState.getState().playing) this.stop(); else this.play() }

  /** Leave the page quiet: stop and suspend (the context is reused on return). */
  suspend() {
    this.stop()
    cancelAnimationFrame(this.raf); this.raf = 0
    void this.ctx?.suspend()
    engineState.setState({ started: false })
  }

  private tick() {
    const ctx = this.ctx!, v = params.values() as V
    const sd = stepSeconds(v.bpm)
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.scheduleStep(this.nextStep, this.nextTime + swingOffset(this.nextStep, v), v, sd)
      this.nextTime += sd
      this.nextStep = (this.nextStep + 1) % STEPS
    }
  }

  private scheduleStep(i: number, t: number, v: V, sd: number) {
    this.queue.push({ step: i, time: t })
    const pat = patternOf(v)
    for (const id of IDS) {
      const vel = pat[id][i]
      if (!vel || !audible(v, id)) continue
      this.graph!.trigger(id, t, vel, v, pat.notes[i], sd)
      const h = this.hits[id]
      h.push({ time: t, vel })
      if (h.length > 6) h.shift()
    }
  }

  /** Preview one sound now (clicking a step or a track name). */
  audition(id: TrackId, vel = 0.8, note?: number) {
    if (!this.ctx || this.ctx.state !== 'running' || !this.graph) return
    const v = params.values() as V
    const t = this.ctx.currentTime + 0.01
    if (id === 'bass') this.graph.primeBass(null)
    this.graph.trigger(id, t, vel, v, note ?? patternOf(v).notes[0], stepSeconds(v.bpm) * 2)
    this.hits[id].push({ time: t, vel })
    if (this.hits[id].length > 6) this.hits[id].shift()
  }

  /** 0…1 decaying envelope of a track's latest hit — drives the visuals. */
  env(id: TrackId) {
    const now = this.now
    const h = this.hits[id]
    for (let k = h.length - 1; k >= 0; k--) if (h[k].time <= now) return h[k].vel * Math.exp(-(now - h[k].time) / TAU[id])
    return 0
  }

  readScope() { if (this.analyser) this.analyser.getFloatTimeDomainData(this.scope); return this.analyser ? this.scope : null }
  readFreq() { if (this.analyser) this.analyser.getByteFrequencyData(this.freq); return this.analyser ? this.freq : null }

  /** The step whose audio is sounding now — polled per frame, published only on change. */
  private loop() {
    if (this.raf) return
    const frame = () => {
      this.raf = requestAnimationFrame(frame)
      if (!this.ctx) return
      const now = this.ctx.currentTime
      while (this.queue.length > 1 && this.queue[1].time <= now) this.queue.shift()
      const cur = this.queue[0] && this.queue[0].time <= now ? this.queue[0].step : engineState.getState().playing ? engineState.getState().step : -1
      if (cur !== engineState.getState().step) engineState.setState({ step: cur })
    }
    this.raf = requestAnimationFrame(frame)
  }

  dispose() { this.suspend(); this.unsub?.() }
}

export const engine = new Engine()

/* ======================= offline bounce ======================= */

const lastActiveNote = (p: Pattern) => { for (let i = STEPS - 1; i >= 0; i--) if (p.bass[i]) return p.notes[i]; return null }

/**
 * Render bars × 16 steps through the same graph in an OfflineAudioContext.
 * The reverb/delay tail is folded back onto the start, so the file loops
 * seamlessly in any DAW or sampler.
 */
export async function renderLoopWAV(v: V, bars = 1): Promise<{ blob: Blob; seconds: number; peak: number }> {
  const sr = 44100
  const sd = stepSeconds(v.bpm)
  const loopLen = sd * STEPS * bars
  const delayTail = v.delayFb > 0.01 ? (delaySeconds(v) * Math.log(0.001)) / Math.log(v.delayFb) : 0
  const tail = Math.min(8, Math.max(1, v.revSize + 0.4, delayTail))
  const ctx = new OfflineAudioContext(2, Math.ceil((loopLen + tail) * sr), sr)
  const g = createGraph(ctx)
  g.apply(v, true)
  g.out.connect(ctx.destination)
  const pat = patternOf(v)
  g.primeBass(lastActiveNote(pat))
  for (let b = 0; b < bars; b++)
    for (let i = 0; i < STEPS; i++) {
      const t = (b * STEPS + i) * sd + swingOffset(i, v)
      for (const id of IDS) if (pat[id][i] && audible(v, id)) g.trigger(id, t, pat[id][i], v, pat.notes[i], sd)
    }
  const buf = await ctx.startRendering()
  const N = Math.round(loopLen * sr)
  const chans = [0, 1].map((ch) => {
    const src = buf.getChannelData(ch), out = new Float32Array(N)
    for (let k = 0; k < src.length; k++) out[k % N] += src[k]
    return out
  })
  let peak = 0
  for (const c of chans) for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(c[k]))
  if (peak > 0.97) { const s = 0.966 / peak; for (const c of chans) for (let k = 0; k < N; k++) c[k] *= s }
  return { blob: encodeWAV(chans, sr), seconds: loopLen, peak }
}
