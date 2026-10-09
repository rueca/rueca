import { useRef } from 'react'
import {
  Download, Image as ImageIcon, Braces, FolderOpen, Sparkles, Heart, Trash2, Maximize2, Wand2, Columns2, Expand, ChevronLeft, ChevronRight,
  Plus, CornerUpLeft, Copy, PenLine, Rows3, BoxSelect, X, Settings2,
} from 'lucide-react'
import {
  Studio, Toolbar, Brand, Cluster, Button, Menu, ParamActions, CommandPalette, toast, type Command,
} from '@kit'
import { params } from './state/params'
import { gallery, useGallery, viewTitle, visible, step, select, toggleFavourite, byId, newSession } from './state/gallery'
import { ui } from './state/ui'
import { focusPrompt } from './state/ui'
import { cancelAll } from './state/queue'
import { generate, variations, upscale, remix, reusePrompt, reuseAll, copyParams, removeWithUndo, exportSelected, exportSession, importSession } from './state/actions'
import { Sidebar } from './ui/Sidebar'
import { Gallery } from './ui/Gallery'
import { Composer } from './ui/Composer'
import { RightPanel } from './ui/RightPanel'
import { Overlays } from './ui/Overlays'
import { QueueStatus } from './ui/QueueStatus'

const one = () => { const s = gallery.getState(); return s.selection.length ? byId(s.anchor ?? s.selection[0]) ?? byId(s.selection[0]) : undefined }
const need = (fn: (r: NonNullable<ReturnType<typeof byId>>) => void) => () => { const r = one(); if (r) fn(r); else toast('Select an image first') }

function compare() {
  const s = gallery.getState()
  if (s.selection.length !== 2) { toast('Select two images to compare', { description: '⌘-click or Shift-click a second image.' }); return }
  ui.setState({ overlay: { type: 'compare', a: s.selection[0], b: s.selection[1], mode: 'wipe' } })
}

export default function GenerateShell() {
  const title = useGallery((s) => viewTitle(s))
  const file = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    { id: 'gen', label: 'Generate', group: 'Create', shortcut: 'mod+enter', icon: Sparkles, run: generate },
    { id: 'focus', label: 'Focus prompt', group: 'Create', shortcut: '/', icon: PenLine, run: focusPrompt },
    { id: 'settings', label: 'Show generation settings', group: 'Create', icon: Settings2, run: () => ui.setState({ tab: 'create' }) },
    { id: 'cancel', label: 'Cancel all runs', group: 'Create', icon: X, run: cancelAll },
    { id: 'prev', label: 'Previous image', group: 'Browse', shortcut: 'arrowleft', icon: ChevronLeft, run: () => step(-1) },
    { id: 'next', label: 'Next image', group: 'Browse', shortcut: 'arrowright', icon: ChevronRight, run: () => step(1) },
    { id: 'look', label: 'Open / close viewer', group: 'Browse', shortcut: 'space', icon: Expand, run: () => { const s = ui.getState(); if (s.overlay) ui.setState({ overlay: null }); else if (one()) ui.setState({ overlay: { type: 'lightbox' } }) } },
    { id: 'esc', label: 'Close viewer / clear selection', group: 'Browse', shortcut: 'esc', run: () => { if (ui.getState().overlay) ui.setState({ overlay: null }); else select([]) } },
    { id: 'all', label: 'Select all in view', group: 'Browse', shortcut: 'mod+a', icon: BoxSelect, run: () => select(visible().map((i) => i.id)) },
    { id: 'group', label: 'Toggle grouping by prompt', group: 'Browse', shortcut: 'g', icon: Rows3, run: () => gallery.setState((s) => ({ groupBy: s.groupBy === 'prompt' ? 'none' : 'prompt' })) },
    { id: 'favs', label: 'Show favourites only', group: 'Browse', shortcut: 'shift+f', icon: Heart, run: () => gallery.setState((s) => ({ favOnly: !s.favOnly })) },
    { id: 'fav', label: 'Favourite', group: 'Image', shortcut: 'f', icon: Heart, run: () => { const s = gallery.getState(); if (s.selection.length) toggleFavourite(s.selection) } },
    { id: 'var', label: 'Variations', group: 'Image', shortcut: 'v', icon: Sparkles, run: need((r) => variations(r)) },
    { id: 'var-strong', label: 'Strong variations', group: 'Image', shortcut: 'shift+v', icon: Sparkles, run: need((r) => variations(r, 0.7)) },
    { id: 'up', label: 'Upscale 2×', group: 'Image', shortcut: 'u', icon: Maximize2, run: need(upscale) },
    { id: 'remix', label: 'Remix', group: 'Image', shortcut: 'r', icon: Wand2, run: need((r) => { ui.setState({ overlay: null }); remix(r) }) },
    { id: 'compare', label: 'Compare two images', group: 'Image', shortcut: 'c', icon: Columns2, run: compare },
    { id: 'reuse', label: 'Reuse prompt', group: 'Image', icon: CornerUpLeft, run: need(reusePrompt) },
    { id: 'reuse-all', label: 'Reuse all settings', group: 'Image', icon: Settings2, run: need((r) => reuseAll(r)) },
    { id: 'copy', label: 'Copy parameters', group: 'Image', icon: Copy, run: need(copyParams) },
    { id: 'del', label: 'Delete', group: 'Image', shortcut: 'backspace,delete', icon: Trash2, run: () => removeWithUndo(gallery.getState().selection) },
    { id: 'png', label: 'Export selected PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: () => void exportSelected() },
    { id: 'json', label: 'Export session JSON', group: 'Export', shortcut: 'shift+mod+e', icon: Braces, run: exportSession },
    { id: 'import', label: 'Import session JSON…', group: 'Export', shortcut: 'mod+o', icon: FolderOpen, run: () => file.current?.click() },
    { id: 'new', label: 'New session', group: 'Sessions', shortcut: 'n', icon: Plus, run: () => newSession() },
    ...gallery.getState().sessions.map((s) => ({ id: `s-${s.id}`, label: `Open session: ${s.name}`, group: 'Sessions', run: () => gallery.setState({ view: { type: 'session' as const, id: s.id }, activeSession: s.id, selection: [] }) })),
    ...params.getState().presets.map((p) => ({ id: `p-${p.name}`, label: `Settings preset: ${p.name}`, group: 'Presets', run: () => params.applyPreset(p.name) })),
  ]

  const mark = (
    <a href="#/" aria-label="All shells" className="contents">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 1.5l1.6 4.2 4.4.3-3.4 2.8 1.1 4.3L8 10.7l-3.7 2.4 1.1-4.3L2 6l4.4-.3z" /></svg>
    </a>
  )

  return (
    <Studio
      leftWidth={252}
      rightWidth={304}
      toolbar={
        <Toolbar
          start={<Brand name="Generate" doc={title} mark={mark} />}
          center={<QueueStatus />}
          end={
            <>
              <Cluster><ParamActions params={params} /></Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>}
                items={[
                  { type: 'label', label: 'Selection' },
                  { label: 'Selected images (PNG)', icon: ImageIcon, shortcut: 'mod+e', onClick: () => void exportSelected() },
                  { label: 'Copy parameters', icon: Copy, onClick: need(copyParams) },
                  { type: 'separator' },
                  { type: 'label', label: 'Session' },
                  { label: 'Session JSON', icon: Braces, shortcut: 'shift+mod+e', onClick: exportSession },
                  { label: 'Import session JSON…', icon: FolderOpen, shortcut: 'mod+o', onClick: () => file.current?.click() },
                ]} />
            </>
          }
        />
      }
      left={<Sidebar />}
      right={<RightPanel />}
    >
      <div className="relative h-full">
        <Gallery />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-field via-field/85 to-transparent px-4 pt-14 pb-1">
          <Composer />
        </div>
        <Overlays />
      </div>
      <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importSession(f); e.target.value = '' }} />
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: 'shift+click', label: 'Select a range' },
        { keys: 'mod+click', label: 'Add to selection' },
        { keys: '\\', label: 'A/B settings snapshot' },
      ]} />
    </Studio>
  )
}
