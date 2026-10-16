/* Marks — model: brand settings (params), the variant document (with history), view state. */
import { createStore } from 'zustand/vanilla'
import { defineSchema, folder, p, createParams, createDocStore, createHistory, equal } from '@kit'
import { FAMILIES, FAMILY, mulberry32, sampleParams, type FamilyId } from './families'

export const settingsSchema = defineSchema({
  brand: folder('Brand', {
    name: p.text('Agalla', { label: 'Wordmark', hint: 'Set beside the mark in lockups and in the browser-tab preview.' }),
    initials: p.text('AG', { maxLength: 3, hint: 'Letters for the monogram family — up to three.' }),
    ink: p.color('#171615', { alpha: false }),
    paper: p.color('#F5F3F2', { alpha: false }),
    accent: p.color('#F6571C', { alpha: false, hint: 'Used sparingly: orbit planets, grid accents, bloom cores.' }),
  }),
  explore: folder('Explore', {
    families: p.multi(FAMILIES.map((f) => f.id), FAMILIES.map((f) => ({ value: f.id, label: f.name, icon: f.icon })), { min: 1, label: 'Families', hint: 'Which families a reroll draws from.' }),
    count: p.select('16', ['12', '16', '20', '24'], { label: 'Variants' }), // label = COUNT_LABEL below
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
  version: 2, // v2: the demo's clients (src/demo/clients.ts); v1 was "Mentee"
  presets: [
    { name: 'Agalla', values: { name: 'Agalla', initials: 'AG', ink: '#171615', paper: '#F5F3F2', accent: '#F6571C' } },
    { name: 'Night', values: { ink: '#F5F3F2', paper: '#171615', accent: '#FF6A2C' } },
    { name: 'Gabinete', values: { name: 'Gabinete', initials: 'G', ink: '#171615', paper: '#F5F3F2', accent: '#5070F0' } },
    { name: 'Campana', values: { name: 'Campana', initials: 'C', ink: '#F5F3F2', paper: '#6E1A3E', accent: '#FFD000' } },
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
export const doc = createDocStore<Doc>(demoDoc(), {
  id: 'marks', version: 1, validate: valid,
  // the pre-kit store kept its doc under `studio:marks:doc`; carried over once (and removed) if it still fits
  legacyKeys: ['studio:marks:doc'], migrate: (raw) => (valid(raw) ? raw : null),
})
export const resetDemoDoc = () => doc.set(demoDoc(), { label: 'Restore demo variants' })

/** ⌘Z undoes the last change — to brand settings or to the marks. */
export const history = createHistory([settings, doc])

/* One Variants change is one undo step. The setting lives in `settings` and the grid it sizes in `doc`, two
   stores with their own steps: the grid resize (COUNT_STEP, committed right after the setting by fitCount)
   is chained to the setting step, so ⌘Z / ⇧⌘Z never leave the control saying 12 over a grid of 16. */
export const COUNT_STEP = 'Variant count'
const SETTINGS = 0, DOC = 1
const COUNT_LABEL = 'Variants' // the `count` param's label: the step name createParams gives a change to it
const isCountSetting = (step?: { source: number; label: string }) => step?.source === SETTINGS && step.label === COUNT_LABEL
const isCountResize = (step?: { source: number; label: string }) => step?.source === DOC && step.label === COUNT_STEP
{
  const undo = history.undo, redo = history.redo
  history.undo = () => {
    const resize = isCountResize(history.getState().past.at(-1))
    const label = undo()
    if (resize && isCountSetting(history.getState().past.at(-1))) return undo()
    return label
  }
  history.redo = () => {
    const setting = isCountSetting(history.getState().future[0])
    const label = redo()
    if (setting && isCountResize(history.getState().future[0])) redo()
    return label
  }
}

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
