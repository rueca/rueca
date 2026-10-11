/* Small building blocks for the landing page. Kit tokens only — no colour
   literals — so both themes come for free. The brand colour comes in through
   --signal (landing.css), which Mark's hub uses. */
import { useState, type ReactNode } from 'react'
import { Check, Copy, Moon, Sun } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { copyText } from '@kit/core/io'
import { useTheme } from '@kit/core/theme'
import { Tip } from '@kit/ui/tooltip'
import { site } from '@/site.config'
import { LOCKUP } from './logo.generated'

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
      {kicker && <div data-reveal="fade" data-kicker className="font-hand mb-2.5 text-[24px] leading-none text-fg-muted">{kicker}</div>}
      <h2 data-reveal="head" className="font-display text-[36px] leading-[0.88] font-normal tracking-[-0.02em] text-balance text-fg sm:text-[56px]">{title}</h2>
      {lede && <p data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="mt-5 text-[17px] leading-[1.6] text-pretty text-fg-muted">{lede}</p>}
    </div>
  )
}

/** A shell command with a copy button. `prompt` marks it as a Claude Code slash command vs a terminal line. */
export function CommandLine({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  const slash = text.startsWith('/')
  return (
    <div className={cn('group flex h-10 min-w-0 items-center gap-2 rounded-[2px] bg-control pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--rule)] dark:bg-fg/[0.035]', className)}>
      <span className="flex-none font-code text-[12px] text-fg-faint select-none">{slash ? '›' : '$'}</span>
      <code className="min-w-0 flex-1 truncate font-code text-[12.5px] text-fg max-sm:text-[11.5px]" title={text}>{text}</code>
      <Tip label={done ? 'Copied' : 'Copy'}>
        <button
          type="button"
          aria-label={`Copy: ${text}`}
          onClick={() => copyText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400) })}
          className="flex size-8 flex-none items-center justify-center rounded-[2px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal"
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
        className={cn('flex size-8 flex-none items-center justify-center rounded-[2px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', className)}>
        {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
      </button>
    </Tip>
  )
}

/* The Rueca logo, all vectors (src/landing/logo.generated.ts, from brand/tools/outline_rueca.py).
   The mark is Rafael's two-wheel drawing (brand/moodboards/rueca-logo.svg) rebuilt as "I · Pulido"
   (brand/logo/): drive wheel, whorl and band on true arcs round two centres, the whorl centred in
   its loop, gaps 22.5 / 19.5, bottoms level. The wordmark is outlined and fills the band's inner
   box, as in Rafael's file: baseline on the band's inner bottom edge, x-height up to its inner top,
   weight 450 (500 small) so the word carries the discs' mass, half an x-height between them. Two cuts: regular, and a heavier small
   one at 24px and under (band 34) so the whorl survives a favicon. The word is Signifier (Klim),
   shipping ahead of the licence Rafael is buying; Newsreader (OFL) outlines are the fallback. */
const MARK_DYES = ['cielo', 'achiote', 'gualda'] as const // LOCKUP mark order: wheel, whorl, band
const cutFor = (size: number) => LOCKUP[size <= 24 ? 'small' : 'regular']
/** brand dyes: light value, then the lifted dark value */
const LOGO_DYE = {
  achiote: 'fill-[#E8582C] dark:fill-[#F06A3E]',
  cielo: 'fill-[#5DB4E8] dark:fill-[#6FC0EE]',
  gualda: 'fill-[#F2C744] dark:fill-[#F5D05A]',
}

/** Mono for now (Rafael, 10 Oct 2026): the whole logo in the page's ink. Flip to bring the dyes back. */
const LOGO_IN_COLOUR = false
const markFill = (dye: keyof typeof LOGO_DYE) => (LOGO_IN_COLOUR ? { className: LOGO_DYE[dye] } : { fill: 'currentColor' })

/** The mark alone. The band's two rings wind the same way, so it fills evenodd. */
export function Mark({ size = 20, className }: { size?: number; className?: string }) {
  const { markW: w, markH: h, mark } = cutFor(size)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} height={size} width={(size * w) / h} aria-hidden className={cn('flex-none text-fg', className)}>
      {mark.map((d, i) => <path key={i} d={d} fillRule="evenodd" {...markFill(MARK_DYES[i])} />)}
    </svg>
  )
}

/** Mark + wordmark, one SVG. `height` is the mark's; the word's round letters dip a hair below it. */
export function Logo({ height = 20, className }: { height?: number; className?: string }) {
  const { vb: [w, h], markH, mark, word } = cutFor(height)
  const k = height / markH
  return (
    <svg role="img" aria-label={site.name} viewBox={`0 0 ${w} ${h}`} height={h * k} width={w * k} className={cn('flex-none text-fg', className)}>
      {mark.map((d, i) => <path key={i} d={d} fillRule="evenodd" {...markFill(MARK_DYES[i])} />)}
      <path d={word} fill="currentColor" />
    </svg>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-[2px] bg-hover px-2 text-[11.5px] whitespace-nowrap text-fg-muted shadow-[inset_0_0_0_1px_var(--rule)]', className)}>{children}</span>
}

/** Jump straight to a landing section (no smooth scroll) without touching the hash — the hash is the router. */
export const scrollToSection = (id: string) => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'start' })

