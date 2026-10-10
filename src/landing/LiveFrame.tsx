/* A real shell, running in an iframe, scaled down to fit its box. Used by the
   hero (LiveShell) and the shell rail's centred card, so both behave the same:
   - marketing rule: the frame gets the neutral accent (neutral.ts);
   - the page theme is mirrored into the frame;
   - it fades in over its thumbnail only once it has painted;
   - a transparent shield sits on top until you click, so wheel/drag keep
     scrolling the page instead of driving the shell (iframes swallow both). */
import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, X } from 'lucide-react'
import { cn, useTheme } from '@kit'
import { NEUTRAL_ACCENT_CSS } from './neutral'

const NATIVE = { w: 1440, h: 900 }

export function LiveFrame({ id, name, query = '', native = NATIVE, hint = 'Click to try the real tool', hintAlways = false, onReady }: {
  id: string; name: string
  /** e.g. '?client' for the phone client view */
  query?: string
  /** the size the shell is laid out at before scaling to the box (desktop shells: 1440×900) */
  native?: { w: number; h: number }
  hint?: string
  /** show the hint without hover (touch screens have no hover) */
  hintAlways?: boolean
  onReady?: () => void
}) {
  const { theme } = useTheme()
  const wrap = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [w, setW] = useState(0)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = wrap.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // mirror the page theme into the frame (same origin)
  useEffect(() => {
    try {
      const win = frame.current?.contentWindow as (Window & typeof globalThis) | null
      if (!win) return
      win.document.documentElement.classList.toggle('light', theme === 'light')
      win.document.documentElement.classList.toggle('dark', theme === 'dark')
      win.dispatchEvent(new win.CustomEvent('studio:theme', { detail: theme }))
    } catch { /* not ready yet */ }
  }, [theme, ready])

  return (
    <div ref={wrap} className="absolute inset-0" onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(false) }}>
      {w > 0 && (
        <iframe ref={frame} src={`${import.meta.env.BASE_URL}#/${id}${query}`} title={`${name} — live`} tabIndex={active ? 0 : -1}
          onLoad={() => {
            try {
              const d = frame.current?.contentDocument
              if (d && !d.getElementById('neutral-accent')) {
                const st = d.createElement('style'); st.id = 'neutral-accent'; st.textContent = NEUTRAL_ACCENT_CSS; d.head.appendChild(st)
              }
            } catch { /* cross-origin: leave it */ }
            setTimeout(() => { setReady(true); onReady?.() }, 500)
          }}
          className={cn('absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', ready ? 'opacity-100' : 'opacity-0')}
          style={{ width: native.w, height: native.h, transform: `scale(${w / native.w})` }} />
      )}
      {!active && (
        <button type="button" onClick={() => { setActive(true); requestAnimationFrame(() => frame.current?.focus()) }}
          aria-label={`Try ${name}`} className={cn('group/live absolute inset-0 flex justify-center outline-none', hintAlways ? 'items-end pb-5' : 'items-center')}>
          {/* centred and hover-only on desktop, so it never covers the tool's own controls */}
          <span className={cn('pop flex h-9 items-center gap-2 px-3.5 text-[12.5px] font-medium text-fg transition-opacity duration-200 group-focus-visible/live:opacity-100 group-focus-visible/live:ring-2 group-focus-visible/live:ring-signal',
            hintAlways ? 'opacity-90' : 'opacity-0', ready && 'group-hover/live:opacity-100')}>
            <MousePointerClick size={14} strokeWidth={1.5} />{hint}
          </span>
        </button>
      )}
      {active && hintAlways && (
        <button type="button" onClick={() => setActive(false)} aria-label="Stop interacting"
          className="pop absolute top-3 right-3 flex h-8 items-center gap-1.5 px-2.5 text-[12px] text-fg-muted hover:text-fg">
          <X size={13} strokeWidth={1.5} />Done
        </button>
      )}
    </div>
  )
}
