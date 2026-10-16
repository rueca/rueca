/* ---------------------------------------------------------------------------
   Design tokens — the component set's OWN theme, independent of the studio
   chrome. A small schema of decisions (accent in OKLCH, radius, type scale,
   density, shadow style) derives every CSS variable the components read,
   for light and dark. Presets are whole looks ("Compact", "Soft", "Brutal").
--------------------------------------------------------------------------- */
import { defineSchema, folder, p, createParams } from '@kit'
import { formatHex, clampChroma, wcagContrast, type Oklch } from 'culori'

export const tokenSchema = defineSchema({
  accent: folder('Accent', {
    accentL: p.number(0.737, { min: 0.15, max: 0.95, step: 0.01, label: 'Lightness' }),
    accentC: p.number(0.113, { min: 0, max: 0.37, step: 0.001, label: 'Chroma' }),
    accentH: p.number(237, { min: 0, max: 360, step: 1, label: 'Hue' }),
    neutralTint: p.number(0.005, { min: 0, max: 0.04, step: 0.001, label: 'Neutral tint', hint: 'How much of the accent hue bleeds into greys, borders and text.' }),
  }),
  shape: folder('Shape', {
    radius: p.number(10, { min: 0, max: 24, step: 1, unit: 'px', hint: 'Control radius. Cards use 1.5×, pills ignore it.' }),
    borderWidth: p.number(1, { min: 0, max: 3, step: 0.5, unit: 'px', label: 'Border' }),
    shadow: p.select('none', [{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'hard', label: 'Hard' }], { hint: 'Hard = offset solid shadow, the neo-brutalist look.' }),
  }),
  type: folder('Type', {
    font: p.select('plex', [
      { value: 'plex', label: 'IBM Plex Sans' }, { value: 'inter', label: 'Inter' }, { value: 'system', label: 'System UI' }, { value: 'rounded', label: 'Rounded' },
      { value: 'serif', label: 'Newsreader' }, { value: 'mono', label: 'Mono' },
    ], { label: 'Family' }),
    baseSize: p.number(14, { min: 12, max: 18, step: 0.5, unit: 'px', label: 'Base size' }),
    scale: p.select('1.2', [
      { value: '1.125', label: 'Major second · 1.125' }, { value: '1.2', label: 'Minor third · 1.2' },
      { value: '1.25', label: 'Major third · 1.25' }, { value: '1.333', label: 'Perfect fourth · 1.333' },
    ], { label: 'Scale', hint: 'Each step up the type ramp multiplies by this ratio.' }),
    weight: p.number(550, { min: 400, max: 750, step: 50, label: 'Label weight', hint: 'Weight of button labels and titles.' }),
  }),
  density: folder('Density', {
    density: p.select('default', [{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'comfortable', label: 'Roomy' }], { label: 'Density' }),
  }),
})

/* The default is Gabinete's own kit (src/demo/clients.ts): Plex on near-neutral paper with Cielo as
   the one bright, its labels in ink (on a bright, text is Nogal, never white). Other looks change shape,
   type and density; Editorial goes back to one ink, Agalla swaps the bright for Achiote. */
export const tokens = createParams(tokenSchema, {
  id: 'component-lab-tokens',
  version: 3, // v3: Gabinete defaults (Cielo, Plex); v2 was the wire palette
  presets: [
    { name: 'Gabinete', values: {} },
    { name: 'Compact', values: { radius: 6, baseSize: 13, scale: '1.125', weight: 500, density: 'compact' } },
    { name: 'Soft', values: { accentL: 0.34, neutralTint: 0.018, radius: 16, font: 'rounded', baseSize: 15, weight: 600, density: 'comfortable' } },
    { name: 'Brutal', values: { neutralTint: 0, radius: 0, borderWidth: 2, shadow: 'hard', font: 'mono', weight: 700 } },
    { name: 'Editorial', values: { accentL: 0.195, accentC: 0.009, accentH: 59, radius: 2, font: 'serif', baseSize: 15, scale: '1.25', weight: 500 } },
    { name: 'Agalla', values: { accentL: 0.645, accentC: 0.187, accentH: 37, radius: 4, weight: 600 } },
  ],
})
export type Tokens = ReturnType<typeof tokens.values>

/* --- colour maths -------------------------------------------------------- */
export const oklch = (l: number, c: number, h: number): Oklch => ({ mode: 'oklch', l, c, h })
/** a safe sRGB hex for the colour (chroma reduced until it fits) */
export const hexOf = (l: number, c: number, h: number) => formatHex(clampChroma(oklch(l, c, h), 'oklch'))!
const cssOf = (l: number, c: number, h: number, a = 1) => `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}${a < 1 ? ` / ${a}` : ''})`

export const FONT_STACKS: Record<string, string> = {
  plex: '"IBM Plex Sans Variable", "IBM Plex Sans", system-ui, sans-serif',
  inter: '"Inter Variable", Inter, system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
  serif: '"Newsreader Variable", Newsreader, Georgia, serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
}
const DENSITY = {
  compact: { h: [26, 32, 38], px: [8, 11, 14], pad: 16, gap: 6 },
  default: { h: [30, 36, 44], px: [10, 14, 18], pad: 20, gap: 8 },
  comfortable: { h: [34, 42, 50], px: [12, 16, 22], pad: 24, gap: 10 },
} as const

export type Theme = 'light' | 'dark'

/** Every CSS variable the component set reads, for one theme. */
export function deriveVars(t: Tokens, theme: Theme): Record<string, string> {
  const H = t.accentH, C = t.accentC
  const dark = theme === 'dark'
  // an ink-dark accent turns to paper on the dark theme, so it never disappears into the ground
  const L = dark ? (t.accentL < 0.45 ? Math.max(0.86, 1.12 - t.accentL) : Math.min(0.95, t.accentL + 0.05)) : t.accentL
  const accentHex = hexOf(L, C, H)
  const nt = t.neutralTint
  // pick the label colour by real contrast, not by lightness guesswork (light label = warm paper)
  const paper = hexOf(0.965, Math.min(nt, 0.011), H)
  const onAccent = wcagContrast(accentHex, paper) >= wcagContrast(accentHex, '#111111') ? paper : hexOf(0.2, Math.min(C, 0.04), H)
  const n = (l: number, k = 1) => cssOf(l, nt * k, H)
  const d = DENSITY[t.density as keyof typeof DENSITY] ?? DENSITY.default
  const r = Number(t.scale)
  const fs = (k: number) => `${(t.baseSize * r ** k).toFixed(2)}px`
  const hard = t.shadow === 'hard'
  const ink = dark ? n(0.96, 0.9) : n(0.22, 0.3)
  const shadowSm = t.shadow === 'none' ? 'none' : hard ? `2px 2px 0 0 ${ink}` : dark ? '0 1px 2px rgb(0 0 0 / .4)' : '0 1px 2px rgb(15 20 30 / .06), 0 1px 1px rgb(15 20 30 / .04)'
  const shadowMd = t.shadow === 'none' ? 'none' : hard ? `4px 4px 0 0 ${ink}` : dark ? '0 2px 6px rgb(0 0 0 / .35), 0 12px 32px -8px rgb(0 0 0 / .5)' : '0 1px 3px rgb(15 20 30 / .06), 0 10px 30px -10px rgb(15 20 30 / .18)'
  const shadowLg = t.shadow === 'none' ? 'none' : hard ? `6px 6px 0 0 ${ink}` : dark ? '0 24px 48px -12px rgb(0 0 0 / .6)' : '0 2px 6px rgb(15 20 30 / .06), 0 22px 44px -14px rgb(15 20 30 / .26)'
  return {
    '--cl-accent': cssOf(L, C, H),
    '--cl-accent-hex': accentHex,
    '--cl-accent-hover': cssOf(L + (L > 0.75 ? -0.05 : dark || L < 0.3 ? 0.07 : -0.05), C, H),
    '--cl-accent-active': cssOf(L + (L > 0.75 ? -0.09 : dark || L < 0.3 ? 0.12 : -0.09), C, H),
    '--cl-accent-soft': cssOf(L, C, H, dark ? 0.2 : 0.12),
    '--cl-accent-text': dark ? cssOf(Math.max(0.72, L), C, H) : cssOf(Math.min(0.5, L), C, H),
    '--cl-on-accent': onAccent,
    '--cl-ring': cssOf(L, C, H, 0.4),
    // light = the wire palette at the default tint: paper, card, sheet, hairline, ink / muted / faint
    '--cl-bg': dark ? n(0.2, 0.3) : n(0.96, 0.9),
    '--cl-surface': dark ? n(0.235, 0.4) : n(0.98, 0.7),
    '--cl-surface-2': dark ? n(0.28, 0.5) : n(0.912, 1.4),
    '--cl-border': dark ? n(0.33, 0.6) : n(0.876, 1.4),
    '--cl-border-strong': dark ? n(0.42, 0.6) : n(0.8, 1.2),
    '--cl-text': ink,
    '--cl-text-muted': dark ? n(0.74, 0.8) : n(0.526, 0.9),
    '--cl-text-faint': dark ? n(0.6, 0.8) : n(0.66, 1.1),
    // destructive stays a (muted) semantic red: a state, not a brand colour
    '--cl-danger': dark ? cssOf(0.68, 0.13, 27) : cssOf(0.52, 0.15, 28),
    '--cl-danger-soft': cssOf(0.6, 0.2, 27, dark ? 0.2 : 0.1),
    '--cl-on-danger': '#ffffff',
    '--cl-radius': `${t.radius}px`,
    '--cl-radius-lg': `${Math.round(t.radius * 1.5)}px`,
    '--cl-border-w': `${t.borderWidth}px`,
    '--cl-shadow-sm': shadowSm,
    '--cl-shadow-md': shadowMd,
    '--cl-shadow-lg': shadowLg,
    '--cl-press': hard ? 'translate(2px, 2px)' : 'translateY(1px)',
    '--cl-font': FONT_STACKS[t.font] ?? FONT_STACKS.plex,
    '--cl-weight': String(t.weight),
    '--cl-text-xs': fs(-1),
    '--cl-text-sm': fs(0),
    '--cl-text-md': fs(1),
    '--cl-text-lg': fs(2),
    '--cl-text-xl': fs(3),
    '--cl-h-sm': `${d.h[0]}px`, '--cl-h-md': `${d.h[1]}px`, '--cl-h-lg': `${d.h[2]}px`,
    '--cl-px-sm': `${d.px[0]}px`, '--cl-px-md': `${d.px[1]}px`, '--cl-px-lg': `${d.px[2]}px`,
    '--cl-pad': `${d.pad}px`,
    '--cl-gap': `${d.gap}px`,
  }
}

/* --- contrast report ------------------------------------------------------ */
export function contrastReport(t: Tokens, theme: Theme) {
  const v = deriveVars(t, theme)
  const solid = (css: string) => (css.startsWith('#') ? css : (formatHex(clampChroma(css, 'oklch') ?? css) ?? '#000000'))
  const pair = (label: string, fg: string, bg: string) => ({ label, fg: solid(fg), bg: solid(bg), ratio: wcagContrast(solid(fg), solid(bg)) })
  return [
    pair('Label on accent', v['--cl-on-accent'], v['--cl-accent']),
    pair('Text on surface', v['--cl-text'], v['--cl-surface']),
    pair('Muted on surface', v['--cl-text-muted'], v['--cl-surface']),
    pair('Accent text on bg', v['--cl-accent-text'], v['--cl-bg']),
  ]
}
export const grade = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail')

/* --- exports ---------------------------------------------------------------- */
const block = (sel: string, vars: Record<string, string>) => `${sel} {\n${Object.entries(vars).map(([k, val]) => `  ${k}: ${val};`).join('\n')}\n}`
export function tokensCSS(t: Tokens) {
  return `/* Generated by Component lab — ${new Date().toISOString().slice(0, 10)} */\n${block(':root', deriveVars(t, 'light'))}\n\n${block(':root[data-theme="dark"]', deriveVars(t, 'dark'))}\n\n@media (prefers-color-scheme: dark) {\n${block('  :root:not([data-theme="light"])', deriveVars(t, 'dark')).replace(/^/gm, '  ').trimStart()}\n}\n`
}

/** W3C Design Tokens Community Group format */
export function tokensDTCG(t: Tokens) {
  const L = deriveVars(t, 'light'), D = deriveVars(t, 'dark')
  const color = (k: string) => ({ $type: 'color', $value: L[k], $extensions: { 'mode.dark': D[k] } })
  const dim = (v: string) => ({ $type: 'dimension', $value: v })
  return {
    $description: 'Component lab tokens',
    color: {
      accent: { ...color('--cl-accent'), $description: `oklch(${t.accentL} ${t.accentC} ${t.accentH})` },
      'accent-hover': color('--cl-accent-hover'), 'on-accent': color('--cl-on-accent'),
      bg: color('--cl-bg'), surface: color('--cl-surface'), 'surface-2': color('--cl-surface-2'),
      border: color('--cl-border'), text: color('--cl-text'), 'text-muted': color('--cl-text-muted'), danger: color('--cl-danger'),
    },
    radius: { control: dim(L['--cl-radius']), card: dim(L['--cl-radius-lg']) },
    border: { width: dim(L['--cl-border-w']) },
    font: {
      family: { $type: 'fontFamily', $value: L['--cl-font'] },
      size: Object.fromEntries(['xs', 'sm', 'md', 'lg', 'xl'].map((k) => [k, dim(L[`--cl-text-${k}`])])),
      weight: { label: { $type: 'fontWeight', $value: t.weight } },
    },
    size: { control: { sm: dim(L['--cl-h-sm']), md: dim(L['--cl-h-md']), lg: dim(L['--cl-h-lg']) } },
    shadow: { sm: { $type: 'shadow', $value: L['--cl-shadow-sm'] }, md: { $type: 'shadow', $value: L['--cl-shadow-md'] } },
  }
}

export function tokensTailwind(t: Tokens) {
  const v = deriveVars(t, 'light')
  return `@theme {\n  --color-accent: ${v['--cl-accent']};\n  --color-accent-foreground: ${v['--cl-on-accent']};\n  --color-background: ${v['--cl-bg']};\n  --color-surface: ${v['--cl-surface']};\n  --color-muted: ${v['--cl-surface-2']};\n  --color-border: ${v['--cl-border']};\n  --color-foreground: ${v['--cl-text']};\n  --color-muted-foreground: ${v['--cl-text-muted']};\n  --color-destructive: ${v['--cl-danger']};\n  --radius-md: ${v['--cl-radius']};\n  --radius-lg: ${v['--cl-radius-lg']};\n  --font-sans: ${v['--cl-font']};\n  --text-sm: ${v['--cl-text-sm']};\n  --text-base: ${v['--cl-text-md']};\n  --text-lg: ${v['--cl-text-lg']};\n}\n`
}
