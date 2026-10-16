/* ---------------------------------------------------------------------------
   Icons lucide doesn't have, drawn on its grid (24 × 24, round caps, stroke
   from props) with `createLucideIcon`, so they behave like any lucide icon:
   same props, same `LucideIcon` type, same chrome stroke rules.
   - Grain: scattered dots (after Tabler's `grain`), for film grain / noise
     finishes. Not Sparkles, which reads as AI.
   - Gradient: rules that break up as they fall, a tone fading out.
--------------------------------------------------------------------------- */
import { createLucideIcon } from 'lucide-react'

export const Grain = createLucideIcon('grain', [
  ['circle', { cx: '4.5', cy: '9.5', r: '1', key: 'g1' }],
  ['circle', { cx: '9.5', cy: '4.5', r: '1', key: 'g2' }],
  ['circle', { cx: '9.5', cy: '14.5', r: '1', key: 'g3' }],
  ['circle', { cx: '4.5', cy: '19.5', r: '1', key: 'g4' }],
  ['circle', { cx: '14.5', cy: '9.5', r: '1', key: 'g5' }],
  ['circle', { cx: '19.5', cy: '4.5', r: '1', key: 'g6' }],
  ['circle', { cx: '14.5', cy: '19.5', r: '1', key: 'g7' }],
  ['circle', { cx: '19.5', cy: '14.5', r: '1', key: 'g8' }],
])

export const Gradient = createLucideIcon('gradient', [
  ['path', { d: 'M3 5h18', key: 'r1' }],
  ['path', { d: 'M3 10h7M14 10h7', key: 'r2' }],
  ['path', { d: 'M3 15h3M9 15h6M18 15h3', key: 'r3' }],
  ['path', { d: 'M3 20h1M8 20h2M14 20h2M20 20h1', key: 'r4' }],
])
