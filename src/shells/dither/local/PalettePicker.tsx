/* ---------------------------------------------------------------------------
   PalettePicker — choose a palette by looking at it. Each option is a strip
   of its colours (the kit's Select shows one swatch per option at most).

     <PalettePicker
       value="Game Boy"
       options={[{ name: 'Game Boy', colors: ['#0f380f', …] }, …]}
       onChange={(name, colors) => …}
       columns={2}
     />

   A radiogroup: arrow keys move, Enter/Space picks. `value` that matches no
   option (a custom palette) simply leaves nothing selected.
--------------------------------------------------------------------------- */
import { useRef } from 'react'
import { cn } from '@kit'

export interface PaletteOption { name: string; colors: string[] }

export function PalettePicker({ value, options, onChange, columns = 2, className }: { value: string; options: PaletteOption[]; onChange: (name: string, colors: string[]) => void; columns?: number; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const cur = options.findIndex((o) => o.name === value)
  return (
    <div role="radiogroup" aria-label="Palettes" className={cn('grid gap-1.5', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o, i) => {
        const on = i === cur
        return (
          <button
            key={o.name}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (cur < 0 && i === 0) ? 0 : -1}
            title={`${o.name} · ${o.colors.length} colours`}
            onClick={() => onChange(o.name, o.colors)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? columns : e.key === 'ArrowUp' ? -columns : 0
              if (!d) return
              e.preventDefault()
              const n = (i + d + options.length) % options.length
              refs.current[n]?.focus()
              onChange(options[n].name, options[n].colors)
            }}
            className={cn(
              'group/pal flex min-w-0 flex-col gap-1 rounded-[calc(var(--radius-control)+2px)] p-1 text-left outline-none transition-colors',
              on ? 'bg-signal-soft' : 'hover:bg-hover',
              'focus-visible:ring-2 focus-visible:ring-signal',
            )}
          >
            {/* the edge is drawn over the colours (after:), not under them: an inset shadow sits beneath the swatches and
                vanished in light theme, where paper-white palettes met the panel with no edge at all */}
            <span className={cn("relative flex h-4 w-full overflow-hidden rounded-control after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
              on ? 'shadow-[0_0_0_1.5px_var(--signal)]' : 'after:shadow-[inset_0_0_0_1px_var(--line-strong)]')}>
              {o.colors.map((c, j) => <span key={j} className="h-full min-w-0 flex-1" style={{ background: c }} />)}
            </span>
            {/* names take two lines before they truncate ("Riso cielo + achiote" lost its last word at one) */}
            <span className={cn('flex items-start justify-between gap-1 px-0.5 text-ui', on ? 'text-fg' : 'text-fg-muted')}>
              <span className="line-clamp-2 min-w-0 break-words">{o.name}</span>
              <span className="shrink-0 tabular text-fg-faint">{o.colors.length}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
