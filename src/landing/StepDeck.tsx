/* "How it works" as a pinned card deck (after trove.quest's "How a save becomes a
   reference"). The deck is tall; a sticky frame inside it holds a progress row
   and a stack of cards. Scroll position picks the active step; cards change on
   a timed transition, not scrubbed, so nothing jitters mid-scroll.
     behind the active card: 4% smaller and 14px lower per step
     finished cards: lift 48px, grow 2%, fade out
   The landing scrolls inside a div, not the window, so progress is measured
   against the nearest scrolling ancestor. Text stays in the DOM for every step,
   and reduced motion turns every animation into a cut. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Check, FileCode2, Paperclip, Upload } from 'lucide-react'
import { cn } from '@kit'
import { site } from '@/site.config'

export interface DeckStep { n: number; short: string; title: string; body: string }

const NAV_H = 56
const EASE = [0.22, 1, 0.36, 1] as const
/** the one asset that travels through all three steps */
const ART = ['#c06c84', '#ff9a76', '#ffd6a5', '#f76b8a']

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return null
}

export function StepDeck({ steps }: { steps: DeckStep[] }) {
  const deck = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const n = steps.length
  const active = Math.min(n - 1, Math.floor(progress * n))

  useEffect(() => {
    const el = deck.current!
    const scroller = scrollParent(el)
    const target: HTMLElement | Window = scroller ?? window
    let raf = 0
    const measure = () => {
      raf = 0
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      const viewport = (scroller ? scroller.clientHeight : innerHeight) - NAV_H
      const range = el.offsetHeight - viewport
      const past = top + NAV_H - el.getBoundingClientRect().top
      setProgress(range > 0 ? Math.min(1, Math.max(0, past / range)) : 0)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(measure) }
    measure()
    target.addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { target.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])

  const jump = (i: number) => {
    const el = deck.current!
    const scroller = scrollParent(el)
    const viewport = (scroller ? scroller.clientHeight : innerHeight) - NAV_H
    const range = el.offsetHeight - viewport
    const deckTop = scroller
      ? el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - NAV_H
      : el.getBoundingClientRect().top + scrollY - NAV_H
    const y = deckTop + ((i + 0.5) / n) * range
    ;(scroller ?? window).scrollTo({ top: y, behavior: 'smooth' })
  }

  return (
    <div ref={deck} className="[--deck-step:80svh] lg:[--deck-step:70svh]"
      style={{ height: `calc(100svh - ${NAV_H}px + ${n - 1} * var(--deck-step))` }}>
      <div className="sticky flex flex-col justify-center gap-4 lg:gap-5" style={{ top: NAV_H, height: `calc(100svh - ${NAV_H}px)` }}>
        {/* progress — each tab fills while its step is on screen; click to jump */}
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Steps">
          {steps.map((s, i) => {
            const fill = Math.min(1, Math.max(0, progress * n - i))
            return (
              <button key={s.n} type="button" role="tab" aria-selected={active === i} onClick={() => jump(i)}
                className="group relative flex h-8 items-end gap-2 rounded-[4px] pb-1 text-left text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-signal">
                <span className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-line" />
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left rounded-full bg-fg" style={{ transform: `scaleX(${fill})` }} />
                <span className="tabular text-fg-faint">{s.n}</span>
                <span className={cn('truncate transition-colors', active === i ? 'text-fg' : 'text-fg-muted group-hover:text-fg')}>{s.short}</span>
              </button>
            )
          })}
        </div>

        <div className="relative h-[calc(100svh-56px-112px)] max-h-[640px] min-h-[420px]">
          {steps.map((s, i) => {
            const d = i - active
            const past = d < 0
            return (
              <article key={s.n} aria-hidden={d !== 0} role="tabpanel"
                className="panel absolute inset-0 grid origin-bottom grid-rows-[auto_1fr] gap-5 overflow-hidden p-5 transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:grid-rows-1 lg:gap-8 lg:p-8"
                style={{
                  transform: past ? 'translateY(-48px) scale(1.02)' : `translateY(${d * 14}px) scale(${1 - d * 0.04})`,
                  opacity: past ? 0 : 1,
                  zIndex: past ? n + 1 : n - d,
                  pointerEvents: d === 0 ? 'auto' : 'none',
                }}>
                <div className="flex flex-col lg:justify-center">
                  <div className="tabular text-[13px] text-fg-faint">Step {s.n}</div>
                  <h3 className="mt-2 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance lg:mt-3 lg:text-[32px]">{s.title}</h3>
                  <p className="mt-3 max-w-[420px] text-[14px] leading-[1.6] text-pretty text-fg-muted lg:mt-4 lg:text-[15px]">{s.body}</p>
                </div>
                <div className="relative min-h-0 overflow-hidden rounded-[10px] bg-field shadow-[inset_0_0_0_1px_var(--line)]">
                  {i === 0 && <ChatVisual active={d === 0} />}
                  {i === 1 && <DropVisual active={d === 0} />}
                  {i === 2 && <ShellVisual active={d === 0} />}
                </div>
              </article>
            )
          })}
        </div>
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

function Gradient({ className, drift = true }: { className?: string; drift?: boolean }) {
  const reduce = useReducedMotion()
  const blob = (color: string, x: string, y: string, size: string, path: number[][]) => (
    <motion.div className="absolute rounded-full blur-[28px]" style={{ background: color, left: x, top: y, width: size, height: size }}
      animate={drift && !reduce ? { x: path.map((p) => p[0]), y: path.map((p) => p[1]) } : undefined}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
  )
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} style={{ background: ART[0] }}>
      {blob(ART[1], '-10%', '-20%', '70%', [[0, 0], [30, 20], [0, 0]])}
      {blob(ART[2], '45%', '30%', '60%', [[0, 0], [-40, -10], [0, 0]])}
      {blob(ART[3], '10%', '55%', '55%', [[0, 0], [20, -30], [0, 0]])}
    </div>
  )
}

function AgentMark() {
  return <span className="flex size-5 flex-none items-center justify-center rounded-[5px] bg-fg text-[10px] font-semibold text-field">A</span>
}

/* ── 1 · conversation ────────────────────────────────────────────────── */

function ChatVisual({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col p-4 text-[12.5px] leading-[1.5] sm:p-5">
      <div className="flex flex-1 flex-col justify-end gap-3.5">
        <Beat on={active} className="ml-auto max-w-[82%] rounded-[12px] rounded-br-[4px] bg-active px-3.5 py-2.5 text-fg">
          Make me a tool to tune the hero gradient: the colours, some grain, and how fast it drifts.
        </Beat>
        <Beat on={active} delay={0.5} className="flex max-w-[88%] gap-2.5">
          <AgentMark />
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-hover px-2 py-1 text-[11.5px] text-fg-muted">
              <span className="size-1.5 rounded-full bg-ok" />Using the {site.slug} skill
            </span>
            <span className="text-fg">I’ll set up a colour stack, a grain slider and a drift speed, with presets and a before/after view.</span>
          </div>
        </Beat>
        <Beat on={active} delay={1.1} className="ml-auto max-w-[70%] rounded-[12px] rounded-br-[4px] bg-active px-3.5 py-2.5 text-fg">
          Perfect. Keep the brand colours as presets.
        </Beat>
      </div>
      <div className="mt-4 flex h-10 items-center gap-2 rounded-[10px] bg-panel pr-1.5 pl-3 text-fg-faint shadow-[var(--shadow-cluster)]">
        <span className="flex-1 truncate">Reply…</span>
        <span className="flex size-7 items-center justify-center rounded-[7px] bg-fg text-field"><ArrowUp size={14} strokeWidth={2} /></span>
      </div>
    </div>
  )
}

/* ── 2 · drop in the asset ───────────────────────────────────────────── */

function DropVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const landed = active || !!reduce
  return (
    <div className="flex h-full flex-col gap-3 p-4 text-[12.5px] sm:p-5">
      <div className={cn('relative flex flex-1 items-center justify-center rounded-[10px] border border-dashed transition-colors duration-500',
        landed ? 'border-signal bg-signal-soft' : 'border-line-strong')}>
        <div className={cn('absolute top-3 left-3 flex items-center gap-1.5 text-[11.5px] transition-opacity duration-300', landed ? 'opacity-0' : 'text-fg-faint')}>
          <Upload size={13} strokeWidth={1.5} />Drop a file, paste a link, or name it
        </div>
        {/* the file card flies in from the corner */}
        <motion.div className="flex w-[min(260px,80%)] items-center gap-3 rounded-[10px] bg-panel p-2.5 shadow-[var(--shadow-pop)]"
          initial={false}
          animate={landed ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 } : { opacity: 0, x: 90, y: -70, rotate: 8, scale: 0.96 }}
          transition={landed && !reduce ? { duration: 0.7, ease: EASE, delay: 0.15 } : { duration: 0 }}>
          <div className="relative size-11 flex-none overflow-hidden rounded-[7px]"><Gradient drift={false} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate font-medium text-fg"><FileCode2 size={13} strokeWidth={1.5} className="flex-none text-fg-faint" />hero-gradient.html</div>
            <div className="text-[11.5px] text-fg-faint">Your existing page · 14 KB</div>
          </div>
        </motion.div>
      </div>
      <Beat on={active} delay={0.75} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-fg-muted"><Check size={13} strokeWidth={2} className="text-ok" />Connected, nothing rebuilt</span>
        {['Colours', 'Grain', 'Drift'].map((c) => <span key={c} className="rounded-[6px] bg-hover px-2 py-1 text-[11.5px] text-fg">{c}</span>)}
      </Beat>
      <div className="flex h-10 items-center gap-2 rounded-[10px] bg-panel pr-1.5 pl-3 shadow-[var(--shadow-cluster)]">
        <Paperclip size={13} strokeWidth={1.5} className="flex-none text-fg-faint" />
        <span className={cn('truncate transition-colors', landed ? 'text-fg' : 'text-fg-faint')}>{landed ? 'Here’s the page, keep it exactly as it is.' : 'Reply…'}</span>
        <span className="ml-auto flex size-7 flex-none items-center justify-center rounded-[7px] bg-fg text-field"><ArrowUp size={14} strokeWidth={2} /></span>
      </div>
    </div>
  )
}

/* ── 3 · rendered inside a shell ─────────────────────────────────────── */

function MiniSlider({ label, from, to, on, delay, unit = '' }: { label: string; from: number; to: number; on: boolean; delay: number; unit?: string }) {
  const reduce = useReducedMotion()
  const v = on || reduce ? to : from
  return (
    <div className="flex h-7 items-center gap-2">
      <span className="w-12 flex-none text-fg-muted">{label}</span>
      <div className="relative h-1 flex-1 rounded-full bg-track">
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-signal" initial={false} animate={{ width: `${v}%` }}
          transition={on && !reduce ? { duration: 0.9, ease: EASE, delay } : { duration: 0 }} />
      </div>
      <span className={cn('tabular w-9 flex-none text-right transition-colors duration-700', on ? 'text-fg' : 'text-fg-faint')}>{v}{unit}</span>
    </div>
  )
}

function ShellVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="flex h-full flex-col gap-2 p-2.5 text-[11.5px] sm:gap-2.5 sm:p-3">
      {/* toolbar */}
      <div className="flex h-8 flex-none items-center justify-between gap-2 rounded-[8px] bg-panel px-2.5 shadow-[var(--shadow-cluster)]">
        <div className="flex min-w-0 items-center gap-2"><span className="size-3.5 flex-none rounded-[4px] bg-fg" /><span className="truncate font-medium text-fg">Hero gradient</span></div>
        <span className="flex h-6 flex-none items-center rounded-[6px] bg-signal-strong px-2.5 font-medium text-signal-fg">Export</span>
      </div>
      <div className="flex min-h-0 flex-1 gap-2 sm:gap-2.5">
        {/* stage with the artboard */}
        <div className="relative flex min-w-0 flex-1 items-center justify-center rounded-[8px] bg-well">
          <motion.div className="relative aspect-[4/5] h-[78%] overflow-hidden rounded-[6px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
            initial={false} animate={active || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
            transition={active && !reduce ? { duration: 0.6, ease: EASE, delay: 0.1 } : { duration: 0 }}>
            <Gradient drift={active} />
            <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgb(0 0 0 / 0.9) 0.6px, transparent 0.6px)', backgroundSize: '3px 3px' }} />
          </motion.div>
        </div>
        {/* inspector */}
        <div className="hidden w-[44%] max-w-[210px] flex-none flex-col rounded-[8px] bg-panel p-2.5 shadow-[var(--shadow-cluster)] sm:flex">
          <div className="mb-1.5 font-medium text-fg">Gradient</div>
          <div className="flex h-7 items-center gap-2">
            <span className="w-12 flex-none text-fg-muted">Colours</span>
            <div className="flex gap-1">{ART.map((c) => <span key={c} className="size-4 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ background: c }} />)}</div>
          </div>
          <MiniSlider label="Grain" from={0} to={18} on={active} delay={0.6} />
          <MiniSlider label="Drift" from={50} to={72} on={active} delay={0.9} unit="%" />
          <div className="mt-auto flex gap-1">
            {['Brand', 'Calm', 'Loud'].map((p, i) => (
              <span key={p} className={cn('flex h-6 flex-1 items-center justify-center rounded-[5px]', i === 0 ? 'bg-active text-fg' : 'text-fg-faint')}>{p}</span>
            ))}
          </div>
        </div>
      </div>
      {/* timeline */}
      <div className="flex h-9 flex-none items-center gap-2 rounded-[8px] bg-panel px-2.5 shadow-[var(--shadow-cluster)]">
        <span className="tabular flex-none text-fg-faint">0:02</span>
        <div className="relative h-3 flex-1 rounded-[3px] bg-lane/40">
          <motion.div className="absolute inset-y-[-3px] w-px bg-rec" initial={false}
            animate={active && !reduce ? { left: ['8%', '92%'] } : { left: '40%' }}
            transition={active && !reduce ? { duration: 6, repeat: Infinity, ease: 'linear' } : { duration: 0 }} />
        </div>
      </div>
    </div>
  )
}
