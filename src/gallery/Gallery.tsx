import { useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@kit/core/theme'
import { cn } from '@kit/core/cn'
import { TipProvider } from '@kit/ui/tooltip'
import type { ShellMeta } from '@/shells/types'
import '@/landing/landing.css'
import { SiteNav } from '@/landing/SiteNav'
import { ShellCard, categoriesOf } from './ShellCard'

export function CategoryChips({ shells, value, onChange }: { shells: ShellMeta[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
      {categoriesOf(shells).map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} aria-pressed={value === c}
          className={cn('h-7 rounded-full px-3 text-[12px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-signal',
            value === c ? 'bg-fg text-field' : 'bg-panel text-fg-muted shadow-[var(--shadow-cluster)] hover:text-fg')}>
          {c}
          <span className="ml-1.5 opacity-60">{c === 'All' ? shells.length : shells.filter((s) => s.category === c).length}</span>
        </button>
      ))}
    </div>
  )
}

/** #/shells — every test shell. Each is a different kind of instrument built from the same kit. */
export function Gallery({ shells }: { shells: ShellMeta[] }) {
  const { theme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  const [cat, setCat] = useState('All')
  const list = shells.filter((s) => cat === 'All' || s.category === cat)
  return (
    <TipProvider>
      <div ref={root} className="site h-full overflow-y-auto bg-field text-fg">
        <SiteNav scroller={root} />
        <div className="mx-auto max-w-[1120px] px-4 pb-24 sm:px-8">
          <a href="#/" className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
            <ArrowLeft size={13} strokeWidth={1.5} />Overview
          </a>
          <h1 className="mt-3 font-display text-[clamp(52px,9vw,96px)] leading-[0.84] font-black tracking-[-0.045em]">Shells</h1>
          <p className="mt-2 max-w-[600px] text-[13.5px] leading-relaxed text-fg-muted">
            Every one is built from the same kit. Inside any of them, press <span className="text-fg">⌘K</span> for
            commands and <span className="text-fg">?</span> for shortcuts.
          </p>
          <div className="mt-8"><CategoryChips shells={shells} value={cat} onChange={setCat} /></div>
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {list.map((s) => <ShellCard key={s.id} shell={s} theme={theme} />)}
          </div>
        </div>
      </div>
    </TipProvider>
  )
}
