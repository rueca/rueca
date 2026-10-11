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
import { cn } from '@kit/core/cn'
import { StepArt } from './art/StepArt'
import { StepBuild } from './StepBuild'
import { CELL, Row } from './plate'

export interface DeckStep { n: number; short: string; title: string; body: string }

const NAV_H = 56

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

/** The step's plate (art/StepArt.tsx): an isometric drawing on the harness tray the three steps
    share, not a mock UI. Each one plays once as it arrives; reduced motion shows it finished. */
function Visual({ i, active, compact }: { i: number; active: boolean; compact?: boolean }) {
  // the square plate centres itself in the phone's taller card
  return <div className={compact ? 'absolute inset-0 px-[2%]' : 'absolute inset-0 p-[4%]'}><StepArt i={i} active={active} /></div>
}

/* Phones: no pinning. Each step is a plain card — text, then its visual,
   which plays when the card scrolls into view (Granola, Framer do the same). */
function StackedSteps({ steps }: { steps: DeckStep[] }) {
  return <div className="cells">{steps.map((s, i) => <StackedCard key={s.n} step={s} i={i} />)}</div>
}

function StackedCard({ step: s, i }: { step: DeckStep; i: number }) {
  const [ref, seen] = useArrived<HTMLElement>()
  return (
    <article ref={ref} className="flex flex-col gap-6 px-5 pt-10 sm:px-6">
      <div>
        <div className="tabular text-[13px] text-fg-faint">Step {s.n}</div>
        <h3 className="mt-2 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">{s.title}</h3>
        <p className="mt-3 text-[14px] leading-[1.6] text-pretty text-fg-muted">{s.body}</p>
      </div>
      <div className="relative -mx-5 h-[470px] overflow-hidden bg-field shadow-[inset_0_1px_var(--rule)] sm:-mx-6">
        <Visual i={i} active={seen} compact />
      </div>
    </article>
  )
}

// Exploring (11 Oct): How it works as one drawing that builds as you scroll (StepBuild.tsx).
// ?deck=panels shows the three separate plates below, for comparing the two.
const PANELS = typeof location !== 'undefined' && new URLSearchParams(location.search).get('deck') === 'panels'

export function StepDeck({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  return PANELS ? <StepPanels steps={steps} head={head} /> : <StepBuild steps={steps} head={head} />
}

function StepPanels({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  // Lovable only pins at lg and up, and only when the screen is tall enough to hold the column
  const stacked = useMedia('(max-width: 1023px), (max-height: 739px)')
  return stacked
    ? <><Row className={CELL}>{head}</Row><Row><StackedSteps steps={steps} /></Row></>
    : <Row><FollowAlong steps={steps} head={head} /></Row>
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
    if (!scroller) { scrollTo({ top: r.top + scrollY - (innerHeight - r.height) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return }
    const sr = scroller.getBoundingClientRect()
    scroller.scrollTo({ top: scroller.scrollTop + r.top - sr.top - (scroller.clientHeight - r.height) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className="divide-rule grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <div className="relative px-6 py-21">
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
                    <button type="button" id={`step-${i}`} aria-expanded={on} aria-controls={`step-${i}-body`} onClick={() => show(i)}
                      className={cn('flex w-full items-baseline gap-3 rounded-[4px] py-3 text-left text-[17px] font-semibold tracking-[-0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
                        on ? 'text-fg' : 'text-fg-faint hover:text-fg-muted')}>
                      <span className="tabular text-[13px] font-medium text-fg-faint">{s.n}</span>{s.title}
                    </button>
                  </h3>
                  {/* expands with a grid-rows transition, so the height animates without measuring */}
                  <div role="region" id={`step-${i}-body`} aria-labelledby={`step-${i}`} inert={!on} className={cn('grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
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

      <div className="cells">
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
    // the visual fills its cell edge to edge, so the cell's rules are its frame
    <div className="bg-field"><div ref={(el) => { ref.current = el; refFn(el) }} data-reveal aria-label={title} role="img">
      <div className={cn('relative aspect-square overflow-hidden transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        focused ? 'opacity-100' : 'opacity-30')}>
        <Visual i={i} active={seen} />
      </div>
    </div></div>
  )
}
