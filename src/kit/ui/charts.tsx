/* ---------------------------------------------------------------------------
   Image charts — Histogram and ToneCurve (Lightroom / Photoshop / Capture One).

   Histogram — RGB + luma distribution with clipping triangles.

     <Histogram bins={histogramBins(rgbaPixels)} clip={{ shadows, highlights }} onClip={(which) => …} />

     `bins` is { r, g, b, l, total } of 256 counts each (any array-like).
     Channels draw additively on dark themes (overlaps read grey → white) and
     multiplicatively on light ones. The corner triangles light up when that
     end clips — tinted by which channels clip — and toggle a clipping
     overlay (`onClip`). Omit `clip`/`onClip` for a plain readout. Channel
     colours come from the categorical tokens (cat-5 / cat-3 / cat-1).

   ToneCurve — a point curve editor (as opposed to the kit's CurveEditor,
   which edits one cubic-bezier easing).

     <ToneCurve value={[[0, 0], [0.25, 0.2], [1, 1]]} onChange={(pts, final) => …} color="var(--cat-5)" histogram={bins.r} />

     Click the graph to add a point there and drag it. Endpoints move only
     vertically (black / white output). Drag a point well outside, double-
     click it, or press Delete to remove it.
     Keyboard: every point is a focusable slider — Tab between points, arrows
     move by 1/255 (Shift ×10). The Input / Output fields type the selected
     point exactly — the non-drag path (WCAG 2.5.7).
     The curve is a monotone cubic (Fritsch–Carlson), so it never overshoots;
     `sampleCurve(points, n)` is the same maths for your renderer (a LUT).

   (Promoted from shells/photo/local/Histogram.tsx and photo/local/ToneCurve.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clamp, cn } from '../core/cn'
import { useTheme } from '../core/theme'
import { Tip } from './tooltip'
import { ScrubValue } from './scrub'

/* =========================================================================
   Histogram
   ========================================================================= */
export interface Bins { r: ArrayLike<number>; g: ArrayLike<number>; b: ArrayLike<number>; l: ArrayLike<number>; total: number }

/** RGB + Rec. 709 luma bins from RGBA pixels (ImageData.data, gl.readPixels). */
export function histogramBins(px: ArrayLike<number>): Bins {
  const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256), l = new Uint32Array(256)
  for (let i = 0; i < px.length; i += 4) {
    r[px[i]]++
    g[px[i + 1]]++
    b[px[i + 2]]++
    l[Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722)]++
  }
  return { r, g, b, l, total: px.length / 4 }
}

const CH = { r: 'var(--cat-5)', g: 'var(--cat-3)', b: 'var(--cat-1)' }
// two clipping channels mix: r+g yellow, g+b cyan, r+b magenta
const MIX: Record<string, string> = { rg: 'var(--cat-8)', gb: 'var(--cat-6)', rb: 'var(--cat-4)' }

const clipTint = (bins: Bins | null, i: number) => {
  if (!bins || !bins.total) return { on: false, color: 'var(--fg-faint)', pct: 0 }
  const t = bins.total * 0.0005
  const r = bins.r[i] > t, g = bins.g[i] > t, b = bins.b[i] > t
  const pct = (Math.max(bins.r[i], bins.g[i], bins.b[i]) / bins.total) * 100
  const key = `${r ? 'r' : ''}${g ? 'g' : ''}${b ? 'b' : ''}`
  if (!key) return { on: false, color: 'var(--fg-faint)', pct }
  return { on: true, color: key === 'rgb' ? 'var(--fg)' : key.length === 1 ? CH[key as 'r'] : MIX[key], pct }
}

export function Histogram({
  bins, clip, onClip, footer, height = 92, label = 'Histogram', className,
}: {
  bins: Bins | null
  clip?: { shadows: boolean; highlights: boolean }
  onClip?: (which: 'shadows' | 'highlights') => void
  footer?: ReactNode
  height?: number
  label?: string
  className?: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(devicePixelRatio, 2)
    const w = c.clientWidth, h = c.clientHeight
    c.width = Math.max(1, w * dpr)
    c.height = Math.max(1, h * dpr)
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (!bins) return
    const css = getComputedStyle(c)
    const tok = (n: string) => css.getPropertyValue(n).trim()
    const light = theme === 'light'
    let max = 1
    for (const ch of [bins.r, bins.g, bins.b]) for (let i = 2; i < 254; i++) max = Math.max(max, ch[i])
    const y = (v: number) => h - Math.min(1, Math.sqrt(v / max)) * (h - 4)
    const shape = (ch: ArrayLike<number>) => {
      g.beginPath()
      g.moveTo(0, h)
      for (let i = 0; i < 256; i++) g.lineTo((i / 255) * w, y(ch[i]))
      g.lineTo(w, h)
      g.closePath()
    }
    g.globalCompositeOperation = light ? 'multiply' : 'lighter'
    g.globalAlpha = light ? 0.55 : 0.62
    ;([[bins.r, '--cat-5'], [bins.g, '--cat-3'], [bins.b, '--cat-1']] as const).forEach(([ch, t]) => { shape(ch); g.fillStyle = tok(t); g.fill() })
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    shape(bins.l)
    g.strokeStyle = tok('--fg-muted')
    g.lineWidth = 1
    g.stroke()
    g.strokeStyle = tok('--line')
    for (let q = 1; q < 4; q++) { g.beginPath(); g.moveTo((q / 4) * w + 0.5, 0); g.lineTo((q / 4) * w + 0.5, h); g.stroke() }
  }, [bins, theme, height])

  const tri = (which: 'shadows' | 'highlights') => {
    const t = clipTint(bins, which === 'shadows' ? 0 : 255)
    const on = !!clip?.[which]
    return (
      <Tip label={`${which === 'shadows' ? 'Shadow' : 'Highlight'} clipping${t.on ? ` · ${t.pct.toFixed(1)}% of pixels` : ''}${onClip ? '. Click to show on the image' : ''}`}>
        <button
          type="button"
          aria-pressed={onClip ? on : undefined}
          aria-label={`${which === 'shadows' ? 'Shadow' : 'Highlight'} clipping${t.on ? `, ${t.pct.toFixed(1)}%` : ', none'}`}
          disabled={!onClip}
          onClick={() => onClip?.(which)}
          className={cn('absolute top-1 flex size-icon-sm items-center justify-center rounded-control outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal disabled:pointer-events-none', which === 'shadows' ? 'left-1' : 'right-1', on && 'bg-active')}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" style={{ transform: which === 'shadows' ? 'scaleX(-1)' : undefined }} aria-hidden>
            <path d="M1 7 L9 7 L9 1 Z" fill={t.on ? t.color : 'none'} stroke={t.on ? t.color : 'var(--fg-faint)'} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>
      </Tip>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative overflow-hidden rounded-[7px] bg-well" style={{ height }}>
        <canvas ref={canvas} className="absolute inset-0 size-full" aria-label={label} role="img" />
        {tri('shadows')}
        {tri('highlights')}
      </div>
      {footer}
    </div>
  )
}

/* =========================================================================
   ToneCurve
   ========================================================================= */
export type CurvePoint = [number, number]

/** Monotone cubic through the points; n evenly spaced samples of y(x), clamped 0..1. */
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
export const isIdentityCurve = (p: CurvePoint[]) => p.length === 2 && p[0][0] === 0 && p[0][1] === 0 && p[1][0] === 1 && p[1][1] === 1

const Q = (n: number) => Math.round(n * 255) / 255

export function ToneCurve({
  value, onChange, color = 'var(--fg)', histogram, height = 196, label = 'Tone curve', className,
}: {
  value: CurvePoint[]
  onChange: (pts: CurvePoint[], final: boolean) => void
  color?: string
  /** 256 values, any scale — drawn faint behind the curve */
  histogram?: ArrayLike<number> | null
  height?: number
  label?: string
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState(0)
  const drag = useRef<{ i: number; out: boolean } | null>(null)
  const pts = value
  const s = Math.min(sel, pts.length - 1)

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, outY: Math.max(r.top - e.clientY, e.clientY - r.bottom) }
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
    const xi = Q(clamp(x, 0.01, 0.99))
    let at = pts.findIndex((p) => p[0] > xi)
    if (at <= 0) at = pts.length - 1
    if (pts.some((p) => Math.abs(p[0] - xi) < 0.02)) return
    onChange([...pts.slice(0, at), [xi, Q(clamp(y, 0, 1))], ...pts.slice(at)], false)
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
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div
        ref={box}
        role="group"
        aria-label={`${label}. Click to add a point.`}
        className="relative w-full cursor-crosshair touch-none rounded-[6px] bg-control shadow-[inset_0_0_0_1px_var(--line)]"
        style={{ height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
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
              if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); remove(i); return }
              const d = ({ ArrowUp: [0, st], ArrowDown: [0, -st], ArrowRight: [st, 0], ArrowLeft: [-st, 0] } as Record<string, number[]>)[e.key]
              if (!d) return
              e.preventDefault()
              e.stopPropagation()
              move(i, p[0] + d[0], p[1] + d[1], true)
            }}
            className="absolute size-3 -translate-1/2 rounded-full border-2 border-[var(--panel)] outline-none focus-visible:ring-2 focus-visible:ring-signal"
            style={{ left: `${p[0] * 100}%`, top: `${(1 - p[1]) * 100}%`, background: s === i ? 'var(--signal)' : color, boxShadow: s === i ? '0 0 0 1.5px var(--signal)' : undefined }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-ui text-fg-faint">
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
