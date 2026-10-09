/* Marks — actions shared by the grid, focus view, panels and the palette. Doc changes are undoable. */
import { copyText, download, exportJSON, toast } from '@kit'
import { FAMILY, mulberry32, mutateParams, sampleParams, type FamilyId } from './families'
import { doc, history, settings, ui, newMark, uid, colorsOf, markLabel, type Doc, type Mark } from './model'
import { lockupSVG, markSVG, svgToPNG } from './render'
import { createZip } from '@kit'

const rng = () => mulberry32((Math.random() * 2 ** 31) | 0)
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mark'
const gc = (d: Doc): Doc => {
  const keep = new Set([...d.grid, ...d.favs])
  return { ...d, marks: Object.fromEntries(Object.entries(d.marks).filter(([id]) => keep.has(id))) }
}
const mark = (id: string | null | undefined) => (id ? doc.get().marks[id] : undefined)

/* --- grid --- */
export function reroll() {
  const s = settings.values()
  const fams = (s.families as FamilyId[]).length ? (s.families as FamilyId[]) : (['scribble'] as FamilyId[])
  const r = rng()
  let changed = 0
  doc.set((d) => {
    const marks = { ...d.marks }
    const grid = d.grid.map((id) => {
      if (marks[id]?.locked) return id
      const m = newMark(fams[Math.floor(r() * fams.length)], r, s.randomise)
      marks[m.id] = m
      changed++
      return m.id
    })
    return gc({ ...d, marks, grid })
  }, { label: 'Reroll' })
  if (!changed) toast('Every variant is locked', { description: 'Unlock one (L) to reroll it.' })
}

/** Match the grid length to the Variants setting. */
export function fitCount() {
  const n = Number(settings.values().count)
  const d = doc.get()
  if (d.grid.length === n) return
  const s = settings.values()
  const fams = s.families as FamilyId[]
  const r = rng()
  doc.set((x) => {
    if (x.grid.length > n) {
      // drop unlocked variants from the end first
      const grid = [...x.grid]
      for (let i = grid.length - 1; i >= 0 && grid.length > n; i--) if (!x.marks[grid[i]].locked) grid.splice(i, 1)
      return gc({ ...x, grid: grid.slice(0, Math.max(n, grid.length)) })
    }
    const marks = { ...x.marks }
    const add = Array.from({ length: n - x.grid.length }, () => { const m = newMark(fams[Math.floor(r() * fams.length)], r, s.randomise); marks[m.id] = m; return m.id })
    return { ...x, marks, grid: [...x.grid, ...add] }
  }, { label: 'Variant count' })
}

export function toggleLock(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, locked: !m.locked } } }), { label: m.locked ? 'Unlock' : 'Keep' })
}
export function setAllLocked(locked: boolean) {
  doc.set((d) => ({ ...d, marks: Object.fromEntries(Object.entries(d.marks).map(([k, m]) => [k, d.grid.includes(k) ? { ...m, locked } : m])) }), { label: locked ? 'Keep all' : 'Unlock all' })
}
export function toggleFav(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  const on = doc.get().favs.includes(m.id)
  doc.set((d) => gc({ ...d, favs: on ? d.favs.filter((x) => x !== m.id) : [m.id, ...d.favs] }), { label: on ? 'Unfavourite' : 'Favourite' })
  toast(on ? 'Removed from favourites' : 'Added to favourites', { description: markLabel(m) })
}
export function clearFavs() {
  doc.set((d) => gc({ ...d, favs: [] }), { label: 'Clear favourites' })
  toast('Favourites cleared', { action: { label: 'Undo', onClick: () => history.undo() } })
}

/* --- focus --- */
export const cursorId = () => {
  const s = ui.getState()
  return s.focus ?? doc.get().grid[s.cursor] ?? null
}
export function focus(id: string | null) {
  const s = ui.getState()
  ui.setState({ focus: id, last: s.focus ?? s.last, compare: id ? s.compare : null, mutations: id === s.focus ? s.mutations : [] })
  if (id) { const i = doc.get().grid.indexOf(id); if (i >= 0) ui.setState({ cursor: i }) }
}
export function step(delta: number) {
  const d = doc.get()
  const list = ui.getState().focus && !d.grid.includes(ui.getState().focus!) ? d.favs : d.grid
  const cur = list.indexOf(cursorId() ?? '')
  const next = list[(cur + delta + list.length) % list.length]
  if (ui.getState().focus) focus(next)
  else ui.setState({ cursor: (cur + delta + list.length) % list.length })
}
export function toggleCompare() {
  const s = ui.getState()
  if (!s.focus) return
  if (s.compare) { ui.setState({ compare: null }); return }
  const d = doc.get()
  const candidate = [s.last, ...d.favs, ...d.grid].find((id) => id && id !== s.focus && d.marks[id])
  if (!candidate) { toast('Nothing to compare with yet'); return }
  ui.setState({ compare: candidate })
}
export const compareWith = (id: string) => ui.setState({ compare: id === ui.getState().focus ? null : id })
export function swapCompare() {
  const s = ui.getState()
  if (s.compare && s.focus) ui.setState({ focus: s.compare, compare: s.focus })
}
/** Copy one param (or all) from the compared mark onto the focused one. */
export function adoptFromCompare(key?: string) {
  const s = ui.getState()
  const a = mark(s.focus), b = mark(s.compare)
  if (!a || !b) return
  if (a.family !== b.family) {
    doc.set((d) => ({ ...d, marks: { ...d.marks, [a.id]: { ...a, family: b.family, v: { ...b.v } } } }), { label: 'Use B' })
    return
  }
  doc.set((d) => ({ ...d, marks: { ...d.marks, [a.id]: { ...a, v: key ? { ...a.v, [key]: b.v[key] } : { ...b.v } } } }), { label: key ? `Use B · ${key}` : 'Use all of B' })
}

/* --- more like this --- */
export function moreLikeThis(id = cursorId(), n = 10) {
  const m = mark(id)
  if (!m) return
  const r = rng()
  const spread = settings.values().spread
  const fam = FAMILY[m.family]
  const base = { ...(fam.params.getState().defaults as Record<string, unknown>), ...m.v }
  const mutations: Mark[] = Array.from({ length: n }, () => ({ id: uid(), family: m.family, v: mutateParams(fam, base, r, spread), from: m.id }))
  if (ui.getState().focus !== m.id) focus(m.id)
  ui.setState({ mutations, bottom: 'more', ladder: true })
}
export function applyMutation(mu: Mark) {
  const id = ui.getState().focus
  const m = mark(id)
  if (!m) return
  doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, family: mu.family, v: { ...mu.v } } } }), { label: 'Apply variation' })
}
/** Put a mutation into the grid, replacing the first unlocked slot after the focused one. */
export function keepMutation(mu: Mark) {
  const d = doc.get()
  const at = d.grid.indexOf(ui.getState().focus ?? '')
  const order = [...d.grid.keys()].map((k) => (k + Math.max(0, at) + 1) % d.grid.length)
  const slot = order.find((k) => !d.marks[d.grid[k]].locked)
  const m: Mark = { ...mu, id: uid(), locked: true }
  doc.set((x) => {
    const grid = [...x.grid]
    if (slot === undefined) grid.push(m.id)
    else grid[slot] = m.id
    return gc({ ...x, marks: { ...x.marks, [m.id]: m }, grid })
  }, { label: 'Keep variation' })
  ui.setState((s) => ({ mutations: s.mutations.filter((x) => x.id !== mu.id) }))
  toast('Kept in the grid (locked)', { description: markLabel(m) })
}
export function favMutation(mu: Mark) {
  const m: Mark = { ...mu, id: uid() }
  doc.set((x) => ({ ...x, marks: { ...x.marks, [m.id]: m }, favs: [m.id, ...x.favs] }), { label: 'Favourite variation' })
  toast('Added to favourites', { description: markLabel(m) })
}

/* --- reset --- */
export function resetMarkParams(id = ui.getState().focus) {
  const m = mark(id)
  if (!m) return
  const fam = FAMILY[m.family]
  doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, v: { ...(fam.params.getState().defaults as Record<string, unknown>), seed: m.v.seed } } } }), { label: 'Reset shape' })
}
export function newSeed(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, v: { ...m.v, seed: Math.floor(Math.random() * 99999) } } } }), { label: 'New seed' })
}
export function rerollParams(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, v: sampleParams(FAMILY[m.family], rng(), true) } } }), { label: 'Shuffle params' })
}

/* --- export --- */
const base = (m: Mark) => `${slug(settings.values().name)}-${m.family}-${m.v.seed}`
const cols = () => colorsOf(settings.values())

export function exportMarkSVG(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  download(new Blob([markSVG(m, cols(), { title: `${settings.values().name} — ${markLabel(m)}` })], { type: 'image/svg+xml' }), `${base(m)}.svg`)
  toast('SVG exported', { type: 'success', description: markLabel(m) })
}
export async function copyMarkSVG(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  const ok = await copyText(markSVG(m, cols()))
  toast(ok ? 'SVG copied' : 'Clipboard unavailable', { type: ok ? 'success' : 'error' })
}
export function exportParams(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  const s = settings.values()
  exportJSON({ generator: 'Marks — Trompo', family: m.family, params: { ...(FAMILY[m.family].params.getState().defaults as object), ...m.v }, colors: { ink: s.ink, paper: s.paper, accent: s.accent }, initials: m.family === 'monogram' ? s.initials : undefined }, `${base(m)}.json`)
}
export function exportLockup(mode: 'light' | 'dark', id = cursorId()) {
  const m = mark(id)
  if (!m) return
  download(new Blob([lockupSVG(m, settings.values(), mode).svg], { type: 'image/svg+xml' }), `${base(m)}-lockup-${mode}.svg`)
  toast(`Lockup (${mode}) exported`, { type: 'success', description: 'Wordmark is live text set in Inter — outline it before print.' })
}
export const ICON_SIZES = [
  { size: 32, name: 'favicon-32.png', label: 'Favicon' },
  { size: 180, name: 'apple-touch-icon.png', label: 'Apple touch' },
  { size: 512, name: 'icon-512.png', label: 'PWA' },
  { size: 1024, name: 'icon-1024.png', label: 'App store' },
]
export async function exportPNGSet(id = cursorId()) {
  const m = mark(id)
  if (!m) return
  const s = settings.values()
  const c = cols()
  const t = toast('Rendering icons…', { type: 'loading' })
  try {
    const zip = createZip()
    for (const ic of ICON_SIZES) {
      const opaque = ic.size === 180 || s.iconBg !== 'transparent'
      const bgc = s.iconBg === 'ink' ? s.ink : s.paper
      const cc = s.iconBg === 'ink' ? { ...c, ink: s.paper, paper: s.ink } : c
      const svg = markSVG(m, cc, { bg: opaque ? bgc : null, pad: s.iconPad })
      await zip.addBlob(ic.name, await svgToPNG(svg, ic.size))
    }
    zip.add('mark.svg', markSVG(m, c))
    zip.add('favicon.svg', markSVG(m, c, { pad: s.iconPad }))
    zip.add('lockup-light.svg', lockupSVG(m, s, 'light').svg)
    zip.add('lockup-dark.svg', lockupSVG(m, s, 'dark').svg)
    zip.add('params.json', JSON.stringify({ family: m.family, params: m.v, colors: { ink: s.ink, paper: s.paper, accent: s.accent } }, null, 2))
    zip.add('README.txt', `${s.name} — ${markLabel(m)}\n\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="/favicon-32.png" sizes="32x32">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n`)
    download(zip.toBlob(), `${base(m)}-icons.zip`)
    toast.update(t, 'Icon set exported', { type: 'success', description: '32, 180, 512, 1024 px + SVGs and params' })
  } catch {
    toast.update(t, 'Icon export failed', { type: 'error', timeout: 5000 })
  }
}
