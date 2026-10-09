/* ---------------------------------------------------------------------------
   KeyButton — the keyframe toggle at the end of an animatable inspector row
   (Rive / Figma Motion / After Effects stopwatch), with ◀ ▶ to jump to the
   previous / next key of that property.

     <Row label="Scale" className="group/row"
          trailing={<KeyButton state={s} onToggle={toggle} onPrev={prev} onNext={next} shortcut="k" />}>

   Four states, told apart by SHAPE as well as colour (WCAG 1.4.1):
     none      hollow, faint  — only shown on row hover / focus-within
     animated  hollow accent  — the property has keys, none at the playhead
     key       solid accent   — a key sits exactly at the playhead
     edited    solid amber    — value changed but not keyed (give the row a bg-key/10 wash)

   Behaviour: click toggles (add / remove / key the edit). ◀ ▶ appear on
   row hover when a neighbour exists; pass undefined to hide one. Put
   `group/row` on the row so the hover reveals work; everything revealed on
   hover is also revealed on focus-within.
   a11y: the diamond is a toggle button (aria-pressed = key at playhead) with a
   state-specific aria-label; ◀ ▶ are labelled buttons, removed from the tab
   order when they have nowhere to go.
   <KeyDiamond state size /> is the bare glyph for layer rows and menus.
   (Promoted from shells/animate/local/KeyButton.tsx.)
--------------------------------------------------------------------------- */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../core/cn'
import { Tip } from './tooltip'

export type KeyState = 'none' | 'animated' | 'key' | 'edited'

export const KEY_LABELS: Record<KeyState, string> = {
  none: 'Add keyframe',
  animated: 'Add keyframe at playhead',
  key: 'Remove keyframe',
  edited: 'Key this change',
}

export function KeyDiamond({ state, size = 9, className }: { state: KeyState; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width={size + 3} height={size + 3} className={cn('shrink-0 overflow-visible', className)} aria-hidden>
      <rect
        x={2.5} y={2.5} width={7} height={7} rx={1.2} transform="rotate(45 6 6)" strokeWidth={1.4}
        className={cn(
          state === 'none' && 'fill-transparent stroke-[var(--fg-faint)]',
          state === 'animated' && 'fill-transparent stroke-[var(--signal)]',
          state === 'key' && 'fill-[var(--signal)] stroke-[var(--signal)]',
          state === 'edited' && 'fill-[var(--key)] stroke-[var(--key)]',
        )}
      />
    </svg>
  )
}

export interface KeyButtonProps {
  state: KeyState
  onToggle: () => void
  onPrev?: () => void
  onNext?: () => void
  /** shown in the tooltip, e.g. 'k' (the binding itself is the caller's) */
  shortcut?: string
  /** override the per-state labels (localisation, domain words) */
  labels?: Partial<Record<KeyState, string>>
  /** the property name, for screen readers: "Add keyframe — Scale" */
  property?: string
  disabled?: boolean
  className?: string
}

export function KeyButton({ state, onToggle, onPrev, onNext, shortcut, labels, property, disabled, className }: KeyButtonProps) {
  const label = labels?.[state] ?? KEY_LABELS[state]
  const aria = property ? `${label} — ${property}` : label
  const nav = 'flex h-6 w-3.5 items-center justify-center rounded-[4px] text-fg-faint outline-none hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal'
  const reveal = 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100'
  return (
    <div className={cn('flex shrink-0 items-center', disabled && 'pointer-events-none opacity-30', className)}>
      <button type="button" tabIndex={onPrev ? 0 : -1} aria-label={property ? `Previous keyframe — ${property}` : 'Previous keyframe'} onClick={onPrev} disabled={!onPrev}
        className={cn(nav, reveal, !onPrev && 'invisible')}>
        <ChevronLeft size={11} strokeWidth={2} />
      </button>
      <Tip label={label} shortcut={state === 'key' ? undefined : shortcut} side="left">
        <button
          type="button" aria-label={aria} aria-pressed={state === 'key'} onClick={onToggle} disabled={disabled}
          className={cn('flex size-6 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', state === 'none' && reveal)}
        >
          <KeyDiamond state={state} />
        </button>
      </Tip>
      <button type="button" tabIndex={onNext ? 0 : -1} aria-label={property ? `Next keyframe — ${property}` : 'Next keyframe'} onClick={onNext} disabled={!onNext}
        className={cn(nav, reveal, !onNext && 'invisible')}>
        <ChevronRight size={11} strokeWidth={2} />
      </button>
    </div>
  )
}
