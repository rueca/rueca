/* ---------------------------------------------------------------------------
   InlineText — double-click to rename in place (Figma layer names, FigJam
   stickies, Miro cards). Enter / blur commits, Esc cancels, Shift+Enter is a
   newline when `multiline`. Renders plain text otherwise, so it costs nothing
   on a canvas with hundreds of nodes.

     <InlineText value={name} onCommit={(s) => rename(id, s)} className="…" />
     <InlineText editing={id === editingId} onEditingChange={…} />   // controlled

   Carries `nodrag nopan nowheel` so canvas libraries leave it alone while typing.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { cn } from '@kit'

export function InlineText({
  value, onCommit, multiline, className, inputClassName, placeholder = 'Untitled', editing: ctrl, onEditingChange, disabled, title,
}: {
  value: string
  onCommit: (v: string) => void
  multiline?: boolean
  className?: string
  inputClassName?: string
  placeholder?: string
  editing?: boolean
  onEditingChange?: (b: boolean) => void
  disabled?: boolean
  title?: string
}) {
  const [own, setOwn] = useState(false)
  const editing = ctrl ?? own
  const setEditing = (b: boolean) => { setOwn(b); onEditingChange?.(b) }
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    setDraft(value)
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.select() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  useEffect(() => {
    if (!editing || !multiline || !ref.current) return
    ref.current.style.height = '0px'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [draft, editing, multiline])

  const done = (save: boolean) => {
    if (save && draft.trim() !== value) onCommit(draft.trim())
    setEditing(false)
  }

  if (!editing)
    return (
      <span title={title} className={cn(className, !value && 'opacity-50')} onDoubleClick={(e) => { if (disabled) return; e.stopPropagation(); setEditing(true) }}>
        {value || placeholder}
      </span>
    )

  const common = {
    ref,
    value: draft,
    'aria-label': title ?? 'Edit text',
    className: cn('nodrag nopan nowheel w-full resize-none bg-transparent outline-none no-select select-text', className, inputClassName),
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement & HTMLInputElement>) => setDraft(e.target.value),
    onBlur: () => done(true),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') done(false)
      if (e.key === 'Enter' && !(multiline && e.shiftKey)) { e.preventDefault(); done(true) }
    },
  }
  return multiline ? <textarea rows={1} {...common} /> : <input {...common} />
}
