/* ---------------------------------------------------------------------------
   StackList (kit candidate) — the Fills / Strokes / Effects pattern shared by
   Figma, Paper, Affinity and Rive: an ordered list of layers where the TOP
   row paints last, each with its own eye and remove, drag to reorder.

     <StackList items={fills} onChange={(next, final) => …} renderRow={(p, set) => <PaintField … />} />

   - rows render top layer first (reverse of paint order), like Figma
   - drag the grip to reorder (accent insertion line); ⌥↑ / ⌥↓ is the
     keyboard path (WCAG 2.5.7)
   - eye + remove are always visible on the focused/hovered row, faint otherwise
   - `mixed` shows the multi-selection placeholder instead of rows
--------------------------------------------------------------------------- */
import { useRef, useState, type ReactNode } from 'react'
import { Eye, EyeOff, GripVertical, Minus } from 'lucide-react'
import { cn } from '@kit'

export interface StackItem { id: string; visible: boolean }

export function StackList<T extends StackItem>({
  items, onChange, renderRow, mixed, mixedHint = 'Click + to replace mixed content', toggle = true,
}: {
  items: T[]
  onChange: (next: T[], final: boolean) => void
  renderRow: (item: T, set: (patch: Partial<T>, final?: boolean) => void, index: number) => ReactNode
  mixed?: boolean
  mixedHint?: string
  toggle?: boolean
}) {
  const [drag, setDrag] = useState<{ id: string; to: number } | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; to: number } | null>(null)
  if (mixed) return <div className="px-3 pb-1 text-[11.5px] text-faint">{mixedHint}</div>
  if (!items.length) return null
  const shown = [...items].reverse()
  const setAt = (id: string, patch: Partial<T>, final = true) => onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)), final)
  const move = (id: string, displayTo: number) => {
    const from = shown.findIndex((x) => x.id === id)
    if (from < 0 || displayTo === from || displayTo === from + 1) return
    const next = shown.filter((x) => x.id !== id)
    next.splice(displayTo > from ? displayTo - 1 : displayTo, 0, shown[from])
    onChange(next.reverse(), true)
  }

  const onGrip = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    const rows = [...(list.current?.querySelectorAll('[data-stack-row]') ?? [])] as HTMLElement[]
    const mv = (ev: PointerEvent) => {
      let to = rows.length
      for (let i = 0; i < rows.length; i++) { const r = rows[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { to = i; break } }
      dragRef.current = { id, to }
      setDrag(dragRef.current)
    }
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up)
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (d) move(d.id, d.to)
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
    dragRef.current = { id, to: shown.findIndex((x) => x.id === id) }
    setDrag(dragRef.current)
  }

  return (
    <div ref={list} className="relative flex flex-col gap-px pb-1">
      {shown.map((it, i) => (
        <div key={it.id} data-stack-row
          onKeyDown={(e) => {
            if (!e.altKey) return
            if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); move(it.id, i - 1) }
            if (e.key === 'ArrowDown' && i < shown.length - 1) { e.preventDefault(); move(it.id, i + 2) }
          }}
          className={cn('group/stack relative flex h-[var(--row)] items-center gap-1 pr-2 pl-1', drag?.id === it.id && 'opacity-50', !it.visible && '[&_[data-stack-body]]:opacity-45')}>
          {drag && drag.to === i && drag.id !== it.id && <div className="pointer-events-none absolute -top-px right-2 left-3 h-0.5 rounded-full bg-accent" />}
          {drag && drag.to === shown.length && i === shown.length - 1 && <div className="pointer-events-none absolute right-2 -bottom-px left-3 h-0.5 rounded-full bg-accent" />}
          <button type="button" aria-label="Drag to reorder (⌥↑ ⌥↓)" onPointerDown={(e) => onGrip(e, it.id)}
            className={cn('flex h-6 w-3 shrink-0 cursor-grab items-center justify-center text-faint opacity-0 outline-none group-hover/stack:opacity-100 focus-visible:opacity-100', shown.length < 2 && 'invisible')}>
            <GripVertical size={12} strokeWidth={1.5} />
          </button>
          <div data-stack-body className="flex min-w-0 flex-1 items-center gap-1.5">{renderRow(it, (patch, final) => setAt(it.id, patch, final), items.indexOf(it))}</div>
          {toggle && (
            <button type="button" aria-label={it.visible ? 'Hide' : 'Show'} aria-pressed={!it.visible} onClick={() => setAt(it.id, { visible: !it.visible } as Partial<T>)}
              className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
              {it.visible ? <Eye size={13} strokeWidth={1.5} /> : <EyeOff size={13} strokeWidth={1.5} />}
            </button>
          )}
          <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((x) => x.id !== it.id), true)}
            className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent">
            <Minus size={13} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  )
}
