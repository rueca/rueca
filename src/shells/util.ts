/* ---------------------------------------------------------------------------
   Small helpers the example shells share (demo plumbing, not kit API).
--------------------------------------------------------------------------- */

/** "Yuzu & ginger — Café" → "yuzu-and-ginger-cafe" (accents folded); `fallback` when nothing is left */
export const slug = (s: string, fallback = 'untitled', max = 64) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, max).replace(/-$/, '') || fallback

/** short random id with an optional prefix: uid('c') → "c4kz9qa" (fine for demo docs, not for collisions at scale) */
export const uid = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 8)}`

/** seeded PRNG (mulberry32): same seed, same sequence — demo pictures stay stable across reloads */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
