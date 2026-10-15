/// <reference types="node" />
/* ---------------------------------------------------------------------------
   The notes route, for any Node server: the tool POSTs a note, this writes it
   to .rueca/notes/<id>.json, where the agent reads it (and marks it resolved).

     GET    /__rueca/notes          → every note, oldest first
     POST   /__rueca/notes          → { kind, text?, anchor?, snapshot, image? } → the stored note
     DELETE /__rueca/notes?id=<id>  → clears one note (and its image)

   `image` is a data URL (png / jpeg / webp): it is written next to the note as
   <id>.<ext> and the note keeps only the file name.

   Vite: use ruecaNotes() from ./vite. Anything else (express, a bare http
   server): `if (await handle(req, res)) return` before your own routes.

   Dev only. It writes into the project, so it only answers the page's own
   origin: without that check any website open in the same browser could
   write files into the repo through localhost. File names are made here,
   never taken from the request, and bodies are capped.
--------------------------------------------------------------------------- */
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { isAbsolute, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const NOTES_ROUTE = '/__rueca/notes'

export interface NotesHandlerOptions {
  /** project root (default: process.cwd()) */
  root?: string
  /** where notes are written, relative to root (default .rueca/notes) */
  dir?: string
  /** largest accepted body in bytes, image included (default 4 MB) */
  maxBytes?: number
}

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-rueca-notes', '1')
  res.end(JSON.stringify(body))
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
const IMAGE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/
const EXT: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' }
/** the shape every note id has (made by newId): the only thing DELETE will touch */
export const NOTE_ID = /^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-[0-9a-f]{4}$/
const unit = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1

/** The note's shape, checked before anything touches the disk. Returns an error message, or null. */
export function checkNote(b: unknown): string | null {
  if (!isObj(b)) return 'Expected a JSON object'
  if (b.kind !== 'values' && b.kind !== 'comment') return 'kind must be "values" or "comment"'
  if (b.text !== undefined && (typeof b.text !== 'string' || b.text.length > 5000)) return 'text must be a string under 5000 characters'
  if (b.kind === 'comment' && !(typeof b.text === 'string' && b.text.trim())) return 'A comment needs text'
  if (b.anchor !== undefined) {
    const a = b.anchor
    const ok = isObj(a) && (
      (a.on === 'artboard' && unit(a.x) && unit(a.y) && (a.target === undefined || (typeof a.target === 'string' && a.target.length <= 200))) ||
      (a.on === 'param' && typeof a.key === 'string' && a.key.length > 0 && a.key.length <= 100))
    if (!ok) return 'anchor is not a valid artboard point or param'
  }
  if (b.image !== undefined && !(typeof b.image === 'string' && IMAGE.test(b.image))) return 'image must be a base64 png, jpeg or webp data URL'
  const s = b.snapshot
  if (!isObj(s) || s.$v !== 1 || typeof s.tool !== 'string' || !isObj(s.changed)) return 'snapshot is missing or not format 1'
  return null
}

const newId = () => `${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}-${randomBytes(2).toString('hex')}`

function readBody(req: IncomingMessage, max: number): Promise<string | null> {
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
      try { return JSON.parse(await readFile(join(dir, f), 'utf8')) } catch { return null }   // half-edited by hand: skip it
    }))
    return notes.filter(Boolean)
  }

  /** Answers the notes route; resolves false for any other request, so the caller passes it on. */
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const path = (req.url ?? '').split('?')[0]
    if (path !== NOTES_ROUTE) return false
    if (!isSameOrigin(req)) { send(res, 403, { error: 'Notes only accept requests from the page’s own origin' }); return true }
    if (req.method === 'GET') { send(res, 200, await list()); return true }
    if (req.method === 'DELETE') {
      const id = new URL(req.url ?? '', 'http://x').searchParams.get('id') ?? ''
      if (!NOTE_ID.test(id)) { send(res, 400, { error: 'Not a note id' }); return true }
      try { await readFile(join(dir, `${id}.json`)) } catch { send(res, 404, { error: 'No such note' }); return true }
      await Promise.all([`${id}.json`, ...Object.values(EXT).map((e) => `${id}.${e}`)].map((f) => rm(join(dir, f), { force: true })))
      send(res, 200, { id })
      return true
    }
    if (req.method !== 'POST') { res.setHeader('allow', 'GET, POST, DELETE'); send(res, 405, { error: 'Use GET, POST or DELETE' }); return true }

    const raw = await readBody(req, max)
    if (raw === null) { send(res, 413, { error: `Note is larger than ${Math.round(max / 1024)} KB` }); return true }
    let body: unknown
    try { body = JSON.parse(raw) } catch { send(res, 400, { error: 'Body is not JSON' }); return true }
    const problem = checkNote(body)
    if (problem) { send(res, 400, { error: problem }); return true }

    const b = body as Record<string, unknown>
    const id = newId()
    await mkdir(dir, { recursive: true })
    let image: string | undefined
    if (typeof b.image === 'string') {
      const [, type, data] = b.image.match(IMAGE)!
      image = `${id}.${EXT[type]}`
      await writeFile(join(dir, image), Buffer.from(data, 'base64'))
    }
    const note = {
      id,
      kind: b.kind,
      ...(typeof b.text === 'string' && b.text.trim() ? { text: b.text.trim() } : {}),
      ...(b.anchor ? { anchor: b.anchor } : {}),
      ...(image ? { image } : {}),
      status: 'open',
      snapshot: b.snapshot,
    }
    // write then rename, so an agent reading the folder never sees half a file
    const file = join(dir, `${note.id}.json`)
    await writeFile(`${file}.tmp`, JSON.stringify(note, null, 2) + '\n')
    await rename(`${file}.tmp`, file)
    send(res, 201, note)
    return true
  }
}
