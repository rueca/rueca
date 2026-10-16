/* Flows — a UX flow mapper. React Flow does the graph; the kit does the tool. */
import { ReactFlowProvider } from '@xyflow/react'
import {
  Download, Image as ImageIcon, Braces, Play, Network, MessageCircle, Square, Diamond, StickyNote, Frame, CircleDot, Circle, Copy, Trash2, Upload,
  Map as MapIcon, RotateCcw, Link, FileCode, Fullscreen, CopyPlus,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Button, Menu, Divider, ThemeToggle, PresetMenu, CommandPalette, Tip, HistoryButtons, SettingsMenu, useValues, useDoc, toast, copyText,
  type Command, type MenuItem,
  keepFocus,
} from '@kit'
import { FlowCanvas, startWalkthrough } from './canvas/FlowCanvas'
import { LeftPanel } from './panels/LeftPanel'
import { RightPanel } from './panels/RightPanel'
import { TEMPLATES } from './model'
import {
  params, history, doc, ui, useUI, useFlow, tidy, addNode, addScreen, deleteSelection, duplicate, copySelection, paste, select, switchFlow, newFlow, resetDemo, viewport, activeFlow,
} from './store'
import { exportPNG, exportFlowJSON, importFlowJSON, copyMermaid, downloadMermaid } from './export'

// Brand links the mark home itself.
const Mark = (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2" width="5" height="4" rx="1" /><rect x="9.5" y="10" width="5" height="4" rx="1" /><path d="M6.5 4h3a2 2 0 0 1 2 2v4" />
  </svg>
)

export default function FlowsShell() {
  const flow = useFlow()
  const flows = useDoc(doc, (d) => d.flows)
  const minimap = useValues(params, (v) => v.minimap)
  const walking = useUI((s) => s.walk !== null)

  const exportItems: MenuItem[] = [
    { type: 'label', label: `Export “${flow.name}”` },
    { label: 'PNG image (2×)', icon: ImageIcon, shortcut: 'mod+e', onClick: () => exportPNG(2) },
    { label: 'PNG image (1×)', icon: ImageIcon, onClick: () => exportPNG(1) },
    { label: 'JSON', icon: Braces, shortcut: 'shift+mod+e', onClick: exportFlowJSON },
    { label: 'Mermaid (.mmd)', icon: FileCode, onClick: downloadMermaid },
    { type: 'separator' },
    { label: 'Copy as Mermaid', icon: Copy, hint: 'For docs, tickets and agent prompts', onClick: copyMermaid },
    { label: 'Copy link', icon: Link, onClick: async () => { await copyText(location.href); toast('Link copied', { type: 'success' }) } },
    { type: 'separator' },
    { label: 'Import JSON…', icon: Upload, onClick: importFlowJSON },
  ]

  const commands: Command[] = [
    { id: 'add-screen', label: 'Add screen', group: 'Add', shortcut: 's', icon: Square, run: () => addScreen('home'), keywords: ['node', 'frame'] },
    { id: 'add-decision', label: 'Add decision', group: 'Add', shortcut: 'd', icon: Diamond, run: () => addNode('decision'), keywords: ['condition', 'branch', 'if'] },
    { id: 'add-note', label: 'Add sticky note', group: 'Add', shortcut: 'n', icon: StickyNote, run: () => addNode('note') },
    { id: 'add-start', label: 'Add start point', group: 'Add', icon: Circle, run: () => addNode('terminal', undefined, { role: 'start', name: 'Start' }) },
    { id: 'add-end', label: 'Add end point', group: 'Add', icon: CircleDot, run: () => addNode('terminal', undefined, { role: 'end', name: 'End' }) },
    { id: 'add-section', label: 'Add section', group: 'Add', shortcut: 'shift+s', icon: Frame, run: () => addNode('section'), keywords: ['swimlane', 'group'] },
    ...TEMPLATES.map((t) => ({ id: `add-${t.value}`, label: `Add screen: ${t.label}`, group: 'Screens', icon: Square, run: () => addScreen(t.value), keywords: [t.group] })),
    { id: 'tidy', label: 'Tidy up (auto layout)', group: 'Canvas', shortcut: 'shift+l', icon: Network, run: tidy, keywords: ['layout', 'arrange'] },
    { id: 'walk', label: 'Start walkthrough', group: 'Canvas', shortcut: 'p', icon: Play, run: startWalkthrough, keywords: ['present', 'happy path', 'play'] },
    { id: 'comment', label: 'Comment mode', group: 'Canvas', icon: MessageCircle, run: () => ui.setState({ tool: 'comment' }) },
    { id: 'minimap', label: minimap ? 'Hide minimap' : 'Show minimap', group: 'Canvas', shortcut: 'm', icon: MapIcon, run: () => params.setValue('minimap', !params.values().minimap) },
    { id: 'fit', label: 'Zoom to fit', group: 'Canvas', shortcut: 'shift+1', icon: Fullscreen, run: () => viewport.fit?.() },
    { id: 'zoom-sel', label: 'Zoom to selection', group: 'Canvas', shortcut: 'shift+2', run: () => { const s = ui.getState().sel.nodes; if (s.length) viewport.focus?.(s) } },
    { id: 'zoom-100', label: 'Zoom to 100%', group: 'Canvas', shortcut: 'shift+0', run: () => viewport.zoomTo?.(1) },
    { id: 'zoom-in', label: 'Zoom in', group: 'Canvas', shortcut: 'mod+=', run: () => viewport.zoomIn?.() },
    { id: 'zoom-out', label: 'Zoom out', group: 'Canvas', shortcut: 'mod+-', run: () => viewport.zoomOut?.() },
    { id: 'select-all', label: 'Select all', group: 'Edit', shortcut: 'mod+a', run: () => select(activeFlow().nodes.filter((n) => n.type !== 'section').map((n) => n.id)) },
    { id: 'dup', label: 'Duplicate', group: 'Edit', shortcut: 'mod+d', icon: CopyPlus, run: duplicate },
    { id: 'copy', label: 'Copy', group: 'Edit', shortcut: 'mod+c', run: () => { if (copySelection()) toast('Copied') } },
    { id: 'paste', label: 'Paste', group: 'Edit', shortcut: 'mod+v', run: () => paste() },
    { id: 'delete', label: 'Delete selection', group: 'Edit', shortcut: 'backspace,delete', icon: Trash2, run: () => keepFocus(deleteSelection, '.react-flow__node') },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: () => exportPNG(2) },
    { id: 'json', label: 'Export JSON', group: 'Export', shortcut: 'shift+mod+e', icon: Braces, run: exportFlowJSON },
    { id: 'mermaid', label: 'Copy as Mermaid', group: 'Export', icon: Copy, run: copyMermaid },
    { id: 'import', label: 'Import JSON…', group: 'Export', icon: Upload, run: importFlowJSON },
    { id: 'new-flow', label: 'New flow', group: 'Flows', run: newFlow },
    ...flows.map((f) => ({ id: `flow-${f.id}`, label: `Open flow: ${f.name}`, group: 'Flows', run: () => switchFlow(f.id) })),
    { id: 'reset', label: 'Reset demo content', group: 'Flows', icon: RotateCcw, run: () => { resetDemo(); toast('Demo restored') } },
  ]

  return (
    <ReactFlowProvider>
      <Studio
        toolbar={
          <Toolbar
            start={<Brand name="Flows" doc={flow.name} mark={Mark} />}
            center={
              <Cluster>
                <Tip label="Tidy up" shortcut="shift+l"><Button size="md" onClick={tidy} disabled={walking}><Network size={14} strokeWidth={1.5} />Tidy up</Button></Tip>
                <Divider vertical />
                <Tip label="Walk through the happy path" shortcut="p"><Button size="md" onClick={startWalkthrough}><Play size={14} strokeWidth={1.5} />Walkthrough</Button></Tip>
              </Cluster>
            }
            end={
              <>
                <Cluster>
                  <HistoryButtons history={history} />
                  <Divider vertical />
                  <PresetMenu params={params} />
                  <SettingsMenu params={params} label="Canvas settings" />
                  <ThemeToggle />
                </Cluster>
                <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
              </>
            }
          />
        }
        left={<LeftPanel />}
        right={<RightPanel />}
      >
        <FlowCanvas />
        <CommandPalette commands={commands} extraShortcuts={[
          { keys: 'v', label: 'Move tool' }, { keys: 'h', label: 'Hand tool' }, { keys: 'c', label: 'Comment tool' },
          { keys: 'space', label: 'Hold to pan' }, { keys: 'shift', label: 'Add to selection' }, { keys: 'esc', label: 'Deselect / exit' },
          { keys: 'arrowright', label: 'Next step (walkthrough)' }, { keys: 'arrowleft', label: 'Previous step (walkthrough)' },
        ]} />
      </Studio>
    </ReactFlowProvider>
  )
}
