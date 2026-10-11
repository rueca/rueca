/* "How it works": one drawing that the three steps build in turn (Anatomy skill + Rueca
   engraving, like the kit cards). You ask an agent for a prototype to animate your logo, it
   builds the motion editor around it, your logo drops onto the artboard, and you scrub it.
   Each step runs on its own progress, --s1 … --s3 (0–1), and its pen notes are written on it
   (handwrite.ts, usePenMarks). Generated: edit
   brand/illustration-trials/anatomy/steps.mjs and run it with --landing. */
import { useRef, type CSSProperties, type Ref } from 'react'
import './iso.css'
import { usePenMarks } from '../handwrite'
import { BUILDUP_SVG } from './buildup'

/** The build-up, scroll-driven: the page writes --s1 … --s3 straight onto `el` as you scroll. */
export function BuildArt({ el }: { el?: Ref<HTMLDivElement> }) {
  return <div ref={el} className="rueca-iso size-full"><Drawing /></div>
}
// the drawing itself, with its pen marks written (the progress is set on the wrapper)
function Drawing() {
  const ref = useRef<HTMLDivElement>(null)
  usePenMarks(ref)
  return <div ref={ref} className="size-full" dangerouslySetInnerHTML={{ __html: BUILDUP_SVG }} />
}

/** One step of the same drawing, for the three-plate variant: the steps before it are done,
    and its own progress runs 0 → 1 when the deck makes it active (registered custom
    properties, so the change animates). */
export function StepArt({ i, active }: { i: number; active: boolean }) {
  const s = (n: number) => (n < i ? 1 : n === i && active ? 1 : 0)
  const style = { '--s1': s(0), '--s2': s(1), '--s3': s(2), transition: '--s1 1.8s ease-in-out, --s2 1.8s ease-in-out, --s3 1.8s ease-in-out' } as CSSProperties
  return <div className="rueca-iso size-full" style={style}><Drawing /></div>
}
