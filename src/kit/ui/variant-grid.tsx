/* ---------------------------------------------------------------------------
   VariantGrid + SizeLadder — browsing generated options (Midjourney, Oddgrid,
   Components AI, Khroma) and checking one at its real sizes.

     <VariantGrid items={items} render={(id) => <svg…/>} cursor={i} onCursor={setI}
       onOpen={focus} onLock={toggleLock} onFav={toggleFav}
       actions={(id) => <VariantAction label="More like this" icon={Grid2x2Plus} onClick={…} />}
       onColumns={(n) => (cols.current = n)} />

     <SizeLadder sizes={[16, 32, 64, 256]}
       surfaces={[{ label: 'Light', bg: paper, fg: ink }, { label: 'Dark', bg: ink, fg: paper }]}
       render={(size, surface) => <img src={…} width={size} height={size} />} />

   VariantGrid — the owner renders the artwork; the grid owns the cursor,
     keep (lock) / favourite affordances, hover actions and the reroll
     entrance: cards remount when an id changes, so rerolled slots pop in
     while kept ones stay still (reduced motion: no animation).
     Locked and favourite states stay visible; every other action shows on
     hover AND on focus-within. Click = cursor, double-click / Enter = open.
     Keyboard: one tab stop (roving); ← → ↑ ↓ move the cursor by cell / row
     (columns are measured), Home / End jump, Enter opens. `shortcuts` only
     labels the tooltips — bind the keys yourself (useHotkeys).
   SizeLadder — the same artwork at REAL pixel sizes on several surfaces, for
     legibility (favicons, app icons, avatars, stamps). Never put it inside a
     zoomable camera: 16 px here means 16 CSS px. `extra` renders context per
     surface (a browser-tab mock, a home-screen icon). Surfaces are artwork,
     so their colours may be anything (marked data-studio-artifact).
   (Promoted from shells/marks/local/VariantGrid.tsx and SizeLadder.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ComponentType, type ReactNode } from 'react'
import { Lock, LockOpen, Star, Maximize2 } from 'lucide-react'
import { cn } from '../core/cn'
import { Tip } from './tooltip'
import { revealInScroller } from '../core/scroll'

export interface Variant { id: string; label: string; sub?: string; locked?: boolean; fav?: boolean; background?: string }

const KEYFRAMES = `@keyframes studio-variant-in { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { [data-variant-index] { animation: none !important } }`

/** A small floating card button — use it for your own `actions` so they match. */
export function VariantAction({ label, shortcut, onClick, icon: Icon, on, children }: {
  label: string; shortcut?: string; onClick: () => void; icon?: ComponentType<{ size?: number; strokeWidth?: number; fill?: string }>; on?: boolean; children?: ReactNode
}) {
  return (
    <Tip label={label} shortcut={shortcut}>
      <button type="button" aria-label={label} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onClick() }} onDoubleClick={(e) => e.stopPropagation()}
        className={cn('flex size-icon items-center justify-center rounded-[7px] bg-overlay/90 text-fg-muted shadow-[var(--shadow-segment)] outline-none backdrop-blur-sm',
          'hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', on && 'text-signal-text hover:text-signal-text')}>
        {Icon ? <Icon size={13} strokeWidth={1.5} /> : children}
      </button>
    </Tip>
  )
}

export function VariantGrid({
  items, render, cursor, onCursor, onOpen, onLock, onFav, actions, minSize = 176, gap = 12, onColumns, shortcuts = {}, label = 'Variants', className,
}: {
  items: Variant[]
  render: (id: string) => ReactNode
  /** index of the current card (-1 for none) */
  cursor: number
  onCursor: (i: number) => void
  onOpen: (id: string) => void
  onLock?: (id: string) => void
  onFav?: (id: string) => void
  /** extra hover actions per card (bottom right, before Open) */
  actions?: (id: string) => ReactNode
  minSize?: number
  gap?: number
  onColumns?: (n: number) => void
  /** shortcut hints for the tooltips (the shell binds them) */
  shortcuts?: { lock?: string; fav?: string; open?: string }
  label?: string
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const cols = useRef(1)
  useEffect(() => {
    if (!el.current) return
    const ro = new ResizeObserver(([e]) => {
      cols.current = Math.max(1, Math.floor((e.contentRect.width + gap) / (minSize + gap)))
      onColumns?.(cols.current)
    })
    ro.observe(el.current)
    return () => ro.disconnect()
  }, [onColumns, minSize, gap])
  useEffect(() => { revealInScroller(el.current?.querySelector(`[data-variant-index="${cursor}"]`)) }, [cursor])

  const move = (i: number, e: React.KeyboardEvent) => {
    const n = items.length
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowDown' ? i + cols.current : e.key === 'ArrowUp' ? i - cols.current
      : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null
    if (to === null) return false
    const j = Math.max(0, Math.min(n - 1, to))
    onCursor(j)
    requestAnimationFrame(() => el.current?.querySelector<HTMLElement>(`[data-variant-index="${j}"]`)?.focus())
    return true
  }

  return (
    <div ref={el} role="grid" aria-label={label} className={cn('grid', className)} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minSize}px, 1fr))`, gap }}>
      <style>{KEYFRAMES}</style>
      <div role="row" className="contents">
        {items.map((it, i) => {
          const active = i === cursor
          const tabbable = active || (cursor < 0 && i === 0)
          return (
            <div key={it.id} role="gridcell" aria-selected={active} aria-label={[it.label, it.sub, it.locked && 'kept', it.fav && 'favourite'].filter(Boolean).join(', ')}
              data-variant-index={i} tabIndex={tabbable ? 0 : -1}
              onClick={() => onCursor(i)}
              onDoubleClick={() => onOpen(it.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onOpen(it.id); return }
                if (move(i, e)) { e.preventDefault(); e.stopPropagation() }
              }}
              className="group/card flex min-w-0 flex-col gap-1.5 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-field"
              style={{ animation: `studio-variant-in 280ms cubic-bezier(.2,.8,.2,1) ${Math.min(i, 24) * 14}ms both` }}>
              <div className={cn('relative aspect-square overflow-hidden rounded-[10px] transition-shadow duration-150',
                active ? 'shadow-[0_0_0_2px_var(--signal)]' : it.locked ? 'shadow-[0_0_0_1px_var(--line-strong)]' : 'shadow-[0_0_0_1px_var(--line)] group-hover/card:shadow-[0_0_0_1px_var(--line-strong)]')}
                style={{ background: it.background }}>
                <div className="absolute inset-0 [&>svg]:size-full" data-studio-artifact>{render(it.id)}</div>
                <div className="pointer-events-none absolute top-2 left-2 flex gap-1">
                  {it.locked && <span className="flex size-icon items-center justify-center rounded-[6px] bg-overlay/90 text-fg shadow-[var(--shadow-segment)]"><Lock size={12} strokeWidth={1.75} /></span>}
                  {it.fav && <span className="flex size-icon items-center justify-center rounded-[6px] bg-overlay/90 text-key shadow-[var(--shadow-segment)]"><Star size={12} strokeWidth={1.75} fill="currentColor" /></span>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-100 group-focus-within/card:opacity-100 group-hover/card:opacity-100">
                  {onLock && <VariantAction label={it.locked ? 'Unlock' : 'Keep (lock)'} shortcut={shortcuts.lock} on={it.locked} icon={it.locked ? Lock : LockOpen} onClick={() => onLock(it.id)} />}
                  {onFav && (
                    <VariantAction label={it.fav ? 'Unfavourite' : 'Favourite'} shortcut={shortcuts.fav} on={it.fav} onClick={() => onFav(it.id)}>
                      <Star size={13} strokeWidth={1.5} fill={it.fav ? 'currentColor' : 'none'} />
                    </VariantAction>
                  )}
                </div>
                <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 transition-opacity duration-100 group-focus-within/card:opacity-100 group-hover/card:opacity-100">
                  {actions?.(it.id)}
                  <VariantAction label="Open" shortcut={shortcuts.open ?? 'enter'} icon={Maximize2} onClick={() => onOpen(it.id)} />
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2 px-0.5 text-ui">
                <span className={cn('truncate', active ? 'text-fg' : 'text-fg-muted')}>{it.label}</span>
                {it.sub && <span className="shrink-0 tabular text-fg-faint">{it.sub}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================== SizeLadder ============================== */

export interface LadderSurface { label: string; bg: string; fg: string }

export function SizeLadder({ sizes, surfaces, render, extra, className }: {
  sizes: number[]
  surfaces: LadderSurface[]
  render: (size: number, surface: number) => ReactNode
  extra?: (surface: number) => ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-max gap-3', className)}>
      {surfaces.map((s, si) => (
        <figure key={s.label} data-studio-artifact aria-label={`${s.label}: ${sizes.join(', ')} px`}
          className="relative m-0 rounded-[10px] p-3 shadow-[inset_0_0_0_1px_var(--line)]" style={{ background: s.bg, color: s.fg }}>
          <figcaption className="absolute top-2.5 left-3 text-[11px] opacity-60">{s.label}</figcaption>
          <div className="flex items-end gap-4">
            {sizes.map((z) => (
              <div key={z} className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center" style={{ width: z, height: z }}>{render(z, si)}</div>
                <span className="tabular text-[10.5px] opacity-55">{z}</span>
              </div>
            ))}
            {extra?.(si)}
          </div>
        </figure>
      ))}
    </div>
  )
}
