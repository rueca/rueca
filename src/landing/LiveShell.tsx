/* The hero: a real shell running in an iframe, scaled to fit.
   - A transparent shield sits on top until you click, so the page scrolls
     normally and the shell's canvas camera doesn't eat the wheel
     (iframes swallow wheel/pointer — research/06 #5).
   - The theme toggle on the page is mirrored into the frame.
   - On a phone the frame shows the same instrument's client view instead. */
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, MousePointerClick, X } from 'lucide-react'
import { cn, useTheme } from '@kit'
import type { Shell } from '@/gallery/registry'
import { thumb } from '@/gallery/registry'

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

  return (
    <div>
      {!narrow && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Choose a live shell">
          {shells.map((s) => (
            <button key={s.id} type="button" onClick={() => setId(s.id)} aria-pressed={id === s.id}
              className={cn('h-7 rounded-full px-3 text-[12px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent',
                id === s.id ? 'bg-fg text-field' : 'text-muted hover:bg-hover hover:text-fg')}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div
        ref={wrap}
        className="relative overflow-hidden rounded-[14px] bg-field shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]"
        style={{ height: box.h || undefined, aspectRatio: box.h ? undefined : `${NATIVE.w} / ${NATIVE.h}` }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(false) }}
      >
        {/* poster until the frame has painted */}
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
            onLoad={() => setTimeout(() => setReady(true), 700)}
            className={cn('absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0')}
            style={{ width: narrow ? box.w : NATIVE.w, height: narrow ? box.h : NATIVE.h, transform: `scale(${scale})` }}
          />
        )}
        {!active && (
          <button type="button" onClick={() => { setActive(true); requestAnimationFrame(() => frame.current?.focus()) }}
            className="group absolute inset-0 flex items-end justify-center pb-5 outline-none"
            aria-label={`Interact with the ${shell?.name ?? ''} shell`}>
            <span className="pop flex h-9 items-center gap-2 px-3.5 text-[12.5px] font-medium text-fg opacity-90 transition-opacity group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-accent">
              <MousePointerClick size={14} strokeWidth={1.5} />
              {narrow ? 'Tap to try the client view' : 'Click to try it — this is the real shell'}
            </span>
          </button>
        )}
        {active && (
          <button type="button" onClick={() => setActive(false)} aria-label="Stop interacting"
            className="pop absolute top-3 right-3 flex h-8 items-center gap-1.5 px-2.5 text-[12px] text-muted hover:text-fg sm:hidden">
            <X size={13} strokeWidth={1.5} />Done
          </button>
        )}
      </div>
      {shell && (
        <div className="mt-3 flex items-start justify-between gap-4 text-[12.5px]">
          <p className="min-w-0 text-pretty text-muted"><span className="font-medium text-fg">{shell.name}.</span> {shell.description}</p>
          <a href={`#/${shell.id}${narrow ? '?client' : ''}`} className="flex flex-none items-center gap-1 text-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
            Full screen<ArrowUpRight size={13} strokeWidth={1.5} />
          </a>
        </div>
      )}
    </div>
  )
}
