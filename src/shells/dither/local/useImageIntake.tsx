/* ---------------------------------------------------------------------------
   useImageIntake — every way an image gets into a tool, in one hook:
   drop onto any element, paste anywhere (⌘V), or an Open… command.

     const intake = useImageIntake((file) => load(file))
     <div {...intake.dropProps}>          // the stage
       {intake.over && <DropHint />}
     </div>
     {intake.input}                        // hidden <input type=file>, render once
     <Button onClick={intake.open}>Open image</Button>

   The kit's ImageDrop covers one inspector well; this covers the whole
   window, which is where people actually drop and paste. Paste is ignored
   while typing in a field so text paste still works there.
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'

const isImage = (f?: File | null): f is File => !!f && f.type.startsWith('image/')

export function useImageIntake(onFile: (file: File) => void, accept = 'image/*') {
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const cb = useRef(onFile)
  cb.current = onFile

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const f = [...(e.clipboardData?.files ?? [])].find(isImage)
      if (f) { e.preventDefault(); cb.current(f) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const hasFiles = (e: React.DragEvent) => [...e.dataTransfer.types].includes('Files')
  const dropProps = {
    onDragEnter: (e: React.DragEvent) => { if (hasFiles(e)) { e.preventDefault(); setOver(true) } },
    onDragOver: (e: React.DragEvent) => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false) },
    onDrop: (e: React.DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      setOver(false)
      const f = [...e.dataTransfer.files].find(isImage)
      if (f) cb.current(f)
    },
  }

  return {
    over,
    dropProps,
    open: () => input.current?.click(),
    input: <input ref={input} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (isImage(f)) cb.current(f); e.target.value = '' }} />,
  }
}
