import { beforeEach, describe, expect, it } from 'vitest'
import { createParams } from '@kit/core/params'
import { createDocStore } from '@kit/core/doc'
import { createHistory } from '@kit/core/history'
import { defineSchema, folder, p } from '@kit/core/schema'
import { captureSnapshot, formatNotePrompt, isSnapshotState, restoreSnapshot, snapshotStatus } from '@kit/core/notes'

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

describe('normalizeNote', () => {
  it('drops notes the tool cannot show, and forgives replies written loosely', async () => {
    const { normalizeNote } = await import('@kit/core/notes')
    const snap = { $v: 1, tool: 't', schema: 1, at: '', url: '', changed: {}, steps: [], view: { width: 1, height: 1, theme: 'dark' } }
    expect(normalizeNote({ id: 'a', kind: 'comment', status: 'open', text: 'no snapshot' })).toBeNull()
    expect(normalizeNote('a string')).toBeNull()
    expect(normalizeNote({ id: 'a', kind: 'comment', status: 'resolved', snapshot: snap, resolution: 'Done: slowed it' })?.resolution).toEqual({ text: 'Done: slowed it', at: '' })
    expect(normalizeNote({ id: 'a', kind: 'comment', status: 'resolved', snapshot: snap, resolution: { text: { summary: 'x' }, at: 'now' } })?.resolution?.text).toBe('{"summary":"x"}')
    expect(normalizeNote({ id: 'a', kind: 'comment', status: 'open', snapshot: snap, resolution: { text: 'forgot status' } })?.status).toBe('resolved')
  })
})

describe('snapshot state', () => {
  it('keeps every value, so a note still matches after the agent bakes values in as defaults', () => {
    const s = make()
    s.setValue('rings', 20)
    const snap = captureSnapshot({ params: s })
    expect(snap.values).toMatchObject({ rings: 20, tint: '#5b8cff' })
    expect(snap.values).not.toHaveProperty('secret')
    // the agent made 20 the default: a fresh tool at rings 20 shows the note's state
    const baked = createParams(defineSchema({ look: folder('Look', { rings: p.number(20, { min: 3, max: 40, step: 1 }), tint: p.color('#5b8cff'), secret: p.text('x', { share: false }) }) }), { id: `notes-baked${n}`, url: false, version: 3 })
    expect(snapshotStatus(snap, baked)).toBe('same')
    // and a note made at the OLD default no longer pretends to match
    const old = captureSnapshot({ params: make() })
    expect(snapshotStatus(old, baked)).toBe('different')
    expect(restoreSnapshot(old, { params: baked })).toBe(true)
    expect(baked.values().rings).toBe(14)
    expect(snapshotStatus(old, baked)).toBe('same')
  })
  it('ignores removed keys and clamps like the tool, so restore never leaves a pin stale', () => {
    const s = make()
    const snap = { ...captureSnapshot({ params: s }), values: { rings: 80, oldKnob: 3, tint: '#5b8cff' } }
    expect(restoreSnapshot(snap, { params: s })).toBe(true)
    expect(s.values().rings).toBe(40)
    expect(snapshotStatus(snap, s)).toBe('same')
  })
  it('never restores a note from another schema version', () => {
    const s = make()
    s.setValue('rings', 30)
    const snap = { ...captureSnapshot({ params: s }), schema: 2 }
    s.setValue('rings', 10)
    expect(snapshotStatus(snap, s)).toBe('other-version')
    expect(isSnapshotState(snap, s)).toBe(true)
    expect(restoreSnapshot(snap, { params: s })).toBe(false)
    expect(s.values().rings).toBe(10)
  })
})
