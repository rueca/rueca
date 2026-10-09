/* ---------------------------------------------------------------------------
   useFitFrame — place a fixed-aspect output frame inside a full-bleed stage,
   clear of the floating chrome. In the overlay layout the panels sit ON the
   stage, so a naive centre lands the artwork under the inspector; this
   centres it in the uncovered rect instead (Spline / Unicorn Studio /
   shader tools with a 16:9 or 9:16 export frame).

     const wrap = useRef<HTMLDivElement>(null)
     const frame = useFitFrame(wrap, 16 / 9)                 // insets from useSafeArea()
     <div ref={wrap} className="absolute inset-0">
       <canvas style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} className="absolute" />
     </div>

   aspect = null → the frame is the whole element (full-bleed "Fill").
   Insets default to the Studio's safe area (what the overlay panels cover),
   so present mode (⌘\) and resized panels just work; pass `insets` to
   override. `pad` is the breathing room inside the free rect. When the
   insets leave too little room (a narrow window) they are ignored rather
   than squeezing the frame to nothing. Assumes the element fills the
   stage (the usual `absolute inset-0` inside <Stage fill>).
   Returns whole pixels: { x, y, w, h, stageW, stageH }.
   (Promoted from shells/shader/local/useFitFrame.ts.)
--------------------------------------------------------------------------- */
import { useLayoutEffect, useState, type RefObject } from 'react'
import { useSafeArea, type SafeArea } from '../layout/Studio'

export interface FitFrame { x: number; y: number; w: number; h: number; stageW: number; stageH: number }

export function fitFrame(box: { w: number; h: number }, aspect: number | null, insets: SafeArea, pad = 16): FitFrame {
  if (!aspect) return { x: 0, y: 0, w: box.w, h: box.h, stageW: box.w, stageH: box.h }
  let ins = insets
  if (box.w - ins.left - ins.right < box.w * 0.35 || box.h - ins.top - ins.bottom < 160) ins = { top: 0, right: 0, bottom: 0, left: 0 }
  const aw = Math.max(1, box.w - ins.left - ins.right - pad * 2)
  const ah = Math.max(1, box.h - ins.top - ins.bottom - pad * 2)
  const w = Math.min(aw, ah * aspect)
  const h = w / aspect
  return { x: Math.round(ins.left + pad + (aw - w) / 2), y: Math.round(ins.top + pad + (ah - h) / 2), w: Math.round(w), h: Math.round(h), stageW: box.w, stageH: box.h }
}

export function useFitFrame(ref: RefObject<HTMLElement | null>, aspect: number | null, opts: { insets?: Partial<SafeArea>; pad?: number } = {}): FitFrame {
  const safe = useSafeArea()
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setBox((b) => (b.w === el.clientWidth && b.h === el.clientHeight ? b : { w: el.clientWidth, h: el.clientHeight }))
    const ro = new ResizeObserver(read)
    ro.observe(el)
    read()
    return () => ro.disconnect()
  }, [ref])
  return fitFrame(box, aspect, { ...safe, ...opts.insets }, opts.pad ?? 16)
}
