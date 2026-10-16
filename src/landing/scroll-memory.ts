/* The landing and the gallery scroll inside a div, so the browser's own scroll restoration never sees them:
   Back from a shell put you at the top of a ~6000px page. The scroll position is kept on this page's history
   entry instead (debounced replaceState, so Safari's rate limit is never hit), and read back when the entry is
   shown again. A fresh visit has no state, so it starts at the top. */
import { useEffect, type RefObject } from 'react'

export function useScrollMemory(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const saved = (history.state as { scroll?: number } | null)?.scroll
    let raf = 0, tries = 0
    // lazy sections grow the page after mount: retry until it's tall enough (or give up after ~1s)
    const restore = () => {
      if (saved == null) return
      if (el.scrollHeight - el.clientHeight >= saved || ++tries > 60) el.scrollTop = saved
      else raf = requestAnimationFrame(restore)
    }
    restore()
    let t = 0
    const onScroll = () => {
      clearTimeout(t)
      t = window.setTimeout(() => { try { history.replaceState({ ...(history.state ?? {}), scroll: el.scrollTop }, '') } catch { /* rate-limited */ } }, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); clearTimeout(t); el.removeEventListener('scroll', onScroll) }
  }, [ref])
}
