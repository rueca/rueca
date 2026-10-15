import { describe, expect, it } from 'vitest'
import { p, defineSchema, folder, defaultsOf, layoutFolder } from '@kit/core/schema'

const schema = defineSchema({
  adjust: folder('Adjust', {
    contrast: p.number(0, { min: -1, max: 1 }),
    gamma: p.number(1, { min: 0.2, max: 3 }),
    blur: p.number(0, { min: 0, max: 10, more: true }),
    invert: p.boolean(false, { more: true }),
    radius: p.number(1, { min: 0, max: 4, more: true, when: (v) => v.blur > 0 }),
  }),
  vignette: folder('Vignette', {
    vignette: p.boolean(false),
    amount: p.number(0.5, { min: 0, max: 1 }),
    feather: p.number(0.5, { min: 0, max: 1, more: true }),
  }, { toggle: 'vignette' }),
  view: folder('View', { grid: p.boolean(true) }, { place: 'settings' }),
})
const d = defaultsOf(schema) as Record<string, unknown>
const at = (patch: Record<string, unknown>) => ({ ...d, ...patch })

describe('layoutFolder — more rows', () => {
  it('keeps unchanged `more` params under the "N more" row', () => {
    const l = layoutFolder(schema.adjust, d, d)
    expect(l.rows).toEqual(['contrast', 'gamma'])
    expect(l.more).toEqual(['blur', 'invert'])
    expect(l.moreCount).toBe(2) // radius is hidden by `when`, so it isn't counted
  })
  it('a changed `more` param stays in view, in schema order', () => {
    const l = layoutFolder(schema.adjust, at({ invert: true }), d)
    expect(l.rows).toEqual(['contrast', 'gamma', 'invert'])
    expect(l.more).toEqual(['blur'])
  })
  it('opening shows them all and keeps the row to close it again', () => {
    const l = layoutFolder(schema.adjust, d, d, { moreOpen: true })
    expect(l.rows).toEqual(['contrast', 'gamma', 'blur', 'invert'])
    expect(l.more).toEqual([])
    expect(l.moreCount).toBe(2)
  })
  it('the client view ignores `more`', () => {
    const l = layoutFolder(schema.adjust, d, d, { published: true })
    expect(l.moreCount).toBe(0)
  })
})

describe('layoutFolder — the changed dot', () => {
  it('ignores a changed value whose row `when` hides', () => {
    // radius only shows while blur > 0: off its default but out of view, it mustn't light the header
    expect(layoutFolder(schema.adjust, at({ radius: 3 }), d).changed).toBe(false)
    expect(layoutFolder(schema.adjust, at({ radius: 3, blur: 2 }), d).changed).toBe(true)
  })
  it('counts a changed value waiting under "more"', () => {
    expect(layoutFolder(schema.adjust, at({ blur: 2 }), d).changed).toBe(true)
  })
  it('section reset still covers every value in the folder', () => {
    expect(layoutFolder(schema.adjust, d, d).valueKeys).toEqual(['contrast', 'gamma', 'blur', 'invert', 'radius'])
  })
})

describe('layoutFolder — header toggle', () => {
  it('off: no rows, and changes inside do not light the dot', () => {
    const l = layoutFolder(schema.vignette, at({ amount: 0.9 }), d)
    expect(l.toggle).toEqual({ key: 'vignette', on: false })
    expect(l.rows).toEqual([])
    expect(l.changed).toBe(false)
  })
  it('on: the toggle row itself is not rendered, its params are', () => {
    const l = layoutFolder(schema.vignette, at({ vignette: true }), d)
    expect(l.rows).toEqual(['amount'])
    expect(l.more).toEqual(['feather'])
    expect(l.changed).toBe(true)
  })
  it('defineSchema rejects a toggle that is not a boolean in the folder', () => {
    expect(() => defineSchema({ a: folder('A', { n: p.number(1) }, { toggle: 'n' }) })).toThrow(/isn't a boolean/)
    expect(() => defineSchema({ a: folder('A', { n: p.number(1) }, { toggle: 'missing' }) })).toThrow()
  })
})
