/* "How it works" as one drawing that builds as you scroll (art/StepArt.tsx → BuildArt): the
   three steps add to the same harness tray in turn instead of each having its own picture.
   Nothing is scroll-jacked: the page scrolls normally past a tall track, the drawing stays
   pinned beside (desktop) or above (phones) the text, and how far you are through the track
   sets each step's progress, --s1 … --s3, written straight onto the drawing.
   - Desktop: the heading and the steps sit in a pinned left column, the active one open; the
     drawing pins on the right. Clicking a step scrolls to where it's finished.
   - Phones and short screens: under the heading, the drawing and a text slot pin together;
     the drawing builds and each step's text fades into the slot in turn.
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
      <div ref={track} className="relative bg-fg/[0.025]" style={{ height: `${steps.length * 90 + 10}vh` }}>
        <div ref={pinned} className="sticky mx-auto" style={{ top, width: size, height: size }} role="img" aria-label={steps.map((s) => s.title).join(', then ')}>
          <BuildArt el={art} />
        </div>
      </div>
    </div>
  )
}

/** phones and short screens: the drawing has its own spot under the heading. Scrolling a track
    below it, the drawing and a text slot under it pin together; the drawing keeps building and
    each step's text fades into the slot in turn (no text scrolls under the drawing, so nothing
    needs a backdrop). The same progress model as desktop (useBuild), over a shorter track. */
function Stacked({ steps }: { steps: DeckStep[] }) {
  const track = useRef<HTMLDivElement>(null), pinned = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null)
  // the build starts while the drawing is still rising into its spot (a third of a screen early),
  // so it never sits there empty
  const { active } = useBuild(track, pinned, art, steps.length, useCallback(() => NAV_H + (scrollParent(track.current)?.clientHeight ?? innerHeight) * 0.35, []))
  return (
    // the pinned piece is about 80vh tall on a phone; the rest of the track is the scroll that builds it (~60vh a step)
    <div ref={track} className="relative" style={{ height: `${steps.length * 60 + 95}vh` }}>
      {/* pinned flush under the nav, so the tinted drawing band meets its rule */}
      <div ref={pinned} className="sticky flex flex-col gap-6 px-5 pt-6 pb-10 sm:px-6" style={{ top: NAV_H }}>
        {/* the drawing on the kit visuals' tint, edge to edge with a closing rule, like a kit cell (Rafael) */}
        <div className="-mx-5 -mt-6 bg-fg/[0.025] px-5 py-6 shadow-[inset_0_-1px_var(--rule)] sm:-mx-6 sm:px-6">
          <div className="mx-auto aspect-square w-full max-w-[min(100%,46vh)]" role="img" aria-label={steps.map((s) => s.title).join(', then ')}>
            <BuildArt el={art} />
          </div>
        </div>
        {/* the text slot: every step in one grid cell (so it's as tall as the longest), only the current one shown */}
        <div className="grid">
          {steps.map((s, i) => (
            <article key={s.n} aria-hidden={active !== i}
              className={cn('[grid-area:1/1] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                active === i ? 'translate-y-0 opacity-100' : i < active ? '-translate-y-1.5 opacity-0' : 'translate-y-1.5 opacity-0')}>
              <div className="tabular text-[13px] text-fg-faint">Step {s.n} of {steps.length}</div>
              <h3 className="mt-2 text-[22px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-[1.6] text-pretty text-fg-muted">{s.body}</p>
            </article>
          ))}
        </div>
        {/* where you are, under the text (Rafael): one short rule per step, the current one in ink */}
        <div aria-hidden className="flex gap-1.5">
          {steps.map((s, i) => <span key={s.n} className={cn('h-px flex-1 transition-colors duration-500', i <= active ? 'bg-fg' : 'bg-[var(--rule)]')} />)}
        </div>
      </div>
    </div>
  )
}
