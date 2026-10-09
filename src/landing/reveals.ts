/* Scroll reveals (trove.quest's): mark <html data-reveals>, then set data-in on
   each [data-reveal] element the first time it enters the landing's scroller.
   The CSS in landing.css does the rest. New elements (layouts that swap at a
   breakpoint) are picked up by a MutationObserver. */
import { useEffect, type RefObject } from 'react'

export function useReveals(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    html.setAttribute('data-reveals', '')
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target) }
      // a small fixed margin, not a %: on a tall window a % margin is taller than the
      // last things on the page, so they could never come "into view" and stayed hidden
    }, { root: el, rootMargin: '0px 0px -24px 0px', threshold: 0.12 })
    const scan = () => el.querySelectorAll('[data-reveal]:not([data-in])').forEach((n) => io.observe(n))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(el, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); html.removeAttribute('data-reveals') }
  }, [root])
}
