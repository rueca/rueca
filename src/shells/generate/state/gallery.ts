/* ---------------------------------------------------------------------------
   History: sessions, boards, image records, selection. Only metadata is
   persisted — pixels are re-rendered from params (see engine/paint.ts).
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { GenParams } from '../engine/models'
import { seedGallery } from './seed'

export type ImageKind = 'generate' | 'variation' | 'remix' | 'upscale'
export interface ImageRec {
  id: string
  sessionId: string
  jobId: string
  createdAt: number
  params: GenParams
  kind: ImageKind
  parentId?: string
  favourite?: boolean
  boards?: string[]
  /** simulated generation time */
  ms: number
}
export interface Session { id: string; name: string; createdAt: number }
export interface Board { id: string; name: string }
export type View = { type: 'session'; id: string } | { type: 'all' } | { type: 'favourites' } | { type: 'board'; id: string }

export interface GalleryState {
  sessions: Session[]
  boards: Board[]
  images: ImageRec[]
  view: View
  activeSession: string
  selection: string[]
  anchor: string | null
  groupBy: 'prompt' | 'none'
  density: 's' | 'm' | 'l'
  favOnly: boolean
}

const LS = 'studio:generate:gallery'
export const uid = (p = '') => `${p}${Math.random().toString(36).slice(2, 8)}`

function initial(): GalleryState {
  const base = { selection: [], anchor: null, groupBy: 'prompt' as const, density: 'm' as const, favOnly: false }
  try {
    const s = localStorage.getItem(LS)
    if (s) {
      const g = JSON.parse(s)
      if (Array.isArray(g.sessions) && Array.isArray(g.images)) return { ...base, ...g, selection: [], anchor: null }
    }
  } catch { /* corrupt */ }
  const seeded = seedGallery()
  return { ...base, ...seeded, view: { type: 'session', id: seeded.sessions[0].id }, activeSession: seeded.sessions[0].id }
}

export const gallery = createStore<GalleryState>(initial)
export const useGallery = <T,>(pick: (s: GalleryState) => T) => useStore(gallery, pick)

let saveT: ReturnType<typeof setTimeout> | undefined
gallery.subscribe((s, prev) => {
  if (s.images === prev.images && s.sessions === prev.sessions && s.boards === prev.boards && s.view === prev.view && s.groupBy === prev.groupBy && s.density === prev.density) return
  clearTimeout(saveT)
  saveT = setTimeout(() => {
    const { sessions, boards, images, view, activeSession, groupBy, density } = gallery.getState()
    try { localStorage.setItem(LS, JSON.stringify({ sessions, boards, images, view, activeSession, groupBy, density })) } catch { /* quota */ }
  }, 250)
})

/* --- derived --- */
export function visible(s: GalleryState = gallery.getState()) {
  const v = s.view
  let list = s.images
  if (v.type === 'session') list = list.filter((i) => i.sessionId === v.id)
  else if (v.type === 'favourites') list = list.filter((i) => i.favourite)
  else if (v.type === 'board') list = list.filter((i) => i.boards?.includes(v.id))
  if (s.favOnly && v.type !== 'favourites') list = list.filter((i) => i.favourite)
  return list
}

export interface Group { key: string; prompt: string; images: ImageRec[] }
/** Consecutive images with the same prompt (and the same origin — a run, its variations, its upscales) form a group. */
export function groupImages(images: ImageRec[]): Group[] {
  const out: Group[] = []
  const origin = (i: ImageRec) => `${i.params.prompt}|${i.kind === 'remix' ? 'generate' : i.kind}|${i.kind === 'generate' || i.kind === 'remix' ? '' : i.parentId}`
  for (const im of images) {
    const last = out.at(-1)
    if (last && origin(last.images[0]) === origin(im)) last.images.push(im)
    else out.push({ key: im.id, prompt: im.params.prompt, images: [im] })
  }
  return out
}

export const viewTitle = (s: GalleryState) => {
  const v = s.view
  if (v.type === 'all') return 'All images'
  if (v.type === 'favourites') return 'Favourites'
  if (v.type === 'board') return s.boards.find((b) => b.id === v.id)?.name ?? 'Board'
  return s.sessions.find((x) => x.id === v.id)?.name ?? 'Session'
}
export const byId = (id: string | null | undefined) => (id ? gallery.getState().images.find((i) => i.id === id) : undefined)

/* --- actions --- */
export function setView(view: View) {
  gallery.setState({ view, selection: [], anchor: null, ...(view.type === 'session' ? { activeSession: view.id } : {}) })
}

export function newSession(name?: string) {
  const s = gallery.getState()
  const n = name ?? `Session ${s.sessions.length + 1}`
  const session: Session = { id: uid('s-'), name: n, createdAt: Date.now() }
  gallery.setState({ sessions: [session, ...s.sessions] })
  setView({ type: 'session', id: session.id })
  return session
}
export const renameSession = (id: string, name: string) => gallery.setState((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, name } : x)) }))

export function deleteSession(id: string) {
  const s = gallery.getState()
  const session = s.sessions.find((x) => x.id === id)
  if (!session) return null
  const removed = s.images.filter((i) => i.sessionId === id)
  let sessions = s.sessions.filter((x) => x.id !== id)
  if (!sessions.length) sessions = [{ id: uid('s-'), name: 'Session 1', createdAt: Date.now() }]
  gallery.setState({ sessions, images: s.images.filter((i) => i.sessionId !== id) })
  if (s.activeSession === id || (s.view.type === 'session' && s.view.id === id)) setView({ type: 'session', id: sessions[0].id })
  return () => gallery.setState((g) => ({ sessions: [...g.sessions.filter((x) => x.id !== session.id), session].sort((a, b) => b.createdAt - a.createdAt), images: [...g.images, ...removed].sort((a, b) => b.createdAt - a.createdAt) }))
}

export function newBoard(name: string) {
  const b: Board = { id: uid('b-'), name }
  gallery.setState((s) => ({ boards: [...s.boards, b] }))
  return b
}
export const renameBoard = (id: string, name: string) => gallery.setState((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, name } : b)) }))
export function deleteBoard(id: string) {
  gallery.setState((s) => ({ boards: s.boards.filter((b) => b.id !== id), images: s.images.map((i) => (i.boards?.includes(id) ? { ...i, boards: i.boards.filter((x) => x !== id) } : i)) }))
  const v = gallery.getState().view
  if (v.type === 'board' && v.id === id) setView({ type: 'all' })
}

export function addImages(recs: ImageRec[]) {
  gallery.setState((s) => ({ images: [...recs, ...s.images] }))
}

const patch = (ids: string[], fn: (i: ImageRec) => Partial<ImageRec>) => {
  const set = new Set(ids)
  gallery.setState((s) => ({ images: s.images.map((i) => (set.has(i.id) ? { ...i, ...fn(i) } : i)) }))
}
export function toggleFavourite(ids: string[]) {
  const all = gallery.getState().images.filter((i) => ids.includes(i.id)).every((i) => i.favourite)
  patch(ids, () => ({ favourite: !all }))
  return !all
}
export function toggleBoard(ids: string[], boardId: string) {
  const all = gallery.getState().images.filter((i) => ids.includes(i.id)).every((i) => i.boards?.includes(boardId))
  patch(ids, (i) => ({ boards: all ? (i.boards ?? []).filter((b) => b !== boardId) : [...new Set([...(i.boards ?? []), boardId])] }))
  return !all
}

/** Delete; returns an undo function. Selection moves to the next image (Lightroom). */
export function deleteImages(ids: string[]) {
  const s = gallery.getState()
  const set = new Set(ids)
  const list = visible(s)
  const lastIdx = Math.max(...list.map((i, k) => (set.has(i.id) ? k : -1)))
  const next = list.slice(lastIdx + 1).find((i) => !set.has(i.id)) ?? [...list].reverse().find((i) => !set.has(i.id))
  const removed = s.images.filter((i) => set.has(i.id))
  gallery.setState({ images: s.images.filter((i) => !set.has(i.id)), selection: next ? [next.id] : [], anchor: next?.id ?? null })
  return () => gallery.setState((g) => ({ images: [...g.images, ...removed].sort((a, b) => b.createdAt - a.createdAt), selection: ids, anchor: ids[0] }))
}

/* --- selection --- */
export function select(ids: string[], anchor?: string) { gallery.setState({ selection: ids, anchor: anchor ?? ids.at(-1) ?? null }) }

/** Click semantics: plain = single, mod = toggle, shift = range from the anchor (Finder / Lightroom). */
export function clickSelect(id: string, e: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) {
  const s = gallery.getState()
  if (e.shiftKey && s.anchor) {
    const list = visible(s).map((i) => i.id)
    const a = list.indexOf(s.anchor), b = list.indexOf(id)
    if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; gallery.setState({ selection: [...new Set([...s.selection, ...list.slice(lo, hi + 1)])] }); return }
  }
  if (e.metaKey || e.ctrlKey) {
    gallery.setState({ selection: s.selection.includes(id) ? s.selection.filter((x) => x !== id) : [...s.selection, id], anchor: id })
    return
  }
  gallery.setState({ selection: [id], anchor: id })
}

/** ← / → browse in gallery order. */
export function step(dir: 1 | -1) {
  const s = gallery.getState()
  const list = visible(s)
  if (!list.length) return
  const cur = s.anchor ? list.findIndex((i) => i.id === s.anchor) : -1
  const next = list[cur < 0 ? 0 : Math.max(0, Math.min(list.length - 1, cur + dir))]
  gallery.setState({ selection: [next.id], anchor: next.id })
}
