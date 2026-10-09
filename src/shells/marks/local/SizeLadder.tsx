/* ---------------------------------------------------------------------------
   SizeLadder — the same artwork at real pixel sizes on several surfaces, for
   checking legibility (favicons, app icons, avatars, stamps). Never inside a
   zoomable camera: 16 px here means 16 CSS px on screen.

     <SizeLadder sizes={[16, 32, 64, 256]}
       surfaces={[{ label: 'Light', bg: paper, fg: ink }, { label: 'Dark', bg: ink, fg: paper }]}
       render={(size, i) => <img src={…} width={size} height={size} />} />

   `extra` renders per surface after the ladder (a browser-tab mock, an app
   icon on a home screen) — context matters more than the bare square.
--------------------------------------------------------------------------- */
import type { ReactNode } from 'react'
import { cn } from '@kit'

export interface Surface { label: string; bg: string; fg: string }

export function SizeLadder({ sizes, surfaces, render, extra, className }: {
  sizes: number[]
  surfaces: Surface[]
  render: (size: number, surface: number) => ReactNode
  extra?: (surface: number) => ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-max gap-3', className)}>
      {surfaces.map((s, si) => (
        <div key={s.label} className="relative rounded-[10px] p-3 shadow-[inset_0_0_0_1px_var(--line)]" style={{ background: s.bg, color: s.fg }}>
          <div className="absolute top-2.5 left-3 text-[11px] opacity-60">{s.label}</div>
          <div className="flex items-end gap-4">
            {sizes.map((z) => (
              <div key={z} className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center" style={{ width: z, height: z }}>{render(z, si)}</div>
                <span className="tabular text-[10.5px] opacity-55">{z}</span>
              </div>
            ))}
            {extra?.(si)}
          </div>
        </div>
      ))}
    </div>
  )
}
