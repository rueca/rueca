/* ---------------------------------------------------------------------------
   Screen-space overlay above the world: hover and selection frames, smart
   guides, marquee, auto-layout insertion bar, ⌥ measurements, prototype
   connectors, comment pins, the context bar and the text editor.
   Lines are drawn in screen pixels so they stay crisp at any zoom.
--------------------------------------------------------------------------- */
import { useState } from 'react'
import { useStore } from 'zustand'
import { Play } from 'lucide-react'
import { useValues } from '@kit'
import { camera } from './camera'
import { useDesign, layout as layoutOf, page as pageOf } from '../model/store'
import * as S from '../model/store'
import { prefs } from '../model/prefs'
import { find, locate } from '../model/tree'
import { union, type LayoutMap } from '../model/layout'
import type { Box, Node } from '../model/types'
import { TransformBox } from '../local/TransformBox'
import { measure } from '../local/snap'
import { startResize, startRotate, startConnect } from './gestures'
import { ContextBar } from './ContextBar'
import { TextEditor } from './TextEditor'
import { CommentPins } from './Comments'

const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1))

export function Overlay() {
  const cam = useStore(camera)
  const doc = useDesign((s) => s.doc)
  const pageId = useDesign((s) => s.pageId)
  const selection = useDesign((s) => s.selection)
  const hover = useDesign((s) => s.hover)
  const gesture = useDesign((s) => s.gesture)
  const guides = useDesign((s) => s.guides)
  const marquee = useDesign((s) => s.marquee)
  const insertion = useDesign((s) => s.insertion)
  const dropTarget = useDesign((s) => s.dropTarget)
  const editing = useDesign((s) => s.editing)
  const measuring = useDesign((s) => s.measuring)
  const tab = useDesign((s) => s.tab)
  const tool = useDesign((s) => s.tool)
  const v = useValues(prefs)
  const st = S.get()
  void doc; void pageId
  const L = layoutOf(st)
  const nodes = pageOf(st).nodes
  const sc = (b: Box) => ({ x: b.x * cam.zoom + cam.x, y: b.y * cam.zoom + cam.y, w: b.w * cam.zoom, h: b.h * cam.zoom })

  const selNodes = selection.map((id) => find(nodes, id)).filter(Boolean) as Node[]
  const selBoxes = selNodes.map((n) => L.get(n.id)).filter(Boolean) as Box[]
  const bb = union(selBoxes)
  const single = selNodes.length === 1 ? selNodes[0] : null
  const parentAuto = single ? !!locate(nodes, single.id)?.parent?.layout : false
  const sizeLabel = (n: Node, b: Box) => {
    const w = n.sizingW === 'hug' ? 'Hug' : n.sizingW === 'fill' && parentAuto ? 'Fill' : fmt(b.w)
    const h = n.sizingH === 'hug' ? 'Hug' : n.sizingH === 'fill' && parentAuto ? 'Fill' : fmt(b.h)
    return `${w} × ${h}`
  }

  const showSel = !!bb && !editing && gesture !== 'marquee' && tool !== 'comment'
  const hoverBox = hover && !selection.includes(hover) && !gesture ? L.get(hover) : null
  const hoverNode = hover ? find(nodes, hover) : null

  // ⌥ measurement: from the selection to the hovered node, or to the parent frame's walls
  let measures: ReturnType<typeof measure> = []
  if (measuring && bb && !gesture) {
    const other = hover && !selection.includes(hover) ? L.get(hover) : single ? (locate(nodes, single.id)?.parent ? L.get(locate(nodes, single.id)!.parent!.id) : null) : null
    if (other) measures = measure(bb, other)
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-chrome>
      {/* drop target while reparenting */}
      {dropTarget && L.get(dropTarget) && <Outline b={sc(L.get(dropTarget)!)} width={1.5} />}

      {/* hover */}
      {hoverBox && hoverNode && !measuring && <Outline b={sc(hoverBox)} width={1.5} rotation={hoverNode.rotation} />}

      {/* children outlines of a multi-selection */}
      {showSel && selNodes.length > 1 && selNodes.map((n) => L.get(n.id) && <Outline key={n.id} b={sc(L.get(n.id)!)} width={1} rotation={n.rotation} />)}

      {/* selection */}
      {showSel && bb && (
        <TransformBox
          rect={sc(single ? L.get(single.id)! : bb)}
          rotation={single?.rotation ?? 0}
          badge={gesture === 'move' && !parentAuto ? `${fmt(bb.x - (single ? (locate(nodes, single.id)?.parent ? L.get(locate(nodes, single.id)!.parent!.id)!.x : 0) : 0))}, ${fmt(bb.y - (single ? (locate(nodes, single.id)?.parent ? L.get(locate(nodes, single.id)!.parent!.id)!.y : 0) : 0))}` : single ? sizeLabel(single, L.get(single.id)!) : `${fmt(bb.w)} × ${fmt(bb.h)}`}
          onHandle={selNodes.some((n) => n.locked) ? undefined : (h, e) => startResize(e, h)}
          onRotate={single && !single.locked && !parentAuto ? startRotate : undefined}
          handles={gesture !== 'move'}
        />
      )}

      {/* auto-layout padding / gap hint for a selected auto-layout frame */}
      {showSel && single?.layout && !gesture && <LayoutHints n={single} L={L} sc={sc} />}

      {/* smart guides */}
      {guides.length > 0 && (
        <svg className="absolute inset-0 size-full overflow-visible">
          {guides.map((g, i) => {
            const a = g.axis === 'x' ? { x1: g.at * cam.zoom + cam.x, x2: g.at * cam.zoom + cam.x, y1: g.from * cam.zoom + cam.y, y2: g.to * cam.zoom + cam.y } : { y1: g.at * cam.zoom + cam.y, y2: g.at * cam.zoom + cam.y, x1: g.from * cam.zoom + cam.x, x2: g.to * cam.zoom + cam.x }
            return <line key={i} {...a} stroke="var(--rec)" strokeWidth={1} shapeRendering="crispEdges" />
          })}
        </svg>
      )}

      {/* ⌥ measurements */}
      {measures.length > 0 && (
        <svg className="absolute inset-0 size-full overflow-visible">
          {measures.map((m, i) => {
            const x1 = m.x1 * cam.zoom + cam.x, y1 = m.y1 * cam.zoom + cam.y, x2 = m.x2 * cam.zoom + cam.x, y2 = m.y2 * cam.zoom + cam.y
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--rec)" strokeWidth={1} shapeRendering="crispEdges" />
                <foreignObject x={(x1 + x2) / 2 - 30} y={(y1 + y2) / 2 - 9} width={60} height={18}>
                  <div className="flex h-full items-center justify-center"><span className="rounded-[3px] bg-rec px-1 tabular text-[10.5px] font-medium text-accent-fg">{fmt(m.value)}</span></div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      )}
      {measuring && bb && hoverBox && <Outline b={sc(hoverBox)} width={1} tone="var(--rec)" />}

      {/* marquee */}
      {marquee && <div className="absolute rounded-[1px] bg-accent-soft" style={{ ...pos(sc(marquee)), boxShadow: 'inset 0 0 0 1px var(--accent)' }} />}

      {/* auto-layout insertion */}
      {insertion && <div className="absolute rounded-full bg-accent" style={pos(sc(insertion))} />}

      {tab === 'prototype' && v.showConnectors && <Connectors nodes={nodes} L={L} sc={sc} selection={selection} />}
      {v.showComments && <CommentPins sc={sc} />}
      {showSel && !gesture && tool === 'move' && <ContextBar rect={sc(bb!)} />}
      {editing && <TextEditor id={editing} />}
    </div>
  )
}

const pos = (b: Box) => ({ left: b.x, top: b.y, width: b.w, height: b.h })

function Outline({ b, width = 1, rotation = 0, tone = 'var(--accent)' }: { b: Box; width?: number; rotation?: number; tone?: string }) {
  return <div className="absolute" style={{ ...pos(b), boxShadow: `0 0 0 ${width}px ${tone}`, transform: rotation ? `rotate(${-rotation}deg)` : undefined }} />
}

/** Figma shows padding as hatched bands and gaps as pink stripes on hover of the layout section; we show them faintly on selection. */
function LayoutHints({ n, L, sc }: { n: Node; L: LayoutMap; sc: (b: Box) => Box }) {
  const b = L.get(n.id)!
  const [pt, pr, pb, pl] = n.layout!.pad
  const kids = (n.children ?? []).filter((k) => k.visible).map((k) => L.get(k.id)!).filter(Boolean)
  const row = n.layout!.dir === 'row'
  const gaps: Box[] = []
  for (let i = 1; i < kids.length; i++) {
    const a = kids[i - 1], c = kids[i]
    gaps.push(row ? { x: a.x + a.w, y: b.y + pt, w: c.x - a.x - a.w, h: b.h - pt - pb } : { x: b.x + pl, y: a.y + a.h, w: b.w - pl - pr, h: c.y - a.y - a.h })
  }
  const pads: Box[] = [
    { x: b.x, y: b.y, w: b.w, h: pt }, { x: b.x + b.w - pr, y: b.y, w: pr, h: b.h },
    { x: b.x, y: b.y + b.h - pb, w: b.w, h: pb }, { x: b.x, y: b.y, w: pl, h: b.h },
  ]
  return (
    <>
      {pads.filter((p) => p.w > 0 && p.h > 0).map((p, i) => <div key={`p${i}`} className="absolute bg-accent-soft opacity-60" style={pos(sc(p))} />)}
      {gaps.filter((g) => g.w > 0 && g.h > 0).map((g, i) => <div key={`g${i}`} className="absolute opacity-70" style={{ ...pos(sc(g)), background: 'repeating-linear-gradient(45deg, color-mix(in srgb, var(--rec) 45%, transparent) 0 1px, transparent 1px 5px)' }} />)}
    </>
  )
}

function Connectors({ nodes, L, sc, selection }: { nodes: Node[]; L: LayoutMap; sc: (b: Box) => Box; selection: string[] }) {
  const [drag, setDrag] = useState<{ p: { x: number; y: number } | null; target: string | null }>({ p: null, target: null })
  const cam = camera.getState()
  const links: { from: Box; to: Box; on: boolean; key: string }[] = []
  const walkAll = (list: Node[]) => list.forEach((n) => {
    for (const it of n.interactions ?? []) {
      if (it.action !== 'navigate' || !it.target) continue
      const a = L.get(n.id), b = L.get(it.target)
      if (a && b && n.visible) links.push({ from: sc(a), to: sc(b), on: selection.includes(n.id), key: n.id + it.id })
    }
    if (n.children) walkAll(n.children)
  })
  walkAll(nodes)
  const start = nodes.find((n) => n.id === S.page().start)
  const single = selection.length === 1 ? selection[0] : null
  const sb = single && L.get(single) ? sc(L.get(single)!) : null
  const curve = (a: Box, b: Box | { x: number; y: number; w: number; h: number }) => {
    const x1 = a.x + a.w, y1 = a.y + a.h / 2
    const x2 = b.x, y2 = b.y + Math.min(b.h / 2, 60)
    const dx = Math.max(40, Math.abs(x2 - x1) / 2)
    return { d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`, x1, y1, x2, y2 }
  }
  return (
    <>
      <svg className="absolute inset-0 size-full overflow-visible">
        <defs>
          <marker id="ui-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" /></marker>
        </defs>
        {links.map((l) => {
          const c = curve(l.from, l.to)
          return (
            <g key={l.key} opacity={l.on || !selection.length ? 1 : 0.35}>
              <path d={c.d} fill="none" stroke="var(--accent)" strokeWidth={l.on ? 2 : 1.5} markerEnd="url(#ui-arrow)" />
              <circle cx={c.x1} cy={c.y1} r={3.5} fill="var(--accent)" />
            </g>
          )
        })}
        {drag.p && sb && (() => { const p = { x: drag.p.x * cam.zoom + cam.x, y: drag.p.y * cam.zoom + cam.y, w: 0, h: 0 }; const c = curve(sb, p); return <path d={c.d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#ui-arrow)" /> })()}
      </svg>
      {drag.target && L.get(drag.target) && <Outline b={sc(L.get(drag.target)!)} width={2} />}
      {start && L.get(start.id) && (() => {
        const b = sc(L.get(start.id)!)
        return (
          <div className="absolute flex items-center gap-1 rounded-[5px] bg-accent-strong px-1.5 py-0.5 text-[10.5px] font-medium text-accent-fg" style={{ left: b.x, top: b.y - 46 }}>
            <Play size={10} strokeWidth={2} fill="currentColor" />Flow 1
          </div>
        )
      })()}
      {sb && single && (
        <button type="button" aria-label="Drag to link to a frame"
          onPointerDown={(e) => startConnect(e, single, (p, target) => setDrag({ p, target }))}
          className="pointer-events-auto absolute flex size-[18px] -translate-1/2 items-center justify-center rounded-full bg-accent text-[13px] leading-none font-semibold text-accent-fg shadow-[0_1px_3px_rgba(0,0,0,.3)] hover:scale-110"
          style={{ left: sb.x + sb.w, top: sb.y + sb.h / 2, cursor: 'crosshair' }}>+</button>
      )}
    </>
  )
}
