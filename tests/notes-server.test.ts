// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createNotesHandler, NOTES_ROUTE } from '@kit/notes-server/handler'

const HOST = 'localhost:5273'
const snapshot = { $v: 1, tool: 'ripple', schema: 1, at: '2026-10-15T00:00:00.000Z', url: 'http://localhost:5273/#p=x', changed: { rings: { value: 20, default: 14, label: 'Rings' } }, steps: ['Rings'], view: { width: 1, height: 1, theme: 'dark' } }

function req(o: { method?: string; url?: string; headers?: Record<string, string>; body?: string }) {
  const r = Readable.from(o.body !== undefined ? [Buffer.from(o.body)] : []) as unknown as IncomingMessage
  Object.assign(r, { method: o.method ?? 'GET', url: o.url ?? NOTES_ROUTE, headers: { host: HOST, ...o.headers } })
  return r
}
function res() {
  const out = { status: 0, headers: {} as Record<string, string>, body: '' }
  const r = {
    set statusCode(v: number) { out.status = v },
    setHeader: (k: string, v: string) => { out.headers[k.toLowerCase()] = v },
    end: (b: string) => { out.body = b },
  } as unknown as ServerResponse
  return { r, out, json: () => JSON.parse(out.body) }
}
const post = (body: unknown, headers: Record<string, string> = { origin: `http://${HOST}`, 'sec-fetch-site': 'same-origin' }) =>
  req({ method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) })

let dir: string
let handle: ReturnType<typeof createNotesHandler>
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'rueca-notes-')); handle = createNotesHandler({ dir, maxBytes: 4096 }) })
afterEach(() => rm(dir, { recursive: true, force: true }))

describe('notes handler', () => {
  it('passes on other routes', async () => {
    const { r } = res()
    expect(await handle(req({ url: '/index.html' }), r)).toBe(false)
  })
  it('writes a values note to its own file and lists it', async () => {
    const a = res()
    expect(await handle(post({ kind: 'values', snapshot }), a.r)).toBe(true)
    expect(a.out.status).toBe(201)
    const note = a.json()
    expect(note).toMatchObject({ kind: 'values', status: 'open', snapshot })
    expect(note.id).toMatch(/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-[0-9a-f]{4}$/)
    expect(await readdir(dir)).toEqual([`${note.id}.json`])
    expect(JSON.parse(await readFile(join(dir, `${note.id}.json`), 'utf8'))).toEqual(note)

    const b = res()
    await handle(req({ headers: { 'sec-fetch-site': 'same-origin' } }), b.r)
    expect(b.out.status).toBe(200)
    expect(b.out.headers['x-rueca-notes']).toBe('1')
    expect(b.json()).toEqual([note])
  })
  it('lists nothing before the folder exists, and skips a file broken by hand', async () => {
    const a = res()
    await handle(req({}), a.r)
    expect(a.json()).toEqual([])
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'broken.json'), '{ nope')
    const b = res()
    await handle(req({}), b.r)
    expect(b.json()).toEqual([])
  })
  it('refuses other origins, and a POST with no Origin', async () => {
    const refused: Record<string, string>[] = [{ origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }, { origin: 'http://localhost:9999' }, {}]
    for (const headers of refused) {
      const a = res()
      await handle(post({ kind: 'values', snapshot }, headers), a.r)
      expect(a.out.status).toBe(403)
    }
    expect(await readdir(dir).catch(() => [])).toEqual([])
  })
  it('refuses a cross-site GET', async () => {
    const a = res()
    await handle(req({ headers: { 'sec-fetch-site': 'cross-site' } }), a.r)
    expect(a.out.status).toBe(403)
  })
  it('rejects bodies that are too large, not JSON, or the wrong shape', async () => {
    const cases: [unknown, number][] = [
      [{ kind: 'values', snapshot, text: 'x'.repeat(5000) }, 413],
      ['{ nope', 400],
      [{ kind: 'delete', snapshot }, 400],
      [{ kind: 'values' }, 400],
      [{ kind: 'comment', snapshot }, 400],
      [{ kind: 'comment', text: 'hi', snapshot, anchor: { on: 'artboard', x: 2, y: 0 } }, 400],
      [{ kind: 'values', snapshot: { ...snapshot, $v: 2 } }, 400],
    ]
    for (const [body, status] of cases) {
      const a = res()
      await handle(post(body), a.r)
      expect(a.out.status, JSON.stringify(body).slice(0, 80)).toBe(status)
    }
    expect(await readdir(dir).catch(() => [])).toEqual([])
  })
  it('keeps an anchored comment and trims its text', async () => {
    const a = res()
    await handle(post({ kind: 'comment', text: '  The second ring snaps.  ', anchor: { on: 'param', key: 'rings' }, snapshot }), a.r)
    expect(a.json()).toMatchObject({ kind: 'comment', text: 'The second ring snaps.', anchor: { on: 'param', key: 'rings' } })
  })
  it('only answers GET and POST', async () => {
    const a = res()
    await handle(req({ method: 'DELETE', headers: { origin: `http://${HOST}` } }), a.r)
    expect(a.out.status).toBe(405)
  })
})
