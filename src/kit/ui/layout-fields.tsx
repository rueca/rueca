/* ---------------------------------------------------------------------------
   Layout fields — the three hand-built rows every UI design tool needs and a
   param schema can't express: an alignment pad, a four-sided value, a paint.

     <AlignGrid x="start" y="center" dir="row" onChange={(x, y) => …} />
     <QuadField value={[t, r, b, l]} mode="pairs" onChange={(v, final) => …} />      // padding
     <QuadField value={radii} names={CORNER_NAMES} onChange={…} />                    // per-corner radius
     <PaintField value={paint} onChange={(p, final) => …} images={{ ridge: 'Ridge' }} imageURL={urlOf} />

   AlignGrid (Figma auto layout / Rive layouts) — 3×3 pad; the cell you pick is
     where the content sits, whatever the flow. The active cell draws bars
     oriented to `dir`, so the pad previews the flow; with `between` (space
     between) the whole main axis lights. Keyboard: one tab stop
     (role="radiogroup", aria-activedescendant); arrows move the alignment.
   QuadField — one value that can split into four (padding, per-corner radius,
     border widths). mode="single": one field ↔ four; mode="pairs": horizontal +
     vertical ↔ four. A collapsed field shows "Mixed" when its parts differ and
     scrubbing it sets them all. The "independent" toggle is aria-pressed;
     controlled via `split`/`onSplitChange`, otherwise remembered per mount.
     Order is CSS order: [top, right, bottom, left] (or tl, tr, br, bl).
   PaintField — one Fill / Stroke row: swatch + value chip opening a popover
     with paint TYPE tabs (Solid · Linear · Radial · Image), the matching
     editor, and opacity as its own scrub field beside the chip (Figma keeps
     opacity out of the picker). `paintCSS()` turns a paint into a CSS
     background. Every control inside is typed or clickable — no drag-only path.
   All report (value, final): final=false mid-drag, true on release → one undo step.
   (Promoted from shells/ui-design/local/AlignGrid.tsx, QuadField.tsx, PaintField.tsx.)
--------------------------------------------------------------------------- */
import { useId, useState, type ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Scan } from 'lucide-react'
import { cn } from '../core/cn'
import { ScrubValue } from './scrub'
import { Tip } from './tooltip'
import { Segmented, Select } from './controls'
import { ColorPanel, formatColor } from './color'
import { GradientEditor, ImageDrop } from './special'

/* ============================== AlignGrid ============================== */

export type Align = 'start' | 'center' | 'end'
const AX: Align[] = ['start', 'center', 'end']
const yName = (a: Align) => (a === 'start' ? 'top' : a === 'end' ? 'bottom' : 'middle')
const xName = (a: Align) => (a === 'start' ? 'left' : a === 'end' ? 'right' : 'centre')

export function AlignGrid({
  x, y, dir = 'row', onChange, between, label = 'Alignment', size = 64, disabled, className,
}: {
  x: Align
  y: Align
  /** main axis of the content — draws the bars horizontal or vertical */
  dir?: 'row' | 'column'
  onChange: (x: Align, y: Align) => void
  /** space-between on the main axis: the whole axis is "on" */
  between?: boolean
  label?: string
  /** px (default 64) */
  size?: number
  disabled?: boolean
  className?: string
}) {
  const uid = useId()
  const cellId = (cx: Align, cy: Align) => `${uid}-${cx}-${cy}`
  const onKey = (e: React.KeyboardEvent) => {
    const xi = AX.indexOf(x), yi = AX.indexOf(y)
    const k = e.key
    if (k === 'ArrowLeft' && xi > 0) onChange(AX[xi - 1], y)
    else if (k === 'ArrowRight' && xi < 2) onChange(AX[xi + 1], y)
    else if (k === 'ArrowUp' && yi > 0) onChange(x, AX[yi - 1])
    else if (k === 'ArrowDown' && yi < 2) onChange(x, AX[yi + 1])
    else if (k === 'Home') onChange('start', 'start')
    else if (k === 'End') onChange('end', 'end')
    else return
    e.preventDefault()
    e.stopPropagation()
  }
  return (
    <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} onKeyDown={disabled ? undefined : onKey}
      aria-activedescendant={cellId(x, y)}
      className={cn('grid shrink-0 grid-cols-3 grid-rows-3 rounded-control bg-control p-1 outline-none focus-visible:ring-2 focus-visible:ring-signal', disabled && 'pointer-events-none opacity-40', className)}
      style={{ width: size, height: size }}>
      {AX.map((cy) => AX.map((cx) => {
        const lit = between ? (dir === 'row' ? cy === y : cx === x) : cx === x && cy === y
        const cross = dir === 'row' ? cy : cx
        return (
          <div key={`${cx}${cy}`} id={cellId(cx, cy)} role="radio" aria-checked={cx === x && cy === y} aria-label={`${yName(cy)} ${xName(cx)}`}
            onClick={() => onChange(cx, cy)}
            className="group/cell flex cursor-pointer items-center justify-center rounded-[3px] hover:bg-hover">
            {lit ? (
              <span className={cn('flex gap-[2px]', dir === 'row' ? 'flex-row' : 'flex-col', cross === 'start' ? 'items-start' : cross === 'end' ? 'items-end' : 'items-center')}>
                {[0.6, 1, 0.75].map((k, i) => (
                  <span key={i} className="rounded-[1px] bg-signal" style={dir === 'row' ? { width: 2, height: 9 * k } : { height: 2, width: 9 * k }} />
                ))}
              </span>
            ) : (
              <span className="size-[3px] rounded-full bg-fg-faint opacity-60 group-hover/cell:opacity-100" />
            )}
          </div>
        )
      }))}
    </div>
  )
}

/* ============================== QuadField ============================== */

export type Quad = [number, number, number, number]
export const SIDE_NAMES: [string, string, string, string] = ['Top', 'Right', 'Bottom', 'Left']
export const CORNER_NAMES: [string, string, string, string] = ['Top left', 'Top right', 'Bottom right', 'Bottom left']

const isSplit = (v: Quad, mode: 'single' | 'pairs') => (mode === 'single' ? v.some((n) => n !== v[0]) : v[0] !== v[2] || v[1] !== v[3])

export function QuadField({
  value, onChange, mode = 'single', names = SIDE_NAMES, labels, prefix, toggleIcon, min = 0, max = 999, step = 1, unit, mixed, split: splitProp, onSplitChange, className,
}: {
  value: Quad
  onChange: (v: Quad, final: boolean) => void
  mode?: 'single' | 'pairs'
  /** accessible names of the four parts (default sides; CORNER_NAMES for radii) */
  names?: [string, string, string, string]
  /** short prefixes inside the four split fields (default the names' initials) */
  labels?: [ReactNode, ReactNode, ReactNode, ReactNode]
  /** prefix of the collapsed field(s): one node, or [horizontal, vertical] in pairs mode */
  prefix?: ReactNode | [ReactNode, ReactNode]
  toggleIcon?: ReactNode
  min?: number
  max?: number
  step?: number
  unit?: string
  /** multi-selection with differing values */
  mixed?: boolean
  split?: boolean
  onSplitChange?: (split: boolean) => void
  className?: string
}) {
  const [own, setOwn] = useState(() => isSplit(value, mode))
  const split = splitProp ?? own
  const setSplit = (s: boolean) => { if (splitProp === undefined) setOwn(s); onSplitChange?.(s) }
  const pre = labels ?? (names.map((n) => n.split(' ').map((w) => w[0]).join('')) as [string, string, string, string])
  const field = (v: number, set: (n: number, f: boolean) => void, p: ReactNode, label: string, isMixed = false) => (
    <ScrubValue boxed align="left" prefix={p} value={v} min={min} max={max} step={step} unit={unit} mixed={isMixed} onChange={set} label={label} className="min-w-0 flex-1" />
  )
  const toggle = (
    <Tip label={split ? 'Use one value' : 'Independent values'}>
      <button type="button" aria-pressed={split} aria-label={split ? 'Use one value' : 'Independent values'} onClick={() => setSplit(!split)}
        className={cn('flex size-icon shrink-0 items-center justify-center rounded-control outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', split ? 'bg-active text-fg' : 'text-fg-faint')}>
        {toggleIcon ?? <Scan size={12} strokeWidth={1.5} />}
      </button>
    </Tip>
  )
  if (split)
    return (
      <div className={cn('flex w-full items-start gap-1', className)}>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1">
          {value.map((v, i) => (
            <div key={i} className="flex min-w-0">
              {field(v, (n, f) => { const next = [...value] as Quad; next[i] = n; onChange(next, f) }, pre[i], names[i], mixed)}
            </div>
          ))}
        </div>
        {toggle}
      </div>
    )
  if (mode === 'pairs') {
    const [ph, pv] = Array.isArray(prefix) ? prefix : [prefix, prefix]
    return (
      <div className={cn('flex w-full items-center gap-1', className)}>
        {field(value[3], (n, f) => onChange([value[0], n, value[2], n], f), ph, `${names[1]} and ${names[3].toLowerCase()}`, mixed || value[1] !== value[3])}
        {field(value[0], (n, f) => onChange([n, value[1], n, value[3]], f), pv, `${names[0]} and ${names[2].toLowerCase()}`, mixed || value[0] !== value[2])}
        {toggle}
      </div>
    )
  }
  return (
    <div className={cn('flex w-full items-center gap-1', className)}>
      {field(value[0], (n, f) => onChange([n, n, n, n], f), prefix as ReactNode, 'All', mixed || value.some((v) => v !== value[0]))}
      {toggle}
    </div>
  )
}

/* ============================== PaintField ============================== */

export type PaintKind = 'solid' | 'linear' | 'radial' | 'image'
export interface Paint {
  kind: PaintKind
  /** solid colour (#rrggbb) — also the seed colour when switching kinds */
  color: string
  /** 0–1, separate from the colour's own alpha */
  opacity: number
  angle?: number
  stops?: { pos: number; color: string }[]
  /** image key (looked up through imageURL) or a data: URL */
  image?: string
  fit?: 'fill' | 'fit' | 'tile'
}

const KIND_LABEL: Record<PaintKind, string> = { solid: 'Solid', linear: 'Linear', radial: 'Radial', image: 'Image' }
const identity = (k?: string) => k ?? ''

/** A paint as a CSS `background` value (opacity not included). */
export function paintCSS(p: Paint, imageURL: (k?: string) => string = identity) {
  if (p.kind === 'solid') return p.color
  if (p.kind === 'image') {
    const url = `url("${imageURL(p.image)}")`
    return p.fit === 'tile' ? `${url} repeat` : `center / ${p.fit === 'fit' ? 'contain' : 'cover'} no-repeat ${url}`
  }
  const stops = [...(p.stops ?? [])].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos * 100}%`).join(', ')
  return p.kind === 'linear' ? `linear-gradient(${p.angle ?? 180}deg, ${stops})` : `radial-gradient(${stops})`
}

export function PaintField<T extends Paint>({
  value, onChange, kinds = ['solid', 'linear', 'radial', 'image'], images, imageURL = identity, opacity = true, label = 'Paint', className,
}: {
  value: T
  onChange: (p: T, final: boolean) => void
  /** which paint types to offer */
  kinds?: PaintKind[]
  /** image library to offer: key → label (an upload is always offered) */
  images?: Record<string, string>
  imageURL?: (k?: string) => string
  /** show the opacity field beside the chip */
  opacity?: boolean
  label?: string
  className?: string
}) {
  const set = (patch: Partial<Paint>, final: boolean) => onChange({ ...value, ...patch }, final)
  const setKind = (kind: PaintKind) => {
    if (kind === value.kind) return
    if (kind === 'solid') set({ kind, color: value.stops?.[0]?.color.slice(0, 7) ?? value.color }, true)
    else if (kind === 'image') set({ kind, image: value.image ?? Object.keys(images ?? {})[0], fit: value.fit ?? 'fill' }, true)
    else set({ kind, stops: value.stops ?? [{ pos: 0, color: value.color }, { pos: 1, color: `${value.color.slice(0, 7)}00` }], angle: value.angle ?? 180 }, true)
  }
  const chip = value.kind === 'solid' ? formatColor(value.color, 'hex') : value.kind === 'image' ? (images?.[value.image ?? ''] ?? 'Image') : KIND_LABEL[value.kind]
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-1', className)}>
      <Popover.Root>
        <Popover.Trigger aria-label={`${label}: ${KIND_LABEL[value.kind]} ${chip}`}
          className={cn('flex h-control min-w-0 flex-1 items-center gap-2 rounded-control bg-control pr-2 pl-1 text-left outline-none',
            'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]')}>
          <span className="checker relative size-4 shrink-0 overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <span className="absolute inset-0" style={{ background: paintCSS(value, imageURL), opacity: value.opacity }} />
          </span>
          <span className={cn('min-w-0 flex-1 truncate text-ui text-fg', value.kind === 'solid' && 'tabular uppercase')}>{chip}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[160]">
            <Popover.Popup className="pop w-[264px] origin-[var(--transform-origin)] outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              {kinds.length > 1 && (
                <div className="border-b border-line p-2">
                  <Segmented size="sm" value={value.kind} onChange={(k) => setKind(k as PaintKind)} label="Paint type"
                    options={kinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
                </div>
              )}
              {value.kind === 'solid' && <ColorPanel value={value.color} alpha={false} onChange={(c, f) => set({ color: c.slice(0, 7) }, f)} />}
              {(value.kind === 'linear' || value.kind === 'radial') && (
                <div className="p-3">
                  <GradientEditor value={{ angle: value.angle ?? 180, stops: value.stops ?? [] }} angle={value.kind === 'linear'} onChange={(g, f) => set({ angle: g.angle, stops: g.stops }, f)} />
                </div>
              )}
              {value.kind === 'image' && (
                <div className="flex flex-col gap-2 p-3">
                  {images && Object.keys(images).length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Image">
                      {Object.entries(images).map(([k, l]) => (
                        <button key={k} type="button" role="radio" aria-checked={value.image === k} aria-label={l} title={l} onClick={() => set({ image: k }, true)}
                          className={cn('aspect-square rounded-control bg-cover bg-center outline-none focus-visible:ring-2 focus-visible:ring-signal', value.image === k ? 'shadow-[0_0_0_2px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line)]')}
                          style={{ backgroundImage: `url("${imageURL(k)}")` }} />
                      ))}
                    </div>
                  )}
                  <ImageDrop compact value={value.image?.startsWith('data:') ? value.image : null} onChange={(d) => d && set({ image: d }, true)} />
                  <Select value={value.fit ?? 'fill'} onChange={(f) => set({ fit: f as Paint['fit'] }, true)} label="Image fit"
                    options={[{ value: 'fill', label: 'Fill' }, { value: 'fit', label: 'Fit' }, { value: 'tile', label: 'Tile' }]} />
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {opacity && (
        <ScrubValue boxed value={Math.round(value.opacity * 100)} min={0} max={100} step={1} unit="%" label={`${label} opacity`}
          onChange={(v, f) => set({ opacity: v / 100 }, f)} className="w-[50px] shrink-0" />
      )}
    </div>
  )
}
