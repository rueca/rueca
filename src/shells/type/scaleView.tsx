/* Scale mode: the hierarchy preview (artboard) and the tokens list (left panel). */
import { forwardRef, useEffect, useRef, type CSSProperties } from 'react'
import { Copy } from 'lucide-react'
import { copyText, toast, cn } from '@kit'
import { RATIOS, family, type V } from './params'
import { SPECIMEN_FAMILY, variationSettings } from './fonts'
import { rgba } from './specimen'
import type { Step } from './scale'

export const scaleWidth = (v: V) => (v.fluidOn ? v.previewVw : 1200)

/** Renders at its natural height and reports it, so the artboard always fits the hierarchy exactly. */
export const ScaleArtboard = forwardRef<HTMLDivElement, { v: V; steps: Step[]; onHeight?: (h: number) => void }>(function ScaleArtboard({ v, steps, onHeight }, ref) {
  const own = useRef<HTMLDivElement | null>(null)
  const cb = useRef(onHeight)
  cb.current = onHeight
  useEffect(() => {
    const el = own.current
    if (!el) return
    const ro = new ResizeObserver(() => cb.current?.(Math.ceil(el.offsetHeight)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const setRef = (el: HTMLDivElement | null) => {
    own.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }
  const fam = family(v)
  const r = RATIOS[v.ratio]
  const meta: CSSProperties = { fontFamily: `"${SPECIMEN_FAMILY}", sans-serif`, fontSize: 12.5, lineHeight: 1.35, fontWeight: 500, fontVariationSettings: '"wght" 500, "opsz" 14', color: rgba(v.fg, 0.55), fontVariantNumeric: 'tabular-nums' }
  const pad = Math.min(72, Math.max(24, scaleWidth(v) * 0.05))
  return (
    <div ref={setRef} className="flex w-full flex-col" style={{ background: v.bg, padding: `56px ${pad}px`, fontFeatureSettings: 'normal' }}>
      <div data-svg-box className="flex items-end justify-between gap-6 pb-8" style={{ borderBottom: `1px solid ${rgba(v.fg, 0.14)}` }}>
        <div>
          <div data-svg-text style={meta}>Type scale</div>
          <div data-svg-text style={{ fontFamily: fam.css, fontSize: 34, lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 650, fontVariationSettings: variationSettings(fam, 650, 32, false, 34), color: v.fg, marginTop: 6 }}>
            {r?.label ?? 'Custom'} · {r?.value}
          </div>
        </div>
        <div data-svg-text style={{ ...meta, textAlign: 'right' }}>
          Base {v.base}px{v.fluidOn ? ` → ${v.fluidBase}px` : ''} · {steps.length} steps · {v.unit}
          {v.fluidOn ? ` · at ${v.previewVw}px` : ''}
        </div>
      </div>
      {steps.map((s) => {
        const heavy = s.i > 0
        const w = heavy ? v.wght : 420
        return (
          <div key={s.i} data-svg-box className="grid items-baseline gap-6 py-[18px]" style={{ gridTemplateColumns: scaleWidth(v) < 640 ? '96px 1fr' : '168px 1fr', borderBottom: `1px solid ${rgba(v.fg, 0.08)}` }}>
            <div>
              <div data-svg-text style={{ ...meta, color: rgba(v.fg, s.i === 0 ? 0.95 : 0.8), fontWeight: 600, fontVariationSettings: '"wght" 600, "opsz" 14' }}>{s.name}</div>
              <div data-svg-text style={{ ...meta, fontSize: 11, marginTop: 2 }}>{+s.px.toFixed(2)}px · {+(s.px / 16).toFixed(3)}rem</div>
              <div data-svg-text style={{ ...meta, fontSize: 11 }}>{s.leading.toFixed(2)} · {s.tracking ? `${(s.tracking * 100).toFixed(1)}%` : '0%'}</div>
            </div>
            <div
              data-svg-text
              className="overflow-hidden whitespace-nowrap"
              style={{
                fontFamily: fam.css, fontSize: s.px, lineHeight: s.leading, letterSpacing: `${s.tracking}em`, color: v.fg,
                fontWeight: Math.round(w), fontVariationSettings: variationSettings(fam, w, 14, true, s.px), fontStyle: v.italic ? 'italic' : 'normal',
              }}
            >
              {v.sampleText || 'The quick brown fox'}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export function TokensPanel({ v, steps }: { v: V; steps: Step[] }) {
  const maxPx = Math.max(...steps.map((s) => s.px))
  return (
    <div className="flex flex-col py-1">
      {steps.map((s) => (
        <button
          key={s.i}
          type="button"
          onClick={async () => { await copyText(`var(--text-${s.name})`); toast(`Copied var(--text-${s.name})`, { type: 'success' }) }}
          className={cn('group flex h-9 items-center gap-2 px-3 text-left outline-none hover:bg-hover focus-visible:bg-hover', s.i === 0 && 'bg-accent-soft/40')}
        >
          <span className={cn('w-14 shrink-0 truncate text-[11.5px]', s.i === 0 ? 'text-fg font-medium' : 'text-muted')}>{s.name}</span>
          <span className="relative h-1 min-w-0 flex-1 rounded-full bg-track">
            <span className={cn('absolute inset-y-0 left-0 rounded-full', s.i === 0 ? 'bg-accent' : 'bg-line-strong')} style={{ width: `${(s.px / maxPx) * 100}%` }} />
          </span>
          <span className="w-[74px] shrink-0 text-right tabular text-[11px] text-fg">{v.unit === 'rem' ? `${+(s.px / 16).toFixed(3)}rem` : `${+s.px.toFixed(2)}px`}</span>
          <Copy size={12} strokeWidth={1.5} className="shrink-0 text-faint opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </button>
      ))}
      <p className="px-3 pt-2 pb-2 text-[11px] leading-relaxed text-faint">Click a step to copy its custom property.</p>
    </div>
  )
}
