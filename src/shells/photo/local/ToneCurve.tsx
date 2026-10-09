/* ---------------------------------------------------------------------------
   ToneCurve — a point curve editor (Lightroom / Photoshop Curves), as
   opposed to the kit's CurveEditor, which edits one cubic-bezier easing.

     <ToneCurve value={[[0,0],[0.25,0.2],[1,1]]} onChange={(pts, final) => …} color="#ff5a5a" histogram={bins} />

   - Click the graph to add a point there, then drag it. Endpoints move only
     vertically (they set the black / white output).
   - Drag a point well outside the graph, double-click it, or press Delete
     to remove it.
   - Every point is a focusable slider: Tab between points, arrows move by
     1/255 (Shift ×10). The Input / Output fields underneath type the
     selected point exactly — the non-drag path (WCAG 2.5.7).
   - The curve is a monotone cubic (Fritsch–Carlson), so it never overshoots
     between points; `sampleCurve` exports the same maths for the renderer.
--------------------------------------------------------------------------- */
import { useRef, useState } from 'react'
import { ScrubValue, clamp, cn } from '@kit'

export type CurvePoint = [number, number]

/** Monotone cubic through sorted points; returns n evenly spaced samples of y(x), clamped 0..1. */
export function sampleCurve(points: CurvePoint[], n = 256): Float32Array {
  const pts = [...points].sort((a, b) => a[0] - b[0])
  const out = new Float32Array(n)
  const k = pts.length
  if (k < 2) { for (let i = 0; i < n; i++) out[i] = i / (n - 1); return out }
  const dx: number[] = [], m: number[] = []
  for (let i = 0; i < k - 1; i++) { dx[i] = Math.max(1e-6, pts[i + 1][0] - pts[i][0]); m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i] }
  const t: number[] = new Array(k)
  t[0] = m[0]
  t[k - 1] = m[k - 2]
  for (let i = 1; i < k - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  for (let i = 0; i < k - 1; i++) {
    if (m[i] === 0) { t[i] = t[i + 1] = 0; continue }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b
    if (s > 9) { const q = 3 / Math.sqrt(s); t[i] = q * a * m[i]; t[i + 1] = q * b * m[i] }
  }
  let seg = 0
  for (let j = 0; j < n; j++) {
    const x = j / (n - 1)
    if (x <= pts[0][0]) { out[j] = pts[0][1]; continue }
    if (x >= pts[k - 1][0]) { out[j] = pts[k - 1][1]; continue }
    while (seg < k - 2 && x > pts[seg + 1][0]) seg++
    const h = dx[seg], u = (x - pts[seg][0]) / h
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
    out[j] = clamp(h00 * pts[seg][1] + h10 * h * t[seg] + h01 * pts[seg + 1][1] + h11 * h * t[seg + 1], 0, 1)
  }
  return out
}

export const IDENTITY_CURVE: CurvePoint[] = [[0, 0], [1, 1]]
export const isIdentity = (p: CurvePoint[]) => p.length === 2 && p[0][0] === 0 && p[0][1] === 0 && p[1][0] === 1 && p[1][1] === 1

const Q = (n: number) => Math.round(n * 255) / 255

export function ToneCurve({
  value, onChange, color = 'var(--fg)', histogram, height = 196, label = 'Tone curve',
}: {
  value: CurvePoint[]
  onChange: (pts: CurvePoint[], final: boolean) => void
  color?: string
  /** 256 values, any scale — drawn faint behind the curve */
  histogram?: ArrayLike<number> | null
  height?: number
  label?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState(0)
  const drag = useRef<{ i: number; out: boolean } | null>(null)
  const pts = value
  const s = Math.min(sel, pts.length - 1)

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, outY: Math.max(r.top - e.clientY, e.clientY - r.bottom), r }
  }
  const move = (i: number, x: number, y: number, final: boolean) => {
    const next = pts.map((p) => [...p] as CurvePoint)
    const lo = i === 0 ? 0 : pts[i - 1][0] + 0.01
    const hi = i === pts.length - 1 ? 1 : pts[i + 1][0] - 0.01
    next[i] = [i === 0 ? 0 : i === pts.length - 1 ? 1 : Q(clamp(x, lo, hi)), Q(clamp(y, 0, 1))]
    onChange(next, final)
  }
  const remove = (i: number) => {
    if (i === 0 || i === pts.length - 1) return
    onChange(pts.filter((_, j) => j !== i), true)
    setSel(Math.max(0, i - 1))
  }

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const { x, y } = toLocal(e)
    // add a point between neighbours
    const xi = Q(clamp(x, 0.01, 0.99))
    let at = pts.findIndex((p) => p[0] > xi)
    if (at <= 0) at = pts.length - 1
    if (pts.some((p) => Math.abs(p[0] - xi) < 0.02)) return
    const next = [...pts.slice(0, at), [xi, Q(clamp(y, 0, 1))] as CurvePoint, ...pts.slice(at)]
    onChange(next, false)
    setSel(at)
    drag.current = { i: at, out: false }
    box.current!.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const { x, y, outY } = toLocal(e)
    d.out = outY > 36 && d.i !== 0 && d.i !== pts.length - 1
    move(d.i, x, y, false)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    box.current?.releasePointerCapture(e.pointerId)
    if (d.out) remove(d.i)
    else onChange(pts, true)
  }

  const curve = sampleCurve(pts, 96)
  const path = Array.from(curve, (y, i) => `${i ? 'L' : 'M'}${(i / 95) * 100},${(1 - y) * 100}`).join(' ')
  let histPath = ''
  if (histogram && histogram.length) {
    let max = 0
    for (let i = 2; i < histogram.length - 2; i++) max = Math.max(max, histogram[i])
    const n = histogram.length
    histPath = `M0,100 ` + Array.from({ length: n }, (_, i) => `L${(i / (n - 1)) * 100},${100 - Math.min(1, Math.sqrt(histogram[i] / (max || 1))) * 92}`).join(' ') + ' L100,100 Z'
  }
  const cur = pts[s]

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        ref={box}
        role="group"
        aria-label={label}
        className="relative w-full touch-none cursor-crosshair rounded-[6px] bg-control shadow-[inset_0_0_0_1px_var(--line)]"
        style={{ height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
          {histPath && <path d={histPath} fill="var(--fg-faint)" opacity={0.18} />}
          {[25, 50, 75].map((g) => (
            <g key={g}>
              <line x1={g} x2={g} y1={0} y2={100} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
              <line y1={g} y2={g} x1={0} x2={100} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          <line x1={0} y1={100} x2={100} y2={0} stroke="var(--line-strong)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
        </svg>
        {pts.map((p, i) => (
          <button
            key={i}
            type="button"
            role="slider"
            aria-label={i === 0 ? 'Black point' : i === pts.length - 1 ? 'White point' : `Point ${i}`}
            aria-valuemin={0}
            aria-valuemax={255}
            aria-valuenow={Math.round(p[1] * 255)}
            aria-valuetext={`Input ${Math.round(p[0] * 255)}, output ${Math.round(p[1] * 255)}`}
            onPointerDown={(e) => { e.stopPropagation(); setSel(i); drag.current = { i, out: false }; box.current!.setPointerCapture(e.pointerId) }}
            onDoubleClick={(e) => { e.stopPropagation(); remove(i) }}
            onFocus={() => setSel(i)}
            onKeyDown={(e) => {
              const st = (e.shiftKey ? 10 : 1) / 255
              const k = e.key
              if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); e.stopPropagation(); remove(i); return }
              const d = { ArrowUp: [0, st], ArrowDown: [0, -st], ArrowRight: [st, 0], ArrowLeft: [-st, 0] }[k]
              if (!d) return
              e.preventDefault()
              e.stopPropagation()
              move(i, p[0] + d[0], p[1] + d[1], true)
            }}
            className={cn(
              'absolute size-3 -translate-1/2 rounded-full border-2 outline-none focus-visible:ring-2 focus-visible:ring-signal',
              s === i ? 'border-[var(--panel)] shadow-[0_0_0_1.5px_var(--signal)]' : 'border-[var(--panel)]',
            )}
            style={{ left: `${p[0] * 100}%`, top: `${(1 - p[1]) * 100}%`, background: s === i ? 'var(--signal)' : color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-fg-faint">
        <span>Input</span>
        <ScrubValue boxed align="left" value={Math.round(cur[0] * 255)} min={0} max={255} step={1} label="Input" className="flex-1"
          disabled={s === 0 || s === pts.length - 1} onChange={(n, f) => move(s, n / 255, cur[1], f)} />
        <span className="pl-1">Output</span>
        <ScrubValue boxed align="left" value={Math.round(cur[1] * 255)} min={0} max={255} step={1} label="Output" className="flex-1"
          onChange={(n, f) => move(s, cur[0], n / 255, f)} />
      </div>
    </div>
  )
}
