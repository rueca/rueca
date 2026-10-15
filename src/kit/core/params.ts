/* ---------------------------------------------------------------------------
   The param store. Framework-agnostic on purpose: the harness is React, but
   the artifact can be anything — a vanilla three.js scene, a Canvas 2D loop,
   an iframe. Create it at module level and both sides read the same values:

     export const params = createParams(schema, { id: 'ripple' })

     // React chrome
     const v = useValues(params)

     // any artifact
     params.subscribe((s) => scene.update(s.values))     // every change, incl. mid-drag
     params.onCommit((v) => rebuildExpensiveThing(v))    // pointer-up only

   Mid-drag changes are not undo steps; the commit on release is. Undo/redo,
   presets, A/B, URL share and localStorage persistence all live here, so
   every shell gets them for free.

   Document state that isn't a tunable value (a layer stack, clips, rows)
   either lives in a hidden `p.data()` param here, or in a `createDocStore`
   joined to these params by `createHistory([params, doc])`.
--------------------------------------------------------------------------- */
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { coerce, defaultsOf, defIndex, equal, humanize, isValueDef, type Schema, type SchemaValues, type Values, type ParamDef } from './schema'

export interface Preset<V> {
  name: string
  values: Partial<V>
  builtin?: boolean
  /** merge (default) applies only the listed keys; replace resets everything else to defaults */
  mode?: 'merge' | 'replace'
}

export interface ParamState<V extends Values> {
  values: V
  defaults: V
  /** the last committed snapshot — the undo anchor */
  committed: V
  past: V[]
  future: V[]
  /** labels parallel to past/future, for a History panel */
  pastLabels: string[]
  futureLabels: string[]
  presets: Preset<V>[]
  /** a stored comparison snapshot for A/B */
  compare: V | null
}

/** Why a commit happened — history coordinators ignore undo/redo replays. */
export interface CommitMeta { label?: string; kind: 'edit' | 'undo' | 'redo' | 'replace' }

export interface ParamStore<S extends Schema, V extends Values = SchemaValues<S>> extends StoreApi<ParamState<V>> {
  schema: S
  defs: Record<string, ParamDef>
  id: string
  /** the schema version (ParamOptions.version, default 1) — what share links carry as $v */
  version: number
  /** current values (non-reactive) */
  values(): V
  setValue<K extends keyof V>(key: K, value: V[K], opts?: { commit?: boolean; label?: string }): void
  patch(partial: Partial<V>, opts?: { commit?: boolean; label?: string }): void
  commit(label?: string): void
  /** swap values without an undo step (load, import, sync from elsewhere) */
  replace(values: Partial<V>, opts?: { history?: boolean; label?: string }): void
  reset(keys?: (keyof V)[]): void
  undo(): string | undefined
  redo(): string | undefined
  canUndo(): boolean
  canRedo(): boolean
  onCommit(fn: (v: V, meta: CommitMeta) => void): () => void
  /** save a preset; `keys` limits it to part of the schema (default: the store's presetKeys, else all shareable values) */
  /** saves the current values; returns the name actually used (a clash with a built-in gets "Name 2") */
  savePreset(name: string, opts?: { keys?: (keyof V)[] }): string
  applyPreset(name: string): void
  deletePreset(name: string): void
  /** the preset whose keys all match the current values, if any */
  activePreset(): Preset<V> | undefined
  /** swap current values with the A/B slot (first call stores, later calls swap) */
  toggleCompare(): 'stored' | 'swapped'
  clearCompare(): void
  toJSON(opts?: { changedOnly?: boolean; shareable?: boolean }): Partial<V>
  shareURL(): string
  isChanged(key: keyof V): boolean
}

/** What kit components accept: any schema's store. */
export type AnyParams = ParamStore<any, any>

export interface ParamOptions<V> {
  id: string
  /** remember the last values in localStorage (default true) */
  persist?: boolean
  /** bump when the schema's shape changes so stale saved values (and old links) are ignored… */
  version?: number
  /** …or carried forward: turn values saved / linked under an older `version` into this one's
      (rename keys, rescale numbers). Return null to drop them. The result is validated like any input.
        migrate: (old, from) => from === 1 ? { ...old, band: old.weight } : old */
  migrate?: (old: Record<string, unknown>, fromVersion: number) => Partial<V> | Record<string, unknown> | null
  /** read `#p=` from the URL on load (default true) */
  url?: boolean
  presets?: { name: string; values: Partial<V>; mode?: 'merge' | 'replace' }[]
  /** which keys a saved preset captures (e.g. only the "look" folders, not canvas size) */
  presetKeys?: (keyof V)[]
  historyLimit?: number
}

/** One storage-failure notice per page (shared with doc stores), re-armed after a successful write. */
export const storageWarned = { quota: false }
const warned = storageWarned
const LS = {
  get<T>(k: string): T | null { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null } catch { return null } },
  set(k: string, v: unknown) {
    try { localStorage.setItem(k, JSON.stringify(v)); warned.quota = false } catch (e) {
      // Quota or private mode. Say so once — silent failure means "my settings vanished".
      if (!warned.quota && typeof window !== 'undefined') {
        warned.quota = true
        window.dispatchEvent(new CustomEvent('studio:storage-error', { detail: { key: k, error: String(e) } }))
      }
    }
  },
}
/** short stable hash (FNV-1a) — identifies a share link without storing it */
const hash = (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36) }

const b64 = {
  enc: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
}

const liveIds = new Set<string>()

/** Run `fn` once the page has painted a few frames without long stalls (immediately where there are no frames). */
function afterHealthyFrames(fn: () => void, frames = 4) {
  if (typeof requestAnimationFrame === 'undefined' || typeof document === 'undefined') return fn()
  let last = -1, healthy = 0, tries = 0
  const step = (t: number) => {
    healthy = last >= 0 && t - last < 250 ? healthy + 1 : 0
    last = t
    if (healthy >= frames) fn()
    else if (++tries < 2000) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function createParams<S extends Schema>(schema: S, opts: ParamOptions<SchemaValues<S>>): ParamStore<S> {
  {
    // Same checks as defineSchema, for schemas built by hand (break-it DX16).
    const seen = new Set<string>()
    for (const f of Object.values(schema)) for (const k of Object.keys(f.params)) {
      if (seen.has(k)) throw new Error(`createParams("${opts.id}"): duplicate key "${k}" — keys are flat across folders`)
      seen.add(k)
    }
    const isDev = (import.meta as any).env?.DEV
    if (isDev && opts.persist !== false && liveIds.has(opts.id) && !opts.id.startsWith('item:'))
      console.warn(`[studio] two param stores share the id "${opts.id}" — they will overwrite each other's saved values. Give each a unique id.`)
    liveIds.add(opts.id)
  }
  type V = SchemaValues<S> & Values
  const defaults = defaultsOf(schema) as V
  const defs = defIndex(schema)
  const suffix = opts.version ? `:v${opts.version}` : ''
  const keyLS = `studio:${opts.id}:values${suffix}`
  // Presets are sanitized key by key on load, so they survive schema bumps: one unversioned key (ST4).
  const keyPresets = `studio:${opts.id}:presets`
  const limit = opts.historyLimit ?? 100

  const flag = (k: string, f: 'persist' | 'share') => { const d = defs[k] as any; return !d || d[f] !== false }
  const pick = (v: Values, f: 'persist' | 'share') => Object.fromEntries(Object.entries(v).filter(([k]) => flag(k, f)))
  const labelOf = (k: string) => { const d = defs[k] as any; return d?.label ?? humanize(k) }

  const dev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV
  const warn = (msg: string) => { if (dev) console.warn(`[studio] ${opts.id}: ${msg}`) }
  // Only keep keys the schema knows, and only values that fit their def — a renamed param,
  // a hand-edited share link or a framed page sending "30" for a number never poisons state.
  const sanitize = (src: Partial<V> | null | undefined, from = 'input'): Partial<V> => {
    const out: Partial<V> = {}
    if (!src || typeof src !== 'object' || Array.isArray(src)) return out
    for (const k of Object.keys(src)) {
      const def = defs[k]
      if (!def || !isValueDef(def)) { warn(`ignored unknown key "${k}" from ${from}`); continue }
      const r = coerce(def, (src as Values)[k])
      if (r.ok) (out as Values)[k] = r.value
      else warn(`rejected "${k}" from ${from}: ${r.reason}`)
    }
    return out
  }

  // A schema whose own defaults don't validate is a bug in the schema — say so loudly in dev.
  if (dev) for (const [k, d] of Object.entries(defs)) {
    if (!isValueDef(d)) continue
    const r = coerce(d, (defaults as Values)[k])
    if (!r.ok) console.error(`[studio] ${opts.id}: default for "${k}" does not fit its ${d.type} def — ${r.reason}`)
  }

  const current = opts.version ?? 1
  // Values from an older version: only through `migrate` (a bump means the meaning changed). Links and storage alike.
  const upgrade = (raw: Record<string, unknown>, from: number): Record<string, unknown> | null => {
    if (from === current) return raw
    if (!opts.migrate || from > current) return null
    try { return (opts.migrate({ ...raw }, from) as Record<string, unknown> | null) ?? null } catch (e) { warn(`migrate from v${from} threw: ${e}`); return null }
  }
  let initial = { ...defaults }
  if (opts.persist !== false) {
    let saved = LS.get<Record<string, unknown>>(keyLS)
    if (saved === null && opts.migrate) for (let v = current - 1; v >= 1 && saved === null; v--) {
      // version 1 may have been saved before `version` was set at all (no suffix)
      const old = LS.get<Record<string, unknown>>(`studio:${opts.id}:values:v${v}`) ?? (v === 1 ? LS.get<Record<string, unknown>>(`studio:${opts.id}:values`) : null)
      if (old && typeof old === 'object') { saved = upgrade(old, v); if (saved) LS.set(keyLS, pick(sanitize(saved as Partial<V>, `saved v${v} values`) as Values, 'persist')) }
    }
    initial = { ...initial, ...sanitize(saved as Partial<V>, 'localStorage') }
  }
  let linkApplied = false
  let beforeLink: V | null = null
  /** every shareable value at its default — what a link's omitted keys mean */
  const linkBase = () => pick(defaults as Values, 'share') as Partial<V>
  let markSeen = () => {}
  if (opts.url !== false && typeof location !== 'undefined') {
    const m = location.hash.match(/[#&]p=([^&]+)/)
    // A link applies ONCE per tab: reloading after tweaking must keep the tweaks (break-it S5).
    const seenKey = `studio:link:${opts.id}:${m ? hash(m[1]) : ''}`
    let seen = false
    try { seen = !!m && sessionStorage.getItem(seenKey) === '1' } catch { /* noop */ }
    if (m && !seen) try {
      let raw = JSON.parse(b64.dec(m[1])) as Record<string, unknown>
      // Links carry the schema version they were made with ($v; links from before this existed count as 1).
      // A link from another version could mean something else entirely (a renamed or re-scaled param), so it
      // is ignored, not half-applied — the page opens with the saved settings and says why.
      const linkVersion = typeof raw?.$v === 'number' ? raw.$v : 1
      if (raw) delete raw.$v
      const up = upgrade(raw, linkVersion)
      if (!up) {
        try { sessionStorage.setItem(seenKey, '1') } catch { /* noop */ }
        if (typeof window !== 'undefined') queueMicrotask(() => window.dispatchEvent(new CustomEvent('studio:link-ignored', { detail: { id: opts.id, linkVersion, version: current } })))
        throw new Error('version')
      }
      raw = up
      // keys marked share:false (images, private data) can never arrive by link
      for (const k of Object.keys(raw ?? {})) if (!flag(k, 'share')) { delete raw[k]; warn(`ignored "${k}" from share link (share: false)`) }
      // A link is the WHOLE shared design: shareable knobs it leaves out are at their defaults, not at whatever this
      // browser saved (client-view C4). The values from before the link stay one Undo away (C5).
      beforeLink = initial
      initial = { ...initial, ...linkBase(), ...sanitize(raw as Partial<V>, 'share link') }
      linkApplied = true
      markSeen = () => { try { sessionStorage.setItem(seenKey, '1') } catch { /* noop */ } }
    } catch (e) { if ((e as Error)?.message !== 'version') warn('ignored an unreadable share link') }
  }

  const builtin: Preset<V>[] = (opts.presets ?? []).map((pr) => ({ name: pr.name, values: sanitize(pr.values), mode: pr.mode, builtin: true }))
  let rawSaved = LS.get<unknown>(keyPresets)
  if (rawSaved === null) for (let v = opts.version ?? 0; v >= 1; v--) {
    const old = `studio:${opts.id}:presets:v${v}`, found = LS.get<unknown>(old)
    if (found !== null) { rawSaved = found; LS.set(keyPresets, found); try { localStorage.removeItem(old) } catch { /* noop */ } break }
  }
  const saved = (Array.isArray(rawSaved) ? rawSaved : [])
    .filter((pr): pr is Preset<V> => !!pr && typeof pr === 'object' && typeof (pr as Preset<V>).name === 'string')
    .map((pr) => ({ name: pr.name, mode: pr.mode === 'replace' ? 'replace' as const : 'merge' as const, values: sanitize(pr.values, 'saved preset') }))

  const store = createStore<ParamState<V>>(() => ({
    values: initial,
    defaults,
    committed: initial,
    // undo back to what THIS browser had — not to bare defaults nobody chose (client-view N4)
    past: beforeLink && !equal(beforeLink, initial) && !equal(beforeLink, defaults) ? [beforeLink] : [],
    future: [],
    pastLabels: beforeLink && !equal(beforeLink, initial) && !equal(beforeLink, defaults) ? ['Open link'] : [],
    futureLabels: [],
    presets: [...builtin, ...saved],
    compare: null,
  }))
  // A link's values become the saved values, or a plain reload (which skips the already-seen link) would fall
  // back to the old ones (break-it ST2) — but only once the page has drawn a few healthy frames: a hostile link (count: 3e9) that hangs the
  // artwork is then never saved, so opening the tool without it recovers (break-it B5-03).
  if (linkApplied) afterHealthyFrames(() => {
    markSeen()
    if (opts.persist !== false) LS.set(keyLS, pick(store.getState().values as Values, 'persist'))
  })

  const commitListeners = new Set<(v: V, meta: CommitMeta) => void>()
  let lastPreset: string | undefined
  const emit = (v: V, meta: CommitMeta) => commitListeners.forEach((fn) => fn(v, meta))
  // Another tab saved: adopt its values (when we're not mid-edit) so the two don't clobber each other (S7).
  if (typeof window !== 'undefined' && opts.persist !== false) window.addEventListener('storage', (e) => {
    if (e.key !== keyLS || !e.newValue) return
    try {
      const s = store.getState()
      if (!equal(s.values, s.committed)) return
      const next = { ...s.values, ...sanitize(JSON.parse(e.newValue), 'another tab') } as V
      if (equal(next, s.values)) return
      store.setState({ values: next, committed: next })
      emit(next, { kind: 'replace', label: 'Another tab' })
    } catch { /* ignore */ }
  })
  const persistUser = () => LS.set(keyPresets, store.getState().presets.filter((p) => !p.builtin))
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let pendingSave: V | null = null
  const writeNow = () => { if (pendingSave) { LS.set(keyLS, pick(pendingSave, 'persist')); pendingSave = null } }
  const save = (v: V) => {
    if (opts.persist === false) return
    pendingSave = v
    clearTimeout(saveTimer)
    saveTimer = setTimeout(writeNow, 120)
  }
  if (typeof window !== 'undefined' && opts.persist !== false) {
    // an edit followed by an immediate reload / tab close must not be lost (break-it S6)
    window.addEventListener('pagehide', writeNow)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') writeNow() })
  }

  const describe = (prev: V, next: V) => {
    const changed = Object.keys(next).filter((k) => !equal((prev as Values)[k], (next as Values)[k]))
    if (!changed.length) return 'Edit'
    if (changed.length === 1) return labelOf(changed[0])
    if (changed.length <= 3) return changed.map(labelOf).join(', ')
    return `${changed.length} values`
  }

  const commit = (label?: string) => {
    const s = store.getState()
    if (equal(s.values, s.committed)) return
    const l = label ?? describe(s.committed, s.values)
    store.setState({
      committed: s.values,
      past: [...s.past, s.committed].slice(-limit),
      pastLabels: [...s.pastLabels, l].slice(-limit),
      future: [],
      futureLabels: [],
    })
    save(s.values)
    emit(s.values, { label: l, kind: 'edit' })
  }

  const jump = (values: V, meta: CommitMeta) => {
    store.setState({ values, committed: values })
    save(values)
    emit(values, meta)
  }

  const apply = (pr: Preset<V>) => {
    const s = store.getState()
    const base = pr.mode === 'replace' ? defaults : s.values
    store.setState({ values: { ...base, ...structuredClone(pr.values) } as V })
    commit(`Preset: ${pr.name}`)
  }

  const api: ParamStore<S> = Object.assign(store, {
    schema,
    defs,
    id: opts.id,
    version: opts.version ?? 1,
    values: () => store.getState().values,
    setValue: (key: any, value: any, o: { commit?: boolean; label?: string } = {}) => {
      const clean = sanitize({ [key]: value } as Partial<V>, 'setValue')
      if (!(key in clean)) return
      store.setState((s) => ({ values: { ...s.values, ...clean } }))
      if (o.commit !== false) commit(o.label)
    },
    patch: (partial: Partial<V>, o: { commit?: boolean; label?: string } = {}) => {
      const clean = sanitize(partial, 'patch')
      if (!Object.keys(clean).length) return
      store.setState((s) => ({ values: { ...s.values, ...clean } }))
      if (o.commit !== false) commit(o.label)
    },
    commit,
    replace: (values: Partial<V>, o: { history?: boolean; label?: string } = {}) => {
      const next = { ...store.getState().values, ...sanitize(values, 'replace') } as V
      if (o.history === false) {
        store.setState({ values: next, committed: next })
        save(next)
        emit(next, { kind: 'replace', label: o.label })
      } else {
        store.setState({ values: next })
        commit(o.label)
      }
    },
    reset: (keys?: (keyof V)[]) => {
      const s = store.getState()
      const next = { ...s.values }
      for (const k of keys ?? (Object.keys(defaults) as (keyof V)[])) (next as Values)[k as string] = structuredClone((defaults as Values)[k as string])
      store.setState({ values: next })
      commit(keys?.length === 1 ? `Reset ${labelOf(keys[0] as string)}` : 'Reset')
    },
    undo: () => {
      const s = store.getState()
      if (!equal(s.values, s.committed)) commit()
      const st = store.getState()
      const prev = st.past.at(-1)
      if (!prev) return undefined
      const label = st.pastLabels.at(-1)
      store.setState({
        past: st.past.slice(0, -1), pastLabels: st.pastLabels.slice(0, -1),
        future: [st.committed, ...st.future], futureLabels: [label ?? 'Edit', ...st.futureLabels],
      })
      jump(prev, { kind: 'undo', label })
      return label
    },
    redo: () => {
      const s = store.getState()
      const [next, ...rest] = s.future
      if (!next) return undefined
      const [label, ...restLabels] = s.futureLabels
      store.setState({ future: rest, futureLabels: restLabels, past: [...s.past, s.committed], pastLabels: [...s.pastLabels, label ?? 'Edit'] })
      jump(next, { kind: 'redo', label })
      return label
    },
    canUndo: () => store.getState().past.length > 0,
    canRedo: () => store.getState().future.length > 0,
    onCommit: (fn: (v: V, meta: CommitMeta) => void) => { commitListeners.add(fn); return () => { commitListeners.delete(fn) } },
    savePreset: (name: string, o: { keys?: (keyof V)[] } = {}) => {
      const s = store.getState()
      const keys = (o.keys ?? opts.presetKeys ?? (Object.keys(s.values).filter((k) => flag(k, 'share') && isValueDef(defs[k]) && defs[k].type !== 'data') as (keyof V)[])) as string[]
      const values = Object.fromEntries(keys.map((k) => [k, structuredClone((s.values as Values)[k])])) as Partial<V>
      // a built-in's name would make the user's copy unreachable — presets apply by name (break-it V12)
      let final = name.trim() || 'Preset'
      for (let i = 2; s.presets.some((p) => p.builtin && p.name === final); i++) final = `${name.trim()} ${i}`
      const presets = [...s.presets.filter((p) => p.name !== final || p.builtin), { name: final, values, mode: 'merge' as const }]
      lastPreset = final
      store.setState({ presets })
      persistUser()
      return final
    },
    applyPreset: (name: string) => {
      const pr = store.getState().presets.find((p) => p.name === name)
      if (pr) { lastPreset = pr.name; apply(pr) }
    },
    deletePreset: (name: string) => {
      store.setState((s) => ({ presets: s.presets.filter((p) => p.name !== name || p.builtin) }))
      persistUser()
    },
    activePreset: () => {
      const s = store.getState()
      // Two presets can match the same values (a user copy of "Calm"); the one last applied or saved wins (break-it V13)
      const matches = (p: Preset<V>) => {
        const keys = Object.keys(p.values)
        if (!keys.length) return false
        const base = p.mode === 'replace' ? { ...defaults, ...p.values } : p.values
        return Object.keys(base).every((k) => equal((s.values as Values)[k], (base as Values)[k]))
      }
      return s.presets.find((p) => p.name === lastPreset && matches(p)) ?? s.presets.find(matches)
    },
    toggleCompare: () => {
      const s = store.getState()
      if (!s.compare) { store.setState({ compare: s.values }); return 'stored' as const }
      store.setState({ compare: s.values, values: s.compare })
      commit('Swap A / B')
      return 'swapped' as const
    },
    clearCompare: () => store.setState({ compare: null }),
    toJSON: (o: { changedOnly?: boolean; shareable?: boolean } = {}) => {
      const v = store.getState().values as Values
      const out: Values = {}
      for (const k of Object.keys(v)) {
        if (o.shareable && !flag(k, 'share')) continue
        if (o.changedOnly && equal(v[k], (defaults as Values)[k])) continue
        out[k] = v[k]
      }
      return out as Partial<V>
    },
    shareURL: () => {
      const changed = api.toJSON({ changedOnly: true, shareable: true })
      // Drop the old p= but keep the hash and its other flags: `#p=X&client` → `#client` (not `/&client`, which
      // a static host serves as a 404 path — install test i1).
      const base = location.href.replace(/([#&])p=[^&]*/, (_m, c) => (c === '#' ? '#' : '')).replace('#&', '#')
      const sep = base.endsWith('#') ? '' : base.includes('#') ? '&' : '#'
      return `${base}${sep}p=${b64.enc(JSON.stringify({ $v: opts.version ?? 1, ...changed }))}`
    },
    isChanged: (key: keyof V) => !equal(store.getState().values[key], defaults[key]),
  }) as unknown as ParamStore<S>

  // A new link pasted into an open tab (hash-only navigation) applies at once, as one undoable step (ST3).
  if (opts.url !== false && typeof window !== 'undefined') window.addEventListener('hashchange', () => {
    const m = location.hash.match(/[#&]p=([^&]+)/)
    if (!m) return
    const seenKey = `studio:link:${opts.id}:${hash(m[1])}`
    try { if (sessionStorage.getItem(seenKey) === '1') return; sessionStorage.setItem(seenKey, '1') } catch { /* noop */ }
    try {
      let raw = JSON.parse(b64.dec(m[1])) as Record<string, unknown>
      const linkVersion = typeof raw?.$v === 'number' ? raw.$v : 1
      if (raw) delete raw.$v
      const up = upgrade(raw, linkVersion)
      if (!up) { window.dispatchEvent(new CustomEvent('studio:link-ignored', { detail: { id: opts.id, linkVersion, version: current } })); return }
      raw = up
      for (const k of Object.keys(raw ?? {})) if (!flag(k, 'share')) delete raw[k]
      const vals = sanitize(raw as Partial<V>, 'share link')
      if (Object.keys(vals).length) api.patch({ ...linkBase(), ...vals } as Partial<V>, { label: 'Open link' })
    } catch { warn('ignored an unreadable share link') }
  })

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

/* ---------------------------------------------------------------------------
   Item params — point an <Inspector> at ONE item inside a collection (a layer
   in a stack, a node in a graph, a fill in a fills list). Each item TYPE gets
   a small non-persisted store; bindItem syncs it both ways with whichever item
   is selected. Drags write through uncommitted; the item's commit becomes ONE
   step on the owner (a params store or a doc store).

     const warp = createItemParams(warpSchema, 'warp')
     useEffect(() => bindItem(warp, {
       read: () => layerById(sel)?.params ?? null,
       write: (v) => setLayerParams(sel, v, { commit: false }),
       commit: (label) => params.commit(label),
       subscribe: (fn) => params.subscribe(fn),   // re-read on outside changes (undo)
     }), [sel])
     <Inspector params={warp} />
   (After shader/local/itemParams.ts and nodes/graph/nodeParams.ts.)
--------------------------------------------------------------------------- */
export function createItemParams<S extends Schema>(schema: S, id: string): ParamStore<S> {
  return createParams(schema, { id: `item:${id}`, persist: false, url: false })
}

export function bindItem(
  item: AnyParams,
  b: { read: () => Record<string, unknown> | null; write: (v: Record<string, unknown>) => void; commit: (label?: string) => void; subscribe: (fn: () => void) => () => void },
): () => void {
  let syncing = false
  let orphan = false
  const pull = () => {
    const src = b.read()
    // The bound item is gone (deleted, deselected): stop writing through to it (break-it DX9).
    orphan = !src
    if (!src) return
    const next = { ...item.getState().defaults, ...src }
    if (equal(next, item.getState().values)) return
    syncing = true
    item.setState({ values: next, committed: next, past: [], future: [], pastLabels: [], futureLabels: [] })
    syncing = false
  }
  pull()
  const offOwner = b.subscribe(pull)
  const offItem = item.subscribe((s, prev) => {
    if (syncing || orphan || s.values === prev.values) return
    b.write(s.values as Record<string, unknown>)
  })
  const offCommit = item.onCommit((_v, meta) => { if (meta.kind === 'edit' && !orphan) b.commit(meta.label) })
  return () => { offOwner(); offItem(); offCommit() }
}
