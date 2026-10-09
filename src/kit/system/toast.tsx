/* Toasts — bottom-centre, above the dock. Call `toast('Copied')` from anywhere, React or not. */
import { Toast } from '@base-ui/react/toast'
import { X } from 'lucide-react'

export const toastManager = Toast.createToastManager()

export function toast(title: string, opts: { description?: string; type?: 'default' | 'success' | 'error' | 'loading'; timeout?: number; action?: { label: string; onClick: () => void } } = {}) {
  return toastManager.add({
    title,
    description: opts.description,
    type: opts.type,
    timeout: opts.timeout ?? 2600,
    actionProps: opts.action ? { children: opts.action.label, onClick: opts.action.onClick } : undefined,
  })
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} limit={3}>
      <Toast.Portal>
        <Toast.Viewport className="fixed bottom-16 left-1/2 z-[200] flex w-[340px] -translate-x-1/2 flex-col items-center outline-none">
          <List />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function List() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      className="pop absolute bottom-0 flex w-max max-w-[340px] items-center gap-3 py-2 pr-2 pl-3.5 text-[12px] text-fg transition-[transform,opacity] duration-200 [transform:translateY(calc(var(--toast-index)*-8px))_scale(calc(1-var(--toast-index)*0.05))] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0 data-[expanded]:[transform:translateY(calc(var(--toast-offset-y)*-1))]"
    >
      <Toast.Content className="flex min-w-0 items-center gap-2">
        {t.type === 'success' && <span className="size-1.5 shrink-0 rounded-full bg-ok" />}
        {t.type === 'error' && <span className="size-1.5 shrink-0 rounded-full bg-rec" />}
        {t.type === 'loading' && <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-accent" />}
        <div className="min-w-0">
          <Toast.Title className="truncate font-medium" />
          <Toast.Description className="text-[11.5px] text-muted" />
        </div>
      </Toast.Content>
      <Toast.Action className="h-6 rounded-[5px] px-2 text-[11.5px] font-medium text-accent hover:bg-hover" />
      <Toast.Close aria-label="Dismiss" className="flex size-6 items-center justify-center rounded-[5px] text-faint hover:bg-hover hover:text-fg">
        <X size={12} />
      </Toast.Close>
    </Toast.Root>
  ))
}
