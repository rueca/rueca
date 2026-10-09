/* ---------------------------------------------------------------------------
   useImageIntake — every way an image gets into a tool, in one hook: drop it
   anywhere on the window, paste it (⌘V), or Open… (⌘O / a button).

     const intake = useImageIntake((img) => load(img.url, img.name))
     {intake.over && <DropHint />}          // true while a file is dragged over the window
     {intake.input}                          // the hidden <input type=file>; render once
     <Button onClick={intake.open}>Open image…</Button>

   Each image arrives as { file, name, url, type, size }: `url` is an object
   URL (cheap, no base64), revoked automatically when the next image arrives
   or the component unmounts — decode it straight away (img.decode(),
   createImageBitmap) and keep YOUR decoded copy. The filename is kept for
   the document title and export names.

   Keep the image OUT of params: a photo in a params store ends up in
   localStorage (quota) and in share links (megabytes). Hold it in a plain
   store next to them; params keep only the settings applied to it.

   Options
     accept   'image/*' (default) or a list like 'image/png,image/jpeg'
     scope    'window' (default) listens for drops anywhere; 'element' only
              where you spread `intake.dropProps`
     hotkey   'mod+o' (default) opens the picker — labelled for the ? sheet;
              false when a command palette already binds it
     paste    true (default); text paste into fields is never intercepted
     enabled  false to pause everything (a modal is open)

   Accessibility: the picker is a real file input; drop and paste are
   shortcuts for it, never the only way in.
   (Promoted from shells/dither/local/useImageIntake.tsx.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useHotkeys } from './hotkeys'

export interface IntakeImage { file: File; name: string; url: string; type: string; size: number }

export interface ImageIntakeOptions {
  accept?: string
  scope?: 'window' | 'element'
  hotkey?: string | false
  paste?: boolean
  enabled?: boolean
}

export interface ImageIntake {
  /** a file is being dragged over the drop target */
  over: boolean
  /** open the file picker */
  open: () => void
  /** spread on the drop target when scope = 'element' (harmless otherwise) */
  dropProps: {
    onDragEnter: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  /** the hidden file input; render it once */
  input: ReactNode
  /** the last image taken in (its url stays valid until the next one) */
  current: IntakeImage | null
}

const accepts = (accept: string, f: File) =>
  accept.split(',').map((s) => s.trim()).some((a) => (a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : a.startsWith('.') ? f.name.toLowerCase().endsWith(a.toLowerCase()) : f.type === a))

const hasFiles = (dt: DataTransfer | null) => !!dt && [...dt.types].includes('Files')
const typing = (t: EventTarget | null) => { const el = t as HTMLElement | null; return !!el && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') }

export function useImageIntake(onImage: (img: IntakeImage) => void, opts: ImageIntakeOptions = {}): ImageIntake {
  const { accept = 'image/*', scope = 'window', hotkey = 'mod+o', paste = true, enabled = true } = opts
  const [over, setOver] = useState(false)
  const [current, setCurrent] = useState<IntakeImage | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const cb = useRef(onImage)
  cb.current = onImage
  const lastURL = useRef<string | null>(null)

  const take = (files: Iterable<File> | ArrayLike<File> | null | undefined) => {
    const f = Array.from(files ?? []).find((x) => accepts(accept, x))
    if (!f) return false
    if (lastURL.current) URL.revokeObjectURL(lastURL.current)
    const url = URL.createObjectURL(f)
    lastURL.current = url
    const img = { file: f, name: f.name || `Pasted image.${f.type.split('/')[1] ?? 'png'}`, url, type: f.type, size: f.size }
    setCurrent(img)
    cb.current(img)
    return true
  }
  const takeRef = useRef(take)
  takeRef.current = take

  useEffect(() => () => { if (lastURL.current) URL.revokeObjectURL(lastURL.current) }, [])

  useEffect(() => {
    if (!enabled) return
    const onPaste = (e: ClipboardEvent) => {
      if (!paste || typing(e.target)) return
      if (takeRef.current(e.clipboardData?.files)) e.preventDefault()
    }
    window.addEventListener('paste', onPaste)
    if (scope !== 'window') return () => window.removeEventListener('paste', onPaste)
    let depth = 0
    const enter = (e: DragEvent) => { if (!hasFiles(e.dataTransfer)) return; e.preventDefault(); depth++; setOver(true) }
    const overEv = (e: DragEvent) => { if (!hasFiles(e.dataTransfer)) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy' }
    const leave = (e: DragEvent) => { if (!hasFiles(e.dataTransfer)) return; depth = Math.max(0, depth - 1); if (!depth) setOver(false) }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e.dataTransfer)) return
      depth = 0
      setOver(false)
      // an element underneath (an ImageDrop well) already took it
      if (e.defaultPrevented) return
      e.preventDefault()
      takeRef.current(e.dataTransfer?.files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', overEv)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', overEv)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [enabled, paste, scope])

  const open = () => input.current?.click()
  useHotkeys(hotkey && enabled ? { [hotkey]: { run: open, label: 'Open image…', group: 'File' } } : {}, [hotkey, enabled])

  const el = scope === 'element' && enabled
  return {
    over,
    open,
    current,
    dropProps: {
      onDragEnter: (e) => { if (el && hasFiles(e.dataTransfer)) { e.preventDefault(); setOver(true) } },
      onDragOver: (e) => { if (el && hasFiles(e.dataTransfer)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } },
      onDragLeave: (e) => { if (el && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false) },
      onDrop: (e) => { if (!el || !hasFiles(e.dataTransfer)) return; e.preventDefault(); setOver(false); take(e.dataTransfer.files) },
    },
    input: <input ref={input} type="file" accept={accept} hidden onChange={(e) => { take(e.target.files); e.target.value = '' }} />,
  }
}
