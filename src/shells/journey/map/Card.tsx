/* A journey card. Its look depends on the lane; the text edits in place.
   Drawn in the wire style (src/demo/wire.ts): one ink, hairlines, no shadows.
   Lanes differ by line and shape, never by colour — pain points carry a solid
   ink border, opportunities a dashed one, each with a small mono tag. */
import { memo } from 'react'
import { Link2 } from 'lucide-react'
import { cn } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { WIRE } from '@/demo/wire'
import { CHANNELS, type Card } from '../model'
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
  const pain = lane === 'pains', opp = lane === 'opps'
  const border = pain ? `1px solid ${WIRE.ink}` : opp ? `1px dashed ${WIRE.ink}` : `1px solid ${WIRE.line}`
  const ring = selected ? '0 0 0 2px var(--signal)' : hit ? '0 0 0 1.5px var(--signal)' : 'none'

  const endEdit = (b: boolean) => ui.setState({ editing: b ? card.id : null })

  return (
    <div
      data-card={card.id}
      data-lane={lane}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      // named by its content (text + severity / channel) so the name contains what is visible (WCAG 2.5.3)
      aria-label={card.text ? undefined : 'Empty card'}
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
      style={{ background: lane === 'thoughts' ? WIRE.paper : WIRE.card, border, boxShadow: ring, color: WIRE.ink }}
    >
      {lane === 'touchpoints' && Ch && (
        <div className="flex items-center gap-1 text-[10.5px]" style={{ color: WIRE.muted }}><Ch.icon size={11} strokeWidth={1.5} />{Ch.label}</div>
      )}
      {(lane === 'pains' || lane === 'opps') && (
        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.02em]" style={{ color: WIRE.muted }}>
          {/* mono tag: inverted for pains, outlined for opportunities */}
          <span className="rounded-[3px] px-1 leading-[14px]" style={pain ? { background: WIRE.ink, color: WIRE.paper } : { boxShadow: `inset 0 0 0 1px ${WIRE.ink}`, color: WIRE.ink }}>{pain ? 'PAIN' : 'OPP'}</span>
          {/* level: filled marks out of three — squares for severity, circles for impact */}
          <span className="flex gap-[2px]" aria-hidden>
            {[1, 2, 3].map((i) => <span key={i} className={cn('size-[5px]', pain ? 'rounded-[1px]' : 'rounded-full')}
              style={i <= (card.level ?? 2) ? { background: WIRE.ink } : { boxShadow: `inset 0 0 0 1px ${WIRE.faint}` }} />)}
          </span>
          <span className="whitespace-nowrap" title={pain ? 'Severity' : 'Impact'}>{LEVEL[card.level ?? 2].toLowerCase()}</span>
          {linkCount > 0 && <span className="ml-auto flex items-center gap-0.5 tabular"><Link2 size={10} strokeWidth={1.75} />{linkCount}</span>}
        </div>
      )}

      {lane === 'owner' ? (
        <div className="flex items-center gap-1.5 text-[12px] font-medium">
          <span className="size-2 shrink-0 rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${WIRE.ink}` }} />
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
          className={cn('block w-full whitespace-pre-wrap break-words', compact ? 'text-[11.5px] leading-snug' : 'text-[12px] leading-snug', lane === 'thoughts' && 'italic')}
        />
      )}

      {showTags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[10.5px]" style={{ color: hit ? undefined : WIRE.muted }}>
          {card.tags.map((t) => <span key={t} className={cn(hit && 'text-signal')}>{t}</span>)}
        </div>
      )}

      {onLinkStart && (
        // pointer-only shortcut, so not a control: keyboard users link from the inspector's "Answers pain points"
        // checkboxes — no 6px tab stop nested inside the card button (break-it A18 / A20)
        <span data-export="skip" aria-hidden
          onPointerDown={(e) => { e.stopPropagation(); onLinkStart(e, card) }}
          style={{ background: WIRE.card, boxShadow: `0 0 0 1.5px ${WIRE.ink}` }}
          className={cn('absolute -bottom-[7px] left-1/2 z-10 size-3 -translate-x-1/2 cursor-crosshair rounded-full opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100', selected && 'opacity-100')} />
      )}
    </div>
  )
})
