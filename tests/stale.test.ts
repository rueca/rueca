import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fresh, isChunkError, reloadOnce } from '../src/gallery/stale'

describe('stale chunks after a deploy', () => {
  beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks() })

  it('recognises each browser’s missing-module message', () => {
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: https://rueca.dev/assets/x.js'))).toBe(true)
    expect(isChunkError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkError(new Error('Cannot read properties of undefined'))).toBe(false)
  })

  it('reloads once, then lets errors through for 30 s so it can never loop', () => {
    const reload = vi.fn()
    vi.spyOn(location, 'reload').mockImplementation(reload)
    expect(reloadOnce(1_000_000)).toBe(true)
    expect(reloadOnce(1_010_000)).toBe(false)
    expect(reloadOnce(1_031_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('fresh() keeps other import errors as they are', async () => {
    const boom = new Error('a bug in the module')
    await expect(fresh(() => Promise.reject(boom))()).rejects.toBe(boom)
  })
})
