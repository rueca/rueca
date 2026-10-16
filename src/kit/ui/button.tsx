import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../core/cn'
import { Tip } from './tooltip'

/* Buttons. Secondary actions are bare low-opacity glyphs; only the primary
   action gets a filled container. Accent-filled surfaces use accent-strong
   so the white label clears WCAG AA. */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium no-select outline-none focus-visible:ring-2 focus-visible:ring-signal transition-colors duration-100 disabled:opacity-40 disabled:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        ghost: 'text-fg-muted hover:bg-hover hover:text-fg active:bg-press data-[active=true]:bg-active data-[active=true]:text-fg',
        default: 'bg-active text-fg hover:brightness-110 active:brightness-95',
        primary: 'bg-signal-strong text-signal-fg hover:brightness-110 active:brightness-95',
        outline: 'text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-hover',
        danger: 'text-rec hover:bg-hover',
      },
      size: {
        sm: 'h-control px-2 text-ui rounded-control',
        md: 'h-icon px-2.5 text-ui rounded-control',
        lg: 'h-button-lg px-3 text-title rounded-[calc(var(--radius-control)+2px)]',
        icon: 'size-icon rounded-control',
        // 20px to the eye, a 24px reach (WCAG 2.5.8) so neighbouring small buttons aren't fiddly
        'icon-sm': "relative size-icon-sm rounded-control after:absolute after:-inset-0.5 after:content-['']",
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { active?: boolean }

export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ className, variant, size, active, ...rest }, ref) => (
  <button ref={ref} type="button" data-active={active || undefined} className={cn(buttonVariants({ variant, size }), className)} {...rest} />
))
Button.displayName = 'Button'

type IconProps = { size?: number; strokeWidth?: number; className?: string }

/** Icon-only button. Always carries a label (tooltip + aria-label) and optional shortcut. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<BtnProps, 'children'> & { icon: ComponentType<IconProps>; label: string; shortcut?: string; tipSide?: 'top' | 'bottom' | 'left' | 'right'; children?: ReactNode }
>(({ icon: Icon, label, shortcut, tipSide = 'bottom', size = 'icon', variant = 'ghost', children, ...rest }, ref) => (
  <Tip label={label} shortcut={shortcut} side={tipSide}>
    <Button ref={ref} size={size} variant={variant} aria-label={label} aria-pressed={rest.active === undefined ? undefined : rest.active} {...rest}>
      <Icon size={14} strokeWidth={1.5} />
      {children}
    </Button>
  </Tip>
))
IconButton.displayName = 'IconButton'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-hover px-1 font-ui text-ui-sm font-medium text-fg-muted', className)}>
      {children}
    </kbd>
  )
}
