/* The instrument's state. Panels are hand-built (knobs, envelope, grid), but
   every value is a schema param so undo, share links, persistence and the
   "copy as agent prompt" export all work. The pattern is a hidden `p.data`
   document value; sounds are scoped presets (they never touch the pattern). */
import { defineSchema, folder, p, createParams, type NumberDef, type BoolDef } from '@kit'
import { DEFAULT_PATTERN, type Pattern, type TrackId } from './pattern'
import { SineIcon, TriangleIcon, SawIcon, SquareIcon } from './local/WaveIcons'

// Patterns arrive from share links and imports — five numeric step lanes (break-it S4).
const validPattern = (v: unknown) => !!v && typeof v === 'object' &&
  (['kick', 'snare', 'hat', 'bass', 'notes'] as const).every((k) => { const a = (v as Record<string, unknown>)[k]; return Array.isArray(a) && a.length > 0 && a.every((n) => typeof n === 'number' && Number.isFinite(n)) })

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`)
const hz = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 2)}k` : `${Math.round(n)}`)
const pct = (n: number) => `${Math.round(n * 100)}%`
const db = (n: number) => (n <= 0.001 ? '−∞ dB' : `${(20 * Math.log10(n)).toFixed(1)} dB`)

const track = <I extends TrackId>(id: I, level: number, dly: number, rev: number) => ({
  [`${id}Lvl`]: p.number(level, { min: 0, max: 1, step: 0.01, label: 'Level', fmt: db, unit: 'dB', display: 'knob' }),
  [`${id}Dly`]: p.number(dly, { min: 0, max: 1, step: 0.01, label: 'Delay', fmt: pct, display: 'knob', hint: 'Post-fader send to the delay.' }),
  [`${id}Rev`]: p.number(rev, { min: 0, max: 1, step: 0.01, label: 'Reverb', fmt: pct, display: 'knob', hint: 'Post-fader send to the reverb.' }),
  [`${id}Mute`]: p.boolean(false, { label: 'Mute' }),
  [`${id}Solo`]: p.boolean(false, { label: 'Solo' }),
}) as Record<`${I}Lvl` | `${I}Dly` | `${I}Rev`, NumberDef> & Record<`${I}Mute` | `${I}Solo`, BoolDef>

export const schema = defineSchema({
  transport: folder('Transport', {
    bpm: p.number(122, { min: 60, max: 180, step: 1, label: 'Tempo', unit: ' BPM' }),
    swing: p.number(22, { min: 0, max: 100, step: 1, unit: '%', hint: 'Delays every off-beat 16th. 100% is a full triplet shuffle.' }),
  }),
  osc: folder('Oscillator', {
    wave: p.select('sawtooth', [
      { value: 'sine', icon: SineIcon, hint: 'Sine' },
      { value: 'triangle', icon: TriangleIcon, hint: 'Triangle' },
      { value: 'sawtooth', icon: SawIcon, hint: 'Saw' },
      { value: 'square', icon: SquareIcon, hint: 'Square' },
    ], { label: 'Wave' }),
    octave: p.number(0, { min: -2, max: 1, step: 1, display: 'knob', fmt: (n) => (n > 0 ? `+${n}` : `${n}`), hint: 'Transpose the bass line by octaves.' }),
    detune: p.number(9, { min: 0, max: 50, step: 1, unit: 'ct', display: 'knob', hint: 'A second oscillator, detuned — thickens the saw.' }),
    sub: p.number(0.35, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', hint: 'Sine one octave down.' }),
    glide: p.number(40, { min: 0, max: 400, step: 1, fmt: ms, display: 'knob', hint: 'Portamento between consecutive notes.' }),
    gate: p.number(0.6, { min: 0.1, max: 1, step: 0.01, fmt: pct, display: 'knob', hint: 'How long each note is held, as a share of the step.' }),
  }),
  env: folder('Envelope', {
    attack: p.number(4, { min: 1, max: 2000, step: 1, fmt: ms, display: 'knob' }),
    decay: p.number(220, { min: 10, max: 2000, step: 1, fmt: ms, display: 'knob' }),
    sustain: p.number(0.35, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob' }),
    release: p.number(160, { min: 10, max: 3000, step: 1, fmt: ms, display: 'knob' }),
  }),
  filter: folder('Filter', {
    filterType: p.select('lowpass', [{ value: 'lowpass', label: 'LP', hint: 'Low-pass' }, { value: 'bandpass', label: 'BP', hint: 'Band-pass' }, { value: 'highpass', label: 'HP', hint: 'High-pass' }], { label: 'Type' }),
    cutoff: p.number(620, { min: 40, max: 18000, step: 1, fmt: hz, unit: 'Hz', display: 'knob', label: 'Cutoff' }),
    resonance: p.number(9, { min: 0.5, max: 24, step: 0.1, display: 'knob', label: 'Reso', fmt: (n) => n.toFixed(1), hint: 'Filter Q. High values whistle at the cutoff.' }),
    envAmt: p.number(0.55, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', label: 'Env amt', hint: 'How far the envelope opens the filter, scaled by velocity.' }),
    drive: p.number(0.25, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', hint: 'Soft-clip saturation on the bass bus.' }),
  }),
  drums: folder('Drums', {
    kickTune: p.number(48, { min: 30, max: 80, step: 1, unit: 'Hz', display: 'knob', label: 'Kick tune' }),
    kickDecay: p.number(420, { min: 100, max: 1200, step: 1, fmt: ms, display: 'knob', label: 'Kick decay' }),
    snareTone: p.number(0.4, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', label: 'Snare tone', hint: 'Body (0%) to noise (100%).' }),
    snareDecay: p.number(190, { min: 60, max: 600, step: 1, fmt: ms, display: 'knob', label: 'Snare decay' }),
    hatDecay: p.number(55, { min: 15, max: 400, step: 1, fmt: ms, display: 'knob', label: 'Hat decay' }),
    hatTone: p.number(0.6, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', label: 'Hat tone' }),
  }),
  fx: folder('Effects', {
    delayTime: p.select('3/16', [{ value: '1/16' }, { value: '1/8' }, { value: '3/16', label: '1/8d', hint: 'Dotted eighth' }, { value: '1/4' }], { label: 'Time' }),
    delayFb: p.number(0.42, { min: 0, max: 0.9, step: 0.01, fmt: pct, display: 'knob', label: 'Feedback' }),
    delayTone: p.number(3200, { min: 400, max: 12000, step: 1, fmt: hz, unit: 'Hz', display: 'knob', label: 'Tone', hint: 'Low-pass inside the feedback loop — each repeat gets darker.' }),
    delayRet: p.number(0.6, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', label: 'Return' }),
    revSize: p.number(2.2, { min: 0.3, max: 6, step: 0.1, fmt: (n) => `${n.toFixed(1)}s`, display: 'knob', label: 'Size', live: false }),
    revRet: p.number(0.5, { min: 0, max: 1, step: 0.01, fmt: pct, display: 'knob', label: 'Return' }),
  }),
  mixer: folder('Mixer', {
    ...track('kick', 0.9, 0, 0.04),
    ...track('snare', 0.62, 0.1, 0.28),
    ...track('hat', 0.42, 0.18, 0.12),
    ...track('bass', 0.6, 0.22, 0.1),
    volume: p.number(0.8, { min: 0, max: 1, step: 0.01, fmt: db, unit: 'dB', display: 'knob', label: 'Master' }),
  }),
  view: folder('View', {
    visual: p.select('orbit', [{ value: 'orbit', label: 'Orbit' }, { value: 'horizon', label: 'Horizon' }]),
  }),
  doc: folder('Pattern', {
    pattern: p.data<Pattern>(DEFAULT_PATTERN, { share: true, validate: validPattern, hint: 'The 16-step pattern: drum velocities, bass velocities and notes.' }),
  }),
})

/** Sounds: synth-voice presets. Scoped — applying one changes only these keys, never the pattern or mix. */
export const SOUND_KEYS = ['wave', 'detune', 'sub', 'glide', 'gate', 'attack', 'decay', 'sustain', 'release', 'filterType', 'cutoff', 'resonance', 'envAmt', 'drive'] as const
export const SOUNDS = {
  Acid: { wave: 'sawtooth', detune: 0, sub: 0.2, glide: 70, gate: 0.55, attack: 2, decay: 180, sustain: 0.1, release: 90, filterType: 'lowpass', cutoff: 380, resonance: 17, envAmt: 0.8, drive: 0.55 },
  'Round sub': { wave: 'sine', detune: 0, sub: 0.6, glide: 20, gate: 0.85, attack: 8, decay: 400, sustain: 0.8, release: 220, filterType: 'lowpass', cutoff: 900, resonance: 1, envAmt: 0.1, drive: 0.15 },
  Pluck: { wave: 'square', detune: 14, sub: 0.15, glide: 0, gate: 0.3, attack: 1, decay: 120, sustain: 0, release: 140, filterType: 'lowpass', cutoff: 1400, resonance: 5, envAmt: 0.65, drive: 0.1 },
  'Wide saw': { wave: 'sawtooth', detune: 28, sub: 0.35, glide: 35, gate: 0.7, attack: 12, decay: 300, sustain: 0.5, release: 260, filterType: 'lowpass', cutoff: 1100, resonance: 4, envAmt: 0.4, drive: 0.3 },
  Hollow: { wave: 'triangle', detune: 6, sub: 0.1, glide: 50, gate: 0.6, attack: 20, decay: 260, sustain: 0.45, release: 300, filterType: 'bandpass', cutoff: 700, resonance: 6, envAmt: 0.5, drive: 0.4 },
} as const

export const params = createParams(schema, {
  id: 'synth',
  presets: Object.entries(SOUNDS).map(([name, values]) => ({ name, values })),
  presetKeys: [...SOUND_KEYS],
})
export type V = ReturnType<typeof params.values>
export const patternOf = (v: V) => v.pattern
export const setPattern = (pat: Pattern, commit = true) => params.setValue('pattern', pat, { commit })

export const audible = (v: V, id: TrackId) => {
  const anySolo = v.kickSolo || v.snareSolo || v.hatSolo || v.bassSolo
  return !(v as Record<string, unknown>)[`${id}Mute`] && (!anySolo || !!(v as Record<string, unknown>)[`${id}Solo`])
}
export const num = (v: V, k: string) => (v as Record<string, unknown>)[k] as number
