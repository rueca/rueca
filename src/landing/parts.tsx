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
      <h2 data-reveal="head" className="font-display text-[36px] leading-[0.88] font-normal tracking-[-0.02em] text-balance text-fg sm:text-[48px]">{title}</h2>
      {lede && <p data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="mt-[18px] text-[17px] leading-[1.6] text-pretty text-fg-muted">{lede}</p>}
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
   its loop, the same 22.5 gap round both discs (11 Oct: whorl 30% bigger, its loop grown to match and moved right so the mark keeps its width), bottoms level. The wordmark is Sorts Mill Goudy (OFL), outlined, and
   fills the band's inner box: baseline on the band's inner bottom edge, x-height up to its inner
   top, thickened so the stems carry the discs' mass; Rafael's v3 (11 Oct) makes it 2.9% bigger with a
   flat-topped u and a 90.2 gap. One drawing at every size, as in Rafael's file (brand/logo/rafael/
   rueca-lockup-updated-3.svg, 12 Oct): the generator's heavier small cut (band 34) isn't used. */
/* Colour assignment E (brand/logo/colour.html, Rafael 11 Oct): wheel Malva, whorl Achiote, band Gualda. */
const MARK_DYES = ['malva', 'achiote', 'gualda'] as const // LOCKUP mark order: wheel, whorl, band
const cutFor = (_size: number) => LOCKUP.regular
/** brand dyes: light value, then the lifted dark value */
const LOGO_DYE = {
  achiote: 'fill-[#E8582C] dark:fill-[#F06A3E]',
  cielo: 'fill-[#5DB4E8] dark:fill-[#6FC0EE]',
  malva: 'fill-[#A88BF6] dark:fill-[#B39AF8]',
  gualda: 'fill-[#F2C744] dark:fill-[#F5D05A]',
}

/** Flat again (Rafael, 11 Oct): the whole logo in the page's ink. True brings colour E back (the dyes above); the word stays ink either way. */
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

/** A path's box (x, y, w, h) from its points and control points, so it follows the word wherever
    outline_rueca.py puts it. Generated paths are absolute (M L H V C Q Z); every command but H and V
    takes x,y pairs, and control points only ever widen the box a hair. */
function pathBox(d: string) {
  const xs: number[] = [], ys: number[] = []
  let cmd = '', x = 0, y = 0
  const t = d.match(/[a-z]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []
  for (let i = 0; i < t.length;) {
    if (/[a-z]/i.test(t[i])) { cmd = t[i++].toUpperCase(); continue }
    if (cmd === 'H') x = +t[i++]
    else if (cmd === 'V') y = +t[i++]
    else { x = +t[i++]; y = +t[i++] }
    xs.push(x); ys.push(y)
  }
  const x0 = Math.min(...xs), y0 = Math.min(...ys)
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0] as const
}

/** The wordmark alone. `height` is the mark's height it would sit beside in the Logo, so the word
    comes out the same size as in the full lockup. */
export function Wordmark({ height = 20, className }: { height?: number; className?: string }) {
  const { markH, word } = cutFor(height)
  const [x0, y0, w0, h0] = pathBox(word)
  // a hair of room on every side: a box cut exactly to the ink loses the round letters' last
  // antialiased row once the size lands on a fractional pixel (the bottoms of "ueca" on phones)
  const pad = h0 * 0.04
  const [x, y, w, h] = [x0 - pad, y0 - pad, w0 + pad * 2, h0 + pad * 2]
  const k = height / markH
  return (
    <svg role="img" aria-label={site.name} viewBox={`${x} ${y} ${w} ${h}`} height={h * k} width={w * k} className={cn('flex-none overflow-visible text-fg', className)}>
      <path d={word} fill="currentColor" />
    </svg>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-[2px] bg-hover px-2 text-[11.5px] whitespace-nowrap text-fg-muted shadow-[inset_0_0_0_1px_var(--rule)]', className)}>{children}</span>
}

/** Jump straight to a landing section (no smooth scroll) without touching the hash — the hash is the router. */
export const scrollToSection = (id: string) => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ block: 'start' })

