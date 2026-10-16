/* ---------------------------------------------------------------------------
   StateMachinePanel — Rive's state machine, miniaturised: a read-only graph
   (Entry, Any state, one node per animation, arrows per transition, the live
   state lit), the Inputs list (Trigger · Boolean · Number) that drive it, and
   the transitions with their mix time.

     <StateMachinePanel states={[{ id, name }]} entry="idle" current={live}
       inputs={[{ id, name, type, value }]} onInput={…} onFire={…}
       transitions={[{ id, from, to, label, mix }]} onMix={…} />

   Inputs are the contract between a prototype and its host: the same list a
   developer wires up in code. Every input works without the graph.
--------------------------------------------------------------------------- */
import { Hash, ToggleLeft, Zap } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { cn, Button, ScrubValue, Switch, Tip } from '@kit'

export interface SMState { id: string; name: string }
export interface SMInputView { id: string; name: string; type: 'trigger' | 'boolean' | 'number'; value: boolean | number }
export interface SMTransitionView { id: string; from: string; to: string; label: string; mix: number }

const ICON = { trigger: Zap, boolean: ToggleLeft, number: Hash }
const NH = 24, GAP = 18, FONT = 10.5

/* The graph draws at 1:1 in its panel: the viewBox is the measured width, so labels render at their real size
   (a fixed 278-wide viewBox in a ~208px sidebar scaled them to ~7.9px). Columns spread over whatever width there is. */
function useWidth<T extends Element>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function StateMachineGraph({ states, entry, current, transitions, lastTransition, onSelect }: {
  states: SMState[]; entry: string; current?: string | null; transitions: SMTransitionView[]; lastTransition?: string | null; onSelect?: (id: string) => void
}) {
  const [ref, measured] = useWidth<HTMLDivElement>()
  const rest = states.filter((s) => s.id !== entry)
  const cols = 2 + Math.max(1, Math.ceil(rest.length / 3))
  const avail = measured || 256
  const NW = Math.max(56, Math.min(72, Math.floor((avail - 8 - GAP * (cols - 1)) / cols)))
  const W = Math.max(avail, 8 + cols * NW + GAP * (cols - 1))
  const step = (W - 8 - NW) / (cols - 1)
  const colX = (c: number) => 4 + c * step
  const MID = 80, ROW = 50, H = MID + ROW + NH + 6
  // Any state sits above the entry state: its arrows fan out right without crossing the entry node
  const pos: Record<string, { x: number; y: number }> = { __entry: { x: colX(0), y: MID }, any: { x: colX(1), y: 6 } }
  pos[entry] = { x: colX(1), y: MID }
  rest.forEach((s, i) => {
    const col = Math.floor(i / 3), row = i % 3, n = Math.min(3, rest.length - col * 3)
    pos[s.id] = { x: colX(2 + col), y: MID + (row - (n - 1) / 2) * ROW }
  })
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }, off = 0) => {
    const ax = a.x + NW / 2, ay = a.y + NH / 2, bx = b.x + NW / 2, by = b.y + NH / 2
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1
    const nx = -dy / len * off, ny = dx / len * off
    // clip to the node rectangles
    const clip = (cx: number, cy: number, sx: number, sy: number) => {
      const tx = Math.abs(sx) > 1e-6 ? (NW / 2 + 3) / Math.abs(sx) : Infinity
      const ty = Math.abs(sy) > 1e-6 ? (NH / 2 + 3) / Math.abs(sy) : Infinity
      const t = Math.min(tx, ty)
      return [cx + sx * t, cy + sy * t]
    }
    const [x1, y1] = clip(ax + nx, ay + ny, dx / len, dy / len)
    const [x2, y2] = clip(bx + nx, by + ny, -dx / len, -dy / len)
    return { x1, y1, x2, y2 }
  }
  const pairs = new Set(transitions.map((t) => `${t.from}>${t.to}`))
  return (
    <div ref={ref} className="w-full">
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="State machine graph">
      <defs>
        <marker id="sm-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--fg-faint)" />
        </marker>
        <marker id="sm-arrow-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--signal)" />
        </marker>
      </defs>
      {(() => { const e = edge(pos.__entry, pos[entry]); return <line {...e} stroke="var(--fg-faint)" strokeWidth={1.25} markerEnd="url(#sm-arrow)" /> })()}
      {transitions.map((t) => {
        const a = pos[t.from], b = pos[t.to]
        if (!a || !b) return null
        const both = pairs.has(`${t.to}>${t.from}`)
        const e = edge(a, b, both ? 5 : 0)
        const on = lastTransition === t.id
        // bidirectional pairs bow apart so both arrows stay readable
        const mx = (e.x1 + e.x2) / 2, my = (e.y1 + e.y2) / 2, len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1
        const bow = both ? 8 : 0
        const cx = mx + (-(e.y2 - e.y1) / len) * bow, cy = my + ((e.x2 - e.x1) / len) * bow
        return <path key={t.id} d={`M${e.x1},${e.y1} Q${cx},${cy} ${e.x2},${e.y2}`} fill="none" stroke={on ? 'var(--signal)' : 'var(--fg-faint)'} strokeWidth={on ? 2 : 1.25} markerEnd={on ? 'url(#sm-arrow-on)' : 'url(#sm-arrow)'} className="transition-[stroke] duration-300" />
      })}
      {[{ id: '__entry', name: 'Entry' }, { id: 'any', name: 'Any state' }, ...states].map((s) => {
        const p = pos[s.id]
        const live = current === s.id
        const special = s.id === '__entry' || s.id === 'any'
        return (
          <g key={s.id} transform={`translate(${p.x},${p.y})`} onClick={() => !special && onSelect?.(s.id)} className={cn(!special && 'cursor-pointer')}>
            <rect width={NW} height={NH} rx={5}
              fill={live ? 'var(--signal-strong)' : special ? 'var(--well)' : 'var(--control)'}
              stroke={live ? 'var(--signal)' : 'var(--line-strong)'} strokeWidth={1} className="transition-[fill] duration-200" />
            <text x={NW / 2} y={NH / 2 + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={FONT} fontWeight={500}
              fill={live ? 'var(--signal-fg)' : special ? 'var(--fg-faint)' : 'var(--fg)'}>{s.name}</text>
          </g>
        )
      })}
    </svg>
    </div>
  )
}

export function InputsList({ inputs, onInput, onFire, fired }: { inputs: SMInputView[]; onInput: (id: string, v: boolean | number, final: boolean) => void; onFire: (id: string) => void; fired?: string | null }) {
  return (
    <div className="flex flex-col">
      {inputs.map((i) => {
        const Icon = ICON[i.type]
        return (
          <div key={i.id} className="flex h-row items-center gap-2 px-pad">
            <Tip label={i.type === 'trigger' ? 'Trigger — fires once' : i.type === 'boolean' ? 'Boolean — on or off' : 'Number'} side="left">
              <span className={cn('flex size-icon-sm shrink-0 items-center justify-center rounded-control bg-hover', fired === i.id ? 'text-key' : 'text-fg-muted')}><Icon size={12} strokeWidth={1.75} /></span>
            </Tip>
            <span className="min-w-0 flex-1 truncate font-mono text-ui text-fg">{i.name}</span>
            {i.type === 'trigger' && <Button size="sm" variant="default" onClick={() => onFire(i.id)}>Fire</Button>}
            {i.type === 'boolean' && <Switch size="sm" checked={!!i.value} onChange={(b) => onInput(i.id, b, true)} label={i.name} />}
            {i.type === 'number' && <ScrubValue boxed value={Number(i.value)} step={1} className="w-[64px]" label={i.name} onChange={(v, f) => onInput(i.id, v, f)} />}
          </div>
        )
      })}
    </div>
  )
}

export function TransitionsList({ transitions, names, onMix }: { transitions: SMTransitionView[]; names: Record<string, string>; onMix?: (id: string, ms: number, final: boolean) => void }) {
  return (
    <div className="flex flex-col">
      {transitions.map((t) => (
        <div key={t.id} className="flex min-h-row items-center gap-2 px-pad py-0.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-ui text-fg">{names[t.from] ?? t.from} <span className="text-fg-faint">→</span> {names[t.to] ?? t.to}</div>
            <div className="truncate font-mono text-ui-sm text-fg-faint">{t.label}</div>
          </div>
          <Tip label="Mix — how long the two animations blend" side="left">
            <span className="inline-flex"><ScrubValue boxed value={t.mix} min={0} max={2000} step={10} unit="ms" className="w-[60px]" label="Mix" onChange={(v, f) => onMix?.(t.id, v, f)} /></span>
          </Tip>
        </div>
      ))}
    </div>
  )
}
