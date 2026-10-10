/* The emotion lane: one point per stage on a −2…+2 scale, joined by a smooth
   curve. Drag a point (snaps to 0.5, ⌥ for free), or focus it and use ↑ ↓.
   Wire style (src/demo/wire.ts): the curve is one ink; above zero is a light
   wash, below zero is hatched, points are filled (good) or hollow (bad), and
   the low point gets a red-pen note. Emoji are shown in greyscale. */
import { useRef } from 'react'
import { cn, useValues } from '@kit'
import { smoothArea, smoothPath } from '@kit/core/geometry'
import { WIRE } from '@/demo/wire'
import { emoji, fmtEmotion, type Stage } from '../model'
import { params, ui, updateStage, doc, useUI } from '../store'

const PAD = 22

export function EmotionLane({ stages, colW }: { stages: Stage[]; colW: number }) {
  const v = useValues(params)
  const H = v.curveHeight
  const W = stages.length * colW
  const svg = useRef<SVGSVGElement>(null)
  const sel = useUI((s) => (s.sel?.kind === 'stage' ? s.sel.id : null))
  const y = (val: number) => PAD + ((2 - val) / 4) * (H - PAD * 2)
  const zero = y(0)
  const pts = stages.map((s, i) => ({ x: i * colW + colW / 2, y: y(s.emotion) }))
  const opts = { smoothing: v.smoothing, clampY: [PAD, H - PAD] as [number, number] }
  const line = smoothPath(pts, opts)
  const area = smoothArea(pts, zero, opts)
  const id = 'jm-emo'

  const valueAt = (clientY: number, free: boolean) => {
    const r = svg.current!.getBoundingClientRect()
    const local = ((clientY - r.top) / r.height) * H
    const raw = 2 - ((local - PAD) / (H - PAD * 2)) * 4
    const step = free ? 0.1 : 0.5
    return Math.max(-2, Math.min(2, Math.round(raw / step) * step))
  }

  const onDown = (e: React.PointerEvent, s: Stage) => {
    e.stopPropagation()
    e.preventDefault()
    ui.setState({ sel: { kind: 'stage', id: s.id }, editing: null })
    const el = e.currentTarget as Element
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => updateStage(s.id, { emotion: +valueAt(ev.clientY, ev.altKey).toFixed(1) }, { commit: false })
    const up = () => { el.removeEventListener('pointermove', move as EventListener); el.removeEventListener('pointerup', up); doc.commit('Emotion') }
    el.addEventListener('pointermove', move as EventListener)
    el.addEventListener('pointerup', up)
  }

  return (
    <svg ref={svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible" role="group" aria-label="Emotion curve">
      <defs>
        <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: WIRE.ink, strokeWidth: 1, opacity: 0.32 }} />
        </pattern>
        <clipPath id={`${id}-above`}><rect x="0" y="0" width={W} height={zero} /></clipPath>
        <clipPath id={`${id}-below`}><rect x="0" y={zero} width={W} height={H - zero} /></clipPath>
      </defs>
      {/* scale */}
      {[2, 1, 0, -1, -2].map((val) => (
        <line key={val} x1="0" x2={W} y1={y(val)} y2={y(val)} style={{ stroke: val === 0 ? WIRE.faint : WIRE.line, strokeDasharray: val === 0 ? undefined : '2 4' }} />
      ))}
      {v.fill && (
        <>
          <path d={area} clipPath={`url(#${id}-above)`} style={{ fill: WIRE.ink, opacity: 0.06 }} />
          <path d={area} clipPath={`url(#${id}-below)`} style={{ fill: `url(#${id}-hatch)` }} />
        </>
      )}
      <path d={line} style={{ fill: 'none', stroke: WIRE.ink, strokeWidth: 2, strokeLinecap: 'round' }} />
      {lowNote(stages, pts, H)}
      {stages.map((s, i) => {
        const p = pts[i]
        const on = sel === s.id
        // good = filled ink, bad = hollow ink ring, neutral = hollow muted ring
        const good = s.emotion > 0.25, tone = s.emotion < -0.25 || good ? WIRE.ink : WIRE.muted
        const below = s.emotion >= 0
        return (
          <g key={s.id}>
            {v.emoji && <text x={p.x} y={below ? p.y + 30 : p.y - 18} textAnchor="middle" style={{ fontSize: 17, filter: 'grayscale(1)' }} aria-hidden>{emoji(s.emotion)}</text>}
            {s.feeling && (
              <text x={p.x} y={below ? p.y + (v.emoji ? 48 : 26) : p.y - (v.emoji ? 40 : 16)} textAnchor="middle" style={{ fontSize: 11, fill: WIRE.ink, fontWeight: 500 }}>
                {s.feeling} <tspan style={{ fill: WIRE.muted }}>{fmtEmotion(s.emotion)}</tspan>
              </text>
            )}
            <circle
              cx={p.x} cy={p.y} r={on ? 8 : 7}
              tabIndex={0} role="slider" aria-label={`${s.name} emotion`} aria-valuemin={-2} aria-valuemax={2} aria-valuenow={s.emotion} aria-valuetext={`${fmtEmotion(s.emotion)} ${s.feeling}`}
              onPointerDown={(e) => onDown(e, s)}
              onKeyDown={(e) => {
                const d = e.key === 'ArrowUp' ? 0.5 : e.key === 'ArrowDown' ? -0.5 : 0
                if (!d) return
                e.preventDefault(); e.stopPropagation()
                updateStage(s.id, { emotion: Math.max(-2, Math.min(2, s.emotion + d)) }, { label: 'Emotion' })
              }}
              className={cn('cursor-ns-resize outline-none transition-[r] duration-100 hover:[r:9] focus-visible:[stroke-width:3]')}
              style={{ fill: good ? WIRE.ink : WIRE.paper, stroke: on ? 'var(--signal)' : tone, strokeWidth: 2 }}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Red pen: circle the lowest point and say so, in mono, beside it. Annotation only. */
function lowNote(stages: Stage[], pts: { x: number; y: number }[], H: number) {
  if (stages.length < 2) return null
  let i = 0
  stages.forEach((s, k) => { if (s.emotion < stages[i].emotion) i = k })
  if (stages[i].emotion >= 0) return null
  const p = pts[i]
  const right = i < stages.length - 1 // write towards the open side
  const tx = right ? p.x + 22 : p.x - 22
  const ty = Math.min(H - 8, p.y + 4)
  return (
    <g aria-hidden style={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
      <circle cx={p.x} cy={p.y} r={11.5} style={{ fill: 'none', stroke: WIRE.pen, strokeWidth: 1, strokeDasharray: '3 2.5' }} />
      <circle cx={tx + (right ? 6 : -6)} cy={ty - 3.5} r={6} style={{ fill: 'none', stroke: WIRE.pen, strokeWidth: 1 }} />
      <text x={tx + (right ? 6 : -6)} y={ty - 0.5} textAnchor="middle" style={{ fontSize: 8, fill: WIRE.pen }}>1</text>
      <text x={tx + (right ? 16 : -16)} y={ty} textAnchor={right ? 'start' : 'end'} style={{ fontSize: 10, fill: WIRE.pen }}>low point · fix first</text>
    </g>
  )
}
