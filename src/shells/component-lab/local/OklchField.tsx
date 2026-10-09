/* ---------------------------------------------------------------------------
   OklchField (kit candidate) — a perceptual colour control (Paper / tweakcn).

     <OklchField value={{ l, c, h }} onChange={(v, final) => …} />

   Three rails painted IN the space they edit (lightness, chroma, hue), each
   with a scrubbable number. The chroma rail marks where sRGB and Display P3
   run out, and a badge says which gamut the colour lives in — so "why does
   my accent look duller in the export" is answered before it is asked.
   Out-of-gamut colours are previewed and exported chroma-clamped.
--------------------------------------------------------------------------- */
import { useRef } from 'react'
import { displayable, inGamut, formatHex, clampChroma } from 'culori'
import { ScrubValue, Badge, Tip, clamp, cn } from '@kit'

export interface Oklch { l: number; c: number; h: number }
const p3 = inGamut('p3')
const col = (v: Oklch) => ({ mode: 'oklch' as const, l: v.l, c: v.c, h: v.h })

/** largest chroma at (l, h) that still fits the gamut */
function maxChroma(l: number, h: number, fits: (c: ReturnType<typeof col>) => boolean) {
  let lo = 0, hi = 0.4
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (fits(col({ l, c: m, h }))) lo = m; else hi = m }
  return lo
}

function Rail({ value, min, max, onChange, background, label, marks = [] }: {
  value: number; min: number; max: number; onChange: (v: number, final: boolean) => void; background: string; label: string; marks?: { at: number; label: string }[]
}) {
  const el = useRef<HTMLDivElement>(null)
  const at = (clientX: number) => { const r = el.current!.getBoundingClientRect(); return min + clamp((clientX - r.left) / r.width, 0, 1) * (max - min) }
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div
      ref={el}
      role="slider" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} tabIndex={0}
      onPointerDown={(e) => { el.current!.setPointerCapture(e.pointerId); onChange(at(e.clientX), false) }}
      onPointerMove={(e) => el.current!.hasPointerCapture(e.pointerId) && onChange(at(e.clientX), false)}
      onPointerUp={(e) => { onChange(at(e.clientX), true); el.current!.releasePointerCapture(e.pointerId) }}
      onKeyDown={(e) => {
        const step = ((max - min) / 100) * (e.shiftKey ? 10 : 1)
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value + step, min, max), true) }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - step, min, max), true) }
      }}
      className="relative h-3.5 min-w-0 flex-1 cursor-pointer rounded-full shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ background }}
    >
      {marks.map((m) => (
        <Tip key={m.label} label={m.label}>
          <span className="absolute -top-0.5 -bottom-0.5 w-[2px] -translate-x-1/2 rounded-full bg-fg/70" style={{ left: `${((m.at - min) / (max - min)) * 100}%` }} />
        </Tip>
      ))}
      <span className="pointer-events-none absolute top-1/2 size-4 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.25),0_1px_3px_rgba(0,0,0,.4)]" style={{ left: `${pct}%` }} />
    </div>
  )
}

export function OklchField({ value, onChange, className }: { value: Oklch; onChange: (v: Oklch, final: boolean) => void; className?: string }) {
  const { l, c, h } = value
  const srgbMax = maxChroma(l, h, displayable)
  const p3Max = maxChroma(l, h, p3)
  const gamut = c <= srgbMax + 1e-4 ? 'sRGB' : c <= p3Max + 1e-4 ? 'P3' : 'Out of gamut'
  const css = `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(0)})`
  const hex = formatHex(clampChroma(col(value), 'oklch'))
  const stops = (f: (t: number) => string, n = 8) => Array.from({ length: n + 1 }, (_, i) => f(i / n)).join(', ')
  const set = (patch: Partial<Oklch>, final: boolean) => onChange({ ...value, ...patch }, final)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2.5">
        <div className="checker relative size-10 shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--line-strong)]">
          <div className="absolute inset-0" style={{ background: css }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-[11px] text-fg select-text">{css}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-faint">
            <span className="tabular uppercase select-text">{hex}</span>
            <Tip label={gamut === 'sRGB' ? 'Displays everywhere' : gamut === 'P3' ? 'Wide-gamut screens only — sRGB screens see the hex' : 'Beyond Display P3 — shown and exported chroma-clamped'}>
              <span><Badge tone={gamut === 'sRGB' ? 'ok' : gamut === 'P3' ? 'accent' : 'rec'}>{gamut}</Badge></span>
            </Tip>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 text-[10.5px] text-faint">L</span>
        <Rail label="Lightness" value={l} min={0} max={1} onChange={(v, f) => set({ l: Math.round(v * 100) / 100 }, f)} background={`linear-gradient(to right in oklch, ${stops((t) => `oklch(${t} ${c} ${h})`)})`} />
        <ScrubValue boxed value={Math.round(l * 100)} min={0} max={100} step={1} unit="%" label="Lightness" onChange={(v, f) => set({ l: v / 100 }, f)} className="w-[52px] shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 text-[10.5px] text-faint">C</span>
        <Rail label="Chroma" value={c} min={0} max={0.37} onChange={(v, f) => set({ c: Math.round(v * 1000) / 1000 }, f)}
          background={`linear-gradient(to right in oklch, ${stops((t) => `oklch(${l} ${t * 0.37} ${h})`)})`}
          marks={[{ at: srgbMax, label: `sRGB limit · ${srgbMax.toFixed(3)}` }, ...(p3Max - srgbMax > 0.005 ? [{ at: p3Max, label: `P3 limit · ${p3Max.toFixed(3)}` }] : [])]} />
        <ScrubValue boxed value={c} min={0} max={0.37} step={0.005} label="Chroma" onChange={(v, f) => set({ c: v }, f)} className="w-[52px] shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 text-[10.5px] text-faint">H</span>
        <Rail label="Hue" value={h} min={0} max={360} onChange={(v, f) => set({ h: Math.round(v) }, f)} background={`linear-gradient(to right in oklch longer hue, oklch(${l} ${Math.max(c, 0.08)} 0), oklch(${l} ${Math.max(c, 0.08)} 359))`} />
        <ScrubValue boxed value={h} min={0} max={360} step={1} unit="°" label="Hue" onChange={(v, f) => set({ h: v }, f)} className="w-[52px] shrink-0" />
      </div>
    </div>
  )
}
