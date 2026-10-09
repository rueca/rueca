/* The emotion lane: one point per stage on a −2…+2 scale, joined by a smooth
   curve. Drag a point (snaps to 0.5, ⌥ for free), or focus it and use ↑ ↓. */
import { useRef } from 'react'
import { cn, useValues } from '@kit'
import { smoothArea, smoothPath } from '../local/smooth'
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
        <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x1="0" y1={PAD} x2="0" y2={H - PAD}>
          <stop offset="0" style={{ stopColor: 'var(--ok)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--fg-faint)' }} />
          <stop offset="1" style={{ stopColor: 'var(--rec)' }} />
        </linearGradient>
        <clipPath id={`${id}-above`}><rect x="0" y="0" width={W} height={zero} /></clipPath>
        <clipPath id={`${id}-below`}><rect x="0" y={zero} width={W} height={H - zero} /></clipPath>
      </defs>
      {/* scale */}
      {[2, 1, 0, -1, -2].map((val) => (
        <line key={val} x1="0" x2={W} y1={y(val)} y2={y(val)} style={{ stroke: val === 0 ? 'var(--line-strong)' : 'var(--line)', strokeDasharray: val === 0 ? undefined : '2 4' }} />
      ))}
      {v.fill && (
        <>
          <path d={area} clipPath={`url(#${id}-above)`} style={{ fill: 'var(--ok)', opacity: 0.16 }} />
          <path d={area} clipPath={`url(#${id}-below)`} style={{ fill: 'var(--rec)', opacity: 0.16 }} />
        </>
      )}
      <path d={line} style={{ fill: 'none', stroke: `url(#${id}-stroke)`, strokeWidth: 2.5, strokeLinecap: 'round' }} />
      {stages.map((s, i) => {
        const p = pts[i]
        const on = sel === s.id
        const tone = s.emotion > 0.25 ? 'var(--ok)' : s.emotion < -0.25 ? 'var(--rec)' : 'var(--fg-muted)'
        const below = s.emotion >= 0
        return (
          <g key={s.id}>
            {v.emoji && <text x={p.x} y={below ? p.y + 30 : p.y - 18} textAnchor="middle" style={{ fontSize: 17 }} aria-hidden>{emoji(s.emotion)}</text>}
            {s.feeling && (
              <text x={p.x} y={below ? p.y + (v.emoji ? 48 : 26) : p.y - (v.emoji ? 40 : 16)} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--fg-muted)', fontWeight: 500 }}>
                {s.feeling} <tspan style={{ fill: 'var(--fg-faint)' }}>{fmtEmotion(s.emotion)}</tspan>
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
              style={{ fill: 'var(--panel)', stroke: on ? 'var(--accent)' : tone, strokeWidth: 2.5 }}
            />
          </g>
        )
      })}
    </svg>
  )
}
