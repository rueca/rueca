/* "How it works" as one drawing that builds as you scroll (art/StepArt.tsx → BuildArt): the
   three steps add to the same harness tray in turn instead of each having its own picture.
   Nothing is scroll-jacked: the page scrolls normally past a tall track, the drawing stays
   pinned beside (desktop) or above (phones) the text, and how far you are through the track
   sets each step's progress, --s1 … --s3, written straight onto the drawing.
   - Desktop: the heading and the steps sit in a pinned left column, the active one open; the
     drawing pins on the right. Clicking a step scrolls to where it's finished.
   - Phones and short screens: the drawing pins under the nav and the step texts scroll up
     beneath it, the one in view marked.
   Reduced motion: each step cuts in once you're halfway through it. */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@kit/core/cn'
import { BuildArt } from './art/StepArt'
import { CELL, Row } from './plate'
import type { DeckStep } from './StepDeck'

const NAV_H = 56
const HOLD = 0.15 // the last share of each step's stretch holds it finished

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
    const m = matchMedia(query), on = () => setMatch(m.matches)
    on(); m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** Scroll progress through `track` while `pinned` is pinned at `pinTop`: 0 → steps. Writes each
    step's progress onto `art` and reports the active step. Returns a scroller to a step's end. */
function useBuild(track: React.RefObject<HTMLElement | null>, pinned: React.RefObject<HTMLElement | null>, art: React.RefObject<HTMLElement | null>, steps: number, pinTop: () => number) {
  const [active, setActive] = useState(0)
  const geometry = useCallback(() => {
    const t = track.current!, scroller = scrollParent(t)
    const top = scroller ? scroller.getBoundingClientRect().top : 0
    const r = t.getBoundingClientRect(), travel = r.height - pinned.current!.offsetHeight
    return { scroller, travelled: pinTop() - (r.top - top), travel }
  }, [track, pinned, pinTop])
  useEffect(() => {
    const t = track.current
    if (!t) return
    const still = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, last = -1
    const update = () => {
      raf = 0
      const { travelled, travel } = geometry()
      const p = Math.min(1, Math.max(0, travelled / Math.max(1, travel))) * steps
      for (let i = 0; i < steps; i++) {
        const raw = Math.min(1, Math.max(0, (p - i) / (1 - HOLD)))
        art.current?.style.setProperty(`--s${i + 1}`, String(still.matches ? (p - i >= 0.5 ? 1 : 0) : +raw.toFixed(3)))
      }
      const now = Math.min(steps - 1, Math.max(0, Math.floor(p - 0.02)))
      if (now !== last) { last = now; setActive(now) }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    const target: HTMLElement | Window = scrollParent(t) ?? window
    update()
    target.addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { target.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [track, art, steps, geometry])
  const go = (i: number) => {
    const { scroller, travelled, travel } = geometry()
    const by = ((i + 1 - HOLD / 2) / steps) * travel - travelled
    if (scroller) scroller.scrollBy({ top: by, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    else scrollBy({ top: by, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  return { active, go }
}

export function StepBuild({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  const stacked = useMedia('(max-width: 1023px), (max-height: 739px)')
  return stacked
    ? <><Row className={CELL}>{head}</Row><Row><Stacked steps={steps} /></Row></>
    : <Row><Side steps={steps} head={head} /></Row>
}

/** desktop: pinned steps on the left, the pinned drawing on the right, over a track three screens tall */
function Side({ steps, head }: { steps: DeckStep[]; head?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null), pinned = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null)
  const [vh, setVh] = useState(800)
  useEffect(() => {
    const s = scrollParent(track.current), m = () => setVh(s ? s.clientHeight : innerHeight)
    m(); addEventListener('resize', m)
    return () => removeEventListener('resize', m)
  }, [])
  const size = Math.min(vh - NAV_H - 48, 680)
  const top = NAV_H + (vh - NAV_H - size) / 2
  const { active, go } = useBuild(track, pinned, art, steps.length, useCallback(() => top, [top]))
  return (
    <div className="divide-rule grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <div className="relative px-6">
        <div className="sticky flex flex-col gap-10 py-21" style={{ top: NAV_H }}>
          {head}
          <div className="flex flex-col">
            {steps.map((s, i) => {
              const on = active === i
              return (
                <div key={s.n} className="relative border-l border-line pl-5">
                  <span className={cn('absolute top-0 -left-px w-px bg-signal transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', on ? 'h-full' : 'h-0')} />
                  <h3>
                    <button type="button" id={`step-${i}`} aria-expanded={on} aria-controls={`step-${i}-body`} onClick={() => go(i)}
                      className={cn('flex w-full items-baseline gap-3 rounded-[4px] py-3 text-left text-[17px] font-semibold tracking-[-0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
                        on ? 'text-fg' : 'text-fg-faint hover:text-fg-muted')}>
                      <span className="tabular text-[13px] font-medium text-fg-faint">{s.n}</span>{s.title}
                    </button>
                  </h3>
                  <div role="region" id={`step-${i}-body`} aria-labelledby={`step-${i}`} inert={!on} className={cn('grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none', on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <p className="overflow-hidden pl-[26px] text-[14.5px] leading-[1.6] text-pretty text-fg-muted"><span className="block pb-4">{s.body}</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div ref={track} className="relative bg-field" style={{ height: `${steps.length * 90 + 10}vh` }}>
        <div ref={pinned} className="sticky mx-auto" style={{ top, width: size, height: size }} role="img" aria-label={steps.map((s) => s.title).join(', then ')}>
          <BuildArt el={art} />
        </div>
      </div>
    </div>
  )
}

/** phones and short screens: the drawing pins under the nav, the step texts scroll up beneath it.
    Each step's progress follows its own text: it starts once the text is three-quarters of the
    way up the space under the drawing and is complete when the text sits in the middle of it,
    so the drawing always shows the step you're reading. */
function Stacked({ steps }: { steps: DeckStep[] }) {
  const pinned = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), texts = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)
  useEffect(() => {
    const first = texts.current[0]
    if (!first) return
    const scroller = scrollParent(first), target: HTMLElement | Window = scroller ?? window
    const still = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, last = -1
    const update = () => {
      raf = 0
      const top = scroller ? scroller.getBoundingClientRect().top : 0, vh = scroller ? scroller.clientHeight : innerHeight
      const below = NAV_H + pinned.current!.offsetHeight, middle = (below + vh) / 2
      let now = 0
      texts.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect(), y = r.top - top
        // from its top three-quarters down the open space to its centre on the middle of it
        const start = (middle + vh) / 2, end = middle - r.height / 2
        const p = Math.min(1, Math.max(0, (start - y) / (start - end)))
        art.current?.style.setProperty(`--s${i + 1}`, String(still.matches ? (p >= 0.5 ? 1 : 0) : +p.toFixed(3)))
        if (p > 0.04) now = i // the step being built is the one marked
      })
      if (now !== last) { last = now; setActive(now) }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { target.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [steps.length])
  return (
    <div className="relative bg-field">
      {/* no rule under it: the drawing and the steps are one piece, on one ground; the texts fade out as they pass under it */}
      <div ref={pinned} className="sticky z-10 bg-field" style={{ top: NAV_H }} role="img" aria-label={steps.map((s) => s.title).join(', then ')}>
        <div className="mx-auto aspect-square w-full max-w-[min(100vw,52vh)]"><BuildArt el={art} /></div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-field to-transparent" />
      </div>
      {/* a lead-in, so step 1's text starts arriving just as the drawing pins (and its chat plays in view) */}
      <div aria-hidden className="h-[34vh]" />
      {steps.map((s, i) => (
        <article key={s.n} ref={(el) => { texts.current[i] = el }} className={cn('flex min-h-[46vh] flex-col justify-center px-5 py-8 transition-opacity duration-500 sm:px-6', active === i ? 'opacity-100' : 'opacity-35')}>
          <div className="tabular text-[13px] text-fg-faint">Step {s.n}</div>
          <h3 className="mt-2 text-[24px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">{s.title}</h3>
          <p className="mt-3 text-[14px] leading-[1.6] text-pretty text-fg-muted">{s.body}</p>
        </article>
      ))}
    </div>
  )
}
