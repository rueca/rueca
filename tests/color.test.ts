import { describe, expect, it } from 'vitest'
import { contrastRatio, luminance, wcagGrade, readableOn } from '@kit/ui/color'

describe('WCAG contrast', () => {
  it('matches the reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#111', '#fff')).toBeCloseTo(18.88, 1)
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
    expect(luminance('#ffffff')).toBeCloseTo(1, 5)
  })
  it('is symmetric and grades', () => {
    expect(contrastRatio('#0b84e0', '#fff')).toBeCloseTo(contrastRatio('#fff', '#0b84e0'), 10)
    expect([7.1, 4.6, 3.2, 2].map(wcagGrade)).toEqual(['AAA', 'AA', 'AA large', 'Fail'])
  })
  it('readableOn darkens until white text passes', () => {
    expect(contrastRatio(readableOn('#7ab8ff'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
