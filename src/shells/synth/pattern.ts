/* ---------------------------------------------------------------------------
   The pattern: 4 tracks × 16 steps of velocity (0 = off), plus a note per
   step for the bass. Plain JSON — it lives inside the params store, so undo,
   persistence, share links and JSON export all cover it.
--------------------------------------------------------------------------- */

export type TrackId = 'kick' | 'snare' | 'hat' | 'bass'
export const STEPS = 16

/** Identity colours — used by the stage visual and echoed as legend dots. */
export const TRACKS: { id: TrackId; name: string; short: string; color: string }[] = [
  { id: 'kick', name: 'Kick', short: 'KCK', color: '#ff5a36' },
  { id: 'snare', name: 'Snare', short: 'SNR', color: '#ffc53d' },
  { id: 'hat', name: 'Hat', short: 'HAT', color: '#3ddcff' },
  { id: 'bass', name: 'Bass', short: 'BSS', color: '#b07cff' },
]

export interface Pattern {
  kick: number[]
  snare: number[]
  hat: number[]
  bass: number[]
  /** MIDI note per step (bass only) */
  notes: number[]
}

const v = (s: string) => [...s].map((c) => (c === '.' ? 0 : c === 'x' ? 0.55 : c === 'X' ? 0.85 : c === '!' ? 1 : Number(c) / 9))
const n = (root: number, rel: number[]) => rel.map((r) => root + r)

export const PATTERNS: Record<string, { name: string; bpm: number; swing: number; p: Pattern }> = {
  house: {
    name: 'Four on the floor', bpm: 122, swing: 22,
    p: {
      kick: v('X...X...X...X...'),
      snare: v('....X.......X..x'),
      hat: v('..X...X...X...X.').map((x, i) => x || (i % 2 ? 0.28 : 0)),
      bass: v('..X..X.x..X..Xx.'),
      notes: n(36, [0, 0, 0, 0, 0, 12, 0, 12, 0, 0, 3, 0, 0, 5, 7, 0]),
    },
  },
  breaks: {
    name: 'Breakbeat', bpm: 132, swing: 34,
    p: {
      kick: v('X.........X..x..'),
      snare: v('....X..x.x..X...'),
      hat: v('X.x.X.x.X.x.X.xX').map((x) => (x ? x * 0.8 : 0)),
      bass: v('X..x..X...X.x...'),
      notes: n(33, [0, 0, 0, 7, 0, 0, 12, 0, 0, 0, 3, 0, 5, 0, 0, 0]),
    },
  },
  halftime: {
    name: 'Half-time', bpm: 86, swing: 12,
    p: {
      kick: v('X......x..X.....'),
      snare: v('........X.......'),
      hat: [0.9, 0.3, 0.55, 0.3, 0.8, 0.3, 0.55, 0.3, 0.9, 0.3, 0.55, 0.3, 0.8, 0.3, 0.55, 0.45],
      bass: v('X.......x.X.....'),
      notes: n(31, [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, 0]),
    },
  },
  electro: {
    name: 'Electro', bpm: 126, swing: 0,
    p: {
      kick: v('X.....X...X.....'),
      snare: v('....X.......X...'),
      hat: v('xxXxxxXxxxXxxxXx').map((x) => x * 0.75),
      bass: v('XxX.xX.xX.XxX.x!'),
      notes: n(36, [0, 0, 12, 0, 0, 10, 0, 7, 0, 0, 3, 3, 15, 0, 12, 7]),
    },
  },
  empty: {
    name: 'Empty', bpm: 120, swing: 0,
    p: { kick: v('................'), snare: v('................'), hat: v('................'), bass: v('................'), notes: new Array(STEPS).fill(36) },
  },
}

export const DEFAULT_PATTERN = PATTERNS.house.p

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
export const noteName = (m: number) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`
export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export const clonePattern = (p: Pattern): Pattern => ({ kick: [...p.kick], snare: [...p.snare], hat: [...p.hat], bass: [...p.bass], notes: [...p.notes] })

export function setStep(p: Pattern, track: TrackId, i: number, vel: number): Pattern {
  const next = clonePattern(p)
  next[track][i] = Math.max(0, Math.min(1, Math.round(vel * 100) / 100))
  return next
}
export function setNote(p: Pattern, i: number, note: number): Pattern {
  const next = clonePattern(p)
  next.notes[i] = Math.max(24, Math.min(72, Math.round(note)))
  return next
}
export function shiftPattern(p: Pattern, dir: 1 | -1, tracks: TrackId[] = ['kick', 'snare', 'hat', 'bass']): Pattern {
  const rot = <T,>(a: T[]) => (dir > 0 ? [a[a.length - 1], ...a.slice(0, -1)] : [...a.slice(1), a[0]])
  const next = clonePattern(p)
  for (const t of tracks) next[t] = rot(next[t])
  if (tracks.includes('bass')) next.notes = rot(next.notes)
  return next
}
export function clearTrack(p: Pattern, track?: TrackId): Pattern {
  const next = clonePattern(p)
  for (const t of track ? [track] : (['kick', 'snare', 'hat', 'bass'] as TrackId[])) next[t] = new Array(STEPS).fill(0)
  return next
}
/** Seeded hat groove: steady 8ths with ghosted 16ths and a little velocity life. */
export function randomHats(p: Pattern, seed = Date.now()): Pattern {
  let a = seed >>> 0
  const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const next = clonePattern(p)
  next.hat = next.hat.map((_, i) => (i % 2 === 0 ? 0.55 + rnd() * 0.4 : rnd() < 0.45 ? 0.2 + rnd() * 0.3 : 0))
  return next
}
export function humanise(p: Pattern, amount = 0.12): Pattern {
  const next = clonePattern(p)
  for (const t of ['kick', 'snare', 'hat', 'bass'] as TrackId[])
    next[t] = next[t].map((x) => (x ? Math.max(0.05, Math.min(1, Math.round((x + (Math.random() * 2 - 1) * amount) * 100) / 100)) : 0))
  return next
}

/** Accepts anything shaped like a pattern (from JSON import); fills gaps. */
export function sanitizePattern(x: unknown): Pattern | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const arr = (k: string, d: number, lo: number, hi: number) => {
    const a = Array.isArray(o[k]) ? (o[k] as unknown[]) : []
    return Array.from({ length: STEPS }, (_, i) => { const n = Number(a[i]); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d })
  }
  if (!['kick', 'snare', 'hat', 'bass'].some((k) => Array.isArray(o[k]))) return null
  return { kick: arr('kick', 0, 0, 1), snare: arr('snare', 0, 0, 1), hat: arr('hat', 0, 0, 1), bass: arr('bass', 0, 0, 1), notes: arr('notes', 36, 24, 72) }
}
