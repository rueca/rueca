/* "How it works" as a pinned card deck, after joinodin.com's stacked cards.
   One compact card at the front; the others wait behind it, each 60px lower
   and ~3% smaller, so their edges peek out underneath. When a step ends the
   front card moves to the back of the stack (the order rotates, nothing flies
   away). Scroll position picks the step; cards move on a timed transition, not
   scrubbed. Under the deck: step labels and pill progress bars that fill
   through each step — click either to jump.
   Each card is half words, half a bright blurred field with small white UI
   cards floating on it (the "screen" being shown, so it stays light in both
   themes). Phones get plain stacked cards instead of the pinned deck. The
   landing scrolls inside a div, so progress is measured against the nearest
   scrolling ancestor. Reduced motion turns every animation into a cut. */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Check, FileCode2, Paperclip } from 'lucide-react'
import { cn } from '@kit'
import { site } from '@/site.config'

export interface DeckStep { n: number; short: string; title: string; body: string; tags?: readonly string[] }

const NAV_H = 56
const EASE = [0.22, 1, 0.36, 1] as const
/** the one asset that travels through all three steps */
const ART = ['#c06c84', '#ff9a76', '#ffd6a5', '#f76b8a']
/** each card's backdrop — artwork, not chrome */
const FIELDS = [
  ['#e9782f', '#9dbb3c', '#f3a64a', '#5e8f3a'],
  ['#e8678f', '#f59fb7', '#f0855c', '#c94f7c'],
  ['#4f9a5a', '#a8cf5b', '#2f7d6b', '#d7e38a'],
]
/** the floating UI cards use the light theme in both themes */
const LIGHT = {
  '--field': '#ececec', '--panel': '#ffffff', '--overlay': '#ffffff', '--well': '#dedede', '--track': '#d9d9d9',
  '--raised': '#ffffff', '--active': '#e9e9e9', '--control': '#f2f2f2', '--fg': '#1a1a1a', '--fg-muted': '#5e5e5e',
  '--fg-faint': '#7e7e7e', '--line': 'rgba(0,0,0,0.08)', '--line-strong': 'rgba(0,0,0,0.16)', '--hover': 'rgba(0,0,0,0.045)',
  '--signal': '#0b84e0', '--signal-strong': '#0a6fc0', '--signal-fg': '#ffffff', '--ok': '#1fa971', '--rec': '#e5383b',
  '--lane': '#c6c6c6', '--shadow-artboard': '0 20px 60px -18px rgba(0,0,0,0.3)', '--artboard-ring': 'rgba(0,0,0,0.08)',
  colorScheme: 'light',
} as CSSProperties
/** stack geometry, from Odin: each waiting card 60px lower and 2.8% smaller */
const PEEK = 60
const SHRINK = 0.028
const CARD_H = `min(480px, 100svh - ${NAV_H}px - 220px)`

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

export function StepDeck({ steps }: { steps: DeckStep[] }) {
  const phone = useMedia('(max-width: 767px)')
  return phone ? <StackedSteps steps={steps} /> : <PinnedDeck steps={steps} />
}

/* ── the card ────────────────────────────────────────────────────────── */

/** Dark on the light page (as Odin), a lifted panel on the dark page. Words left, field right. */
function StepCard({ step: s, i, active, waiting = 0, className, style }: { step: DeckStep; i: number; active: boolean; waiting?: number; className?: string; style?: CSSProperties }) {
  return (
    <article className={cn('grid overflow-hidden rounded-[36px] text-white shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)] md:grid-cols-2 md:rounded-[56px]',
      waiting === 0 ? 'bg-[#16171a] dark:bg-[#232327]' : waiting === 1 ? 'bg-[#26272d] dark:bg-[#2e2e33]' : 'bg-[#383843] dark:bg-[#38383e]', className)} style={style}>
      <div className={cn('flex flex-col justify-center p-7 transition-opacity duration-500 md:p-12 lg:pl-14', waiting && 'opacity-0')}>
        <div className="text-[11px] font-medium tracking-[0.14em] text-white/50 uppercase">Step {s.n} · {s.short}</div>
        <h3 className="mt-4 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance lg:text-[30px]">{s.title}</h3>
        <p className="mt-3 max-w-[400px] text-[14px] leading-[1.6] text-pretty text-white/60 lg:text-[15px]">{s.body}</p>
        {s.tags && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {s.tags.map((t) => <span key={t} className="rounded-full px-3 py-1 text-[12px] text-white/75 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">{t}</span>)}
          </div>
        )}
      </div>
      <div className={cn('relative min-h-[320px] p-2.5 transition-opacity duration-500 md:min-h-0 md:p-3', waiting && 'opacity-0')}>
        <div className="relative h-full overflow-hidden rounded-[28px] md:rounded-[46px]" style={LIGHT}>
          <Field colors={FIELDS[i % FIELDS.length]} drift={active} />
          <div className="relative flex h-full items-center justify-center p-6">
            {i === 0 ? <ChatVisual active={active} /> : i === 1 ? <DropVisual active={active} /> : <ShellVisual active={active} />}
          </div>
        </div>
      </div>
    </article>
  )
}

/* ── desktop: pinned stack ───────────────────────────────────────────── */

function PinnedDeck({ steps }: { steps: DeckStep[] }) {
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
    ;(scroller ?? window).scrollTo({ top: deckTop + ((i + 0.5) / n) * range, behavior: 'smooth' })
  }

  return (
    <div ref={deck} className="[--deck-step:75svh]" style={{ height: `calc(100svh - ${NAV_H}px + ${n - 1} * var(--deck-step))` }}>
      <div className="sticky flex flex-col items-center justify-center gap-9" style={{ top: NAV_H, height: `calc(100svh - ${NAV_H}px)` }}>
        <div className="relative w-full max-w-[1000px]" style={{ height: `calc(${CARD_H} + ${PEEK * (n - 1)}px)` }}>
          {steps.map((s, i) => {
            const rel = (i - active + n) % n // 0 = front, then each card further back
            return (
              <StepCard key={s.n} step={s} i={i} active={rel === 0} waiting={rel}
                className="absolute inset-x-0 top-0 origin-top transition-[transform,background-color] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  height: CARD_H,
                  transform: `translateY(${rel * PEEK}px) scale(${1 - rel * SHRINK})`,
                  zIndex: n - rel,
                  pointerEvents: rel ? 'none' : 'auto',
                }} />
            )
          })}
        </div>

        {/* labels + pills — each pill fills through its step; click either to jump */}
        <div className="flex items-center gap-10" role="tablist" aria-label="Steps">
          <div className="flex items-center gap-5">
            {steps.map((s, i) => (
              <button key={s.n} type="button" role="tab" aria-selected={active === i} onClick={() => jump(i)}
                className={cn('rounded-[4px] text-[11px] font-medium tracking-[0.14em] uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
                  active === i ? 'text-fg' : 'text-fg-faint hover:text-fg-muted')}>
                {s.short}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5" aria-hidden>
            {steps.map((s, i) => {
              const fill = Math.min(1, Math.max(0, progress * n - i))
              return (
                <button key={s.n} type="button" tabIndex={-1} onClick={() => jump(i)} className="relative h-3 w-10 overflow-hidden rounded-full bg-fg/15">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-fg" style={{ width: `${Math.max(fill * 100, 30)}%`, opacity: fill > 0 ? 1 : 0 }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── phones: plain stacked cards ─────────────────────────────────────── */

function StackedSteps({ steps }: { steps: DeckStep[] }) {
  return <div className="flex flex-col gap-4">{steps.map((s, i) => <StackedCard key={s.n} step={s} i={i} />)}</div>
}

function StackedCard({ step, i }: { step: DeckStep; i: number }) {
  const [ref, seen] = useArrived<HTMLDivElement>()
  return <div ref={ref}><StepCard step={step} i={i} active={seen} /></div>
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

/** Soft drifting blobs — the card backdrops and the travelling artwork. */
function Field({ colors, className, drift = true, blur = 42 }: { colors: string[]; className?: string; drift?: boolean; blur?: number }) {
  const reduce = useReducedMotion()
  const blob = (color: string, x: string, y: string, size: string, path: number[][]) => (
    <motion.div className="absolute rounded-full" style={{ background: color, left: x, top: y, width: size, height: size, filter: `blur(${blur}px)` }}
      animate={drift && !reduce ? { x: path.map((p) => p[0]), y: path.map((p) => p[1]) } : undefined}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
  )
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} style={{ background: colors[0] }}>
      {blob(colors[1], '-10%', '-20%', '70%', [[0, 0], [30, 20], [0, 0]])}
      {blob(colors[2], '45%', '30%', '60%', [[0, 0], [-40, -10], [0, 0]])}
      {blob(colors[3], '10%', '55%', '55%', [[0, 0], [20, -30], [0, 0]])}
    </div>
  )
}

/** a white UI card floating on the field */
const FLOAT = 'rounded-[16px] bg-panel shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35),0_0_0_1px_rgb(0_0_0/0.04)]'

function AgentMark() {
  return <span className="flex size-5 flex-none items-center justify-center rounded-[6px] bg-fg text-[10px] font-semibold text-panel">A</span>
}

/* ── 1 · conversation ────────────────────────────────────────────────── */

function ChatVisual({ active }: { active: boolean }) {
  return (
    <div className={cn(FLOAT, 'flex w-full max-w-[330px] flex-col gap-3 p-3.5 text-[12px] leading-[1.45] text-fg')}>
      <Beat on={active} className="ml-auto max-w-[85%] rounded-[12px] rounded-br-[4px] bg-active px-3 py-2">
        Make me a tool to tune the hero gradient: colours, grain, and how fast it drifts.
      </Beat>
      <Beat on={active} delay={0.5} className="flex gap-2">
        <AgentMark />
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-hover px-2 py-0.5 text-[11px] text-fg-muted">
            <span className="size-1.5 rounded-full bg-ok" />Using the {site.slug} skill
          </span>
          <span>I’ll set up a colour stack, a grain slider and a drift speed, with presets and a before/after.</span>
        </div>
      </Beat>
      <div className="mt-1 flex h-9 items-center gap-2 rounded-[10px] bg-control pr-1 pl-3 text-fg-faint">
        <span className="flex-1 truncate">Reply…</span>
        <span className="flex size-7 items-center justify-center rounded-[8px] bg-fg text-panel"><ArrowUp size={13} strokeWidth={2} /></span>
      </div>
    </div>
  )
}

/* ── 2 · drop in the asset ───────────────────────────────────────────── */

function DropVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  const landed = active || !!reduce
  return (
    <div className="flex w-full max-w-[300px] flex-col items-stretch text-[12px] text-fg">
      {/* the file flies in */}
      <motion.div className={cn(FLOAT, 'flex items-center gap-3 p-2.5')}
        initial={false}
        animate={landed ? { opacity: 1, x: 0, y: 0, rotate: 0 } : { opacity: 0, x: 80, y: -60, rotate: 8 }}
        transition={landed && !reduce ? { duration: 0.7, ease: EASE, delay: 0.15 } : { duration: 0 }}>
        <div className="relative size-10 flex-none overflow-hidden rounded-[8px]"><Field colors={ART} drift={false} blur={6} /></div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate font-medium"><FileCode2 size={12} strokeWidth={1.5} className="flex-none text-fg-faint" />hero-gradient.html</div>
          <div className="text-[11px] text-fg-faint">Your existing page · 14 KB</div>
        </div>
      </motion.div>
      {/* connector, then what the agent found */}
      <Beat on={active} delay={0.7} className="flex flex-col items-center">
        <span className="h-4 w-px bg-white/80" />
        <div className={cn(FLOAT, 'w-full p-3')}>
          <div className="flex items-center gap-1.5 text-fg-muted"><Check size={13} strokeWidth={2} className="text-ok" />Connected, nothing rebuilt</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {['Colours', 'Grain', 'Drift'].map((c) => <span key={c} className="rounded-[6px] bg-hover px-2 py-0.5 text-[11px]">{c}</span>)}
          </div>
        </div>
      </Beat>
      <Beat on={active} delay={1.05} className="flex flex-col items-center">
        <span className="h-4 w-px bg-white/80" />
        <div className={cn(FLOAT, 'flex h-9 w-full items-center gap-2 px-3 text-fg-muted')}>
          <Paperclip size={12} strokeWidth={1.5} className="flex-none text-fg-faint" />
          <span className="truncate">Keep it exactly as it is.</span>
        </div>
      </Beat>
    </div>
  )
}

/* ── 3 · rendered inside a shell ─────────────────────────────────────── */

function MiniSlider({ label, from, to, on, delay, unit = '' }: { label: string; from: number; to: number; on: boolean; delay: number; unit?: string }) {
  const reduce = useReducedMotion()
  const v = on || reduce ? to : from
  return (
    <div className="flex h-6 items-center gap-2">
      <span className="w-11 flex-none text-fg-muted">{label}</span>
      <div className="relative h-1 flex-1 rounded-full bg-track">
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-signal" initial={false} animate={{ width: `${v}%` }}
          transition={on && !reduce ? { duration: 0.9, ease: EASE, delay } : { duration: 0 }} />
      </div>
      <span className="tabular w-8 flex-none text-right">{v}{unit}</span>
    </div>
  )
}

function ShellVisual({ active }: { active: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className={cn(FLOAT, 'flex w-full max-w-[360px] flex-col gap-2 p-2 text-[11px] text-fg')}>
      <div className="flex h-7 items-center justify-between px-1.5">
        <div className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-fg" /><span className="font-medium">Hero gradient</span></div>
        <span className="flex h-5 items-center rounded-[5px] bg-signal-strong px-2 font-medium text-signal-fg">Export</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex flex-1 items-center justify-center rounded-[10px] bg-well py-4">
          <motion.div className="relative aspect-[4/5] w-[62%] overflow-hidden rounded-[6px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
            initial={false} animate={active || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
            transition={active && !reduce ? { duration: 0.6, ease: EASE, delay: 0.1 } : { duration: 0 }}>
            <Field colors={ART} drift={active} blur={18} />
            <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgb(0 0 0 / 0.9) 0.6px, transparent 0.6px)', backgroundSize: '3px 3px' }} />
          </motion.div>
        </div>
        <div className="flex w-[46%] flex-col gap-0.5 rounded-[10px] bg-control p-2">
          <div className="mb-1 font-medium">Gradient</div>
          <div className="flex h-6 items-center gap-2">
            <span className="w-11 flex-none text-fg-muted">Colours</span>
            <div className="flex gap-0.5">{ART.map((c) => <span key={c} className="size-3.5 rounded-[3px]" style={{ background: c }} />)}</div>
          </div>
          <MiniSlider label="Grain" from={0} to={18} on={active} delay={0.6} />
          <MiniSlider label="Drift" from={50} to={72} on={active} delay={0.9} unit="%" />
        </div>
      </div>
      <div className="flex h-6 items-center gap-2 px-1.5">
        <span className="tabular text-fg-faint">0:02</span>
        <div className="relative h-2 flex-1">
          <div className="absolute inset-y-0 left-[4%] w-[46%] rounded-[2px] bg-lane" />
          <div className="absolute inset-y-0 left-[54%] w-[38%] rounded-[2px] bg-lane" />
          <motion.div className="absolute inset-y-[-3px] w-px bg-rec" initial={false}
            animate={active && !reduce ? { left: ['8%', '92%'] } : { left: '40%' }}
            transition={active && !reduce ? { duration: 6, repeat: Infinity, ease: 'linear' } : { duration: 0 }} />
        </div>
      </div>
    </div>
  )
}
