/* Rueca brand pieces for the landing visuals (brand/data.js ruecaPalette and the
   "harness, drawn" wireframe identity in brand/BRAND.md):
   - Threads: the stand-in artwork. Flat dyed threads on undyed wool with a little
     grain: no gradients, no glow, the brights printed flat. A rueca spins thread.
   - Scaffold: the visible harness, a hairline frame with crosshair corners.
   The artwork doesn't follow the page theme (it's a picture of work, not chrome). */
import { useId, type CSSProperties } from 'react'
import { cn } from '@kit/core/cn'

/** the dyed brights, light values (the artwork doesn't theme) */
export const DYES = { achiote: '#E8582C', cielo: '#5DB4E8', gualda: '#F2C744', hoja: '#2FA57C', malva: '#A88BF6' }
const THREADS = [DYES.achiote, DYES.cielo, DYES.gualda, DYES.hoja, DYES.malva]
const LANA = '#F3EEE3'
const GREYS = ['#8f877e', '#a59d94', '#bab3aa', '#7d756c', '#9c958c']

/** Flat dyed threads on wool. `mono` = an undyed "before"; `outline` = vector strokes only.
    `drift` moves the threads sideways (any CSS length, e.g. a calc() off a progress var). */
export function Threads({ mono, outline, drift, className, style }: { mono?: boolean; outline?: boolean; drift?: string; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  const inks = mono ? GREYS : THREADS
  return (
    <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" aria-hidden className={cn('block size-full', className)} style={style}>
      <defs>
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" />
          <feColorMatrix values="0 0 0 0 .14  0 0 0 0 .1  0 0 0 0 .08  0 0 0 .2 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {!outline && <rect width="100" height="125" fill={LANA} />}
      <g style={{ transform: drift ? `translateX(${drift})` : undefined, transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1)' }}>
        {inks.map((c, i) => (
          <path key={i} d={`M-30 ${44 + i * 9} C 0 ${28 + i * 9}, 18 ${74 + i * 9}, 46 ${56 + i * 9} S 92 ${34 + i * 9}, 130 ${50 + i * 9}`}
            fill="none" stroke={outline ? DYES.achiote : c} strokeWidth={outline ? 1.4 : 3.2} strokeLinecap="round" opacity={outline && i > 0 ? 0.35 : 1} />
        ))}
      </g>
      {!outline && <rect width="100" height="125" fill="#000" filter={`url(#grain-${id})`} />}
    </svg>
  )
}

/** four flat swatches: a palette control's value */
export function Swatches({ className, size = 'size-3' }: { className?: string; size?: string }) {
  return <span className={cn('flex gap-0.5', className)}>{[DYES.achiote, DYES.gualda, DYES.malva, DYES.cielo].map((c) => <span key={c} className={cn('rounded-[3px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]', size)} style={{ background: c }} />)}</span>
}

/** The visible harness: a hairline frame with crosshair corners and a tiny label. */
export function Scaffold({ label, inset = 8 }: { label?: string; inset?: number }) {
  const cross = 'absolute size-3 [background:linear-gradient(var(--line-strong),var(--line-strong))_center/100%_1px_no-repeat,linear-gradient(var(--line-strong),var(--line-strong))_center/1px_100%_no-repeat]'
  return (
    <div aria-hidden className="pointer-events-none absolute" style={{ inset }}>
      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_var(--line)]" />
      <span className={cn(cross, '-top-1.5 -left-1.5')} /><span className={cn(cross, '-top-1.5 -right-1.5')} />
      <span className={cn(cross, '-bottom-1.5 -left-1.5')} /><span className={cn(cross, '-right-1.5 -bottom-1.5')} />
      {label && <span className="font-code absolute right-1.5 bottom-1 text-[7.5px] tracking-[0.02em] text-fg-faint">{label}</span>}
    </div>
  )
}
