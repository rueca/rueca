import { useRef, useState } from 'react'
import { useTheme } from '@kit/core/theme'
import { cn } from '@kit/core/cn'
import { TipProvider } from '@kit/ui/tooltip'
import type { ShellMeta } from '@/shells/types'
import '@/landing/landing.css'
import { SiteNav } from '@/landing/SiteNav'
import { useReveals } from '@/landing/reveals'
import { useScrollMemory } from '@/landing/scroll-memory'
import { CELL, Field, Hand, Row, Sheet } from '@/landing/plate'
import { ShellCard, categoriesOf } from './ShellCard'
import { FOOTER_LINKS, SiteFooter } from '@/landing/SiteFooter'

/** The category filter. From md it's a ruled row of cells in printed small caps, like the
    header; on phones it wraps as plain buttons in one cell. */
function Filter({ shells, value, onChange }: { shells: ShellMeta[]; value: string; onChange: (c: string) => void }) {
  const count = (c: string) => (c === 'All' ? shells.length : shells.filter((s) => s.category === c).length)
  const btn = (c: string, extra: string) => (
    <button key={c} type="button" onClick={() => onChange(c)} aria-pressed={value === c}
      className={cn('strip flex items-center gap-1.5 text-[11px] outline-none transition-colors focus-visible:text-fg', value === c ? 'text-fg' : 'text-fg-faint hover:text-fg', extra)}>
      {c}<span className="text-fg-faint">{count(c)}</span>
    </button>
  )
  return (
    <Row>
      {/* a grid of ruled cells, one per category: 2 across on phones, 4 from sm, 6 from lg */}
      <div role="group" aria-label="Filter by category" data-base="2" data-sm="4" data-lg="6" className="cells no-cross grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        {categoriesOf(shells).map((c) => btn(c, cn('h-12 justify-center px-3', value === c ? 'bg-fg/[0.05]' : 'hover:bg-fg/[0.025]')))}
      </div>
    </Row>
  )
}

/** Empty cells that finish the grid's last row, so every rule runs
    the full width. Shown per breakpoint: 2 columns from sm, 3 from lg. */
function Fillers({ n }: { n: number }) {
  const sm = (2 - (n % 2)) % 2
  const lg = (3 - (n % 3)) % 3
  return [1, 2].map((i) => (
    <div key={i} aria-hidden className={cn('relative hidden overflow-hidden', i <= sm ? 'sm:block' : 'sm:hidden', i <= lg ? 'lg:block' : 'lg:hidden')}>
    </div>
  ))
}

/** #/shells — every shell, as one sheet: title strip, title, filter, then a grid of ruled cells. */
export function Gallery({ shells }: { shells: ShellMeta[] }) {
  const { theme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  useReveals(root)
  useScrollMemory(root)
  const [cat, setCat] = useState('All')
  const list = shells.filter((s) => cat === 'All' || s.category === cat)
  return (
    <TipProvider>
      <div ref={root} className="site h-full overflow-x-hidden overflow-y-auto bg-[var(--sheet)] text-fg">
        <SiteNav scroller={root} />
        <Sheet as="main">
          {/* the title strip, like a drawing sheet's: printed fields, handwritten values */}
          {/* its own top rule: the nav above has none at rest (its closing rule only shows once pinned) */}
          <Row className="divide-rule no-cross flex h-[60px] items-stretch">
            <Field label="Title" className="min-w-0 flex-1"><Hand className="text-[24px]" delay={0.1}>All the shells</Hand></Field>
            <Field label="Count" className="flex-none"><Hand className="text-[23px]" delay={0.3}>{`${shells.length} in all`}</Hand></Field>
          </Row>
          <Row className={CELL}>
            <h1 className="font-display text-[clamp(52px,9vw,104px)] leading-[0.84] font-normal tracking-[-0.025em]">Shells</h1>
            <p className="mt-6 max-w-[600px] text-[17px] leading-[1.6] text-pretty text-fg-muted">
              Every one is built from the same kit. Inside any of them, press <span className="text-fg">⌘K</span> for
              commands and <span className="text-fg">?</span> for shortcuts.
            </p>
          </Row>
          <Filter shells={shells} value={cat} onChange={setCat} />
          <Row>
            <div data-sm="2" data-lg="3" className="cells sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => <ShellCard key={s.id} shell={s} theme={theme} n={shells.indexOf(s) + 1} />)}
              <Fillers n={list.length} />
            </div>
          </Row>
        </Sheet>
        {/* the same footer as the landing: the drawing's title block on Platino, continuing the sheet's rails */}
        <Sheet className="tone-platino mb-16 sm:mb-24">
          <SiteFooter count={{ label: 'Shells', value: `${shells.length} in all` }} elsewhere={FOOTER_LINKS.shells} />
          <Row />
        </Sheet>
      </div>
    </TipProvider>
  )
}
