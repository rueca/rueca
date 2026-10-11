/* "Best on desktop": the shells are built for a big screen and a mouse. On a phone
   or a touch-only tablet, a bottom sheet says so the first time a shell opens in a
   visit (sessionStorage), then stays out of the way. Never inside an iframe (the
   landing's live previews) or a shell's phone-friendly ?client view. */
import { useState } from 'react'
import { Monitor } from 'lucide-react'
import { Button } from '@kit/ui/button'

const KEY = 'studio:desktop-notice'
const SMALL = '(max-width: 767px), (hover: none) and (pointer: coarse)'

function shouldShow() {
  if (typeof window === 'undefined' || window.self !== window.top) return false
  if (/[?&]client\b/.test(location.hash)) return false
  if (!matchMedia(SMALL).matches) return false
  try { return !sessionStorage.getItem(KEY) } catch { return true }
}

export function DesktopNotice() {
  const [open, setOpen] = useState(shouldShow)
  if (!open) return null
  const close = () => { try { sessionStorage.setItem(KEY, '1') } catch { /* private mode: show again next time */ } setOpen(false) }
  return (
    <div className="fixed inset-0 z-[1000] flex items-end bg-black/40 p-3 pb-[max(12px,env(safe-area-inset-bottom))]" onClick={close}>
      <div role="alertdialog" aria-labelledby="desktop-notice-title" aria-describedby="desktop-notice-body"
        className="w-full rounded-[2px] bg-overlay p-5 text-fg shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()}>
        <Monitor size={20} strokeWidth={1.5} className="text-fg-muted" />
        <h2 id="desktop-notice-title" className="mt-3 text-[16px] font-semibold">Best on a desktop</h2>
        <p id="desktop-notice-body" className="mt-1.5 text-[14px] leading-[1.5] text-fg-muted">This tool is made for a big screen and a mouse. You can look around here, but open it on a computer for the full experience.</p>
        <Button variant="primary" className="mt-4 h-10 w-full rounded-[2px]! text-[14px]" onClick={close} autoFocus>Got it</Button>
      </div>
    </div>
  )
}
