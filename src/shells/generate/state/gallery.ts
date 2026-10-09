/* ---------------------------------------------------------------------------
   History: sessions, boards, image records, selection. Only metadata is
   persisted — pixels are re-rendered from params (see engine/paint.ts).
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { createDocStore, createHistory, useDoc } from '@kit'
import { params } from './params'
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

/** The document: what undo covers. */
export interface Library { sessions: Session[]; boards: Board[]; images: ImageRec[] }
/** View state: never undone, so ⌘Z never yanks the user to another session. */
export interface ViewState {
  view: View
  activeSession: string
  selection: string[]
  anchor: string | null
  groupBy: 'prompt' | 'none'
  density: 's' | 'm' | 'l'
  favOnly: boolean
}
export type GalleryState = Library & ViewState

export const uid = (p = '') => `${p}${Math.random().toString(36).slice(2, 8)}`

const LEGACY = 'studio:generate:gallery' // before the kit doc store: library + view in one key
const VIEW = 'studio:generate:view'
const read = (key: string) => { try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null } }

function initialLibrary(): Library {
  const g = read(LEGACY)
  if (g && Array.isArray(g.sessions) && Array.isArray(g.images)) return { sessions: g.sessions, boards: g.boards ?? [], images: g.images }
  return seedGallery()
}

/** sessions · boards · image records — undoable, persisted (pixels re-render from params). */
export const library = createDocStore<Library>(initialLibrary(), { id: 'generate', version: 1 })
/** One ⌘Z timeline: generation settings and the library (deletes, favourites, boards, renames). */
export const history = createHistory([params, library])

function initialView(): ViewState {
  const base = { selection: [], anchor: null, groupBy: 'prompt' as const, density: 'm' as const, favOnly: false }
  const saved = read(VIEW) ?? read(LEGACY)
  const lib = library.get()
  const first = lib.sessions[0]?.id ?? ''
  const ok = (id?: string) => !!id && lib.sessions.some((x) => x.id === id)
  const view: View = saved?.view && (saved.view.type !== 'session' || ok(saved.view.id)) ? saved.view : { type: 'session', id: first }
  return { ...base, groupBy: saved?.groupBy ?? 'prompt', density: saved?.density ?? 'm', view, activeSession: ok(saved?.activeSession) ? saved.activeSession : first }
}
export const gallery = createStore<ViewState>(initialView)

let saveT: ReturnType<typeof setTimeout> | undefined
gallery.subscribe((s, prev) => {
  if (s.view === prev.view && s.groupBy === prev.groupBy && s.density === prev.density && s.activeSession === prev.activeSession) return
  clearTimeout(saveT)
  saveT = setTimeout(() => {
    const { view, activeSession, groupBy, density } = gallery.getState()
    try { localStorage.setItem(VIEW, JSON.stringify({ view, activeSession, groupBy, density })) } catch { /* quota */ }
  }, 250)
})

// Undo can remove the session or board on screen — fall back to one that exists.
library.subscribe((l, prev) => {
  if (l.doc === prev.doc) return
  const v = gallery.getState()
  const at = v.view
  const gone = (at.type === 'session' && !l.doc.sessions.some((x) => x.id === at.id)) || (at.type === 'board' && !l.doc.boards.some((x) => x.id === at.id))
  if (gone) gallery.setState({ view: { type: 'session', id: l.doc.sessions[0]?.id ?? '' }, activeSession: l.doc.sessions[0]?.id ?? '', selection: [], anchor: null })
  else if (v.selection.length) { const ids = new Set(l.doc.images.map((i) => i.id)); const sel = v.selection.filter((x) => ids.has(x)); if (sel.length !== v.selection.length) gallery.setState({ selection: sel, anchor: sel.at(-1) ?? null }) }
})

/** Library + view as one object (non-reactive). */
export const snapshot = (): GalleryState => ({ ...library.get(), ...gallery.getState() })
/** React: library + view. Re-renders on either; pick what you need. */
export function useGallery<T>(pick: (s: GalleryState) => T): T {
  const lib = useDoc(library)
  const view = useStore(gallery)
  return pick({ ...lib, ...view })
}

/* --- derived --- */
export function visible(s: GalleryState = snapshot()) {
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
export const byId = (id: string | null | undefined) => (id ? library.get().images.find((i) => i.id === id) : undefined)

/* --- actions --- */
export function setView(view: View) {
  gallery.setState({ view, selection: [], anchor: null, ...(view.type === 'session' ? { activeSession: view.id } : {}) })
}

export function newSession(name?: string) {
  const n = name ?? `Session ${library.get().sessions.length + 1}`
  const session: Session = { id: uid('s-'), name: n, createdAt: Date.now() }
  library.set((l) => ({ ...l, sessions: [session, ...l.sessions] }), { label: 'New session' })
  setView({ type: 'session', id: session.id })
  return session
}
export const renameSession = (id: string, name: string) =>
  library.set((l) => ({ ...l, sessions: l.sessions.map((x) => (x.id === id ? { ...x, name } : x)) }), { label: 'Rename session' })

/** Delete a session and its images — one undo step. Returns false when there was nothing to delete. */
export function deleteSession(id: string) {
  const l = library.get()
  if (!l.sessions.some((x) => x.id === id)) return false
  let sessions = l.sessions.filter((x) => x.id !== id)
  if (!sessions.length) sessions = [{ id: uid('s-'), name: 'Session 1', createdAt: Date.now() }]
  library.set({ ...l, sessions, images: l.images.filter((i) => i.sessionId !== id) }, { label: 'Delete session' })
  const v = gallery.getState()
  if (v.activeSession === id || (v.view.type === 'session' && v.view.id === id)) setView({ type: 'session', id: sessions[0].id })
  return true
}

export function newBoard(name: string) {
  const b: Board = { id: uid('b-'), name }
  library.set((l) => ({ ...l, boards: [...l.boards, b] }), { label: 'New board' })
  return b
}
export const renameBoard = (id: string, name: string) =>
  library.set((l) => ({ ...l, boards: l.boards.map((b) => (b.id === id ? { ...b, name } : b)) }), { label: 'Rename board' })
export function deleteBoard(id: string) {
  library.set((l) => ({ ...l, boards: l.boards.filter((b) => b.id !== id), images: l.images.map((i) => (i.boards?.includes(id) ? { ...i, boards: i.boards.filter((x) => x !== id) } : i)) }), { label: 'Delete board' })
  const v = gallery.getState().view
  if (v.type === 'board' && v.id === id) setView({ type: 'all' })
}

/** New images land as one undoable step ("Generate 4 images"). */
export function addImages(recs: ImageRec[], label = `Add ${recs.length} image${recs.length === 1 ? '' : 's'}`) {
  if (!recs.length) return
  library.set((l) => ({ ...l, images: [...recs, ...l.images] }), { label })
}

const patch = (ids: string[], fn: (i: ImageRec) => Partial<ImageRec>, label: string) => {
  const set = new Set(ids)
  library.set((l) => ({ ...l, images: l.images.map((i) => (set.has(i.id) ? { ...i, ...fn(i) } : i)) }), { label })
}
export function toggleFavourite(ids: string[]) {
  const all = library.get().images.filter((i) => ids.includes(i.id)).every((i) => i.favourite)
  patch(ids, () => ({ favourite: !all }), all ? 'Unfavourite' : 'Favourite')
  return !all
}
export function toggleBoard(ids: string[], boardId: string) {
  const all = library.get().images.filter((i) => ids.includes(i.id)).every((i) => i.boards?.includes(boardId))
  patch(ids, (i) => ({ boards: all ? (i.boards ?? []).filter((b) => b !== boardId) : [...new Set([...(i.boards ?? []), boardId])] }), all ? 'Remove from board' : 'Add to board')
  return !all
}

/** Delete — one undo step. Selection moves to the next image (Lightroom). */
export function deleteImages(ids: string[]) {
  const s = snapshot()
  const set = new Set(ids)
  const list = visible(s)
  const lastIdx = Math.max(...list.map((i, k) => (set.has(i.id) ? k : -1)))
  const next = list.slice(lastIdx + 1).find((i) => !set.has(i.id)) ?? [...list].reverse().find((i) => !set.has(i.id))
  library.set((l) => ({ ...l, images: l.images.filter((i) => !set.has(i.id)) }), { label: `Delete ${ids.length} image${ids.length === 1 ? '' : 's'}` })
  gallery.setState({ selection: next ? [next.id] : [], anchor: next?.id ?? null })
}

/* --- selection --- */
export function select(ids: string[], anchor?: string) { gallery.setState({ selection: ids, anchor: anchor ?? ids.at(-1) ?? null }) }

/** Click semantics: plain = single, mod = toggle, shift = range from the anchor (Finder / Lightroom). */
export function clickSelect(id: string, e: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) {
  const s = snapshot()
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
  const s = snapshot()
  const list = visible(s)
  if (!list.length) return
  const cur = s.anchor ? list.findIndex((i) => i.id === s.anchor) : -1
  const next = list[cur < 0 ? 0 : Math.max(0, Math.min(list.length - 1, cur + dir))]
  gallery.setState({ selection: [next.id], anchor: next.id })
}
