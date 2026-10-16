/* ---------------------------------------------------------------------------
   The studio shell. One component owns the gutter; every island is flush.

     <Studio
       toolbar={<Toolbar>…</Toolbar>}
       left={<Panel>layers</Panel>}
       right={<Panel>inspector</Panel>}
       bottom={<Timeline … />}
     >
       <Stage>…</Stage>
     </Studio>

   Three arrangements:
     layout="islands"  floating rounded cards with a gutter (default; motion, artboards). Panels float
                       over the workspace: the main camera stage runs underneath and fits in the gap
     layout="overlay"  the stage is full-bleed under the panels (shaders, 3D, photo)
     layout="docked"   panels flush to the window edges, Figma UI3 style
   `present` hides all chrome (⌘\ / F) — the client-facing view.
--------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../core/cn'
import { useHotkeys } from '../core/hotkeys'
import { TipProvider } from '../ui/tooltip'
import { Toaster } from '../system/toast'
import { ErrorBoundary } from '../system/error-boundary'
import { restoreDensity } from '../core/density'
import { LabelScope } from '../inspector/label-fit'

type Layout = 'islands' | 'overlay' | 'docked'
const StudioCtx = createContext<{ present: boolean; setPresent: (b: boolean) => void; layout: Layout }>({ present: false, setPresent: () => {}, layout: 'islands' })
export const useStudio = () => useContext(StudioCtx)

export function Studio({
  toolbar, left, right, bottom, children, layout = 'islands', className, leftWidth, rightWidth,
}: {
  toolbar?: ReactNode; left?: ReactNode; right?: ReactNode; bottom?: ReactNode
  children: ReactNode; layout?: Layout; className?: string; leftWidth?: number; rightWidth?: number
}) {
  const [present, setPresentRaw] = useState(false)
  // Hiding the interface unmounts the panels, so the element that had focus is gone by the time it comes back:
  // remember how to find it again (its param row and name) and restore it once the panels have remounted.
  const returnTo = useRef<{ el: HTMLElement | null; param?: string; label?: string } | null>(null)
  // remember the focused element BEFORE the panels unmount (an effect after the commit would only see <body>)
  const presentRef = useRef(false)
  presentRef.current = present
  const setPresent = useCallback((v: boolean | ((p: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(presentRef.current) : v
    if (next && !presentRef.current) {
      const el = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
      returnTo.current = { el, param: el?.closest<HTMLElement>('[data-param]')?.dataset.param, label: el?.getAttribute('aria-label') ?? undefined }
    }
    setPresentRaw(next)
  }, [])
  useLayoutEffect(() => {
    if (present) return
    const r = returnTo.current
    returnTo.current = null
    if (!r) return
    requestAnimationFrame(() => {
      const root = rootRef.current
      const esc = (v: string) => (typeof CSS !== 'undefined' ? CSS.escape(v) : v)
      const again = r.el?.isConnected ? r.el
        : (r.param && r.label && root?.querySelector<HTMLElement>(`[data-param="${esc(r.param)}"] [aria-label="${esc(r.label)}"]`))
          || (r.label && root?.querySelector<HTMLElement>(`[aria-label="${esc(r.label)}"]`))
          || root?.querySelector<HTMLElement>('main [tabindex], main')
      again?.focus({ preventScroll: true })
    })
  }, [present])
  const rootRef = useRef<HTMLDivElement>(null)
  // The #1 install trap: <Studio> fills its parent, and a fresh Vite page has no height → a blank page, no error.
  useLayoutEffect(restoreDensity, []) // the saved density (⌘K → Density), before first paint
  useLayoutEffect(() => {
    if (import.meta.env?.DEV && rootRef.current && rootRef.current.clientHeight === 0)
      console.warn('[studio] <Studio> is 0px tall. It fills its parent — give the page a height: html, body, #root { height: 100%; margin: 0 }')
  }, [])
  useHotkeys({
    'mod+\\': { run: () => setPresent((p) => !p), label: 'Hide interface', group: 'View' },
  }, [present], { priority: 0 })
  // Leaving present mode must always work, whatever the shell binds to Esc (break-it F1).
  useHotkeys({ esc: { run: () => setPresent(false), when: () => present } }, [present], { priority: 100 })
  // widths come from the density tokens unless a shell pins one
  const rw = rightWidth ? `${rightWidth}px` : 'var(--inspector-w)'
  const lw = leftWidth ? `${leftWidth}px` : 'var(--sidebar-w)'
  // Each region gets its own boundary: a crash in the artwork leaves the panels usable and vice versa.
  const guard = (node: ReactNode, label: string) => node && <ErrorBoundary label={label} compact>{node}</ErrorBoundary>
  toolbar = guard(toolbar, 'The toolbar')
  left = guard(left, 'The left panel')
  right = guard(right, 'The inspector')
  bottom = guard(bottom, 'The timeline')
  children = <ErrorBoundary label="The artwork">{children}</ErrorBoundary>

  const shell =
    layout === 'overlay' ? (
      <SafeAreaRoot className="relative h-full w-full overflow-hidden">
        {!present && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-[var(--gutter)] p-[var(--gutter)]">
            {toolbar && <div data-safe="top" className="flex-none [&_header>div>*]:pointer-events-auto [&>*:not(header)]:pointer-events-auto">{toolbar}</div>}
            <div className="flex min-h-0 flex-1 gap-[var(--gutter)]">
              {left && <aside aria-label="Left panel" data-safe="left" className="flex min-h-0 flex-none flex-col [&>*]:pointer-events-auto" style={{ width: lw }}>{left}</aside>}
              <div className="flex-1" />
              {right && <aside aria-label="Right panel" data-safe="right" className="flex min-h-0 flex-none flex-col [&>*]:pointer-events-auto" style={{ width: rw }}>{right}</aside>}
            </div>
            {/* the strip itself lets clicks through; only its content takes them */}
            {bottom && <section aria-label="Bottom panel" data-safe="bottom" className="flex flex-none justify-center [&>*]:pointer-events-auto">{bottom}</section>}
          </div>
        )}
        <main className="absolute inset-0 z-0">{children}</main>
      </SafeAreaRoot>
    ) : layout === 'docked' ? (
      <div className="flex h-full flex-col">
        {toolbar && !present && <div className="flex-none border-b border-line bg-panel px-2 py-1">{toolbar}</div>}
        <div className="flex min-h-0 flex-1">
          {left && !present && <aside aria-label="Left panel" className="flex min-h-0 flex-none flex-col border-r border-line bg-panel" style={{ width: lw }}>{left}</aside>}
          <main className="relative min-w-0 flex-1">{children}</main>
          {right && !present && <aside aria-label="Right panel" className="flex min-h-0 flex-none flex-col border-l border-line bg-panel" style={{ width: rw }}>{right}</aside>}
        </div>
        {bottom && !present && <section aria-label="Bottom panel" className="flex-none border-t border-line bg-panel">{bottom}</section>}
      </div>
    ) : (
      // Islands: the panels FLOAT. The field runs uninterrupted underneath them; content sits in the
      // uncovered rect (the safe area) so nothing hides under a panel — except a camera <Stage>, which
      // bleeds to the edges (grid and artboard continue under the panels) and fits into the safe area.
      <SafeAreaRoot className="relative h-full w-full overflow-hidden">
        {!present && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-[var(--gutter)] p-[var(--gutter)]">
            {toolbar && <div data-safe="top" className="flex-none [&_header>div>*]:pointer-events-auto [&>*:not(header)]:pointer-events-auto">{toolbar}</div>}
            <div className="flex min-h-0 flex-1 gap-[var(--gutter)]">
              {left && <aside aria-label="Left panel" data-safe="left" className="flex min-h-0 flex-none flex-col [&>*]:pointer-events-auto" style={{ width: lw }}>{left}</aside>}
              <div className="flex-1" />
              {right && <aside aria-label="Right panel" data-safe="right" className="flex min-h-0 flex-none flex-col [&>*]:pointer-events-auto" style={{ width: rw }}>{right}</aside>}
            </div>
            {bottom && <section aria-label="Bottom panel" data-safe="bottom" className="pointer-events-auto flex-none">{bottom}</section>}
          </div>
        )}
        <main data-studio-main="" className="absolute z-0" style={present ? { inset: 0 } : SAFE_INSET}>{children}</main>
      </SafeAreaRoot>
    )

  return (
    <StudioCtx.Provider value={{ present, setPresent, layout }}>
      <TipProvider>
        <div ref={rootRef} className={cn('studio h-full w-full overflow-hidden bg-field text-fg no-select', className)}>
          {shell}
          {present && (
            <button type="button" onClick={() => setPresent(false)}
              className="cluster fixed right-3 bottom-3 z-50 h-icon px-2.5 text-ui text-fg-muted opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100">
              Show interface · Esc
            </button>
          )}
        </div>
        <Toaster />
      </TipProvider>
    </StudioCtx.Provider>
  )
}

/* A floating island. In `docked` layout it renders flat. */
export function Panel({ children, className, header, footer, scroll = true }: { children: ReactNode; className?: string; header?: ReactNode; footer?: ReactNode; scroll?: boolean }) {
  const { layout } = useStudio()
  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden', layout === 'docked' ? 'h-full' : 'panel max-h-full', className)}>
      {header && <div className="flex-none">{header}</div>}
      {/* one label column for everything in the panel: hand-built rows and inspectors line up */}
      <LabelScope className={cn('min-h-0 flex-1', scroll ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden')}>{children}</LabelScope>
      {footer && <div className="flex-none border-t border-line">{footer}</div>}
    </div>
  )
}

/* Panel header with a title or tabs. */
export function PanelHeader({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-header items-center gap-1 border-b border-line pr-2 pl-pad', className)}>
      {title && <div className="min-w-0 flex-1 truncate text-title font-semibold text-fg">{title}</div>}
      {children}
    </div>
  )
}

/* Text tabs in a panel header (Design / Prototype, Layers / Assets). */
/* Text tabs in a panel header (Design / Prototype, Layers / Assets). APG tabs: one tab stop,
   ←/→ (and Home/End) move between tabs and select (break-it A12). Pass `controls` to name the panel. */
export function PanelTabs<T extends string>({ value, onChange, tabs, controls, label = 'Panel views' }: { value: T; onChange: (t: T) => void; tabs: { value: T; label: string }[]; controls?: string; /** the tab list's name for screen readers */ label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const go = (i: number) => {
    const t = tabs[(i + tabs.length) % tabs.length]
    onChange(t.value)
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-tab="${t.value}"]`)?.focus())
  }
  return (
    <div ref={ref} role="tablist" aria-label={label} className="flex flex-1 items-center gap-0.5"
      onKeyDown={(e) => {
        const i = tabs.findIndex((t) => t.value === value)
        if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1) }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1) }
        else if (e.key === 'Home') { e.preventDefault(); go(0) }
        else if (e.key === 'End') { e.preventDefault(); go(tabs.length - 1) }
      }}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" data-tab={t.value} aria-selected={value === t.value} aria-controls={controls}
          tabIndex={value === t.value ? 0 : -1} onClick={() => onChange(t.value)}
          className={cn('h-icon rounded-control px-2 text-ui font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
            value === t.value ? 'bg-active text-fg' : 'text-fg-muted hover:text-fg')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* Empty state: say what to do, not that there is nothing. */
export function Empty({ icon: Icon, title, hint, action, compact }: { icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; title: string; hint?: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 text-center', compact ? 'px-4 py-5' : 'px-6 py-10')}>
      {Icon && <div className="text-fg-faint"><Icon size={20} strokeWidth={1.5} /></div>}
      <div className="text-title font-medium text-fg">{title}</div>
      {hint && <div className="max-w-[220px] text-ui leading-relaxed text-fg-muted">{hint}</div>}
      {action}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Safe area — in the islands and overlay layouts the stage runs under the panels. This
   measures what the panels cover and exposes it as CSS vars on the root
   (--safe-top/right/bottom/left) and via useSafeArea(), so a HUD, a fixed-
   aspect frame or the camera's "centre" can sit in the uncovered rect.
--------------------------------------------------------------------------- */
export interface SafeArea { top: number; right: number; bottom: number; left: number }
/** The uncovered rect, one gutter in from the panels (the safe vars measure to the panels' far edges). */
const SAFE_INSET = {
  top: 'calc(var(--safe-top, 0px) + var(--gutter, 12px))', right: 'calc(var(--safe-right, 0px) + var(--gutter, 12px))',
  bottom: 'calc(var(--safe-bottom, 0px) + var(--gutter, 12px))', left: 'calc(var(--safe-left, 0px) + var(--gutter, 12px))',
} as const
const SafeCtx = createContext<SafeArea>({ top: 0, right: 0, bottom: 0, left: 0 })
export const useSafeArea = () => useContext(SafeCtx)

function SafeAreaRoot({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [safe, setSafe] = useState<SafeArea>({ top: 0, right: 0, bottom: 0, left: 0 })
  useLayoutEffect(() => {
    const root = ref.current!
    const measure = () => {
      const r = root.getBoundingClientRect()
      const box = (side: string) => root.querySelector<HTMLElement>(`[data-safe="${side}"]`)?.getBoundingClientRect()
      const t = box('top'), l = box('left'), rr = box('right'), b = box('bottom')
      const next = {
        top: t ? Math.round(t.bottom - r.top) : 0,
        left: l ? Math.round(l.right - r.left) : 0,
        right: rr ? Math.round(r.right - rr.left) : 0,
        bottom: b && b.height ? Math.round(r.bottom - b.top) : 0,
      }
      for (const [k, v] of Object.entries(next)) root.style.setProperty(`--safe-${k}`, `${v}px`)
      setSafe((p) => (p.top === next.top && p.left === next.left && p.right === next.right && p.bottom === next.bottom ? p : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    root.querySelectorAll('[data-safe]').forEach((n) => ro.observe(n))
    const mo = new MutationObserver(() => { root.querySelectorAll('[data-safe]').forEach((n) => ro.observe(n)); measure() })
    mo.observe(root, { childList: true, subtree: false })
    return () => { ro.disconnect(); mo.disconnect() }
  }, [])
  return <SafeCtx.Provider value={safe}><div ref={ref} className={className}>{children}</div></SafeCtx.Provider>
}
