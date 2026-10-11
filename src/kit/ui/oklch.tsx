/* ---------------------------------------------------------------------------
   OklchField — a perceptual colour control (Paper, tweakcn, Radix colours):
   three rails painted IN the space they edit, each with a typed number.

     <OklchField value={{ l: 0.62, c: 0.19, h: 255 }} onChange={(v, final) => …} />
     oklchToHex(v) · hexToOklch('#0d99ff') · gamutOf(v) · maxChroma(l, h, 'srgb')

   Behaviour
     · L 0–100 %, C 0–`maxC` (default 0.37), H 0–360°; drag a rail or scrub /
       type the number beside it (the non-drag path, WCAG 2.5.7)
     · the chroma rail marks where sRGB and Display P3 run out at this L and H,
       and a badge says which gamut the colour lives in — "why does my accent
       look duller in the export" is answered before it is asked
     · out-of-gamut colours preview as CSS oklch() (the browser maps them) and
       `oklchToHex` clamps chroma, so exports never clip a channel
     · `preview={false}` drops the swatch header, for embedding in a picker
   Keyboard on each rail (role="slider"): ← → / ↑ ↓ 1 % (shift 10 %),
   PgUp / PgDn 10 %, Home / End. Reports final=false mid-drag, true on release.
   Maths: OKLab (Björn Ottosson, public domain / MIT) + the standard linear
   sRGB → Display P3 matrix. No dependencies.

   Slotting into the kit ColorPanel (planned): a fourth format tab "OKLCH"
   that swaps the HSV area for <OklchField preview={false}> bound through
   hexToOklch / oklchToHex — see the wave-2 report for the exact change.
   (Promoted from shells/component-lab/local/OklchField.tsx.)
--------------------------------------------------------------------------- */
import { useRef } from 'react'
import { clamp, cn } from '../core/cn'
import { ScrubValue } from './scrub'
import { Tip } from './tooltip'
import { Badge } from './controls'

export interface Oklch { l: number; c: number; h: number }
export type Gamut = 'srgb' | 'p3'

/* --- maths ---------------------------------------------------------------- */

function oklchToLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr), b = c * Math.sin(hr)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}
const toP3 = ([r, g, b]: [number, number, number]): [number, number, number] => [
  0.8224621 * r + 0.177538 * g,
  0.0331941 * r + 0.9668058 * g,
  0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
]
const EPS = 1e-4
const fits = (rgb: number[]) => rgb.every((v) => v >= -EPS && v <= 1 + EPS)

/** Does the colour fit the gamut? */
export function inGamut(v: Oklch, gamut: Gamut = 'srgb') {
  const lin = oklchToLinearSrgb(v)
  return fits(gamut === 'srgb' ? lin : toP3(lin))
}
/** The largest chroma at (l, h) that still fits the gamut. */
export function maxChroma(l: number, h: number, gamut: Gamut = 'srgb') {
  let lo = 0, hi = 0.45
  for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (inGamut({ l, c: m, h }, gamut)) lo = m; else hi = m }
  return lo
}
/** 'sRGB' · 'P3' · 'Out of gamut' */
export function gamutOf(v: Oklch): 'sRGB' | 'P3' | 'Out of gamut' {
  return inGamut(v, 'srgb') ? 'sRGB' : inGamut(v, 'p3') ? 'P3' : 'Out of gamut'
}
const enc = (x: number) => { const v = clamp(x, 0, 1); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055 }
/** sRGB hex, chroma-clamped into gamut (never clips a channel). */
export function oklchToHex(v: Oklch) {
  const c = Math.min(v.c, inGamut(v) ? v.c : maxChroma(v.l, v.h))
  const rgb = oklchToLinearSrgb({ ...v, c }).map(enc)
  return '#' + rgb.map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}
/** Hex (#rgb / #rrggbb, alpha ignored) → OKLCH. Hue is 0 for greys. */
export function hexToOklch(hex: string): Oklch {
  let s = hex.replace('#', '').trim()
  if (s.length === 3 || s.length === 4) s = s.split('').map((x) => x + x).join('')
  const n = parseInt(s.slice(0, 6), 16)
  const lin = (x: number) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  const [R, G, B] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const q = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q
  const C = Math.sqrt(A * A + Bb * Bb)
  return { l: L, c: C < 1e-4 ? 0 : C, h: C < 1e-4 ? 0 : (((Math.atan2(Bb, A) * 180) / Math.PI) + 360) % 360 }
}
/** CSS oklch() string. */
export const oklchCSS = ({ l, c, h }: Oklch) => `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(0)})`

/* --- pieces --------------------------------------------------------------- */

function Rail({ value, min, max, onChange, background, label, marks = [], fmt }: {
  value: number; min: number; max: number; onChange: (v: number, final: boolean) => void; background: string; label: string
  marks?: { at: number; label: string }[]; fmt: (v: number) => string
}) {
  const el = useRef<HTMLDivElement>(null)
  const at = (clientX: number) => { const r = el.current!.getBoundingClientRect(); return min + clamp((clientX - r.left) / r.width, 0, 1) * (max - min) }
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100
  const span = max - min
  return (
    <div
      ref={el}
      role="slider" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={fmt(value)} tabIndex={0}
      onPointerDown={(e) => { el.current!.setPointerCapture(e.pointerId); onChange(at(e.clientX), false) }}
      onPointerMove={(e) => el.current!.hasPointerCapture(e.pointerId) && onChange(at(e.clientX), false)}
      onPointerUp={(e) => { if (!el.current!.hasPointerCapture(e.pointerId)) return; onChange(at(e.clientX), true); el.current!.releasePointerCapture(e.pointerId) }}
      onKeyDown={(e) => {
        const small = (span / 100) * (e.shiftKey ? 10 : 1)
        const step: Record<string, number> = { ArrowRight: small, ArrowUp: small, ArrowLeft: -small, ArrowDown: -small, PageUp: span / 10, PageDown: -span / 10 }
        if (e.key in step) onChange(clamp(value + step[e.key], min, max), true)
        else if (e.key === 'Home') onChange(min, true)
        else if (e.key === 'End') onChange(max, true)
        else return
        e.preventDefault()
        e.stopPropagation()
      }}
      className="relative h-3.5 min-w-0 flex-1 cursor-pointer rounded-full shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-signal"
      style={{ background }}
    >
      {marks.map((m) => (
        <Tip key={m.label} label={m.label}>
          <span className="absolute -top-0.5 -bottom-0.5 w-[2px] -translate-x-1/2 rounded-full bg-fg/70" style={{ left: `${((m.at - min) / span) * 100}%` }} />
        </Tip>
      ))}
      <span className="pointer-events-none absolute top-1/2 size-4 -translate-1/2 rounded-full border-2 border-signal-fg shadow-[var(--shadow-segment)]" style={{ left: `${pct}%` }} />
    </div>
  )
}

const GAMUT_HINT = {
  sRGB: 'Displays the same on every screen',
  P3: 'Wide-gamut screens only. sRGB screens see the hex',
  'Out of gamut': 'Beyond Display P3: shown and exported chroma-clamped',
} as const

export function OklchField({ value, onChange, maxC = 0.37, preview = true, className }: {
  value: Oklch
  onChange: (v: Oklch, final: boolean) => void
  /** top of the chroma rail */
  maxC?: number
  /** swatch + oklch() + hex + gamut badge header */
  preview?: boolean
  className?: string
}) {
  const { l, c, h } = value
  const srgbMax = maxChroma(l, h, 'srgb')
  const p3Max = maxChroma(l, h, 'p3')
  const gamut = c <= srgbMax + EPS ? 'sRGB' : c <= p3Max + EPS ? 'P3' : 'Out of gamut'
  const css = oklchCSS(value)
  const stops = (f: (t: number) => string, n = 8) => Array.from({ length: n + 1 }, (_, i) => f(i / n)).join(', ')
  const set = (patch: Partial<Oklch>, final: boolean) => onChange({ ...value, ...patch }, final)
  const badge = (
    <Tip label={GAMUT_HINT[gamut]}>
      <span><Badge tone={gamut === 'sRGB' ? 'ok' : gamut === 'P3' ? 'accent' : 'rec'}>{gamut}</Badge></span>
    </Tip>
  )
  const row = (letter: string, rail: React.ReactNode, field: React.ReactNode) => (
    <div className="flex items-center gap-2">
      <span aria-hidden className="w-3 text-[10.5px] text-fg-faint">{letter}</span>
      {rail}
      {field}
    </div>
  )
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {preview && (
        <div className="flex items-center gap-2.5">
          <div className="checker relative size-10 shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <div className="absolute inset-0" style={{ background: css }} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-mono text-[11px] text-fg select-text">{css}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
              <span className="tabular uppercase select-text">{oklchToHex(value)}</span>
              {badge}
            </span>
          </div>
        </div>
      )}
      {row('L',
        <Rail label="Lightness" value={l} min={0} max={1} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v, f) => set({ l: Math.round(v * 1000) / 1000 }, f)}
          background={`linear-gradient(to right in oklch, ${stops((t) => `oklch(${t} ${c} ${h})`)})`} />,
        <ScrubValue boxed value={Math.round(l * 100)} min={0} max={100} step={1} unit="%" label="Lightness" onChange={(v, f) => set({ l: v / 100 }, f)} className="w-[52px] shrink-0" />)}
      {row('C',
        <Rail label="Chroma" value={c} min={0} max={maxC} fmt={(v) => v.toFixed(3)} onChange={(v, f) => set({ c: Math.round(v * 1000) / 1000 }, f)}
          background={`linear-gradient(to right in oklch, ${stops((t) => `oklch(${l} ${t * maxC} ${h})`)})`}
          marks={[{ at: srgbMax, label: `sRGB limit · ${srgbMax.toFixed(3)}` }, ...(p3Max - srgbMax > 0.005 ? [{ at: Math.min(p3Max, maxC), label: `P3 limit · ${p3Max.toFixed(3)}` }] : [])]} />,
        <ScrubValue boxed value={c} min={0} max={maxC} step={0.005} label="Chroma" onChange={(v, f) => set({ c: v }, f)} className="w-[52px] shrink-0" />)}
      {row('H',
        <Rail label="Hue" value={h} min={0} max={360} fmt={(v) => `${Math.round(v)}°`} onChange={(v, f) => set({ h: Math.round(v) }, f)}
          background={`linear-gradient(to right in oklch longer hue, oklch(${l} ${Math.max(c, 0.08)} 0), oklch(${l} ${Math.max(c, 0.08)} 359))`} />,
        <ScrubValue boxed value={h} min={0} max={360} step={1} unit="°" label="Hue" onChange={(v, f) => set({ h: v }, f)} className="w-[52px] shrink-0" />)}
      {!preview && <div className="flex justify-end">{badge}</div>}
    </div>
  )
}
