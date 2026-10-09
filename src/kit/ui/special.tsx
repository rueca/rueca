/* ---------------------------------------------------------------------------
   Specialist controls. Each one has a typed/keyboard equivalent for every
   drag (WCAG 2.5.7), because the numbers sit beside the gesture.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Link2, Unlink2, Dices, X } from 'lucide-react'
import { clamp, cn } from '../core/cn'
import { ScrubValue } from './scrub'
import { Swatch, ColorPanel, hexToRgba } from './color'
import { Popover } from '@base-ui/react/popover'
import { readFileAsDataURL } from '../core/io'
import { Tip } from './tooltip'

function usePointerDrag(onMove: (e: PointerEvent, rect: DOMRect, final: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const props = {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return
      ref.current!.setPointerCapture(e.pointerId)
      onMove(e.nativeEvent, ref.current!.getBoundingClientRect(), false)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (ref.current!.hasPointerCapture(e.pointerId)) onMove(e.nativeEvent, ref.current!.getBoundingClientRect(), false)
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!ref.current!.hasPointerCapture(e.pointerId)) return
      onMove(e.nativeEvent, ref.current!.getBoundingClientRect(), true)
      ref.current!.releasePointerCapture(e.pointerId)
    },
  }
  return props
}

/* --- Angle: a small dial + scrubbable degrees. Shift snaps to 15°. --- */
export function AngleDial({ value, onChange, size = 24, changed }: { value: number; onChange: (v: number, final: boolean) => void; size?: number; changed?: boolean }) {
  const drag = usePointerDrag((e, r, final) => {
    let a = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
    a = (a + 360) % 360
    if (e.shiftKey) a = Math.round(a / 15) * 15
    onChange(Math.round(a), final)
  })
  const rad = (value * Math.PI) / 180
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div {...drag} role="presentation" className="relative shrink-0 cursor-grab rounded-full bg-input shadow-[inset_0_0_0_1px_var(--line-strong)] active:cursor-grabbing" style={{ width: size, height: size }}>
        <div className="absolute top-1/2 left-1/2 h-px origin-left bg-accent" style={{ width: size / 2 - 3, transform: `rotate(${value}deg)` }} />
        <div className="absolute size-1.5 -translate-1/2 rounded-full bg-accent" style={{ left: size / 2 + Math.cos(rad) * (size / 2 - 4), top: size / 2 + Math.sin(rad) * (size / 2 - 4) }} />
      </div>
      <ScrubValue value={value} onChange={(v, f) => onChange(((v % 360) + 360) % 360, f)} step={1} unit="°" boxed className="flex-1" changed={changed} label="Angle" />
    </div>
  )
}

/* --- XY pad: a square field with a puck, plus two scrub fields. --- */
export function XYPad({
  value, onChange, min = -1, max = 1, step = 0.01, labels = ['X', 'Y'], changed, pad = true,
}: { value: { x: number; y: number }; onChange: (v: { x: number; y: number }, final: boolean) => void; min?: number; max?: number; step?: number; labels?: [string, string]; changed?: boolean; pad?: boolean }) {
  const span = max - min
  const drag = usePointerDrag((e, r, final) => {
    const x = min + clamp((e.clientX - r.left) / r.width, 0, 1) * span
    const y = min + clamp((e.clientY - r.top) / r.height, 0, 1) * span
    const q = (v: number) => Math.round(v / step) * step
    onChange({ x: Number(q(x).toFixed(4)), y: Number(q(y).toFixed(4)) }, final)
  })
  const px = ((value.x - min) / span) * 100
  const py = ((value.y - min) / span) * 100
  return (
    <div className="flex w-full flex-col gap-1.5">
      {pad && (
        <div {...drag} className="relative aspect-[2/1] w-full cursor-crosshair overflow-hidden rounded-[6px] bg-input shadow-[inset_0_0_0_1px_var(--line)]">
          <div className="absolute top-1/2 left-0 h-px w-full bg-line" />
          <div className="absolute top-0 left-1/2 h-full w-px bg-line" />
          <div className="absolute h-px w-full bg-accent/25" style={{ top: `${py}%` }} />
          <div className="absolute h-full w-px bg-accent/25" style={{ left: `${px}%` }} />
          <div className="absolute size-2.5 -translate-1/2 rounded-full bg-accent shadow-[0_0_0_2px_var(--panel)]" style={{ left: `${px}%`, top: `${py}%` }} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <ScrubValue boxed prefix={labels[0]} align="left" value={value.x} min={min} max={max} step={step} changed={changed} label={labels[0]} onChange={(x, f) => onChange({ ...value, x }, f)} />
        <ScrubValue boxed prefix={labels[1]} align="left" value={value.y} min={min} max={max} step={step} changed={changed} label={labels[1]} onChange={(y, f) => onChange({ ...value, y }, f)} />
      </div>
    </div>
  )
}

export function Vec3Fields({ value, onChange, step = 0.1, min, max, changed }: { value: { x: number; y: number; z: number }; onChange: (v: { x: number; y: number; z: number }, final: boolean) => void; step?: number; min?: number; max?: number; changed?: boolean }) {
  const axes = [['x', 'X', 'text-[#ff6b6b]'], ['y', 'Y', 'text-[#5fd37a]'], ['z', 'Z', 'text-[#5aa8ff]']] as const
  return (
    <div className="grid w-full grid-cols-3 gap-1">
      {axes.map(([k, l, c]) => (
        <ScrubValue key={k} boxed align="left" prefix={<span className={c}>{l}</span>} value={value[k]} step={step} min={min} max={max} changed={changed} label={l}
          onChange={(v, f) => onChange({ ...value, [k]: v }, f)} />
      ))}
    </div>
  )
}

/* --- W × H with a link toggle (Figma). --- */
export function SizeFields({
  value, onChange, min = 1, max = 10000, unit = '', lockDefault = false, changed,
}: { value: { w: number; h: number }; onChange: (v: { w: number; h: number }, final: boolean) => void; min?: number; max?: number; unit?: string; lockDefault?: boolean; changed?: boolean }) {
  const [lock, setLock] = useState(lockDefault)
  const ratio = value.w / Math.max(1, value.h)
  return (
    <div className="flex w-full items-center gap-1">
      <ScrubValue boxed align="left" prefix="W" value={value.w} min={min} max={max} unit={unit} changed={changed} label="Width"
        onChange={(w, f) => onChange(lock ? { w, h: Math.round(w / ratio) } : { ...value, w }, f)} className="flex-1" />
      <Tip label={lock ? 'Unlink proportions' : 'Link proportions'}>
        <button type="button" aria-pressed={lock} onClick={() => setLock(!lock)}
          className={cn('flex size-6 shrink-0 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent', lock ? 'text-accent' : 'text-faint')}>
          {lock ? <Link2 size={13} strokeWidth={1.5} /> : <Unlink2 size={13} strokeWidth={1.5} />}
        </button>
      </Tip>
      <ScrubValue boxed align="left" prefix="H" value={value.h} min={min} max={max} unit={unit} changed={changed} label="Height"
        onChange={(h, f) => onChange(lock ? { w: Math.round(h * ratio), h } : { ...value, h }, f)} className="flex-1" />
    </div>
  )
}

/* --- Seed: number + dice. R in the studio rerolls the focused seed. --- */
export function SeedField({ value, onChange, changed }: { value: number; onChange: (v: number, final: boolean) => void; changed?: boolean }) {
  return (
    <div className="flex w-full items-center gap-1">
      <ScrubValue boxed align="left" prefix="#" value={value} min={0} max={99999} step={1} changed={changed} onChange={onChange} className="flex-1" label="Seed" />
      <Tip label="New seed">
        <button type="button" aria-label="Randomise seed" onClick={() => onChange(Math.floor(Math.random() * 99999), true)}
          className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-muted outline-none hover:bg-hover hover:text-fg active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-accent">
          <Dices size={14} strokeWidth={1.5} />
        </button>
      </Tip>
    </div>
  )
}

/* --- Cubic-bezier editor with presets. Handles may overshoot vertically. --- */
export const EASINGS: Record<string, [number, number, number, number]> = {
  Linear: [0, 0, 1, 1],
  'Ease in': [0.42, 0, 1, 1],
  'Ease out': [0, 0, 0.58, 1],
  'Ease in out': [0.42, 0, 0.58, 1],
  'Out expo': [0.16, 1, 0.3, 1],
  'Out back': [0.34, 1.56, 0.64, 1],
  'In out quint': [0.83, 0, 0.17, 1],
}
export function CurveEditor({ value, onChange, presets = EASINGS, height = 132 }: { value: [number, number, number, number]; onChange: (v: [number, number, number, number], final: boolean) => void; presets?: Record<string, [number, number, number, number]>; height?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const which = useRef<0 | 1 | null>(null)
  const W = 100, H = 100, padY = 30
  const toPx = (x: number, y: number) => [x * W, padY + (1 - y) * H] as const
  const [x1, y1, x2, y2] = value
  const [ax, ay] = toPx(x1, y1), [bx, by] = toPx(x2, y2), [sx, sy] = toPx(0, 0), [ex, ey] = toPx(1, 1)
  const move = (e: React.PointerEvent, final: boolean) => {
    if (which.current === null) return
    const r = ref.current!.getBoundingClientRect()
    const x = clamp((e.clientX - r.left) / r.width, 0, 1)
    const y = 1 - ((e.clientY - r.top) / r.height * (H + padY * 2) - padY) / H
    const q = (n: number) => Math.round(n * 100) / 100
    const next = [...value] as [number, number, number, number]
    if (which.current === 0) { next[0] = q(x); next[1] = q(clamp(y, -0.5, 1.5)) } else { next[2] = q(x); next[3] = q(clamp(y, -0.5, 1.5)) }
    onChange(next, final)
  }
  const presetName = Object.entries(presets).find(([, v]) => v.join() === value.join())?.[0]
  return (
    <div className="flex w-full flex-col gap-2">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H + padY * 2}`}
        className="w-full touch-none overflow-visible rounded-[6px] bg-input"
        style={{ height }}
        preserveAspectRatio="none"
        onPointerMove={(e) => move(e, false)}
        onPointerUp={(e) => { move(e, true); which.current = null }}
      >
        <rect x={0} y={padY} width={W} height={H} fill="none" stroke="var(--line)" vectorEffect="non-scaling-stroke" />
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="var(--line)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        <line x1={sx} y1={sy} x2={ax} y2={ay} stroke="var(--fg-faint)" vectorEffect="non-scaling-stroke" />
        <line x1={ex} y1={ey} x2={bx} y2={by} stroke="var(--fg-faint)" vectorEffect="non-scaling-stroke" />
        <path d={`M${sx},${sy} C${ax},${ay} ${bx},${by} ${ex},${ey}`} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {[[ax, ay], [bx, by]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={4} ry={4 * ((H + padY * 2) / W) * (100 / height) * (height / 132)} fill="var(--panel)" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke"
            className="cursor-grab" onPointerDown={(e) => { which.current = i as 0 | 1; (e.target as Element).setPointerCapture?.(e.pointerId); (ref.current as SVGSVGElement).setPointerCapture(e.pointerId) }} />
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-1">
        {value.map((n, i) => (
          <ScrubValue key={i} boxed align="left" value={n} step={0.01} min={i % 2 === 0 ? 0 : -1} max={i % 2 === 0 ? 1 : 2} label={['x1', 'y1', 'x2', 'y2'][i]}
            onChange={(v, f) => { const next = [...value] as typeof value; next[i] = v; onChange(next, f) }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {Object.entries(presets).map(([name, v]) => (
          <button key={name} type="button" onClick={() => onChange(v, true)}
            className={cn('h-5 rounded-[5px] px-1.5 text-[10.5px] outline-none', presetName === name ? 'bg-accent-soft text-accent' : 'bg-hover text-muted hover:text-fg')}>
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A tiny curve glyph for the collapsed row. */
export function CurveGlyph({ value, className }: { value: [number, number, number, number]; className?: string }) {
  const [x1, y1, x2, y2] = value
  return (
    <svg viewBox="-2 -6 24 28" className={cn('size-4', className)}>
      <path d={`M0,20 C${x1 * 20},${20 - y1 * 20} ${x2 * 20},${20 - y2 * 20} 20,0`} fill="none" stroke="currentColor" strokeWidth={1.75} />
    </svg>
  )
}

/* --- Spring: stiffness / damping / mass with a live response preview. --- */
export function SpringEditor({ value, onChange }: { value: { stiffness: number; damping: number; mass: number }; onChange: (v: { stiffness: number; damping: number; mass: number }, final: boolean) => void }) {
  const pts: string[] = []
  let x = 0, v = 0
  const dt = 1 / 120
  for (let i = 0; i <= 240; i++) {
    const f = -value.stiffness * (x - 1) - value.damping * v
    v += (f / value.mass) * dt
    x += v * dt
    pts.push(`${(i / 240) * 100},${50 - clamp(x, -0.4, 1.6) * 34 + 14}`)
  }
  return (
    <div className="flex w-full flex-col gap-1.5">
      <svg viewBox="0 0 100 64" className="h-16 w-full rounded-[6px] bg-input" preserveAspectRatio="none">
        <line x1={0} x2={100} y1={30} y2={30} stroke="var(--line-strong)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid grid-cols-3 gap-1">
        <ScrubValue boxed align="left" prefix="K" value={value.stiffness} min={1} max={1000} step={1} label="Stiffness" onChange={(s, f) => onChange({ ...value, stiffness: s }, f)} />
        <ScrubValue boxed align="left" prefix="D" value={value.damping} min={0} max={100} step={0.5} label="Damping" onChange={(s, f) => onChange({ ...value, damping: s }, f)} />
        <ScrubValue boxed align="left" prefix="M" value={value.mass} min={0.1} max={10} step={0.1} label="Mass" onChange={(s, f) => onChange({ ...value, mass: s }, f)} />
      </div>
    </div>
  )
}

/* --- Gradient: a bar with draggable stops; click empty bar to add, drag off to remove. --- */
export function GradientEditor({ value, onChange }: { value: { angle: number; stops: { pos: number; color: string }[] }; onChange: (v: { angle: number; stops: { pos: number; color: string }[] }, final: boolean) => void }) {
  const [sel, setSel] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const dragging = useRef<number | null>(null)
  const css = `linear-gradient(90deg, ${[...value.stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos * 100}%`).join(', ')})`
  const setStop = (i: number, patch: Partial<{ pos: number; color: string }>, final: boolean) =>
    onChange({ ...value, stops: value.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) }, final)
  const cur = value.stops[sel] ?? value.stops[0]
  return (
    <div className="flex w-full flex-col gap-2">
      <div
        ref={bar}
        className="checker relative h-6 rounded-[6px]"
        onPointerDown={(e) => {
          if (e.target !== bar.current && (e.target as HTMLElement).dataset.fill === undefined) return
          const r = bar.current!.getBoundingClientRect()
          const pos = clamp((e.clientX - r.left) / r.width, 0, 1)
          onChange({ ...value, stops: [...value.stops, { pos, color: cur.color }] }, true)
          setSel(value.stops.length)
        }}
      >
        <div data-fill className="absolute inset-0 rounded-[6px] shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: css }} />
        {value.stops.map((s, i) => (
          <div
            key={i}
            role="slider"
            aria-label={`Stop ${i + 1}`}
            aria-valuenow={Math.round(s.pos * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setStop(i, { pos: clamp(s.pos + 0.01, 0, 1) }, true)
              if (e.key === 'ArrowLeft') setStop(i, { pos: clamp(s.pos - 0.01, 0, 1) }, true)
              if ((e.key === 'Delete' || e.key === 'Backspace') && value.stops.length > 2) { onChange({ ...value, stops: value.stops.filter((_, j) => j !== i) }, true); setSel(0) }
            }}
            onPointerDown={(e) => { e.stopPropagation(); setSel(i); dragging.current = i; (e.target as HTMLElement).setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => {
              if (dragging.current !== i) return
              const r = bar.current!.getBoundingClientRect()
              setStop(i, { pos: Number(clamp((e.clientX - r.left) / r.width, 0, 1).toFixed(3)) }, false)
            }}
            onPointerUp={(e) => {
              dragging.current = null
              const r = bar.current!.getBoundingClientRect()
              // Drag a stop well below the bar to delete it (Figma).
              if (e.clientY - r.bottom > 28 && value.stops.length > 2) { onChange({ ...value, stops: value.stops.filter((_, j) => j !== i) }, true); setSel(0) }
              else setStop(i, {}, true)
            }}
            className={cn('absolute top-1/2 h-[30px] w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-[4px] border-2 outline-none focus-visible:ring-2 focus-visible:ring-accent', sel === i ? 'border-accent' : 'border-white')}
            style={{ left: `${s.pos * 100}%`, background: s.color, boxShadow: '0 1px 3px rgba(0,0,0,.4)' }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Popover.Root>
          <Popover.Trigger className="flex h-6 flex-1 items-center gap-2 rounded-[5px] bg-input pr-2 pl-1 outline-none hover:shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <Swatch color={cur.color} />
            <span className="tabular text-[11px] uppercase text-fg">{cur.color.replace('#', '').slice(0, 6)}</span>
            <span className="ml-auto tabular text-[11px] text-faint">{Math.round(hexToRgba(cur.color)[3] * 100)}%</span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} className="z-[100]">
              <Popover.Popup className="pop outline-none"><ColorPanel value={cur.color} onChange={(c, f) => setStop(sel, { color: c }, f)} /></Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <ScrubValue boxed value={Math.round(cur.pos * 100)} min={0} max={100} unit="%" className="w-14" label="Stop position" onChange={(p, f) => setStop(sel, { pos: p / 100 }, f)} />
      </div>
      <AngleDial value={value.angle} onChange={(a, f) => onChange({ ...value, angle: a }, f)} />
    </div>
  )
}

/* --- Palette: a row of swatches; click to edit, + to add. --- */
export function PaletteField({ value, onChange, max = 8 }: { value: string[]; onChange: (v: string[], final: boolean) => void; max?: number }) {
  return (
    <div className="flex w-full flex-wrap gap-1">
      {value.map((c, i) => (
        <Popover.Root key={i}>
          <Popover.Trigger aria-label={`Colour ${i + 1}`} className="group/sw relative size-6 rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Swatch color={c} size={24} className="rounded-[5px]" />
            {value.length > 1 && (
              <span role="button" aria-label="Remove colour" onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i), true) }}
                className="absolute -top-1 -right-1 hidden size-3.5 items-center justify-center rounded-full bg-overlay text-muted shadow-[var(--shadow-segment)] group-hover/sw:flex">
                <X size={9} strokeWidth={2} />
              </span>
            )}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} className="z-[100]">
              <Popover.Popup className="pop outline-none"><ColorPanel value={c} onChange={(nc, f) => onChange(value.map((x, j) => (j === i ? nc : x)), f)} /></Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))}
      {value.length < max && (
        <button type="button" aria-label="Add colour" onClick={() => onChange([...value, value.at(-1) ?? '#ffffff'], true)}
          className="flex size-6 items-center justify-center rounded-[5px] text-faint shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-fg">+</button>
      )}
    </div>
  )
}

/* --- Image drop: drop, paste, or click. Keeps a data URL so presets survive reload. --- */
export function ImageDrop({ value, onChange, accept = 'image/*', compact }: { value: string | null; onChange: (v: string | null, final: boolean) => void; accept?: string; compact?: boolean }) {
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const take = async (f?: File | null) => { if (f && f.type.startsWith('image/')) onChange(await readFileAsDataURL(f), true) }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]) }}
      onPaste={(e) => take(e.clipboardData.files[0])}
      onClick={() => input.current?.click()}
      tabIndex={0}
      role="button"
      aria-label="Choose image"
      onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
      className={cn(
        'group/drop relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[7px] bg-input outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
        compact ? 'h-12' : 'h-[88px]',
        over ? 'shadow-[inset_0_0_0_1.5px_var(--accent)] bg-accent-soft' : 'shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--line-strong)]',
      )}
    >
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => take(e.target.files?.[0])} />
      {value ? (
        <>
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
          <button type="button" aria-label="Remove image" onClick={(e) => { e.stopPropagation(); onChange(null, true) }}
            className="absolute top-1 right-1 hidden size-5 items-center justify-center rounded-full bg-black/60 text-white group-hover/drop:flex"><X size={11} /></button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-faint">
          <ImagePlus size={16} strokeWidth={1.5} />
          {!compact && <span className="text-[11px]">Drop, paste or click</span>}
        </div>
      )}
    </div>
  )
}

/* --- Monitor: a live readout or sparkline. Polls its getter, never re-renders the parent. --- */
export function Monitor({ get, graph, min, max, fmt }: { get: () => number | string; graph?: boolean; min?: number; max?: number; fmt?: (v: number) => string }) {
  const [text, setText] = useState('')
  const canvas = useRef<HTMLCanvasElement>(null)
  const hist = useRef<number[]>([])
  useEffect(() => {
    let raf = 0, last = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 66) return
      last = now
      const v = get()
      setText(typeof v === 'number' ? (fmt ? fmt(v) : v.toFixed(2)) : v)
      if (!graph || typeof v !== 'number' || !canvas.current) return
      const h = hist.current
      h.push(v); if (h.length > 80) h.shift()
      const c = canvas.current, ctx = c.getContext('2d')!
      const dpr = devicePixelRatio
      c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr
      const lo = min ?? Math.min(...h), hi = max ?? Math.max(...h)
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent')
      ctx.strokeStyle = accent; ctx.lineWidth = 1.25 * dpr; ctx.beginPath()
      h.forEach((y, i) => {
        const X = (i / 79) * c.width, Y = c.height - ((y - lo) / Math.max(1e-6, hi - lo)) * (c.height - 4 * dpr) - 2 * dpr
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
      })
      ctx.stroke()
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [get, graph, min, max, fmt])
  return (
    <div className="flex w-full items-center gap-2">
      {graph && <canvas ref={canvas} className="h-6 min-w-0 flex-1 rounded-[4px] bg-input" />}
      <span className={cn('tabular text-[11px] text-fg', graph ? 'w-12 text-right' : 'flex-1 text-right')}>{text}</span>
    </div>
  )
}
