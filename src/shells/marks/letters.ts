/* A monoline geometric stroke alphabet for monograms. Each glyph is SVG path
   data on a grid `w` wide and 6 tall (cap height), drawn with round caps.
   Paths only — no font dependency, so exported SVG/PNG look identical everywhere. */

export interface Glyph { w: number; d: string }

export const GLYPHS: Record<string, Glyph> = {
  A: { w: 4, d: 'M0 6 L2 0 L4 6 M0.75 3.8 H3.25' },
  B: { w: 4, d: 'M0 6 V0 H2.3 A1.5 1.5 0 0 1 2.3 3 H0 M2.3 3 H2.5 A1.5 1.5 0 0 1 2.5 6 H0' },
  C: { w: 4, d: 'M3.29 0.7 A2 3 0 1 0 3.29 5.3' },
  D: { w: 4, d: 'M0 0 V6 H1.5 A2.5 3 0 0 0 1.5 0 Z' },
  E: { w: 3.6, d: 'M3.6 0 H0 V6 H3.6 M0 3 H3' },
  F: { w: 3.6, d: 'M3.6 0 H0 V6 M0 3 H3' },
  G: { w: 4, d: 'M3.29 0.7 A2 3 0 1 0 4 3 H2.2' },
  H: { w: 4, d: 'M0 0 V6 M4 0 V6 M0 3 H4' },
  I: { w: 0, d: 'M0 0 V6' },
  J: { w: 3, d: 'M3 0 V4.5 A1.5 1.5 0 0 1 0 4.5' },
  K: { w: 4, d: 'M0 0 V6 M4 0 L0 4 M1.5 2.5 L4 6' },
  L: { w: 3.4, d: 'M0 0 V6 H3.4' },
  M: { w: 4.6, d: 'M0 6 V0 L2.3 3.6 L4.6 0 V6' },
  N: { w: 4, d: 'M0 6 V0 L4 6 V0' },
  O: { w: 4, d: 'M2 0 A2 3 0 1 0 2 6 A2 3 0 1 0 2 0' },
  P: { w: 4, d: 'M0 6 V0 H2.5 A1.5 1.5 0 0 1 2.5 3 H0' },
  Q: { w: 4, d: 'M2 0 A2 3 0 1 0 2 6 A2 3 0 1 0 2 0 M2.6 4.4 L4 6.2' },
  R: { w: 4, d: 'M0 6 V0 H2.5 A1.5 1.5 0 0 1 2.5 3 H0 M2 3 L4 6' },
  S: { w: 4, d: 'M3.56 0.75 A1.8 1.5 0 1 0 2 3 A2 1.5 0 1 1 0.27 5.25' },
  T: { w: 4, d: 'M0 0 H4 M2 0 V6' },
  U: { w: 4, d: 'M0 0 V4 A2 2 0 0 0 4 4 V0' },
  V: { w: 4, d: 'M0 0 L2 6 L4 0' },
  W: { w: 5.2, d: 'M0 0 L1.3 6 L2.6 1.4 L3.9 6 L5.2 0' },
  X: { w: 4, d: 'M0 0 L4 6 M4 0 L0 6' },
  Y: { w: 4, d: 'M0 0 L2 3 L4 0 M2 3 V6' },
  Z: { w: 4, d: 'M0 0 H4 L0 6 H4' },
  '&': { w: 4, d: 'M4 6 L0.9 2.2 A1.3 1.3 0 1 1 2.6 2.4 L0.6 3.8 A1.4 1.4 0 0 0 2 6 C3 6 3.6 5 4 4' },
  '0': { w: 4, d: 'M2 0 A2 3 0 1 0 2 6 A2 3 0 1 0 2 0' },
  '1': { w: 2, d: 'M0 1.2 L2 0 V6' },
  '2': { w: 4, d: 'M0.2 1.4 A2 1.6 0 1 1 3.4 3.2 L0 6 H4' },
  '3': { w: 4, d: 'M0.3 0.9 A2 1.5 0 1 1 2 3 A2 1.5 0 1 1 0.3 5.1' },
  '4': { w: 4, d: 'M3 6 V0 L0 4.2 H4' },
  '5': { w: 4, d: 'M3.8 0 H0.4 L0.2 2.8 A2 1.6 0 1 1 0.2 5.2' },
  '6': { w: 4, d: 'M3.4 0.4 A2 3 0 0 0 0 3.8 A2 2.1 0 1 0 2 1.8 A2 2.1 0 0 0 0 3.8' },
  '7': { w: 4, d: 'M0 0 H4 L1.4 6' },
  '8': { w: 4, d: 'M2 3 A1.7 1.5 0 1 1 2 0 A1.7 1.5 0 1 1 2 3 A2 1.5 0 1 0 2 6 A2 1.5 0 1 0 2 3' },
  '9': { w: 4, d: 'M0.6 5.6 A2 3 0 0 0 4 2.2 A2 2.1 0 1 0 2 4.2 A2 2.1 0 0 0 4 2.2' },
}

export const glyph = (ch: string): Glyph => GLYPHS[ch.toUpperCase()] ?? { w: 4, d: 'M0 0 H4 V6 H0 Z' }
