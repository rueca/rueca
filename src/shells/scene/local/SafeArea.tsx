/* ---------------------------------------------------------------------------
   SafeArea — the part of an `overlay` stage that no floating panel covers.

     <Stage fill overlay={
       <SafeArea left={240} right={288} onRect={(r) => engine.setInsets(r)}>
         <ToolDock className="absolute bottom-0 left-1/2 -translate-x-1/2" … />
       </SafeArea>
     }>

   In `layout="overlay"` the artifact is full-bleed under the toolbar and
   side islands, so HUD (tool dock, axis gizmo, zoom pill) and the camera's
   centre of interest must be placed relative to the uncovered region, not the
   window. SafeArea is an absolutely-positioned box with exactly those insets
   (gutter + panel width + gutter), collapsing to the gutter in present mode
   (⌘\). `onRect` reports the insets in px so a renderer can shift its
   projection centre (three: camera.setViewOffset) and frame the subject in
   the visible area rather than behind a panel.

   Pass the same widths you give <Studio leftWidth rightWidth>.
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ReactNode } from 'react'
import { cn, useStudio } from '@kit'

export interface Insets { l: number; r: number; t: number; b: number }

export function SafeArea({
  left = 0, right = 0, toolbar = 36, bottom = 0, children, className, onRect,
}: {
  left?: number
  right?: number
  /** toolbar height; 0 when there is none */
  toolbar?: number
  /** height of a bottom panel, if any */
  bottom?: number
  children?: ReactNode
  className?: string
  onRect?: (insets: Insets) => void
}) {
  const { present } = useStudio()
  const el = useRef<HTMLDivElement>(null)
  const cb = useRef(onRect)
  cb.current = onRect

  useEffect(() => {
    const node = el.current
    const parent = node?.offsetParent as HTMLElement | null
    if (!node || !parent) return
    const report = () => {
      const a = parent.getBoundingClientRect()
      const b = node.getBoundingClientRect()
      cb.current?.({ l: b.left - a.left, r: a.right - b.right, t: b.top - a.top, b: a.bottom - b.bottom })
    }
    const ro = new ResizeObserver(report)
    ro.observe(node)
    ro.observe(parent)
    report()
    return () => ro.disconnect()
  }, [present])

  const g = 'var(--gutter)'
  const style = present
    ? { left: g, right: g, top: g, bottom: g }
    : {
        left: left ? `calc(${g} * 2 + ${left}px)` : g,
        right: right ? `calc(${g} * 2 + ${right}px)` : g,
        top: toolbar ? `calc(${g} * 2 + ${toolbar}px)` : g,
        bottom: bottom ? `calc(${g} * 2 + ${bottom}px)` : g,
      }
  return <div ref={el} className={cn('pointer-events-none absolute [&>*]:pointer-events-auto', className)} style={style}>{children}</div>
}
