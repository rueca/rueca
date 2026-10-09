/* ---------------------------------------------------------------------------
   The design canvas. The kit's <Stage> owns the camera (wheel pan, ⌘wheel
   zoom, space-drag, zoom pill); the world content is pointer-transparent so
   every press reaches Stage's onBackgroundPointerDown, where our gestures
   hit-test against the layout map. Overlays render in Stage's `overlay` slot.
--------------------------------------------------------------------------- */
import { useEffect, useMemo } from 'react'
import { Stage, Artboard, Empty, Button, useValues, cn } from '@kit'
import { Frame as FrameIcon, Component } from 'lucide-react'
import { camera } from './camera'
import * as S from '../model/store'
import { prefs } from '../model/prefs'
import { NodeView, surfaceStyle, type RenderCtx } from '../render/NodeView'
import { onCanvasPointerDown, onCanvasDoubleClick, onCanvasHover } from './gestures'
import { Overlay } from './Overlay'
import { union } from '../model/layout'
import { frame } from '../model/factory'

const CURSORS: Record<string, string> = { frame: 'crosshair', rect: 'crosshair', ellipse: 'crosshair', text: 'text', hand: 'grab', comment: 'copy' }

export function Canvas({ dock }: { dock: React.ReactNode }) {
  const doc = S.useDesign((s) => s.doc)
  const pageId = S.useDesign((s) => s.pageId)
  const selection = S.useDesign((s) => s.selection)
  const editing = S.useDesign((s) => s.editing)
  const tool = S.useDesign((s) => s.tool)
  const gesture = S.useDesign((s) => s.gesture)
  const { showGrid } = useValues(prefs)
  const st = S.get()
  void doc
  const page = S.page(st)
  const L = S.layout(st)
  const ctx: RenderCtx = useMemo(() => ({ layout: L, editing }), [L, editing])
  const bounds = union(page.nodes.map((n) => L.get(n.id)!).filter(Boolean))
  // Stage refits whenever contentSize changes identity, so keep it stable per page;
  // after that the camera belongs to the user (see the page-switch effect below).
  const cw = Math.max(400, (bounds?.x ?? 0) + (bounds?.w ?? 0)), chh = Math.max(300, (bounds?.y ?? 0) + (bounds?.h ?? 0))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contentSize = useMemo(() => ({ w: cw, h: chh }), [pageId])

  // ⌥ shows distances (Figma). Track it globally so it works mid-hover.
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); S.design.setState({ measuring: e.type === 'keydown' }) } }
    const blur = () => S.design.setState({ measuring: false })
    window.addEventListener('keydown', on); window.addEventListener('keyup', on); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', on); window.removeEventListener('keyup', on); window.removeEventListener('blur', blur) }
  }, [])

  // fit the page when switching pages
  useEffect(() => {
    const b = union(S.nodesOf().map((n) => S.layout().get(n.id)!).filter(Boolean))
    if (!b) return
    const r = camera.bounds?.()
    if (!r || !r.width) return
    const z = Math.min(1, Math.min((r.width - 160) / b.w, (r.height - 160) / b.h))
    camera.setState({ zoom: z, x: (r.width - b.w * z) / 2 - b.x * z, y: (r.height - b.h * z) / 2 - b.y * z })
  }, [pageId])

  const cursor = gesture === 'pan' ? 'grabbing' : CURSORS[tool]
  return (
    <div className="relative h-full w-full" style={{ cursor }} onPointerMove={onCanvasHover} onPointerLeave={() => S.setHover(null)} onDoubleClick={onCanvasDoubleClick}>
      <Stage
        camera={camera}
        contentSize={contentSize}
        padding={80}
        grid={showGrid}
        background={page.bg || undefined}
        onBackgroundPointerDown={onCanvasPointerDown}
        overlay={<><Overlay />{dock}</>}
      >
        <div className="pointer-events-none">
          {page.nodes.map((n) => {
            const b = L.get(n.id)
            if (!b || !n.visible) return null
            if (n.type === 'frame' && !n.rotation) {
              const { background, ...rest } = surfaceStyle(n)
              return (
                <Artboard key={n.id} x={b.x} y={b.y} width={Math.round(b.w)} height={Math.round(b.h)} background={(background as string) ?? 'transparent'}
                  selected={selection.includes(n.id)}
                  label={<span className="flex items-center gap-1">{n.component && <Component size={11} strokeWidth={1.75} className="text-accent" />}{n.name}</span>}
                  className={cn(!n.clip && 'overflow-visible')}
                  style={{ ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)), opacity: n.opacity }}>
                  {n.children?.map((c) => <NodeView key={c.id} n={c} parent={b} ctx={ctx} />)}
                </Artboard>
              )
            }
            return <NodeView key={n.id} n={n} parent={{ x: 0, y: 0, w: 0, h: 0 }} ctx={ctx} />
          })}
        </div>
      </Stage>
      {!page.nodes.length && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <Empty icon={FrameIcon} title="This page is empty" hint="Draw a frame to start a screen. Press F, then drag on the canvas — or start from a phone-sized frame."
              action={<Button variant="default" size="md" className="mt-1" onClick={() => {
                const r = camera.bounds?.()
                const c = camera.getState()
                const x = r ? Math.round((r.width / 2 - c.x) / c.zoom - 195) : 0
                const y = r ? Math.round((r.height / 2 - c.y) / c.zoom - 422) : 0
                S.addNode(frame({ name: 'iPhone 15', x, y, w: 390, h: 844 }), null)
              }}>Add a 390 × 844 frame</Button>} />
          </div>
        </div>
      )}
    </div>
  )
}
