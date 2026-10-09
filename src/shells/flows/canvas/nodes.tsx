/* Flow node renderers. React Flow positions them; the kit tokens style them. */
import { memo, type CSSProperties, type ReactNode } from 'react'
import { Handle, NodeResizer, Position, useStore, type NodeProps } from '@xyflow/react'
import { MessageCircle } from 'lucide-react'
import { cn, useValues } from '@kit'
import { InlineText } from '../local/InlineText'
import { Wireframe } from '../wireframes'
import { STICKY, templateLabel, type FlowNode, type Status } from '../model'
import { params, updateNodeData, useUI, useFlow, setNodes, doc } from '../store'

export const STATUS: Record<Status, { label: string; dot: string; text: string }> = {
  draft: { label: 'Draft', dot: 'bg-faint', text: 'text-faint' },
  ready: { label: 'Ready', dot: 'bg-accent', text: 'text-accent' },
  shipped: { label: 'Shipped', dot: 'bg-ok', text: 'text-ok' },
}

export function StatusDot({ status = 'draft', className }: { status?: Status; className?: string }) {
  return <span aria-label={STATUS[status].label} className={cn('inline-block size-[7px] shrink-0 rounded-full', STATUS[status].dot, status === 'draft' && 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--fg-faint)]', className)} />
}

function Handles() {
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="source" position={Position.Left} id="l" />
    </>
  )
}

/** Walkthrough + selection state shared by every node. */
function useNodeState(id: string, selected: boolean) {
  const walkState = useUI((s) => (s.walk === null ? 'off' : s.walkNodes[s.walk] === id ? 'current' : s.walkNodes.slice(0, s.walk).includes(id) ? 'visited' : 'other'))
  const dim = useValues(params, (v) => v.dim) && walkState !== 'off' && walkState !== 'current'
  const ring: CSSProperties['boxShadow'] =
    walkState === 'current' ? 'var(--shadow-cluster), 0 0 0 2px var(--accent), 0 0 0 8px var(--accent-soft)'
      : selected ? 'var(--shadow-cluster), 0 0 0 2px var(--accent)'
        : 'var(--shadow-cluster), 0 0 0 1px var(--line)'
  return { walkState, dim, ring }
}

const rename = (id: string) => (name: string) => updateNodeData(id, { name })

function CommentBadge({ id }: { id: string }) {
  const n = useFlow().comments.filter((c) => c.node === id && !c.resolved).length
  if (!n) return null
  return <span className="flex items-center gap-0.5 text-[10.5px] text-faint tabular"><MessageCircle size={11} strokeWidth={1.5} />{n}</span>
}

export const ScreenNode = memo(function ScreenNode({ id, data, selected }: NodeProps<FlowNode>) {
  const thumbs = useValues(params, (v) => v.thumbnails)
  const { dim, ring } = useNodeState(id, !!selected)
  return (
    <div className={cn('flows-node w-[176px] rounded-[12px] bg-panel p-1.5 transition-[box-shadow,opacity] duration-200', dim && 'opacity-25')} style={{ boxShadow: ring }}>
      <div className="flex h-7 items-center gap-1.5 px-1.5">
        <StatusDot status={data.status} />
        <InlineText value={data.name} onCommit={rename(id)} className="min-w-0 flex-1 truncate text-[12px] font-medium text-fg" title="Screen name" />
        <CommentBadge id={id} />
      </div>
      {thumbs ? (
        <div className="overflow-hidden rounded-[8px] shadow-[0_0_0_1px_var(--line)]">
          <Wireframe template={data.template ?? 'empty'} className="block h-auto w-full" />
        </div>
      ) : (
        <div className="truncate px-1.5 pb-1 pl-[22px] text-[11px] text-faint">{templateLabel(data.template)}</div>
      )}
      <Handles />
    </div>
  )
})

export const DecisionNode = memo(function DecisionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim, walkState } = useNodeState(id, !!selected)
  const on = selected || walkState === 'current'
  return (
    <div className={cn('flows-node relative size-[136px] transition-opacity duration-200', dim && 'opacity-25')}>
      <svg viewBox="0 0 136 136" className="absolute inset-0 overflow-visible">
        {walkState === 'current' && <polygon points="68,-8 144,68 68,144 -8,68" className="fill-accent-soft" />}
        <polygon points="68,2 134,68 68,134 2,68" strokeLinejoin="round"
          style={{ fill: 'var(--panel)', stroke: on ? 'var(--accent)' : 'var(--line-strong)', strokeWidth: on ? 2 : 1, filter: 'drop-shadow(0 2px 6px rgb(0 0 0 / 0.18))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-7 text-center">
        <StatusDot status={data.status} />
        <InlineText value={data.name} onCommit={rename(id)} className="line-clamp-3 w-full text-center text-[11.5px] leading-snug font-medium text-fg" title="Condition" />
      </div>
      <Handles />
    </div>
  )
})

export const TerminalNode = memo(function TerminalNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim, ring } = useNodeState(id, !!selected)
  const end = data.role === 'end'
  return (
    <div className={cn('flows-node flex h-10 w-[152px] items-center gap-2 rounded-full bg-panel pr-4 pl-3 transition-[box-shadow,opacity] duration-200', dim && 'opacity-25')} style={{ boxShadow: ring }}>
      {end ? <span className="flex size-4 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_var(--fg-muted)]"><span className="size-2 rounded-full bg-fg" /></span>
        : <span className="size-4 shrink-0 rounded-full bg-ok shadow-[0_0_0_3px_color-mix(in_srgb,var(--ok)_25%,transparent)]" />}
      <InlineText value={data.name} onCommit={rename(id)} className="min-w-0 flex-1 truncate text-[12px] font-medium text-fg" title={end ? 'End' : 'Start'} />
      <Handles />
    </div>
  )
})

export const NoteNode = memo(function NoteNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim } = useNodeState(id, !!selected)
  const bg = STICKY[data.color ?? 'yellow']
  return (
    <div className={cn('flows-node flex min-h-[120px] w-[176px] flex-col rounded-[4px] p-3 text-[12.5px] leading-snug transition-opacity duration-200', dim && 'opacity-25')}
      style={{ background: bg, color: '#1d1d1f', boxShadow: selected ? `0 0 0 2px var(--accent), 0 6px 16px -6px rgb(0 0 0 / .35)` : '0 1px 1px rgb(0 0 0 / .08), 0 6px 16px -6px rgb(0 0 0 / .35)' }}>
      <InlineText value={data.name} multiline onCommit={rename(id)} className="block w-full flex-1 whitespace-pre-wrap" placeholder="Add a note" title="Sticky note" />
      <div className="mt-2 text-[10.5px] opacity-55">{data.attach ? 'Annotation' : 'Sticky'}</div>
    </div>
  )
})

export const SectionNode = memo(function SectionNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const hue = data.hue ?? '#0d99ff'
  const walking = useUI((s) => s.walk !== null)
  const dim = useValues(params, (v) => v.dim) && walking
  // keep the title legible when zoomed out (FigJam does the same)
  const titleScale = useStore((st) => Math.min(2.4, Math.max(1, 1 / st.transform[2])))
  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={240} minHeight={160} onResizeEnd={() => doc.commit('Resize section')} />
      <div className={cn('relative rounded-[18px] transition-opacity duration-200', dim && 'opacity-40')}
        style={{
          width: width ?? 800, height: height ?? 480,
          background: `color-mix(in srgb, ${hue} 7%, transparent)`,
          boxShadow: `inset 0 0 0 ${selected ? 2 : 1}px ${selected ? 'var(--accent)' : `color-mix(in srgb, ${hue} 32%, transparent)`}`,
        }}>
        <div className="flows-section-tab absolute top-3 left-3 flex h-7 max-w-[calc(100%-24px)] origin-top-left cursor-grab items-center gap-2 rounded-[8px] px-2.5 text-[12.5px] font-semibold text-white" style={{ background: hue, transform: `scale(${titleScale})` }}>
          <InlineText value={data.name} onCommit={rename(id)} className="truncate" inputClassName="min-w-[120px]" title="Section name" />
        </div>
      </div>
    </>
  )
})

export const nodeTypes = { screen: ScreenNode, decision: DecisionNode, terminal: TerminalNode, note: NoteNode, section: SectionNode }

/** Library tile used in the left panel and the drag ghost. */
export function ShapeGlyph({ kind, children }: { kind: 'decision' | 'start' | 'end' | 'note' | 'section'; children?: ReactNode }) {
  if (kind === 'decision') return <svg viewBox="0 0 24 24" width="22" height="22"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  if (kind === 'start') return <span className="flex h-3.5 w-6 items-center rounded-full pl-0.5 shadow-[inset_0_0_0_1.5px_currentColor]"><span className="size-2 rounded-full bg-ok" /></span>
  if (kind === 'end') return <span className="flex h-3.5 w-6 items-center justify-end rounded-full pr-0.5 shadow-[inset_0_0_0_1.5px_currentColor]"><span className="size-2 rounded-full bg-current" /></span>
  if (kind === 'note') return <span className="size-5 rounded-[2px]" style={{ background: STICKY.yellow }} />
  return <span className="h-4 w-6 rounded-[4px] border border-dashed border-current">{children}</span>
}

/** Expose a helper for the section drag: members move with their section. */
export const moveSectionMembers = (sectionId: string, dx: number, dy: number) =>
  setNodes((ns) => ns.map((n) => (n.data.section === sectionId ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n)), { commit: false })
