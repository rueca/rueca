import { beforeEach, describe, expect, it } from 'vitest'
import { createParams } from '@kit/core/params'
import { createDocStore } from '@kit/core/doc'
import { createHistory } from '@kit/core/history'
import { defineSchema, folder, p } from '@kit/core/schema'
import { captureSnapshot, formatNotePrompt } from '@kit/core/notes'

const schema = defineSchema({
  look: folder('Look', {
    rings: p.number(14, { min: 3, max: 40, step: 1, hint: 'How many rings.' }),
    tint: p.color('#5b8cff', { label: 'Ring colour' }),
    secret: p.text('x', { share: false }),
  }),
})
let n = 0
const make = () => createParams(schema, { id: `notes${++n}`, url: false, version: 3 })

beforeEach(() => localStorage.clear())

describe('captureSnapshot', () => {
  it('records only changed, shareable values, with default, label and hint', () => {
    const s = make()
    s.setValue('rings', 20)
    s.setValue('secret', 'y')
    const snap = captureSnapshot({ params: s })
    expect(snap.changed).toEqual({ rings: { value: 20, default: 14, label: 'Rings', hint: 'How many rings.' } })
    expect(snap.tool).toBe(s.id)
    expect(snap.schema).toBe(3)
    expect(snap.$v).toBe(1)
    expect(snap.url).toContain('#p=')
  })
  it('uses the param label when the schema gives one', () => {
    const s = make()
    s.setValue('tint', '#ff0000')
    expect(captureSnapshot({ params: s }).changed.tint.label).toBe('Ring colour')
  })
  it('lists history steps in order, from the params store or a joined history', () => {
    const s = make()
    const doc = createDocStore({ nodes: [] as number[] }, { id: `notes-doc${n}`, persist: false })
    const h = createHistory([s, doc])
    s.setValue('rings', 20, { label: 'Rings' })
    doc.set((d) => ({ nodes: [...d.nodes, 1] }), { label: 'Add node' })
    expect(captureSnapshot({ params: s }).steps).toEqual(['Rings'])
    expect(captureSnapshot({ params: s, history: h }).steps).toEqual(['Rings', 'Add node'])
  })
  it('carries the playhead and a small doc, and omits a large one', () => {
    const s = make()
    const small = createDocStore({ a: 1 }, { id: `notes-small${n}`, persist: false })
    const big = createDocStore({ blob: 'x'.repeat(60_000) }, { id: `notes-big${n}`, persist: false })
    expect(captureSnapshot({ params: s, clock: { time: () => 1234.6 }, doc: small })).toMatchObject({ t: 1235, doc: { id: small.id, value: { a: 1 } } })
    expect(captureSnapshot({ params: s, doc: big }).doc).toEqual({ id: big.id, omitted: 'too large' })
  })
})

describe('formatNotePrompt', () => {
  it('lists each change with its default and hint, plus the link', () => {
    const s = make()
    s.setValue('rings', 20)
    const snap = captureSnapshot({ params: s })
    const text = formatNotePrompt({ kind: 'values', snapshot: snap })
    expect(text).toContain(`Apply these tuned values to ${s.id}`)
    expect(text).toContain('- Rings (`rings`): 20 (default 14) — How many rings.')
    expect(text).toContain(`Open this state: ${snap.url}`)
  })
  it('puts a comment’s text first', () => {
    const text = formatNotePrompt({ kind: 'comment', text: 'The second ring snaps.', snapshot: captureSnapshot({ params: make() }) })
    expect(text).toMatch(/^A note on .+:\n\nThe second ring snaps\./)
    expect(text).toContain('- (no changes from defaults)')
  })
})

describe('watchNotes', () => {
  it('runs one poll loop however many watchers and refreshes pile up', async () => {
    const { watchNotes, refreshNotes } = await import('@kit/core/notes')
    let inFlight = 0, peak = 0, calls = 0
    const real = globalThis.fetch
    globalThis.fetch = (async () => {
      calls++; inFlight++; peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 20))
      inFlight--
      return new Response('[]', { headers: { 'x-rueca-notes': '1', 'content-type': 'application/json' } })
    }) as typeof fetch
    try {
      const offs = [watchNotes(() => {}, { interval: 10_000 }), watchNotes(() => {}), watchNotes(() => {})]
      for (let i = 0; i < 10; i++) refreshNotes()
      await new Promise((r) => setTimeout(r, 150))
      expect(peak).toBe(1)
      expect(calls).toBeLessThanOrEqual(4)   // the endpoint probe, the first poll, one queued refresh
      offs.forEach((off) => off())
    } finally { globalThis.fetch = real }
  })
})
