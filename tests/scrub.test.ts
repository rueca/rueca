import { describe, expect, it } from 'vitest'
import { evaluate, relativeDelta } from '@kit/ui/scrub'

describe('ScrubValue typed maths', () => {
  it('evaluates plain numbers and expressions', () => {
    expect(evaluate('42', 0)).toBe(42)
    expect(evaluate('120/2', 0)).toBe(60)
    expect(evaluate('(2+3)*4', 0)).toBe(20)
    expect(evaluate('1,5', 0)).toBe(1.5) // comma decimal
    expect(evaluate('30px', 0)).toBe(30) // trailing unit stripped
  })
  it('treats a leading operator as relative to the current value', () => {
    expect(evaluate('+8', 10)).toBe(18)
    expect(evaluate('*1.5', 10)).toBe(15)
    expect(evaluate('/4', 10)).toBe(2.5)
  })
  it('reads a bare negative number as absolute, not relative', () => {
    expect(evaluate('-3', 10)).toBe(-3)
  })
  it('never returns Infinity or NaN (break-it V6)', () => {
    expect(evaluate('/0', 24)).toBeNull()
    expect(evaluate('/0', 0)).toBeNull()
    expect(evaluate('1/0', 0)).toBeNull()
  })
  it('accepts exponent notation (V6b)', () => {
    expect(evaluate('1e3', 0)).toBe(1000)
    expect(evaluate('+1e2', 5)).toBe(105)
  })
  it('rejects anything that is not arithmetic', () => {
    expect(evaluate('abc', 0)).toBeNull()
    expect(evaluate('', 0)).toBeNull()
    expect(evaluate('alert(1)', 0)).toBeNull()
    expect(evaluate('e', 0)).toBeNull()
  })
  it('turns "+n" / "-n" into a delta for Mixed fields (V9)', () => {
    expect(relativeDelta('+8')).toBe(8)
    expect(relativeDelta('- 2.5')).toBe(-2.5)
    expect(relativeDelta('8')).toBeNull()
    expect(relativeDelta('*2')).toBeNull()
  })
})
