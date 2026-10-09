/* ---------------------------------------------------------------------------
   Guides — draws smart-guide lines and ⌥ measurements from ./snap in screen
   space, so they stay 1 px and crisp at any zoom.

     <Stage overlay={<Guides view={cam} guides={guides} measures={measure(a, b)} />}>

   `view` is the camera ({ x, y, zoom }: screen = world × zoom + x/y) —
   useStore(camera) or useCamera().store. Omit it when the coordinates are
   already in screen pixels. Lines use the `rec` token (Figma's red guides);
   pass `tone` to change it. Measurement labels are pills centred on each
   segment; `fmt` formats the number (default: integer, or one decimal).

   Decorative: pointer-events none, aria-hidden. The numbers it shows must
   also be readable in the inspector (X/Y/W/H), never only here.
   (Promoted from shells/ui-design/canvas/Overlay.tsx; pairs with ./snap.ts.)
--------------------------------------------------------------------------- */
import type { Measure, SnapGuide } from './snap'
import { cn } from '../core/cn'

const defaultFmt = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1))

export function Guides({
  view = { x: 0, y: 0, zoom: 1 }, guides = [], measures = [], tone = 'var(--rec)', fmt = defaultFmt, className,
}: {
  view?: { x: number; y: number; zoom: number }
  guides?: SnapGuide[]
  measures?: Measure[]
  tone?: string
  fmt?: (v: number) => string
  className?: string
}) {
  if (!guides.length && !measures.length) return null
  const X = (v: number) => v * view.zoom + view.x
  const Y = (v: number) => v * view.zoom + view.y
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <svg className="absolute inset-0 size-full overflow-visible">
        {guides.map((g, i) => (
          g.axis === 'x'
            ? <line key={`g${i}`} x1={X(g.at)} x2={X(g.at)} y1={Y(g.from)} y2={Y(g.to)} stroke={tone} strokeWidth={1} shapeRendering="crispEdges" />
            : <line key={`g${i}`} y1={Y(g.at)} y2={Y(g.at)} x1={X(g.from)} x2={X(g.to)} stroke={tone} strokeWidth={1} shapeRendering="crispEdges" />
        ))}
        {measures.map((m, i) => (
          <line key={`m${i}`} x1={X(m.x1)} y1={Y(m.y1)} x2={X(m.x2)} y2={Y(m.y2)} stroke={tone} strokeWidth={1} shapeRendering="crispEdges" />
        ))}
      </svg>
      {measures.map((m, i) => (
        <span key={`l${i}`} className="absolute -translate-1/2 rounded-[3px] px-1 tabular text-[10.5px] leading-4 font-medium text-signal-fg"
          style={{ left: (X(m.x1) + X(m.x2)) / 2, top: (Y(m.y1) + Y(m.y2)) / 2, background: tone }}>
          {fmt(m.value)}
        </span>
      ))}
    </div>
  )
}
