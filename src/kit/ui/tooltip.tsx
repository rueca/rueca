import { Tooltip } from '@base-ui/react/tooltip'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { prettyCombo } from '../core/hotkeys'

/** Wrap the studio once so tooltips share a delay group: after the first, the rest show instantly. */
export const TipProvider = ({ children }: { children: ReactNode }) => (
  <Tooltip.Provider delay={450} closeDelay={0}>{children}</Tooltip.Provider>
)

export function Tip({
  label, shortcut, side = 'bottom', children, disabled,
}: { label?: ReactNode; shortcut?: string; side?: 'top' | 'bottom' | 'left' | 'right'; children: ReactElement; disabled?: boolean }) {
  if (!label || disabled || !isValidElement(children)) return children
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={cloneElement(children)} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={6} className="z-[100]">
          <Tooltip.Popup className="pop flex max-w-[260px] origin-[var(--transform-origin)] items-center gap-2 px-2 py-1.5 text-[11.5px] leading-snug text-fg transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <span>{label}</span>
            {shortcut && <span className="text-faint">{prettyCombo(shortcut)}</span>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
