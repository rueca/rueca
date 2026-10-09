/* ---------------------------------------------------------------------------
   Masonry — a JS masonry for items whose aspect ratio is KNOWN up front
   (generated images, video thumbs, asset libraries). Column count comes from
   the container width and a target column width; each item goes into the
   shortest column, so order reads left-to-right, top-to-bottom (CSS columns
   read top-to-bottom, which breaks "newest first").

     <Masonry items={images} getKey={(i) => i.id} getAspect={(i) => i.w / i.h}
       columnWidth={260} gap={8} render={(i, box) => <Tile … />} />

   Space is reserved before images load, so nothing jumps.

   Kit candidate: every gallery / asset-browser shell needs this.
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@kit'

export interface MasonryBox { x: number; y: number; w: number; h: number; index: number; column: number }

export function Masonry<T>({
  items, getKey, getAspect, columnWidth = 260, gap = 8, maxColumns = 8, render, className,
}: {
  items: T[]
  getKey: (item: T) => string
  /** width / height */
  getAspect: (item: T) => number
  columnWidth?: number
  gap?: number
  maxColumns?: number
  render: (item: T, box: MasonryBox) => ReactNode
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(0)
  useLayoutEffect(() => {
    const node = el.current!
    setW(node.clientWidth)
    const ro = new ResizeObserver(() => setW(node.clientWidth))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const cols = Math.max(1, Math.min(maxColumns, Math.floor((W + gap) / (columnWidth + gap))))
  const colW = W > 0 ? (W - gap * (cols - 1)) / cols : 0
  const heights = new Array(cols).fill(0)
  const boxes = items.map((it, index) => {
    let c = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.5) c = i
    const h = colW / Math.max(0.1, getAspect(it))
    const box = { x: c * (colW + gap), y: heights[c], w: colW, h, index, column: c }
    heights[c] += h + gap
    return box
  })
  const total = Math.max(0, Math.max(0, ...heights) - gap)

  return (
    <div ref={el} className={cn('relative w-full', className)} style={{ height: total }}>
      {W > 0 && items.map((it, i) => {
        const b = boxes[i]
        return (
          <div key={getKey(it)} className="absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            {render(it, b)}
          </div>
        )
      })}
    </div>
  )
}
