/* Journey — view params, the undoable map document, transient UI state. */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { defineSchema, folder, p, createParams, createCamera, toast } from '@kit'
import { createDocStore, createHistory, useDoc } from '../flows/local/doc-store'
import { LANES, PERSONA_HUES, blankStages, demoDoc, uid, type Card, type JourneyDoc, type LaneId, type Persona, type Stage } from './model'

/* ---------------------------------------------------------------- params */
export const schema = defineSchema({
  view: folder('View', {
    columnWidth: p.number(232, { min: 180, max: 360, step: 4, unit: 'px', label: 'Column width' }),
    density: p.select('comfortable', ['compact', 'comfortable'], { hint: 'Card padding and spacing.' }),
    showTags: p.boolean(true, { label: 'Tags', hint: 'Show #tags on cards.' }),
    showLinks: p.boolean(true, { label: 'Links', hint: 'Draw pain point → opportunity links.' }),
  }),
  lanes: folder('Lanes', {
    visibleLanes: p.multi(LANES.map((l) => l.id), LANES.map((l) => ({ value: l.id, label: l.label, icon: l.icon, hint: l.label })), { label: 'Visible', min: 1 }),
  }),
  curve: folder('Emotion curve', {
    smoothing: p.number(0.75, { min: 0, max: 1, step: 0.05, hint: '0 = straight segments, 1 = smooth Catmull-Rom.' }),
    curveHeight: p.number(150, { min: 100, max: 260, step: 2, unit: 'px', label: 'Height' }),
    fill: p.boolean(true, { label: 'Fill', hint: 'Tint the area above (positive) and below (negative) the neutral line.' }),
    emoji: p.boolean(true, { label: 'Emoji' }),
  }),
})
export const params = createParams(schema, {
  id: 'journey',
  presets: [
    { name: 'Workshop', values: { columnWidth: 248, density: 'comfortable', showTags: true, showLinks: true } },
    { name: 'Executive summary', values: { visibleLanes: ['actions', 'emotion', 'pains', 'opps'], showTags: false, columnWidth: 212, density: 'compact' } },
    { name: 'Service blueprint', values: { visibleLanes: ['actions', 'touchpoints', 'pains', 'owner'], showLinks: false } },
  ],
})
export type V = ReturnType<typeof params.values>

/* ---------------------------------------------------------------- doc */
export const doc = createDocStore<JourneyDoc>(demoDoc(), { id: 'journey', version: 1 })
export const history = createHistory([doc, params])
export const camera = createCamera()
/** Fit, but never magnify past 100% — a small map should not balloon (kit fit has no cap). */
export function fitMap() {
  camera.fit()
  if (camera.getState().zoom > 1) camera.zoomTo(1)
}

/* ---------------------------------------------------------------- ui */
export type Sel = { kind: 'card'; id: string } | { kind: 'stage'; id: string } | null
export interface UI {
  personaId: string
  sel: Sel
  editing: string | null
  filterTag: string | null
  hoverCard: string | null
  /** live drag feedback */
  drop: { lane: LaneId; stage: string; index: number } | null
  stageDrop: number | null
}
export const ui = createStore<UI>(() => ({
  personaId: (() => { try { return localStorage.getItem('studio:journey:persona') || 'maya' } catch { return 'maya' } })(),
  sel: null, editing: null, filterTag: null, hoverCard: null, drop: null, stageDrop: null,
}))
export const useUI = <T,>(pick: (s: UI) => T) => useStore(ui, pick)

export const persona = (): Persona => { const d = doc.get(); return d.personas.find((x) => x.id === ui.getState().personaId) ?? d.personas[0] }
export function usePersona(): Persona {
  const id = useUI((s) => s.personaId)
  return useDoc(doc, (d) => d.personas.find((x) => x.id === id) ?? d.personas[0])
}

/* ---------------------------------------------------------------- mutations */
export function editPersona(fn: (p: Persona) => Persona, o: { commit?: boolean; label?: string } = {}) {
  const id = persona().id
  doc.set((d) => ({ ...d, personas: d.personas.map((x) => (x.id === id ? fn(x) : x)) }), o)
}
export const editCards = (fn: (c: Card[]) => Card[], o?: { commit?: boolean; label?: string }) => editPersona((p) => ({ ...p, cards: fn(p.cards) }), o)
export const editStages = (fn: (s: Stage[]) => Stage[], o?: { commit?: boolean; label?: string }) => editPersona((p) => ({ ...p, stages: fn(p.stages) }), o)
export const updateCard = (id: string, patch: Partial<Card>, o?: { commit?: boolean; label?: string }) => editCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)), o)
export const updateStage = (id: string, patch: Partial<Stage>, o?: { commit?: boolean; label?: string }) => editStages((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)), o)

export const cellCards = (p: Persona, lane: LaneId, stage: string) => p.cards.filter((c) => c.lane === lane && c.stage === stage)

/** Insert/move a card so it is the `index`-th card of (lane, stage). */
export function placeCard(cards: Card[], card: Card, lane: LaneId, stage: string, index: number): Card[] {
  const rest = cards.filter((c) => c.id !== card.id)
  const moved = { ...card, lane, stage }
  const inCell = rest.filter((c) => c.lane === lane && c.stage === stage)
  const anchor = inCell[index]
  if (anchor) { const at = rest.indexOf(anchor); return [...rest.slice(0, at), moved, ...rest.slice(at)] }
  const last = inCell.at(-1)
  if (last) { const at = rest.indexOf(last) + 1; return [...rest.slice(0, at), moved, ...rest.slice(at)] }
  return [...rest, moved]
}

export function moveCard(id: string, lane: LaneId, stage: string, index: number) {
  const c = persona().cards.find((x) => x.id === id)
  if (!c || lane === 'emotion') return
  editCards((cs) => placeCard(cs, c, lane, stage, index), { label: 'Move card' })
}

export function addCard(lane: LaneId, stage: string, index?: number, edit = true) {
  if (lane === 'emotion') return
  const p = persona()
  const card: Card = { id: uid(), lane, stage, text: '', tags: [], ...(lane === 'touchpoints' ? { channel: 'app' } : {}), ...(lane === 'pains' || lane === 'opps' ? { level: 2 } : {}), ...(lane === 'owner' ? { team: 'Product — app', text: 'Product — app' } : {}) }
  editCards((cs) => placeCard([...cs, card], card, lane, stage, index ?? cellCards(p, lane, stage).length), { label: 'Add card' })
  ui.setState({ sel: { kind: 'card', id: card.id }, editing: edit && lane !== 'owner' ? card.id : null })
  return card
}

export function deleteSelection() {
  const s = ui.getState().sel
  if (!s) return
  if (s.kind === 'card') {
    editCards((cs) => cs.filter((c) => c.id !== s.id).map((c) => (c.links?.includes(s.id) ? { ...c, links: c.links.filter((l) => l !== s.id) } : c)), { label: 'Delete card' })
  } else {
    const p = persona()
    if (p.stages.length <= 1) { toast('A journey needs at least one stage'); return }
    const name = p.stages.find((x) => x.id === s.id)?.name
    editPersona((x) => ({ ...x, stages: x.stages.filter((st) => st.id !== s.id), cards: x.cards.filter((c) => c.stage !== s.id) }), { label: 'Delete stage' })
    toast(`Deleted “${name}”`, { action: { label: 'Undo', onClick: () => history.undo() } })
  }
  ui.setState({ sel: null, editing: null })
}

export function duplicateCard() {
  const s = ui.getState().sel
  if (s?.kind !== 'card') return
  const c = persona().cards.find((x) => x.id === s.id)
  if (!c) return
  const p = persona()
  const copy = { ...c, id: uid(), links: c.links ? [...c.links] : undefined }
  const i = cellCards(p, c.lane, c.stage).findIndex((x) => x.id === c.id)
  editCards((cs) => placeCard([...cs, copy], copy, c.lane, c.stage, i + 1), { label: 'Duplicate card' })
  ui.setState({ sel: { kind: 'card', id: copy.id } })
}

/** ⌥← ⌥→ move the card one stage; ⌥↑ ⌥↓ reorder inside its cell. */
export function nudgeCard(dx: number, dy: number) {
  const s = ui.getState().sel
  const p = persona()
  if (s?.kind === 'stage') { if (dx) moveStage(s.id, dx); return }
  if (s?.kind !== 'card') return
  const c = p.cards.find((x) => x.id === s.id)
  if (!c) return
  if (dx) {
    const i = p.stages.findIndex((x) => x.id === c.stage) + dx
    if (i < 0 || i >= p.stages.length) return
    const target = p.stages[i].id
    editCards((cs) => placeCard(cs, c, c.lane, target, cellCards(p, c.lane, target).length), { label: 'Move card' })
  } else {
    const cell = cellCards(p, c.lane, c.stage)
    const i = cell.findIndex((x) => x.id === c.id) + dy
    if (i < 0 || i >= cell.length) return
    editCards((cs) => placeCard(cs, c, c.lane, c.stage, i), { label: 'Reorder card' })
  }
}

export function addStage(at?: number) {
  const p = persona()
  const st: Stage = { id: uid('s'), name: `Stage ${p.stages.length + 1}`, goal: '', duration: '', emotion: 0, feeling: '' }
  const i = at ?? p.stages.length
  editStages((ss) => [...ss.slice(0, i), st, ...ss.slice(i)], { label: 'Add stage' })
  ui.setState({ sel: { kind: 'stage', id: st.id } })
  return st
}
export function moveStage(id: string, by: number) {
  const ss = persona().stages
  const i = ss.findIndex((s) => s.id === id)
  const j = i + by
  if (i < 0 || j < 0 || j >= ss.length) return
  reorderStage(id, j > i ? j + 1 : j)
}
/** Drop stage `id` before position `to` (0…n). */
export function reorderStage(id: string, to: number) {
  editStages((ss) => {
    const i = ss.findIndex((s) => s.id === id)
    if (i < 0) return ss
    const s = ss[i]
    const rest = ss.filter((x) => x.id !== id)
    const k = to > i ? to - 1 : to
    if (k === i) return ss
    return [...rest.slice(0, k), s, ...rest.slice(k)]
  }, { label: 'Reorder stage' })
}

/* links: an opportunity answers pain points */
export function toggleLink(oppId: string, painId: string) {
  editCards((cs) => cs.map((c) => (c.id === oppId ? { ...c, links: c.links?.includes(painId) ? c.links.filter((l) => l !== painId) : [...(c.links ?? []), painId] } : c)), { label: 'Link' })
}

/* personas */
export function switchPersona(id: string) {
  ui.setState({ personaId: id, sel: null, editing: null, filterTag: null })
  try { localStorage.setItem('studio:journey:persona', id) } catch { /* noop */ }
  requestAnimationFrame(fitMap)
}
export function addPersona() {
  const d = doc.get()
  const id = uid('per')
  const pr: Persona = { id, name: 'New persona', role: 'Who are they?', age: 30, hue: PERSONA_HUES[d.personas.length % PERSONA_HUES.length], quote: '', goals: [], frustrations: [], scenario: '', stages: [], cards: [] }
  doc.set({ ...d, personas: [...d.personas, pr] }, { label: 'Add persona' })
  switchPersona(id)
}
export function duplicatePersona(id: string) {
  const d = doc.get()
  const src = d.personas.find((x) => x.id === id)
  if (!src) return
  const pid = uid('per')
  const map = new Map<string, string>()
  const stages = src.stages.map((s) => { const n = uid('s'); map.set(s.id, n); return { ...s, id: n } })
  const cards = src.cards.map((c) => { const n = uid(); map.set(c.id, n); return { ...c, id: n } })
  const fixed = cards.map((c) => ({ ...c, stage: map.get(c.stage)!, links: c.links?.map((l) => map.get(l)!).filter(Boolean) }))
  doc.set({ ...d, personas: [...d.personas, { ...src, id: pid, name: `${src.name} (copy)`, stages, cards: fixed }] }, { label: 'Duplicate persona' })
  switchPersona(pid)
}
export function deletePersona(id: string) {
  const d = doc.get()
  if (d.personas.length <= 1) { toast('Keep at least one persona'); return }
  const name = d.personas.find((x) => x.id === id)?.name
  doc.set({ ...d, personas: d.personas.filter((x) => x.id !== id) }, { label: 'Delete persona' })
  if (ui.getState().personaId === id) switchPersona(doc.get().personas[0].id)
  toast(`Deleted ${name}`, { action: { label: 'Undo', onClick: () => history.undo() } })
}
export function startFromTemplate() {
  editPersona((p) => ({ ...p, stages: blankStages(uid('t')) }), { label: 'Add stages' })
  requestAnimationFrame(fitMap)
}
export function resetDemo() {
  doc.replace(demoDoc(), { history: false })
  params.reset()
  history.clear()
  switchPersona('maya')
}

export const allTags = (p: Persona) => {
  const m = new Map<string, number>()
  for (const c of p.cards) for (const t of c.tags) m.set(t, (m.get(t) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
