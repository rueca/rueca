/* Marks — model: brand settings (params), the variant document (with history), view state. */
import { createStore } from 'zustand/vanilla'
import { defineSchema, folder, p, createParams, createDocStore, createHistory, equal } from '@kit'
import { FAMILIES, FAMILY, mulberry32, sampleParams, type FamilyId } from './families'

export const settingsSchema = defineSchema({
  brand: folder('Brand', {
    name: p.text('Mentee', { label: 'Wordmark', hint: 'Set beside the mark in lockups and in the browser-tab preview.' }),
    initials: p.text('MT', { maxLength: 3, hint: 'Letters for the monogram family — up to three.' }),
    ink: p.color('#272727', { alpha: false }),
    paper: p.color('#EFEEE8', { alpha: false }),
    accent: p.color('#E4572E', { alpha: false, hint: 'Used sparingly: orbit planets, grid accents, bloom cores.' }),
  }),
  explore: folder('Explore', {
    families: p.multi(FAMILIES.map((f) => f.id), FAMILIES.map((f) => ({ value: f.id, label: f.name, icon: f.icon })), { min: 1, label: 'Families', hint: 'Which families a reroll draws from.' }),
    count: p.select('16', ['12', '16', '20', '24'], { label: 'Variants' }),
    randomise: p.boolean(true, { label: 'Reroll params', hint: 'Off: Space only changes seeds and keeps each family’s defaults.' }),
    spread: p.number(0.3, { min: 0.05, max: 1, step: 0.01, label: 'Variation', hint: 'How far “More like this” strays from the original.' }),
  }),
  lockup: folder('Lockup', {
    lockLayout: p.select('horizontal', ['horizontal', 'stacked'], { label: 'Layout' }),
    wordWeight: p.number(600, { min: 300, max: 800, step: 50, label: 'Weight' }),
    wordTracking: p.number(-2, { min: -8, max: 12, step: 0.5, unit: '%', label: 'Tracking' }),
    wordScale: p.number(1, { min: 0.5, max: 1.6, step: 0.01, label: 'Word size', hint: 'Cap height of the wordmark relative to the mark.' }),
  }, { collapsed: true }),
  output: folder('Icon export', {
    iconBg: p.select('paper', ['paper', 'ink', 'transparent'], { label: 'Background', hint: 'Background of the PNG icon set. The 180px Apple touch icon is always opaque.' }),
    iconPad: p.number(0.12, { min: 0, max: 0.3, step: 0.01, label: 'Padding', hint: 'Space around the mark inside each icon.' }),
  }, { collapsed: true }),
})

export const settings = createParams(settingsSchema, {
  id: 'marks',
  presets: [
    { name: 'Mentee', values: { name: 'Mentee', initials: 'MT', ink: '#272727', paper: '#EFEEE8', accent: '#E4572E' } },
    { name: 'Night', values: { ink: '#F1EFE8', paper: '#16181D', accent: '#7DD3FC' } },
    { name: 'Forest', values: { name: 'Fernhill', initials: 'FH', ink: '#1F3B2D', paper: '#F4F1E6', accent: '#D9A441' } },
  ],
})
export type SV = ReturnType<typeof settings.values>

/* --- the document --- */
export interface Mark { id: string; family: FamilyId; v: Record<string, unknown>; locked?: boolean; from?: string }
export interface Doc { marks: Record<string, Mark>; grid: string[]; favs: string[] }

export const uid = () => Math.random().toString(36).slice(2, 9)

export function newMark(family: FamilyId, rng: () => number, randomise = true, from?: string): Mark {
  return { id: uid(), family, v: sampleParams(FAMILY[family], rng, randomise), from }
}

function demoDoc(): Doc {
  const rng = mulberry32(20261009)
  const order: FamilyId[] = ['scribble', 'orbit', 'grid', 'bloom', 'monogram']
  const marks: Mark[] = Array.from({ length: 16 }, (_, i) => newMark(order[i % order.length], rng))
  // a couple of hand-picked starting points, so the first screen already has keepers
  marks[0] = { ...marks[0], v: { ...FAMILY.scribble.params.getState().defaults, loops: 4, chaos: 0.08, wobble: 0.7, drift: 0.2, squash: 0, weight: 3, seed: 2718 } }
  marks[5] = { ...marks[5], v: { ...FAMILY.scribble.params.getState().defaults, loops: 7, chaos: 0.85, wobble: 0.45, drift: 0.8, squash: 0.2, weight: 2.6, seed: 9001 } }
  return { marks: Object.fromEntries(marks.map((m) => [m.id, m])), grid: marks.map((m) => m.id), favs: [marks[0].id, marks[5].id] }
}

const valid = (raw: unknown): raw is Doc => {
  const d = raw as Doc
  return !!d && !!d.marks && Array.isArray(d.grid) && Array.isArray(d.favs) && d.grid.every((id) => d.marks[id] && FAMILY[d.marks[id].family])
}

// `marks` is a record keyed by random ids, so the default shape check (against a fresh demo) always failed and
// every reload threw the user's work away (break-it ST1). Validate the structure instead.
export const doc = createDocStore<Doc>(demoDoc(), { id: 'marks', version: 1, validate: valid })
// A stored doc from an older build (or a different family set) falls back to the demo;
// the pre-kit store kept its doc under `studio:marks:doc` — carry it over once.
{
  let start: unknown = doc.get()
  try {
    const legacy = localStorage.getItem('studio:marks:doc')
    if (legacy) { localStorage.removeItem('studio:marks:doc'); const d = JSON.parse(legacy); if (valid(d)) start = d }
  } catch { /* private mode / bad json */ }
  if (start !== doc.get() || !valid(start)) doc.replace(valid(start) ? start : demoDoc(), { history: false })
}
export const resetDemoDoc = () => doc.set(demoDoc(), { label: 'Restore demo variants' })

/** ⌘Z undoes the last change — to brand settings or to the marks. */
export const history = createHistory([settings, doc])

/* --- view state (not undoable) --- */
export interface UI {
  focus: string | null
  compare: string | null
  cursor: number
  mutations: Mark[]
  bottom: 'ladder' | 'more'
  ladder: boolean
  last: string | null
}
export const ui = createStore<UI>(() => ({ focus: null, compare: null, cursor: 0, mutations: [], bottom: 'ladder', ladder: true, last: null }))

export const colorsOf = (s: SV) => ({ ink: s.ink, paper: s.paper, accent: s.accent, initials: s.initials })
export const markLabel = (m: Mark) => `${FAMILY[m.family].name} #${m.v.seed}`

/* --- keep the focused mark and its family's inspector in sync, both ways --- */
let syncing = false
const focused = () => { const id = ui.getState().focus; return id ? doc.get().marks[id] : undefined }

function pushToInspector() {
  const m = focused()
  if (!m) return
  const fam = FAMILY[m.family]
  const values = { ...(fam.params.getState().defaults as Record<string, unknown>), ...m.v }
  if (equal(values, fam.params.getState().values)) return
  syncing = true
  // the family inspector edits ONE mark: its own undo stack must not reach into another mark
  fam.params.setState({ values, committed: values, past: [], future: [], pastLabels: [], futureLabels: [], compare: null })
  syncing = false
}
ui.subscribe((s, prev) => { if (s.focus !== prev.focus) pushToInspector() })
doc.subscribe((s, prev) => { if (s.doc !== prev.doc) pushToInspector() })

for (const fam of FAMILIES) {
  fam.params.subscribe((s, prev) => {
    if (syncing || s.values === prev.values) return
    const m = focused()
    if (!m || m.family !== fam.id || equal(m.v, s.values)) return
    doc.set((d) => ({ ...d, marks: { ...d.marks, [m.id]: { ...m, v: { ...s.values } } } }), { commit: false })
  })
  fam.params.onCommit((_v, meta) => { if (!syncing && meta.kind === 'edit') doc.commit(meta.label ?? 'Shape') })
}
