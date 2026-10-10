import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDocStore, matchesShape } from '@kit/core/doc'
import { createHistory } from '@kit/core/history'
import { createParams } from '@kit/core/params'
import { defineSchema, folder, p } from '@kit/core/schema'

beforeEach(() => localStorage.clear())
let n = 0

describe('matchesShape', () => {
  const template = { name: 'x', layers: [{ id: 'a', opacity: 1 }] }
  it('accepts the same shape and extra keys', () => {
    expect(matchesShape({ name: 'y', layers: [{ id: 'b', opacity: 0.5, extra: true }], more: 1 }, template)).toBe(true)
  })
  it('rejects wrong kinds and missing keys', () => {
    expect(matchesShape({ name: 'y', layers: {} }, template)).toBe(false)
    expect(matchesShape({ name: 'y', layers: [{ id: 'b' }] }, template)).toBe(false)
    expect(matchesShape('nope', template)).toBe(false)
  })
})

describe('createDocStore', () => {
  it('parks an invalid saved doc instead of loading it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('studio:bad:doc:v1', JSON.stringify({ items: 'not an array' }))
    const d = createDocStore({ items: [] as number[] }, { id: 'bad' })
    expect(d.get()).toEqual({ items: [] })
    expect(localStorage.getItem('studio:bad:doc:v1:rejected')).toContain('not an array')
    warn.mockRestore()
  })
  it('refuses to replace with an invalid doc', () => {
    const d = createDocStore({ items: [] as number[] }, { id: `r${++n}`, validate: (x: any) => Array.isArray(x?.items) })
    expect(() => d.replace({ items: 'x' } as never)).toThrow()
  })
  it('undoes its own steps', () => {
    const d = createDocStore({ x: 0 }, { id: `u${++n}`, persist: false })
    d.set({ x: 1 })
    d.set({ x: 2 })
    d.undo()
    expect(d.get().x).toBe(1)
  })
})

describe('createHistory', () => {
  it('interleaves params and doc steps in the order they happened', () => {
    const params = createParams(defineSchema({ f: folder('F', { a: p.number(0) }) }), { id: `h${++n}`, persist: false, url: false })
    const doc = createDocStore({ x: 0 }, { id: `h${++n}`, persist: false })
    const h = createHistory([params, doc])
    doc.set({ x: 1 })
    params.setValue('a', 5)
    doc.set({ x: 2 })
    h.undo()
    expect(doc.get().x).toBe(1)
    h.undo()
    expect(params.values().a).toBe(0)
    expect(doc.get().x).toBe(1)
    h.redo()
    expect(params.values().a).toBe(5)
  })
  it('flushes an in-progress edit as its own step before undoing (break-it F13)', () => {
    const params = createParams(defineSchema({ f: folder('F', { a: p.number(0) }) }), { id: `h${++n}`, persist: false, url: false })
    const doc = createDocStore({ x: 0 }, { id: `h${++n}`, persist: false })
    const h = createHistory([params, doc])
    doc.set({ x: 1 })
    doc.set({ x: 99 }, { commit: false })
    h.undo()
    expect(doc.get().x).toBe(1)
  })
})

describe('version bumps keep returning users’ work (break-it ST4)', () => {
  it('carries a shape-compatible older doc forward without a migrate', () => {
    localStorage.setItem('studio:bump:doc:v1', JSON.stringify({ title: 'mine', items: [1, 2] }))
    const d = createDocStore({ title: 'demo', items: [] as number[] }, { id: 'bump', version: 2 })
    expect(d.get()).toEqual({ title: 'mine', items: [1, 2] })
    expect(localStorage.getItem('studio:bump:doc:v1')).toBeNull()
  })
  it('leaves an older doc that no longer fits where it was', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('studio:bump2:doc:v1', JSON.stringify({ title: 3 }))
    const d = createDocStore({ title: 'demo' }, { id: 'bump2', version: 2 })
    expect(d.get()).toEqual({ title: 'demo' })
    expect(localStorage.getItem('studio:bump2:doc:v1')).not.toBeNull()
    warn.mockRestore()
  })
  it('records keyed by random ids need validate (marks regression, ST1)', () => {
    const demo = () => ({ marks: { [Math.random().toString(36)]: { family: 'a' } } })
    const saved = demo()
    localStorage.setItem('studio:rec:doc:v1', JSON.stringify(saved))
    const valid = (x: unknown) => !!x && typeof (x as { marks?: unknown }).marks === 'object'
    expect(createDocStore(demo(), { id: 'rec', validate: valid }).get()).toEqual(saved)
  })
})
