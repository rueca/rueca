import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* The kit's density names (theme.css) must be known to tailwind-merge, or `cn('h-control', 'h-8')` keeps both
   and `cn('text-ui', 'text-fg')` drops one of them as a clashing colour. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['row', 'control', 'control-sm', 'icon', 'icon-sm', 'button-lg', 'section', 'header', 'bar', 'dock', 'dock-button', 'pad', 'label', 'lane', 'ruler', 'gutter'],
      text: ['ui', 'ui-sm', 'title'],
      radius: ['panel', 'control', 'cluster', 'pop'],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Decimal places implied by a step, so 0.05 renders as 0.05 and 1 as 1. */
export const decimalsOf = (step = 1) => {
  const s = String(step)
  return s.includes('e-') ? Number(s.split('e-')[1]) : (s.split('.')[1]?.length ?? 0)
}
export const roundTo = (v: number, step = 1) => {
  const d = decimalsOf(step)
  return Number((Math.round(v / step) * step).toFixed(d))
}
