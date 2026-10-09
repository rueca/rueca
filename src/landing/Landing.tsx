/* The landing page (#/). Everything brand-specific comes from site.config;
   everything visual from the kit's tokens, so both themes work unchanged. */
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Box, Code2, Frame, Smartphone } from 'lucide-react'
import { Button, Segmented, TipProvider, useTheme, cn } from '@kit'
import { site } from '@/site.config'
import type { Shell } from '@/gallery/registry'
import { Chip, CommandLine, Container, Heading, Mark, Rise, Section, ThemeButton, scrollToSection } from './parts'
import { LiveShell } from './LiveShell'
import { StepDeck } from './StepDeck'
import { ShellRail } from './ShellRail'
import { HERO_SHELLS, credits, environments, faq, installs, kitGroups, links, steps, surfaces } from './content'

const NAV = [
  { id: 'how', label: 'How it works' },
  { id: 'shells', label: 'Shells' },
  { id: 'kit', label: 'Kit' },
  { id: 'install', label: 'Install' },
  { id: 'faq', label: 'FAQ' },
]
const ENV_ICON = { canvas: Frame, three: Box, bridge: Code2, client: Smartphone } as const

export function Landing({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const byId = (id: string) => shells.find((s) => s.id === id)
  const heroShells = HERO_SHELLS.map(byId).filter((s): s is Shell => !!s).slice(0, 6)

  return (
    <TipProvider>
      <div className="h-full overflow-x-hidden overflow-y-auto bg-field text-fg [&_*]:scroll-mt-16">
        <Nav />

        {/* ── hero ─────────────────────────────────────────────── */}
        <Container className="pt-14 sm:pt-20">
          <div className="max-w-[760px]">
            <Rise><h1 className="text-[34px] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-[52px]">{site.tagline}</h1></Rise>
            <Rise delay={0.08}><p className="mt-5 max-w-[620px] text-[15.5px] leading-[1.6] text-pretty text-fg-muted sm:text-[17px]">{site.description}</p></Rise>
            <Rise delay={0.16} className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="lg" className="h-10 px-4 text-[13.5px]" onClick={() => scrollToSection('install')}>Install<ArrowRight size={14} strokeWidth={1.75} /></Button>
              <a href="#/shells" className="inline-flex h-10 items-center gap-1.5 rounded-[8px] px-4 text-[13.5px] font-medium text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
                Browse {shells.length} shells
              </a>
            </Rise>
            <Rise delay={0.24}><CommandLine text={installs[0].lines[0]} className="mt-6 max-w-[460px]" /></Rise>
          </div>
        </Container>
        {/* the preview breaks out of the text column — nearly full width, up to the tool's native 1440 */}
        <div className="mx-auto mt-12 w-full max-w-[1440px] px-3 sm:mt-16 sm:px-6">
          {heroShells.length > 0 && <LiveShell shells={heroShells} />}
        </div>

        {/* ── how it works ─────────────────────────────────────── */}
        <Section id="how">
          <Heading kicker="How it works" title="Ask for a tool, get a real one."
            lede={<>Install the skill, then ask your agent for a prototype, a playground or “a tool to tune this”. The tool stays neutral: <span className="text-fg">the brand lives inside the artboard, never around it.</span></>} />
          <div className="mt-8 lg:mt-10"><StepDeck steps={steps} /></div>
        </Section>

        {/* ── any environment ──────────────────────────────────── */}
        <Section id="anywhere" className="pt-0 sm:pt-0">
          <Heading kicker="Any environment" title="It wraps what you already have."
            lede="Whatever your prototype is made of, the same tool fits around it." />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {environments.map((e) => {
              const Icon = ENV_ICON[e.id as keyof typeof ENV_ICON]
              const demos = e.shells.map(byId).filter((s): s is Shell => !!s)
              return (
                <div key={e.id} className="panel flex min-w-0 flex-col gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-[7px] bg-active text-fg"><Icon size={14} strokeWidth={1.5} /></span>
                    <h3 className="text-[15px] font-semibold">{e.title}</h3>
                  </div>
                  <p className="text-[13px] leading-[1.6] text-fg-muted">{e.body}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-[12px]">
                    <div className="flex gap-3">
                      {demos.map((d) => (
                        <a key={d.id} href={`#/${d.id}${e.id === 'client' ? '?client' : ''}`} className="inline-flex items-center gap-1 text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
                          {d.name}<ArrowUpRight size={12} strokeWidth={1.5} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* ── shells ───────────────────────────────────────────── */}
        <ShellRail shells={shells} theme={theme} />

        {/* ── kit ──────────────────────────────────────────────── */}
        <Section id="kit">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Heading kicker="The kit" title="Components for the parts every tool repeats."
              lede="Source you own, installed through the shadcn CLI one group at a time, built on Base UI. Every control is keyboard-reachable and every drag has a typed alternative." />
            <a href={links.kitDocs} className="inline-flex items-center gap-1 text-[13px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">Kit guide<ArrowUpRight size={13} strokeWidth={1.5} /></a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kitGroups.map((g) => (
              <div key={g.title} className="panel flex flex-col gap-3 p-4 sm:p-5">
                <h3 className="text-[14px] font-semibold">{g.title}</h3>
                <p className="text-[12.5px] leading-[1.6] text-fg-muted">{g.body}</p>
                <div className="mt-auto flex flex-wrap gap-1 pt-1">{g.items.map((i) => <Chip key={i} className="font-mono text-[11px]">{i}</Chip>)}</div>
              </div>
            ))}
          </div>
          <Surfaces />
        </Section>

        {/* ── install ──────────────────────────────────────────── */}
        <InstallSection />

        {/* ── faq + credits ────────────────────────────────────── */}
        <Section id="faq">
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-16">
            <Heading kicker="FAQ" title="Fair questions." />
            <div className="flex flex-col">
              {faq.map((f, i) => (
                <details key={f.q} className={cn('group py-4', i > 0 && 'border-t border-line')} open={i === 0}>
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

        <Section id="credits" className="pt-0 sm:pt-0">
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:gap-16">
            <Heading kicker="Credits" title="Standing on good tools." />
            <div>
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                {credits.map((c) => (
                  <div key={c.title}>
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
            <div className="flex items-center gap-2"><Mark size={18} /><span className="text-fg">{site.name}</span><span className="text-fg-faint">· {site.license} · {site.author.name}</span></div>
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
          <Mark />{site.name}
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

/** The four control surfaces, live — they flip with the theme toggle. */
function Surfaces() {
  return (
    <div className="panel mt-4 grid gap-6 p-4 sm:p-5 lg:grid-cols-[280px_1fr]">
      <div>
        <h3 className="text-[14px] font-semibold">Four control surfaces</h3>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-fg-muted">
          Conflating any two makes a state vanish. In dark there is no room below the panel, so the slider groove goes
          lighter; in light the active pill is white, so a toggle on a white panel needs grey. Every pair is contrast-audited in both themes.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {surfaces.map((s) => (
          <div key={s.token} className="flex flex-col gap-2">
            <div className="flex h-16 items-center justify-center rounded-[9px] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
              {s.token === 'well' && <div className="flex w-[78%] gap-0.5 rounded-[7px] bg-well p-[2px]"><div className="h-5 flex-1 rounded-[5px] bg-raised shadow-[var(--shadow-segment)]" /><div className="h-5 flex-1" /><div className="h-5 flex-1" /></div>}
              {s.token === 'track' && <div className="relative h-1 w-[78%] rounded-full bg-track"><div className="absolute inset-y-0 left-0 w-[45%] rounded-full bg-signal" /></div>}
              {s.token === 'raised' && <div className="flex w-[78%] gap-0.5 rounded-[7px] bg-well p-[2px]"><div className="h-5 flex-1" /><div className="h-5 flex-1 rounded-[5px] bg-raised shadow-[var(--shadow-segment)]" /><div className="h-5 flex-1" /></div>}
              {s.token === 'active' && <div className="flex gap-1"><div className="size-7 rounded-[6px] bg-active" /><div className="size-7 rounded-[6px]" /></div>}
            </div>
            <div>
              <code className="font-mono text-[11.5px] text-fg">--{s.token}</code>
              <div className="mt-0.5 text-[11.5px] leading-snug text-fg-faint">{s.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InstallSection() {
  const [tab, setTab] = useState<string>(installs[0].id)
  const cur = installs.find((i) => i.id === tab) ?? installs[0]
  return (
    <Section id="install">
      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <Heading kicker="Install" title="Two minutes, then ask for a tool."
          lede="Install the skill and your agent builds the harness the right way — surface, archetype, tokens, QA. Or take the kit on its own; it’s just source." />
        <div className="panel flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <Segmented value={tab} onChange={setTab} label="Install method" options={installs.map((i) => ({ value: i.id, label: i.label }))} />
          <div>
            <h3 className="text-[14px] font-semibold">{cur.title}</h3>
            <div className="mt-3 flex flex-col gap-1.5">{cur.lines.map((l) => <CommandLine key={l} text={l} />)}</div>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-fg-muted">{cur.note}</p>
          </div>
        </div>
      </div>
    </Section>
  )
}
