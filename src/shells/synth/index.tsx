import '@fontsource/la-belle-aurore/latin-400.css'
import '@fontsource-variable/ibm-plex-sans'
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import {
  Braces, Download, FileAudio, FileUp, Image as ImageIcon, Play, Power, Repeat, Square, Volume2, ArrowLeft, ArrowRight, Dices, Eraser, Sparkles, Eye, Gauge,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Stage, CanvasSurface, ParamActions, Menu, Button, IconButton, CommandPalette, ScrubValue, Segmented,
  Divider, Badge, Tip, useValues, createClock, exportCanvasPNG, exportJSON, download, copyText, toast, cn, shareMenuItems,
  type SurfaceHandle, type Command, type MenuItem,
} from '@kit'
import { params, patternOf, setPattern, SOUNDS, type V } from './params'
import { PATTERNS, TRACKS, clearTrack, humanise, randomHats, sanitizePattern, shiftPattern, type TrackId } from './pattern'
import { engine, engineState, renderLoopWAV, stepSeconds } from './engine'
import { drawStage } from './visual'
import { Sequencer, SequencerHeader, applyPatternPreset } from './Sequencer'
import { SynthPanel, MonitorPanel, SoundMenu } from './panels'
import { site } from '../../site.config'

const CAPTURE = typeof location !== 'undefined' && /[?&]qa\b/.test(location.search)

/** A free-running clock just to tick the stage canvas (audio time is the real master). */
const visClock = createClock({ duration: 3_600_000, loop: true })

const Mark = <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><path d="M2 8.5h2.2l1.6-4 2.4 8 2-6 1.2 2H14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>

function patternDoc(v: V) {
  const { pattern, ...rest } = params.toJSON() as Record<string, unknown>
  void pattern
  return { app: `${site.slug}/synth`, version: 1, bpm: v.bpm, swing: v.swing, pattern: patternOf(v), settings: rest }
}

function importDoc(json: unknown) {
  if (!json || typeof json !== 'object') throw new Error('Not JSON')
  const o = json as Record<string, unknown>
  const pat = sanitizePattern(o.pattern ?? o)
  if (!pat) throw new Error('No pattern found')
  const defaults = params.getState().defaults as Record<string, unknown>
  const patch: Record<string, unknown> = { pattern: pat }
  const settings = (o.settings ?? {}) as Record<string, unknown>
  for (const [k, x] of Object.entries(settings)) if (k in defaults && typeof x === typeof defaults[k]) patch[k] = x
  if (typeof o.bpm === 'number') patch.bpm = Math.max(60, Math.min(180, o.bpm))
  if (typeof o.swing === 'number') patch.swing = Math.max(0, Math.min(100, o.swing))
  params.patch(patch as Partial<V>)
}

export default function SynthShell() {
  const v = useValues(params) as V
  const started = useStore(engineState, (s) => s.started)
  const playing = useStore(engineState, (s) => s.playing)
  const step = useStore(engineState, (s) => s.step)
  const surface = useRef<SurfaceHandle>(null)
  const file = useRef<HTMLInputElement>(null)

  // Leaving the shell must never leave sound running.
  useEffect(() => () => engine.suspend(), [])

  const startAudio = () => engine.start().then(() => toast('Audio on', { type: 'success', description: 'Press Space to play.' }))

  const bounce = async (bars: number) => {
    const id = toast(`Rendering ${bars} bar${bars > 1 ? 's' : ''}…`, { type: 'loading', timeout: 0 })
    try {
      const cur = params.values() as V
      const { blob, seconds } = await renderLoopWAV(cur, bars)
      download(blob, `synth-${cur.bpm}bpm-${bars}bar.wav`)
      toast.update(id, 'WAV exported', { description: `${seconds.toFixed(2)}s · 44.1 kHz · 16-bit · loop-ready`, type: 'success', timeout: 3200 })
    } catch (e) {
      toast.update(id, 'Render failed', { description: String((e as Error)?.message ?? e), type: 'error', timeout: 5000 })
    }
  }
  const exportPatternJSON = () => { exportJSON(patternDoc(params.values() as V), `synth-pattern-${v.bpm}bpm.json`); toast('Pattern exported', { type: 'success' }) }
  const copyPatternJSON = async () => { await copyText(JSON.stringify(patternDoc(params.values() as V), null, 2)); toast('Pattern JSON copied', { type: 'success' }) }
  const onImport = async (f: File | undefined) => {
    if (!f) return
    try { importDoc(JSON.parse(await f.text())); toast('Pattern imported', { type: 'success', description: f.name, action: { label: 'Undo', onClick: () => params.undo() } }) }
    catch (e) { toast('Could not import', { type: 'error', description: String((e as Error).message) }) }
    if (file.current) file.current.value = ''
  }
  const exportPNG = () => { const c = surface.current?.canvas; if (c) exportCanvasPNG(c, 'synth-visual.png').then(() => toast('PNG exported', { type: 'success' })) }

  const mutate = (fn: (p: ReturnType<typeof patternOf>) => ReturnType<typeof patternOf>) => setPattern(fn(patternOf(params.values() as V)))
  const toggleKey = (key: string) => params.setValue(key as never, !(params.values() as Record<string, unknown>)[key] as never)
  const tempo = (d: number) => params.setValue('bpm', Math.max(60, Math.min(180, params.values().bpm + d)))

  const commands: Command[] = [
    { id: 'play', label: playing ? 'Stop' : 'Play', group: 'Transport', shortcut: 'space', icon: playing ? Square : Play, run: () => engine.toggle() },
    { id: 'start', label: 'Start audio', group: 'Transport', icon: Power, run: startAudio },
    { id: 'slower', label: 'Tempo −1', group: 'Transport', shortcut: '[', icon: Gauge, run: () => tempo(-1) },
    { id: 'faster', label: 'Tempo +1', group: 'Transport', shortcut: ']', icon: Gauge, run: () => tempo(1) },
    ...[70, 90, 110, 122, 128, 140, 174].map((b) => ({ id: `bpm-${b}`, label: `Tempo ${b} BPM`, group: 'Transport', keywords: ['bpm', 'tempo'], run: () => params.setValue('bpm', b) })),
    { id: 'wav', label: 'Render 1-bar loop (WAV)', group: 'Export', shortcut: 'mod+e', icon: FileAudio, run: () => bounce(1) },
    { id: 'wav4', label: 'Render 4 bars (WAV)', group: 'Export', icon: FileAudio, run: () => bounce(4) },
    { id: 'json', label: 'Export pattern JSON', group: 'Export', shortcut: 'shift+mod+e', icon: Braces, run: exportPatternJSON },
    { id: 'copyjson', label: 'Copy pattern JSON', group: 'Export', icon: Braces, run: copyPatternJSON },
    { id: 'import', label: 'Import pattern JSON…', group: 'Export', shortcut: 'mod+o', icon: FileUp, run: () => file.current?.click() },
    { id: 'png', label: 'Export visual (PNG)', group: 'Export', icon: ImageIcon, run: exportPNG },
    ...Object.entries(PATTERNS).map(([id, p]) => ({ id: `pat-${id}`, label: `Pattern: ${p.name}`, group: 'Pattern', run: () => applyPatternPreset(id) })),
    { id: 'shl', label: 'Shift pattern left', group: 'Pattern', shortcut: 'alt+arrowleft', icon: ArrowLeft, run: () => mutate((p) => shiftPattern(p, -1)) },
    { id: 'shr', label: 'Shift pattern right', group: 'Pattern', shortcut: 'alt+arrowright', icon: ArrowRight, run: () => mutate((p) => shiftPattern(p, 1)) },
    { id: 'hats', label: 'New hat groove', group: 'Pattern', shortcut: 'h', icon: Dices, run: () => mutate((p) => randomHats(p)) },
    { id: 'human', label: 'Humanise velocities', group: 'Pattern', icon: Sparkles, run: () => mutate((p) => humanise(p)) },
    { id: 'clear', label: 'Clear pattern', group: 'Pattern', icon: Eraser, run: () => mutate((p) => clearTrack(p)) },
    ...TRACKS.map((t) => ({ id: `clear-${t.id}`, label: `Clear ${t.name.toLowerCase()} track`, group: 'Pattern', icon: Eraser, run: () => mutate((p) => clearTrack(p, t.id)) })),
    ...TRACKS.map((t, i) => ({ id: `mute-${t.id}`, label: `Mute ${t.name.toLowerCase()}`, group: 'Mixer', shortcut: String(i + 1), icon: Volume2, run: () => toggleKey(`${t.id}Mute`) })),
    ...TRACKS.map((t, i) => ({ id: `solo-${t.id}`, label: `Solo ${t.name.toLowerCase()}`, group: 'Mixer', shortcut: `shift+${i + 1}`, run: () => toggleKey(`${t.id}Solo`) })),
    { id: 'unmute', label: 'Unmute and unsolo all', group: 'Mixer', run: () => params.patch(Object.fromEntries(TRACKS.flatMap((t) => [[`${t.id}Mute`, false], [`${t.id}Solo`, false]])) as Partial<V>) },
    ...Object.keys(SOUNDS).map((name) => ({ id: `snd-${name}`, label: `Sound: ${name}`, group: 'Sound', run: () => params.applyPreset(name) })),
    ...TRACKS.map((t) => ({ id: `aud-${t.id}`, label: `Audition ${t.name.toLowerCase()}`, group: 'Sound', run: () => engine.audition(t.id as TrackId) })),
    { id: 'visual', label: v.visual === 'plate' ? 'Visual: Harmonograph' : 'Visual: Chladni plate', group: 'View', shortcut: 'v', icon: Eye, run: () => params.setValue('visual', params.values().visual === 'plate' ? 'harmonograph' : 'plate') },
    { id: 'reset', label: 'Reset everything', group: 'Values', run: () => params.reset() },
  ]

  const exportItems: MenuItem[] = [
    { type: 'label', label: 'Audio' },
    { label: 'Render 1-bar loop (WAV)', icon: FileAudio, shortcut: 'mod+e', onClick: () => bounce(1) },
    { label: 'Render 4 bars (WAV)', icon: FileAudio, onClick: () => bounce(4) },
    { type: 'separator' },
    { type: 'label', label: 'Pattern' },
    { label: 'Export pattern JSON', icon: Braces, shortcut: 'shift+mod+e', onClick: exportPatternJSON },
    { label: 'Copy pattern JSON', icon: Braces, onClick: copyPatternJSON },
    { label: 'Import pattern JSON…', icon: FileUp, shortcut: 'mod+o', onClick: () => file.current?.click() },
    { type: 'separator' },
    { label: 'Visual (PNG)', icon: ImageIcon, onClick: exportPNG },
    { type: 'submenu', label: 'Share values', items: shareMenuItems(params) },
  ]

  const bar = step >= 0 ? `${Math.floor(step / 4) + 1}.${(step % 4) + 1}` : '–.–'
  const loopMs = stepSeconds(v.bpm) * 16 * 1000

  return (
    <Studio
      leftWidth={256}
      rightWidth={300}
      toolbar={
        <Toolbar
          start={<Brand name="Synth" doc="Plate no. 4" mark={Mark} />}
          center={
            <Cluster className="gap-1 px-1.5">
              <IconButton icon={playing ? Square : Play} label={playing ? 'Stop' : 'Play'} shortcut="space" active={playing} variant={playing ? 'default' : 'ghost'} onClick={() => engine.toggle()} />
              <Divider vertical />
              <Tip label="Tempo — drag, or click to type" shortcut="[ ]">
                <div className="flex items-center gap-1 pl-1">
                  <ScrubValue boxed value={v.bpm} min={60} max={180} step={1} defaultValue={122} label="Tempo" changed={params.isChanged('bpm')}
                    onChange={(n, f) => params.setValue('bpm', n, { commit: f })} className="w-[46px]" align="left" />
                  <span className="text-[11px] text-fg-faint">BPM</span>
                </div>
              </Tip>
              <Tip label="Swing — delays off-beat 16ths">
                <div className="flex items-center gap-1 pl-1">
                  <ScrubValue boxed value={v.swing} min={0} max={100} step={1} unit="%" defaultValue={22} label="Swing" changed={params.isChanged('swing')}
                    onChange={(n, f) => params.setValue('swing', n, { commit: f })} className="w-[46px]" align="left" />
                  <span className="text-[11px] text-fg-faint">Swing</span>
                </div>
              </Tip>
              <Divider vertical />
              <div className="flex h-7 min-w-[64px] items-center gap-1.5 rounded-[6px] px-2 tabular text-[12px]" aria-live="off">
                <span className={cn('size-1.5 rounded-full', playing ? 'bg-rec' : started ? 'bg-ok' : 'bg-line-strong')} />
                <span className={playing ? 'text-fg' : 'text-fg-faint'}>{bar}</span>
              </div>
              <Tip label="Loop length"><span className="flex items-center gap-1 pr-1.5 text-[11px] text-fg-faint tabular"><Repeat size={12} strokeWidth={1.5} />{(loopMs / 1000).toFixed(2)}s</span></Tip>
            </Cluster>
          }
          end={
            <>
              <Cluster><ParamActions params={params} presets={false} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={<Panel header={<PanelHeader title="Monitor"><Badge tone={started ? 'ok' : 'default'}>{started ? 'Live' : 'Off'}</Badge></PanelHeader>}><MonitorPanel /></Panel>}
      right={<Panel header={<PanelHeader title="Synth"><SoundMenu /></PanelHeader>}><SynthPanel /></Panel>}
      bottom={<Panel scroll={false} header={<SequencerHeader />}><Sequencer /></Panel>}
    >
      <div className="panel absolute inset-0 overflow-hidden">
        <Stage fill
          overlay={
            <>
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="cluster flex h-8 w-[168px] items-center px-1">
                  <Segmented size="sm" value={v.visual} onChange={(s) => params.setValue('visual', s)} options={[{ value: 'plate', label: 'Plate' }, { value: 'harmonograph', label: 'Pendulum' }]} label="Visual" />
                </div>
              </div>
              {/* hidden in QA / thumbnail captures (?qa) — the card would cover the visual */}
              {!started && !CAPTURE && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-scrim">
                  <div className="pop flex w-[300px] flex-col items-center gap-3 px-6 py-6 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-signal-soft text-signal"><Volume2 size={18} strokeWidth={1.5} /></div>
                    <div className="text-[13px] font-semibold text-fg">Click to start audio</div>
                    <p className="text-[11.5px] leading-relaxed text-fg-muted">Browsers keep sound off until you interact. You can edit the pattern and knobs first — nothing plays until you press Play.</p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="lg" onClick={startAudio} autoFocus><Power size={14} strokeWidth={1.75} />Start audio</Button>
                      <Button variant="default" size="lg" onClick={() => engine.play()}><Play size={14} strokeWidth={1.75} />Play</Button>
                    </div>
                  </div>
                </div>
              )}
              {started && !playing && (
                <button type="button" onClick={() => engine.play()} className="cluster absolute bottom-3 left-1/2 z-10 flex h-8 -translate-x-1/2 items-center gap-1.5 px-3 text-[12px] text-fg outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
                  <Play size={13} strokeWidth={1.5} />Press Space to play
                </button>
              )}
            </>
          }
        >
          <CanvasSurface
            ref={surface}
            params={params}
            clock={visClock}
            draw={(ctx, fr) => {
              const s = engineState.getState()
              const live = s.started
              drawStage(ctx, {
                t: fr.t / 1000, w: fr.w, h: fr.h, started: live, playing: s.playing, step: s.step,
                env: { kick: engine.env('kick'), snare: engine.env('snare'), hat: engine.env('hat'), bass: engine.env('bass') },
                scope: live ? engine.readScope() : null, freq: live ? engine.readFreq() : null,
                pattern: patternOf(fr.v as V), cutoff: (fr.v as V).cutoff, bpm: (fr.v as V).bpm, style: (fr.v as V).visual,
              })
            }}
          />
        </Stage>
      </div>
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
      <CommandPalette
        commands={commands}
        extraShortcuts={[
          { keys: 'enter', label: 'Toggle focused step', group: 'Sequencer' },
          { keys: 'shift+arrowup', label: 'Focused step velocity +', group: 'Sequencer' },
          { keys: 'alt+arrowup', label: 'Focused bass note +1', group: 'Sequencer' },
          { keys: 'delete', label: 'Clear focused step', group: 'Sequencer' },
        ]}
      />
    </Studio>
  )
}
