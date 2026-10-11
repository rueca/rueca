/* The landing page (#/). Everything brand-specific comes from site.config;
   everything visual from the kit's tokens, so both themes work unchanged. */
import { Fragment, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
// Narrow kit imports keep the landing chunk small (the barrel pulls every shell's kit code).
import { Button } from '@kit/ui/button'
import { Segmented } from '@kit/ui/controls'
import { TipProvider } from '@kit/ui/tooltip'
import { useTheme } from '@kit/core/theme'
import { cn } from '@kit/core/cn'
import { site } from '@/site.config'
import './landing.css'
import type { Shell } from '@/gallery/registry'
import { Chip, CommandLine, Heading, Logo, scrollToSection } from './parts'
import { CELL, Hand, Row, Sheet, SheetSection, TitleStrip } from './plate'
import { useReveals } from './reveals'
import { SiteNav, usePendingSection } from './SiteNav'
import { LiveShell } from './LiveShell'
import { HeroArrow } from './HeroArrow'
import { StepDeck } from './StepDeck'
import { KIT_THUMBS, useKitScroll } from './KitThumbs'
import { ShellRail } from './ShellRail'
import { HERO_PHONE_SHELL, HERO_SHELLS, RAIL_SHELLS, credits, faq, hero, installs, kitGroups, links, steps } from './content'

export function Landing({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  useReveals(root)
  usePendingSection()
  const kitGrid = useRef<HTMLDivElement>(null)
  useKitScroll(kitGrid)
  const byId = (id: string) => shells.find((s) => s.id === id)
  const heroShells = HERO_SHELLS.map(byId).filter((s): s is Shell => !!s).slice(0, 6)
  const heroPhone = byId(HERO_PHONE_SHELL)
  const heroText = useRef<HTMLDivElement>(null)
  const heroPreview = useRef<HTMLDivElement>(null)

  return (
    <TipProvider>
      <div ref={root} className="site relative isolate h-full overflow-x-hidden overflow-y-auto bg-field text-fg [scroll-snap-type:y_proximity] [&_*]:scroll-mt-20">
        <SiteNav scroller={root} />

        {/* The page is one technical sheet (plate.tsx): rails, ruled cells, Añil crosshairs. */}
        <Sheet as="main" className="mb-16 sm:mb-24">
          {/* ── hero ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden">
            <div className="relative px-5 pt-15 pb-18 sm:px-6 sm:pt-24 sm:pb-29">
              {/* centred on desktop, left-aligned on phones */}
              <div ref={heroText} className="max-w-[760px] md:mx-auto md:text-center">
                {/* stacked and big (brand/BRAND.md "Type at scale"): word by word, then the paragraph rises and the actions fade */}
                <h1 data-reveal="words" aria-label={hero.lines.join(' ')} className="font-display text-[clamp(56px,11.5vw,136px)] leading-[0.82] font-normal tracking-[-0.025em]">
                  {hero.lines.map((line, l) => <span key={l} className="block">{line.split(' ').map((w, i) => {
                    const n = hero.lines.slice(0, l).join(' ').split(' ').filter(Boolean).length + i
                    return <Fragment key={i}>{i > 0 && ' '}<span className="reveal-word"><span style={{ '--word': n } as React.CSSProperties}>{w}</span></span></Fragment>
                  })}</span>)}
                </h1>
                <p data-reveal style={{ '--reveal-delay': '0.56s' } as React.CSSProperties} className="mt-7 max-w-[600px] text-[17px] leading-[1.6] text-pretty text-fg-muted sm:mt-9 sm:text-[19px] md:mx-auto">{hero.lede}</p>
                {/* the actions: Install, and the install command beside it */}
                <div data-reveal="fade" style={{ '--reveal-delay': '0.7s' } as React.CSSProperties} className="mt-8 flex flex-wrap items-center gap-2.5 md:justify-center">
                  <Button variant="primary" size="lg" className="h-10 flex-none rounded-[2px]! px-4 text-[13.5px]" onClick={() => scrollToSection('install')}>Install</Button>
                  <CommandLine text={installs[0].lines[0]} className="w-fit max-w-full min-w-0 gap-3 text-left" />
                </div>
              </div>
            </div>
          </div>
          {/* The one moment that breaks the sheet: the live tool runs wider than the rails.
              No rule or dimension line above it: the hero text runs straight into the figure. */}
          <div className="pb-14 sm:pb-20">
            <div ref={heroPreview} className="relative z-[3]" style={{ width: BREAKOUT, marginLeft: `calc(50% - ${BREAKOUT} / 2)` }}>
              {heroShells.length > 0 && <LiveShell shells={heroShells} phone={heroPhone} />}
            </div>
          </div>
          {/* a pen arrow from the headline round the text to the preview (desktop) */}
          <HeroArrow column={heroText} preview={heroPreview} />

          {/* ── how it works ─────────────────────────────────────── */}
          <SheetSection id="how" n={1} of={SHEETS} label="How it works">
            <StepDeck steps={steps} head={
              <Heading title="Ask for a tool, get a real one."
                lede={<>Install the skill, then ask your agent for “a tool to tune this”. The tool stays neutral: <span className="text-fg">the brand lives inside the artboard, never around it.</span></>} />
            } />
          </SheetSection>

          {/* ── kit ──────────────────────────────────────────────── */}
          <SheetSection id="kit" n={2} of={SHEETS} label="The kit" aside={<a href={links.kitDocs} className="inline-flex items-center gap-1 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">Kit guide<ArrowUpRight size={11} strokeWidth={1.5} /></a>}>
            <Row className={cn('relative overflow-hidden', CELL)}>
              <Heading title="The parts every tool repeats." lede="They install into your project as files you own, so you can change anything." />
            </Row>
            <Row>
              <div ref={kitGrid} data-reveal="cards" data-sm="2" data-lg="3" className="cells sm:grid-cols-2 lg:grid-cols-3">
                {kitGroups.map((g, i) => (
                  // the cell keeps the sheet colour; only its contents animate in, so a hidden card never shows the rule colour
                  <div key={g.title} className="group hover:[--kh:1] focus-within:[--kh:1]">
                    <div style={{ '--card-in-delay': `${i * 70}ms` } as React.CSSProperties} className="card-in flex h-full flex-col">
                      {/* the thumbnail fills the top of the cell, edge to edge; its bottom rule closes it */}
                      {KIT_THUMBS[g.title]?.()}
                      <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-7 sm:px-6">
                        <h3 className="font-display text-[19px]">{g.title}</h3>
                        <p className="text-[12.5px] leading-[1.6] text-fg-muted">{g.body}</p>
                        <div className="mt-auto flex flex-wrap gap-1 pt-1">{g.items.map((i) => <Chip key={i}>{i}</Chip>)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Row>
          </SheetSection>

          {/* ── shells ───────────────────────────────────────────── */}
          <ShellRail shells={shells} featured={RAIL_SHELLS} theme={theme} strip={<TitleStrip n={3} of={SHEETS} label="Shells" aside={<a href="#/shells" className="inline-flex items-center gap-1 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">All shells<ArrowUpRight size={11} strokeWidth={1.5} /></a>} />} />

          {/* ── install ──────────────────────────────────────────── */}
          <InstallSection />

          {/* ── faq ──────────────────────────────────────────────── */}
          <SheetSection id="faq" n={5} of={SHEETS} label="FAQ">
            <Row>
              <div className="split grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className={cn('relative overflow-hidden', CELL)}><Heading title="Fair questions." /></div>
                <div className="flex flex-col px-5 py-9 sm:px-6 sm:py-16">
                  {faq.map((f, i) => (
                    <details key={f.q} data-reveal style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties} className={cn('group py-4', i > 0 && 'border-t border-[var(--rule)]')} open={i === 0}>
                      <summary className="flex cursor-default list-none items-center justify-between gap-4 rounded-[6px] text-[14.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <span className="flex-none text-fg-faint transition-transform group-open:rotate-45" aria-hidden>+</span>
                      </summary>
                      <p className="mt-3 max-w-[640px] text-[13.5px] leading-[1.65] text-fg-muted">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </Row>
          </SheetSection>

          {/* ── credits + footer, printed on Platino (plate.css .tone-platino) ── */}
          <div className="tone-platino">
          <SheetSection id="credits" n={6} of={SHEETS} label="Credits">
            <Row>
              <div className="split grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className={CELL}><Heading title="Standing on good tools." /></div>
                <div className={CELL}>
                  <div data-reveal="cards" className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {credits.map((c, i) => (
                      <div key={c.title} className="card-in" style={{ '--card-in-delay': `${i * 70}ms` } as React.CSSProperties}>
                        <div className="text-[12.5px] font-medium text-fg">{c.title}</div>
                        <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-fg-muted">{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                  <p className="mt-8 max-w-[640px] text-[12.5px] leading-[1.65] text-fg-faint">
                    We checked conventions against each tool’s documentation. Borrowed ideas and code are credited in the README.
                  </p>
                </div>
              </div>
            </Row>
          </SheetSection>

          {/* ── footer: the drawing's title block ────────────────── */}
          <Row as="footer">
            {/* 15+15 | 14+14+14: the first two columns end exactly at the 5/12 split above, so that divider runs straight on */}
            <div data-md="5" className="cells title-block auto-rows-fr text-[12.5px] md:grid-cols-[repeat(2,minmax(0,15fr))_repeat(3,minmax(0,14fr))]">
              <div className="flex items-center px-5 py-5 sm:px-6"><Logo height={16} /></div>
              <TitleCell label="Drawn by">{site.author.url
                ? <a href={site.author.url} target="_blank" rel="noreferrer" className="underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-signal"><Hand>{site.author.name}</Hand></a>
                : <Hand>{site.author.name}</Hand>}</TitleCell>
              <TitleCell label="Licence"><Hand delay={0.15}>{site.license}</Hand></TitleCell>
              <TitleCell label="Sheets"><Hand delay={0.3}>{`${SHEETS} in all`}</Hand></TitleCell>
              <TitleCell label="Elsewhere">
                <span className="flex gap-4 text-[12.5px]">
                  <a href="#/shells" className="hover:underline">Shells</a>
                  <a href={links.repo} className="hover:underline">GitHub</a>
                  <a href={links.contributing} className="hover:underline">Contributing</a>
                </span>
              </TitleCell>
            </div>
          </Row>
          {/* the sheet's closing rule */}
          <Row />
          </div>
        </Sheet>
      </div>
    </TipProvider>
  )
}

/** The hero preview's width: wider than the sheet, up to 1360, always inside the screen. */
const BREAKOUT = 'min(calc(100vw - 16px), 1360px)'
/** How many numbered sheets (sections) the page has, for the title strips. */
const SHEETS = 6

/** A title-block cell: a small-caps label over its value. */
function TitleCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-5 sm:px-6">
      <span className="strip text-[8.5px] text-fg-faint">{label}</span>
      {/* one fixed-height row, centred, so handwritten values and the plain links sit on the same line */}
      <span className="flex h-8 items-center text-[24px] text-fg">{children}</span>
    </div>
  )
}

/* Two navs: the bar at the top of the page scrolls away with it, and once the
   reader is past it a floating pill (80% of the body, blurred) drops in from above.
   "The body" is Container's content column: 1120 minus its 32px gutters, so 1056 wide. */

function InstallSection() {
  const [tab, setTab] = useState<string>(installs[0].id)
  const cur = installs.find((i) => i.id === tab) ?? installs[0]
  return (
    <SheetSection id="install" n={4} of={SHEETS} label="Install">
      <Row>
        <div className="split grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className={CELL}>
            <Heading title="Two minutes, then ask for a tool."
              lede="Install the skill and your agent does the rest. Or take just the components." />
          </div>
          <div data-reveal className={cn('flex min-w-0 flex-col gap-4', CELL)}>
            <Segmented value={tab} onChange={setTab} label="Install method" options={installs.map((i) => ({ value: i.id, label: i.label }))} />
            <div>
              <h3 className="font-display text-[17px]">{cur.title}</h3>
              <div className="mt-3 flex flex-col gap-1.5">{cur.lines.map((l) => <CommandLine key={l} text={l} />)}</div>
              <p className="mt-3 text-[12.5px] leading-[1.6] text-fg-muted">{cur.note}</p>
            </div>
          </div>
        </div>
      </Row>
    </SheetSection>
  )
}
