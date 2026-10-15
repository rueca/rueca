/* ---------------------------------------------------------------------------
   Notes to the agent — the tool writes what you did (and later, what you
   noticed) into the repo, so nobody retypes it into the chat.

     const snap = captureSnapshot({ params, history, clock })
     await sendNote({ kind: 'values', snapshot: snap })   // → .rueca/notes/<id>.json

   Every note carries a snapshot: the values that differ from the schema's
   defaults (with label, default and hint), the share link that reopens the
   exact state, the history steps in order, the playhead and the view.
   A 'values' note is a snapshot and nothing else: "these are the ones, bake
   them in". A 'comment' adds what you noticed, where (an artboard point or a
   knob) and a thumbnail. The dev server writes the file (ruecaNotes() in
   notes-server/vite.ts); with no endpoint, formatNotePrompt() is the
   clipboard fallback.

   Framework-agnostic on purpose: a vanilla tool can call it from its own chrome.
--------------------------------------------------------------------------- */
import type { AnyParams } from './params'
import type { HistoryLike } from './history'
import type { DocStore } from './doc'
import { equal, humanize } from './schema'
import { snapshotElement } from './snapshot'
import { currentTheme } from './theme'

export interface SnapshotChange {
  value: unknown
  default: unknown
  label: string
  hint?: string
}

export interface StudioSnapshot {
  /** snapshot format version */
  $v: 1
  /** params.id */
  tool: string
  /** the params store's schema `version` (what a share link calls $v) */
  schema: number
  /** ISO time */
  at: string
  /** reopens this exact state (params.shareURL()) */
  url: string
  /** every shareable value that differs from the schema default */
  changed: Record<string, SnapshotChange>
  /** history step labels since the page opened, oldest first */
  steps: string[]
  /** playhead in ms, when a clock was given */
  t?: number
  /** a doc store's state, when given and under ~50 KB (share links don't carry docs) */
  doc?: { id: string; value: unknown } | { id: string; omitted: 'too large' }
  view: { width: number; height: number; theme: 'light' | 'dark' }
}

export type NoteAnchor =
  | { on: 'artboard'; x: number; y: number; target?: string }
  | { on: 'param'; key: string }

export type NoteKind = 'values' | 'comment'

export interface StudioNote {
  id: string
  kind: NoteKind
  text?: string
  anchor?: NoteAnchor
  snapshot: StudioSnapshot
  /** thumbnail file name beside the note (<id>.jpg), when one was taken */
  image?: string
  status: 'open' | 'resolved'
  /** written by the agent when it has acted on the note */
  resolution?: { text: string; at: string }
}

export interface NoteInput {
  kind: NoteKind
  text?: string
  anchor?: NoteAnchor
  snapshot: StudioSnapshot
  /** a data URL (captureImage); stored beside the note as a file */
  image?: string
}

export interface CaptureSources {
  params: AnyParams
  /** a joined createHistory, a doc store or the params store: where the step labels come from (default: params) */
  history?: HistoryLike
  clock?: { time(): number }
  doc?: DocStore<any>
  /** artboard size; defaults to the window */
  view?: { width: number; height: number }
}

const DOC_CAP = 50_000

/** Step labels from any HistoryLike: a History ({ past: { label }[] }), a params store (pastLabels) or a doc store. */
function stepsOf(h: HistoryLike): string[] {
  const s = (h as { getState?: () => any }).getState?.()
  if (!s) return []
  if (Array.isArray(s.pastLabels)) return [...s.pastLabels]
  if (Array.isArray(s.past)) return s.past.map((p: any) => (typeof p?.label === 'string' ? p.label : 'Edit'))
  return []
}

export function captureSnapshot(src: CaptureSources): StudioSnapshot {
  const { params } = src
  const defaults = params.getState().defaults as Record<string, unknown>
  const changed: Record<string, SnapshotChange> = {}
  for (const [k, value] of Object.entries(params.toJSON({ changedOnly: true, shareable: true }))) {
    const d = params.defs[k] as { label?: string; hint?: string } | undefined
    changed[k] = { value, default: defaults[k], label: d?.label ?? humanize(k), ...(d?.hint ? { hint: d.hint } : {}) }
  }
  let doc: StudioSnapshot['doc']
  if (src.doc) {
    const value = src.doc.get()
    doc = JSON.stringify(value).length > DOC_CAP ? { id: src.doc.id, omitted: 'too large' } : { id: src.doc.id, value }
  }
  const t = src.clock?.time()
  return {
    $v: 1,
    tool: params.id,
    schema: params.version,
    at: new Date().toISOString(),
    url: params.shareURL(),
    changed,
    steps: stepsOf(src.history ?? params),
    ...(t !== undefined ? { t: Math.round(t) } : {}),
    ...(doc ? { doc } : {}),
    view: {
      width: Math.round(src.view?.width ?? (typeof window !== 'undefined' ? window.innerWidth : 0)),
      height: Math.round(src.view?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 0)),
      theme: currentTheme(),
    },
  }
}

/** The note as a prompt, for the clipboard when no dev server is listening. */
export function formatNotePrompt(note: Pick<NoteInput, 'kind' | 'text' | 'snapshot'>): string {
  const { snapshot: s } = note
  const lines = Object.entries(s.changed).map(([k, c]) =>
    `- ${c.label} (\`${k}\`): ${JSON.stringify(c.value)} (default ${JSON.stringify(c.default)})${c.hint ? ` — ${c.hint}` : ''}`)
  const head = note.kind === 'values'
    ? `Apply these tuned values to ${s.tool}. Each is a param key in the schema:`
    : `A note on ${s.tool}:\n\n${note.text ?? ''}\n\nValues when it was written:`
  return `${head}\n\n${lines.join('\n') || '- (no changes from defaults)'}\n\nOpen this state: ${s.url}\n`
}

/* ── transport ─────────────────────────────────────────────────────────── */

export const NOTES_PATH = '/__rueca/notes'

let found: Promise<string | null> | null = null

/** Where notes can be sent: the dev server's notes route, or null (a static build, no plugin). Probed once. */
export function findNotesEndpoint(): Promise<string | null> {
  if (typeof fetch === 'undefined' || typeof location === 'undefined') return Promise.resolve(null)
  found ??= fetch(NOTES_PATH, { headers: { accept: 'application/json' } })
    // a static host answers 200 with index.html for unknown paths: only a JSON array counts
    .then(async (r) => (r.ok && r.headers.get('x-rueca-notes') === '1' && Array.isArray(await r.json()) ? NOTES_PATH : null))
    .catch(() => null)
  return found
}

async function call<T>(init?: RequestInit): Promise<T> {
  const url = await findNotesEndpoint()
  if (!url) throw new Error('No notes endpoint. Add ruecaNotes() to the dev server.')
  const r = await fetch(url, init)
  const body = await r.json().catch(() => null)
  if (!r.ok) throw new Error(body?.error ?? `Notes endpoint answered ${r.status}`)
  return body as T
}

/** Write a note into the repo (via the dev server). Resolves with the stored note. */
export function sendNote(input: NoteInput): Promise<StudioNote> {
  return call<StudioNote>({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
}

export function listNotes(): Promise<StudioNote[]> {
  return call<StudioNote[]>()
}

export function deleteNote(id: string): Promise<{ id: string }> {
  return findNotesEndpoint().then((url) => {
    if (!url) throw new Error('No notes endpoint. Add ruecaNotes() to the dev server.')
    return fetch(`${url}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).then(async (r) => {
      const body = await r.json().catch(() => null)
      if (!r.ok) throw new Error(body?.error ?? `Notes endpoint answered ${r.status}`)
      return body
    })
  })
}

/* ── live updates ──────────────────────────────────────────────────────── */

const watchers = new Set<(notes: StudioNote[]) => void>()
let latest: StudioNote[] | null = null
let latestKey = ''
let timer: ReturnType<typeof setTimeout> | undefined
let pollMs = 2500
// ONE loop, however many watchers and refreshes: a refresh during a fetch queues one more round instead of a second loop
let running = false
let again = false

async function poll(): Promise<void> {
  if (running) { again = true; return }
  clearTimeout(timer)
  timer = undefined
  if (!watchers.size) return
  running = true
  try {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      const notes = await listNotes()
      const key = JSON.stringify(notes)
      if (key !== latestKey) { latestKey = key; latest = notes; watchers.forEach((fn) => fn(notes)) }
    }
  } catch { /* no endpoint or a hiccup: try again next round */ } finally { running = false }
  if (again) { again = false; return poll() }
  if (watchers.size) timer = setTimeout(poll, pollMs)
}

/** Calls `fn` with every note now and whenever any changes (the agent resolving one, a new one from another tab).
    One shared poll of the dev server, paused while the tab is hidden. Returns unsubscribe. */
export function watchNotes(fn: (notes: StudioNote[]) => void, opts: { interval?: number } = {}): () => void {
  if (opts.interval) pollMs = opts.interval
  watchers.add(fn)
  if (latest) fn(latest)
  if (!timer && !running) poll()
  return () => { watchers.delete(fn) }
}

/** Ask the poll to run now (after sending or clearing a note). */
export function refreshNotes() {
  poll()
}

/* ── a note's state ────────────────────────────────────────────────────── */

/** The values a snapshot describes: every shareable default, with the snapshot's changes on top. */
function snapshotValues(snapshot: StudioSnapshot, params: AnyParams) {
  const defaults = params.getState().defaults as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(defaults)) if ((params.defs[k] as { share?: boolean } | undefined)?.share !== false) out[k] = defaults[k]
  for (const [k, c] of Object.entries(snapshot.changed)) out[k] = c.value
  return out
}

/** True when the tool shows the same values the snapshot was taken with. */
export function isSnapshotState(snapshot: StudioSnapshot, params: AnyParams) {
  const now = params.toJSON({ changedOnly: true, shareable: true }) as Record<string, unknown>
  const then = Object.fromEntries(Object.entries(snapshot.changed).map(([k, c]) => [k, c.value]))
  return equal(Object.keys(now).sort(), Object.keys(then).sort()) && Object.keys(now).every((k) => equal(now[k], then[k]))
}

/** Put the tool back in the note's state: its values as one undo step, the playhead paused where it was. */
export function restoreSnapshot(snapshot: StudioSnapshot, src: { params: AnyParams; clock?: { seek(t: number): void; pause(): void } }) {
  src.params.replace(snapshotValues(snapshot, src.params) as never, { label: 'Open comment' })
  if (src.clock && snapshot.t !== undefined) { src.clock.seek(snapshot.t); src.clock.pause() }
}

/* ── thumbnail ─────────────────────────────────────────────────────────── */

/**
 * A JPEG of the artboard as a data URL: its DOM (snapshotElement) with every <canvas> drawn on top
 * where it sits, plus a ring at the anchor so the agent sees where the comment points. Never throws:
 * whatever can't be drawn (cross-origin frames, a WebGL buffer already cleared) is left blank.
 */
export async function captureImage(el: HTMLElement, opts: { maxWidth?: number; anchor?: { x: number; y: number } } = {}): Promise<string | undefined> {
  const w = el.offsetWidth, h = el.offsetHeight
  if (!w || !h) return undefined
  const scale = Math.min(1, (opts.maxWidth ?? 800) / w)
  const W = Math.round(w * scale), H = Math.round(h * scale)
  const out = document.createElement('canvas')
  out.width = W; out.height = H
  const ctx = out.getContext('2d')
  if (!ctx) return undefined
  ctx.fillStyle = getComputedStyle(el).backgroundColor || '#fff'
  ctx.fillRect(0, 0, W, H)
  try { ctx.drawImage(await snapshotElement(el, { width: w, height: h, scale }), 0, 0, W, H) } catch { /* DOM part unavailable */ }
  // canvases are skipped by snapshotElement: place each where it is on screen (the stage may be zoomed)
  const box = el.getBoundingClientRect()
  const k = W / box.width
  for (const c of Array.from(el.querySelectorAll('canvas'))) {
    const r = c.getBoundingClientRect()
    try { ctx.drawImage(c, (r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k) } catch { /* tainted */ }
  }
  if (opts.anchor) {
    const x = opts.anchor.x * W, y = opts.anchor.y * H, R = Math.max(10, W / 40)
    ctx.lineWidth = Math.max(3, W / 200)
    ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, R + ctx.lineWidth, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke()
  }
  try { return out.toDataURL('image/jpeg', 0.85) } catch { return undefined }
}
