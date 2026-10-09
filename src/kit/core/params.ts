/* ---------------------------------------------------------------------------
   The param store. Framework-agnostic on purpose: the harness is React, but
   the artifact can be anything — a vanilla three.js scene, a Canvas 2D loop,
   an iframe. Create it at module level and both sides read the same values:

     export const params = createParams(schema, { id: 'ripple' })

     // React chrome
     const v = useValues(params)

     // any artifact
     params.subscribe((v) => scene.update(v))           // every change, incl. mid-drag
     params.onCommit((v) => rebuildExpensiveThing(v))     // pointer-up only

   Mid-drag changes are not undo steps; the commit on release is. Undo/redo,
   presets, A/B, URL share and localStorage persistence all live here, so
   every shell gets them for free.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { defaultsOf, defIndex, equal, type Schema, type SchemaValues, type Values, type ParamDef } from './schema'

export interface Preset<V> { name: string; values: V; builtin?: boolean }

export interface ParamState<V extends Values> {
  values: V
  defaults: V
  /** the last committed snapshot — the undo anchor */
  committed: V
  past: V[]
  future: V[]
  presets: Preset<V>[]
  /** a stored comparison snapshot for A/B */
  compare: V | null
}

export interface ParamStore<S extends Schema, V extends Values = SchemaValues<S>> extends StoreApi<ParamState<V>> {
  schema: S
  defs: Record<string, ParamDef>
  id: string
  /** current values (non-reactive) */
  values(): V
  setValue<K extends keyof V>(key: K, value: V[K], opts?: { commit?: boolean }): void
  patch(partial: Partial<V>, opts?: { commit?: boolean }): void
  commit(): void
  reset(keys?: (keyof V)[]): void
  undo(): void
  redo(): void
  onCommit(fn: (v: V) => void): () => void
  savePreset(name: string): void
  applyPreset(name: string): void
  deletePreset(name: string): void
  /** swap current values with the A/B slot (first call stores, later calls swap) */
  toggleCompare(): 'stored' | 'swapped'
  clearCompare(): void
  toJSON(opts?: { changedOnly?: boolean }): Partial<V>
  shareURL(): string
  isChanged(key: keyof V): boolean
}

/** What kit components accept: any schema's store. */
export type AnyParams = ParamStore<any, any>

interface Options<V> {
  id: string
  /** remember the last values in localStorage (default true) */
  persist?: boolean
  /** read `#p=` from the URL on load (default true) */
  url?: boolean
  presets?: { name: string; values: Partial<V> }[]
  historyLimit?: number
}

const LS = {
  get<T>(k: string): T | null { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null } catch { return null } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } },
}
const b64 = {
  enc: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
}

export function createParams<S extends Schema>(schema: S, opts: Options<SchemaValues<S>>): ParamStore<S> {
  type V = SchemaValues<S> & Values
  const defaults = defaultsOf(schema) as V
  const defs = defIndex(schema)
  const keyLS = `studio:${opts.id}:values`
  const keyPresets = `studio:${opts.id}:presets`
  const limit = opts.historyLimit ?? 100

  // Only keep keys the schema still knows, so a renamed param never poisons state.
  const sanitize = (src: Partial<V> | null): Partial<V> => {
    const out: Partial<V> = {}
    if (!src) return out
    for (const k of Object.keys(src)) if (k in defaults) (out as Values)[k] = (src as Values)[k]
    return out
  }

  let initial = { ...defaults }
  if (opts.persist !== false) initial = { ...initial, ...sanitize(LS.get<Partial<V>>(keyLS)) }
  if (opts.url !== false && typeof location !== 'undefined') {
    const m = location.hash.match(/[#&]p=([^&]+)/)
    if (m) try { initial = { ...initial, ...sanitize(JSON.parse(b64.dec(m[1]))) } } catch { /* bad link */ }
  }

  const builtin: Preset<V>[] = (opts.presets ?? []).map((pr) => ({ name: pr.name, values: { ...defaults, ...pr.values } as V, builtin: true }))
  const saved = (LS.get<Preset<V>[]>(keyPresets) ?? []).map((pr) => ({ ...pr, values: { ...defaults, ...sanitize(pr.values) } as V }))

  const store = createStore<ParamState<V>>(() => ({
    values: initial,
    defaults,
    committed: initial,
    past: [],
    future: [],
    presets: [...builtin, ...saved],
    compare: null,
  }))

  const commitListeners = new Set<(v: V) => void>()
  const persistUser = () => LS.set(keyPresets, store.getState().presets.filter((p) => !p.builtin))

  const commit = () => {
    const s = store.getState()
    if (equal(s.values, s.committed)) return
    store.setState({ committed: s.values, past: [...s.past, s.committed].slice(-limit), future: [] })
    if (opts.persist !== false) LS.set(keyLS, s.values)
    commitListeners.forEach((fn) => fn(s.values))
  }

  const jump = (values: V) => {
    store.setState({ values, committed: values })
    if (opts.persist !== false) LS.set(keyLS, values)
    commitListeners.forEach((fn) => fn(values))
  }

  const api: ParamStore<S> = Object.assign(store, {
    schema,
    defs,
    id: opts.id,
    values: () => store.getState().values,
    setValue: (key: any, value: any, o: { commit?: boolean } = {}) => {
      store.setState((s) => ({ values: { ...s.values, [key]: value } }))
      if (o.commit !== false) commit()
    },
    patch: (partial: Partial<V>, o: { commit?: boolean } = {}) => {
      store.setState((s) => ({ values: { ...s.values, ...partial } }))
      if (o.commit !== false) commit()
    },
    commit,
    reset: (keys?: (keyof V)[]) => {
      const s = store.getState()
      const next = { ...s.values }
      for (const k of keys ?? (Object.keys(defaults) as (keyof V)[])) (next as Values)[k as string] = structuredClone((defaults as Values)[k as string])
      store.setState({ values: next })
      commit()
    },
    undo: () => {
      const s = store.getState()
      const prev = s.past.at(-1)
      if (!prev) return
      store.setState({ past: s.past.slice(0, -1), future: [s.committed, ...s.future] })
      jump(prev)
    },
    redo: () => {
      const s = store.getState()
      const [next, ...rest] = s.future
      if (!next) return
      store.setState({ future: rest, past: [...s.past, s.committed] })
      jump(next)
    },
    onCommit: (fn: (v: V) => void) => { commitListeners.add(fn); return () => commitListeners.delete(fn) },
    savePreset: (name: string) => {
      const s = store.getState()
      const presets = [...s.presets.filter((p) => p.name !== name || p.builtin), { name, values: s.values }]
      store.setState({ presets })
      persistUser()
    },
    applyPreset: (name: string) => {
      const pr = store.getState().presets.find((p) => p.name === name)
      if (!pr) return
      store.setState({ values: { ...pr.values } })
      commit()
    },
    deletePreset: (name: string) => {
      store.setState((s) => ({ presets: s.presets.filter((p) => p.name !== name || p.builtin) }))
      persistUser()
    },
    toggleCompare: () => {
      const s = store.getState()
      if (!s.compare) { store.setState({ compare: s.values }); return 'stored' as const }
      store.setState({ compare: s.values, values: s.compare })
      commit()
      return 'swapped' as const
    },
    clearCompare: () => store.setState({ compare: null }),
    toJSON: (o: { changedOnly?: boolean } = {}) => {
      const v = store.getState().values
      if (!o.changedOnly) return { ...v }
      const out: Partial<V> = {}
      for (const k of Object.keys(v)) if (!equal((v as Values)[k], (defaults as Values)[k])) (out as Values)[k] = (v as Values)[k]
      return out
    },
    shareURL: () => {
      const changed = api.toJSON({ changedOnly: true })
      const base = location.href.replace(/[#&]p=[^&]*/, '')
      const sep = base.includes('#') ? '&' : '#'
      return `${base}${sep}p=${b64.enc(JSON.stringify(changed))}`
    },
    isChanged: (key: keyof V) => !equal(store.getState().values[key], defaults[key]),
  }) as unknown as ParamStore<S>

  return api
}

/** React: subscribe to all values, or a slice. */
export function useValues<S extends Schema>(store: ParamStore<S>): SchemaValues<S>
export function useValues<S extends Schema, T>(store: ParamStore<S>, pick: (v: SchemaValues<S>) => T): T
export function useValues(store: ParamStore<any>, pick?: (v: any) => any) {
  return useStore(store, (s) => (pick ? pick(s.values) : s.values))
}

export const useParamState = <S extends Schema, T>(store: ParamStore<S>, pick: (s: ParamState<SchemaValues<S>>) => T) =>
  useStore(store, pick as any) as T
