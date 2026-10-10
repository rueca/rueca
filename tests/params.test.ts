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
