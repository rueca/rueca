/* ---------------------------------------------------------------------------
   progressToast — a long-running job in the kit toast: title, a thin
   determinate bar with a tabular percentage, and a Cancel action. Resolves
   into a success / error toast in place (same toast id, no flicker).

     const t = progressToast('Exporting MP4', { onCancel: job.cancel })
     t.set(0.42)                      // 0..1
     t.done('MP4 exported')           // or t.fail('Encoder error', msg) / t.dismiss()

   The kit `toast()` only takes strings and returns an id with no way to
   update it; this wraps `toastManager` (Base UI) directly. Promote to
   `system/toast.tsx` as `toast.progress()`.
--------------------------------------------------------------------------- */
import { toastManager } from '@kit'

function Bar({ p }: { p: number }) {
  return (
    <span className="mt-1.5 flex w-[220px] items-center gap-2">
      <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-track">
        <span className="absolute inset-y-0 left-0 rounded-full bg-signal transition-[width] duration-150" style={{ width: `${Math.round(p * 100)}%` }} />
      </span>
      <span className="w-8 text-right tabular text-[11px] text-fg-muted">{Math.round(p * 100)}%</span>
    </span>
  )
}

export function progressToast(title: string, opts: { onCancel?: () => void; detail?: string } = {}) {
  const id = toastManager.add({
    title,
    type: 'loading',
    timeout: 0,
    description: <Bar p={0} />,
    actionProps: opts.onCancel ? { children: 'Cancel', onClick: () => opts.onCancel?.() } : undefined,
  })
  let last = -1
  return {
    id,
    set(p: number, label?: string) {
      const q = Math.round(p * 100)
      if (q === last) return
      last = q
      toastManager.update(id, { title: label ?? title, description: <Bar p={p} /> })
    },
    done(msg: string, description?: string) {
      toastManager.update(id, { title: msg, type: 'success', description, timeout: 3200, actionProps: undefined })
    },
    fail(msg: string, description?: string) {
      toastManager.update(id, { title: msg, type: 'error', description, timeout: 5000, actionProps: undefined })
    },
    dismiss() { toastManager.close(id) },
  }
}
