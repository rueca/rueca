/* Settings, palettes, looks and the image. Everything tunable is in the param
   store (undo, looks, share links); the image is NOT — a photo as a data URL
   would blow the localStorage quota and turn share links into megabytes. */
import { createStore } from 'zustand/vanilla'
import { createParams, defineSchema, folder, p } from '@kit'
import { DIFFUSION, RASTER, type EffectId, type Settings } from './engine'

export const PALETTES: { name: string; colors: string[] }[] = [
  { name: 'Game Boy', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  { name: '1-bit', colors: ['#000000', '#ffffff'] },
  { name: 'Paper & ink', colors: ['#1c1a19', '#f6f1ea'] },
  { name: 'CGA', colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff'] },
  { name: 'Riso blue + pink', colors: ['#f5efe0', '#0078bf', '#ff48b0'] },
  { name: 'Riso teal + orange', colors: ['#f5efe0', '#00838a', '#ff6c2f'] },
  { name: 'Riso red + yellow', colors: ['#f7f1e3', '#ff665e', '#ffe800', '#2b2a4c'] },
  { name: 'Sepia', colors: ['#2b1d14', '#6b4a2f', '#b08a5a', '#efe2c4'] },
  { name: 'Phosphor', colors: ['#071007', '#33ff66'] },
  { name: 'Amber', colors: ['#140b00', '#ffb000'] },
  { name: 'Vapor', colors: ['#1a1033', '#ff71ce', '#01cdfe', '#05ffa1', '#fffb96'] },
  { name: 'PICO-8', colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'] },
]

export const EFFECTS: { value: EffectId; label: string; hint: string }[] = [
  { value: 'floyd', label: 'Floyd–Steinberg', hint: 'Error diffusion. Smooth, organic grain.' },
  { value: 'atkinson', label: 'Atkinson', hint: 'Classic Macintosh. Loses some error, so highlights and shadows stay clean.' },
  { value: 'stucki', label: 'Stucki', hint: 'Wide error kernel. Calmer than Floyd–Steinberg.' },
  { value: 'bayer4', label: 'Bayer 4×4', hint: 'Ordered dither. Crisp crosshatch pattern.' },
  { value: 'bayer8', label: 'Bayer 8×8', hint: 'Ordered dither with more tone steps.' },
  { value: 'halftone', label: 'Halftone', hint: 'Rotated dot screen. Exports as SVG circles.' },
  { value: 'ascii', label: 'ASCII', hint: 'Characters by density. Copy or download as text.' },
  { value: 'pixelate', label: 'Pixelate', hint: 'Big pixels, optionally snapped to the palette.' },
]

/** The default: one ink on paper, so the sample comes out in the wire style's two colours. */
const INK = PALETTES.find((x) => x.name === 'Paper & ink')!

const is = (...ids: EffectId[]) => (v: { effect: EffectId }) => ids.includes(v.effect)

export const schema = defineSchema({
  adjust: folder('Adjust', {
    levels: p.boolean(true, { label: 'Auto levels', hint: 'Stretch the darkest and lightest tones of the photo to the full range first. Most dithers need it.' }),
    brightness: p.number(0, { min: -1, max: 1, step: 0.01, hint: 'Shift every tone up or down before dithering.' }),
    contrast: p.number(0, { min: -1, max: 1, step: 0.01, hint: 'Dithers love contrast — push it to separate the subject.' }),
    gamma: p.number(1, { min: 0.2, max: 3, step: 0.01, hint: 'Above 1 opens shadows, below 1 deepens them.' }),
    blur: p.number(0, { min: 0, max: 12, step: 0.1, unit: 'px', hint: 'Soften noise first so the pattern carries the tone.' }),
    sharpen: p.number(0, { min: 0, max: 3, step: 0.05, hint: 'Unsharp mask. Crisper edges survive the dither.' }),
    invert: p.boolean(false),
  }),
  effect: folder('Effect', {
    effect: p.select('atkinson', EFFECTS.map((e) => ({ value: e.value, label: e.label, hint: e.hint })), { hint: 'How tone becomes pattern.' }),
    pixel: p.number(3, { min: 1, max: 24, step: 1, unit: 'px', label: 'Pixel size', hint: 'Size of one output pixel in image pixels.', when: is(...RASTER) }),
    strength: p.number(1, { min: 0, max: 1, step: 0.01, label: 'Diffusion', hint: 'How much quantisation error spreads to neighbours. 0 = flat posterise.', when: is(...DIFFUSION) }),
    serpentine: p.boolean(true, { hint: 'Alternate scan direction each row — fewer diagonal worms.', when: is(...DIFFUSION) }),
    spread: p.number(1, { min: 0, max: 2, step: 0.01, hint: 'Strength of the threshold pattern.', when: is('bayer4', 'bayer8') }),
    quantise: p.boolean(true, { label: 'Snap to palette', hint: 'Off keeps the original colours.', when: is('pixelate') }),
    match: p.select('tone', [{ value: 'tone', label: 'Tone' }, { value: 'colour', label: 'Colour' }], { label: 'Match by', hint: 'Tone maps brightness onto the palette’s light-to-dark ramp (Game Boy, 1-bit). Colour picks the nearest hue (PICO-8, CGA).', when: (v) => RASTER.includes(v.effect) && (v.effect !== 'pixelate' || v.quantise) }),
    cell: p.number(10, { min: 3, max: 64, step: 0.5, unit: 'px', label: 'Cell size', hint: 'Distance between dot centres.', when: is('halftone') }),
    angle: p.angle(45, { label: 'Screen angle', when: is('halftone') }),
    gain: p.number(1, { min: 0.3, max: 1.6, step: 0.01, label: 'Dot gain', hint: 'Scales every dot. Above 1, dots merge in the shadows.', when: is('halftone') }),
    dotColor: p.select('ink', [{ value: 'ink', label: 'One ink' }, { value: 'palette', label: 'Palette' }], { label: 'Dot colour', when: is('halftone') }),
    ramp: p.text(' .:-=+*#%@', { mono: true, label: 'Characters', hint: 'Light to dense. Spaces count.', when: is('ascii') }),
    fontSize: p.number(10, { min: 5, max: 40, step: 1, unit: 'px', label: 'Font size', hint: 'Character height in image pixels.', when: is('ascii') }),
    asciiColor: p.select('ink', [{ value: 'ink', label: 'Ink' }, { value: 'palette', label: 'Palette' }, { value: 'source', label: 'Source' }], { label: 'Colour', when: is('ascii') }),
    swap: p.boolean(false, { label: 'Swap ink & paper', hint: 'Light marks on a dark ground.', when: is('halftone', 'ascii') }),
  }),
  colour: folder('Palette', {
    palette: p.palette(INK.colors, { max: 16 }),
    paletteName: p.text(INK.name),
  }),
})

const look = (name: string, values: Partial<Settings> & { paletteName?: string }) => ({ name, values })
const pal = (n: string) => ({ palette: PALETTES.find((x) => x.name === n)!.colors, paletteName: n })

export const LOOKS = [
  look('Game Boy', { effect: 'floyd', pixel: 3, contrast: 0.12, ...pal('Game Boy') }),
  look('Macintosh', { effect: 'atkinson', pixel: 2, contrast: 0.2, gamma: 1.3, ...pal('1-bit') }),
  look('CGA', { effect: 'bayer8', pixel: 3, spread: 1, contrast: 0.1, match: 'colour', ...pal('CGA') }),
  look('Newsprint', { effect: 'halftone', cell: 9, angle: 45, gain: 1.05, contrast: 0.15, ...pal('Paper & ink') }),
  look('Riso', { effect: 'halftone', cell: 13, angle: 15, gain: 1.1, dotColor: 'palette', contrast: 0.1, ...pal('Riso blue + pink') }),
  look('Terminal', { effect: 'ascii', fontSize: 14, swap: true, asciiColor: 'ink', contrast: 0.3, ramp: ' .:-=+*#%@', ...pal('Phosphor') }),
  look('PICO-8', { effect: 'floyd', pixel: 4, strength: 0.75, contrast: 0.08, match: 'colour', ...pal('PICO-8') }),
  look('Big pixels', { effect: 'pixelate', pixel: 12, quantise: false, contrast: 0.05, ...pal('Vapor') }),
]

export const params = createParams(schema, { id: 'dither', version: 2, presets: LOOKS as any }) // v2: Atkinson + Paper & ink defaults
export type V = ReturnType<typeof params.values>
export const settingsOf = (v: V): Settings => v as unknown as Settings

/* ---------- the image (not undoable, not persisted) ---------- */
export interface ImageState { name: string; w: number; h: number; data: ImageData | null; sample: boolean; url: string | null }
export const image = createStore<ImageState>(() => ({ name: 'Sample — spinning top.png', w: 1600, h: 1000, data: null, sample: true, url: null }))

/* ---------- view state ---------- */
export const view = createStore<{ split: boolean; pos: number; peek: boolean; grid: boolean; hover: { x: number; y: number; hex: string | null } | null; preview: string | null }>(() => ({
  split: true, pos: 0.5, peek: false, grid: true, hover: null, preview: null,
}))
