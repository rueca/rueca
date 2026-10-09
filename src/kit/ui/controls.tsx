import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import { cn } from '../core/cn'
import { prettyCombo } from '../core/hotkeys'
import { Tip } from './tooltip'

export type Opt = { value: string; label?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; swatch?: string }
export const normOptions = (o: (string | Opt)[]): Opt[] => o.map((x) => (typeof x === 'string' ? { value: x } : x))
const labelOf = (o: Opt) => o.label ?? o.value.charAt(0).toUpperCase() + o.value.slice(1)

/* Segmented control — a WELL with a RAISED pill. Real Radix/Base toggle group
   (role="radio"-like semantics + arrow keys), never hand-rolled divs. */
export function Segmented({
  value, onChange, options, className, size = 'md', iconOnly, label,
}: { value: string; onChange: (v: string) => void; options: (string | Opt)[]; className?: string; size?: 'sm' | 'md'; iconOnly?: boolean; label?: string }) {
  const opts = normOptions(options)
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0])}
      className={cn('flex w-full min-w-0 gap-0.5 rounded-[7px] bg-well p-[2px]', className)}
    >
      {opts.map((o) => {
        const Icon = o.icon
        const btn = (
          <Toggle
            key={o.value}
            value={o.value}
            aria-label={labelOf(o)}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[5px] px-1 font-medium text-muted outline-none no-select transition-colors duration-100',
              size === 'sm' ? 'h-5 text-[11px]' : 'h-6 text-[11.5px]',
              'hover:text-fg data-[pressed]:bg-raised data-[pressed]:text-fg data-[pressed]:shadow-[var(--shadow-segment)]',
              'focus-visible:ring-2 focus-visible:ring-accent',
            )}
          >
            {Icon && <Icon size={13} strokeWidth={1.5} />}
            {!(iconOnly && Icon) && <span className="truncate">{labelOf(o)}</span>}
          </Toggle>
        )
        return iconOnly || o.hint ? <Tip key={o.value} label={o.hint ?? labelOf(o)}>{btn}</Tip> : btn
      })}
    </ToggleGroup>
  )
}

/* Icon tiles — a set of square toggles, single or multi. Puff's "kinds" row. */
export function Tiles({
  value, onChange, options, multiple, columns = 5,
}: { value: string[]; onChange: (v: string[]) => void; options: (string | Opt)[]; multiple?: boolean; columns?: number }) {
  const opts = normOptions(options)
  return (
    <ToggleGroup
      multiple={multiple}
      value={value}
      onValueChange={(v) => onChange(v as string[])}
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {opts.map((o) => {
        const Icon = o.icon
        return (
          <Tip key={o.value} label={o.hint ?? labelOf(o)}>
            <Toggle
              value={o.value}
              aria-label={labelOf(o)}
              className={cn(
                'flex aspect-square min-h-0 flex-col items-center justify-center gap-1 rounded-[7px] bg-input text-muted outline-none transition-colors',
                'hover:text-fg data-[pressed]:bg-accent-soft data-[pressed]:text-accent data-[pressed]:shadow-[inset_0_0_0_1px_var(--accent)]',
                'focus-visible:ring-2 focus-visible:ring-accent',
              )}
            >
              {o.swatch ? (
                <span className="size-4 rounded-full shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: o.swatch }} />
              ) : Icon ? (
                <Icon size={15} strokeWidth={1.5} />
              ) : (
                <span className="text-[11px] font-medium">{labelOf(o)}</span>
              )}
            </Toggle>
          </Tip>
        )
      })}
    </ToggleGroup>
  )
}

export function Switch({ checked, onChange, label, size = 'md' }: { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md' }) {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full bg-track p-[2px] outline-none transition-colors duration-150',
        'data-[checked]:bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel',
        size === 'sm' ? 'h-4 w-[26px]' : 'h-[18px] w-[30px]',
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          'block rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.35)] transition-transform duration-150',
          size === 'sm' ? 'size-3 data-[checked]:translate-x-[10px]' : 'size-[14px] data-[checked]:translate-x-[12px]',
        )}
      />
    </BaseSwitch.Root>
  )
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex size-[14px] shrink-0 items-center justify-center rounded-[4px] outline-none transition-colors',
        checked ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover',
        'focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      {checked && <Check size={10} strokeWidth={3} />}
    </button>
  )
}

/* Dropdown select — for long lists. Modes with ≤4 options should be Segmented. */
export function Select({
  value, onChange, options, className, label, placeholder,
}: { value: string; onChange: (v: string) => void; options: (string | Opt)[]; className?: string; label?: string; placeholder?: string }) {
  const opts = normOptions(options)
  const cur = opts.find((o) => o.value === value)
  return (
    <BaseSelect.Root value={value} onValueChange={(v) => v != null && onChange(v as string)} items={opts.map((o) => ({ value: o.value, label: labelOf(o) }))}>
      <BaseSelect.Trigger
        aria-label={label}
        className={cn(
          'flex h-6 w-full min-w-0 items-center justify-between gap-1 rounded-[5px] bg-input pr-1 pl-2 text-[11.5px] text-fg outline-none',
          'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-accent data-[popup-open]:shadow-[inset_0_0_0_1px_var(--accent)]',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {cur?.swatch && <span className="size-3 shrink-0 rounded-full" style={{ background: cur.swatch }} />}
          {cur ? labelOf(cur) : <span className="text-faint">{placeholder}</span>}
        </span>
        <BaseSelect.Icon className="text-faint"><ChevronDown size={12} strokeWidth={1.75} /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-[100] outline-none">
          <BaseSelect.Popup className="pop max-h-[min(360px,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto p-1 outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <BaseSelect.List>
            {opts.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                className="flex h-7 cursor-default items-center gap-2 rounded-[5px] pr-6 pl-2 text-[12px] text-fg outline-none select-none data-[highlighted]:bg-accent-strong data-[highlighted]:text-accent-fg"
              >
                <span className="flex w-3 justify-center"><BaseSelect.ItemIndicator><Check size={12} strokeWidth={2} /></BaseSelect.ItemIndicator></span>
                {o.swatch && <span className="size-3 rounded-full" style={{ background: o.swatch }} />}
                <BaseSelect.ItemText>{labelOf(o)}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}

export function TextInput({
  value, onChange, placeholder, className, multiline, mono, maxLength, onCommit, rows = 3, label,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; multiline?: boolean; mono?: boolean; maxLength?: number; onCommit?: (v: string) => void; rows?: number; label?: string }) {
  const cls = cn(
    'w-full min-w-0 rounded-[5px] bg-input px-2 text-[11.5px] text-fg outline-none placeholder:text-faint',
    'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_1px_var(--accent)]',
    mono && 'font-mono text-[11px]',
    multiline ? 'resize-none py-1.5 leading-relaxed' : 'h-6',
    className,
  )
  return multiline ? (
    <textarea aria-label={label} className={cls} rows={rows} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} onBlur={(e) => onCommit?.(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
  ) : (
    <input aria-label={label} className={cls} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} onBlur={(e) => onCommit?.(e.target.value)}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
  )
}

/* Menus — the export menu, the preset menu, the zoom menu. */
export type MenuItem =
  | { type?: 'item'; label: string; onClick: () => void; shortcut?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; disabled?: boolean; danger?: boolean; checked?: boolean; hint?: string }
  | { type: 'separator' }
  | { type: 'label'; label: string }
  | { type: 'submenu'; label: string; items: MenuItem[]; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }

function MenuItems({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((it, i) => {
        if (it.type === 'separator') return <BaseMenu.Separator key={i} className="mx-2 my-1 h-px bg-line" />
        if (it.type === 'label') return <div key={i} className="px-2 pt-1.5 pb-1 text-[11px] text-faint">{it.label}</div>
        if (it.type === 'submenu') {
          const Icon = it.icon
          return (
            <BaseMenu.SubmenuRoot key={i}>
              <BaseMenu.SubmenuTrigger className={itemCls}>
                <span className="flex w-4 justify-center text-muted">{Icon && <Icon size={14} strokeWidth={1.5} />}</span>
                <span className="flex-1">{it.label}</span>
                <ChevronRight size={12} className="text-faint" />
              </BaseMenu.SubmenuTrigger>
              <BaseMenu.Portal>
                <BaseMenu.Positioner sideOffset={2} className="z-[101] outline-none">
                  <BaseMenu.Popup className={popupCls}><MenuItems items={it.items} /></BaseMenu.Popup>
                </BaseMenu.Positioner>
              </BaseMenu.Portal>
            </BaseMenu.SubmenuRoot>
          )
        }
        const Icon = it.icon
        return (
          <BaseMenu.Item key={i} disabled={it.disabled} onClick={it.onClick} className={cn(itemCls, it.danger && 'text-rec')}>
            <span className="flex w-4 justify-center text-muted group-data-[highlighted]/item:text-accent-fg">
              {it.checked ? <Check size={13} strokeWidth={2} /> : Icon ? <Icon size={14} strokeWidth={1.5} /> : null}
            </span>
            <span className="flex-1">{it.label}</span>
            {it.shortcut && <span className="text-[11px] text-faint group-data-[highlighted]/item:text-accent-fg/70">{prettyCombo(it.shortcut)}</span>}
          </BaseMenu.Item>
        )
      })}
    </>
  )
}

const itemCls =
  'group/item flex h-7 cursor-default items-center gap-2 rounded-[5px] px-2 text-[12px] text-fg outline-none select-none data-[highlighted]:bg-accent-strong data-[highlighted]:text-accent-fg data-[disabled]:opacity-40 data-[popup-open]:bg-hover'
const popupCls =
  'pop min-w-[200px] p-1 outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0'

export function Menu({ trigger, items, side = 'bottom', align = 'start' }: { trigger: ReactElement; items: MenuItem[]; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end' }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner side={side} align={align} sideOffset={6} className="z-[100] outline-none">
          <BaseMenu.Popup className={popupCls}><MenuItems items={items} /></BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export function Divider({ vertical, className }: { vertical?: boolean; className?: string }) {
  return <div className={cn(vertical ? 'mx-0.5 h-4 w-px' : 'my-1 h-px w-full', 'bg-line', className)} />
}

export function Badge({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'accent' | 'key' | 'rec' | 'ok'; className?: string }) {
  const tones = {
    default: 'bg-hover text-muted',
    accent: 'bg-accent-soft text-accent',
    key: 'bg-key/15 text-key',
    rec: 'bg-rec/15 text-rec',
    ok: 'bg-ok/15 text-ok',
  }
  return <span className={cn('inline-flex h-[18px] items-center gap-1 rounded-[5px] px-1.5 text-[10.5px] font-medium tabular', tones[tone], className)}>{children}</span>
}
