/* Toasts — bottom-centre, above the dock. Call `toast('Copied')` from anywhere, React or not. */
import { Toast } from '@base-ui/react/toast'
import { useEffect, useId, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { X } from 'lucide-react'

export const toastManager = Toast.createToastManager()

type ToastType = 'default' | 'success' | 'error' | 'loading'
interface ToastOpts { description?: string; type?: ToastType; timeout?: number; action?: { label: string; onClick: () => void } }

const toProps = (title: string, o: ToastOpts) => ({
  title,
  description: o.description,
  type: o.type,
  timeout: o.timeout ?? (o.type === 'loading' ? 0 : 2600),
  actionProps: o.action ? { children: o.action.label, onClick: o.action.onClick } : undefined,
})

// toast() must work anywhere — outside <Studio>, in a client view, on a plain page (break-it F2/DX16).
// If no <Toaster> is mounted when one is shown, mount one on <body> once.
// Exactly one Toaster renders: the first to mount owns the viewport, others stay empty.
let owner: string | null = null
let selfHost: HTMLElement | null = null
function ensureHost() {
  if (owner || selfHost || typeof document === 'undefined') return
  selfHost = document.createElement('div')
  selfHost.dataset.studioToaster = ''
  document.body.appendChild(selfHost)
  createRoot(selfHost).render(<Toaster />)
}
// Toasts raised before any Toaster has subscribed (a store announcing at load) would be dropped: hold them (break-it B5-06).
const waiting: (() => void)[] = []
const whenMounted = (fn: () => void) => { if (owner) fn(); else { waiting.push(fn); ensureHost() } }

/** Show a toast; returns its id. Loading toasts stay until updated or dismissed. */
export function toast(title: string, opts: ToastOpts = {}) {
  ensureHost()
  return toastManager.add(toProps(title, opts))
}
/** Change a toast in place (e.g. loading → success). */
toast.update = (id: string, title: string, opts: ToastOpts = {}) => toastManager.update(id, toProps(title, { timeout: 2600, ...opts }))
toast.dismiss = (id: string) => toastManager.close(id)
/** loading → success / error around a promise. */
toast.promise = async <T,>(p: Promise<T>, m: { loading: string; success: string | ((v: T) => string); error?: string | ((e: unknown) => string) }) => {
  const id = toast(m.loading, { type: 'loading' })
  try {
    const v = await p
    toast.update(id, typeof m.success === 'function' ? m.success(v) : m.success, { type: 'success' })
    return v
  } catch (e) {
    toast.update(id, typeof m.error === 'function' ? m.error(e) : (m.error ?? 'Something went wrong'), { type: 'error', description: e instanceof Error ? e.message : undefined, timeout: 5000 })
    throw e
  }
}
/** A long job with progress (0–1) and Cancel. `done()` / `fail()` end it. */
toast.progress = (title: string, opts: { onCancel?: () => void } = {}) => {
  const id = toast(title, { type: 'loading', action: opts.onCancel ? { label: 'Cancel', onClick: opts.onCancel } : undefined })
  return {
    id,
    set: (p: number, detail?: string) => toastManager.update(id, { title, description: `${Math.round(p * 100)}%${detail ? ` · ${detail}` : ''}` }),
    done: (msg: string, o: ToastOpts = {}) => toast.update(id, msg, { type: 'success', ...o }),
    fail: (msg: string, o: ToastOpts = {}) => toast.update(id, msg, { type: 'error', timeout: 5000, ...o }),
  }
}

if (typeof window !== 'undefined') {
  // Params / doc stores announce storage failures once; tell the person, quietly.
  window.addEventListener('studio:storage-error', () => whenMounted(() =>
    toast('Settings could not be saved', { type: 'error', description: 'Browser storage is full or blocked. Your work is fine until you reload.', timeout: 6000 })))
  window.addEventListener('studio:link-ignored', (e) => {
    const d = (e as CustomEvent<{ linkVersion?: number; version?: number }>).detail
    const newer = (d?.linkVersion ?? 0) > (d?.version ?? 0)
    whenMounted(() => toast(newer ? 'This link is from a newer version' : 'This link is from an older version', {
      description: newer ? 'It was made with a newer copy of this tool, so it opened with your own settings instead.' : 'The tool has changed since it was shared, so it opened with your own settings instead.',
      timeout: 6000,
    }))
  })
}

export function Toaster() {
  const id = useId()
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (owner) return
    owner = id
    setActive(true)
    return () => { if (owner === id) owner = null }
  }, [id])
  // runs after the Provider below has subscribed (child effects first)
  useEffect(() => { if (active) waiting.splice(0).forEach((fn) => fn()) }, [active])
  if (!active) return null
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
      className="pop absolute bottom-0 flex w-max max-w-[340px] items-center gap-3 py-2 pr-2 pl-3.5 text-ui text-fg transition-[transform,opacity] duration-200 [transform:translateY(calc(var(--toast-index)*-8px))_scale(calc(1-var(--toast-index)*0.05))] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0 data-[expanded]:[transform:translateY(calc(var(--toast-offset-y)*-1))]"
    >
      <Toast.Content className="flex min-w-0 items-center gap-2">
        {t.type === 'success' && <span className="size-1.5 shrink-0 rounded-full bg-ok" />}
        {t.type === 'error' && <span className="size-1.5 shrink-0 rounded-full bg-rec" />}
        {t.type === 'loading' && <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-signal" />}
        <div className="min-w-0">
          <Toast.Title className="truncate font-medium" />
          <Toast.Description className="text-ui text-fg-muted" />
        </div>
      </Toast.Content>
      <Toast.Action className="h-icon rounded-control px-2 text-ui font-medium text-signal-text hover:bg-hover" />
      <Toast.Close aria-label="Dismiss" className="flex size-icon items-center justify-center rounded-control text-fg-faint hover:bg-hover hover:text-fg">
        <X size={12} />
      </Toast.Close>
    </Toast.Root>
  ))
}
