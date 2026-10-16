/* Lightbox (Space / double-click) and Compare (select two, C). Both cover the gallery, not the whole app. */
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Heart, Wand2, Download, ArrowLeftRight, ImageUpscale, Grid2x2Plus } from 'lucide-react'
import { CompareSplit, IconButton, Segmented, Badge, toast, cn } from '@kit'
import { modelOf, type GenParams } from '../engine/models'
import { useGallery, visible, step, toggleFavourite, byId, type ImageRec } from '../state/gallery'
import { ui, useUI } from '../state/ui'
import { usePix, exportPNG } from '../state/images'
import { variations, upscale, remix } from '../state/actions'

export function Overlays() {
  const overlay = useUI((s) => s.overlay)
  if (!overlay) return null
  return overlay.type === 'lightbox' ? <Lightbox /> : <Compare a={overlay.a} b={overlay.b} mode={overlay.mode} />
}

const close = () => ui.setState({ overlay: null })

function Big({ rec, className }: { rec: ImageRec; className?: string }) {
  const pix = usePix(rec.id, rec.params, 'full')
  return pix ? <img src={pix.url} alt={rec.params.prompt} draggable={false} className={cn('max-h-full max-w-full object-contain', className)} /> : <span className="block size-24 animate-pulse rounded-[8px] bg-hover" />
}

function Lightbox() {
  const state = useGallery((s) => s)
  const anchor = state.anchor
  const list = useMemo(() => visible(state), [state])
  const rec = list.find((i) => i.id === anchor) ?? list[0]
  useEffect(() => { if (!rec) close() }, [rec])
  if (!rec) return null
  const idx = list.indexOf(rec)
  const p = rec.params
  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-[var(--radius-panel)] bg-field" role="dialog" aria-label="Image viewer">
      <div className="flex h-12 flex-none items-center gap-2 px-pad">
        <div className="min-w-0 flex-1">
          <div className="truncate text-title text-fg">{p.prompt}</div>
          <div className="tabular text-ui text-fg-faint">{idx + 1} / {list.length} · {modelOf(p.model).name} · seed {p.seed} · {p.w * (p.upscale ?? 1)} × {p.h * (p.upscale ?? 1)}</div>
        </div>
        <IconButton icon={Heart} label="Favourite" shortcut="f" active={!!rec.favourite} onClick={() => toggleFavourite([rec.id])} />
        <IconButton icon={Grid2x2Plus} label="Variations" shortcut="v" onClick={() => variations(rec)} />
        <IconButton icon={ImageUpscale} label="Upscale 2×" shortcut="u" disabled={!!p.upscale} onClick={() => upscale(rec)} />
        <IconButton icon={Wand2} label="Remix" shortcut="r" onClick={() => { close(); remix(rec) }} />
        <IconButton icon={Download} label="Download PNG" onClick={async () => { await exportPNG(p, rec.id); toast('PNG exported', { type: 'success' }) }} />
        <IconButton icon={X} label="Close" shortcut="esc" onClick={close} />
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 pt-0" onClick={(e) => e.target === e.currentTarget && close()}>
        <Big rec={rec} className="rounded-[6px] shadow-[var(--shadow-artboard)]" />
        <button type="button" aria-label="Previous image" disabled={idx <= 0} onClick={() => step(-1)}
          className="cluster absolute top-1/2 left-4 flex size-bar -translate-y-1/2 items-center justify-center text-fg-muted outline-none hover:text-fg disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-signal"><ChevronLeft size={16} strokeWidth={1.5} /></button>
        <button type="button" aria-label="Next image" disabled={idx >= list.length - 1} onClick={() => step(1)}
          className="cluster absolute top-1/2 right-4 flex size-bar -translate-y-1/2 items-center justify-center text-fg-muted outline-none hover:text-fg disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-signal"><ChevronRight size={16} strokeWidth={1.5} /></button>
      </div>
    </div>
  )
}

const DIFF: (keyof GenParams)[] = ['seed', 'model', 'steps', 'guidance', 'aspect', 'subStrength', 'upscale', 'prompt']

function Compare({ a, b, mode }: { a: string; b: string; mode: 'wipe' | 'side' }) {
  const A = byId(a), B = byId(b)
  const [pos, setPos] = useState(0.5)
  useEffect(() => { if (!A || !B) close() }, [A, B])
  if (!A || !B) return null
  const label = (r: ImageRec) => `${modelOf(r.params.model).name} · seed ${r.params.seed}`
  const diffs = DIFF.filter((k) => String(A.params[k] ?? '') !== String(B.params[k] ?? ''))
  const ratio = Math.max(A.params.w / A.params.h, B.params.w / B.params.h)
  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-[var(--radius-panel)] bg-field" role="dialog" aria-label="Compare images">
      <div className="flex h-12 flex-none items-center gap-2 px-pad [--d-control:var(--d-icon)]">
        <span className="text-title font-semibold text-fg">Compare</span>
        <div className="w-[170px]"><Segmented value={mode} onChange={(m) => ui.setState({ overlay: { type: 'compare', a, b, mode: m as 'wipe' | 'side' } })} label="Compare mode"
          options={[{ value: 'wipe', label: 'Wipe' }, { value: 'side', label: 'Side by side' }]} /></div>
        <IconButton icon={ArrowLeftRight} label="Swap A and B" onClick={() => ui.setState({ overlay: { type: 'compare', a: b, b: a, mode } })} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
          {diffs.length ? diffs.map((k) => <Badge key={k} tone="accent">{k === 'subStrength' ? 'variation' : k} differs</Badge>) : <Badge>identical settings</Badge>}
        </div>
        <IconButton icon={X} label="Close" shortcut="esc" onClick={close} />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-0">
        {mode === 'wipe' ? (
          <div className="relative max-h-full max-w-full overflow-hidden rounded-[6px] shadow-[var(--shadow-artboard)]" style={{ aspectRatio: String(ratio), height: '100%' }}>
            <CompareSplit value={pos} onChange={(v) => setPos(v)} dragAnywhere label="A / B divider"
              labels={[`A · ${label(A)}`, `B · ${label(B)}`]} before={<Fill rec={A} />} after={<Fill rec={B} />} />
          </div>
        ) : (
          <div className="grid h-full w-full grid-cols-2 gap-3">
            {[A, B].map((r, i) => (
              <figure key={r.id} className="flex min-h-0 flex-col items-center justify-center gap-2">
                <div className="flex min-h-0 flex-1 items-center justify-center"><Big rec={r} className="rounded-[6px] shadow-[var(--shadow-artboard)]" /></div>
                <figcaption className="tabular text-ui text-fg-muted"><span className="text-fg">{i ? 'B' : 'A'}</span> · {label(r)} · {r.params.steps} steps · CFG {r.params.guidance}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Fill({ rec }: { rec: ImageRec }) {
  const pix = usePix(rec.id, rec.params, 'full')
  return pix ? <img src={pix.url} alt="" draggable={false} className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse bg-hover" />
}
