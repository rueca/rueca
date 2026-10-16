/* ---------------------------------------------------------------------------
   One label column per panel. Every <Row> with a text label reports its width
   to the nearest <LabelScope>, which sets --label-fit to the widest; rows read
   it (capped at 42% of the row). <Panel> is a scope, so hand-built rows and any
   number of <Inspector>s in one panel line up; an <Inspector> outside a panel
   is its own scope. Rows that aren't rendered (a `when` that's false) don't
   count, so hidden params never widen the column.
--------------------------------------------------------------------------- */
import { createContext, useContext, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { useDensityPx } from '../core/density'

type Scope = { set: (id: string, w: number) => void; drop: (id: string) => void }
const Ctx = createContext<Scope | null>(null)
export const useLabelScope = () => useContext(Ctx)

export function LabelScope({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const [fit, setFit] = useState(0)
  const widths = useRef(new Map<string, number>())
  const scope = useMemo<Scope>(() => {
    const update = () => { const w = Math.max(0, ...widths.current.values()); setFit((p) => (p === w ? p : w)) }
    return { set: (id, w) => { widths.current.set(id, w); update() }, drop: (id) => { widths.current.delete(id); update() } }
  }, [])
  return (
    <Ctx.Provider value={scope}>
      <div className={className} style={fit ? ({ ...style, '--label-fit': `${fit}px` } as CSSProperties) : style}>{children}</div>
    </Ctx.Provider>
  )
}

/* fonts: measure again once the UI face has loaded, or the first numbers come from the fallback */
let fontsReady = typeof document === 'undefined' || !document.fonts
const fontSubs = new Set<() => void>()
if (!fontsReady) document.fonts.ready.then(() => { fontsReady = true; fontSubs.forEach((f) => f()) })
const useFontsReady = () => useSyncExternalStore((cb) => { fontSubs.add(cb); return () => { fontSubs.delete(cb) } }, () => fontsReady, () => true)

let ctx: CanvasRenderingContext2D | null = null
/** A label's width at the UI text size and label weight, plus room for the changed dot. */
export function measureLabel(text: string, size: number) {
  ctx ??= document.createElement('canvas').getContext('2d')
  if (!ctx) return 0
  ctx.font = `450 ${size}px InterVariable, "Inter Variable", system-ui, sans-serif`
  return Math.ceil(ctx.measureText(text).width + 10) // dot (4) + gap (4) + slack
}

/** Report this label to the nearest scope while it's on screen. */
export function useReportLabel(text: string | null) {
  const scope = useContext(Ctx)
  const id = useId()
  const size = useDensityPx('--ui-text', 11)
  const fonts = useFontsReady()
  useLayoutEffect(() => {
    if (!scope || !text) return
    scope.set(id, measureLabel(text, size))
    return () => scope.drop(id)
  }, [scope, id, text, size, fonts])
}
