import { describe, expect, it } from 'vitest'
import { writeCssVars } from '@kit/stage/Surface'

describe('writeCssVars (FrameSurface cssVars / studio-bridge parity)', () => {
  it('kebab-cases keys, adds px to numbers unless unitless, passes strings through', () => {
    writeCssVars(document, { accentColor: '#ff5a1f', headlineSize: 64, lineHeight: 1.1, dark: true }, { unitless: ['lineHeight'] })
    const s = document.documentElement.style
    expect(s.getPropertyValue('--accent-color')).toBe('#ff5a1f')
    expect(s.getPropertyValue('--headline-size')).toBe('64px')
    expect(s.getPropertyValue('--line-height')).toBe('1.1')
    expect(s.getPropertyValue('--dark')).toBe('true')
  })
  it('skips objects and arrays', () => {
    writeCssVars(document, { size: { w: 1, h: 2 }, list: [1] })
    expect(document.documentElement.style.getPropertyValue('--size')).toBe('')
  })
})

describe('readCssVars', () => {
  it('reads a page’s custom properties back into values', async () => {
    const { readCssVars } = await import('@kit/stage/Surface')
    document.documentElement.style.setProperty('--headline-size', '64px')
    document.documentElement.style.setProperty('--accent', '#ff5a1f')
    expect(readCssVars(document, ['headlineSize', 'accent', 'missing'])).toEqual({ headlineSize: 64, accent: '#ff5a1f' })
  })
})
