import '@xyflow/react/dist/base.css'
import '@kit/xyflow.css'
import './graph/graph.css'
import { useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import {
  Plus, Maximize, Download, Image as ImageIcon, Braces, FolderOpen, Copy, ClipboardPaste, EyeOff, Undo2, Redo2, Workflow, Columns2,
  Image, ScanEye, Map as MapIcon, FilePlus2, LayoutGrid, Trash2, BoxSelect, ClipboardCopy,
} from 'lucide-react'
import {
  Studio, Toolbar, Brand, Cluster, Button, IconButton, Menu, Segmented, Divider, ThemeToggle, CommandPalette, HistoryButtons,
  toast, exportCanvasPNG, exportJSON, copyText, useHotkeys, useValues, type Command,
} from '@kit'
import { SplitPane } from '@kit/layout/SplitPane'
import { InlineText } from '@kit/ui/inline-text'
import { graph, graphHistory, useGraph, undo, redo, load, commit, copy, paste, duplicate, select, selectedIds, updateData, removeNodes, addNode, outputId, toSaved, type SavedGraph } from './graph/store'
import { DEF_LIST } from './graph/defs'
import { SAMPLES, BLANK } from './graph/samples'
import { doc } from './graph/doc'
import { render } from './graph/evaluator'
import { GraphCanvas, canvasApi } from './graph/Canvas'
import { Library } from './graph/Library'
import { NodeInspector } from './graph/NodeInspector'
import { PreviewPane } from './graph/Preview'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'graph'

async function exportPng() {
  const out = outputId()
  if (!out) { toast('Add an Output node first', { type: 'error' }); return }
  const res = Number(doc.values().exportRes)
  const id = toast(`Rendering ${res} px…`, { type: 'loading' })
  try {
    const img = await render(out, res)
    const c = document.createElement('canvas')
    c.width = img.width; c.height = img.height
    c.getContext('2d')!.putImageData(img, 0, 0)
    await exportCanvasPNG(c, `${slug(graph.getState().name)}-${res}.png`)
    toast.update(id, 'PNG exported', { description: `${res} × ${res}, cooked at full size`, type: 'success' })
  } catch (e) {
    toast.update(id, 'Export failed', { description: e instanceof Error ? e.message : String(e), type: 'error', timeout: 4000 })
  }
}

const exportGraph = () => { const s = graph.getState(); exportJSON(toSaved(s), `${slug(s.name)}.graph.json`); toast('Graph exported', { type: 'success' }) }

function openSample(g: SavedGraph, name: string) {
  load(g)
  setTimeout(() => canvasApi.fit(), 60)
  toast(`Opened “${name}”`, { description: 'Undo brings back your previous graph.' })
}

function toggleBypass() {
  const ids = selectedIds()
  if (!ids.length) return
  const all = graph.getState().nodes.filter((n) => ids.includes(n.id)).every((n) => n.data.bypass)
  updateData(ids, () => ({ bypass: !all }))
}

export default function NodesShell() {
  const file = useRef<HTMLInputElement>(null)
  const name = useGraph((s) => s.name)
  const view = useValues(doc, (v) => v.view)
  const setView = (x: string) => doc.setValue('view', x as 'graph' | 'split' | 'preview')

  useHotkeys({ esc: { run: () => select([]), label: 'Clear selection', group: 'Graph' } })

  const importGraph = () => file.current?.click()
  const onFile = async (f?: File) => {
    if (!f) return
    try {
      const g = JSON.parse(await f.text()) as SavedGraph
      if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) throw new Error('missing nodes / edges')
      load(g)
      setTimeout(() => canvasApi.fit(), 60)
      toast(`Imported “${g.name ?? f.name}”`, { type: 'success' })
    } catch (e) {
      toast('Could not import that file', { type: 'error', description: e instanceof Error ? e.message : 'Expected a Nodes graph JSON.' })
    }
  }

  const commands: Command[] = [
    { id: 'add', label: 'Add node…', group: 'Graph', icon: Plus, run: () => canvasApi.openAdd(), keywords: ['tab', 'search', 'insert'] },
    { id: 'fit', label: 'Frame all nodes', group: 'Graph', shortcut: 'f', icon: Maximize, run: () => canvasApi.fit() },
    { id: 'all', label: 'Select all nodes', group: 'Graph', shortcut: 'mod+a', icon: BoxSelect, run: () => select(graph.getState().nodes.map((n) => n.id)) },
    { id: 'dup', label: 'Duplicate selection', group: 'Graph', shortcut: 'mod+d', icon: Copy, run: () => duplicate(selectedIds()) },
    { id: 'copy', label: 'Copy nodes', group: 'Graph', shortcut: 'mod+c', icon: ClipboardCopy, run: () => { const n = copy(selectedIds()); if (n) toast(`Copied ${n} node${n > 1 ? 's' : ''}`) } },
    { id: 'paste', label: 'Paste nodes', group: 'Graph', shortcut: 'mod+v', icon: ClipboardPaste, run: () => paste() },
    { id: 'bypass', label: 'Bypass / enable selection', group: 'Graph', shortcut: 'b', icon: EyeOff, run: toggleBypass },
    { id: 'delete', label: 'Delete selection', group: 'Graph', icon: Trash2, run: () => removeNodes(selectedIds()), keywords: ['remove'] },
    { id: 'undo', label: 'Undo', group: 'Graph', icon: Undo2, run: undo },
    { id: 'redo', label: 'Redo', group: 'Graph', icon: Redo2, run: redo },
    { id: 'v-graph', label: 'Show graph only', group: 'View', shortcut: '1', icon: Workflow, run: () => setView('graph') },
    { id: 'v-split', label: 'Show graph and preview', group: 'View', shortcut: '2', icon: Columns2, run: () => setView('split') },
    { id: 'v-prev', label: 'Show preview only', group: 'View', shortcut: '3', icon: Image, run: () => setView('preview') },
    { id: 'p-sel', label: 'Preview selection / output', group: 'View', shortcut: 'p', icon: ScanEye, run: () => doc.setValue('previewOf', doc.values().previewOf === 'output' ? 'selection' : 'output') },
    { id: 'thumbs', label: 'Toggle node previews', group: 'View', icon: LayoutGrid, run: () => doc.setValue('thumbs', !doc.values().thumbs) },
    { id: 'minimap', label: 'Toggle minimap', group: 'View', shortcut: 'm', icon: MapIcon, run: () => doc.setValue('minimap', !doc.values().minimap) },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: exportPng },
    { id: 'json', label: 'Export graph JSON', group: 'Export', shortcut: 'shift+mod+e', icon: Braces, run: exportGraph },
    { id: 'copy-json', label: 'Copy graph JSON', group: 'Export', icon: Braces, run: async () => { await copyText(JSON.stringify(toSaved(graph.getState()), null, 2)); toast('Graph JSON copied', { type: 'success' }) } },
    { id: 'import', label: 'Import graph JSON…', group: 'Export', shortcut: 'mod+o', icon: FolderOpen, run: importGraph },
    { id: 'new', label: 'New empty graph', group: 'Samples', icon: FilePlus2, run: () => openSample(BLANK, 'Untitled') },
    ...SAMPLES.map((s) => ({ id: `s-${s.id}`, label: `Open sample: ${s.name}`, group: 'Samples', run: () => openSample(s.graph, s.name) })),
    ...DEF_LIST.map((d) => ({ id: `add-${d.kind}`, label: `Add ${d.label}`, group: 'Add node', icon: d.icon, keywords: d.keywords, run: () => { const c = canvasApi.center(); addNode(d.kind, { x: c.x - 88, y: c.y - 60 }) } })),
  ]

  // Brand links the mark home itself.
  const mark = <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="3.5" cy="4" r="2" /><circle cx="3.5" cy="12" r="2" /><circle cx="12.5" cy="8" r="2" /><path d="M5.5 4c3 0 3 4 5 4M5.5 12c3 0 3-4 5-4" /></svg>

  return (
    <ReactFlowProvider>
      <Studio
        leftWidth={232}
        rightWidth={296}
        toolbar={
          <Toolbar
            start={<Brand name="Nodes" mark={mark} doc={<InlineText value={name} onCommit={(n) => { graph.setState({ name: n }); commit() }} label="Rename graph" className="block truncate" />} />}
            center={
              <Cluster>
                <div className="w-[104px] px-0.5">
                  <Segmented size="sm" iconOnly value={view} onChange={setView} label="View"
                    options={[{ value: 'graph', icon: Workflow, hint: 'Graph (1)' }, { value: 'split', icon: Columns2, hint: 'Graph + preview (2)' }, { value: 'preview', icon: Image, hint: 'Preview (3)' }]} />
                </div>
                <Divider vertical />
                <IconButton icon={Plus} label="Add node" shortcut="tab" onClick={() => canvasApi.openAdd()} />
                <IconButton icon={Maximize} label="Frame all nodes" shortcut="f" onClick={() => canvasApi.fit()} />
              </Cluster>
            }
            end={
              <>
                <Cluster>
                  <HistoryButtons history={graphHistory} />
                  <Divider vertical />
                  <ThemeToggle />
                </Cluster>
                <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                  items={[
                    { type: 'label', label: 'Image' },
                    { label: `PNG · ${doc.values().exportRes} px`, icon: ImageIcon, shortcut: 'mod+e', onClick: exportPng },
                    { type: 'submenu', label: 'PNG size', items: (['1024', '2048'] as const).map((r) => ({ label: `${r} × ${r}`, checked: doc.values().exportRes === r, onClick: () => doc.setValue('exportRes', r) })) },
                    { type: 'separator' },
                    { type: 'label', label: 'Graph' },
                    { label: 'Graph JSON', icon: Braces, shortcut: 'shift+mod+e', onClick: exportGraph },
                    { label: 'Copy graph JSON', icon: Copy, onClick: async () => { await copyText(JSON.stringify(toSaved(graph.getState()), null, 2)); toast('Graph JSON copied', { type: 'success' }) } },
                    { label: 'Import graph JSON…', icon: FolderOpen, shortcut: 'mod+o', onClick: importGraph },
                  ]} />
              </>
            }
          />
        }
        left={<Library />}
        right={<NodeInspector />}
      >
        <SplitPane id="nodes" show={view === 'split' ? 'both' : view === 'graph' ? 'a' : 'b'} defaultRatio={0.58} a={<GraphCanvas />} b={<PreviewPane />} label="Resize graph and preview" />
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
        <CommandPalette commands={commands} extraShortcuts={[
          { keys: 'backspace', label: 'Delete selection' },
          { keys: 'space', label: 'Hold to pan the graph' },
          { keys: 'shift+1', label: 'Fit preview' },
          { keys: 'shift+0', label: 'Preview at 100%' },
        ]} />
      </Studio>
    </ReactFlowProvider>
  )
}


