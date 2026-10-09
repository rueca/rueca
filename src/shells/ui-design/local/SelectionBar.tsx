/* ---------------------------------------------------------------------------
   SelectionBar (kit candidate) — Affinity's selection-aware context toolbar.

     <SelectionBar anchor={screenRect}>
       <IconButton … /> <SelectionBar.Divider /> …
     </SelectionBar>

   Floats centred under the selection (above it when there is no room),
   clamped inside its positioned parent. Only the 3–6 actions that make sense
   for THIS selection go in it; the inspector stays the complete surface.
   Place it inside a `position: relative` overlay that covers the stage.
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function SelectionBar({ anchor, children, gap = 34 }: { anchor: { x: number; y: number; w: number; h: number }; children: ReactNode; gap?: number }) {
  const el = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    const node = el.current
    const parent = node?.offsetParent as HTMLElement | null
    if (!node || !parent) return
    const W = parent.clientWidth, H = parent.clientHeight
    const w = node.offsetWidth, h = node.offsetHeight
    let top = anchor.y + anchor.h + gap
    if (top + h > H - 56) top = anchor.y - h - 30
    if (top < 8) top = Math.min(H - h - 56, Math.max(8, anchor.y + 8))
    const left = Math.min(W - w - 8, Math.max(8, anchor.x + anchor.w / 2 - w / 2))
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }))
  })
  return (
    <div
      ref={el}
      role="toolbar"
      aria-label="Selection actions"
      data-chrome
      onPointerDown={(e) => e.stopPropagation()}
      className="cluster pointer-events-auto absolute flex h-9 items-center gap-0.5 px-1 transition-opacity duration-150"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, opacity: pos ? 1 : 0 }}
    >
      {children}
    </div>
  )
}

SelectionBar.Divider = function SelectionBarDivider() {
  return <div className="mx-0.5 h-4 w-px bg-line" />
}
