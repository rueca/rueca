import { cn } from '@kit/core/cn'
import type { ShellMeta } from '@/shells/types'
import { Chip } from '@/landing/parts'
import { Hand } from '@/landing/plate'
import { gridThumb } from './registry'

/** One shell as a cell of the sheet (src/landing/plate.tsx): the thumbnail fills the top
    edge to edge and its bottom rule closes it, then the name, a handwritten figure number,
    the description and the chips. `data-shell-id` is what scripts/qa.mjs reads to discover shells. */
export function ShellCard({ shell: s, theme, n, className }: { shell: ShellMeta; theme: string; n: number; className?: string }) {
  return (
    <a href={`#/${s.id}`} data-shell-id={s.id}
      className={cn('group flex min-w-0 flex-col outline-none transition-colors hover:bg-fg/[0.02] focus-visible:bg-fg/[0.04]', className)}>
      {/* the wrapper isn't clipped, so the crosshair where the thumbnail's rule meets the cell's left rule can overhang */}
      <div className="relative">
        {/* a square of field colour with the screenshot mounted in it, like a print on a plate */}
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-fg/[0.03] p-[9%] shadow-[inset_0_-1px_0_var(--rule)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-well shadow-[0_0_0_1px_var(--rule),0_10px_28px_-14px_rgb(0_0_0/0.35)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transition-none">
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[11.5px] text-fg-faint">{s.archetype}</div>
            <img src={gridThumb(s.id, theme)} alt="" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              className="absolute inset-0 size-full object-cover object-top" />
          </div>
        </div>
        <span aria-hidden className="cross" style={{ left: 0, top: 'calc(100% - 1px)' }} />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-7 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="truncate font-display text-[19px] leading-tight text-fg">{s.name}</h2>
          <Hand className="flex-none text-[17px] text-fg-muted">{`fig. ${n}`}</Hand>
        </div>
        <p className="text-[12.5px] leading-[1.6] text-fg-muted">{s.description}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          <Chip>{s.category}</Chip>
          {s.references?.map((r) => <Chip key={r}>{r}</Chip>)}
        </div>
      </div>
    </a>
  )
}

/** The categories to filter by, 'All' first. */
export function categoriesOf(shells: ShellMeta[]) {
  return ['All', ...new Set(shells.map((s) => s.category))]
}
