/* Transient UI state: right-panel tab, remix source, overlays, prompt focus requests. */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type Overlay = null | { type: 'lightbox' } | { type: 'compare'; a: string; b: string; mode: 'wipe' | 'side' }
interface UIState { tab: 'create' | 'details'; remixOf: string | null; overlay: Overlay; focusTick: number; negativeOpen: boolean }

export const ui = createStore<UIState>(() => ({ tab: 'details', remixOf: null, overlay: null, focusTick: 0, negativeOpen: false }))
export const useUI = <T,>(pick: (s: UIState) => T) => useStore(ui, pick)
export const focusPrompt = () => ui.setState((s) => ({ focusTick: s.focusTick + 1 }))
