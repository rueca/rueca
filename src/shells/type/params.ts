/* The type playground's state: one schema, split across three modes by folder. */
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownToLine, Bold, Droplets, Maximize2, RotateCw, Waves } from 'lucide-react'
import { defineSchema, folder, p, createParams, createClock, EASINGS } from '@kit'
import { FAMILIES } from './fonts'
import { contrastRatio, wcagGrade } from '@kit'
import { kineticDuration } from './kinetic'

export type Mode = 'specimen' | 'kinetic' | 'scale'

export const RATIOS: Record<string, { label: string; value: number }> = {
  minorSecond: { label: 'Minor second', value: 1.067 },
  majorSecond: { label: 'Major second', value: 1.125 },
  minorThird: { label: 'Minor third', value: 1.2 },
  majorThird: { label: 'Major third', value: 1.25 },
  perfectFourth: { label: 'Perfect fourth', value: 1.333 },
  augFourth: { label: 'Augmented fourth', value: 1.414 },
  perfectFifth: { label: 'Perfect fifth', value: 1.5 },
  golden: { label: 'Golden ratio', value: 1.618 },
}
const ratioOptions = Object.entries(RATIOS).map(([value, r]) => ({ value, label: `${r.label} · ${r.value}` }))

export const FORMATS: Record<string, { w: number; h: number; label: string }> = {
  landscape: { w: 1600, h: 1000, label: 'Landscape' },
  poster: { w: 1080, h: 1350, label: 'Poster' },
  square: { w: 1080, h: 1080, label: 'Square' },
}

export const PAIRS: { name: string; fg: string; bg: string }[] = [
  // Rueca's palette: ink on paper, and the brights with ink on them (never white on a bright)
  { name: 'Ink on paper', fg: '#181411', bg: '#f3f1eb' },
  { name: 'Paper on ink', fg: '#f3f1eb', bg: '#181411' },
  { name: 'Achiote', fg: '#181411', bg: '#e8582c' },
  { name: 'Gualda on Rubia', fg: '#f2c744', bg: '#5e2219' },
  { name: 'Cielo', fg: '#181411', bg: '#5db4e8' },
  { name: 'Malva', fg: '#181411', bg: '#a88bf6' },
]

export const schema = defineSchema({
  /* ---------- Specimen ---------- */
  font: folder('Font', {
    family: p.select('newsreader', Object.values(FAMILIES).map((f) => ({ value: f.id, label: f.label })), { hint: 'Compare the variable Newsreader and Inter against system faces. Axes a face lacks are simulated or disabled.' }),
    text: p.text('The sky in\nyour hand.', { multiline: true, hint: 'Also editable directly on the artboard — click the headline and type.' }),
  }),
  axes: folder('Axes', {
    wght: p.number(400, { min: 100, max: 900, step: 1, label: 'Weight', hint: 'wght axis. Newsreader runs 200–800 and Inter 100–900; static faces snap to the nearest weight.' }),
    autoOpsz: p.boolean(false, { label: 'Auto optical', hint: 'Tie optical size to font size, the way font-optical-sizing: auto does.', when: (v) => !!FAMILIES[v.family]?.axes.opsz }),
    opsz: p.number(72, { min: 6, max: 72, step: 0.5, label: 'Optical size', hint: 'opsz axis. Display cuts tighten spacing and sharpen hairlines; text cuts open up for small sizes. Newsreader runs 6–72, Inter 14–32 (clamped).', when: (v) => !!FAMILIES[v.family]?.axes.opsz && !v.autoOpsz }),
    width: p.number(100, { min: 70, max: 130, step: 1, unit: '%', label: 'Width', hint: 'Simulated — none of these faces has a wdth axis, so this scales horizontally.' }),
    slant: p.number(0, { min: 0, max: 15, step: 0.5, unit: '°', label: 'Slant', hint: 'Simulated oblique by skewing. Use Italic for a true italic.' }),
    italic: p.boolean(false, { label: 'Italic', hint: 'True italic where the family ships one (Newsreader, Inter, Georgia); synthesised otherwise.' }),
  }),
  setting: folder('Typesetting', {
    size: p.number(156, { min: 12, max: 320, step: 1, unit: 'px', label: 'Size' }),
    leading: p.number(1, { min: 0.7, max: 2, step: 0.01, label: 'Leading', fmt: (n) => `${n.toFixed(2)}×`, hint: 'Line height as a multiple of the size.' }),
    tracking: p.number(-0.025, { min: -0.12, max: 0.3, step: 0.001, label: 'Tracking', fmt: (n) => `${(n * 100).toFixed(1)}%`, hint: 'Letter spacing in em, shown as a percentage of the size.' }),
    textCase: p.select('none', [
      { value: 'none', label: 'Aa', hint: 'As typed' },
      { value: 'upper', label: 'AA', hint: 'Uppercase' },
      { value: 'lower', label: 'aa', hint: 'Lowercase' },
      { value: 'title', label: 'Tt', hint: 'Title case' },
    ], { label: 'Case' }),
    align: p.select('left', [
      { value: 'left', icon: AlignLeft, hint: 'Align left' },
      { value: 'center', icon: AlignCenter, hint: 'Centre' },
      { value: 'right', icon: AlignRight, hint: 'Align right' },
      { value: 'justify', icon: AlignJustify, hint: 'Justify' },
    ], { label: 'Align' }),
  }),
  artboard: folder('Artboard', {
    format: p.select('landscape', Object.entries(FORMATS).map(([value, f]) => ({ value, label: f.label, hint: `${f.w} × ${f.h}` }))),
    margin: p.number(96, { min: 24, max: 240, step: 4, unit: 'px' }),
    showMeta: p.boolean(true, { label: 'Captions', hint: 'Family, axes and a character line around the headline.' }),
  }, { collapsed: true }),

  /* ---------- Kinetic ---------- */
  kinetic: folder('Kinetic text', {
    ktext: p.text('Campana', { maxLength: 24, label: 'Text', hint: 'One line, up to 24 letters — each letter gets its own lane.' }),
    effect: p.select('cascade', [
      { value: 'wave', icon: Waves, hint: 'Wave — a travelling sine, seamless loop' },
      { value: 'cascade', icon: ArrowDownToLine, hint: 'Cascade — letters drop in' },
      { value: 'rotate', icon: RotateCw, hint: 'Rotate — letters spin up' },
      { value: 'scale', icon: Maximize2, hint: 'Scale — letters pop' },
      { value: 'blur', icon: Droplets, hint: 'Blur in — focus pull' },
      { value: 'weight', icon: Bold, hint: 'Weight — animates the wght axis per letter' },
    ], { display: 'tiles', label: 'Effect' }),
    ksize: p.number(220, { min: 40, max: 400, step: 1, unit: 'px', label: 'Size' }),
    kwght: p.number(760, { min: 100, max: 900, step: 1, label: 'Weight' }),
    ktracking: p.number(-0.04, { min: -0.15, max: 0.4, step: 0.005, label: 'Tracking', fmt: (n) => `${(n * 100).toFixed(1)}%` }),
  }),
  motion: folder('Motion', {
    order: p.select('forward', [
      { value: 'forward', label: '→', hint: 'Left to right' },
      { value: 'reverse', label: '←', hint: 'Right to left' },
      { value: 'centre', label: '↔', hint: 'Centre out' },
      { value: 'random', label: '⁂', hint: 'Shuffled (seeded)' },
    ], { label: 'Order' }),
    stagger: p.number(55, { min: 0, max: 300, step: 1, unit: 'ms', hint: 'Delay between letters — what makes it travel.' }),
    duration: p.number(820, { min: 100, max: 3000, step: 10, fmt: (n) => `${(n / 1000).toFixed(2)}s`, hint: 'Each letter’s own move. For Wave, the period of one cycle.' }),
    amplitude: p.number(70, { min: 0, max: 100, step: 1, unit: '%', hint: 'How far each letter travels: offset, angle, scale, blur or weight range depending on the effect.' }),
    curve: p.curve(EASINGS['Out back'], { label: 'Curve', hint: 'Easing of each letter’s move.' }),
    hold: p.number(900, { min: 0, max: 4000, step: 50, fmt: (n) => `${(n / 1000).toFixed(2)}s`, hint: 'Rest between in and out.', when: (v) => v.effect !== 'wave' }),
    outro: p.boolean(true, { label: 'Play out', hint: 'Reverse the move after the hold so the loop is seamless.', when: (v) => v.effect !== 'wave' }),
    seed: p.seed(7, { when: (v) => v.order === 'random' }),
  }),

  colour: folder('Colour', {
    fg: p.color('#181411', { label: 'Text', alpha: false }),
    bg: p.color('#f3f1eb', { label: 'Paper', alpha: false }),
    contrast: p.monitor(() => contrastLabel(), { label: 'Contrast', hint: 'WCAG 2 contrast ratio of text on paper.' }),
  }),

  /* ---------- Scale ---------- */
  scale: folder('Scale', {
    base: p.number(16, { min: 10, max: 28, step: 0.5, unit: 'px', label: 'Base size', hint: 'The body size — step 0.' }),
    ratio: p.select('perfectFourth', ratioOptions, { display: 'dropdown', hint: 'Each step is the one below times this.' }),
    stepsUp: p.number(6, { min: 1, max: 10, step: 1, display: 'stepper', label: 'Steps up' }),
    stepsDown: p.number(2, { min: 0, max: 4, step: 1, display: 'stepper', label: 'Steps down' }),
    naming: p.select('tailwind', [
      { value: 'tailwind', label: 'T-shirt', hint: 'xs, sm, base, lg, xl, 2xl…' },
      { value: 'headings', label: 'Roles', hint: 'caption, small, body, h6…h1' },
      { value: 'numeric', label: 'Steps', hint: 'step--1, step-0, step-1…' },
    ], { label: 'Names' }),
    rounding: p.select('half', [
      { value: 'exact', label: 'Exact' },
      { value: 'half', label: '0.5px' },
      { value: 'px', label: '1px' },
    ], { hint: 'Snap computed sizes so they render crisply.' }),
    unit: p.select('rem', ['rem', 'px'], { label: 'Units' }),
  }),
  rules: folder('Rhythm', {
    leadBody: p.number(1.5, { min: 1, max: 2, step: 0.01, label: 'Body leading', fmt: (n) => `${n.toFixed(2)}×` }),
    leadDisplay: p.number(1.08, { min: 0.85, max: 1.6, step: 0.01, label: 'Display leading', fmt: (n) => `${n.toFixed(2)}×`, hint: 'Leading of the largest step; steps in between interpolate.' }),
    dynTracking: p.boolean(true, { label: 'Auto tracking', hint: 'Inter’s dynamic metrics: tighter tracking as size grows (−0.0223 + 0.185·e^(−0.1745·size) em).' }),
  }),
  fluid: folder('Fluid', {
    fluidOn: p.boolean(false, { label: 'Fluid type', hint: 'Interpolate every step between two viewports with clamp().' }),
    fluidBase: p.number(18, { min: 10, max: 32, step: 0.5, unit: 'px', label: 'Max base', when: (v) => v.fluidOn }),
    fluidRatio: p.select('augFourth', ratioOptions, { display: 'dropdown', label: 'Max ratio', when: (v) => v.fluidOn }),
    viewports: p.range([360, 1440], { min: 320, max: 1920, step: 10, fmt: (n) => String(n), label: 'Viewports', hint: 'Min and max viewport widths in px.', when: (v) => v.fluidOn }),
    previewVw: p.number(1200, { min: 320, max: 1920, step: 10, unit: 'px', label: 'Preview at', hint: 'Artboard width — sizes resolve at this viewport.', when: (v) => v.fluidOn }),
  }, { collapsed: true }),
  sample: folder('Preview', {
    sampleText: p.text('Cast in bronze and rung once before it leaves the foundry.', { label: 'Sample' }),
  }, { collapsed: true }),
})

export const params = createParams(schema, {
  id: 'type',
  version: 2, // v2: Newsreader and Rueca's palette; v1 was Inter on generic pairs
  presets: [
    { name: 'Editorial serif', values: { family: 'newsreader', wght: 340, opsz: 72, size: 140, leading: 1.02, tracking: -0.02, fg: '#181411', bg: '#f3f1eb', italic: true } },
    { name: 'Swiss poster', values: { family: 'inter', wght: 820, size: 196, leading: 0.9, tracking: -0.05, textCase: 'none', fg: '#181411', bg: '#e8582c', format: 'poster' } },
    { name: 'Hairline', values: { family: 'inter', wght: 120, size: 168, leading: 1.02, tracking: -0.01, fg: '#f2c744', bg: '#5e2219' } },
    { name: 'Terminal', values: { family: 'mono', wght: 500, size: 92, leading: 1.2, tracking: 0, textCase: 'upper', fg: '#5db4e8', bg: '#181411' } },
  ],
})
export type V = ReturnType<typeof params.values>

function contrastLabel() {
  const v = params.values()
  const r = contrastRatio(v.fg, v.bg)
  return `${r.toFixed(2)}:1 · ${wcagGrade(r)}`
}

export const family = (v: V) => FAMILIES[v.family] ?? FAMILIES.newsreader

/** Kinetic clock — duration follows the animation maths. */
export const clock = createClock({ duration: kineticDuration(params.values()), loop: true })
params.subscribe((s) => {
  const d = kineticDuration(s.values as V)
  if (d !== clock.getState().duration) clock.setState({ duration: d })
})
