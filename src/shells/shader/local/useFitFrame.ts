/* ---------------------------------------------------------------------------
   useFitFrame — place a fixed-aspect frame inside a full-bleed stage, clear
   of the floating chrome (overlay layout). `<Stage fill>` has no notion of
   an output frame, and the overlay panels sit ON the stage, so a naive
   centre lands the artwork under the inspector.

     const frame = useFitFrame(stageRef, 16 / 9, { top: 60, left: 296, right: 304, bottom: 64 })
     <canvas style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} />

   aspect = null → the frame is the whole stage (full-bleed).
   If the insets leave too little room (narrow window) they are ignored.
--------------------------------------------------------------------------- */
import { useLayoutEffect, useState, type RefObject } from 'react'

export interface Insets { top: number; right: number; bottom: number; left: number }
export interface FrameRect { x: number; y: number; w: number; h: number; stageW: number; stageH: number }

export function useFitFrame(ref: RefObject<HTMLElement | null>, aspect: number | null, insets: Insets, pad = 16): FrameRect {
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])

  if (!aspect) return { x: 0, y: 0, w: box.w, h: box.h, stageW: box.w, stageH: box.h }
  let ins = insets
  if (box.w - ins.left - ins.right < box.w * 0.35 || box.h - ins.top - ins.bottom < 160) ins = { top: 0, right: 0, bottom: 0, left: 0 }
  const aw = Math.max(1, box.w - ins.left - ins.right - pad * 2)
  const ah = Math.max(1, box.h - ins.top - ins.bottom - pad * 2)
  const w = Math.min(aw, ah * aspect)
  const h = w / aspect
  return { x: Math.round(ins.left + pad + (aw - w) / 2), y: Math.round(ins.top + pad + (ah - h) / 2), w: Math.round(w), h: Math.round(h), stageW: box.w, stageH: box.h }
}
