/* "How it works", after lovable.dev's "For building and beyond".
   Desktop: the section heading and an accordion of the steps sit in a pinned
   left column; one large visual per step scrolls past normally on the right.
   Whichever visual crosses the middle of the screen opens its step (scroll-spy),
   and clicking a step brings its visual into view. Nothing is scroll-jacked.
   Below laptop width, or on a short screen, it is a plain stack of
   title, text and visual (as Lovable does). The landing scrolls inside a div,
   so everything is measured against the nearest scrolling ancestor. Each
   visual plays its little animation once, as it scrolls into view; reduced
   motion turns those into cuts. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Check, FileCode2, Upload } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { site } from '@/site.config'
import { Cursor, DotGrid, focal, ghost } from './KitThumbs'
import { DYES, Scaffold, Swatches, Threads } from './brandArt'

export interface DeckStep { n: number; short: string; title: string; body: string }

const NAV_H = 56
const EASE = [0.22, 1, 0.36, 1] as const

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return null
}

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatch(m.matches)
    on(); m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** true once the element is mostly on screen — plays a phone card's visual when it arrives */
function useArrived<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.45 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return [ref, seen] as const
}

function Visual({ i, active }: { i: number; active: boolean }) {
  return i === 0 ? <ChatVisual active={active} /> : i === 1 ? <DropVisual active={active} /> : <ShellVisual active={active} />
}

/* Phones: no pinning. Each step is a plain card — text, then its visual,
   which plays when the card scrolls into view (Granola, Framer do the same). */
function StackedSteps({ steps }: { steps: DeckStep[] }) {
  return <div className="flex flex-col gap-4">{steps.map((s, i) => <StackedCard key={s.n} step={s} i={i} />)}</div>
}

function StackedCard({ step: s, i }: { step: DeckStep; i: number }) {
  const [ref, seen] = useArrived<HTMLElement>()
  return (
    <article ref={ref} className="panel flex flex-col gap-5 p-5">
      <div>
        <div className="tabular text-[13px] text-fg-faint">Step {s.n}</div>
        <h3 className="mt-2 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">{s.title}</h3>
        <p className="mt-3 text-[14px] leading-[1.6] text-pretty text-fg-muted">{s.body}</p>
      </div>
      <div className="relative h-[470px] overflow-hidden rounded-[10px] bg-field shadow-[inset_0_0_0_1px_var(--line)]">
        <Visual i={i} active={seen} />
      </div>
    </article>
  )
}

export function StepDeck({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  // Lovable only pins at lg and up, and only when the screen is tall enough to hold the column
  const stacked = useMedia('(max-width: 1023px), (max-height: 739px)')
  return stacked
    ? <div>{head}<div className="mt-8"><StackedSteps steps={steps} /></div></div>
    : <FollowAlong steps={steps} head={head} />
}

/** A pinned frame that hugs its content and sits centred below the nav while
    pinned, so a pinned section adds no empty space. Shared with the shell rail. */
export function usePinFrame(frame: React.RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ frameH: 0, vh: 0 })
  useLayoutEffect(() => {
    const f = frame.current!
    const scroller = scrollParent(f)
    const m = () => setBox({ frameH: f.offsetHeight, vh: scroller ? scroller.clientHeight : innerHeight })
    m()
    const ro = new ResizeObserver(m); ro.observe(f); if (scroller) ro.observe(scroller)
    addEventListener('resize', m)
    return () => { ro.disconnect(); removeEventListener('resize', m) }
  }, [frame])
  const top = Math.max(NAV_H + 16, NAV_H + (box.vh - NAV_H - box.frameH) / 2)
  return { ...box, top }
}

function FollowAlong({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  const column = useRef<HTMLDivElement>(null)
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const { top } = usePinFrame(column)
  const [active, setActive] = useState(0)

  // scroll-spy: the visual crossing the middle band of the screen is the active step
  useEffect(() => {
    const els = panels.current.filter(Boolean) as HTMLDivElement[]
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLDivElement))
    }, { root: scrollParent(els[0]), rootMargin: '-45% 0px -45% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [steps.length])

  // clicking a step centres its visual
  const show = (i: number) => {
    const el = panels.current[i]
    if (!el) return
    const scroller = scrollParent(el)
    const r = el.getBoundingClientRect()
    if (!scroller) { scrollTo({ top: r.top + scrollY - (innerHeight - r.height) / 2, behavior: 'smooth' }); return }
    const sr = scroller.getBoundingClientRect()
    scroller.scrollTo({ top: scroller.scrollTop + r.top - sr.top - (scroller.clientHeight - r.height) / 2, behavior: 'smooth' })
  }

  return (
    <div className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-12 xl:gap-16">
      <div className="relative">
        <div ref={column} className="sticky flex flex-col gap-10" style={{ top }}>
          {head}
          <div data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties} className="flex flex-col">
            {steps.map((s, i) => {
              const on = active === i
              return (
                <div key={s.n} className="relative border-l border-line pl-5">
                  {/* the active step's marker, in the site accent */}
                  <span className={cn('absolute top-0 -left-px w-px bg-signal transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', on ? 'h-full' : 'h-0')} />
                  <h3>
                    <button type="button" aria-expanded={on} onClick={() => show(i)}
                      className={cn('flex w-full items-baseline gap-3 rounded-[4px] py-3 text-left text-[17px] font-semibold tracking-[-0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
                        on ? 'text-fg' : 'text-fg-faint hover:text-fg-muted')}>
                      <span className="tabular text-[13px] font-medium text-fg-faint">{s.n}</span>{s.title}
                    </button>
                  </h3>
                  {/* expands with a grid-rows transition, so the height animates without measuring */}
                  <div role="region" className={cn('grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <p className="overflow-hidden pl-[26px] text-[14.5px] leading-[1.6] text-pretty text-fg-muted">
                      <span className="block pb-4">{s.body}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-24">
        {steps.map((s, i) => <Panel key={s.n} i={i} title={s.title} focused={active === i} refFn={(el) => { panels.current[i] = el }} />)}
      </div>
    </div>
  )
}

/** One visual on the right. It plays when it scrolls into view and then stays
    finished, so every visual reads complete as you scroll past (as Lovable's do).
    Only the active step's visual is in focus; the others fade back so they never
    blend into each other. */
function Panel({ i, title, focused, refFn }: { i: number; title: string; focused: boolean; refFn: (el: HTMLDivElement | null) => void }) {
  const [ref, seen] = useArrived<HTMLDivElement>()
  return (
    // outer: the scroll-in reveal · inner: the focus fade (both touch opacity, so they can't share an element)
    <div ref={(el) => { ref.current = el; refFn(el) }} data-reveal aria-label={title} role="img">
      <div className={cn('relative aspect-[16/11] overflow-hidden rounded-[12px] bg-field shadow-[inset_0_0_0_1px_var(--line)] transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        focused ? 'opacity-100' : 'scale-[0.98] opacity-30')}>
        <Visual i={i} active={seen} />
      </div>
    </div>
  )
}

/* ── shared bits ─────────────────────────────────────────────────────── */

/** Appears in sequence when its card becomes active; snaps back when it leaves. */
function Beat({ on, delay = 0, children, className, from = 8 }: { on: boolean; delay?: number; children: ReactNode; className?: string; from?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className}
      initial={false}
      animate={on || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: from }}
      transition={on && !reduce ? { duration: 0.45, ease: EASE, delay } : { duration: 0 }}>
      {children}
    </motion.div>
  )
}

function AgentMark() {
  return <span className="flex size-5 flex-none items-center justify-center rounded-[6px] bg-fg text-[10px] font-semibold text-field">A</span>
}

/* The three visuals follow the Kit thumbnails' approach (KitThumbs.tsx): one crisp
   focal card with real labels, faded context behind it, a dot grid that fades to the
   edges, and a cursor where something is being done. They show the product, so the
   tool in step 3 stays in neutral kit chrome (landing.css .preview); the agent
   session and the files in steps 1–2 aren't the product, so they wear the
   page's own warm surfaces and type. Rueca brand on top: the artwork is
   flat dyed threads (no gradients, no glow), the panel carries the drawn scaffold. */


/* ── 1 · conversation ────────────────────────────────────────────────── */

function ChatVisual({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-full items-center justify-center p-5 text-[12px] leading-[1.45] sm:p-8">
      <DotGrid size={14} />
      <Scaffold inset={12} />
      {/* context: the project the agent is working in */}
      <div className={cn(ghost, 'absolute top-[12%] left-[6%] hidden h-[62%] w-[26%] flex-col gap-2 p-3 lg:flex')}>
        <span className="text-[10.5px] text-fg-faint">launch-site</span>
        {['index.html', 'hero-threads.html', 'styles.css', 'assets'].map((f, i) => (
          <span key={f} className={cn('truncate text-[10.5px]', i === 1 ? 'text-fg-muted' : 'text-fg-faint')}>{f}</span>
        ))}
      </div>
      {/* focal: the session */}
      <div className={cn(focal, 'relative flex w-full max-w-[400px] flex-col gap-3 p-3.5 lg:ml-[20%]')}>
        <div className="flex items-center justify-between border-b border-line pb-2.5 text-[11px] text-fg-faint">
          <span className="flex items-center gap-2"><AgentMark /><span className="text-fg-muted">New session</span></span>
          <span className="font-code hidden text-[10.5px] sm:inline">~/projects/launch-site</span>
        </div>
        <Beat on={active} className="ml-auto max-w-[86%] rounded-[12px] rounded-br-[4px] bg-control px-3 py-2 text-fg">
          Make me a tool to tune the hero threads: the colours, some grain, and how fast they drift.
        </Beat>
        <Beat on={active} delay={0.5} className="flex gap-2.5">
          <AgentMark />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-hover px-2 py-0.5 text-[11px] text-fg-muted">
              <span className="size-1.5 rounded-full" style={{ background: DYES.hoja }} />Using the {site.slug} skill
            </span>
            <div className="rounded-[8px] bg-control/70 p-2 shadow-[inset_0_0_0_1px_var(--line)]">
              {['Colour stack', 'Grain slider', 'Drift speed'].map((t, i) => (
                <Beat key={t} on={active} delay={0.8 + i * 0.18} from={4} className="flex items-center gap-2 py-0.5 text-[11.5px] text-fg">
                  <span className="flex size-3.5 items-center justify-center rounded-full text-[#231B16]" style={{ background: DYES.hoja }}><Check size={9} strokeWidth={3} /></span>{t}
                </Beat>
              ))}
              <div className="mt-1 text-[10.5px] text-fg-faint">+ presets, before/after, share link</div>
            </div>
          </div>
        </Beat>
        <Beat on={active} delay={1.5} className="ml-auto max-w-[80%] rounded-[12px] rounded-br-[4px] bg-control px-3 py-2 text-fg">
          Perfect. Keep the brand colours as presets.
        </Beat>
        <div className="relative flex h-9 items-center gap-2 rounded-[10px] bg-control pr-1 pl-3 text-fg-faint shadow-[inset_0_0_0_1px_var(--line)]">
          <span className="flex-1 truncate">Reply…</span>
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-fg text-field"><ArrowUp size={13} strokeWidth={2} /></span>
          <Beat on={active} delay={1.9} from={6} className="absolute right-1 bottom-0"><Cursor big color="#EE7A68" name="You" className="static" /></Beat>
        </div>
      </div>
    </div>
  )
}

/* ── 2 · drop in the asset ───────────────────────────────────────────── */

function DropVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const landed = active || !!reduce
  return (
    <div className="relative flex h-full items-center justify-center p-5 text-[12px] sm:p-8">
      <DotGrid size={14} />
      <Scaffold inset={12} />
      {/* context: the file window the asset comes from */}
      <div className={cn(ghost, 'absolute top-[14%] left-[6%] hidden w-[34%] flex-col p-2 lg:flex')}>
        <div className="flex items-center gap-1 px-1 pb-2">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-fg/15" />)}<span className="ml-2 text-[10.5px] text-fg-faint">launch-site</span></div>
        {['index.html', 'hero-threads.html', 'styles.css', 'assets'].map((f, i) => (
          <span key={f} className={cn('flex items-center gap-2 rounded-[5px] px-1.5 py-1 text-[11px]', i === 1 ? 'bg-hover text-fg-muted' : 'text-fg-faint')}>
            <FileCode2 size={11} strokeWidth={1.5} className="flex-none" />{f}
          </span>
        ))}
      </div>
      {/* focal: the session's drop zone */}
      <div className={cn(focal, 'relative flex w-full max-w-[360px] flex-col gap-3 p-3.5 lg:ml-[26%]')}>
        <div className="flex items-center gap-2 text-[11px] text-fg-muted"><AgentMark />Attach to session</div>
        <div className={cn('relative flex h-[120px] items-center justify-center rounded-[10px] border border-dashed transition-colors duration-500', landed ? 'border-fg/40 bg-hover' : 'border-line-strong')}>
          <span className={cn('absolute top-2.5 left-3 flex items-center gap-1.5 text-[11px] text-fg-faint transition-opacity duration-300', landed && 'opacity-0')}>
            <Upload size={12} strokeWidth={1.5} />Drop a file, paste a link, or name it
          </span>
          {/* the file, dragged in from the window on the left with the cursor on it */}
          <motion.div className={cn(focal, 'relative flex w-[min(250px,86%)] items-center gap-3 p-2.5')}
            initial={false}
            animate={landed ? { opacity: 1, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: -150, y: -40, rotate: -6 }}
            transition={landed && !reduce ? { duration: 0.8, ease: EASE, delay: 0.15 } : { duration: 0 }}>
            <span className="relative size-10 flex-none overflow-hidden rounded-[7px] shadow-[0_0_0_1px_var(--line)]"><Threads /></span>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-fg">hero-threads.html</div>
              <div className="text-[11px] text-fg-faint">Your existing page · 14 KB</div>
            </div>
            <Cursor big color={DYES.cielo} name="You" className="right-6 bottom-1" />
          </motion.div>
        </div>
        <Beat on={active} delay={0.95} className={cn(focal, 'flex flex-col gap-2 p-2.5 shadow-[0_0_0_1px_var(--line)]')}>
          <span className="flex items-center gap-1.5 text-[11.5px] text-fg"><span className="flex size-3.5 items-center justify-center rounded-full text-[#231B16]" style={{ background: DYES.hoja }}><Check size={9} strokeWidth={3} /></span>Connected, nothing rebuilt</span>
          <div className="flex flex-wrap gap-1">{['Colours', 'Grain', 'Drift'].map((c) => <span key={c} className="rounded-[6px] bg-hover px-2 py-0.5 text-[11px] text-fg">{c}</span>)}</div>
        </Beat>
      </div>
    </div>
  )
}

/* ── 3 · rendered inside a shell ─────────────────────────────────────── */

function ShellVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const grain = active || reduce ? 32 : 10 // ends short so the "You" tag lands in the empty middle of the Drift row, clear of its value
  return (
    <div className="relative flex h-full items-center justify-center p-4 text-[11px] sm:p-6">
      <DotGrid size={14} />
      <Scaffold inset={12} />
      {/* context: another window behind, for depth */}
      <div className={cn(ghost, 'preview absolute top-[8%] left-[10%] h-[70%] w-[72%]')} />
      {/* focal: the tool */}
      <div className={cn(focal, 'preview relative flex h-full max-h-[340px] w-full max-w-[540px] flex-col gap-2 p-2')}>
        <div className="flex h-7 flex-none items-center justify-between px-1.5">
          <div className="flex min-w-0 items-center gap-2"><span className="size-3 flex-none rounded-[3px] bg-fg" /><span className="truncate font-medium text-fg">Hero threads</span></div>
          <span className="flex h-6 flex-none items-center rounded-[6px] bg-signal-strong px-2.5 font-medium text-signal-fg">Export</span>
        </div>
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[8px] bg-well">
            <motion.div className="relative aspect-[4/5] h-[80%] overflow-hidden rounded-[6px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
              initial={false} animate={active || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
              transition={active && !reduce ? { duration: 0.6, ease: EASE, delay: 0.1 } : { duration: 0 }}>
              <motion.div className="absolute inset-0" initial={false} animate={active && !reduce ? { x: [0, -8, 0] } : { x: 0 }}
                transition={active && !reduce ? { duration: 7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}><Threads /></motion.div>
            </motion.div>
          </div>
          <div className="hidden w-[42%] max-w-[200px] flex-none flex-col gap-2 rounded-[8px] bg-control/50 p-2.5 shadow-[inset_0_0_0_1px_var(--line)] sm:flex">
            <span className="font-medium text-fg">Threads</span>
            <div className="flex items-center gap-2"><span className="w-11 flex-none text-fg-muted">Colours</span><Swatches className="flex-1 justify-end" /></div>
            <div className="flex items-center gap-2">
              <span className="w-11 flex-none text-fg-muted">Grain</span>
              <div className="relative h-4 flex-1 rounded-[4px] bg-track/70">
                <motion.span className="absolute inset-y-0 left-0 flex items-center justify-end rounded-[4px] bg-signal pr-1" initial={false} animate={{ width: `${grain}%` }}
                  transition={active && !reduce ? { duration: 1, ease: EASE, delay: 0.6 } : { duration: 0 }}>
                  <span className="tabular text-[9px] leading-none font-medium text-signal-fg">18</span>
                </motion.span>
                <motion.span className="absolute top-[55%]" initial={false} animate={{ left: `${grain}%` }}
                  transition={active && !reduce ? { duration: 1, ease: EASE, delay: 0.6 } : { duration: 0 }}><Cursor big color={DYES.achiote} name="You" className="static" /></motion.span>
              </div>
            </div>
            <div className="flex items-center gap-2"><span className="w-11 flex-none text-fg-muted">Drift</span><span className="flex h-4 flex-1 items-center justify-between rounded-[4px] bg-control px-1.5"><span className="text-fg-faint">↔</span><span className="tabular text-fg">0.72</span></span></div>
            <div className="flex items-center gap-2"><span className="w-11 flex-none text-fg-muted">Loop</span><span className="ml-auto flex h-3.5 w-6 items-center rounded-full bg-signal p-0.5"><span className="ml-auto size-2.5 rounded-full bg-signal-fg" /></span></div>
            <div className="mt-auto flex gap-1">{['Brand', 'Calm', 'Loud'].map((n, i) => <span key={n} className={cn('flex h-5 flex-1 items-center justify-center rounded-[5px] text-[10px]', i === 0 ? 'bg-panel text-fg shadow-[0_0_0_1px_var(--line-strong)]' : 'text-fg-faint')}>{n}</span>)}</div>
          </div>
        </div>
        <div className="flex h-7 flex-none items-center gap-2 px-1.5">
          <span className="tabular flex-none text-fg-faint">0:02</span>
          <div className="relative h-2.5 flex-1">
            <span className="absolute inset-y-[3px] left-[4%] w-[44%] rounded-full bg-lane" />
            <span className="absolute inset-y-[3px] left-[52%] w-[40%] rounded-full bg-lane" />
            {[0.04, 0.48, 0.52, 0.92].map((x) => <span key={x} className="absolute top-1/2 size-[7px] -translate-1/2 rotate-45 rounded-[1.5px] bg-fg/50" style={{ left: `${x * 100}%` }} />)}
            <motion.span className="absolute inset-y-[-4px] w-px bg-rec" initial={false}
              animate={active && !reduce ? { left: ['8%', '92%'] } : { left: '40%' }}
              transition={active && !reduce ? { duration: 6, repeat: Infinity, ease: 'linear' } : { duration: 0 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
