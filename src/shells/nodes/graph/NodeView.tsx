/* The node card: category stripe, typed ports, live thumbnail, error strip. */
import { memo, useEffect, useRef, type CSSProperties } from 'react'
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { useStore } from 'zustand'
import { AlertTriangle, EyeOff } from 'lucide-react'
import { ScrubValue, Tip, cn, useValues } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { specOf, portOf, type PortSpec, type PortType } from '../engine/spec'
import { toHex, type RGBA } from '../engine/image'
import { defOf, catVar } from './defs'
import { graph, updateData, setParams, commit, type GNode } from './store'
import { useEval } from './evaluator'
import { doc } from './doc'

export const portVar = (t: PortType) => `var(--port-${t})`

/** Draws an ImageData into a canvas sized to it. */
export function ImageCanvas({ image, className, style }: { image?: ImageData; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !image) return
    if (c.width !== image.width || c.height !== image.height) { c.width = image.width; c.height = image.height }
    c.getContext('2d')!.putImageData(image, 0, 0)
  }, [image])
  return <canvas ref={ref} className={className} style={style} />
}

function Port({ port, side, wired, dim }: { port: PortSpec; side: 'in' | 'out'; wired: boolean; dim: boolean }) {
  return (
    <Tip label={`${port.label} · ${port.type}${port.optional ? ' (optional)' : ''}`} side={side === 'in' ? 'left' : 'right'}>
      <Handle
        type={side === 'in' ? 'target' : 'source'}
        position={side === 'in' ? Position.Left : Position.Right}
        id={port.key}
        className="studio-port"
        data-wired={wired}
        data-dim={dim}
        aria-label={`${side === 'in' ? 'Input' : 'Output'} ${port.label} (${port.type})`}
        style={{ '--port': portVar(port.type) } as CSSProperties}
      />
    </Tip>
  )
}

export const NodeView = memo(function NodeView({ id, data, selected }: NodeProps<GNode>) {
  const def = defOf(data.kind)
  const spec = specOf(data.kind)
  const thumb = useEval((s) => s.thumbs[id])
  const status = useEval((s) => s.status[id])
  const showThumbs = useValues(doc, (v) => v.thumbs)
  const wiredKey = useStore(graph, (s) => s.edges.filter((e) => e.source === id || e.target === id).map((e) => (e.source === id ? `o:${e.sourceHandle}` : `i:${e.targetHandle}`)).join(','))
  const wired = new Set(wiredKey.split(','))
  // While a wire is being dragged: which of my ports could accept it?
  const conn = useConnection((c) => (c.inProgress ? `${c.fromNode.id}|${c.fromHandle.id}|${c.fromHandle.type}|${(c.fromNode.data as GNode['data']).kind}` : ''))
  let dragFrom: { node: string; side: 'in' | 'out'; type?: PortType } | null = null
  if (conn) {
    const [node, handle, htype, kind] = conn.split('|')
    const side = htype === 'source' ? 'out' : 'in'
    dragFrom = { node, side, type: portOf(kind, handle, side)?.type }
  }
  const dimFor = (port: PortSpec, side: 'in' | 'out') => !!dragFrom && (dragFrom.node === id || dragFrom.side === side || dragFrom.type !== port.type)

  const error = status?.error ?? (thumb && !thumb.blocked ? thumb.error : undefined)
  const blocked = !error && (status?.blocked || thumb?.blocked)
  const rows = Math.max(spec.inputs.length, spec.outputs.length)
  const hasImage = spec.outputs.some((o) => o.type === 'image') || data.kind === 'output'
  const Icon = def.icon
  const cat = catVar(def.category)

  return (
    <div
      className={cn('studio-node relative w-[176px] rounded-[10px] bg-panel transition-opacity', data.bypass && 'opacity-40')}
      style={{ boxShadow: selected ? '0 0 0 1.5px var(--signal), var(--shadow-panel)' : error ? '0 0 0 1px color-mix(in srgb, var(--rec) 70%, transparent), var(--shadow-panel)' : 'var(--shadow-cluster)' }}
    >
      {/* category stripe */}
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[10px]" style={{ background: cat }} />
      <div className="flex h-8 items-center gap-1.5 pt-[3px] pr-2 pl-2.5">
        <span className="flex shrink-0" style={{ color: cat }}><Icon size={14} strokeWidth={1.5} /></span>
        <InlineText focusable={false} value={data.title} onCommit={(t) => updateData([id], () => ({ title: t }))} className="flex-1 truncate text-[12px] font-medium text-fg" label="Rename node" />
        {data.bypass && <Tip label="Bypassed (B)"><span className="text-fg-faint"><EyeOff size={12} strokeWidth={1.5} /></span></Tip>}
        {error && <Tip label={error}><span className="text-rec"><AlertTriangle size={13} strokeWidth={1.75} /></span></Tip>}
        {!error && thumb && thumb.ms >= 0.5 && <span className="tabular text-[10.5px] text-fg-faint">{thumb.ms < 10 ? thumb.ms.toFixed(1) : Math.round(thumb.ms)}ms</span>}
      </div>

      {/* ports: inputs left, outputs right, sharing rows */}
      {rows > 0 && (
        <div className="flex flex-col pb-1">
          {Array.from({ length: rows }, (_, i) => {
            const inp = spec.inputs[i], out = spec.outputs[i]
            return (
              <div key={i} className="relative flex h-[22px] items-center justify-between gap-2 px-3 text-[11px]">
                {inp ? (
                  <>
                    <Port port={inp} side="in" wired={wired.has(`i:${inp.key}`)} dim={dimFor(inp, 'in')} />
                    <span className={cn('truncate', wired.has(`i:${inp.key}`) ? 'text-fg' : inp.optional ? 'text-fg-faint' : 'text-fg-muted')}>{inp.label}</span>
                  </>
                ) : <span />}
                {out && (
                  <>
                    <span className="truncate text-fg-muted">{out.label}</span>
                    <Port port={out} side="out" wired={wired.has(`o:${out.key}`)} dim={dimFor(out, 'out')} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* body */}
      {data.kind === 'number' && <NumberBody id={id} params={data.params} />}
      {data.kind === 'color' && <ColorBody value={(thumb?.value as RGBA | undefined) ? toHex(thumb!.value as RGBA) : String(data.params.color)} />}
      {hasImage && showThumbs && (
        <div className="px-2 pb-2">
          <div className="checker relative aspect-square w-full overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_var(--line)]">
            {thumb?.image && !error && !blocked && <ImageCanvas image={thumb.image} className="absolute inset-0 h-full w-full" />}
            {(error || blocked || !thumb?.image) && (
              <div className="absolute inset-0 flex items-center justify-center bg-well px-3 text-center text-[11px] leading-snug text-fg-faint">
                {error ? <span className="text-rec">{error}</span> : blocked ? 'Waiting for a valid input' : 'Cooking…'}
              </div>
            )}
          </div>
        </div>
      )}
      {!showThumbs && error && <div className="px-3 pb-2 text-[11px] leading-snug text-rec">{error}</div>}
    </div>
  )
})

/** Scrub the value right on the card: live while dragging, one undo step on release. */
function NumberBody({ id, params }: { id: string; params: Record<string, unknown> }) {
  return (
    <div className="nodrag px-2 pb-2">
      <ScrubValue boxed align="left" value={Number(params.value ?? 0)} step={0.01} label="Value" className="w-full"
        onChange={(v, final) => { setParams(id, { ...params, value: v }, !final); if (final) commit() }} />
    </div>
  )
}

function ColorBody({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 px-2 pb-2">
      <span className="checker relative h-6 flex-1 overflow-hidden rounded-[5px] shadow-[inset_0_0_0_1px_var(--line-strong)]"><span className="absolute inset-0" style={{ background: value }} /></span>
      <span className="tabular text-[11px] text-fg-muted uppercase">{value.replace('#', '').slice(0, 6)}</span>
    </div>
  )
}
