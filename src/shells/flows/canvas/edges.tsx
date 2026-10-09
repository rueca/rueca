/* Labelled connection: route (step / curve / straight), arrowhead defined
   inside the edge (so a DOM snapshot keeps it), trigger pill on the midpoint. */
import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath, type EdgeProps } from '@xyflow/react'
import { CornerDownLeft, CornerUpLeft, GitBranch, Hand, MoveHorizontal, Pointer, Timer, type LucideIcon } from 'lucide-react'
import { cn, useValues } from '@kit'
import { InlineText } from '../local/InlineText'
import type { FlowEdge, Trigger } from '../model'
import { params, select, updateEdgeData, useUI } from '../store'

export const TRIGGER_ICON: Record<Trigger, LucideIcon> = {
  tap: Pointer, swipe: MoveHorizontal, longpress: Hand, submit: CornerDownLeft, auto: Timer, condition: GitBranch, back: CornerUpLeft,
}

export const FlowEdgeView = memo(function FlowEdgeView(props: EdgeProps<FlowEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  const fallback = useValues(params, (v) => v.edgeStyle)
  const labels = useValues(params, (v) => v.edgeLabels)
  const dimOthers = useValues(params, (v) => v.dim)
  // primitive selector — an object here would re-render forever
  const w = useUI((s) => (s.walk === null ? 'off' : s.walkEdges[s.walk + 1] === id ? 'next' : s.walkEdges.slice(1, s.walk + 1).includes(id) ? 'done' : 'other'))
  const walk = w === 'off' ? null : { done: w === 'done', next: w === 'next' }
  const style = data?.style ?? fallback
  const [path, lx, ly] =
    style === 'bezier' ? getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
      : style === 'straight' ? getStraightPath({ sourceX, sourceY, targetX, targetY })
        : getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 14, offset: 24 })

  const onPath = !!walk && (walk.done || walk.next)
  const dim = !!walk && dimOthers && !onPath
  const pathCls = cn('flows-edge-path', onPath && 'on-path', walk?.next && 'is-live', dim && 'is-dim')
  const arrowCls = cn('flows-arrow', onPath && 'on-path', dim && 'is-dim')
  const Icon = TRIGGER_ICON[data?.trigger ?? 'tap']
  const showLabel = labels && (data?.label || data?.trigger === 'condition' || selected)

  return (
    <>
      <defs>
        <marker id={`fa-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 Z" className={arrowCls} strokeLinejoin="round" />
        </marker>
      </defs>
      <BaseEdge id={id} path={path} markerEnd={`url(#fa-${id})`} className={pathCls} interactionWidth={18} />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'flows-edge-label nodrag nopan absolute flex h-[22px] max-w-[180px] items-center gap-1 rounded-full px-2 text-[11px] font-medium transition-[opacity,box-shadow] duration-200',
              selected || onPath ? 'bg-accent-strong text-accent-fg' : 'bg-panel text-muted',
              dim && 'is-dim',
            )}
            style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, pointerEvents: 'all', boxShadow: selected || onPath ? 'none' : 'var(--shadow-cluster), 0 0 0 1px var(--line)' }}
            onClick={(e) => { e.stopPropagation(); select([], [id]) }}
          >
            <Icon size={11} strokeWidth={1.75} className="shrink-0 opacity-80" />
            <InlineText value={data?.label ?? ''} placeholder={data?.trigger === 'condition' ? 'If…' : 'Label'} onCommit={(label) => updateEdgeData(id, { label })} className="truncate" inputClassName="w-[110px]" title="Connection label" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

export const edgeTypes = { flow: FlowEdgeView }
