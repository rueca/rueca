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

   Two arrangements:
     layout="islands"  floating rounded cards with a gutter (default; motion, artboards)
     layout="overlay"  the stage is full-bleed under the panels (shaders, 3D, photo)
     layout="docked"   panels flush to the window edges, Figma UI3 style
   `present` hides all chrome (⌘\ / F) — the client-facing view.
--------------------------------------------------------------------------- */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '../core/cn'
import { useHotkeys } from '../core/hotkeys'
import { TipProvider } from '../ui/tooltip'
import { Toaster } from '../system/toast'

type Layout = 'islands' | 'overlay' | 'docked'
const StudioCtx = createContext<{ present: boolean; setPresent: (b: boolean) => void; layout: Layout }>({ present: false, setPresent: () => {}, layout: 'islands' })
export const useStudio = () => useContext(StudioCtx)

export function Studio({
  toolbar, left, right, bottom, children, layout = 'islands', className, leftWidth = 240, rightWidth, statusbar,
}: {
  toolbar?: ReactNode; left?: ReactNode; right?: ReactNode; bottom?: ReactNode; statusbar?: ReactNode
  children: ReactNode; layout?: Layout; className?: string; leftWidth?: number; rightWidth?: number
}) {
  const [present, setPresent] = useState(false)
  useHotkeys({ 'mod+\\': () => setPresent((p) => !p), esc: present ? () => setPresent(false) : undefined }, [present])
  const rw = rightWidth ? `${rightWidth}px` : 'var(--inspector-w)'

  const shell =
    layout === 'overlay' ? (
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0">{children}</div>
        {!present && (
          <div className="pointer-events-none absolute inset-0 flex flex-col gap-[var(--gutter)] p-[var(--gutter)]">
            {toolbar && <div className="pointer-events-auto flex-none">{toolbar}</div>}
            <div className="flex min-h-0 flex-1 gap-[var(--gutter)]">
              {left && <aside className="pointer-events-auto flex min-h-0 flex-none flex-col" style={{ width: leftWidth }}>{left}</aside>}
              <div className="flex-1" />
              {right && <aside className="pointer-events-auto flex min-h-0 flex-none flex-col" style={{ width: rw }}>{right}</aside>}
            </div>
            {bottom && <div className="pointer-events-auto flex-none">{bottom}</div>}
          </div>
        )}
      </div>
    ) : layout === 'docked' ? (
      <div className="flex h-full flex-col">
        {toolbar && !present && <div className="flex-none border-b border-line bg-panel px-2 py-1.5">{toolbar}</div>}
        <div className="flex min-h-0 flex-1">
          {left && !present && <aside className="flex min-h-0 flex-none flex-col border-r border-line bg-panel" style={{ width: leftWidth }}>{left}</aside>}
          <main className="relative min-w-0 flex-1">{children}</main>
          {right && !present && <aside className="flex min-h-0 flex-none flex-col border-l border-line bg-panel" style={{ width: rw }}>{right}</aside>}
        </div>
        {bottom && !present && <div className="flex-none border-t border-line bg-panel">{bottom}</div>}
      </div>
    ) : (
      <div className="flex h-full flex-col gap-[var(--gutter)] p-[var(--gutter)]">
        {toolbar && !present && <div className="flex-none">{toolbar}</div>}
        <div className="flex min-h-0 flex-1 gap-[var(--gutter)]">
          {left && !present && <aside className="flex min-h-0 flex-none flex-col" style={{ width: leftWidth }}>{left}</aside>}
          <main className="relative min-w-0 flex-1">{children}</main>
          {right && !present && <aside className="flex min-h-0 flex-none flex-col" style={{ width: rw }}>{right}</aside>}
        </div>
        {bottom && !present && <div className="flex-none">{bottom}</div>}
      </div>
    )

  return (
    <StudioCtx.Provider value={{ present, setPresent, layout }}>
      <TipProvider>
        <div className={cn('studio h-full w-full overflow-hidden bg-field text-fg no-select', className)}>
          {shell}
          {statusbar}
          {present && (
            <button type="button" onClick={() => setPresent(false)}
              className="cluster fixed right-3 bottom-3 z-50 h-7 px-2.5 text-[11.5px] text-muted opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
              Show interface
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
      <div className={cn('min-h-0 flex-1', scroll ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden')}>{children}</div>
      {footer && <div className="flex-none border-t border-line">{footer}</div>}
    </div>
  )
}

/* Panel header with a title or tabs. */
export function PanelHeader({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-10 items-center gap-1 border-b border-line pr-2 pl-3', className)}>
      {title && <div className="min-w-0 flex-1 truncate text-[12px] font-semibold text-fg">{title}</div>}
      {children}
    </div>
  )
}

/* Text tabs in a panel header (Design / Prototype, Layers / Assets). */
export function PanelTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (t: T) => void; tabs: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="flex flex-1 items-center gap-0.5">
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('h-7 rounded-[6px] px-2 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
            value === t.value ? 'bg-active text-fg' : 'text-muted hover:text-fg')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* Empty state: say what to do, not that there is nothing. */
export function Empty({ icon: Icon, title, hint, action }: { icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {Icon && <div className="text-faint"><Icon size={20} strokeWidth={1.5} /></div>}
      <div className="text-[12px] font-medium text-fg">{title}</div>
      {hint && <div className="max-w-[220px] text-[11.5px] leading-relaxed text-muted">{hint}</div>}
      {action}
    </div>
  )
}
