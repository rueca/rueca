import { describe, expect, it } from 'vitest'
import { slug, uid, mulberry32 } from '../src/shells/util'

describe('shell helpers', () => {
  it('slug folds accents, spells &, trims and falls back', () => {
    expect(slug('Yuzu & ginger — Café')).toBe('yuzu-and-ginger-cafe')
    expect(slug('  ---  ', 'flow')).toBe('flow')
    expect(slug('a'.repeat(80), 'x', 32)).toHaveLength(32)
    expect(slug('ab cd', 'x', 3)).toBe('ab')
  })
  it('uid prefixes and varies', () => {
    expect(uid('c')).toMatch(/^c[a-z0-9]{6}$/)
    expect(uid()).not.toBe(uid())
  })
  it('mulberry32 is deterministic per seed (demo art stays stable)', () => {
    const a = mulberry32(12345), b = mulberry32(12345)
    const seq = Array.from({ length: 5 }, () => a())
    expect(Array.from({ length: 5 }, () => b())).toEqual(seq)
    expect(seq[0]).toBeCloseTo(0.9797282677609473, 12)
  })
})
