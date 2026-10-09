/* ---------------------------------------------------------------------------
   Modular type scale — pure maths + code export. size(i) = base · ratio^i,
   optionally fluid between two viewports (Utopia-style clamp()).
--------------------------------------------------------------------------- */
import type { V } from './params'
import { RATIOS } from './params'

export interface Step {
  i: number
  name: string
  /** px at the min viewport (or the static size) */
  min: number
  /** px at the max viewport (= min when not fluid) */
  max: number
  /** px resolved at the preview viewport */
  px: number
  leading: number
  /** em */
  tracking: number
  /** CSS value for font-size */
  css: string
}

const TSHIRT_UP = ['lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl']
const TSHIRT_DOWN = ['sm', 'xs', '2xs', '3xs']
const ROLES_DOWN = ['small', 'caption', 'micro', 'nano']

export function stepName(i: number, up: number, naming: string) {
  if (naming === 'numeric') return `step-${i}`
  if (naming === 'headings') {
    if (i === 0) return 'body'
    if (i < 0) return ROLES_DOWN[-i - 1] ?? `step-${i}`
    const rank = up - i + 1 // 1 = largest
    const display = Math.max(0, up - 6)
    return rank <= display ? `display-${display - rank + 1}` : `h${rank - display}`
  }
  if (i === 0) return 'base'
  return i > 0 ? TSHIRT_UP[i - 1] ?? `${i - 1}xl` : TSHIRT_DOWN[-i - 1] ?? `${-i}xs`
}

const snap = (px: number, mode: string) => (mode === 'px' ? Math.round(px) : mode === 'half' ? Math.round(px * 2) / 2 : Math.round(px * 1000) / 1000)

/** Inter's dynamic metrics, in em. */
export const interTracking = (px: number) => -0.0223 + 0.185 * Math.exp(-0.1745 * px)

const fmtNum = (n: number, d = 4) => String(Number(n.toFixed(d)))
export const toUnit = (px: number, unit: string) => (unit === 'rem' ? `${fmtNum(px / 16)}rem` : `${fmtNum(px, 2)}px`)

export function buildScale(v: V): Step[] {
  const r = RATIOS[v.ratio]?.value ?? 1.25
  const r2 = RATIOS[v.fluidRatio]?.value ?? r
  const [vw0, vw1] = v.viewports
  const out: Step[] = []
  for (let i = v.stepsUp; i >= -v.stepsDown; i--) {
    const min = snap(v.base * Math.pow(r, i), v.rounding)
    const max = v.fluidOn ? snap(v.fluidBase * Math.pow(r2, i), v.rounding) : min
    // resolve at the preview viewport
    const k = v.fluidOn ? Math.min(1, Math.max(0, (v.previewVw - vw0) / Math.max(1, vw1 - vw0))) : 0
    const px = min + (max - min) * k
    // leading: body below/at 0, eases to display at the top step
    const u = i <= 0 ? 0 : i / Math.max(1, v.stepsUp)
    const leading = Math.round((v.leadBody + (v.leadDisplay - v.leadBody) * Math.pow(u, 0.8)) * 100) / 100
    const tracking = v.dynTracking ? Math.round(interTracking(px) * 1000) / 1000 : 0
    let css = toUnit(min, v.unit)
    if (v.fluidOn && max !== min) {
      // clamp(min, intercept + slope·vw, max)
      const slope = (max - min) / (vw1 - vw0)
      const intercept = min - slope * vw0
      const lo = Math.min(min, max), hi = Math.max(min, max)
      const icpt = v.unit === 'rem' ? `${fmtNum(intercept / 16)}rem` : `${fmtNum(intercept, 2)}px`
      css = `clamp(${toUnit(lo, v.unit)}, ${icpt} + ${fmtNum(slope * 100, 3)}vw, ${toUnit(hi, v.unit)})`
    }
    out.push({ i, name: stepName(i, v.stepsUp, v.naming), min, max, px, leading, tracking, css })
  }
  return out
}

const em = (n: number) => (n === 0 ? '0' : `${fmtNum(n, 3)}em`)

export function scaleCSS(v: V, steps = buildScale(v)) {
  const r = RATIOS[v.ratio]
  const lines = steps.map((s) => [
    `  --text-${s.name}: ${s.css};`,
    `  --text-${s.name}--line-height: ${s.leading};`,
    ...(s.tracking ? [`  --text-${s.name}--letter-spacing: ${em(s.tracking)};`] : []),
  ].join('\n'))
  return `/* Type scale — ${r?.label ?? v.ratio} (${r?.value}) · base ${v.base}px${v.fluidOn ? ` → ${v.fluidBase}px · fluid ${v.viewports[0]}–${v.viewports[1]}px` : ''} */
:root {
${lines.join('\n')}
}`
}

/** Tailwind v4 — drop into your CSS. Generates text-* utilities with paired line-height / tracking. */
export function scaleTailwind4(v: V, steps = buildScale(v)) {
  return `@theme {
${steps.map((s) => [
    `  --text-${s.name}: ${s.css};`,
    `  --text-${s.name}--line-height: ${s.leading};`,
    ...(s.tracking ? [`  --text-${s.name}--letter-spacing: ${em(s.tracking)};`] : []),
  ].join('\n')).join('\n')}
}`
}

/** Tailwind v3 — theme.extend.fontSize */
export function scaleTailwind3(v: V, steps = buildScale(v)) {
  const body = steps.map((s) => `      '${s.name}': ['${s.css}', { lineHeight: '${s.leading}'${s.tracking ? `, letterSpacing: '${em(s.tracking)}'` : ''} }],`).join('\n')
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
${body}
      },
    },
  },
}`
}

export function scaleHeight(steps: Step[]) {
  // header (56 pad + 62 + 33) + bottom pad 56; each row = content + 36 padding + 1 rule
  return Math.ceil(216 + steps.reduce((a, s) => a + Math.max(50, s.px * s.leading) + 37, 0))
}
