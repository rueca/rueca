/* ---------------------------------------------------------------------------
   QuickAdd — a searchable popover that opens AT A POINT (the cursor), not
   centred like the ⌘K palette. Cables / Blender / Unreal "add node" search:

     <QuickAdd open={!!at} at={at} onClose={close} items={items} onPick={(id) => add(id)} />

   Type to filter (fuzzy over label + keywords), ↑↓ to move, ↵ to pick, Esc
   or click outside to dismiss. Items are grouped by `group` and can carry a
   coloured icon tile (category colour) and a trailing `meta` (port dots,
   shortcut). `context` renders a line above the list, e.g. "Connect to
   Noise · Image" when the popover was opened by dropping a wire.

   Kit candidate: generic, token-styled, no graph knowledge.
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Command as Cmdk } from 'cmdk'
import { Search } from 'lucide-react'
import { Kbd, cn } from '@kit'

export interface QuickAddItem {
  id: string
  label: string
  group: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  /** CSS colour for the icon tile (e.g. a category var) */
  tint?: string
  hint?: string
  keywords?: string[]
  meta?: ReactNode
}

export function QuickAdd({
  open, at, onClose, items, onPick, placeholder = 'Search nodes…', context, empty = 'Nothing matches',
}: {
  open: boolean
  at: { x: number; y: number } | null
  onClose: () => void
  items: QuickAddItem[]
  onPick: (id: string) => void
  placeholder?: string
  context?: ReactNode
  empty?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const groups = [...new Set(items.map((i) => i.group))]

  // Clamp into the viewport once we know our size; flip above the cursor near the bottom edge.
  useLayoutEffect(() => {
    if (!open || !at) return
    const r = box.current?.getBoundingClientRect()
    const w = r?.width ?? 280, h = r?.height ?? 360
    const left = Math.max(8, Math.min(at.x, innerWidth - w - 8))
    const top = at.y + h > innerHeight - 8 ? Math.max(8, at.y - h) : at.y
    setPos({ left, top })
  }, [open, at])
  // focus once positioned (an element that is still hidden cannot take focus)
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
      aria-label="Add"
      className="pop fixed z-[160] w-[280px] overflow-hidden outline-none"
      style={{ left: pos?.left ?? at.x, top: pos?.top ?? at.y, opacity: pos ? 1 : 0 }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); onClose() } }}
    >
      <Cmdk loop label="Add" className="flex flex-col">
        <div className="flex h-9 items-center gap-2 border-b border-line px-3">
          <Search size={14} strokeWidth={1.5} className="shrink-0 text-faint" />
          <Cmdk.Input ref={input} autoFocus placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-faint" />
          <Kbd>esc</Kbd>
        </div>
        {context && <div className="border-b border-line px-3 py-1.5 text-[11px] text-muted">{context}</div>}
        <Cmdk.List className="max-h-[300px] overflow-y-auto p-1">
          <Cmdk.Empty className="px-3 py-5 text-center text-[11.5px] text-muted">{empty}</Cmdk.Empty>
          {groups.map((g) => (
            <Cmdk.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-faint">
              {items.filter((i) => i.group === g).map((i) => {
                const Icon = i.icon
                return (
                  <Cmdk.Item
                    key={i.id}
                    value={`${i.label} ${i.group} ${i.keywords?.join(' ') ?? ''}`}
                    onSelect={() => { onPick(i.id); onClose() }}
                    className={cn('group/qa flex h-8 cursor-default items-center gap-2 rounded-[6px] px-1.5 text-[12px] text-fg outline-none',
                      'data-[selected=true]:bg-accent-strong data-[selected=true]:text-accent-fg')}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px]" style={{ background: i.tint ? `color-mix(in srgb, ${i.tint} 18%, transparent)` : undefined, color: i.tint }}>
                      {Icon && <Icon size={13} strokeWidth={1.5} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{i.label}</span>
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
