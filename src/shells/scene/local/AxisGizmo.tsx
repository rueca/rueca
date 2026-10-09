/* ---------------------------------------------------------------------------
   AxisGizmo — the orientation widget in the corner of every 3D viewport
   (Blender's navigation gizmo, Spline's view helper, three's ViewHelper),
   rebuilt as renderer-agnostic SVG so it sits in the chrome, not the scene.

     <AxisGizmo subscribe={engine.onCamera} onSnap={(axis) => engine.snapAxis(axis)} />

   `subscribe` hands it the camera's view matrix (column-major 4×4, i.e.
   three's camera.matrixWorldInverse.elements) whenever the camera moves; it
   projects the six axis tips and draws them back-to-front. Click a tip to
   look down that axis. Every tip is a real button (Tab + Enter), so the
   snap is reachable without a pointer (WCAG 2.5.7).

   Axis colours are the same X/Y/Z hues the kit's Vec3Fields use.
--------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { cn } from '@kit'

export type AxisId = '+x' | '-x' | '+y' | '-y' | '+z' | '-z'

const AXES: { id: AxisId; v: [number, number, number]; color: string; label: string; name: string }[] = [
  { id: '+x', v: [1, 0, 0], color: '#ff6b6b', label: 'X', name: 'Right' },
  { id: '-x', v: [-1, 0, 0], color: '#ff6b6b', label: '', name: 'Left' },
  { id: '+y', v: [0, 1, 0], color: '#5fd37a', label: 'Y', name: 'Top' },
  { id: '-y', v: [0, -1, 0], color: '#5fd37a', label: '', name: 'Bottom' },
  { id: '+z', v: [0, 0, 1], color: '#5aa8ff', label: 'Z', name: 'Front' },
  { id: '-z', v: [0, 0, -1], color: '#5aa8ff', label: '', name: 'Back' },
]

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

export function AxisGizmo({
  subscribe, onSnap, size = 88, className,
}: {
  subscribe: (fn: (viewMatrix: ArrayLike<number>) => void) => () => void
  onSnap: (axis: AxisId) => void
  size?: number
  className?: string
}) {
  const [m, setM] = useState<ArrayLike<number>>(IDENTITY)
  const [hover, setHover] = useState<AxisId | null>(null)
  useEffect(() => subscribe((e) => setM(Array.from(e))), [subscribe])

  const c = size / 2
  const r = size / 2 - 13
  const tips = AXES.map((a) => {
    const [x, y, z] = a.v
    const vx = m[0] * x + m[4] * y + m[8] * z
    const vy = m[1] * x + m[5] * y + m[9] * z
    const vz = m[2] * x + m[6] * y + m[10] * z
    return { ...a, sx: c + vx * r, sy: c - vy * r, depth: vz }
  }).sort((a, b) => a.depth - b.depth)

  return (
    <div className={cn('group/gizmo relative', className)} style={{ width: size, height: size }} role="group" aria-label="View axes">
      <svg width={size} height={size} className="overflow-visible">
        <circle cx={c} cy={c} r={c - 2} className="fill-transparent transition-colors group-hover/gizmo:fill-[var(--hover)]" />
        {tips.map((t) => {
          const pos = t.id[0] === '+'
          const on = hover === t.id
          return (
            <g key={t.id} opacity={0.55 + 0.45 * Math.max(0, (t.depth + 1) / 2)}>
              {pos && <line x1={c} y1={c} x2={t.sx} y2={t.sy} stroke={t.color} strokeWidth={2} strokeLinecap="round" />}
              <circle
                cx={t.sx} cy={t.sy} r={pos ? 8.5 : 6}
                fill={pos ? t.color : 'var(--panel)'}
                stroke={t.color}
                strokeWidth={pos ? 0 : 1.5}
                className="transition-[r]"
                style={on ? { filter: 'brightness(1.25)' } : undefined}
              />
              {pos && (
                <text x={t.sx} y={t.sy + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0b0b0b" className="pointer-events-none select-none">
                  {t.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {/* Hit targets: real buttons over each tip, in paint order. */}
      {tips.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-label={`View from ${t.name.toLowerCase()} (${t.id.toUpperCase()})`}
          title={`${t.name} view`}
          onPointerEnter={() => setHover(t.id)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(t.id)}
          onBlur={() => setHover(null)}
          onClick={() => onSnap(t.id)}
          className="absolute size-5 -translate-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-signal"
          style={{ left: t.sx, top: t.sy }}
        />
      ))}
    </div>
  )
}
