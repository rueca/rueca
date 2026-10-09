/* ---------------------------------------------------------------------------
   ChipInput — a tag field: chips with remove, type + Enter / comma to add,
   Backspace on empty removes the last, suggestions from known values.
   The kit has no multi-value text control (only icon Tiles), and tags show
   up in almost every mapping / asset / content tool.

     <ChipInput value={tags} onChange={setTags} suggestions={['#pricing']} prefix="#" />
--------------------------------------------------------------------------- */
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@kit'

export function ChipInput({ value, onChange, suggestions = [], prefix = '', placeholder = 'Add tag', label = 'Tags' }: {
  value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; prefix?: string; placeholder?: string; label?: string
}) {
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const norm = (s: string) => { const t = s.trim().replace(/\s+/g, '-').toLowerCase(); return t ? (prefix && !t.startsWith(prefix) ? prefix + t : t) : '' }
  const add = (s: string) => { const t = norm(s); if (t && !value.includes(t)) onChange([...value, t]); setText('') }
  const open = suggestions.filter((s) => !value.includes(s) && s.includes(text.toLowerCase().replace(prefix, ''))).slice(0, 8)
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className={cn('flex min-h-6 w-full flex-wrap items-center gap-1 rounded-[5px] bg-control p-[3px]', focus ? 'shadow-[inset_0_0_0_1px_var(--signal)]' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong)]')}>
        {value.map((t) => (
          <span key={t} className="flex h-[18px] items-center gap-0.5 rounded-[4px] bg-active pr-0.5 pl-1.5 text-[11px] text-fg">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="flex size-3.5 items-center justify-center rounded-[3px] text-fg-faint hover:bg-hover hover:text-fg"><X size={10} /></button>
          </span>
        ))}
        <input value={text} aria-label={label} placeholder={value.length ? '' : placeholder}
          onFocus={() => setFocus(true)} onBlur={() => { setFocus(false); if (text.trim()) add(text) }}
          onChange={(e) => { const v = e.target.value; if (v.endsWith(',')) add(v.slice(0, -1)); else setText(v) }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') { e.preventDefault(); add(text) }
            if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
          }}
          className="h-[18px] min-w-[60px] flex-1 bg-transparent px-1 text-[11.5px] text-fg outline-none placeholder:text-fg-faint" />
      </div>
      {focus && open.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {open.map((s) => (
            <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); add(s) }}
              className="h-[18px] rounded-[4px] px-1.5 text-[11px] text-fg-muted shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover hover:text-fg">{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}
