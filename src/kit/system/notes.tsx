/* ---------------------------------------------------------------------------
   Comments to the agent — Figma-style pins that land in .rueca/notes/.

     <Artboard …>
       <CanvasSurface … />
       <NoteLayer params={params} clock={clock} />     // pins, composer, threads
     </Artboard>
     <ParamActions params={params} clock={clock} />    // the Comment button (C)

   In comment mode, click the artboard to pin a comment to that point, or click
   a knob's row in the Inspector to pin it to that param (keyboard: Enter on the
   artboard target drops a pin in its middle; Enter on a focused knob pins to it).
   The note carries the snapshot (values, link, steps, playhead) and a
   thumbnail with the point ringed. A comment is a thread: the agent's reply
   shows on the pin as soon as it writes it (the folder is polled), with a
   toast, and you can answer it. A pin says whose turn it is: quiet while the
   agent's, blue for a reply you haven't read, ink once read. Only you close a
   thread (Done); done threads leave the board for the list's Done tab.

   Everything renders nothing until the dev server's notes route answers
   (ruecaNotes()), so a static build never shows it.
--------------------------------------------------------------------------- */
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { ArrowUp, Check, RotateCcw, Trash2, History } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { useParamState, type AnyParams } from '../core/params'
import type { HistoryLike } from '../core/history'
import type { DocStore } from '../core/doc'
import type { Clock } from '../core/clock'
import { humanize } from '../core/schema'
import { useHotkeys } from '../core/hotkeys'
import { clamp, cn } from '../core/cn'
import {
  CANVAS_REACH, captureImage, captureSnapshot, deleteNote, findNotesEndpoint, noteMessages, noteTurn, refreshNotes, replyToNote, restoreSnapshot,
  sendNote, setNoteStatus, snapshotStatus, watchNotes,
  type NoteAnchor, type StudioNote,
} from '../core/notes'
import { useZoom } from '../stage/Stage'
import { useSafeArea } from '../layout/Studio'
import { Button, IconButton } from '../ui/button'
import { Segmented, Switch } from '../ui/controls'
import { toast } from './toast'
import { Tip } from '../ui/tooltip'
import { revealInScroller } from '../core/scroll'

/** `layer`: the NoteLayer that owns it; `t`: the playhead when the spot was picked (the clock pauses there while you
    write); `resume`: it was playing; `sending`: on its way (a second Enter must not send it twice); `text`: what's typed
    so far — kept here, not in the composer, so moving the comment to another knob never loses it */
interface Draft { layer: string; anchor: NoteAnchor; t?: number; resume?: boolean; sending?: boolean; text?: string }
interface NotesUI {
  /** comment mode: the next click on the artboard or a knob row starts a comment */
  commenting: boolean
  /** tool ids with a NoteLayer mounted (a count each): the Comment button shows only with somewhere to pin, and only
      their replies get a toast with Show */
  tools: Record<string, number>
  /** tool ids with any notes UI mounted (buttons too): replies for other tools are not announced here */
  watching: Record<string, number>
  open: string | null
  draft: Draft | null
  /** done threads keep their pins on the board too (the list's Done tab switches it) */
  showDone: boolean
}
export const notesUI = createStore<NotesUI>(() => ({ commenting: false, tools: {}, watching: {}, open: null, draft: null, showDone: false }))
const useUI = <T,>(pick: (s: NotesUI) => T) => useStore(notesUI, pick)
const bump = (key: 'tools' | 'watching', id: string, by: number) => notesUI.setState((s) => {
  const next = { ...s[key], [id]: (s[key][id] ?? 0) + by }
  if (next[id] <= 0) delete next[id]
  return { [key]: next } as Partial<NotesUI>
})

/* The comment icons, drawn from the pin and the comment cursor (a circle with its bottom-left corner left square) so
   the toolbar, the cursor and the pins read as one family. Lucide's grid, caps and joins, so they sit with its icons. */
const BUBBLE_PATH = 'M3 12a9 9 0 1 1 9 9H4a1 1 0 0 1-1-1z'
type GlyphProps = { size?: number; strokeWidth?: number; className?: string }
const glyph = (name: string, children: ReactNode) => function Glyph({ size = 24, strokeWidth = 2, className }: GlyphProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn('lucide', `lucide-${name}`, className)}>
      <path d={BUBBLE_PATH} />
      {children}
    </svg>
  )
}
/** Comment: the bubble with a plus. */
export const CommentIcon = glyph('rueca-comment', <><path d="M12 8v8" /><path d="M8 12h8" /></>)
/** All comments: the bubble with two lines of text. */
export const CommentsIcon = glyph('rueca-comments', <><path d="M8 10h8" /><path d="M8 14h5" /></>)

/** True once the dev server's notes route answers (ruecaNotes()); false on a static build. Re-checks after a failure. */
export function useNotesEndpoint() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let live = true
    let timer: ReturnType<typeof setTimeout>
    const check = () => findNotesEndpoint().then((u) => {
      if (!live) return
      setOk(!!u)
      // the dev server may still be starting: look again in a while (production never probes, so this stays quiet)
      if (!u && !(import.meta as { env?: { PROD?: boolean } }).env?.PROD) timer = setTimeout(check, 6000)
    })
    check()
    return () => { live = false; clearTimeout(timer) }
  }, [])
  return ok
}

/* What you've read: per comment, how many messages its thread had when you last looked. Kept in this browser, so
   opening a thread never rewrites its file. A comment whose last message is the agent's and that has grown since is
   a new reply: its pin turns blue. */
const SEEN_KEY = 'rueca:notes:seen'
const seen = createStore<Record<string, number>>(() => {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
})
const writeSeen = (next: Record<string, number>) => {
  seen.setState(next, true)
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* private window: read state lasts the visit */ }
}
function markSeen(n: StudioNote) {
  const count = noteMessages(n).length
  if ((seen.getState()[n.id] ?? 0) !== count) writeSeen({ ...seen.getState(), [n.id]: count })
}
const isUnread = (n: StudioNote, map: Record<string, number>) => noteTurn(n) === 'person' && (map[n.id] ?? 0) < noteMessages(n).length

type PinState = 'waiting' | 'new' | 'replied' | 'done'
const pinState = (n: StudioNote, map: Record<string, number>): PinState =>
  n.status === 'done' ? 'done' : noteTurn(n) === 'agent' ? 'waiting' : isUnread(n, map) ? 'new' : 'replied'
const STATE_LABEL: Record<PinState, string> = { waiting: 'waiting for the agent', new: 'new reply', replied: 'the agent replied', done: 'done' }
const lastReply = (n: StudioNote) => n.replies[n.replies.length - 1]

/* One watcher for the page turns the agent's replies into toasts, however many components show notes. It runs while
   any notes UI is mounted, and only announces notes for the tools on screen. */
let stopReplies: (() => void) | null = null
function watchReplies() {
  if (stopReplies) return
  // agent replies already toasted (or there before the page looked), as id:length: a note that vanishes for a poll
  // (a half-written file) and comes back is still announced once, and so is one answered between two polls
  let announced: Set<string> | null = null
  const key = (n: StudioNote) => `${n.id}:${n.replies.length}`
  stopReplies = watchNotes((notes) => {
    // forget read state for comments that are gone
    const ids = new Set(notes.map((n) => n.id))
    const map = seen.getState()
    if (Object.keys(map).some((k) => !ids.has(k))) writeSeen(Object.fromEntries(Object.entries(map).filter(([k]) => ids.has(k))))
    const answered = notes.filter((n) => lastReply(n)?.from === 'agent')
    const first = !announced
    announced ??= new Set(answered.map(key))
    const { watching, tools, open } = notesUI.getState()
    for (const n of answered) {
      if (!watching[n.snapshot.tool]) continue
      if (n.kind === 'values') {
        // a values note has no thread: once the agent has answered it, it has done its job
        if (!first && !announced.has(key(n))) toast('The agent applied your values', { description: clip(lastReply(n)!.text), timeout: 8000 })
        announced.add(key(n))
        deleteNote(n.id).then(refreshNotes, () => {})
        continue
      }
      if (announced.has(key(n))) continue
      announced.add(key(n))
      // the thread is open: the reply appears right there
      if (open === n.id) continue
      toast('The agent replied', {
        description: clip(lastReply(n)!.text), timeout: 8000,
        // Show only where the pin is on screen; it opens the thread without dropping a comment being written
        ...(tools[n.snapshot.tool] ? { action: { label: 'Show', onClick: () => notesUI.setState({ open: n.id }) } } : {}),
      })
    }
  })
}
const clip = (text: string) => (text.length > 160 ? `${text.slice(0, 157)}…` : text || undefined)

/** Every note in .rueca/notes/, kept live. Empty without the notes route. Pass the tool id to have its replies announced. */
export function useNotes(tool?: string): StudioNote[] {
  const available = useNotesEndpoint()
  const [notes, setNotes] = useState<StudioNote[]>([])
  useEffect(() => {
    if (!available) return
    if (tool) bump('watching', tool, 1)
    watchReplies()
    const off = watchNotes(setNotes)
    return () => {
      off()
      if (tool) bump('watching', tool, -1)
      // nothing on screen shows notes any more: stop the page-wide watcher, and with it the poll
      if (!Object.keys(notesUI.getState().watching).length && stopReplies) { stopReplies(); stopReplies = null }
    }
  }, [available, tool])
  return notes
}

/** Toolbar toggle for comment mode (C). Shows only with the notes route and a NoteLayer to pin into. */
export function CommentButton({ params, hotkey = 'c' }: { params?: AnyParams; hotkey?: string | false }) {
  const available = useNotesEndpoint()
  const layers = useUI((s) => Object.keys(s.tools).length)
  const commenting = useUI((s) => s.commenting)
  const notes = useNotes(params?.id)
  const map = useStore(seen)
  const on = available && layers > 0
  // the badge counts what needs you: replies you haven't read
  const fresh = notes.filter((n) => n.kind === 'comment' && (!params || n.snapshot.tool === params.id) && isUnread(n, map)).length
  const toggle = () => notesUI.setState((s) => ({ commenting: !s.commenting, draft: null, open: null }))
  // a held key repeats: only the first press toggles
  useHotkeys(on && hotkey ? { [hotkey]: { run: (e) => { if (!e.repeat) toggle() }, label: 'Comment', group: 'Tools' } } : {}, [on, hotkey], { priority: 0 })
  if (!on) return null
  const label = `${commenting ? 'Stop commenting' : 'Comment'}${fresh ? ` (${fresh} new ${fresh === 1 ? 'reply' : 'replies'})` : ''}`
  return (
    <IconButton icon={CommentIcon} label={label} shortcut={hotkey || undefined} active={commenting} onClick={toggle} className="relative">
      {fresh > 0 && (
        <span aria-hidden className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-signal-strong px-0.5 text-ui-sm leading-none font-semibold text-signal-fg tabular">
          {fresh}
        </span>
      )}
    </IconButton>
  )
}

/* The comment-mode cursor, after Figma's: the comment bubble (a circle with its bottom-left corner left square, the
   same shape as the pins), dark with a white edge so it reads on any artwork. The hotspot is that square corner, so
   the pin lands exactly where the tip was. */
const BUBBLE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 1 9 9H3z" fill="#1e1e1e" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`
export const COMMENT_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(BUBBLE)}") 3 21, crosshair`

/**
 * Every comment on this tool as a list, beside the Comment button. A pin only shows while its spot is on screen
 * (a knob's row in a collapsed section has none), so the list is where nothing gets lost. Open threads group by
 * whose turn it is, yours first; done ones have their own tab. Each row opens to the whole thread.
 */
export function CommentsList({ params }: { params: AnyParams }) {
  const available = useNotesEndpoint()
  const layers = useUI((s) => Object.keys(s.tools).length)
  const showDone = useUI((s) => s.showDone)
  const all = useNotes(params.id).filter((n) => n.kind === 'comment' && n.snapshot.tool === params.id)
  const map = useStore(seen)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'open' | 'done'>('open')
  // reading a thread in the list counts as reading it
  const reading = all.find((n) => n.id === expanded)
  useEffect(() => { if (reading) markSeen(reading) })
  if (!available || !layers) return null
  const num = (n: StudioNote) => all.indexOf(n) + 1
  const yours = all.filter((n) => noteTurn(n) === 'person')
  const waiting = all.filter((n) => noteTurn(n) === 'agent')
  const done = all.filter((n) => n.status === 'done')
  const fresh = yours.filter((n) => isUnread(n, map)).length
  const label = all.length ? `All comments (${all.length}${fresh ? `, ${fresh} new ${fresh === 1 ? 'reply' : 'replies'}` : ''})` : 'All comments'
  const where = (n: StudioNote) => {
    const a = n.anchor
    if (!a) return 'On the tool'
    if (a.on === 'param') return `On ${paramLabel(params, a.key)}`
    if (a.on === 'canvas') return 'Beside the artboard'
    return a.target ? `On ${a.target}` : 'On the artboard'
  }
  const show = (n: StudioNote) => {
    // a knob's pin needs its row on screen: bring it into view first (when its section is open)
    if (n.anchor?.on === 'param') revealInScroller(document.querySelector(`[data-param="${CSS.escape(n.anchor.key)}"]`))
    notesUI.setState({ open: n.id })
    setOpen(false)
  }
  const act = async (what: string, run: () => Promise<unknown>) => {
    try { await run(); refreshNotes() } catch (e) { toast(`Could not ${what}`, { type: 'error', description: (e as Error).message }) }
  }
  const row = (n: StudioNote) => {
    const state = pinState(n, map)
    const isOpen = expanded === n.id
    const last = lastReply(n)
    const msgs = noteMessages(n)
    return (
      <li key={n.id}>
        <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : n.id)}
          className="flex w-full items-start gap-2.5 px-3 py-2 text-left outline-none hover:bg-hover focus-visible:bg-hover">
          <MiniPin state={state} num={num(n)} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1 truncate text-fg-muted">{where(n)}</span>
              <span className="shrink-0 text-fg-faint">{ago(msgs[msgs.length - 1].at || n.snapshot.at)}</span>
            </span>
            <span className={cn('mt-0.5 block text-fg [overflow-wrap:anywhere]', !isOpen && 'line-clamp-2')}>{n.text}</span>
            {!isOpen && last && (
              <span className={cn('mt-0.5 block truncate', state === 'new' ? 'text-signal-text' : 'text-fg-faint')}>
                {last.from === 'agent' ? 'Agent' : 'You'}: {last.text || 'Done.'}
              </span>
            )}
          </span>
        </button>
        {isOpen && (
          <div className="pb-2 pl-[42px] pr-3">
            {n.replies.map((m, i) => (
              <p key={i} className="mb-1.5 leading-relaxed whitespace-pre-wrap text-fg/90 [overflow-wrap:anywhere]">
                <span className="font-medium text-fg">{m.from === 'agent' ? 'Agent' : 'You'}</span> <span className="text-fg-faint">{ago(m.at)}</span><br />
                {m.text || <span className="text-fg-faint">Done.</span>}
              </p>
            ))}
            {state === 'waiting' && <p className="mb-1.5 text-fg-faint">Waiting for the agent.</p>}
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Button size="sm" variant="default" onClick={() => show(n)}>{state === 'done' ? 'Show' : 'Reply'}</Button>
              {state === 'done'
                ? <Button size="sm" variant="ghost" onClick={() => act('reopen', () => setNoteStatus(n.id, 'open'))}><RotateCcw size={12} strokeWidth={1.75} />Reopen</Button>
                : <Button size="sm" variant="ghost" onClick={() => act('mark done', () => setNoteStatus(n.id, 'done'))}><Check size={12} strokeWidth={1.75} />Done</Button>}
              <Button size="sm" variant="ghost" onClick={() => act('delete', async () => { await deleteNote(n.id); setExpanded(null) })}><Trash2 size={12} strokeWidth={1.75} />Delete</Button>
            </div>
          </div>
        )}
      </li>
    )
  }
  const group = (title: string, list: StudioNote[]) => list.length > 0 && (
    <li key={title}>
      <div className="px-3 pt-2 pb-0.5 text-fg-faint">{title}</div>
      <ol>{list.map(row)}</ol>
    </li>
  )
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tip label={label}>
        <Popover.Trigger aria-label={label}
          className="relative flex size-icon items-center justify-center rounded-control text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:bg-hover data-[popup-open]:text-fg">
          <CommentsIcon size={14} strokeWidth={1.5} />
        </Popover.Trigger>
      </Tip>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-[160]">
          <Popover.Popup data-note-ui="" className="pop flex max-h-[min(70vh,560px)] w-[320px] flex-col overflow-hidden text-ui outline-none">
            <div className="flex h-9 shrink-0 items-center justify-between px-3">
              <span className="font-medium text-fg">Comments</span>
              {fresh > 0 && <span className="text-signal-text tabular">{fresh} new</span>}
            </div>
            {!all.length && <p className="px-3 pb-3 text-fg-faint">No comments yet. Press C, then click the artboard, the canvas around it or a knob.</p>}
            {all.length > 0 && (
              <div className="shrink-0 px-3 pb-1.5">
                <Segmented size="sm" label="Which comments" value={tab} onChange={setTab} className="w-full"
                  options={[{ value: 'open', label: `Open · ${yours.length + waiting.length}` }, { value: 'done', label: `Done · ${done.length}` }]} />
              </div>
            )}
            <ol className="min-h-0 overflow-y-auto pb-1">
              {tab === 'open'
                ? <>{group('Your turn', yours)}{group('Waiting for the agent', waiting)}</>
                : done.map(row)}
            </ol>
            {all.length > 0 && tab === 'open' && !yours.length && !waiting.length && <p className="px-3 pb-3 text-fg-faint">Nothing open. Done threads are in the Done tab.</p>}
            {tab === 'done' && (
              <label className="flex h-9 shrink-0 items-center gap-2 border-t border-line px-3 text-fg-muted">
                <span className="flex-1">Show done on the board</span>
                <Switch size="sm" checked={showDone} onChange={(b) => notesUI.setState({ showDone: b })} label="Show done on the board" />
              </label>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

const paramLabel = (params: AnyParams, key: string) => (params.defs[key] as { label?: string } | undefined)?.label ?? humanize(key)
const PIN = 28
const CARD = { w: 272, h: 320 }

/** The part of the window the stage really shows: the studio root minus what its floating panels cover. */
function useStageRect(anchor: HTMLElement | null) {
  const safe = useSafeArea()
  return () => {
    const root = (anchor?.closest('.studio') as HTMLElement | null)?.getBoundingClientRect() ?? { left: 0, top: 0, right: innerWidth, bottom: innerHeight }
    return { left: root.left + safe.left, top: root.top + safe.top, right: root.right - safe.right, bottom: root.bottom - safe.bottom }
  }
}

/** Pins, composer and threads for one artboard. Put it inside the <Artboard>, next to the surface. */
export function NoteLayer({ params, history, clock, doc, describeAt }: {
  params: AnyParams
  history?: HistoryLike
  clock?: Clock
  doc?: DocStore<any>
  /** names what is under a pin (x, y as 0–1 of the artboard), e.g. 'layer:hero' — goes into the note's anchor */
  describeAt?: (x: number, y: number) => string | undefined
}) {
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  const [el, setEl] = useState<{ art: HTMLElement; host: HTMLElement; stage: HTMLElement | null } | null>(null)
  useLayoutEffect(() => {
    const me = ref.current!
    const art = (me.closest('[data-studio-artifact]') as HTMLElement | null) ?? me.parentElement!
    // pins render beside the artboard's clipping box, so a thread near an edge isn't cut off — but only when that
    // box is an Artboard's own, sized the same (in a ViewportFrame the parent is wider, so pins stay inside)
    const parent = art.parentElement
    setEl({ art, host: parent?.hasAttribute('data-studio-artboard') ? parent : art, stage: art.closest('[data-studio-stage]') as HTMLElement | null })
  }, [])
  useEffect(() => {
    bump('tools', params.id, 1)
    return () => {
      bump('tools', params.id, -1)
      notesUI.setState((s) => ({ commenting: Object.keys(s.tools).length > 0 && s.commenting, ...(s.draft?.layer === id ? { draft: null } : {}), open: null }))
    }
  }, [params.id, id])

  const zoom = useZoom()
  const all = useNotes(params.id)
  const notes = all.filter((n) => n.kind === 'comment' && n.snapshot.tool === params.id)
  const commenting = useUI((s) => s.commenting)
  const draft = useUI((s) => (s.draft?.layer === id ? s.draft : null))
  const open = useUI((s) => s.open)
  const showDone = useUI((s) => s.showDone)
  // done threads leave the board, unless asked for, or opened from the list
  const pinned = notes.filter((n) => n.status !== 'done' || showDone || open === n.id)
  useParamState(params, (s) => s.committed)   // pins from another state fade: re-check on every commit
  const num = (nid: string) => notes.findIndex((n) => n.id === nid) + 1
  const status = (n: StudioNote) => snapshotStatus(n.snapshot, params)
  const stageRect = useStageRect(el?.art ?? null)

  // focus goes back where it was when a comment ends
  const returnTo = useRef<HTMLElement | null>(null)

  useHotkeys(commenting || draft || open ? { esc: { run: () => notesUI.setState({ commenting: false, draft: null, open: null }), label: 'Close comment', group: 'Tools' } } : {}, [commenting, !!draft, !!open], { priority: 5 })

  // However a comment ends (sent, Esc, a click away), a clock that was playing plays on, and focus goes back.
  useEffect(() => notesUI.subscribe((s, prev) => {
    if (prev.draft?.layer === id && !s.draft) {
      if (prev.draft.resume) clock?.play()
      if (returnTo.current?.isConnected) returnTo.current.focus()
      returnTo.current = null
    }
  }), [clock, id])

  // A click outside any pin, thread or composer closes them. A knob row while commenting is not "outside": it
  // moves the comment to that knob and keeps what you typed.
  useEffect(() => {
    if (!open && !draft) return
    const down = (e: PointerEvent) => {
      const t = e.target as Element
      if (t.closest?.('[data-note-ui]')) return
      if (notesUI.getState().commenting && t.closest?.('[data-param]')) return
      notesUI.setState({ open: null, draft: null })
    }
    document.addEventListener('pointerdown', down, true)
    return () => document.removeEventListener('pointerdown', down, true)
  }, [open, draft])

  /** Start a comment at an anchor: freeze the frame being commented on. */
  const begin = (anchor: NoteAnchor) => {
    const prev = notesUI.getState().draft
    const mine = prev?.layer === id ? prev : null
    if (mine?.sending) return
    if (!mine) returnTo.current = document.activeElement as HTMLElement | null
    const resume = mine ? mine.resume : !!clock?.getState().playing
    clock?.pause()
    notesUI.setState({ draft: { layer: id, anchor, t: mine?.t ?? clock?.time(), resume, text: mine?.text ?? '' }, open: null })
  }

  // Comment mode: a click (or Enter / Space) on an Inspector row pins the comment to that knob instead of changing it.
  useEffect(() => {
    if (!commenting) return
    const rowOf = (e: Event) => {
      if (e.defaultPrevented) return null   // another NoteLayer took it
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
    const key = (e: KeyboardEvent) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return
      const row = rowOf(e)
      if (!row) return
      e.preventDefault(); e.stopPropagation()
      begin({ on: 'param', key: row.dataset.param! })
    }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('click', click, true)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('click', click, true)
      document.removeEventListener('keydown', key, true)
    }
  }, [commenting, params, clock, id])   // eslint-disable-line react-hooks/exhaustive-deps

  // The knob rows take the comment cursor too while commenting: a click there pins, it doesn't change the value.
  useEffect(() => {
    if (!commenting) return
    const style = document.createElement('style')
    style.dataset.noteCursor = ''
    style.textContent = `[data-param], [data-param] * { cursor: ${COMMENT_CURSOR} !important }`
    document.head.appendChild(style)
    return () => style.remove()
  }, [commenting])

  // Space held = the stage's pan, not a pin.
  const space = useRef(false)
  useEffect(() => {
    if (!commenting) return
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space') space.current = true }
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') space.current = false }
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true)
    return () => { window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); space.current = false }
  }, [commenting])

  // Knob comments sit beside their rows: follow them as panels scroll and resize, and hide them when the row is
  // scrolled out of its panel (or not rendered: a collapsed section, a hidden param).
  const paramKeys = [...new Set([...pinned, ...(draft ? [{ anchor: draft.anchor }] : [])].flatMap((n) => (n.anchor?.on === 'param' ? [n.anchor.key] : [])))]
  const [rows, setRows] = useState<Record<string, { left: number; top: number }>>({})
  const keysId = paramKeys.join('|')
  useEffect(() => {
    if (!paramKeys.length) { setRows({}); return }
    let raf = 0
    const measure = () => {
      raf = 0
      const next: Record<string, { left: number; top: number }> = {}
      for (const k of paramKeys) {
        const row = document.querySelector(`[data-param="${CSS.escape(k)}"]`)
        const r = row?.getBoundingClientRect()
        if (!row || !r || !r.height) continue
        const mid = r.top + r.height / 2
        let visible = true
        for (let p = row.parentElement; p && visible; p = p.parentElement) {
          const cs = getComputedStyle(p)
          if (cs.overflowY !== 'visible') { const b = p.getBoundingClientRect(); visible = mid >= b.top && mid <= b.bottom }
        }
        if (visible) next[k] = { left: Math.round(r.left), top: Math.round(mid) }
      }
      setRows((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    const soon = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    document.addEventListener('scroll', soon, true)
    window.addEventListener('resize', soon)
    const id2 = setInterval(soon, 500)   // panels that move without scrolling (a section opening)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('scroll', soon, true); window.removeEventListener('resize', soon); clearInterval(id2) }
  }, [keysId])   // eslint-disable-line react-hooks/exhaustive-deps

  /** A point in artboard units: on it (0–1) it's an artboard comment, anywhere else on the stage a canvas comment. */
  const placeAt = (x: number, y: number) => {
    if (x < 0 || x > 1 || y < 0 || y > 1) return begin({ on: 'canvas', x: clamp(x, -CANVAS_REACH, CANVAS_REACH), y: clamp(y, -CANVAS_REACH, CANVAS_REACH) })
    const target = describeAt?.(x, y)
    begin({ on: 'artboard', x, y, ...(target ? { target } : {}) })
  }
  const place = (e: React.PointerEvent) => {
    // only a plain primary press pins: middle, right and Space-drag stay the stage's pan
    if (e.button !== 0 || space.current) return
    e.preventDefault(); e.stopPropagation()
    const r = el!.art.getBoundingClientRect()
    placeAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }

  // The stage around the artboard takes comments too. Its catcher sits UNDER the artboard's world layer (the
  // stage's first child), so a click on the artboard or on a pin still reaches them.
  const [behind, setBehind] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const stage = el?.stage
    if (!stage) return
    const box = document.createElement('div')
    box.className = 'absolute inset-0'
    stage.insertBefore(box, stage.firstChild)
    setBehind(box)
    return () => { box.remove(); setBehind(null) }
  }, [el?.stage])

  const post = async (text: string) => {
    const d = notesUI.getState().draft
    if (!d || d.layer !== id || d.sending || !el) return
    notesUI.setState({ draft: { ...d, sending: true } })
    try {
      // capture while the frame is still frozen; clearing the draft lets the clock run again
      const snapshot = captureSnapshot({ params, history, clock, doc, view: { width: el.art.offsetWidth, height: el.art.offsetHeight } })
      if (d.t !== undefined) snapshot.t = Math.round(d.t)
      // the clock is paused on this frame, and a paused WebGL renderer has stopped drawing (its buffer is already
      // cleared). Renderers redraw when the time changes, so nudge it half a millisecond for the capture, then put it back.
      const t0 = clock?.time()
      if (clock && t0 !== undefined) clock.seek(t0 > 1 ? t0 - 0.5 : t0 + 0.5)
      const image = await captureImage(el.art, { anchor: d.anchor.on === 'param' ? undefined : d.anchor })
      if (clock && t0 !== undefined) clock.seek(t0)
      const note = await sendNote({ kind: 'comment', text, anchor: d.anchor, snapshot, image })
      notesUI.setState({ draft: null, commenting: false, open: note.id })
      refreshNotes()
      toast('Comment sent to the agent', { type: 'success', description: 'It picks this up with your next message.' })
    } catch (err) {
      // keep the composer and what was typed: nothing is lost to a failed send
      const cur = notesUI.getState().draft
      if (cur?.layer === id) notesUI.setState({ draft: { ...cur, sending: false } })
      toast('Could not send', { type: 'error', description: (err as Error).message })
    }
  }

  /** Which way a card opens from its pin, so it stays on the visible stage (not under a panel, the timeline or the toolbar). */
  const sides = (left: number, top: number) => {
    const s = stageRect()
    return { left: left + PIN + 8 + CARD.w > s.right && left - CARD.w - 8 > s.left, up: top + CARD.h > s.bottom && top - CARD.h > s.top }
  }
  const cardClass = ({ left, up }: { left: boolean; up: boolean }) => cn('absolute', left ? 'right-9' : 'left-9', up ? 'bottom-0' : '-top-7')

  // A pin on a tiny artboard (zoomed far out, a phone) would bury it: draw pins smaller there.
  const pinScale = el && el.art.offsetWidth * zoom < 200 ? 0.6 : 1

  return (
    <>
      <span ref={ref} hidden />
      {el && createPortal(
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
          {commenting && (
            <div data-note-ui="" role="button" tabIndex={0} aria-label="Place a comment on the artboard (Enter for its middle)"
              className="pointer-events-auto absolute inset-0 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]"
              style={{ cursor: COMMENT_CURSOR }}
              onPointerDown={place}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); placeAt(0.5, 0.5) } }} />
          )}
          {pinned.map((n) => n.anchor && n.anchor.on !== 'param' && (
            <PinAt key={n.id} x={n.anchor.x} y={n.anchor.y} zoom={zoom} scale={pinScale} z={open === n.id ? 3 : 1} sides={sides}
              render={(side) => (
                <>
                  <Pin n={n} num={num(n.id)} open={open === n.id} stale={status(n) === 'different'} />
                  {open === n.id && <Thread n={n} num={num(n.id)} params={params} clock={clock} status={status(n)} className={cardClass(side)} />}
                </>
              )} />
          ))}
          {draft && draft.anchor.on !== 'param' && (
            <PinAt x={draft.anchor.x} y={draft.anchor.y} zoom={zoom} scale={pinScale} z={4} sides={sides}
              render={(side) => (<><DraftPin /><Composer draft={draft} onPost={post} className={cardClass(side)} /></>)} />
          )}
        </div>,
        el.host,
      )}
      {behind && commenting && createPortal(
        <div data-note-ui="" role="button" tabIndex={0} aria-label="Place a comment on the canvas around the artboard (Enter for the artboard's middle)"
          className="absolute inset-0 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--signal)]"
          style={{ cursor: COMMENT_CURSOR }}
          onPointerDown={place}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); placeAt(0.5, 0.5) } }} />,
        behind,
      )}
      {createPortal(
        <div data-studio="" className="studio-notes">
          {pinned.map((n) => {
            const at = n.anchor?.on === 'param' ? rows[n.anchor.key] : undefined
            if (!at) return null
            const side = sides(at.left - 34, at.top - PIN / 2)
            // z under the palette and dialogs (150+), above the panels
            return (
              <div key={n.id} className="fixed" style={{ left: at.left - 34, top: at.top + 13, zIndex: open === n.id ? 142 : 140 }}>
                <Pin n={n} num={num(n.id)} open={open === n.id} stale={status(n) === 'different'} />
                {open === n.id && <Thread n={n} num={num(n.id)} params={params} clock={clock} status={status(n)} className={cardClass({ left: true, up: side.up })} />}
              </div>
            )
          })}
          {draft?.anchor.on === 'param' && rows[draft.anchor.key] && (
            <div className="fixed" style={{ left: rows[draft.anchor.key].left - 34, top: rows[draft.anchor.key].top + 13, zIndex: 143 }}>
              <DraftPin />
              <Composer draft={draft} onPost={post} label={paramLabel(params, draft.anchor.key)}
                className={cardClass({ left: true, up: sides(rows[draft.anchor.key].left, rows[draft.anchor.key].top).up })} />
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

/** A zero-size box at a point on the artboard, kept at screen size whatever the zoom. Its card opens toward the room. */
function PinAt({ x, y, zoom, scale, z, sides, render }: {
  x: number; y: number; zoom: number; scale: number; z: number
  sides: (left: number, top: number) => { left: boolean; up: boolean }
  render: (side: { left: boolean; up: boolean }) => ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [side, setSide] = useState({ left: false, up: false })
  useLayoutEffect(() => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const next = sides(r.left, r.top)
    setSide((s) => (s.left === next.left && s.up === next.up ? s : next))
  })
  return (
    <div ref={box} className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: `scale(${scale / zoom})`, transformOrigin: '0 0', zIndex: z }}>
      {render(side)}
    </div>
  )
}

const pinShape = 'absolute bottom-0 left-0 flex size-7 items-center justify-center rounded-full rounded-bl-[3px] text-ui font-semibold tabular shadow-[0_0_0_2px_var(--panel),var(--shadow-cluster)]'
/* Loud only where you're needed: quiet (hollow) while it's the agent's turn, blue for a reply you haven't read, ink once
   read, and a small check for a done thread shown on the board */
const PIN_LOOK: Record<PinState, string> = {
  waiting: 'bg-overlay text-fg-muted shadow-[0_0_0_2px_var(--panel),inset_0_0_0_1px_var(--line-strong),var(--shadow-cluster)]',
  new: 'bg-signal-strong text-signal-fg',
  replied: 'bg-fg text-panel',
  done: 'size-[22px] bg-overlay text-fg-faint opacity-70',
}

function Pin({ n, num, open, stale }: { n: StudioNote; num: number; open: boolean; stale: boolean }) {
  const state = pinState(n, useStore(seen))
  return (
    <button type="button" data-note-ui="" aria-expanded={open}
      aria-label={`Comment ${num}, ${STATE_LABEL[state]}${stale ? ', made in another state' : ''}`}
      onClick={(e) => { e.stopPropagation(); notesUI.setState((s) => ({ open: s.open === n.id ? null : n.id })) }}
      className={cn(pinShape, 'pointer-events-auto outline-none transition-[transform,opacity] hover:scale-110 focus-visible:ring-2 focus-visible:ring-signal',
        PIN_LOOK[state], stale && !open && 'opacity-55', open && 'opacity-100 ring-2 ring-signal')}>
      {state === 'done' ? <Check size={11} strokeWidth={3} /> : num}
    </button>
  )
}

/** A pin's face at list size. */
function MiniPin({ state, num }: { state: PinState; num: number }) {
  return (
    <span aria-hidden className={cn('mt-px flex size-5 shrink-0 items-center justify-center rounded-full rounded-bl-[2px] text-ui-sm font-semibold tabular',
      state === 'waiting' ? 'bg-overlay text-fg-muted shadow-[inset_0_0_0_1px_var(--line-strong)]' : state === 'done' ? 'bg-overlay text-fg-faint' : PIN_LOOK[state])}>
      {state === 'done' ? <Check size={10} strokeWidth={3} /> : num}
    </span>
  )
}

function DraftPin() {
  return <div data-note-ui="" className={cn(pinShape, 'bg-signal-strong text-signal-fg')}>+</div>
}

const ago = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (!Number.isFinite(s)) return ''
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Thread({ n, num, params, clock, status, className }: {
  n: StudioNote; num: number; params: AnyParams; clock?: { seek(t: number): void; pause(): void }; status: 'same' | 'different' | 'other-version'; className?: string
}) {
  const msgs = noteMessages(n)
  const turn = noteTurn(n)
  // what was already read when the card opened: newer agent messages get a blue edge while it stays open
  const [since] = useState(() => seen.getState()[n.id] ?? 0)
  // the reply was new when you opened it: Done stays lit while you read it
  const fresh = turn === 'person' && since < msgs.length
  useEffect(() => { markSeen(n) }, [n.id, msgs.length])   // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (what: string, run: () => Promise<unknown>) => {
    try { await run(); refreshNotes() } catch (e) { toast(`Could not ${what}`, { type: 'error', description: (e as Error).message }) }
  }
  const done = () => act('mark done', async () => {
    await setNoteStatus(n.id, 'done')
    notesUI.setState({ open: null })
    toast('Marked done', { description: 'Find it in the comments list, under Done.', action: { label: 'Undo', onClick: () => act('reopen', () => setNoteStatus(n.id, 'open')) } })
  })
  const title = `Comment ${num}${n.anchor?.on === 'param' ? ` · ${paramLabel(params, n.anchor.key)}` : ''}`
  return (
    <div data-note-ui="" role="dialog" aria-label={title} className={cn('pop pointer-events-auto w-[272px] overflow-hidden text-ui', className)} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex h-header items-center gap-0.5 pr-1.5 pl-pad">
        <span className="min-w-0 flex-1 truncate font-medium text-fg-muted">{title}</span>
        {status === 'different' && <IconButton icon={History} size="icon-sm" label="Show the state it was made in" onClick={() => restoreSnapshot(n.snapshot, { params, clock })} />}
        {turn === null
          ? (
            <Tip label="Reopen">
              <button type="button" onClick={() => act('reopen', () => setNoteStatus(n.id, 'open'))}
                className="mr-0.5 inline-flex h-[18px] items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] pr-1.5 pl-1 font-medium text-ok-text outline-none hover:brightness-125 focus-visible:ring-2 focus-visible:ring-signal">
                <Check size={11} strokeWidth={2.5} />Done
              </button>
            </Tip>
          )
          : turn === 'person'
            // your move: the way to close it is labelled, and lit while the reply is new
            ? <Button size="sm" variant="ghost" onClick={done} className={cn('h-icon-sm gap-1 px-1.5', fresh ? 'bg-signal-soft text-signal-text hover:bg-signal-soft hover:text-signal-text' : 'bg-control text-fg')}><Check size={12} strokeWidth={2} />Done</Button>
            : <IconButton icon={Check} size="icon-sm" label="Mark done" onClick={done} />}
        <IconButton icon={Trash2} size="icon-sm" label="Delete comment" onClick={() => act('delete', async () => { await deleteNote(n.id); notesUI.setState({ open: null }) })} />
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {msgs.map((m, i) => <Message key={i} who={m.from} at={m.at} text={m.text} fresh={m.from === 'agent' && i >= since} />)}
        {turn === 'agent' && <p className="flex gap-1.5 px-3 pb-2 pl-[33px] text-fg-faint"><Dots />Waiting for the agent. It picks this up with your next message.</p>}
        {status === 'other-version' && <p className="px-3 pb-2 text-fg-faint">Made with an earlier version of this tool, so its state can’t be shown.</p>}
      </div>
      <ReplyBox key={n.id} placeholder={turn === null ? 'Reply to reopen…' : turn === 'agent' ? 'Add to this…' : 'Reply…'}
        onPost={(text) => act('send', () => replyToNote(n.id, text))} />
    </div>
  )
}

/** Three dots breathing: the agent's turn. */
function Dots() {
  return (
    <span aria-hidden className="mt-[7px] flex shrink-0 gap-[2px]">
      {[0, 1, 2].map((i) => <i key={i} className="size-[3px] rounded-full bg-current motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
    </span>
  )
}

function Message({ who, at, text, fresh }: { who: 'person' | 'agent'; at: string; text: string; fresh?: boolean }) {
  return (
    <div className="relative grid grid-cols-[16px_1fr] gap-x-[7px] px-3 py-2 [&+&]:border-t [&+&]:border-line">
      {fresh && <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-signal" />}
      <span aria-hidden className={cn('flex size-4 items-center justify-center rounded-full text-[9px] font-semibold', who === 'agent' ? 'bg-fg text-panel' : 'bg-active text-fg')}>
        {who === 'agent' ? '✳' : 'Y'}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5"><span className="font-medium text-fg">{who === 'agent' ? 'Agent' : 'You'}</span><span className="text-fg-faint">{ago(at)}</span>{fresh && <span className="sr-only">(new)</span>}</div>
        <p className="mt-0.5 leading-relaxed whitespace-pre-wrap text-fg/90 [overflow-wrap:anywhere]">{text || <span className="text-fg-faint">Done.</span>}</p>
      </div>
    </div>
  )
}

/** The reply box at the foot of a thread: Enter sends, Shift+Enter is a new line, Esc closes the card. */
function ReplyBox({ placeholder, onPost }: { placeholder: string; onPost: (text: string) => Promise<void> }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const post = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    try { await onPost(t); setText('') } finally { setSending(false) }
  }
  return (
    <div className="flex items-end gap-1.5 px-1.5 pb-1.5">
      <textarea rows={1} value={text} maxLength={MAX_TEXT} readOnly={sending} placeholder={placeholder} aria-label={placeholder.replace('…', '')}
        ref={(t) => { if (t) { t.style.height = '0px'; t.style.height = `${Math.min(140, t.scrollHeight)}px` } }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); post() }
          if (e.key === 'Escape') notesUI.setState({ open: null })
        }}
        className="min-h-control flex-1 resize-none rounded-control bg-control px-2 py-[3px] text-ui leading-snug text-fg outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_1px_var(--signal)]" />
      <Button size="icon-sm" variant={text.trim() ? 'primary' : 'ghost'} aria-label="Send reply" disabled={!text.trim() || sending} onClick={post}><ArrowUp size={12} strokeWidth={2} /></Button>
    </div>
  )
}

const MAX_TEXT = 5000

function Composer({ draft, onPost, label, className, style }: { draft: Draft; onPost: (text: string) => void; label?: string; className?: string; style?: CSSProperties }) {
  const text = draft.text ?? ''
  const sending = !!draft.sending
  const setText = (t: string) => notesUI.setState((s) => (s.draft ? { draft: { ...s.draft, text: t } } : {}))
  const post = () => { if (text.trim() && !sending) onPost(text.trim()) }
  return (
    <div data-note-ui="" className={cn('pop pointer-events-auto flex w-[272px] flex-col gap-1.5 p-2', className)} style={style} onPointerDown={(e) => e.stopPropagation()}>
      {label && <span className="px-1 text-fg-muted">On {label}</span>}
      <div className="flex items-end gap-1.5">
        <textarea autoFocus rows={1} value={text} maxLength={MAX_TEXT} readOnly={sending} placeholder="What should change?" aria-label={label ? `Comment on ${label}` : 'Comment'}
          ref={(t) => { if (t) { t.style.height = '0px'; t.style.height = `${Math.min(140, t.scrollHeight)}px` } }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            // Enter while an input method is composing (Japanese, Chinese…) confirms the text, it doesn't send
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); post() }
            if (e.key === 'Escape') notesUI.setState({ draft: null })
          }}
          className="min-h-control flex-1 resize-none rounded-control bg-control px-2 py-1.5 text-ui leading-snug text-fg outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_1px_var(--signal)]" />
        <Button size="icon-sm" variant={text.trim() ? 'primary' : 'ghost'} aria-label="Send comment" disabled={!text.trim() || sending} onClick={post}><ArrowUp size={12} strokeWidth={2} /></Button>
      </div>
      {text.length > MAX_TEXT - 500 && <span className="px-1 text-fg-faint tabular">{MAX_TEXT - text.length} characters left</span>}
    </div>
  )
}
