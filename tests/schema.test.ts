import { describe, expect, it } from 'vitest'
import { coerce, p, defineSchema, folder, defaultsOf, humanize } from '@kit/core/schema'

const ok = (r: ReturnType<typeof coerce>) => (r.ok ? r.value : Symbol.for('rejected'))
const REJECTED = Symbol.for('rejected')

describe('coerce — every write goes through it', () => {
  it('clamps numbers and parses numeric strings', () => {
    const d = p.number(5, { min: 0, max: 10 })
    expect(ok(coerce(d, 50))).toBe(10)
    expect(ok(coerce(d, '3'))).toBe(3)
    expect(ok(coerce(d, 'x'))).toBe(REJECTED)
    expect(ok(coerce(d, NaN))).toBe(REJECTED)
  })
  it('only accepts listed options for select / multi', () => {
    const s = p.select('a', ['a', 'b'])
    expect(ok(coerce(s, 'b'))).toBe('b')
    expect(ok(coerce(s, 'z'))).toBe(REJECTED)
    const m = p.multi(['a'], ['a', 'b'])
    expect(ok(coerce(m, ['b']))).toEqual(['b'])
    expect(ok(coerce(m, ['b', 'z']))).toBe(REJECTED)
  })
  it('checks colours, sizes and gradients', () => {
    expect(ok(coerce(p.color('#fff'), ' #112233 '))).toBe('#112233')
    expect(ok(coerce(p.color('#fff'), 'red'))).toBe(REJECTED)
    expect(ok(coerce(p.size({ w: 1, h: 1 }), { w: 0, h: 5 }))).toBe(REJECTED)
    expect(ok(coerce(p.gradient({ angle: 0, stops: [] }), { angle: 90, stops: [{ pos: 0, color: '#000' }] }))).toBe(REJECTED)
  })
  it('orders and clamps ranges', () => {
    expect(ok(coerce(p.range([0, 1], { min: 0, max: 10 }), [8, -2]))).toEqual([0, 8])
  })
  it('keeps data the same shape family and runs its validate()', () => {
    const d = p.data<{ id: string }[]>([], { validate: (v) => (v as unknown[]).every((x: any) => typeof x?.id === 'string') })
    expect(ok(coerce(d, [{ id: 'a' }]))).toEqual([{ id: 'a' }])
    expect(ok(coerce(d, { id: 'a' }))).toBe(REJECTED)
    expect(ok(coerce(d, [{ id: 1 }]))).toBe(REJECTED)
  })
  it('reads booleans from link strings', () => {
    expect(ok(coerce(p.boolean(false), 'true'))).toBe(true)
    expect(ok(coerce(p.boolean(false), 1))).toBe(REJECTED)
  })
})

describe('schema helpers', () => {
  it('flattens folders into defaults', () => {
    const s = defineSchema({ a: folder('A', { x: p.number(1) }), b: folder('B', { y: p.select('k', ['k', 'l']) }) })
    expect(defaultsOf(s)).toEqual({ x: 1, y: 'k' })
  })
  it('rejects duplicate keys across folders', () => {
    expect(() => defineSchema({ a: folder('A', { x: p.number(1) }), b: folder('B', { x: p.number(2) }) })).toThrow(/duplicate key "x"/)
  })
  it('humanizes keys in sentence case', () => {
    expect(humanize('strokeWidth')).toBe('Stroke width')
  })
})

describe('bounds hold for every kind (break-it B5-04)', () => {
  it('clamps vectors and sizes, trims palettes, dedupes multi', () => {
    expect(coerce(p.size({ w: 100, h: 100 }, { min: 1, max: 8000 }), { w: 200000, h: 50 })).toEqual({ ok: true, value: { w: 8000, h: 50 } })
    expect(coerce(p.vec2({ x: 0, y: 0 }, { min: -1, max: 1 }), { x: 9, y: -9 })).toEqual({ ok: true, value: { x: 1, y: -1 } })
    expect(coerce(p.palette(['#000'], { max: 2 }), ['#000', '#111', '#222'])).toEqual({ ok: true, value: ['#000', '#111'] })
    expect(coerce(p.multi(['a'], ['a', 'b'], { min: 1 }), ['a', 'a', 'b'])).toEqual({ ok: true, value: ['a', 'b'] })
    expect(coerce(p.multi(['a'], ['a', 'b'], { min: 1 }), []).ok).toBe(false)
  })
})

describe('springStats', () => {
  it('reads damping ratio, overshoot and settle time', async () => {
    const { springStats } = await import('@kit/ui/special')
    const crit = springStats({ stiffness: 100, damping: 20, mass: 1 })   // ζ = 1
    expect(crit.zeta).toBeCloseTo(1, 5)
    expect(crit.overshoot).toBeLessThan(0.005)
    const bouncy = springStats({ stiffness: 380, damping: 10, mass: 1 })
    expect(bouncy.zeta).toBeLessThan(0.3)
    expect(bouncy.overshoot).toBeGreaterThan(0.3)
    expect(bouncy.settle).toBeGreaterThan(crit.settle)
  })
})
