/* ---------------------------------------------------------------------------
   Histogram — RGB + luma distribution with Lightroom's clipping triangles.

     <Histogram bins={bins} clip={{ shadows, highlights }} onClip={(which) => …} />

   `bins` is { r, g, b, l } of 256 counts each (any typed array). Channels are
   drawn additively on dark themes (overlaps go grey → white, like Lightroom)
   and multiplicatively on light ones, so it reads in both. The corner
   triangles light up when that end clips — tinted by which channels clip —
   and toggle the clipping overlay on the image (J toggles both).
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ReactNode } from 'react'
import { Tip, cn, useTheme } from '@kit'

export interface Bins { r: ArrayLike<number>; g: ArrayLike<number>; b: ArrayLike<number>; l: ArrayLike<number>; total: number }

const clipTint = (bins: Bins | null, i: number) => {
  if (!bins || !bins.total) return { on: false, color: 'var(--fg-faint)', pct: 0 }
  const t = bins.total * 0.0005
  const r = bins.r[i] > t, g = bins.g[i] > t, b = bins.b[i] > t
  const pct = (Math.max(bins.r[i], bins.g[i], bins.b[i]) / bins.total) * 100
  if (!r && !g && !b) return { on: false, color: 'var(--fg-faint)', pct }
  const color = r && g && b ? 'var(--fg)' : `rgb(${r ? 255 : 60},${g ? 220 : 60},${b ? 255 : 60})`
  return { on: true, color, pct }
}

export function Histogram({
  bins, clip, onClip, footer, height = 92,
}: {
  bins: Bins | null
  clip: { shadows: boolean; highlights: boolean }
  onClip: (which: 'shadows' | 'highlights') => void
  footer?: ReactNode
  height?: number
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(devicePixelRatio, 2)
    const w = c.clientWidth, h = c.clientHeight
    c.width = w * dpr
    c.height = h * dpr
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (!bins) return
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
    const fills = light
      ? ['rgba(240,70,70,.55)', 'rgba(60,190,90,.55)', 'rgba(70,120,250,.55)']
      : ['rgba(230,60,60,.62)', 'rgba(60,200,90,.62)', 'rgba(70,120,255,.7)']
    ;[bins.r, bins.g, bins.b].forEach((ch, k) => { shape(ch); g.fillStyle = fills[k]; g.fill() })
    g.globalCompositeOperation = 'source-over'
    shape(bins.l)
    g.strokeStyle = light ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.55)'
    g.lineWidth = 1
    g.stroke()
    // quarter guides
    g.strokeStyle = light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'
    for (let q = 1; q < 4; q++) { g.beginPath(); g.moveTo((q / 4) * w + 0.5, 0); g.lineTo((q / 4) * w + 0.5, h); g.stroke() }
  }, [bins, theme])

  const lo = clipTint(bins, 0)
  const hi = clipTint(bins, 255)
  const tri = (which: 'shadows' | 'highlights', t: { on: boolean; color: string; pct: number }) => (
    <Tip label={`${which === 'shadows' ? 'Shadow' : 'Highlight'} clipping${t.on ? ` · ${t.pct.toFixed(1)}% of pixels` : ''} — click to show on the image`} shortcut="j">
      <button
        type="button"
        aria-pressed={clip[which]}
        aria-label={`Show ${which} clipping`}
        onClick={() => onClip(which)}
        className={cn('absolute top-1 flex size-5 items-center justify-center rounded-[4px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', which === 'shadows' ? 'left-1' : 'right-1', clip[which] && 'bg-active')}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" style={{ transform: which === 'shadows' ? 'scaleX(-1)' : undefined }}>
          <path d="M1 7 L9 7 L9 1 Z" fill={t.on ? t.color : 'none'} stroke={t.on ? t.color : 'var(--fg-faint)'} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </button>
    </Tip>
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative overflow-hidden rounded-[7px] bg-well" style={{ height }}>
        <canvas ref={canvas} className="absolute inset-0 size-full" aria-label="Histogram" role="img" />
        {tri('shadows', lo)}
        {tri('highlights', hi)}
      </div>
      {footer}
    </div>
  )
}
