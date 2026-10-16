/* ---------------------------------------------------------------------------
   Toolbar — 2–3 detached pill clusters, no bar behind them. Secondary
   actions are bare low-opacity glyphs; only the primary action is filled.

     <Toolbar
       start={<><Brand name="Ripple" /> <Cluster>…</Cluster></>}   // the mark alone; doc only for live state
       center={<Cluster>tools</Cluster>}
       end={<><Cluster>…</Cluster><Button variant="primary">Export</Button></>}
     />
--------------------------------------------------------------------------- */
import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../core/cn'
import { useStudio } from './Studio'
import { Menu, type MenuItem } from '../ui/controls'
import { Tip } from '../ui/tooltip'

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

/**
 * The tool's mark: a button with the tool name as its tooltip, opening the tool menu ("All tools", then any
 * `menu` items). `doc` sits beside it only when it's live state, such as the open file, an editable title or
 * the active look. A fixed caption repeats what the artboard already shows, so leave it out.
 *   <Brand name="Dither lab" doc={file.name} mark={<Glyph />} />
 */
export function Brand({ name, doc, mark, href = '#/', menu = [] }: {
  name: string; doc?: ReactNode; mark?: ReactNode
  /** where "All tools" goes; false drops it */
  href?: string | false
  /** more items for the mark's menu (About, Keyboard shortcuts…) */
  menu?: MenuItem[]
}) {
  const { layout } = useStudio()
  const items: MenuItem[] = [
    { type: 'label', label: name },
    ...(href ? [{ label: 'All tools', icon: LayoutGrid, onClick: () => { location.href = href } } as MenuItem] : []),
    ...(menu.length ? [{ type: 'separator' } as MenuItem, ...menu] : []),
  ]
  return (
    <div className={cn('flex h-bar min-w-0 items-center gap-1', doc ? 'pr-3 pl-1' : 'px-1', layout !== 'docked' && 'cluster')}>
      <Menu items={items} trigger={<BrandMark name={name} mark={mark} />} />
      {/* a few px of room inside the truncating box, so an editable title's focus ring isn't cut to slivers */}
      {doc && <span className="-mx-[3px] min-w-0 truncate p-[3px] text-title text-fg-muted">{doc}</span>}
    </div>
  )
}

const BrandMark = forwardRef<HTMLButtonElement, { name: string; mark?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>>(({ name, mark, className, ...rest }, ref) => (
  <Tip label={name}>
    <button ref={ref} type="button" aria-label={name} {...rest}
      className={cn('flex size-icon shrink-0 items-center justify-center rounded-control outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:bg-hover', className)}>
      <span className="flex size-5 items-center justify-center rounded-control bg-fg text-field">
        {mark ?? <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>}
      </span>
    </button>
  </Tip>
))
BrandMark.displayName = 'BrandMark'

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
