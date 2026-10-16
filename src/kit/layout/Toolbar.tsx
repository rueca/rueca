/* ---------------------------------------------------------------------------
   Toolbar — 2–3 detached pill clusters, no bar behind them. Secondary
   actions are bare low-opacity glyphs; only the primary action is filled.

     <Toolbar
       start={<><Brand name="Ripple" /> <Cluster>…</Cluster></>}   // the mark alone; doc only for live state
       center={<Cluster>tools</Cluster>}
       end={<><Cluster>…</Cluster><Button variant="primary">Export</Button></>}
     />
--------------------------------------------------------------------------- */
import { createContext, forwardRef, useContext, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import { Command, Keyboard, LayoutGrid } from 'lucide-react'
import { cn } from '../core/cn'
import { useStudio } from './Studio'
import { Menu, type MenuItem } from '../ui/controls'
import { Tip } from '../ui/tooltip'
import { openPalette, usePaletteAvailable } from '../system/palette'

export function Toolbar({ start, center, end, className }: { start?: ReactNode; center?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    // large buttons here (Export, Hand off) stand as tall as the clusters beside them, at every density
    <header className={cn('grid h-bar grid-cols-[1fr_auto_1fr] items-center gap-2 [--d-button-lg:var(--d-bar)]', className)}>
      <div className="flex min-w-0 items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{center}</div>
      <div className="flex min-w-0 items-center justify-end gap-2">{end}</div>
    </header>
  )
}

/* Fields inside a cluster (segmented, scrub values, selects) take the icon buttons' height, so a toolbar row is one height */
export function Cluster({ children, className }: { children: ReactNode; className?: string }) {
  const { layout } = useStudio()
  return <div className={cn('flex h-bar items-center gap-0.5 px-1 [--d-control:var(--d-icon)]', layout === 'docked' ? '' : 'cluster', className)}>{children}</div>
}

/**
 * The tool's mark: a button with the tool name as its tooltip, opening the tool menu ("All tools", then any
 * `menu` items). `doc` sits beside it only when it's live state, such as the open file, an editable title or
 * the active look. A fixed caption repeats what the artboard already shows, so leave it out.
 *   <Brand name="Dither lab" doc={file.name} mark={<Glyph />} />
 */
const BrandOverrideContext = createContext<{ mark: ReactNode; tile: boolean } | null>(null)

/**
 * A host that runs many tools (a gallery, a product site) gives them one mark: every <Brand> inside shows
 * `mark` in place of its own. `tile={false}` (the default) draws it bare, in ink, the way a logo sits in a
 * site header; `tile` keeps the inverted square. A tool used on its own keeps its own mark.
 *   <BrandOverride mark={<Logo />}><Tool /></BrandOverride>
 */
export function BrandOverride({ mark, tile = false, children }: { mark: ReactNode; tile?: boolean; children: ReactNode }) {
  return <BrandOverrideContext.Provider value={{ mark, tile }}>{children}</BrandOverrideContext.Provider>
}

export function Brand({ name, doc, mark, href = '#/', menu = [] }: {
  name: string; doc?: ReactNode; mark?: ReactNode
  /** where "All tools" goes; false drops it */
  href?: string | false
  /** more items for the mark's menu (About, Keyboard shortcuts…) */
  menu?: MenuItem[]
}) {
  const { layout } = useStudio()
  const host = useContext(BrandOverrideContext)
  const palette = usePaletteAvailable()
  const items: MenuItem[] = [
    { type: 'title', label: name },
    { type: 'separator' },
    ...(href ? [{ label: 'All tools', icon: LayoutGrid, onClick: () => { location.href = href } } as MenuItem] : []),
    // the palette and the shortcut sheet are otherwise only reachable by knowing ⌘K and ?
    ...(palette ? [
      { label: 'Command palette', icon: Command, shortcut: 'mod+k', onClick: () => openPalette('palette') } as MenuItem,
      { label: 'Keyboard shortcuts', icon: Keyboard, shortcut: '?', onClick: () => openPalette('sheet') } as MenuItem,
    ] : []),
    ...(menu.length ? [{ type: 'separator' } as MenuItem, ...menu] : []),
  ]
  return (
    <div className={cn('flex h-bar min-w-0 items-center gap-1', doc ? 'pr-3 pl-1' : 'px-1', layout !== 'docked' && 'cluster')}>
      <Menu items={items} trigger={<BrandMark name={name} mark={host ? host.mark : mark} tile={host ? host.tile : true} />} />
      {/* a few px of room inside the truncating box, so an editable title's focus ring isn't cut to slivers */}
      {doc && <span className="-mx-[3px] min-w-0 truncate p-[3px] text-title text-fg-muted">{doc}</span>}
    </div>
  )
}

const BrandMark = forwardRef<HTMLButtonElement, { name: string; mark?: ReactNode; tile?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>>(({ name, mark, tile = true, className, ...rest }, ref) => (
  <Tip label={name}>
    <button ref={ref} type="button" aria-label={name} {...rest}
      className={cn('flex size-icon shrink-0 items-center justify-center rounded-control outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:bg-hover', className)}>
      {tile ? (
        <span className="flex size-5 items-center justify-center rounded-control bg-fg text-field">
          {mark ?? <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>}
        </span>
      ) : <span className="flex items-center justify-center text-fg">{mark}</span>}
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
