/* Comment pins (FigJam style): live in flow space, render at constant screen
   size, open into a thread card. Pins on a node travel with it. */
import { useState } from 'react'
import { Check, MoreHorizontal, Send, Trash2, RotateCcw } from 'lucide-react'
import { cn, IconButton, Menu, Button } from '@kit'
import { PEOPLE, deepen, type Comment } from '../model'
import { useFlow, useUI, ui, addComment, updateComment, commentPos } from '../store'

export const ago = (t: number) => {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function Avatar({ who, size = 20, className }: { who: string; size?: number; className?: string }) {
  const p = PEOPLE[who] ?? PEOPLE.you
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, background: deepen(p.hue), fontSize: size * 0.42 }} aria-label={p.name}>{p.initials}</span>
  )
}

export function CommentLayer({ zoom }: { zoom: number }) {
  const flow = useFlow()
  const open = useUI((s) => s.openComment)
  const draft = useUI((s) => s.draft)
  const showResolved = useUI((s) => s.showResolved)
  const walking = useUI((s) => s.walk !== null)
  if (walking) return null
  const k = 1 / zoom
  return (
    <div className="nodrag nopan nowheel" style={{ pointerEvents: 'none' }}>
      {flow.comments.filter((c) => !c.resolved || showResolved || open === c.id).map((c) => {
        const p = commentPos(flow, c)
        return (
          <div key={c.id} className="absolute" style={{ left: p.x, top: p.y, transform: `scale(${k})`, transformOrigin: '0 100%', zIndex: open === c.id ? 20 : 10 }}>
            <Pin c={c} open={open === c.id} />
            {open === c.id && <Thread c={c} />}
          </div>
        )
      })}
      {draft && (
        <div className="absolute" style={{ left: draft.x, top: draft.y, transform: `scale(${k})`, transformOrigin: '0 100%', zIndex: 30 }}>
          <div className="absolute bottom-0 left-0 flex size-7 items-center justify-center rounded-full rounded-bl-[3px] bg-signal-strong text-[11px] font-semibold text-signal-fg shadow-[0_0_0_2px_var(--panel),var(--shadow-cluster)]">+</div>
          <Composer onPost={(text) => { const c = addComment(draft, text); ui.setState({ draft: null, openComment: c.id }) }} onCancel={() => ui.setState({ draft: null })} />
        </div>
      )}
    </div>
  )
}

function Pin({ c, open }: { c: Comment; open: boolean }) {
  const p = PEOPLE[c.author] ?? PEOPLE.you
  return (
    <button type="button" aria-label={`Comment by ${p.name}`}
      onClick={(e) => { e.stopPropagation(); ui.setState({ openComment: open ? null : c.id, draft: null }) }}
      className={cn('absolute bottom-0 left-0 flex size-7 items-center justify-center rounded-full rounded-bl-[3px] text-[10.5px] font-semibold text-white outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-signal', c.resolved && 'opacity-50')}
      style={{ pointerEvents: 'all', background: deepen(p.hue), boxShadow: `0 0 0 2px ${open ? 'var(--signal)' : 'var(--panel)'}, var(--shadow-cluster)` }}>
      {c.resolved ? <Check size={12} strokeWidth={2.5} /> : p.initials}
      {c.replies.length > 0 && !c.resolved && <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-panel px-0.5 text-[10.5px] leading-none text-fg tabular shadow-[0_0_0_1px_var(--line-strong)]">{c.replies.length + 1}</span>}
    </button>
  )
}

function Thread({ c }: { c: Comment }) {
  const msgs = [{ id: c.id, author: c.author, text: c.text, at: c.at }, ...c.replies]
  return (
    <div className="pop absolute -top-7 left-9 w-[288px] overflow-hidden text-[12px]" style={{ pointerEvents: 'all' }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex h-9 items-center gap-1 border-b border-line pr-1.5 pl-3">
        <span className="flex-1 text-[11.5px] font-medium text-fg-muted">{c.resolved ? 'Resolved' : 'Comment'}</span>
        <IconButton icon={c.resolved ? RotateCcw : Check} size="icon-sm" label={c.resolved ? 'Re-open' : 'Resolve'} onClick={() => { updateComment(c.id, (x) => ({ ...x, resolved: !x.resolved })); if (!c.resolved) ui.setState({ openComment: null }) }} />
        <Menu align="end" trigger={<IconButton icon={MoreHorizontal} size="icon-sm" label="More" />}
          items={[{ label: 'Delete thread', icon: Trash2, danger: true, onClick: () => { updateComment(c.id, () => null); ui.setState({ openComment: null }) } }]} />
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {msgs.map((m) => (
          <div key={m.id} className="flex gap-2 px-3 py-2.5">
            <Avatar who={m.author} size={22} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5"><span className="font-medium">{PEOPLE[m.author]?.name ?? 'You'}</span><span className="text-[11px] text-fg-faint">{ago(m.at)}</span></div>
              <p className="mt-0.5 leading-relaxed whitespace-pre-wrap text-fg/90">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      {!c.resolved && <Composer reply onPost={(text) => updateComment(c.id, (x) => ({ ...x, replies: [...x.replies, { id: `${x.id}-${x.replies.length + 1}`, author: 'you', text, at: Date.now() }] }))} />}
    </div>
  )
}

function Composer({ onPost, onCancel, reply }: { onPost: (t: string) => void; onCancel?: () => void; reply?: boolean }) {
  const [text, setText] = useState('')
  const post = () => { if (text.trim()) { onPost(text.trim()); setText('') } }
  return (
    <div className={cn('flex items-end gap-1.5 p-2', reply ? 'border-t border-line' : 'pop absolute -top-7 left-9 w-[280px]')} style={{ pointerEvents: 'all' }} onPointerDown={(e) => e.stopPropagation()}>
      <Avatar who="you" size={22} className="mb-0.5" />
      <textarea autoFocus={!reply} rows={1} value={text} placeholder={reply ? 'Reply…' : 'Add a comment'} aria-label={reply ? 'Reply' : 'Comment'}
        onChange={(e) => { setText(e.target.value); e.target.style.height = '0px'; e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px` }}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post() } if (e.key === 'Escape') onCancel?.() }}
        className="nodrag nowheel min-h-7 flex-1 resize-none rounded-[6px] bg-control px-2 py-1.5 text-[12px] leading-snug text-fg outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_1px_var(--signal)]" />
      <Button size="icon-sm" variant={text.trim() ? 'primary' : 'ghost'} aria-label="Post" disabled={!text.trim()} onClick={post} className="mb-0.5"><Send size={12} strokeWidth={1.75} /></Button>
    </div>
  )
}
