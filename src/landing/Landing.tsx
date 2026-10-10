/* The landing page (#/). Everything brand-specific comes from site.config;
   everything visual from the kit's tokens, so both themes work unchanged. */
import { Fragment, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
// Narrow kit imports keep the landing chunk small (the barrel pulls every shell's kit code).
import { Button } from '@kit/ui/button'
import { Segmented } from '@kit/ui/controls'
import { TipProvider } from '@kit/ui/tooltip'
import { useTheme } from '@kit/core/theme'
import { cn } from '@kit/core/cn'
import { site } from '@/site.config'
import './landing.css'
import type { Shell } from '@/gallery/registry'
import { Chip, CommandLine, Container, Heading, Logo, Section, scrollToSection } from './parts'
import { useReveals } from './reveals'
import { SiteNav, usePendingSection } from './SiteNav'
import { LiveShell } from './LiveShell'
import { StepDeck } from './StepDeck'
import { KIT_THUMBS, useKitScroll } from './KitThumbs'
import { ShellRail } from './ShellRail'
import { WheelField } from './WheelField'
import { HERO_SHELLS, credits, faq, hero, installs, kitGroups, links, steps } from './content'

export function Landing({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  useReveals(root)
  usePendingSection()
  const kitGrid = useRef<HTMLDivElement>(null)
  useKitScroll(kitGrid)
  const byId = (id: string) => shells.find((s) => s.id === id)
  const heroShells = HERO_SHELLS.map(byId).filter((s): s is Shell => !!s).slice(0, 6)

  return (
    <TipProvider>
      <div ref={root} className="site relative isolate h-full overflow-x-hidden overflow-y-auto bg-field text-fg [&_*]:scroll-mt-20">
        {/* the hero's background texture: the logo's two wheels as rippling contour lines */}
        <div aria-hidden className="wheel-field pointer-events-none absolute inset-x-0 top-0 -z-10 h-[880px] text-fg"><WheelField className="block h-full w-full" /></div>
        <SiteNav scroller={root} />

        {/* ── hero ─────────────────────────────────────────────── */}
        <Container className="pt-14 sm:pt-20">
          <div className="max-w-[760px]">
            {/* stacked and big (brand/BRAND.md "Type at scale"): word by word, then the paragraph rises and the actions fade */}
            <h1 data-reveal="words" aria-label={hero.lines.join(' ')} className="font-display text-[clamp(56px,11.5vw,136px)] leading-[0.82] font-normal tracking-[-0.025em]">
              {hero.lines.map((line, l) => <span key={l} className="block">{line.split(' ').map((w, i) => {
                const n = hero.lines.slice(0, l).join(' ').split(' ').filter(Boolean).length + i
                return <Fragment key={i}>{i > 0 && ' '}<span className="reveal-word"><span style={{ '--word': n } as React.CSSProperties}>{w}</span></span></Fragment>
              })}</span>)}
            </h1>
            <p data-reveal style={{ '--reveal-delay': '0.56s' } as React.CSSProperties} className="mt-7 max-w-[600px] text-[17px] leading-[1.6] text-pretty text-fg-muted sm:mt-9 sm:text-[19px]">{hero.lede}</p>
            {/* the actions: Install, and the install command beside it */}
            <div data-reveal="fade" style={{ '--reveal-delay': '0.7s' } as React.CSSProperties} className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="lg" className="h-10 flex-none px-4 text-[13.5px]" onClick={() => scrollToSection('install')}>Install<ArrowRight size={14} strokeWidth={1.75} /></Button>
              <CommandLine text={installs[0].lines[0]} className="w-full max-w-[420px] min-w-[260px] flex-1" />
            </div>
          </div>
        </Container>
        {/* the preview breaks out of the text column — nearly full width, up to the tool's native 1440 */}
        <div className="mx-auto mt-16 w-full max-w-[1440px] px-3 pb-16 sm:mt-28 sm:px-6 sm:pb-20">
          {heroShells.length > 0 && <LiveShell shells={heroShells} />}
        </div>

        {/* ── how it works ─────────────────────────────────────── */}
        <Section id="how">
          <StepDeck steps={steps} head={
            <Heading kicker="How it works" title="Ask for a tool, get a real one."
              lede={<>Install the skill, then ask your agent for “a tool to tune this”. The tool stays neutral: <span className="text-fg">the brand lives inside the artboard, never around it.</span></>} />
          } />
        </Section>

        {/* ── kit ──────────────────────────────────────────────── */}
        <Section id="kit">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading kicker="The kit" title="The parts every tool repeats."
              lede="They install into your project as files you own, so you can change anything." />
            <a href={links.kitDocs} className="inline-flex items-center gap-1 text-[13px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">Kit guide<ArrowUpRight size={13} strokeWidth={1.5} /></a>
          </div>
          <div ref={kitGrid} data-reveal="cards" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kitGroups.map((g, i) => (
              <div key={g.title} style={{ '--card-in-delay': `${i * 70}ms` } as React.CSSProperties} className="card-in panel group flex flex-col gap-3 p-2.5 pb-4 hover:[--kh:1] focus-within:[--kh:1] sm:pb-5">
                {KIT_THUMBS[g.title]?.()}
                <h3 className="mt-1.5 px-1.5 font-display text-[15px] font-semibold sm:px-2.5">{g.title}</h3>
                <p className="px-1.5 text-[12.5px] leading-[1.6] text-fg-muted sm:px-2.5">{g.body}</p>
                <div className="mt-auto flex flex-wrap gap-1 px-1.5 pt-1 sm:px-2.5">{g.items.map((i) => <Chip key={i}>{i}</Chip>)}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── shells ───────────────────────────────────────────── */}
        <ShellRail shells={shells} theme={theme} />

        {/* ── install ──────────────────────────────────────────── */}
        <InstallSection />

        {/* ── faq + credits ────────────────────────────────────── */}
        <Section id="faq">
          <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
            <Heading kicker="FAQ" title="Fair questions." />
            <div className="flex flex-col">
              {faq.map((f, i) => (
                <details key={f.q} data-reveal style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties} className={cn('group py-4', i > 0 && 'border-t border-line')} open={i === 0}>
                  <summary className="flex cursor-default list-none items-center justify-between gap-4 rounded-[6px] text-[14.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex-none text-fg-faint transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 max-w-[640px] text-[13.5px] leading-[1.65] text-fg-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        <Section id="credits">
          <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
            <Heading kicker="Credits" title="Standing on good tools." />
            <div>
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
        </Section>

        <footer className="border-t border-line">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-[12.5px] text-fg-muted">
            <div className="flex items-center gap-2"><Logo height={15} /><span className="text-fg-faint">· {site.license} · {site.author.url
              ? <a href={site.author.url} target="_blank" rel="noreferrer" className="underline-offset-2 outline-none hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-signal">{site.author.name}</a>
              : site.author.name}</span></div>
            <div className="flex gap-5">
              <a href="#/shells" className="hover:text-fg">Shells</a>
              <a href={links.repo} className="hover:text-fg">GitHub</a>
              <a href={links.contributing} className="hover:text-fg">Contributing</a>
            </div>
          </Container>
        </footer>
      </div>
    </TipProvider>
  )
}

/* Two navs: the bar at the top of the page scrolls away with it, and once the
   reader is past it a floating pill (80% of the body, blurred) drops in from above.
   "The body" is Container's content column: 1120 minus its 32px gutters, so 1056 wide. */

function InstallSection() {
  const [tab, setTab] = useState<string>(installs[0].id)
  const cur = installs.find((i) => i.id === tab) ?? installs[0]
  return (
    <Section id="install">
      <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        <Heading kicker="Install" title="Two minutes, then ask for a tool."
          lede="Install the skill and your agent does the rest. Or take just the components." />
        <div data-reveal className="panel flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <Segmented value={tab} onChange={setTab} label="Install method" options={installs.map((i) => ({ value: i.id, label: i.label }))} />
          <div>
            <h3 className="font-display text-[15px] font-semibold">{cur.title}</h3>
            <div className="mt-3 flex flex-col gap-1.5">{cur.lines.map((l) => <CommandLine key={l} text={l} />)}</div>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-fg-muted">{cur.note}</p>
          </div>
        </div>
      </div>
    </Section>
  )
}
