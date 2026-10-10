import { describe, expect, it } from 'vitest'
import { resizeRect, handleEdges } from '@kit/stage/TransformBox'

const box = { x: 24, y: 0, w: 342, h: 100 }

describe('resizeRect', () => {
  it('moves only the dragged edge', () => {
    expect(resizeRect(box, 'e', 10, 0)).toEqual({ l: 24, t: 0, r: 376, b: 100 })
    expect(resizeRect(box, 'w', 10, 0)).toEqual({ l: 34, t: 0, r: 366, b: 100 })
  })
  it('mirrors the opposite edge from the centre with alt', () => {
    expect(resizeRect(box, 'e', 10, 0, { fromCenter: true })).toEqual({ l: 14, t: 0, r: 376, b: 100 })
  })
  it('collapses onto the centre, not the far edge, when dragged past zero from centre (break-it V4)', () => {
    const r = resizeRect(box, 'e', -480, 0, { fromCenter: true })
    expect(r.r - r.l).toBe(1)
    expect((r.l + r.r) / 2).toBe(box.x + box.w / 2)
  })
  it('never goes thinner than min', () => {
    const r = resizeRect(box, 'e', -1000, 0)
    expect(r.r - r.l).toBe(1)
    expect(r.l).toBe(24)
  })
  it('keeps the aspect ratio with shift', () => {
    const r = resizeRect({ x: 0, y: 0, w: 200, h: 100 }, 'se', 100, 0, { aspect: true })
    expect((r.r - r.l) / (r.b - r.t)).toBeCloseTo(2)
  })
  it('maps handles to edges', () => {
    expect(handleEdges('nw')).toEqual({ l: true, r: false, t: true, b: false })
  })
})
