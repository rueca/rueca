/* Hand-built instrument panels: synth (right) and monitor + mixer (left). */
import { useEffect, useRef, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { Section, Row, Button, PresetMenu, useValues, useParamState, cn } from '@kit'
import { EnvelopeEditor } from '@kit/ui/envelope'
import { ChevronDown, Bookmark } from 'lucide-react'
import { params, type V } from './params'
import { TRACKS } from './pattern'
import { engine, engineState } from './engine'
import { PKnob, PSegmented } from './controls'
import { drawScope, drawSpectrum, type Ink } from './visual'

const SECTION_KEYS = {
  osc: ['wave', 'octave', 'detune', 'sub', 'glide', 'gate'],
  env: ['attack', 'decay', 'sustain', 'release'],
  filter: ['filterType', 'cutoff', 'resonance', 'envAmt', 'drive'],
  drums: ['kickTune', 'kickDecay', 'snareTone', 'snareDecay', 'hatDecay', 'hatTone'],
  fx: ['delayTime', 'delayFb', 'delayTone', 'delayRet', 'revSize', 'revRet'],
  mixer: [...TRACKS.flatMap((t) => [`${t.id}Lvl`, `${t.id}Dly`, `${t.id}Rev`]), 'volume'],
} as const

const OPEN_KEY = 'studio:synth:sections'
/** Section open state, shared by both panels and persisted. Alt-click a header to solo it. */
const openStore = createStore<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}') } catch { return {} } })
function toggleSection(id: string, solo: boolean) {
  const open = openStore.getState()
  const next = solo ? Object.fromEntries(Object.keys(SECTION_KEYS).map((k) => [k, k === id])) : { ...open, [id]: !(open[id] ?? true) }
  openStore.setState(next, true)
  try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)) } catch { /* noop */ }
}

function KSection({ id, title, children, first, actions, hint }: { id: keyof typeof SECTION_KEYS; title: string; children: ReactNode; first?: boolean; actions?: ReactNode; hint?: string }) {
  const isOpen = useStore(openStore, (o) => o[id] ?? true)
  const keys = SECTION_KEYS[id] as readonly string[]
  const changed = useParamState(params, (s) => keys.some((k) => JSON.stringify((s.values as Record<string, unknown>)[k]) !== JSON.stringify((s.defaults as Record<string, unknown>)[k])))
  return (
    <Section title={title} hint={hint} first={first} open={isOpen} onToggle={(solo) => toggleSection(id, solo)} changed={changed}
      onReset={changed ? () => params.reset(keys as never) : undefined} actions={actions}>
      {children}
    </Section>
  )
}

const Grid = ({ cols, children, className }: { cols: number; children: ReactNode; className?: string }) => (
  <div className={cn('grid gap-x-1 gap-y-2 px-2 pt-1 pb-1', className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{children}</div>
)

/** Sound presets — the kit PresetMenu over scoped presets: apply, save current sound, delete your own. */
export function SoundMenu() {
  useValues(params)
  const active = params.activePreset()
  return (
    <PresetMenu params={params} trigger={
      <Button size="sm" className="max-w-[130px] gap-1 px-1.5" aria-label={`Sound preset: ${active?.name ?? 'Custom'}`}>
        <Bookmark size={12} strokeWidth={1.5} />
        <span className="truncate">{active?.name ?? 'Custom'}</span>
        <ChevronDown size={11} className="text-fg-faint" />
      </Button>
    } />
  )
}

export function SynthPanel() {
  const v = useValues(params) as V
  const dflt = params.getState().defaults as V
  return (
    <div className="flex flex-col">
      <KSection id="osc" title="Oscillator" first hint="The bass voice. Two detuned oscillators plus a sub, into the filter.">
        <Row label="Wave"><PSegmented k="wave" /></Row>
        <Grid cols={5}>
          <PKnob k="octave" size="sm" bipolar />
          <PKnob k="detune" size="sm" />
          <PKnob k="sub" size="sm" />
          <PKnob k="glide" size="sm" />
          <PKnob k="gate" size="sm" />
        </Grid>
      </KSection>
      <KSection id="env" title="Envelope" hint="Amp and filter envelope. Drag the handles on the curve.">
        <div className="px-3 pt-1">
          <EnvelopeEditor
            label="Amp and filter envelope"
            value={{ a: v.attack, d: v.decay, s: v.sustain, r: v.release }}
            defaults={{ a: dflt.attack, d: dflt.decay, s: dflt.sustain, r: dflt.release }}
            onChange={(e, final) => params.patch({ attack: e.a, decay: e.d, sustain: e.s, release: e.r }, { commit: final })}
            marker={bassMarker}
          />
        </div>
      </KSection>
      <KSection id="filter" title="Filter">
        <Row label="Type"><PSegmented k="filterType" /></Row>
        <Grid cols={4}>
          <PKnob k="cutoff" />
          <PKnob k="resonance" />
          <PKnob k="envAmt" />
          <PKnob k="drive" />
        </Grid>
      </KSection>
      <KSection id="fx" title="Effects" hint="Two send effects. Per-track send amounts live in the mixer.">
        <Row label="Delay time"><PSegmented k="delayTime" size="sm" /></Row>
        <Grid cols={3}>
          <PKnob k="delayFb" />
          <PKnob k="delayTone" />
          <PKnob k="delayRet" label="Delay" />
        </Grid>
        <Grid cols={3} className="pt-2">
          <PKnob k="revSize" label="Reverb size" />
          <PKnob k="revRet" label="Reverb" />
          <div />
        </Grid>
      </KSection>
      <KSection id="drums" title="Drums">
        <Grid cols={3}>
          <PKnob k="kickTune" />
          <PKnob k="kickDecay" />
          <PKnob k="snareTone" />
          <PKnob k="snareDecay" />
          <PKnob k="hatDecay" />
          <PKnob k="hatTone" />
        </Grid>
      </KSection>
    </div>
  )
}

/** Where the last bass note is on its envelope, from the audio clock. */
function bassMarker() {
  const b = engine.bass
  if (!b || !engineState.getState().started) return null
  return { t: engine.now - b.time, gate: b.gate }
}

/* ---------------- monitor + mixer ---------------- */

function useInk() {
  const read = (): Ink => {
    const cs = getComputedStyle(document.documentElement)
    return { line: cs.getPropertyValue('--line').trim(), accent: cs.getPropertyValue('--signal').trim(), faint: cs.getPropertyValue('--fg-faint').trim(), well: cs.getPropertyValue('--well').trim() }
  }
  const ink = useRef<Ink | null>(null)
  useEffect(() => {
    ink.current = read()
    const on = () => requestAnimationFrame(() => (ink.current = read()))
    window.addEventListener('studio:theme', on)
    return () => window.removeEventListener('studio:theme', on)
  }, [])
  return ink
}

function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  const fn = useRef(draw)
  fn.current = draw
  useEffect(() => {
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const c = ref.current
      if (!c) return
      const dpr = Math.min(devicePixelRatio, 2), w = c.clientWidth, h = c.clientHeight
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fn.current(ctx, w, h)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  return ref
}

export function MonitorPanel() {
  const ink = useInk()
  const started = useStore(engineState, (s) => s.started)
  const peaks = useRef(new Float32Array(256))
  const meter = useRef<HTMLDivElement>(null)
  const scope = useCanvasLoop((ctx, w, h) => { if (ink.current) drawScope(ctx, w, h, started ? engine.readScope() : null, ink.current) })
  const spec = useCanvasLoop((ctx, w, h) => {
    if (!ink.current) return
    drawSpectrum(ctx, w, h, started ? engine.readFreq() : null, engine.sampleRate, ink.current, peaks.current)
    // master peak meter (reuses the scope buffer)
    const d = started ? engine.scope : null
    let pk = 0
    if (d) for (let i = 0; i < d.length; i += 4) pk = Math.max(pk, Math.abs(d[i]))
    if (meter.current) {
      const dbv = pk > 0 ? 20 * Math.log10(pk) : -60
      meter.current.style.width = `${Math.max(0, Math.min(100, ((dbv + 48) / 48) * 100))}%`
      meter.current.dataset.hot = pk > 0.95 ? 'true' : ''
    }
  })
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1.5 px-3 pt-3 pb-2">
        <div className="flex items-center justify-between text-[11px] text-fg-muted"><span>Oscilloscope</span><span className="text-fg-faint">{started ? 'master' : 'no signal'}</span></div>
        <canvas ref={scope} className="h-[84px] w-full rounded-[6px] bg-control" aria-label="Oscilloscope" role="img" />
        <div className="mt-1 flex items-center justify-between text-[11px] text-fg-muted"><span>Spectrum</span><span className="text-fg-faint">20 Hz – 20 kHz</span></div>
        <canvas ref={spec} className="h-[84px] w-full rounded-[6px] bg-control" aria-label="Spectrum analyser" role="img" />
        <div className="mt-1 flex items-center gap-2">
          <span className="w-10 text-[11px] text-fg-muted">Level</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-track">
            <div ref={meter} className="absolute inset-y-0 left-0 rounded-full bg-ok transition-[width] duration-75 data-[hot=true]:bg-rec" style={{ width: 0 }} />
          </div>
        </div>
      </div>
      <KSection id="mixer" title="Mixer" hint="Level and post-fader sends per track. Mute and solo sit on the sequencer rows.">
        <div className="grid grid-cols-[52px_1fr_1fr_1fr] items-end gap-x-1 px-2 pb-1 text-center text-[10.5px] text-fg-faint">
          <span />
          <span>Level</span><span>Delay</span><span>Reverb</span>
        </div>
        {TRACKS.map((t) => (
          <div key={t.id} className="grid grid-cols-[52px_1fr_1fr_1fr] items-center gap-x-1 px-2 py-1">
            <span className="flex min-w-0 items-center gap-1.5 pl-1 text-[11.5px] text-fg">
              <span className="size-2 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
              <span className="truncate">{t.name}</span>
            </span>
            <PKnob k={`${t.id}Lvl`} size="sm" hideLabel label={`${t.name} level`} />
            <PKnob k={`${t.id}Dly`} size="sm" hideLabel label={`${t.name} delay send`} />
            <PKnob k={`${t.id}Rev`} size="sm" hideLabel label={`${t.name} reverb send`} />
          </div>
        ))}
        <div className="mt-1 flex items-center gap-3 border-t border-line px-3 pt-3">
          <PKnob k="volume" />
          <p className="text-[11px] leading-relaxed text-fg-faint">Master runs through a gentle bus compressor before the analysers and the WAV bounce.</p>
        </div>
      </KSection>
    </div>
  )
}
