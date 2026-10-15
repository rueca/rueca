import { describe, expect, it } from 'vitest'
import { detentPos, detentSnap, detentStep, detentValue, normDetents } from '@kit/ui/detent'
import { coerce, p } from '@kit/core/schema'

// Candil's elevation ladder: stops that are far from evenly spaced in value
const LADDER = [{ value: 40, label: 'Modal' }, { value: -3, label: 'Inset' }, { value: 0, label: 'Flat' }, { value: 2, label: 'Raised' }, { value: 6, label: 'Card' }, { value: 14, label: 'Dropdown' }, { value: 24, label: 'Popover' }]
const Z = normDetents(LADDER).map((d) => d.value)

describe('detent track maths', () => {
  it('sorts the stops and drops duplicates', () => {
    expect(Z).toEqual([-3, 0, 2, 6, 14, 24, 40])
    expect(normDetents([3, 1, 3, { value: 1, label: 'One' }]).map((d) => d.value)).toEqual([1, 3])
  })
  it('spaces the stops evenly on the track, linear between neighbours', () => {
    expect(detentPos(Z, -3)).toBe(0)
    expect(detentPos(Z, 6)).toBe(3)
    expect(detentPos(Z, 10)).toBe(3.5) // halfway from Card (6) to Dropdown (14)
    expect(detentPos(Z, 40)).toBe(6)
    expect(detentPos(Z, -99)).toBe(0)
    expect(detentPos(Z, 99)).toBe(6)
    for (const t of [0, 0.5, 2.25, 3.5, 6]) expect(detentPos(Z, detentValue(Z, t))).toBeCloseTo(t)
  })
  it('snaps onto a stop within the pull and lets values between through', () => {
    expect(detentSnap(Z, 3.15)).toBe(6)
    expect(detentSnap(Z, 2.85)).toBe(6)
    expect(detentSnap(Z, 3.5, { step: 0.1 })).toBe(10)
    expect(detentSnap(Z, 3.5, { only: true })).toBe(14) // rounds half up to the next stop
    expect(detentSnap(Z, 3.4, { only: true })).toBe(6)
  })
  it('steps one stop at a time, from on or between stops', () => {
    expect(detentStep(Z, 6, 1)).toBe(14)
    expect(detentStep(Z, 6, -1)).toBe(2)
    expect(detentStep(Z, 10, 1)).toBe(14)
    expect(detentStep(Z, 10, -1)).toBe(6)
    expect(detentStep(Z, 40, 1)).toBe(40)
    expect(detentStep(Z, -3, -1)).toBe(-3)
  })
})

describe('p.number with detents', () => {
  it('takes min and max from the first and last stop unless given', () => {
    const d = p.number(6, { detents: LADDER })
    expect([d.min, d.max]).toEqual([-3, 40])
    const own = p.number(6, { detents: LADDER, min: -10, max: 100 })
    expect([own.min, own.max]).toEqual([-10, 100])
  })
  it('clamps to the ladder, and with snap: only lands on the nearest stop', () => {
    expect(coerce(p.number(6, { detents: LADDER }), 10)).toEqual({ ok: true, value: 10 })
    expect(coerce(p.number(6, { detents: LADDER }), 99)).toEqual({ ok: true, value: 40 })
    expect(coerce(p.number(6, { detents: LADDER, snap: 'only' }), 11)).toEqual({ ok: true, value: 14 })
    expect(coerce(p.number(6, { detents: LADDER, snap: 'only' }), '1')).toEqual({ ok: true, value: 0 })
  })
})
