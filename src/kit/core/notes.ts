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
import { coerce, equal, humanize } from './schema'
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
  /** every shareable value, changed or not: the exact state, even after the defaults move (the agent baking values in) */
  values?: Record<string, unknown>
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
    // the cap is in bytes, as stored (UTF-8), not in UTF-16 characters
    doc = new TextEncoder().encode(JSON.stringify(value)).length > DOC_CAP ? { id: src.doc.id, omitted: 'too large' } : { id: src.doc.id, value }
  }
  const t = src.clock?.time()
  return {
    $v: 1,
    tool: params.id,
    schema: params.version,
    at: new Date().toISOString(),
    url: params.shareURL(),
    changed,
    values: params.toJSON({ shareable: true }) as Record<string, unknown>,
    steps: stepsOf(src.history ?? params),
    ...(t !== undefined && Number.isFinite(t) ? { t: Math.round(t) } : {}),
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
let failedAt = 0

/**
 * Where notes can be sent: the dev server's notes route, or null (a static build, no plugin).
 * Never probes in a production build (no request, no console 404 on a public site). A success is kept
 * for the page's life; a failure is tried again after a few seconds (the server may just be starting).
 */
export function findNotesEndpoint(): Promise<string | null> {
  if (typeof fetch === 'undefined' || typeof location === 'undefined') return Promise.resolve(null)
  if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD) return Promise.resolve(null)
  if (!found && Date.now() - failedAt < 5000) return Promise.resolve(null)
  found ??= fetch(NOTES_PATH, { headers: { accept: 'application/json' } })
    // a static host answers 200 with index.html for unknown paths: only a JSON array counts
    .then(async (r) => (r.ok && r.headers.get('x-rueca-notes') === '1' && Array.isArray(await r.json()) ? NOTES_PATH : null))
    .catch(() => null)
    .then((url) => { if (!url) { found = null; failedAt = Date.now() } return url })
  return found
}

async function call<T>(path = '', init?: RequestInit): Promise<T> {
  const url = await findNotesEndpoint()
  if (!url) throw new Error('No notes endpoint. Add ruecaNotes() to the dev server.')
  // a stalled dev server must not freeze the poll forever
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 10_000)
  try {
    const r = await fetch(url + path, { ...init, signal: ctl.signal })
    const body = await r.json().catch(() => null)
    if (!r.ok) throw Object.assign(new Error(body?.error ?? `Notes endpoint answered ${r.status}`), { status: r.status })
    return body as T
  } finally { clearTimeout(timer) }
}

/** Write a note into the repo (via the dev server). Resolves with the stored note. */
export function sendNote(input: NoteInput): Promise<StudioNote> {
  return call<StudioNote>('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * A note file as the tool can safely show it, or null. Files are hand-edited by agents, so this forgives
 * what it can (a reply written as a bare string, or as an object) and drops what it can't (no snapshot).
 */
export function normalizeNote(n: unknown): StudioNote | null {
  if (!isObj(n) || typeof n.id !== 'string' || !n.id || (n.kind !== 'values' && n.kind !== 'comment')) return null
  const s = n.snapshot
  if (!isObj(s) || typeof s.tool !== 'string' || !isObj(s.changed)) return null
  const r = n.resolution
  const text = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v))
  const resolution = r === undefined ? undefined
    : isObj(r) ? { text: text(r.text ?? r.summary ?? r.message), at: typeof r.at === 'string' ? r.at : '' }
    : { text: text(r), at: '' }
  const a = n.anchor
  const anchor = isObj(a) && a.on === 'param' && typeof a.key === 'string' ? { on: 'param' as const, key: a.key }
    : isObj(a) && a.on === 'artboard' && typeof a.x === 'number' && typeof a.y === 'number' ? { on: 'artboard' as const, x: Math.min(1, Math.max(0, a.x)), y: Math.min(1, Math.max(0, a.y)), ...(typeof a.target === 'string' ? { target: a.target } : {}) }
    : undefined
  return {
    ...(n as unknown as StudioNote),
    text: typeof n.text === 'string' ? n.text : undefined,
    anchor,
    status: n.status === 'resolved' || resolution ? 'resolved' : 'open',
    ...(resolution ? { resolution } : {}),
    snapshot: { ...(s as unknown as StudioSnapshot), steps: Array.isArray(s.steps) ? s.steps.map(String) : [], at: typeof s.at === 'string' ? s.at : '' },
  }
}

/** Every note, oldest first; anything malformed is left out, and a repeated id shows once. */
export async function listNotes(): Promise<StudioNote[]> {
  const raw = await call<unknown>()
  const seen = new Set<string>()
  return (Array.isArray(raw) ? raw : []).flatMap((x) => {
    const n = normalizeNote(x)
    if (!n || seen.has(n.id)) return []
    seen.add(n.id)
    return [n]
  })
}

/** Clear a note. Already gone (another tab cleared it) counts as done. */
export async function deleteNote(id: string): Promise<{ id: string }> {
  try { return await call<{ id: string }>(`?id=${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch (e) {
    if ((e as { status?: number }).status === 404) return { id }
    throw e
  }
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
let visibilityHooked = false

export function watchNotes(fn: (notes: StudioNote[]) => void, opts: { interval?: number } = {}): () => void {
  if (opts.interval) pollMs = opts.interval
  // back on the tab: catch up now, not at the next tick
  if (!visibilityHooked && typeof document !== 'undefined') { visibilityHooked = true; document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') poll() }) }
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

/**
 * The values a snapshot describes, as this tool would hold them: its stored values (or, for an older note
 * without them, today's shareable defaults with its changes on top), keeping only keys the schema still
 * has and passing each through the param's own coercion (clamping included) — so comparing against the
 * tool can't fail on a removed key or an out-of-range number.
 */
function snapshotValues(snapshot: StudioSnapshot, params: AnyParams) {
  const defaults = params.getState().defaults as Record<string, unknown>
  const base: Record<string, unknown> = isObj(snapshot.values) ? { ...snapshot.values } : {}
  if (!isObj(snapshot.values)) {
    for (const k of Object.keys(defaults)) if ((params.defs[k] as { share?: boolean } | undefined)?.share !== false) base[k] = defaults[k]
    for (const [k, c] of Object.entries(snapshot.changed)) base[k] = c?.value
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(base)) {
    const def = params.defs[k] as ({ share?: boolean } & Parameters<typeof coerce>[0]) | undefined
    if (!def || def.share === false) continue
    const r = coerce(def, v)
    if (r.ok) out[k] = r.value
  }
  return out
}

/**
 * Whether the tool shows the snapshot's state: 'same', 'different', or 'other-version' when the note was
 * made under another schema version (its values may mean something else now, so it is never restored).
 */
export function snapshotStatus(snapshot: StudioSnapshot, params: AnyParams): 'same' | 'different' | 'other-version' {
  if ((snapshot.schema ?? 1) !== params.version) return 'other-version'
  const now = params.getState().values as Record<string, unknown>
  const then = snapshotValues(snapshot, params)
  return Object.keys(then).every((k) => equal(now[k], then[k])) ? 'same' : 'different'
}

/** True unless the tool is in a different state from the snapshot's (another version counts as "can't tell", so true). */
export function isSnapshotState(snapshot: StudioSnapshot, params: AnyParams) {
  return snapshotStatus(snapshot, params) !== 'different'
}

/**
 * Put the tool back in the note's state: its values as one undo step, the playhead paused where it was.
 * Refuses (returns false) a note from another schema version, as share links do.
 */
export function restoreSnapshot(snapshot: StudioSnapshot, src: { params: AnyParams; clock?: { seek(t: number): void; pause(): void } }): boolean {
  if (snapshotStatus(snapshot, src.params) === 'other-version') return false
  src.params.replace(snapshotValues(snapshot, src.params) as never, { label: 'Open comment' })
  if (src.clock && typeof snapshot.t === 'number') { src.clock.seek(snapshot.t); src.clock.pause() }
  return true
}

/* ── thumbnail ─────────────────────────────────────────────────────────── */

/** The first painted background at or above `el` (a transparent artboard would otherwise turn black in a JPEG). */
function backgroundOf(el: HTMLElement) {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor
    if (c && !/^(transparent|rgba\(\s*0,\s*0,\s*0,\s*0\s*\))$/.test(c)) return c
  }
  return currentTheme() === 'dark' ? '#1a1a1a' : '#ffffff'
}

/** The part of `node`'s box left visible by clipping ancestors up to (and including) `root`, in screen px. */
function visibleRect(node: Element, root: Element) {
  let r = node.getBoundingClientRect()
  let { left, top, right, bottom } = r
  for (let p = node.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p)
    if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      r = p.getBoundingClientRect()
      left = Math.max(left, r.left); top = Math.max(top, r.top); right = Math.min(right, r.right); bottom = Math.min(bottom, r.bottom)
    }
    if (p === root) break
  }
  return { left, top, right, bottom }
}

/** A canvas that came back fully transparent: a WebGL buffer already cleared, nothing worth drawing. */
function isBlank(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  const step = Math.max(1, Math.floor(Math.min(c.width, c.height) / 12))
  for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) if (ctx.getImageData(x, y, 1, 1).data[3] !== 0) return false
  return true
}

/**
 * A JPEG of the artboard as a data URL: its DOM (snapshotElement), then its images and canvases drawn
 * where they sit (clipped like on screen), plus a ring at the anchor so the agent sees where the comment
 * points. Canvases are copied inside an animation frame, right after a renderer draws, so a WebGL canvas
 * without preserveDrawingBuffer still has its pixels; one that comes back blank is left out. Never throws.
 */
export async function captureImage(el: HTMLElement, opts: { maxWidth?: number; anchor?: { x: number; y: number } } = {}): Promise<string | undefined> {
  const w = el.offsetWidth, h = el.offsetHeight
  if (!w || !h) return undefined
  const scale = Math.min(1, (opts.maxWidth ?? 800) / w)
  const W = Math.round(w * scale), H = Math.round(h * scale)
  // copy every canvas first, in the same frame its renderer draws in
  const copies = await new Promise<{ src: Element; copy: HTMLCanvasElement }[]>((resolve) => {
    const grab = () => resolve(Array.from(el.querySelectorAll('canvas')).flatMap((c) => {
      if (!c.width || !c.height) return []
      const copy = document.createElement('canvas')
      copy.width = c.width; copy.height = c.height
      try { copy.getContext('2d')!.drawImage(c, 0, 0) } catch { return [] }   // tainted
      return isBlank(copy) ? [] : [{ src: c as Element, copy }]
    }))
    if (typeof requestAnimationFrame === 'undefined') grab()
    else requestAnimationFrame(grab)
  })
  const out = document.createElement('canvas')
  out.width = W; out.height = H
  const ctx = out.getContext('2d')
  if (!ctx) return undefined
  ctx.fillStyle = backgroundOf(el)
  ctx.fillRect(0, 0, W, H)
  try { ctx.drawImage(await snapshotElement(el, { width: w, height: h, scale }), 0, 0, W, H) } catch { /* DOM part unavailable */ }
  // what the DOM snapshot can't carry (images can't load inside it, canvases are skipped): draw each where it is
  // on screen, clipped like on screen (the stage may be zoomed)
  const box = el.getBoundingClientRect()
  const k = W / box.width
  const place = (src: Element, img: CanvasImageSource) => {
    const r = src.getBoundingClientRect(), v = visibleRect(src, el)
    if (v.right <= v.left || v.bottom <= v.top || !r.width || !r.height) return
    ctx.save()
    ctx.beginPath(); ctx.rect((v.left - box.left) * k, (v.top - box.top) * k, (v.right - v.left) * k, (v.bottom - v.top) * k); ctx.clip()
    try { ctx.drawImage(img, (r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k) } catch { /* tainted or broken */ }
    ctx.restore()
  }
  for (const img of Array.from(el.querySelectorAll('img'))) {
    const cs = getComputedStyle(img)
    if (img.complete && img.naturalWidth && cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.objectFit !== 'cover' && cs.objectFit !== 'contain') place(img, img)
  }
  for (const { src, copy } of copies) place(src, copy)
  if (opts.anchor) {
    const x = opts.anchor.x * W, y = opts.anchor.y * H, R = Math.max(10, W / 40)
    ctx.lineWidth = Math.max(3, W / 200)
    ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, R + ctx.lineWidth, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke()
  }
  try { return out.toDataURL('image/jpeg', 0.85) } catch { return undefined }
}
