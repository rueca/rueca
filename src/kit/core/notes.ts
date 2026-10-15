/* ---------------------------------------------------------------------------
   Notes to the agent — the tool writes what you did (and later, what you
   noticed) into the repo, so nobody retypes it into the chat.

     const snap = captureSnapshot({ params, history, clock })
     await sendNote({ kind: 'values', snapshot: snap })   // → .rueca/notes/<id>.json

   Every note carries a snapshot: the values that differ from the schema's
   defaults (with label, default and hint), the share link that reopens the
   exact state, the history steps in order, the playhead and the view.
   A 'values' note is a snapshot and nothing else: "these are the ones, bake
   them in". The dev server writes the file (ruecaNotes() in
   notes-server/vite.ts); with no endpoint, formatNotePrompt() is the
   clipboard fallback.

   Framework-agnostic on purpose: a vanilla tool can call it from its own chrome.
--------------------------------------------------------------------------- */
import type { AnyParams } from './params'
import type { HistoryLike } from './history'
import type { DocStore } from './doc'
import { humanize } from './schema'
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
  status: 'open' | 'resolved'
  /** written by the agent when it has acted on the note */
  resolution?: { text: string; at: string }
}

export interface NoteInput {
  kind: NoteKind
  text?: string
  anchor?: NoteAnchor
  snapshot: StudioSnapshot
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
