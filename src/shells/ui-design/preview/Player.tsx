/* ---------------------------------------------------------------------------
   Prototype player. Renders frames with the same NodeView as the canvas and
   runs the interaction graph: tap a hotspot to navigate with the chosen
   transition and curve; tap anywhere else to flash the hotspots (Figma).
   Esc closes · R restarts · ← goes back.
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X, RotateCcw, ArrowLeft } from 'lucide-react'
import { IconButton, Kbd, useHotkeys } from '@kit'
import * as S from '../model/store'
import { NodeView, surfaceStyle } from '../render/NodeView'
import type { Interaction, Node } from '../model/types'

type Nav = { id: string; via?: Interaction; back?: boolean }

export function Player({ onClose }: { onClose: () => void }) {
  const st = S.get()
  const frames = S.frames(st)
  const L = S.layout(st)
  const startId = S.page(st).start && frames.some((f) => f.id === S.page(st).start) ? S.page(st).start! : (S.selectedNodes(st)[0] && frames.find((f) => f.id === S.selectedNodes(st)[0].id)?.id) ?? frames[0]?.id
  const [stack, setStack] = useState<string[]>(startId ? [startId] : [])
  const [nav, setNav] = useState<{ cur: Nav; prev: string | null; key: number }>({ cur: { id: startId ?? '' }, prev: null, key: 0 })
  const [flash, setFlash] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const curEl = useRef<HTMLDivElement>(null)
  const prevEl = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const dialog = useRef<HTMLDivElement>(null)
  const [opener] = useState(() => document.activeElement as HTMLElement | null)

  // Modal: the app behind goes inert, focus starts on Close, and returns to what opened it (the Present button).
  // Every sibling on the path from the dialog up to <body> goes inert, so the dialog stays inside the kit's root (tokens).
  useEffect(() => {
    const made: HTMLElement[] = []
    for (let el: HTMLElement | null = dialog.current; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement?.children ?? []) {
        if (sib !== el && sib instanceof HTMLElement && !sib.inert) { sib.inert = true; made.push(sib) }
      }
    }
    dialog.current?.querySelector<HTMLElement>('[aria-label="Close preview"]')?.focus()
    return () => {
      made.forEach((m) => { m.inert = false })
      const back = opener && opener !== document.body && opener.isConnected ? opener : document.querySelector<HTMLElement>('button[aria-label="Present"]')
      back?.focus()
    }
  }, [])

  const frame = frames.find((f) => f.id === nav.cur.id)
  const fb = frame ? L.get(frame.id)! : { x: 0, y: 0, w: 390, h: 844 }

  useLayoutEffect(() => {
    const fit = () => { const r = box.current?.getBoundingClientRect(); if (r) setScale(Math.min(1, (r.height - 40) / (fb.h + 24), (r.width - 40) / (fb.w + 24))) }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [fb.w, fb.h])

  const go = (n: Nav) => {
    if (!n.id || n.id === nav.cur.id) return
    setNav((s) => ({ cur: n, prev: s.cur.id, key: s.key + 1 }))
    setStack((s) => (n.back ? s.slice(0, -1) : [...s, n.id]))
  }
  const back = (via?: Interaction) => { if (stack.length > 1) go({ id: stack[stack.length - 2], via, back: true }) }
  const restart = () => { setStack(startId ? [startId] : []); setNav((s) => ({ cur: { id: startId ?? '' }, prev: null, key: s.key + 1 })) }

  // run the transition after the new layer mounts
  useLayoutEffect(() => {
    const it = nav.cur.via
    if (!nav.prev || !it || it.transition === 'instant') { if (nav.prev) setNav((s) => ({ ...s, prev: null })); return }
    const easing = `cubic-bezier(${it.easing.join(',')})`
    const o = { duration: it.duration, easing, fill: 'both' as const }
    const dir = nav.cur.back ? -1 : 1
    const a: Animation[] = []
    const cur = curEl.current, prev = prevEl.current
    if (!cur || !prev) return
    if (it.transition === 'dissolve' || it.transition === 'smart') a.push(cur.animate([{ opacity: 0 }, { opacity: 1 }], o))
    if (it.transition === 'move-in') {
      if (dir > 0) a.push(cur.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], o))
      else { prev.style.zIndex = '2'; a.push(prev.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], o)) }
    }
    if (it.transition === 'push') {
      a.push(cur.animate([{ transform: `translateX(${100 * dir}%)` }, { transform: 'none' }], o))
      a.push(prev.animate([{ transform: 'none' }, { transform: `translateX(${-100 * dir}%)` }], o))
    }
    Promise.all(a.map((x) => x.finished)).then(() => setNav((s) => (s.key === nav.key ? { ...s, prev: null } : s))).catch(() => {})
    return () => a.forEach((x) => x.cancel())
  }, [nav.key])

  useHotkeys({ esc: onClose, r: restart, arrowleft: () => back() }, [stack])
  useEffect(() => { const t = flash && setTimeout(() => setFlash(false), 650); return () => { if (t) clearTimeout(t) } }, [flash])

  const onHotspot = (n: Node) => {
    const it = n.interactions?.find((i) => i.trigger === 'tap' || i.trigger === 'hover' || i.trigger === 'drag')
    if (!it) return
    if (it.action === 'back') back(it)
    else if (it.target) go({ id: it.target, via: it })
  }
  const layer = (id: string, ref: React.RefObject<HTMLDivElement | null>, z: number) => {
    const f = frames.find((x) => x.id === id)
    if (!f) return null
    const b = L.get(f.id)!
    const { boxShadow: _bs, ...surface } = surfaceStyle(f)
    return (
      <div ref={ref} key={`${id}-${z}`} className="absolute inset-0 overflow-hidden font-artboard" style={{ ...surface, zIndex: z, borderRadius: 0 }}>
        {f.children?.map((c) => <NodeView key={c.id} n={c} parent={b} ctx={{ layout: L, onHotspot, hotspots: flash }} />)}
      </div>
    )
  }

  return (
    <div ref={dialog} className="fixed inset-0 z-[160] flex flex-col bg-field" role="dialog" aria-modal="true" aria-label="Prototype preview"
      // Esc closes even while a focused button's tooltip is open (the tooltip would swallow the first press)
      onKeyDownCapture={(e) => { if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); e.stopPropagation(); onClose() } }}>
      <div className="flex h-12 flex-none items-center gap-2 border-b border-line bg-panel px-pad">
        <IconButton icon={ArrowLeft} label="Back" shortcut="arrowleft" disabled={stack.length < 2} onClick={() => back()} />
        <IconButton icon={RotateCcw} label="Restart" shortcut="r" onClick={restart} />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-title">
          <span className="truncate font-medium">{frame?.name ?? 'No frames'}</span>
          <span className="text-fg-faint tabular">{stack.length > 1 ? `${stack.length} deep` : ''}</span>
        </div>
        <span className="hidden items-center gap-1 text-ui text-fg-faint sm:flex">Click anywhere to see hotspots <Kbd>esc</Kbd></span>
        <IconButton icon={X} label="Close preview" shortcut="esc" onClick={onClose} />
      </div>
      <div ref={box} className="relative flex min-h-0 flex-1 items-center justify-center" onClick={() => setFlash(true)}>
        {frame ? (
          <div className="relative" style={{ width: (fb.w + 24) * scale, height: (fb.h + 24) * scale }}>
            <div className="absolute top-0 left-0 origin-top-left rounded-[56px] bg-[#0b0b0c] p-3 shadow-[var(--shadow-artboard)]" style={{ width: fb.w + 24, height: fb.h + 24, transform: `scale(${scale})` }}>
              <div className="relative size-full overflow-hidden rounded-[44px]" style={{ isolation: 'isolate' }}>
                {nav.prev && layer(nav.prev, prevEl, 1)}
                {layer(nav.cur.id, curEl, 2)}
              </div>
            </div>
          </div>
        ) : <div className="text-[12px] text-fg-muted">Draw a frame to preview it.</div>}
      </div>
    </div>
  )
}
