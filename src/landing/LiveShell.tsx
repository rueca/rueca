/* The hero: a real shell, live, with a switcher underneath.
   Same live frame as the shell rail (LiveFrame): the thumbnail shows at once,
   the real shell fades in over it once painted, and it unloads when the hero
   scrolls out of view, so only one live shell runs on the page at a time.
   On a phone it shows the `phone` shell's client view instead.
   On load it rises in after the headline, in the page's reveal language
   (landing.css: data-reveal "head"), and the switcher fades in after it.
   On desktop the switcher runs on a timer (Rafael, 11 Oct): every TURN it moves to the next
   shell, a thin bar filling under the current one. The bar's own CSS animation is the clock
   (its end advances), so pausing is just pausing the animation: while the pointer or focus is
   on the preview or switcher, or the hero is off screen. A click picks a shell and restarts the
   count. No timer with reduced motion. */
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { useTheme } from '@kit/core/theme'
import type { Shell } from '@/gallery/registry'
import { thumb } from '@/gallery/registry'
import { LiveFrame } from './LiveFrame'
import { site } from '@/site.config'

const NATIVE = { w: 1440, h: 900 }
const TURN = 6 // seconds per shell (Rafael)

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return null
}

export function LiveShell({ shells, phone }: { shells: Shell[]; phone?: Shell }) {
  const { theme } = useTheme()
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [id, setId] = useState(shells[0]?.id)
  const [onScreen, setOnScreen] = useState(true)
  const [held, setHeld] = useState(false) // pointer or focus on the preview
  const [turn, setTurn] = useState(0) // restarts the bar on every switch, even back to the same shell
  const [still] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const pick = (next: string) => { setId(next); setTurn((t) => t + 1) }
  const advance = () => pick(shells[(shells.findIndex((s) => s.id === id) + 1) % shells.length].id)

  useEffect(() => {
    const el = wrap.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    // live only while the hero is (mostly) in view
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { root: scrollParent(el), threshold: 0.15 })
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [])

  const narrow = w > 0 && w < 640
  const shell = narrow && phone ? phone : shells.find((s) => s.id === id)
  const current = shell?.id ?? ''
  const box = narrow ? { w, h: Math.round(Math.min(680, w * 1.55)) } : { w, h: Math.round(NATIVE.h * (w / NATIVE.w)) }

  const switcher = !narrow && shells.length > 1 && (
    <div data-reveal="fade" style={{ '--reveal-delay': '1.15s' } as React.CSSProperties} className="mt-6 flex justify-center">
      {/* a strip of ruled cells in printed small caps, like the sheet's header (plain dividers, no crosshairs: it's a control, not the grid) */}
      <div className="flex max-w-full overflow-x-auto shadow-[inset_0_0_0_1px_var(--rule)] [scrollbar-width:none] [&>*+*]:shadow-[inset_1px_0_var(--rule)]" role="group" aria-label="Choose a live shell">
        {shells.map((s) => (
          <button key={s.id} type="button" onClick={() => pick(s.id)} aria-pressed={id === s.id}
            className={cn('strip relative h-9 flex-none px-4 text-[10.5px] transition-colors outline-none focus-visible:text-fg focus-visible:bg-fg/[0.05]',
              id === s.id ? 'bg-fg/[0.06] text-fg' : 'text-fg-faint hover:bg-fg/[0.025] hover:text-fg')}>
            {s.name}
            {/* the timer: fills over TURN seconds, then moves on */}
            {id === s.id && !still && (
              <span key={turn} aria-hidden onAnimationEnd={advance}
                className="hero-turn absolute inset-x-0 bottom-0 h-[2px] origin-left bg-signal"
                style={{ animationDuration: `${TURN}s`, animationPlayState: held || !onScreen ? 'paused' : 'running' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div onPointerOver={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false) }}>
      {/* the window: a minimal browser bar on top of the live tool; the frame and shadow wrap both */}
      <div data-reveal="head" style={{ '--reveal-delay': '0.9s' } as React.CSSProperties} className="shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]">
        {shell && <BrowserBar id={current} query={narrow ? '?client' : ''} />}
        <div ref={wrap} className="relative overflow-hidden bg-field"
          style={{ height: box.h || undefined, aspectRatio: box.h ? undefined : `${NATIVE.w} / ${NATIVE.h}` }}>
          {/* the thumbnail is always underneath: switching and loading never flash empty */}
          <img src={thumb(current, theme)} alt="" aria-hidden fetchPriority="high"
            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
            className="absolute inset-0 size-full object-cover object-top" />
          {w > 0 && onScreen && shell && (
            <LiveFrame key={`${current}${narrow ? '-client' : ''}`} id={current} name={shell.name}
              query={narrow ? '?client' : ''} native={narrow ? box : NATIVE}
              hint={narrow ? 'Tap to try the client view' : undefined} hintAlways={narrow} />
          )}
        </div>
      </div>
      {switcher}
    </div>
  )
}

/* A minimal browser bar (the window chrome product sites put round a live demo), on phones too
   (there it names the client view): three flat
   dots in the brand dyes standing in for close, minimise and full screen, the shell's real
   address in the mono face, and a link to open it full screen. Sheet-toned, one hairline. */
const DOTS = ['#E8582C', '#F2C744', '#2FA57C'] // Achiote, Gualda, Hoja
function BrowserBar({ id, query = '' }: { id: string; query?: string }) {
  const host = site.url.replace(/^https?:\/\//, '')
  return (
    <div className="relative flex h-9 items-center bg-[var(--sheet)] px-3.5 shadow-[inset_0_-1px_var(--rule)]">
      <div aria-hidden className="flex gap-1.5">{DOTS.map((c) => <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}</div>
      <div className="pointer-events-none absolute inset-x-0 flex justify-center">
        <span className="pointer-events-auto flex h-6 max-w-[60%] items-center px-3 font-code text-[11px] text-fg-muted">
          <span className="truncate">{host}<span className="text-fg-faint">/#/</span>{id}<span className="text-fg-faint">{query}</span></span>
        </span>
      </div>
      <a href={`#/${id}${query}`} aria-label="Open full screen" className="ml-auto flex size-6 items-center justify-center rounded-[2px] text-fg-faint outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
        <ArrowUpRight size={13} strokeWidth={1.5} />
      </a>
    </div>
  )
}
