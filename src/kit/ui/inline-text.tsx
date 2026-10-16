/* ---------------------------------------------------------------------------
   InlineText — text that becomes a field in place (Figma layer names, FigJam
   stickies, node titles, session names). Renders plain text otherwise, so it
   costs nothing on a canvas with hundreds of nodes.

     <InlineText value={name} onCommit={(s) => rename(id, s)} label="Rename layer" />
     <InlineText value={note} multiline bare onCommit={…} />            // sticky note
     <InlineText editing={id === editingId} onEditingChange={…} … />    // controlled

   Behaviour
     double-click            → edit (text is selected)
     Enter / F2 when focused → edit (only when `focusable`, the default)
     Enter / blur            → commit (trimmed)    Esc → cancel
     Shift+Enter             → newline when `multiline` (the field grows)
   An empty result reverts unless `allowEmpty` (e.g. an optional label).

   Keys and pointer events stay inside while editing, so global hotkeys and
   canvas libraries never react to typing; the field carries React Flow's
   `nodrag nopan nowheel` classes.

   Accessibility: when `focusable`, the resting text is a role="button" with
   aria-label "{label}: {value}" — the keyboard path to rename. Pass
   `focusable={false}` only where another rename path exists (an inspector
   field), e.g. on canvas nodes that are focusable themselves.
   `bare` keeps the field transparent so it inherits the host's look (a
   coloured sticky, a section tab); otherwise it is a control-filled field.
   (Promoted from shells/flows/local/InlineText.tsx + nodes/generate InlineEdit.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../core/cn'

export interface InlineTextProps {
  value: string
  onCommit: (v: string) => void
  /** accessible name of the field, e.g. "Rename layer" */
  label?: string
  placeholder?: ReactNode
  multiline?: boolean
  /** commit an empty string instead of reverting */
  allowEmpty?: boolean
  /** transparent field that inherits the host's colours */
  bare?: boolean
  /** keyboard-reachable resting state (Enter / F2 to edit). Default true. */
  focusable?: boolean
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  disabled?: boolean
  maxLength?: number
  className?: string
  inputClassName?: string
}

export function InlineText({
  value, onCommit, label = 'Rename', placeholder = 'Untitled', multiline, allowEmpty, bare, focusable = true,
  editing: controlled, onEditingChange, disabled, maxLength, className, inputClassName,
}: InlineTextProps) {
  const [own, setOwn] = useState(false)
  const editing = controlled ?? own
  const setEditing = (b: boolean) => { setOwn(b); onEditingChange?.(b) }
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    if (!editing) return
    finished.current = false
    setDraft(value)
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.select() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  // multiline grows with its content
  useEffect(() => {
    if (!editing || !multiline || !ref.current) return
    ref.current.style.height = '0px'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [draft, editing, multiline])

  const done = (save: boolean) => {
    if (finished.current) return // Enter then blur must not commit twice
    finished.current = true
    const next = draft.trim()
    if (save && next !== value && (next || allowEmpty)) onCommit(next)
    setEditing(false)
  }

  if (!editing) {
    const empty = !value
    return (
      <span
        tabIndex={focusable && !disabled ? 0 : undefined}
        role={focusable && !disabled ? 'button' : undefined}
        aria-label={focusable && !disabled ? `${label}: ${value || 'empty'}` : undefined}
        onDoubleClick={(e) => { if (disabled) return; e.stopPropagation(); setEditing(true) }}
        onKeyDown={(e) => {
          if (!focusable || disabled) return
          if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true) }
        }}
        className={cn('min-w-0 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-signal', className, empty && 'opacity-55')}
      >
        {value || placeholder}
      </span>
    )
  }

  const common = {
    ref,
    value: draft,
    maxLength,
    'aria-label': label,
    className: cn(
      'nodrag nopan nowheel min-w-0 outline-none select-text',
      multiline && 'resize-none',
      bare ? 'w-full bg-transparent' : 'rounded-control bg-control px-1 text-fg shadow-[inset_0_0_0_1px_var(--signal)]',
      className,
      inputClassName,
    ),
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement & HTMLInputElement>) => setDraft(e.target.value),
    onBlur: () => done(true),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') { e.preventDefault(); done(false) }
      else if (e.key === 'Enter' && !(multiline && e.shiftKey)) { e.preventDefault(); done(true) }
    },
  }
  return multiline ? <textarea rows={1} {...common} /> : <input {...common} />
}
