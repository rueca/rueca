// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createNotesHandler, NOTES_ROUTE } from '@kit/notes-server/handler'

const HOST = 'localhost:5273'
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64')
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]).toString('base64')
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
    expect(note.id).toMatch(/^\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}-[0-9a-f]{6}$/)
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
  it('writes an image beside the note and keeps only its file name', async () => {
    const png = PNG
    const a = res()
    await handle(post({ kind: 'comment', text: 'Look here', anchor: { on: 'artboard', x: 0.5, y: 0.25 }, snapshot, image: `data:image/png;base64,${png}` }), a.r)
    expect(a.out.status).toBe(201)
    const note = a.json()
    expect(note.image).toBe(`${note.id}.png`)
    expect(await readFile(join(dir, `${note.id}.json`), 'utf8')).not.toContain('base64')
    expect((await readFile(join(dir, note.image))).toString('base64')).toBe(png)
    const bad = res()
    await handle(post({ kind: 'values', snapshot, image: 'data:image/svg+xml;base64,PHN2Zz4=' }), bad.r)
    expect(bad.out.status).toBe(400)
  })
  it('clears a note and its image by id, and nothing else', async () => {
    const a = res()
    await handle(post({ kind: 'values', snapshot, image: `data:image/jpeg;base64,${JPG}` }), a.r)
    const { id } = a.json()
    const del = (q: string, headers: Record<string, string> = { origin: `http://${HOST}` }) => { const r = res(); return handle(req({ method: 'DELETE', url: `${NOTES_ROUTE}?id=${q}`, headers }), r.r).then(() => r.out.status) }
    expect(await del('../../package')).toBe(400)
    expect(await del(id, { origin: 'https://evil.example' })).toBe(403)
    expect(await del('2020-01-01T00-00-00-000-abcdef')).toBe(404)
    expect(await del(id)).toBe(200)
    expect(await readdir(dir)).toEqual([])
  })
  it('refuses deep nesting, so GET can never be broken by one note', async () => {
    const deep = `${'['.repeat(6000)}0${']'.repeat(6000)}`   // built as text: stringifying it here would blow the test's own stack
    const roomy = createNotesHandler({ dir })
    const a = res()
    await roomy(post(JSON.stringify({ kind: 'values', snapshot }).replace(/}$/, `,"deep":${deep}}`)), a.r)
    expect(a.out.status).toBe(400)
    expect(a.json().error).toMatch(/deeper/)
    const g = res()
    await handle(req({}), g.r)
    expect(g.out.status).toBe(200)
  })
  it('caps the stored file, not just the body', async () => {
    let wide: unknown = Array(4000).fill(0)
    for (let i = 0; i < 25; i++) wide = [wide]
    const big = createNotesHandler({ dir, maxBytes: 64 * 1024 })
    const a = res()
    await big(post({ kind: 'values', snapshot: { ...snapshot, wide } }), a.r)
    expect(a.out.status).toBe(413)
    expect(await readdir(dir).catch(() => [])).toEqual([])
  })
  it('only answers on a local host (DNS rebinding passes Origin == Host)', async () => {
    const a = res()
    await handle(post({ kind: 'values', snapshot }, { host: 'attacker.example:5399', origin: 'http://attacker.example:5399', 'sec-fetch-site': 'same-origin' }), a.r)
    expect(a.out.status).toBe(403)
    for (const host of ['127.0.0.1:5273', '[::1]:5273', 'app.localhost:5273', '192.168.1.20:5273']) {
      const b = res()
      await handle(req({ headers: { host } }), b.r)
      expect(b.out.status, host).toBe(200)
    }
    const allowed = createNotesHandler({ dir, allowedHosts: ['dev.example'] })
    const c = res()
    await allowed(req({ headers: { host: 'dev.example:80' } }), c.r)
    expect(c.out.status).toBe(200)
  })
  it('never serves symlinks or files that are not notes', async () => {
    const a = res()
    await handle(post({ kind: 'values', snapshot }), a.r)
    const { symlink } = await import('node:fs/promises')
    await symlink(join(dir, '..'), join(dir, '0001-link.json')).catch(() => {})
    await writeFile(join(dir, '0002-string.json'), '"just a string"')
    await writeFile(join(dir, '0003-nosnap.json'), JSON.stringify({ id: 'x', kind: 'comment', status: 'open', text: 'no snapshot' }))
    const g = res()
    await handle(req({}), g.r)
    expect(g.json().map((n: { id: string }) => n.id)).toEqual([a.json().id])
  })
  it('takes comments on the canvas around the artboard, within reach', async () => {
    const a = res()
    await handle(post({ kind: 'comment', text: 'left of it', anchor: { on: 'canvas', x: -0.3, y: 0.5, extra: 1 }, snapshot }), a.r)
    expect(a.out.status).toBe(201)
    expect(a.json().anchor).toEqual({ on: 'canvas', x: -0.3, y: 0.5 })
    const b = res()
    await handle(post({ kind: 'comment', text: 'far away', anchor: { on: 'canvas', x: 999, y: 0 }, snapshot }), b.r)
    expect(b.out.status).toBe(400)
  })
  it("with cors: 'local', answers pages on other localhost ports (and nothing else)", async () => {
    const side = createNotesHandler({ dir, cors: 'local' })
    // a page on localhost calling 127.0.0.1 is cross-site to the browser: only the Origin decides
    const local = { host: '127.0.0.1:4388', origin: 'http://localhost:4387', 'sec-fetch-site': 'cross-site' }
    const pre = res()
    await side(req({ method: 'OPTIONS', headers: local }), pre.r)
    expect(pre.out.status).toBe(204)
    expect(pre.out.headers['access-control-allow-origin']).toBe('http://localhost:4387')
    const a = res()
    await side(post({ kind: 'values', snapshot }, local), a.r)
    expect(a.out.status).toBe(201)
    expect(a.out.headers['access-control-expose-headers']).toContain('x-rueca-notes')
    const foreign: Record<string, string>[] = [{ host: '127.0.0.1:4388', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }, { host: '127.0.0.1:4388', origin: 'http://evil.example' }]
    for (const headers of foreign) {
      const b = res()
      await side(post({ kind: 'values', snapshot }, headers), b.r)
      expect(b.out.status).toBe(403)
    }
    // the default handler still refuses another port
    const c = res()
    await handle(post({ kind: 'values', snapshot }, { origin: 'http://localhost:4387', 'sec-fetch-site': 'same-site' }), c.r)
    expect(c.out.status).toBe(403)
  })
  it('stores only the anchor fields the format defines', async () => {
    const a = res()
    await handle(post({ kind: 'comment', text: 'x', anchor: { on: 'artboard', x: 0.1, y: 0.2, extra: 'y'.repeat(1000) }, snapshot }), a.r)
    expect(a.json().anchor).toEqual({ on: 'artboard', x: 0.1, y: 0.2 })
  })
  it('rejects an image whose bytes are not the type it claims', async () => {
    const a = res()
    await handle(post({ kind: 'values', snapshot, image: `data:image/png;base64,${Buffer.from('<html><script>').toString('base64')}` }), a.r)
    expect(a.out.status).toBe(400)
  })
  it('never leaks paths: failures answer a plain 500', async () => {
    const broken = createNotesHandler({ dir: '/dev/null/notes' })
    const a = res()
    const err = console.error
    console.error = () => {}
    try { await broken(post({ kind: 'values', snapshot }), a.r) } finally { console.error = err }
    expect(a.out.status).toBe(500)
    expect(a.out.body).not.toContain('/dev/null')
  })
  it('gives every note its own name, even many at once', async () => {
    const outs = await Promise.all(Array.from({ length: 40 }, () => { const r = res(); return handle(post({ kind: 'values', snapshot }), r.r).then(() => r.json().id as string) }))
    expect(new Set(outs).size).toBe(40)
    expect((await readdir(dir)).filter((f) => f.endsWith('.json'))).toHaveLength(40)
  })
  it('threads a comment: the person replies (reopening it) and closes it; the agent never has to', async () => {
    const a = res()
    await handle(post({ kind: 'comment', text: 'Too busy', snapshot }), a.r)
    const { id } = a.json()
    const patch = async (body: unknown, q = id, headers: Record<string, string> = { origin: `http://${HOST}` }) => {
      const r = res()
      await handle(req({ method: 'PATCH', url: `${NOTES_ROUTE}?id=${q}`, headers, body: JSON.stringify(body) }), r.r)
      return { status: r.out.status, body: r.out.body ? r.json() : null }
    }
    // the agent answers the old way, straight in the file
    const file = join(dir, `${id}.json`)
    await writeFile(file, JSON.stringify({ ...JSON.parse(await readFile(file, 'utf8')), status: 'resolved', resolution: { text: 'Fewer rings', at: 'then' } }))
    const r1 = await patch({ text: '  Fewer still  ' })
    expect(r1.status).toBe(200)
    expect(r1.body.status).toBe('open')
    expect(r1.body).not.toHaveProperty('resolution')
    expect(r1.body.replies.map((m: { from: string; text: string }) => [m.from, m.text])).toEqual([['agent', 'Fewer rings'], ['person', 'Fewer still']])
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(r1.body)
    expect((await patch({ status: 'done' })).body.status).toBe('done')
    // a reply on a done thread opens it again
    expect((await patch({ text: 'One more thing' })).body).toMatchObject({ status: 'open' })
    expect((await patch({ status: 'done' })).body.replies).toHaveLength(3)
    expect((await patch({ status: 'open' })).body.status).toBe('open')
    // what it refuses
    expect((await patch({ text: '' })).status).toBe(400)
    expect((await patch({ text: 'x', status: 'done' })).status).toBe(400)
    expect((await patch({ status: 'resolved' })).status).toBe(400)
    expect((await patch({ text: 'x'.repeat(3000) + 'é'.repeat(1001) })).status).toBe(413)   // over this test's 4 KB body cap
    expect((await patch({ text: 'x' }, '../../package')).status).toBe(400)
    expect((await patch({ text: 'x' }, '2020-01-01T00-00-00-000-abcdef')).status).toBe(404)
    expect((await patch({ text: 'x' }, id, { origin: 'https://evil.example' })).status).toBe(403)
    expect((await readdir(dir)).filter((f) => f.includes('.tmp'))).toEqual([])
  })
  it('has no thread on a values note', async () => {
    const a = res()
    await handle(post({ kind: 'values', snapshot }), a.r)
    const r = res()
    await handle(req({ method: 'PATCH', url: `${NOTES_ROUTE}?id=${a.json().id}`, headers: { origin: `http://${HOST}` }, body: JSON.stringify({ text: 'hi' }) }), r.r)
    expect(r.out.status).toBe(400)
  })
  it('only answers GET, POST, PATCH and DELETE', async () => {
    const a = res()
    await handle(req({ method: 'PUT', headers: { origin: `http://${HOST}` } }), a.r)
    expect(a.out.status).toBe(405)
  })
})
