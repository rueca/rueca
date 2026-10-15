/* ---------------------------------------------------------------------------
   Comments to the agent — Figma-style pins that land in .rueca/notes/.

     <Artboard …>
       <CanvasSurface … />
       <NoteLayer params={params} clock={clock} />     // pins, composer, threads
     </Artboard>
     <ParamActions params={params} clock={clock} />    // gains the Comment button (C)

   In comment mode, click the artboard to pin a comment to that point, or click
   a knob's row in the Inspector to pin it to that param. The note carries the
   snapshot (values, link, steps, playhead) and a thumbnail with the point
   ringed. The agent's reply shows on the pin as soon as it resolves the note
   (the folder is polled), with a toast.

   Everything renders nothing until the dev server's notes route answers
   (ruecaNotes()), so a static build never shows it.
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { Check, MessageSquarePlus, RotateCcw, Send, Trash2 } from 'lucide-react'
import { useParamState, type AnyParams } from '../core/params'
import type { HistoryLike } from '../core/history'
import type { DocStore } from '../core/doc'
import type { Clock } from '../core/clock'
import { humanize } from '../core/schema'
import { useHotkeys } from '../core/hotkeys'
import { clamp, cn } from '../core/cn'
import {
  captureImage, captureSnapshot, deleteNote, findNotesEndpoint, isSnapshotState, refreshNotes, restoreSnapshot, sendNote, watchNotes,
  type NoteAnchor, type StudioNote,
} from '../core/notes'
import { useZoom } from '../stage/Stage'
import { Button, IconButton } from '../ui/button'
import { toast } from './toast'

/** `t`: the playhead when the spot was picked (the clock pauses there while you write); `resume`: it was playing */
interface Draft { anchor: NoteAnchor; t?: number; resume?: boolean }
interface NotesUI {
  /** comment mode: the next click on the artboard or a knob row starts a comment */
  commenting: boolean
  /** mounted NoteLayers: the Comment button only shows when there is somewhere to pin */
  layers: number
  open: string | null
  draft: Draft | null
}
export const notesUI = createStore<NotesUI>(() => ({ commenting: false, layers: 0, open: null, draft: null }))
const useUI = <T,>(pick: (s: NotesUI) => T) => useStore(notesUI, pick)

/** True once the dev server's notes route answers (ruecaNotes()); false on a static build. */
export function useNotesEndpoint() {
  const [ok, setOk] = useState(false)
  useEffect(() => { let live = true; findNotesEndpoint().then((u) => { if (live) setOk(!!u) }); return () => { live = false } }, [])
  return ok
}

/* One watcher for the whole page turns the agent's replies into toasts, however many components show notes. */
let repliesWatched = false
function watchReplies() {
  if (repliesWatched) return
  repliesWatched = true
  let seen: Map<string, string> | null = null
  watchNotes((notes) => {
    const before = seen
    seen = new Map(notes.map((n) => [n.id, n.status]))
    if (!before) return
    for (const n of notes) {
      if (n.status !== 'resolved' || before.get(n.id) !== 'open') continue
      const description = n.resolution?.text && n.resolution.text.length > 160 ? `${n.resolution.text.slice(0, 157)}…` : n.resolution?.text
      if (n.kind === 'comment') toast('The agent replied', { description, timeout: 8000, action: { label: 'Show', onClick: () => notesUI.setState({ open: n.id, draft: null }) } })
      else toast('The agent applied your values', { description, timeout: 8000 })
    }
  })
}

/** Every note in .rueca/notes/, kept live. Empty without the notes route. */
export function useNotes(): StudioNote[] {
  const available = useNotesEndpoint()
  const [notes, setNotes] = useState<StudioNote[]>([])
  useEffect(() => {
    if (!available) return
    watchReplies()
    return watchNotes(setNotes)
  }, [available])
  return notes
}

/** Toolbar toggle for comment mode (C). Shows only with the notes route and a NoteLayer to pin into. */
export function CommentButton({ params, hotkey = 'c' }: { params?: AnyParams; hotkey?: string | false }) {
  const available = useNotesEndpoint()
  const layers = useUI((s) => s.layers)
  const commenting = useUI((s) => s.commenting)
  const notes = useNotes()
  const on = available && layers > 0
  const waiting = notes.filter((n) => n.kind === 'comment' && n.status === 'open' && (!params || n.snapshot.tool === params.id)).length
  const toggle = () => notesUI.setState((s) => ({ commenting: !s.commenting, draft: null, open: null }))
  useHotkeys(on && hotkey ? { [hotkey]: { run: toggle, label: 'Comment', group: 'Tools' } } : {}, [on, hotkey], { priority: 0 })
  if (!on) return null
  return (
    <IconButton icon={MessageSquarePlus} label={commenting ? 'Stop commenting' : 'Comment'} shortcut={hotkey || undefined} active={commenting} onClick={toggle} className="relative">
      {waiting > 0 && (
        <span aria-label={`${waiting} waiting for the agent`} className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-signal-strong px-0.5 text-[9.5px] leading-none font-semibold text-signal-fg tabular">
          {waiting}
        </span>
      )}
    </IconButton>
  )
}

const paramLabel = (params: AnyParams, key: string) => (params.defs[key] as { label?: string } | undefined)?.label ?? humanize(key)

/** Pins, composer and threads for one artboard. Put it inside the <Artboard>, next to the surface. */
export function NoteLayer({ params, history, clock, doc, describeAt }: {
  params: AnyParams
  history?: HistoryLike
  clock?: Clock
  doc?: DocStore<any>
  /** names what is under a pin (x, y as 0–1 of the artboard), e.g. 'layer:hero' — goes into the note's anchor */
  describeAt?: (x: number, y: number) => string | undefined
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [el, setEl] = useState<{ art: HTMLElement; host: HTMLElement } | null>(null)
  useLayoutEffect(() => {
    const me = ref.current!
    const art = (me.closest('[data-studio-artifact]') as HTMLElement | null) ?? me.parentElement!
    // pins render beside the artboard's clipping box, so a thread near an edge isn't cut off
    setEl({ art, host: (art.hasAttribute('data-studio-artifact') && art.parentElement) || art })
    notesUI.setState((s) => ({ layers: s.layers + 1 }))
    return () => notesUI.setState((s) => ({ layers: s.layers - 1, commenting: s.layers > 1 && s.commenting, draft: null, open: null }))
  }, [])

  const zoom = useZoom()
  const all = useNotes()
  const notes = all.filter((n) => n.kind === 'comment' && n.snapshot.tool === params.id)
  const commenting = useUI((s) => s.commenting)
  const draft = useUI((s) => s.draft)
  const open = useUI((s) => s.open)
  useParamState(params, (s) => s.committed)   // pins from another state fade: re-check on every commit
  const num = (id: string) => notes.findIndex((n) => n.id === id) + 1

  useHotkeys(commenting || draft || open ? { esc: { run: () => notesUI.setState({ commenting: false, draft: null, open: null }), label: 'Close comment', group: 'Tools' } } : {}, [commenting, !!draft, !!open], { priority: 5 })

  // However a comment ends (sent, Esc, a click away), a clock that was playing plays on.
  useEffect(() => notesUI.subscribe((s, prev) => { if (prev.draft?.resume && !s.draft) clock?.play() }), [clock])

  // A click outside any pin, thread or composer closes them.
  useEffect(() => {
    if (!open && !draft) return
    const down = (e: PointerEvent) => { if (!(e.target as Element).closest?.('[data-note-ui]')) notesUI.setState({ open: null, draft: null }) }
    document.addEventListener('pointerdown', down, true)
    return () => document.removeEventListener('pointerdown', down, true)
  }, [open, draft])

  // Comment mode: a click on an Inspector row pins the comment to that knob instead of changing it.
  useEffect(() => {
    if (!commenting) return
    const rowOf = (e: Event) => {
      const row = (e.target as Element).closest?.('[data-param]') as HTMLElement | null
      return row && row.dataset.param && row.dataset.param in params.defs ? row : null
    }
    const down = (e: PointerEvent) => { if (rowOf(e)) { e.preventDefault(); e.stopPropagation() } }
    const click = (e: MouseEvent) => {
      const row = rowOf(e)
      if (!row) return
      e.preventDefault(); e.stopPropagation()
      begin({ on: 'param', key: row.dataset.param! })
    }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('click', click, true)
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('click', click, true) }
  }, [commenting, params, clock])   // eslint-disable-line react-hooks/exhaustive-deps

  // Knob comments sit beside their rows: follow them as panels scroll and resize.
  const paramKeys = [...new Set([...notes, ...(draft ? [{ anchor: draft.anchor }] : [])].flatMap((n) => (n.anchor?.on === 'param' ? [n.anchor.key] : [])))]
  const [rows, setRows] = useState<Record<string, { left: number; top: number }>>({})
  const keysId = paramKeys.join('|')
  useEffect(() => {
    if (!paramKeys.length) { setRows({}); return }
    const measure = () => {
      const next: Record<string, { left: number; top: number }> = {}
      for (const k of paramKeys) {
        const r = document.querySelector(`[data-param="${CSS.escape(k)}"]`)?.getBoundingClientRect()
        if (r && r.height) next[k] = { left: Math.round(r.left), top: Math.round(r.top + r.height / 2) }
      }
      setRows((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    measure()
    const id = setInterval(measure, 250)
    return () => clearInterval(id)
  }, [keysId])   // eslint-disable-line react-hooks/exhaustive-deps

  /** Start a comment at an anchor: freeze the frame being commented on. */
  const begin = (anchor: NoteAnchor) => {
    const prev = notesUI.getState().draft
    const resume = prev ? prev.resume : !!clock?.getState().playing
    clock?.pause()
    notesUI.setState({ draft: { anchor, t: prev?.t ?? clock?.time(), resume }, open: null })
  }

  const place = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const r = el!.art.getBoundingClientRect()
    const x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1)
    const target = describeAt?.(x, y)
    begin({ on: 'artboard', x, y, ...(target ? { target } : {}) })
  }

  const post = async (text: string) => {
    const d = notesUI.getState().draft
    if (!d || !el) return
    // capture while the frame is still frozen; clearing the draft lets the clock run again
    const snapshot = captureSnapshot({ params, history, clock, doc, view: { width: el.art.offsetWidth, height: el.art.offsetHeight } })
    if (d.t !== undefined) snapshot.t = Math.round(d.t)
    const image = await captureImage(el.art, { anchor: d.anchor.on === 'artboard' ? d.anchor : undefined })
    notesUI.setState({ draft: null, commenting: false })
    try {
      const note = await sendNote({ kind: 'comment', text, anchor: d.anchor, snapshot, image })
      refreshNotes()
      notesUI.setState({ open: note.id })
      toast('Comment sent to the agent', { type: 'success', description: 'Ask it to check the notes.' })
    } catch (err) {
      toast('Could not send', { type: 'error', description: (err as Error).message })
    }
  }

  const thread = (n: StudioNote, style?: CSSProperties, className?: string) => (
    <Thread n={n} num={num(n.id)} params={params} clock={clock} stale={!isSnapshotState(n.snapshot, params)} style={style} className={className} />
  )

  return (
    <>
      <span ref={ref} hidden />
      {el && createPortal(
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
          {commenting && <div data-note-ui="" aria-label="Click to place a comment" className="pointer-events-auto absolute inset-0 cursor-crosshair" onPointerDown={place} />}
          {notes.map((n) => n.anchor?.on === 'artboard' && (
            <At key={n.id} x={n.anchor.x} y={n.anchor.y} zoom={zoom} z={open === n.id ? 3 : 1}>
              <Pin n={n} num={num(n.id)} open={open === n.id} stale={!isSnapshotState(n.snapshot, params)} />
              {open === n.id && thread(n, undefined, 'absolute -top-7 left-9')}
            </At>
          ))}
          {draft?.anchor.on === 'artboard' && (
            <At x={draft.anchor.x} y={draft.anchor.y} zoom={zoom} z={4}>
              <DraftPin />
              <Composer onPost={post} className="absolute -top-7 left-9" />
            </At>
          )}
        </div>,
        el.host,
      )}
      {createPortal(
        <div data-studio="" className="studio-notes">
          {notes.map((n) => {
            const at = n.anchor?.on === 'param' ? rows[n.anchor.key] : undefined
            if (!at) return null
            return (
              <div key={n.id} className="fixed" style={{ left: at.left - 34, top: at.top + 13, zIndex: open === n.id ? 152 : 150 }}>
                <Pin n={n} num={num(n.id)} open={open === n.id} stale={!isSnapshotState(n.snapshot, params)} />
                {open === n.id && thread(n, undefined, 'absolute right-9 -top-7')}
              </div>
            )
          })}
          {draft?.anchor.on === 'param' && rows[draft.anchor.key] && (
            <div className="fixed" style={{ left: rows[draft.anchor.key].left - 34, top: rows[draft.anchor.key].top + 13, zIndex: 153 }}>
              <DraftPin />
              <Composer onPost={post} label={paramLabel(params, draft.anchor.key)} className="absolute right-9 -top-7" />
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

/** A zero-size box at a point on the artboard, kept at screen size whatever the zoom. Its children hang from it. */
function At({ x, y, zoom, z, children }: { x: number; y: number; zoom: number; z: number; children: React.ReactNode }) {
  return <div className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: `scale(${1 / zoom})`, transformOrigin: '0 0', zIndex: z }}>{children}</div>
}

const pinShape = 'absolute bottom-0 left-0 flex size-7 items-center justify-center rounded-full rounded-bl-[3px] text-[11px] font-semibold tabular shadow-[0_0_0_2px_var(--panel),var(--shadow-cluster)]'

function Pin({ n, num, open, stale }: { n: StudioNote; num: number; open: boolean; stale: boolean }) {
  const resolved = n.status === 'resolved'
  return (
    <button type="button" data-note-ui=""
      aria-label={`Comment ${num}${resolved ? ', the agent replied' : ', waiting for the agent'}${stale ? ', made in another state' : ''}`}
      onClick={(e) => { e.stopPropagation(); notesUI.setState((s) => ({ open: s.open === n.id ? null : n.id, draft: null })) }}
      className={cn(pinShape, 'pointer-events-auto outline-none transition-[transform,opacity] hover:scale-110 focus-visible:ring-2 focus-visible:ring-signal',
        resolved ? 'bg-panel text-fg' : 'bg-signal-strong text-signal-fg', stale && !open && 'opacity-55', open && 'ring-2 ring-signal')}>
      {resolved ? <Check size={12} strokeWidth={2.5} /> : num}
    </button>
  )
}

function DraftPin() {
  return <div data-note-ui="" className={cn(pinShape, 'bg-signal-strong text-signal-fg')}>+</div>
}

const ago = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (!Number.isFinite(s) || s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Thread({ n, num, params, clock, stale, style, className }: {
  n: StudioNote; num: number; params: AnyParams; clock?: { seek(t: number): void; pause(): void }; stale: boolean; style?: CSSProperties; className?: string
}) {
  const clear = async () => {
    try { await deleteNote(n.id); notesUI.setState({ open: null }); refreshNotes() } catch (e) { toast('Could not clear', { type: 'error', description: (e as Error).message }) }
  }
  return (
    <div data-note-ui="" className={cn('pop pointer-events-auto w-[272px] overflow-hidden text-ui', className)} style={style} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex h-9 items-center gap-0.5 border-b border-line pr-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-medium text-fg-muted">
          Comment {num}{n.anchor?.on === 'param' ? ` · ${paramLabel(params, n.anchor.key)}` : ''}
        </span>
        {stale && <IconButton icon={RotateCcw} size="icon-sm" label="Show the state it was made in" onClick={() => restoreSnapshot(n.snapshot, { params, clock })} />}
        <IconButton icon={Trash2} size="icon-sm" label="Clear comment" onClick={clear} />
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        <Message who="You" at={n.snapshot.at} text={n.text ?? ''} />
        {n.resolution
          ? <Message who="Agent" at={n.resolution.at} text={n.resolution.text} />
          : <p className="px-3 pb-3 text-fg-faint">Waiting for the agent. Ask it to check the notes.</p>}
      </div>
    </div>
  )
}

function Message({ who, at, text }: { who: string; at: string; text: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-baseline gap-1.5"><span className="font-medium text-fg">{who}</span><span className="text-fg-faint">{ago(at)}</span></div>
      <p className="mt-0.5 leading-relaxed whitespace-pre-wrap text-fg/90">{text}</p>
    </div>
  )
}

function Composer({ onPost, label, className }: { onPost: (text: string) => void; label?: string; className?: string }) {
  const [text, setText] = useState('')
  const post = () => { if (text.trim()) onPost(text.trim()) }
  return (
    <div data-note-ui="" className={cn('pop pointer-events-auto flex w-[272px] flex-col gap-1.5 p-2', className)} onPointerDown={(e) => e.stopPropagation()}>
      {label && <span className="px-1 text-fg-muted">On {label}</span>}
      <div className="flex items-end gap-1.5">
        <textarea autoFocus rows={1} value={text} placeholder="What should change?" aria-label="Comment"
          onChange={(e) => { setText(e.target.value); e.target.style.height = '0px'; e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px` }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post() }
            if (e.key === 'Escape') notesUI.setState({ draft: null })
          }}
          className="min-h-control flex-1 resize-none rounded-control bg-control px-2 py-1.5 text-ui leading-snug text-fg outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_1px_var(--signal)]" />
        <Button size="icon-sm" variant={text.trim() ? 'primary' : 'ghost'} aria-label="Send to agent" disabled={!text.trim()} onClick={post}><Send size={12} strokeWidth={1.75} /></Button>
      </div>
    </div>
  )
}
