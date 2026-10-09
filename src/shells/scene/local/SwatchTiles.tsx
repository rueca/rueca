/* ---------------------------------------------------------------------------
   SwatchTiles — pick a named multi-colour variant (a colourway, a theme, a
   brand palette). The configurator control: each tile previews the variant's
   colours as segments of one swatch.

     <SwatchTiles value={active} onChange={apply} options={[{ value: 'sage', label: 'Sage', colors: ['#a9b7a0', '#e8ece4'] }]} />
     <SwatchTiles size="sm" … />    // round chips for a toolbar, label in the tooltip

   `value` may be null (current values match no variant → nothing pressed).
   `onPreview` fires on hover/focus with the option (or null on leave) so the
   artifact can show it before committing. Arrow keys move between tiles.
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
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    e.stopPropagation()
    refs.current[(i + d + options.length) % options.length]?.focus()
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
              aria-label={o.label}
              onClick={() => onChange(o.value)}
              onPointerEnter={() => onPreview?.(o.value)}
              onFocus={() => onPreview?.(o.value)}
              onBlur={() => onPreview?.(null)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'flex size-7 items-center justify-center rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent',
                value === o.value ? 'shadow-[inset_0_0_0_1.5px_var(--accent)]' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong)]',
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
            onClick={() => onChange(o.value)}
            onPointerEnter={() => onPreview?.(o.value)}
            onFocus={() => onPreview?.(o.value)}
            onBlur={() => onPreview?.(null)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-[7px] pt-1.5 pb-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
              value === o.value ? 'bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-input hover:shadow-[inset_0_0_0_1px_var(--line-strong)]',
            )}
          >
            <span className="size-6 rounded-full shadow-[inset_0_0_0_1px_var(--line-strong),0_1px_2px_rgba(0,0,0,.2)]" style={{ background: fill(o.colors) }} />
            <span className={cn('w-full truncate px-0.5 text-center text-[10.5px]', value === o.value ? 'text-fg' : 'text-muted')}>{o.label}</span>
          </button>
        </Tip>
      ))}
    </div>
  )
}
