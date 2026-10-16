/* The stage: the current row rendered at every visible output size, auto-arranged. */
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { Plus, TriangleAlert, Eye, ClipboardPaste } from 'lucide-react'
import { Stage, Artboard, Empty, Button, Tip, useValues, useDoc, useCamera, type CameraStore } from '@kit'
import { drawPost, ensureFonts, onShotReady, peekImage } from './artifact'
import { doc, params, ui, effective, type DataRow, type SizeSpec, type V } from './model'
import { packArtboards } from './local/pack'
import { addRow, patchSize, selectSize } from './actions'

/** Preview resolution follows zoom in powers of two, so canvases stay sharp without redrawing 4K bitmaps at 15%. */
const bucket = (zoom: number) => Math.min(1, Math.max(1 / 8, 2 ** Math.ceil(Math.log2(zoom * Math.min(2, devicePixelRatio || 1)))))

function PostCanvas({ size, row, v, res, logo, tick }: { size: SizeSpec; row: DataRow; v: V; res: number; logo: HTMLImageElement | null; tick: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const W = Math.max(1, Math.round(size.w * res)), H = Math.max(1, Math.round(size.h * res))
    if (c.width !== W) c.width = W
    if (c.height !== H) c.height = H
    const ctx = c.getContext('2d')!
    ctx.setTransform(res, 0, 0, res, 0, 0)
    drawPost(ctx, size.w, size.h, row, v, size, logo)
  }, [size, row, v, res, logo, tick])
  return <canvas ref={ref} className="block h-full w-full" />
}

function SafeOverlay({ size, v }: { size: SizeSpec; v: V }) {
  const zoom = useStore(useCamera(), (s) => s.zoom)
  const pad = (v.padding / 100) * Math.min(size.w, size.h)
  const inner = { left: size.safe.l + pad, top: size.safe.t + pad, right: size.safe.r + pad, bottom: size.safe.b + pad }
  const stripe = 24
  return (
    <div className="pointer-events-none absolute inset-0">
      {size.zones.map((z, i) => (
        <div key={i} className="absolute" style={{
          left: z.x, top: z.y, width: z.w, height: z.h,
          background: `repeating-linear-gradient(45deg, color-mix(in srgb, var(--rec) 30%, transparent) 0 ${stripe}px, color-mix(in srgb, var(--rec) 8%, transparent) ${stripe}px ${stripe * 2}px)`,
        }}>
          {z.label && (
            <span className="absolute top-0 left-0 m-1 origin-top-left rounded-control bg-overlay px-1.5 py-0.5 text-ui-sm whitespace-nowrap text-fg shadow-[var(--shadow-segment)]"
              style={{ transform: `scale(${1 / zoom})` }}>{z.label}</span>
          )}
        </div>
      ))}
      <div className="absolute" style={{ ...inner, outline: `${1 / zoom}px dashed var(--signal)`, outlineOffset: 0 }} />
    </div>
  )
}

export function BatchStage({ camera, issues }: { camera: CameraStore; issues: Record<string, string[]> }) {
  const sizes = useDoc(doc, (d) => d.sizes)
  const rows = useDoc(doc, (d) => d.rows)
  const overrides = useDoc(doc, (d) => d.overrides)
  const rowIdx = useStore(ui, (s) => Math.min(s.row, Math.max(0, rows.length - 1)))
  const selected = useStore(ui, (s) => s.selected)
  const safe = useStore(ui, (s) => s.safe)
  const v = useValues(params) as V
  const res = useStore(camera, (s) => bucket(s.zoom))
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => { void ensureFonts().then(bump) }, [])
  useEffect(() => onShotReady(bump), [])
  const logo = peekImage(v.logo, bump)

  const box = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: 1000, h: 640 })
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setVp((p) => {
      const w = Math.round(e.contentRect.width / 40) * 40, h = Math.round(e.contentRect.height / 40) * 40
      return p.w === w && p.h === h ? p : { w, h }
    }))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])

  const visible = useMemo(() => sizes.filter((s) => s.visible !== false), [sizes])
  const layoutKey = visible.map((s) => `${s.id}:${s.w}x${s.h}`).join('|')
  const packed = useMemo(
    () => packArtboards(visible.map((s) => ({ id: s.id, w: s.w, h: s.h })), { gap: Math.max(...visible.map((s) => Math.max(s.w, s.h)), 400) * 0.09, viewport: vp }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey, vp.w, vp.h],
  )
  // A stable object: the kit Stage refits whenever contentSize changes identity.
  const content = useMemo(() => ({ w: packed.w, h: packed.h }), [packed.w, packed.h])

  const row = rows[rowIdx]
  let body: React.ReactNode
  if (!rows.length) {
    body = (
      <div className="flex h-full items-center justify-center">
        <Empty icon={ClipboardPaste} title="No data yet" hint="Each row of data becomes one set of assets. Add a row, or paste a sheet into the data table below."
          action={<Button variant="default" className="mt-2" onClick={() => addRow(-1)}><Plus size={14} strokeWidth={1.5} />Add a row</Button>} />
      </div>
    )
  } else if (!visible.length) {
    body = (
      <div className="flex h-full items-center justify-center">
        <Empty icon={Eye} title="Every size is hidden" hint="Show a size in the Sizes panel to preview it here."
          action={<Button variant="default" className="mt-2" onClick={() => sizes.forEach((s) => patchSize(s.id, { visible: true }))}>Show all sizes</Button>} />
      </div>
    )
  } else {
    body = (
      <Stage camera={camera} contentSize={content} grid onBackgroundPointerDown={() => selectSize(null)}>
        <div style={{ width: packed.w, height: packed.h }} className="relative">
          {visible.map((s) => {
            const eff = effective(v, overrides[s.id])
            const iss = issues[s.id] ?? []
            const n = Object.keys(overrides[s.id] ?? {}).length
            const p = packed.pos[s.id] ?? { x: 0, y: 0 }
            return (
              <Artboard key={s.id} x={p.x} y={p.y} width={s.w} height={s.h} background={eff.paper} selected={selected === s.id} onSelect={() => selectSize(s.id)}
                label={
                  <span className="flex items-center gap-1.5">
                    <span className={selected === s.id ? 'text-signal' : 'text-fg-muted'}>{s.name}</span>
                    {n > 0 && <span className="text-signal">{n} override{n > 1 ? 's' : ''}</span>}
                    {iss.length > 0 && (
                      <Tip label={iss.join(' · ')}><span className="flex items-center gap-0.5 text-key"><TriangleAlert size={11} strokeWidth={1.75} />{iss.length}</span></Tip>
                    )}
                  </span>
                }>
                <div className="absolute inset-0" onClick={() => selectSize(s.id)}>
                  <PostCanvas size={s} row={row} v={eff} res={res} logo={logo} tick={tick} />
                </div>
                {safe && <SafeOverlay size={s} v={eff} />}
              </Artboard>
            )
          })}
        </div>
      </Stage>
    )
  }
  return <div ref={box} className="h-full w-full">{body}</div>
}
