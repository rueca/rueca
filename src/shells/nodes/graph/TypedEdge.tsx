/* Wires coloured by the type they carry (Blender), accent when selected. */
import { BaseEdge, getBezierPath, getSmoothStepPath, getStraightPath, type ConnectionLineComponentProps, type EdgeProps } from '@xyflow/react'
import { useValues } from '@kit'
import { portOf } from '../engine/spec'
import { doc } from './doc'
import type { GEdge, GNode } from './store'

function pathFor(style: string, a: { sourceX: number; sourceY: number; targetX: number; targetY: number; sourcePosition: any; targetPosition: any }) {
  if (style === 'straight') return getStraightPath(a)[0]
  if (style === 'step') return getSmoothStepPath({ ...a, borderRadius: 10 })[0]
  return getBezierPath({ ...a, curvature: 0.4 })[0]
}

export function TypedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data }: EdgeProps<GEdge>) {
  const style = useValues(doc, (v) => v.wires)
  const path = pathFor(style, { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <BaseEdge
      id={id}
      path={path}
      interactionWidth={18}
      style={{ stroke: selected ? 'var(--signal)' : `var(--port-${data?.ptype ?? 'image'})`, strokeWidth: selected ? 2.25 : 1.75, strokeOpacity: selected ? 1 : 0.8 }}
    />
  )
}

export function TypedConnectionLine({ fromX, fromY, toX, toY, fromPosition, toPosition, fromHandle, fromNode, connectionStatus }: ConnectionLineComponentProps<GNode>) {
  const style = useValues(doc, (v) => v.wires)
  const kind = (fromNode.data as GNode['data']).kind
  const t = portOf(kind, fromHandle.id, fromHandle.type === 'source' ? 'out' : 'in')?.type ?? 'image'
  const path = pathFor(style, { sourceX: fromX, sourceY: fromY, targetX: toX, targetY: toY, sourcePosition: fromPosition, targetPosition: toPosition })
  return (
    <g>
      <path d={path} fill="none" stroke={`var(--port-${t})`} strokeWidth={2} strokeDasharray={connectionStatus === 'valid' ? undefined : '5 4'} strokeLinecap="round" />
      <circle cx={toX} cy={toY} r={3.5} fill={`var(--port-${t})`} />
    </g>
  )
}
