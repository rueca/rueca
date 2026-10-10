import { beforeEach, describe, expect, it } from 'vitest'
import { createParams } from '@kit/core/params'
import { defineSchema, folder, p } from '@kit/core/schema'

const schema = defineSchema({ look: folder('Look', { rings: p.number(14, { min: 3, max: 40, step: 1 }), shape: p.select('circle', ['circle', 'square']) }) })
let n = 0
const make = (o: Partial<Parameters<typeof createParams<typeof schema>>[1]> = {}) =>
  createParams(schema, { id: `t${++n}`, url: false, presets: [{ name: 'Dense', values: { rings: 32 } }, { name: 'Calm', values: { rings: 8 } }], ...o })

beforeEach(() => localStorage.clear())

describe('params store', () => {
  it('coerces every write and ignores bad values', () => {
    const s = make()
    s.setValue('rings', 99)
    expect(s.values().rings).toBe(40)
    s.setValue('shape', 'hexagon' as never)
    expect(s.values().shape).toBe('circle')
  })
  it('undoes and redoes committed steps with labels', () => {
    const s = make()
    s.setValue('rings', 20, { label: 'Rings' })
    s.setValue('rings', 25)
    expect(s.undo()).toBeDefined()
    expect(s.values().rings).toBe(20)
    s.undo()
    expect(s.values().rings).toBe(14)
    expect(s.canUndo()).toBe(false)
    s.redo()
    expect(s.values().rings).toBe(20)
  })
  it('a drag (commit: false … true) is one undo step', () => {
    const s = make()
    for (const v of [15, 16, 17]) s.setValue('rings', v, { commit: false })
    s.setValue('rings', 18, { commit: true })
    s.undo()
    expect(s.values().rings).toBe(14)
  })
  it('persists and restores values', () => {
    const a = make({ id: 'persist-me' })
    a.setValue('rings', 21)
    window.dispatchEvent(new Event('pagehide')) // saves are batched; leaving the page flushes them
    const b = createParams(schema, { id: 'persist-me', url: false })
    expect(b.values().rings).toBe(21)
  })
  it('survives garbage in storage', () => {
    localStorage.setItem('studio:garbage:values', '{"rings":"lots","shape":7,"evil":1}')
    const s = createParams(schema, { id: 'garbage', url: false })
    expect(s.values()).toEqual({ rings: 14, shape: 'circle' })
  })
})

describe('presets', () => {
  it('applies a preset by merging', () => {
    const s = make()
    s.setValue('shape', 'square')
    s.applyPreset('Dense')
    expect(s.values()).toEqual({ rings: 32, shape: 'square' })
  })
  it('renames a save that clashes with a built-in (break-it V12)', () => {
    const s = make()
    s.setValue('rings', 5)
    expect(s.savePreset('Dense')).toBe('Dense 2')
    s.applyPreset('Calm')
    s.applyPreset('Dense 2')
    expect(s.values().rings).toBe(5)
  })
  it('reports the preset you picked when several match (break-it V13)', () => {
    const s = make()
    s.applyPreset('Calm')
    s.savePreset('My calm')
    expect(s.activePreset()?.name).toBe('My calm')
    s.applyPreset('Calm')
    expect(s.activePreset()?.name).toBe('Calm')
    s.applyPreset('My calm')
    expect(s.activePreset()?.name).toBe('My calm')
  })
})

describe('share links carry their version', () => {
  const link = (payload: object) => { location.hash = '#p=' + btoa(unescape(encodeURIComponent(JSON.stringify(payload)))) }
  it('round-trips through shareURL', () => {
    const a = createParams(schema, { id: `link${++n}`, persist: false, version: 2 })
    a.setValue('rings', 30)
    const url = a.shareURL()
    location.hash = url.slice(url.indexOf('#'))
    sessionStorage.clear()
    const b = createParams(schema, { id: `link${++n}`, persist: false, version: 2 })
    expect(b.values().rings).toBe(30)
  })
  it('ignores a link made with another version, and says so', async () => {
    const seen: unknown[] = []
    const on = (e: Event) => seen.push((e as CustomEvent).detail)
    window.addEventListener('studio:link-ignored', on)
    link({ $v: 1, rings: 30 })
    sessionStorage.clear()
    const s = createParams(schema, { id: `link${++n}`, persist: false, version: 2 })
    expect(s.values().rings).toBe(14)
    await Promise.resolve()
    expect(seen).toHaveLength(1)
    window.removeEventListener('studio:link-ignored', on)
  })
  it('treats links from before versions existed as version 1', () => {
    link({ rings: 22 })
    sessionStorage.clear()
    expect(createParams(schema, { id: `link${++n}`, persist: false }).values().rings).toBe(22)
    link({ rings: 22 })
    sessionStorage.clear()
    expect(createParams(schema, { id: `link${++n}`, persist: false, version: 3 }).values().rings).toBe(14)
  })
})

describe('share links and presets across reloads and versions', () => {
  it('a link’s values survive a plain reload (ST2)', () => {
    const id = `keep${++n}`
    location.hash = '#p=' + btoa(JSON.stringify({ $v: 1, rings: 31 }))
    sessionStorage.clear()
    expect(createParams(schema, { id }).values().rings).toBe(31)
    // reload: same URL, link already seen this tab → saved values must hold the link's value
    expect(createParams(schema, { id }).values().rings).toBe(31)
  })
  it('two links that differ only late in the payload are both honoured (ST3)', () => {
    const id = `two${++n}`
    sessionStorage.clear()
    location.hash = '#p=' + btoa(JSON.stringify({ $v: 1, shape: 'square', rings: 10 }))
    createParams(schema, { id })
    location.hash = '#p=' + btoa(JSON.stringify({ $v: 1, shape: 'square', rings: 20 }))
    expect(createParams(schema, { id }).values().rings).toBe(20)
  })
  it('a link pasted into an open tab applies at once, undoably (ST3)', () => {
    location.hash = ''
    const s = createParams(schema, { id: `paste${++n}`, persist: false })
    location.hash = '#p=' + btoa(JSON.stringify({ $v: 1, rings: 27 }))
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(s.values().rings).toBe(27)
    s.undo()
    expect(s.values().rings).toBe(14)
  })
  it('saved presets survive a schema version bump (ST4)', () => {
    location.hash = ''
    localStorage.setItem('studio:pv:presets:v1', JSON.stringify([{ name: 'Mine', values: { rings: 9 } }]))
    const s = createParams(schema, { id: 'pv', version: 2 })
    expect(s.getState().presets.some((p) => p.name === 'Mine')).toBe(true)
    expect(localStorage.getItem('studio:pv:presets')).not.toBeNull()
  })
})
