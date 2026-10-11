/* The site nav, shared by the landing page and the shells page: the sheet's own header
   strip, at the very top of the page. It pins there as soon as the page scrolls (sticky)
   and, once pinned, its paper and bottom rule grow
   out across the gutters to the window's edges, so the parts of the page that break the
   sheet (the hero's live tool, the shell rail's cards) pass under it, never beside it.
   On the landing page the links scroll in place; elsewhere they go to the
   landing page first (Install is remembered and scrolled to on arrival). */
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { Logo, ThemeButton, scrollToSection } from './parts'
import { Row, Sheet } from './plate'
import { links } from './content'

const onLanding = () => location.hash.replace(/^#\/?/, '').split(/[?&#]/)[0] === ''

/* The section a link on another page asked for. Kept in memory (hash routing never
   reloads the page) and only cleared once it has been scrolled to, so React running
   effects twice in development can't swallow it. */
let pending: string | null = null

/** Landing page: jump to a section a SiteNav link on another page asked for. */
export function usePendingSection() {
  useEffect(() => {
    if (!pending) return
    const t = setTimeout(() => { // after the first layout, so pinned sections have their real heights
      document.querySelector(`[data-section="${pending}"]`)?.scrollIntoView({ block: 'start' })
      pending = null
    }, 350)
    return () => clearTimeout(t)
  }, [])
}

function goToSection(id: string) {
  if (document.querySelector(`[data-section="${id}"]`)) { scrollToSection(id); return }
  pending = id
  location.hash = '#/'
}

export function SiteNav({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    // the strip starts at the very top, so it's pinned as soon as the page has scrolled at all
    const update = () => setStuck(el.scrollTop > 0)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [scroller])

  return (
    <header data-stuck={stuck || undefined} className="site-nav sticky top-0 z-30">
      {/* the paper behind the strip: clipped to the sheet at rest, the full window once pinned */}
      <div aria-hidden className="site-nav-paper absolute inset-0" />
      <Sheet>
        {/* no top rule; the closing rule below draws in only once the strip pins (plate.css) */}
        <div className="flex h-14 items-center gap-3 pr-3 sm:pr-4"><SheetNavItems scroller={scroller} /></div>
        <Row />
      </Sheet>
    </header>
  )
}

/** The header strip's items: the logo (on the content's inset), then the links in printed
    small caps and the theme switch, all the same compact chip with the theme button's hover. */
function SheetNavItems({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) {
  const cell = 'strip flex h-8 items-center gap-1 rounded-[2px] px-3 text-[11px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal'
  const toTop = (e: React.MouseEvent) => { e.preventDefault(); scroller.current?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
  return (
    <>
      <a href="#/" onClick={(e) => { if (onLanding()) toTop(e) }} aria-label="Rueca home"
        className="flex h-full min-w-0 flex-1 items-center px-5 outline-none focus-visible:bg-fg/[0.05] sm:px-6">
        <Logo height={18} />
      </a>
      <a href="#/shells" onClick={(e) => { if (location.hash.startsWith('#/shells')) toTop(e) }} className={cn(cell, 'hidden md:flex')}>Shells</a>
      <button type="button" onClick={() => goToSection('install')} className={cn(cell, 'hidden md:flex')}>Install</button>
      <a href={links.repo} className={cell}>GitHub<ArrowUpRight size={11} strokeWidth={1.5} /></a>
      <ThemeButton />
    </>
  )
}
