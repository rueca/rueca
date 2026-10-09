import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
