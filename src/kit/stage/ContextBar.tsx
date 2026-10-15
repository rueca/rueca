/* ---------------------------------------------------------------------------
   ContextBar — Affinity's selection-aware context toolbar: a small floating
   bar under the selection with only the 3–8 verbs that make sense for THIS
   selection. The inspector stays the complete surface; this is a shortcut.

     <ContextBar anchor={screenRect} actions={[
       { icon: AlignLeft, label: 'Align left', shortcut: 'alt+a', onClick: … },
       many && { icon: Columns3, label: 'Distribute', onClick: … },
       { type: 'divider' },
       { type: 'menu', icon: Ellipsis, label: 'More', items: menuItems },
     ]} />

   Or compose by hand: <ContextBar anchor={r}><IconButton …/><ContextBar.Divider /></ContextBar>

   Behaviour
     · centred under `anchor` (screen px, relative to the positioned parent —
       usually a Stage `overlay`); flips above when there is no room below;
       clamped inside the parent minus `inset` (e.g. { bottom: 56 } to clear a
       tool dock). `gap` defaults to 34 so it clears TransformBox's size badge.
     · falsy entries are skipped and dividers collapse (no leading, trailing or
       double dividers), so conditional groups compose cleanly
     · pointer-down inside does not reach the canvas (no accidental deselect)
     · hide it while a gesture is running — that is the caller's call
   Keyboard: role="toolbar"; ← / → move between buttons, Home / End jump.
   Each action is an IconButton (tooltip + aria-label + shortcut hint).
   (Promoted from shells/ui-design/local/SelectionBar.tsx.)
--------------------------------------------------------------------------- */
import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { cn } from '../core/cn'
import { IconButton } from '../ui/button'
import { Menu, type MenuItem } from '../ui/controls'

type IconCmp = ComponentType<{ size?: number; strokeWidth?: number }>
export type ContextAction =
  | { type?: 'action'; id?: string; icon: IconCmp; label: string; shortcut?: string; onClick: () => void; active?: boolean; disabled?: boolean }
  | { type: 'menu'; id?: string; icon: IconCmp; label: string; items: MenuItem[]; active?: boolean; align?: 'start' | 'center' | 'end' }
  | { type: 'divider' }
  | { type: 'custom'; id?: string; node: ReactNode }

export interface ContextBarProps {
  anchor: { x: number; y: number; w: number; h: number }
  actions?: (ContextAction | false | null | undefined)[]
  children?: ReactNode
  /** distance below the anchor (px) */
  gap?: number
  /** keep-out margins inside the positioned parent */
  inset?: { top?: number; right?: number; bottom?: number; left?: number }
  label?: string
  className?: string
}

function tidy(list: ContextBarProps['actions']) {
  const out: ContextAction[] = []
  for (const a of list ?? []) {
    if (!a) continue
    if (a.type === 'divider' && (!out.length || out.at(-1)!.type === 'divider')) continue
    out.push(a)
  }
  while (out.length && out.at(-1)!.type === 'divider') out.pop()
  return out
}

export function ContextBar({ anchor, actions, children, gap = 34, inset = {}, label = 'Selection actions', className }: ContextBarProps) {
  const el = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const { top: it = 8, right: ir = 8, bottom: ib = 8, left: il = 8 } = inset
  useLayoutEffect(() => {
    const node = el.current
    const parent = node?.offsetParent as HTMLElement | null
    if (!node || !parent) return
    const W = parent.clientWidth, H = parent.clientHeight
    const w = node.offsetWidth, h = node.offsetHeight
    let top = anchor.y + anchor.h + gap
    if (top + h > H - ib) top = anchor.y - h - Math.max(8, gap - 4)
    if (top < it) top = Math.min(H - h - ib, Math.max(it, anchor.y + 8))
    const left = Math.min(W - w - ir, Math.max(il, anchor.x + anchor.w / 2 - w / 2))
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }))
  })
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const items = [...(el.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowRight' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1)
    items[next]?.focus()
    e.preventDefault()
    e.stopPropagation()
  }
  return (
    <div
      ref={el}
      role="toolbar"
      aria-label={label}
      aria-orientation="horizontal"
      data-chrome
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
      className={cn('cluster pointer-events-auto absolute flex h-bar items-center gap-0.5 px-1 transition-opacity duration-150', className)}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, opacity: pos ? 1 : 0 }}
    >
      {tidy(actions).map((a, i) => {
        if (a.type === 'divider') return <ContextBarDivider key={`d${i}`} />
        if (a.type === 'custom') return <span key={a.id ?? `c${i}`} className="contents">{a.node}</span>
        if (a.type === 'menu') return <Menu key={a.id ?? a.label} align={a.align ?? 'center'} items={a.items} trigger={<IconButton icon={a.icon} label={a.label} active={a.active} />} />
        return <IconButton key={a.id ?? a.label} icon={a.icon} label={a.label} shortcut={a.shortcut} active={a.active} disabled={a.disabled} onClick={a.onClick} />
      })}
      {children}
    </div>
  )
}

function ContextBarDivider() {
  return <div role="separator" aria-orientation="vertical" className="mx-0.5 h-4 w-px bg-line" />
}
ContextBar.Divider = ContextBarDivider
