/* Tell the person when an image intake refuses something (break-it S10).
   The kit's useImageIntake silently ignores dropped / pasted files that aren't images; shells that use it
   for their main image call this alongside it so a PDF or a 0-byte file gets a toast instead of nothing.
   (Kit gap: useImageIntake could take an `onReject(file, reason)` option instead.) */
import { useEffect } from 'react'
import { toast } from '@kit'

/** Why a file can't be opened as an image, or null when it can. */
export function rejectReason(f: { name: string; type: string; size: number }): string | null {
  if (!f.size) return `“${f.name || 'That file'}” is empty (0 bytes)`
  if (f.type && !f.type.startsWith('image/')) return `“${f.name}” isn't an image`
  return null
}

export function useIntakeRejects(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const check = (files: FileList | null | undefined) => {
      const list = Array.from(files ?? [])
      // an image file goes on to the intake callback, which checks it with rejectReason (that also covers the picker)
      if (!list.length || list.some((f) => f.type.startsWith('image/'))) return
      toast(rejectReason(list[0]) ?? `“${list[0].name}” isn't an image`, { type: 'error', description: 'Open a PNG, JPEG, WebP or GIF.' })
    }
    const onDrop = (e: DragEvent) => check(e.dataTransfer?.files)
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      check(e.clipboardData?.files)
    }
    window.addEventListener('drop', onDrop)
    window.addEventListener('paste', onPaste)
    return () => { window.removeEventListener('drop', onDrop); window.removeEventListener('paste', onPaste) }
  }, [enabled])
}
