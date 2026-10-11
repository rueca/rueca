/* The sheet's parts (plate.css): the landing as one technical plate (brand/RUECA.md,
   Lámina técnica). Paper.design's exposed grid, redrawn in Rueca's pens: Nogal hairline
   rules, neutral crosshairs where they cross, ruler ticks in the margins, and a title strip
   that numbers every section like a drawing sheet. */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@kit/core/cn'
import { usePen } from './handwrite'
import './plate.css'

/** The sheet: the page's one centred column, with rails and margin rulers. 1128 wide so its
    columns land on whole pixels (it divides by 6, 3 and the 5/12 split), keeping crosshairs crisp. */
export function Sheet({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'main' }) {
  return (
    <As className={cn('sheet relative mx-auto w-[calc(100%-12px)] max-w-[1128px] sm:w-[calc(100%-48px)]', className)}>
      {children}
      {/* the rails sit on top, so a cell with its own background never hides them */}
      <span aria-hidden className="rail left-0" /><span aria-hidden className="rail right-0" />
    </As>
  )
}

/** A crosshair at a point on the sheet: `x` along the row (CSS length), on the row's top rule. */
export function Cross({ x, y = '0px', className }: { x: string; y?: string; className?: string }) {
  return <span aria-hidden className={cn('cross', className)} style={{ left: x, top: y }} />
}

/** A ruled row: hairline on top. Its ends on the rails go unmarked; dividers and cells inside
    it mark their own corners (plate.css), so every crossing gets exactly one crosshair. */
export function Row({ children, className, style, dye, as: As = 'div' }: { children?: ReactNode; className?: string; style?: CSSProperties; dye?: string; as?: 'div' | 'footer' }) {
  return (
    // an empty row is a closing rule: 1px tall, or its inset hairline wouldn't paint
    <As className={cn('rule', !children && 'h-px', className)} style={style} data-dye={dye}>
      {children}
    </As>
  )
}

/** A numbered section of the sheet: its title strip, then its rows. */
export function SheetSection({ id, n, of, label, aside, children }: { id: string; n: number; of: number; label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} data-section={id} className="scroll-mt-16">
      <TitleStrip n={n} of={of} label={label} aside={aside} />
      {children}
    </section>
  )
}

/** Handwriting, as if filled in with a pen: each value leans and sits a little off the
    line (fixed per text, so it never jitters), and writes itself in left to right when it
    scrolls into view, stroke by stroke in the pen's own order (handwrite.ts); `pen={false}` wipes
    it in instead. The printed labels around it are the new half; this is the old. */
export function Hand({ children, className, delay = 0, pen = true }: { children: string; className?: string; delay?: number; pen?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  usePen(ref, children, pen)
  let h = 0
  for (const c of children) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const rot = ((h % 7) - 3) * 0.55
  const dy = ((h >> 4) % 3) - 1
  return (
    <span ref={ref} data-reveal="write" className={cn('font-hand relative inline-block leading-none whitespace-nowrap text-fg/90', className)}
      style={{ transform: `translateY(${dy}px) rotate(${rot}deg)`, '--write': `${Math.min(1.3, 0.3 + children.length * 0.05)}s`, '--reveal-delay': `${delay}s` } as CSSProperties}>
      {/* the inner span is the one clipped: the scroll observer never fires for a target that starts fully clipped */}
      <span className="inline-block">{children}</span>
    </span>
  )
}

/** One field of a printed form: a small-caps label in the corner, the value written in. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('relative flex items-end px-4 pt-7 pb-0.5 sm:px-5', className)}>
      <span className="strip absolute top-1.5 left-2.5 text-[8.5px] text-fg-faint sm:left-3">{label}</span>
      {children}
    </span>
  )
}

/** each opener's handwriting in its own dye, one per sheet (plate.css [data-dye]) */
const DYES = ['achiote', 'gualda', 'hoja', 'cielo', 'malva', 'cochinilla'] as const

/** A section's title strip, like a drawing sheet's title block: printed fields, handwritten values. */
export function TitleStrip({ n, label, of, aside }: { n: number; label: string; of: number; aside?: ReactNode }) {
  return (
    <Row dye={DYES[(n - 1) % DYES.length]} className="divide-rule no-cross flex h-[60px] items-stretch">
      <Field label="No." className="w-14 flex-none sm:w-16"><Hand className="text-[23px]">{String(n)}</Hand></Field>
      <Field label="Title" className="min-w-0 flex-1"><Hand className="text-[24px]" delay={0.15}>{label}</Hand></Field>
      {aside && <span className="strip hidden items-center px-5 text-fg-faint md:flex">{aside}</span>}
      <Field label="Sheet" className="hidden w-24 flex-none sm:flex sm:w-28"><Hand className="text-[23px]" delay={0.35}>{`${n} of ${of}`}</Hand></Field>
    </Row>
  )
}

/** A dimension line in the measure pen: end ticks, arrows, and the measured width in the middle. */
export function DimLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(() => setW(Math.round(el.offsetWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const line = 'h-px flex-1 bg-[var(--measure)]'
  return (
    <div ref={ref} aria-hidden className={cn('items-center gap-2 text-[var(--measure)]', className)}>
      <span className="h-3 w-px bg-[var(--measure)]" />
      <span className="-mr-2 text-[9px] leading-none">◂</span><span className={line} />
      <span className="strip text-[9.5px]">{w ? `${w} px` : ''}</span>
      <span className={line} /><span className="-ml-2 text-[9px] leading-none">▸</span>
      <span className="h-3 w-px bg-[var(--measure)]" />
    </div>
  )
}

/** Cell padding, shared so every cell's text lines up on the same inner margin. */
export const CELL = 'px-5 py-14 sm:px-6 sm:py-20'
