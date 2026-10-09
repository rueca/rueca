/* ---------------------------------------------------------------------------
   Canvas — a UI design tool shell (Figma / Framer / Paper / Affinity).

   Docked layout: Pages + Layers on the left, the canvas in the middle with a
   bottom tool dock and a selection-aware context bar, Design / Prototype on
   the right. The document is a node tree in its own history store
   (model/store.ts, selection-aware), adapted to the kit's HistoryButtons;
   studio preferences are a kit param schema (model/prefs). T is the Text
   tool, so the theme toggle has no hotkey (it's in ⌘K).
--------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import {
  MousePointer2, Hash, Square, Circle, Type, Hand, MessageCircle, Play, Download, Undo2, Redo2, Sun, Moon, ImageDown, CodeXml,
  Copy, Trash2, Component, Frame, Group, Ungroup, Columns3, Eye, Lock, ArrowUpToLine, ArrowDownToLine, FileDown, RefreshCw, Grid3x3, Magnet, Focus, Maximize, FilePlus, ClipboardPaste,
} from 'lucide-react'
import {
  Studio, Toolbar, Brand, Cluster, Panel, PanelHeader, PanelTabs, ToolDock, CommandPalette, IconButton, Button, Menu, Divider,
  HistoryButtons, ThemeToggle, useHotkeys, useTheme, toast, type Command, type HotkeyHandler,
} from '@kit'
import { useStore } from 'zustand'
import * as S from './model/store'
import { prefs } from './model/prefs'
import { bumpFontEpoch } from './model/layout'
import { camera } from './canvas/camera'
import { Canvas } from './canvas/Canvas'
import { LayersPanel } from './panels/LayersPanel'
import { DesignPanel } from './panels/DesignPanel'
import { DocumentPanel } from './panels/DocumentPanel'
import { PrototypePanel } from './panels/PrototypePanel'
import { Player } from './preview/Player'
import * as A from './actions'
import type { Tool } from './model/types'

// a handle for headless tests and the console (dev only)
if (import.meta.env.DEV) (window as unknown as { __canvas: typeof S }).__canvas = S

const TOOLS: { value: Tool; label: string; icon: typeof Square; shortcut: string }[] = [
  { value: 'move', label: 'Move', icon: MousePointer2, shortcut: 'v' },
  { value: 'frame', label: 'Frame', icon: Hash, shortcut: 'f' },
  { value: 'rect', label: 'Rectangle', icon: Square, shortcut: 'r' },
  { value: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'o' },
  { value: 'text', label: 'Text', icon: Type, shortcut: 't' },
  { value: 'hand', label: 'Hand', icon: Hand, shortcut: 'h' },
  { value: 'comment', label: 'Comment', icon: MessageCircle, shortcut: 'c' },
]

/** keys typed into the layer tree belong to the tree */
const inTree = () => !!(document.activeElement as HTMLElement | null)?.closest?.('[role=tree]')

export default function CanvasShell() {
  const tool = S.useDesign((s) => s.tool)
  const tab = S.useDesign((s) => s.tab)
  const selection = S.useDesign((s) => s.selection)
  const doc = S.useDesign((s) => s.doc)
  const pageId = S.useDesign((s) => s.pageId)
  const zoom = useStore(camera, (c) => c.zoom)
  const { theme, toggle } = useTheme()
  const [presenting, setPresenting] = useState(false)
  const hasSel = selection.length > 0

  // web fonts change text metrics: re-measure once they are ready
  useEffect(() => { document.fonts?.ready.then(() => { bumpFontEpoch(); S.design.setState({ doc: { ...S.get().doc } }) }) }, [])

  const nudge = (dx: number, dy: number) => () => { if (!inTree()) S.nudge(dx, dy) }
  const small = () => prefs.values().nudgeSmall
  const big = () => prefs.values().nudgeBig
  const off = presenting
  // tool keys are labelled so the ? sheet lists them (shell priority beats kit defaults)
  const toolKeys: Record<string, HotkeyHandler> = Object.fromEntries(TOOLS.map((t) => [t.shortcut, { run: () => S.setTool(t.value), label: `${t.label} tool`, group: 'Tools' }]))
  useHotkeys(off ? {} : {
    ...toolKeys,
    arrowleft: () => nudge(-small(), 0)(), arrowright: () => nudge(small(), 0)(),
    arrowup: { run: () => nudge(0, -small())(), label: 'Nudge (⇧ ×10)', group: 'Edit' }, arrowdown: () => nudge(0, small())(),
    'shift+arrowleft': () => nudge(-big(), 0)(), 'shift+arrowright': () => nudge(big(), 0)(), 'shift+arrowup': () => nudge(0, -big())(), 'shift+arrowdown': () => nudge(0, big())(),
    esc: {
      label: 'Deselect / select parent', group: 'Selection', run: () => {
        const s = S.get()
        if (s.openComment) return S.design.setState({ openComment: null })
        if (s.tool !== 'move') return S.setTool('move')
        if (s.selection.length) S.selectParent()
      },
    },
    enter: {
      label: 'Select children / edit text', group: 'Selection', run: () => {
        if (inTree()) return
        const sel = S.selectedNodes()
        if (sel.length === 1 && sel[0].type === 'text') S.design.setState({ editing: sel[0].id })
        else S.selectChildren()
      },
    },
    'shift+enter': { run: () => { if (!inTree()) S.selectParent() }, label: 'Select parent', group: 'Selection' },
    ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => [String(d), d === 1 ? { run: () => A.setOpacityKey(d), label: 'Opacity 10–100% (0 = 100%)', group: 'Edit' } : () => A.setOpacityKey(d)])),
  }, [presenting])

  const commands: Command[] = [
    ...TOOLS.map((t) => ({ id: `tool-${t.value}`, label: `${t.label} tool`, group: 'Tools', icon: t.icon, run: () => S.setTool(t.value), keywords: [t.shortcut] })),
    { id: 'undo', label: 'Undo', group: 'Edit', icon: Undo2, run: () => { S.history.undo() } },
    { id: 'redo', label: 'Redo', group: 'Edit', icon: Redo2, run: () => { S.history.redo() } },
    { id: 'dup', label: 'Duplicate', group: 'Edit', shortcut: 'mod+d', icon: Copy, run: () => S.duplicateSelection() },
    { id: 'copy', label: 'Copy', group: 'Edit', shortcut: 'mod+c', run: () => { const n = S.copySelection(); if (n) toast(`Copied ${n} layer${n > 1 ? 's' : ''}`) } },
    { id: 'cut', label: 'Cut', group: 'Edit', shortcut: 'mod+x', run: () => { if (S.copySelection()) S.deleteSelection() } },
    { id: 'paste', label: 'Paste', group: 'Edit', shortcut: 'mod+v', icon: ClipboardPaste, run: S.paste },
    { id: 'delete', label: 'Delete', group: 'Edit', shortcut: 'backspace,delete', icon: Trash2, run: S.deleteSelection },
    { id: 'all', label: 'Select all', group: 'Edit', shortcut: 'mod+a', run: S.selectAll },
    { id: 'autolayout', label: 'Add / remove auto layout', group: 'Layout', shortcut: 'shift+a', icon: Columns3, run: S.addAutoLayout },
    { id: 'frame-sel', label: 'Frame selection', group: 'Layout', shortcut: 'alt+mod+g', icon: Frame, run: () => S.wrapSelection('frame') },
    { id: 'group', label: 'Group selection', group: 'Layout', shortcut: 'mod+g', icon: Group, run: () => S.wrapSelection('group') },
    { id: 'ungroup', label: 'Ungroup', group: 'Layout', shortcut: 'shift+mod+g', icon: Ungroup, run: S.ungroup },
    { id: 'component', label: 'Create component', group: 'Layout', shortcut: 'alt+mod+k', icon: Component, run: () => { const r = S.toggleComponent(); if (r) toast(r === 'created' ? 'Component created' : 'Component detached', { type: 'success' }) } },
    { id: 'front', label: 'Bring to front', group: 'Arrange', shortcut: 'alt+mod+]', icon: ArrowUpToLine, run: () => S.reorder('front') },
    { id: 'forward', label: 'Bring forward', group: 'Arrange', shortcut: 'mod+]', run: () => S.reorder('forward') },
    { id: 'backward', label: 'Send backward', group: 'Arrange', shortcut: 'mod+[', run: () => S.reorder('backward') },
    { id: 'back', label: 'Send to back', group: 'Arrange', shortcut: 'alt+mod+[', icon: ArrowDownToLine, run: () => S.reorder('back') },
    { id: 'al', label: 'Align left', group: 'Arrange', shortcut: 'alt+a', run: () => S.align('left') },
    { id: 'ah', label: 'Align horizontal centres', group: 'Arrange', shortcut: 'alt+h', run: () => S.align('hcenter') },
    { id: 'ar', label: 'Align right', group: 'Arrange', shortcut: 'alt+d', run: () => S.align('right') },
    { id: 'at', label: 'Align top', group: 'Arrange', shortcut: 'alt+w', run: () => S.align('top') },
    { id: 'av', label: 'Align vertical centres', group: 'Arrange', shortcut: 'alt+v', run: () => S.align('vcenter') },
    { id: 'ab', label: 'Align bottom', group: 'Arrange', shortcut: 'alt+s', run: () => S.align('bottom') },
    { id: 'dh', label: 'Distribute horizontal spacing', group: 'Arrange', shortcut: 'alt+shift+h', run: () => S.distribute('x') },
    { id: 'dv', label: 'Distribute vertical spacing', group: 'Arrange', shortcut: 'alt+shift+v', run: () => S.distribute('y') },
    { id: 'hide', label: 'Show / hide selection', group: 'Arrange', shortcut: 'shift+mod+h', icon: Eye, run: A.toggleHidden },
    { id: 'lock', label: 'Lock / unlock selection', group: 'Arrange', shortcut: 'shift+mod+l', icon: Lock, run: A.toggleLocked },
    { id: 'export', label: 'Export selection', group: 'Export', shortcut: 'shift+mod+e', icon: ImageDown, run: A.exportSelection },
    { id: 'export-frames', label: 'Export all frames on page', group: 'Export', icon: ImageDown, run: A.exportFrames },
    { id: 'css', label: 'Copy CSS', group: 'Export', shortcut: 'alt+shift+c', icon: CodeXml, run: A.copyCSS },
    { id: 'save', label: 'Download document (.json)', group: 'Export', icon: FileDown, run: A.downloadDocument },
    { id: 'present', label: 'Present prototype', group: 'Prototype', shortcut: 'alt+mod+enter', icon: Play, run: () => setPresenting(true) },
    { id: 'tab-design', label: 'Show Design tab', group: 'View', run: () => S.design.setState({ tab: 'design' }) },
    { id: 'tab-proto', label: 'Show Prototype tab', group: 'View', run: () => S.design.setState({ tab: 'prototype' }) },
    { id: 'zoom-sel', label: 'Zoom to selection', group: 'View', shortcut: 'shift+2', icon: Focus, run: A.zoomToSelection },
    { id: 'zoom-page', label: 'Zoom to fit page', group: 'View', icon: Maximize, run: A.zoomToFitPage },
    { id: 'grid', label: 'Toggle dot grid', group: 'View', icon: Grid3x3, run: () => prefs.setValue('showGrid', !prefs.values().showGrid) },
    { id: 'snap', label: 'Toggle snapping', group: 'View', icon: Magnet, run: () => { prefs.setValue('snapObjects', !prefs.values().snapObjects); toast(prefs.values().snapObjects ? 'Snapping on' : 'Snapping off') } },
    { id: 'theme', label: theme === 'dark' ? 'Light theme' : 'Dark theme', group: 'View', icon: theme === 'dark' ? Sun : Moon, run: toggle },
    { id: 'page-new', label: 'New page', group: 'Pages', icon: FilePlus, run: S.addPage },
    ...doc.pages.filter((p) => p.id !== pageId).map((p) => ({ id: `page-${p.id}`, label: `Go to ${p.name}`, group: 'Pages', run: () => S.gotoPage(p.id) })),
    { id: 'reset', label: 'Reset to demo file', group: 'Document', icon: RefreshCw, run: () => { S.resetDocument(); toast('Demo file restored', { action: { label: 'Undo', onClick: () => S.undo() } }) } },
  ]

  return (
    <Studio
      layout="docked"
      leftWidth={240}
      rightWidth={276}
      toolbar={
        <Toolbar
          start={
            <>
              <Brand name="Canvas" doc={doc.name} mark={<svg viewBox="0 0 16 16" width="11" height="11"><path d="M3 3h10v10H3z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 8h10" stroke="currentColor" strokeWidth="2" /></svg>} />
              <Menu trigger={<Button size="md" variant="ghost">File</Button>} items={[
                { label: 'New page', icon: FilePlus, onClick: S.addPage },
                { label: 'Download .json', icon: FileDown, onClick: A.downloadDocument },
                { type: 'separator' },
                { label: 'Export selection', icon: ImageDown, shortcut: 'shift+mod+e', onClick: A.exportSelection, disabled: !hasSel },
                { label: 'Export all frames', icon: ImageDown, onClick: A.exportFrames },
                { type: 'separator' },
                { label: 'Reset to demo file', icon: RefreshCw, onClick: () => S.resetDocument() },
              ]} />
            </>
          }
          end={
            <>
              <Cluster>
                <HistoryButtons history={S.history} />
                <Divider vertical />
                <ThemeToggle hotkey={false} />
                <IconButton icon={Play} label="Present" shortcut="alt+mod+enter" onClick={() => setPresenting(true)} />
              </Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: hasSel ? `${selection.length} selected` : 'Nothing selected' },
                  { label: 'Export selection', icon: ImageDown, shortcut: 'shift+mod+e', onClick: A.exportSelection, disabled: !hasSel },
                  { label: 'Copy CSS', icon: CodeXml, shortcut: 'alt+shift+c', onClick: A.copyCSS, disabled: !hasSel },
                  { type: 'separator' },
                  { label: 'Export all frames on page', icon: ImageDown, onClick: A.exportFrames },
                  { label: 'Download document (.json)', icon: FileDown, onClick: A.downloadDocument },
                ]} />
            </>
          }
        />
      }
      left={<Panel scroll={false}><LayersPanel /></Panel>}
      right={
        <Panel header={
          <PanelHeader>
            <PanelTabs value={tab} onChange={(t) => S.design.setState({ tab: t })} tabs={[{ value: 'design', label: 'Design' }, { value: 'prototype', label: 'Prototype' }]} />
            <Menu align="end" trigger={<Button size="sm" variant="ghost" className="tabular">{Math.round(zoom * 100)}%</Button>} items={[
              { label: 'Zoom to fit page', onClick: A.zoomToFitPage },
              { label: 'Zoom to selection', shortcut: 'shift+2', onClick: A.zoomToSelection, disabled: !hasSel },
              { label: 'Zoom in', shortcut: 'mod+=', onClick: () => A.zoomBy(2) },
              { label: 'Zoom out', shortcut: 'mod+-', onClick: () => A.zoomBy(0.5) },
              { label: 'Zoom to 100%', shortcut: 'shift+0', onClick: () => camera.zoomTo(1) },
            ]} />
          </PanelHeader>
        }>
          {tab === 'design' ? (hasSel ? <DesignPanel /> : <DocumentPanel />) : <PrototypePanel onPresent={() => setPresenting(true)} />}
        </Panel>
      }
    >
      <Canvas dock={
        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2" data-chrome onPointerDown={(e) => e.stopPropagation()}>
          <ToolDock value={tool} onChange={(t) => S.setTool(t)} tools={TOOLS} />
        </div>
      } />
      {!presenting && (
        <CommandPalette commands={commands} extraShortcuts={[
          // held modifiers and the stage's own keys are not dispatcher bindings
          { keys: 'alt', label: 'Hold to measure distances', group: 'Canvas' }, { keys: 'mod', label: 'Hold while clicking: select deepest', group: 'Canvas' },
          { keys: 'space', label: 'Hold to pan', group: 'Canvas' },
        ]} />
      )}
      {presenting && <Player onClose={() => setPresenting(false)} />}
    </Studio>
  )
}
