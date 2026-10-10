/* The landing page (#/). Everything brand-specific comes from site.config;
   everything visual from the kit's tokens, so both themes work unchanged. */
import { Fragment, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Button, Segmented, TipProvider, useTheme, cn } from '@kit'
import { site } from '@/site.config'
import './landing.css'
import type { Shell } from '@/gallery/registry'
import { Chip, CommandLine, Container, Heading, Mark, Section, ThemeButton, scrollToSection } from './parts'
import { useReveals } from './reveals'
import { LiveShell } from './LiveShell'
import { StepDeck } from './StepDeck'
import { KIT_THUMBS } from './KitThumbs'
import { ShellRail } from './ShellRail'
import { HERO_SHELLS, credits, faq, installs, kitGroups, links, steps } from './content'

const NAV = [
  { id: 'how', label: 'How it works' },
  { id: 'kit', label: 'Kit' },
  { id: 'shells', label: 'Shells' },
  { id: 'install', label: 'Install' },
  { id: 'faq', label: 'FAQ' },
]

export function Landing({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  useReveals(root)
  const byId = (id: string) => shells.find((s) => s.id === id)
  const heroShells = HERO_SHELLS.map(byId).filter((s): s is Shell => !!s).slice(0, 6)

  return (
    <TipProvider>
      <div ref={root} className="site h-full overflow-x-hidden overflow-y-auto bg-field text-fg [&_*]:scroll-mt-16">
        <Nav />

        {/* ── hero ─────────────────────────────────────────────── */}
        <Container className="pt-14 sm:pt-20">
          <div className="max-w-[760px]">
            {/* word by word, then the paragraph rises and the actions fade (trove.quest's timings) */}
            <h1 data-reveal="words" className="font-display text-[34px] leading-[1.06] font-bold tracking-[-0.035em] text-balance sm:text-[52px]">
              {site.tagline.split(' ').map((w, i) => <Fragment key={i}>{i > 0 && ' '}<span className="reveal-word"><span style={{ '--word': i } as React.CSSProperties}>{w}</span></span></Fragment>)}
            </h1>
            <p data-reveal style={{ '--reveal-delay': '0.56s' } as React.CSSProperties} className="mt-5 max-w-[620px] text-[16px] leading-[1.6] text-pretty text-fg-muted sm:text-[17px]">{site.description}</p>
            <div data-reveal="fade" style={{ '--reveal-delay': '0.7s' } as React.CSSProperties} className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="lg" className="h-10 px-4 text-[13.5px]" onClick={() => scrollToSection('install')}>Install<ArrowRight size={14} strokeWidth={1.75} /></Button>
              <a href="#/shells" className="inline-flex h-10 items-center gap-1.5 rounded-[8px] px-4 text-[13.5px] font-medium text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
                Browse {shells.length} shells
              </a>
            </div>
            <div data-reveal="fade" style={{ '--reveal-delay': '0.8s' } as React.CSSProperties}><CommandLine text={installs[0].lines[0]} className="mt-6 max-w-[460px]" /></div>
          </div>
        </Container>
        {/* the preview breaks out of the text column — nearly full width, up to the tool's native 1440 */}
        <div className="mx-auto mt-12 w-full max-w-[1440px] px-3 pb-16 sm:mt-16 sm:px-6 sm:pb-20">
          {heroShells.length > 0 && <LiveShell shells={heroShells} />}
        </div>

        {/* ── how it works ─────────────────────────────────────── */}
        <Section id="how">
          <Heading kicker="How it works" title="Ask for a tool, get a real one."
            lede={<>Install the skill, then ask your agent for a prototype, a playground or “a tool to tune this”. The tool stays neutral: <span className="text-fg">the brand lives inside the artboard, never around it.</span></>} />
          <div data-reveal className="mt-8 lg:mt-10"><StepDeck steps={steps} /></div>
        </Section>

        {/* ── kit ──────────────────────────────────────────────── */}
        <Section id="kit">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading kicker="The kit" title="Components for the parts every tool repeats."
              lede="Built once and built properly, so every tool starts from a good place. It installs into your project as files you own, so nothing is locked away." />
            <a href={links.kitDocs} className="inline-flex items-center gap-1 text-[13px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">Kit guide<ArrowUpRight size={13} strokeWidth={1.5} /></a>
          </div>
          <div data-reveal="cards" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kitGroups.map((g, i) => (
              <div key={g.title} style={{ '--card-in-delay': `${i * 70}ms` } as React.CSSProperties} className="card-in panel group flex flex-col gap-3 p-2.5 pb-4 sm:pb-5">
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
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-16">
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
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-16">
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
                Interaction conventions were checked against each reference tool’s documentation; the research notes are in
                the repo. Ideas borrowed from Toolcraft and DialKit are credited in the README, and any ported code keeps its MIT notice.
              </p>
            </div>
          </div>
        </Section>

        <footer className="border-t border-line">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-[12.5px] text-fg-muted">
            <div className="flex items-center gap-2"><Mark size={18} /><span className="text-fg">{site.name}</span><span className="text-fg-faint">· {site.license} · {site.author.url
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

function Nav() {
  return (
    <div className="sticky top-0 z-20 bg-field/80 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-4">
        <a href="#/" onClick={(e) => { e.preventDefault(); (e.currentTarget.closest('.overflow-y-auto') as HTMLElement)?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="flex items-center gap-2 rounded-[6px] text-[13.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-signal">
          <Mark /><span className="font-display text-[17px] font-extrabold lowercase tracking-[-0.035em]">{site.name}</span>
        </a>
        <nav className="flex items-center gap-0.5">
          {NAV.map((n) => (
            <button key={n.id} type="button" onClick={() => scrollToSection(n.id)}
              className="hidden h-8 rounded-[7px] px-2.5 text-[13px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal md:block">
              {n.label}
            </button>
          ))}
          <a href={links.repo} className="flex h-8 items-center gap-1 rounded-[7px] px-2.5 text-[13px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
            GitHub<ArrowUpRight size={12} strokeWidth={1.5} />
          </a>
          <ThemeButton />
        </nav>
      </Container>
    </div>
  )
}

function InstallSection() {
  const [tab, setTab] = useState<string>(installs[0].id)
  const cur = installs.find((i) => i.id === tab) ?? installs[0]
  return (
    <Section id="install">
      <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-16">
        <Heading kicker="Install" title="Two minutes, then ask for a tool."
          lede="Install the skill and your agent builds the harness the right way — surface, archetype, tokens, QA. Or take the kit on its own; it’s just source." />
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
