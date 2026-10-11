import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { useHotkeys, useHoldKey, splitCombos } from '@kit/core/hotkeys'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | null = null
function bind(map: Record<string, () => void>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const C = () => { useHotkeys(map, []); return null }
  act(() => root!.render(createElement(C)))
}
afterEach(() => { act(() => root?.unmount()); root = null; document.body.innerHTML = '' })

const key = (type: 'keydown' | 'keyup', k: string, target: EventTarget = window, extra: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent(type, { key: k, code: k === ' ' ? 'Space' : `Key${k.toUpperCase()}`, bubbles: true, cancelable: true, ...extra }))

describe('splitCombos', () => {
  it('splits on commas but keeps a literal comma key', () => {
    expect(splitCombos('mod+=,mod+plus')).toEqual(['mod+=', 'mod+plus'])
    expect(splitCombos(',')).toEqual([','])
    expect(splitCombos('shift+,')).toEqual(['shift+,'])
  })
})

describe('dispatcher', () => {
  it('fires a bare Space binding on release (break-it F8)', () => {
    const play = vi.fn()
    bind({ space: play })
    key('keydown', ' ')
    expect(play).not.toHaveBeenCalled()
    key('keyup', ' ')
    expect(play).toHaveBeenCalledTimes(1)
  })
  it('skips Space when the pointer went down while it was held (Space+drag pans)', () => {
    const play = vi.fn()
    bind({ space: play })
    key('keydown', ' ')
    window.dispatchEvent(new Event('pointerdown'))
    key('keyup', ' ')
    expect(play).not.toHaveBeenCalled()
  })
  it('fires other keys on press', () => {
    const t = vi.fn()
    bind({ t })
    key('keydown', 't')
    expect(t).toHaveBeenCalledTimes(1)
  })
  it('leaves digits and Backspace to a focused number field (break-it V3)', () => {
    const two = vi.fn(), del = vi.fn()
    bind({ '2': two, backspace: del })
    const field = document.createElement('div')
    field.setAttribute('role', 'spinbutton')
    field.tabIndex = 0
    document.body.append(field)
    key('keydown', '2', field)
    key('keydown', 'Backspace', field)
    expect(two).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })
  it('never fires while typing in an input', () => {
    const t = vi.fn()
    bind({ t })
    const input = document.createElement('input')
    document.body.append(input)
    key('keydown', 't', input)
    expect(t).not.toHaveBeenCalled()
  })
})

describe('hold keys share the dispatcher (break-it B3-S8)', () => {
  it('a held key beats a kit default on the same key, once per hold', () => {
    const theme = vi.fn(), held: boolean[] = []
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    const C = () => { useHotkeys({ t: theme }, [], { priority: 0 }); useHoldKey('t', (d) => held.push(d)); return null }
    act(() => root!.render(createElement(C)))
    key('keydown', 't')
    key('keydown', 't', window, { repeat: true })
    key('keyup', 't')
    expect(theme).not.toHaveBeenCalled()
    expect(held).toEqual([true, false])
  })
})
