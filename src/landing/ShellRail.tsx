/* The landing page's shell rail. When the section reaches the top it pins,
   vertical scrolling moves a row of cards sideways, and when the row ends the page
   carries on scrolling down. It follows the scroll exactly (no snapping), but each
   card dwells at the centre for part of the scroll (HOLD) before the row glides on.
     height of the section = one screen + the row's overflow width
     sticky frame inside it; the row is translated by -progress × overflow
   It runs a little faster than the scroll (SPEED) so the cards don't take too many screens.
   Only the featured few ride the rail; the row ends on an index card that lists the rest
   like a manual's table of plates and opens the full catalogue (#/shells).
   The cards are thumbnails only (the hero is where a shell runs live); the
   centred card's "Try the tool" opens it full screen. The bare variation
   (CARDED = false) still runs the centred shell live.
   Phones get a native swipe row instead of pinning. The landing scrolls inside
   a div, so everything is measured against the nearest scrolling ancestor. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useMotionValue } from 'motion/react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@kit/core/cn'
import type { Shell } from '@/gallery/registry'
import { Heading } from './parts'
import { LiveFrame } from './LiveFrame'
import { Cross, Row } from './plate'
import { usePinFrame } from './StepDeck'

/** the row moves this much faster than the page scrolls — 19 big cards at 1:1 would be ~19 screens */
const SPEED = 1.8
/** Each card holds still at the centre for this share of the scroll on either side of it (so
    0.22 = 44% of the scroll between two cards is dwell), then glides to the next on a smooth
    ease. The wipe and the skeleton get a still card to play on. */
const HOLD = 0.22

/** one card width, used by the cards and by the row's centring padding */
/** Trial (Rafael, 11 Oct): false shows the skeleton as a finished drawing, with no pen draw-in or
    erase; only the wipe swaps it for the screenshot. true brings the drawing animation back. */
const DRAW_SKELETON = false

/** Focus, by closeness to the middle (0–1): a card takes focus once it's this close, and keeps it
    until it drifts below FOCUS_OUT. Between the two nothing changes, so focus never flickers. */
const FOCUS_IN = 0.55
const FOCUS_OUT = 0.45

/** Variation (Rafael, 11 Oct): each shell in a card with a name header and a link footer. false = the bare rail. */
const CARDED = true
// the card's header takes ~70px, so the carded image gets a little less height
const CARD_W = CARDED ? 'max(320px, min(68vw, calc((100svh - 390px) * 1.6)))' : 'max(320px, min(70vw, calc((100svh - 320px) * 1.6)))'

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

const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function ShellRail({ shells: all, featured, theme, strip }: { shells: Shell[]; featured: string[]; theme: string; strip?: React.ReactNode }) {
  const phone = useMedia('(max-width: 767px)')
  const shells = featured.map((id) => all.find((s) => s.id === id)).filter((s): s is Shell => !!s)
  const rest = all.filter((s) => !shells.includes(s))
  const head = (
    <Heading title={`${all.length} instruments, one kit.`}
      lede={`Here are ${WORDS[shells.length] ?? shells.length}, each a different kind of tool. Start yours from any of them.`} />
  )
  return phone
    ? <SwipeRow shells={shells} rest={rest} theme={theme} head={head} strip={strip} />
    : <PinnedRow shells={shells} rest={rest} theme={theme} head={head} strip={strip} />
}

/* ── desktop: pinned, scroll moves the row ───────────────────────────── */

function PinnedRow({ shells, rest, theme, head, strip }: { shells: Shell[]; rest: Shell[]; theme: string; head: React.ReactNode; strip?: React.ReactNode }) {
  // the index card rides at the end of the row as one more stop
  const stops = shells.length + (rest.length ? 1 : 0)
  const outer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [frameW, setFrameW] = useState(0)
  const [count, setCount] = useState(1)
  // the card nearest the middle; it goes live only once scrolling has settled on it
  const [centre, setCentre] = useState(0)
  const [live, setLive] = useState<number | null>(null)
  const [focus, setFocus] = useState(-1)
  const focusRef = useRef(-1)
  const { frameH, top: stickyTop } = usePinFrame(frame)
  const pin = useRef(stickyTop); pin.current = stickyTop
  const x = useMotionValue(0)

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
      const raw = dist > 0 ? Math.min(1, Math.max(0, (past * SPEED) / dist)) : 0
      // dwell: within each step between two cards, hold at both ends and glide through the middle
      const steps = Math.max(1, stops - 1), at = raw * steps, k = Math.min(steps - 1, Math.floor(at)), u = at - k
      const g = Math.min(1, Math.max(0, (u - HOLD) / (1 - 2 * HOLD)))
      const p = (k + g * g * (3 - 2 * g)) / steps
      x.set(-p * dist)
      setCount(Math.round(p * (stops - 1)) + 1)
      // which card's centre is closest to the frame's centre (cards are children of the track)
      const cards = track.current ? [...track.current.children] as HTMLElement[] : []
      const mid = (frame.current?.clientWidth ?? 0) / 2
      // closeness to the middle, 0 (a card's width away or more) to 1 (dead centre). It drives each
      // card's size every frame (--near, no re-render), and focus, with hysteresis so it never flickers
      let best = -1, bestNear = 0
      const near = cards.map((c, i) => {
        const n = Math.max(0, 1 - Math.abs(c.offsetLeft - p * dist + c.offsetWidth / 2 - mid) / (c.offsetWidth + 12))
        c.style.setProperty('--near', n.toFixed(3))
        if (n > bestNear) { bestNear = n; best = i }
        return n
      })
      let f = focusRef.current
      if (f >= 0 && (near[f] ?? 0) < FOCUS_OUT) f = -1
      if (f < 0 && bestNear >= FOCUS_IN) f = best
      focusRef.current = f
      setFocus(f)
      // only live while the rail is actually on screen and pinned
      const r = el.getBoundingClientRect(), vh = scroller ? scroller.clientHeight : innerHeight
      setCentre(r.bottom > top + vh * 0.25 && r.top < top + vh * 0.75 ? f : -1)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', on, { passive: true })
    return () => { target.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [dist, stops, x])

  // settle: go live 350ms after the centre card stops changing; leaving drops back to the thumbnail
  useEffect(() => {
    setLive(null)
    if (CARDED || centre < 0) return // the carded rail shows thumbnails only
    const t = setTimeout(() => setLive(centre), 350)
    return () => clearTimeout(t)
  }, [centre])

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
    <section id="shells" data-section="shells" className="scroll-mt-16">
      {strip}
      {/* the section's padding sits outside the pinned frame, so the pin hugs the heading and cards */}
      <Row className="py-19">
      <div ref={outer} className="relative" style={{ height: frameH + Math.round(dist / SPEED) }}>
      {/* the row is far wider than the screen, so the reveal watches the frame, not the row.
          It isn't clipped to the sheet: the cards slide out across the rails (a second grid break). */}
      <div ref={frame} data-reveal="cards" className="sticky z-[3] flex flex-col gap-8 lg:gap-10" style={{ top: stickyTop }}>
        <div className="px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            {head}
            <div className="flex items-center gap-5 text-[13px]">
              <span className="strip text-[10.5px] text-fg-faint" aria-hidden>{String(count).padStart(2, '0')} / {String(stops).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <motion.div ref={track} onFocus={onFocus}
          // padded by half the leftover width at each end, so every card passes exactly through the
          // middle: the focused card is always the centred one, with even peeks either side
          className="relative z-[3] flex w-max gap-3 will-change-transform" style={{ x, paddingInline: `calc((100% - ${CARD_W}) / 2)` }}>
          {shells.map((s, i) => <RailCard key={s.id} shell={s} theme={theme} delay={Math.min(i, 4) * 90} live={live === i} focused={focus === i} />)}
          {rest.length > 0 && <IndexCard rest={rest} first={shells.length + 1} total={shells.length + rest.length} focused={focus === shells.length} />}
        </motion.div>

      </div>
      {/* snap points (CSS scroll snap on the page, proximity, so scrolling stays free elsewhere): one per
          slide, at the scroll position where that slide is centred and still */}
      {Array.from({ length: stops }, (_, k) => (
        <div key={k} aria-hidden className="pointer-events-none absolute left-0 h-px w-px [scroll-snap-align:start]"
          style={{ top: Math.round((k / Math.max(1, stops - 1)) * (dist / SPEED)), scrollMarginTop: stickyTop }} />
      ))}
      </div>
      </Row>
    </section>
  )
}

function RailCard(props: { shell: Shell; theme: string; delay: number; live: boolean; focused: boolean }) {
  return CARDED ? <CardedRailCard {...props} /> : <BareRailCard {...props} />
}

/* A tool's layout drawn as a skeleton, in hairlines: a top bar, a layers panel, an artboard
   with a placeholder picture, an inspector with sliders, and a timeline. Unfocused cards show
   it instead of their screenshot, so only the centred one reads as real. Every stroke draws
   itself in like a pen (brand motion: lines are drawn, never faded), in reading order, when
   the card is in view and not centred; it draws out, last stroke first, when the card takes
   the centre. Drawn on a 1600×1000 board (the card's 16:10). */
type Mark = ({ d: string } | { r: [number, number, number, number, number?] } | { c: [number, number, number] }) & { s?: number }

/* Each featured shell's skeleton is a tracing of its real layout (public/thumbs/blueprints/<id>.json,
   made by scripts/thumbs-rail.mjs at the thumbnail's 1440×900, fetched by the card), so through the wipe the drawing
   and the screenshot line up exactly. Stages order the pen like a construction drawing:
   0 frames (panels, artboards, dividers), 1 controls, 2 text. */
type BlueprintMark = { k: string; x: number; y: number; w?: number; h?: number; r?: number; v?: number; on?: boolean; framed?: boolean }
type Blueprint = { w: number; h: number; marks: BlueprintMark[] }
const blueprintCache = new Map<string, Promise<Blueprint | null>>()
const loadBlueprint = (id: string) => {
  if (!blueprintCache.has(id)) blueprintCache.set(id, fetch(`${import.meta.env.BASE_URL}thumbs/blueprints/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  return blueprintCache.get(id)!
}
/** The card's own skeleton, once its tracing has loaded (the generic one stands in until then). */
function useBlueprint(id: string) {
  const [marks, setMarks] = useState<{ marks: Mark[]; w: number; h: number } | null>(null)
  useEffect(() => { let on = true; loadBlueprint(id).then((bp) => { if (on && bp) setMarks(fromBlueprint(bp)) }); return () => { on = false } }, [id])
  return marks
}
function fromBlueprint(bp: Blueprint): { marks: Mark[]; w: number; h: number } {
  const marks: Mark[] = []
  for (const m of bp.marks) {
    const w = m.w ?? 0, h = m.h ?? 0
    if (m.k === 'box') marks.push({ r: [m.x, m.y, w, h, m.r ?? 0], s: 0 })
    else if (m.k === 'rule') marks.push({ d: `M${m.x} ${m.y}H${m.x + w}`, s: 0 })
    else if (m.k === 'vrule') marks.push({ d: `M${m.x} ${m.y}V${m.y + h}`, s: 0 })
    else if (m.k === 'media') { if (!m.framed) marks.push({ r: [m.x, m.y, w, h, 0], s: 0 }); marks.push({ d: `M${m.x} ${m.y + h}L${m.x + w} ${m.y}`, s: 1 }) }
    else if (m.k === 'track') marks.push({ d: `M${m.x} ${m.y}H${m.x + w}`, s: 1 }, { c: [m.x + w * (m.v ?? 0.5), m.y, 4], s: 1 })
    else if (m.k === 'pill') marks.push({ r: [m.x, m.y, w, h, h / 2], s: 1 }, { c: [m.on ? m.x + w - h / 2 : m.x + h / 2, m.y + h / 2, h / 2 - 3], s: 1 })
    else if (m.k === 'dot') marks.push({ c: [m.x, m.y, m.r ?? 4], s: 1 })
    else if (m.k === 'text') marks.push({ d: `M${m.x} ${m.y}H${m.x + w}`, s: 2 })
  }
  return { marks, w: bp.w, h: bp.h }
}
const SKELETON: Mark[] = (() => {
  const m: Mark[] = []
  const rect = (x: number, y: number, w: number, h: number, rr = 6) => m.push({ r: [x, y, w, h, rr] })
  const line = (x1: number, y1: number, x2: number, y2: number) => m.push({ d: `M${x1} ${y1}H${x2}${y2 !== y1 ? `V${y2}` : ''}` })
  // top bar: breadcrumb, centre tools, actions
  rect(40, 36, 300, 64, 10); m.push({ r: [60, 52, 32, 32, 6] }); line(110, 68, 200, 68); line(220, 68, 300, 68)
  rect(620, 36, 360, 64, 10); for (const x of [660, 740, 820, 900]) m.push({ c: [x, 68, 14] })
  rect(1200, 36, 360, 64, 10); for (const x of [1240, 1300, 1360]) m.push({ c: [x, 68, 12] }); rect(1420, 50, 120, 36, 6)
  // layers panel: header, rows of icon + label
  rect(40, 130, 300, 640, 12); line(64, 172, 180, 172); line(40, 200, 340, 200)
  for (let i = 0; i < 7; i++) { const y = 236 + i * 64; m.push({ r: [64, y - 12, 24, 24, 5] }); line(108, y, 108 + [150, 110, 170, 130, 90, 160, 120][i], y) }
  // artboard with a placeholder picture (Cargo's blank: one diagonal) and two text lines
  rect(430, 170, 740, 560, 4); rect(500, 240, 600, 300, 2); m.push({ d: 'M500 540L1100 240' })
  line(500, 600, 900, 600); line(500, 650, 760, 650)
  // inspector: section labels, sliders with knobs, a toggle
  rect(1260, 130, 300, 640, 12); line(1284, 172, 1400, 172); line(1260, 200, 1560, 200)
  for (let i = 0; i < 5; i++) { const y = 250 + i * 70; line(1284, y, 1360, y); line(1390, y, 1536, y); m.push({ c: [1390 + [40, 100, 70, 120, 55][i], y, 9] }) }
  line(1284, 620, 1380, 620); rect(1480, 604, 56, 32, 16); m.push({ c: [1520, 620, 11] })
  // timeline: tracks with keyframes and a playhead
  rect(430, 800, 1130, 170, 10)
  for (let i = 0; i < 3; i++) { const y = 850 + i * 38; line(470, y, 1520, y); for (const x of [[560, 820, 1100], [640, 980, 1300], [520, 760, 1220]][i]) m.push({ d: `M${x} ${y - 9}L${x + 9} ${y}L${x} ${y + 9}L${x - 9} ${y}Z` }) }
  m.push({ d: 'M1020 812V958' })
  return m
})()

function Skeleton({ drawn, marks = SKELETON, w = 1600, h = 1000 }: { drawn: boolean; marks?: Mark[]; w?: number; h?: number }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('skeleton absolute inset-0 size-full bg-[var(--sheet)]', !DRAW_SKELETON && 'skeleton-static')} data-drawn={drawn || undefined}
      fill="none" stroke="var(--rule)" strokeWidth="1" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision">
      {marks.map((k, i) => {
        // out: timed by where the stroke starts across the board, so the wipe edge erases each line just
        // before it passes · in: by stage (frames, then controls, then text), each stage sweeping in the
        // retreating edge's wake, right to left
        const at = ('d' in k ? +k.d.slice(1).split(/[ HVLZ]/)[0] : 'c' in k ? k.c[0] - k.c[2] : k.r[0]) / w
        const stage = k.s ?? Math.min(2, Math.floor((i / marks.length) * 3))
        const style = { '--out': `${Math.round(50 + at * 500)}ms`, '--in': `${Math.round(100 + stage * 260 + (1 - at) * 300)}ms` } as React.CSSProperties
        if ('d' in k) return <path key={i} d={k.d} pathLength={1} vectorEffect="non-scaling-stroke" style={style} />
        if ('c' in k) return <circle key={i} cx={k.c[0]} cy={k.c[1]} r={k.c[2]} pathLength={1} vectorEffect="non-scaling-stroke" style={style} />
        const [x, y, rw, rh, r = 6] = k.r
        return <rect key={i} x={x} y={y} width={rw} height={rh} rx={r} pathLength={1} vectorEffect="non-scaling-stroke" style={style} />
      })}
    </svg>
  )
}

/** The wipe's hairline edge. It plays only once focus has actually changed, so nothing sweeps on first paint. */
function WipeEdge({ on }: { on: boolean }) {
  const first = useRef(on)
  const [moved, setMoved] = useState(false)
  useEffect(() => { if (on !== first.current) setMoved(true) }, [on])
  return <span aria-hidden className="wipe-edge" data-on={on || undefined} data-wiped={moved || undefined} />
}

/** In view (not once: the skeleton redraws each time a card comes back into the rail's view). */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return [ref, inView] as const
}

/** A shell in a card: the name and an open link on top, then the picture (or the live tool)
    inset. Only the centred card shows its picture; the rest show a skeleton. The two swap by a
    wipe, not a crossfade: a crossfade between two drawings of one layout double-exposes. Focus is shown by
    size and the picture alone (no crosshairs, Rafael 11 Oct). */
// Thumbnails only: the rail never runs a live shell (Rafael, 11 Oct); "Try the tool" opens it full screen.
// The pictures load eagerly (only the few featured cards ride the rail), so the wipe never reveals an empty well.
function CardedRailCard({ shell: s, theme, delay, focused }: { shell: Shell; theme: string; delay: number; live: boolean; focused: boolean }) {
  const [box, inView] = useInView<HTMLDivElement>()
  const drawn = inView && !focused
  const blueprint = useBlueprint(s.id)
  return (
    <div data-rail-card data-shell-id={s.id}
      // smaller away from the middle, full size at the centre, following the scroll exactly
      className="card-in group relative flex flex-none flex-col bg-[var(--sheet)] shadow-[inset_0_0_0_1px_var(--rule)] [scale:calc(0.86_+_0.14*var(--near,0))] motion-reduce:[scale:1]" style={{ '--card-in-delay': `${delay}ms`, width: CARD_W } as React.CSSProperties}>
      {/* the header: the real name and link when focused; drawn lines standing in for them otherwise,
          on the same timing as the picture and its skeleton */}
      <div className="relative flex items-baseline justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="wipe flex min-w-0 flex-1 items-baseline justify-between gap-4 focus-within:[clip-path:none]" data-on={focused || undefined}>
          <h3 className="truncate font-display text-[22px] leading-tight text-fg">{s.name}</h3>
          <a href={`#/${s.id}`} className="strip flex flex-none items-center gap-1 text-[10.5px] text-fg-muted outline-none transition-colors hover:text-fg focus-visible:text-fg">
            Try the tool<ArrowUpRight size={12} strokeWidth={1.5} />
          </a>
        </div>
        <svg aria-hidden className={cn('skeleton pointer-events-none absolute inset-x-5 top-4 h-[28px] w-[calc(100%-40px)] overflow-visible', !DRAW_SKELETON && 'skeleton-static wipe-out')} data-drawn={drawn || undefined} data-on={focused || undefined}
          fill="none" stroke="var(--rule)" strokeWidth="1" strokeLinecap="round">
          {/* the name: a line about as long as the name, on its x-height */}
          <path d={`M0 15H${Math.min(260, 40 + s.name.length * 10)}`} pathLength={1} style={{ '--in': '480ms', '--out': '50ms' } as React.CSSProperties} />
          {/* the link: a short line and its arrow, at the right */}
          <svg x="100%" overflow="visible"><path d="M-112 15H-22M-14 19L-8 13M-13 13H-8V18" pathLength={1} style={{ '--in': '100ms', '--out': '500ms' } as React.CSSProperties} /></svg>
        </svg>
      </div>
      <div ref={box} className="relative mx-3 mb-3 aspect-[16/10] overflow-hidden shadow-[0_0_0_1px_var(--rule)]">
        <Skeleton drawn={drawn} {...(blueprint ?? {})} />
        {/* the picture wipes in over the skeleton, left to right, behind a hairline edge (RUECA.md §7:
            the new half wipes in like a product); leaving focus runs it back, right to left */}
        <a href={`#/${s.id}`} aria-label={`Try ${s.name}`} data-on={focused || undefined}
          className="wipe absolute inset-0 bg-well outline-none focus-visible:[clip-path:none] focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset">
          <img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="eager" decoding="async" className="absolute inset-0 size-full object-cover" />
        </a>
        <WipeEdge on={focused} />
      </div>
    </div>
  )
}

/* The row's last stop: the rest of the shells as a manual's index of plates, two columns of
   numbered rows (each opens its shell) over a bar that opens the whole catalogue. It behaves
   like the other cards: a hairline drawing of the index while it waits at the edge, then the
   real one wipes in when it reaches the middle. Drawn on the same 1600×1000 board. */
const INDEX_ROWS = 8 // two columns of 8: room for the 16 shells after the three featured
const INDEX_SKELETON: Mark[] = (() => {
  const m: Mark[] = []
  const name = [300, 220, 360, 260, 330, 240, 290, 270, 350, 230, 310, 270, 380, 250, 320, 280]
  for (let c = 0; c < 2; c++) {
    const x0 = 60 + c * 780, w = 700
    const pitch = 742 / INDEX_ROWS // the rows share the same 742 units above the bar, whatever their count
    for (let i = 0; i < INDEX_ROWS; i++) {
      const y = 70 + i * pitch
      m.push({ d: `M${x0} ${y}H${x0 + 36}` }, { d: `M${x0 + 80} ${y}H${x0 + 80 + name[c * INDEX_ROWS + i]}` }, { d: `M${x0 + w - 110} ${y}H${x0 + w}` })
      m.push({ d: `M${x0} ${y + pitch / 2}H${x0 + w}` })
    }
  }
  m.push({ r: [60, 830, 1480, 120, 2] }, { d: 'M110 890H520' }, { d: 'M1440 890H1490M1474 874L1490 890L1474 906' })
  return m
})()

function IndexCard({ rest, first, total, focused }: { rest: Shell[]; first: number; total: number; focused: boolean }) {
  const [box, inView] = useInView<HTMLDivElement>()
  const drawn = inView && !focused
  const rows = rest.slice(0, INDEX_ROWS * 2)
  return (
    <div data-rail-card
      className="card-in group relative flex flex-none flex-col bg-[var(--sheet)] shadow-[inset_0_0_0_1px_var(--rule)] [scale:calc(0.86_+_0.14*var(--near,0))] motion-reduce:[scale:1]" style={{ '--card-in-delay': '360ms', width: CARD_W } as React.CSSProperties}>
      <div className="relative flex items-baseline justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="wipe flex min-w-0 flex-1 items-baseline justify-between gap-4 focus-within:[clip-path:none]" data-on={focused || undefined}>
          <h3 className="truncate font-display text-[22px] leading-tight text-fg">And {rest.length} more</h3>
          <span className="strip flex-none text-[10.5px] text-fg-faint">Plates {String(first).padStart(2, '0')}–{String(total).padStart(2, '0')}</span>
        </div>
        <svg aria-hidden className={cn('skeleton pointer-events-none absolute inset-x-5 top-4 h-[28px] w-[calc(100%-40px)] overflow-visible', !DRAW_SKELETON && 'skeleton-static wipe-out')} data-drawn={drawn || undefined} data-on={focused || undefined}
          fill="none" stroke="var(--rule)" strokeWidth="1" strokeLinecap="round">
          <path d="M0 15H150" pathLength={1} style={{ '--in': '480ms', '--out': '50ms' } as React.CSSProperties} />
          <svg x="100%" overflow="visible"><path d="M-96 15H0" pathLength={1} style={{ '--in': '100ms', '--out': '500ms' } as React.CSSProperties} /></svg>
        </svg>
      </div>
      <div ref={box} className="relative mx-3 mb-3 aspect-[16/10] overflow-hidden shadow-[0_0_0_1px_var(--rule)]">
        <Skeleton drawn={drawn} marks={INDEX_SKELETON} />
        <div data-on={focused || undefined} className="wipe absolute inset-0 flex flex-col bg-[var(--sheet)] px-[3.75%] pt-[1.5%] pb-[5%] focus-within:[clip-path:none]">
          <ol className="grid min-h-0 flex-1 grid-flow-col grid-cols-2 gap-x-[5%]" style={{ gridTemplateRows: `repeat(${INDEX_ROWS}, minmax(0, 1fr))` }}>
            {rows.map((s, i) => (
              <li key={s.id} className="min-h-0 shadow-[inset_0_-1px_var(--rule)]">
                <a href={`#/${s.id}`} className="group/row flex h-full items-center gap-[5%] outline-none transition-colors hover:bg-fg/[0.035] focus-visible:bg-fg/[0.05]">
                  <span className="strip w-6 flex-none text-[10.5px] text-fg-faint">{String(first + i).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 truncate font-display text-[clamp(15px,1.5vw,21px)] leading-none text-fg">{s.name}</span>
                  <span className="strip hidden flex-none text-[10px] text-fg-faint lg:inline">{s.category}</span>
                  <ArrowUpRight size={12} strokeWidth={1.5} className="flex-none text-fg-faint opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100" />
                </a>
              </li>
            ))}
          </ol>
          <a href="#/shells" className="mt-[2.5%] flex h-[12%] min-h-10 flex-none items-center justify-between gap-4 bg-signal-strong px-[3%] text-signal-fg outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sheet)]">
            <span className="font-display text-[clamp(17px,1.7vw,24px)] leading-none">See all {total} shells</span>
            <ArrowRight size={18} strokeWidth={1.5} />
          </a>
        </div>
        <WipeEdge on={focused} />
      </div>
    </div>
  )
}

function BareRailCard({ shell: s, theme, delay, live, focused }: { shell: Shell; theme: string; delay: number; live: boolean; focused: boolean }) {
  // the centred card is in focus: crosshairs mark its corners, like a part picked out on a sheet
  // (no fading or shrinking the others; that transition belonged to the old look)
  const marks = cn('transition-opacity duration-300 motion-reduce:transition-none', focused ? 'opacity-100' : 'opacity-0')
  return (
    <div data-rail-card data-shell-id={s.id}
      className="card-in group flex flex-none flex-col gap-3.5" style={{ '--card-in-delay': `${delay}ms`, width: CARD_W } as React.CSSProperties}>
      <div className="relative">
      <div className="panel relative aspect-[16/10] overflow-hidden rounded-none!">
        {/* thumbnail: always there, so loading and leaving never flash empty */}
        <a href={`#/${s.id}`} tabIndex={live ? -1 : 0} aria-label={`Open ${s.name}`}
          className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset">
          <img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        </a>
        {/* the centred card runs the real shell on top — one live at a time */}
        {live && <LiveFrame id={s.id} name={s.name} />}
      </div>
      {/* the focus marks sit outside the clipped panel */}
      <span aria-hidden className={marks}>
        <Cross x="0px" /><Cross x="calc(100% - 1px)" /><Cross x="0px" y="calc(100% - 1px)" /><Cross x="calc(100% - 1px)" y="calc(100% - 1px)" />
      </span>
      </div>
      <a href={`#/${s.id}`} className={cn('flex items-center justify-between gap-3 rounded-[6px] px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-signal')}>
        <span className="truncate text-[15px] font-medium text-fg">{s.name}</span>
        <span className="flex flex-none items-center gap-1 text-[12.5px] text-fg-faint transition-colors group-hover:text-fg">
          {live && <span className="hidden sm:inline">Full screen</span>}<ArrowUpRight size={14} strokeWidth={1.5} />
        </span>
      </a>
    </div>
  )
}

/* ── phones: a native swipe row, no pinning, cards not clickable ─────── */

function SwipeRow({ shells, rest, theme, head, strip }: { shells: Shell[]; rest: Shell[]; theme: string; head: React.ReactNode; strip?: React.ReactNode }) {
  return (
    <section id="shells" data-section="shells" className="scroll-mt-16">
      {strip}
      <Row className="py-14">
      <div className="px-5 sm:px-6">
        {head}
        <a href="#/shells" className="mt-4 inline-flex items-center gap-1 text-[13px] text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">All shells<ArrowUpRight size={13} strokeWidth={1.5} /></a>
      </div>
      <div className="mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {shells.map((s) => (
          // not links: the shells aren't built for phones, so here they're pictures only
          <div key={s.id} data-shell-id={s.id} className={cn('flex w-[78vw] flex-none snap-start flex-col', CARDED ? 'shadow-[inset_0_0_0_1px_var(--rule)]' : 'gap-2.5')}>
            {CARDED && <div className="px-4 pt-3.5 pb-3"><span className="block truncate font-display text-[19px] leading-tight text-fg">{s.name}</span></div>}
            <div className={cn('relative aspect-[16/10] overflow-hidden', CARDED ? 'mx-2.5 bg-well shadow-[0_0_0_1px_var(--rule)]' : 'panel rounded-none!')}>
              <img src={rail(s.id, theme)} alt={`${s.name}, a ${s.category.toLowerCase()} tool built with the kit`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            </div>
            {CARDED ? <div className="h-2.5" /> : <span className="truncate text-[14px] font-medium text-fg">{s.name}</span>}
          </div>
        ))}
        {rest.length > 0 && (
          <a href="#/shells" className="flex w-[60vw] flex-none snap-start flex-col justify-between bg-signal-strong p-4 text-signal-fg outline-none focus-visible:ring-2 focus-visible:ring-fg">
            <span className="strip text-[10.5px] opacity-70">+{rest.length} more</span>
            <span className="flex items-end justify-between gap-3 font-display text-[22px] leading-[1.05]">See all {shells.length + rest.length} shells<ArrowRight size={18} strokeWidth={1.5} className="mb-0.5 flex-none" /></span>
          </a>
        )}
      </div>
      </Row>
    </section>
  )
}
