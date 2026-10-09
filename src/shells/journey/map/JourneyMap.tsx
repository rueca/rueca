/* The map: stages × lanes on a board that sits on the kit <Stage> camera.
   Cards drag between cells, stage headers drag to reorder, pain points drag
   a link onto opportunities. Every drag has a keyboard / inspector twin. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Route, LayoutTemplate } from 'lucide-react'
import { cn, useValues, useDoc, Tip, Button, Empty } from '@kit'
import { JourneyCard } from './Card'
import { EmotionLane } from './EmotionLane'
import { LANES, deepen, emoji, initials, type Card, type LaneId, type Persona } from '../model'
import {
  params, ui, useUI, usePersona, camera, doc, moveCard, addCard, addStage, reorderStage, toggleLink, cellCards, updateStage, startFromTemplate,
} from '../store'
import { InlineText } from '@kit/ui/inline-text'

export const LANE_W = 176
const ADD_W = 56
const THRESHOLD = 4

type Drag =
  | { kind: 'card'; card: Card; x0: number; y0: number; started: boolean; w: number }
  | { kind: 'stage'; id: string; x0: number; y0: number; started: boolean }
  | { kind: 'link'; card: Card; x0: number; y0: number; started: boolean }

export function JourneyMap({ mapRef }: { mapRef: React.RefObject<HTMLDivElement | null> }) {
  const p = usePersona()
  const title = useDoc(doc, (d) => d.title)
  const v = useValues(params)
  const sel = useUI((s) => s.sel)
  const editing = useUI((s) => s.editing)
  const filterTag = useUI((s) => s.filterTag)
  const drop = useUI((s) => s.drop)
  const stageDrop = useUI((s) => s.stageDrop)
  const lanes = LANES.filter((l) => v.visibleLanes.includes(l.id))
  const colW = v.columnWidth
  const n = p.stages.length
  const compact = v.density === 'compact'

  /* ---------------------------------------------------------------- drag */
  const drag = useRef<Drag | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number; card: Card; w: number } | null>(null)
  const [linkEnd, setLinkEnd] = useState<{ x: number; y: number; from: string; over: string | null } | null>(null)
  const linkRef = useRef<typeof linkEnd>(null)

  const worldPoint = (cx: number, cy: number) => {
    const r = mapRef.current!.getBoundingClientRect()
    const z = camera.getState().zoom
    return { x: (cx - r.left) / z, y: (cy - r.top) / z }
  }
  const cellAt = (x: number, y: number) => {
    const el = document.elementsFromPoint(x, y).find((e) => (e as HTMLElement).dataset?.cell) as HTMLElement | undefined
    if (!el) return null
    const [lane, stage] = el.dataset.cell!.split('|') as [LaneId, string]
    const id = drag.current && drag.current.kind === 'card' ? drag.current.card.id : ''
    const kids = [...el.querySelectorAll<HTMLElement>('[data-card]')].filter((k) => k.dataset.card !== id)
    let index = kids.length
    for (let i = 0; i < kids.length; i++) { const r = kids[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { index = i; break } }
    return { lane, stage, index }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (!d.started) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < THRESHOLD) return
        d.started = true
        ui.setState({ editing: null })
      }
      if (d.kind === 'card') {
        setGhost({ x: e.clientX, y: e.clientY, card: d.card, w: d.w })
        const c = cellAt(e.clientX, e.clientY)
        ui.setState({ drop: c && c.lane !== 'emotion' ? c : null })
      } else if (d.kind === 'stage') {
        const heads = [...mapRef.current!.querySelectorAll<HTMLElement>('[data-stage-index]')]
        let idx = heads.length
        for (let i = 0; i < heads.length; i++) { const r = heads[i].getBoundingClientRect(); if (e.clientX < r.left + r.width / 2) { idx = i; break } }
        ui.setState({ stageDrop: idx })
      } else {
        const over = (document.elementsFromPoint(e.clientX, e.clientY).find((el) => (el as HTMLElement).dataset?.lane === 'opps') as HTMLElement | undefined)?.dataset.card ?? null
        linkRef.current = { ...worldPoint(e.clientX, e.clientY), from: d.card.id, over }
        setLinkEnd(linkRef.current)
      }
    }
    const up = () => {
      const d = drag.current
      drag.current = null
      if (!d) return
      if (d.kind === 'card' && d.started) {
        const t = ui.getState().drop
        if (t) moveCard(d.card.id, t.lane, t.stage, t.index)
      }
      if (d.kind === 'stage' && d.started) {
        const t = ui.getState().stageDrop
        if (t !== null) reorderStage(d.id, t)
      }
      if (d.kind === 'link' && d.started) {
        const over = linkRef.current?.over
        if (over) toggleLink(over, d.card.id)
        linkRef.current = null
        setLinkEnd(null)
      }
      setGhost(null)
      ui.setState({ drop: null, stageDrop: null })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCardDown = (e: React.PointerEvent, c: Card) => {
    if (e.button !== 0 || ui.getState().editing === c.id) return
    e.stopPropagation()
    ui.setState({ sel: { kind: 'card', id: c.id }, editing: ui.getState().editing === c.id ? c.id : null })
    const z = camera.getState().zoom
    drag.current = { kind: 'card', card: c, x0: e.clientX, y0: e.clientY, started: false, w: (e.currentTarget as HTMLElement).getBoundingClientRect().width / z }
  }
  const onLinkDown = (e: React.PointerEvent, c: Card) => {
    if (e.button !== 0) return
    drag.current = { kind: 'link', card: c, x0: e.clientX, y0: e.clientY, started: false }
  }
  const onStageDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('input,textarea')) return
    e.stopPropagation()
    ui.setState({ sel: { kind: 'stage', id }, editing: null })
    drag.current = { kind: 'stage', id, x0: e.clientX, y0: e.clientY, started: false }
  }

  /* ---------------------------------------------------------------- persona swap fade */
  const board = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    board.current?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' })
  }, [p.id])

  const linkCounts = new Map<string, number>()
  for (const c of p.cards) if (c.lane === 'opps') { linkCounts.set(c.id, c.links?.length ?? 0); for (const l of c.links ?? []) linkCounts.set(l, (linkCounts.get(l) ?? 0) + 1) }
  const selStage = sel?.kind === 'stage' ? sel.id : null
  const draggingCard = ghost?.card.id
  const width = n === 0 ? 760 : LANE_W + n * colW + ADD_W

  return (
    <div ref={(el) => { mapRef.current = el; board.current = el }} data-journey-map className="relative rounded-[18px] bg-panel font-artboard text-fg"
      style={{ width, boxShadow: 'var(--shadow-artboard), 0 0 0 1px var(--artboard-ring)' }}>
      {/* title band */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white" style={{ background: deepen(p.hue) }}>{initials(p.name)}</span>
        <div className="min-w-0 flex-1">
          <InlineText bare focusable={false} value={title} onCommit={(t) => doc.set((d) => ({ ...d, title: t }), { label: 'Rename map' })} className="block truncate text-[17px] font-semibold tracking-[-0.01em]" label="Map title" />
          <div className="truncate text-[12px] text-fg-muted">{p.name} · {p.role}{p.quote && <span className="text-fg-faint"> — “{p.quote}”</span>}</div>
        </div>
        <Legend />
      </div>

      {n === 0 ? (
        <div className="flex h-[420px] items-center justify-center">
          <Empty icon={Route} title={`${p.name} has no journey yet`} hint="Start from the six standard stages, or add your own one at a time."
            action={<div className="mt-1 flex gap-1.5"><Button variant="primary" size="md" onClick={startFromTemplate}><LayoutTemplate size={13} strokeWidth={1.5} />Use 6 stages</Button><Button variant="default" size="md" onClick={() => addStage()}>Add a stage</Button></div>} />
        </div>
      ) : (
        <div className="relative grid" style={{ gridTemplateColumns: `${LANE_W}px repeat(${n}, ${colW}px) ${ADD_W}px` }}>
          {/* header row */}
          <div className="flex items-end px-4 pt-3 pb-2.5 text-[11px] text-fg-faint">Stage</div>
          {p.stages.map((s, i) => (
            <div key={s.id} data-stage-index={i}
              onPointerDown={(e) => onStageDown(e, s.id)}
              className={cn('group/stage relative cursor-grab border-l border-line px-3 pt-3 pb-2.5 active:cursor-grabbing', selStage === s.id && 'bg-signal-soft')}>
              <div className="flex items-center gap-1.5">
                <span className={cn('flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[10.5px] font-semibold tabular', selStage === s.id ? 'bg-signal-strong text-signal-fg' : 'bg-active text-fg-muted')}>{i + 1}</span>
                <InlineText bare focusable={false} value={s.name} onCommit={(name) => updateStage(s.id, { name }, { label: 'Rename stage' })} className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[-0.01em]" label="Stage name" />
                <span className="text-[14px]" aria-hidden>{emoji(s.emotion)}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-fg-faint tabular">{s.duration || '—'}</div>
              {s.goal && <div className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-fg-muted">{s.goal}</div>}
              {stageDrop === i && <DropBar vertical />}
              {stageDrop === n && i === n - 1 && <DropBar vertical end />}
            </div>
          ))}
          <div className="flex items-start justify-center border-l border-line pt-3" data-export="skip">
            <Tip label="Add stage"><button type="button" aria-label="Add stage" onClick={() => addStage()} className="flex size-7 items-center justify-center rounded-[7px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal"><Plus size={14} strokeWidth={1.5} /></button></Tip>
          </div>

          {/* lanes */}
          {lanes.map((lane, li) => {
            const LIcon = lane.icon
            const count = lane.id === 'emotion' ? null : p.cards.filter((c) => c.lane === lane.id).length
            const head = (
              <div key={`h-${lane.id}`} className={cn('relative flex flex-col gap-1 border-t border-line px-4 py-3', li % 2 === 1 && 'bg-[color-mix(in_srgb,var(--fg)_1.5%,transparent)]')}>
                <div className="flex items-center gap-2 text-[12px] font-medium"><LIcon size={14} strokeWidth={1.5} className="text-fg-muted" />{lane.label}</div>
                {count !== null && <div className="pl-[22px] text-[11px] text-fg-faint tabular">{count} {count === 1 ? 'card' : 'cards'}</div>}
                {lane.id === 'emotion' && <EmotionScale h={v.curveHeight} />}
              </div>
            )
            if (lane.id === 'emotion')
              return [
                head,
                <div key="emo" className={cn('border-t border-l border-line', li % 2 === 1 && 'bg-[color-mix(in_srgb,var(--fg)_1.5%,transparent)]')} style={{ gridColumn: `span ${n}` }}>
                  <EmotionLane stages={p.stages} colW={colW} />
                </div>,
                <div key="emo-end" className="border-t border-l border-line" />,
              ]
            return [
              head,
              ...p.stages.map((s) => {
                const cards = cellCards(p, lane.id, s.id)
                const dropHere = drop && drop.lane === lane.id && drop.stage === s.id ? drop.index : -1
                const visible = cards.filter((c) => c.id !== draggingCard)
                return (
                  <div key={`${lane.id}-${s.id}`} data-cell={`${lane.id}|${s.id}`}
                    onPointerDown={(e) => { if (e.target === e.currentTarget) ui.setState({ sel: null, editing: null }) }}
                    onDoubleClick={(e) => { if (e.target === e.currentTarget) addCard(lane.id, s.id) }}
                    className={cn('group/cell relative flex min-h-[76px] flex-col border-t border-l border-line p-2', compact ? 'gap-1.5' : 'gap-2',
                      li % 2 === 1 && 'bg-[color-mix(in_srgb,var(--fg)_1.5%,transparent)]', selStage === s.id && 'bg-[color-mix(in_srgb,var(--signal)_5%,transparent)]', dropHere >= 0 && 'bg-[color-mix(in_srgb,var(--signal)_8%,transparent)]')}>
                    {visible.map((c, i) => (
                      <Slot key={c.id} bar={dropHere === i}>
                        <JourneyCard card={c} compact={compact} showTags={v.showTags}
                          selected={sel?.kind === 'card' && sel.id === c.id} editing={editing === c.id}
                          dim={!!filterTag && !c.tags.includes(filterTag)} hit={!!filterTag && c.tags.includes(filterTag)}
                          linkCount={linkCounts.get(c.id) ?? 0} dragging={false}
                          onPointerDown={onCardDown} onLinkStart={c.lane === 'pains' ? onLinkDown : undefined} />
                      </Slot>
                    ))}
                    {dropHere === visible.length && <DropBar />}
                    <button type="button" data-export="skip" aria-label={`Add ${lane.label.toLowerCase()} card to ${s.name}`} onClick={() => addCard(lane.id, s.id)}
                      className="flex h-6 items-center justify-center gap-1 rounded-[6px] text-[11px] text-fg-faint opacity-0 outline-none transition-opacity group-hover/cell:opacity-100 hover:bg-hover hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-signal">
                      <Plus size={12} strokeWidth={1.5} />Add
                    </button>
                  </div>
                )
              }),
              <div key={`${lane.id}-end`} className={cn('border-t border-l border-line', li % 2 === 1 && 'bg-[color-mix(in_srgb,var(--fg)_1.5%,transparent)]')} />,
            ]
          })}
          {v.showLinks && <LinkLayer persona={p} mapRef={mapRef} linkEnd={linkEnd} />}
        </div>
      )}

      {ghost && createPortal(
        <div className="pointer-events-none fixed z-[300] origin-top-left" style={{ left: ghost.x - 20, top: ghost.y - 14, width: ghost.w, transform: `scale(${camera.getState().zoom}) rotate(1.5deg)` }}>
          <div className="pop rounded-[8px] px-2.5 py-2 text-[12px] leading-snug opacity-95">{ghost.card.text || ghost.card.team || 'Empty card'}</div>
        </div>,
        document.body,
      )}
    </div>
  )
}

function Slot({ bar, children }: { bar: boolean; children: ReactNode }) {
  return <>{bar && <DropBar />}{children}</>
}
function DropBar({ vertical, end }: { vertical?: boolean; end?: boolean }) {
  if (vertical) return <span className={cn('absolute top-1 bottom-1 w-[3px] rounded-full bg-signal', end ? '-right-[2px]' : '-left-[2px]')} />
  return <span className="-my-[3px] h-[2px] shrink-0 rounded-full bg-signal" />
}

function EmotionScale({ h }: { h: number }) {
  const PAD = 22
  return (
    <div className="pointer-events-none absolute top-0 right-2 text-[10px] text-fg-faint tabular" style={{ height: h }}>
      {[2, 0, -2].map((v) => <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: PAD + ((2 - v) / 4) * (h - PAD * 2) }}>{v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0'}</span>)}
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-fg-muted" aria-label="Legend">
      <span className="flex items-center gap-1.5"><span className="h-3 w-[3px] rounded-full bg-rec" />Pain point</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-[3px] rounded-full bg-ok" />Opportunity</span>
      <span className="flex items-center gap-1.5"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" style={{ stroke: 'var(--ok)', strokeWidth: 1.5, strokeDasharray: '3 3' }} /></svg>Answers</span>
    </div>
  )
}

/* Pain point → opportunity connectors, measured from the laid-out cards. */
function LinkLayer({ persona: p, mapRef, linkEnd }: { persona: Persona; mapRef: React.RefObject<HTMLDivElement | null>; linkEnd: { x: number; y: number; from: string; over: string | null } | null }) {
  const [geo, setGeo] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({})
  const hover = useUI((s) => s.hoverCard)
  const sel = useUI((s) => (s.sel?.kind === 'card' ? s.sel.id : null))
  const filterTag = useUI((s) => s.filterTag)
  const host = useRef<SVGSVGElement>(null)
  const v = useValues(params)

  useLayoutEffect(() => {
    // the grid, not mapRef: child layout effects run before the parent's ref is attached
    const grid = host.current?.parentElement
    if (!grid) return
    const measure = () => {
      const z = camera.getState().zoom
      const gr = grid.getBoundingClientRect()
      const out: typeof geo = {}
      grid.querySelectorAll<HTMLElement>('[data-card]').forEach((el) => {
        const r = el.getBoundingClientRect()
        out[el.dataset.card!] = { x: (r.left - gr.left) / z, y: (r.top - gr.top) / z, w: r.width / z, h: r.height / z }
      })
      setGeo(out)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [p, v.columnWidth, v.density, v.showTags, v.visibleLanes, v.curveHeight])

  const links: { opp: string; pain: string }[] = []
  for (const c of p.cards) if (c.lane === 'opps') for (const l of c.links ?? []) if (geo[c.id] && geo[l]) links.push({ opp: c.id, pain: l })
  const tagOf = new Map(p.cards.map((c) => [c.id, c.tags]))
  const gridEl = host.current?.parentElement
  const z = camera.getState().zoom
  const mapR = mapRef.current?.getBoundingClientRect()
  const gridR = gridEl?.getBoundingClientRect()
  const gOff = mapR && gridR ? { x: (gridR.left - mapR.left) / z, y: (gridR.top - mapR.top) / z } : { x: 0, y: 0 }

  return (
    <svg ref={host} className="pointer-events-none absolute inset-0 z-[1] overflow-visible" width="100%" height="100%" aria-hidden>
      {links.map(({ opp, pain }) => {
        const a = geo[pain], b = geo[opp]
        const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y
        const dy = Math.max(24, Math.abs(y2 - y1) / 2)
        const active = [opp, pain].includes(hover ?? '') || [opp, pain].includes(sel ?? '')
        const dim = !!filterTag && !(tagOf.get(opp)?.includes(filterTag) || tagOf.get(pain)?.includes(filterTag))
        const d = y2 > y1 ? `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}` : `M${x1},${y1} C${x1},${y1 + 60} ${x2},${y2 - 60} ${x2},${y2}`
        return (
          <g key={`${pain}-${opp}`} style={{ opacity: dim ? 0.15 : 1 }}>
            <path d={d} style={{ fill: 'none', stroke: active ? 'var(--signal)' : 'var(--ok)', strokeWidth: active ? 2 : 1.5, strokeDasharray: active ? undefined : '4 4', opacity: active ? 1 : 0.7 }} />
            <circle cx={x1} cy={y1} r={3} style={{ fill: active ? 'var(--signal)' : 'var(--rec)' }} />
            <circle cx={x2} cy={y2} r={3} style={{ fill: active ? 'var(--signal)' : 'var(--ok)' }} />
          </g>
        )
      })}
      {linkEnd && geo[linkEnd.from] && (() => {
        const a = geo[linkEnd.from]
        const x1 = a.x + a.w / 2, y1 = a.y + a.h
        const t = linkEnd.over && geo[linkEnd.over] ? { x: geo[linkEnd.over].x + geo[linkEnd.over].w / 2, y: geo[linkEnd.over].y } : { x: linkEnd.x - gOff.x, y: linkEnd.y - gOff.y }
        return <path d={`M${x1},${y1} C${x1},${y1 + 40} ${t.x},${t.y - 40} ${t.x},${t.y}`} style={{ fill: 'none', stroke: 'var(--signal)', strokeWidth: 2 }} />
      })()}
    </svg>
  )
}
