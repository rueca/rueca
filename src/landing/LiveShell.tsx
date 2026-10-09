/* The hero: a real shell running in an iframe, scaled to fit.
   - A transparent shield sits on top until you click, so the page scrolls
     normally and the shell's canvas camera doesn't eat the wheel
     (iframes swallow wheel/pointer — research/06 #5).
   - The theme toggle on the page is mirrored into the frame.
   - On a phone the frame shows the same instrument's client view instead.
   - On load it rises in after the headline, in the page's reveal language
     (landing.css: data-reveal "head"), and the switcher fades in after it. */
import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, X } from 'lucide-react'
import { cn, useTheme } from '@kit'
import type { Shell } from '@/gallery/registry'
import { thumb } from '@/gallery/registry'
import { NEUTRAL_ACCENT_CSS } from './neutral'

const NATIVE = { w: 1440, h: 900 }

export function LiveShell({ shells }: { shells: Shell[] }) {
  const { theme } = useTheme()
  const wrap = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [w, setW] = useState(0)
  const [id, setId] = useState(shells[0]?.id)
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = wrap.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = w > 0 && w < 640
  const hasPresent = shells.some((s) => s.id === 'present')
  const current = narrow && hasPresent ? 'present' : id
  const shell = shells.find((s) => s.id === current)
  const src = `${import.meta.env.BASE_URL}#/${current}${narrow ? '?client' : ''}`

  useEffect(() => { setReady(false); setActive(false) }, [src])

  // Mirror the page theme into the frame (same origin).
  useEffect(() => {
    const win = frame.current?.contentWindow as (Window & typeof globalThis) | null
    try {
      if (!win) return
      const root = win.document.documentElement
      root.classList.toggle('light', theme === 'light')
      root.classList.toggle('dark', theme === 'dark')
      win.dispatchEvent(new win.CustomEvent('studio:theme', { detail: theme }))
    } catch { /* not ready yet */ }
  }, [theme, ready])

  const scale = narrow ? 1 : w / NATIVE.w
  const box = narrow ? { w, h: Math.round(Math.min(680, w * 1.55)) } : { w, h: Math.round(NATIVE.h * scale) }

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
      <div
        ref={wrap}
        className="relative overflow-hidden rounded-[16px] bg-field shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
        style={{ height: box.h || undefined, aspectRatio: box.h ? undefined : `${NATIVE.w} / ${NATIVE.h}` }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(false) }}
      >        {/* poster until the frame has painted */}
        <img src={thumb(narrow ? 'present' : current ?? '', theme)} alt="" aria-hidden
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
          className={cn('absolute inset-0 size-full object-cover object-top transition-opacity duration-300', ready ? 'opacity-0' : 'opacity-100')} />
        {w > 0 && (
          <iframe
            key={src}
            ref={frame}
            src={src}
            title={shell ? `${shell.name} — live shell` : 'Live shell'}
            tabIndex={active ? 0 : -1}
            onLoad={() => {
              // marketing rule: previews show a neutral accent; blue only in the full-screen tool
              try {
                const d = frame.current?.contentDocument
                if (d && !d.getElementById('neutral-accent')) {
                  const st = d.createElement('style'); st.id = 'neutral-accent'; st.textContent = NEUTRAL_ACCENT_CSS; d.head.appendChild(st)
                }
              } catch { /* cross-origin: leave it */ }
              setTimeout(() => setReady(true), 700)
            }}
            className={cn('absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0')}
            style={{ width: narrow ? box.w : NATIVE.w, height: narrow ? box.h : NATIVE.h, transform: `scale(${scale})` }}
          />
        )}
        {!active && (
          <button type="button" onClick={() => { setActive(true); requestAnimationFrame(() => frame.current?.focus()) }}
            className={cn('group absolute inset-0 flex justify-center outline-none', narrow ? 'items-end pb-5' : 'items-center')}
            aria-label={`Interact with the ${shell?.name ?? ''} shell`}>
            {/* desktop: only on hover/focus, centred, so it never covers the tool's own controls */}
            <span className={cn('pop flex h-9 items-center gap-2 px-3.5 text-[12.5px] font-medium text-fg transition-opacity duration-200 group-focus-visible:ring-2 group-focus-visible:ring-signal',
              narrow ? 'opacity-90' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')}>
              <MousePointerClick size={14} strokeWidth={1.5} />
              {narrow ? 'Tap to try the client view' : 'Click to try it — this is the real shell'}
            </span>
          </button>
        )}
        {active && (
          <button type="button" onClick={() => setActive(false)} aria-label="Stop interacting"
            className="pop absolute top-3 right-3 flex h-8 items-center gap-1.5 px-2.5 text-[12px] text-fg-muted hover:text-fg sm:hidden">
            <X size={13} strokeWidth={1.5} />Done
          </button>
        )}
      </div>
      </div>
      {switcher}
    </div>
  )
}
