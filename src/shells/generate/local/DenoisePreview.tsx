/* ---------------------------------------------------------------------------
   DenoisePreview — the "image is being generated" tile. Live latent noise
   that clears as `progress` goes 0 → 1 while a low-res preview sharpens and
   saturates underneath; before any preview exists it is noise plus a
   shimmer. Pass `src` (a small render), `progress`, and an optional label.

     <DenoisePreview src={sketch} progress={step / total} label="Step 12 / 30" />

   Noise animates at ~12 fps only while running, and never under
   prefers-reduced-motion. Kit candidate for any AI / render-queue shell.
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@kit'

export function DenoisePreview({ src, progress, label, className, running = true, children }: { src?: string; progress: number; label?: ReactNode; className?: string; running?: boolean; children?: ReactNode }) {
  const noise = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = noise.current!
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(c.width, c.height)
    const paintNoise = () => {
      const d = img.data
      for (let i = 0; i < d.length; i += 4) { const g = Math.random() * 255; d[i] = g; d[i + 1] = g; d[i + 2] = g; d[i + 3] = 255 }
      ctx.putImageData(img, 0, 0)
    }
    paintNoise()
    if (!running || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(paintNoise, 85)
    return () => clearInterval(id)
  }, [running])

  const p = Math.max(0, Math.min(1, progress))
  const ease = 1 - Math.pow(1 - p, 3) // structure arrives early, detail late — like a real sampler
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-well', className)}>
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${(1 - ease) * 22}px) saturate(${0.25 + ease * 0.75}) contrast(${0.8 + ease * 0.2})`, opacity: Math.min(1, 0.15 + p * 1.4), transform: `scale(${1 + (1 - ease) * 0.08})` }}
        />
      )}
      <canvas ref={noise} width={96} height={96} className="absolute inset-0 h-full w-full" style={{ opacity: src ? Math.pow(1 - p, 2.2) * 0.9 : 0.55, filter: 'blur(1.5px)', mixBlendMode: src ? 'normal' : 'luminosity' }} />
      {!src && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-transparent via-white/5 to-transparent" />}
      {label && (
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-cluster bg-scrim px-2 py-1.5 text-ui text-white backdrop-blur-sm">
          <span className="tabular min-w-0 flex-1 truncate">{label}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10"><div className="h-full bg-signal transition-[width] duration-100" style={{ width: `${p * 100}%` }} /></div>
      {children}
    </div>
  )
}
