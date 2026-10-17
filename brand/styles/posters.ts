/* The poster series, "Una rueda, doce manos" (one wheel, twelve hands): the logo carved as a relief, at one crop,
   through twelve one-tone renderers (wheel12.ts). Constants on every sheet: Lana paper, a 12-column grid shown by its
   ticks and crosshairs, Goudy for the title and Plex for everything else (three sizes), the logo in the same corner,
   the caption block hanging from one hairline. ONE ink per sheet: art, type, rules and the hand's note all print in it.
   Revised after the v3 critique: one subject and one crop, the title up against the drawing, the hand inside the
   plate with a leader, and each sheet's settings printed in place of prose.
   The layout is a spec (a list of elements) so the canvas and Figma build the same sheet. */
import { STYLES, type StyleId } from './styles'

export const SHEET = { w: 1200, h: 1600, m: 64 }
const COLS = 12, GUT = 24, COLW = (SHEET.w - SHEET.m * 2 - GUT * (COLS - 1)) / COLS
export const colX = (c: number) => SHEET.m + c * (COLW + GUT) // left edge of column c (0-based)
export const span = (c0: number, c1: number) => colX(c1) + COLW - colX(c0) // width from col c0 to c1, inclusive
/** where the mark sits: its origin in px and px per mark unit. It bleeds off both sides; the band's foot clears the title. */
export const AT = { x: -60, y: 150, k: 4.1 }
/** the plate every renderer draws into (full bleed across), and the cyanotype's straight coated plate */
export const PLATE = { x: 0, y: 128, w: 1200, h: 944 }
export const COATED = { x: 64, y: 136, w: 1072, h: 936 }

export type Font = 'goudy' | 'goudyItalic' | 'plex' | 'plexCaps' | 'hand'
export type El =
  | { kind: 'art'; x: number; y: number; w: number; h: number }
  | { kind: 'text'; text: string; x: number; y: number; font: Font; size: number; align?: 'left' | 'right'; maxW?: number; lead?: number; rotate?: number }
  | { kind: 'rule'; x1: number; y1: number; x2: number; y2: number; w: number }
  | { kind: 'cross'; x: number; y: number; r: number }
  | { kind: 'logo'; x: number; y: number; h: number }

export const INKS: Record<string, { name: string; hex: string; light?: boolean }> = {
  nogal: { name: 'Nogal', hex: '#171615' }, mora: { name: 'Mora', hex: '#6E1A3E' }, achiote: { name: 'Achiote', hex: '#F6571C', light: true }, cielo: { name: 'Cielo', hex: '#5070F0', light: true },
}

/** per style: its ink, the hand's one line (the angle), and where the craft comes from */
export const POSTER: Record<StyleId, { ink: keyof typeof INKS; why: string; who: string }> = {
  engraving: { ink: 'nogal', why: 'Diderot drew every tool this way', who: 'Copper and burin, c. 1430 to 1900; the Encyclopédie plates, 1751.' },
  wood: { ink: 'nogal', why: 'white cut out of black, like Bewick', who: 'End-grain boxwood, white line. Thomas Bewick, c. 1790.' },
  stipple: { ink: 'achiote', why: 'one mark, repeated until it’s a form', who: 'Stipple engraving. Bartolozzi, London, c. 1770, often in red.' },
  lines: { ink: 'nogal', why: 'lines stay lines; only their width moves', who: 'Line screens from the 1880s; banknote portraits.' },
  riso: { ink: 'mora', why: 'one drum, one ink, a little grain', who: 'Riso Kagaku, Tokyo, 1986. The small studio’s press.' },
  dither: { ink: 'nogal', why: 'software’s first printmaking', who: 'Bill Atkinson’s dither, Apple Macintosh, 1984.' },
  ascii: { ink: 'nogal', why: 'drawn with the keys you type with', who: 'Teletype and typewriter art, 1960s; terminals since.' },
  guilloche: { ink: 'mora', why: 'a wheel drew this, by machine', who: 'The rose engine, c. 1620; watch dials and banknotes.' },
  moire: { ink: 'nogal', why: 'two wheels, one interference', who: 'Op art. Bridget Riley, Victor Vasarely, 1960s.' },
  plotter: { ink: 'achiote', why: 'order, until the wheel turns', who: 'After Georg Nees, “Schotter”, 1968, drawn by a Zuse plotter.' },
  contour: { ink: 'cielo', why: 'the wheel, surveyed like a hill', who: 'Contour lines, Ordnance Survey maps, from the 1840s.' },
  cyanotype: { ink: 'cielo', why: 'sunlight, iron salts, the mark laid on top', who: 'Sir John Herschel, 1842. Anna Atkins’ algae, 1843.' },
}

/** where the image series draws something other than the mark, the hand says so */
const WHY_IMAGES: Partial<Record<StyleId, string>> = { cyanotype: 'sunlight, iron salts, a plant laid on top' }

/** what changes from sheet to sheet */
export type SheetText = { n: number; total: number; header: string; name: string; english: string; why: string; who: string; inkLine: string; light: boolean; plate: { x: number; y: number; w: number; h: number } }

/** the sheet for one style; `readout` is what its renderer reports it used */
export function posterSpec(id: StyleId, readout: string, series: 'wheel' | 'images' = 'wheel'): El[] {
  const n = STYLES.findIndex((s) => s.id === id) + 1, st = STYLES[n - 1], p = POSTER[id]
  return sheetSpec({
    n, total: 12, header: series === 'images' ? 'DOCE MANOS, DOCE IMÁGENES' : 'UNA RUEDA, DOCE MANOS', name: st.name, english: st.english,
    why: series === 'images' && WHY_IMAGES[id] ? WHY_IMAGES[id]! : p.why, who: p.who,
    inkLine: `${INKS[p.ink].name} ${INKS[p.ink].hex} on Lana #FDFBFA. Type, rules and art: one ink.`, light: !!INKS[p.ink].light,
    plate: id === 'cyanotype' ? COATED : PLATE,
  }, readout)
}

/** the master sheet */
export function sheetSpec(t: SheetText, readout: string): El[] {
  const { w, h, m } = SHEET, body = t.light ? 17 : 15, caps = t.light ? 13 : 12
  const els: El[] = []
  // the head: the logo, the series, the number, and the declared grid
  els.push({ kind: 'logo', x: m, y: m, h: 24 })
  els.push({ kind: 'text', text: t.header, x: colX(4), y: m + 18, font: 'plexCaps', size: caps })
  els.push({ kind: 'text', text: `LÁMINA ${String(t.n).padStart(2, '0')} / ${t.total}`, x: w - m, y: m + 18, font: 'plexCaps', size: caps, align: 'right' })
  const ty = m + 44
  els.push({ kind: 'rule', x1: m, y1: ty, x2: w - m, y2: ty, w: 0.75 })
  for (let c = 0; c < COLS; c++) {
    els.push({ kind: 'rule', x1: colX(c), y1: ty, x2: colX(c), y2: ty + (c % 3 === 0 ? 10 : 6), w: 0.75 })
    els.push({ kind: 'rule', x1: colX(c) + COLW, y1: ty, x2: colX(c) + COLW, y2: ty + 4, w: 0.75 }) // the gutter's other side
  }
  els.push({ kind: 'art', ...t.plate })
  for (const x of [m, w - m]) els.push({ kind: 'cross', x, y: PLATE.y + PLATE.h + 16, r: 9 })
  // the title against the drawing, and the hand inside the plate with a leader to the band
  els.push({ kind: 'text', text: t.name, x: m - 5, y: 1212, font: 'goudy', size: 168, maxW: span(0, 7) })
  els.push({ kind: 'rule', x1: colX(9) + 12, y1: 1090, x2: colX(9) + 22, y2: 982, w: 0.8 })
  els.push({ kind: 'text', text: t.why, x: colX(9), y: 1118, font: 'hand', size: 28, maxW: span(9, 11), lead: 36, rotate: -0.025 })
  // the caption block, hanging from a hairline: what it is, how it was made (the renderer's own numbers), the ink
  const cy = 1352
  els.push({ kind: 'rule', x1: m, y1: cy, x2: w - m, y2: cy, w: 0.75 })
  els.push({ kind: 'text', text: `FIG. ${String(t.n).padStart(2, '0')} · ${t.english.toUpperCase()}`, x: colX(0), y: cy + 30, font: 'plexCaps', size: caps })
  els.push({ kind: 'text', text: t.who, x: colX(0), y: cy + 58, font: 'plex', size: body, maxW: span(0, 3), lead: body * 1.45 })
  els.push({ kind: 'text', text: 'SETTINGS', x: colX(4), y: cy + 30, font: 'plexCaps', size: caps })
  els.push({ kind: 'text', text: readout, x: colX(4), y: cy + 58, font: 'plex', size: body, maxW: span(4, 8), lead: body * 1.45 })
  els.push({ kind: 'text', text: 'INK', x: colX(9), y: cy + 30, font: 'plexCaps', size: caps })
  els.push({ kind: 'text', text: t.inkLine, x: colX(9), y: cy + 58, font: 'plex', size: body, maxW: span(9, 11), lead: body * 1.45 })
  els.push({ kind: 'text', text: 'Made with Rueca’s Styles tool', x: m, y: h - m + 6, font: 'plex', size: body })
  els.push({ kind: 'text', text: 'rueca.dev', x: w - m, y: h - m + 6, font: 'plex', size: body, align: 'right' })
  return els
}
