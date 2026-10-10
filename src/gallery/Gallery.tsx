import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTheme, cn, TipProvider } from '@kit'
import type { ShellMeta } from '@/shells/types'
import { site } from '@/site.config'
import '@/landing/landing.css'
import { Mark, ThemeButton } from '@/landing/parts'
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
  const [cat, setCat] = useState('All')
  const list = shells.filter((s) => cat === 'All' || s.category === cat)
  return (
    <TipProvider>
      <div className="site h-full overflow-y-auto bg-field text-fg">
        <div className="mx-auto max-w-[1180px] px-4 pt-6 pb-24 sm:px-8 sm:pt-8">
          <header className="flex items-center justify-between gap-4">
            <a href="#/" className="flex items-center gap-2 rounded-[6px] text-[13px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-signal">
              <Mark /><span className="font-display text-[17px] font-extrabold lowercase tracking-[-0.035em]">{site.name}</span>
            </a>
            <ThemeButton />
          </header>
          <a href="#/" className="mt-10 inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
            <ArrowLeft size={13} strokeWidth={1.5} />Overview
          </a>
          <h1 className="mt-3 font-display text-[30px] font-bold tracking-[-0.025em]">Shells</h1>
          <p className="mt-2 max-w-[600px] text-[13.5px] leading-relaxed text-fg-muted">
            One kit, many instruments. Each shell is a different kind of tool built from the same components, to prove
            the harness holds up across environments. Press <span className="text-fg">⌘K</span> inside any shell for
            commands, <span className="text-fg">?</span> for shortcuts.
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
