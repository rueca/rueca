/* The big preview: the Output (or the selected node) cooked at 512–1024px on a kit Stage. */
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { AlertTriangle, Plus } from 'lucide-react'
import { Stage, Artboard, Segmented, Badge, Button, useValues, cn } from '@kit'
import { useEval, previewTarget } from './evaluator'
import { doc } from './doc'
import { graph, addNode } from './store'
import { canvasApi } from './Canvas'

export function PreviewPane() {
  const preview = useEval((s) => s.preview)
  const busy = useEval((s) => s.busy)
  const v = useValues(doc)
  const res = Number(v.previewRes)
  // re-derive the label whenever selection or titles change
  const label = useStore(graph, () => { const id = previewTarget(); return id ? graph.getState().nodes.find((n) => n.id === id)?.data.title ?? '' : '' })
  const hasOutput = useStore(graph, (s) => s.nodes.some((n) => n.data.kind === 'output'))
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current
    const img = preview?.image
    if (!c || !img) return
    if (c.width !== img.width || c.height !== img.height) { c.width = img.width; c.height = img.height }
    c.getContext('2d')!.putImageData(img, 0, 0)
  }, [preview?.image])

  const backdrop = v.backdrop === 'checker' ? 'checker' : ''
  const bg = v.backdrop === 'dark' ? '#0c0c0c' : v.backdrop === 'light' ? '#f4f4f4' : undefined
  const error = preview?.error

  // One row that wraps: in a narrow pane (split view at 1024) the stats drop below the toggle instead of
  // sliding under it (cleanup L3).
  const hud = (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-center justify-between gap-1.5">
      <div className="pointer-events-auto w-[164px] shrink-0">
        <Segmented value={v.previewOf} onChange={(x) => doc.setValue('previewOf', x as 'output' | 'selection')} label="Preview"
          options={[{ value: 'output', label: 'Output', hint: 'Show the Output node' }, { value: 'selection', label: 'Selection', hint: 'Show the selected node (P)' }]} />
      </div>
      <div className="flex items-center gap-1.5">
        {busy && <span role="img" className="size-3 animate-spin rounded-full border-[1.5px] border-line-strong border-t-signal" aria-label="Cooking" />}
        {preview?.draft && <Badge tone="key">Draft</Badge>}
        {preview && !error && <Badge className="bg-panel shadow-[var(--shadow-cluster)]">{preview.res}px · {preview.ms < 10 ? preview.ms.toFixed(1) : Math.round(preview.ms)} ms</Badge>}
      </div>
    </div>
  )

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] bg-well shadow-[inset_0_0_0_1px_var(--line)]">
      <Stage contentSize={{ w: res, h: res }} padding={44} overlay={hud}>
        <Artboard width={res} height={res} label={label || 'Preview'} background="transparent">
          <div className={cn('absolute inset-0', backdrop)} style={{ background: bg }} />
          <canvas ref={canvas} className={cn('absolute inset-0 h-full w-full', (error || !preview?.image) && 'opacity-0')} />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-panel p-8 text-center font-ui">
              <AlertTriangle size={28} strokeWidth={1.5} className="text-fg-faint" />
              <div className="max-w-[70%] text-[22px] leading-snug text-fg-muted" style={{ fontSize: Math.max(13, res / 36) }}>{error}</div>
              {!hasOutput && (
                <Button variant="primary" size="lg" style={{ transform: `scale(${res / 512})` }}
                  onClick={() => { const c = canvasApi.center(); addNode('output', { x: c.x + 120, y: c.y - 60 }) }}>
                  <Plus size={14} strokeWidth={1.5} />Add output
                </Button>
              )}
            </div>
          )}
        </Artboard>
      </Stage>
    </div>
  )
}
