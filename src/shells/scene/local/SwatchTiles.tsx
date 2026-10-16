/* ---------------------------------------------------------------------------
   SwatchTiles — pick a named multi-colour variant (a colourway, a theme, a
   brand palette). The configurator control: each tile previews the variant's
   colours as segments of one swatch.

     <SwatchTiles value={active} onChange={apply} options={[{ value: 'sage', label: 'Sage', colors: ['#a9b7a0', '#e8ece4'] }]} />
     <SwatchTiles size="sm" … />    // round chips for a toolbar, label in the tooltip

   `value` may be null (current values match no variant → nothing pressed).
   `onPreview` fires on hover/focus with the option (or null on leave) so the
   artifact can show it before committing. A radio group (APG): one tab stop, and
   the arrows (Home / End) move to a tile AND choose it, like the kit Segmented.
--------------------------------------------------------------------------- */
import { useRef } from 'react'
import { Tip, cn } from '@kit'

export interface SwatchOption { value: string; label: string; colors: string[]; hint?: string }

const fill = (colors: string[]) =>
  colors.length === 1
    ? colors[0]
    : `conic-gradient(from 200deg, ${colors.map((c, i) => `${c} ${(i / colors.length) * 100}% ${((i + 1) / colors.length) * 100}%`).join(', ')})`

export function SwatchTiles({
  value, onChange, options, size = 'md', onPreview, columns = 5, label = 'Variants',
}: {
  value: string | null
  onChange: (v: string) => void
  options: SwatchOption[]
  size?: 'sm' | 'md'
  onPreview?: (v: string | null) => void
  columns?: number
  label?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const checked = options.findIndex((o) => o.value === value)
  const tabStop = checked >= 0 ? checked : 0 // nothing chosen: the first tile is the way in
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = options.length
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    e.stopPropagation()
    refs.current[next]?.focus()
    if (options[next].value !== value) onChange(options[next].value)
  }
  if (size === 'sm')
    return (
      <div role="radiogroup" aria-label={label} className="flex items-center gap-1" onPointerLeave={() => onPreview?.(null)}>
        {options.map((o, i) => (
          <Tip key={o.value} label={o.label}>
            <button
              ref={(n) => { refs.current[i] = n }}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              tabIndex={i === tabStop ? 0 : -1}
              aria-label={o.label}
              onClick={() => onChange(o.value)}
              onPointerEnter={() => onPreview?.(o.value)}
              onFocus={() => onPreview?.(o.value)}
              onBlur={() => onPreview?.(null)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'flex size-icon items-center justify-center rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-signal',
                value === o.value ? 'shadow-[inset_0_0_0_1.5px_var(--signal)]' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong)]',
              )}
            >
              <span className="size-[18px] rounded-full shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: fill(o.colors) }} />
            </button>
          </Tip>
        ))}
      </div>
    )
  return (
    <div role="radiogroup" aria-label={label} className="grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} onPointerLeave={() => onPreview?.(null)}>
      {options.map((o, i) => (
        <Tip key={o.value} label={o.hint}>
          <button
            ref={(n) => { refs.current[i] = n }}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(o.value)}
            onPointerEnter={() => onPreview?.(o.value)}
            onFocus={() => onPreview?.(o.value)}
            onBlur={() => onPreview?.(null)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-[calc(var(--radius-control)+2px)] pt-1.5 pb-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
              value === o.value ? 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--signal)]' : 'bg-control hover:shadow-[inset_0_0_0_1px_var(--line-strong)]',
            )}
          >
            <span className="size-6 rounded-full shadow-[inset_0_0_0_1px_var(--line-strong),0_1px_2px_rgba(0,0,0,.2)]" style={{ background: fill(o.colors) }} />
            <span className={cn('w-full truncate px-0.5 text-center text-ui-sm', value === o.value ? 'text-fg' : 'text-fg-muted')}>{o.label}</span>
          </button>
        </Tip>
      ))}
    </div>
  )
}
