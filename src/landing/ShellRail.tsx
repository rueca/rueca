/* The landing page's shell rail. When the section reaches the top it pins,
   vertical scrolling moves a row of cards sideways (1:1, no snapping), and when
   the row ends the page carries on scrolling down.
     height of the section = one screen + the row's overflow width
     sticky frame inside it; the row is translated by -progress × overflow
   It runs a little faster than the scroll (SPEED) so 19 cards don't take nine
   screens, but it still follows the scroll exactly — no snapping.
   Phones get a native swipe row instead of pinning. The landing scrolls inside
   a div, so everything is measured against the nearest scrolling ancestor. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import type { Shell } from '@/gallery/registry'
import { Container, Heading } from './parts'
import { usePinFrame } from './StepDeck'

/** the row moves this much faster than the page scrolls — 19 big cards at 1:1 would be ~19 screens */
const SPEED = 2.5

const rail = (id: string, theme: string) => `${import.meta.env.BASE_URL}thumbs/rail/${id}-${theme}.jpg`

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

export function ShellRail({ shells, theme }: { shells: Shell[]; theme: string }) {
  const phone = useMedia('(max-width: 767px)')
  const head = (
    <Heading kicker="Shells" title={`${shells.length} instruments, one kit.`}
      lede="Each one is a different kind of tool, and a starting point for yours." />
  )
  return phone
    ? <SwipeRow shells={shells} theme={theme} head={head} />
    : <PinnedRow shells={shells} theme={theme} head={head} />
}

/* ── desktop: pinned, scroll moves the row ───────────────────────────── */

function PinnedRow({ shells, theme, head }: { shells: Shell[]; theme: string; head: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [frameW, setFrameW] = useState(0)
  const [count, setCount] = useState(1)
  const { frameH, top: stickyTop } = usePinFrame(frame)
  const pin = useRef(stickyTop); pin.current = stickyTop
  const x = useMotionValue(0)
  const progress = useTransform(x, (v) => (dist > 0 ? -v / dist : 0))

  // overflow distance = how far the row must travel
  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current || !frame.current) return
      setFrameW(frame.current.clientWidth)
      setDist(Math.max(0, track.current.scrollWidth - frame.current.clientWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame.current!); ro.observe(track.current!)
    return () => ro.disconnect()
  }, [shells.length])

  const geometry = () => {
    const el = outer.current!
    const scroller = scrollParent(el)
    const top = scroller ? scroller.getBoundingClientRect().top : 0
    const outerTop = scroller
      ? el.getBoundingClientRect().top - top + scroller.scrollTop
      : el.getBoundingClientRect().top + scrollY
    return { scroller, top, outerTop }
  }

  useEffect(() => {
    const el = outer.current!
    const scroller = scrollParent(el)
    const target: HTMLElement | Window = scroller ?? window
    let raf = 0
    const update = () => {
      raf = 0
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      const past = top + pin.current - el.getBoundingClientRect().top
      const p = dist > 0 ? Math.min(1, Math.max(0, (past * SPEED) / dist)) : 0
      x.set(-p * dist)
      setCount(Math.round(p * (shells.length - 1)) + 1)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', on, { passive: true })
    return () => { target.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [dist, shells.length, x])

  // a sideways trackpad swipe over the row scrolls the page, so it moves the row too
  useEffect(() => {
    const f = frame.current!
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      const { scroller } = geometry()
      e.preventDefault()
      ;(scroller ?? window).scrollBy({ top: e.deltaX })
    }
    f.addEventListener('wheel', onWheel, { passive: false })
    return () => f.removeEventListener('wheel', onWheel)
  }, [])

  // tabbing to an off-screen card scrolls the page until that card is in view
  const onFocus = (e: React.FocusEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-rail-card]')
    if (!card || dist <= 0) return
    const p = Math.min(1, Math.max(0, (card.offsetLeft - (frameW - card.offsetWidth) / 2) / dist))
    const { scroller, outerTop } = geometry()
    ;(scroller ?? window).scrollTo({ top: outerTop - stickyTop + (p * dist) / SPEED })
  }

  return (
    <section id="shells" data-section="shells" className="scroll-mt-16 py-16 sm:py-20">
      <div ref={outer} className="relative" style={{ height: frameH + Math.round(dist / SPEED) }}>
      {/* the row is far wider than the screen, so the reveal watches the frame, not the row */}
      <div ref={frame} data-reveal="cards" className="sticky flex flex-col gap-8 overflow-clip lg:gap-10" style={{ top: stickyTop }}>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            {head}
            <div className="flex items-center gap-5 text-[13px]">
              <span className="tabular text-fg-faint" aria-hidden>{String(count).padStart(2, '0')} / {String(shells.length).padStart(2, '0')}</span>
              <a href="#/shells" className="inline-flex items-center gap-1 text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">All shells<ArrowUpRight size={13} strokeWidth={1.5} /></a>
            </div>
          </div>
        </Container>

        <motion.div ref={track} onFocus={onFocus} style={{ x }}
          className="relative flex w-max gap-6 px-[max(16px,calc((100vw-1120px)/2+32px))] will-change-transform">
          {shells.map((s, i) => <RailCard key={s.id} shell={s} theme={theme} delay={Math.min(i, 4) * 90} />)}
        </motion.div>

        <Container>
          <div className="relative h-px bg-line" aria-hidden>
            <motion.div className="absolute inset-0 origin-left bg-signal" style={{ scaleX: progress }} />
          </div>
        </Container>
      </div>
      </div>
    </section>
  )
}

function RailCard({ shell: s, theme, delay }: { shell: Shell; theme: string; delay: number }) {
  return (
    <a href={`#/${s.id}`} data-rail-card data-shell-id={s.id} style={{ '--card-in-delay': `${delay}ms` } as React.CSSProperties}
      className="card-in group flex w-[max(320px,min(70vw,calc((100svh-320px)*1.6)))] flex-none flex-col gap-3.5 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-field">
      <div className="panel relative aspect-[16/10] overflow-hidden">
        <img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-3 px-0.5">
        <span className="truncate text-[15px] font-medium text-fg">{s.name}</span>
        <ArrowUpRight size={14} strokeWidth={1.5} className="flex-none text-fg-faint transition-colors group-hover:text-fg" />
      </div>
    </a>
  )
}

/* ── phones: a native swipe row, no pinning ──────────────────────────── */

function SwipeRow({ shells, theme, head }: { shells: Shell[]; theme: string; head: React.ReactNode }) {
  return (
    <section id="shells" data-section="shells" className="scroll-mt-16 py-16">
      <Container>
        {head}
        <a href="#/shells" className="mt-4 inline-flex items-center gap-1 text-[13px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">All shells<ArrowUpRight size={13} strokeWidth={1.5} /></a>
      </Container>
      <div className="mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {shells.map((s) => (
          <a key={s.id} href={`#/${s.id}`} data-shell-id={s.id} className="flex w-[78vw] flex-none snap-start flex-col gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-signal">
            <div className="panel relative aspect-[16/10] overflow-hidden">
              <img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            </div>
            <span className="truncate text-[14px] font-medium text-fg">{s.name}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
