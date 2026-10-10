/* Shell-owned localStorage writes (view state, user looks, graphs kept outside a kit store).
   A failed write (quota, private mode) is announced the same way the kit's params/doc stores
   do it: one 'studio:storage-error' event per failure streak — the kit toasts it — re-armed on
   the next successful write. Never swallow a failure silently. */
import { storageWarned } from '@kit'

export function saveLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    storageWarned.quota = false
    return true
  } catch (e) {
    if (!storageWarned.quota) {
      storageWarned.quota = true
      window.dispatchEvent(new CustomEvent('studio:storage-error', { detail: { key, error: String(e) } }))
    }
    return false
  }
}
