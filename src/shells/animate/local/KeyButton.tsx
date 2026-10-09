/* ---------------------------------------------------------------------------
   KeyButton — the keyframe toggle that sits at the end of an animatable
   inspector row (Rive / Figma Motion / After Effects stopwatch).

     <Row label="Scale" trailing={<KeyButton state={s} onToggle={…} onPrev={…} onNext={…} />} className="group/row">

   Four states, distinguished by SHAPE and colour (WCAG 1.4.1):
     none      hollow, faint — only visible on row hover / focus-within
     animated  hollow accent — the property has keys, none at the playhead
     key       solid accent  — a key sits exactly at the playhead
     edited    solid key-amber — value changed but not keyed (row gets an amber wash)
   ◀ ▶ chevrons jump to the previous / next key; they appear on hover when
   a neighbour exists. Put `group/row` on the row so hover reveals work.
--------------------------------------------------------------------------- */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, Tip } from '@kit'

export type KeyState = 'none' | 'animated' | 'key' | 'edited'

const LABEL: Record<KeyState, string> = {
  none: 'Add keyframe',
  animated: 'Add keyframe at playhead',
  key: 'Remove keyframe',
  edited: 'Key this change',
}

export function KeyDiamond({ state, size = 9, className }: { state: KeyState; size?: number; className?: string }) {
  const s = size
  return (
    <svg viewBox="0 0 12 12" width={s + 3} height={s + 3} className={cn('shrink-0 overflow-visible', className)} aria-hidden>
      <rect
        x={2.5} y={2.5} width={7} height={7} rx={1.2} transform="rotate(45 6 6)"
        className={cn(
          state === 'none' && 'fill-transparent stroke-[var(--fg-faint)]',
          state === 'animated' && 'fill-transparent stroke-[var(--signal)]',
          state === 'key' && 'fill-[var(--signal)] stroke-[var(--signal)]',
          state === 'edited' && 'fill-[var(--key)] stroke-[var(--key)]',
        )}
        strokeWidth={1.4}
      />
    </svg>
  )
}

export function KeyButton({
  state, onToggle, onPrev, onNext, disabled, className,
}: {
  state: KeyState
  onToggle: () => void
  onPrev?: () => void
  onNext?: () => void
  disabled?: boolean
  className?: string
}) {
  const nav = 'flex h-6 w-3.5 items-center justify-center rounded-[4px] text-fg-faint outline-none hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal'
  const reveal = 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100'
  return (
    <div className={cn('flex shrink-0 items-center', disabled && 'pointer-events-none opacity-30', className)}>
      <button type="button" tabIndex={onPrev ? 0 : -1} aria-label="Previous keyframe" onClick={onPrev} disabled={!onPrev}
        className={cn(nav, reveal, !onPrev && 'invisible')}>
        <ChevronLeft size={11} strokeWidth={2} />
      </button>
      <Tip label={LABEL[state]} shortcut={state === 'key' ? undefined : 'k'} side="left">
        <button
          type="button"
          aria-label={LABEL[state]}
          aria-pressed={state === 'key'}
          onClick={onToggle}
          className={cn(
            'flex size-6 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal',
            state === 'none' && reveal,
          )}
        >
          <KeyDiamond state={state} />
        </button>
      </Tip>
      <button type="button" tabIndex={onNext ? 0 : -1} aria-label="Next keyframe" onClick={onNext} disabled={!onNext}
        className={cn(nav, reveal, !onNext && 'invisible')}>
        <ChevronRight size={11} strokeWidth={2} />
      </button>
    </div>
  )
}
