/* Small building blocks for the landing page. Kit tokens only — no colour
   literals — so both themes come for free. The one exception is the brand
   colour inside Mark. */
import { useState, type ReactNode } from 'react'
import { Check, Copy, Moon, Sun } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { copyText } from '@kit/core/io'
import { useTheme } from '@kit/core/theme'
import { Tip } from '@kit/ui/tooltip'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1120px] px-4 sm:px-8', className)}>{children}</div>
}

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} data-section={id} className={cn('scroll-mt-16 py-16 sm:py-20', className)}>
      <Container>{children}</Container>
    </section>
  )
}

/** Section heading: a quiet kicker, a title, an optional lede. Sentence case throughout. */
export function Heading({ kicker, title, lede, className }: { kicker?: string; title: ReactNode; lede?: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-[640px]', className)}>
      {kicker && <div data-reveal="fade" className="mb-3 text-[13px] font-medium text-signal">{kicker}</div>}
      <h2 data-reveal="head" className="font-display text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance text-fg sm:text-[32px]">{title}</h2>
      {lede && <p data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="mt-4 text-[16px] leading-[1.6] text-pretty text-fg-muted">{lede}</p>}
    </div>
  )
}

/** A shell command with a copy button. `prompt` marks it as a Claude Code slash command vs a terminal line. */
export function CommandLine({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  const slash = text.startsWith('/')
  return (
    <div className={cn('group flex h-10 min-w-0 items-center gap-2 rounded-[9px] bg-control pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--line)] dark:bg-fg/[0.035]', className)}>
      <span className="flex-none font-code text-[12px] text-fg-faint select-none">{slash ? '›' : '$'}</span>
      <code className="min-w-0 flex-1 truncate font-code text-[12.5px] text-fg" title={text}>{text}</code>
      <Tip label={done ? 'Copied' : 'Copy'}>
        <button
          type="button"
          aria-label={`Copy: ${text}`}
          onClick={() => copyText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400) })}
          className="flex size-8 flex-none items-center justify-center rounded-[7px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal"
        >
          {done ? <Check size={14} strokeWidth={1.75} className="text-ok" /> : <Copy size={14} strokeWidth={1.5} />}
        </button>
      </Tip>
    </div>
  )
}

export function ThemeButton({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <Tip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
      <button type="button" onClick={toggle} aria-label="Toggle theme"
        className={cn('flex size-8 flex-none items-center justify-center rounded-[8px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', className)}>
        {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
      </button>
    </Tip>
  )
}

/** The Trompo mark (brand/trompo, spec in brand/BRAND.md). The one deliberate colour
    literal in the site: the band is the brand's rosa mexicano. The body follows the
    text colour, and the motion swooshes only show from 24px up. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className="flex-none text-fg">
      <rect x="14.4" y="2.5" width="3.2" height="6" rx="1.2" fill="currentColor" />
      <path d="M5.5 12.5 C5.5 9 10 7.5 16 7.5 C22 7.5 26.5 9 26.5 12.5 C26.5 17.5 20 23.5 16 29.5 C12 23.5 5.5 17.5 5.5 12.5 Z" fill="currentColor" />
      <path className="fill-[#D1006F] dark:fill-[#FF3EA5]" d="M5.7 11.2 H26.3 C26.5 12 26.5 13 26.3 14 H5.7 C5.5 13 5.5 12 5.7 11.2 Z" />
      {size >= 24 && (
        <g className="stroke-[#D1006F] dark:stroke-[#FF3EA5]" fill="none" strokeWidth="1.6" strokeLinecap="round">
          <path d="M2.5 20 Q4 24 7.5 25.5" />
          <path d="M29.5 20 Q28 24 24.5 25.5" />
        </g>
      )}
    </svg>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-[6px] bg-hover px-2 text-[11.5px] whitespace-nowrap text-fg-muted', className)}>{children}</span>
}

/** Scroll to a landing section without touching the hash — the hash is the router. */
export const scrollToSection = (id: string) => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

