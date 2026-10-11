/* ---------------------------------------------------------------------------
   Client view — the same tool, for the person you're designing for, on their phone.

     const { client, setClient } = useClientMode()          // #…&client, or a phone (either way up)
     if (client) return (
       <ClientView params={params} onDownload={save} onExit={() => setClient(false)}>
         <Stage fill><CanvasSurface … /></Stage>              // the art, full-bleed
       </ClientView>
     )

   Only knobs marked `publish: true` show, at touch size (48px rows, 16px inputs so iOS
   doesn't zoom, big slider thumbs). The art keeps the space above the sheet (beside it on
   wide or landscape screens), so it's never hidden behind the controls. The client gets undo,
   Download (if you pass onDownload) and "Send to designer", which copies a link with their
   values that opens straight back into the client view.
--------------------------------------------------------------------------- */
import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, Download, PencilRuler, Redo2, Send, Undo2 } from 'lucide-react'
import { cn } from '../core/cn'
import { useHotkeys } from '../core/hotkeys'
import { copyText } from '../core/io'
import { useParamState, type AnyParams } from '../core/params'
import { Inspector } from '../inspector/Inspector'
import { Button, IconButton } from '../ui/button'
import { toast } from '../system/toast'

const CLIENT = /[#?&]client\b/

/** Is the client view on? `#…&client` in the URL turns it on; so does a narrow screen (a phone). */
// a phone either way up: narrow, or short with a touch screen (landscape)
export function useClientMode({ narrow = '(max-width: 760px), (max-height: 500px) and (pointer: coarse)', hotkey = 'mod+shift+p' }: { narrow?: string | false; hotkey?: string | false } = {}) {
  // opened from a client link: the client stays in the client view — no way into the designer tool (client-view C3)
  const [linked] = useState(() => typeof location !== 'undefined' && CLIENT.test(location.hash + location.search))
  const [asked, setAsked] = useState(linked)
  const [small, setSmall] = useState(() => !!narrow && typeof matchMedia !== 'undefined' && matchMedia(narrow).matches)
  useEffect(() => {
    if (!narrow) return
    const m = matchMedia(narrow)
    const on = () => setSmall(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [narrow])
  useHotkeys(hotkey ? { [hotkey]: { run: () => setAsked((c) => !c), label: 'Client view', group: 'View' } } : {}, [hotkey])
  /** `forced`: a phone, or a client link on a touch device — don't offer the designer view. A client link opened at a
      desk (the designer checking what came back) keeps the way out. */
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
  return { client: asked || small, forced: small || (linked && coarse), setClient: setAsked }
}

/** The share link, marked to open in the client view. */
export function clientLink(params: AnyParams) {
  const u = params.shareURL()
  return CLIENT.test(u) ? u : `${u}&client`
}

export function ClientView({
  params, children, title = 'Make it yours', subtitle = 'Change it, then send it back', actions, onDownload, onExit, defaultOpen = true, className,
}: {
  params: AnyParams
  /** the artwork — usually `<Stage fill>` with a surface */
  children: ReactNode
  title?: string
  subtitle?: string
  /** extra buttons for the action row (Shuffle…), before Download */
  actions?: ReactNode
  /** show Download; resolve when the file is saved */
  onDownload?: () => void | Promise<void>
  /** show "Back to designer view" (leave it out on a phone) */
  onExit?: () => void
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const canUndo = useParamState(params, (s) => s.past.length > 0)
  const canRedo = useParamState(params, (s) => s.future.length > 0)
  const published = Object.values(params.defs).filter((d) => 'publish' in d && d.publish).length
  if ((import.meta as any).env?.DEV && !published)
    console.warn(`[studio] <ClientView>: no params in ${params.id} are marked \`publish: true\`, so the client gets no controls.`)

  // Mark the page: the gallery's "best on a desktop" notice stands down, and the page itself doesn't rubber-band (C1, C11).
  useEffect(() => {
    const html = document.documentElement
    const was = html.style.overscrollBehavior
    html.setAttribute('data-studio-client', '')
    html.style.overscrollBehavior = 'none'
    return () => { html.removeAttribute('data-studio-client'); html.style.overscrollBehavior = was }
  }, [])

  // On a phone, the share sheet (Messages, WhatsApp, Mail) is how a link gets sent; elsewhere, copy it (C12).
  const send = async () => {
    const url = clientLink(params)
    if (typeof navigator !== 'undefined' && navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); return } catch (e) { if ((e as Error)?.name === 'AbortError') return }
    }
    await copyText(url)
    toast('Link copied', { type: 'success', description: 'Send it to your designer. It opens with your changes.' })
  }
  const download = async () => {
    try { await onDownload?.(); toast('Saved to downloads', { type: 'success' }) } catch (e) { toast('Could not save', { type: 'error', description: e instanceof Error ? e.message : undefined }) }
  }

  return (
    // h-dvh: the visible height on phones, which changes as Safari's toolbar shows and hides (100vh doesn't)
    // side by side on wide screens AND on short ones (a phone held sideways is ~390px tall: stacked, the art was a stamp)
    // touch-action: no page pinch-zoom anywhere in the view (C11); the art handles its own gestures
    <div data-studio-client style={{ touchAction: 'pan-x pan-y' }} className={cn('studio studio-touch flex h-dvh w-full flex-col overflow-hidden bg-field md:flex-row [@media(max-height:500px)]:flex-row', className)}>
      {/* touch-none: a pinch on the art must not zoom the whole page (C11) */}
      <main aria-label="Artwork" className="relative min-h-0 min-w-0 flex-1 touch-none">{children}</main>
      <section
        aria-label="Controls"
        className="flex-none px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:flex md:w-[380px] md:flex-col md:justify-end md:py-3 md:pr-[max(12px,env(safe-area-inset-right))] md:pl-0 [@media(max-height:500px)]:flex [@media(max-height:500px)]:w-[min(380px,50vw)] [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:justify-end [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-[max(8px,env(safe-area-inset-right))] [@media(max-height:500px)]:pl-0"
      >
        <div className="panel mx-auto flex max-h-full w-full max-w-[440px] flex-col overflow-hidden">
          <div className="flex h-14 flex-none items-center gap-1 pr-2 pl-4">
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-full min-w-0 flex-1 items-center gap-2 text-left outline-none">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{title}</span>
                {subtitle && <span className="block truncate text-[12.5px] text-fg-muted">{subtitle}</span>}
              </span>
              <ChevronDown size={18} strokeWidth={1.5} className={cn('shrink-0 text-fg-muted transition-transform', !open && 'rotate-180')} />
            </button>
            <IconButton icon={Undo2} label="Undo" size="icon" className="size-11 shrink-0" disabled={!canUndo} onClick={() => params.undo()} tipSide="top" />
            <IconButton icon={Redo2} label="Redo" size="icon" className="size-11 shrink-0" disabled={!canRedo} onClick={() => params.redo()} tipSide="top" />
          </div>
          {open && published > 0 && (
            <div className="max-h-[32dvh] min-h-0 overflow-y-auto overscroll-contain border-t border-line md:max-h-none md:flex-1 [@media(max-height:500px)]:max-h-none [@media(max-height:500px)]:flex-1">
              <Inspector params={params} published id="client" />
            </div>
          )}
          <div className="flex flex-none gap-2 border-t border-line p-3">
            {actions}
            {onDownload && <Button variant="primary" size="lg" className="h-11 flex-1 text-[14px]" onClick={download}><Download size={16} strokeWidth={1.5} />Download</Button>}
            <Button variant={onDownload ? 'default' : 'primary'} size="lg" className={cn('h-11 text-[14px]', onDownload ? 'w-11 shrink-0 px-0' : 'flex-1')} onClick={send} aria-label="Send to designer">
              <Send size={16} strokeWidth={1.5} />{!onDownload && 'Send to designer'}
            </Button>
            {onExit && <IconButton icon={PencilRuler} label="Back to designer view" size="icon" className="size-11 shrink-0" onClick={onExit} tipSide="top" />}
          </div>
        </div>
      </section>
    </div>
  )
}
