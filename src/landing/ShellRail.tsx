/* The landing page's shell rail. When the section reaches the top it pins,
   vertical scrolling moves a row of cards sideways (1:1, no snapping), and when
   the row ends the page carries on scrolling down.
     height of the section = one screen + the row's overflow width
     sticky frame inside it; the row is translated by -progress × overflow
   It runs a little faster than the scroll (SPEED) so 19 cards don't take nine
   screens, but it still follows the scroll exactly — no snapping.
   Each card starts as the bare artwork and the harness appears around it as
   the card travels in from the right: the full screenshot is unmasked from the
   edges inward while both layers zoom out from where the artwork sits
   (scripts/thumbs-rail.mjs captures both images and that position).
   Phones get a native swipe row instead of pinning. The landing scrolls inside
   a div, so everything is measured against the nearest scrolling ancestor. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import type { Shell } from '@/gallery/registry'
import { Container, Heading } from './parts'

const NAV_H = 56
/** the row moves this much faster than the page scrolls — 19 big cards at 1:1 would be ~19 screens */
const SPEED = 2.5
type Box = { x: number; y: number; w: number; h: number } | null
type Manifest = Record<string, Box>

const rail = (id: string, theme: string, bare = false) => `${import.meta.env.BASE_URL}thumbs/rail/${id}-${theme}${bare ? '-bare' : ''}.jpg`

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

function useManifest() {
  const [m, setM] = useState<Manifest>({})
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}thumbs/rail/manifest.json`).then((r) => (r.ok ? r.json() : {})).then(setM).catch(() => {})
  }, [])
  return m
}

export function ShellRail({ shells, theme }: { shells: Shell[]; theme: string }) {
  const phone = useMedia('(max-width: 767px)')
  const manifest = useManifest()
  const head = (
    <Heading kicker="Shells" title={`${shells.length} instruments, one kit.`}
      lede="Each one is a different kind of tool, and a starting point for yours." />
  )
  return phone
    ? <SwipeRow shells={shells} theme={theme} head={head} />
    : <PinnedRow shells={shells} theme={theme} head={head} manifest={manifest} />
}

/* ── desktop: pinned, scroll moves the row ───────────────────────────── */

function PinnedRow({ shells, theme, head, manifest }: { shells: Shell[]; theme: string; head: React.ReactNode; manifest: Manifest }) {
  const outer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [frameW, setFrameW] = useState(0)
  const [count, setCount] = useState(1)
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
      const past = top + NAV_H - el.getBoundingClientRect().top
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
    ;(scroller ?? window).scrollTo({ top: outerTop - NAV_H + (p * dist) / SPEED })
  }

  return (
    <section id="shells" data-section="shells" ref={outer} className="relative" style={{ height: `calc(100svh - ${NAV_H}px + ${Math.round(dist / SPEED)}px)` }}>
      <div ref={frame} className="sticky flex flex-col justify-center gap-8 overflow-clip lg:gap-10" style={{ top: NAV_H, height: `calc(100svh - ${NAV_H}px)` }}>
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
          {shells.map((s) => <RailCard key={s.id} shell={s} theme={theme} x={x} frameW={frameW} box={manifest[s.id]} />)}
        </motion.div>

        <Container>
          <div className="relative h-px bg-line" aria-hidden>
            <motion.div className="absolute inset-0 origin-left bg-fg" style={{ scaleX: progress }} />
          </div>
        </Container>
      </div>
    </section>
  )
}

function RailCard({ shell: s, theme, x, frameW, box }: { shell: Shell; theme: string; x: MotionValue<number>; frameW: number; box: Box | undefined }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduce = useReducedMotion()
  const [geo, setGeo] = useState({ left: 0, w: 0 })
  useLayoutEffect(() => {
    const el = ref.current!
    const m = () => setGeo({ left: el.offsetLeft, w: el.offsetWidth })
    m()
    const ro = new ResizeObserver(m); ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 0 = bare artwork (card centre near the right edge) → 1 = whole tool (card past the middle)
  const reveal = useTransform(x, (v) => {
    if (reduce || !frameW) return 1
    const centre = geo.left + v + geo.w / 2
    const start = frameW * 0.96, end = frameW * 0.5
    return Math.min(1, Math.max(0, (start - centre) / (start - end)))
  })
  const [bareOk, setBareOk] = useState(true)
  const hasBare = box !== null && bareOk // undefined = manifest still loading → assume bare exists
  const scale = useTransform(reveal, [0, 1], [hasBare ? 1.16 : 1.06, 1])
  const edge = useTransform(reveal, [0, 1], [100, -20])
  const ox = box ? (box.x + box.w / 2) * 100 : 50
  const oy = box ? (box.y + box.h / 2) * 100 : 50
  const mask = useMotionTemplate`radial-gradient(farthest-corner at ${ox}% ${oy}%, transparent ${edge}%, black calc(${edge}% + 22%))`

  return (
    <a ref={ref} href={`#/${s.id}`} data-rail-card data-shell-id={s.id}
      className="group flex w-[max(320px,min(70vw,calc((100svh-320px)*1.6)))] flex-none flex-col gap-3.5 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-field">
      <div className="panel relative aspect-[16/10] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale, transformOrigin: `${ox}% ${oy}%` }}>
          {hasBare && <img src={rail(s.id, theme, true)} alt="" loading="lazy" decoding="async" onError={() => setBareOk(false)} className="absolute inset-0 size-full object-cover" />}
          <motion.img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="lazy" decoding="async"
            className="absolute inset-0 size-full object-cover"
            style={hasBare ? { maskImage: mask, WebkitMaskImage: mask } : undefined} />
        </motion.div>
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
