/// <reference types="node" />
/* ---------------------------------------------------------------------------
   The notes route, for any Node server: the tool POSTs a note, this writes it
   to .rueca/notes/<id>.json, where the agent reads it (and replies in it).

     GET    /__rueca/notes          → every note, oldest first
     POST   /__rueca/notes          → { kind, text?, anchor?, snapshot, image? } → the stored note
     PATCH  /__rueca/notes?id=<id>  → { text } adds the person's reply to a comment (reopening it),
                                      { status: 'done' | 'open' } closes or reopens it → the note
     DELETE /__rueca/notes?id=<id>  → clears one note (and its image)

   `image` is a data URL (png / jpeg / webp): it is written next to the note as
   <id>.<ext> and the note keeps only the file name.

   Vite: use ruecaNotes() from ./vite. Anything else (express, a bare http
   server): `if (await handle(req, res)) return` before your own routes, and
   before any body parser (or it reads the body the parser already took).
   A static page with no server of its own: the standalone notes server
   (skills/rueca/scripts/notes-server.mjs) runs this on its own port with
   `cors: 'local'`, so a page on another localhost port can reach it.

   Dev only. It writes into the project, so it guards the door:
   - only the page's own origin (fetch metadata, then Origin against Host), and
     only local hosts (loopback names, *.localhost, IP addresses, or
     `allowedHosts`) — a DNS-rebinding site can't pass Origin == Host either;
   - file names are made here, never taken from the request; symlinks and
     anything that isn't a note are never served;
   - bodies are capped, nesting is capped (a deep body would otherwise blow the
     stack on every GET), and the stored file is capped too.
--------------------------------------------------------------------------- */
import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { isAbsolute, join } from 'node:path'
import { isIP } from 'node:net'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const NOTES_ROUTE = '/__rueca/notes'

export interface NotesHandlerOptions {
  /** project root (default: process.cwd()) */
  root?: string
  /** where notes are written, relative to root (default .rueca/notes) */
  dir?: string
  /** largest accepted body in bytes, image included (default 4 MB) */
  maxBytes?: number
  /** extra host names to answer besides loopback, *.localhost and IP addresses (`true`: any host) */
  allowedHosts?: string[] | true
  /** 'local': also answer pages on OTHER local origins (another localhost port), with CORS headers — for the
      standalone server beside a static page. Off by default: only the page's own origin. */
  cors?: 'local'
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-rueca-notes', '1')
  res.end(JSON.stringify(body))
}

/** The Host header's name without its port ("[::1]:5273" → "::1"). */
const hostName = (host: string) => (host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.replace(/:\d+$/, '')).toLowerCase().replace(/\.$/, '')

/** A local host: loopback names, *.localhost, IP addresses (LAN testing with --host), or one the caller allowed. */
export function isLocalHost(host: string | undefined, allowed?: string[] | true): boolean {
  if (!host) return false
  if (allowed === true) return true
  const name = hostName(host)
  return name === 'localhost' || name.endsWith('.localhost') || isIP(name) !== 0 || !!allowed?.some((a) => a.toLowerCase() === name)
}

/** A page on another local origin (localhost on another port), when the handler runs beside a static page. Fetch
    metadata can't decide this one: a page on localhost calling 127.0.0.1 is "cross-site" to the browser. The Origin
    is what counts, and a real website (or a DNS-rebinding one) never has a local Origin. */
function isLocalOrigin(req: IncomingMessage, allowed?: string[] | true): boolean {
  const origin = req.headers.origin
  if (!origin) return req.method === 'GET'
  try { return isLocalHost(new URL(origin).host, allowed) } catch { return false }
}

/** Same-origin only: the browser's own fetch metadata, then Origin against Host. */
export function isSameOrigin(req: IncomingMessage): boolean {
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.origin
  // browsers always send Origin on a POST; a GET typed into the address bar has none
  if (!origin) return req.method === 'GET'
  try { return new URL(origin).host === req.headers.host } catch { return false }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const IMAGE = /^data:image\/(png|jpeg|webp);base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/
const EXT: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' }
/** the file must really be the type it claims (magic bytes), so nothing else is ever written as an image */
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  png: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  jpeg: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
}
/** the shape every note id has (made by newId): the only thing DELETE will touch. The short form is phase 1's. */
export const NOTE_ID = /^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-(?:\d{3}-[0-9a-f]{6}|[0-9a-f]{4})$/
const unit = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1
/** a canvas comment sits around the artboard: artboard units, within 50 widths / heights of it */
const reach = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 50
/** deep enough for any snapshot (a doc graph is ~8); deeper would blow the stack when the note is stringified */
const MAX_DEPTH = 32

/** How deeply a parsed JSON value nests, without recursion. Stops counting past `limit`. */
function depthOf(v: unknown, limit: number): number {
  let max = 0
  const stack: [unknown, number][] = [[v, 1]]
  while (stack.length) {
    const [x, d] = stack.pop()!
    if (!x || typeof x !== 'object') continue
    if (d > max) max = d
    if (max > limit) return max
    for (const c of Object.values(x as object)) if (c && typeof c === 'object') stack.push([c, d + 1])
  }
  return max
}

/** What makes a stored file a note: anything else in the folder (hand-made, half-edited) is never served. */
export function isNote(n: unknown): boolean {
  return isObj(n) && typeof n.id === 'string' && (n.kind === 'values' || n.kind === 'comment') &&
    (n.status === 'open' || n.status === 'done' || n.status === 'resolved') && isObj(n.snapshot) && typeof n.snapshot.tool === 'string' && isObj(n.snapshot.changed)
}

/** The note's shape, checked before anything touches the disk. Returns an error message, or null. */
export function checkNote(b: unknown): string | null {
  if (!isObj(b)) return 'Expected a JSON object'
  if (depthOf(b, MAX_DEPTH) > MAX_DEPTH) return `Note nests deeper than ${MAX_DEPTH} levels`
  if (b.kind !== 'values' && b.kind !== 'comment') return 'kind must be "values" or "comment"'
  if (b.text !== undefined && (typeof b.text !== 'string' || b.text.length > 5000)) return 'text must be a string under 5000 characters'
  if (b.kind === 'comment' && !(typeof b.text === 'string' && b.text.trim())) return 'A comment needs text'
  if (b.anchor !== undefined) {
    const a = b.anchor
    const ok = isObj(a) && (
      (a.on === 'artboard' && unit(a.x) && unit(a.y) && (a.target === undefined || (typeof a.target === 'string' && a.target.length <= 200))) ||
      (a.on === 'canvas' && reach(a.x) && reach(a.y)) ||
      (a.on === 'param' && typeof a.key === 'string' && a.key.length > 0 && a.key.length <= 100))
    if (!ok) return 'anchor is not a valid artboard point, canvas point or param'
  }
  if (b.image !== undefined) {
    const m = typeof b.image === 'string' ? b.image.match(IMAGE) : null
    if (!m || !MAGIC[m[1]](Buffer.from(m[2], 'base64'))) return 'image must be a base64 png, jpeg or webp data URL'
  }
  const s = b.snapshot
  if (!isObj(s) || s.$v !== 1 || typeof s.tool !== 'string' || !isObj(s.changed)) return 'snapshot is missing or not format 1'
  return null
}

/** A PATCH body: a reply, or a status. Returns an error message, or null. */
export function checkPatch(b: unknown): string | null {
  if (!isObj(b)) return 'Expected a JSON object'
  const hasText = b.text !== undefined, hasStatus = b.status !== undefined
  if (hasText === hasStatus) return 'Send either text (a reply) or status'
  if (hasText && !(typeof b.text === 'string' && b.text.trim() && b.text.length <= 5000)) return 'text must be a string under 5000 characters'
  if (hasStatus && b.status !== 'open' && b.status !== 'done') return 'status must be "open" or "done"'
  return null
}

/** Sortable to the millisecond, with enough randomness that two notes in the same millisecond never meet. */
const newId = () => `${new Date().toISOString().slice(0, 23).replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}`

function readBody(req: IncomingMessage, max: number): Promise<string | null> {
  // An express body parser got there first: the stream is spent, so take what it parsed.
  const parsed = (req as { body?: unknown }).body
  if (req.readableEnded) return Promise.resolve(parsed === undefined ? '' : typeof parsed === 'string' ? parsed : Buffer.isBuffer(parsed) ? parsed.toString('utf8') : JSON.stringify(parsed))
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > max) { resolve(null); req.removeAllListeners('data'); req.resume() }
      else chunks.push(c)
    })
    req.on('end', () => { if (size <= max) resolve(Buffer.concat(chunks).toString('utf8')) })
    req.on('error', reject)
  })
}

export function createNotesHandler(opts: NotesHandlerOptions = {}) {
  const root = opts.root ?? process.cwd()
  const dir = isAbsolute(opts.dir ?? '') ? opts.dir! : join(root, opts.dir ?? '.rueca/notes')
  const max = opts.maxBytes ?? 4 * 1024 * 1024

  const list = async () => {
    let files: string[]
    try { files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort() } catch { return [] }
    const notes = await Promise.all(files.map(async (f) => {
      try {
        // never follow a link out of the folder, never serve a directory
        if (!(await lstat(join(dir, f))).isFile()) return null
        const n = JSON.parse(await readFile(join(dir, f), 'utf8'))
        return isNote(n) && depthOf(n, MAX_DEPTH) <= MAX_DEPTH ? n : null
      } catch { return null }   // half-edited by hand: skip it
    }))
    return notes.filter(Boolean)
  }

  const remove = async (id: string) => {
    try { if (!(await lstat(join(dir, `${id}.json`))).isFile()) return false } catch { return false }
    // images first: if something fails midway, the note is still there to clear again
    for (const f of [...Object.values(EXT).map((e) => `${id}.${e}`), `${id}.json`]) {
      try { if ((await lstat(join(dir, f))).isDirectory()) continue } catch { continue }
      await rm(join(dir, f), { force: true })
    }
    return true
  }

  const create = async (b: Record<string, unknown>) => {
    const a = b.anchor as Record<string, unknown> | undefined
    // only the fields this format defines: nothing extra rides along into the agent's files
    const anchor = !a ? undefined : a.on === 'param' ? { on: 'param', key: a.key } : a.on === 'canvas' ? { on: 'canvas', x: a.x, y: a.y }
      : { on: 'artboard', x: a.x, y: a.y, ...(typeof a.target === 'string' ? { target: a.target } : {}) }
    let id = newId()
    await mkdir(dir, { recursive: true })
    // claim the name before writing anything under it (a clash only on a clock jump: try again)
    for (let tries = 0; ; tries++) {
      try { await writeFile(join(dir, `${id}.json.tmp`), '', { flag: 'wx' }); break } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST' || tries > 4) throw e
        id = newId()
      }
    }
    const m = typeof b.image === 'string' ? b.image.match(IMAGE) : null
    const image = m ? `${id}.${EXT[m[1]]}` : undefined
    const note = {
      id,
      kind: b.kind,
      ...(typeof b.text === 'string' && b.text.trim() ? { text: b.text.trim() } : {}),
      ...(anchor ? { anchor } : {}),
      ...(image ? { image } : {}),
      status: 'open',
      snapshot: b.snapshot,
    }
    const tmp = join(dir, `${id}.json.tmp`)
    try {
      const text = JSON.stringify(note, null, 2) + '\n'
      // indentation can multiply a small body many times over: the stored file is capped too
      if (text.length > max * 2) throw Object.assign(new Error('too large'), { status: 413 })
      if (m && image) await writeFile(join(dir, image), Buffer.from(m[2], 'base64'))
      // write then rename, so an agent reading the folder never sees half a file
      await writeFile(tmp, text)
      await rename(tmp, join(dir, `${id}.json`))
    } catch (e) {
      await Promise.all([rm(tmp, { force: true }), image ? rm(join(dir, image), { force: true }) : null])
      throw e
    }
    return note
  }

  /** Writes `note` over its file, atomically (write then rename), within the size cap. */
  const save = async (note: Record<string, unknown>) => {
    const id = note.id as string
    const text = JSON.stringify(note, null, 2) + '\n'
    if (text.length > max * 2) throw Object.assign(new Error('too large'), { status: 413 })
    const tmp = join(dir, `${id}.json.${randomBytes(3).toString('hex')}.tmp`)
    try { await writeFile(tmp, text); await rename(tmp, join(dir, `${id}.json`)) } catch (e) { await rm(tmp, { force: true }); throw e }
  }

  /** A reply or a status change on a stored comment. Null when there's no such note. */
  const patch = async (id: string, b: Record<string, unknown>) => {
    const file = join(dir, `${id}.json`)
    let note: Record<string, unknown>
    try {
      if (!(await lstat(file)).isFile()) return null
      note = JSON.parse(await readFile(file, 'utf8'))
    } catch { return null }
    if (!isNote(note)) return null
    if (note.kind !== 'comment') throw Object.assign(new Error('Only a comment has a thread'), { status: 400 })
    const replies = Array.isArray(note.replies) ? [...note.replies] : []
    // a note from before threads: its one `resolution` becomes the agent's first reply, so the order holds
    if (note.resolution !== undefined) {
      const r = note.resolution
      replies.push({ from: 'agent', text: isObj(r) ? String(r.text ?? r.summary ?? r.message ?? '') : String(r ?? ''), at: isObj(r) && typeof r.at === 'string' ? r.at : '' })
      delete note.resolution
    } else if (note.status === 'resolved' && !replies.length) replies.push({ from: 'agent', text: '', at: '' })
    if (typeof b.text === 'string') {
      replies.push({ from: 'person', text: b.text.trim(), at: new Date().toISOString() })
      note.status = 'open'
    } else note.status = b.status
    note.replies = replies
    await save(note)
    return note
  }

  /** Answers the notes route; resolves false for any other request, so the caller passes it on. */
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const path = (req.url ?? '').split('?')[0]
    if (path !== NOTES_ROUTE) return false
    try {
      if (!isLocalHost(req.headers.host, opts.allowedHosts)) { send(res, 403, { error: 'Notes only answer on a local host' }); return true }
      if (opts.cors === 'local') {
        if (!isLocalOrigin(req, opts.allowedHosts)) { send(res, 403, { error: 'Notes only accept requests from a local page' }); return true }
        const origin = req.headers.origin
        if (origin) {
          res.setHeader('access-control-allow-origin', origin)
          res.setHeader('vary', 'origin')
          res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, DELETE')
          res.setHeader('access-control-allow-headers', 'content-type')
          res.setHeader('access-control-expose-headers', 'x-rueca-notes')
        }
        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true }
      } else if (!isSameOrigin(req)) { send(res, 403, { error: 'Notes only accept requests from the page’s own origin' }); return true }
      if (req.method === 'GET') { send(res, 200, await list()); return true }
      if (req.method === 'DELETE') {
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? ''
        if (!NOTE_ID.test(id)) { send(res, 400, { error: 'Not a note id' }); return true }
        if (!(await remove(id))) { send(res, 404, { error: 'No such note' }); return true }
        send(res, 200, { id })
        return true
      }
      if (req.method !== 'POST' && req.method !== 'PATCH') { res.setHeader('allow', 'GET, POST, PATCH, DELETE'); send(res, 405, { error: 'Use GET, POST, PATCH or DELETE' }); return true }

      const raw = await readBody(req, max)
      if (raw === null) { send(res, 413, { error: `Note is larger than ${Math.round(max / 1024)} KB` }); return true }
      let body: unknown
      try { body = JSON.parse(raw) } catch { send(res, 400, { error: 'Body is not JSON' }); return true }
      if (req.method === 'PATCH') {
        const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? ''
        if (!NOTE_ID.test(id)) { send(res, 400, { error: 'Not a note id' }); return true }
        const problem = checkPatch(body)
        if (problem) { send(res, 400, { error: problem }); return true }
        const note = await patch(id, body as Record<string, unknown>)
        if (!note) { send(res, 404, { error: 'No such note' }); return true }
        send(res, 200, note)
        return true
      }
      const problem = checkNote(body)
      if (problem) { send(res, 400, { error: problem }); return true }
      send(res, 201, await create(body as Record<string, unknown>))
      return true
    } catch (e) {
      if ((e as { status?: number }).status === 413) { send(res, 413, { error: 'Note is too large to store' }); return true }
      if ((e as { status?: number }).status === 400) { send(res, 400, { error: (e as Error).message }); return true }
      // the detail goes to the dev server's terminal, never into the response (it would carry paths)
      console.error('[rueca notes]', e)
      if (!res.headersSent) send(res, 500, { error: 'The notes route failed. See the dev server’s terminal.' })
      return true
    }
  }
}
