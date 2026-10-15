/* ---------------------------------------------------------------------------
   Dialog — a small centred modal for the few flows that genuinely need one
   (paste data, name a thing, confirm a destructive batch). Plus imperative
   helpers so tools never reach for window.prompt / window.confirm.

     <Dialog open={open} onOpenChange={setOpen} title="Paste CSV"
       description="Rows from Sheets, Excel or Numbers." onSubmit={importRows}
       footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" onClick={importRows}>Import</Button></>}>
       <TextInput multiline … />
     </Dialog>

     if (await confirm({ title: 'Delete 12 images?', confirmLabel: 'Delete', danger: true })) …
     const name = await promptText({ title: 'New board', defaultValue: 'Board 3', confirmLabel: 'Create' })
     if (name) newBoard(name)                                      // null = cancelled

   Behaviour / keyboard
     Esc or the backdrop closes (`alert` dialogs ignore the backdrop)
     ⌘↵ / Ctrl+↵ → onSubmit (Enter in promptText's field also submits)
     focus moves into the dialog, is trapped, and returns to the trigger
   The helpers queue: a second call waits until the first is answered. They
   render through <DialogHost />, which mounts itself on first use — mount it
   yourself only if you need it inside a specific React tree.

   Accessibility: Base UI Dialog / AlertDialog — role="dialog" (or
   "alertdialog" for `alert` / confirm), aria-labelledby the title,
   aria-describedby the description, labelled close button. Styled with the
   kit `pop` surface over a `scrim` backdrop; tokens only.
   (Promoted from shells/batch/local/Modal.tsx.)
--------------------------------------------------------------------------- */
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { cn } from '../core/cn'
import { Button } from '../ui/button'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: number
  /** ⌘↵ inside the dialog */
  onSubmit?: () => void
  /** role="alertdialog": must be answered, the backdrop does not dismiss */
  alert?: boolean
  /** element to focus on open (default: the first focusable) */
  initialFocus?: React.RefObject<HTMLElement | null>
  className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, footer, width = 480, onSubmit, alert, initialFocus, className }: DialogProps) {
  // Dialog and AlertDialog share part names; AlertDialog only drops backdrop dismissal.
  const D = (alert ? AlertDialog : BaseDialog) as typeof BaseDialog
  return (
    <D.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <D.Portal>
        <D.Backdrop className="fixed inset-0 z-[150] bg-scrim/60 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <D.Popup
          initialFocus={initialFocus}
          onKeyDown={(e) => { if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit() } }}
          className={cn('pop fixed top-1/2 left-1/2 z-[151] flex max-h-[84vh] max-w-[calc(100vw-32px)] -translate-1/2 flex-col overflow-hidden outline-none',
            'transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0', className)}
          style={{ width }}
        >
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <div className="min-w-0 flex-1">
              <D.Title className="text-title font-semibold text-fg">{title}</D.Title>
              {description && <D.Description className="mt-1 text-ui leading-relaxed text-fg-muted">{description}</D.Description>}
            </div>
            <D.Close aria-label="Close" className="-mt-0.5 -mr-1 flex size-icon shrink-0 items-center justify-center rounded-control text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
              <X size={14} strokeWidth={1.5} />
            </D.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>}
          {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
        </D.Popup>
      </D.Portal>
    </D.Root>
  )
}

/* ------------------------------------------------------------ imperative helpers */

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** destructive: the confirm button is styled as danger */
  danger?: boolean
}
export interface PromptOptions {
  title: string
  description?: ReactNode
  /** field label (visually hidden when it repeats the title) */
  label?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  /** return an error message to block submit */
  validate?: (value: string) => string | null | undefined
  maxLength?: number
}

type Req =
  | { id: number; kind: 'confirm'; o: ConfirmOptions; resolve: (v: boolean) => void }
  | { id: number; kind: 'prompt'; o: PromptOptions; resolve: (v: string | null) => void }

let queue: Req[] = []
let seq = 0
let mounted = 0
let autoRoot = false
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

function ensureHost() {
  if (mounted || autoRoot || typeof document === 'undefined') return
  autoRoot = true
  const el = document.createElement('div')
  el.dataset.studioDialogs = ''
  document.body.appendChild(el)
  createRoot(el).render(<DialogHost />)
}

/** Ask a yes/no question. Resolves true on confirm, false on cancel / Esc. */
export function confirm(o: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => { queue = [...queue, { id: ++seq, kind: 'confirm', o, resolve }]; emit(); ensureHost() })
}
/** Ask for one line of text. Resolves the trimmed value, or null when cancelled. */
export function promptText(o: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => { queue = [...queue, { id: ++seq, kind: 'prompt', o, resolve }]; emit(); ensureHost() })
}

/** Renders queued confirm() / promptText() calls. Mounts itself on first use. */
export function DialogHost() {
  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => queue, () => queue)
  useEffect(() => { mounted++; return () => { mounted-- } }, [])
  const req = list[0]
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(!!req) }, [req])
  const finish = (fn: () => void) => {
    fn()
    setOpen(false)
    // let the close transition play before the next request takes the stage
    setTimeout(() => { queue = queue.filter((r) => r !== req); emit() }, 160)
  }
  if (!req) return null
  return req.kind === 'confirm'
    ? <ConfirmDialog key={req.id} open={open} o={req.o} onDone={(v) => finish(() => req.resolve(v))} />
    : <PromptDialog key={req.id} open={open} o={req.o} onDone={(v) => finish(() => req.resolve(v))} />
}

function ConfirmDialog({ open, o, onDone }: { open: boolean; o: ConfirmOptions; onDone: (v: boolean) => void }) {
  const ok = useRef<HTMLButtonElement>(null)
  const done = useRef(false)
  const answer = (v: boolean) => { if (done.current) return; done.current = true; onDone(v) }
  return (
    <Dialog alert open={open} onOpenChange={(x) => { if (!x) answer(false) }} title={o.title} description={o.description} width={380}
      initialFocus={ok} onSubmit={() => answer(true)}
      footer={<>
        <Button size="md" onClick={() => answer(false)}>{o.cancelLabel ?? 'Cancel'}</Button>
        <Button ref={ok} size="md" variant={o.danger ? 'outline' : 'primary'} className={o.danger ? 'text-rec' : undefined} onClick={() => answer(true)}>{o.confirmLabel ?? 'OK'}</Button>
      </>} />
  )
}

function PromptDialog({ open, o, onDone }: { open: boolean; o: PromptOptions; onDone: (v: string | null) => void }) {
  const [value, setValue] = useState(o.defaultValue ?? '')
  const [error, setError] = useState<string | null>(null)
  const errId = useId()
  const input = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  useEffect(() => { if (open) requestAnimationFrame(() => input.current?.select()) }, [open])
  const answer = (v: string | null) => { if (done.current) return; done.current = true; onDone(v) }
  const submit = () => {
    const v = value.trim()
    const err = !v ? 'This can’t be empty' : o.validate?.(v) ?? null
    if (err) { setError(err); input.current?.focus(); return }
    answer(v)
  }
  return (
    <Dialog open={open} onOpenChange={(x) => { if (!x) answer(null) }} title={o.title} description={o.description} width={380} initialFocus={input}
      footer={<>
        <Button size="md" onClick={() => answer(null)}>{o.cancelLabel ?? 'Cancel'}</Button>
        <Button size="md" variant="primary" onClick={submit}>{o.confirmLabel ?? 'OK'}</Button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="flex flex-col gap-1.5">
          <span className={cn('text-ui text-fg-muted', !o.label && 'sr-only')}>{o.label ?? o.title}</span>
          <input ref={input} value={value} maxLength={o.maxLength} placeholder={o.placeholder}
            aria-invalid={!!error || undefined} aria-describedby={error ? errId : undefined}
            onChange={(e) => { setValue(e.target.value); if (error) setError(null) }}
            className={cn('h-icon w-full rounded-control bg-control px-2 text-ui text-fg outline-none placeholder:text-fg-faint',
              error ? 'shadow-[inset_0_0_0_1px_var(--rec)]' : 'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_1px_var(--signal)]')} />
        </label>
        {error && <div id={errId} role="alert" className="mt-1.5 text-ui text-rec">{error}</div>}
      </form>
    </Dialog>
  )
}
