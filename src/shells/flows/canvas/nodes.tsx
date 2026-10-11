/* Flow node renderers. React Flow positions them. The nodes are the demo
   document, so they are drawn in the wire palette (one ink on paper, hairlines,
   pink only for red-pen annotations) in both themes; selection and the
   walkthrough keep the kit's signal colour, because that is the tool talking. */
import { memo, type CSSProperties, type ReactNode } from 'react'
import { Handle, NodeResizer, Position, useStore, type NodeProps } from '@xyflow/react'
import { MessageCircle } from 'lucide-react'
import { cn, useValues } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { Wireframe } from '../wireframes'
import { WIRE } from '@/demo/wire'
import { STICKY, stickyOf, templateLabel, type FlowNode, type Status } from '../model'
import { params, updateNodeData, useUI, useFlow, doc } from '../store'

export const STATUS: Record<Status, { label: string; dot: string; text: string }> = {
  draft: { label: 'Draft', dot: 'bg-fg-faint', text: 'text-fg-faint' },
  ready: { label: 'Ready', dot: 'bg-signal', text: 'text-signal' },
  shipped: { label: 'Shipped', dot: 'bg-ok', text: 'text-ok' },
}

/** Status by shape as well as colour (WCAG 1.4.1): draft hollow · ready half-filled · shipped full. */
export function StatusDot({ status = 'draft', className, decorative }: { status?: Status; className?: string; /** next to a visible label: hide from AT */ decorative?: boolean }) {
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `Status: ${STATUS[status].label}`, title: STATUS[status].label }
  return <span {...a11y} className={cn('inline-block size-[7px] shrink-0 rounded-full', STATUS[status].dot,
    status === 'draft' && 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--fg-faint)]',
    status === 'ready' && 'bg-[conic-gradient(var(--signal)_0_50%,transparent_0)] shadow-[inset_0_0_0_1.5px_var(--signal)]', className)} />
}

/** The same status-by-shape dot, in ink, for nodes drawn on paper. */
function WireDot({ status = 'draft' }: { status?: Status }) {
  const ink = status === 'draft' ? WIRE.muted : WIRE.ink
  return <span role="img" aria-label={`Status: ${STATUS[status].label}`} title={STATUS[status].label} className="inline-block size-[7px] shrink-0 rounded-full"
    style={{ boxShadow: `inset 0 0 0 1.5px ${ink}`, background: status === 'shipped' ? ink : status === 'ready' ? `conic-gradient(${ink} 0 50%, transparent 0)` : 'transparent' }} />
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
  // hairlines, not shadows
  const ring: CSSProperties['boxShadow'] =
    walkState === 'current' ? '0 0 0 2px var(--signal), 0 0 0 8px var(--signal-soft)'
      : selected ? '0 0 0 2px var(--signal)'
        : `0 0 0 1px ${WIRE.line}`
  return { walkState, dim, ring }
}

const rename = (id: string) => (name: string) => updateNodeData(id, { name })

function CommentBadge({ id }: { id: string }) {
  const n = useFlow().comments.filter((c) => c.node === id && !c.resolved).length
  if (!n) return null
  return <span className="flex items-center gap-0.5 text-[10.5px] tabular" style={{ color: WIRE.muted }}><MessageCircle size={11} strokeWidth={1.5} />{n}</span>
}

export const ScreenNode = memo(function ScreenNode({ id, data, selected }: NodeProps<FlowNode>) {
  const thumbs = useValues(params, (v) => v.thumbnails)
  const { dim, ring } = useNodeState(id, !!selected)
  return (
    <div className={cn('flows-node studio-node w-[176px] rounded-[12px] p-1.5 transition-[box-shadow,opacity] duration-200', dim && 'opacity-25')} style={{ boxShadow: ring, background: WIRE.card, color: WIRE.ink }}>
      <div className="flex h-7 items-center gap-1.5 px-1.5">
        <WireDot status={data.status} />
        <InlineText bare focusable={false} value={data.name} onCommit={rename(id)} className="min-w-0 flex-1 truncate text-[12px] font-medium" label="Screen name" />
        <CommentBadge id={id} />
      </div>
      {thumbs ? (
        <div className="overflow-hidden rounded-[8px]" style={{ boxShadow: `0 0 0 1px ${WIRE.line}` }}>
          <Wireframe template={data.template ?? 'empty'} className="block h-auto w-full" />
        </div>
      ) : (
        <div className="truncate px-1.5 pb-1 pl-[22px] text-[11px]" style={{ color: WIRE.muted }}>{templateLabel(data.template)}</div>
      )}
      <Handles />
    </div>
  )
})

export const DecisionNode = memo(function DecisionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim, walkState } = useNodeState(id, !!selected)
  const on = selected || walkState === 'current'
  return (
    <div className={cn('flows-node studio-node relative size-[136px] transition-opacity duration-200', dim && 'opacity-25')}>
      <svg viewBox="0 0 136 136" className="absolute inset-0 overflow-visible">
        {walkState === 'current' && <polygon points="68,-8 144,68 68,144 -8,68" className="fill-signal-soft" />}
        <polygon points="68,2 134,68 68,134 2,68" strokeLinejoin="round"
          style={{ fill: WIRE.card, stroke: on ? 'var(--signal)' : WIRE.ink, strokeWidth: on ? 2 : 1 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-8 text-center" style={{ color: WIRE.ink }}>
        <WireDot status={data.status} />
        {/* the label sits on the diamond's card fill; the same fill behind the text (inset to stay inside the diamond) makes that measurable */}
        <div className="w-full" style={{ background: WIRE.card }}>
          <InlineText bare focusable={false} value={data.name} onCommit={rename(id)} className="line-clamp-3 w-full text-center text-[11.5px] leading-snug font-medium" label="Condition" />
        </div>
      </div>
      <Handles />
    </div>
  )
})

export const TerminalNode = memo(function TerminalNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim, ring } = useNodeState(id, !!selected)
  const end = data.role === 'end'
  return (
    <div className={cn('flows-node studio-node flex h-10 w-[152px] items-center gap-2 rounded-full pr-4 pl-3 transition-[box-shadow,opacity] duration-200', dim && 'opacity-25')} style={{ boxShadow: ring, background: WIRE.card, color: WIRE.ink }}>
      {/* start = solid ink disc, end = ring with a dot (shape, not colour) */}
      {end ? <span className="flex size-4 shrink-0 items-center justify-center rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${WIRE.ink}` }}><span className="size-2 rounded-full" style={{ background: WIRE.ink }} /></span>
        : <span className="size-4 shrink-0 rounded-full" style={{ background: WIRE.ink }} />}
      <InlineText bare focusable={false} value={data.name} onCommit={rename(id)} className="min-w-0 flex-1 truncate text-[12px] font-medium" label={end ? 'End' : 'Start'} />
      <Handles />
    </div>
  )
})

/** Notes. `pen` is the red pen (mono, numbered, pink hairline); card / sheet are plain paper stickies. */
export const NoteNode = memo(function NoteNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { dim } = useNodeState(id, !!selected)
  const tone = stickyOf(data.color)
  const pen = tone === 'pen'
  // red-pen notes are numbered in reading order, like margin notes
  const num = useFlow().nodes.filter((n) => n.type === 'note' && stickyOf(n.data.color) === 'pen').findIndex((n) => n.id === id) + 1
  const ink = pen ? WIRE.pen : WIRE.ink
  return (
    <div className={cn('flows-node studio-node flex min-h-[120px] w-[176px] flex-col rounded-[4px] p-3 leading-snug transition-opacity duration-200', pen ? 'font-mono text-[11.5px]' : 'text-[12.5px]', dim && 'opacity-25')}
      style={{ background: pen ? WIRE.card : STICKY[tone], color: ink, boxShadow: selected ? '0 0 0 2px var(--signal)' : `0 0 0 1px ${pen ? WIRE.pen : WIRE.line}` }}>
      <InlineText bare focusable={false} allowEmpty value={data.name} multiline onCommit={rename(id)} className="block w-full flex-1 whitespace-pre-wrap" placeholder="Add a note" label="Sticky note" />
      <div className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px]" style={{ color: pen ? WIRE.pen : WIRE.muted }}>
        {pen && num > 0 && <span aria-hidden className="flex size-[15px] items-center justify-center rounded-full text-[9.5px] leading-none" style={{ boxShadow: `inset 0 0 0 1px ${WIRE.pen}` }}>{num}</span>}
        {data.attach ? 'annotation' : pen ? 'note' : 'sticky'}
      </div>
    </div>
  )
})

export const SectionNode = memo(function SectionNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const fill = data.hue ?? WIRE.paper // a paper tone (older docs may hold a colour; it is drawn as given)
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
          background: fill,
          boxShadow: `inset 0 0 0 ${selected ? 2 : 1}px ${selected ? 'var(--signal)' : WIRE.line}`,
        }}>
        <div className="flows-section-tab absolute top-3 left-3 flex h-7 max-w-[calc(100%-24px)] origin-top-left cursor-grab items-center gap-2 rounded-[8px] px-2.5 text-[12.5px] font-semibold" style={{ background: WIRE.ink, color: WIRE.paper, transform: `scale(${titleScale})` }}>
          <InlineText bare focusable={false} value={data.name} onCommit={rename(id)} className="truncate" inputClassName="min-w-[120px]" label="Section name" />
        </div>
      </div>
    </>
  )
})

export const nodeTypes = { screen: ScreenNode, decision: DecisionNode, terminal: TerminalNode, note: NoteNode, section: SectionNode }

/** Library tile used in the left panel and the drag ghost. */
export function ShapeGlyph({ kind, children }: { kind: 'decision' | 'start' | 'end' | 'note' | 'section'; children?: ReactNode }) {
  if (kind === 'decision') return <svg viewBox="0 0 24 24" width="22" height="22"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  if (kind === 'start') return <span className="flex h-3.5 w-6 items-center rounded-full pl-0.5 shadow-[inset_0_0_0_1.5px_currentColor]"><span className="size-2 rounded-full bg-current" /></span>
  if (kind === 'end') return <span className="flex h-3.5 w-6 items-center justify-end rounded-full pr-0.5 shadow-[inset_0_0_0_1.5px_currentColor]"><span className="size-2 rounded-full bg-current" /></span>
  if (kind === 'note') return <span className="size-5 rounded-[2px] shadow-[inset_0_0_0_1.5px_currentColor]" />
  return <span className="h-4 w-6 rounded-[4px] border border-dashed border-current">{children}</span>
}
