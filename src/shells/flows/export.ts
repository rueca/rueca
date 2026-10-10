/* Flows — getting things out: PNG (DOM snapshot of the viewport), JSON, Mermaid. */
import { copyText, download, exportCanvasPNG, exportJSON, matchesShape, toast } from '@kit'
import { snapshotElement } from '@kit'
import { activeFlow, importFlow, select, sizeOf, ui, viewport } from './store'
import type { Flow } from './model'

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'flow'

export async function exportPNG(scale = 2) {
  const f = activeFlow()
  const el = viewport.el?.()
  if (!el || !f.nodes.length) { toast('Nothing to export yet', { type: 'error' }); return }
  const id = toast('Rendering PNG…', { type: 'loading', timeout: 0 })
  const prevSel = ui.getState().sel
  select()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const rects = f.nodes.map((n) => ({ ...n.position, ...sizeOf(n) }))
    const x0 = Math.min(...rects.map((r) => r.x)), y0 = Math.min(...rects.map((r) => r.y))
    const b = { x: x0, y: y0, width: Math.max(...rects.map((r) => r.x + r.w)) - x0, height: Math.max(...rects.map((r) => r.y + r.h)) - y0 }
    const pad = 64
    const w = Math.ceil(b.width + pad * 2), h = Math.ceil(b.height + pad * 2)
    const k = Math.min(scale, 9000 / Math.max(w, h))
    const canvas = await snapshotElement(el, {
      width: w, height: h, scale: k, background: 'var(--field)',
      style: { transform: `translate(${pad - b.x}px, ${pad - b.y}px) scale(1)`, width: `${w}px`, height: `${h}px` },
      filter: (n) => !(n.classList?.contains('react-flow__handle') || n.classList?.contains('react-flow__resize-control') || n.classList?.contains('react-flow__viewport-portal')),
    })
    await exportCanvasPNG(canvas, `${slug(f.name)}.png`)
    toast('PNG exported', { type: 'success', description: `${Math.round(w * k)} × ${Math.round(h * k)} px` })
  } catch (err) {
    toast('Export failed', { type: 'error', description: String(err) })
  } finally {
    ui.setState({ sel: prevSel })
    toast.dismiss(id)
  }
}

export function exportFlowJSON() {
  const f = activeFlow()
  exportJSON({ app: 'trompo/flows', version: 1, flow: { ...f, nodes: f.nodes.map(({ measured: _m, selected: _s, ...n }) => n) } }, `${slug(f.name)}.json`)
  toast('JSON downloaded', { type: 'success' })
}

export function importFlowJSON() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const flow: Flow = data.flow ?? data
      if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) throw new Error('No nodes / edges in this file')
      // Same shape as a real flow (id, type, position, data on every node…) — a Nodes graph export or a
      // hand-edited file would otherwise crash the canvas and persist (break-it S2).
      const ref = activeFlow()
      if (!matchesShape(flow.nodes, ref.nodes) || !matchesShape(flow.edges, ref.edges)) throw new Error('This isn’t a Flows file (nodes or connections have the wrong shape)')
      const KINDS = new Set(['screen', 'decision', 'terminal', 'note', 'section', 'start', 'end', ...ref.nodes.map((n) => n.type ?? '')])
      if (flow.nodes.some((n) => !KINDS.has(n.type ?? ''))) throw new Error('This file has node types Flows doesn’t know (is it a Nodes graph?)')
      importFlow({ id: '', name: flow.name ?? file.name.replace(/\.json$/, ''), description: flow.description ?? '', owner: flow.owner ?? 'you', nodes: flow.nodes, edges: flow.edges, comments: flow.comments ?? [], updated: Date.now() })
      toast(`Imported “${flow.name ?? file.name}”`, { type: 'success' })
    } catch (e) {
      toast('Could not import', { type: 'error', description: (e as Error).message })
    }
  }
  input.click()
}

/** Mermaid flowchart — pastes into GitHub, Notion, Linear, or an agent prompt. */
export function toMermaid(f: Flow, dir: 'LR' | 'TB' = 'LR') {
  const id = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_')
  const q = (s: string) => `"${s.replace(/"/g, '#quot;')}"`
  const shape = (n: Flow['nodes'][number]) => {
    const t = q(n.data.name || 'Untitled')
    if (n.type === 'decision') return `${id(n.id)}{${t}}`
    if (n.type === 'terminal') return `${id(n.id)}([${t}])`
    if (n.type === 'note') return `${id(n.id)}>${t}]`
    return `${id(n.id)}[${t}]`
  }
  const lines = [`flowchart ${dir}`]
  const sections = f.nodes.filter((n) => n.type === 'section')
  const loose = f.nodes.filter((n) => n.type !== 'section' && !sections.some((s) => s.id === n.data.section))
  for (const s of sections) {
    lines.push(`  subgraph ${id(s.id)} [${q(s.data.name)}]`)
    for (const n of f.nodes.filter((x) => x.data.section === s.id && x.type !== 'section')) lines.push(`    ${shape(n)}`)
    lines.push('  end')
  }
  for (const n of loose) lines.push(`  ${shape(n)}`)
  for (const e of f.edges) {
    const label = e.data?.label ? `|${q(e.data.label)}|` : ''
    lines.push(`  ${id(e.source)} ${e.data?.happy ? '==>' : '-->'}${label} ${id(e.target)}`)
  }
  return lines.join('\n')
}

export async function copyMermaid() {
  await copyText(toMermaid(activeFlow()))
  toast('Mermaid copied', { type: 'success', description: 'Paste into GitHub, Notion or an agent prompt.' })
}

export function downloadMermaid() {
  const f = activeFlow()
  download(new Blob([toMermaid(f)], { type: 'text/plain' }), `${slug(f.name)}.mmd`)
}
