/* ---------------------------------------------------------------------------
   Toolbar — 2–3 detached pill clusters, no bar behind them. Secondary
   actions are bare low-opacity glyphs; only the primary action is filled.

     <Toolbar
       start={<><Brand name="Ripple" /> <Cluster>…</Cluster></>}
       center={<Cluster>tools</Cluster>}
       end={<><Cluster>…</Cluster><Button variant="primary">Export</Button></>}
     />
--------------------------------------------------------------------------- */
import { isValidElement, type ComponentType, type ReactNode } from 'react'
import { cn } from '../core/cn'
import { useStudio } from './Studio'

export function Toolbar({ start, center, end, className }: { start?: ReactNode; center?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <header className={cn('grid h-bar grid-cols-[1fr_auto_1fr] items-center gap-2', className)}>
      <div className="flex min-w-0 items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{center}</div>
      <div className="flex min-w-0 items-center justify-end gap-2">{end}</div>
    </header>
  )
}

export function Cluster({ children, className }: { children: ReactNode; className?: string }) {
  const { layout } = useStudio()
  return <div className={cn('flex h-bar items-center gap-0.5 px-1', layout === 'docked' ? '' : 'cluster', className)}>{children}</div>
}

/** Title block: a small mark + the instrument name + optional doc name. */
export function Brand({ name, doc, mark, href = '#/' }: { name: string; doc?: ReactNode; mark?: ReactNode; href?: string | false }) {
  const { layout } = useStudio()
  const markEl = mark ?? <svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>
  return (
    <div className={cn('flex h-bar min-w-0 items-center gap-2 pr-3 pl-2', layout !== 'docked' && 'cluster')}>
      {href && !(isValidElement(mark) && mark.type === 'a') /* shells that pass their own <a> keep it */ ? (
        <a href={href} aria-label="Home" className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-fg text-field outline-none focus-visible:ring-2 focus-visible:ring-signal">{markEl}</a>
      ) : (
        <div className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-fg text-field">{markEl}</div>
      )}
      <span className="shrink-0 text-title font-semibold">{name}</span>
      {doc && <><span className="text-fg-faint">/</span><span className="truncate text-title text-fg-muted">{doc}</span></>}
    </div>
  )
}

/* Bottom-centre floating tool dock (Figma UI3 / Rive). */
export function ToolDock<T extends string>({
  value, onChange, tools, className, children,
}: { value: T; onChange: (t: T) => void; tools: { value: T; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; shortcut?: string }[]; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('cluster flex h-dock items-center gap-0.5 rounded-[calc(var(--radius-cluster)+2px)] px-1', className)} role="toolbar" aria-label="Tools">
      {tools.map((t) => {
        const Icon = t.icon
        const on = value === t.value
        return (
          <button key={t.value} type="button" aria-label={t.label} aria-pressed={on} title={`${t.label}${t.shortcut ? ` (${t.shortcut.toUpperCase()})` : ''}`}
            onClick={() => onChange(t.value)}
            className={cn('flex size-dock-button items-center justify-center rounded-[calc(var(--radius-cluster)-2px)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal',
              on ? 'bg-signal-strong text-signal-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
            <Icon size={16} strokeWidth={1.5} />
          </button>
        )
      })}
      {children}
    </div>
  )
}
