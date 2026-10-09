/* ---------------------------------------------------------------------------
   EasingEditor — the popover body you get by clicking the segment between
   two keyframes (Figma Motion / Theatre.js). One preset row (Linear, Ease
   in, Ease out, Ease in out, Back, Hold, Spring) above three editors:
   Curve (kit CurveEditor), Spring (Duration + Bounce, see SpringField) and
   Hold. Also pastes a CSS `cubic-bezier(…)` string.

     <EasingEditor value={ease} onChange={(e, final) => …} span={segmentMs} />
--------------------------------------------------------------------------- */
import { useState, type ReactNode } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { cn, CurveEditor, CurveGlyph, Segmented, IconButton, toast } from '@kit'
import type { Bezier, Ease } from '../engine'
import { SpringField } from './SpringField'

const PRESETS: { name: string; ease: Ease }[] = [
  { name: 'Linear', ease: { kind: 'bezier', p: [0, 0, 1, 1] } },
  { name: 'Ease in', ease: { kind: 'bezier', p: [0.42, 0, 1, 1] } },
  { name: 'Ease out', ease: { kind: 'bezier', p: [0, 0, 0.58, 1] } },
  { name: 'Ease in out', ease: { kind: 'bezier', p: [0.42, 0, 0.58, 1] } },
  { name: 'Back', ease: { kind: 'bezier', p: [0.34, 1.56, 0.64, 1] } },
  { name: 'Spring', ease: { kind: 'spring', duration: 500, bounce: 0.3 } },
  { name: 'Hold', ease: { kind: 'hold' } },
]
const same = (a: Ease, b: Ease) => JSON.stringify(a) === JSON.stringify(b)
export const easeName = (e: Ease) =>
  PRESETS.find((p) => same(p.ease, e))?.name ?? (e.kind === 'spring' ? `Spring ${e.duration}ms` : e.kind === 'hold' ? 'Hold' : 'Custom curve')

/** Small glyph for an ease, for timeline segments and menus. */
export function EaseGlyph({ ease, className }: { ease: Ease; className?: string }) {
  if (ease.kind === 'bezier') return <CurveGlyph value={ease.p} className={className} />
  if (ease.kind === 'hold')
    return <svg viewBox="-2 -6 24 28" className={cn('size-4', className)}><path d="M0,20 H14 V0 H20" fill="none" stroke="currentColor" strokeWidth={1.75} /></svg>
  return <svg viewBox="-2 -6 24 28" className={cn('size-4', className)}><path d="M0,20 C4,-6 7,-6 9,4 C11,12 13,2 15,0 C17,-2 18,1 20,0" fill="none" stroke="currentColor" strokeWidth={1.75} /></svg>
}

export function EasingEditor({ value, onChange, span, footer }: { value: Ease; onChange: (e: Ease, final: boolean) => void; span: number; footer?: ReactNode }) {
  // Remember the last of each kind so flipping tabs is lossless.
  const [memo, setMemo] = useState<{ bezier: Bezier; spring: { duration: number; bounce: number } }>(() => ({
    bezier: value.kind === 'bezier' ? value.p : [0.42, 0, 0.58, 1],
    spring: value.kind === 'spring' ? { duration: value.duration, bounce: value.bounce } : { duration: Math.min(800, Math.max(200, span)), bounce: 0.3 },
  }))
  const set = (e: Ease, final: boolean) => {
    if (e.kind === 'bezier') setMemo((m) => ({ ...m, bezier: e.p }))
    if (e.kind === 'spring') setMemo((m) => ({ ...m, spring: { duration: e.duration, bounce: e.bounce } }))
    onChange(e, final)
  }
  const paste = async () => {
    try {
      const s = await navigator.clipboard.readText()
      const m = s.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
      if (m) set({ kind: 'bezier', p: [+m[1], +m[2], +m[3], +m[4]] }, true)
      else toast('No cubic-bezier() on the clipboard', { type: 'error' })
    } catch { toast('Clipboard is not available', { type: 'error' }) }
  }
  return (
    <div className="flex w-[264px] flex-col gap-2.5 p-3">
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => set(p.ease, true)}
            className={cn('flex h-6 items-center gap-1 rounded-[5px] pr-1.5 pl-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-accent',
              same(p.ease, value) ? 'bg-accent-soft text-accent' : 'bg-hover text-muted hover:text-fg')}>
            <EaseGlyph ease={p.ease} className="size-3.5" />
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Segmented
          size="sm"
          label="Easing type"
          value={value.kind}
          onChange={(k) => set(k === 'bezier' ? { kind: 'bezier', p: memo.bezier } : k === 'spring' ? { kind: 'spring', ...memo.spring } : { kind: 'hold' }, true)}
          options={[{ value: 'bezier', label: 'Curve' }, { value: 'spring', label: 'Spring' }, { value: 'hold', label: 'Hold' }]}
        />
        {value.kind === 'bezier' && <IconButton icon={ClipboardPaste} size="icon-sm" label="Paste cubic-bezier()" onClick={paste} />}
      </div>
      {value.kind === 'bezier' && <CurveEditor value={value.p} onChange={(p, f) => set({ kind: 'bezier', p }, f)} presets={{}} height={120} />}
      {value.kind === 'spring' && <SpringField value={{ duration: value.duration, bounce: value.bounce }} span={span} onChange={(s, f) => set({ kind: 'spring', ...s }, f)} />}
      {value.kind === 'hold' && (
        <div className="flex flex-col gap-2">
          <SpringGraphHold />
          <p className="text-[11.5px] leading-relaxed text-muted">The value stays put, then jumps when the next key is reached. Use it for colour swaps and visibility.</p>
        </div>
      )}
      {footer && <div className="border-t border-line pt-2 text-[11px] text-faint">{footer}</div>}
    </div>
  )
}

function SpringGraphHold() {
  return (
    <svg viewBox="0 0 100 64" preserveAspectRatio="none" className="h-16 w-full rounded-[6px] bg-input">
      <polyline points="0,52 98,52 98,16 100,16" fill="none" stroke="var(--accent)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
