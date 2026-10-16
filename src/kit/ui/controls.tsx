import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useRef, type ComponentType, type ReactElement, type ReactNode } from 'react'
import { cn } from '../core/cn'
import { prettyCombo } from '../core/hotkeys'
import { Tip } from './tooltip'

export type Opt<T extends string = string> = { value: T; label?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; hint?: string; swatch?: string }
export const normOptions = (o: readonly (string | Opt)[]): Opt[] => o.map((x) => (typeof x === 'string' ? { value: x } : x))
const labelOf = (o: Opt) => o.label ?? o.value.charAt(0).toUpperCase() + o.value.slice(1)

/* Segmented control — a WELL with a RAISED pill. Real Radix/Base toggle group
   (role="radio"-like semantics + arrow keys), never hand-rolled divs. */
export function Segmented<T extends string = string>({
  value, onChange, options, className, size = 'md', iconOnly, label,
}: { value: T; onChange: (v: T) => void; options: readonly (T | Opt<T>)[]; className?: string; size?: 'sm' | 'md'; iconOnly?: boolean; label?: string }) {
  const opts = normOptions(options)
  return (
    <ToggleGroup
      aria-label={label}
      role="radiogroup"
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0] as T)}
      // announced as radios, so the arrows choose (APG radio group), not just move focus
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
        requestAnimationFrame(() => {
          const v = (document.activeElement as HTMLElement | null)?.dataset.segValue
          if (v && v !== value && opts.some((o) => o.value === v)) onChange(v as T)
        })
      }}
      // no well: a hairline holds the options and the chosen one is a quiet pill. The group is exactly one control
      // tall (the pills sit inside its 1px inset), so it lines up with the fields beside it
      className={cn('flex w-full min-w-0 gap-0.5 rounded-[calc(var(--radius-control)+1px)] p-px shadow-[inset_0_0_0_1px_var(--line)]', size === 'sm' ? 'h-control-sm' : 'h-control', className)}
    >
      {opts.map((o) => {
        const Icon = o.icon
        const btn = (
          <Toggle
            key={o.value}
            value={o.value}
            data-seg-value={o.value}
            aria-label={labelOf(o)}
            // single choice: announce as a radio, not a pressed toggle (APG radiogroup, break-it A12)
            role="radio"
            aria-checked={value === o.value}
            aria-pressed={undefined}
            className={cn(
              // flex-auto, not flex-1: options start from their label's width and share what's left, so "Stacked"
              // doesn't truncate beside "Auto" while the group still has room
              'flex h-full min-w-0 flex-auto items-center justify-center gap-1 rounded-control px-1 text-ui font-medium text-fg-muted outline-none no-select transition-colors duration-100',
              // the pill carries a hairline: on a light, translucent panel the fill alone is ~1.1:1
              'hover:text-fg data-[pressed]:bg-active data-[pressed]:text-fg data-[pressed]:shadow-[inset_0_0_0_1px_var(--line-strong)]',
              'focus-visible:ring-2 focus-visible:ring-signal',
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
  value, onChange, options, multiple, columns = 5, aspect = 'square',
}: { value: string[]; onChange: (v: string[]) => void; options: (string | Opt)[]; multiple?: boolean; columns?: number; aspect?: 'square' | 'wide' }) {
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
                aspect === 'square' ? 'aspect-square' : 'h-button-lg', 'flex min-h-0 flex-col items-center justify-center gap-1 rounded-[calc(var(--radius-control)+2px)] bg-control text-fg-muted outline-none transition-colors',
                // pressed reads like the segmented pill (neutral), not blue: tiles at rest aren't a selection highlight
                'hover:text-fg data-[pressed]:bg-active data-[pressed]:text-fg data-[pressed]:shadow-[inset_0_0_0_1px_var(--line-strong)]',
                'focus-visible:ring-2 focus-visible:ring-signal',
              )}
            >
              {o.swatch ? (
                <span className="size-4 rounded-full shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: o.swatch }} />
              ) : Icon ? (
                <Icon size={15} strokeWidth={1.5} />
              ) : (
                <span className="text-ui font-medium">{labelOf(o)}</span>
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
        'relative inline-flex shrink-0 items-center rounded-full bg-track p-[2px] outline-none transition-colors duration-150 shadow-[inset_0_0_0_1px_var(--line-strong)] data-[checked]:shadow-none',
        "after:absolute after:-inset-y-[5px] after:-inset-x-[2px] after:content-['']", // ≥24px hit area at both sizes, same look
        // on is ink, not signal: blue stays for focus and selection, so a panel of switches doesn't outshout the prototype
        'data-[checked]:bg-ink focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-1 focus-visible:ring-offset-panel',
        size === 'sm' ? 'h-[14px] w-[22px]' : 'h-4 w-[26px]',
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          'block rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.35)] transition-transform duration-150 data-[checked]:bg-ink-fg data-[checked]:shadow-none',
          size === 'sm' ? 'size-2.5 data-[checked]:translate-x-[8px]' : 'size-3 data-[checked]:translate-x-[10px]',
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
        // a 24px reach around the 14px box, as the switch has
        "relative flex size-[14px] shrink-0 items-center justify-center rounded-[4px] outline-none transition-colors after:absolute after:-inset-[5px] after:content-['']",
        checked ? 'bg-ink text-ink-fg' : 'shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover',
        'focus-visible:ring-2 focus-visible:ring-signal',
      )}
    >
      {checked && <Check size={10} strokeWidth={3} />}
    </button>
  )
}

/* Dropdown select — for long lists. Modes with ≤4 options should be Segmented. */
export function Select<T extends string = string>({
  value, onChange, options, className, label, placeholder,
}: { value: T; onChange: (v: T) => void; options: readonly (T | Opt<T>)[]; className?: string; label?: string; placeholder?: string }) {
  const opts = normOptions(options)
  const cur = opts.find((o) => o.value === value)
  return (
    <BaseSelect.Root value={value} onValueChange={(v) => v != null && onChange(v as T)} items={opts.map((o) => ({ value: o.value, label: labelOf(o) }))}>
      <BaseSelect.Trigger
        aria-label={label}
        className={cn(
          'flex h-control w-full min-w-0 items-center justify-between gap-1 rounded-control bg-control pr-1 pl-2 text-ui text-fg outline-none',
          'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {cur?.swatch && <span className="size-3 shrink-0 rounded-full" style={{ background: cur.swatch }} />}
          {cur ? labelOf(cur) : <span className="text-fg-faint">{placeholder}</span>}
        </span>
        <BaseSelect.Icon className="text-fg-faint"><ChevronDown size={12} strokeWidth={1.75} /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-[160] outline-none">
          <BaseSelect.Popup className="pop max-h-[min(360px,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto p-1 outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <BaseSelect.List>
            {opts.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                className="flex h-icon cursor-default items-center gap-2 rounded-control pr-6 pl-2 text-ui text-fg outline-none select-none data-[highlighted]:bg-signal-strong data-[highlighted]:text-signal-fg"
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

/* Text field. Global single-key shortcuts already ignore typing targets, so keys aren't
   swallowed here — ⌘↵ / ⌘S still reach the app. Pass onKeyDown for field-specific keys. */
export function TextInput({
  value, onChange, placeholder, className, multiline, mono, maxLength, onCommit, rows = 3, label, onKeyDown,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; multiline?: boolean; mono?: boolean; maxLength?: number; onCommit?: (v: string) => void; rows?: number; label?: string; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void }) {
  // Commit only a real edit, and commit it BEFORE whatever the pointer goes on to press: blurring on a
  // slider's pointerdown used to fold the slider's first drag value into the text's undo step (break-it B3-S3).
  const start = useRef<string | null>(null)
  const settle = (v: string) => { if (start.current !== null && v !== start.current) { start.current = v; onCommit?.(v) } }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = e.currentTarget
    start.current = el.value
    const early = (ev: PointerEvent) => { if (!el.contains(ev.target as Node)) settle(el.value) }
    window.addEventListener('pointerdown', early, true)
    el.addEventListener('blur', () => { window.removeEventListener('pointerdown', early, true); settle(el.value); start.current = null }, { once: true })
  }
  const revertOnEsc = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== 'Escape' || start.current === null || e.currentTarget.value === start.current) return
    e.preventDefault(); e.stopPropagation()
    onChange(start.current)
  }
  const cls = cn(
    'w-full min-w-0 rounded-control bg-control px-2 text-ui text-fg outline-none placeholder:text-fg-faint',
    'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_1px_var(--signal)]',
    mono && 'font-mono',
    // a textarea grows with its text (from `rows` lines up to ~8) instead of showing half a fourth line
    multiline ? 'resize-none py-1.5 [field-sizing:content] max-h-[calc(8*var(--ui-leading)+12px)]' : 'h-control',
    className,
  )
  return multiline ? (
    <textarea aria-label={label} className={cls} rows={rows} style={{ minHeight: `calc(${rows} * var(--ui-leading) + 12px)` }} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} onFocus={focus}
      onKeyDown={(e) => { onKeyDown?.(e); if (!e.defaultPrevented) revertOnEsc(e) }} />
  ) : (
    <input aria-label={label} className={cls} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} onFocus={focus}
      // Enter commits and keeps focus where it was; Esc puts back what the field held when it was focused
      onKeyDown={(e) => { onKeyDown?.(e); if (e.defaultPrevented) return; if (e.key === 'Enter') settle(e.currentTarget.value); else revertOnEsc(e) }} />
  )
}

/* Menus — the export menu, the preset menu, the zoom menu. */
export type MenuItem =
  | { type?: 'item'; label: string; onClick: () => void; shortcut?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; disabled?: boolean; danger?: boolean; checked?: boolean; hint?: string }
  | { type: 'separator' }
  | { type: 'label'; label: string }
  /** the menu's subject (a tool, a file): full ink, set apart from the items below it */
  | { type: 'title'; label: string; hint?: string }
  | { type: 'submenu'; label: string; items: MenuItem[]; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }

function MenuItems({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((it, i) => {
        if (it.type === 'separator') return <BaseMenu.Separator key={i} className="mx-2 my-1 h-px bg-line" />
        if (it.type === 'label') return <div key={i} className="px-2 pt-1.5 pb-1 text-ui text-fg-faint">{it.label}</div>
        if (it.type === 'title') return (
          <div key={i} className="flex flex-col gap-0.5 px-2 pt-1.5 pb-1.5">
            <span className="text-title font-semibold text-fg">{it.label}</span>
            {it.hint && <span className="text-ui leading-snug text-fg-faint">{it.hint}</span>}
          </div>
        )
        if (it.type === 'submenu') {
          const Icon = it.icon
          return (
            <BaseMenu.SubmenuRoot key={i}>
              <BaseMenu.SubmenuTrigger className={itemCls}>
                <span className="flex w-4 justify-center text-fg-muted">{Icon && <Icon size={14} strokeWidth={1.5} />}</span>
                <span className="flex-1">{it.label}</span>
                <ChevronRight size={12} className="text-fg-faint" />
              </BaseMenu.SubmenuTrigger>
              <BaseMenu.Portal>
                <BaseMenu.Positioner sideOffset={2} className="z-[161] outline-none">
                  <BaseMenu.Popup className={popupCls}><MenuItems items={it.items} /></BaseMenu.Popup>
                </BaseMenu.Positioner>
              </BaseMenu.Portal>
            </BaseMenu.SubmenuRoot>
          )
        }
        const Icon = it.icon
        return (
          <BaseMenu.Item key={i} disabled={it.disabled} onClick={it.onClick} aria-keyshortcuts={it.shortcut} className={cn(itemCls, it.danger && 'text-rec', it.hint && 'h-auto min-h-icon py-1.5')}>
            {/* centred on the row; an item with a hint pins it to the label's line instead */}
            <span className={cn('flex w-4 justify-center text-fg-muted group-data-[highlighted]/item:text-signal-fg', it.hint && 'self-start pt-px', it.danger && 'text-rec')}>
              {it.checked ? <Check size={13} strokeWidth={2} /> : Icon ? <Icon size={14} strokeWidth={1.5} /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span>{it.label}{it.checked && <span className="sr-only"> (current)</span>}</span>
              {it.hint && <span className="text-ui leading-snug text-fg-faint group-data-[highlighted]/item:text-signal-fg/75">{it.hint}</span>}
            </span>
            {it.shortcut && <span aria-hidden className={cn('text-ui text-fg-faint group-data-[highlighted]/item:text-signal-fg/70', it.hint && 'self-start')}>{prettyCombo(it.shortcut)}</span>}
          </BaseMenu.Item>
        )
      })}
    </>
  )
}

const itemCls =
  'group/item flex h-icon cursor-default items-center gap-2 rounded-control px-2 text-ui text-fg outline-none select-none data-[highlighted]:bg-signal-strong data-[highlighted]:text-signal-fg data-[disabled]:opacity-40 data-[popup-open]:bg-hover'
const popupCls =
  'pop min-w-[200px] p-1 outline-none origin-[var(--transform-origin)] transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0'

export function Menu({ trigger, items, side = 'bottom', align = 'start' }: { trigger: ReactElement; items: MenuItem[]; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end' }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner side={side} align={align} sideOffset={6} className="z-[160] outline-none">
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
    default: 'bg-hover text-fg-muted',
    accent: 'bg-signal-soft text-signal-text',
    key: 'bg-key/15 text-key-text',
    rec: 'bg-rec/15 text-rec-text',
    ok: 'bg-ok/15 text-ok-text',
  }
  return <span className={cn('inline-flex h-[18px] items-center gap-1 rounded-control px-1.5 text-ui-sm font-medium tabular', tones[tone], className)}>{children}</span>
}
