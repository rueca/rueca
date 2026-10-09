/* ---------------------------------------------------------------------------
   Masonry — a JS masonry for items whose aspect ratio is KNOWN up front
   (generated images, video thumbs, asset libraries, moodboards).

     <Masonry items={images} getKey={(i) => i.id} getAspect={(i) => i.w / i.h}
       columnWidth={260} gap={8} render={(i, box) => <Tile … />} />

   Column count comes from the container width and a target column width
   (or `columns` to fix it); each item goes into the shortest column, so the
   order reads left-to-right, top-to-bottom — CSS columns read top-to-bottom,
   which breaks "newest first". Space is reserved before images load, so
   nothing jumps; resizing reflows without remounting items.

   `masonryLayout()` is the same maths without React — use it for keyboard
   navigation (↑/↓ = nearest box in the neighbouring row of the same column)
   or for drawing on a canvas.

   Accessibility: the container is a plain list (role="list" / "listitem"
   by default; pass `role={null}` when items carry their own roles). Focus
   order follows `items` order, which is also the visual reading order.
   (Promoted from shells/generate/local/Masonry.tsx.)
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../core/cn'

export interface MasonryBox { x: number; y: number; w: number; h: number; index: number; column: number }

/** Pure layout: boxes for `aspects` (w / h) in a container `width` wide. */
export function masonryLayout(aspects: number[], width: number, o: { columnWidth?: number; columns?: number; gap?: number; maxColumns?: number } = {}) {
  const gap = o.gap ?? 8
  const cols = Math.max(1, o.columns ?? Math.min(o.maxColumns ?? 8, Math.floor((width + gap) / ((o.columnWidth ?? 260) + gap))))
  const colW = width > 0 ? (width - gap * (cols - 1)) / cols : 0
  const heights = new Array(cols).fill(0)
  const boxes: MasonryBox[] = aspects.map((a, index) => {
    let c = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.5) c = i
    const h = colW / Math.max(0.1, a || 1)
    const box = { x: c * (colW + gap), y: heights[c], w: colW, h, index, column: c }
    heights[c] += h + gap
    return box
  })
  return { boxes, columns: cols, columnWidth: colW, height: Math.max(0, Math.max(0, ...heights) - gap) }
}

export interface MasonryProps<T> {
  items: T[]
  getKey: (item: T) => string
  /** width / height */
  getAspect: (item: T) => number
  /** target column width; the real width stretches to fill */
  columnWidth?: number
  /** fixed column count (overrides columnWidth) */
  columns?: number
  gap?: number
  maxColumns?: number
  render: (item: T, box: MasonryBox) => ReactNode
  role?: 'list' | 'grid' | null
  className?: string
}

export function Masonry<T>({
  items, getKey, getAspect, columnWidth = 260, columns, gap = 8, maxColumns = 8, render, role = 'list', className,
}: MasonryProps<T>) {
  const el = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(0)
  useLayoutEffect(() => {
    const node = el.current!
    setW(node.clientWidth)
    const ro = new ResizeObserver(() => setW(node.clientWidth))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const { boxes, height } = masonryLayout(items.map(getAspect), W, { columnWidth, columns, gap, maxColumns })

  return (
    <div ref={el} role={role ?? undefined} className={cn('relative w-full', className)} style={{ height }}>
      {W > 0 && items.map((it, i) => {
        const b = boxes[i]
        return (
          <div key={getKey(it)} role={role === 'list' ? 'listitem' : undefined} className="absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            {render(it, b)}
          </div>
        )
      })}
    </div>
  )
}
