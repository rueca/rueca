/* ---------------------------------------------------------------------------
   The step sequencer. 4 tracks × 16 steps; each step is a velocity bar.

     click an empty step     → on at 80%, auditions the sound
     click a lit step        → off
     drag a step vertically  → velocity (shift: fine)
     bass "Note" row         → drag vertically / wheel / ↑↓ for pitch
     keyboard                → arrows move, Enter toggles, shift+↑↓ velocity,
                               alt+↑↓ bass note, Delete clears
--------------------------------------------------------------------------- */
import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import { ArrowLeft, ArrowRight, Dices, Eraser, Sparkles, ListMusic, ChevronDown } from 'lucide-react'
import { Menu, IconButton, Button, Divider, Tip, cn, useValues, toast } from '@kit'
import { params, patternOf, setPattern, audible, type V } from './params'
import { PATTERNS, STEPS, TRACKS, clearTrack, humanise, noteName, randomHats, setNote, setStep, shiftPattern, type TrackId } from './pattern'
import { engine, engineState } from './engine'

const GROUPS = [0, 4, 8, 12]

export function applyPatternPreset(id: string) {
  const pr = PATTERNS[id]
  if (!pr) return
  params.patch({ pattern: pr.p as unknown as string, bpm: pr.bpm, swing: pr.swing })
  toast(`Pattern: ${pr.name}`, { description: `${pr.bpm} BPM · swing ${pr.swing}%` })
}

export function SequencerHeader() {
  const v = useValues(params) as V
  const pat = patternOf(v)
  const current = Object.entries(PATTERNS).find(([, p]) => JSON.stringify(p.p) === JSON.stringify(pat))
  return (
    <div className="flex h-10 items-center gap-1 border-b border-line pr-2 pl-3">
      <div className="text-[12px] font-semibold text-fg">Sequencer</div>
      <span className="ml-1 text-[11px] text-fg-faint tabular">1 bar · 16 steps</span>
      <div className="flex-1" />
      <Menu
        align="end"
        side="top"
        trigger={
          <Button size="md" className="max-w-[200px] gap-1 px-2">
            <ListMusic size={13} strokeWidth={1.5} />
            <span className="truncate">{current ? current[1].name : 'Custom pattern'}</span>
            <ChevronDown size={12} className="text-fg-faint" />
          </Button>
        }
        items={[
          { type: 'label', label: 'Patterns' },
          ...Object.entries(PATTERNS).map(([id, p]) => ({ label: p.name, checked: current?.[0] === id, hint: `${p.bpm} BPM`, onClick: () => applyPatternPreset(id) })),
        ]}
      />
      <Divider vertical />
      <IconButton icon={ArrowLeft} label="Shift pattern left" shortcut="alt+arrowleft" tipSide="top" onClick={() => setPattern(shiftPattern(patternOf(params.values() as V), -1))} />
      <IconButton icon={ArrowRight} label="Shift pattern right" shortcut="alt+arrowright" tipSide="top" onClick={() => setPattern(shiftPattern(patternOf(params.values() as V), 1))} />
      <IconButton icon={Dices} label="New hat groove" shortcut="h" tipSide="top" onClick={() => setPattern(randomHats(patternOf(params.values() as V)))} />
      <IconButton icon={Sparkles} label="Humanise velocities" tipSide="top" onClick={() => setPattern(humanise(patternOf(params.values() as V)))} />
      <IconButton icon={Eraser} label="Clear pattern" tipSide="top" onClick={() => { setPattern(clearTrack(patternOf(params.values() as V))); toast('Pattern cleared', { action: { label: 'Undo', onClick: () => params.undo() } }) }} />
    </div>
  )
}

export function Sequencer() {
  const v = useValues(params) as V
  const pat = patternOf(v)
  const step = useStore(engineState, (s) => s.step)
  const started = useStore(engineState, (s) => s.started)
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  const cells = useRef<Map<string, HTMLElement>>(new Map())
  const drag = useRef<{ id: number; track: TrackId; i: number; y: number; start: number; wasOn: boolean; moved: boolean } | null>(null)
  const noteDrag = useRef<{ id: number; i: number; y: number; start: number; moved: boolean } | null>(null)

  const rows: (TrackId | 'notes')[] = ['kick', 'snare', 'hat', 'bass', 'notes']
  const fresh = () => patternOf(params.values() as V)
  const moveFocus = (r: number, c: number) => {
    const nr = Math.max(0, Math.min(rows.length - 1, r)), nc = (c + STEPS) % STEPS
    setFocus({ r: nr, c: nc })
    cells.current.get(`${nr}:${nc}`)?.focus()
  }

  const stepDown = (track: TrackId, i: number) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const start = fresh()[track][i]
    drag.current = { id: e.pointerId, track, i, y: e.clientY, start: start || 0.8, wasOn: start > 0, moved: false }
    setFocus({ r: rows.indexOf(track), c: i })
    if (!start) {
      setPattern(setStep(fresh(), track, i, 0.8), false)
      engine.audition(track, 0.8, fresh().notes[i])
    }
  }
  const stepMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = d.y - e.clientY
    if (!d.moved && Math.abs(dy) < 3) return
    d.moved = true
    const vel = Math.max(0.05, Math.min(1, d.start + dy / (e.shiftKey ? 400 : 90)))
    setPattern(setStep(fresh(), d.track, d.i, vel), false)
  }
  const stepUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moved && d.wasOn) setPattern(setStep(fresh(), d.track, d.i, 0))
    else params.commit()
  }

  const noteDown = (i: number) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    noteDrag.current = { id: e.pointerId, i, y: e.clientY, start: fresh().notes[i], moved: false }
    setFocus({ r: 4, c: i })
  }
  const noteMove = (e: React.PointerEvent) => {
    const d = noteDrag.current
    if (!d || d.id !== e.pointerId) return
    const semis = Math.round((d.y - e.clientY) / 7)
    if (!d.moved && semis === 0) return
    d.moved = true
    const n = d.start + semis
    if (n !== fresh().notes[d.i]) {
      setPattern(setNote(fresh(), d.i, n), false)
      if (fresh().bass[d.i]) engine.audition('bass', 0.7, n)
    }
  }
  const noteUp = (e: React.PointerEvent) => {
    const d = noteDrag.current
    if (!d || d.id !== e.pointerId) return
    noteDrag.current = null
    if (d.moved) params.commit()
    else if (fresh().bass[d.i]) engine.audition('bass', 0.7, fresh().notes[d.i])
  }

  const onKey = (r: number, c: number) => (e: React.KeyboardEvent) => {
    const row = rows[r]
    const p = fresh()
    const k = e.key
    const handled = () => { e.preventDefault(); e.stopPropagation() }
    if (k === 'ArrowLeft' && !e.altKey) { handled(); moveFocus(r, c - 1); return }
    if (k === 'ArrowRight' && !e.altKey) { handled(); moveFocus(r, c + 1); return }
    if (row === 'notes') {
      if (k === 'ArrowUp' || k === 'ArrowDown') { handled(); const n = p.notes[c] + (k === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 12 : 1); setPattern(setNote(p, c, n)); if (p.bass[c]) engine.audition('bass', 0.7, n); return }
      if (k === 'Enter' || k === ' ') { handled(); engine.audition('bass', 0.7, p.notes[c]); return }
      return
    }
    if ((k === 'ArrowUp' || k === 'ArrowDown') && e.shiftKey) { handled(); setPattern(setStep(p, row, c, Math.max(0.05, (p[row][c] || 0.8) + (k === 'ArrowUp' ? 0.1 : -0.1)))); return }
    if ((k === 'ArrowUp' || k === 'ArrowDown') && e.altKey && row === 'bass') { handled(); setPattern(setNote(p, c, p.notes[c] + (k === 'ArrowUp' ? 1 : -1))); return }
    if (k === 'ArrowUp') { handled(); moveFocus(r - 1, c); return }
    if (k === 'ArrowDown') { handled(); moveFocus(r + 1, c); return }
    if (k === 'Enter' || k === ' ') { handled(); const on = p[row][c] > 0; setPattern(setStep(p, row, c, on ? 0 : 0.8)); if (!on) engine.audition(row, 0.8, p.notes[c]); return }
    if (k === 'Delete' || k === 'Backspace') { handled(); setPattern(setStep(p, row, c, 0)) }
  }

  const ref = (r: number, c: number) => (el: HTMLElement | null) => { if (el) cells.current.set(`${r}:${c}`, el); else cells.current.delete(`${r}:${c}`) }
  const tab = (r: number, c: number) => (focus.r === r && focus.c === c ? 0 : -1)

  const cellsFor = (render: (i: number) => React.ReactNode) => (
    <div className="flex min-w-0 flex-1 gap-2">
      {GROUPS.map((g) => (
        <div key={g} className="flex min-w-0 flex-1 gap-1">
          {Array.from({ length: 4 }, (_, k) => render(g + k))}
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-1 px-3 pt-2 pb-3" role="grid" aria-label="Step sequencer" aria-rowcount={rows.length}>
      {/* step LEDs — the playhead */}
      <div className="flex items-end gap-2" aria-hidden>
        <div className="w-[148px] shrink-0 text-[10.5px] text-fg-faint">{started ? (step >= 0 ? `Step ${step + 1}` : 'Stopped') : 'Audio off'}</div>
        {cellsFor((i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className={cn('tabular text-[10px]', i === step ? 'text-fg' : i % 4 === 0 ? 'text-fg-muted' : 'text-fg-faint')}>{i + 1}</span>
            <span className={cn('h-[3px] w-full rounded-full', i === step ? 'bg-rec' : i % 4 === 0 ? 'bg-line-strong' : 'bg-line')} />
          </div>
        ))}
      </div>

      {TRACKS.map((t, r) => {
        const on = audible(v, t.id)
        const muted = !!(v as Record<string, unknown>)[`${t.id}Mute`]
        const solo = !!(v as Record<string, unknown>)[`${t.id}Solo`]
        return (
          <div key={t.id} role="row" className="flex items-center gap-2">
            <div className="flex w-[148px] shrink-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full" style={{ background: t.color, opacity: on ? 1 : 0.35 }} aria-hidden />
              <Tip label={`Audition ${t.name.toLowerCase()}`} side="top">
                <button type="button" onClick={() => (started ? engine.audition(t.id, 0.85, pat.notes.find((_, i) => pat.bass[i]) ?? 36) : toast('Start audio first', { description: 'Click the stage or press Space.' }))}
                  className={cn('min-w-0 flex-1 truncate rounded-[5px] px-1 text-left text-[12px] font-medium outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', on ? 'text-fg' : 'text-fg-faint')}>
                  {t.name}
                </button>
              </Tip>
              <Tip label={`Mute ${t.name.toLowerCase()}`} shortcut={String(r + 1)} side="top">
                <button type="button" aria-pressed={muted} aria-label={`Mute ${t.name}`} onClick={() => params.setValue(`${t.id}Mute` as never, !muted as never)}
                  className={cn('flex size-6 items-center justify-center rounded-[5px] text-[10.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-signal',
                    muted ? 'bg-key/20 text-key' : 'bg-control text-fg-faint hover:text-fg')}>M</button>
              </Tip>
              <Tip label={`Solo ${t.name.toLowerCase()}`} shortcut={`shift+${r + 1}`} side="top">
                <button type="button" aria-pressed={solo} aria-label={`Solo ${t.name}`} onClick={() => params.setValue(`${t.id}Solo` as never, !solo as never)}
                  className={cn('flex size-6 items-center justify-center rounded-[5px] text-[10.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-signal',
                    solo ? 'bg-signal-soft text-signal' : 'bg-control text-fg-faint hover:text-fg')}>S</button>
              </Tip>
            </div>
            {cellsFor((i) => {
              const vel = pat[t.id][i]
              const cur = i === step
              return (
                <button
                  key={i}
                  ref={ref(r, i)}
                  type="button"
                  role="gridcell"
                  tabIndex={tab(r, i)}
                  aria-label={`${t.name} step ${i + 1}${vel ? `, velocity ${Math.round(vel * 100)}%` : ', off'}`}
                  aria-pressed={vel > 0}
                  onPointerDown={stepDown(t.id, i)}
                  onPointerMove={stepMove}
                  onPointerUp={stepUp}
                  onPointerCancel={stepUp}
                  onKeyDown={onKey(r, i)}
                  onFocus={() => setFocus({ r, c: i })}
                  className={cn(
                    'relative h-9 min-w-0 flex-1 cursor-ns-resize touch-none overflow-hidden rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-signal',
                    i % 4 === 0 ? 'bg-active' : 'bg-control',
                    cur && 'shadow-[inset_0_0_0_1.5px_var(--fg-faint)]',
                    !on && 'opacity-45',
                  )}
                >
                  {vel > 0 && (
                    <span className={cn('absolute inset-x-0 bottom-0 bg-signal', cur ? 'brightness-125' : '')}
                      style={{ height: `${Math.max(14, vel * 100)}%`, opacity: 0.55 + vel * 0.45 }} />
                  )}
                  {vel > 0 && <span className="absolute inset-x-1.5 top-1 h-[2px] rounded-full bg-signal-fg/70" style={{ opacity: cur ? 1 : 0.4 }} />}
                </button>
              )
            })}
          </div>
        )
      })}

      {/* bass notes */}
      <div role="row" className="flex items-center gap-2">
        <div className="flex w-[148px] shrink-0 items-center gap-1.5 pl-3.5 text-[11px] text-fg-muted">
          Bass notes
          <span className="text-fg-faint">· drag</span>
        </div>
        {cellsFor((i) => {
          const active = pat.bass[i] > 0
          return (
            <button
              key={i}
              ref={ref(4, i)}
              type="button"
              role="gridcell"
              tabIndex={tab(4, i)}
              aria-label={`Bass note step ${i + 1}: ${noteName(pat.notes[i])}`}
              onPointerDown={noteDown(i)}
              onPointerMove={noteMove}
              onPointerUp={noteUp}
              onPointerCancel={noteUp}
              onKeyDown={onKey(4, i)}
              onFocus={() => setFocus({ r: 4, c: i })}
              onDoubleClick={() => setPattern(setNote(fresh(), i, 36))}
              onWheel={(e) => { if (e.deltaY) setPattern(setNote(fresh(), i, fresh().notes[i] + (e.deltaY < 0 ? 1 : -1))) }}
              className={cn('h-6 min-w-0 flex-1 cursor-ns-resize touch-none truncate rounded-[5px] px-0.5 tabular text-[10.5px] outline-none focus-visible:ring-2 focus-visible:ring-signal',
                active ? 'bg-control text-fg' : 'text-fg-faint/70 hover:bg-hover')}
            >
              {noteName(pat.notes[i])}
            </button>
          )
        })}
      </div>
    </div>
  )
}
