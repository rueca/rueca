/* Comment pins (C). A pin sits in world space; its thread opens beside it. */
import { useEffect, useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { Button, IconButton, cn } from '@kit'
import * as S from '../model/store'
import type { Box, Comment } from '../model/types'

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'Just now' : m < 60 ? `${m}m ago` : m < 60 * 24 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`
}
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()

export function CommentPins({ sc }: { sc: (b: Box) => Box }) {
  const comments = S.useDesign((s) => S.page(s).comments)
  const open = S.useDesign((s) => s.openComment)
  // closing a brand-new comment that was never posted discards it without an undo step
  useEffect(() => {
    if (comments.some((c) => !c.text && c.id !== open)) S.design.setState({ doc: S.get().anchor.doc })
  }, [open, comments])
  return (
    <>
      {comments.filter((c) => !c.resolved || c.id === open).map((c) => {
        const p = sc({ x: c.x, y: c.y, w: 0, h: 0 })
        return (
          <div key={c.id} className="absolute" style={{ left: p.x, top: p.y }}>
            <button type="button" aria-label={`Comment by ${c.author}`}
              onPointerDown={(e) => { e.stopPropagation(); S.design.setState({ openComment: open === c.id ? null : c.id }) }}
              className={cn('pointer-events-auto absolute bottom-0 left-0 flex size-7 items-center justify-center rounded-full rounded-bl-[3px] text-[10.5px] font-semibold shadow-[var(--shadow-cluster)] transition-transform hover:scale-110',
                open === c.id ? 'bg-signal-strong text-signal-fg' : 'bg-panel text-fg')}>
              {initials(c.author)}
            </button>
            {open === c.id && <Thread c={c} />}
          </div>
        )
      })}
    </>
  )
}

function Thread({ c }: { c: Comment }) {
  const [draft, setDraft] = useState(c.text)
  const isNew = !c.text
  const save = () => {
    const comments = S.page().comments
    if (!draft.trim()) {
      if (isNew) S.design.setState({ doc: S.get().anchor.doc, openComment: null })
      else { S.setPage({ comments: comments.filter((x) => x.id !== c.id) }, { label: 'Delete comment' }); S.design.setState({ openComment: null }) }
      return
    }
    S.setPage({ comments: comments.map((x) => (x.id === c.id ? { ...x, text: draft.trim(), at: isNew ? Date.now() : x.at } : x)) }, { label: isNew ? 'Add comment' : 'Edit comment' })
    S.design.setState({ openComment: null })
  }
  return (
    <div className="pop pointer-events-auto absolute top-[-28px] left-9 w-[264px] p-3" onPointerDown={(e) => e.stopPropagation()} data-chrome>
      {!isNew && (
        <div className="mb-2 flex items-start gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-active text-[10px] font-semibold text-fg">{initials(c.author)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11.5px]"><span className="font-medium text-fg">{c.author}</span><span className="text-fg-faint">{ago(c.at)}</span></div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg select-text">{c.text}</p>
          </div>
          <IconButton icon={Check} label={c.resolved ? 'Reopen' : 'Resolve'} size="icon-sm" active={c.resolved}
            onClick={() => { S.setPage({ comments: S.page().comments.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)) }, { label: c.resolved ? 'Reopen comment' : 'Resolve comment' }); S.design.setState({ openComment: null }) }} />
          <IconButton icon={Trash2} label="Delete comment" size="icon-sm"
            onClick={() => { S.setPage({ comments: S.page().comments.filter((x) => x.id !== c.id) }, { label: 'Delete comment' }); S.design.setState({ openComment: null }) }} />
        </div>
      )}
      <textarea autoFocus={isNew} value={draft} onChange={(e) => setDraft(e.target.value)} rows={isNew ? 3 : 2} placeholder={isNew ? 'Add a comment' : 'Edit comment'}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } if (e.key === 'Escape') S.design.setState({ openComment: null }) }}
        className="w-full resize-none rounded-[6px] bg-control px-2 py-1.5 text-[12px] text-fg outline-none placeholder:text-fg-faint focus:shadow-[inset_0_0_0_1px_var(--signal)]" />
      <div className="mt-2 flex justify-end gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => S.design.setState({ openComment: null })}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={save} disabled={!draft.trim() || draft === c.text}>{isNew ? 'Post' : 'Save'}</Button>
      </div>
    </div>
  )
}
