import { ArrowUpRight } from 'lucide-react'
import { cn } from '@kit/core/cn'
import type { ShellMeta } from '@/shells/types'
import { thumb } from './registry'

/** One shell in a grid. `data-shell-id` is what scripts/qa.mjs reads to discover shells. */
export function ShellCard({ shell: s, theme, compact, className }: { shell: ShellMeta; theme: string; compact?: boolean; className?: string }) {
  return (
    <a
      href={`#/${s.id}`}
      data-shell-id={s.id}
      className={cn('panel group flex min-w-0 flex-col overflow-hidden outline-none transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-signal', className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-well">
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[11.5px] text-fg-faint">{s.archetype}</div>
        <img
          src={thumb(s.id, theme)}
          alt=""
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          className="absolute inset-0 size-full object-cover object-top"
        />
      </div>
      <div className={cn('flex flex-1 flex-col gap-1.5', compact ? 'p-3.5' : 'p-4')}>
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[13.5px] font-semibold text-fg">{s.name}</div>
          <ArrowUpRight size={14} strokeWidth={1.5} className="flex-none text-fg-faint transition-colors group-hover:text-fg" />
        </div>
        <div className={cn('text-[12px] leading-relaxed text-fg-muted', compact && 'line-clamp-2')}>{s.description}</div>
        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          <span className="rounded-[5px] bg-hover px-1.5 py-0.5 text-[10.5px] text-fg-muted">{s.category}</span>
          {!compact && <span className="rounded-[5px] bg-hover px-1.5 py-0.5 text-[10.5px] text-fg-muted">{s.archetype}</span>}
          {!compact && s.references?.map((r) => (
            <span key={r} className="rounded-[5px] px-1.5 py-0.5 text-[10.5px] text-fg-faint shadow-[inset_0_0_0_1px_var(--line)]">{r}</span>
          ))}
        </div>
      </div>
    </a>
  )
}

/** Category filter chips + grid. Shared by the landing section and #/shells. */
export function categoriesOf(shells: ShellMeta[]) {
  return ['All', ...new Set(shells.map((s) => s.category))]
}
