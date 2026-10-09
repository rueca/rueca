/* ---------------------------------------------------------------------------
   Modal — a small centred dialog for the few flows that genuinely need one
   (paste data, name a custom size, confirm a destructive batch).

     <Modal open={open} onOpenChange={setOpen} title="Paste CSV"
       description="Rows from Sheets, Excel or Numbers."
       footer={<><Button onClick={close}>Cancel</Button><Button variant="primary">Import</Button></>}>
       …
     </Modal>

   Styled with the kit's `pop` surface; Esc and backdrop click close; focus
   is trapped and returned (Base UI Dialog). ⌘↵ triggers `onSubmit`.
--------------------------------------------------------------------------- */
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@kit'

export function Modal({
  open, onOpenChange, title, description, children, footer, width = 480, onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: number
  onSubmit?: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/30 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          onKeyDown={(e) => { if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit() } }}
          className={cn('pop fixed top-1/2 left-1/2 z-[151] flex max-h-[84vh] max-w-[calc(100vw-32px)] -translate-1/2 flex-col overflow-hidden outline-none',
            'transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0')}
          style={{ width }}
        >
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[13px] font-semibold text-fg">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-[11.5px] leading-relaxed text-fg-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Close" className="flex size-6 items-center justify-center rounded-[5px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
              <X size={14} strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>}
          {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
