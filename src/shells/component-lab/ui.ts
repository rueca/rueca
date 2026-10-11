/* View state (not undoable, persisted per browser): which component, which
   view, the viewport width and the preview theme. */
import { createStore } from 'zustand/vanilla'
import { saveLocal } from '../storage'
import { useStore } from 'zustand'
import type { CompId } from './props'

export interface UIState {
  comp: CompId
  view: 'preview' | 'states'
  width: number
  previewTheme: 'light' | 'dark'
  matrixThemes: 'one' | 'both'
  rightTab: 'tokens' | 'code'
  codeTab: 'css' | 'json' | 'tailwind'
  picked: string | null
}
const KEY = 'studio:component-lab:ui'
// opens on the card: the Gabinete plate, copy and actions show the kit best
const initial: UIState = { comp: 'card', view: 'preview', width: 768, previewTheme: 'light', matrixThemes: 'one', rightTab: 'tokens', codeTab: 'css', picked: null }
const load = (): UIState => { try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return initial } }

export const ui = createStore<UIState>(load)
ui.subscribe((s) => { saveLocal(KEY, JSON.stringify(s)) })
export const useUI = <T,>(pick: (s: UIState) => T) => useStore(ui, pick)
export const setUI = (patch: Partial<UIState>) => ui.setState(patch)
