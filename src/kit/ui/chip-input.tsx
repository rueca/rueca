/* ---------------------------------------------------------------------------
   ChipInput — a tag field: chips with a remove button, type and press Enter
   (or a comma) to add, Backspace on an empty field removes the last chip,
   suggestions from values already in use.

     <ChipInput value={tags} onChange={setTags} suggestions={allTags} prefix="#" />
     <ChipInput value={emails} onChange={set} normalize={(s) => s.trim().toLowerCase()} max={5} />

   Behaviour / keyboard
     Enter or ,        → add what is typed (or the highlighted suggestion)
     ↓ / ↑             → move through suggestions     Esc → close / blur
     Backspace (empty) → remove the last chip         paste "a, b, c" → three chips
   Duplicates are ignored. `normalize` cleans a raw entry (default: trim);
   `prefix` is added when missing (e.g. "#"), after normalising.

   Accessibility: the field is a combobox (aria-expanded, aria-controls,
   aria-activedescendant) over a listbox of suggestions; every chip has a
   labelled remove button. Suggestions are also clickable.
   (Promoted from shells/journey/local/ChipInput.tsx.)
--------------------------------------------------------------------------- */
import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../core/cn'

export interface ChipInputProps {
  value: string[]
  onChange: (v: string[]) => void
  suggestions?: string[]
  /** added to entries that lack it, e.g. "#" */
  prefix?: string
  /** clean a raw entry; return '' to reject it. Default: trim. */
  normalize?: (raw: string) => string
  max?: number
  placeholder?: string
  /** accessible name */
  label?: string
  disabled?: boolean
  className?: string
}

export function ChipInput({
  value, onChange, suggestions = [], prefix = '', normalize = (s) => s.trim(), max, placeholder = 'Add tag', label = 'Tags', disabled, className,
}: ChipInputProps) {
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const [active, setActive] = useState(-1)
  const id = useId()
  const full = max !== undefined && value.length >= max
  const clean = (s: string) => { const t = normalize(s); return t ? (prefix && !t.startsWith(prefix) ? prefix + t : t) : '' }
  const addMany = (raw: string[]) => {
    const next = [...value]
    for (const r of raw) { const t = clean(r); if (t && !next.includes(t) && (max === undefined || next.length < max)) next.push(t) }
    if (next.length !== value.length) onChange(next)
    setText('')
    setActive(-1)
  }
  const needle = text.trim().toLowerCase().replace(prefix, '')
  const open = focus && !full ? suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(needle)).slice(0, 8) : []
  const listId = `${id}-list`
  const optId = (i: number) => `${id}-opt-${i}`

  return (
    <div className={cn('flex w-full flex-col gap-1.5', disabled && 'pointer-events-none opacity-40', className)}>
      <div className={cn('flex min-h-control w-full flex-wrap items-center gap-1 rounded-control bg-control p-[2px]',
        focus ? 'shadow-[inset_0_0_0_1px_var(--signal)]' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong)]')}>
        {value.map((t) => (
          <span key={t} className="flex h-[calc(var(--d-control)-4px)] max-w-full items-center gap-0.5 rounded-control bg-active pr-0.5 pl-1.5 text-ui text-fg">
            <span className="truncate">{t}</span>
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}
              className="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={text}
          role="combobox"
          aria-label={label}
          aria-expanded={open.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && open[active] ? optId(active) : undefined}
          placeholder={full ? '' : value.length ? '' : placeholder}
          disabled={disabled || full}
          onFocus={() => setFocus(true)}
          onBlur={() => { setFocus(false); setActive(-1); if (text.trim()) addMany([text]) }}
          onChange={(e) => { const v = e.target.value; if (v.includes(',')) addMany(v.split(',')); else { setText(v); setActive(-1) } }}
          onPaste={(e) => { const t = e.clipboardData.getData('text/plain'); if (/[,\n\t]/.test(t)) { e.preventDefault(); addMany(t.split(/[,\n\t]/)) } }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && open.length) { e.preventDefault(); setActive((a) => (a + 1) % open.length) }
            else if (e.key === 'ArrowUp' && open.length) { e.preventDefault(); setActive((a) => (a <= 0 ? open.length - 1 : a - 1)) }
            else if (e.key === 'Enter') { e.preventDefault(); addMany([active >= 0 && open[active] ? open[active] : text]) }
            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
            else if (e.key === 'Escape') { if (active >= 0) setActive(-1); else (e.target as HTMLInputElement).blur() }
          }}
          className="h-[calc(var(--d-control)-4px)] min-w-[60px] flex-1 bg-transparent px-1 text-ui text-fg outline-none placeholder:text-fg-faint"
        />
      </div>
      <div id={listId} role="listbox" aria-label={`${label} suggestions`} className={cn('flex flex-wrap gap-1', !open.length && 'hidden')}>
        {open.map((s, i) => (
          <span key={s} id={optId(i)} role="option" aria-selected={i === active}
            onMouseDown={(e) => { e.preventDefault(); addMany([s]) }}
            className={cn('flex h-[calc(var(--d-control)-4px)] cursor-default items-center rounded-control px-1.5 text-ui shadow-[inset_0_0_0_1px_var(--line-strong)]',
              i === active ? 'bg-signal-soft text-fg shadow-[inset_0_0_0_1px_var(--signal)]' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
