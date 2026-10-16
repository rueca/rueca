import { describe, expect, it } from 'vitest'
import { renderCanvasPNG, renderWebGLPNG } from '@kit/core/io'

describe('off-screen PNG exports', () => {
  it('refuse a size browsers cannot draw, with the way out in the message', async () => {
    const draw = () => {}
    await expect(renderCanvasPNG(draw, { width: 9000, height: 9000, v: {}, scale: 2 })).rejects.toThrow(/smaller scale/)
    await expect(renderWebGLPNG(() => null, draw, { width: 9000, height: 9000, v: {}, scale: 2 })).rejects.toThrow(/smaller scale/)
  })
  it('renderWebGLPNG says so when there is no WebGL2, before running setup', async () => {
    let ran = false
    await expect(renderWebGLPNG(() => { ran = true }, () => {}, { width: 10, height: 10, v: {} })).rejects.toThrow(/WebGL2/)
    expect(ran).toBe(false)
  })
})
