/* The site nav, shared by the landing page and the shells page. A plain bar at
   the top, plus a floating glass pill that slides in once you scroll past it.
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
  const [floating, setFloating] = useState(false)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () => setFloating(el.scrollTop > 96)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [scroller])

  return (
    <>
      {/* the top bar is the sheet's own header strip: same rails, ruled cells, a closing rule */}
      <header>
        <Sheet>
          <div className="h-3" />
          <Row>
            <div className="divide-rule no-cross flex h-14 items-stretch"><SheetNavItems scroller={scroller} /></div>
          </Row>
          <Row />
        </Sheet>
      </header>
      <div inert={!floating}
        className={cn('fixed top-3 left-1/2 z-30 w-[80%] max-w-[calc((1120px-4rem)*0.8)] -translate-x-1/2 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          floating ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-[calc(100%+12px)] opacity-0')}>
        <div className="flex h-12 items-center justify-between gap-4 bg-field/70 pr-2 pl-4 shadow-[inset_0_0_0_1px_var(--line),0_10px_30px_-14px_rgb(0_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150">
          <NavItems scroller={scroller} pill />
        </div>
      </div>
    </>
  )
}

function NavItems({ scroller, pill }: { scroller: React.RefObject<HTMLDivElement | null>; pill?: boolean }) {
  const item = cn('h-8 px-2.5 text-[13px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', pill ? 'rounded-none' : 'rounded-[7px]')
  const toTop = (e: React.MouseEvent) => { e.preventDefault(); scroller.current?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
  return (
    <>
      <a href="#/" onClick={(e) => { if (onLanding()) toTop(e) }}
        className="flex items-center gap-2 rounded-[6px] text-[13.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-signal">
        <Logo height={18} />
      </a>
      <nav aria-label={pill ? 'Floating' : 'Main'} className="flex items-center gap-0.5">
        <a href="#/shells" onClick={(e) => { if (location.hash.startsWith('#/shells')) toTop(e) }} className={cn(item, 'hidden items-center md:flex')}>Shells</a>
        <button type="button" onClick={() => goToSection('install')} className={cn(item, 'hidden md:block')}>Install</button>
        <a href={links.repo} className={cn(item, 'flex items-center gap-1')}>
          GitHub<ArrowUpRight size={12} strokeWidth={1.5} />
        </a>
        <ThemeButton className={pill ? 'rounded-none' : undefined} />
      </nav>
    </>
  )
}

/** The header strip's items: the logo in the wide cell (on the content's inset), then one
    ruled cell per link in printed small caps, and the theme switch in the last cell. */
function SheetNavItems({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) {
  const cell = 'strip flex items-center gap-1 px-4 text-[11px] text-fg-muted outline-none transition-colors hover:bg-fg/[0.035] hover:text-fg focus-visible:bg-fg/[0.05] focus-visible:text-fg sm:px-6'
  const toTop = (e: React.MouseEvent) => { e.preventDefault(); scroller.current?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
  return (
    <>
      <a href="#/" onClick={(e) => { if (onLanding()) toTop(e) }} aria-label="Rueca home"
        className="flex min-w-0 flex-1 items-center px-5 outline-none focus-visible:bg-fg/[0.05] sm:px-6">
        <Logo height={18} />
      </a>
      <a href="#/shells" onClick={(e) => { if (location.hash.startsWith('#/shells')) toTop(e) }} className={cn(cell, 'hidden md:flex')}>Shells</a>
      <button type="button" onClick={() => goToSection('install')} className={cn(cell, 'hidden md:flex')}>Install</button>
      <a href={links.repo} className={cell}>GitHub<ArrowUpRight size={11} strokeWidth={1.5} /></a>
      <span className="flex w-14 flex-none items-center justify-center"><ThemeButton /></span>
    </>
  )
}
