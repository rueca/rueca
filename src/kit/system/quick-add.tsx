/* ---------------------------------------------------------------------------
   QuickAdd — a searchable popover that opens AT A POINT (the cursor), not
   centred like the ⌘K palette. Blender / Unreal / Cables "add node" search,
   FigJam's drop-a-connector-on-empty-canvas menu.

     <QuickAdd open={!!at} at={at} onClose={close} items={items} onPick={(id) => add(id, at)}
       context="Connect to Noise · image" />

   Behaviour / keyboard
     type        → filter (fuzzy over label, group and keywords)
     ↑ / ↓       → move        ↵ → pick        Esc / click outside → close
   Items are grouped by `group` and can carry an icon on a tinted tile
   (`tint` is any CSS colour, e.g. 'var(--cat-3)'), a `hint` and a trailing
   `meta` (port dots, a shortcut). `context` is a line above the list, e.g.
   what a dropped wire will connect to. The popover clamps into the viewport
   and flips above the point near the bottom edge.

   Accessibility: role="dialog" with an aria-label; the field and list are a
   cmdk combobox/listbox (aria-activedescendant). Focus moves to the field on
   open and returns to whatever had it on close.
   (Promoted from shells/nodes/local/QuickAdd.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Command as Cmdk } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '../core/cn'
import { Kbd } from '../ui/button'

export interface QuickAddItem {
  id: string
  label: string
  group?: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  /** CSS colour for the icon tile (a categorical var) */
  tint?: string
  hint?: string
  keywords?: string[]
  meta?: ReactNode
  disabled?: boolean
}

export interface QuickAddProps {
  open: boolean
  /** viewport coordinates (clientX / clientY) */
  at: { x: number; y: number } | null
  onClose: () => void
  items: QuickAddItem[]
  onPick: (id: string) => void
  placeholder?: string
  /** a line above the list (what this will connect to) */
  context?: ReactNode
  empty?: ReactNode
  /** accessible name */
  label?: string
  width?: number
}

export function QuickAdd({
  open, at, onClose, items, onPick, placeholder = 'Search…', context, empty = 'Nothing matches', label = 'Add', width = 280,
}: QuickAddProps) {
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const groups = [...new Set(items.map((i) => i.group ?? ''))]

  // Clamp into the viewport once we know our size; flip above the point near the bottom edge.
  useLayoutEffect(() => {
    if (!open || !at) return
    const r = box.current?.getBoundingClientRect()
    const w = r?.width ?? width, h = r?.height ?? 360
    const left = Math.max(8, Math.min(at.x, innerWidth - w - 8))
    const top = at.y + h > innerHeight - 8 ? Math.max(8, at.y - h) : at.y
    setPos({ left, top })
  }, [open, at, width])

  // focus once positioned (a hidden element cannot take focus); give it back on close
  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement as HTMLElement | null
    return () => { const el = returnTo.current; if (el && document.contains(el)) el.focus({ preventScroll: true }) }
  }, [open])
  useEffect(() => { if (open && pos) input.current?.focus() }, [open, pos])
  useEffect(() => { if (!open) setPos(null) }, [open])

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) onClose() }
    window.addEventListener('pointerdown', down, true)
    return () => window.removeEventListener('pointerdown', down, true)
  }, [open, onClose])

  if (!open || !at) return null
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={label}
      className="pop fixed z-[160] overflow-hidden outline-none"
      style={{ left: pos?.left ?? at.x, top: pos?.top ?? at.y, width, opacity: pos ? 1 : 0 }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); onClose() } }}
    >
      <Cmdk loop label={label} className="flex flex-col">
        <div className="flex h-9 items-center gap-2 border-b border-line px-3">
          <Search size={14} strokeWidth={1.5} className="shrink-0 text-fg-faint" />
          <Cmdk.Input ref={input} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint" />
          <Kbd>esc</Kbd>
        </div>
        {context && <div className="border-b border-line px-3 py-1.5 text-[11px] text-fg-muted">{context}</div>}
        <Cmdk.List className="max-h-[300px] overflow-y-auto p-1">
          <Cmdk.Empty className="px-3 py-5 text-center text-[11.5px] text-fg-muted">{empty}</Cmdk.Empty>
          {groups.map((g) => (
            <Cmdk.Group key={g || '_'} heading={g || undefined}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-fg-muted">
              {items.filter((i) => (i.group ?? '') === g).map((i) => {
                const Icon = i.icon
                return (
                  <Cmdk.Item
                    key={i.id}
                    value={`${i.label} ${i.group ?? ''} ${i.keywords?.join(' ') ?? ''} ${i.id}`}
                    disabled={i.disabled}
                    onSelect={() => { onPick(i.id); onClose() }}
                    className={cn('flex h-8 cursor-default items-center gap-2 rounded-[6px] px-1.5 text-[12px] text-fg outline-none data-[disabled=true]:opacity-40',
                      'data-[selected=true]:bg-signal-strong data-[selected=true]:text-signal-fg')}
                  >
                    {(Icon || i.tint) && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px]"
                        style={i.tint ? { background: `color-mix(in srgb, ${i.tint} 18%, transparent)`, color: i.tint } : undefined}>
                        {Icon && <Icon size={13} strokeWidth={1.5} />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{i.label}</span>
                    {i.hint && <span className="shrink-0 truncate text-[11px] opacity-70">{i.hint}</span>}
                    {i.meta && <span className="flex shrink-0 items-center gap-1 opacity-80">{i.meta}</span>}
                  </Cmdk.Item>
                )
              })}
            </Cmdk.Group>
          ))}
        </Cmdk.List>
      </Cmdk>
    </div>,
    document.body,
  )
}
