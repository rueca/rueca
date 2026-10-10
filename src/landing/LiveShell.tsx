/* The hero: a real shell, live, with a switcher underneath.
   Same live frame as the shell rail (LiveFrame): the thumbnail shows at once,
   the real shell fades in over it once painted, and it unloads when the hero
   scrolls out of view, so only one live shell runs on the page at a time.
   On a phone it shows the same instrument's client view instead.
   On load it rises in after the headline, in the page's reveal language
   (landing.css: data-reveal "head"), and the switcher fades in after it. */
import { useEffect, useRef, useState } from 'react'
import { cn, useTheme } from '@kit'
import type { Shell } from '@/gallery/registry'
import { thumb } from '@/gallery/registry'
import { LiveFrame } from './LiveFrame'

const NATIVE = { w: 1440, h: 900 }

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return null
}

export function LiveShell({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [id, setId] = useState(shells[0]?.id)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const el = wrap.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    // live only while the hero is (mostly) in view
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { root: scrollParent(el), threshold: 0.15 })
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [])

  const narrow = w > 0 && w < 640
  const hasPresent = shells.some((s) => s.id === 'present')
  const current = (narrow && hasPresent ? 'present' : id) ?? ''
  const shell = shells.find((s) => s.id === current)
  const box = narrow ? { w, h: Math.round(Math.min(680, w * 1.55)) } : { w, h: Math.round(NATIVE.h * (w / NATIVE.w)) }

  const switcher = !narrow && shells.length > 1 && (
    <div data-reveal="fade" style={{ '--reveal-delay': '1.15s' } as React.CSSProperties} className="mt-6 flex justify-center">
      <div className="cluster flex max-w-full gap-0.5 overflow-x-auto p-1 [scrollbar-width:none]" role="group" aria-label="Choose a live shell">
        {shells.map((s) => (
          <button key={s.id} type="button" onClick={() => setId(s.id)} aria-pressed={id === s.id}
            className={cn('h-8 flex-none rounded-[7px] px-3.5 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-signal',
              id === s.id ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div data-reveal="head" style={{ '--reveal-delay': '0.9s' } as React.CSSProperties}>
        <div ref={wrap} className="relative overflow-hidden rounded-[16px] bg-field shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
          style={{ height: box.h || undefined, aspectRatio: box.h ? undefined : `${NATIVE.w} / ${NATIVE.h}` }}>
          {/* the thumbnail is always underneath: switching and loading never flash empty */}
          <img src={thumb(current, theme)} alt="" aria-hidden
            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
            className="absolute inset-0 size-full object-cover object-top" />
          {w > 0 && onScreen && shell && (
            <LiveFrame key={`${current}${narrow ? '-client' : ''}`} id={current} name={shell.name}
              query={narrow ? '?client' : ''} native={narrow ? box : NATIVE}
              hint={narrow ? 'Tap to try the client view' : undefined} hintAlways={narrow} />
          )}
        </div>
      </div>
      {switcher}
    </div>
  )
}
