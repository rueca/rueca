/* A journey card. Its look depends on the lane; the text edits in place. */
import { memo } from 'react'
import { Link2 } from 'lucide-react'
import { cn } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { CHANNELS, TEAMS, type Card } from '../model'
import { ui, updateCard, editCards } from '../store'

export const LEVEL = ['', 'Low', 'Medium', 'High'] as const

export const JourneyCard = memo(function JourneyCard({
  card, selected, editing, dim, hit, compact, showTags, linkCount, onPointerDown, onLinkStart, dragging,
}: {
  card: Card; selected: boolean; editing: boolean; dim: boolean; hit: boolean; compact: boolean; showTags: boolean; linkCount: number
  onPointerDown: (e: React.PointerEvent, c: Card) => void
  onLinkStart?: (e: React.PointerEvent, c: Card) => void
  dragging: boolean
}) {
  const lane = card.lane
  const Ch = card.channel ? CHANNELS[card.channel] : null
  const tint =
    lane === 'pains' ? 'color-mix(in srgb, var(--rec) 9%, var(--overlay))'
      : lane === 'opps' ? 'color-mix(in srgb, var(--ok) 10%, var(--overlay))'
        : lane === 'thoughts' ? 'color-mix(in srgb, var(--signal) 8%, var(--overlay))'
          : 'var(--overlay)'
  const bar = lane === 'pains' ? 'var(--rec)' : lane === 'opps' ? 'var(--ok)' : null
  const ring = selected ? '0 0 0 2px var(--signal)' : hit ? '0 0 0 1.5px var(--signal)' : '0 0 0 1px var(--line-strong)'

  const endEdit = (b: boolean) => ui.setState({ editing: b ? card.id : null })

  return (
    <div
      data-card={card.id}
      data-lane={lane}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={card.text || 'Empty card'}
      onPointerDown={(e) => onPointerDown(e, card)}
      onDoubleClick={(e) => { e.stopPropagation(); ui.setState({ sel: { kind: 'card', id: card.id }, editing: card.id }) }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !editing) { e.preventDefault(); e.stopPropagation(); ui.setState({ editing: card.id }) } }}
      onFocus={() => { if (!selected) ui.setState({ sel: { kind: 'card', id: card.id } }) }}
      onMouseEnter={() => ui.setState({ hoverCard: card.id })}
      onMouseLeave={() => ui.setState({ hoverCard: null })}
      className={cn(
        'group/card relative z-[2] flex flex-col gap-1.5 overflow-visible text-left outline-none transition-[opacity,box-shadow] duration-150 select-none',
        lane === 'thoughts' ? 'rounded-[10px] rounded-bl-[3px]' : 'rounded-[8px]',
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2',
        dim && 'opacity-25',
        dragging && 'opacity-30',
      )}
      style={{ background: tint, boxShadow: `${ring}, 0 1px 2px rgb(0 0 0 / 0.08)` }}
    >
      {bar && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full" style={{ background: bar }} />}

      {lane === 'touchpoints' && Ch && (
        <div className="flex items-center gap-1 text-[10.5px] text-fg-faint"><Ch.icon size={11} strokeWidth={1.5} />{Ch.label}</div>
      )}
      {(lane === 'pains' || lane === 'opps') && (
        <div className="flex items-center gap-1.5 text-[10.5px] text-fg-faint">
          <span className="flex gap-[2px]" aria-label={`${lane === 'pains' ? 'Severity' : 'Impact'} ${LEVEL[card.level ?? 2]}`}>
            {[1, 2, 3].map((i) => <span key={i} className="size-[5px] rounded-full" style={{ background: i <= (card.level ?? 2) ? (lane === 'pains' ? 'var(--rec)' : 'var(--ok)') : 'var(--line-strong)' }} />)}
          </span>
          {lane === 'pains' ? 'Severity' : 'Impact'} · {LEVEL[card.level ?? 2]}
          {linkCount > 0 && <span className="ml-auto flex items-center gap-0.5 tabular"><Link2 size={10} strokeWidth={1.75} />{linkCount}</span>}
        </div>
      )}

      {lane === 'owner' ? (
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-fg">
          <span className="size-2 shrink-0 rounded-full" style={{ background: TEAMS[card.team ?? ''] ?? 'var(--fg-faint)' }} />
          <span className="truncate">{card.team ?? card.text}</span>
        </div>
      ) : (
        <InlineText
          bare
          focusable={false}
          allowEmpty
          value={card.text}
          multiline
          editing={editing}
          onEditingChange={(b) => {
            endEdit(b)
            if (!b && !card.text) setTimeout(() => { if (!ui.getState().editing) editCards((cs) => cs.filter((c) => c.id !== card.id || c.text), { label: 'Discard empty card' }) }, 0)
          }}
          onCommit={(text) => updateCard(card.id, { text }, { label: 'Edit card' })}
          placeholder="Type something…"
          label="Card text"
          className={cn('block w-full whitespace-pre-wrap break-words text-fg', compact ? 'text-[11.5px] leading-snug' : 'text-[12px] leading-snug', lane === 'thoughts' && 'italic')}
        />
      )}

      {showTags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10.5px] text-fg-faint">
          {card.tags.map((t) => <span key={t} className={cn(hit && 'text-signal')}>{t}</span>)}
        </div>
      )}

      {onLinkStart && (
        <button type="button" data-export="skip" aria-label="Drag to link an opportunity"
          onPointerDown={(e) => { e.stopPropagation(); onLinkStart(e, card) }}
          className={cn('absolute -bottom-[7px] left-1/2 z-10 size-3 -translate-x-1/2 cursor-crosshair rounded-full bg-panel opacity-0 shadow-[0_0_0_1.5px_var(--ok)] transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100', selected && 'opacity-100')} />
      )}
    </div>
  )
})
