/* ---------------------------------------------------------------------------
   Colour. A swatch + hex chip in the row (Figma/Framer/Paper), a popover with
   a saturation/value area, hue and alpha rails, a format switch, the
   EyeDropper API where the browser has it, and recent colours.
--------------------------------------------------------------------------- */
import { Popover } from '@base-ui/react/popover'
import { Pipette } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clamp, cn } from '../core/cn'
import { Segmented } from './controls'
import { OklchField, hexToOklch, oklchToHex, type Oklch } from './oklch'

/* --- maths --- */
export type HSVA = { h: number; s: number; v: number; a: number }
export function hexToRgba(hex: string): [number, number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Number.isFinite(a) ? a : 1]
}
export const rgbaToHex = (r: number, g: number, b: number, a = 1) =>
  '#' + [r, g, b].map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('') + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : '')
export function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return [f(5) * 255, f(3) * 255, f(1) * 255]
}
export const hexToHsva = (hex: string): HSVA => { const [r, g, b, a] = hexToRgba(hex); return { ...rgbToHsv(r, g, b), a } }
export const hsvaToHex = ({ h, s, v, a }: HSVA) => { const [r, g, b] = hsvToRgb(h, s, v); return rgbaToHex(r, g, b, a) }
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  const { h } = rgbToHsv(r * 255, g * 255, b * 255)
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}
// sRGB → OKLab → OKLCH. Matrices from Björn Ottosson's OKLab reference,
// Copyright (c) 2020 Björn Ottosson, public domain / MIT (https://bottosson.github.io/posts/oklab/).
function rgbToOklch(r: number, g: number, b: number) {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + Bb * Bb)
  const H = (Math.atan2(Bb, A) * 180) / Math.PI
  return [L, C, (H + 360) % 360]
}
export function formatColor(hex: string, mode: 'hex' | 'rgb' | 'hsl' | 'oklch') {
  const [r, g, b, a] = hexToRgba(hex)
  const A = a < 1 ? ` / ${Math.round(a * 100)}%` : ''
  if (mode === 'rgb') return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}${A}`
  if (mode === 'hsl') { const [h, s, l] = rgbToHsl(r, g, b); return `${h}° ${s}% ${l}%${A}` }
  if (mode === 'oklch') { const [L, C, H] = rgbToOklch(r, g, b); return `${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(0)}${A}` }
  return hex.replace('#', '').toUpperCase().slice(0, 6)
}

/* --- pieces --- */
function useDrag(onMove: (x: number, y: number, final: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = (e: React.PointerEvent, final = false) => {
    const r = ref.current!.getBoundingClientRect()
    onMove(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1), final)
  }
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => { ref.current!.setPointerCapture(e.pointerId); handle(e) },
    onPointerMove: (e: React.PointerEvent) => ref.current!.hasPointerCapture(e.pointerId) && handle(e),
    onPointerUp: (e: React.PointerEvent) => { handle(e, true); ref.current!.releasePointerCapture(e.pointerId) },
  }
}

function Rail({ value, onChange, background, label, valueText }: { value: number; onChange: (v: number, final: boolean) => void; background: string; label: string; valueText?: (v: number) => string }) {
  const d = useDrag((x, _y, f) => onChange(x, f))
  return (
    <div
      {...d}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={valueText?.(value)}
      tabIndex={0}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.1 : 0.01
        const to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? value + step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? value - step : e.key === 'Home' ? 0 : e.key === 'End' ? 1 : null
        if (to !== null) { e.preventDefault(); onChange(clamp(to, 0, 1), true) }
      }}
      className="relative h-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-signal"
      style={{ background }}
    >
      <div className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.2),0_1px_3px_rgba(0,0,0,.4)]" style={{ left: `${value * 100}%` }} />
    </div>
  )
}

const RECENT_KEY = 'studio:recent-colors'
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }
const pushRecent = (hex: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([hex, ...readRecent().filter((c) => c !== hex)].slice(0, 16))) } catch { /* noop */ } }

export function ColorPanel({ value, onChange, alpha = true, swatches }: { value: string; onChange: (hex: string, final: boolean) => void; alpha?: boolean; swatches?: string[] }) {
  const [hsva, setHsva] = useState(() => hexToHsva(value))
  const [mode, setMode] = useState<'hex' | 'rgb' | 'hsl' | 'oklch'>('hex')
  const [text, setText] = useState(() => formatColor(value, 'hex'))
  const [recent] = useState(readRecent)
  // OKLCH mode edits perceptual lightness / chroma / hue directly (Paper). Kept separately so
  // hue survives through greys and out-of-gamut clamping doesn't fight the sliders.
  const [lch, setLch] = useState<Oklch>(() => hexToOklch(value))
  useEffect(() => { if (oklchToHex(lch).toLowerCase() !== value.slice(0, 7).toLowerCase()) setLch(hexToOklch(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  // Keep hue stable when the outside value is grey (h is undefined there).
  useEffect(() => {
    if (hsvaToHex(hsva).toLowerCase() !== value.toLowerCase()) {
      const n = hexToHsva(value)
      setHsva((p) => ({ ...n, h: n.s === 0 || n.v === 0 ? p.h : n.h }))
    }
    setText(formatColor(value, mode))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode])

  const emit = (n: HSVA, final: boolean) => { setHsva(n); const hex = hsvaToHex(n); onChange(hex, final); if (final) pushRecent(hex) }
  const area = useDrag((x, y, f) => emit({ ...hsva, s: x, v: 1 - y }, f))
  const [r, g, b] = hsvToRgb(hsva.h, hsva.s, hsva.v)
  const solid = rgbaToHex(r, g, b)
  const hueHex = hsvaToHex({ h: hsva.h, s: 1, v: 1, a: 1 })

  const applyText = () => {
    const t = text.trim()
    // tabbing through untouched must not commit (it used to reset alpha — break-it V15)
    if (t === formatColor(value, mode)) return
    if (mode === 'hex' && /^#?[0-9a-f]{3,8}$/i.test(t)) {
      const h = hexToHsva(t.startsWith('#') ? t : `#${t}`)
      // a hex without alpha digits keeps the current opacity
      emit(t.replace('#', '').length > 6 || t.replace('#', '').length === 4 ? h : { ...h, a: hsva.a }, true)
    }
    else if (mode === 'rgb') {
      const n = t.match(/[\d.]+/g)?.map(Number)
      if (n && n.length >= 3) emit({ ...rgbToHsv(n[0], n[1], n[2]), a: n[3] !== undefined ? n[3] / 100 : hsva.a }, true)
      else setText(formatColor(value, mode))
    } else if (mode === 'oklch') {
      // "62% 0.18 265" (L may be 0–1 or a percent); typed text used to be ignored in this mode
      const n = t.match(/-?[\d.]+/g)?.map(Number)
      if (n && n.length >= 3 && n.every(Number.isFinite)) {
        const l = /%/.test(t.split(/\s+/)[0]) || n[0] > 1 ? n[0] / 100 : n[0]
        const v = { l: clamp(l, 0, 1), c: clamp(n[1], 0, 0.5), h: ((n[2] % 360) + 360) % 360 }
        setLch(v)
        emit({ ...hexToHsva(oklchToHex(v)), a: n[3] !== undefined ? clamp(n[3] / 100, 0, 1) : hsva.a }, true)
      } else setText(formatColor(value, mode))
    } else setText(formatColor(value, mode))
  }

  const pick = async () => {
    const ED = (window as any).EyeDropper
    if (!ED) return
    try { const res = await new ED().open(); emit({ ...hexToHsva(res.sRGBHex), a: hsva.a }, true) } catch { /* cancelled */ }
  }

  return (
    <div className="flex w-[240px] flex-col gap-3 p-3">
      {mode === 'oklch' ? (
        <OklchField preview={false} value={lch} onChange={(v, f) => { setLch(v); emit({ ...hexToHsva(oklchToHex(v)), a: hsva.a }, f) }} />
      ) : (
      <div
        {...area}
        // The 2-D area is keyboard-operable too (WCAG 2.1.1, break-it A10): ←→ saturation, ↑↓ brightness.
        role="slider"
        aria-label="Saturation and brightness"
        aria-valuenow={Math.round(hsva.s * 100)}
        aria-valuetext={`Saturation ${Math.round(hsva.s * 100)}%, brightness ${Math.round(hsva.v * 100)}%`}
        tabIndex={0}
        onKeyDown={(e) => {
          const st = e.shiftKey ? 0.1 : 0.01
          const k = e.key
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) return
          e.preventDefault()
          emit({ ...hsva, s: clamp(hsva.s + (k === 'ArrowRight' ? st : k === 'ArrowLeft' ? -st : 0), 0, 1), v: clamp(hsva.v + (k === 'ArrowUp' ? st : k === 'ArrowDown' ? -st : 0), 0, 1) }, true)
        }}
        className="relative h-[150px] cursor-crosshair rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-signal"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueHex})` }}
      >
        <div
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.4)]"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: solid }}
        />
      </div>
      )}
      <div className="flex items-center gap-2">
        {'EyeDropper' in window && (
          <button type="button" aria-label="Pick from screen" onClick={pick} className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-fg-muted hover:bg-hover hover:text-fg">
            <Pipette size={14} strokeWidth={1.5} />
          </button>
        )}
        <div className="flex flex-1 flex-col gap-2">
          {mode !== 'oklch' && (
            <Rail label="Hue" valueText={(x) => `${Math.round(x * 360)}°`} value={hsva.h / 360} onChange={(x, f) => emit({ ...hsva, h: x * 360 }, f)}
              background="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" />
          )}
          {alpha && (
            <div className="checker rounded-full">
              <Rail label="Opacity" valueText={(x) => `${Math.round(x * 100)}%`} value={hsva.a} onChange={(x, f) => emit({ ...hsva, a: Math.round(x * 100) / 100 }, f)}
                background={`linear-gradient(to right, transparent, ${solid})`} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-[92px] shrink-0">
          <Segmented size="sm" value={mode} onChange={(m) => setMode(m as typeof mode)} options={[{ value: 'hex', label: 'Hex' }, { value: 'rgb', label: 'RGB' }, { value: 'oklch', label: 'Lch', hint: 'OKLCH' }]} />
        </div>
        <input
          aria-label={`Colour value (${mode === 'hex' ? 'hex' : mode.toUpperCase()})`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={applyText}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') applyText() }}
          className="h-6 w-full min-w-0 rounded-[5px] bg-control px-2 tabular text-[11px] text-fg uppercase outline-none focus:shadow-[inset_0_0_0_1px_var(--signal)]"
        />
      </div>
      {(swatches?.length || recent.length > 0) && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] text-fg-faint">{swatches?.length ? 'Swatches' : 'Recent'}</div>
          <div className="grid grid-cols-8 gap-1.5">
            {(swatches?.length ? swatches : recent).slice(0, 16).map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => emit(hexToHsva(c), true)}
                className="aspect-square rounded-[4px] shadow-[inset_0_0_0_1px_var(--line-strong)] hover:scale-110 transition-transform" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Swatch({ color, className, size = 16 }: { color: string; className?: string; size?: number }) {
  const [, , , a] = hexToRgba(color)
  return (
    <span className={cn('relative inline-block shrink-0 overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_var(--line-strong)]', a < 1 && 'checker', className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0" style={{ background: color }} />
    </span>
  )
}

/** The inline row control: swatch + value chip; opens the panel. */
export function ColorField({ value, onChange, alpha = true, swatches, changed, trailing }: { value: string; onChange: (hex: string, final: boolean) => void; alpha?: boolean; swatches?: string[]; changed?: boolean; trailing?: ReactNode }) {
  const [, , , a] = hexToRgba(value)
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'flex h-6 w-full min-w-0 items-center gap-2 rounded-[5px] bg-control pr-2 pl-1 text-left outline-none',
          'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]',
        )}
      >
        <Swatch color={value} />
        <span className={cn('flex-1 truncate tabular text-[11px] uppercase', changed === false ? 'text-fg-muted' : 'text-fg')}>{formatColor(value, 'hex')}</span>
        {alpha && <span className="tabular text-[11px] text-fg-faint">{Math.round(a * 100)}%</span>}
        {trailing}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[160]">
          <Popover.Popup className="pop origin-[var(--transform-origin)] outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <ColorPanel value={value} onChange={onChange} alpha={alpha} swatches={swatches} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/**
 * Darken a colour until white text on it clears `min` contrast (4.5 = WCAG AA body).
 * For avatars, tags and pins coloured by identity (--cat-*) that carry white labels.
 * (After shells/flows & journey `deepen`.)
 */
export function readableOn(hex: string, min = 4.5) {
  const [r, g, b] = hexToRgba(hex)
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const white = (t: number) => 1.05 / (0.2126 * lin(r * t) + 0.7152 * lin(g * t) + 0.0722 * lin(b * t) + 0.05)
  let t = 1
  while (t > 0.2 && white(t) < min) t -= 0.02
  return rgbaToHex(r * t, g * t, b * t)
}
