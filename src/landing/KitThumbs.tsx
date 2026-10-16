/* Kit card thumbnails: each kit group drawn as one real object in isometric engraving (Anatomy
   skill + Rueca's hatching and hand notes, src/landing/art/KitArt.tsx). The parts come apart as
   the card scrolls up the screen, or on hover (useKitScroll sets --kp, the card's hover sets
   --kh). It's brand art, not the product, so it takes the site's paper and ink (no
   data-studio-embed). */
import { useEffect, type ReactNode, type RefObject } from 'react'
import { cn } from '@kit/core/cn'
import { KitArt } from './art/KitArt'

/** The tile: a faint dot grid that fades out towards the edges. */
function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    // the wrapper isn't clipped, so the crosshair where the tile's bottom rule meets the cell's left rule can overhang
    // (cell-cross: plate.css drops it when that left rule is the sheet's edge)
    <div className="relative">
      <div aria-hidden className={cn('relative aspect-square overflow-hidden bg-fg/[0.025] shadow-[inset_0_-1px_0_var(--rule)]', className)}>
        <div className="relative size-full">{children}</div>
      </div>
      <span aria-hidden className="cross cell-cross" style={{ left: 0, top: 'calc(100% - 1px)' }} />
    </div>
  )
}

export const KIT_THUMBS: Record<string, () => ReactNode> = Object.fromEntries(
  ['Controls', 'Layout', 'Time', 'Structure', 'Workflow', 'Hand-off'].map((g) => [g, () => <Tile><KitArt group={g} /></Tile>]),
)

/** Scroll-drive the thumbnails: each card's --kp runs 0 → 1 as its top travels from
    near the bottom of the screen to a third of the way down. Scrolling back reverses
    it. Written straight to the card's style, so scrolling never re-renders React.
    Reduced motion: every thumbnail just shows its end state. */
export function useKitScroll(grid: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = grid.current
    if (!el) return
    const cards = [...el.children] as HTMLElement[]
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cards.forEach((c) => c.style.setProperty('--kp', '1')); return }
    let scroller: HTMLElement | null = el.parentElement
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement
    const target: HTMLElement | Window = scroller ?? window
    let raf = 0
    const update = () => {
      raf = 0
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      const vh = scroller ? scroller.clientHeight : innerHeight
      for (const c of cards) {
        // driven by the drawing's centre (the tile is square, so its centre is half a card-width down):
        // it starts once the drawing is well into view and lands as it reaches the middle of the screen,
        // so the motion plays while you're looking at it, not on the way in
        const r = c.getBoundingClientRect(), y = r.top - top + r.width / 2
        const p = Math.min(1, Math.max(0, (vh * 0.82 - y) / (vh * 0.34)))
        c.style.setProperty('--kp', p.toFixed(3))
      }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { target.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [grid])
}
