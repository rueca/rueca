/* ---------------------------------------------------------------------------
   InlineEdit — text that becomes a field on double-click (or Enter when
   focused). Enter / blur commit, Esc cancels. Keys never leak to global
   hotkeys while editing. For node titles, document names, session names.

     <InlineEdit value={name} onCommit={rename} className="text-[12px]" />

   Kit candidate: LayerTree has rename built in, but nothing else does.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { cn } from '@kit'

export function InlineEdit({
  value, onCommit, className, inputClassName, placeholder, editing: controlled, onEditingChange, label = 'Rename',
}: { value: string; onCommit: (v: string) => void; className?: string; inputClassName?: string; placeholder?: string; editing?: boolean; onEditingChange?: (b: boolean) => void; label?: string }) {
  const [own, setOwn] = useState(false)
  const editing = controlled ?? own
  const setEditing = (b: boolean) => { setOwn(b); onEditingChange?.(b) }
  const [draft, setDraft] = useState(value)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { setDraft(value); requestAnimationFrame(() => { input.current?.focus(); input.current?.select() }) } }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = (apply: boolean) => {
    if (apply && draft.trim() && draft.trim() !== value) onCommit(draft.trim())
    setEditing(false)
  }

  if (editing)
    return (
      <input
        ref={input}
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => done(true)}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false) }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn('nodrag min-w-0 rounded-[4px] bg-input px-1 text-fg outline-none shadow-[inset_0_0_0_1px_var(--accent)]', className, inputClassName)}
      />
    )
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={`${label}: ${value}`}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true) } }}
      className={cn('min-w-0 truncate rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-accent', className)}
    >
      {value || <span className="text-faint">{placeholder}</span>}
    </span>
  )
}
