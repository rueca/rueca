/* "How it works", running: the schema from step 1 rendered by the real
   <Inspector>, driving the draw from step 2 on a real <CanvasSurface>. */
import { CanvasSurface, Inspector, Panel, PanelHeader, HistoryButtons, createClock, createParams, defineSchema, folder, p, Button } from '@kit'
import { RotateCcw } from 'lucide-react'

const schema = defineSchema({
  shape: folder('Shape', {
    count: p.number(24, { min: 3, max: 96, step: 1, hint: 'How many dots.' }),
    radius: p.number(72, { min: 10, max: 140, step: 1, unit: 'px', hint: 'Distance from the centre.' }),
    mode: p.select('radial', ['radial', 'grid', 'spiral'], { hint: 'How the dots are placed.' }),
    tint: p.color('#5b8cff', { alpha: false }),
    spin: p.boolean(true, { hint: 'Rotate over time.' }),
  }),
})

const params = createParams(schema, { id: 'landing-demo', persist: false, url: false })
const clock = createClock({ duration: 8000, loop: true })
type V = ReturnType<typeof params.values>

function place(v: V, i: number, t: number, w: number, h: number): [number, number] {
  const cx = w / 2, cy = h / 2
  const rot = v.spin ? (t / 8000) * Math.PI * 2 : 0
  if (v.mode === 'grid') {
    const cols = Math.ceil(Math.sqrt(v.count))
    const gap = (v.radius * 2) / Math.max(1, cols - 1)
    const x = (i % cols) - (cols - 1) / 2, y = Math.floor(i / cols) - (cols - 1) / 2
    const c = Math.cos(rot * 0.25), s = Math.sin(rot * 0.25)
    return [cx + (x * c - y * s) * gap, cy + (x * s + y * c) * gap]
  }
  if (v.mode === 'spiral') {
    const k = i / v.count
    const a = k * Math.PI * 6 + rot
    return [cx + Math.cos(a) * v.radius * 1.4 * k, cy + Math.sin(a) * v.radius * 1.4 * k]
  }
  const a = (i / v.count) * Math.PI * 2 + rot
  return [cx + Math.cos(a) * v.radius, cy + Math.sin(a) * v.radius]
}

export function LiveDemo() {
  return (
    <div className="grid overflow-hidden rounded-[14px] bg-well md:grid-cols-[1fr_300px]">
      <div className="relative min-h-[300px] md:min-h-[360px]">
        <CanvasSurface params={params} clock={clock} className="absolute inset-0"
          draw={(ctx, { v, t, w, h }) => {
            ctx.clearRect(0, 0, w, h)
            const vv = v as V
            for (let i = 0; i < vv.count; i++) {
              const [x, y] = place(vv, i, t, w, h)
              ctx.globalAlpha = 0.35 + 0.65 * ((i + 1) / vv.count)
              ctx.fillStyle = vv.tint
              ctx.beginPath()
              ctx.arc(x, y, 3.2 + (vv.mode === 'spiral' ? (i / vv.count) * 3 : 1.6), 0, Math.PI * 2)
              ctx.fill()
            }
            ctx.globalAlpha = 1
          }} />
        <div className="absolute bottom-3 left-3.5 text-[11.5px] text-faint">CanvasSurface · drawn from (values, t)</div>
      </div>
      <div className="p-2 md:p-2.5 md:pl-0">
        <Panel className="h-full"
          header={<PanelHeader title="Inspector"><div className="ml-auto flex items-center gap-0.5"><HistoryButtons params={params} /><Button size="icon-sm" aria-label="Reset" onClick={() => params.reset()}><RotateCcw size={13} strokeWidth={1.5} /></Button></div></PanelHeader>}>
          <Inspector params={params} />
          <p className="px-3 pt-1 pb-3 text-[11.5px] leading-relaxed text-faint">Drag a number, double-click a label to reset, ⌘Z to undo. Changed values turn bright.</p>
        </Panel>
      </div>
    </div>
  )
}
