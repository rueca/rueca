/* The kit cards' drawings, made with the Anatomy skill and Rueca's engraving layer: each kit
   group as one real object on one plate, at the same scale, marked up in the hand. Parts come apart with the
   card's scroll/hover progress (--kp, --kh) in pure CSS, and the pen writes its notes and draws
   its arrows on the same progress (handwrite.ts, usePenMarks). The markup and its styles are
   generated: edit brand/illustration-trials/anatomy/<name>.mjs and run it with --landing. */
import { useRef } from 'react'
import './iso.css'
import { usePenMarks } from '../handwrite'
import { CONTROLS_SVG } from './controls'
import { LAYOUT_SVG } from './layout'
import { TIME_SVG } from './time'
import { STRUCTURE_SVG } from './structure'
import { WORKING_SVG } from './working'
import { HANDOFF_SVG } from './handoff'

const ART: Record<string, string> = { Controls: CONTROLS_SVG, Layout: LAYOUT_SVG, Time: TIME_SVG, Structure: STRUCTURE_SVG, Working: WORKING_SVG, 'Hand-off': HANDOFF_SVG }

/** the drawing for a kit group */
export function KitArt({ group }: { group: string }) {
  const svg = ART[group], ref = useRef<HTMLDivElement>(null)
  usePenMarks(ref)
  // drawn at 90% of the tile (Rafael, 11 Oct): the objects and their notes shrink together about the centre
  return svg ? <div ref={ref} className="rueca-iso size-full scale-90" dangerouslySetInnerHTML={{ __html: svg }} /> : null
}
